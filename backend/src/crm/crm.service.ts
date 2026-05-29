import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async findAllCustomers() {
    return this.prisma.customer.findMany({
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneCustomer(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: { include: { items: true }, orderBy: { createdAt: 'desc' } },
        contactLogs: { orderBy: { createdAt: 'desc' } },
        complaints: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async createCustomer(dto: { company: string; contactPerson: string; phone: string; email: string; tier?: string }) {
    return this.prisma.customer.create({
      data: {
        company: dto.company,
        contactPerson: dto.contactPerson,
        phone: dto.phone,
        email: dto.email,
        tier: dto.tier || 'Regular',
      },
    });
  }

  async updateCustomer(id: number, dto: { company?: string; contactPerson?: string; phone?: string; email?: string; tier?: string }) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async addContactLog(customerId: number, note: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.contactLog.create({
      data: { customerId, note },
    });
  }

  async createComplaint(dto: { customerId: number; title: string; description: string }) {
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.complaint.create({
      data: {
        customerId: dto.customerId,
        title: dto.title,
        description: dto.description,
      },
    });
  }

  async updateComplaintStatus(id: number, status: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    return this.prisma.complaint.update({
      where: { id },
      data: { status },
    });
  }

  async findAllComplaints() {
    return this.prisma.complaint.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
