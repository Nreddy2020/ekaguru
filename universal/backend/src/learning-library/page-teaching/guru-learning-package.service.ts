import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GuruBookMapService } from './guru-book-map.service';
import { GuruNotesService } from './guru-notes.service';
import { Depth } from './guru-plan.schema';
import {
  BookAudience,
  BlueprintId,
  blueprintForAudience,
  NotesTopic,
} from './guru-notes.schema';
import {
  MasterLearningPackage,
  PackageBookMetadata,
  PackageRoadmapChapter,
  PackageConceptMap,
  PackageChapterNotes,
  PackageExampleItem,
  PackageMistakeItem,
  PackageMemoryItem,
  PackageExerciseItem,
  PackageQuestionItem,
  PackageMockTest,
  PackageMockTestSection,
  PackageRevisionSheets,
  validateLearningPackage,
} from './guru-learning-package.schema';

export interface PackageBuildOptions {
  language?: string;
  depth?: Depth;
  audience?: BookAudience;
  forceRefreshMap?: boolean;
}

@Injectable()
export class GuruLearningPackageService {
  private readonly logger = new Logger(GuruLearningPackageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookMapService: GuruBookMapService,
    private readonly notesService: GuruNotesService,
  ) {}

  /**
   * Assembles a master comprehensive learning package for an entire book.
   * Compiles roadmap, concept DAG, multi-topic chapter notes, real-world examples,
   * mistake & misconception traps, memory mnemonics, hands-on labs, question bank,
   * balanced mock examination with scoring rubrics & answer keys, and one-page cheat sheets.
   */
  public async buildPackage(
    bookId: string,
    options: PackageBuildOptions = {},
  ): Promise<MasterLearningPackage> {
    const language = options.language || 'en';
    const depth: Depth = options.depth || 'basis';
    const audience: BookAudience = options.audience || 'child';
    const blueprint: BlueprintId = blueprintForAudience(audience);

    this.logger.log(
      `Building master learning package for book "${bookId}" (lang=${language}, depth=${depth}, audience=${audience}, blueprint=${blueprint})`,
    );

    // 1. Resolve Book metadata & total pages
    const { title, subject, grade, curriculum, totalPages } = await this.resolveBookMetadata(bookId);

    // 2. Fetch or build concept map & roadmap chapters
    const bookMap = await this.bookMapService.getOrBuildBookMap(bookId, options.forceRefreshMap);

    const roadmap: PackageRoadmapChapter[] = (bookMap.chapters || []).map((ch) => ({
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      pageRange: { from: ch.pageStart, to: ch.pageEnd },
      concepts: (ch.topics || []).map((t) => t.title),
      objectives: (ch.topics || []).map((t) => `Master the foundations and applications of ${t.title}`),
    }));

    const conceptMap: PackageConceptMap = {
      topics: (bookMap.chapters || []).flatMap((c) => c.topics || []),
      dependencies: bookMap.dependencies || [],
    };

    // 3. Query all ready page notes for this book & language
    let readyNotesRecords: any[] = [];
    try {
      readyNotesRecords = await this.prisma.guruPageNotes.findMany({
        where: {
          bookId,
          language,
          depth,
        },
        include: {
          extensions: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { physicalPage: 'asc' },
      });
    } catch (err) {
      this.logger.warn(`Could not query page notes from database: ${err}`);
    }

    // 4. Chapter Notes aggregation
    const chapterNotes: PackageChapterNotes[] = this.aggregateChapterNotes(
      roadmap,
      readyNotesRecords,
    );

    // 5. Extract multi-topic rich learning assets
    const examplesAndScenarios: PackageExampleItem[] = [];
    const mistakesAndTroubleshooting: PackageMistakeItem[] = [];
    const memoryTricks: PackageMemoryItem[] = [];
    const exercisesAndLabs: PackageExerciseItem[] = [];
    const easyQuestions: PackageQuestionItem[] = [];
    const mediumQuestions: PackageQuestionItem[] = [];
    const extendedQuestions: PackageQuestionItem[] = [];

    let qCounter = 1;

    for (const record of readyNotesRecords) {
      const page = record.physicalPage;
      const chNum = this.resolveChapterNumber(page, roadmap);
      const payload = (record.payload as any) || {};
      const notes = payload.notes || payload || {};
      const topics: NotesTopic[] = Array.isArray(notes.topics) ? notes.topics : [];

      for (const topic of topics) {
        const tHeading = topic.heading || `Page ${page} Topic`;

        // Everyday Example / Scenarios
        if ((topic as any).example) {
          const ex = (topic as any).example;
          examplesAndScenarios.push({
            chapterNumber: chNum,
            page,
            topic: tHeading,
            situation: ex.situation || 'Everyday application',
            explanation: ex.explanation || '',
          });
        }
        if (Array.isArray((topic as any).scenarios)) {
          for (const sc of (topic as any).scenarios) {
            examplesAndScenarios.push({
              chapterNumber: chNum,
              page,
              topic: tHeading,
              situation: sc.situation || sc.context || sc.title || '',
              explanation: sc.solution || sc.explanation || '',
              scenario: sc,
            });
          }
        }

        // Mistakes & Troubleshooting
        if (Array.isArray((topic as any).commonDoubts)) {
          for (const doubt of (topic as any).commonDoubts) {
            mistakesAndTroubleshooting.push({
              chapterNumber: chNum,
              page,
              topic: tHeading,
              questionOrSymptom: doubt.question,
              explanationOrFix: doubt.answer,
              kind: 'child_doubt',
            });
          }
        }
        if (Array.isArray((topic as any).troubleshooting)) {
          for (const tb of (topic as any).troubleshooting) {
            mistakesAndTroubleshooting.push({
              chapterNumber: chNum,
              page,
              topic: tHeading,
              questionOrSymptom: tb.symptom || tb.issue || '',
              explanationOrFix: tb.fix || tb.solution || '',
              kind: 'troubleshooting',
            });
          }
        }
        if (Array.isArray((topic as any).misconceptions)) {
          for (const mc of (topic as any).misconceptions) {
            mistakesAndTroubleshooting.push({
              chapterNumber: chNum,
              page,
              topic: tHeading,
              questionOrSymptom: mc.misconception || '',
              explanationOrFix: mc.reality || mc.clarification || '',
              kind: 'misconception',
            });
          }
        }

        // Memory Tricks & Mnemonics
        const tip = (topic as any).rememberTip || (topic as any).mnemonic || (topic as any).memoryHook;
        const facts: string[] = [];
        if ((topic as any).didYouKnow) facts.push((topic as any).didYouKnow);
        if (Array.isArray((topic as any).funFacts)) facts.push(...(topic as any).funFacts);

        if (tip || facts.length > 0 || (topic as any).pictureChain) {
          memoryTricks.push({
            chapterNumber: chNum,
            page,
            topic: tHeading,
            tip: tip || `Remember core concept: ${tHeading}`,
            facts,
            chain: (topic as any).pictureChain,
            bigIdea: topic.bigIdea,
          });
        }

        // Exercises & Hands-on Labs
        if ((topic as any).tryNow) {
          const tn = (topic as any).tryNow;
          exercisesAndLabs.push({
            chapterNumber: chNum,
            page,
            topic: tHeading,
            title: tn.title || `${tHeading} Experiment`,
            steps: Array.isArray(tn.steps) ? tn.steps : [tn.steps].filter(Boolean),
            verificationOrNotice: tn.whatToNotice || tn.verification || 'Notice key changes',
            kind: 'try_now',
          });
        }
        if (Array.isArray((topic as any).labs)) {
          for (const lab of (topic as any).labs) {
            exercisesAndLabs.push({
              chapterNumber: chNum,
              page,
              topic: tHeading,
              title: lab.title || `${tHeading} Lab`,
              steps: Array.isArray(lab.steps) ? lab.steps : [lab.steps].filter(Boolean),
              verificationOrNotice: lab.verification || lab.expectedOutcome || 'Observe outcome',
              kind: 'lab',
            });
          }
        }

        // Question Bank: Easy (Recall / Quiz)
        if (Array.isArray((topic as any).quiz)) {
          for (const q of (topic as any).quiz) {
            const correctOpt = Array.isArray(q.options) && typeof q.answerIndex === 'number'
              ? q.options[q.answerIndex]
              : (q.answer || 'Refer to explanation');
            easyQuestions.push({
              id: `q-easy-${qCounter++}`,
              chapterNumber: chNum,
              page,
              topic: tHeading,
              difficulty: 'easy',
              question: q.question,
              options: q.options,
              answer: correctOpt,
              rationale: q.why || 'Foundational concept definition',
              marks: 1,
            });
          }
        }

        // Question Bank: Medium (Conceptual Reasoning / Check Yourself)
        if (Array.isArray((topic as any).checkYourself)) {
          for (const cy of (topic as any).checkYourself) {
            mediumQuestions.push({
              id: `q-med-${qCounter++}`,
              chapterNumber: chNum,
              page,
              topic: tHeading,
              difficulty: 'medium',
              question: cy.question,
              answer: cy.answer,
              rationale: `Explains cause-and-effect for ${tHeading}`,
              marks: 3,
            });
          }
        }

        // Question Bank: Extended (Synthesis / Discussion / Extensions)
        if (Array.isArray((topic as any).discussionPrompts)) {
          for (const dp of (topic as any).discussionPrompts) {
            extendedQuestions.push({
              id: `q-ext-${qCounter++}`,
              chapterNumber: chNum,
              page,
              topic: tHeading,
              difficulty: 'extended',
              question: dp.prompt || dp.question || dp,
              answer: dp.guidance || `Synthesize principles of ${tHeading} with evidence-based reasoning.`,
              marks: 5,
            });
          }
        }
      }

      // Sourced Extensions from Learner Q&A
      if (Array.isArray(record.extensions)) {
        for (const ext of record.extensions) {
          extendedQuestions.push({
            id: `q-ext-${qCounter++}`,
            chapterNumber: chNum,
            page,
            topic: `Learner Extension (Page ${page})`,
            difficulty: 'extended',
            question: ext.question,
            answer: ext.answer,
            marks: 5,
          });
        }
      }
    }

    // Ensure Question Bank has non-empty entries even if page notes are minimalist
    if (easyQuestions.length === 0) {
      easyQuestions.push({
        id: `q-easy-${qCounter++}`,
        chapterNumber: 1,
        page: 1,
        topic: 'Foundational Concepts',
        difficulty: 'easy',
        question: `What is the primary theme explored in "${title}"?`,
        options: [subject, 'Unrelated topic A', 'Unrelated topic B', 'None of the above'],
        answer: subject,
        rationale: 'Core subject identification',
        marks: 1,
      });
    }
    if (mediumQuestions.length === 0) {
      mediumQuestions.push({
        id: `q-med-${qCounter++}`,
        chapterNumber: 1,
        page: 1,
        topic: 'Core Understanding',
        difficulty: 'medium',
        question: `Explain how the central principles of ${subject} connect across chapters.`,
        answer: `Foundational concepts build progressively across chapters to establish systematic competence.`,
        rationale: 'Synthesis of introductory concepts',
        marks: 3,
      });
    }
    if (extendedQuestions.length === 0) {
      extendedQuestions.push({
        id: `q-ext-${qCounter++}`,
        chapterNumber: 1,
        page: 1,
        topic: 'Critical Synthesis',
        difficulty: 'extended',
        question: `Propose a real-world project or experimental design illustrating ${subject}.`,
        answer: `Develop an evidence-based plan integrating observed phenomena, controls, and measurable outcomes.`,
        marks: 5,
      });
    }

    // 6. Build Balanced Mock Examination (Sections A, B, C with Rubrics & Model Answers)
    const mockTest = this.buildMockTest(
      title,
      easyQuestions,
      mediumQuestions,
      extendedQuestions,
    );

    // 7. Generate Revision Notes & Cheat Sheets
    const revisionSheets = this.buildRevisionSheets(
      title,
      subject,
      chapterNotes,
      memoryTricks,
      mistakesAndTroubleshooting,
    );

    const masterPackage: MasterLearningPackage = {
      metadata: {
        bookId,
        title,
        subject,
        grade,
        curriculum,
        targetAudience: audience,
        blueprint,
        language,
        depth,
        totalPages,
        readyPagesCount: readyNotesRecords.length,
        generatedAt: new Date().toISOString(),
      },
      roadmap,
      conceptMap,
      chapterNotes,
      examplesAndScenarios,
      mistakesAndTroubleshooting,
      memoryTricks,
      exercisesAndLabs,
      questionBank: {
        easy: easyQuestions,
        medium: mediumQuestions,
        extended: extendedQuestions,
      },
      mockTest,
      revisionSheets,
    };

    const validation = validateLearningPackage(masterPackage);
    if (!validation.valid) {
      this.logger.warn(
        `Generated MasterLearningPackage for "${bookId}" had validation warnings: ${validation.errors.join(', ')}`,
      );
    }

    return masterPackage;
  }

  /**
   * Resolves book metadata from database or default catalogs.
   */
  private async resolveBookMetadata(bookId: string): Promise<{
    title: string;
    subject: string;
    grade: string;
    curriculum?: string;
    totalPages: number;
  }> {
    if (bookId.includes('evs') || bookId === 'evs-class-5') {
      return {
        title: 'Our Living Environment',
        subject: 'Environmental Studies',
        grade: 'CLASS 5',
        curriculum: 'NCERT / CBSE',
        totalPages: 116,
      };
    }

    try {
      const material = await this.prisma.learningMaterial.findUnique({
        where: { id: bookId },
        include: { documents: true },
      });

      if (material) {
        const docPages = (material.documents || []).reduce(
          (max: number, d: any) => Math.max(max, d.pageCount || 0),
          0,
        );
        return {
          title: material.title,
          subject: material.subjectName || 'General Studies',
          grade: material.gradeLevel || 'General',
          totalPages: docPages > 0 ? docPages : 50,
        };
      }
    } catch (err) {
      this.logger.warn(`Could not query learning material from database: ${err}`);
    }

    return {
      title: bookId
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      subject: 'General Studies',
      grade: 'General',
      totalPages: 50,
    };
  }

  /**
   * Groups ready page notes into roadmap chapters.
   */
  private aggregateChapterNotes(
    roadmap: PackageRoadmapChapter[],
    records: any[],
  ): PackageChapterNotes[] {
    const chapters: PackageChapterNotes[] = [];

    for (const rCh of roadmap) {
      const pStart = rCh.pageRange.from;
      const pEnd = rCh.pageRange.to;

      const matchedRecords = records.filter(
        (rec) => rec.physicalPage >= pStart && rec.physicalPage <= pEnd,
      );

      chapters.push({
        chapterNumber: rCh.chapterNumber,
        chapterTitle: rCh.title,
        pageRange: rCh.pageRange,
        pages: matchedRecords.map((rec) => {
          const payload = rec.payload || {};
          const notes = payload.notes || payload;
          const topics = Array.isArray(notes.topics) ? notes.topics : [];
          return {
            physicalPage: rec.physicalPage,
            title: notes.title || `Page ${rec.physicalPage} Study Notes`,
            topics,
            summary: Array.isArray(notes.summary)
              ? notes.summary
              : [notes.hook || notes.bigIdea || `Key topics for page ${rec.physicalPage}`].filter(Boolean),
          };
        }),
      });
    }

    // Include any notes records outside the declared roadmap bounds as an additional chapter
    const assignedPages = new Set(
      chapters.flatMap((ch) => ch.pages.map((p) => p.physicalPage)),
    );
    const unassignedRecords = records.filter((r) => !assignedPages.has(r.physicalPage));

    if (unassignedRecords.length > 0) {
      const pages = unassignedRecords.map((r) => {
        const payload = r.payload || {};
        const notes = payload.notes || payload;
        return {
          physicalPage: r.physicalPage,
          title: notes.title || `Page ${r.physicalPage} Study Notes`,
          topics: Array.isArray(notes.topics) ? notes.topics : [],
          summary: Array.isArray(notes.summary)
            ? notes.summary
            : [notes.hook || notes.bigIdea || `Page ${r.physicalPage}`].filter(Boolean),
        };
      });

      const pMin = Math.min(...pages.map((p) => p.physicalPage));
      const pMax = Math.max(...pages.map((p) => p.physicalPage));

      chapters.push({
        chapterNumber: chapters.length + 1,
        chapterTitle: 'Supplementary Study Notes',
        pageRange: { from: pMin, to: pMax },
        pages,
      });
    }

    return chapters;
  }

  /**
   * Helper to map page number to chapter number.
   */
  private resolveChapterNumber(page: number, roadmap: PackageRoadmapChapter[]): number {
    for (const ch of roadmap) {
      if (page >= ch.pageRange.from && page <= ch.pageRange.to) {
        return ch.chapterNumber;
      }
    }
    return Math.max(1, Math.ceil(page / 10));
  }

  /**
   * Assembles a balanced summative mock test with Sections A, B, C, marking guides, and rubrics.
   */
  private buildMockTest(
    bookTitle: string,
    easyQuestions: PackageQuestionItem[],
    mediumQuestions: PackageQuestionItem[],
    extendedQuestions: PackageQuestionItem[],
  ): PackageMockTest {
    // Select subset for mock test (e.g., up to 5 easy, 3 medium, 2 extended)
    const secAQuestions = easyQuestions.slice(0, 5).map((q) => ({ ...q, marks: 1 }));
    const secBQuestions = mediumQuestions.slice(0, 4).map((q) => ({ ...q, marks: 3 }));
    const secCQuestions = extendedQuestions.slice(0, 2).map((q) => ({ ...q, marks: 5 }));

    const secATotal = secAQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const secBTotal = secBQuestions.reduce((sum, q) => sum + (q.marks || 3), 0);
    const secCTotal = secCQuestions.reduce((sum, q) => sum + (q.marks || 5), 0);
    const totalMarks = secATotal + secBTotal + secCTotal;

    const sections: PackageMockTestSection[] = [
      {
        sectionId: 'sec-a',
        name: 'Section A: Foundational Recall & Multiple Choice',
        instructions: 'Answer all questions. Choose the most appropriate option (1 mark each).',
        questions: secAQuestions,
        totalMarks: secATotal,
      },
      {
        sectionId: 'sec-b',
        name: 'Section B: Conceptual Reasoning & Short Answer',
        instructions: 'Answer in 2-4 sentences explaining cause, effect, or principles (3 marks each).',
        questions: secBQuestions,
        totalMarks: secBTotal,
      },
      {
        sectionId: 'sec-c',
        name: 'Section C: Extended Synthesis & Diagnostic Scenarios',
        instructions: 'Provide structured, in-depth analysis or experiment design (5 marks each).',
        questions: secCQuestions,
        totalMarks: secCTotal,
      },
    ];

    const answerKey = [...secAQuestions, ...secBQuestions, ...secCQuestions].map((q) => {
      let markingGuide = 'Award 1 mark for exact match.';
      if (q.marks === 3) {
        markingGuide = 'Award 2 marks for core causal explanation, 1 mark for relevant example/terminology.';
      } else if (q.marks === 5) {
        markingGuide = 'Award 2 marks for conceptual framework, 2 marks for detailed steps/analysis, 1 mark for synthesis.';
      }
      return {
        questionId: q.id,
        questionText: q.question,
        modelAnswer: q.answer,
        markingGuide,
      };
    });

    const rubric = [
      {
        criteria: 'Section A: Foundational Recall',
        marks: secATotal,
        description: 'Measures memory retention of core definitions, terminology, and immediate facts.',
      },
      {
        criteria: 'Section B: Conceptual Reasoning',
        marks: secBTotal,
        description: 'Measures understanding of why phenomena occur and the ability to articulate underlying mechanisms.',
      },
      {
        criteria: 'Section C: Synthesis & Diagnostic Application',
        marks: secCTotal,
        description: 'Measures multi-step problem solving, application to novel scenarios, and critical evaluation.',
      },
    ];

    return {
      title: `${bookTitle} — Master Summative Assessment`,
      totalMarks,
      timeBudgetMinutes: Math.max(30, Math.round(totalMarks * 2.5)),
      instructions: [
        'Attempt all questions across Sections A, B, and C.',
        'Manage your time according to the points allocated to each section.',
        'Write concise, grounded responses referencing core textbook concepts.',
      ],
      sections,
      rubric,
      answerKey,
    };
  }

  /**
   * Generates revision notes, memory digests, and a high-density one-page cheat sheet.
   */
  private buildRevisionSheets(
    bookTitle: string,
    subject: string,
    chapterNotes: PackageChapterNotes[],
    memoryTricks: PackageMemoryItem[],
    mistakes: PackageMistakeItem[],
  ): PackageRevisionSheets {
    const quickNotes = chapterNotes.map((ch) => {
      const lines: string[] = [];
      for (const page of ch.pages) {
        for (const topic of page.topics) {
          if (topic.bigIdea) lines.push(`${topic.heading}: ${topic.bigIdea}`);
          else if (Array.isArray(topic.keyPoints) && topic.keyPoints.length > 0) {
            lines.push(`${topic.heading}: ${topic.keyPoints[0]}`);
          }
        }
      }
      if (lines.length === 0) {
        lines.push(`Core exploration of ${ch.chapterTitle} concepts.`);
      }
      return {
        chapterNumber: ch.chapterNumber,
        title: ch.chapterTitle,
        lines: lines.slice(0, 5),
      };
    });

    const memoryDigest = chapterNotes.map((ch) => {
      const terms: { term: string; meaning: string }[] = [];
      const tips: string[] = [];

      for (const page of ch.pages) {
        for (const topic of page.topics) {
          if (Array.isArray((topic as any).keyTerms)) {
            for (const kt of (topic as any).keyTerms) {
              terms.push({ term: kt.term, meaning: kt.meaning });
            }
          }
        }
      }

      const matchedTricks = memoryTricks.filter((m) => m.chapterNumber === ch.chapterNumber);
      for (const mt of matchedTricks) {
        if (mt.tip) tips.push(mt.tip);
      }

      return {
        chapterNumber: ch.chapterNumber,
        terms: terms.slice(0, 5),
        tips: tips.slice(0, 3),
      };
    });

    const coreRules = [
      `Ground every observation in empirical evidence before forming conclusions.`,
      `Distinguish between prerequisites and dependent concepts when reviewing topics.`,
      `Verify terminology precisely rather than relying on colloquial synonyms.`,
    ];

    const examWarnings = mistakes.slice(0, 4).map((m) =>
      `Trap: ${m.questionOrSymptom} -> Fix: ${m.explanationOrFix}`,
    );
    if (examWarnings.length === 0) {
      examWarnings.push('Ensure balanced time allocation across all sections during summative exams.');
    }

    return {
      quickNotes,
      memoryDigest,
      onePageCheatSheet: {
        title: `Master Revision Sheet: ${bookTitle}`,
        summaryLines: [
          `Comprehensive synthesis of ${bookTitle} covering ${subject}.`,
          `Combines sequential progression across ${chapterNotes.length} major chapters.`,
          `Structured for rapid recall, conceptual mastery, and summative exam readiness.`,
        ],
        coreRules,
        examWarnings,
      },
    };
  }
}
