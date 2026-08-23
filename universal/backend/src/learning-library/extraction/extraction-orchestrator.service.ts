import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { ExtractorFactoryService } from './extractor-factory.service';
import { StructureDetectorService } from './structure-detector.service';
import { SemanticBoundaryService } from './semantic-boundary.service';
import { KnowledgeConstructorService } from './knowledge-constructor.service';
import { RelationshipEngineService } from './relationship-engine.service';
import { CanonicalModelService } from './canonical-model.service';
import { LearningLibraryAuthGuard } from '../learning-library-auth.guard';
import { ProcessingStatus, DocumentStatus, ConceptType, GradeBand } from '@prisma/client';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class ExtractionOrchestratorService {
  private readonly logger = new Logger(ExtractionOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly extractorFactory: ExtractorFactoryService,
    private readonly structureDetector: StructureDetectorService,
    private readonly semanticBoundary: SemanticBoundaryService,
    private readonly knowledgeConstructor: KnowledgeConstructorService,
    private readonly relationshipEngine: RelationshipEngineService,
    private readonly canonicalModel: CanonicalModelService,
    private readonly authGuard: LearningLibraryAuthGuard,
  ) {}

  async processMaterial(id: string, user?: any): Promise<{ data: any }> {
    const materialId = id.trim();

    // 1. Resolve LearningMaterial
    const material = await this.prisma.learningMaterial.findUnique({
      where: { id: materialId },
      include: { documents: true },
    });

    if (!material) {
      throw new NotFoundException(`LearningMaterial with ID '${materialId}' not found.`);
    }

    // 2. Security Check: Authorize Learner Ownership
    if (user && user.role !== 'ADMIN') {
      const isAuthorized = await this.authGuard.verifyUserLearnerOwnership(user, material.learnerId);
      if (!isAuthorized) {
        throw new ForbiddenException('Access denied: You do not have permission to process this material.');
      }
    }

    // 3. IDEMPOTENCY CHECK: If already READY, return existing state
    if (material.processingStatus === ProcessingStatus.READY) {
      this.logger.log(`Material ${materialId} is already READY. Returning existing processed state.`);
      return {
        data: {
          id: material.id,
          title: material.title,
          processingStatus: material.processingStatus,
          progress: 100,
          currentStage: 'READY',
          message: 'Material is already fully processed.',
          updatedAt: material.updatedAt,
        },
      };
    }

    // 4. ATOMIC RACE CONDITION LOCK: Claim EXTRACTING state
    const lockResult = await this.prisma.learningMaterial.updateMany({
      where: {
        id: material.id,
        processingStatus: {
          notIn: [ProcessingStatus.EXTRACTING, ProcessingStatus.STRUCTURING, ProcessingStatus.CONCEPT_MAPPING, ProcessingStatus.INDEXING],
        },
      },
      data: {
        processingStatus: ProcessingStatus.EXTRACTING,
        failureReason: null,
      },
    });

    if (lockResult.count === 0) {
      throw new ConflictException(
        `Processing is currently in progress for material '${materialId}'.`,
      );
    }

    // 5. Verify source storageKey exists
    if (!material.storageKey) {
      await this.prisma.learningMaterial.update({
        where: { id: material.id },
        data: { processingStatus: ProcessingStatus.FAILED, failureReason: 'Material has no storageKey assigned.' },
      });
      throw new BadRequestException(`Material '${materialId}' has no storageKey assigned.`);
    }

    const fileExists = await this.storageService.fileExists(material.storageKey);
    if (!fileExists) {
      await this.prisma.learningMaterial.update({
        where: { id: material.id },
        data: { processingStatus: ProcessingStatus.FAILED, failureReason: `Source file '${material.storageKey}' not found.` },
      });
      throw new NotFoundException(`Source file '${material.storageKey}' not found in storage.`);
    }

    // Resolve associated Document record
    let docRecord = material.documents && material.documents.length > 0 ? material.documents[0] : null;
    if (!docRecord) {
      docRecord = await this.prisma.document.create({
        data: {
          materialId: material.id,
          title: `${material.title} Document`,
          status: DocumentStatus.PROCESSING,
        },
      });
    } else {
      await this.prisma.document.update({
        where: { id: docRecord.id },
        data: { status: DocumentStatus.PROCESSING },
      });
    }

    const fullFilePath = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads', material.storageKey);

    try {
      // 6. STAGE 1: EXTRACTING & FORENSICS (40% progress)
      const extractor = this.extractorFactory.getExtractor(
        material.mimeType || 'application/pdf',
        material.originalFileName || 'document.pdf',
      );

      const extractedDoc = await extractor.extract(
        fullFilePath,
        material.originalFileName || 'document.pdf',
      );

      // 7. STAGE 2: STRUCTURING & HIERARCHY (60% progress)
      await this.prisma.learningMaterial.update({
        where: { id: material.id },
        data: { processingStatus: ProcessingStatus.STRUCTURING },
      });

      const structureResult = this.structureDetector.processStructure(extractedDoc);

      // 8. STAGE 3: CONCEPT MAPPING & VALIDATION CRITIC (75% progress)
      await this.prisma.learningMaterial.update({
        where: { id: material.id },
        data: { processingStatus: ProcessingStatus.CONCEPT_MAPPING },
      });

      const knowledgeResult = await this.knowledgeConstructor.constructKnowledge(
        docRecord.id,
        extractedDoc.pages,
        material.subjectName || 'General',
      );

      // 9. STAGE 4: RELATIONSHIPS & PREREQUISITES
      const relationships = this.relationshipEngine.inferRelationships(
        knowledgeResult.concepts,
        extractedDoc.pages,
      );

      // 10. STAGE 5: CANONICAL MODEL & PROJECTIONS (90% progress - INDEXING)
      await this.prisma.learningMaterial.update({
        where: { id: material.id },
        data: { processingStatus: ProcessingStatus.INDEXING },
      });

      const canonicalModelData = this.canonicalModel.buildCanonicalModel(
        docRecord.id,
        knowledgeResult.concepts,
        relationships,
      );

      const raptorTreeNodes = this.canonicalModel.projectToRaptorTree(
        material.title,
        structureResult.chapters,
        canonicalModelData,
      );

      // 11. BATCHED IDEMPOTENT PERSISTENCE
      await this.prisma.$transaction(async (tx) => {
        // Clean previous partial records for clean rerun
        await tx.conceptRelationship.deleteMany({ where: { source: { sourceChunks: { some: { chunk: { documentId: docRecord!.id } } } } } });
        await tx.conceptChunk.deleteMany({ where: { chunk: { documentId: docRecord!.id } } });
        await tx.contentChunk.deleteMany({ where: { documentId: docRecord!.id } });
        await tx.contentTopic.deleteMany({ where: { chapter: { documentId: docRecord!.id } } });
        await tx.contentChapter.deleteMany({ where: { documentId: docRecord!.id } });
        await tx.documentPage.deleteMany({ where: { documentId: docRecord!.id } });

        // Batch 1: Document Pages with OCR Metadata
        for (const p of extractedDoc.pages) {
          await tx.documentPage.create({
            data: {
              documentId: docRecord!.id,
              pageNumber: p.pageNumber,
              text: p.rawText,
              ocrApplied: p.ocrMetadata?.ocrUsed || false,
            },
          });
        }

        // Batch 2: Chapters & Topics (Hierarchy)
        const chapterIdMap = new Map<number, string>();
        const topicIdMap = new Map<string, string>();

        for (const c of structureResult.chapters) {
          const createdChapter = await tx.contentChapter.create({
            data: {
              documentId: docRecord!.id,
              title: c.title,
              chapterNumber: c.chapterNumber || null,
              orderIndex: c.orderIndex,
            },
          });
          chapterIdMap.set(c.orderIndex, createdChapter.id);

          for (const t of c.topics) {
            const createdTopic = await tx.contentTopic.create({
              data: {
                chapterId: createdChapter.id,
                title: t.title,
                orderIndex: t.orderIndex,
              },
            });
            topicIdMap.set(`${c.orderIndex}_${t.orderIndex}`, createdTopic.id);
          }
        }

        // Batch 3: Content Chunks with Block Coordinates
        const blockToChunkDbIdMap = new Map<string, string>();
        for (const ch of structureResult.chunks) {
          const chapterDbId = ch.chapterOrderIndex ? chapterIdMap.get(ch.chapterOrderIndex) || null : null;
          const topicDbId =
            ch.chapterOrderIndex && ch.topicOrderIndex
              ? topicIdMap.get(`${ch.chapterOrderIndex}_${ch.topicOrderIndex}`) || null
              : null;

          const createdChunk = await tx.contentChunk.create({
            data: {
              documentId: docRecord!.id,
              chapterId: chapterDbId,
              topicId: topicDbId,
              sequenceNumber: ch.sequenceNumber,
              content: ch.content,
              pageStart: ch.pageStart,
              pageEnd: ch.pageEnd,
            },
          });

          // Associate page blocks with chunk DB ID
          const matchingPage = extractedDoc.pages.find((p) => p.pageNumber >= ch.pageStart && p.pageNumber <= ch.pageEnd);
          if (matchingPage && matchingPage.blocks) {
            for (const b of matchingPage.blocks) {
              if (b.id) blockToChunkDbIdMap.set(b.id, createdChunk.id);
            }
          }
        }

        // Batch 4: Validated Concepts & ConceptChunks
        const conceptDbIdMap = new Map<string, string>();
        for (const conceptDef of canonicalModelData.concepts.values()) {
          const resolvedConcept = await tx.concept.upsert({
            where: {
              normalizedName_domain_gradeBand: {
                normalizedName: conceptDef.canonicalTerm.toLowerCase(),
                domain: conceptDef.semanticContext,
                gradeBand: GradeBand.PRIMARY,
              },
            },
            create: {
              canonicalName: conceptDef.canonicalTerm,
              normalizedName: conceptDef.canonicalTerm.toLowerCase(),
              domain: conceptDef.semanticContext,
              gradeBand: GradeBand.PRIMARY,
              conceptType: ConceptType.CONCEPT,
              definition: conceptDef.canonicalMeaning,
              metadata: {
                sourceLanguage: conceptDef.sourceLanguage,
                sourceTerm: conceptDef.sourceTerm,
                localizedTerms: conceptDef.localizedTerms,
                difficultyBand: conceptDef.difficultyBand,
                sourceProvenance: conceptDef.sourceProvenance,
              },
            },
            update: {
              canonicalName: conceptDef.canonicalTerm,
              definition: conceptDef.canonicalMeaning,
            },
          });

          conceptDbIdMap.set(conceptDef.canonicalId, resolvedConcept.id);

          // Link to source chunk
          for (const blockId of conceptDef.sourceProvenance.blockIds) {
            const dbChunkId = blockToChunkDbIdMap.get(blockId);
            if (dbChunkId) {
              await tx.conceptChunk.upsert({
                where: {
                  conceptId_chunkId: {
                    conceptId: resolvedConcept.id,
                    chunkId: dbChunkId,
                  },
                },
                create: {
                  conceptId: resolvedConcept.id,
                  chunkId: dbChunkId,
                  confidence: conceptDef.confidence,
                  relevance: 1.0,
                },
                update: {
                  confidence: conceptDef.confidence,
                },
              });
            }
          }
        }

        // Batch 5: Concept Relationships with Evidence Explanation
        for (const rel of canonicalModelData.relationships) {
          const sourceDbId = conceptDbIdMap.get(rel.sourceConceptId);
          const targetDbId = conceptDbIdMap.get(rel.targetConceptId);

          if (sourceDbId && targetDbId && sourceDbId !== targetDbId) {
            const explanationPayload = JSON.stringify({
              evidenceType: rel.evidenceType,
              sourcePage: rel.sourcePageNumber,
              sourceBlockId: rel.sourceBlockId,
              snippet: rel.evidenceSnippet,
            });

            await tx.conceptRelationship.upsert({
              where: {
                sourceId_targetId_relationshipType: {
                  sourceId: sourceDbId,
                  targetId: targetDbId,
                  relationshipType: rel.relationshipType,
                },
              },
              create: {
                sourceId: sourceDbId,
                targetId: targetDbId,
                relationshipType: rel.relationshipType,
                strength: rel.strength,
                explanation: explanationPayload,
              },
              update: {
                strength: rel.strength,
                explanation: explanationPayload,
              },
            });
          }
        }

        // Batch 6: RAPTOR Summary Nodes (Hierarchical Retrieval Tree)
        let raptorSeq = structureResult.chunks.length + 100;
        for (const treeNode of raptorTreeNodes) {
          await tx.contentChunk.create({
            data: {
              documentId: docRecord!.id,
              sequenceNumber: raptorSeq++,
              content: `[RAPTOR ${treeNode.level} SUMMARY]: ${treeNode.title}\n\n${treeNode.summary}`,
              pageStart: 1,
              pageEnd: extractedDoc.pages.length,
              metadata: {
                isRaptorSummary: true,
                raptorLevel: treeNode.level,
                childNodeIds: treeNode.childNodeIds,
                ...treeNode.metadata,
              },
            },
          });
        }

        // Quality Profile & Provenance
        const qualityProfile = {
          extractionQuality: extractedDoc.warnings.length === 0 ? 0.95 : 0.85,
          structureQuality: structureResult.chapters.every((c) => !c.missingStructure) ? 0.95 : 0.80,
          conceptQuality: knowledgeResult.concepts.length > 0 ? 0.92 : 0.70,
          overallQuality: 0.90,
          degradationScore: 0.0,
          warnings: extractedDoc.warnings,
          extractionMode: 'HYBRID',
          pipelineVersion: 'M2_v1.0',
          processedAt: new Date(),
        };

        // Update Document status to READY
        await tx.document.update({
          where: { id: docRecord!.id },
          data: {
            status: DocumentStatus.READY,
            pageCount: extractedDoc.pages.length,
            extractedText: JSON.stringify(qualityProfile),
          },
        });

        // Update LearningMaterial status to READY (100% progress)
        await tx.learningMaterial.update({
          where: { id: material.id },
          data: {
            processingStatus: ProcessingStatus.READY,
            failureReason: null, // Clear failureReason; degradation is tracked in qualityProfile
          },
        });
      });

      this.logger.log(
        `Successfully processed material ${material.id}: created ${structureResult.pages.length} pages, ${structureResult.chapters.length} chapters, ${structureResult.chunks.length} chunks, ${canonicalModelData.concepts.size} concepts, ${canonicalModelData.relationships.length} relationships.`,
      );

      return {
        data: {
          id: material.id,
          title: material.title,
          processingStatus: ProcessingStatus.READY,
          progress: 100,
          currentStage: 'READY',
          warnings: extractedDoc.warnings,
          pageCount: extractedDoc.pages.length,
          chunkCount: structureResult.chunks.length,
          chapterCount: structureResult.chapters.length,
          conceptCount: canonicalModelData.concepts.size,
          relationshipCount: canonicalModelData.relationships.length,
          updatedAt: new Date(),
        },
      };
    } catch (err) {
      this.logger.error(`Error processing material ${materialId}: ${err.message}`);

      // Transaction rollback ensures no partial DB records remain; mark status = FAILED
      await this.prisma.learningMaterial.update({
        where: { id: material.id },
        data: {
          processingStatus: ProcessingStatus.FAILED,
          failureReason: err.message,
        },
      });

      await this.prisma.document.update({
        where: { id: docRecord.id },
        data: {
          status: DocumentStatus.FAILED,
        },
      });

      throw err;
    }
  }

  async getChunks(id: string, user?: any, page = 1, pageSize = 20): Promise<{ data: any[]; meta: any }> {
    const materialId = id.trim();

    const material = await this.prisma.learningMaterial.findUnique({
      where: { id: materialId },
      include: { documents: true },
    });

    if (!material) {
      throw new NotFoundException(`LearningMaterial with ID '${materialId}' not found.`);
    }

    if (user && user.role !== 'ADMIN') {
      const isAuthorized = await this.authGuard.verifyUserLearnerOwnership(user, material.learnerId);
      if (!isAuthorized) {
        throw new ForbiddenException('Access denied: You do not have permission to view chunks for this material.');
      }
    }

    const docRecord = material.documents && material.documents.length > 0 ? material.documents[0] : null;
    if (!docRecord) {
      return {
        data: [],
        meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      };
    }

    const p = Math.max(1, page);
    const ps = Math.min(100, Math.max(1, pageSize));
    const skip = (p - 1) * ps;

    const [chunks, total] = await Promise.all([
      this.prisma.contentChunk.findMany({
        where: { documentId: docRecord.id },
        orderBy: { sequenceNumber: 'asc' },
        skip,
        take: ps,
        include: {
          chapter: { select: { title: true, orderIndex: true } },
          topic: { select: { title: true, orderIndex: true } },
        },
      }),
      this.prisma.contentChunk.count({ where: { documentId: docRecord.id } }),
    ]);

    return {
      data: chunks.map((c) => ({
        id: c.id,
        documentId: c.documentId,
        sequenceNumber: c.sequenceNumber,
        content: c.content,
        pageStart: c.pageStart,
        pageEnd: c.pageEnd,
        chapter: c.chapter ? { title: c.chapter.title, orderIndex: c.chapter.orderIndex } : null,
        topic: c.topic ? { title: c.topic.title, orderIndex: c.topic.orderIndex } : null,
        createdAt: c.createdAt,
      })),
      meta: {
        page: p,
        pageSize: ps,
        total,
        totalPages: Math.ceil(total / ps),
      },
    };
  }
}

