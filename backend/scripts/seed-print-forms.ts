import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FormDef {
  code: string;
  name: string;
  applicableTypes: string;
  renderer: string;
  sortOrder: number;
}

const SYSTEM_FORMS: FormDef[] = [
  // Stage 1: Sales / Documents
  { code: 'invoice', name: 'Счёт на оплату', applicableTypes: 'CustomerInvoice,Order', renderer: 'invoice-form', sortOrder: 10 },
  { code: 'invoice-vat', name: 'Счёт-фактура (СФ)', applicableTypes: 'CustomerInvoice,SupplierInvoice,Document', renderer: 'invoice-vat-form', sortOrder: 20 },
  { code: 'torg-12', name: 'Товарная накладная (ТОРГ-12)', applicableTypes: 'Document,Sale,Purchase', renderer: 'torg-12-form', sortOrder: 30 },
  { code: 'upd', name: 'Универсальный передаточный документ (УПД)', applicableTypes: 'Document,Sale,Purchase', renderer: 'upd-form', sortOrder: 40 },
  { code: 'act', name: 'Акт выполненных работ', applicableTypes: 'Document,Sale', renderer: 'act-form', sortOrder: 50 },

  // Stage 2: Warehouse
  { code: 'm-4', name: 'Приходный ордер (М-4)', applicableTypes: 'ProductReceipt,Receipt', renderer: 'm-4-form', sortOrder: 60 },
  { code: 'm-11', name: 'Требование-накладная (М-11)', applicableTypes: 'ProductIssue,Issue', renderer: 'm-11-form', sortOrder: 70 },
  { code: 'm-15', name: 'Накладная на перемещение (М-15)', applicableTypes: 'ProductTransfer,Transfer', renderer: 'm-15-form', sortOrder: 80 },
  { code: 'inv-3', name: 'Инвентаризационная опись (ИНВ-3)', applicableTypes: 'Warehouse', renderer: 'inv-3-form', sortOrder: 90 },

  // Stage 3: Cash / Bank
  { code: 'pko', name: 'Приходный кассовый ордер (КО-1)', applicableTypes: 'CashOrder', renderer: 'pko-form', sortOrder: 100 },
  { code: 'rko', name: 'Расходный кассовый ордер (КО-2)', applicableTypes: 'CashOrder', renderer: 'rko-form', sortOrder: 110 },
  { code: 'ko-4', name: 'Кассовая книга (КО-4)', applicableTypes: 'CashRegister', renderer: 'ko-4-form', sortOrder: 120 },
  { code: 'payment-order', name: 'Платёжное поручение', applicableTypes: 'BankOrder', renderer: 'payment-order-form', sortOrder: 130 },
  { code: 'bank-statement', name: 'Банковская выписка', applicableTypes: 'BankAccount', renderer: 'bank-statement-form', sortOrder: 140 },
];

async function main() {
  console.log(`▶ Seeding ${SYSTEM_FORMS.length} print forms...`);
  for (const f of SYSTEM_FORMS) {
    await prisma.printForm.upsert({
      where: { code: f.code },
      update: {
        name: f.name,
        applicableTypes: f.applicableTypes,
        renderer: f.renderer,
        sortOrder: f.sortOrder,
        isActive: true,
      },
      create: {
        code: f.code,
        name: f.name,
        applicableTypes: f.applicableTypes,
        renderer: f.renderer,
        sortOrder: f.sortOrder,
        isSystem: true,
        isActive: true,
      },
    });
  }
  console.log(`✅ Seeded ${SYSTEM_FORMS.length} print forms`);
}

main()
  .catch((e) => {
    console.error('Print forms seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
