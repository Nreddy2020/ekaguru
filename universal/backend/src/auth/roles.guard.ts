import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        // Handler-level metadata wins; otherwise fall back to the controller class so a
        // class-wide restriction (e.g. curator-only controllers) cannot be bypassed.
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || !requiredRoles.length) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        return Boolean(user) && requiredRoles.includes(user.role);
    }
}
