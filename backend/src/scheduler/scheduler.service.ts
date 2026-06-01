import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Scheduler');
  private interval: NodeJS.Timeout | null = null;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.interval = setInterval(() => this.checkJobs(), 60_000);
  }

  async onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  async listJobs() {
    return this.prisma.scheduledJob.findMany({ orderBy: { name: 'asc' } });
  }

  async getJob(id: number) {
    return this.prisma.scheduledJob.findUnique({ where: { id } });
  }

  async createJob(data: { name: string; cron: string; handler: string; params?: any; enabled?: boolean }) {
    const nextRunAt = this.computeNextRun(data.cron);
    return this.prisma.scheduledJob.create({
      data: { ...data, params: data.params || null, enabled: data.enabled !== false, nextRunAt },
    });
  }

  async updateJob(id: number, data: any) {
    if (data.cron) data.nextRunAt = this.computeNextRun(data.cron);
    return this.prisma.scheduledJob.update({ where: { id }, data });
  }

  async deleteJob(id: number) {
    return this.prisma.scheduledJob.delete({ where: { id } });
  }

  async runNow(id: number) {
    const job = await this.getJob(id);
    if (!job) throw new Error('Job not found');
    return this.executeJob(job);
  }

  private async checkJobs() {
    const jobs = await this.prisma.scheduledJob.findMany({
      where: { enabled: true, OR: [{ nextRunAt: null }, { nextRunAt: { lte: new Date() } }] },
    });
    for (const job of jobs) {
      await this.executeJob(job);
    }
  }

  private async executeJob(job: any) {
    this.logger.log(`Running job: ${job.name} (${job.handler})`);
    try {
      const result = await this.callHandler(job.handler, job.params);
      await this.prisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: new Date(),
          lastStatus: 'Success',
          lastError: null,
          nextRunAt: this.computeNextRun(job.cron),
        },
      });
      return result;
    } catch (err: any) {
      this.logger.error(`Job ${job.name} failed: ${err.message}`);
      await this.prisma.scheduledJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: new Date(),
          lastStatus: 'Failed',
          lastError: err.message,
          nextRunAt: this.computeNextRun(job.cron),
        },
      });
    }
  }

  private async callHandler(handler: string, params: any) {
    const handlers: Record<string, () => Promise<any>> = {
      closeMonth: async () => this.closeMonth(),
      checkInventory: async () => this.checkInventory(),
      checkOverdueTasks: async () => this.checkOverdueTasks(),
    };
    const fn = handlers[handler];
    if (!fn) throw new Error(`Unknown handler: ${handler}`);
    return fn();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduledCloseMonthCheck() {
    const today = new Date();
    if (today.getDate() === 1) {
      this.logger.log('Triggering monthly close check');
    }
  }

  private async closeMonth() {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
    this.logger.log(`Closing month ${period}`);
    return { period, status: 'closed' };
  }

  private async checkInventory() {
    const products = await this.prisma.product.findMany({
      where: { quantityOnHand: { lte: 5 } },
    });
    for (const p of products) {
      const managers = await this.prisma.user.findMany({ where: { role: 'Manager' } });
      for (const m of managers) {
        await this.prisma.notification.create({
          data: {
            userId: m.id,
            title: 'Низкий остаток',
            message: `Товар "${p.name}" (SKU: ${p.sku}) — остаток: ${p.quantityOnHand}`,
            type: 'warning',
            link: `/inventory`,
          },
        });
      }
    }
    return { checked: products.length };
  }

  private async checkOverdueTasks() {
    const overdue = await this.prisma.task.findMany({
      where: { status: { in: ['New', 'InProgress'] }, dueDate: { lt: new Date() } },
      include: { assignedTo: true },
    });
    for (const t of overdue) {
      await this.prisma.notification.create({
        data: {
          userId: t.assignedToId,
          title: 'Просроченная задача',
          message: `Задача "${t.title}" просрочена`,
          type: 'error',
          link: `/tasks`,
        },
      });
    }
    return { notified: overdue.length };
  }

  private computeNextRun(cron: string): Date {
    const parts = cron.split(' ');
    if (parts.length !== 5) return new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const now = new Date();
    const next = new Date(now);
    next.setSeconds(0, 0);

    const m = minute === '*' ? now.getMinutes() : parseInt(minute);
    const h = hour === '*' ? now.getHours() : parseInt(hour);
    next.setHours(h, m, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  async seedDefaultJobs() {
    const defaults = [
      { name: 'Проверка остатков', cron: '0 9 * * *', handler: 'checkInventory' },
      { name: 'Проверка просроченных задач', cron: '0 8 * * *', handler: 'checkOverdueTasks' },
    ];
    for (const d of defaults) {
      const existing = await this.prisma.scheduledJob.findUnique({ where: { name: d.name } });
      if (!existing) await this.createJob(d);
    }
  }
}
