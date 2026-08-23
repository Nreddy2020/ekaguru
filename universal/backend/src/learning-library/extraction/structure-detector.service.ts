import { Injectable, Logger } from '@nestjs/common';
import { ExtractedDocument, ExtractedBlock } from './document-extractor.interface';

export interface StructureTopic {
  title: string;
  orderIndex: number;
  level?: number; // 2 = Topic / Section, 3 = Subtopic
  confidence?: number;
}

export interface StructureChapter {
  title: string;
  chapterNumber?: number;
  orderIndex: number;
  topics: StructureTopic[];
  missingStructure?: boolean;
  structureConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface StructureDetectionResult {
  pages: { pageNumber: number; rawText: string }[];
  chapters: StructureChapter[];
  chunks: {
    sequenceNumber: number;
    content: string;
    pageStart: number;
    pageEnd: number;
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

    // Collect all blocks across pages in deterministic order
    const allBlocks: ExtractedBlock[] = [];
    for (const page of doc.pages) {
      if (page.blocks && page.blocks.length > 0) {
        allBlocks.push(...page.blocks);
      }
    }

    // Baseline font size calculation
    const fontSizes = allBlocks.map((b) => b.fontSize || 11).filter((s) => s > 0);
    const medianFontSize = fontSizes.length > 0 ? this.calculateMedian(fontSizes) : 11;

    const chaptersMap = new Map<number, StructureChapter>();
    let chapterCounter = 0;
    let topicCounter = 0;
    let currentChapterIndex: number | undefined;

    // 1. Heading Candidate Scoring & Hierarchy Level Inference (Decoupled)
    for (const block of allBlocks) {
      const isCandidate = block.type === 'HEADING' || (block.type === 'PARAGRAPH' && block.text.length <= 80 && (block.isBold || block.fontSize! > medianFontSize));
      if (!isCandidate) continue;

      const text = block.text.trim();
      const headingConfidence = this.calculateHeadingScore(block, text, medianFontSize);

      if (headingConfidence >= 0.65) {
        const hierarchyLevel = this.inferHierarchyLevel(block, text, medianFontSize);

        if (hierarchyLevel === 1) {
          chapterCounter++;
          topicCounter = 0;
          currentChapterIndex = chapterCounter;

          const chapterNumStr = /^(?:chapter|unit|module|section)\s+(\d+)/i.exec(text)?.[1];
          const chapterNum = chapterNumStr ? parseInt(chapterNumStr, 10) : undefined;

          chaptersMap.set(currentChapterIndex, {
            title: text,
            chapterNumber: chapterNum,
            orderIndex: currentChapterIndex,
            topics: [],
            missingStructure: false,
            structureConfidence: headingConfidence >= 0.85 ? 'HIGH' : 'MEDIUM',
          });
        } else if (hierarchyLevel >= 2) {
          if (currentChapterIndex === undefined) {
            // First topic without an explicit chapter: create parent chapter container
            chapterCounter++;
            currentChapterIndex = chapterCounter;
            chaptersMap.set(currentChapterIndex, {
              title: doc.metadata.title ? `${doc.metadata.title} - Main Content` : 'Chapter 1',
              chapterNumber: 1,
              orderIndex: currentChapterIndex,
              topics: [],
              missingStructure: false,
              structureConfidence: 'MEDIUM',
            });
          }

          topicCounter++;
          const currentChap = chaptersMap.get(currentChapterIndex);
          if (currentChap) {
            currentChap.topics.push({
              title: text,
              orderIndex: topicCounter,
              level: hierarchyLevel,
              confidence: headingConfidence,
            });
          }
        }
      }
    }

    // If no chapters were detected at all, create a single root chapter container
    if (chaptersMap.size === 0 && allBlocks.length > 0) {
      chaptersMap.set(1, {
        title: doc.metadata.title || 'Chapter 1: Content',
        chapterNumber: 1,
        orderIndex: 1,
        topics: [],
        missingStructure: true,
        structureConfidence: 'LOW',
      });
    }

    // 2. Evaluate Missing Structure Invariant
    for (const chapter of chaptersMap.values()) {
      if (chapter.topics.length === 0) {
        chapter.missingStructure = true;
        if (chapter.structureConfidence !== 'LOW') {
          chapter.structureConfidence = 'LOW';
        }
      }
    }

    const chapters = Array.from(chaptersMap.values());

    // 3. Deterministic Ordering & Structure-First Chunking Engine
    const chunks: {
      sequenceNumber: number;
      content: string;
      pageStart: number;
      pageEnd: number;
      chapterOrderIndex?: number;
      topicOrderIndex?: number;
    }[] = [];

    let sequenceCounter = 1;
    let activeChapter: number | undefined = chapters.length > 0 ? chapters[0].orderIndex : undefined;
    let activeTopic: number | undefined = undefined;

    let pendingChunkBlocks: ExtractedBlock[] = [];
    let pendingLength = 0;

    const flushChunk = () => {
      if (pendingChunkBlocks.length === 0) return;

      const firstBlock = pendingChunkBlocks[0];
      const lastBlock = pendingChunkBlocks[pendingChunkBlocks.length - 1];
      const contentText = pendingChunkBlocks.map((b) => b.text).join('\n\n');

      chunks.push({
        sequenceNumber: sequenceCounter++,
        content: contentText,
        pageStart: firstBlock.pageNumber,
        pageEnd: lastBlock.pageNumber,
        chapterOrderIndex: activeChapter,
        topicOrderIndex: activeTopic,
      });

      pendingChunkBlocks = [];
      pendingLength = 0;
    };

    const targetMin = 400;
    const targetMax = 1000;

    for (const block of allBlocks) {
      const text = block.text.trim();

      // Check if this block matches any chapter/topic heading
      for (const [cIdx, cObj] of chaptersMap.entries()) {
        if (cObj.title === text) {
          activeChapter = cIdx;
          activeTopic = undefined;
          flushChunk();
          break;
        }
        for (const tObj of cObj.topics) {
          if (tObj.title === text) {
            activeChapter = cIdx;
            activeTopic = tObj.orderIndex;
            flushChunk();
            break;
          }
        }
      }

      if (block.type === 'HEADING') {
        flushChunk();
      }

      const blockLen = block.text.length;

      if (blockLen > targetMax) {
        flushChunk();
        const splitChunks = this.splitLargeBlock(block.text, targetMax, 100);
        for (const piece of splitChunks) {
          chunks.push({
            sequenceNumber: sequenceCounter++,
            content: piece,
            pageStart: block.pageNumber,
            pageEnd: block.pageNumber,
            chapterOrderIndex: activeChapter,
            topicOrderIndex: activeTopic,
          });
        }
        continue;
      }

      if (pendingLength + blockLen > targetMax && pendingLength >= targetMin) {
        flushChunk();
      }

      pendingChunkBlocks.push(block);
      pendingLength += blockLen;
    }

    flushChunk();

    this.logger.log(`StructureDetector processed ${doc.pages.length} pages into ${chapters.length} chapters and ${chunks.length} chunks.`);

    return {
      pages,
      chapters,
      chunks,
    };
  }

  private calculateHeadingScore(block: ExtractedBlock, text: string, medianFont: number): number {
    let score = 0.0;

    // Font size relative to baseline
    const fontSize = block.fontSize || medianFont;
    if (fontSize >= medianFont * 1.5) score += 0.35;
    else if (fontSize > medianFont * 1.1) score += 0.20;

    // Weight / Style
    if (block.isBold) score += 0.25;

    // Numbering / Keyword pattern
    if (/^(?:chapter|unit|module|section)\s+\d+/i.test(text)) score += 0.35;
    else if (/^\d+\.\d+(\.\d+)?\s+[A-Z]/.test(text)) score += 0.30;
    else if (/^\d+\s+[A-Z]/.test(text)) score += 0.20;

    // Length constraint (Headings are typically concise)
    if (text.length <= 60 && !text.endsWith('.')) score += 0.15;

    return Math.min(1.0, score);
  }

  private inferHierarchyLevel(block: ExtractedBlock, text: string, medianFont: number): number {
    // 1. Explicit Chapter Patterns
    if (/^(?:chapter|unit|module)\s+\d+/i.test(text)) return 1;

    // 2. Subtopic numbering patterns (e.g. 1.1.1 or 2.3.4)
    if (/^\d+\.\d+\.\d+/.test(text)) return 3;

    // 3. Section/Topic numbering patterns (e.g. 1.1 or Section 2)
    if (/^\d+\.\d+\s+[A-Z]/.test(text) || /^section\s+\d+/i.test(text)) return 2;

    // 4. Standalone integer numbering with large font (e.g. "1 Introduction")
    if (/^\d+\s+[A-Z]/.test(text)) {
      return (block.fontSize || medianFont) >= medianFont * 1.4 ? 1 : 2;
    }

    // 5. Fallback relative font size
    const fontSize = block.fontSize || medianFont;
    if (fontSize >= medianFont * 1.6) return 1;
    if (fontSize >= medianFont * 1.2) return 2;
    return 3;
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private splitLargeBlock(text: string, maxLen: number, overlap: number): string[] {
    const pieces: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxLen;
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('. ', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        if (breakPoint > start + maxLen * 0.5) {
          end = breakPoint + 1;
        }
      } else {
        end = text.length;
      }

      pieces.push(text.slice(start, end).trim());
      if (end >= text.length) break;
      start = Math.max(start + 1, end - overlap);
    }

    return pieces;
  }
}

