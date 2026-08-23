import { Injectable, Logger, Optional } from '@nestjs/common';
import { EmbeddingService } from '../knowledge/alignment/embedding.service';
import { ExtractedBlock } from './document-extractor.interface';

export interface BoundarySignals {
  semanticShift: number;     // 0.0 to 1.0 (1.0 - cosineSimilarity)
  headingEvidence: number;   // 0.0 to 1.0
  layoutBoundary: number;    // 0.0 to 1.0 (e.g. page break, large vertical spacing)
  numberingChange: number;   // 0.0 to 1.0
  discourseTransition: number; // 0.0 to 1.0 (e.g. "In summary", "Next we examine")
  entityShift: number;       // 0.0 to 1.0
}

export interface BoundaryEvaluationResult {
  boundaryScore: number;
  isBoundary: boolean;
  decision: 'STRONG_BOUNDARY' | 'CONTEXT_EVAL' | 'CONTINUE_SEGMENT';
  signals: BoundarySignals;
}

@Injectable()
export class SemanticBoundaryService {
  private readonly logger = new Logger(SemanticBoundaryService.name);

  constructor(@Optional() private readonly embeddingService?: EmbeddingService) {}

  evaluateBoundary(
    prevBlock: ExtractedBlock,
    currBlock: ExtractedBlock,
    prevVector?: number[],
    currVector?: number[],
  ): BoundaryEvaluationResult {
    // 1. Semantic Shift (Cosine Distance)
    let semanticShift = 0.0;
    if (prevVector && currVector && this.embeddingService) {
      const similarity = this.embeddingService.calculateCosineSimilarity(prevVector, currVector);
      semanticShift = Math.max(0, 1.0 - similarity);
    } else {
      // Fallback lexical Jaccard distance if embeddings not present
      semanticShift = this.calculateLexicalDistance(prevBlock.text, currBlock.text);
    }

    // 2. Heading Evidence
    const headingEvidence = currBlock.type === 'HEADING' ? 1.0 : (currBlock.isBold && currBlock.text.length < 80 ? 0.6 : 0.0);

    // 3. Layout Boundary (Page jump or large coordinate gap)
    let layoutBoundary = 0.0;
    if (currBlock.pageNumber > prevBlock.pageNumber) {
      layoutBoundary = 0.8;
    } else if (currBlock.boundingBox && prevBlock.boundingBox) {
      const verticalGap = currBlock.boundingBox[1] - prevBlock.boundingBox[3];
      if (verticalGap > 30) layoutBoundary = 0.5;
    }

    // 4. Numbering Change (e.g. 1.2 -> 1.3 or itemized step)
    const numberingChange = /^\d+(\.\d+)?\s+/.test(currBlock.text) ? 0.7 : 0.0;

    // 5. Discourse Transition phrases
    const isDiscourse = /^(?:furthermore|in conclusion|in summary|next,|on the other hand|subsequently|finally|conversely)\b/i.test(currBlock.text);
    const discourseTransition = isDiscourse ? 0.6 : 0.0;

    // 6. Entity Shift (Topic keyword transition)
    const entityShift = this.calculateEntityShift(prevBlock.text, currBlock.text);

    const signals: BoundarySignals = {
      semanticShift,
      headingEvidence,
      layoutBoundary,
      numberingChange,
      discourseTransition,
      entityShift,
    };

    // Multi-Signal Formula Weights
    const wSemantic = 0.30;
    const wHeading = 0.30;
    const wLayout = 0.15;
    const wNumbering = 0.10;
    const wDiscourse = 0.05;
    const wEntity = 0.10;

    const boundaryScore =
      wSemantic * signals.semanticShift +
      wHeading * signals.headingEvidence +
      wLayout * signals.layoutBoundary +
      wNumbering * signals.numberingChange +
      wDiscourse * signals.discourseTransition +
      wEntity * signals.entityShift;

    let decision: 'STRONG_BOUNDARY' | 'CONTEXT_EVAL' | 'CONTINUE_SEGMENT' = 'CONTINUE_SEGMENT';
    let isBoundary = false;

    if (boundaryScore >= 0.60 || headingEvidence >= 0.8) {
      decision = 'STRONG_BOUNDARY';
      isBoundary = true;
    } else if (boundaryScore >= 0.40) {
      decision = 'CONTEXT_EVAL';
      isBoundary = false;
    } else {
      decision = 'CONTINUE_SEGMENT';
      isBoundary = false;
    }

    return {
      boundaryScore: Number(boundaryScore.toFixed(3)),
      isBoundary,
      decision,
      signals,
    };
  }

  private calculateLexicalDistance(textA: string, textB: string): number {
    const wordsA = new Set(textA.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    const wordsB = new Set(textB.toLowerCase().split(/\W+/).filter((w) => w.length > 3));

    if (wordsA.size === 0 || wordsB.size === 0) return 0.5;

    const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    const jaccardSimilarity = intersection.size / union.size;
    return 1.0 - jaccardSimilarity;
  }

  private calculateEntityShift(textA: string, textB: string): number {
    const capsA = new Set(textA.match(/\b[A-Z][a-z]{3,}\b/g) || []);
    const capsB = new Set(textB.match(/\b[A-Z][a-z]{3,}\b/g) || []);

    if (capsA.size === 0 || capsB.size === 0) return 0.2;
    const common = [...capsA].filter((c) => capsB.has(c));
    return common.length === 0 ? 0.8 : 0.1;
  }
}
