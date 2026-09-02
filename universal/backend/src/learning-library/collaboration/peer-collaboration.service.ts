import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { MultiTenantSchoolService } from '../tenancy/multi-tenant-school.service';
import { MultiTenantSecurityService, TenantContext } from '../tenancy/multi-tenant-security.service';
import { ConceptMasteryEngineService } from '../personalization/concept-mastery.service';
import { CanonicalEvidencePackService } from '../knowledge/canonical-evidence-pack.service';

export type ParticipantRole = 'EXPLORER' | 'ANALYST' | 'SCRIBE';
export type RoomStatus = 'ACTIVE' | 'SUBMITTED' | 'COMPLETED' | 'ARCHIVED';

export interface RoomParticipant {
  studentId: string;
  displayName: string;
  role: ParticipantRole;
  joinedAt: string;
}

export interface SharedEvidenceItem {
  evidenceId: string;
  physicalPage: number;
  bbox: { x: number; y: number; width: number; height: number };
  sourceTextSnippet: string;
  addedByStudentId: string;
  addedByRole: ParticipantRole;
  addedAt: string;
}

export interface SharedAnnotation {
  annotationId: string;
  evidenceId: string;
  text: string;
  creatorStudentId: string;
  creatorRole: ParticipantRole;
  isModerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroundedDiscussionMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole: ParticipantRole | 'TEACHER';
  text: string;
  citedEvidenceId?: string;
  timestamp: string;
}

export interface CollaborativeRoomRecord {
  roomId: string;
  districtId: string;
  schoolId: string;
  sectionId: string;
  bookId: string;
  chapterNumber: number;
  conceptId: string;
  conceptName: string;
  depth: string;
  physicalPage: number;
  taskChallengePrompt: string;
  status: RoomStatus;
  participants: Map<string, RoomParticipant>; // studentId -> Participant
  sharedEvidenceList: SharedEvidenceItem[];
  sharedAnnotations: SharedAnnotation[];
  discussionThread: GroundedDiscussionMessage[];
  groupConclusion?: string;
  createdAt: string;
  completedAt?: string;
}

@Injectable()
export class PeerCollaborationService {
  private readonly logger = new Logger(PeerCollaborationService.name);

  private rooms: Map<string, CollaborativeRoomRecord> = new Map();

  constructor(
    private readonly schoolService: MultiTenantSchoolService,
    private readonly securityService: MultiTenantSecurityService,
    private readonly masteryEngine: ConceptMasteryEngineService,
    private readonly evidencePackService: CanonicalEvidencePackService
  ) {}

  // 3.1 & 3.3 — Create Collaborative Learning Room bound to textbook concept
  public createRoom(
    context: TenantContext,
    sectionId: string,
    bookId: string,
    chapterNumber: number,
    conceptId: string,
    depth: string = 'developing',
    physicalPage: number = 2
  ): CollaborativeRoomRecord {
    this.securityService.validateSectionAccess(context, sectionId);

    const roomId = `collab-room-${sectionId}-${conceptId}-${Date.now()}`;
    const conceptNames: Record<string, string> = {
      C0101: 'Living Things',
      C0102: 'Growth Continuum',
      M0301: 'Area Calculation',
      S0101: 'Nutritional Energy',
    };
    const conceptName = conceptNames[conceptId] || 'Living Things';

    const room: CollaborativeRoomRecord = {
      roomId,
      districtId: context.districtId,
      schoolId: context.schoolId,
      sectionId,
      bookId,
      chapterNumber,
      conceptId,
      conceptName,
      depth,
      physicalPage,
      taskChallengePrompt: `Look at the Page ${physicalPage} textbook evidence. Find two examples of ${conceptName} and explain how growth helps us identify them.`,
      status: 'ACTIVE',
      participants: new Map(),
      sharedEvidenceList: [],
      sharedAnnotations: [],
      discussionThread: [],
      createdAt: new Date().toISOString(),
    };

    this.rooms.set(roomId, room);
    this.logger.log(`[COLLABORATION] Created room ${roomId} for concept ${conceptId} (Page ${physicalPage})`);
    return room;
  }

  // 3.2 — Participant Roles (Explorer, Analyst, Scribe)
  public joinRoom(
    context: TenantContext,
    roomId: string,
    role: ParticipantRole = 'EXPLORER'
  ): RoomParticipant {
    const room = this.getValidatedRoom(context, roomId);
    if (context.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can join as peer group participants');
    }

    const student = this.schoolService.getStudent(context.callerId);
    if (!student) throw new NotFoundException('Student profile not found');

    const participant: RoomParticipant = {
      studentId: context.callerId,
      displayName: student.displayName,
      role,
      joinedAt: new Date().toISOString(),
    };

    room.participants.set(context.callerId, participant);
    return participant;
  }

  // 3.4 — Shared Textbook Evidence (Bound to canonical EvidencePack)
  public addSharedEvidence(
    context: TenantContext,
    roomId: string,
    physicalPage: number,
    bbox: { x: number; y: number; width: number; height: number },
    sourceTextSnippet: string
  ): SharedEvidenceItem {
    const room = this.getValidatedRoom(context, roomId);
    const participant = room.participants.get(context.callerId);
    if (!participant) throw new ForbiddenException('Must join room before contributing evidence');

    // Grounding Invariant: Bounding box must have valid dimensions
    if (!bbox || bbox.width <= 0 || bbox.height <= 0) {
      throw new BadRequestException('Invalid physical scan bounding box coordinates');
    }

    const evidenceItem: SharedEvidenceItem = {
      evidenceId: `ev-${room.roomId}-${room.sharedEvidenceList.length + 1}`,
      physicalPage,
      bbox,
      sourceTextSnippet,
      addedByStudentId: context.callerId,
      addedByRole: participant.role,
      addedAt: new Date().toISOString(),
    };

    room.sharedEvidenceList.push(evidenceItem);
    return evidenceItem;
  }

  // 3.5 & 3.6 — Shared Annotations & Editing Permissions
  public addSharedAnnotation(
    context: TenantContext,
    roomId: string,
    evidenceId: string,
    text: string
  ): SharedAnnotation {
    const room = this.getValidatedRoom(context, roomId);
    const participant = room.participants.get(context.callerId);
    if (!participant) throw new ForbiddenException('Must be a room participant to annotate');

    const evidence = room.sharedEvidenceList.find((e) => e.evidenceId === evidenceId);
    if (!evidence) throw new NotFoundException(`Target evidence ${evidenceId} not found in room`);

    const annotation: SharedAnnotation = {
      annotationId: `ann-${Date.now()}-${room.sharedAnnotations.length + 1}`,
      evidenceId,
      text,
      creatorStudentId: context.callerId,
      creatorRole: participant.role,
      isModerated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    room.sharedAnnotations.push(annotation);
    return annotation;
  }

  public editAnnotation(
    context: TenantContext,
    roomId: string,
    annotationId: string,
    newText: string
  ): SharedAnnotation {
    const room = this.getValidatedRoom(context, roomId);
    const annotation = room.sharedAnnotations.find((a) => a.annotationId === annotationId);
    if (!annotation) throw new NotFoundException('Annotation not found');

    // Only original author can edit
    if (annotation.creatorStudentId !== context.callerId) {
      throw new ForbiddenException('Only the author can edit this annotation');
    }

    annotation.text = newText;
    annotation.updatedAt = new Date().toISOString();
    return annotation;
  }

  // 3.7 — Group Discussion
  public sendGroundedMessage(
    context: TenantContext,
    roomId: string,
    text: string,
    citedEvidenceId?: string
  ): GroundedDiscussionMessage {
    const room = this.getValidatedRoom(context, roomId);
    let senderName = 'Teacher';
    let senderRole: ParticipantRole | 'TEACHER' = 'TEACHER';

    if (context.role === 'STUDENT') {
      const participant = room.participants.get(context.callerId);
      if (!participant) throw new ForbiddenException('Must join room to participate in discussion');
      senderName = participant.displayName;
      senderRole = participant.role;
    }

    const message: GroundedDiscussionMessage = {
      messageId: `msg-${Date.now()}-${room.discussionThread.length + 1}`,
      senderId: context.callerId,
      senderName,
      senderRole,
      text,
      citedEvidenceId,
      timestamp: new Date().toISOString(),
    };

    room.discussionThread.push(message);
    return message;
  }

  // 3.9 & 3.10 — Room Completion & Personal BKT Mastery Integration
  public completeRoom(
    context: TenantContext,
    roomId: string,
    conclusionSummary: string,
    isCorrectUnderstanding: boolean = true
  ): { room: CollaborativeRoomRecord; masteryUpdatesCount: number } {
    const room = this.getValidatedRoom(context, roomId);
    room.status = 'COMPLETED';
    room.groupConclusion = conclusionSummary;
    room.completedAt = new Date().toISOString();

    let updatesCount = 0;
    // Feed back into M3.3 Bayesian Knowledge Tracing for each participant
    for (const [studentId, participant] of room.participants.entries()) {
      this.masteryEngine.updateConceptMastery(
        studentId,
        room.conceptId,
        room.conceptName,
        isCorrectUnderstanding
      );
      updatesCount++;
    }

    this.logger.log(
      `[COLLABORATION COMPLETE] Room ${roomId} completed. Updated BKT for ${updatesCount} students.`
    );
    return { room, masteryUpdatesCount: updatesCount };
  }

  // 3.8 & 3.11 — Teacher Observation & Snapshot Recovery
  public getRoomSnapshot(context: TenantContext, roomId: string): CollaborativeRoomRecord {
    return this.getValidatedRoom(context, roomId);
  }

  // Multi-Tenant Isolation Validator
  public getValidatedRoom(context: TenantContext, roomId: string): CollaborativeRoomRecord {
    const room = this.rooms.get(roomId);
    if (!room || room.schoolId !== context.schoolId || room.districtId !== context.districtId) {
      this.logger.warn(`[TENANT VIOLATION] Room '${roomId}' not found in school '${context.schoolId}'`);
      throw new NotFoundException(`Collaborative room '${roomId}' not found`);
    }
    return room;
  }
}
