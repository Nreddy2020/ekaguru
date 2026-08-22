import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OutboxService } from './outbox.service';

@Injectable()
export class OutboxWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxWorkerService.name);
  private dispatchInterval: NodeJS.Timeout | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting Outbox Notification and Cron Workers...');
    // Poll for pending events every 5 seconds
    this.dispatchInterval = setInterval(() => {
      this.dispatchPendingEvents().catch((err) => {
        this.logger.error('Error in dispatchPendingEvents worker:', err);
      });
    }, 5000);

    // Run decay, inactivity, and stuck event recovery checks every 10 minutes
    this.checkInterval = setInterval(() => {
      this.runDecayCheck().catch((err) => {
        this.logger.error('Error in runDecayCheck worker:', err);
      });
      this.runInactivityCheck().catch((err) => {
        this.logger.error('Error in runInactivityCheck worker:', err);
      });
      this.recoverStuckEvents().catch((err) => {
        this.logger.error('Error in recoverStuckEvents worker:', err);
      });
    }, 5 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.dispatchInterval) clearInterval(this.dispatchInterval);
    if (this.checkInterval) clearInterval(this.checkInterval);
  }

  async dispatchPendingEvents(): Promise<void> {
    const pendingEvents = await this.prisma.notificationEvent.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        attempts: { lt: 3 },
      },
      take: 50,
    });

    for (const event of pendingEvents) {
      // Atomic write-reservation check to prevent double-processing by concurrent instances
      const affected = await this.prisma.notificationEvent.updateMany({
        where: {
          id: event.id,
          status: { in: ['PENDING', 'FAILED'] },
        },
        data: {
          status: 'PROCESSING',
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });

      if (affected.count === 0) {
        this.logger.log(`Event ${event.id} already claimed by another worker instance.`);
        continue;
      }

      try {
        const child = await this.prisma.child.findFirst({
          where: { learner: { id: event.learnerId } },
        });

        if (!child) {
          throw new Error(`No legacy child/parent link found for learner ${event.learnerId}`);
        }

        const parentId = child.parentId;

        // Upsert IN_APP delivery (Idempotent delivery)
        await this.prisma.notification.upsert({
          where: {
            eventId_deliveryType_parentId: {
              eventId: event.id,
              deliveryType: 'IN_APP',
              parentId,
            },
          },
          create: {
            eventId: event.id,
            deliveryType: 'IN_APP',
            parentId,
            status: 'SENT',
            sentAt: new Date(),
          },
          update: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        // Upsert EMAIL delivery (Idempotent delivery)
        await this.prisma.notification.upsert({
          where: {
            eventId_deliveryType_parentId: {
              eventId: event.id,
              deliveryType: 'EMAIL',
              parentId,
            },
          },
          create: {
            eventId: event.id,
            deliveryType: 'EMAIL',
            parentId,
            status: 'SENT',
            sentAt: new Date(),
          },
          update: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        await this.prisma.notificationEvent.update({
          where: { id: event.id },
          data: {
            status: 'PROCESSED',
            processedAt: new Date(),
            lastError: null,
          },
        });
      } catch (err: any) {
        await this.prisma.notificationEvent.update({
          where: { id: event.id },
          data: {
            status: 'FAILED',
            lastError: err.message || String(err),
          },
        });
      }
    }
  }

  async runDecayCheck(): Promise<void> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let policy = await this.prisma.masteryPolicy.findFirst({
      orderBy: { version: 'desc' },
    });
    const decayLambda = policy?.decayLambda ?? 0.001;
    const remediationThreshold = policy?.remediationThreshold ?? 0.50;

    const masteries = await this.prisma.learnerConceptMastery.findMany({
      where: {
        status: { not: 'NEEDS_REMEDIATION' },
        masteryScore: { gt: 0 },
        lastAssessedAt: { not: null },
      },
      include: { concept: true },
    });

    for (const mastery of masteries) {
      if (!mastery.lastAssessedAt) continue;
      const deltaHours = (now.getTime() - mastery.lastAssessedAt.getTime()) / (1000 * 60 * 60);
      const decayedScore = mastery.masteryScore * Math.exp(-decayLambda * deltaHours);

      if (decayedScore < remediationThreshold) {
        await this.prisma.$transaction(async (tx) => {
          await tx.learnerConceptMastery.update({
            where: { id: mastery.id },
            data: {
              masteryScore: decayedScore,
              status: 'NEEDS_REMEDIATION',
            },
          });

          await this.outboxService.createEvent(
            tx,
            mastery.learnerId,
            'MASTERY_DECAYED',
            'mastery',
            mastery.id,
            {
              conceptId: mastery.conceptId,
              conceptName: mastery.concept.canonicalName,
              previousScore: mastery.masteryScore,
              decayedScore,
            },
            todayStr
          );
        });
      }
    }
  }

  async runInactivityCheck(): Promise<void> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const learners = await this.prisma.learner.findMany();

    for (const learner of learners) {
      const lastSession = await this.prisma.learningSession.findFirst({
        where: { learnerId: learner.id },
        orderBy: { plannedAt: 'desc' },
      });

      let isInactive = false;
      let lastActiveTime: Date | null = null;

      if (lastSession) {
        const times: Date[] = [];
        if (lastSession.startedAt) times.push(lastSession.startedAt);
        if (lastSession.completedAt) times.push(lastSession.completedAt);
        const maxTime = times.length > 0
          ? new Date(Math.max(...times.map((t) => t.getTime())))
          : lastSession.plannedAt;

        lastActiveTime = maxTime;
        if (maxTime < sevenDaysAgo) {
          isInactive = true;
        }
      } else {
        lastActiveTime = learner.createdAt;
        if (learner.createdAt < sevenDaysAgo) {
          isInactive = true;
        }
      }

      if (isInactive) {
        await this.prisma.$transaction(async (tx) => {
          await this.outboxService.createEvent(
            tx,
            learner.id,
            'LEARNER_INACTIVE',
            'learner',
            learner.id,
            {
              lastActiveAt: lastActiveTime?.toISOString() ?? null,
              daysInactive: lastActiveTime
                ? Math.floor((now.getTime() - lastActiveTime.getTime()) / (1000 * 60 * 60 * 24))
                : 7,
            },
            todayStr
          );
        });
      }
    }
  }

  async recoverStuckEvents(): Promise<void> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const stuckEvents = await this.prisma.notificationEvent.findMany({
      where: {
        status: 'PROCESSING',
        lastAttemptAt: { lt: fifteenMinutesAgo },
      },
    });

    for (const event of stuckEvents) {
      if (event.attempts >= 3) {
        await this.prisma.notificationEvent.update({
          where: { id: event.id },
          data: {
            status: 'FAILED',
            lastError: 'Max retry attempts exceeded. Stuck in processing.',
          },
        });
        this.logger.warn(`Event ${event.id} exceeded max retries and is marked as FAILED.`);
      } else {
        await this.prisma.notificationEvent.update({
          where: { id: event.id },
          data: {
            status: 'PENDING',
          },
        });
        this.logger.log(`Recovered stuck event ${event.id} back to PENDING.`);
      }
    }
  }
}
