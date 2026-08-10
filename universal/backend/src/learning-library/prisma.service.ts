import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.logger.log('Connecting to database via Prisma Client...');
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
