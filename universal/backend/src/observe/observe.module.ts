import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ObserveController } from './observe.controller';
import { TelemetryStoreService } from './telemetry-store.service';
import { TraceInterceptor } from './trace.interceptor';
import { TraceContextMiddleware } from './trace-context.middleware';
import { PrismaService } from '../learning-library/prisma.service';

@Module({
  controllers: [ObserveController],
  providers: [
    TelemetryStoreService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TraceInterceptor,
    },
    TraceInterceptor,
    TraceContextMiddleware,
    PrismaService,
  ],
  exports: [
    TelemetryStoreService,
    TraceInterceptor,
    TraceContextMiddleware,
  ],
})
export class ObserveModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceContextMiddleware).forRoutes('*');
  }
}
