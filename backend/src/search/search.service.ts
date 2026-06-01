import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string) {
    if (!query || query.length < 2) return { results: [] };

    const [orders, customers, products, documents, employees, contracts] = await Promise.all([
      this.searchOrders(query),
      this.searchCustomers(query),
      this.searchProducts(query),
      this.searchDocuments(query),
      this.searchEmployees(query),
      this.searchContracts(query),
    ]);

    return {
      query,
      results: [
        ...orders,
        ...customers,
        ...products,
        ...documents,
        ...employees,
        ...contracts,
      ],
      counts: {
        orders: orders.length,
        customers: customers.length,
        products: products.length,
        documents: documents.length,
        employees: employees.length,
        contracts: contracts.length,
      },
    };
  }

  private async searchOrders(q: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        OR: [
          { id: isNumeric(q) ? +q : -1 },
          { customer: { company: { contains: q, mode: 'insensitive' } } },
          { customer: { contactPerson: { contains: q, mode: 'insensitive' } } },
          { deliveryAddress: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      include: { customer: true },
    });
    return orders.map((o: any) => ({
      type: 'order',
      id: o.id,
      title: `Тапсырыс #${o.id} — ${o.customer?.company || ''}`,
      subtitle: `${o.status} · ${o.totalAmount} ₸`,
      link: `/orders/${o.id}`,
    }));
  }

  private async searchCustomers(q: string) {
    const customers = await this.prisma.customer.findMany({
      where: {
        OR: [
          { company: { contains: q, mode: 'insensitive' } },
          { contactPerson: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { inn: { contains: q } },
        ],
      },
      take: 10,
    });
    return customers.map((c: any) => ({
      type: 'customer',
      id: c.id,
      title: c.company,
      subtitle: `${c.contactPerson} · ${c.phone}`,
      link: `/customers/${c.id}`,
    }));
  }

  private async searchProducts(q: string) {
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
    return products.map((p: any) => ({
      type: 'product',
      id: p.id,
      title: p.name,
      subtitle: `SKU: ${p.sku} · ${p.quantityOnHand} шт`,
      link: `/inventory`,
    }));
  }

  private async searchDocuments(q: string) {
    const docs = await this.prisma.document.findMany({
      where: {
        OR: [
          { number: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { customer: { company: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 10,
      include: { customer: true },
    });
    return docs.map((d: any) => ({
      type: 'document',
      id: d.id,
      title: d.number,
      subtitle: `${d.type} · ${d.customer?.company || ''} · ${d.posted ? 'Проведен' : 'Не проведен'}`,
      link: `/documents/${d.id}`,
    }));
  }

  private async searchEmployees(q: string) {
    const emps = await this.prisma.employee.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { position: { contains: q, mode: 'insensitive' } },
          { department: { contains: q, mode: 'insensitive' } },
          { inn: { contains: q } },
        ],
      },
      take: 10,
    });
    return emps.map((e: any) => ({
      type: 'employee',
      id: e.id,
      title: e.fullName,
      subtitle: `${e.position} · ${e.department}`,
      link: `/hr/employees/${e.id}`,
    }));
  }

  private async searchContracts(q: string) {
    const contracts = await this.prisma.contract.findMany({
      where: {
        OR: [
          { number: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { customer: { company: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 10,
      include: { customer: true },
    });
    return contracts.map((c: any) => ({
      type: 'contract',
      id: c.id,
      title: c.number,
      subtitle: `${c.customer?.company || ''} · ${c.totalAmount} ₸`,
      link: `/contracts/${c.id}`,
    }));
  }
}

function isNumeric(n: string): boolean {
  return !isNaN(parseFloat(n)) && isFinite(+n);
}
