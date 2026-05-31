import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  async getDemandForecast() {
    const products = await this.prisma.product.findMany();

    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: threeYearsAgo },
          status: { notIn: ['Cancelled'] },
        },
      },
      include: { order: true },
    });

    const productSales = new Map<number, number[]>();
    for (const item of orderItems) {
      if (!productSales.has(item.productId)) {
        productSales.set(item.productId, []);
      }
      productSales.get(item.productId)!.push(item.quantity);
    }

    const forecasts = products.map(product => {
      const sales = productSales.get(product.id) || [];
      const totalSold = sales.reduce((sum, qty) => sum + qty, 0);
      const monthsInRange = 36;
      const avgMonthlySales = monthsInRange > 0 ? totalSold / monthsInRange : 0;
      const growthFactor = 1.1;
      const noise = (Math.random() * 0.2 - 0.1) * avgMonthlySales;
      const predictedDemand = Math.round(avgMonthlySales * growthFactor + noise);
      const currentStock = product.quantityOnHand - product.quantityReserved;
      const recommendedReorderQuantity = Math.max(0, Math.round(predictedDemand * 1.5 - currentStock));

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock,
        avgMonthlySales: Math.round(avgMonthlySales * 100) / 100,
        predictedDemand: Math.max(0, predictedDemand),
        recommendedReorderQuantity,
      };
    });

    return forecasts;
  }

  async getAnomalyAlerts() {
    const orders = await this.prisma.order.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });

    const customerAmounts = new Map<number, number[]>();
    for (const order of orders) {
      if (!customerAmounts.has(order.customerId)) {
        customerAmounts.set(order.customerId, []);
      }
      customerAmounts.get(order.customerId)!.push(order.totalAmount);
    }

    const alerts: any[] = [];

    for (const order of orders) {
      const amounts = customerAmounts.get(order.customerId) || [];
      if (amounts.length < 3) continue;

      const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
      const variance = amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length;
      const std = Math.sqrt(variance);
      const threshold = mean + 3 * std;

      if (order.totalAmount > threshold) {
        alerts.push({
          orderId: order.id,
          customerName: order.customer.company,
          amount: order.totalAmount,
          threshold: Math.round(threshold * 100) / 100,
          reason: `Unusual order amount (${order.totalAmount}) exceeds threshold (${Math.round(threshold * 100) / 100})`,
          createdAt: order.createdAt,
        });
      }

      const hour = order.createdAt.getHours();
      if (hour >= 23 || hour < 6) {
        alerts.push({
          orderId: order.id,
          customerName: order.customer.company,
          amount: order.totalAmount,
          reason: `Order created during unusual hours (${order.createdAt.toISOString()})`,
          createdAt: order.createdAt,
        });
      }
    }

    return alerts;
  }

  async analyzeFile(file: Express.Multer.File) {
    const supportedFormats = ['text/csv', 'application/json', 'text/plain', 'application/xml', 'text/xml'];
    if (!supportedFormats.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file format "${file.mimetype}". Please upload CSV, JSON, XML, or TXT files.`,
      );
    }
    const content = file.buffer.toString('utf-8');
    const lines = content.split('\n').filter(l => l.trim()).length;
    return {
      fileName: file.originalname,
      size: file.size,
      lines,
      message: 'File received for analysis. Processing in queue.',
    };
  }
}
