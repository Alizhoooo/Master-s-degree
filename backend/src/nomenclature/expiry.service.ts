import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ExpiryService {
  constructor(private prisma: PrismaService) {}

  async scan() {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringBatches = await this.prisma.batch.findMany({
      where: {
        expiryDate: { lte: in30Days, not: null },
        remainingQty: { gt: 0 },
        status: 'Active',
      },
      include: { product: true },
    });

    let created = 0;
    for (const batch of expiringBatches) {
      if (!batch.expiryDate) continue;
      const daysLeft = Math.floor((batch.expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      const severity = daysLeft < 0 ? 'Expired' : daysLeft <= 7 ? 'Critical' : daysLeft <= 30 ? 'Warning' : 'Info';

      const existing = await this.prisma.expiryAlert.findFirst({
        where: { batchId: batch.id, isResolved: false },
      });
      if (!existing) {
        await this.prisma.expiryAlert.create({
          data: {
            batchId: batch.id,
            productId: batch.productId,
            expiryDate: batch.expiryDate,
            daysLeft,
            severity,
          },
        });
        created++;
      }
    }

    return { scanned: expiringBatches.length, created };
  }

  async alerts(filters?: { severity?: string; includeResolved?: boolean }) {
    const where: any = {};
    if (filters?.severity) where.severity = filters.severity;
    if (!filters?.includeResolved) where.isResolved = false;
    return this.prisma.expiryAlert.findMany({
      where,
      include: {
        batch: true,
        product: true,
      },
      orderBy: { daysLeft: 'asc' },
    });
  }

  async resolve(id: number) {
    return this.prisma.expiryAlert.update({
      where: { id },
      data: { isResolved: true, resolvedAt: new Date() },
    });
  }

  async expiringSoon(days: number = 30) {
    const now = new Date();
    const target = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.prisma.batch.findMany({
      where: {
        expiryDate: { lte: target, not: null },
        remainingQty: { gt: 0 },
        status: 'Active',
      },
      include: { product: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async expired() {
    const now = new Date();
    return this.prisma.batch.findMany({
      where: {
        expiryDate: { lt: now, not: null },
        remainingQty: { gt: 0 },
        status: 'Active',
      },
      include: { product: true },
      orderBy: { expiryDate: 'asc' },
    });
  }
}
