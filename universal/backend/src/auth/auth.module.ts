import {Module} from "@nestjs/common";
import {JwtModule} from "@nestjs/jwt";
import {PassportModule} from "@nestjs/passport";
import {AuthService} from "./auth.service";
import {AuthController} from "./auth.controller";
import {JwtStrategy} from "./jwt.strategy";
import {PrismaService} from "../learning-library/prisma.service";
import {AuthRateLimitGuard} from "./auth-rate-limit.guard";
import {authSigningSecret} from "./auth-config";
import {RecoveryService} from "./recovery.service";
import {MailerService} from "./mailer.service";
@Module({
 imports:[PassportModule,JwtModule.registerAsync({useFactory:()=>({secret:authSigningSecret(),signOptions:{expiresIn:"1h"}})})],
 controllers:[AuthController],providers:[AuthService,JwtStrategy,PrismaService,AuthRateLimitGuard,RecoveryService,MailerService],exports:[AuthService,RecoveryService,MailerService]
})
export class AuthModule {}
