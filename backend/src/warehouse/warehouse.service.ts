import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class WarehouseService {
  constructor(private prisma: PrismaService) {}

  async listWarehouses() {
    return this.prisma.warehouse.findMany({
      include: { _count: { select: { stockBalances: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getWarehouse(id: number) {
    const wh = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!wh) throw new NotFoundException('Warehouse not found');
    return wh;
  }

  async createWarehouse(name: string, address?: string, isMain = false) {
    return this.prisma.warehouse.create({ data: { name, address, isMain } });
  }

  async updateWarehouse(id: number, data: { name?: string; address?: string; isMain?: boolean }) {
    await this.getWarehouse(id);
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  async deleteWarehouse(id: number) {
    await this.getWarehouse(id);
    const balances = await this.prisma.stockBalance.count({ where: { warehouseId: id, quantity: { gt: 0 } } });
    if (balances > 0) throw new BadRequestException('Cannot delete warehouse with stock');
    return this.prisma.warehouse.delete({ where: { id } });
  }

  async getStockBalance(warehouseId: number) {
    return this.prisma.stockBalance.findMany({
      where: { warehouseId },
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    });
  }

  async getStockForProduct(productId: number) {
    return this.prisma.stockBalance.findMany({
      where: { productId },
      include: { warehouse: true },
    });
  }

  async transferStock(fromWarehouseId: number, toWarehouseId: number, productId: number, quantity: number, userId: number) {
    if (fromWarehouseId === toWarehouseId) throw new BadRequestException('Same warehouse');
    if (quantity <= 0) throw new BadRequestException('Quantity must be positive');

    const fromBalance = await this.prisma.stockBalance.findUnique({
      where: { warehouseId_productId: { warehouseId: fromWarehouseId, productId } },
    });
    if (!fromBalance || fromBalance.quantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    await this.prisma.$transaction([
      this.prisma.stockBalance.update({
        where: { warehouseId_productId: { warehouseId: fromWarehouseId, productId } },
        data: { quantity: { decrement: quantity } },
      }),
      this.prisma.stockBalance.upsert({
        where: { warehouseId_productId: { warehouseId: toWarehouseId, productId } },
        update: { quantity: { increment: quantity } },
        create: { warehouseId: toWarehouseId, productId, quantity },
      }),
      this.prisma.stockMovement.create({
        data: { warehouseId: fromWarehouseId, productId, delta: -quantity, reason: `Transfer to warehouse ${toWarehouseId}`, userId },
      }),
      this.prisma.stockMovement.create({
        data: { warehouseId: toWarehouseId, productId, delta: quantity, reason: `Transfer from warehouse ${fromWarehouseId}`, userId },
      }),
    ]);

    return { success: true };
  }

  async listBatches(productId?: number) {
    return this.prisma.batch.findMany({
      where: productId ? { productId } : undefined,
      include: { product: true, movements: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBatch(productId: number, batchNo: string, quantity: number, costPrice: number, expiryDate?: string, userId?: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.batch.create({
      data: {
        productId,
        batchNo,
        quantity,
        costPrice,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        userId,
      },
    });
  }

  async listMovements(filters: { warehouseId?: number; productId?: number; dateFrom?: string; dateTo?: string }) {
    const where: any = {};
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.productId) where.productId = filters.productId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }
    return this.prisma.stockMovement.findMany({
      where,
      include: { warehouse: true, product: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }
}
