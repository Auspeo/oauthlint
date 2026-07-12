import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  // ok: auth.nestjs.guard-always-true -- inspects the request before allowing
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!request.headers.authorization) {
      throw new UnauthorizedException();
    }
    return true;
  }
}

// ok: auth.nestjs.guard-always-true -- an unrelated class method named
// canActivate that is not a NestJS guard
export class FeatureToggle {
  canActivate(name: string) {
    return true;
  }
}
