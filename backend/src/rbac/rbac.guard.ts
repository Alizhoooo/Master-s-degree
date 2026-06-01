import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from './rbac.service';

export const PERMISSIONS_KEY = 'required_permissions';
export const RequirePermissions = (...permissions: string[]) => {
  return (target: any, key?: any, descriptor?: any) => {
    if (descriptor) {
      Reflect.defineMetadata(PERMISSIONS_KEY, permissions, descriptor.value);
    } else {
      Reflect.defineMetadata(PERMISSIONS_KEY, permissions, target);
    }
  };
};

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbac: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPerms = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPerms || requiredPerms.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;
    if (!userId) throw new ForbiddenException('Not authenticated');

    const userPerms = await this.rbac.getUserPermissions(userId);
    for (const perm of requiredPerms) {
      if (!userPerms.includes(perm)) {
        throw new ForbiddenException(`Missing permission: ${perm}`);
      }
    }
    return true;
  }
}

@Injectable()
export class ClassPermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbac: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPerms = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getClass());
    if (!requiredPerms || requiredPerms.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;
    if (!userId) throw new ForbiddenException('Not authenticated');

    const userPerms = await this.rbac.getUserPermissions(userId);
    for (const perm of requiredPerms) {
      if (!userPerms.includes(perm)) {
        throw new ForbiddenException(`Missing permission: ${perm}`);
      }
    }
    return true;
  }
}
