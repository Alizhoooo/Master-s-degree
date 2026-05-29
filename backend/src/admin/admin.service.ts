import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });
  }

  async createUser(dto: { email: string; password: string; fullName: string; role: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists');
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
        role: dto.role,
      },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });
  }

  async updateUserRole(id: number, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });
  }

  async getConfig(key: string) {
    const config = await this.prisma.appConfig.findUnique({ where: { key } });
    return { key, value: config?.value || null };
  }

  async setConfig(key: string, value: string) {
    return this.prisma.appConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async getSystemLogs() {
    return this.prisma.systemLog.findMany({
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
