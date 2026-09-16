import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  BookKnowledgeMap,
  ChapterMapSummary,
  ConceptDependencyLink,
  KeyTermEntry,
  TopicDependencyView,
  TopicNode,
  queryTopicDependencies,
  validateBookKnowledgeMap,
} from './guru-book-map.schema';

export interface RevisitGuidance {
  currentPage: number;
  currentTopicTitle: string;
  hasPrerequisite: boolean;
  recommendedPage: number;
  prerequisiteTopicId?: string;
  prerequisiteTopicTitle?: string;
  reason: string;
}

@Injectable()
export class GuruBookMapService {
  private readonly logger = new Logger(GuruBookMapService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the existing BookKnowledgeMap or builds a new one from available page notes & chapters.
   */
  public async getOrBuildBookMap(
    bookId: string,
    forceRefresh = false
  ): Promise<BookKnowledgeMap> {
    if (!forceRefresh) {
      const existing = await this.prisma.guruBookMap.findUnique({
        where: { bookId },
      });
      if (existing && existing.payload) {
        return existing.payload as unknown as BookKnowledgeMap;
      }
    }

    const map = await this.synthesizeBookMap(bookId);
    const validation = validateBookKnowledgeMap(map);
    if (!validation.valid) {
      this.logger.warn(`Synthesized book map for ${bookId} had warnings: ${validation.errors.join(', ')}`);
    }

    await this.prisma.guruBookMap.upsert({
      where: { bookId },
      create: {
        bookId,
        version: map.version,
        title: map.title,
        totalPages: map.totalPages,
        payload: map as any,
      },
      update: {
        version: map.version,
        title: map.title,
        totalPages: map.totalPages,
        payload: map as any,
        updatedAt: new Date(),
      },
    });

    return map;
  }

  /**
   * Queries dependencies for a specific topic in the book.
   */
  public async getTopicDependencies(
    bookId: string,
    topicId: string
  ): Promise<TopicDependencyView> {
    const map = await this.getOrBuildBookMap(bookId);
    const result = queryTopicDependencies(map, topicId);
    if (!result) {
      throw new NotFoundException(`Topic "${topicId}" not found in book "${bookId}"`);
    }
    return result;
  }

  /**
   * Provides diagnostic revisit guidance when a learner struggles on a specific page/topic.
   */
  public async getRevisitGuidance(
    bookId: string,
    page: number,
    topicId?: string
  ): Promise<RevisitGuidance> {
    const map = await this.getOrBuildBookMap(bookId);

    // Find target topic on this page
    let targetTopic: TopicNode | undefined;
    for (const ch of map.chapters) {
      for (const t of ch.topics) {
        if (topicId && t.topicId === topicId) {
          targetTopic = t;
          break;
        } else if (!targetTopic && t.physicalPage === page) {
          targetTopic = t;
        }
      }
      if (targetTopic && topicId) break;
    }

    if (!targetTopic) {
      return {
        currentPage: page,
        currentTopicTitle: `Page ${page} Content`,
        hasPrerequisite: false,
        recommendedPage: Math.max(1, page - 1),
        reason: 'Review the immediate preceding page for context.',
      };
    }

    const depView = queryTopicDependencies(map, targetTopic.topicId);
    if (depView && depView.revisitRecommendation && depView.revisitRecommendation.page < page) {
      return {
        currentPage: page,
        currentTopicTitle: targetTopic.title,
        hasPrerequisite: true,
        recommendedPage: depView.revisitRecommendation.page,
        prerequisiteTopicId: depView.revisitRecommendation.topicId,
        prerequisiteTopicTitle: depView.revisitRecommendation.topicTitle,
        reason: depView.revisitRecommendation.reason,
      };
    }

    // If no earlier prerequisite is registered, recommend previous page or self
    return {
      currentPage: page,
      currentTopicTitle: targetTopic.title,
      hasPrerequisite: false,
      recommendedPage: page,
      reason: 'This page introduces foundational concepts with no prior prerequisites in this book.',
    };
  }

  /**
   * Synthesizes chapters, topics, key terms, and dependency links from existing page notes & evidence.
   */
  private async synthesizeBookMap(bookId: string): Promise<BookKnowledgeMap> {
    // 1. Fetch available notes for this book
    const notesRecords = await this.prisma.guruPageNotes.findMany({
      where: { bookId },
      orderBy: { physicalPage: 'asc' },
    });

    const bookTitle = this.formatBookTitle(bookId);
    const totalPages = Math.max(
      ...notesRecords.map((n) => n.physicalPage),
      bookId.includes('evs') ? 116 : 50
    );

    const chaptersMap = new Map<number, ChapterMapSummary>();
    const keyTerms: KeyTermEntry[] = [];
    const dependencies: ConceptDependencyLink[] = [];
    const allTopics: TopicNode[] = [];

    // Helper to get or create chapter
    const getChapter = (chNum: number, title: string, pStart: number, pEnd: number) => {
      if (!chaptersMap.has(chNum)) {
        chaptersMap.set(chNum, {
          chapterNumber: chNum,
          title,
          pageStart: pStart,
          pageEnd: pEnd,
          topics: [],
        });
      }
      return chaptersMap.get(chNum)!;
    };

    // If we have real notes records, extract topics & terms
    if (notesRecords.length > 0) {
      for (const record of notesRecords) {
        const payload: any = record.payload || {};
        const chNum = Math.max(1, Math.ceil(record.physicalPage / 10));
        const chTitle = this.resolveChapterTitle(bookId, chNum, record.physicalPage);
        const chapter = getChapter(chNum, chTitle, (chNum - 1) * 10 + 1, chNum * 10);

        if (Array.isArray(payload.topics)) {
          for (let tIdx = 0; tIdx < payload.topics.length; tIdx++) {
            const rawT = payload.topics[tIdx];
            const topicId = rawT.id || `topic-p${record.physicalPage}-${tIdx + 1}`;
            const title = rawT.heading || rawT.title || `Topic ${tIdx + 1} (Page ${record.physicalPage})`;
            const summary = rawT.bigIdea || (Array.isArray(rawT.keyPoints) ? rawT.keyPoints[0] : '') || '';
            const terms: string[] = [];

            if (Array.isArray(rawT.wordsToKnow)) {
              for (const w of rawT.wordsToKnow) {
                if (w && w.word) {
                  terms.push(w.word);
                  keyTerms.push({
                    term: w.word,
                    definition: w.meaning || '',
                    introducedOnPage: record.physicalPage,
                    page: record.physicalPage,
                    chapterNumber: chNum,
                  });
                }
              }
            }

            const topicNode: TopicNode = {
              topicId,
              title,
              physicalPage: record.physicalPage,
              summary,
              keyTerms: terms,
            };

            chapter.topics.push(topicNode);
            allTopics.push(topicNode);
          }
        }
      }
    }

    // Ensure built-in foundational pages have structured topics even if notes are still queueing
    if (allTopics.length === 0 || (bookId.includes('evs') && !allTopics.some((t) => t.physicalPage === 2))) {
      this.populateFoundationalTopics(bookId, chaptersMap, allTopics, keyTerms);
    }

    // 2. Synthesize sequential & concept dependency links
    // Sort all topics by page
    allTopics.sort((a, b) => a.physicalPage - b.physicalPage);

    for (let i = 0; i < allTopics.length; i++) {
      const current = allTopics[i];

      // Sequential progression link within same or nearby pages
      if (i > 0) {
        const prev = allTopics[i - 1];
        if (prev.physicalPage <= current.physicalPage && prev.topicId !== current.topicId) {
          dependencies.push({
            id: `dep-${prev.topicId}-${current.topicId}`,
            sourceTopicId: prev.topicId,
            sourceTopicTitle: prev.title,
            sourcePage: prev.physicalPage,
            targetTopicId: current.topicId,
            targetTopicTitle: current.title,
            targetPage: current.physicalPage,
            reason: `Foundational knowledge of "${prev.title}" on Page ${prev.physicalPage} supports understanding "${current.title}".`,
            strength: prev.physicalPage === current.physicalPage ? 'essential' : 'supporting',
          });
        }
      }
    }

    // Convert map to sorted chapters array
    const chapters = Array.from(chaptersMap.values()).sort((a, b) => a.chapterNumber - b.chapterNumber);

    return {
      version: 'book-map-v1',
      bookId,
      title: bookTitle,
      totalPages,
      chapters,
      keyTerms,
      dependencies,
      generatedAt: new Date().toISOString(),
    };
  }

  private formatBookTitle(bookId: string): string {
    if (bookId === 'evs-class-5') return 'Environmental Studies (Class 5)';
    if (bookId === 'maths-class-5') return 'Mathematics (Class 5)';
    if (bookId === 'science-class-6') return 'General Science (Class 6)';
    if (bookId === 'social-class-5') return 'Social Studies (Class 5)';
    return bookId
      .replace(/-/g, ' ')
      .replace(/\w/g, (c) => c.toUpperCase());
  }

  private resolveChapterTitle(bookId: string, chNum: number, page: number): string {
    if (bookId === 'evs-class-5') {
      if (page <= 10) return 'Chapter 1: Super Senses & Living Things';
      if (page <= 20) return 'Chapter 2: A Snake Charmer’s Story';
      if (page <= 30) return 'Chapter 3: From Tasting to Digesting';
      if (page <= 40) return 'Chapter 4: Mangoes Round the Year';
      if (page <= 55) return 'Chapter 5: Seeds and Seeds & Community Living';
      return `Chapter ${chNum}: Environmental Studies Unit ${chNum}`;
    }
    return `Chapter ${chNum}`;
  }

  private populateFoundationalTopics(
    bookId: string,
    chaptersMap: Map<number, ChapterMapSummary>,
    allTopics: TopicNode[],
    keyTerms: KeyTermEntry[]
  ) {
    if (bookId.includes('evs')) {
      const ch1: ChapterMapSummary = {
        chapterNumber: 1,
        title: 'Chapter 1: Super Senses & Living Things',
        pageStart: 1,
        pageEnd: 10,
        topics: [
          {
            topicId: 't-evs-p2-senses',
            title: 'How Animals Use Their Senses',
            physicalPage: 2,
            summary: 'Animals have incredible senses of smell, hearing, and vision to perceive their world.',
            keyTerms: ['Sense Organs', 'Smell Trail'],
          },
          {
            topicId: 't-evs-p3-growth',
            title: 'Stages of Living Growth',
            physicalPage: 3,
            summary: 'Living organisms develop sequentially from seeds to seedlings, young plants, and mature adults.',
            keyTerms: ['Seed Sprout', 'Germination'],
          },
        ],
      };
      chaptersMap.set(1, ch1);
      allTopics.push(...ch1.topics);

      const ch4: ChapterMapSummary = {
        chapterNumber: 4,
        title: 'Chapter 4: Community Services & Helpers',
        pageStart: 44,
        pageEnd: 55,
        topics: [
          {
            topicId: 't-evs-p46-services',
            title: 'Public Services in the Neighbourhood',
            physicalPage: 46,
            summary: 'Essential institutions including post offices, hospitals, fire stations, and police safeguard community life.',
            keyTerms: ['Public Services', 'Emergency Ambulance', 'Post Office'],
          },
        ],
      };
      chaptersMap.set(4, ch4);
      allTopics.push(...ch4.topics);

      keyTerms.push(
        {
          term: 'Sense Organs',
          definition: 'Organs like eyes, ears, and nose that detect stimuli in the environment.',
          introducedOnPage: 2,
          page: 2,
          chapterNumber: 1,
        },
        {
          term: 'Germination',
          definition: 'The emergence and development of a seedling from a dormant seed.',
          introducedOnPage: 3,
          page: 3,
          chapterNumber: 1,
        },
        {
          term: 'Public Services',
          definition: 'Institutions provided for the health, protection, and welfare of the community.',
          introducedOnPage: 46,
          page: 46,
          chapterNumber: 4,
        }
      );
    } else {
      const ch1: ChapterMapSummary = {
        chapterNumber: 1,
        title: 'Chapter 1: Core Fundamentals',
        pageStart: 1,
        pageEnd: 15,
        topics: [
          {
            topicId: `t-${bookId}-p1`,
            title: 'Foundational Introduction',
            physicalPage: 1,
            summary: 'Introduction to foundational topics and core principles.',
            keyTerms: ['Introduction'],
          },
        ],
      };
      chaptersMap.set(1, ch1);
      allTopics.push(...ch1.topics);
    }
  }
}
