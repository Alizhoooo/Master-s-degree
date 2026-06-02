import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  }

  async get(id: number) {
    const s = await this.prisma.supplier.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Supplier not found');
    return s;
  }

  create(data: any) {
    return this.prisma.supplier.create({ data });
  }

  async update(id: number, data: any) {
    await this.get(id);
    return this.prisma.supplier.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.get(id);
    return this.prisma.supplier.delete({ where: { id } });
  }

  async receipts(supplierId: number) {
    return this.prisma.productReceipt.findMany({
      where: { supplierId },
      include: { items: { include: { product: true } }, warehouse: true },
      orderBy: { date: 'desc' },
    });
  }
}
