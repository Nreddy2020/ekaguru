import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { AppModule } from './app.module';

// Load .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    // Global validation pipe for NestJS DTO validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    // Load environment variables
    await app.init();
    
    // Enable CORS for frontend
    app.enableCors();
    await app.listen(20000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
