import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../learning-library/prisma.service';
import { LearnerType } from '@prisma/client';

export interface OnboardLearnerDto {
  name: string;
  age: number;
  dateOfBirth?: string;
  preferredLanguage?: string;
}

export interface UpdateLearnerDto {
  name?: string;
  preferredLanguage?: string;
}

@Injectable()
export class ParentService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(parentId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      throw new NotFoundException(`Parent with ID '${parentId}' not found.`);
    }
    return {
      data: {
        id: parent.id,
        email: parent.email,
        name: parent.name,
        consentGiven: parent.consentGiven,
      },
    };
  }

  async getLearners(parentId: string) {
    const children = await this.prisma.child.findMany({
      where: { parentId },
      include: {
        learner: {
          include: {
            curriculumEnrollments: {
              where: { active: true },
              include: { structure: true },
            },
          },
        },
      },
    });

    return {
      data: children.map((c) => {
        const learner = c.learner;
        return {
          id: learner?.id || '',
          name: learner?.name || c.name,
          learnerType: learner?.learnerType || 'CHILD',
          curriculumEnrollments:
            learner?.curriculumEnrollments.map((e) => ({
              active: e.active,
              structure: { version: e.structure.version },
            })) || [],
        };
      }),
    };
  }

  async onboardLearner(parentId: string, dto: OnboardLearnerDto) {
    // Validate parent exists
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      throw new NotFoundException(`Parent with ID '${parentId}' not found.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create legacy child profile (without ChildProgress)
      const child = await tx.child.create({
        data: {
          parentId,
          name: dto.name,
          age: dto.age,
        },
      });

      // 2. Create V2 Learner linked to Child
      const dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
      const learner = await tx.learner.create({
        data: {
          legacyChildId: child.id,
          name: dto.name,
          learnerType: LearnerType.CHILD,
          preferredLanguage: dto.preferredLanguage || 'en',
          dateOfBirth,
        },
      });

      return { data: learner };
    });
  }

  async updateLearner(learnerId: string, dto: UpdateLearnerDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update V2 Learner
      const learner = await tx.learner.update({
        where: { id: learnerId },
        data: {
          name: dto.name,
          preferredLanguage: dto.preferredLanguage,
        },
      });

      // 2. Sync name change to legacy Child model
      if (dto.name && learner.legacyChildId) {
        await tx.child.update({
          where: { id: learner.legacyChildId },
          data: { name: dto.name },
        });
      }

      return { data: learner };
    });
  }

  async enrollLearner(learnerId: string, structureVersion: number) {
    const structure = await this.prisma.curriculumStructure.findUnique({
      where: { version: structureVersion },
    });
    if (!structure) {
      throw new NotFoundException(`Curriculum structure version ${structureVersion} not found.`);
    }

    if (structure.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Cannot enroll learner in curriculum version ${structureVersion} with status '${structure.status}'. Only PUBLISHED versions allowed.`,
      );
    }

    // 1. Reject if active session exists
    const activeSession = await this.prisma.learningSession.findFirst({
      where: { learnerId, status: 'ACTIVE' },
    });
    if (activeSession) {
      throw new ConflictException(
        `Cannot change enrollment curriculum version. Learner has an active learning session (ID: ${activeSession.id}). Complete or abandon the active session first.`,
      );
    }

    // 2. Auto-abandon ready session if exists
    const readySession = await this.prisma.learningSession.findFirst({
      where: { learnerId, status: 'READY' },
    });
    if (readySession) {
      await this.prisma.learningSession.update({
        where: { id: readySession.id },
        data: { status: 'ABANDONED', sessionRequestFingerprint: null },
      });
    }

    // 3. Atomically switch active enrollment
    return this.prisma.$transaction(async (tx) => {
      await tx.learnerCurriculumEnrollment.updateMany({
        where: { learnerId },
        data: { active: false },
      });

      const enrollment = await tx.learnerCurriculumEnrollment.upsert({
        where: { learnerId_structureId: { learnerId, structureId: structure.id } },
        create: {
          learnerId,
          structureId: structure.id,
          active: true,
        },
        update: {
          active: true,
          enrolledAt: new Date(),
        },
      });

      return { data: enrollment };
    });
  }

  async getAnalytics(learnerId: string) {
    // 1. Frontier Nodes
    const frontiers = await this.prisma.learnerCurriculumFrontier.findMany({
      where: { learnerId },
      include: {
        currentNode: {
          include: { concept: true },
        },
      },
    });
    const frontier = frontiers.map((f) => ({
      conceptId: f.currentNode.concept.id,
      canonicalName: f.currentNode.concept.canonicalName,
    }));

    // 2. Mastery Counts
    const masteries = await this.prisma.learnerConceptMastery.findMany({
      where: { learnerId },
    });
    const masteredCount = masteries.filter((m) => m.status === 'MASTERED').length;
    const inProgressCount = masteries.filter((m) => m.status === 'IN_PROGRESS').length;
    const needsReviewCount = masteries.filter((m) => m.status === 'NEEDS_REMEDIATION').length;

    // 3. Recent Activity (last 5 sessions)
    const recentSessions = await this.prisma.learningSession.findMany({
      where: { learnerId },
      orderBy: { plannedAt: 'desc' },
      take: 5,
      include: {
        targets: {
          include: {
            curriculumNode: {
              include: { concept: true },
            },
          },
        },
      },
    });
    const recentActivity = recentSessions.map((s) => {
      const conceptName =
        s.targets
          .map((t) => t.curriculumNode?.concept?.canonicalName)
          .filter(Boolean)
          .join(', ') || 'N/A';
      return {
        sessionId: s.id,
        conceptName,
        durationSeconds: s.actualDurationSeconds ?? 0,
        status: s.status,
        date: s.completedAt?.toISOString() || s.startedAt?.toISOString() || s.plannedAt.toISOString(),
      };
    });

    // 4. Attention Signals Calculation
    const attentionSignals: any[] = [];
    const now = new Date();

    // -- SIGNAL: ASSESSMENT_STALL (>=3 failed assessment responses for same objective in 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const failedResponses = await this.prisma.assessmentResponse.findMany({
      where: {
        passed: false,
        scoredAt: { gte: sevenDaysAgo },
        assessmentInstance: {
          learnerId,
        },
      },
      include: {
        assessmentInstance: {
          include: {
            assessmentSpecification: true,
          },
        },
      },
    });

    const objectiveFailCounts = new Map<string, number>();
    for (const resp of failedResponses) {
      const loId = resp.assessmentInstance.assessmentSpecification.learningObjectiveId;
      objectiveFailCounts.set(loId, (objectiveFailCounts.get(loId) || 0) + 1);
    }

    for (const [loId, count] of objectiveFailCounts.entries()) {
      if (count >= 3) {
        const lo = await this.prisma.learningObjective.findUnique({
          where: { id: loId },
        });
        attentionSignals.push({
          type: 'ASSESSMENT_STALL',
          description: `Struggling on objective '${lo?.description || loId}': ${count} failed assessment attempts in the last 7 days.`,
          timestamp: now.toISOString(),
        });
      }
    }

    // -- SIGNAL: SESSION_STUCK (ACTIVE or PAUSED session older than 48 hours without progress)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const activePausedSessions = await this.prisma.learningSession.findMany({
      where: {
        learnerId,
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
      include: {
        steps: {
          select: { completedAt: true },
        },
      },
    });

    for (const session of activePausedSessions) {
      const times: Date[] = [];
      if (session.startedAt) times.push(session.startedAt);
      if (session.pausedAt) times.push(session.pausedAt);
      for (const step of session.steps) {
        if (step.completedAt) times.push(step.completedAt);
      }

      const responsesForSession = await this.prisma.assessmentResponse.findMany({
        where: {
          assessmentInstance: {
            sessionStep: {
              sessionId: session.id,
            },
          },
        },
        select: { scoredAt: true },
      });
      for (const resp of responsesForSession) {
        times.push(resp.scoredAt);
      }

      const maxTime =
        times.length > 0
          ? new Date(Math.max(...times.map((t) => t.getTime())))
          : session.plannedAt;
      if (maxTime < fortyEightHoursAgo) {
        attentionSignals.push({
          type: 'SESSION_STUCK',
          description: `Session '${session.id}' has been active/paused for over 48 hours without progress.`,
          timestamp: now.toISOString(),
        });
      }
    }

    // -- SIGNAL: INACTIVITY (no sessions started or completed in last 7 days)
    const lastSession = await this.prisma.learningSession.findFirst({
      where: { learnerId },
      orderBy: { plannedAt: 'desc' },
    });

    if (lastSession) {
      const times: Date[] = [];
      if (lastSession.startedAt) times.push(lastSession.startedAt);
      if (lastSession.completedAt) times.push(lastSession.completedAt);
      const maxTime =
        times.length > 0
          ? new Date(Math.max(...times.map((t) => t.getTime())))
          : lastSession.plannedAt;
      if (maxTime < sevenDaysAgo) {
        attentionSignals.push({
          type: 'INACTIVITY',
          description: `No study session has been started or completed for this learner in the last 7 days.`,
          timestamp: now.toISOString(),
        });
      }
    } else {
      attentionSignals.push({
        type: 'INACTIVITY',
        description: `No study session has been planned or started for this learner yet.`,
        timestamp: now.toISOString(),
      });
    }

    // Resolve authoritative decay parameters from MasteryPolicy
    let policy = await this.prisma.masteryPolicy.findFirst({
      orderBy: { version: 'desc' },
    });
    if (!policy) {
      policy = {
        decayLambda: 0.001,
        remediationThreshold: 0.50,
      } as any;
    }

    // -- SIGNAL: DECAY_WARNING (re-evaluate decay policy; flag if decay score < remediationThreshold)
    const decayLambda = policy.decayLambda;
    const remediationThreshold = policy.remediationThreshold;

    const masteriesList = await this.prisma.learnerConceptMastery.findMany({
      where: { learnerId },
      include: { concept: true },
    });

    for (const mastery of masteriesList) {
      if (mastery.lastAssessedAt && mastery.masteryScore > 0) {
        const deltaHours =
          (now.getTime() - mastery.lastAssessedAt.getTime()) / (1000 * 60 * 60);
        const decayedScore =
          mastery.masteryScore * Math.exp(-decayLambda * deltaHours);
        if (decayedScore < remediationThreshold && mastery.masteryScore >= remediationThreshold) {
          attentionSignals.push({
            type: 'DECAY_WARNING',
            description: `Mastery of concept '${mastery.concept.canonicalName}' has decayed below 50% due to time elapsed.`,
            timestamp: now.toISOString(),
          });
        }
      }
    }

    return {
      data: {
        frontier,
        mastery: {
          masteredCount,
          inProgressCount,
          needsReviewCount,
        },
        recentActivity,
        attentionSignals,
      },
    };
  }

  async getNotifications(parentId: string, take: number = 20, skip: number = 0) {
    const total = await this.prisma.notification.count({
      where: { parentId, deliveryType: 'IN_APP' },
    });

    const notifications = await this.prisma.notification.findMany({
      where: { parentId, deliveryType: 'IN_APP' },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    const eventIds = notifications.map((n) => n.eventId);
    const events = await this.prisma.notificationEvent.findMany({
      where: { id: { in: eventIds } },
    });

    const data = notifications.map((n) => {
      const event = events.find((e) => e.id === n.eventId);
      return {
        ...n,
        event,
      };
    });

    return {
      data,
      meta: {
        take,
        skip,
        total,
        hasMore: skip + take < total,
      },
    };
  }
}
