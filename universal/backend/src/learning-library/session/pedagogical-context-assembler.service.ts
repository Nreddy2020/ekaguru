import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BoundedContextMemory, VisualReference } from './tutor-turn.types';

@Injectable()
export class PedagogicalContextAssemblerService {
  private readonly logger = new Logger(PedagogicalContextAssemblerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * GATE 1: TRUTH GATE
   * Assembles Bounded Context Memory strictly from verified M2 Canonical Knowledge & M3 Learner State.
   * Vetoes / throws if no verified M2 source snippet exists for the concept.
   */
  async assembleContext(sessionId: string, conceptId: string): Promise<BoundedContextMemory> {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { learner: true },
    });
    if (!session) throw new NotFoundException("Session '" + sessionId + "' not found.");

    // 1. Read M2 Canonical Concept & Content Chunk (READ-ONLY)
    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
      include: {
        outgoing: {
          include: { target: { select: { id: true, canonicalName: true } } },
        },
        incoming: {
          include: { source: { select: { id: true, canonicalName: true } } },
        },
        sourceChunks: {
          include: { chunk: true },
          take: 1,
        },
      },
    });
    if (!concept) throw new NotFoundException("M2 Concept '" + conceptId + "' not found.");

    let sourceSnippet = '';
    let sourceChunkId = 'chunk-default';
    let pageIndex = 1;
    const visuals: VisualReference[] = [];

    const chunkLink = concept.sourceChunks?.[0]?.chunk;
    if (chunkLink) {
      sourceSnippet = chunkLink.content;
      sourceChunkId = chunkLink.id;
      pageIndex = chunkLink.pageStart;
    } else {
      if (!concept.definition) {
        throw new BadRequestException("TRUTH GATE VETO: Concept '" + concept.canonicalName + "' has no verified M2 source grounding.");
      }
      sourceSnippet = concept.definition;
      sourceChunkId = "concept-def-" + concept.id;
    }

    // 2. Read M3 Learner State (READ-ONLY)
    const mastery = await this.prisma.learnerConceptMastery.findUnique({
      where: { learnerId_conceptId: { learnerId: session.learnerId, conceptId } },
    });

    // 3. Read Active Misconceptions from recent incorrect evidence
    const recentEvidence = this.prisma.learningEvidence?.findMany
      ? await this.prisma.learningEvidence.findMany({
          where: { learnerId: session.learnerId, conceptId },
          orderBy: { observedAt: 'desc' },
          take: 5,
        })
      : [];

    const activeMisconceptions = recentEvidence
      .filter((e) => e.outcome === 'INCORRECT' && e.misconception)
      .map((e) => e.misconception!);

    // 4. Identify unmastered prerequisites
    const incomingPrereqIds = (concept.incoming || [])
      .filter((r: any) => r.relationshipType === 'PREREQUISITE')
      .map((r: any) => r.sourceConceptId);

    let unmasteredPrerequisites: string[] = [];
    if (incomingPrereqIds.length > 0) {
      const prereqMasteries = await this.prisma.learnerConceptMastery.findMany({
        where: { learnerId: session.learnerId, conceptId: { in: incomingPrereqIds } },
      });
      unmasteredPrerequisites = incomingPrereqIds.filter((pId: string) => {
        const pm = prereqMasteries.find((m) => m.conceptId === pId);
        return !pm || pm.masteryScore < 0.75;
      });
    }

    return {
      learnerId: session.learnerId,
      conceptId,
      canonicalName: concept.canonicalName,
      sourceSnippet,
      sourceChunkId,
      pageIndex,
      visuals,
      pKnowledge: mastery?.masteryScore || 0.20,
      pRetrieval: mastery ? 0.95 : 1.0,
      confidence: mastery?.confidence || 0.30,
      activeMisconceptions: Array.from(new Set(activeMisconceptions)),
      unmasteredPrerequisites,
      recentTurns: [],
    };
  }
}
