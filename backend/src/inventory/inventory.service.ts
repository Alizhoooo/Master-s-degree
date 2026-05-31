import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CsvImportService } from '../common/csv-import.service';
import { InventoryGateway } from './inventory.gateway';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private csvImport: CsvImportService,
    private gateway: InventoryGateway,
  ) {}

  async findAll() {
    const products = await this.prisma.product.findMany();
    return products.map(p => ({
      ...p,
      available: p.quantityOnHand - p.quantityReserved,
    }));
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return { ...product, available: product.quantityOnHand - product.quantityReserved };
  }

  async importProducts(file: Express.Multer.File): Promise<{ imported: number; errors: string[] }> {
    const rows = await this.csvImport.parseCsv<{
      sku: string; name: string; category: string; unitPrice: number; quantityOnHand: number; reorderPoint: number;
    }>(file);
    let imported = 0;
    const errors: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        await this.prisma.product.create({
          data: {
            sku: rows[i].sku,
            name: rows[i].name,
            category: rows[i].category,
            unitPrice: Number(rows[i].unitPrice),
            quantityOnHand: Number(rows[i].quantityOnHand),
            reorderPoint: Number(rows[i].reorderPoint),
          },
        });
        imported++;
      } catch (e: any) {
        errors.push(`Row ${i + 2}: ${e.message}`);
      }
    }
    return { imported, errors };
  }

  async adjustStock(productId: number, userId: number, change: number, reason: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { quantityOnHand: product.quantityOnHand + change },
    });

    await this.prisma.inventoryLog.create({
      data: { productId, userId, change, reason },
    });

    const result = { ...updated, available: updated.quantityOnHand - updated.quantityReserved };
    this.gateway.emitStockUpdated(productId, result);
    return result;
  }

  async getReservationPriority() {
    const betaStr = await this.prisma.appConfig.findUnique({ where: { key: 'beta' } });
    const beta = parseFloat(betaStr?.value || '0.05');

    const pendingOrders = await this.prisma.order.findMany({
      where: { status: 'Pending' },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    const now = new Date();
    const priorities = pendingOrders.map(order => {
      const margin = order.totalAmount - order.costAmount;
      const tierMultiplier: Record<string, number> = { VIP: 5, Regular: 1, Problematic: 0.5 };
      const customerPriority = tierMultiplier[order.customer.tier] || 1;
      const hoursUntilDeadline = Math.max(0.1, (order.deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
      const alpha = (margin * customerPriority) / (1 + beta * hoursUntilDeadline);

      const fulfillableItems = order.items.map(item => {
        const available = item.product.quantityOnHand - item.product.quantityReserved;
        return {
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          requested: item.quantity,
          available,
          canFulfill: available >= item.quantity,
        };
      });

      return {
        orderId: order.id,
        customerName: order.customer.company,
        customerTier: order.customer.tier,
        margin,
        hoursUntilDeadline,
        alpha,
        items: fulfillableItems,
        totalAmount: order.totalAmount,
        deadline: order.deadline,
      };
    });

    priorities.sort((a, b) => b.alpha - a.alpha);
    return priorities;
  }

  async reserveByPriority() {
    const priorities = await this.getReservationPriority();

    for (const p of priorities) {
      let canReserveAll = true;
      for (const item of p.items) {
        if (!item.canFulfill) {
          canReserveAll = false;
          break;
        }
      }

      if (canReserveAll) {
        await this.prisma.order.update({
          where: { id: p.orderId },
          data: { status: 'Reserved' },
        });

        for (const item of p.items) {
          await this.prisma.product.update({
            where: { id: item.productId },
            data: { quantityReserved: { increment: item.requested } },
          });

          await this.prisma.inventoryLog.create({
            data: {
              productId: item.productId,
              userId: 0,
              change: -item.requested,
              reason: `Reserved for Order #${p.orderId}`,
            },
          });
        }
      }
    }

    const result = { reserved: priorities.filter(p => p.items.every(i => i.canFulfill)).length, total: priorities.length };
    this.gateway.emitReservationCompleted(result);
    return result;
  }

  async getStockAlerts() {
    const products = await this.prisma.product.findMany();
    return products
      .map(p => ({ ...p, available: p.quantityOnHand - p.quantityReserved }))
      .filter(p => p.available < p.reorderPoint);
  }

  async getLogs() {
    return this.prisma.inventoryLog.findMany({
      include: { product: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
