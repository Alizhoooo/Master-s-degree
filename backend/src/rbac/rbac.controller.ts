import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, RequirePermissions } from './rbac.guard';

@ApiTags('RBAC')
@Controller('rbac')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class RbacController {
  constructor(private rbac: RbacService) {}

  @Get('roles')
  @RequirePermissions('admin.users')
  listRoles() { return this.rbac.listRoles(); }

  @Get('roles/:id')
  @RequirePermissions('admin.users')
  getRole(@Param('id') id: string) { return this.rbac.getRole(+id); }

  @Post('roles')
  @RequirePermissions('admin.users')
  createRole(@Body() body: { name: string; description?: string; permissions: string[] }) { return this.rbac.createRole(body); }

  @Patch('roles/:id')
  @RequirePermissions('admin.users')
  updateRole(@Param('id') id: string, @Body() body: any) { return this.rbac.updateRole(+id, body); }

  @Delete('roles/:id')
  @RequirePermissions('admin.users')
  deleteRole(@Param('id') id: string) { return this.rbac.deleteRole(+id); }

  @Get('permissions')
  @RequirePermissions('admin.users')
  listPermissions() { return this.rbac.listPermissions(); }

  @Post('seed/permissions')
  @RequirePermissions('configurator.access')
  seedPermissions() { return this.rbac.seedPermissions(); }

  @Post('seed/system-roles')
  @RequirePermissions('configurator.access')
  seedSystemRoles() { return this.rbac.seedSystemRoles(); }

  @Post('users/:userId/roles/:roleId')
  @RequirePermissions('admin.users')
  assignRole(@Param('userId') userId: string, @Param('roleId') roleId: string, @Body() body: { scope?: string }) {
    return this.rbac.assignRole(+userId, +roleId, body?.scope);
  }

  @Delete('users/:userId/roles/:roleId')
  @RequirePermissions('admin.users')
  removeRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.rbac.removeRole(+userId, +roleId);
  }

  @Get('users/:userId/permissions')
  getUserPermissions(@Param('userId') userId: string) { return this.rbac.getUserPermissions(+userId); }

  @Get('users/:userId/roles')
  getUserRoles(@Param('userId') userId: string) { return this.rbac.getUserRoles(+userId); }
}
