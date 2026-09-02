import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TraceStorage } from '../observe/trace-storage';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/cognitive_memory',
        },
      },
    });
    // this.registerTraceMiddleware();
  }

  private registerTraceMiddleware() {
    this.$use(async (params, next) => {
      const model = params.model || 'Database';
      const action = params.action || 'query';
      const spanName = `Prisma ${model}.${action}`;
      const span = TraceStorage.startSpan(spanName, 'DATABASE', {
        model,
        action,
      });

      const startTime = Date.now();
      try {
        const result = await next(params);
        const duration = Date.now() - startTime;
        if (span) {
          span.end('OK', undefined, { model, action, durationMs: duration });
        }
        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        if (span) {
          span.end('ERROR', error?.message || 'Prisma query failed', {
            model,
            action,
            durationMs: duration,
            errorCode: error?.code,
          });
        }
        throw error;
      }
    });
  }

  async onModuleInit() {
    this.logger.log(`Connecting to database via Prisma Client with URL: ${process.env.DATABASE_URL}...`);
    try {
      await this.$connect();
      this.logger.log('Prisma Client connected successfully');
    } catch (error) {
      this.logger.warn(`Prisma Client deferred connection (DB offline or migration pending): ${error}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma Client disconnected');
  }
}
