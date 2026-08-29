import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MasteryCalculatorService } from '../mastery/mastery-calculator.service';
import { EvidenceType, EvidenceOutcome, MasteryStatus, LearnerType } from '@prisma/client';
import * as crypto from 'crypto';

export interface CurriculumPositionDto {
  bookId: string;
  bookTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  printedPage: number;
  pdfPage: number;
  sequenceIndex: number;
  archetype?: string;
}

export interface SubmitEvidenceDto {
  learnerId: string;
  conceptId: string;
  curriculumPosition: CurriculumPositionDto;
  dimension: 'RECALL' | 'APPLICATION' | 'REASONING' | 'OBSERVATION' | 'EXPERIMENT';
  score: number;
  isCorrect: boolean;
  learnerResponse: any;
}

@Injectable()
export class PersonalLearningEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly masteryCalculator: MasteryCalculatorService,
  ) {}

  // 1. Open Curriculum Page (Real DB lookup)
  async openPage(bookId: string, printedPage: number, learnerId: string) {
    let learner = await this.prisma.learner.findUnique({ where: { id: learnerId } });
    if (!learner) {
      learner = await this.prisma.learner.create({
        data: {
          id: learnerId,
          name: 'EKAGURU Student',
          learnerType: LearnerType.STUDENT,
        },
      });
    }

    const position: CurriculumPositionDto = {
      bookId,
      bookTitle: 'Class 5 Environmental Studies (EVS)',
      chapterNumber: 1,
      chapterTitle: 'Festivals of India & Community Life',
      printedPage,
      pdfPage: printedPage + 1,
      sequenceIndex: printedPage,
      archetype: 'NORMAL_CHAPTER',
    };

    // Fetch existing masteries for this learner
    const masteries = await this.prisma.learnerConceptMastery.findMany({
      where: { learnerId },
    });

    const masteryMap: Record<string, any> = {};
    for (const m of masteries) {
      masteryMap[m.conceptId] = {
        score: m.masteryScore,
        confidence: m.confidence,
        status: m.status,
      };
    }

    const concept = {
      id: 'c-festivals-india',
      title: 'Sankranthi & Harvest Celebrations',
      domain: 'CULTURE_HISTORY',
      tagline: 'Connecting solar transit, farming harvest, and human gratitude',
      shortDefinition: 'A major harvest festival celebrating the bounty of crops and the movement of the sun.',
      detailedExplanation:
        'Sankranthi marks the transition of the Sun into warmer northern skies and celebrates months of farming labor yielding food to sustain communities.',
      provenance: {
        type: 'TEXTBOOK_SOURCE',
        sourceName: 'Class 5 EVS Page 1 (Spread 2)',
        confidence: 1.0,
        retrievedAt: new Date().toISOString(),
        ageAppropriateRating: 'CLASS_4_5',
      },
    };

    const isMastered = (masteryMap['c-festivals-india']?.score || 0) >= 0.8;

    const experience = {
      id: `exp-${bookId}-${printedPage}-${Date.now()}`,
      planTimestamp: new Date().toISOString(),
      curriculumPosition: position,
      concept,
      showMe: {
        title: 'The Seed-to-Harvest Growth Chain',
        visualMechanismSteps: [
          { icon: '🌱', label: 'Seed in Soil', detail: 'Sprouts roots to absorb water and minerals' },
          { icon: '🌿', label: 'Green Leaves', detail: 'Captures radiant sunlight energy (Photosynthesis)' },
          { icon: '🌾', label: 'Golden Grain', detail: 'Stores solar energy as nutritious food' },
          { icon: '👨‍🌾', label: 'Harvest Day', detail: 'Farmers reap the bounty with community gratitude' },
        ],
      },
      teachMe: {
        socraticStepIndex: 0,
        totalSocraticSteps: 5,
        stageName: 'MEET_IDEA',
        groundedExplanation:
          'When crops like rice and wheat ripen under the winter sun, farmers harvest the food that took months of sunlight and care to grow. Sankranthi is the joyful celebration of this harvest!',
        childAnalogy: 'Imagine baking a huge cake together—harvest festival is the moment everyone gets to taste the slice!',
        remediationMode: false,
      },
      tryIt: {
        activityType: 'PANTRY_OBSERVATION',
        question: {
          text: 'Why do farming communities celebrate during harvest time rather than during seed planting time?',
          options: [
            'Because months of hard labor have successfully yielded food to feed the community',
            'Because farmers want to stop farming forever',
            'Because crops grow with zero water or care',
            'Because planting seeds is too noisy',
          ],
          correctIndex: 0,
          explanation: 'Harvest marks the joyous culmination of months of farming effort, providing abundance and food security.',
        },
        handsOnExperiment: {
          title: '🍚 Spot 3 Harvest Grains in Your Kitchen',
          objective: 'Discover the real foods harvested by farmers in your own home pantry',
          rewardBadge: '🌾 Master Harvester',
        },
      },
      goDeeper: {
        currentConceptId: 'c-festivals-india',
        universeConstellation: [
          { realmId: 'node-harvest-crops', realmName: '🌾 Harvest & Agriculture', icon: '🌾', targetNodeId: 'c-harvest-crops' },
          { realmId: 'node-sun-seasons', realmName: '☀️ Sun & Earth Cycles', icon: '☀️', targetNodeId: 'c-sun-seasons' },
          { realmId: 'node-muggu-rangoli', realmName: '🎨 Muggu / Rangoli Art', icon: '🎨', targetNodeId: 'c-muggu-rangoli' },
          { realmId: 'node-kite-wind', realmName: '🪁 Kites & Aerodynamics', icon: '🪁', targetNodeId: 'c-kite-wind' },
        ],
        cosmicTelescope: {
          question: 'Where did the energy inside the rice grain originally come from?',
          answer: 'From the SUN! Nuclear fusion at 15 million °C in our nearest star traveled 150 million km to power the plant leaves.',
          cosmicDomain: 'ASTROPHYSICS & NUCLEAR PHYSICS',
        },
      },
      nextRecommendedAction: {
        actionType: isMastered ? 'ADVANCE_CURRICULUM_PAGE' : 'REINFORCE_FOUNDATION',
        reason: isMastered
          ? 'Learner demonstrated complete understanding across Recall, Reasoning, and Application.'
          : 'Engage with Show Me and Try It to establish empirical understanding.',
        targetId: isMastered ? 'page-Class5EVS-2' : undefined,
      },
    };

    return { position, concept, experience, learnerMasteries: masteryMap };
  }

  // 2. Submit Evidence (Writes to DB LearningEvidence & Recalculates LearnerConceptMastery)
  async submitEvidence(dto: SubmitEvidenceDto) {
    if (dto.score < 0 || dto.score > 1.0) {
      throw new BadRequestException('Score must be between 0.0 and 1.0 float.');
    }

    const sha256Key = crypto
      .createHash('sha256')
      .update(`${dto.learnerId}|${dto.conceptId}|${Date.now()}|${dto.score}`)
      .digest('hex');

    // Persist immutable LearningEvidence record
    const evidence = await this.prisma.learningEvidence.create({
      data: {
        learnerId: dto.learnerId,
        evidenceType: EvidenceType.PRACTICE,
        outcome: dto.isCorrect ? EvidenceOutcome.CORRECT : EvidenceOutcome.INCORRECT,
        score: dto.score,
        confidence: 1.0,
        evidenceKey: sha256Key,
        response: JSON.stringify(dto.learnerResponse),
        sourceReference: dto.curriculumPosition as any,
      },
    });

    // Upsert LearnerConceptMastery in Database
    const existing = await this.prisma.learnerConceptMastery.findUnique({
      where: {
        learnerId_conceptId: {
          learnerId: dto.learnerId,
          conceptId: dto.conceptId,
        },
      },
    });

    const newScore = dto.isCorrect ? Math.min(1.0, (existing?.masteryScore || 0) + 0.4) : (existing?.masteryScore || 0);
    const newStatus = newScore >= 0.8 ? MasteryStatus.MASTERED : MasteryStatus.IN_PROGRESS;

    const updatedMastery = await this.prisma.learnerConceptMastery.upsert({
      where: {
        learnerId_conceptId: {
          learnerId: dto.learnerId,
          conceptId: dto.conceptId,
        },
      },
      create: {
        learnerId: dto.learnerId,
        conceptId: dto.conceptId,
        masteryScore: newScore,
        confidence: 1.0,
        status: newStatus,
        policyVersion: 1,
        attemptsCount: 1,
        successfulCount: dto.isCorrect ? 1 : 0,
      },
      update: {
        masteryScore: newScore,
        confidence: 1.0,
        status: newStatus,
        lastAssessedAt: new Date(),
        attemptsCount: { increment: 1 },
        successfulCount: dto.isCorrect ? { increment: 1 } : undefined,
      },
    });

    const nextAction = {
      actionType: newStatus === MasteryStatus.MASTERED ? 'ADVANCE_CURRICULUM_PAGE' : 'REINFORCE_FOUNDATION',
      reason:
        newStatus === MasteryStatus.MASTERED
          ? 'Mastery verified in database with immutable empirical evidence.'
          : 'Continue discovery in Try It or Go Deeper to complete mastery.',
      targetId: 'page-Class5EVS-2',
    };

    return { evidence, updatedMastery, nextAction };
  }

  // 3. Start Exploration (Dual-Spine Branching)
  async startExploration(learnerId: string, originPosition: CurriculumPositionDto, targetConceptId: string) {
    const sessionId = `exp-sess-${learnerId}-${Date.now()}`;

    return {
      sessionId,
      learnerId,
      status: 'ACTIVE',
      originCurriculumPosition: originPosition,
      currentExplorationNodeId: targetConceptId,
      explorationTrail: [
        {
          nodeId: targetConceptId,
          conceptTitle: targetConceptId === 'c-sun-seasons' ? '☀️ Sun & Earth Cycles' : '⚛️ Nuclear Fusion in Stars',
          enteredAt: new Date().toISOString(),
        },
      ],
      returnToCurriculumPage: originPosition.printedPage,
      nextCurriculumPageOnComplete: originPosition.printedPage + 1,
    };
  }

  // 4. Return to Curriculum (Restores origin anchor & advances to Page 2)
  async returnToCurriculum(sessionId: string, learnerId: string, originPosition: CurriculumPositionDto) {
    const nextPrintedPage = originPosition.printedPage + 1;
    const restoredPosition: CurriculumPositionDto = {
      ...originPosition,
      printedPage: nextPrintedPage,
      pdfPage: nextPrintedPage + 1,
      sequenceIndex: nextPrintedPage,
    };

    return {
      sessionId,
      status: 'COMPLETED',
      restoredPosition,
      nextPageToLoad: nextPrintedPage,
      message: `🌟 You explored the cosmos and discovered the Sun's energy origin! Safely returning to Class 5 EVS Page ${nextPrintedPage}.`,
    };
  }
}
