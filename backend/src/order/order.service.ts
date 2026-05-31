import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { status?: string; customerId?: number; dateFrom?: string; dateTo?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    return this.prisma.order.findMany({
      where,
      include: {
        customer: true,
        user: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        user: true,
        items: { include: { product: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(dto: { customerId: number; items: { productId: number; quantity: number }[]; deliveryAddress: string; deadline: string; notes?: string }, userId: number) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map(i => i.productId) } },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    let totalAmount = 0;
    let costAmount = 0;
    const itemsData = dto.items.map(item => {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      totalAmount += product.unitPrice * item.quantity;
      costAmount += product.unitPrice * item.quantity * 0.7;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.unitPrice,
      };
    });

    let status = 'Pending';
    let canReserve = true;

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product || (product.quantityOnHand - product.quantityReserved) < item.quantity) {
        canReserve = false;
        break;
      }
    }

    if (canReserve) {
      status = 'Reserved';
    }

    const order = await this.prisma.order.create({
      data: {
        customerId: dto.customerId,
        userId,
        status,
        totalAmount,
        costAmount,
        deliveryAddress: dto.deliveryAddress,
        deadline: new Date(dto.deadline),
        notes: dto.notes,
        items: {
          create: itemsData,
        },
      },
      include: {
        customer: true,
        user: true,
        items: { include: { product: true } },
      },
    });

    if (canReserve) {
      for (const item of dto.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { quantityReserved: { increment: item.quantity } },
        });

        await this.prisma.inventoryLog.create({
          data: {
            productId: item.productId,
            userId,
            change: -item.quantity,
            reason: `Reserved for Order #${order.id}`,
          },
        });
      }
    }

    await this.prisma.customer.update({
      where: { id: dto.customerId },
      data: {
        totalOrders: { increment: 1 },
        lastOrderDate: new Date(),
      },
    });

    return order;
  }

  async updateStatus(id: number, status: string, userId: number) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');

    const validTransitions: Record<string, string[]> = {
      Pending: ['Confirmed', 'Cancelled'],
      Confirmed: ['Reserved', 'Cancelled'],
      Reserved: ['Paid', 'Cancelled'],
      Paid: ['Picked', 'Cancelled'],
      Picked: ['Shipped'],
      Shipped: ['Delivered'],
      Delivered: [],
      Cancelled: [],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${status}`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        user: true,
        items: { include: { product: true } },
      },
    });

    await this.prisma.systemLog.create({
      data: {
        userId,
        action: `Order #${id} status changed to ${status}`,
        details: `From ${order.status} to ${status}`,
      },
    });

    return updated;
  }

  async bulkUpdateStatus(ids: number[], status: string, userId: number) {
    const results = [];
    for (const id of ids) {
      try {
        const updated = await this.updateStatus(id, status, userId);
        results.push({ id, success: true, order: updated });
      } catch (e: any) {
        results.push({ id, success: false, error: e.message });
      }
    }
    return results;
  }

  async cancelOrder(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      throw new BadRequestException('Cannot cancel this order');
    }

    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { quantityReserved: { decrement: item.quantity } },
      });

      await this.prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          userId: 0,
          change: item.quantity,
          reason: `Stock released from cancelled Order #${id}`,
        },
      });
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: 'Cancelled' },
    });
  }

  async getTimeline(id: number) {
    const logs = await this.prisma.systemLog.findMany({
      where: {
        action: { contains: `Order #${id} status changed` },
      },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return logs.map(log => {
      const match = log.details?.match(/From (\w+) to (\w+)/);
      return {
        id: log.id,
        fromStatus: match ? match[1] : null,
        toStatus: match ? match[2] : null,
        action: log.action,
        details: log.details,
        user: log.user ? { id: log.user.id, fullName: log.user.fullName } : null,
        createdAt: log.createdAt,
      };
    });
  }

  async getPickList(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    return {
      orderId: order.id,
      customer: order.customer.company,
      deliveryAddress: order.deliveryAddress,
      deadline: order.deadline,
      items: order.items.map(item => ({
        productId: item.productId,
        sku: item.product.sku,
        productName: item.product.name,
        quantity: item.quantity,
        location: item.product.category,
      })),
    };
  }
}
