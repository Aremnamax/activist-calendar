import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../config/constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      return false;
    }

    // Иерархия ролей: admin > organizer > activist
    const roleHierarchy = {
      [UserRole.ADMIN]: 3,
      [UserRole.ORGANIZER]: 2,
      [UserRole.ACTIVIST]: 1,
    };

    const userRoleLevel = roleHierarchy[user.role.name] || 0;
    const requiredLevel = Math.max(
      ...requiredRoles.map((role) => roleHierarchy[role] || 0),
    );

    return userRoleLevel >= requiredLevel;
  }
}
