import { Injectable, Logger } from '@nestjs/common';
import { ExtractedDocument, ExtractedBlock } from './document-extractor.interface';

export interface StructureDetectionResult {
  pages: { pageNumber: number; rawText: string }[];
  chapters: { title: string; chapterNumber?: number; orderIndex: number; topics: { title: string; orderIndex: number }[] }[];
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

    const chaptersMap = new Map<
      number,
      { title: string; chapterNumber?: number; orderIndex: number; topics: { title: string; orderIndex: number }[] }
    >();

    let currentChapterIndex: number | undefined;
    let currentTopicIndex: number | undefined;
    let chapterCounter = 0;
    let topicCounter = 0;

    // Collect all blocks across pages
    const allBlocks: ExtractedBlock[] = [];
    for (const page of doc.pages) {
      if (page.blocks && page.blocks.length > 0) {
        allBlocks.push(...page.blocks);
      }
    }

    // 1. Detect Chapters & Topics
    for (const block of allBlocks) {
      if (block.type === 'HEADING') {
        const text = block.text.trim();
        const isChapterPattern =
          /^(chapter|unit|module)\s+\d+/i.test(text) ||
          (block.headingLevel === 1 && /^section\s+\d+/i.test(text));
        const chapterNumStr = /^(chapter|unit|module|section)\s+(\d+)/i.exec(text)?.[2];
        const chapterNum = chapterNumStr ? parseInt(chapterNumStr, 10) : undefined;
        const headingLevel = block.headingLevel !== undefined ? block.headingLevel : (isChapterPattern ? 1 : 2);

        if (headingLevel === 1 || isChapterPattern) {
          chapterCounter++;
          topicCounter = 0;
          currentChapterIndex = chapterCounter;
          currentTopicIndex = undefined;

          chaptersMap.set(currentChapterIndex, {
            title: text,
            chapterNumber: chapterNum,
            orderIndex: currentChapterIndex,
            topics: [],
          });
        } else if (headingLevel >= 2 && currentChapterIndex !== undefined) {
          topicCounter++;
          currentTopicIndex = topicCounter;
          const chap = chaptersMap.get(currentChapterIndex);
          if (chap) {
            chap.topics.push({
              title: text,
              orderIndex: currentTopicIndex,
            });
          }
        }
      }
    }

    const chapters = Array.from(chaptersMap.values());

    // 2. Structure-First Chunking Engine
    const chunks: {
      sequenceNumber: number;
      content: string;
      pageStart: number;
      pageEnd: number;
      chapterOrderIndex?: number;
      topicOrderIndex?: number;
    }[] = [];

    let sequenceCounter = 1;
    let activeChapter: number | undefined = undefined;
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
      if (block.type === 'HEADING') {
        const text = block.text.trim();
        // Resolve active chapter/topic
        for (const [cIdx, cObj] of chaptersMap.entries()) {
          if (cObj.title === text) {
            activeChapter = cIdx;
            activeTopic = undefined;
            break;
          }
          for (const tObj of cObj.topics) {
            if (tObj.title === text) {
              activeChapter = cIdx;
              activeTopic = tObj.orderIndex;
              break;
            }
          }
        }

        // Heading structural boundary: flush current pending chunk
        flushChunk();
      }

      const blockLen = block.text.length;

      // If a single block exceeds targetMax (e.g. huge 1500 char paragraph), split with 100 char overlap
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

      // If adding this block exceeds targetMax, flush current pending chunk
      if (pendingLength + blockLen > targetMax && pendingLength >= targetMin) {
        flushChunk();
      }

      pendingChunkBlocks.push(block);
      pendingLength += blockLen;
    }

    flushChunk(); // Flush remaining

    this.logger.log(`StructureDetector processed ${doc.pages.length} pages into ${chapters.length} chapters and ${chunks.length} chunks.`);

    return {
      pages,
      chapters,
      chunks,
    };
  }

  private splitLargeBlock(text: string, maxLen: number, overlap: number): string[] {
    const pieces: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxLen;
      if (end < text.length) {
        // Try to break at paragraph or sentence boundary
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
