import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class IssueService {
  constructor(private prisma: PrismaService) {}

  async list(filters?: { warehouseId?: number; type?: string; status?: string; dateFrom?: string; dateTo?: string }) {
    const where: any = {};
    if (filters?.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }
    return this.prisma.productIssue.findMany({
      where,
      include: {
        items: { include: { product: true, batch: true } },
        warehouse: true,
        customer: true,
        user: { select: { id: true, fullName: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async get(id: number) {
    const i = await this.prisma.productIssue.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, batch: true } },
        warehouse: true,
        customer: true,
        user: { select: { id: true, fullName: true } },
      },
    });
    if (!i) throw new NotFoundException('Issue not found');
    return i;
  }

  async create(data: { type: string; warehouseId: number; customerId?: number; reason?: string; notes?: string; items: Array<{ productId: number; quantity: number; unitPrice: number; batchId?: number }>; userId: number }) {
    if (!data.items?.length) throw new BadRequestException('Items required');

    const number = await this.generateNumber(data.type);
    let totalAmount = 0;
    for (const it of data.items) {
      totalAmount += it.quantity * it.unitPrice;
    }

    return this.prisma.$transaction(async (tx) => {
      const issue = await tx.productIssue.create({
        data: {
          number,
          type: data.type,
          warehouseId: data.warehouseId,
          customerId: data.customerId,
          reason: data.reason,
          notes: data.notes,
          totalAmount,
          status: 'Posted',
          userId: data.userId,
        },
      });

      for (const it of data.items) {
        const product = await tx.product.findUnique({ where: { id: it.productId } });
        if (!product) throw new BadRequestException(`Product ${it.productId} not found`);

        if (product.quantityOnHand < it.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.name}: have ${product.quantityOnHand}, need ${it.quantity}`);
        }

        let batchId: number | null = it.batchId || null;
        let costPrice = product.costPrice;

        if (batchId) {
          const batch = await tx.batch.findUnique({ where: { id: batchId } });
          if (!batch) throw new BadRequestException(`Batch ${batchId} not found`);
          if (batch.remainingQty < it.quantity) {
            throw new BadRequestException(`Insufficient batch qty: have ${batch.remainingQty}, need ${it.quantity}`);
          }
          costPrice = batch.costPrice;
          await tx.batch.update({
            where: { id: batchId },
            data: { remainingQty: { decrement: it.quantity } },
          });
          await tx.batchMovement.create({
            data: { batchId, delta: -it.quantity, reason: `Issue ${number}` },
          });
        }

        await tx.productIssueItem.create({
          data: {
            issueId: issue.id,
            productId: it.productId,
            warehouseId: data.warehouseId,
            batchId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            costPrice,
            totalAmount: it.quantity * it.unitPrice,
          },
        });

        await tx.product.update({
          where: { id: it.productId },
          data: { quantityOnHand: { decrement: it.quantity } },
        });

        const balance = await tx.stockBalance.upsert({
          where: { warehouseId_productId: { warehouseId: data.warehouseId, productId: it.productId } },
          update: { quantity: { decrement: it.quantity } },
          create: { warehouseId: data.warehouseId, productId: it.productId, quantity: -it.quantity },
        });

        await tx.stockMovement.create({
          data: {
            warehouseId: data.warehouseId,
            productId: it.productId,
            delta: -it.quantity,
            type: data.type === 'WriteOff' ? ('WriteOff' as any) : ('Issue' as any),
            reference: `ISSUE-${number}`,
            userId: data.userId,
            balance: balance.quantity,
          },
        });
      }

      return this.get(issue.id);
    });
  }

  private async generateNumber(type: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = type === 'Sale' ? 'РН' : type === 'WriteOff' ? 'СП' : type === 'Production' ? 'ПР' : 'РС';
    const last = await this.prisma.productIssue.findFirst({
      where: { number: { startsWith: `${prefix}-${year}-` } },
      orderBy: { id: 'desc' },
    });
    const lastNum = last ? parseInt(last.number.split('-').pop() || '0') : 0;
    return `${prefix}-${year}-${String(lastNum + 1).padStart(6, '0')}`;
  }
}
