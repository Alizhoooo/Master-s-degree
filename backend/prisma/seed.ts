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
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.productTransferItem.deleteMany();
  await prisma.productTransfer.deleteMany();
  await prisma.productIssueItem.deleteMany();
  await prisma.productIssue.deleteMany();
  await prisma.productReceiptItem.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.productReceipt.deleteMany();
  await prisma.expiryAlert.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockBalance.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.contactLog.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.task.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.documentItem.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.documentApproval.deleteMany();
  await prisma.documentAttachment.deleteMany();
  await prisma.accountingEntry.deleteMany();
  await prisma.cashOrder.deleteMany();
  await prisma.bankOrder.deleteMany();
  await prisma.bankStatement.deleteMany();
  await prisma.chartOfAccounts.deleteMany();
  await prisma.payrollEntry.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.productionOutput.deleteMany();
  await prisma.productionOrder.deleteMany();
  await prisma.productBomInput.deleteMany();
  await prisma.techCard.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.batchMovement.deleteMany();
  await prisma.order.deleteMany();
  await prisma.document.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.userRoleAssignment.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.scheduledJob.deleteMany();
  await prisma.configObject.deleteMany();
  await prisma.printTemplate.deleteMany();
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
  const users = await Promise.all(userSeeds.map((u) => prisma.user.create({ data: u as any })));
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

  // ── Wrap optional sections in try/catch so a failure here doesn't stop roles
  async function safeRun(label: string, fn: () => Promise<any>) {
    try {
      return await fn();
    } catch (err: any) {
      console.error(`⚠️  Section "${label}" failed: ${err.message}`);
      return null;
    }
  }

  // ── Warehouses ──
  const warehouses = await safeRun('warehouses', () => Promise.all([
    prisma.warehouse.create({ data: { name: 'Центральный склад', address: 'г. Алматы, ул. Жетысу 14', isMain: true } }),
    prisma.warehouse.create({ data: { name: 'Склад №2 (Северный)', address: 'г. Астана, пр. Кабанбай батыра 6', isMain: false } }),
    prisma.warehouse.create({ data: { name: 'Склад-магазин (Шымкент)', address: 'г. Шымкент, мкр. Нурсат', isMain: false } }),
  ])) || [];
  console.log(`Created ${warehouses.length} warehouses`);

  // ── Suppliers ──
  const supplierSeeds = [
    { name: 'ТОО "АлматыТехСнаб"', contactPerson: 'Серик Алимов', phone: '+7 727 300 1122', email: 'sales@alts.kz', inn: '080140012345', category: 'Electronics', rating: 5 },
    { name: 'АО "КазОфисТорг"', contactPerson: 'Гульнара Касенова', phone: '+7 7172 555 6677', email: 'b2b@kazoffice.kz', inn: '550140023456', category: 'Office Supplies', rating: 4 },
    { name: 'ИП "Запчасть.KZ"', contactPerson: 'Марат Бекжанов', phone: '+7 701 999 0011', email: 'parts@zapchast.kz', inn: '700140034567', category: 'Spare Parts', rating: 5 },
    { name: 'ТОО "ТехноИмпорт"', contactPerson: 'Артем Ли', phone: '+7 705 444 5522', email: 'office@technoimport.kz', inn: '600140045678', category: 'Electronics', rating: 4 },
    { name: 'ТОО "ВостокКомплект"', contactPerson: 'Ирина Цой', phone: '+7 727 250 8811', email: 'info@vostok-k.kz', inn: '090140056789', category: 'General', rating: 3 },
    { name: 'ТОО "Премиум Папки"', contactPerson: 'Жанар Мукашева', phone: '+7 707 333 7799', email: 'sales@premium-p.kz', inn: '120140067890', category: 'Office Supplies', rating: 5 },
  ];
  const suppliers = await Promise.all(supplierSeeds.map((s) => prisma.supplier.create({ data: s })));
  console.log(`Created ${suppliers.length} suppliers`);

  // ── Stock balances (initial stock for each product on main warehouse) ──
  for (const product of products) {
    await prisma.stockBalance.create({
      data: { warehouseId: warehouses[0].id, productId: product.id, quantity: product.quantityOnHand, reserved: product.quantityReserved },
    });
  }
  console.log('Created initial stock balances');

  // ── Employees ──
  const employeeSeeds = [
    { userId: users[0].id, fullName: users[0].fullName, position: 'Генеральный директор', department: 'Управление', salary: 1500000, hireDate: new Date('2020-01-15'), phone: '+7 701 000 0001' },
    { userId: users[1].id, fullName: users[1].fullName, position: 'Менеджер по продажам', department: 'Продажи', salary: 450000, hireDate: new Date('2021-03-10'), phone: '+7 701 000 0002' },
    { userId: users[2].id, fullName: users[2].fullName, position: 'Старший менеджер', department: 'Продажи', salary: 520000, hireDate: new Date('2020-09-01'), phone: '+7 701 000 0003' },
    { userId: users[3].id, fullName: users[3].fullName, position: 'Кладовщик', department: 'Склад', salary: 280000, hireDate: new Date('2022-06-20'), phone: '+7 701 000 0004' },
    { userId: users[4].id, fullName: users[4].fullName, position: 'Старший кладовщик', department: 'Склад', salary: 320000, hireDate: new Date('2021-11-05'), phone: '+7 701 000 0005' },
  ];
  const employees = await Promise.all(employeeSeeds.map((e) => prisma.employee.create({ data: e as any })));
  console.log(`Created ${employees.length} employees`);

  // ── Complaints ──
  const complaintSeeds = [
    { customerId: customers[0].id, title: 'Задержка поставки по договору №СК-2024-08', description: 'Заявка была оформлена 10.04, до сих пор не отгружено. Прошу разобраться.', status: 'Open' },
    { customerId: customers[3].id, title: 'Бой в партии медикаментов', description: 'При приёмке обнаружено 12 повреждённых упаковок. Требуем замену.', status: 'InProgress' },
    { customerId: customers[6].id, title: 'Ошибка в счёте-фактуре', description: 'В счёте №SF-001234 указана неверная цена за позицию №3.', status: 'Resolved' },
    { customerId: customers[2].id, title: 'Неполная комплектация заказа', description: 'В заказе отсутствуют 3 единицы принтеров HP LaserJet из 5 заказанных.', status: 'Open' },
    { customerId: customers[4].id, title: 'Товар ненадлежащего качества', description: 'Клавиатуры Logitech имеют заводской брак — не работает блок цифровых клавиш.', status: 'InProgress' },
  ];
  const complaints = await Promise.all(complaintSeeds.map((c) => prisma.complaint.create({ data: c })));
  console.log(`Created ${complaints.length} complaints`);

  // ── Tasks ──
  const taskSeeds = [
    { title: 'Согласовать договор с ТОО "АлматыТехСнаб"', description: 'Получить подпись директора, отправить скан поставщику', status: 'InProgress', priority: 'High', dueDate: new Date(Date.now() + 2 * 86400000), assignedToId: users[0].id, createdById: users[0].id },
    { title: 'Провести инвентаризацию склада №2', description: 'Полная инвентаризация партий с истекающим сроком годности', status: 'New', priority: 'Normal', dueDate: new Date(Date.now() + 5 * 86400000), assignedToId: users[3].id, createdById: users[1].id },
    { title: 'Подготовить отчёт по продажам за май', description: 'Сводка по 10 клиентам, разбивка по категориям товаров', status: 'Done', priority: 'High', dueDate: new Date(Date.now() - 1 * 86400000), assignedToId: users[1].id, createdById: users[0].id, completedAt: new Date() },
    { title: 'Закупить партию подшипников SP-004', description: 'Текущий остаток ниже точки заказа', status: 'New', priority: 'Urgent', dueDate: new Date(Date.now() + 1 * 86400000), assignedToId: users[1].id, createdById: users[3].id },
    { title: 'Обновить прайс-лист для VIP-клиентов', description: 'Поднять цены на 8% на товары категории Electronics', status: 'New', priority: 'Normal', dueDate: new Date(Date.now() + 7 * 86400000), assignedToId: users[2].id, createdById: users[0].id },
    { title: 'Рассмотреть жалобу EUROPHARMA', description: 'Связаться с клиентом, оформить замену', status: 'InProgress', priority: 'High', dueDate: new Date(Date.now() + 1 * 86400000), assignedToId: users[1].id, createdById: users[0].id },
    { title: 'Настроить авто-уведомления о сроках годности', description: 'За 30/14/7 дней до истечения отправлять алерт кладовщику', status: 'New', priority: 'Normal', dueDate: new Date(Date.now() + 14 * 86400000), assignedToId: users[3].id, createdById: users[0].id },
  ];
  const tasks = await Promise.all(taskSeeds.map((t) => prisma.task.create({ data: t as any })));
  console.log(`Created ${tasks.length} tasks`);

  // ── Notifications ──
  const notificationSeeds = [
    { userId: users[0].id, title: 'Новая VIP-жалоба', message: 'Самұрық-Қазына: задержка поставки', type: 'warning' },
    { userId: users[0].id, title: 'Низкий остаток', message: 'Электр қозғалтқыш 5кВт — 2 шт. (ниже reorder point)', type: 'warning' },
    { userId: users[0].id, title: 'Задача выполнена', message: 'Менеджер 1 завершил "Подготовить отчёт по продажам"', type: 'success' },
    { userId: users[1].id, title: 'Новый срочный заказ', message: 'Самұрық-Қазына: требуется отгрузка до 12:00', type: 'info' },
    { userId: users[1].id, title: 'Напоминание о задаче', message: 'Согласовать договор — осталось 2 дня', type: 'warning' },
    { userId: users[3].id, title: 'Истекает срок годности', message: 'Партия BAT-2024-018: 14 дней до истечения', type: 'warning' },
    { userId: users[3].id, title: 'Поступление товара', message: 'Приход от ТОО "АлматыТехСнаб" оформлен', type: 'success' },
    { userId: users[0].id, title: 'Системное обновление', message: 'Backend переведён на новую версию API', type: 'info' },
    { userId: users[2].id, title: 'Новый заказ', message: 'Анвар: 2 позиции, требуется подтверждение', type: 'info' },
  ];
  const notifications = await Promise.all(notificationSeeds.map((n) => prisma.notification.create({ data: n })));
  console.log(`Created ${notifications.length} notifications`);

  // ── Contracts ──
  const contractSeeds = [
    { number: 'ДГ-2024-001', customerId: customers[0].id, signedAt: new Date('2024-01-15'), validUntil: new Date('2025-12-31'), totalAmount: 50000000, description: 'Годовой контракт на поставку электроники', status: 'Active' },
    { number: 'ДГ-2024-002', customerId: customers[1].id, signedAt: new Date('2024-03-20'), validUntil: new Date('2026-03-19'), totalAmount: 30000000, description: 'Поставка запчастей и комплектующих', status: 'Active' },
    { number: 'ДГ-2024-003', customerId: customers[3].id, signedAt: new Date('2024-05-10'), validUntil: new Date('2025-05-09'), totalAmount: 12000000, description: 'Медикаменты и расходники', status: 'Active' },
    { number: 'ДГ-2023-088', customerId: customers[6].id, signedAt: new Date('2023-11-01'), validUntil: new Date('2024-10-31'), totalAmount: 8000000, description: 'Розничные поставки', status: 'Closed' },
    { number: 'ДГ-2025-007', customerId: customers[2].id, signedAt: new Date('2025-02-01'), validUntil: new Date('2026-01-31'), totalAmount: 25000000, description: 'Автозапчасти оптом', status: 'Active' },
  ];
  const contracts = await Promise.all(contractSeeds.map((c) => prisma.contract.create({ data: c })));
  console.log(`Created ${contracts.length} contracts`);

  // ── Batches + Expiry Alerts ──
  const batchSeeds = [
    { productId: products[0].id, batchNo: 'BAT-2024-001', manufacturedAt: new Date('2024-01-10'), expiryDate: new Date(Date.now() + 365 * 86400000), quantity: 5, remainingQty: 3, costPrice: 380000, userId: users[3].id },
    { productId: products[1].id, batchNo: 'BAT-2024-018', manufacturedAt: new Date('2024-04-05'), expiryDate: new Date(Date.now() + 14 * 86400000), quantity: 4, remainingQty: 4, costPrice: 70000, userId: users[3].id },
    { productId: products[2].id, batchNo: 'BAT-2024-022', manufacturedAt: new Date('2024-05-12'), expiryDate: new Date(Date.now() + 60 * 86400000), quantity: 3, remainingQty: 2, costPrice: 95000, userId: users[3].id },
    { productId: products[5].id, batchNo: 'BAT-OFF-101', manufacturedAt: new Date('2024-09-01'), expiryDate: new Date(Date.now() + 730 * 86400000), quantity: 25, remainingQty: 20, costPrice: 9500, userId: users[4].id },
    { productId: products[7].id, batchNo: 'BAT-OFF-103', manufacturedAt: new Date('2024-08-15'), expiryDate: new Date(Date.now() + 7 * 86400000), quantity: 50, remainingQty: 50, costPrice: 280, userId: users[3].id },
  ];
  const batches = await Promise.all(batchSeeds.map((b) => prisma.batch.create({ data: b as any })));
  console.log(`Created ${batches.length} batches`);

  // Expiry alerts for batches that are close to expiry
  const expiringBatchInfo = [
    { batch: batches[1], daysLeft: 14, severity: 'Warning' },
    { batch: batches[4], daysLeft: 7, severity: 'Critical' },
    { batch: batches[2], daysLeft: 60, severity: 'Info' },
  ];
  for (const e of expiringBatchInfo) {
    await prisma.expiryAlert.create({
      data: { batchId: e.batch.id, productId: e.batch.productId, expiryDate: e.batch.expiryDate!, daysLeft: e.daysLeft, severity: e.severity },
    });
  }
  console.log('Created 3 expiry alerts');

  // ── Expiry alert notifications for warehouse users ──
  const warehouseUsers = [users[3].id, users[4].id];
  for (const e of expiringBatchInfo) {
    const product = products.find((p) => p.id === e.batch.productId);
    for (const uid of warehouseUsers) {
      await prisma.notification.create({
        data: {
          userId: uid,
          title: e.severity === 'Critical' ? '⚠️ СРОЧНО: партия истекает!' : 'Срок годности партии',
          message: `${product?.name || 'Товар'} (${e.batch.batchNo}): срок истекает через ${e.daysLeft} ${e.daysLeft === 1 ? 'день' : e.daysLeft < 5 ? 'дня' : 'дней'}. Остаток: ${e.batch.remainingQty} ${product?.unit || 'шт'}.`,
          type: e.severity === 'Critical' ? 'error' : e.severity === 'Warning' ? 'warning' : 'info',
          link: `/expiry`,
        },
      });
    }
  }
  // Also notify admin
  for (const e of expiringBatchInfo) {
    const product = products.find((p) => p.id === e.batch.productId);
    await prisma.notification.create({
      data: {
        userId: users[0].id,
        title: `Срок годности: ${e.daysLeft} дн.`,
        message: `${product?.name} (партия ${e.batch.batchNo}) истекает ${e.batch.expiryDate!.toISOString().slice(0, 10)}`,
        type: e.severity === 'Critical' ? 'error' : 'warning',
        link: `/expiry`,
      },
    });
  }
  console.log('Created expiry alert notifications');

  // ── Cash Registers & Bank Accounts ──
  const cashRegisters = await Promise.all([
    prisma.cashRegister.create({ data: { name: 'Главная касса (KZT)', currency: 'KZT', balance: 2500000 } }),
    prisma.cashRegister.create({ data: { name: 'Касса Шымкент (KZT)', currency: 'KZT', balance: 480000 } }),
  ]);
  const bankAccounts = await Promise.all([
    prisma.bankAccount.create({ data: { name: 'Halyk Bank (KZT)', accountNo: 'KZ12345Halyk001KZT', bik: 'HSBKKZKX', bankName: 'Halyk Bank', currency: 'KZT', balance: 15750000 } }),
    prisma.bankAccount.create({ data: { name: 'Kaspi Bank (USD)', accountNo: 'KZ54321Kaspi002USD', bik: 'CASPKZKX', bankName: 'Kaspi Bank', currency: 'USD', balance: 12000 } }),
    prisma.bankAccount.create({ data: { name: 'ForteBank (KZT)', accountNo: 'KZ99876Forte003KZT', bik: 'IRTYKZKA', bankName: 'ForteBank', currency: 'KZT', balance: 5400000 } }),
  ]);
  console.log(`Created ${cashRegisters.length} cash registers, ${bankAccounts.length} bank accounts`);

  // ── Chart of Accounts ──
  const chartAccounts = await Promise.all([
    { code: '1010', name: 'Касса', type: 'Asset', isActive: true },
    { code: '1030', name: 'Расчётный счёт', type: 'Asset', isActive: true },
    { code: '1210', name: 'Товары на складе', type: 'Asset', isActive: true, vat: true },
    { code: '2210', name: 'Расчёты с поставщиками', type: 'Liability', isActive: true },
    { code: '3010', name: 'Уставный капитал', type: 'Equity', isActive: true },
    { code: '6010', name: 'Выручка от реализации', type: 'Income', isActive: true, vat: true },
    { code: '7010', name: 'Себестоимость товаров', type: 'Expense', isActive: true },
    { code: '7020', name: 'Зарплата', type: 'Expense', isActive: true },
  ].map((a) => prisma.chartOfAccounts.create({ data: a })));
  console.log(`Created ${chartAccounts.length} chart of accounts`);

  // ── Cash & Bank Orders ──
  const cashOrders = await Promise.all([
    { registerId: cashRegisters[0].id, type: 'Income', amount: 850000, counterparty: 'Самұрық-Қазына', basis: 'Оплата по счёту SF-001245', userId: users[0].id },
    { registerId: cashRegisters[0].id, type: 'Expense', amount: 125000, counterparty: 'ИП "Запчасть.KZ"', basis: 'Аванс за подшипники SP-004', userId: users[0].id },
    { registerId: cashRegisters[1].id, type: 'Income', amount: 320000, counterparty: 'Рамстор', basis: 'Оплата по накладной №NR-2024-09', userId: users[3].id },
  ].map((o) => prisma.cashOrder.create({ data: o })));
  const bankOrders = await Promise.all([
    { accountId: bankAccounts[0].id, type: 'Incoming', amount: 5400000, counterparty: 'Қазақмыс Корпорациясы', counterpartyInn: '550140023456', purpose: 'Оплата по договору ДГ-2024-002', userId: users[0].id, status: 'Completed' },
    { accountId: bankAccounts[0].id, type: 'Outgoing', amount: 1750000, counterparty: 'ТОО "АлматыТехСнаб"', counterpartyInn: '080140012345', purpose: 'Оплата поставки №ПН-2024-44', userId: users[0].id, status: 'Completed' },
    { accountId: bankAccounts[2].id, type: 'Outgoing', amount: 980000, counterparty: 'АО "КазОфисТорг"', counterpartyInn: '550140023456', purpose: 'Канцелярия на июнь', userId: users[1].id, status: 'Pending' },
  ].map((o) => prisma.bankOrder.create({ data: o })));
  console.log(`Created ${cashOrders.length} cash orders, ${bankOrders.length} bank orders`);

  // ── Product Receipts (поступления) ──
  const receiptSeeds = [
    { number: 'ПН-2024-44', supplierId: suppliers[0].id, supplierName: suppliers[0].name, warehouseId: warehouses[0].id, invoiceNumber: 'СФ-IN-00234', status: 'Posted' },
    { number: 'ПН-2024-45', supplierId: suppliers[1].id, supplierName: suppliers[1].name, warehouseId: warehouses[0].id, invoiceNumber: 'СФ-IN-00235', status: 'Posted' },
    { number: 'ПН-2024-46', supplierId: suppliers[2].id, supplierName: suppliers[2].name, warehouseId: warehouses[1].id, status: 'Draft' },
    { number: 'ПН-2025-01', supplierId: suppliers[0].id, supplierName: suppliers[0].name, warehouseId: warehouses[0].id, invoiceNumber: 'СФ-IN-00241', status: 'Posted' },
  ];
  const receipts = await Promise.all(receiptSeeds.map((r) => prisma.productReceipt.create({ data: { ...r, userId: users[3].id } })));

  // Add receipt items
  for (let i = 0; i < receipts.length; i++) {
    const r = receipts[i];
    const itemCount = 2 + (i % 2);
    let subtotal = 0;
    let vatAmount = 0;
    for (let j = 0; j < itemCount; j++) {
      const prod = products[(i * 2 + j) % products.length];
      const qty = 5 + j * 3;
      const price = prod.unitPrice * 0.6;
      const vat = price * qty * 0.12;
      await prisma.productReceiptItem.create({
        data: { receiptId: r.id, productId: prod.id, warehouseId: r.warehouseId, quantity: qty, unitPrice: price, costPrice: price, vatAmount: vat, totalAmount: price * qty + vat },
      });
      subtotal += price * qty;
      vatAmount += vat;
    }
    await prisma.productReceipt.update({ where: { id: r.id }, data: { subtotal, vatAmount, totalAmount: subtotal + vatAmount } });
  }
  console.log(`Created ${receipts.length} product receipts with items`);

  // ── Product Issues (списания/продажи) ──
  const issueSeeds = [
    { number: 'РАС-2024-12', type: 'Sale', warehouseId: warehouses[0].id, customerId: customers[0].id, status: 'Posted', notes: 'Отгрузка по заказу', userId: users[3].id },
    { number: 'РАС-2024-13', type: 'Sale', warehouseId: warehouses[0].id, customerId: customers[2].id, status: 'Posted', userId: users[3].id },
    { number: 'СПС-2024-04', type: 'WriteOff', warehouseId: warehouses[0].id, status: 'Posted', reason: 'Брак', notes: 'Списание повреждённого товара', userId: users[3].id },
    { number: 'РАС-2025-01', type: 'Sale', warehouseId: warehouses[1].id, customerId: customers[4].id, status: 'Draft', userId: users[4].id },
  ];
  const issues = await Promise.all(issueSeeds.map((i) => prisma.productIssue.create({ data: i as any })));

  for (let i = 0; i < issues.length; i++) {
    const iss = issues[i];
    const itemCount = 1 + (i % 3);
    let total = 0;
    for (let j = 0; j < itemCount; j++) {
      const prod = products[(i + j) % products.length];
      const qty = 2 + j;
      const price = prod.unitPrice;
      total += price * qty;
      await prisma.productIssueItem.create({
        data: { issueId: iss.id, productId: prod.id, warehouseId: iss.warehouseId, quantity: qty, unitPrice: price, costPrice: price * 0.7, totalAmount: price * qty },
      });
    }
    await prisma.productIssue.update({ where: { id: iss.id }, data: { totalAmount: total } });
  }
  console.log(`Created ${issues.length} product issues with items`);

  // ── Product Transfers (перемещения) ──
  const transferSeeds = [
    { number: 'ПЕР-2024-08', fromWarehouseId: warehouses[0].id, toWarehouseId: warehouses[1].id, reason: 'Перебалансировка', status: 'Posted', userId: users[3].id },
    { number: 'ПЕР-2024-09', fromWarehouseId: warehouses[0].id, toWarehouseId: warehouses[2].id, reason: 'Заявка филиала', status: 'Posted', userId: users[4].id },
    { number: 'ПЕР-2025-01', fromWarehouseId: warehouses[1].id, toWarehouseId: warehouses[0].id, reason: 'Возврат невостребованного', status: 'Draft', userId: users[3].id },
  ];
  const transfers = await Promise.all(transferSeeds.map((t) => prisma.productTransfer.create({ data: t as any })));

  for (let i = 0; i < transfers.length; i++) {
    const t = transfers[i];
    const prod = products[i * 2 % products.length];
    await prisma.productTransferItem.create({
      data: { transferId: t.id, productId: prod.id, quantity: 5 + i * 2, costPrice: prod.unitPrice * 0.7 },
    });
    await prisma.productTransferItem.create({
      data: { transferId: t.id, productId: products[(i * 2 + 1) % products.length].id, quantity: 3 + i, costPrice: products[(i * 2 + 1) % products.length].unitPrice * 0.7 },
    });
  }
  console.log(`Created ${transfers.length} product transfers with items`);

  // ── Workshops + TechCards + Production Orders ──
  const workshops = await Promise.all([
    prisma.workshop.create({ data: { name: 'Цех №1: Электроника', headId: users[2].id } }),
    prisma.workshop.create({ data: { name: 'Цех №2: Сборка', headId: users[3].id } }),
  ]);

  const techCard1 = await prisma.techCard.create({
    data: {
      name: 'Сборка ПК "Office Basic"',
      outputProductId: products[4].id, // Жүйелік блок Dell
      outputQuantity: 1,
      inputs: {
        create: [
          { productId: products[0].id, quantity: 1, waste: 0 },     // ноутбук → нет, нужно другое
        ],
      },
    },
  });
  // add proper inputs
  await prisma.productBomInput.create({ data: { techCardId: techCard1.id, productId: products[0].id, quantity: 1, waste: 0 } });
  await prisma.productBomInput.create({ data: { techCardId: techCard1.id, productId: products[2].id, quantity: 1, waste: 0 } });
  await prisma.productBomInput.create({ data: { techCardId: techCard1.id, productId: products[3].id, quantity: 1, waste: 0 } });

  const techCard2 = await prisma.techCard.create({
    data: { name: 'Комплект "Рабочее место"', outputProductId: products[0].id, outputQuantity: 1 },
  });
  await prisma.productBomInput.create({ data: { techCardId: techCard2.id, productId: products[2].id, quantity: 1, waste: 0 } });
  await prisma.productBomInput.create({ data: { techCardId: techCard2.id, productId: products[3].id, quantity: 1, waste: 0 } });

  const productionOrders = await Promise.all([
    prisma.productionOrder.create({ data: { number: 'ПР-2024-12', techCardId: techCard1.id, workshopId: workshops[0].id, quantity: 5, status: 'Completed', plannedDate: new Date('2024-12-01'), finishedDate: new Date('2024-12-05') } }),
    prisma.productionOrder.create({ data: { number: 'ПР-2025-01', techCardId: techCard2.id, workshopId: workshops[1].id, quantity: 10, status: 'InProgress', plannedDate: new Date('2025-01-15') } }),
    prisma.productionOrder.create({ data: { number: 'ПР-2025-02', techCardId: techCard1.id, workshopId: workshops[0].id, quantity: 3, status: 'Planned', plannedDate: new Date('2025-02-20') } }),
  ]);
  console.log(`Created ${workshops.length} workshops, 2 tech cards, ${productionOrders.length} production orders`);

  // ── Timesheets + Payroll ──
  const timesheetSeeds: any[] = [];
  for (const emp of employees) {
    for (let d = 0; d < 10; d++) {
      const date = new Date(Date.now() - d * 86400000);
      timesheetSeeds.push({
        employeeId: emp.id,
        date,
        hours: 8,
        overtime: d % 4 === 0 ? 2 : 0,
        type: 'Regular',
      });
    }
  }
  await prisma.timesheet.createMany({ data: timesheetSeeds });
  console.log(`Created ${timesheetSeeds.length} timesheet entries`);

  const payrollSeeds = employees.map((e, idx) => ({
    employeeId: e.id,
    period: '2025-05',
    baseSalary: e.salary,
    overtime: idx % 2 === 0 ? 15000 : 0,
    bonus: idx === 0 ? 200000 : 50000,
    deductions: e.salary * 0.1,
    tax: (e.salary - e.salary * 0.1) * 0.1,
    netPay: e.salary - e.salary * 0.1 - (e.salary - e.salary * 0.1) * 0.1,
    status: 'Paid',
    userId: users[0].id,
    paidAt: new Date(),
  }));
  await prisma.payrollEntry.createMany({ data: payrollSeeds as any[] });
  console.log(`Created ${payrollSeeds.length} payroll entries`);

  // ── Documents (ERP-style) ──
  const documentSeeds = [
    { number: 'РН-2024-00012', type: 'SalesInvoice', posted: true, postedAt: new Date('2024-12-10'), customerId: customers[0].id, contractId: contracts[0].id, createdById: users[0].id, postedById: users[0].id, totalAmount: 1350000, vatAmount: 144643, description: 'Реализация: ноутбук + монитор' },
    { number: 'ПН-2024-00044', type: 'PurchaseInvoice', posted: true, postedAt: new Date('2024-12-08'), customerId: null, createdById: users[1].id, postedById: users[0].id, totalAmount: 540000, vatAmount: 57857, description: 'Поступление от АлматыТехСнаб' },
    { number: 'ПКО-2024-00102', type: 'CashReceipt', posted: true, postedAt: new Date('2024-12-11'), customerId: customers[0].id, createdById: users[0].id, postedById: users[0].id, totalAmount: 850000, description: 'Оплата от Самұрық-Қазына' },
    { number: 'РКО-2024-00088', type: 'CashExpense', posted: true, postedAt: new Date('2024-12-12'), createdById: users[0].id, postedById: users[0].id, totalAmount: 125000, description: 'Аванс поставщику' },
    { number: 'БП-2024-00033', type: 'BankPayment', posted: true, postedAt: new Date('2024-12-12'), createdById: users[0].id, postedById: users[0].id, totalAmount: 1750000, description: 'Оплата ТОО "АлматыТехСнаб"' },
    { number: 'ЗП-2025-05', type: 'Payroll', posted: true, postedAt: new Date('2025-05-31'), createdById: users[0].id, postedById: users[0].id, totalAmount: 2336000, description: 'Зарплата за май 2025' },
    { number: 'РН-2025-00001', type: 'SalesInvoice', posted: false, customerId: customers[2].id, createdById: users[1].id, totalAmount: 0, description: 'Черновик: реализация Technodom' },
  ];
  const documents = await Promise.all(documentSeeds.map((d) => prisma.document.create({ data: d as any })));
  console.log(`Created ${documents.length} documents`);

  // Add document items
  await prisma.documentItem.create({ data: { documentId: documents[0].id, productId: products[0].id, quantity: 2, unitPrice: 450000, vatRate: 12, vatAmount: 96429, total: 964286 } });
  await prisma.documentItem.create({ data: { documentId: documents[0].id, productId: products[2].id, quantity: 1, unitPrice: 120000, vatRate: 12, vatAmount: 12857, total: 128571 } });
  await prisma.documentItem.create({ data: { documentId: documents[1].id, productId: products[1].id, quantity: 5, unitPrice: 85000, vatRate: 12, vatAmount: 45536, total: 424107 } });
  console.log('Created document items');

  // ── Permissions (must match SYSTEM_PERMISSIONS in rbac.service.ts) ──
  const systemPermissions: { key: string; description: string; resource: string; action: string }[] = [
    { key: 'accounting.access', description: 'Доступ к бухгалтерии', resource: 'accounting', action: 'access' },
    { key: 'accounting.read', description: 'Чтение бухгалтерии', resource: 'accounting', action: 'read' },
    { key: 'accounting.write', description: 'Запись бухгалтерии', resource: 'accounting', action: 'write' },
    { key: 'accounting.post', description: 'Проведение бухгалтерии', resource: 'accounting', action: 'post' },
    { key: 'cash.access', description: 'Доступ к кассе', resource: 'cash', action: 'access' },
    { key: 'cash.read', description: 'Чтение кассы', resource: 'cash', action: 'read' },
    { key: 'cash.write', description: 'Запись кассы', resource: 'cash', action: 'write' },
    { key: 'cash.order.read', description: 'Чтение кассовых ордеров', resource: 'cash', action: 'order.read' },
    { key: 'cash.order.write', description: 'Создание кассовых ордеров', resource: 'cash', action: 'order.write' },
    { key: 'cash.register.write', description: 'Управление кассами', resource: 'cash', action: 'register.write' },
    { key: 'bank.access', description: 'Доступ к банку', resource: 'bank', action: 'access' },
    { key: 'bank.read', description: 'Чтение банка', resource: 'bank', action: 'read' },
    { key: 'bank.write', description: 'Запись банка', resource: 'bank', action: 'write' },
    { key: 'bank.confirm', description: 'Подтверждение банковских операций', resource: 'bank', action: 'confirm' },
    { key: 'bank.account.write', description: 'Управление счетами', resource: 'bank', action: 'account.write' },
    { key: 'bank.order.read', description: 'Чтение банковских ордеров', resource: 'bank', action: 'order.read' },
    { key: 'bank.order.write', description: 'Создание банковских ордеров', resource: 'bank', action: 'order.write' },
    { key: 'warehouse.access', description: 'Доступ к складу', resource: 'warehouse', action: 'access' },
    { key: 'warehouse.read', description: 'Чтение склада', resource: 'warehouse', action: 'read' },
    { key: 'warehouse.write', description: 'Запись склада', resource: 'warehouse', action: 'write' },
    { key: 'warehouse.transfer', description: 'Перемещение товаров', resource: 'warehouse', action: 'transfer' },
    { key: 'production.access', description: 'Доступ к производству', resource: 'production', action: 'access' },
    { key: 'production.read', description: 'Чтение производства', resource: 'production', action: 'read' },
    { key: 'production.write', description: 'Запись производства', resource: 'production', action: 'write' },
    { key: 'production.start', description: 'Запуск производства', resource: 'production', action: 'start' },
    { key: 'production.complete', description: 'Завершение производства', resource: 'production', action: 'complete' },
    { key: 'hr.access', description: 'Доступ к кадрам', resource: 'hr', action: 'access' },
    { key: 'hr.read', description: 'Чтение кадров', resource: 'hr', action: 'read' },
    { key: 'hr.write', description: 'Запись кадров', resource: 'hr', action: 'write' },
    { key: 'hr.payroll', description: 'Начисление зарплаты', resource: 'hr', action: 'payroll' },
    { key: 'documents.access', description: 'Доступ к документам', resource: 'documents', action: 'access' },
    { key: 'documents.read', description: 'Чтение документов', resource: 'documents', action: 'read' },
    { key: 'documents.write', description: 'Запись документов', resource: 'documents', action: 'write' },
    { key: 'documents.post', description: 'Проведение документов', resource: 'documents', action: 'post' },
    { key: 'documents.approve', description: 'Утверждение документов', resource: 'documents', action: 'approve' },
    { key: 'inventory.read', description: 'Чтение инвентаря', resource: 'inventory', action: 'read' },
    { key: 'inventory.write', description: 'Запись инвентаря', resource: 'inventory', action: 'write' },
    { key: 'orders.read', description: 'Чтение заказов', resource: 'orders', action: 'read' },
    { key: 'orders.write', description: 'Запись заказов', resource: 'orders', action: 'write' },
    { key: 'crm.read', description: 'Чтение CRM', resource: 'crm', action: 'read' },
    { key: 'crm.write', description: 'Запись CRM', resource: 'crm', action: 'write' },
    { key: 'reports.read', description: 'Чтение отчётов', resource: 'reports', action: 'read' },
    { key: 'ai.read', description: 'Чтение AI', resource: 'ai', action: 'read' },
    { key: 'admin.users', description: 'Управление пользователями', resource: 'admin', action: 'users' },
    { key: 'admin.config', description: 'Управление конфигурацией', resource: 'admin', action: 'config' },
    { key: 'configurator.access', description: 'Доступ к конфигуратору', resource: 'configurator', action: 'access' },
  ];
  const allPermKeys = systemPermissions.map((p) => p.key);
  const permissions = await Promise.all(systemPermissions.map((p) => prisma.permission.create({ data: p })));
  console.log(`Created ${permissions.length} permissions`);

  // ── System Roles (must match seedSystemRoles in rbac.service.ts) ──
  const adminRole = await prisma.role.create({ data: { name: 'Администратор', description: 'Полный доступ', isSystem: true } });
  const accountantRole = await prisma.role.create({ data: { name: 'Бухгалтер', description: 'Бухгалтерия', isSystem: true } });
  const cashierRole = await prisma.role.create({ data: { name: 'Кассир', description: 'Касса', isSystem: true } });
  const managerRole = await prisma.role.create({ data: { name: 'Менеджер по продажам', description: 'CRM + Заказы', isSystem: true } });
  const warehouseRole = await prisma.role.create({ data: { name: 'Кладовщик', description: 'Склад', isSystem: true } });
  const productionRole = await prisma.role.create({ data: { name: 'Производство', description: 'Цеха', isSystem: true } });
  const hrRole = await prisma.role.create({ data: { name: 'HR', description: 'Кадры', isSystem: true } });

  const permByKey: Record<string, number> = {};
  permissions.forEach((p) => { permByKey[p.key] = p.id; });

  // Admin gets all
  for (const k of allPermKeys) {
    await prisma.rolePermission.create({ data: { roleId: adminRole.id, permissionId: permByKey[k] } });
  }
  // Accountant
  for (const k of ['accounting.read', 'accounting.write', 'accounting.post', 'cash.read', 'cash.write', 'bank.read', 'bank.write', 'documents.read', 'reports.read', 'accounting.access', 'cash.access', 'bank.access', 'documents.access', 'cash.order.read', 'cash.order.write', 'cash.register.write', 'bank.account.write', 'bank.order.read', 'bank.order.write']) {
    if (permByKey[k]) await prisma.rolePermission.create({ data: { roleId: accountantRole.id, permissionId: permByKey[k] } });
  }
  // Cashier
  for (const k of ['cash.read', 'cash.write', 'documents.read', 'cash.access', 'cash.order.read', 'cash.order.write', 'cash.register.write', 'documents.access']) {
    if (permByKey[k]) await prisma.rolePermission.create({ data: { roleId: cashierRole.id, permissionId: permByKey[k] } });
  }
  // Manager
  for (const k of ['crm.read', 'crm.write', 'orders.read', 'orders.write', 'inventory.read', 'documents.read', 'documents.write', 'documents.post', 'documents.approve', 'documents.access', 'warehouse.access', 'warehouse.read']) {
    if (permByKey[k]) await prisma.rolePermission.create({ data: { roleId: managerRole.id, permissionId: permByKey[k] } });
  }
  // Warehouse
  for (const k of ['warehouse.read', 'warehouse.write', 'warehouse.transfer', 'warehouse.access', 'inventory.read', 'inventory.write']) {
    if (permByKey[k]) await prisma.rolePermission.create({ data: { roleId: warehouseRole.id, permissionId: permByKey[k] } });
  }
  // Production
  for (const k of ['production.read', 'production.write', 'production.start', 'production.complete', 'production.access', 'inventory.read', 'warehouse.access', 'warehouse.read']) {
    if (permByKey[k]) await prisma.rolePermission.create({ data: { roleId: productionRole.id, permissionId: permByKey[k] } });
  }
  // HR
  for (const k of ['hr.read', 'hr.write', 'hr.payroll', 'hr.access', 'documents.read', 'documents.access']) {
    if (permByKey[k]) await prisma.rolePermission.create({ data: { roleId: hrRole.id, permissionId: permByKey[k] } });
  }

  // ── Assign roles to users ──
  await prisma.userRoleAssignment.create({ data: { userId: users[0].id, roleId: adminRole.id, scope: 'ALL' } });
  await prisma.userRoleAssignment.create({ data: { userId: users[1].id, roleId: managerRole.id, scope: 'ALL' } });
  await prisma.userRoleAssignment.create({ data: { userId: users[2].id, roleId: managerRole.id, scope: 'ALL' } });
  await prisma.userRoleAssignment.create({ data: { userId: users[3].id, roleId: warehouseRole.id, scope: 'ALL' } });
  await prisma.userRoleAssignment.create({ data: { userId: users[4].id, roleId: warehouseRole.id, scope: 'ALL' } });
  console.log('Created 7 system roles and assigned 5 users to roles');

  // ── Scheduled Jobs (handlers must match SchedulerService.callHandler) ──
  const jobs = await Promise.all([
    { name: 'Проверка сроков годности', cron: '0 7 * * *', handler: 'checkExpiry', enabled: true, lastRunAt: new Date(Date.now() - 86400000), lastStatus: 'OK', nextRunAt: new Date(Date.now() + 86400000) },
    { name: 'Проверка остатков', cron: '0 9 * * *', handler: 'checkInventory', enabled: true, lastRunAt: new Date(Date.now() - 86400000), lastStatus: 'OK', nextRunAt: new Date(Date.now() + 86400000) },
    { name: 'Проверка просроченных задач', cron: '0 8 * * *', handler: 'checkOverdueTasks', enabled: true, lastRunAt: new Date(Date.now() - 86400000), lastStatus: 'OK', nextRunAt: new Date(Date.now() + 86400000) },
    { name: 'Закрытие месяца', cron: '0 2 1 * *', handler: 'closeMonth', enabled: false, lastStatus: 'Skipped' },
  ].map((j) => prisma.scheduledJob.create({ data: j as any })));
  console.log(`Created ${jobs.length} scheduled jobs`);

  // ── Config Objects + Print Templates ──
  const configObj = await prisma.configObject.create({
    data: {
      kind: 'Document',
      name: 'SalesInvoice',
      description: 'Конфигурация документа "Реализация товаров"',
      schema: { fields: ['number', 'date', 'customer', 'items', 'total', 'vat'], required: ['number', 'date', 'customer'] },
      isActive: true,
    },
  });
  await prisma.printTemplate.create({
    data: { name: 'Sales Invoice (Standard)', documentType: 'SalesInvoice', template: { header: 'ТОО "SupplyFlow"', footer: 'Спасибо за покупку!', columns: ['name', 'quantity', 'unitPrice', 'total'] }, isDefault: true },
  });
  await prisma.printTemplate.create({
    data: { name: 'Purchase Invoice', documentType: 'PurchaseInvoice', template: { header: 'Поступление товаров', columns: ['name', 'quantity', 'unitPrice', 'vat', 'total'] } },
  });
  console.log('Created config objects and print templates');

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
// Rebuild trigger Sat Jun  6 02:55:03 +05 2026
