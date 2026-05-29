import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('Seeding database...');

  // Clear all tables in correct order for referential integrity
  await prisma.orderItem.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.contactLog.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appConfig.deleteMany();
  console.log('Cleared all tables');

  // ── Users ──
  const userSeeds = [
    { email: 'admin@supplyflow.kz', password: bcrypt.hashSync('admin123', 10), fullName: 'Арман Нұрланұлы', role: 'Admin' },
    { email: 'manager1@supplyflow.kz', password: bcrypt.hashSync('manager123', 10), fullName: 'Айгүл Серікқызы', role: 'Manager' },
    { email: 'manager2@supplyflow.kz', password: bcrypt.hashSync('manager123', 10), fullName: 'Бауыржан Ермеков', role: 'Manager' },
    { email: 'warehouse1@supplyflow.kz', password: bcrypt.hashSync('warehouse123', 10), fullName: 'Нұржан Қайратов', role: 'Warehouse' },
    { email: 'warehouse2@supplyflow.kz', password: bcrypt.hashSync('warehouse123', 10), fullName: 'Гүлмира Ахметова', role: 'Warehouse' },
  ];
  const users = await Promise.all(userSeeds.map((u) => prisma.user.create({ data: u })));
  console.log(`Created ${users.length} users`);

  // ── Customers ──
  const customerSeeds = [
    { company: 'Самұрық-Қазына', contactPerson: 'Азамат Төлегенов', phone: '+7 701 111 2233', email: 'contact@samuryk.kz', tier: 'VIP' },
    { company: 'Қазақмыс Корпорациясы', contactPerson: 'Серік Жұмабаев', phone: '+7 702 222 3344', email: 'info@kazakhmys.kz', tier: 'VIP' },
    { company: 'Бипек Авто', contactPerson: 'Марат Әлиев', phone: '+7 703 333 4455', email: 'sales@bipek.kz', tier: 'VIP' },
    { company: 'EUROPHARMA', contactPerson: 'Динара Нұртазина', phone: '+7 705 111 5566', email: 'order@europharma.kz', tier: 'Regular' },
    { company: 'Азия Авто', contactPerson: 'Ерлан Сәбитов', phone: '+7 707 222 6677', email: 'info@asiaauto.kz', tier: 'Regular' },
    { company: 'Рамстор', contactPerson: 'Ольга Иванова', phone: '+7 708 333 7788', email: 'ramstor@mail.kz', tier: 'Regular' },
    { company: 'Анвар', contactPerson: 'Руслан Кәрімов', phone: '+7 709 444 8899', email: 'buy@anvar.kz', tier: 'Problematic' },
    { company: 'Technodom', contactPerson: 'Арман Мұхамедиев', phone: '+7 771 555 9900', email: 'pr@technodom.kz', tier: 'VIP' },
    { company: 'Sulpak', contactPerson: 'Айнагүл Тұрсынбаева', phone: '+7 775 666 0011', email: 'info@sulpak.kz', tier: 'Regular' },
    { company: 'Alser', contactPerson: 'Ержан Нұғыманов', phone: '+7 778 777 1122', email: 'sales@alser.kz', tier: 'Regular' },
  ];
  const customers = await Promise.all(customerSeeds.map((c) => prisma.customer.create({ data: c })));
  console.log(`Created ${customers.length} customers`);

  // ── Products ──
  const productSeeds = [
    { sku: 'ELEC-001', name: 'Ноутбук Lenovo ThinkPad', category: 'Electronics', unitPrice: 450000, quantityOnHand: 15, quantityReserved: 3, reorderPoint: 5 },
    { sku: 'ELEC-002', name: 'Принтер HP LaserJet', category: 'Electronics', unitPrice: 85000, quantityOnHand: 8, quantityReserved: 2, reorderPoint: 3 },
    { sku: 'ELEC-003', name: 'Монитор Samsung 27"', category: 'Electronics', unitPrice: 120000, quantityOnHand: 5, quantityReserved: 4, reorderPoint: 3 },
    { sku: 'ELEC-004', name: 'Клава Logitech', category: 'Electronics', unitPrice: 15000, quantityOnHand: 20, quantityReserved: 0, reorderPoint: 10 },
    { sku: 'ELEC-005', name: 'Жүйелік блок Dell', category: 'Electronics', unitPrice: 350000, quantityOnHand: 4, quantityReserved: 2, reorderPoint: 3 },
    { sku: 'OFF-001', name: 'Кеңсе қағазы A4 (10 қап)', category: 'Office Supplies', unitPrice: 12000, quantityOnHand: 50, quantityReserved: 5, reorderPoint: 20 },
    { sku: 'OFF-002', name: 'Шарикті қалам (12 дана)', category: 'Office Supplies', unitPrice: 800, quantityOnHand: 100, quantityReserved: 0, reorderPoint: 50 },
    { sku: 'OFF-003', name: 'Папка пластик', category: 'Office Supplies', unitPrice: 350, quantityOnHand: 200, quantityReserved: 0, reorderPoint: 100 },
    { sku: 'OFF-004', name: 'Степлер', category: 'Office Supplies', unitPrice: 1500, quantityOnHand: 3, quantityReserved: 2, reorderPoint: 5 },
    { sku: 'OFF-005', name: 'Маркер (жинақ)', category: 'Office Supplies', unitPrice: 2500, quantityOnHand: 30, quantityReserved: 0, reorderPoint: 15 },
    { sku: 'SP-001', name: 'Май сорғысы', category: 'Spare Parts', unitPrice: 25000, quantityOnHand: 6, quantityReserved: 5, reorderPoint: 5 },
    { sku: 'SP-002', name: 'Белдік жинағы', category: 'Spare Parts', unitPrice: 8500, quantityOnHand: 12, quantityReserved: 3, reorderPoint: 10 },
    { sku: 'SP-003', name: 'Электр қозғалтқыш 5кВт', category: 'Spare Parts', unitPrice: 180000, quantityOnHand: 2, quantityReserved: 1, reorderPoint: 3 },
    { sku: 'SP-004', name: 'Подшипник жинағы', category: 'Spare Parts', unitPrice: 4500, quantityOnHand: 45, quantityReserved: 2, reorderPoint: 20 },
    { sku: 'SP-005', name: 'Гидравликалық цилиндр', category: 'Spare Parts', unitPrice: 65000, quantityOnHand: 3, quantityReserved: 2, reorderPoint: 3 },
  ];
  const products = await Promise.all(productSeeds.map((p) => prisma.product.create({ data: p })));
  console.log(`Created ${products.length} products`);

  // ── AppConfig ──
  await prisma.appConfig.create({ data: { key: 'beta', value: '0.05' } });
  await prisma.appConfig.create({ data: { key: 'company_name', value: 'SupplyFlow Ltd.' } });
  console.log('Created AppConfig entries');

  // ── Generate 50 Orders ──
  const now = new Date();

  // Date boundaries
  const d2to3yrAgo = { start: new Date('2023-05-28'), end: new Date('2024-05-28') };
  const d1to2yrAgo = { start: new Date('2024-05-28'), end: new Date('2025-05-28') };
  const d3to12moAgo = { start: new Date('2025-05-28'), end: new Date('2026-02-28') };
  const recentDays = { start: new Date(now.getTime() - 5 * 86400000), end: now };
  const recentWeeks = { start: new Date(now.getTime() - 28 * 86400000), end: new Date(now.getTime() - 5 * 86400000) };

  interface OrderItemSeed {
    productIdx: number;
    quantity: number;
  }
  interface OrderSeed {
    customerIdx: number;
    userIdx: number;
    status: string;
    date: Date;
    deadline: Date;
    items: OrderItemSeed[];
    notes?: string;
  }

  const orderSeeds: OrderSeed[] = [];

  // Helper: pick random items ensuring category consistency for realism
  function pickItems(count: number): OrderItemSeed[] {
    const categoryGroups: Record<string, number[]> = {};
    products.forEach((_, idx) => {
      const cat = productSeeds[idx].category;
      if (!categoryGroups[cat]) categoryGroups[cat] = [];
      categoryGroups[cat].push(idx);
    });
    const cats = Object.keys(categoryGroups);
    // Pick a random category, then pick random products from it
    const chosenCat = cats[randomInt(0, cats.length - 1)];
    const pool = categoryGroups[chosenCat];
    const selected: OrderItemSeed[] = [];
    const used = new Set<number>();
    for (let i = 0; i < count; i++) {
      let idx: number;
      let attempts = 0;
      do {
        idx = pool[randomInt(0, pool.length - 1)];
        attempts++;
      } while (used.has(idx) && attempts < 20);
      used.add(idx);
      selected.push({ productIdx: idx, quantity: randomInt(1, 10) });
    }
    return selected;
  }

  // Track customer order counts and last dates
  const customerOrderCounts: Record<number, number> = {};
  const customerLastOrder: Record<number, Date> = {};

  // Track product stock adjustments for delivered/shipped orders
  const productQtyAdjustments: Record<number, number> = {};
  // Track product reserved adjustments for reserved/confirmed orders
  const productReservedAdjustments: Record<number, number> = {};

  function addOrder(order: OrderSeed) {
    orderSeeds.push(order);
    customerOrderCounts[order.customerIdx] = (customerOrderCounts[order.customerIdx] || 0) + 1;
    if (!customerLastOrder[order.customerIdx] || order.date > customerLastOrder[order.customerIdx]) {
      customerLastOrder[order.customerIdx] = order.date;
    }
    for (const item of order.items) {
      if (order.status === 'Delivered' || order.status === 'Shipped') {
        productQtyAdjustments[item.productIdx] = (productQtyAdjustments[item.productIdx] || 0) - item.quantity;
      }
      if (order.status === 'Reserved' || order.status === 'Confirmed') {
        productReservedAdjustments[item.productIdx] = (productReservedAdjustments[item.productIdx] || 0) + item.quantity;
      }
    }
  }

  // ── 10 Delivered, 2-3 years ago ──
  for (let i = 0; i < 10; i++) {
    const date = randomDate(d2to3yrAgo.start, d2to3yrAgo.end);
    addOrder({
      customerIdx: randomInt(0, 9),
      userIdx: randomInt(0, 4),
      status: 'Delivered',
      date,
      deadline: new Date(date.getTime() + randomInt(3, 21) * 86400000),
      items: pickItems(randomInt(1, 3)),
    });
  }

  // ── 15 Delivered, 1-2 years ago ──
  for (let i = 0; i < 15; i++) {
    const date = randomDate(d1to2yrAgo.start, d1to2yrAgo.end);
    addOrder({
      customerIdx: randomInt(0, 9),
      userIdx: randomInt(0, 4),
      status: 'Delivered',
      date,
      deadline: new Date(date.getTime() + randomInt(3, 21) * 86400000),
      items: pickItems(randomInt(1, 3)),
    });
  }

  // ── 15 Delivered, 3-12 months ago ──
  for (let i = 0; i < 15; i++) {
    const date = randomDate(d3to12moAgo.start, d3to12moAgo.end);
    addOrder({
      customerIdx: randomInt(0, 9),
      userIdx: randomInt(0, 4),
      status: 'Delivered',
      date,
      deadline: new Date(date.getTime() + randomInt(3, 21) * 86400000),
      items: pickItems(randomInt(1, 3)),
    });
  }

  // ── 5 Pending/Reserved, recent days (for priority algorithm demo) ──
  // Use low-stock products to make priority meaningful
  const lowStockProductIdxs = [4, 2, 14, 12, 10, 8]; // ELEC-005, ELEC-003, SP-005, SP-003, SP-001, OFF-004
  const statuses = ['Pending', 'Pending', 'Pending', 'Reserved', 'Reserved'];
  for (let i = 0; i < 5; i++) {
    const date = randomDate(recentDays.start, recentDays.end);
    const deadline = new Date(now.getTime() + randomInt(24, 72) * 3600000);
    const prodIdx = lowStockProductIdxs[i % lowStockProductIdxs.length];
    addOrder({
      customerIdx: randomInt(0, 9),
      userIdx: randomInt(0, 4),
      status: statuses[i],
      date,
      deadline,
      items: [
        { productIdx: prodIdx, quantity: randomInt(1, 3) },
        ...(i % 2 === 0 ? [{ productIdx: randomInt(0, 14), quantity: randomInt(1, 5) }] : []),
      ],
      notes: statuses[i] === 'Pending' ? 'Жеткізу шұғыл' : 'Тауар резервте',
    });
  }

  // ── 3 Shipped, recent weeks ──
  for (let i = 0; i < 3; i++) {
    const date = randomDate(recentWeeks.start, recentWeeks.end);
    addOrder({
      customerIdx: randomInt(0, 9),
      userIdx: randomInt(0, 4),
      status: 'Shipped',
      date,
      deadline: new Date(date.getTime() + randomInt(3, 14) * 86400000),
      items: pickItems(randomInt(1, 2)),
      notes: 'Жөнелтілді',
    });
  }

  // ── 2 Cancelled ──
  for (let i = 0; i < 2; i++) {
    const date = randomDate(d1to2yrAgo.start, d3to12moAgo.end);
    const customerIdx = i === 0 ? 6 : randomInt(0, 9); // At least one from Problematic customer
    addOrder({
      customerIdx,
      userIdx: randomInt(0, 4),
      status: 'Cancelled',
      date,
      deadline: new Date(date.getTime() + randomInt(3, 14) * 86400000),
      items: pickItems(randomInt(1, 2)),
      notes: 'Бұйрықтан бас тартылды',
    });
  }

  // ── Create orders in DB ──
  for (const s of orderSeeds) {
    const itemsWithPrice = s.items.map((item) => ({
      productId: products[item.productIdx].id,
      quantity: item.quantity,
      unitPrice: products[item.productIdx].unitPrice,
    }));
    const totalAmount = itemsWithPrice.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const costAmount = totalAmount * 0.7;

    await prisma.order.create({
      data: {
        customerId: customers[s.customerIdx].id,
        userId: users[s.userIdx].id,
        status: s.status,
        totalAmount,
        costAmount,
        deliveryAddress: `г. Алматы, ул. Абая, д. ${randomInt(1, 200)}`,
        deadline: s.deadline,
        notes: s.notes ?? null,
        createdAt: s.date,
        updatedAt: s.date,
        items: {
          create: itemsWithPrice,
        },
      },
    });
  }
  console.log(`Created ${orderSeeds.length} orders with items`);

  // ── Update product stock levels ──
  for (const [idxStr, adjustment] of Object.entries(productQtyAdjustments)) {
    const idx = parseInt(idxStr);
    await prisma.product.update({
      where: { id: products[idx].id },
      data: { quantityOnHand: { increment: adjustment } },
    });
  }
  for (const [idxStr, adjustment] of Object.entries(productReservedAdjustments)) {
    const idx = parseInt(idxStr);
    await prisma.product.update({
      where: { id: products[idx].id },
      data: { quantityReserved: { increment: adjustment } },
    });
  }
  console.log('Updated product stock levels');

  // ── Update customer totalOrders and lastOrderDate ──
  for (const [idxStr, count] of Object.entries(customerOrderCounts)) {
    const idx = parseInt(idxStr);
    await prisma.customer.update({
      where: { id: customers[idx].id },
      data: {
        totalOrders: count,
        lastOrderDate: customerLastOrder[idx],
      },
    });
  }
  console.log('Updated customer order counts');

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
