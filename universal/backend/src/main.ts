import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AppModule } from './app.module';
import { TraceInterceptor } from './observe/trace.interceptor';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'universal/backend/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS for frontend
    app.enableCors();
    
    // Enable graceful shutdown hooks for container lifecycle SIGTERM management
    app.enableShutdownHooks();
    
    // Global validation pipe for NestJS DTO validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    // Global Trace Interceptor for VITALIS Observability
    const traceInterceptor = app.get(TraceInterceptor);
    app.useGlobalInterceptors(traceInterceptor);

    // Load environment variables
    await app.init();
    
    await app.listen(20000, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
