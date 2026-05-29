import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todayOrders = await this.prisma.order.findMany({
      where: { createdAt: { gte: todayStart, lt: todayEnd } },
    });

    const totalOrdersToday = todayOrders.length;
    const revenueToday = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const pendingOrders = await this.prisma.order.count({
      where: { status: 'Pending' },
    });

    const products = await this.prisma.product.findMany();
    const totalProducts = products.length;
    const accurateProducts = products.filter(p => p.quantityOnHand >= 0).length;
    const inventoryAccuracy = totalProducts > 0 ? (accurateProducts / totalProducts) * 100 : 100;

    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ordersLast7 = await this.prisma.order.findMany({
      where: { createdAt: { gte: last7Days } },
      orderBy: { createdAt: 'asc' },
    });

    const ordersPerDay: { date: string; count: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayOrders = ordersLast7.filter(o => o.createdAt >= dayStart && o.createdAt < dayEnd);
      ordersPerDay.push({
        date: dayStart.toISOString().split('T')[0],
        count: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      });
    }

    const allOrders = await this.prisma.order.findMany();
    const statuses = ['Pending', 'Confirmed', 'Reserved', 'Paid', 'Picked', 'Shipped', 'Delivered', 'Cancelled'];
    const orderStatusDistribution = statuses.map(status => ({
      status,
      count: allOrders.filter(o => o.status === status).length,
    }));

    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ordersLast30 = await this.prisma.order.findMany({
      where: { createdAt: { gte: last30Days } },
      orderBy: { createdAt: 'asc' },
    });

    const revenueTrend: { date: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayOrders = ordersLast30.filter(o => o.createdAt >= dayStart && o.createdAt < dayEnd);
      revenueTrend.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      });
    }

    const orderItems = await this.prisma.orderItem.findMany({
      include: { product: true, order: true },
      where: { order: { status: { notIn: ['Cancelled'] } } },
    });

    const productSales = new Map<number, { name: string; sku: string; totalQty: number; revenue: number }>();
    for (const item of orderItems) {
      const existing = productSales.get(item.productId) || {
        name: item.product.name,
        sku: item.product.sku,
        totalQty: 0,
        revenue: 0,
      };
      existing.totalQty += item.quantity;
      existing.revenue += item.unitPrice * item.quantity;
      productSales.set(item.productId, existing);
    }

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);

    return {
      totalOrdersToday,
      revenueToday,
      pendingOrders,
      inventoryAccuracy: Math.round(inventoryAccuracy * 100) / 100,
      ordersPerDay,
      orderStatusDistribution,
      revenueTrend,
      topProducts,
    };
  }

  async getReports(filters: { status?: string; customerId?: number; dateFrom?: string; dateTo?: string }) {
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
      include: { customer: true, user: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async exportCsv(filters: { status?: string; customerId?: number; dateFrom?: string; dateTo?: string }) {
    const orders = await this.getReports(filters);
    const header = 'Order ID,Customer,Status,Total Amount,Cost Amount,Delivery Address,Created At,Deadline,Items';
    const rows = orders.map(o => {
      const itemsStr = o.items.map(i => `${i.product.name}x${i.quantity}`).join(';');
      return `${o.id},"${o.customer.company}",${o.status},${o.totalAmount},${o.costAmount},"${o.deliveryAddress}",${o.createdAt.toISOString()},${o.deadline.toISOString()},"${itemsStr}"`;
    });
    return header + '\n' + rows.join('\n');
  }
}
