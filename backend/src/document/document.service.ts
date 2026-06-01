import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  async listDocuments(filters: { type?: string; posted?: boolean; customerId?: number }) {
    return this.prisma.document.findMany({
      where: { ...filters },
      include: { items: { include: { product: true } }, customer: true, _count: { select: { versions: true, approvals: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocument(id: number) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        customer: true,
        contract: true,
        versions: { include: { changedBy: { select: { id: true, fullName: true } } }, orderBy: { version: 'desc' } },
        approvals: { include: { approver: { select: { id: true, fullName: true } } } },
        accountingEntries: { include: { account: true } },
        postedBy: { select: { id: true, fullName: true } },
        unpostedBy: { select: { id: true, fullName: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async createDocument(data: any, userId: number) {
    const number = await this.generateDocumentNumber(data.type);
    const totalAmount = data.items.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice), 0);
    const vatAmount = data.items.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice * (i.vatRate || 0) / 100), 0);

    const doc = await this.prisma.document.create({
      data: {
        number,
        type: data.type,
        customerId: data.customerId,
        contractId: data.contractId,
        description: data.description,
        totalAmount,
        vatAmount,
        createdById: userId,
        items: { create: data.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, vatRate: i.vatRate || 0, vatAmount: i.quantity * i.unitPrice * (i.vatRate || 0) / 100, total: i.quantity * i.unitPrice })) },
        versions: { create: { version: 1, data: data as any, changedById: userId } },
      },
      include: { items: { include: { product: true } } },
    });

    return doc;
  }

  async updateDocument(id: number, data: any, userId: number) {
    const doc = await this.getDocument(id);
    if (doc.posted) throw new BadRequestException('Cannot edit posted document');

    if (data.items) {
      await this.prisma.documentItem.deleteMany({ where: { documentId: id } });
      await this.prisma.documentItem.createMany({
        data: data.items.map((i: any) => ({
          documentId: id,
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          vatRate: i.vatRate || 0,
          vatAmount: i.quantity * i.unitPrice * (i.vatRate || 0) / 100,
          total: i.quantity * i.unitPrice,
        })),
      });
    }

    const totalAmount = data.items ? data.items.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice), 0) : doc.totalAmount;
    const vatAmount = data.items ? data.items.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice * (i.vatRate || 0) / 100), 0) : doc.vatAmount;

    const updated = await this.prisma.document.update({
      where: { id },
      data: { description: data.description, customerId: data.customerId, contractId: data.contractId, totalAmount, vatAmount },
    });

    const lastVersion = await this.prisma.documentVersion.findFirst({
      where: { documentId: id },
      orderBy: { version: 'desc' },
    });
    await this.prisma.documentVersion.create({
      data: { documentId: id, version: (lastVersion?.version || 0) + 1, data: { ...data, items: data.items || doc.items } as any, changedById: userId },
    });

    return updated;
  }

  async postDocument(id: number, userId: number) {
    const doc = await this.getDocument(id);
    if (doc.posted) throw new BadRequestException('Already posted');

    return this.prisma.$transaction(async (tx: any) => {
      const updated = await tx.document.update({
        where: { id },
        data: { posted: true, postedAt: new Date(), postedById: userId },
      });

      if (doc.type === 'Sale' || doc.type === 'CustomerInvoice') {
        for (const item of doc.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantityOnHand: { decrement: item.quantity } },
          });
          await tx.inventoryLog.create({
            data: { productId: item.productId, userId, change: -item.quantity, reason: `Posted document ${doc.number}` },
          });
        }
      } else if (doc.type === 'Purchase' || doc.type === 'SupplierInvoice') {
        for (const item of doc.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantityOnHand: { increment: item.quantity } },
          });
          await tx.inventoryLog.create({
            data: { productId: item.productId, userId, change: item.quantity, reason: `Posted document ${doc.number}` },
          });
        }
      }

      await tx.systemLog.create({
        data: { userId, action: `Document posted`, details: `${doc.type} ${doc.number}` },
      });

      return updated;
    });
  }

  async unpostDocument(id: number, userId: number) {
    const doc = await this.getDocument(id);
    if (!doc.posted) throw new BadRequestException('Not posted');

    return this.prisma.$transaction(async (tx: any) => {
      const updated = await tx.document.update({
        where: { id },
        data: { posted: false, postedAt: null, postedById: null, unpostedById: userId },
      });

      if (doc.type === 'Sale' || doc.type === 'CustomerInvoice') {
        for (const item of doc.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantityOnHand: { increment: item.quantity } },
          });
          await tx.inventoryLog.create({
            data: { productId: item.productId, userId, change: item.quantity, reason: `Unposted document ${doc.number}` },
          });
        }
      } else if (doc.type === 'Purchase' || doc.type === 'SupplierInvoice') {
        for (const item of doc.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantityOnHand: { decrement: item.quantity } },
          });
          await tx.inventoryLog.create({
            data: { productId: item.productId, userId, change: -item.quantity, reason: `Unposted document ${doc.number}` },
          });
        }
      }

      return updated;
    });
  }

  async deleteDocument(id: number) {
    const doc = await this.getDocument(id);
    if (doc.posted) throw new BadRequestException('Cannot delete posted document');
    return this.prisma.document.delete({ where: { id } });
  }

  async listVersions(id: number) {
    return this.prisma.documentVersion.findMany({
      where: { documentId: id },
      include: { changedBy: { select: { id: true, fullName: true } } },
      orderBy: { version: 'desc' },
    });
  }

  async listApprovals(id: number) {
    return this.prisma.documentApproval.findMany({
      where: { documentId: id },
      include: { approver: { select: { id: true, fullName: true } } },
    });
  }

  async requestApproval(documentId: number, approverId: number) {
    return this.prisma.documentApproval.create({
      data: { documentId, approverId, status: 'Pending' },
    });
  }

  async decideApproval(id: number, status: 'Approved' | 'Rejected', comment: string) {
    return this.prisma.documentApproval.update({
      where: { id },
      data: { status, comment, decidedAt: new Date() },
    });
  }

  async addAttachment(documentId: number, filename: string, contentType: string, size: number, data: Buffer) {
    return this.prisma.documentAttachment.create({
      data: { documentId, filename, contentType, size, data },
    });
  }

  async listAttachments(documentId: number) {
    return this.prisma.documentAttachment.findMany({
      where: { documentId },
      select: { id: true, filename: true, contentType: true, size: true, uploadedAt: true },
    });
  }

  async getAttachment(id: number) {
    return this.prisma.documentAttachment.findUnique({ where: { id } });
  }

  private async generateDocumentNumber(type: string): Promise<string> {
    const prefix = type === 'Sale' ? 'SL' : type === 'Purchase' ? 'PR' : type === 'CustomerInvoice' ? 'INV' : type === 'SupplierInvoice' ? 'SIV' : type === 'Receipt' ? 'RC' : type === 'Issue' ? 'IS' : 'DOC';
    const year = new Date().getFullYear();
    const count = await this.prisma.document.count({ where: { number: { startsWith: `${prefix}-${year}` } } });
    return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
