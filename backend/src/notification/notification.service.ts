import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async listMy(userId: number, onlyUnread: boolean = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(onlyUnread ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async unreadCount(userId: number) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  async create(userId: number, title: string, message: string, type: string = 'info', link?: string) {
    return this.prisma.notification.create({ data: { userId, title, message, type, link } });
  }

  async markRead(id: number, userId: number) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n) throw new NotFoundException('Notification not found');
    if (n.userId !== userId) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllRead(userId: number) {
    return this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  }

  async delete(id: number, userId: number) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== userId) throw new NotFoundException('Notification not found');
    return this.prisma.notification.delete({ where: { id } });
  }
}
