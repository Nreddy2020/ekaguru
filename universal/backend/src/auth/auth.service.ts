import {Injectable,UnauthorizedException,ConflictException,BadRequestException} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";
import {PrismaService} from "../learning-library/prisma.service";
import {hashPassword,verifyPassword} from "./password";
export interface AuthPayload {userId:string;email:string;role:"PARENT"|"STUDENT"|"ADMIN";childId?:string;credentialVersion?:number;emailVerified?:boolean;}
@Injectable()
export class AuthService {
 constructor(private jwtService:JwtService,private prisma:PrismaService){}
 async validateUser(email:string,password:string):Promise<AuthPayload|null>{
  if(typeof email!=="string"||typeof password!=="string"||password.length>1024||!password)return null;
  const parent=await this.prisma.parent.findFirst({where:{email:{equals:email.trim().toLowerCase(),mode:"insensitive"}},include:{credential:true}});
  if(!parent?.credential || !(await verifyPassword(password,parent.credential.passwordHash)))return null;
  return {userId:parent.id,email:parent.email,role:"PARENT",credentialVersion:parent.credential.credentialVersion,emailVerified:Boolean(parent.emailVerifiedAt)};
 }
 issue(user:AuthPayload){
  const payload={sub:user.userId,email:user.email,role:user.role,authVersion:2,...(user.childId?{childId:user.childId}:{}),...(user.credentialVersion?{cv:user.credentialVersion}:{}),emailVerified:Boolean(user.emailVerified)};
  return {access_token:this.jwtService.sign(payload),user:payload};
 }
 async login(email:string,password:string){
  const user=await this.validateUser(email,password);
  if(!user)throw new UnauthorizedException("Invalid credentials. Older accounts without a verified password require account recovery.");
  return this.issue(user);
 }
 async register(email:string,password:string,name:string,_requestedRole?:string){
  if(typeof email!=="string"||!email.includes("@")||typeof name!=="string"||!name.trim()||typeof password!=="string"||password.length<12||password.length>1024)throw new BadRequestException("Provide a valid email, name and a password of at least 12 characters.");
  const normalized=email.trim().toLowerCase();
  if(await this.prisma.parent.findFirst({where:{email:{equals:normalized,mode:"insensitive"}}}))throw new ConflictException("An account already exists. Sign in or use account recovery.");
  const passwordHash=await hashPassword(password);
  try{
   const parent=await this.prisma.parent.create({data:{email:normalized,name:name.trim(),credential:{create:{passwordHash}}}});
   return this.issue({userId:parent.id,email:parent.email,role:"PARENT",credentialVersion:1,emailVerified:false});
  }catch(error){if(error?.code==="P2002")throw new ConflictException("An account already exists. Sign in or use account recovery.");throw error;}
 }
 async verifyToken(token:string):Promise<AuthPayload>{
  try{const p=this.jwtService.verify(token);if(p.authVersion!==2)throw new Error();return {userId:p.sub,email:p.email,role:p.role,childId:p.childId};}
  catch{throw new UnauthorizedException("Invalid token");}
 }
}
