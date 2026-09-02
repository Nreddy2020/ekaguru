import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Define structures for the "Beautiful Data" philosophy
export interface BookStructure {
    title: string;
    chapters: Chapter[];
    metadata: {
        pageCount: number;
        author?: string;
        processedBy: 'VisualLayoutAnalysis' | 'LegacyRegex' | 'OmniEngineArchitect';
    };
}

export interface Chapter {
    title: string;
    level: number; // 1 for H1, 2 for H2
    topics: Topic[];
    content?: string; // Intro content before topics
}

export interface Topic {
    title: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    keyPoints: string[];
    diagramDescription?: string;
    contentPreview?: string;
    visualType?: 'header' | 'body' | 'caption' | 'list-item';
}

import { VisionService } from '../ai/vision.service';
import { OmniEngineService } from '../ai/omni.service';
import { PdfExtractorService } from '../learning-library/extraction/extractors/pdf-extractor.service';
import { StructureDetectorService } from '../learning-library/extraction/structure-detector.service';
import { KnowledgeConstructorService } from '../learning-library/extraction/knowledge-constructor.service';
import { SemanticBoundaryService } from '../learning-library/extraction/semantic-boundary.service';
import { RelationshipEngineService } from '../learning-library/extraction/relationship-engine.service';
import { CanonicalModelService } from '../learning-library/extraction/canonical-model.service';

@Injectable()
export class BookService {
    private readonly logger = new Logger(BookService.name);

    constructor(
        private readonly visionService: VisionService,
        private readonly omniEngine: OmniEngineService,
        private readonly pdfExtractor: PdfExtractorService,
        private readonly structureDetector: StructureDetectorService,
        private readonly semanticBoundary: SemanticBoundaryService,
        private readonly knowledgeConstructor: KnowledgeConstructorService,
        private readonly relationshipEngine: RelationshipEngineService,
        private readonly canonicalModel: CanonicalModelService,
    ) { }

    async processBook(filePath: string, originalName: string): Promise<BookStructure> {
        this.logger.log(`[M2-ENGINE] Initiating 10-Stage Document Intelligence Pipeline for: ${originalName}`);

        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const stats = fs.statSync(filePath);
            const deterministicDocId = crypto
                .createHash('sha256')
                .update(`${originalName}:${stats.size}:${filePath}`)
                .digest('hex')
                .slice(0, 16);

            // 1. Stage 1: Page Truth Engine & Quality Gate
            const extractedDoc = await this.pdfExtractor.extract(filePath, originalName);

            // 2. Stage 2: Structure & Hierarchy Engine (Decoupled Heading Scoring & Hierarchy)
            const structure = this.structureDetector.processStructure(extractedDoc);

            // 3. Stage 3: Knowledge Construction & Validation Critic (No Evidence -> No Active Knowledge)
            const knowledge = await this.knowledgeConstructor.constructKnowledge(
                deterministicDocId,
                extractedDoc.pages,
                'General',
            );

            // 5. Stage 5: Evidence-Gated Relationships & Prerequisites
            const relationships = this.relationshipEngine.inferRelationships(
                knowledge.concepts,
                extractedDoc.pages,
            );

            // 6. Stage 6: Canonical Knowledge Model Construction
            const canonicalModel = this.canonicalModel.buildCanonicalModel(
                deterministicDocId,
                knowledge.concepts,
                relationships,
            );

            // 7. Stage 7 & 8: Disposable Projections (KG & RAPTOR Trees)
            const raptorSummaries = this.canonicalModel.projectToRaptorTree(
                originalName,
                structure.chapters,
                canonicalModel,
            );

            // 8. Map Authoritative Canonical Model to BookStructure for UI Presentation
            const activeEntities = Array.from(canonicalModel.concepts.values());
            const chapters: Chapter[] = structure.chapters.map((chap) => ({
                title: chap.title,
                level: 1,
                topics: chap.topics.map((top) => {
                    // Match concepts strictly using page numbers and block provenance
                    const matchingConcepts = activeEntities.filter((entity) => {
                        const hasPageOverlap = entity.sourceProvenance.pageNumbers.some((pNum) =>
                            structure.chunks.some(
                                (chk) =>
                                    chk.chapterOrderIndex === chap.orderIndex &&
                                    chk.topicOrderIndex === top.orderIndex &&
                                    pNum >= chk.pageStart &&
                                    pNum <= chk.pageEnd,
                            ),
                        );
                        return hasPageOverlap || entity.sourceProvenance.snippet.toLowerCase().includes(top.title.toLowerCase());
                    });

                    const primaryConcept = matchingConcepts[0];
                    const dynamicDifficulty: 'beginner' | 'intermediate' | 'advanced' =
                        primaryConcept && primaryConcept.difficultyBand
                            ? (primaryConcept.difficultyBand.toLowerCase() as 'beginner' | 'intermediate' | 'advanced')
                            : 'intermediate';

                    // Evidence-Backed Key Points: Strictly from verified source definitions
                    const keyPoints: string[] = matchingConcepts.length > 0
                        ? matchingConcepts.slice(0, 3).map((c) => `${c.canonicalTerm}: ${c.canonicalMeaning}`)
                        : [];

                    const contentPreview = primaryConcept?.sourceProvenance?.snippet
                        ? primaryConcept.sourceProvenance.snippet.slice(0, 180)
                        : undefined;

                    return {
                        title: top.title,
                        difficulty: dynamicDifficulty,
                        keyPoints,
                        contentPreview,
                        visualType: 'header' as const,
                    };
                }),
            }));

            return {
                title: extractedDoc.metadata.title || originalName,
                chapters,
                metadata: {
                    pageCount: extractedDoc.metadata.pageCount,
                    author: extractedDoc.metadata.author,
                    processedBy: 'VisualLayoutAnalysis',
                },
            };
        } catch (error) {
            this.logger.error(`Document Intelligence Pipeline Failed: ${error.message}`);
            throw error;
        }
    }
}
