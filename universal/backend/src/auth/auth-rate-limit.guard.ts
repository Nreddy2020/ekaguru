import {CanActivate,ExecutionContext,HttpException,Injectable} from "@nestjs/common";
@Injectable()
export class AuthRateLimitGuard implements CanActivate {
 private attempts=new Map<string,{count:number;until:number}>();
 canActivate(context:ExecutionContext){
  const now=Date.now(),request=context.switchToHttp().getRequest(),key=String(request.ip||request.socket?.remoteAddress||"unknown");
  for(const [id,value] of this.attempts)if(value.until<=now)this.attempts.delete(id);
  const value=this.attempts.get(key)||{count:0,until:now+10*60*1000};
  if(value.count>=20 || (!this.attempts.has(key)&&this.attempts.size>=10000))throw new HttpException("Too many sign-in attempts. Please try again later.",429);
  value.count++;this.attempts.set(key,value);return true;
 }
}
