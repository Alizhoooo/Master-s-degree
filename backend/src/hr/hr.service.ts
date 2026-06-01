import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  async listEmployees(filters: { department?: string; isActive?: boolean }) {
    return this.prisma.employee.findMany({
      where: { ...filters },
      orderBy: { fullName: 'asc' },
    });
  }

  async getEmployee(id: number) {
    const emp = await this.prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async createEmployee(data: any) {
    return this.prisma.employee.create({ data });
  }

  async updateEmployee(id: number, data: any) {
    return this.prisma.employee.update({ where: { id }, data });
  }

  async fireEmployee(id: number, fireDate: string) {
    return this.prisma.employee.update({
      where: { id },
      data: { isActive: false, fireDate: new Date(fireDate) },
    });
  }

  async listTimesheets(filters: { employeeId?: number; dateFrom?: string; dateTo?: string }) {
    return this.prisma.timesheet.findMany({
      where: {
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.dateFrom || filters.dateTo ? { date: { gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined, lte: filters.dateTo ? new Date(filters.dateTo) : undefined } } : {}),
      },
      include: { employee: { select: { id: true, fullName: true } } },
      orderBy: { date: 'desc' },
      take: 300,
    });
  }

  async upsertTimesheet(employeeId: number, date: string, hours: number, overtime: number, type: string) {
    return this.prisma.timesheet.upsert({
      where: { employeeId_date: { employeeId, date: new Date(date) } },
      update: { hours, overtime, type },
      create: { employeeId, date: new Date(date), hours, overtime, type },
    });
  }

  async listPayroll(period?: string) {
    return this.prisma.payrollEntry.findMany({
      where: period ? { period } : undefined,
      include: { employee: { select: { id: true, fullName: true, position: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async calculatePayroll(period: string, userId: number) {
    const employees = await this.prisma.employee.findMany({ where: { isActive: true } });
    const results: any[] = [];

    for (const emp of employees) {
      const existing = await this.prisma.payrollEntry.findFirst({
        where: { employeeId: emp.id, period },
      });
      if (existing && existing.status === 'Paid') {
        results.push({ employeeId: emp.id, status: 'Skipped', reason: 'Already paid' });
        continue;
      }

      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const timesheets = await this.prisma.timesheet.findMany({
        where: { employeeId: emp.id, date: { gte: startDate, lte: endDate } },
      });

      const totalHours = timesheets.reduce((s: number, t: any) => s + t.hours, 0);
      const totalOvertime = timesheets.reduce((s: number, t: any) => s + t.overtime, 0);
      const baseSalary = emp.salary;
      const overtimePay = totalOvertime * (emp.salary / 160) * 1.5;
      const bonus = 0;
      const tax = (baseSalary + overtimePay) * 0.10;
      const deductions = 0;
      const netPay = baseSalary + overtimePay + bonus - tax - deductions;

      if (existing) {
        const updated = await this.prisma.payrollEntry.update({
          where: { id: existing.id },
          data: { baseSalary, overtime: overtimePay, bonus, deductions, tax, netPay, status: 'Calculated' },
        });
        results.push(updated);
      } else {
        const created = await this.prisma.payrollEntry.create({
          data: { employeeId: emp.id, period, baseSalary, overtime: overtimePay, bonus, deductions, tax, netPay, userId, status: 'Calculated' },
        });
        results.push(created);
      }
    }

    return results;
  }

  async payPayroll(id: number) {
    const entry = await this.prisma.payrollEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Payroll entry not found');
    if (entry.status === 'Paid') throw new BadRequestException('Already paid');
    return this.prisma.payrollEntry.update({
      where: { id },
      data: { status: 'Paid', paidAt: new Date() },
    });
  }
}
