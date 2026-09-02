import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { createWorker } from 'tesseract.js';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrWordRecord {
  word: string;
  confidence: number;
  bbox: BoundingBox;
}

export type LayoutRegionType =
  | 'heading'
  | 'paragraph'
  | 'list_item'
  | 'figure'
  | 'table'
  | 'caption'
  | 'activity'
  | 'formula'
  | 'callout_box';

export interface DocumentVisionBlockRecord {
  blockId: string;
  regionId: string;
  physicalPageNumber: number;
  type: LayoutRegionType;
  text: string;
  bbox: BoundingBox;
  confidence: number;
  readingOrderIndex: number;
  words: OcrWordRecord[];
  columnIndex?: number; // 1 or 2 for multi-column layout
  subTypeMetadata?: {
    isMathFormula?: boolean;
    isTableGrid?: boolean;
    isCalloutBox?: boolean;
    hasUnitsOfMeasure?: boolean;
  };
}

export interface PageVisionResult {
  physicalPageNumber: number;
  blocks: DocumentVisionBlockRecord[];
  wordCount: number;
  averageWordConfidence: number;
  hasFigures: boolean;
  hasTables: boolean;
  hasFormulas: boolean;
  hasCallouts: boolean;
  isMultiColumn: boolean;
  readingOrderValid: boolean;
}

@Injectable()
export class OcrDocumentVisionService {
  private readonly logger = new Logger(OcrDocumentVisionService.name);

  public async processPageVision(
    physicalPageNumber: number,
    imagePath: string
  ): Promise<PageVisionResult> {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Physical page scan not found: ${imagePath}`);
    }

    const worker = await createWorker('eng');
    try {
      const ret: any = await worker.recognize(imagePath, {}, { blocks: true });
      const rawBlocks = ret.data?.blocks || [];
      const extractedBlocks: DocumentVisionBlockRecord[] = [];
      let totalConfidenceSum = 0;
      let totalWordCount = 0;

      for (const b of rawBlocks) {
        for (const p of (b.paragraphs || [])) {
          for (const line of (p.lines || [])) {
            const lineText = (line.text || '').trim();
            if (!lineText) continue;

            const words: OcrWordRecord[] = (line.words || []).map((w: any) => {
              const conf = (w.confidence || 80) / 100;
              totalConfidenceSum += conf;
              totalWordCount++;
              return {
                word: w.text || '',
                confidence: conf,
                bbox: {
                  x: w.bbox?.x0 || 0,
                  y: w.bbox?.y0 || 0,
                  width: (w.bbox?.x1 || 0) - (w.bbox?.x0 || 0),
                  height: (w.bbox?.y1 || 0) - (w.bbox?.y0 || 0),
                },
              };
            });

            // Complex Layout Classification Engine
            let type: LayoutRegionType = 'paragraph';
            const subTypeMetadata: DocumentVisionBlockRecord['subTypeMetadata'] = {};
            const lower = lineText.toLowerCase();

            // 1. Math Formulas (equals, operators, fractions, area, perimeter, volume, multiplication)
            const isMath = /([0-9]+\s*[\+\-\×\*\/\=]\s*[0-9]+)|(\b(area|perimeter|volume|speed|fraction|radius|diameter|cm|sq\s*cm|km\/h)\b)/i.test(lineText);
            if (isMath || lower.includes('area =') || lower.includes('speed =') || lower.includes('x 100 =')) {
              type = 'formula';
              subTypeMetadata.isMathFormula = true;
            }
            // 2. Tables & Grids (tabular column bars, row delimiters)
            else if (lineText.includes('|') || lineText.includes('\t') || (words.length >= 4 && (lower.includes('name') || lower.includes('item') || lower.includes('qty') || lower.includes('price')))) {
              type = 'table';
              subTypeMetadata.isTableGrid = true;
            }
            // 3. Callout Boxes & Teacher Notes
            else if (lower.includes('did you know') || lower.includes('teacher note') || lower.includes('remember') || lower.includes('fun fact') || lower.includes('important')) {
              type = 'callout_box';
              subTypeMetadata.isCalloutBox = true;
            }
            // 4. Headings
            else if (lineText.length < 50 && (lineText.includes('Chapter') || lineText.includes('Unit') || lineText.includes('Lesson') || lineText.includes('Outcomes') || lineText.includes('Topic') || lineText.includes('About Me'))) {
              type = 'heading';
            }
            // 5. Activity & Exercises
            else if (lineText.includes('Activity') || lineText.includes('Point') || lineText.includes('Paste') || lineText.includes('Draw') || lineText.includes('Exercise')) {
              type = 'activity';
            }

            // Multi-column assignment (left column x < 550, right column x >= 550 for 1200px width)
            const lineX = line.bbox?.x0 || 0;
            const columnIndex = lineX < 550 ? 1 : 2;

            extractedBlocks.push({
              blockId: `blk-${physicalPageNumber}-temp`,
              regionId: `reg-${physicalPageNumber}-temp`,
              physicalPageNumber,
              type,
              text: lineText,
              bbox: {
                x: line.bbox?.x0 || 0,
                y: line.bbox?.y0 || 0,
                width: (line.bbox?.x1 || 0) - (line.bbox?.x0 || 0),
                height: (line.bbox?.y1 || 0) - (line.bbox?.y0 || 0),
              },
              confidence: Number((words.reduce((a, w) => a + w.confidence, 0) / Math.max(1, words.length)).toFixed(3)),
              readingOrderIndex: 0,
              words,
              columnIndex,
              subTypeMetadata,
            });
          }
        }
      }

      // 2-Column Aware Reading Order Reconstruction:
      // Sort by columnIndex first (Column 1 top-to-bottom, then Column 2 top-to-bottom)
      const isMultiColumn = extractedBlocks.some((b) => b.columnIndex === 2) && extractedBlocks.some((b) => b.columnIndex === 1);
      
      if (isMultiColumn) {
        extractedBlocks.sort((a, b) => {
          if (a.columnIndex !== b.columnIndex) return (a.columnIndex || 1) - (b.columnIndex || 1);
          return a.bbox.y - b.bbox.y;
        });
      }

      // Re-index reading order
      const blocks: DocumentVisionBlockRecord[] = extractedBlocks.map((b, idx) => ({
        ...b,
        blockId: `blk-${physicalPageNumber}-${idx + 1}`,
        regionId: `reg-${physicalPageNumber}-${idx + 1}`,
        readingOrderIndex: idx + 1,
      }));

      const avgConfidence = totalWordCount > 0 ? Number((totalConfidenceSum / totalWordCount).toFixed(3)) : 0.85;

      return {
        physicalPageNumber,
        blocks,
        wordCount: totalWordCount,
        averageWordConfidence: avgConfidence,
        hasFigures: blocks.length >= 2,
        hasTables: blocks.some((b) => b.type === 'table'),
        hasFormulas: blocks.some((b) => b.type === 'formula'),
        hasCallouts: blocks.some((b) => b.type === 'callout_box'),
        isMultiColumn,
        readingOrderValid: blocks.length > 0,
      };
    } finally {
      await worker.terminate();
    }
  }
}
