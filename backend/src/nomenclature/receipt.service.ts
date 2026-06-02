import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  async list(filters?: { supplierId?: number; warehouseId?: number; status?: string; dateFrom?: string; dateTo?: string }) {
    const where: any = {};
    if (filters?.supplierId) where.supplierId = filters.supplierId;
    if (filters?.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters?.status) where.status = filters.status;
    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }
    return this.prisma.productReceipt.findMany({
      where,
      include: {
        items: { include: { product: true, batch: true } },
        warehouse: true,
        supplier: true,
        user: { select: { id: true, fullName: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async get(id: number) {
    const r = await this.prisma.productReceipt.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, batch: true } },
        warehouse: true,
        supplier: true,
        user: { select: { id: true, fullName: true } },
      },
    });
    if (!r) throw new NotFoundException('Receipt not found');
    return r;
  }

  async create(data: { supplierId?: number; supplierName: string; warehouseId: number; invoiceNumber?: string; invoiceDate?: string; contractNo?: string; notes?: string; items: Array<{ productId: number; quantity: number; unitPrice: number; costPrice?: number; expiryDate?: string; manufacturedAt?: string; storageLifeDays?: number; batchNo?: string; serialNo?: string }>; userId: number }) {
    if (!data.items?.length) throw new BadRequestException('Items required');

    const number = await this.generateNumber();
    const vatRate = 12;
    let subtotal = 0;
    let vatAmount = 0;

    for (const it of data.items) {
      const lineTotal = it.quantity * it.unitPrice;
      const lineVat = lineTotal * (vatRate / 100);
      subtotal += lineTotal;
      vatAmount += lineVat;
    }
    const totalAmount = subtotal + vatAmount;

    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.productReceipt.create({
        data: {
          number,
          supplierId: data.supplierId,
          supplierName: data.supplierName,
          warehouseId: data.warehouseId,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
          contractNo: data.contractNo,
          notes: data.notes,
          vatRate,
          subtotal,
          vatAmount,
          totalAmount,
          status: 'Posted',
          receivedAt: new Date(),
          userId: data.userId,
        },
      });

      for (const it of data.items) {
        const product = await tx.product.findUnique({ where: { id: it.productId } });
        if (!product) throw new BadRequestException(`Product ${it.productId} not found`);

        let batchId: number | null = null;
        if (it.batchNo || it.expiryDate) {
          const batch = await tx.batch.create({
            data: {
              productId: it.productId,
              batchNo: it.batchNo || `${receipt.number}-${it.productId}`,
              manufacturedAt: it.manufacturedAt ? new Date(it.manufacturedAt) : null,
              expiryDate: it.expiryDate ? new Date(it.expiryDate) : null,
              storageLifeDays: it.storageLifeDays || product.storageLifeDays,
              quantity: it.quantity,
              remainingQty: it.quantity,
              costPrice: it.costPrice || it.unitPrice,
              receiptId: receipt.id,
              userId: data.userId,
              status: 'Active',
            },
          });
          batchId = batch.id;
        }

        const lineTotal = it.quantity * it.unitPrice;
        const lineVat = lineTotal * (vatRate / 100);
        await tx.productReceiptItem.create({
          data: {
            receiptId: receipt.id,
            productId: it.productId,
            warehouseId: data.warehouseId,
            batchId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            costPrice: it.costPrice || it.unitPrice,
            vatRate,
            vatAmount: lineVat,
            totalAmount: lineTotal + lineVat,
            expiryDate: it.expiryDate ? new Date(it.expiryDate) : null,
            serialNo: it.serialNo,
          },
        });

        await tx.product.update({
          where: { id: it.productId },
          data: {
            quantityOnHand: { increment: it.quantity },
            costPrice: it.costPrice || it.unitPrice,
          },
        });

        const balance = await tx.stockBalance.upsert({
          where: { warehouseId_productId: { warehouseId: data.warehouseId, productId: it.productId } },
          update: { quantity: { increment: it.quantity } },
          create: { warehouseId: data.warehouseId, productId: it.productId, quantity: it.quantity },
        });

        await tx.stockMovement.create({
          data: {
            warehouseId: data.warehouseId,
            productId: it.productId,
            delta: it.quantity,
            type: 'Receipt' as any,
            reference: `RECEIPT-${receipt.number}`,
            userId: data.userId,
            balance: balance.quantity,
          },
        });
      }

      return this.get(receipt.id);
    });
  }

  private async generateNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.productReceipt.findFirst({
      where: { number: { startsWith: `ПТ-${year}-` } },
      orderBy: { id: 'desc' },
    });
    const lastNum = last ? parseInt(last.number.split('-').pop() || '0') : 0;
    return `ПТ-${year}-${String(lastNum + 1).padStart(6, '0')}`;
  }
}
