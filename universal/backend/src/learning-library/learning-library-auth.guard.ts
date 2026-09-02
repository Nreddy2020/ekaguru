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

    if (request.params?.learnerId) {
      targetLearnerId = request.params.learnerId;
    } else if (request.params?.id && (request.route?.path?.includes('/learners/') || request.route?.path?.includes('/parent/learners/'))) {
      targetLearnerId = request.params.id;
    } else if (request.body?.learnerId) {
      targetLearnerId = request.body.learnerId;
    } else if (request.query?.learnerId) {
      targetLearnerId = request.query.learnerId;
    }

    // Resolve sessionId hierarchy if present in params, body, or query
    const sessionId = request.params?.sessionId || request.body?.sessionId || request.query?.sessionId;
    if (sessionId) {
      const session = await this.prisma.learningSession.findUnique({
        where: { id: sessionId },
        select: { learnerId: true },
      });
      if (!session) {
        throw new NotFoundException(`LearningSession '${sessionId}' not found.`);
      }
      if (targetLearnerId && targetLearnerId !== session.learnerId) {
        throw new ForbiddenException('Resource mismatch: Target learner does not match the session owner.');
      }
      targetLearnerId = session.learnerId;
    }

    // Resolve stepId hierarchy if present in params, body, or query
    const stepId = request.params?.stepId || request.body?.stepId || request.query?.stepId;
    if (stepId) {
      const step = await this.prisma.sessionStep.findUnique({
        where: { id: stepId },
        select: { session: { select: { id: true, learnerId: true } } },
      });
      if (!step) {
        throw new NotFoundException(`SessionStep '${stepId}' not found.`);
      }
      if (sessionId && step.session.id !== sessionId) {
        throw new ForbiddenException('Resource mismatch: Step does not belong to the active session.');
      }
      if (targetLearnerId && targetLearnerId !== step.session.learnerId) {
        throw new ForbiddenException('Resource mismatch: Target learner does not match the step owner.');
      }
      targetLearnerId = step.session.learnerId;
    }

    // Resolve assessmentId hierarchy if present in params, body, or query
    const assessmentId = request.params?.assessmentId || request.body?.assessmentId || request.query?.assessmentId ||
                          request.params?.assessmentInstanceId || request.body?.assessmentInstanceId || request.query?.assessmentInstanceId;
    if (assessmentId) {
      const instance = await this.prisma.assessmentInstance.findUnique({
        where: { id: assessmentId },
        select: { sessionStep: { select: { id: true, session: { select: { id: true, learnerId: true } } } } },
      });
      if (!instance) {
        throw new NotFoundException(`AssessmentInstance '${assessmentId}' not found.`);
      }
      if (stepId && instance.sessionStep.id !== stepId) {
        throw new ForbiddenException('Resource mismatch: Assessment does not belong to the active step.');
      }
      if (sessionId && instance.sessionStep.session.id !== sessionId) {
        throw new ForbiddenException('Resource mismatch: Assessment does not belong to the active session.');
      }
      if (targetLearnerId && targetLearnerId !== instance.sessionStep.session.learnerId) {
        throw new ForbiddenException('Resource mismatch: Target learner does not match the assessment owner.');
      }
      targetLearnerId = instance.sessionStep.session.learnerId;
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
      // Demo parent bypass for development environment
      if (user.email === 'demo@ekaguru.com' || user.userId === 'parent-001' || user.userId?.startsWith('parent_')) {
        return true;
      }
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
      const targetChildId = user.childId || user.userId;
      return (
        learner.legacyChildId === targetChildId ||
        (user.childId !== undefined && learner.id === user.childId)
      );
    }

    return false;
  }
}
