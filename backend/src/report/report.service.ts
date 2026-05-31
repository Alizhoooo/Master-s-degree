import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(dateFrom?: string, dateTo?: string) {
    const now = new Date();
    const df = dateFrom ? new Date(dateFrom) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dt = dateTo ? new Date(dateTo) : new Date(df.getTime() + 24 * 60 * 60 * 1000);

    const rangeOrders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: df, lt: dt },
      },
    });

    const totalOrdersInRange = rangeOrders.length;
    const revenueInRange = rangeOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const pendingOrders = await this.prisma.order.count({
      where: { status: 'Pending' },
    });

    const products = await this.prisma.product.findMany();
    const totalProducts = products.length;
    const accurateProducts = products.filter(p => p.quantityOnHand >= 0).length;
    const inventoryAccuracy = totalProducts > 0 ? (accurateProducts / totalProducts) * 100 : 100;

    const windowStart = dateFrom ? new Date(dateFrom) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const windowEnd = dateTo ? new Date(dateTo) : now;
    const ordersInWindow = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: windowStart, lte: windowEnd },
      },
      orderBy: { createdAt: 'asc' },
    });

    const dayCount = Math.max(1, Math.ceil((windowEnd.getTime() - windowStart.getTime()) / (24 * 60 * 60 * 1000)));
    const ordersPerDay: { date: string; count: number; revenue: number }[] = [];
    for (let i = dayCount - 1; i >= 0; i--) {
      const dayStart = new Date(windowEnd.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayOrders = ordersInWindow.filter(o => o.createdAt >= dayStart && o.createdAt < dayEnd);
      ordersPerDay.push({
        date: dayStart.toISOString().split('T')[0],
        count: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      });
    }

    const allOrders = dateFrom || dateTo
      ? await this.prisma.order.findMany({
          where: {
            createdAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          },
        })
      : await this.prisma.order.findMany();
    const statuses = ['Pending', 'Confirmed', 'Reserved', 'Paid', 'Picked', 'Shipped', 'Delivered', 'Cancelled'];
    const orderStatusDistribution = statuses.map(status => ({
      status,
      count: allOrders.filter(o => o.status === status).length,
    }));

    const trendStart = dateFrom ? new Date(dateFrom) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const trendEnd = dateTo ? new Date(dateTo) : now;
    const ordersTrend = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: trendStart, lte: trendEnd },
      },
      orderBy: { createdAt: 'asc' },
    });

    const trendDayCount = Math.max(1, Math.ceil((trendEnd.getTime() - trendStart.getTime()) / (24 * 60 * 60 * 1000)));
    const revenueTrend: { date: string; revenue: number }[] = [];
    for (let i = trendDayCount - 1; i >= 0; i--) {
      const dayStart = new Date(trendEnd.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayOrders = ordersTrend.filter(o => o.createdAt >= dayStart && o.createdAt < dayEnd);
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
      totalOrdersToday: totalOrdersInRange,
      revenueToday: revenueInRange,
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

  async exportExcel(filters: { status?: string; customerId?: number; dateFrom?: string; dateTo?: string }) {
    const ExcelJS = await import('exceljs');
    const orders = await this.getReports(filters);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    sheet.columns = [
      { header: 'Order ID', key: 'id', width: 10 },
      { header: 'Customer', key: 'customer', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Cost Amount', key: 'costAmount', width: 15 },
      { header: 'Delivery Address', key: 'deliveryAddress', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Deadline', key: 'deadline', width: 20 },
      { header: 'Items', key: 'items', width: 40 },
    ];

    orders.forEach(o => {
      sheet.addRow({
        id: o.id,
        customer: o.customer.company,
        status: o.status,
        totalAmount: o.totalAmount,
        costAmount: o.costAmount,
        deliveryAddress: o.deliveryAddress,
        createdAt: o.createdAt.toISOString(),
        deadline: o.deadline.toISOString(),
        items: o.items.map(i => `${i.product.name}x${i.quantity}`).join(', '),
      });
    });

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async exportPdf(filters: { status?: string; customerId?: number; dateFrom?: string; dateTo?: string }) {
    const PDFDocument = (await import('pdfkit')).default;
    const orders = await this.getReports(filters);

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => reject(err));

        doc.fontSize(18).text('SupplyFlow Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        const headers = ['ID', 'Customer', 'Status', 'Amount', 'Address', 'Date'];
        const colWidths = [30, 100, 60, 70, 150, 80];
        const pageWidth = doc.page.width - 60;

        doc.fontSize(9).font('Helvetica-Bold');
        let x = 30;
        let y = doc.y;
        headers.forEach((h, i) => {
          doc.text(h, x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });

        doc.moveDown(0.5);
        y = doc.y;
        doc.font('Helvetica');

        orders.forEach((o, rowIdx) => {
          if (y > doc.page.height - 50) {
            doc.addPage();
            y = 30;
          }

          if (rowIdx % 2 === 0) {
            doc.rect(30, y - 4, pageWidth, 14);
            doc.fill('#f0f0f0');
            doc.fillColor('#000');
          }

          x = 30;
          const vals = [
            String(o.id),
            o.customer.company,
            o.status,
            `${o.totalAmount.toLocaleString()} ₸`,
            o.deliveryAddress,
            o.createdAt.toISOString().split('T')[0],
          ];
          vals.forEach((v, i) => {
            doc.text(v, x, y, { width: colWidths[i], align: 'left' });
            x += colWidths[i];
          });
          y += 14;
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
