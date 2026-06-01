import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export const SYSTEM_PERMISSIONS = [
  { key: 'accounting.read', resource: 'accounting', action: 'read' },
  { key: 'accounting.write', resource: 'accounting', action: 'write' },
  { key: 'accounting.post', resource: 'accounting', action: 'post' },
  { key: 'cash.read', resource: 'cash', action: 'read' },
  { key: 'cash.write', resource: 'cash', action: 'write' },
  { key: 'bank.read', resource: 'bank', action: 'read' },
  { key: 'bank.write', resource: 'bank', action: 'write' },
  { key: 'bank.confirm', resource: 'bank', action: 'confirm' },
  { key: 'warehouse.read', resource: 'warehouse', action: 'read' },
  { key: 'warehouse.write', resource: 'warehouse', action: 'write' },
  { key: 'warehouse.transfer', resource: 'warehouse', action: 'transfer' },
  { key: 'production.read', resource: 'production', action: 'read' },
  { key: 'production.write', resource: 'production', action: 'write' },
  { key: 'production.start', resource: 'production', action: 'start' },
  { key: 'production.complete', resource: 'production', action: 'complete' },
  { key: 'hr.read', resource: 'hr', action: 'read' },
  { key: 'hr.write', resource: 'hr', action: 'write' },
  { key: 'hr.payroll', resource: 'hr', action: 'payroll' },
  { key: 'documents.read', resource: 'documents', action: 'read' },
  { key: 'documents.write', resource: 'documents', action: 'write' },
  { key: 'documents.post', resource: 'documents', action: 'post' },
  { key: 'documents.approve', resource: 'documents', action: 'approve' },
  { key: 'inventory.read', resource: 'inventory', action: 'read' },
  { key: 'inventory.write', resource: 'inventory', action: 'write' },
  { key: 'orders.read', resource: 'orders', action: 'read' },
  { key: 'orders.write', resource: 'orders', action: 'write' },
  { key: 'crm.read', resource: 'crm', action: 'read' },
  { key: 'crm.write', resource: 'crm', action: 'write' },
  { key: 'reports.read', resource: 'reports', action: 'read' },
  { key: 'ai.read', resource: 'ai', action: 'read' },
  { key: 'admin.users', resource: 'admin', action: 'users' },
  { key: 'admin.config', resource: 'admin', action: 'config' },
  { key: 'configurator.access', resource: 'configurator', action: 'access' },
];

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  async listRoles() {
    return this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getRole(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async createRole(data: { name: string; description?: string; permissions: string[] }) {
    const existing = await this.prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw new BadRequestException('Role already exists');

    const role = await this.prisma.role.create({
      data: { name: data.name, description: data.description, isSystem: false },
    });

    if (data.permissions?.length) {
      const perms = await this.prisma.permission.findMany({ where: { key: { in: data.permissions } } });
      await this.prisma.rolePermission.createMany({
        data: perms.map((p: any) => ({ roleId: role.id, permissionId: p.id })),
      });
    }

    return this.getRole(role.id);
  }

  async updateRole(id: number, data: { name?: string; description?: string; permissions?: string[] }) {
    const role = await this.getRole(id);
    if (role.isSystem) throw new BadRequestException('Cannot modify system role');

    await this.prisma.role.update({
      where: { id },
      data: { name: data.name, description: data.description },
    });

    if (data.permissions) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      const perms = await this.prisma.permission.findMany({ where: { key: { in: data.permissions } } });
      await this.prisma.rolePermission.createMany({
        data: perms.map((p: any) => ({ roleId: id, permissionId: p.id })),
      });
    }

    return this.getRole(id);
  }

  async deleteRole(id: number) {
    const role = await this.getRole(id);
    if (role.isSystem) throw new BadRequestException('Cannot delete system role');
    return this.prisma.role.delete({ where: { id } });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { key: 'asc' } });
  }

  async seedPermissions() {
    const result = { created: 0, existing: 0 };
    for (const p of SYSTEM_PERMISSIONS) {
      const existing = await this.prisma.permission.findUnique({ where: { key: p.key } });
      if (existing) {
        result.existing++;
        continue;
      }
      await this.prisma.permission.create({ data: p });
      result.created++;
    }
    return result;
  }

  async seedSystemRoles() {
    const systemRoles = [
      { name: 'Администратор', description: 'Полный доступ', permissions: SYSTEM_PERMISSIONS.map((p) => p.key) },
      { name: 'Бухгалтер', description: 'Бухгалтерия', permissions: ['accounting.read', 'accounting.write', 'accounting.post', 'cash.read', 'cash.write', 'bank.read', 'bank.write', 'documents.read', 'reports.read'] },
      { name: 'Кассир', description: 'Касса', permissions: ['cash.read', 'cash.write', 'documents.read'] },
      { name: 'Менеджер по продажам', description: 'CRM + Заказы', permissions: ['crm.read', 'crm.write', 'orders.read', 'orders.write', 'inventory.read', 'documents.read', 'documents.write', 'documents.post', 'documents.approve'] },
      { name: 'Кладовщик', description: 'Склад', permissions: ['warehouse.read', 'warehouse.write', 'warehouse.transfer', 'inventory.read', 'inventory.write'] },
      { name: 'Производство', description: 'Цеха', permissions: ['production.read', 'production.write', 'production.start', 'production.complete', 'inventory.read'] },
      { name: 'HR', description: 'Кадры', permissions: ['hr.read', 'hr.write', 'hr.payroll'] },
    ];

    const result: any = { created: 0, existing: 0 };
    for (const sr of systemRoles) {
      const existing = await this.prisma.role.findUnique({ where: { name: sr.name } });
      if (existing) {
        result.existing++;
        continue;
      }
      const perms = await this.prisma.permission.findMany({ where: { key: { in: sr.permissions } } });
      const role = await this.prisma.role.create({
        data: { name: sr.name, description: sr.description, isSystem: true },
      });
      await this.prisma.rolePermission.createMany({
        data: perms.map((p: any) => ({ roleId: role.id, permissionId: p.id })),
      });
      result.created++;
    }
    return result;
  }

  async assignRole(userId: number, roleId: number, scope: string = 'ALL') {
    return this.prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: { scope },
      create: { userId, roleId, scope },
    });
  }

  async removeRole(userId: number, roleId: number) {
    return this.prisma.userRoleAssignment.delete({
      where: { userId_roleId: { userId, roleId } },
    });
  }

  async getUserPermissions(userId: number): Promise<string[]> {
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    const permSet = new Set<string>();
    for (const a of assignments) {
      for (const rp of a.role.permissions) {
        permSet.add(rp.permission.key);
      }
    }
    return Array.from(permSet);
  }

  async hasPermission(userId: number, permission: string): Promise<boolean> {
    const perms = await this.getUserPermissions(userId);
    return perms.includes(permission);
  }

  async getUserRoles(userId: number) {
    return this.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
  }
}
