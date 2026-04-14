import { Controller, Post, Body, Get, UseGuards, Request, Logger } from '@nestjs/common';
import { AuthService, AuthPayload } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private authService: AuthService) {}

    @Post('login')
    async login(@Body() body: { email: string; password: string }) {
        this.logger.log(`Login attempt: ${body.email}`);
        return this.authService.login(body.email, body.password);
    }

    @Post('register')
    async register(@Body() body: { email: string; password: string; name: string; role?: string }) {
        this.logger.log(`Register: ${body.email}`);
        return this.authService.register(
            body.email, 
            body.password, 
            body.name, 
            (body.role as any) || 'PARENT'
        );
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async me(@Request() req: any) {
        return req.user;
    }
}
