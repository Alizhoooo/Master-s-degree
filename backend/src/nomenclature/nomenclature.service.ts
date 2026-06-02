import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class NomenclatureService {
  constructor(private prisma: PrismaService) {}

  async list(filters?: { search?: string; category?: string; isActive?: boolean; lowStock?: boolean }) {
    const where: any = {};
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { barcode: { contains: filters.search, mode: 'insensitive' } },
        { artikul: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters?.category) where.category = filters.category;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.lowStock) {
      where.quantityOnHand = { lte: this.prisma.product.fields?.reorderPoint ? undefined : 0 };
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return products.map(p => ({
      ...p,
      available: p.quantityOnHand - p.quantityReserved,
      totalValue: p.quantityOnHand * p.costPrice,
      retailValue: p.quantityOnHand * p.unitPrice,
    }));
  }

  async get(id: number) {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: {
        batches: {
          where: { remainingQty: { gt: 0 } },
          orderBy: { expiryDate: 'asc' },
        },
        stockBalances: { include: { warehouse: true } },
      },
    });
    if (!p) throw new NotFoundException('Product not found');
    return {
      ...p,
      available: p.quantityOnHand - p.quantityReserved,
      totalValue: p.quantityOnHand * p.costPrice,
      retailValue: p.quantityOnHand * p.unitPrice,
    };
  }

  async create(data: any) {
    if (data.sku) {
      const existing = await this.prisma.product.findUnique({ where: { sku: data.sku } });
      if (existing) throw new BadRequestException(`SKU ${data.sku} already exists`);
    }
    if (data.barcode) {
      const existing = await this.prisma.product.findUnique({ where: { barcode: data.barcode } });
      if (existing) throw new BadRequestException(`Barcode ${data.barcode} already exists`);
    }
    if (data.markup === undefined && data.unitPrice && data.costPrice) {
      data.markup = ((data.unitPrice - data.costPrice) / data.costPrice) * 100;
    }
    return this.prisma.product.create({ data });
  }

  async update(id: number, data: any) {
    await this.get(id);
    if (data.markup === undefined && data.unitPrice !== undefined && data.costPrice !== undefined) {
      data.markup = data.costPrice > 0
        ? ((data.unitPrice - data.costPrice) / data.costPrice) * 100
        : 0;
    }
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.get(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false, archivedAt: new Date() },
    });
  }

  async categories() {
    const products = await this.prisma.product.findMany({ distinct: ['category'] });
    return products.map(p => p.category).filter(Boolean);
  }

  async lowStock() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
    });
    return products
      .filter(p => p.quantityOnHand <= p.reorderPoint)
      .map(p => ({
        ...p,
        available: p.quantityOnHand - p.quantityReserved,
        deficit: p.reorderPoint - p.quantityOnHand,
      }));
  }

  async priceHistory(id: number) {
    await this.get(id);
    return this.prisma.productReceiptItem.findMany({
      where: { productId: id },
      include: { receipt: true },
      orderBy: { receipt: { date: 'desc' } },
      take: 50,
    });
  }
}
