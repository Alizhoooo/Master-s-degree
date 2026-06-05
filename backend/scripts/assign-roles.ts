import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring admin user has Administrator role...');

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@supplyflow.kz' } });
  if (!adminUser) {
    console.error('Admin user not found, skipping');
    return;
  }

  let adminRole = await prisma.role.findUnique({ where: { name: 'Администратор' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({ data: { name: 'Администратор', description: 'Полный доступ', isSystem: true } });
    console.log('Created Administrator role');
  }

  // Ensure all SYSTEM permissions exist
  const systemPermissions = [
    'accounting.access', 'accounting.read', 'accounting.write', 'accounting.post',
    'cash.access', 'cash.read', 'cash.write', 'cash.order.read', 'cash.order.write', 'cash.register.write',
    'bank.access', 'bank.read', 'bank.write', 'bank.confirm', 'bank.account.write', 'bank.order.read', 'bank.order.write',
    'warehouse.access', 'warehouse.read', 'warehouse.write', 'warehouse.transfer',
    'production.access', 'production.read', 'production.write', 'production.start', 'production.complete',
    'hr.access', 'hr.read', 'hr.write', 'hr.payroll',
    'documents.access', 'documents.read', 'documents.write', 'documents.post', 'documents.approve',
    'inventory.read', 'inventory.write',
    'orders.read', 'orders.write',
    'crm.read', 'crm.write',
    'reports.read', 'ai.read',
    'admin.users', 'admin.config',
    'configurator.access',
  ];
  for (const key of systemPermissions) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: key, resource: key.split('.')[0], action: key.split('.')[1] || 'access' },
    });
  }
  console.log(`Ensured ${systemPermissions.length} permissions exist`);

  // Assign all permissions to Administrator role
  const allPerms = await prisma.permission.findMany();
  for (const p of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id },
    });
  }
  console.log(`Assigned ${allPerms.length} permissions to Administrator`);

  // Assign Administrator role to admin user
  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: { scope: 'ALL' },
    create: { userId: adminUser.id, roleId: adminRole.id, scope: 'ALL' },
  });
  console.log(`Assigned Administrator role to ${adminUser.email}`);

  // Also assign to other seeded users
  const rolesMap: Record<string, string> = {
    'manager1@supplyflow.kz': 'Менеджер по продажам',
    'manager2@supplyflow.kz': 'Менеджер по продажам',
    'warehouse1@supplyflow.kz': 'Кладовщик',
    'warehouse2@supplyflow.kz': 'Кладовщик',
  };
  for (const [email, roleName] of Object.entries(rolesMap)) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) continue;
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.warn(`Role ${roleName} not found, skipping ${email}`);
      continue;
    }
    await prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: { scope: 'ALL' },
      create: { userId: user.id, roleId: role.id, scope: 'ALL' },
    });
    console.log(`Assigned ${roleName} to ${email}`);
  }

  console.log('Role assignment completed');
}

main()
  .catch((e) => {
    console.error('Role assignment failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
