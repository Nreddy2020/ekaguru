import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../domain/user.service';

export interface AuthPayload {
    userId: string;
    email: string;
    role: 'PARENT' | 'STUDENT' | 'ADMIN';
    childId?: string;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private jwtService: JwtService,
        private userService: UserService
    ) {}

    async validateUser(email: string, password: string): Promise<AuthPayload | null> {
        // In production, validate against hashed password
        // For now, allow any email with mock password check
        if (!email || !password) {
            return null;
        }

        // Check if parent exists
        const parent = await this.userService.getParentByEmail(email);
        if (parent) {
            return {
                userId: parent.id,
                email: parent.email,
                role: 'PARENT' as const
            };
        }

        // Mock: create parent if doesn't exist
        if (email.includes('@')) {
            const newParent = await this.userService.createParent(email, 'New User');
            return {
                userId: newParent.id,
                email: newParent.email,
                role: 'PARENT' as const
            };
        }

        return null;
    }

    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);
        
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {
            sub: user.userId,
            email: user.email,
            role: user.role,
            childId: user.childId
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: payload
        };
    }

    async register(email: string, password: string, name: string, role: 'PARENT' | 'STUDENT' | 'ADMIN' = 'PARENT') {
        const existing = await this.userService.getParentByEmail(email);
        if (existing) {
            throw new UnauthorizedException('Email already registered');
        }

        const parent = await this.userService.createParent(email, name);
        
        const payload = {
            sub: parent.id,
            email: parent.email,
            role
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: payload
        };
    }

    async verifyToken(token: string): Promise<AuthPayload> {
        try {
            return this.jwtService.verify(token) as AuthPayload;
        } catch {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
