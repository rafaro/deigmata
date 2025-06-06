import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthRoles } from './auth-roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const role = this.reflector
      .get<string>('role', context.getHandler());
    if (!role) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return this.matchRoles(role, user.role);;
  }

  private matchRoles(role: string, userRole: string): boolean {
    return (

      Object.keys(AuthRoles).indexOf(userRole) >=
      Object.keys(AuthRoles).indexOf(role)
    );
  }

}

