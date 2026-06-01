import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ProductionService {
  constructor(private prisma: PrismaService) {}

  async listWorkshops() {
    return this.prisma.workshop.findMany({
      include: { head: { select: { id: true, fullName: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createWorkshop(name: string, headId?: number) {
    return this.prisma.workshop.create({ data: { name, headId } });
  }

  async updateWorkshop(id: number, data: { name?: string; headId?: number }) {
    return this.prisma.workshop.update({ where: { id }, data });
  }

  async deleteWorkshop(id: number) {
    return this.prisma.workshop.delete({ where: { id } });
  }

  async listTechCards() {
    return this.prisma.techCard.findMany({
      include: {
        outputProduct: true,
        inputs: { include: { product: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getTechCard(id: number) {
    const tc = await this.prisma.techCard.findUnique({
      where: { id },
      include: {
        outputProduct: true,
        inputs: { include: { product: true } },
        productionOrders: { include: { workshop: true, outputs: { include: { product: true } } } },
      },
    });
    if (!tc) throw new NotFoundException('Tech card not found');
    return tc;
  }

  async createTechCard(data: { name: string; outputProductId: number; outputQuantity: number; inputs: { productId: number; quantity: number; waste?: number }[] }) {
    return this.prisma.techCard.create({
      data: {
        name: data.name,
        outputProductId: data.outputProductId,
        outputQuantity: data.outputQuantity,
        inputs: {
          create: data.inputs.map((i) => ({ productId: i.productId, quantity: i.quantity, waste: i.waste || 0 })),
        },
      },
      include: { inputs: { include: { product: true } } },
    });
  }

  async updateTechCard(id: number, data: { name?: string; outputQuantity?: number; inputs?: { productId: number; quantity: number; waste?: number }[] }) {
    const tc = await this.getTechCard(id);
    if (data.inputs) {
      await this.prisma.productBomInput.deleteMany({ where: { techCardId: id } });
      await this.prisma.productBomInput.createMany({
        data: data.inputs.map((i) => ({ techCardId: id, productId: i.productId, quantity: i.quantity, waste: i.waste || 0 })),
      });
    }
    return this.prisma.techCard.update({
      where: { id },
      data: { name: data.name, outputQuantity: data.outputQuantity },
      include: { inputs: { include: { product: true } } },
    });
  }

  async deleteTechCard(id: number) {
    return this.prisma.techCard.delete({ where: { id } });
  }

  async listProductionOrders(filters: { workshopId?: number; status?: string }) {
    return this.prisma.productionOrder.findMany({
      where: { ...filters },
      include: { techCard: { include: { outputProduct: true } }, workshop: true, outputs: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProductionOrder(data: { techCardId: number; workshopId: number; quantity: number; plannedDate: string }) {
    const tc = await this.getTechCard(data.techCardId);
    const number = await this.generateProductionNumber();
    return this.prisma.productionOrder.create({
      data: {
        number,
        techCardId: data.techCardId,
        workshopId: data.workshopId,
        quantity: data.quantity,
        plannedDate: new Date(data.plannedDate),
        status: 'Planned',
      },
    });
  }

  async startProduction(id: number) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
      include: { techCard: { include: { inputs: true } } },
    });
    if (!order) throw new NotFoundException('Production order not found');
    if (order.status !== 'Planned') throw new BadRequestException('Already started');

    for (const input of order.techCard.inputs) {
      const totalNeeded = input.quantity * order.quantity;
      const stockBalances = await this.prisma.stockBalance.findMany({
        where: { productId: input.productId, quantity: { gte: totalNeeded } },
      });
      if (stockBalances.length === 0) {
        throw new BadRequestException(`Insufficient stock for product ${input.productId}`);
      }
    }

    return this.prisma.productionOrder.update({ where: { id }, data: { status: 'InProgress' } });
  }

  async completeProduction(id: number) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
      include: { techCard: { include: { inputs: true, outputProduct: true } } },
    });
    if (!order) throw new NotFoundException('Production order not found');
    if (order.status !== 'InProgress') throw new BadRequestException('Not in progress');

    const cost = order.techCard.inputs.reduce((s: number, i: any) => s + i.quantity * order.quantity * 0.7, 0);

    return this.prisma.$transaction(async (tx: any) => {
      for (const input of order.techCard.inputs) {
        const totalNeeded = input.quantity * order.quantity;
        const balance = await tx.stockBalance.findFirst({
          where: { productId: input.productId, quantity: { gte: totalNeeded } },
        });
        if (!balance) throw new BadRequestException(`Insufficient stock for product ${input.productId}`);
        await tx.stockBalance.update({
          where: { warehouseId_productId: { warehouseId: balance.warehouseId, productId: input.productId } },
          data: { quantity: { decrement: totalNeeded } },
        });
        await tx.stockMovement.create({
          data: { warehouseId: balance.warehouseId, productId: input.productId, delta: -totalNeeded, reason: `Production order ${order.number}` },
        });
      }

      const mainWarehouse = await tx.warehouse.findFirst({ where: { isMain: true } });
      if (mainWarehouse) {
        const outputQty = order.quantity * order.techCard.outputQuantity;
        await tx.stockBalance.upsert({
          where: { warehouseId_productId: { warehouseId: mainWarehouse.id, productId: order.techCard.outputProductId } },
          update: { quantity: { increment: outputQty } },
          create: { warehouseId: mainWarehouse.id, productId: order.techCard.outputProductId, quantity: outputQty },
        });
        await tx.stockMovement.create({
          data: { warehouseId: mainWarehouse.id, productId: order.techCard.outputProductId, delta: outputQty, reason: `Production order ${order.number}` },
        });
      }

      await tx.productionOutput.create({
        data: { productionOrderId: id, productId: order.techCard.outputProductId, quantity: order.quantity * order.techCard.outputQuantity, cost },
      });

      return tx.productionOrder.update({
        where: { id },
        data: { status: 'Completed', finishedDate: new Date() },
      });
    });
  }

  private async generateProductionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.productionOrder.count({ where: { number: { startsWith: `PP-${year}` } } });
    return `PP-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
