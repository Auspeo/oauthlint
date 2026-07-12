import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  // ruleid: auth.nestjs.guard-always-true
  canActivate(context: ExecutionContext) {
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  // ruleid: auth.nestjs.guard-always-true
  async canActivate(context: ExecutionContext) {
    return true;
  }
}

@Injectable()
export class PromiseGuard implements CanActivate {
  // ruleid: auth.nestjs.guard-always-true
  canActivate(context: ExecutionContext) {
    return Promise.resolve(true);
  }
}
