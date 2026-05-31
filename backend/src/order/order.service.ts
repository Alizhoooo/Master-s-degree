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

  async create(dto: { customerId: number; items: { productId: number; quantity: number }[]; deliveryAddress: string; deadline?: string; notes?: string }, userId: number) {
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
        deadline: dto.deadline ? new Date(dto.deadline) : new Date(),
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
    const results: { id: number; success: boolean; order?: any; error?: string }[] = [];
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

  async generateInvoice(id: number): Promise<Buffer> {
    const order = await this.findOne(id);
    const PDFDocument = (await import('pdfkit')).default;

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width - 80;
        let y = 40;

        doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', 40, y);
        doc.fontSize(10).font('Helvetica').text(`#${order.id}`, 40, doc.y + 4);
        y = doc.y + 20;

        doc.fontSize(9).font('Helvetica-Bold').text('SupplyFlow BPM', 40, y);
        doc.fontSize(8).font('Helvetica').text('Business Process Management', 40, doc.y + 10);
        y = doc.y + 25;

        doc.fontSize(9).font('Helvetica-Bold').text('Bill To:', 40, y);
        doc.fontSize(8).font('Helvetica');
        doc.text(order.customer.company, 40, doc.y + 10);
        doc.text(`Contact: ${order.customer.contactPerson}`, 40, doc.y + 10);
        doc.text(`Phone: ${order.customer.phone}`, 40, doc.y + 10);
        doc.text(`Email: ${order.customer.email}`, 40, doc.y + 10);
        y = doc.y + 15;

        doc.fontSize(8).font('Helvetica').text(`Order Date: ${order.createdAt.toLocaleDateString()}`, 350, 40);
        doc.text(`Deadline: ${order.deadline.toLocaleDateString()}`, 350, doc.y + 10);
        doc.text(`Status: ${order.status}`, 350, doc.y + 10);
        doc.text(`Delivery: ${order.deliveryAddress}`, 350, doc.y + 10);
        y = Math.max(y, doc.y + 15);

        doc.rect(40, y, pageWidth, 20).fill('#1a237e');
        doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold');
        doc.text('Item', 50, y + 5);
        doc.text('SKU', 250, y + 5);
        doc.text('Qty', 320, y + 5, { width: 40, align: 'right' });
        doc.text('Price', 370, y + 5, { width: 60, align: 'right' });
        doc.text('Total', 440, y + 5, { width: 70, align: 'right' });
        y += 20;

        doc.fillColor('#000').font('Helvetica').fontSize(8);
        for (const item of order.items) {
          if (y > doc.page.height - 60) {
            doc.addPage();
            y = 40;
          }
          const itemTotal = item.unitPrice * item.quantity;
          doc.text(item.product?.name || `#${item.productId}`, 50, y);
          doc.text(item.product?.sku || '-', 250, y);
          doc.text(String(item.quantity), 320, y, { width: 40, align: 'right' });
          doc.text(`${item.unitPrice.toLocaleString()} ₸`, 370, y, { width: 60, align: 'right' });
          doc.text(`${itemTotal.toLocaleString()} ₸`, 440, y, { width: 70, align: 'right' });
          y += 16;
        }

        y += 10;
        doc.moveTo(40, y).lineTo(40 + pageWidth, y).stroke('#ccc');
        y += 10;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Total: ${order.totalAmount.toLocaleString()} ₸`, 440, y, { width: 70, align: 'right' });

        y = doc.page.height - 60;
        doc.fontSize(7).font('Helvetica').fillColor('#999');
        doc.text('SupplyFlow BPM · Generated automatically', 40, y, { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
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
