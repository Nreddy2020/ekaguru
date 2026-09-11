import {authSigningSecret} from "./auth-config";
import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../learning-library/prisma.service';

export interface JwtPayload {
    sub: string;
    email: string;
    role: 'PARENT' | 'STUDENT' | 'ADMIN';
    childId?: string;
    authVersion?: number;
    cv?: number;
    emailVerified?: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(@Optional() private readonly prisma?: PrismaService) {
        const secret=authSigningSecret();
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret
        });
    }

    async validate(payload: JwtPayload) {
        if(payload.authVersion!==2 || typeof payload.sub!=="string" || !["PARENT","STUDENT","ADMIN"].includes(payload.role))throw new UnauthorizedException("Sign in again with verified credentials.");
        // A password reset increments the credential version; older tokens stop working immediately.
        if(typeof payload.cv==="number" && this.prisma?.parentCredential?.findUnique){
            const credential=await this.prisma.parentCredential.findUnique({where:{parentId:payload.sub},select:{credentialVersion:true}});
            if(!credential || credential.credentialVersion!==payload.cv)throw new UnauthorizedException("Your password changed. Sign in again.");
        }
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            childId: payload.childId,
            emailVerified: payload.emailVerified===true
        };
    }
}
