import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ConfiguratorService {
  constructor(private prisma: PrismaService) {}

  async listObjects(kind?: string) {
    return this.prisma.configObject.findMany({
      where: kind ? { kind } : undefined,
      orderBy: [{ kind: 'asc' }, { name: 'asc' }],
    });
  }

  async getObject(id: number) {
    const obj = await this.prisma.configObject.findUnique({ where: { id } });
    if (!obj) throw new NotFoundException('Config object not found');
    return obj;
  }

  async createObject(data: { kind: string; name: string; description?: string; schema: any }) {
    return this.prisma.configObject.create({
      data: {
        kind: data.kind,
        name: data.name,
        description: data.description,
        schema: data.schema,
        version: 1,
        isActive: true,
      },
    });
  }

  async updateObject(id: number, data: any) {
    const obj = await this.getObject(id);
    return this.prisma.configObject.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        schema: data.schema,
        version: obj.version + 1,
      },
    });
  }

  async deleteObject(id: number) {
    return this.prisma.configObject.delete({ where: { id } });
  }

  async activateObject(id: number) {
    await this.prisma.configObject.updateMany({ where: { kind: (await this.getObject(id)).kind, isActive: true, NOT: { id } }, data: { isActive: false } });
    return this.prisma.configObject.update({ where: { id }, data: { isActive: true } });
  }

  async listPrintTemplates(documentType?: string) {
    return this.prisma.printTemplate.findMany({
      where: documentType ? { documentType } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async getPrintTemplate(id: number) {
    return this.prisma.printTemplate.findUnique({ where: { id } });
  }

  async createPrintTemplate(data: { name: string; documentType: string; template: any; isDefault?: boolean }) {
    if (data.isDefault) {
      await this.prisma.printTemplate.updateMany({ where: { documentType: data.documentType, isDefault: true }, data: { isDefault: false } });
    }
    return this.prisma.printTemplate.create({ data });
  }

  async updatePrintTemplate(id: number, data: any) {
    if (data.isDefault) {
      const t = await this.getPrintTemplate(id);
      if (t) {
        await this.prisma.printTemplate.updateMany({ where: { documentType: t.documentType, isDefault: true, NOT: { id } }, data: { isDefault: false } });
      }
    }
    return this.prisma.printTemplate.update({ where: { id }, data });
  }

  async deletePrintTemplate(id: number) {
    return this.prisma.printTemplate.delete({ where: { id } });
  }

  async exportConfig() {
    const [objects, templates, appConfig] = await Promise.all([
      this.prisma.configObject.findMany(),
      this.prisma.printTemplate.findMany(),
      this.prisma.appConfig.findMany(),
    ]);
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      objects,
      templates,
      appConfig,
    };
  }

  async renderPrintTemplate(templateId: number, data: any): Promise<Buffer> {
    const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
    const tpl = await this.getPrintTemplate(templateId);
    if (!tpl) throw new NotFoundException('Print template not found');

    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    const ctx = {
      date: new Date().toLocaleDateString('ru-RU'),
      number: data.number || '—',
      ...data,
    };

    const template = typeof tpl.template === 'string' ? JSON.parse(tpl.template) : tpl.template;
    const fields = template.fields || [];
    const title = template.title || tpl.name;

    page.drawText(title, { x: 50, y: 780, size: 18, font: boldFont, color: rgb(0.1, 0.1, 0.4) });
    page.drawText(`Дата: ${ctx.date}    №: ${ctx.number}`, {
      x: 50, y: 755, size: 10, font, color: rgb(0.3, 0.3, 0.3),
    });
    page.drawLine({
      start: { x: 50, y: 745 }, end: { x: 545, y: 745 },
      thickness: 1, color: rgb(0.7, 0.7, 0.7),
    });

    let y = 720;
    const lineHeight = 18;
    for (const field of fields) {
      if (y < 60) {
        const newPage = doc.addPage([595, 842]);
        y = 780;
      }
      const label = field.label + ':';
      const value = this.resolveValue(ctx, field.value);
      page.drawText(label, { x: 50, y, size: 10, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(String(value), {
        x: 200, y, size: 10, font, color: rgb(0, 0, 0), maxWidth: 340,
      });
      y -= lineHeight;
    }

    if (template.showItems && Array.isArray(ctx.items)) {
      y -= 10;
      page.drawText('Товары/услуги:', { x: 50, y, size: 12, font: boldFont });
      y -= 20;
      page.drawText('№', { x: 50, y, size: 9, font: boldFont });
      page.drawText('Наименование', { x: 80, y, size: 9, font: boldFont });
      page.drawText('Кол-во', { x: 350, y, size: 9, font: boldFont });
      page.drawText('Цена', { x: 410, y, size: 9, font: boldFont });
      page.drawText('Сумма', { x: 470, y, size: 9, font: boldFont });
      y -= 12;
      page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5 });
      y -= 12;

      let total = 0;
      for (let i = 0; i < ctx.items.length; i++) {
        const it = ctx.items[i];
        if (y < 60) break;
        const sum = (it.quantity || 0) * (it.price || 0);
        total += sum;
        page.drawText(String(i + 1), { x: 50, y, size: 9, font });
        page.drawText(String(it.name || '').substring(0, 40), { x: 80, y, size: 9, font });
        page.drawText(String(it.quantity || 0), { x: 350, y, size: 9, font });
        page.drawText(String(it.price?.toFixed(2) || '0.00'), { x: 410, y, size: 9, font });
        page.drawText(sum.toFixed(2), { x: 470, y, size: 9, font });
        y -= 14;
      }
      y -= 10;
      page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5 });
      y -= 14;
      page.drawText(`ИТОГО: ${total.toFixed(2)} ₸`, {
        x: 350, y, size: 12, font: boldFont, color: rgb(0.1, 0.1, 0.4),
      });
    }

    if (template.footer) {
      page.drawText(template.footer, {
        x: 50, y: 30, size: 8, font, color: rgb(0.4, 0.4, 0.4),
      });
    }

    page.drawText('Документ сформирован программой SupplyFlow BPM 1C-style', {
      x: 50, y: 15, size: 7, font, color: rgb(0.6, 0.6, 0.6),
    });

    return Buffer.from(await doc.save());
  }

  private resolveValue(ctx: any, value: any): any {
    if (typeof value !== 'string') return value;
    const match = value.match(/^\{\{(.+)\}\}$/);
    if (!match) return value;
    const path = match[1].trim();
    return path.split('.').reduce((o: any, k: string) => (o != null ? o[k] : undefined), ctx) ?? '—';
  }
}
