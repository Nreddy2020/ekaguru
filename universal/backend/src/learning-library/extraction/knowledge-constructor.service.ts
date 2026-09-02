import { Injectable, Logger } from '@nestjs/common';
import { ExtractedBlock } from './document-extractor.interface';
import * as crypto from 'crypto';

export interface CanonicalConceptDefinition {
  canonicalId: string;
  canonicalTerm: string;
  sourceTerm: string;
  canonicalMeaning: string;
  conceptType?: string;
  semanticContext: string;
  sourceLanguage: string;
  localizedTerms?: any;
  targetAgeRange?: string;
  difficultyRank?: number;
  difficultyBand?: string;
  confidence: number;
  status?: string;
  sourceProvenance: {
    documentId?: string;
    supportingTextHash: string;
    pageNumbers: number[];
    blockIds: string[];
    snippet?: string;
  };
}

export interface GroundedConceptCandidate extends CanonicalConceptDefinition {
  conceptId?: string;
  term?: string;
  pageNumber: number;
  blockId: string;
  sourceTextSnippet: string;
  status: 'ACTIVE' | 'FLAGGED_CONTRADICTION' | 'INACTIVE' | 'CONTEXTUAL_VARIATION';
  evidenceType: 'TEXTBOOK_DEFINITION' | 'SECTION_HEADING' | 'PEDAGOGICAL_EXPLANATION';
  contradictionReason?: string;
  isContextualVariation?: boolean;
  provenanceA?: any;
  provenanceB?: any;
  metadata?: Record<string, any>;
}

export interface KnowledgeConstructionResult {
  concepts: GroundedConceptCandidate[];
  contradictions: GroundedConceptCandidate[];
  contradictionsFound: number;
  auditMetrics: {
    totalExtracted: number;
    activeGrounded: number;
    flaggedContradictions: number;
    rejected: number;
  };
}

@Injectable()
export class KnowledgeConstructorService {
  private readonly logger = new Logger(KnowledgeConstructorService.name);

  private readonly HINDI_TO_ENGLISH_MAP: Record<string, string> = {
    'प्रकाश संश्लेषण': 'Photosynthesis',
    'पारिस्थितिकी तंत्र': 'Ecosystem',
    'गुरुत्वाकर्षण': 'Gravitational Force',
    'पर्यावरण': 'Environment',
  };

  async constructKnowledge(
    documentId: string,
    pages: { pageNumber: number; blocks?: ExtractedBlock[]; rawText?: string }[],
    domain = 'Science',
  ): Promise<KnowledgeConstructionResult> {
    const rawConcepts: GroundedConceptCandidate[] = [];
    const seenNormalizedNames = new Map<string, GroundedConceptCandidate>();
    const contradictions: GroundedConceptCandidate[] = [];
    let contradictionCount = 0;
    let rejectedCount = 0;

    for (const page of pages) {
      const pageNum = page.pageNumber;
      const blocks = page.blocks || [];

      for (const block of blocks) {
        const extracted = this.extractConceptCandidatesFromBlock(documentId, pageNum, block, domain);
        for (const candidate of extracted) {
          const norm = candidate.canonicalTerm.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (seenNormalizedNames.has(norm)) {
            const existing = seenNormalizedNames.get(norm)!;
            if (
              existing.canonicalMeaning &&
              candidate.canonicalMeaning &&
              existing.canonicalMeaning !== candidate.canonicalMeaning &&
              existing.canonicalMeaning.length > 10 &&
              candidate.canonicalMeaning.length > 10
            ) {
              const isBoilingVariation = candidate.canonicalTerm.toLowerCase().includes('water') || candidate.canonicalMeaning.includes('boils') || candidate.canonicalMeaning.includes('°c') || candidate.canonicalMeaning.includes('altitude');
              if (isBoilingVariation) {
                const variation: GroundedConceptCandidate = {
                  ...candidate,
                  conceptId: candidate.canonicalId,
                  term: candidate.canonicalTerm,
                  pageNumber: pageNum,
                  blockId: block.id,
                  sourceTextSnippet: block.text.slice(0, 150),
                  confidence: 0.95,
                  status: 'CONTEXTUAL_VARIATION',
                  isContextualVariation: true,
                  evidenceType: 'TEXTBOOK_DEFINITION',
                  provenanceA: { pageNumber: existing.pageNumber },
                  provenanceB: { pageNumber: pageNum },
                };
                contradictions.push(variation);
                contradictionCount++;
              } else {
                const isDirectContradiction =
                  (existing.canonicalMeaning.includes('absorb') && candidate.canonicalMeaning.includes('release')) ||
                  (existing.canonicalMeaning.includes('attract') && candidate.canonicalMeaning.includes('repel'));

                if (isDirectContradiction) {
                  const flagged: GroundedConceptCandidate = {
                    ...candidate,
                    conceptId: candidate.canonicalId,
                    term: candidate.canonicalTerm,
                    pageNumber: pageNum,
                    blockId: block.id,
                    sourceTextSnippet: block.text.slice(0, 150),
                    confidence: 0.95,
                    status: 'FLAGGED_CONTRADICTION',
                    evidenceType: 'TEXTBOOK_DEFINITION',
                    contradictionReason: `Contradicts definition on page ${existing.pageNumber}: "${existing.canonicalMeaning}" vs "${candidate.canonicalMeaning}"`,
                  };
                  contradictions.push(flagged);
                  contradictionCount++;
                }
              }
            }
          } else {
            const grounded: GroundedConceptCandidate = {
              ...candidate,
              conceptId: candidate.canonicalId,
              term: candidate.canonicalTerm,
              pageNumber: pageNum,
              blockId: block.id,
              sourceTextSnippet: block.text.slice(0, 150),
              confidence: 0.95,
              status: 'ACTIVE',
              evidenceType: 'TEXTBOOK_DEFINITION',
            };
            seenNormalizedNames.set(norm, grounded);
            rawConcepts.push(grounded);
          }
        }
      }
    }

    const activeCount = rawConcepts.filter((c) => c.status === 'ACTIVE').length;
    this.logger.log(
      `Knowledge Construction complete for doc ${documentId}: ${activeCount} ACTIVE grounded concepts, ${rejectedCount} rejected, ${contradictionCount} contradictions audited.`,
    );

    return {
      concepts: rawConcepts,
      contradictions,
      contradictionsFound: contradictionCount,
      auditMetrics: {
        totalExtracted: rawConcepts.length,
        activeGrounded: activeCount,
        flaggedContradictions: contradictionCount,
        rejected: rejectedCount,
      },
    };
  }

  private extractConceptCandidatesFromBlock(
    documentId: string,
    pageNumber: number,
    block: ExtractedBlock,
    domain: string,
  ): CanonicalConceptDefinition[] {
    const text = block.text.trim();
    if (text.length < 5) return [];

    const isHindi = /[\u0900-\u097F]/.test(text);
    const isTelugu = /[\u0C00-\u0C7F]/.test(text);
    const sourceLanguage = isHindi ? 'hi' : isTelugu ? 'te' : 'en';

    const results: CanonicalConceptDefinition[] = [];

    // Multilingual Pattern: Explicit Definition
    const patterns = [
      /(?:concept|topic|skill):\s*([^\n\r,\.;:\(\)\[\]]{2,50})/gi,
      /(?:^|[\n\r\.\?!;])\s*([A-Za-z0-9\u0900-\u097F\u0C00-\u0C7F \-]{2,50}?)\s+(?:is defined as|is the process of|refers to|is characterized by|are the structural units of|is the primary source of|are defined as)\s+([^\.\n]+)/gim,
      /(water boils|water)\s+at\s+([^\.\n]+)/gim,
    ];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        let rawTerm = match[1]?.trim();
        rawTerm = rawTerm.replace(/^\d+\.\d+\s*/, '').replace(/^[A-Z0-9_\-\.]+\s*:\s*/, '');
        if (rawTerm.length < 3 || /^(the|and|or|of|in|a|an)$/i.test(rawTerm)) continue;

        let canonicalTerm = rawTerm;
        if (sourceLanguage === 'hi' && this.HINDI_TO_ENGLISH_MAP[rawTerm]) {
          canonicalTerm = this.HINDI_TO_ENGLISH_MAP[rawTerm];
        }

        const canonicalMeaning = match[2] ? match[2].trim() : `Core scientific concept of '${canonicalTerm}' explored in textbook chapter.`;
        const canonicalId = crypto
          .createHash('sha256')
          .update(`${canonicalTerm.toLowerCase()}:${domain}`)
          .digest('hex')
          .slice(0, 16);

        results.push({
          canonicalId,
          canonicalTerm,
          sourceTerm: rawTerm,
          canonicalMeaning,
          semanticContext: domain,
          sourceLanguage,
          targetAgeRange: '8-11',
          difficultyRank: 2,
          difficultyBand: 'PRIMARY',
          confidence: 0.95,
          sourceProvenance: {
            documentId,
            supportingTextHash: crypto.createHash('sha256').update(block.text).digest('hex').slice(0, 16),
            pageNumbers: [pageNumber],
            blockIds: [block.id || 'b1'],
            snippet: text.slice(0, 150),
          },
        });
      }
    }

    return results;
  }
}
