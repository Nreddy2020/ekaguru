import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { CandidateExtractorService } from './candidate-extractor.service';
import { IdentityResolutionService } from './identity-resolution.service';
import { ConceptGraphService, CreateRelationshipDto } from './concept-graph.service';
import { LearningMaterialService } from '../learning-material.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LearningLibraryAuthGuard } from '../learning-library-auth.guard';
import { PrismaService } from '../prisma.service';

@Controller('api/v2')
@UseGuards(JwtAuthGuard, LearningLibraryAuthGuard)
export class KnowledgeController {
  constructor(
    private readonly candidateExtractor: CandidateExtractorService,
    private readonly identityResolver: IdentityResolutionService,
    private readonly graphService: ConceptGraphService,
    private readonly materialService: LearningMaterialService,
    private readonly authGuard: LearningLibraryAuthGuard,
    private readonly prisma: PrismaService,
  ) {}

  @Post('learning-materials/:id/extract-concepts')
  @HttpCode(HttpStatus.OK)
  async extractConcepts(@Param('id') id: string, @Request() req: any) {
    const { data: material } = await this.materialService.findOne(id);

    if (req.user && req.user.role !== 'ADMIN') {
      const isAuthorized = await this.authGuard.verifyUserLearnerOwnership(req.user, material.learnerId);
      if (!isAuthorized) {
        throw new ForbiddenException('Access denied: You do not have permission to extract concepts for this material.');
      }
    }

    // Level 1: Candidate Extraction (User contributes evidence)
    const candidates = await this.candidateExtractor.extractCandidatesFromMaterial(id);

    // Level 2: Auto-resolution ONLY if triggered by ADMIN role
    let resolution = { conceptsResolved: 0, linksCreated: 0 };
    if (req.user && req.user.role === 'ADMIN') {
      resolution = await this.identityResolver.resolveCandidatesForMaterial(id);
    }

    return {
      data: {
        materialId: id,
        candidatesExtracted: candidates.length,
        conceptsResolved: resolution.conceptsResolved,
        linksCreated: resolution.linksCreated,
        status: req.user?.role === 'ADMIN' ? 'RESOLVED' : 'PENDING_ADMIN_REVIEW',
      },
    };
  }

  @Post('concepts/resolve-candidates')
  @HttpCode(HttpStatus.OK)
  async resolveCandidates(@Body('materialId') materialId: string, @Request() req: any) {
    // TRUST BOUNDARY: Canonical Concept Resolution is ADMIN ONLY
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied: Only ADMIN users can resolve candidates into canonical concepts.');
    }

    const resolution = await this.identityResolver.resolveCandidatesForMaterial(materialId);
    return {
      data: {
        materialId,
        conceptsResolved: resolution.conceptsResolved,
        linksCreated: resolution.linksCreated,
      },
    };
  }

  @Get('learning-materials/:id/concepts')
  async getMaterialConcepts(@Param('id') id: string, @Request() req: any) {
    const { data: material } = await this.materialService.findOne(id);

    if (req.user && req.user.role !== 'ADMIN') {
      const isAuthorized = await this.authGuard.verifyUserLearnerOwnership(req.user, material.learnerId);
      if (!isAuthorized) {
        throw new ForbiddenException('Access denied: You do not have permission to view concepts for this material.');
      }
    }

    const doc = await this.prisma.document.findFirst({
      where: { materialId: id },
      include: {
        chunks: {
          include: {
            conceptLinks: {
              include: {
                concept: {
                  include: {
                    objectives: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const conceptsMap = new Map<string, any>();
    if (doc) {
      for (const chunk of doc.chunks) {
        for (const link of chunk.conceptLinks) {
          const c = link.concept;
          if (!conceptsMap.has(c.id)) {
            conceptsMap.set(c.id, {
              id: c.id,
              canonicalName: c.canonicalName,
              normalizedName: c.normalizedName,
              domain: c.domain,
              gradeBand: c.gradeBand,
              objectives: c.objectives.map((o) => ({
                id: o.id,
                description: o.description,
                complexityLevel: o.complexityLevel,
              })),
            });
          }
        }
      }
    }

    return {
      data: Array.from(conceptsMap.values()),
    };
  }

  @Get('concepts/:id/graph')
  async getConceptGraph(@Param('id') id: string, @Request() req: any) {
    const authorizedLearnerIds = await this.materialService.getAuthorizedLearnerIds(req.user);
    const graphData = await this.graphService.getConceptGraph(id, authorizedLearnerIds);
    return { data: graphData };
  }

  @Post('concepts/relationships')
  @HttpCode(HttpStatus.CREATED)
  async addRelationship(@Body() dto: CreateRelationshipDto, @Request() req: any) {
    // TRUST BOUNDARY: Universal Knowledge Graph Mutation is ADMIN ONLY
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied: Only ADMIN users can mutate the Universal Knowledge Graph.');
    }

    const rel = await this.graphService.addRelationship(dto);
    return { data: rel };
  }
}
