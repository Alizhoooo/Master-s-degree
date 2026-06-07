import { PrismaService } from '../common/prisma.service';
import { Column } from './renderers/pdfkit-table';
import { createPdfBuffer, BaseRenderOptions, defaultSeller, partyFromCustomer, partyFromSupplier, partyFromUser } from './renderers/base-form.renderer';
import { formatCurrency, formatDate, formatNumber, numberToWords } from './renderers/pdfkit-helpers';

export interface FormContext {
  prisma: PrismaService;
  locale: string;
  currency: string;
  seller?: any;
}

export interface IFormRenderer {
  build(ctx: FormContext, id: number): Promise<BaseRenderOptions>;
}

// ==================== STAGE 1: Sales / Documents ====================

const invoiceForm: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true, user: true, items: { include: { product: true } } },
    });
    if (!order) throw new Error(`Order ${id} not found`);
    const totalVat = order.items.reduce((s, i) => s + (i.vatAmount || 0), 0);
    const totalNoVat = order.totalAmount - totalVat;

    return {
      title: 'СЧЁТ НА ОПЛАТУ',
      number: String(order.id),
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: partyFromCustomer(order.customer),
      columns: [
        { key: 'no', label: '№', width: 30, align: 'center' },
        { key: 'name', label: 'Наименование', width: 220, align: 'left' },
        { key: 'sku', label: 'Артикул', width: 70, align: 'left' },
        { key: 'qty', label: 'Кол-во', width: 50, align: 'right' },
        { key: 'unit', label: 'Ед.', width: 40, align: 'center' },
        { key: 'price', label: 'Цена', width: 75, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
        { key: 'sum', label: 'Сумма', width: 75, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
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
        { label: 'Итого без НДС:', value: formatCurrency(totalNoVat, currency) },
        { label: 'НДС (12%):', value: formatCurrency(totalVat, currency) },
        { label: 'Итого с НДС:', value: formatCurrency(order.totalAmount, currency), bold: true },
      ],
      footer: `Счёт действителен в течение 5 (пяти) банковских дней.\nСумма прописью: ${numberToWords(order.totalAmount)}`,
      signatures: [
        { label: 'Руководитель', value: seller?.director || '_________________' },
        { label: 'Главный бухгалтер', value: seller?.accountant || '_________________' },
      ],
    };
  },
};

const invoiceVatForm: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } } },
    });
    if (!order) throw new Error(`Order ${id} not found`);
    const totalNoVat = order.items.reduce((s, i) => s + (i.unitPrice * i.quantity - (i.vatAmount || 0)), 0);
    const totalVat = order.items.reduce((s, i) => s + (i.vatAmount || 0), 0);

    return {
      title: 'СЧЁТ-ФАКТУРА',
      number: `СФ-${String(order.id).padStart(6, '0')}`,
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: partyFromCustomer(order.customer),
      columns: [
        { key: 'no', label: '№ п/п', width: 28, align: 'center' },
        { key: 'name', label: 'Наименование товара (работ, услуг)', width: 180, align: 'left' },
        { key: 'unit', label: 'Ед. изм.', width: 40, align: 'center' },
        { key: 'qty', label: 'Кол-во', width: 40, align: 'right' },
        { key: 'price', label: 'Цена за ед.', width: 70, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
        { key: 'noVat', label: 'Стоимость без НДС', width: 80, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
        { key: 'vat', label: 'НДС 12%', width: 60, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
        { key: 'sum', label: 'Стоимость с НДС', width: 80, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
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
        { label: 'Итого без НДС:', value: formatCurrency(totalNoVat, currency) },
        { label: 'НДС (12%):', value: formatCurrency(totalVat, currency) },
        { label: 'Всего с НДС:', value: formatCurrency(order.totalAmount, currency), bold: true },
      ],
      footer: `Сумма прописью: ${numberToWords(order.totalAmount)}`,
      signatures: [
        { label: 'Руководитель организации (подпись)', value: '_______________' },
        { label: 'Главный бухгалтер (подпись)', value: '_______________' },
        { label: 'Дата отпуска', value: formatDate(order.createdAt) },
      ],
    };
  },
};

const torg12Form: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true, user: true, items: { include: { product: true } } },
    });
    if (!order) throw new Error(`Order ${id} not found`);

    return {
      title: 'ТОВАРНАЯ НАКЛАДНАЯ',
      number: `ТОРГ-12-${String(order.id).padStart(6, '0')}`,
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: { ...partyFromCustomer(order.customer), address: order.deliveryAddress || partyFromCustomer(order.customer).address },
      columns: [
        { key: 'no', label: '№', width: 26, align: 'center' },
        { key: 'name', label: 'Наименование товара', width: 200, align: 'left' },
        { key: 'unit', label: 'Ед. изм.', width: 40, align: 'center' },
        { key: 'qty', label: 'Кол-во', width: 45, align: 'right' },
        { key: 'price', label: 'Цена', width: 70, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
        { key: 'sum', label: 'Сумма', width: 80, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
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
        { label: 'Итого:', value: formatCurrency(order.totalAmount, currency), bold: true },
      ],
      footer: `Товарная накладная имеет юридическую силу при наличии подписей и печати.\nСумма прописью: ${numberToWords(order.totalAmount)}`,
      copies: 2,
      copyLabel: (n) => n === 1 ? 'Экземпляр поставщика' : 'Экземпляр покупателя',
      signatures: [
        { label: 'Отпуск разрешил', value: seller?.director || '_______________' },
        { label: 'Сдал (отпуск произвёл)', value: '_______________' },
        { label: 'Груз получил', value: '_______________' },
        { label: 'Груз принял', value: '_______________' },
      ],
    };
  },
};

const updForm: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } } },
    });
    if (!order) throw new Error(`Order ${id} not found`);
    const totalVat = order.items.reduce((s, i) => s + (i.vatAmount || 0), 0);
    const totalNoVat = order.totalAmount - totalVat;

    return {
      title: 'УНИВЕРСАЛЬНЫЙ ПЕРЕДАТОЧНЫЙ ДОКУМЕНТ',
      number: `УПД-${String(order.id).padStart(6, '0')}`,
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: partyFromCustomer(order.customer),
      columns: [
        { key: 'no', label: '№', width: 26, align: 'center' },
        { key: 'name', label: 'Наименование', width: 170, align: 'left' },
        { key: 'unit', label: 'Ед.', width: 36, align: 'center' },
        { key: 'qty', label: 'Кол-во', width: 40, align: 'right' },
        { key: 'price', label: 'Цена', width: 65, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
        { key: 'noVat', label: 'Без НДС', width: 70, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
        { key: 'vat', label: 'НДС', width: 55, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
        { key: 'sum', label: 'С НДС', width: 70, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
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
        { label: 'Итого без НДС:', value: formatCurrency(totalNoVat, currency) },
        { label: 'НДС (12%):', value: formatCurrency(totalVat, currency) },
        { label: 'Всего с НДС:', value: formatCurrency(order.totalAmount, currency), bold: true },
      ],
      footer: 'Статус: 1 (СЧФДОП — счёт-фактура и передаточный документ).\nСумма прописью: ' + numberToWords(order.totalAmount),
      signatures: [
        { label: 'Сдал (продавец)', value: '_______________' },
        { label: 'Принял (покупатель)', value: '_______________' },
      ],
    };
  },
};

const actForm: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } } },
    });
    if (!order) throw new Error(`Order ${id} not found`);

    return {
      title: 'АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)',
      number: `А-${String(order.id).padStart(6, '0')}`,
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: partyFromCustomer(order.customer),
      columns: [
        { key: 'no', label: '№', width: 28, align: 'center' },
        { key: 'name', label: 'Наименование работ (услуг)', width: 270, align: 'left' },
        { key: 'qty', label: 'Кол-во', width: 50, align: 'right' },
        { key: 'unit', label: 'Ед.', width: 40, align: 'center' },
        { key: 'price', label: 'Цена', width: 70, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
        { key: 'sum', label: 'Сумма', width: 80, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
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
        { label: 'Итого:', value: formatCurrency(order.totalAmount, currency), bold: true },
      ],
      footer: `Сумма прописью: ${numberToWords(order.totalAmount)}`,
      copies: 2,
      copyLabel: (n) => n === 1 ? 'Экземпляр исполнителя' : 'Экземпляр заказчика',
      signatures: [
        { label: 'Работы сдал (исполнитель)', value: '_______________' },
        { label: 'Работы принял (заказчик)', value: '_______________' },
      ],
    };
  },
};

// ==================== STAGE 2: Warehouse ====================

const m4Form: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const receipt = await prisma.productReceipt.findUnique({
      where: { id },
      include: { supplier: true, warehouse: true, user: true, items: { include: { product: true } } },
    });
    if (!receipt) throw new Error(`ProductReceipt ${id} not found`);

    return {
      title: 'ПРИХОДНЫЙ ОРДЕР (М-4)',
      number: String(receipt.id),
      date: receipt.date,
      seller: seller || defaultSeller(),
      buyer: partyFromSupplier(receipt.supplier),
      columns: [
        { key: 'no', label: '№', width: 26, align: 'center' },
        { key: 'name', label: 'Наименование товара', width: 220, align: 'left' },
        { key: 'unit', label: 'Ед. изм.', width: 50, align: 'center' },
        { key: 'qty', label: 'Кол-во', width: 60, align: 'right' },
        { key: 'price', label: 'Цена', width: 80, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
        { key: 'sum', label: 'Сумма', width: 100, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
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
        { label: 'Итого:', value: formatCurrency(receipt.totalAmount, currency), bold: true },
      ],
      footer: `Принял на склад: ${receipt.warehouse?.name || '—'}. Дата приёмки: ${formatDate(receipt.date)}`,
      signatures: [
        { label: 'Сдал (экспедитор)', value: '_______________' },
        { label: 'Принял (зав. складом)', value: '_______________' },
      ],
    };
  },
};

const m11Form: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const issue = await prisma.productIssue.findUnique({
      where: { id },
      include: { warehouse: true, customer: true, user: true, items: { include: { product: true } } },
    });
    if (!issue) throw new Error(`ProductIssue ${id} not found`);

    return {
      title: 'ТРЕБОВАНИЕ-НАКЛАДНАЯ (М-11)',
      number: String(issue.id),
      date: issue.date,
      seller: { name: issue.warehouse?.name || 'Склад', address: issue.warehouse?.address || '—' },
      buyer: issue.customer ? partyFromCustomer(issue.customer) : { name: issue.type || 'Производственное подразделение' },
      columns: [
        { key: 'no', label: '№', width: 26, align: 'center' },
        { key: 'name', label: 'Наименование', width: 240, align: 'left' },
        { key: 'unit', label: 'Ед. изм.', width: 50, align: 'center' },
        { key: 'qty', label: 'Затребовано', width: 70, align: 'right' },
        { key: 'issued', label: 'Отпущено', width: 70, align: 'right' },
      ],
      rows: issue.items.map((it, i) => ({
        no: i + 1,
        name: it.product?.name || `Товар #${it.productId}`,
        unit: it.product?.unit || 'шт',
        qty: it.quantity,
        issued: it.quantity,
      })),
      totals: [
        { label: 'Итого отпущено:', value: formatNumber(issue.items.reduce((s, it) => s + it.quantity, 0), 0) + ' ед.', bold: true },
      ],
      footer: `Дата отпуска: ${formatDate(issue.date)}. Корреспонденция счёта: ${issue.type || '—'}.`,
      signatures: [
        { label: 'Разрешил', value: '_______________' },
        { label: 'Отпустил (зав. складом)', value: '_______________' },
        { label: 'Получил', value: '_______________' },
      ],
    };
  },
};

const m15Form: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const transfer = await prisma.productTransfer.findUnique({
      where: { id },
      include: { fromWarehouse: true, toWarehouse: true, user: true, items: { include: { product: true } } },
    });
    if (!transfer) throw new Error(`ProductTransfer ${id} not found`);

    return {
      title: 'НАКЛАДНАЯ НА ВНУТРЕННЕЕ ПЕРЕМЕЩЕНИЕ (М-15)',
      number: String(transfer.id),
      date: transfer.date,
      seller: { name: transfer.fromWarehouse?.name || 'Склад-отправитель', address: transfer.fromWarehouse?.address || '—' },
      buyer: { name: transfer.toWarehouse?.name || 'Склад-получатель', address: transfer.toWarehouse?.address || '—' },
      columns: [
        { key: 'no', label: '№', width: 26, align: 'center' },
        { key: 'name', label: 'Наименование', width: 230, align: 'left' },
        { key: 'unit', label: 'Ед. изм.', width: 50, align: 'center' },
        { key: 'qty', label: 'Кол-во', width: 60, align: 'right' },
        { key: 'price', label: 'Цена', width: 80, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
        { key: 'sum', label: 'Сумма', width: 100, align: 'right', formatter: (v) => formatCurrency(v || 0, currency) },
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
        { label: 'Итого:', value: formatCurrency(transfer.items.reduce((s, it) => s + (it.costPrice || 0) * it.quantity, 0), currency), bold: true },
      ],
      footer: `Перемещение со склада "${transfer.fromWarehouse?.name || '—'}" на склад "${transfer.toWarehouse?.name || '—'}". Дата: ${formatDate(transfer.date)}.`,
      signatures: [
        { label: 'Отпустил (зав. складом)', value: '_______________' },
        { label: 'Принял (получатель)', value: '_______________' },
      ],
    };
  },
};

const inv3Form: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const wh = await prisma.warehouse.findUnique({ where: { id } });
    if (!wh) throw new Error(`Warehouse ${id} not found`);
    const balances = await prisma.stockBalance.findMany({
      where: { warehouseId: id },
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    });

    return {
      title: 'ИНВЕНТАРИЗАЦИОННАЯ ОПИСЬ (ИНВ-3)',
      number: `ИНВ-${id}`,
      date: new Date(),
      seller: seller || defaultSeller(),
      buyer: { name: wh.name, address: wh.address },
      paperSize: 'A4',
      orientation: 'landscape',
      columns: [
        { key: 'no', label: '№', width: 28, align: 'center' },
        { key: 'name', label: 'Наименование', width: 280, align: 'left' },
        { key: 'unit', label: 'Ед.', width: 50, align: 'center' },
        { key: 'accountQty', label: 'По учёту', width: 70, align: 'right' },
        { key: 'factQty', label: 'Фактически', width: 70, align: 'right' },
        { key: 'diff', label: 'Отклонение', width: 80, align: 'right' },
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
        { label: 'Всего наименований:', value: String(balances.length), bold: true },
        { label: 'Общее кол-во по учёту:', value: formatNumber(balances.reduce((s, b) => s + b.quantity, 0), 0) + ' ед.', bold: true },
      ],
      footer: `Инвентаризация на складе "${wh.name}". Материально ответственное лицо: _________________`,
      signatures: [
        { label: 'Председатель комиссии', value: '_______________' },
        { label: 'Член комиссии', value: '_______________' },
        { label: 'Член комиссии', value: '_______________' },
        { label: 'Материально ответственное лицо', value: '_______________' },
      ],
    };
  },
};

// ==================== STAGE 3: Cash / Bank ====================

const pkoForm: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const order = await prisma.cashOrder.findUnique({
      where: { id },
      include: { register: true, user: true },
    });
    if (!order) throw new Error(`CashOrder ${id} not found`);

    return {
      title: 'ПРИХОДНЫЙ КАССОВЫЙ ОРДЕР (КО-1)',
      number: String(order.id),
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: { name: order.counterparty || '—' },
      columns: [],
      rows: [],
      footer: `Основание: ${order.basis || '—'}\n\nСумма прописью: ${numberToWords(order.amount)}`,
      signatures: [
        { label: 'Главный бухгалтер', value: '_______________' },
        { label: 'Получил кассир', value: '_______________' },
        { label: 'Принял от', value: '_______________' },
      ],
    };
  },
};

const rkoForm: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const order = await prisma.cashOrder.findUnique({
      where: { id },
      include: { register: true, user: true },
    });
    if (!order) throw new Error(`CashOrder ${id} not found`);

    return {
      title: 'РАСХОДНЫЙ КАССОВЫЙ ОРДЕР (КО-2)',
      number: String(order.id),
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: { name: order.counterparty || '—' },
      columns: [],
      rows: [],
      footer: `Основание: ${order.basis || '—'}\n\nСумма прописью: ${numberToWords(order.amount)}`,
      signatures: [
        { label: 'Руководитель', value: '_______________' },
        { label: 'Главный бухгалтер', value: '_______________' },
        { label: 'Получил', value: '_______________' },
        { label: 'Выдал кассир', value: '_______________' },
      ],
    };
  },
};

const ko4Form: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const reg = await prisma.cashRegister.findUnique({ where: { id } });
    if (!reg) throw new Error(`CashRegister ${id} not found`);
    const orders = await prisma.cashOrder.findMany({
      where: { registerId: id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      title: 'КАССОВАЯ КНИГА (КО-4)',
      number: `КО-4-${id}`,
      date: new Date(),
      seller: seller || defaultSeller(),
      buyer: { name: reg.name, address: reg.currency },
      paperSize: 'A4',
      orientation: 'landscape',
      columns: [
        { key: 'date', label: 'Дата', width: 80, align: 'left', formatter: (v) => formatDate(v) },
        { key: 'no', label: '№ документа', width: 80, align: 'left' },
        { key: 'who', label: 'От кого / Кому', width: 180, align: 'left' },
        { key: 'corr', label: 'Корр. счёт', width: 80, align: 'left' },
        { key: 'income', label: 'Приход', width: 90, align: 'right', formatter: (v) => v ? formatCurrency(v, currency) : '' },
        { key: 'expense', label: 'Расход', width: 90, align: 'right', formatter: (v) => v ? formatCurrency(v, currency) : '' },
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
        { label: 'Итого приход:', value: formatCurrency(orders.filter((o) => o.type === 'Income').reduce((s, o) => s + o.amount, 0), currency), bold: true },
        { label: 'Итого расход:', value: formatCurrency(orders.filter((o) => o.type === 'Expense').reduce((s, o) => s + o.amount, 0), currency), bold: true },
        { label: 'Остаток:', value: formatCurrency(reg.balance, currency), bold: true },
      ],
      footer: `Кассовая книга за период. Касса: ${reg.name}. Валюта: ${reg.currency || 'KZT'}.`,
      signatures: [
        { label: 'Кассир', value: '_______________' },
        { label: 'Главный бухгалтер', value: '_______________' },
      ],
    };
  },
};

const paymentOrderForm: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const order = await prisma.bankOrder.findUnique({
      where: { id },
      include: { account: true, user: true },
    });
    if (!order) throw new Error(`BankOrder ${id} not found`);

    return {
      title: 'ПЛАТЁЖНОЕ ПОРУЧЕНИЕ',
      number: String(order.id),
      date: order.createdAt,
      seller: seller || defaultSeller(),
      buyer: { name: order.counterparty || '—' },
      columns: [],
      rows: [],
      footer:
        `Вид платежа: ${order.type === 'In' ? 'входящий' : 'исходящий'}\n` +
        `Сумма: ${formatCurrency(order.amount, currency)}\n` +
        `Сумма прописью: ${numberToWords(order.amount)}\n` +
        `Назначение платежа: ${order.purpose || '—'}\n` +
        `Счёт: ${order.account?.accountNo || '—'} (${order.account?.bankName || '—'}, БИК ${order.account?.bik || '—'})\n` +
        `Контрагент: ${order.counterparty || '—'}`,
      signatures: [
        { label: 'Подпись руководителя', value: '_______________' },
        { label: 'М.П.', value: '' },
      ],
    };
  },
};

const bankStatementForm: IFormRenderer = {
  async build({ prisma, currency, seller }, id) {
    const acc = await prisma.bankAccount.findUnique({ where: { id } });
    if (!acc) throw new Error(`BankAccount ${id} not found`);
    const orders = await prisma.bankOrder.findMany({
      where: { accountId: id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      title: 'БАНКОВСКАЯ ВЫПИСКА',
      number: `БВ-${id}`,
      date: new Date(),
      seller: seller || defaultSeller(),
      buyer: { name: acc.name, account: acc.accountNo, bank: acc.bankName, bik: acc.bik },
      paperSize: 'A4',
      orientation: 'landscape',
      columns: [
        { key: 'date', label: 'Дата', width: 80, align: 'left', formatter: (v) => formatDate(v) },
        { key: 'no', label: '№ документа', width: 80, align: 'left' },
        { key: 'counterparty', label: 'Корреспондент', width: 200, align: 'left' },
        { key: 'purpose', label: 'Назначение', width: 200, align: 'left' },
        { key: 'debit', label: 'Дебет', width: 90, align: 'right', formatter: (v) => v ? formatCurrency(v, currency) : '' },
        { key: 'credit', label: 'Кредит', width: 90, align: 'right', formatter: (v) => v ? formatCurrency(v, currency) : '' },
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
        { label: 'Итого дебет:', value: formatCurrency(orders.filter((o) => o.type === 'Out').reduce((s, o) => s + o.amount, 0), currency), bold: true },
        { label: 'Итого кредит:', value: formatCurrency(orders.filter((o) => o.type === 'In').reduce((s, o) => s + o.amount, 0), currency), bold: true },
        { label: 'Остаток:', value: formatCurrency(acc.balance, currency), bold: true },
      ],
      footer: `Счёт: ${acc.accountNo || '—'}. Банк: ${acc.bankName || '—'}. БИК: ${acc.bik || '—'}. Валюта: ${acc.currency || 'KZT'}.`,
      signatures: [
        { label: 'Начальник отдела', value: '_______________' },
        { label: 'Главный бухгалтер', value: '_______________' },
      ],
    };
  },
};

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
