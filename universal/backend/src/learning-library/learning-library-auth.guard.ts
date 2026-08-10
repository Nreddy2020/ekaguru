import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class LearningLibraryAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // JwtAuthGuard should throw UnauthorizedException first if missing
      return true;
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    // Determine target learnerId from request params, query, or body
    let targetLearnerId: string | undefined = undefined;

    if (request.params?.id && request.route?.path?.includes('/learners/')) {
      targetLearnerId = request.params.id;
    } else if (request.body?.learnerId) {
      targetLearnerId = request.body.learnerId;
    } else if (request.query?.learnerId) {
      targetLearnerId = request.query.learnerId;
    }

    // If target is a materialId, resolve material's learnerId
    if (!targetLearnerId && request.params?.id && request.route?.path?.includes('/learning-materials/')) {
      const material = await this.prisma.learningMaterial.findUnique({
        where: { id: request.params.id },
        select: { learnerId: true },
      });
      if (!material) {
        throw new NotFoundException(`LearningMaterial '${request.params.id}' not found.`);
      }
      targetLearnerId = material.learnerId;
    }

    // If target is a materialId in nested path (e.g., /learning-materials/:materialId/documents)
    if (!targetLearnerId && request.params?.materialId) {
      const material = await this.prisma.learningMaterial.findUnique({
        where: { id: request.params.materialId },
        select: { learnerId: true },
      });
      if (!material) {
        throw new NotFoundException(`LearningMaterial '${request.params.materialId}' not found.`);
      }
      targetLearnerId = material.learnerId;
    }

    // If target is a documentId (/api/v2/documents/:id)
    if (!targetLearnerId && request.params?.id && request.route?.path?.includes('/documents/')) {
      const doc = await this.prisma.document.findUnique({
        where: { id: request.params.id },
        select: { material: { select: { learnerId: true } } },
      });
      if (!doc) {
        throw new NotFoundException(`Document '${request.params.id}' not found.`);
      }
      targetLearnerId = doc.material.learnerId;
    }

    if (!targetLearnerId) {
      // List endpoints without learnerId filter rely on service-level user scoping
      return true;
    }

    // Check if user is authorized for targetLearnerId
    const isAuthorized = await this.verifyUserLearnerOwnership(user, targetLearnerId);
    if (!isAuthorized) {
      throw new ForbiddenException('Access denied: You do not have permission to access or modify this learner\'s resources.');
    }

    return true;
  }

  async verifyUserLearnerOwnership(user: any, learnerId: string): Promise<boolean> {
    if (user.role === 'ADMIN') return true;

    const learner = await this.prisma.learner.findUnique({
      where: { id: learnerId },
      include: { legacyChild: true },
    });

    if (!learner) {
      return false; // Will trigger 403 or 404
    }

    if (user.role === 'PARENT') {
      // Parent owns child if legacyChild.parentId === user.userId
      if (learner.legacyChild && learner.legacyChild.parentId === user.userId) {
        return true;
      }
      // Or check if user.userId owns a child linked to this learner
      const child = await this.prisma.child.findFirst({
        where: { parentId: user.userId, learner: { id: learnerId } },
      });
      return !!child;
    }

    if (user.role === 'STUDENT') {
      // Student is authorized if user.childId or user.userId matches legacyChildId or learnerId
      return (
        learner.id === user.childId ||
        learner.id === user.userId ||
        learner.legacyChildId === user.childId ||
        learner.legacyChildId === user.userId
      );
    }

    return false;
  }
}
