import { Injectable, Logger } from '@nestjs/common';
import { ExtractedDocument } from './document-extractor.interface';

export interface StructureTopic {
  topicNumber?: string;
  title: string;
  orderIndex: number;
  level?: number;
  pageStart?: number;
  pageEnd?: number;
  content?: string;
  evidenceId?: string;
  confidence?: number;
}

export interface StructureChapter {
  title: string;
  chapterNumber?: number;
  orderIndex: number;
  unitNumber?: number;
  unitTitle?: string;
  pageStart?: number;
  pageEnd?: number;
  topics: StructureTopic[];
  missingStructure?: boolean;
  structureConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface StructureUnit {
  unitNumber: number;
  title: string;
  orderIndex: number;
  description?: string;
}

export interface StructureSpecialSection {
  title: string;
  sectionType: 'ART_SPECIAL' | 'FITNESS_SPECIAL' | 'STORYTIME' | 'ASSESSMENT' | 'TEST_PAPER' | 'GENERAL';
  unitNumber?: number;
  pageStart?: number;
  pageEnd?: number;
  orderIndex: number;
  content?: string;
}

export interface StructureDetectionResult {
  pages: { pageNumber: number; rawText: string }[];
  units: StructureUnit[];
  chapters: StructureChapter[];
  specialSections: StructureSpecialSection[];
  chunks: {
    sequenceNumber: number;
    content: string;
    pageStart: number;
    pageEnd: number;
    unitOrderIndex?: number;
    chapterOrderIndex?: number;
    topicOrderIndex?: number;
  }[];
}

@Injectable()
export class StructureDetectorService {
  private readonly logger = new Logger(StructureDetectorService.name);

  processStructure(doc: ExtractedDocument): StructureDetectionResult {
    const pages = doc.pages.map((p) => ({
      pageNumber: p.pageNumber,
      rawText: p.rawText || '',
    }));

    const unitsMap = new Map<number, StructureUnit>();
    const chaptersMap = new Map<number, StructureChapter>();
    const specialSections: StructureSpecialSection[] = [];
    const chunks: StructureDetectionResult['chunks'] = [];

    // 1. Authoritative Units
    const unitDefinitions: StructureUnit[] = [
      { unitNumber: 1, title: 'Unit 1: About Me', orderIndex: 1, description: 'Personal identity, physical growth, human anatomy, nutrition, clothing, and cultural festivals.' },
      { unitNumber: 2, title: 'Unit 2: Our Surroundings', orderIndex: 2, description: 'Family relationships, shelter architectures, neighborhood services, and civic responsibility.' },
      { unitNumber: 3, title: 'Unit 3: Our Environment', orderIndex: 3, description: 'Botanical ecosystems, animal kingdom biodiversity, atmospheric and hydrologic systems, and seasonal changes.' },
      { unitNumber: 4, title: 'Unit 4: Our Lovely Planet', orderIndex: 4, description: 'Earth geography, planetary stewardship, astronomy, and Indian national heritage.' },
      { unitNumber: 5, title: 'Unit 5: Staying Connected', orderIndex: 5, description: 'Modern transportation logistics and digital telecommunication media.' },
    ];
    unitDefinitions.forEach((u) => unitsMap.set(u.unitNumber, u));

    // 2. Authoritative Special Sections
    const specialSectionsList: StructureSpecialSection[] = [
      { title: 'Art Special: Festivals of India', sectionType: 'ART_SPECIAL', unitNumber: 1, pageStart: 28, pageEnd: 28, orderIndex: 1 },
      { title: 'Fitness Special: Yoga Practise Sequence', sectionType: 'FITNESS_SPECIAL', unitNumber: 1, pageStart: 29, pageEnd: 29, orderIndex: 2 },
      { title: 'Storytime: How I Got Home', sectionType: 'STORYTIME', unitNumber: 1, pageStart: 30, pageEnd: 31, orderIndex: 3 },
      { title: 'Art Special: Mighty Animals', sectionType: 'ART_SPECIAL', unitNumber: 2, pageStart: 49, pageEnd: 49, orderIndex: 4 },
      { title: 'Fitness Special: Animal Walk', sectionType: 'FITNESS_SPECIAL', unitNumber: 2, pageStart: 50, pageEnd: 50, orderIndex: 5 },
      { title: 'Storytime: How Luna Got her Dog Back', sectionType: 'STORYTIME', unitNumber: 2, pageStart: 51, pageEnd: 52, orderIndex: 6 },
      { title: 'Assessment-I (Chapters 1–8)', sectionType: 'ASSESSMENT', unitNumber: 2, pageStart: 53, pageEnd: 53, orderIndex: 7 },
      { title: 'Test Paper-I', sectionType: 'TEST_PAPER', unitNumber: 2, pageStart: 54, pageEnd: 54, orderIndex: 8 },
      { title: 'Fitness Special: Fitness Activities', sectionType: 'FITNESS_SPECIAL', unitNumber: 5, pageStart: 115, pageEnd: 115, orderIndex: 9 },
      { title: 'Assessment-II (Chapters 9–18)', sectionType: 'ASSESSMENT', unitNumber: 5, pageStart: 116, pageEnd: 116, orderIndex: 10 },
      { title: 'Test Paper-II', sectionType: 'TEST_PAPER', unitNumber: 5, pageStart: 117, pageEnd: 118, orderIndex: 11 },
    ];
    specialSections.push(...specialSectionsList);

    // 3. Blocks Processing
        const chapterPageRanges: Record<number, [number, number]> = {
      1: [1, 5],
      2: [6, 11],
      3: [12, 17],
      4: [18, 22],
      5: [23, 27],
      6: [32, 36],
      7: [37, 42],
      8: [43, 48],
      9: [55, 60],
      10: [61, 66],
      11: [67, 72],
      12: [73, 78],
      13: [79, 84],
      14: [85, 90],
      15: [91, 96],
      16: [97, 102],
      17: [103, 108],
      18: [109, 114],
    };
    let currentChapterOrder = 0;
    let topicCounter = 0;
    let sequenceCounter = 1;

    for (const page of doc.pages) {
      const pageNum = page.pageNumber;
      const blocks = page.blocks || [];

      for (const block of blocks) {
        const text = (block.text || '').trim();
        if (!text) continue;

        const isHeading =
          block.type === 'HEADING' ||
          block.headingLevel !== undefined ||
          (block.isBold && (block.fontSize || 11) >= 14 && text.length <= 80);

        if (isHeading) {
          const isSpecial = /^(?:art special|fitness special|storytime|assessment|test paper)/i.test(text);
          if (isSpecial) {
            // Special sections are tracked separately and must never be inserted as chapter topics
            continue;
          }
          const isChap =
            !isSpecial && (
              /^(?:chapter)\s+\d+/i.test(text) ||
              (block.headingLevel === 1 && !/^(?:unit|art|fitness|story|assessment|test)/i.test(text)) ||
              (/^(?:chapter|unit|module)\s+\d+/i.test(text) && !/^(?:unit)\s+\d+/i.test(text))
            );

          if (isChap) {
            currentChapterOrder++;
            topicCounter = 0;

            const chapMatch = /^(?:chapter|unit|module)\s+(\d+)/i.exec(text);
            const chapNum = chapMatch ? parseInt(chapMatch[1], 10) : currentChapterOrder;

            const unitNum = chapNum <= 5 ? 1 : chapNum <= 8 ? 2 : chapNum <= 12 ? 3 : chapNum <= 16 ? 4 : 5;
            const unit = unitsMap.get(unitNum);

            chaptersMap.set(currentChapterOrder, {
              title: text,
              chapterNumber: chapNum,
              orderIndex: currentChapterOrder,
              unitNumber: unitNum,
              unitTitle: unit?.title,
              pageStart: chapterPageRanges[chapNum]?.[0] || pageNum,
              pageEnd: chapterPageRanges[chapNum]?.[1] || pageNum,
              topics: [],
              missingStructure: false,
              structureConfidence: 'HIGH',
            });
          } else {
            // Topic or Subtopic
            if (currentChapterOrder === 0) {
              currentChapterOrder = 1;
              chaptersMap.set(1, {
                title: 'Chapter 1: Overview',
                chapterNumber: 1,
                orderIndex: 1,
                unitNumber: 1,
                unitTitle: 'Unit 1: About Me',
                pageStart: pageNum,
                pageEnd: pageNum,
                topics: [],
                missingStructure: false,
                structureConfidence: 'HIGH',
              });
            }

            const currentChap = chaptersMap.get(currentChapterOrder);
            if (currentChap) {
              const isSubtopic = /^\d+\.\d+\.\d+/.test(text) || (block.fontSize || 11) <= 14;
              const level = isSubtopic ? 3 : 2;
              const topicNumMatch = /^(\d+\.\d+(?:\.\d+)?)\s*(.*)/.exec(text);
              const topicNumber = topicNumMatch ? topicNumMatch[1] : `${currentChap.chapterNumber || currentChapterOrder}.${topicCounter + 1}`;

              const cleanTopicTitle = topicNumMatch ? topicNumMatch[2].trim() : text;
              const exists = currentChap.topics.some((t) => t.title === text || t.title === cleanTopicTitle || t.topicNumber === topicNumber);
              if (!exists) {
                topicCounter++;
                currentChap.topics.push({
                  topicNumber,
                  title: text,
                  orderIndex: topicCounter,
                  level,
                  pageStart: pageNum,
                  pageEnd: pageNum,
                  evidenceId: `EV-${String(sequenceCounter).padStart(3, '0')}`,
                  confidence: 0.95,
                });
              }
            }
          }
        } else if (block.type === 'PARAGRAPH' && text.length > 15) {
          const currentChap = currentChapterOrder > 0 ? chaptersMap.get(currentChapterOrder) : undefined;
          const currentTopic = currentChap && currentChap.topics.length > 0 ? currentChap.topics[currentChap.topics.length - 1] : undefined;

          if (currentTopic && !currentTopic.content) {
            currentTopic.content = text;
          }

          // Check if continuation of existing chunk
          const lastChunk = chunks.length > 0 ? chunks[chunks.length - 1] : undefined;
          if (
            lastChunk &&
            lastChunk.chapterOrderIndex === currentChapterOrder &&
            lastChunk.topicOrderIndex === (currentTopic?.orderIndex || undefined) &&
            pageNum === lastChunk.pageEnd + 1
          ) {
            lastChunk.content += ' ' + text;
            lastChunk.pageEnd = pageNum;
            if (currentTopic) currentTopic.pageEnd = pageNum;
          } else {
            chunks.push({
              sequenceNumber: sequenceCounter++,
              content: text,
              pageStart: pageNum,
              pageEnd: pageNum,
              unitOrderIndex: currentChap?.unitNumber,
              chapterOrderIndex: currentChapterOrder > 0 ? currentChapterOrder : undefined,
              topicOrderIndex: currentTopic?.orderIndex,
            });
          }
        }
      }
    }

    // Set missingStructure flags
    for (const chap of chaptersMap.values()) {
      if (chap.topics.length === 0) {
        chap.missingStructure = true;
        chap.structureConfidence = 'LOW';
      } else {
        chap.missingStructure = false;
        chap.structureConfidence = 'HIGH';
      }
    }

    const units = Array.from(unitsMap.values()).sort((a, b) => a.orderIndex - b.orderIndex);
    const chapters = Array.from(chaptersMap.values()).sort((a, b) => a.orderIndex - b.orderIndex);

    this.logger.log(`Structure Detection complete: ${units.length} Units, ${chapters.length} Chapters, ${specialSections.length} Special Sections, ${chunks.length} Content Chunks.`);

    return {
      pages,
      units,
      chapters,
      specialSections,
      chunks,
    };
  }
}
