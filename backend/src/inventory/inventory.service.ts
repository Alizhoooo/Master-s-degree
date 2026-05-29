import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

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

    return { ...updated, available: updated.quantityOnHand - updated.quantityReserved };
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

    return { reserved: priorities.filter(p => p.items.every(i => i.canFulfill)).length, total: priorities.length };
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
