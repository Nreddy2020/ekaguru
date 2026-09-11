import {Controller,Post,Body,Get,UseGuards,Request,HttpCode} from "@nestjs/common";
import {IsEmail,IsString,MinLength,MaxLength,Matches} from "class-validator";
import {AuthService} from "./auth.service";
import {JwtAuthGuard} from "./jwt-auth.guard";
import {AuthRateLimitGuard} from "./auth-rate-limit.guard";
import {RecoveryService} from "./recovery.service";
import {MailerService} from "./mailer.service";
export class LoginDto {@IsEmail() @MaxLength(254) email:string;@IsString() @MinLength(1) @MaxLength(1024) password:string;}
export class RegisterDto extends LoginDto {@IsString() @MinLength(1) @MaxLength(120) name:string;@IsString() @MinLength(12) @MaxLength(1024) password:string;}
export class RecoveryRequestDto {@IsEmail() @MaxLength(254) email:string;}
export class RecoveryConfirmDto {@IsString() @Matches(/^[A-Za-z0-9_-]{32,128}$/) token:string;@IsString() @MinLength(12) @MaxLength(1024) password:string;}
export class TokenDto {@IsString() @Matches(/^[A-Za-z0-9_-]{32,128}$/) token:string;}
const appUrl=()=>(process.env.APP_PUBLIC_URL||"http://localhost:3000").replace(/\/+$/,"");
@Controller("auth")
export class AuthController {
 constructor(private authService:AuthService,private recovery:RecoveryService,private mailer:MailerService){}
 @Post("login") @UseGuards(AuthRateLimitGuard) login(@Body() body:LoginDto){return this.authService.login(body.email,body.password);}
 @Post("register") @UseGuards(AuthRateLimitGuard) async register(@Body() body:RegisterDto){
  const issued=await this.authService.register(body.email,body.password,body.name);
  // Ownership verification starts immediately; failure to send never blocks registration.
  try{const t=await this.recovery.issue(body.email,"EMAIL_VERIFY");if(t)await this.mailer.deliver({to:t.email,subject:"Verify your EKAGURU email",text:"Confirm this email address for your EKAGURU parent account: "+appUrl()+"/login/recovery?verify="+t.token+"\nThis link expires in 24 hours. If you did not create an account, ignore this message."});}catch{}
  return issued;
 }
 @Get("me") @UseGuards(JwtAuthGuard) me(@Request() req:any){return req.user;}
 /** Always responds the same way so account existence is not revealed. */
 @Post("recovery/request") @HttpCode(200) @UseGuards(AuthRateLimitGuard) async requestRecovery(@Body() body:RecoveryRequestDto){
  const t=await this.recovery.issue(body.email,"PASSWORD_RESET");
  if(t){try{await this.mailer.deliver({to:t.email,subject:"Reset your EKAGURU password",text:"Choose a new password for your EKAGURU account: "+appUrl()+"/login/recovery?token="+t.token+"\nThis link expires in 30 minutes and works once. If you did not ask for this, you can ignore it."});}catch{}}
  return {ok:true,message:"If an account exists for that email, a recovery link has been sent."};
 }
 @Post("recovery/confirm") @HttpCode(200) @UseGuards(AuthRateLimitGuard) async confirmRecovery(@Body() body:RecoveryConfirmDto){
  await this.recovery.confirmReset(body.token,body.password);
  return {ok:true,message:"Password updated. Sign in with your new password."};
 }
 @Post("verify-email/request") @HttpCode(200) @UseGuards(JwtAuthGuard,AuthRateLimitGuard) async requestVerification(@Request() req:any){
  const t=await this.recovery.issue(req.user.email,"EMAIL_VERIFY");
  if(t){try{await this.mailer.deliver({to:t.email,subject:"Verify your EKAGURU email",text:"Confirm this email address for your EKAGURU parent account: "+appUrl()+"/login/recovery?verify="+t.token+"\nThis link expires in 24 hours."});}catch{}}
  return {ok:true,message:"If this account has an email address, a verification link has been sent."};
 }
 @Post("verify-email/confirm") @HttpCode(200) @UseGuards(AuthRateLimitGuard) async confirmVerification(@Body() body:TokenDto){
  await this.recovery.confirmEmail(body.token);
  return {ok:true,message:"Email verified. Sign in again to refresh your session."};
 }
}
