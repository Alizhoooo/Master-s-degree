import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async listTasks(filters: { assignedToId?: number; createdById?: number; status?: string }) {
    return this.prisma.task.findMany({
      where: { ...filters },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async listMyTasks(userId: number) {
    return this.prisma.task.findMany({
      where: { assignedToId: userId, status: { in: ['New', 'InProgress'] } },
      include: { createdBy: { select: { id: true, fullName: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getTask(id: number) {
    const t = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!t) throw new NotFoundException('Task not found');
    return t;
  }

  async createTask(data: { title: string; description?: string; assignedToId: number; createdById: number; priority?: string; dueDate?: string; documentId?: number; orderId?: number }) {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        assignedToId: data.assignedToId,
        createdById: data.createdById,
        priority: data.priority || 'Normal',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        documentId: data.documentId,
        orderId: data.orderId,
      },
    });
  }

  async updateTask(id: number, data: any) {
    return this.prisma.task.update({ where: { id }, data });
  }

  async startTask(id: number) {
    return this.prisma.task.update({ where: { id }, data: { status: 'InProgress' } });
  }

  async completeTask(id: number) {
    return this.prisma.task.update({ where: { id }, data: { status: 'Completed', completedAt: new Date() } });
  }

  async cancelTask(id: number) {
    return this.prisma.task.update({ where: { id }, data: { status: 'Cancelled' } });
  }

  async deleteTask(id: number) {
    return this.prisma.task.delete({ where: { id } });
  }
}
