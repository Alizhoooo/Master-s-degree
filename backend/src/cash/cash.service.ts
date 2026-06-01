import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCashRegisterDto, UpdateCashRegisterDto, CreateCashOrderDto } from './dto/cash.dto';

@Injectable()
export class CashService {
  constructor(private prisma: PrismaService) {}

  async listRegisters() {
    return this.prisma.cashRegister.findMany({ orderBy: { name: 'asc' } });
  }

  async getRegister(id: number) {
    const reg = await this.prisma.cashRegister.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Cash register not found');
    return reg;
  }

  async createRegister(dto: CreateCashRegisterDto) {
    return this.prisma.cashRegister.create({ data: dto });
  }

  async updateRegister(id: number, dto: UpdateCashRegisterDto) {
    await this.getRegister(id);
    return this.prisma.cashRegister.update({ where: { id }, data: dto });
  }

  async deleteRegister(id: number) {
    await this.getRegister(id);
    const orders = await this.prisma.cashOrder.count({ where: { registerId: id } });
    if (orders > 0) throw new BadRequestException(`Cannot delete: ${orders} orders exist`);
    return this.prisma.cashRegister.delete({ where: { id } });
  }

  async listOrders(filters: { registerId?: number; type?: string; dateFrom?: string; dateTo?: string }) {
    const where: any = {};
    if (filters.registerId) where.registerId = filters.registerId;
    if (filters.type) where.type = filters.type;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }
    return this.prisma.cashOrder.findMany({
      where,
      include: { register: true, user: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async createOrder(dto: CreateCashOrderDto, userId: number) {
    const register = await this.getRegister(dto.registerId);
    if (!register.isActive) throw new BadRequestException('Register is inactive');

    const delta = dto.type === 'Income' ? dto.amount : -dto.amount;
    const newBalance = register.balance + delta;

    const order = await this.prisma.cashOrder.create({
      data: {
        registerId: dto.registerId,
        type: dto.type,
        amount: dto.amount,
        counterparty: dto.counterparty,
        basis: dto.basis,
        documentId: dto.documentId ? +dto.documentId : null,
        userId,
      },
    });

    await this.prisma.cashRegister.update({
      where: { id: dto.registerId },
      data: { balance: newBalance },
    });

    await this.prisma.systemLog.create({
      data: {
        userId,
        action: `Cash ${dto.type}`,
        details: `Register: ${register.name}, Amount: ${dto.amount}, Balance: ${newBalance}`,
      },
    });

    return order;
  }

  async getRegisterBalance(id: number) {
    const reg = await this.getRegister(id);
    const orders = await this.prisma.cashOrder.findMany({ where: { registerId: id } });
    const income = orders.filter((o: any) => o.type === 'Income').reduce((s: number, o: any) => s + o.amount, 0);
    const expense = orders.filter((o: any) => o.type === 'Expense').reduce((s: number, o: any) => s + o.amount, 0);
    return {
      register: reg,
      income: +income.toFixed(2),
      expense: +expense.toFixed(2),
      balance: reg.balance,
    };
  }
}
