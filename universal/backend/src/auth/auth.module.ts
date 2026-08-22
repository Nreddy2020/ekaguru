import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UserService } from '../domain/user.service';
import { LlmService } from '../ai/llm.service';
import { LlmCacheService } from '../ai/llm-cache.service';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'ekaguru-secret-key-change-in-production',
            signOptions: { expiresIn: '7d' }
        })
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, UserService, LlmService, LlmCacheService],
    exports: [AuthService]
})
export class AuthModule {}
