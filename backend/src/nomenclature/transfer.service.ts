import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TransferService {
  constructor(private prisma: PrismaService) {}

  async list(filters?: { fromWarehouseId?: number; toWarehouseId?: number; status?: string }) {
    const where: any = {};
    if (filters?.fromWarehouseId) where.fromWarehouseId = filters.fromWarehouseId;
    if (filters?.toWarehouseId) where.toWarehouseId = filters.toWarehouseId;
    if (filters?.status) where.status = filters.status;
    return this.prisma.productTransfer.findMany({
      where,
      include: {
        items: { include: { product: true, batch: true } },
        fromWarehouse: true,
        toWarehouse: true,
        user: { select: { id: true, fullName: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async get(id: number) {
    const t = await this.prisma.productTransfer.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, batch: true } },
        fromWarehouse: true,
        toWarehouse: true,
        user: { select: { id: true, fullName: true } },
      },
    });
    if (!t) throw new NotFoundException('Transfer not found');
    return t;
  }

  async create(data: { fromWarehouseId: number; toWarehouseId: number; reason?: string; items: Array<{ productId: number; quantity: number; batchId?: number }>; userId: number }) {
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw new BadRequestException('From and To warehouses must differ');
    }
    if (!data.items?.length) throw new BadRequestException('Items required');

    const number = await this.generateNumber();

    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.productTransfer.create({
        data: {
          number,
          fromWarehouseId: data.fromWarehouseId,
          toWarehouseId: data.toWarehouseId,
          reason: data.reason,
          status: 'Posted',
          userId: data.userId,
        },
      });

      for (const it of data.items) {
        const product = await tx.product.findUnique({ where: { id: it.productId } });
        if (!product) throw new BadRequestException(`Product ${it.productId} not found`);

        const fromBalance = await tx.stockBalance.findUnique({
          where: { warehouseId_productId: { warehouseId: data.fromWarehouseId, productId: it.productId } },
        });
        if (!fromBalance || fromBalance.quantity < it.quantity) {
          throw new BadRequestException(`Insufficient stock at source warehouse for ${product.name}`);
        }

        let costPrice = product.costPrice;
        if (it.batchId) {
          const batch = await tx.batch.findUnique({ where: { id: it.batchId } });
          if (batch) costPrice = batch.costPrice;
        }

        await tx.productTransferItem.create({
          data: {
            transferId: transfer.id,
            productId: it.productId,
            batchId: it.batchId,
            quantity: it.quantity,
            costPrice,
          },
        });

        const fromNew = await tx.stockBalance.update({
          where: { warehouseId_productId: { warehouseId: data.fromWarehouseId, productId: it.productId } },
          data: { quantity: { decrement: it.quantity } },
        });

        const toNew = await tx.stockBalance.upsert({
          where: { warehouseId_productId: { warehouseId: data.toWarehouseId, productId: it.productId } },
          update: { quantity: { increment: it.quantity } },
          create: { warehouseId: data.toWarehouseId, productId: it.productId, quantity: it.quantity },
        });

        await tx.stockMovement.create({
          data: {
            warehouseId: data.fromWarehouseId,
            productId: it.productId,
            delta: -it.quantity,
            type: 'TransferOut' as any,
            reference: `TRANSFER-${transfer.number}`,
            userId: data.userId,
            balance: fromNew.quantity,
          },
        });
        await tx.stockMovement.create({
          data: {
            warehouseId: data.toWarehouseId,
            productId: it.productId,
            delta: it.quantity,
            type: 'TransferIn' as any,
            reference: `TRANSFER-${transfer.number}`,
            userId: data.userId,
            balance: toNew.quantity,
          },
        });
      }

      return this.get(transfer.id);
    });
  }

  private async generateNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.productTransfer.findFirst({
      where: { number: { startsWith: `ПМ-${year}-` } },
      orderBy: { id: 'desc' },
    });
    const lastNum = last ? parseInt(last.number.split('-').pop() || '0') : 0;
    return `ПМ-${year}-${String(lastNum + 1).padStart(6, '0')}`;
  }
}
