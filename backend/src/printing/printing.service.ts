import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { getRenderer, FORM_REGISTRY } from './print-form.registry';
import { createPdfBuffer } from './renderers/base-form.renderer';
import { PdfLocale } from './renderers/pdf-translations';

@Injectable()
export class PrintingService {
  constructor(private prisma: PrismaService) {}

  async listForms() {
    const forms = await this.prisma.printForm.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return forms.map((f) => ({
      ...f,
      applicableTypes: f.applicableTypes.split(',').map((s) => s.trim()).filter(Boolean),
    }));
  }

  async listFormsForEntity(entityType: string) {
    const forms = await this.prisma.printForm.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    const types = forms.map((f) => f.applicableTypes.split(',').map((s) => s.trim()));
    const matched = forms.filter((f, i) => types[i].includes(entityType));
    return matched.map((f) => ({
      ...f,
      applicableTypes: f.applicableTypes.split(',').map((s) => s.trim()).filter(Boolean),
    }));
  }

  async renderForm(entityType: string, id: number, formCode: string, locale: PdfLocale = 'ru'): Promise<Buffer> {
    const renderer = getRenderer(formCode);
    if (!renderer) {
      throw new NotFoundException(`Print form "${formCode}" not found in registry`);
    }
    const form = await this.prisma.printForm.findUnique({ where: { code: formCode } });
    if (!form) {
      throw new NotFoundException(`Print form "${formCode}" not found in DB`);
    }
    const cfg = await this.prisma.appConfig.findMany();
    const cfgMap: Record<string, string> = {};
    for (const c of cfg) cfgMap[c.key] = c.value;
    const seller = {
      name: cfgMap['companyName'] || 'ТОО "SupplyFlow"',
      inn: cfgMap['inn'],
      kpp: cfgMap['kpp'],
      address: cfgMap['address'],
      bank: cfgMap['bank'],
      account: cfgMap['account'],
      bik: cfgMap['bik'],
      phone: cfgMap['phone'],
      email: cfgMap['email'],
      director: cfgMap['director'],
      accountant: cfgMap['accountant'],
    };

    const ctx = {
      prisma: this.prisma,
      locale,
      currency: cfgMap['currency'] || '₸',
      seller,
    };
    const baseOpts = await renderer.build(ctx, entityType, id);
    return createPdfBuffer(baseOpts);
  }
}
