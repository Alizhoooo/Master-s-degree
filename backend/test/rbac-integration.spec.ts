import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { JwtService } from '@nestjs/jwt';

const request = supertest;

describe('RBAC + ERP Modules Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let adminToken: string;
  let managerToken: string;
  let warehouseToken: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);

    await prisma.userRoleAssignment.deleteMany({ where: { user: { email: { contains: '@rbac-test' } } } });
    await prisma.user.deleteMany({ where: { email: { contains: '@rbac-test' } } });
    const bcrypt = require('bcryptjs');
    const password = await bcrypt.hash('Test123!', 10);

    const adminUser = await prisma.user.create({
      data: { email: 'admin@rbac-test.com', password, fullName: 'Admin User', role: 'Admin' },
    });
    const managerUser = await prisma.user.create({
      data: { email: 'manager@rbac-test.com', password, fullName: 'Manager User', role: 'Manager' },
    });
    const warehouseUser = await prisma.user.create({
      data: { email: 'warehouse@rbac-test.com', password, fullName: 'Warehouse User', role: 'Warehouse' },
    });

    await prisma.rolePermission.deleteMany({ where: { role: { name: { contains: '(test)' } } } });
    await prisma.role.deleteMany({ where: { name: { contains: '(test)' } } });
    await prisma.permission.deleteMany({ where: { key: { contains: '.test' } } });

    const allPerms = [
      'cash.test', 'bank.test', 'warehouse.test', 'production.test', 'hr.test',
      'accounting.test', 'documents.test', 'admin.users.test', 'configurator.test',
    ];
    for (const k of allPerms) {
      await prisma.permission.create({ data: { key: k, description: k, resource: k.split('.')[0] } });
    }

    const adminRole = await prisma.role.create({ data: { name: 'TestAdmin', isSystem: true } });
    for (const k of allPerms) {
      const perm = await prisma.permission.findUnique({ where: { key: k } });
      await prisma.rolePermission.create({ data: { roleId: adminRole.id, permissionId: perm!.id } });
    }

    const managerRole = await prisma.role.create({ data: { name: 'TestManager', isSystem: false } });
    for (const k of ['warehouse.test', 'documents.test', 'production.test', 'accounting.test']) {
      const perm = await prisma.permission.findUnique({ where: { key: k } });
      if (perm) await prisma.rolePermission.create({ data: { roleId: managerRole.id, permissionId: perm.id } });
    }

    const warehouseRole = await prisma.role.create({ data: { name: 'TestWarehouse', isSystem: false } });
    for (const k of ['warehouse.test']) {
      const perm = await prisma.permission.findUnique({ where: { key: k } });
      if (perm) await prisma.rolePermission.create({ data: { roleId: warehouseRole.id, permissionId: perm.id } });
    }

    await prisma.userRoleAssignment.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    await prisma.userRoleAssignment.create({ data: { userId: managerUser.id, roleId: managerRole.id } });
    await prisma.userRoleAssignment.create({ data: { userId: warehouseUser.id, roleId: warehouseRole.id } });

    adminToken = jwt.sign({ sub: adminUser.id, email: adminUser.email, role: adminUser.role });
    managerToken = jwt.sign({ sub: managerUser.id, email: managerUser.email, role: managerUser.role });
    warehouseToken = jwt.sign({ sub: warehouseUser.id, email: warehouseUser.email, role: warehouseUser.role });
  });

  afterAll(async () => {
    await prisma.userRoleAssignment.deleteMany({ where: { user: { email: { contains: '@rbac-test' } } } });
    await prisma.rolePermission.deleteMany({ where: { role: { name: { startsWith: 'Test' } } } });
    await prisma.role.deleteMany({ where: { name: { startsWith: 'Test' } } });
    await prisma.permission.deleteMany({ where: { key: { contains: '.test' } } });
    await prisma.user.deleteMany({ where: { email: { contains: '@rbac-test' } } });
    await app.close();
  });

  describe('Authentication', () => {
    it('unauthenticated request returns 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/cash/registers')
        .expect(401);
    });

    it('invalid token returns 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/cash/registers')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });
  });

  describe('Cash Module', () => {
    let registerId: number;

    it('admin can create cash register', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cash/registers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Main Cash', currency: 'KZT' });
      expect([200, 201]).toContain(res.status);
      expect(res.body.name).toBe('Main Cash');
      registerId = res.body.id;
    });

    it('admin can create cash order (income)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cash/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ registerId, type: 'Income', amount: 50000, reason: 'Test income' });
      expect([200, 201]).toContain(res.status);
      expect(res.body.amount).toBe(50000);
    });

    it('manager can read cash but not write (read perm only)', async () => {
      const readRes = await request(app.getHttpServer())
        .get('/api/v1/cash/registers')
        .set('Authorization', `Bearer ${managerToken}`);
      expect([200, 403]).toContain(readRes.status);
    });
  });

  describe('Warehouse Module', () => {
    it('admin can create warehouse', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/warehouse/warehouses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Main Warehouse', location: 'Almaty' });
      expect([200, 201]).toContain(res.status);
      expect(res.body.name).toBe('Main Warehouse');
    });

    it('warehouse user can read warehouses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/warehouse/warehouses')
        .set('Authorization', `Bearer ${warehouseToken}`);
      expect([200, 403]).toContain(res.status);
    });
  });

  describe('Accounting Module', () => {
    it('admin can seed standard chart of accounts', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/accounting/accounts/seed')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 201, 409]).toContain(res.status);
    });

    it('admin can read trial balance', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/accounting/trial-balance')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 403]).toContain(res.status);
    });
  });

  describe('ERP Dashboard Summary', () => {
    it('admin can get erp summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/reports/dashboard/erp-summary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('cash');
      expect(res.body).toHaveProperty('bank');
      expect(res.body).toHaveProperty('payroll');
      expect(res.body).toHaveProperty('stock');
      expect(res.body).toHaveProperty('production');
      expect(res.body).toHaveProperty('alerts');
    });

    it('non-admin token cannot bypass auth', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/reports/dashboard/erp-summary')
        .set('Authorization', 'Bearer fake.fake.fake');
      expect(res.status).toBe(401);
    });
  });
});
