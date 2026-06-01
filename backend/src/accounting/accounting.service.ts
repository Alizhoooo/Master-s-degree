import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/chart-of-accounts.dto';
import { CreateEntryDto, EntryLineDto } from './dto/accounting-entry.dto';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async listAccounts() {
    return this.prisma.chartOfAccounts.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async getAccount(id: number) {
    const account = await this.prisma.chartOfAccounts.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async createAccount(dto: CreateAccountDto) {
    const existing = await this.prisma.chartOfAccounts.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException(`Account with code ${dto.code} already exists`);
    return this.prisma.chartOfAccounts.create({ data: dto });
  }

  async updateAccount(id: number, dto: UpdateAccountDto) {
    await this.getAccount(id);
    return this.prisma.chartOfAccounts.update({ where: { id }, data: dto });
  }

  async deleteAccount(id: number) {
    await this.getAccount(id);
    const entries = await this.prisma.accountingEntry.count({ where: { accountId: id } });
    if (entries > 0) {
      throw new BadRequestException(`Cannot delete account: ${entries} entries exist`);
    }
    return this.prisma.chartOfAccounts.delete({ where: { id } });
  }

  async createEntry(dto: CreateEntryDto, userId: number) {
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of dto.lines) {
      totalDebit += line.debit;
      totalCredit += line.credit;
    }
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Entry is not balanced: debit=${totalDebit}, credit=${totalCredit}`,
      );
    }

    const period = dto.period || dto.date.substring(0, 7);
    const docNumber = dto.number;

    const entries = await Promise.all(
      dto.lines.map((line: EntryLineDto) =>
        this.prisma.accountingEntry.create({
          data: {
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description || dto.description || docNumber,
            period,
          },
          include: { account: true },
        }),
      ),
    );

    return {
      number: docNumber,
      period,
      lines: entries,
    };
  }

  async listEntries(filters: { period?: string; accountId?: number; dateFrom?: string; dateTo?: string }) {
    const where: any = { AND: [] as any[] };
    if (filters.period) where.AND.push({ period: filters.period });
    if (filters.accountId) where.AND.push({ accountId: filters.accountId });
    if (filters.dateFrom) where.AND.push({ createdAt: { gte: new Date(filters.dateFrom) } });
    if (filters.dateTo) where.AND.push({ createdAt: { lte: new Date(filters.dateTo) } });

    return this.prisma.accountingEntry.findMany({
      where: where.AND.length ? where : undefined,
      include: { account: true, document: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getAccountTurnover(periodFrom: string, periodTo: string) {
    const accounts = await this.prisma.chartOfAccounts.findMany({
      orderBy: { code: 'asc' },
    });

    const entries = await this.prisma.accountingEntry.findMany({
      where: {
        period: { gte: periodFrom, lte: periodTo },
      },
    });

    return accounts.map((acc: any) => {
      const accEntries = entries.filter((e: any) => e.accountId === acc.id);
      const debit = accEntries.reduce((s: number, e: any) => s + e.debit, 0);
      const credit = accEntries.reduce((s: number, e: any) => s + e.credit, 0);
      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: +debit.toFixed(2),
        credit: +credit.toFixed(2),
        balance: +(debit - credit).toFixed(2),
        entriesCount: accEntries.length,
      };
    });
  }

  async getTrialBalance(period: string) {
    const accounts = await this.prisma.chartOfAccounts.findMany({
      orderBy: { code: 'asc' },
    });

    const entries = await this.prisma.accountingEntry.findMany({
      where: { period },
    });

    const openingEntries = await this.prisma.accountingEntry.findMany({
      where: { period: { lt: period } },
    });

    return accounts.map((acc: any) => {
      const accEntries = entries.filter((e: any) => e.accountId === acc.id);
      const accOpening = openingEntries.filter((e: any) => e.accountId === acc.id);

      const openingDebit = accOpening.reduce((s: number, e: any) => s + e.debit, 0);
      const openingCredit = accOpening.reduce((s: number, e: any) => s + e.credit, 0);

      const turnDebit = accEntries.reduce((s: number, e: any) => s + e.debit, 0);
      const turnCredit = accEntries.reduce((s: number, e: any) => s + e.credit, 0);

      const closingDebit = openingDebit + turnDebit;
      const closingCredit = openingCredit + turnCredit;

      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        openingDebit: +openingDebit.toFixed(2),
        openingCredit: +openingCredit.toFixed(2),
        openingBalance: +(openingDebit - openingCredit).toFixed(2),
        turnDebit: +turnDebit.toFixed(2),
        turnCredit: +turnCredit.toFixed(2),
        closingDebit: +closingDebit.toFixed(2),
        closingCredit: +closingCredit.toFixed(2),
        closingBalance: +(closingDebit - closingCredit).toFixed(2),
      };
    });
  }

  async seedStandardPlan() {
    const standardPlan = [
      { code: '1010', name: 'Касса в национальной валюте (KZT)', type: 'Asset', vat: false },
      { code: '1020', name: 'Касса в иностранной валюте', type: 'Asset', vat: false },
      { code: '1030', name: 'Расчетный счет', type: 'Asset', vat: false },
      { code: '1040', name: 'Валютный счет', type: 'Asset', vat: false },
      { code: '1050', name: 'Краткосрочные кредиты', type: 'Asset', vat: false },
      { code: '1100', name: 'Материалы', type: 'Asset', vat: true },
      { code: '1110', name: 'Сырье и материалы', type: 'Asset', vat: true },
      { code: '1120', name: 'Топливо', type: 'Asset', vat: true },
      { code: '1130', name: 'Тара', type: 'Asset', vat: true },
      { code: '1140', name: 'Запасные части', type: 'Asset', vat: true },
      { code: '1200', name: 'Товары', type: 'Asset', vat: true },
      { code: '1300', name: 'Готовая продукция', type: 'Asset', vat: true },
      { code: '1400', name: 'Незавершенное производство', type: 'Asset', vat: false },
      { code: '1500', name: 'Основные средства', type: 'Asset', vat: true },
      { code: '1600', name: 'Нематериальные активы', type: 'Asset', vat: true },
      { code: '1610', name: 'Амортизация ОС', type: 'Asset', vat: false },
      { code: '1700', name: 'Долгосрочные инвестиции', type: 'Asset', vat: false },
      { code: '2010', name: 'Расчеты с поставщиками и подрядчиками', type: 'Liability', vat: false },
      { code: '2020', name: 'Расчеты с покупателями и заказчиками', type: 'Liability', vat: false },
      { code: '2030', name: 'Авансы полученные', type: 'Liability', vat: false },
      { code: '2040', name: 'Краткосрочные кредиты банков', type: 'Liability', vat: false },
      { code: '2050', name: 'Долгосрочные кредиты банков', type: 'Liability', vat: false },
      { code: '2100', name: 'Расчеты по оплате труда', type: 'Liability', vat: false },
      { code: '2110', name: 'Расчеты по социальному страхованию', type: 'Liability', vat: false },
      { code: '2120', name: 'Расчеты по пенсионному обеспечению', type: 'Liability', vat: false },
      { code: '2130', name: 'Расчеты по налогам', type: 'Liability', vat: false },
      { code: '2140', name: 'Расчеты по НДС', type: 'Liability', vat: false },
      { code: '2150', name: 'Расчеты по подоходному налогу', type: 'Liability', vat: false },
      { code: '2160', name: 'Расчеты с подотчетными лицами', type: 'Liability', vat: false },
      { code: '3010', name: 'Уставный капитал', type: 'Equity', vat: false },
      { code: '3020', name: 'Резервный капитал', type: 'Equity', vat: false },
      { code: '3030', name: 'Нераспределенная прибыль', type: 'Equity', vat: false },
      { code: '3040', name: 'Дополнительный капитал', type: 'Equity', vat: false },
      { code: '4010', name: 'Доход от реализации продукции', type: 'Income', vat: true },
      { code: '4020', name: 'Доход от реализации товаров', type: 'Income', vat: true },
      { code: '4030', name: 'Доход от оказания услуг', type: 'Income', vat: true },
      { code: '4040', name: 'Прочие доходы', type: 'Income', vat: false },
      { code: '4050', name: 'Внереализационные доходы', type: 'Income', vat: false },
      { code: '5010', name: 'Себестоимость реализованной продукции', type: 'Expense', vat: false },
      { code: '5020', name: 'Себестоимость реализованных товаров', type: 'Expense', vat: false },
      { code: '5030', name: 'Расходы на оплату труда', type: 'Expense', vat: false },
      { code: '5040', name: 'Отчисления на социальное страхование', type: 'Expense', vat: false },
      { code: '5050', name: 'Амортизация', type: 'Expense', vat: false },
      { code: '5060', name: 'Материальные расходы', type: 'Expense', vat: false },
      { code: '5070', name: 'Командировочные расходы', type: 'Expense', vat: false },
      { code: '5080', name: 'Арендная плата', type: 'Expense', vat: false },
      { code: '5090', name: 'Прочие расходы', type: 'Expense', vat: false },
      { code: '5100', name: 'Налог на прибыль', type: 'Expense', vat: false },
      { code: '5110', name: 'Административные расходы', type: 'Expense', vat: false },
      { code: '5120', name: 'Расходы на рекламу', type: 'Expense', vat: false },
    ];

    const result = { created: 0, skipped: 0 };
    for (const acc of standardPlan) {
      const existing = await this.prisma.chartOfAccounts.findUnique({ where: { code: acc.code } });
      if (existing) {
        result.skipped++;
        continue;
      }
      await this.prisma.chartOfAccounts.create({ data: acc });
      result.created++;
    }
    return result;
  }
}
