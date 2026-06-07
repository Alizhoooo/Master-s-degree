import { PrismaService } from '../common/prisma.service';
import { Column } from './renderers/pdfkit-table';
import { createPdfBuffer, BaseRenderOptions, defaultSeller, partyFromCustomer, partyFromSupplier, partyFromUser } from './renderers/base-form.renderer';
import { formatCurrency, formatDate, formatNumber, numberToWords } from './renderers/pdfkit-helpers';
import { getDict } from './renderers/pdf-translations';

export interface FormContext {
  prisma: PrismaService;
  locale: string;
  currency: string;
  seller?: any;
}

export interface IFormRenderer {
  build(ctx: FormContext, entityType: string, id: number): Promise<BaseRenderOptions>;
}

// ==================== STAGE 1: Sales / Documents ====================

const invoiceForm: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const order = await loadSalesEntity(prisma, entityType, id);
    const totalVat = order.items.reduce((s, i) => s + (i.vatAmount || 0), 0);
    const totalNoVat = order.totalAmount - totalVat;

    return {
      title: d.forms.invoice,
      number: String(order.id),
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: partyFromCustomer(order.customer),
      locale,
      currency,
      columns: [
        { key: 'no', label: d.common.no, width: 30, align: 'center' },
        { key: 'name', label: d.common.name, width: 220, align: 'left' },
        { key: 'sku', label: d.common.sku, width: 70, align: 'left' },
        { key: 'qty', label: d.common.qty, width: 50, align: 'right' },
        { key: 'unit', label: d.common.unit, width: 40, align: 'center' },
        { key: 'price', label: d.common.price, width: 75, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
        { key: 'sum', label: d.common.sum, width: 75, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
      ],
      rows: order.items.map((it, i) => ({
        no: i + 1,
        name: it.product?.name || `Товар #${it.productId}`,
        sku: it.product?.sku || '—',
        qty: it.quantity,
        unit: it.product?.unit || 'шт',
        price: it.unitPrice,
        sum: it.unitPrice * it.quantity,
      })),
      totals: [
        { label: d.totals.subtotal, value: formatCurrency(totalNoVat, currency, localeToIntl(locale)) },
        { label: d.totals.vat, value: formatCurrency(totalVat, currency, localeToIntl(locale)) },
        { label: d.totals.total, value: formatCurrency(order.totalAmount, currency, localeToIntl(locale)), bold: true },
      ],
      footer: `${d.extras.validity}\n${d.totals.sumInWords} ${numberToWords(order.totalAmount, locale)}`,
      signatures: [
        { label: d.signatures.director, value: seller?.director || '_________________' },
        { label: d.signatures.accountant, value: seller?.accountant || '_________________' },
      ],
    };
  },
};

const invoiceVatForm: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const order = await loadSalesEntity(prisma, entityType, id);
    const totalNoVat = order.items.reduce((s, i) => s + (i.unitPrice * i.quantity - (i.vatAmount || 0)), 0);
    const totalVat = order.items.reduce((s, i) => s + (i.vatAmount || 0), 0);

    return {
      title: d.forms.invoiceVat,
      number: `СФ-${String(order.id).padStart(6, '0')}`,
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: partyFromCustomer(order.customer),
      locale,
      currency,
      columns: [
        { key: 'no', label: d.common.no, width: 28, align: 'center' },
        { key: 'name', label: d.common.name, width: 180, align: 'left' },
        { key: 'unit', label: d.common.unit, width: 40, align: 'center' },
        { key: 'qty', label: d.common.qty, width: 40, align: 'right' },
        { key: 'price', label: d.common.price, width: 70, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
        { key: 'noVat', label: d.common.noVat, width: 80, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
        { key: 'vat', label: d.common.vat + ' 12%', width: 60, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
        { key: 'sum', label: d.common.withVat, width: 80, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
      ],
      rows: order.items.map((it, i) => {
        const sum = it.unitPrice * it.quantity;
        const vat = it.vatAmount || (sum * 12) / 112;
        return {
          no: i + 1,
          name: it.product?.name || `Товар #${it.productId}`,
          unit: it.product?.unit || 'шт',
          qty: it.quantity,
          price: it.unitPrice,
          noVat: sum - vat,
          vat,
          sum,
        };
      }),
      totals: [
        { label: d.totals.subtotal, value: formatCurrency(totalNoVat, currency, localeToIntl(locale)) },
        { label: d.totals.vat, value: formatCurrency(totalVat, currency, localeToIntl(locale)) },
        { label: d.totals.total, value: formatCurrency(order.totalAmount, currency, localeToIntl(locale)), bold: true },
      ],
      footer: `${d.totals.sumInWords} ${numberToWords(order.totalAmount, locale)}`,
      signatures: [
        { label: d.signatures.director, value: '_______________' },
        { label: d.signatures.accountant, value: '_______________' },
        { label: d.extras.edIssued, value: formatDate(order.createdAt, localeToIntl(locale)) },
      ],
    };
  },
};

const torg12Form: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const order = await loadSalesEntity(prisma, entityType, id);

    return {
      title: d.forms.torg12,
      number: `ТОРГ-12-${String(order.id).padStart(6, '0')}`,
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: { ...partyFromCustomer(order.customer), address: order.deliveryAddress || partyFromCustomer(order.customer).address },
      locale,
      currency,
      columns: [
        { key: 'no', label: d.common.no, width: 26, align: 'center' },
        { key: 'name', label: d.common.name, width: 200, align: 'left' },
        { key: 'unit', label: d.common.unit, width: 40, align: 'center' },
        { key: 'qty', label: d.common.qty, width: 45, align: 'right' },
        { key: 'price', label: d.common.price, width: 70, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
        { key: 'sum', label: d.common.sum, width: 80, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
      ],
      rows: order.items.map((it, i) => ({
        no: i + 1,
        name: it.product?.name || `Товар #${it.productId}`,
        unit: it.product?.unit || 'шт',
        qty: it.quantity,
        price: it.unitPrice,
        sum: it.unitPrice * it.quantity,
      })),
      totals: [
        { label: d.totals.total, value: formatCurrency(order.totalAmount, currency, localeToIntl(locale)), bold: true },
      ],
      footer: `${d.extras.legalForce}\n${d.totals.sumInWords} ${numberToWords(order.totalAmount, locale)}`,
      copies: 2,
      copyLabel: (n) => n === 1 ? d.common.copySupplier : d.common.copyBuyer,
      signatures: [
        { label: d.signatures.allowedBy, value: seller?.director || '_______________' },
        { label: d.signatures.issued, value: '_______________' },
        { label: d.signatures.receivedBy, value: '_______________' },
        { label: d.signatures.acceptedBy, value: '_______________' },
      ],
    };
  },
};

const updForm: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const order = await loadSalesEntity(prisma, entityType, id);
    const totalVat = order.items.reduce((s, i) => s + (i.vatAmount || 0), 0);
    const totalNoVat = order.totalAmount - totalVat;

    return {
      title: d.forms.upd,
      number: `УПД-${String(order.id).padStart(6, '0')}`,
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: partyFromCustomer(order.customer),
      locale,
      currency,
      columns: [
        { key: 'no', label: d.common.no, width: 26, align: 'center' },
        { key: 'name', label: d.common.name, width: 170, align: 'left' },
        { key: 'unit', label: d.common.unit, width: 36, align: 'center' },
        { key: 'qty', label: d.common.qty, width: 40, align: 'right' },
        { key: 'price', label: d.common.price, width: 65, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
        { key: 'noVat', label: d.common.noVat, width: 70, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
        { key: 'vat', label: d.common.vat, width: 55, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
        { key: 'sum', label: d.common.withVat, width: 70, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
      ],
      rows: order.items.map((it, i) => {
        const sum = it.unitPrice * it.quantity;
        const vat = it.vatAmount || (sum * 12) / 112;
        return {
          no: i + 1,
          name: it.product?.name || `Товар #${it.productId}`,
          unit: it.product?.unit || 'шт',
          qty: it.quantity,
          price: it.unitPrice,
          noVat: sum - vat,
          vat,
          sum,
        };
      }),
      totals: [
        { label: d.totals.subtotal, value: formatCurrency(totalNoVat, currency, localeToIntl(locale)) },
        { label: d.totals.vat, value: formatCurrency(totalVat, currency, localeToIntl(locale)) },
        { label: d.totals.total, value: formatCurrency(order.totalAmount, currency, localeToIntl(locale)), bold: true },
      ],
      footer: `${d.extras.typeSFDOP}\n${d.totals.sumInWords} ${numberToWords(order.totalAmount, locale)}`,
      signatures: [
        { label: `${d.signatures.issued} (${d.party.subSeller})`, value: '_______________' },
        { label: `${d.signatures.acceptedBy} (${d.party.subBuyer})`, value: '_______________' },
      ],
    };
  },
};

const actForm: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const order = await loadSalesEntity(prisma, entityType, id);

    return {
      title: d.forms.act,
      number: `А-${String(order.id).padStart(6, '0')}`,
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: partyFromCustomer(order.customer),
      locale,
      currency,
      columns: [
        { key: 'no', label: d.common.no, width: 28, align: 'center' },
        { key: 'name', label: d.common.name, width: 270, align: 'left' },
        { key: 'qty', label: d.common.qty, width: 50, align: 'right' },
        { key: 'unit', label: d.common.unit, width: 40, align: 'center' },
        { key: 'price', label: d.common.price, width: 70, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
        { key: 'sum', label: d.common.sum, width: 80, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
      ],
      rows: order.items.map((it, i) => ({
        no: i + 1,
        name: it.product?.name || `Услуга #${it.productId}`,
        qty: it.quantity,
        unit: it.product?.unit || 'усл',
        price: it.unitPrice,
        sum: it.unitPrice * it.quantity,
      })),
      totals: [
        { label: d.totals.total, value: formatCurrency(order.totalAmount, currency, localeToIntl(locale)), bold: true },
      ],
      footer: `${d.totals.sumInWords} ${numberToWords(order.totalAmount, locale)}`,
      copies: 2,
      copyLabel: (n) => n === 1 ? d.common.copyExecutor : d.common.copyCustomer,
      signatures: [
        { label: d.signatures.delivered, value: '_______________' },
        { label: d.signatures.accepted, value: '_______________' },
      ],
    };
  },
};

// ==================== STAGE 2: Warehouse ====================

const m4Form: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const receipt = await prisma.productReceipt.findUnique({
      where: { id },
      include: { supplier: true, warehouse: true, user: true, items: { include: { product: true } } },
    });
    if (!receipt) throw new Error(`ProductReceipt ${id} not found`);

    return {
      title: d.forms.m4,
      number: String(receipt.id),
      date: receipt.date,
      seller: seller || defaultSeller(),
      buyer: partyFromSupplier(receipt.supplier),
      locale,
      currency,
      columns: [
        { key: 'no', label: d.common.no, width: 26, align: 'center' },
        { key: 'name', label: d.common.name, width: 220, align: 'left' },
        { key: 'unit', label: d.common.unit, width: 50, align: 'center' },
        { key: 'qty', label: d.common.qty, width: 60, align: 'right' },
        { key: 'price', label: d.common.price, width: 80, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
        { key: 'sum', label: d.common.sum, width: 100, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
      ],
      rows: receipt.items.map((it, i) => ({
        no: i + 1,
        name: it.product?.name || `Товар #${it.productId}`,
        unit: it.product?.unit || 'шт',
        qty: it.quantity,
        price: it.unitPrice,
        sum: it.unitPrice * it.quantity,
      })),
      totals: [
        { label: d.totals.total, value: formatCurrency(receipt.totalAmount, currency, localeToIntl(locale)), bold: true },
      ],
      footer: `${d.extras.receive} ${receipt.warehouse?.name || '—'}. ${formatDate(receipt.date, localeToIntl(locale))}`,
      signatures: [
        { label: d.signatures.issued, value: '_______________' },
        { label: d.signatures.releasedBy, value: '_______________' },
      ],
    };
  },
};

const m11Form: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const issue = await prisma.productIssue.findUnique({
      where: { id },
      include: { warehouse: true, customer: true, user: true, items: { include: { product: true } } },
    });
    if (!issue) throw new Error(`ProductIssue ${id} not found`);

    return {
      title: d.forms.m11,
      number: String(issue.id),
      date: issue.date,
      seller: { name: issue.warehouse?.name || 'Склад', address: issue.warehouse?.address || '—' },
      buyer: issue.customer ? partyFromCustomer(issue.customer) : { name: d.party.inProduction },
      locale,
      currency,
      columns: [
        { key: 'no', label: d.common.no, width: 26, align: 'center' },
        { key: 'name', label: d.common.name, width: 240, align: 'left' },
        { key: 'unit', label: d.common.unit, width: 50, align: 'center' },
        { key: 'qty', label: d.common.qty, width: 70, align: 'right' },
        { key: 'issued', label: d.signatures.releasedBy, width: 70, align: 'right' },
      ],
      rows: issue.items.map((it, i) => ({
        no: i + 1,
        name: it.product?.name || `Товар #${it.productId}`,
        unit: it.product?.unit || 'шт',
        qty: it.quantity,
        issued: it.quantity,
      })),
      totals: [
        { label: d.totals.issueTotal, value: formatNumber(issue.items.reduce((s, it) => s + it.quantity, 0), 0, localeToIntl(locale)) + ' ' + d.extras.units, bold: true },
      ],
      footer: `${d.extras.edIssued} ${formatDate(issue.date, localeToIntl(locale))}. ${d.extras.corrAccount}: ${issue.type || '—'}.`,
      signatures: [
        { label: d.signatures.allowedBy, value: '_______________' },
        { label: d.signatures.releasedBy, value: '_______________' },
        { label: d.signatures.receivedBy, value: '_______________' },
      ],
    };
  },
};

const m15Form: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const transfer = await prisma.productTransfer.findUnique({
      where: { id },
      include: { fromWarehouse: true, toWarehouse: true, user: true, items: { include: { product: true } } },
    });
    if (!transfer) throw new Error(`ProductTransfer ${id} not found`);

    return {
      title: d.forms.m15,
      number: String(transfer.id),
      date: transfer.date,
      seller: { name: transfer.fromWarehouse?.name || 'Склад-отправитель', address: transfer.fromWarehouse?.address || '—' },
      buyer: { name: transfer.toWarehouse?.name || 'Склад-получатель', address: transfer.toWarehouse?.address || '—' },
      locale,
      currency,
      columns: [
        { key: 'no', label: d.common.no, width: 26, align: 'center' },
        { key: 'name', label: d.common.name, width: 230, align: 'left' },
        { key: 'unit', label: d.common.unit, width: 50, align: 'center' },
        { key: 'qty', label: d.common.qty, width: 60, align: 'right' },
        { key: 'price', label: d.common.price, width: 80, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
        { key: 'sum', label: d.common.sum, width: 100, align: 'right', formatter: (v) => formatCurrency(v || 0, currency, localeToIntl(locale)) },
      ],
      rows: transfer.items.map((it, i) => ({
        no: i + 1,
        name: it.product?.name || `Товар #${it.productId}`,
        unit: it.product?.unit || 'шт',
        qty: it.quantity,
        price: it.costPrice || 0,
        sum: (it.costPrice || 0) * it.quantity,
      })),
      totals: [
        { label: d.totals.total, value: formatCurrency(transfer.items.reduce((s, it) => s + (it.costPrice || 0) * it.quantity, 0), currency, localeToIntl(locale)), bold: true },
      ],
      footer: `${d.extras.transferFrom} "${transfer.fromWarehouse?.name || '—'}" ${d.extras.transferTo} "${transfer.toWarehouse?.name || '—'}". ${formatDate(transfer.date, localeToIntl(locale))}.`,
      signatures: [
        { label: d.signatures.releasedBy, value: '_______________' },
        { label: d.signatures.receivedBy, value: '_______________' },
      ],
    };
  },
};

const inv3Form: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const wh = await prisma.warehouse.findUnique({ where: { id } });
    if (!wh) throw new Error(`Warehouse ${id} not found`);
    const balances = await prisma.stockBalance.findMany({
      where: { warehouseId: id },
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    });

    return {
      title: d.forms.inv3,
      number: `ИНВ-${id}`,
      date: new Date(),
      seller: seller || defaultSeller(),
      buyer: { name: wh.name, address: wh.address },
      paperSize: 'A4',
      orientation: 'landscape',
      locale,
      currency,
      columns: [
        { key: 'no', label: d.common.no, width: 28, align: 'center' },
        { key: 'name', label: d.common.name, width: 280, align: 'left' },
        { key: 'unit', label: d.common.unit, width: 50, align: 'center' },
        { key: 'accountQty', label: d.extras.inventory, width: 70, align: 'right' },
        { key: 'factQty', label: d.extras.inventory, width: 70, align: 'right' },
        { key: 'diff', label: '±', width: 80, align: 'right' },
      ],
      rows: balances.map((b, i) => ({
        no: i + 1,
        name: b.product?.name || `Товар #${b.productId}`,
        unit: b.product?.unit || 'шт',
        accountQty: b.quantity,
        factQty: b.quantity,
        diff: 0,
      })),
      totals: [
        { label: d.extras.itemsCount, value: String(balances.length), bold: true },
        { label: d.extras.totalQty, value: formatNumber(balances.reduce((s, b) => s + b.quantity, 0), 0, localeToIntl(locale)) + ' ' + d.extras.units, bold: true },
      ],
      footer: `${d.extras.inventory} "${wh.name}". ${d.signatures.mol}: _________________`,
      signatures: [
        { label: d.signatures.commissionChair, value: '_______________' },
        { label: d.signatures.commissionMember, value: '_______________' },
        { label: d.signatures.commissionMember, value: '_______________' },
        { label: d.signatures.mol, value: '_______________' },
      ],
    };
  },
};

// ==================== STAGE 3: Cash / Bank ====================

const pkoForm: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const order = await prisma.cashOrder.findUnique({
      where: { id },
      include: { register: true, user: true },
    });
    if (!order) throw new Error(`CashOrder ${id} not found`);

    return {
      title: d.forms.pko,
      number: String(order.id),
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: { name: order.counterparty || '—' },
      locale,
      currency,
      columns: [],
      rows: [],
      footer: `${d.extras.basis} ${order.basis || '—'}\n\n${d.totals.sumInWords} ${numberToWords(order.amount, locale)}`,
      signatures: [
        { label: d.signatures.accountant, value: '_______________' },
        { label: `${d.signatures.cashier} (${d.signatures.receivedBy})`, value: '_______________' },
        { label: d.signatures.receivedBy, value: '_______________' },
      ],
    };
  },
};

const rkoForm: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const order = await prisma.cashOrder.findUnique({
      where: { id },
      include: { register: true, user: true },
    });
    if (!order) throw new Error(`CashOrder ${id} not found`);

    return {
      title: d.forms.rko,
      number: String(order.id),
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: { name: order.counterparty || '—' },
      locale,
      currency,
      columns: [],
      rows: [],
      footer: `${d.extras.basis} ${order.basis || '—'}\n\n${d.totals.sumInWords} ${numberToWords(order.amount, locale)}`,
      signatures: [
        { label: d.signatures.director, value: '_______________' },
        { label: d.signatures.accountant, value: '_______________' },
        { label: d.signatures.receivedBy, value: '_______________' },
        { label: `${d.signatures.cashier} (${d.signatures.issued})`, value: '_______________' },
      ],
    };
  },
};

const ko4Form: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const reg = await prisma.cashRegister.findUnique({ where: { id } });
    if (!reg) throw new Error(`CashRegister ${id} not found`);
    const orders = await prisma.cashOrder.findMany({
      where: { registerId: id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      title: d.forms.ko4,
      number: `КО-4-${id}`,
      date: new Date(),
      seller: seller || defaultSeller(),
      buyer: { name: reg.name, address: reg.currency },
      paperSize: 'A4',
      orientation: 'landscape',
      locale,
      currency,
      columns: [
        { key: 'date', label: d.common.date, width: 80, align: 'left', formatter: (v) => formatDate(v, localeToIntl(locale)) },
        { key: 'no', label: '№', width: 80, align: 'left' },
        { key: 'who', label: `${d.party.payer} / ${d.party.payee}`, width: 180, align: 'left' },
        { key: 'corr', label: d.extras.corrAccount, width: 80, align: 'left' },
        { key: 'income', label: d.totals.income, width: 90, align: 'right', formatter: (v) => v ? formatCurrency(v, currency, localeToIntl(locale)) : '' },
        { key: 'expense', label: d.totals.expense, width: 90, align: 'right', formatter: (v) => v ? formatCurrency(v, currency, localeToIntl(locale)) : '' },
      ],
      rows: orders.map((o) => ({
        date: o.createdAt,
        no: String(o.id),
        who: o.counterparty || '—',
        corr: o.basis || '—',
        income: o.type === 'Income' ? o.amount : null,
        expense: o.type === 'Expense' ? o.amount : null,
      })),
      totals: [
        { label: `${d.totals.income}:`, value: formatCurrency(orders.filter((o) => o.type === 'Income').reduce((s, o) => s + o.amount, 0), currency, localeToIntl(locale)), bold: true },
        { label: `${d.totals.expense}:`, value: formatCurrency(orders.filter((o) => o.type === 'Expense').reduce((s, o) => s + o.amount, 0), currency, localeToIntl(locale)), bold: true },
        { label: `${d.totals.balance}:`, value: formatCurrency(reg.balance, currency, localeToIntl(locale)), bold: true },
      ],
      footer: `${d.forms.ko4}. ${d.extras.warehouse}: ${reg.name}. ${d.extras.units}: ${reg.currency || 'KZT'}.`,
      signatures: [
        { label: d.signatures.cashier, value: '_______________' },
        { label: d.signatures.accountant, value: '_______________' },
      ],
    };
  },
};

const paymentOrderForm: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const order = await prisma.bankOrder.findUnique({
      where: { id },
      include: { account: true, user: true },
    });
    if (!order) throw new Error(`BankOrder ${id} not found`);

    return {
      title: d.forms.paymentOrder,
      number: String(order.id),
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: { name: order.counterparty || '—' },
      locale,
      currency,
      columns: [],
      rows: [],
      footer:
        `${d.extras.kindPayment} ${order.type === 'In' ? d.extras.incoming : d.extras.outgoing}\n` +
        `${d.totals.total.replace(':', '')}: ${formatCurrency(order.amount, currency, localeToIntl(locale))}\n` +
        `${d.totals.sumInWords} ${numberToWords(order.amount, locale)}\n` +
        `${d.extras.purpose} ${order.purpose || '—'}\n` +
        `${d.extras.accountShort} ${order.account?.accountNo || '—'} (${order.account?.bankName || '—'}, ${d.extras.bikShort} ${order.account?.bik || '—'})\n` +
        `${d.extras.counterparty} ${order.counterparty || '—'}`,
      signatures: [
        { label: d.signatures.director, value: '_______________' },
        { label: d.signatures.seal, value: '' },
      ],
    };
  },
};

const bankStatementForm: IFormRenderer = {
  async build({ prisma, currency, seller, locale }, entityType, id) {
    const d = getDict(locale);
    const acc = await prisma.bankAccount.findUnique({ where: { id } });
    if (!acc) throw new Error(`BankAccount ${id} not found`);
    const orders = await prisma.bankOrder.findMany({
      where: { accountId: id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      title: d.forms.bankStatement,
      number: `БВ-${id}`,
      date: new Date(),
      seller: seller || defaultSeller(),
      buyer: { name: acc.name, account: acc.accountNo, bank: acc.bankName, bik: acc.bik },
      paperSize: 'A4',
      orientation: 'landscape',
      locale,
      currency,
      columns: [
        { key: 'date', label: d.common.date, width: 80, align: 'left', formatter: (v) => formatDate(v, localeToIntl(locale)) },
        { key: 'no', label: '№', width: 80, align: 'left' },
        { key: 'counterparty', label: d.party.payer, width: 200, align: 'left' },
        { key: 'purpose', label: d.extras.purpose, width: 200, align: 'left' },
        { key: 'debit', label: d.totals.debit, width: 90, align: 'right', formatter: (v) => v ? formatCurrency(v, currency, localeToIntl(locale)) : '' },
        { key: 'credit', label: d.totals.credit, width: 90, align: 'right', formatter: (v) => v ? formatCurrency(v, currency, localeToIntl(locale)) : '' },
      ],
      rows: orders.map((o) => ({
        date: o.createdAt,
        no: String(o.id),
        counterparty: o.counterparty || '—',
        purpose: o.purpose || '—',
        debit: o.type === 'Out' ? o.amount : null,
        credit: o.type === 'In' ? o.amount : null,
      })),
      totals: [
        { label: `${d.totals.debit}:`, value: formatCurrency(orders.filter((o) => o.type === 'Out').reduce((s, o) => s + o.amount, 0), currency, localeToIntl(locale)), bold: true },
        { label: `${d.totals.credit}:`, value: formatCurrency(orders.filter((o) => o.type === 'In').reduce((s, o) => s + o.amount, 0), currency, localeToIntl(locale)), bold: true },
        { label: `${d.totals.balance}:`, value: formatCurrency(acc.balance, currency, localeToIntl(locale)), bold: true },
      ],
      footer: `${d.extras.accountShort} ${acc.accountNo || '—'}. ${d.party.bank}: ${acc.bankName || '—'}. ${d.party.bik}: ${acc.bik || '—'}. ${d.extras.units}: ${acc.currency || 'KZT'}.`,
      signatures: [
        { label: d.signatures.headOfDept, value: '_______________' },
        { label: d.signatures.accountant, value: '_______________' },
      ],
    };
  },
};

function localeToIntl(locale: string): string {
  const lc = (locale || 'ru').toLowerCase();
  if (lc.startsWith('kk')) return 'kk-KZ';
  if (lc.startsWith('en')) return 'en-US';
  return 'ru-RU';
}

interface SalesEntity {
  id: number;
  date: Date;
  createdAt: Date;
  customer: any;
  items: Array<{
    productId: number;
    product: any;
    quantity: number;
    unitPrice: number;
    vatAmount?: number | null;
  }>;
  totalAmount: number;
  deliveryAddress?: string | null;
  description?: string | null;
}

async function loadSalesEntity(prisma: PrismaService, entityType: string, id: number): Promise<SalesEntity> {
  if (entityType === 'Document') {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });
    if (!doc) throw new Error(`Document ${id} not found`);
    if (!doc.items || doc.items.length === 0) {
      throw new Error(`Document ${id} has no line items — cannot generate waybill/invoice`);
    }
    const customer = doc.customer || {
      company: doc.description || `—`,
      contactPerson: null,
      inn: null,
      kpp: null,
      address: null,
      phone: null,
      email: null,
    };
    return {
      id: doc.id,
      date: doc.date,
      createdAt: doc.createdAt,
      customer,
      items: doc.items.map((it) => ({
        productId: it.productId,
        product: it.product,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        vatAmount: it.vatAmount,
      })),
      totalAmount: doc.totalAmount,
      deliveryAddress: null,
      description: doc.description,
    };
  }
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });
  if (!order) throw new Error(`Order ${id} not found`);
  if (!order.items || order.items.length === 0) {
    throw new Error(`Order ${id} has no line items — cannot generate waybill/invoice`);
  }
  const customer = order.customer || {
    company: '—',
    inn: null,
    kpp: null,
    address: null,
    phone: null,
    email: null,
  };
  return {
    id: order.id,
    date: order.createdAt,
    createdAt: order.createdAt,
    customer,
    items: order.items.map((it) => ({
      productId: it.productId,
      product: it.product,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      vatAmount: it.vatAmount,
    })),
    totalAmount: order.totalAmount,
    deliveryAddress: order.deliveryAddress,
  };
}

// ==================== Registry ====================

export const FORM_REGISTRY: Record<string, IFormRenderer> = {
  'invoice': invoiceForm,
  'invoice-vat': invoiceVatForm,
  'torg-12': torg12Form,
  'upd': updForm,
  'act': actForm,
  'm-4': m4Form,
  'm-11': m11Form,
  'm-15': m15Form,
  'inv-3': inv3Form,
  'pko': pkoForm,
  'rko': rkoForm,
  'ko-4': ko4Form,
  'payment-order': paymentOrderForm,
  'bank-statement': bankStatementForm,
};

export function getRenderer(code: string): IFormRenderer | null {
  return FORM_REGISTRY[code] || null;
}
