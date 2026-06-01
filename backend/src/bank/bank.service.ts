import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateBankAccountDto, UpdateBankAccountDto, CreateBankOrderDto } from './dto/bank.dto';

@Injectable()
export class BankService {
  constructor(private prisma: PrismaService) {}

  async listAccounts() {
    return this.prisma.bankAccount.findMany({ orderBy: { name: 'asc' } });
  }

  async getAccount(id: number) {
    const acc = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!acc) throw new NotFoundException('Bank account not found');
    return acc;
  }

  async createAccount(dto: CreateBankAccountDto) {
    const existing = await this.prisma.bankAccount.findUnique({ where: { accountNo: dto.accountNo } });
    if (existing) throw new BadRequestException('Account number already exists');
    return this.prisma.bankAccount.create({ data: dto });
  }

  async updateAccount(id: number, dto: UpdateBankAccountDto) {
    await this.getAccount(id);
    return this.prisma.bankAccount.update({ where: { id }, data: dto });
  }

  async deleteAccount(id: number) {
    await this.getAccount(id);
    const orders = await this.prisma.bankOrder.count({ where: { accountId: id } });
    if (orders > 0) throw new BadRequestException(`Cannot delete: ${orders} orders exist`);
    return this.prisma.bankAccount.delete({ where: { id } });
  }

  async listOrders(filters: { accountId?: number; type?: string; status?: string }) {
    const where: any = {};
    if (filters.accountId) where.accountId = filters.accountId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    return this.prisma.bankOrder.findMany({
      where,
      include: { account: true, user: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async createOrder(dto: CreateBankOrderDto, userId: number) {
    const acc = await this.getAccount(dto.accountId);
    if (!acc.isActive) throw new BadRequestException('Account is inactive');

    const delta = dto.type === 'In' ? dto.amount : -dto.amount;
    const newBalance = acc.balance + delta;

    const order = await this.prisma.bankOrder.create({
      data: {
        accountId: dto.accountId,
        type: dto.type,
        amount: dto.amount,
        counterparty: dto.counterparty,
        counterpartyInn: dto.counterpartyInn,
        purpose: dto.purpose,
        documentId: dto.documentId ? +dto.documentId : null,
        userId,
        status: 'Pending',
      },
    });

    await this.prisma.bankAccount.update({
      where: { id: dto.accountId },
      data: { balance: newBalance },
    });

    return order;
  }

  async confirmOrder(id: number, userId: number) {
    const order = await this.prisma.bankOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'Pending') throw new BadRequestException('Order already confirmed');
    return this.prisma.bankOrder.update({ where: { id }, data: { status: 'Completed' } });
  }

  async listStatements(accountId: number) {
    return this.prisma.bankStatement.findMany({
      where: { accountId },
      orderBy: { date: 'desc' },
    });
  }

  async addStatement(accountId: number, date: string, openingBalance: number, closingBalance: number, description: string) {
    const delta = closingBalance - openingBalance;
    const statement = await this.prisma.bankStatement.create({
      data: { accountId, date: new Date(date), openingBalance, closingBalance, description, delta },
    });
    await this.prisma.bankAccount.update({
      where: { id: accountId },
      data: { balance: closingBalance },
    });
    return statement;
  }
}
