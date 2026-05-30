"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = __importStar(require("bcryptjs"));
var prisma = new client_1.PrismaClient();
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        // Helper: pick random items ensuring category consistency for realism
        function pickItems(count) {
            var categoryGroups = {};
            products.forEach(function (_, idx) {
                var cat = productSeeds[idx].category;
                if (!categoryGroups[cat])
                    categoryGroups[cat] = [];
                categoryGroups[cat].push(idx);
            });
            var cats = Object.keys(categoryGroups);
            // Pick a random category, then pick random products from it
            var chosenCat = cats[randomInt(0, cats.length - 1)];
            var pool = categoryGroups[chosenCat];
            var selected = [];
            var used = new Set();
            for (var i = 0; i < count; i++) {
                var idx = void 0;
                var attempts = 0;
                do {
                    idx = pool[randomInt(0, pool.length - 1)];
                    attempts++;
                } while (used.has(idx) && attempts < 20);
                used.add(idx);
                selected.push({ productIdx: idx, quantity: randomInt(1, 10) });
            }
            return selected;
        }
        function addOrder(order) {
            orderSeeds.push(order);
            customerOrderCounts[order.customerIdx] = (customerOrderCounts[order.customerIdx] || 0) + 1;
            if (!customerLastOrder[order.customerIdx] || order.date > customerLastOrder[order.customerIdx]) {
                customerLastOrder[order.customerIdx] = order.date;
            }
            for (var _i = 0, _a = order.items; _i < _a.length; _i++) {
                var item = _a[_i];
                if (order.status === 'Delivered' || order.status === 'Shipped') {
                    productQtyAdjustments[item.productIdx] = (productQtyAdjustments[item.productIdx] || 0) - item.quantity;
                }
                if (order.status === 'Reserved' || order.status === 'Confirmed') {
                    productReservedAdjustments[item.productIdx] = (productReservedAdjustments[item.productIdx] || 0) + item.quantity;
                }
            }
        }
        var userSeeds, users, customerSeeds, customers, productSeeds, products, now, d2to3yrAgo, d1to2yrAgo, d3to12moAgo, recentDays, recentWeeks, orderSeeds, customerOrderCounts, customerLastOrder, productQtyAdjustments, productReservedAdjustments, i, date, i, date, i, date, lowStockProductIdxs, statuses, i, date, deadline, prodIdx, i, date, i, date, customerIdx, _i, orderSeeds_1, s, itemsWithPrice, totalAmount, costAmount, _a, _b, _c, idxStr, adjustment, idx, _d, _e, _f, idxStr, adjustment, idx, _g, _h, _j, idxStr, count, idx;
        var _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    console.log('Seeding database...');
                    // Clear all tables in correct order for referential integrity
                    return [4 /*yield*/, prisma.orderItem.deleteMany()];
                case 1:
                    // Clear all tables in correct order for referential integrity
                    _l.sent();
                    return [4 /*yield*/, prisma.inventoryLog.deleteMany()];
                case 2:
                    _l.sent();
                    return [4 /*yield*/, prisma.systemLog.deleteMany()];
                case 3:
                    _l.sent();
                    return [4 /*yield*/, prisma.contactLog.deleteMany()];
                case 4:
                    _l.sent();
                    return [4 /*yield*/, prisma.complaint.deleteMany()];
                case 5:
                    _l.sent();
                    return [4 /*yield*/, prisma.order.deleteMany()];
                case 6:
                    _l.sent();
                    return [4 /*yield*/, prisma.customer.deleteMany()];
                case 7:
                    _l.sent();
                    return [4 /*yield*/, prisma.product.deleteMany()];
                case 8:
                    _l.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 9:
                    _l.sent();
                    return [4 /*yield*/, prisma.appConfig.deleteMany()];
                case 10:
                    _l.sent();
                    console.log('Cleared all tables');
                    userSeeds = [
                        { email: 'admin@supplyflow.kz', password: bcrypt.hashSync('admin123', 10), fullName: 'Арман Нұрланұлы', role: 'Admin' },
                        { email: 'manager1@supplyflow.kz', password: bcrypt.hashSync('manager123', 10), fullName: 'Айгүл Серікқызы', role: 'Manager' },
                        { email: 'manager2@supplyflow.kz', password: bcrypt.hashSync('manager123', 10), fullName: 'Бауыржан Ермеков', role: 'Manager' },
                        { email: 'warehouse1@supplyflow.kz', password: bcrypt.hashSync('warehouse123', 10), fullName: 'Нұржан Қайратов', role: 'Warehouse' },
                        { email: 'warehouse2@supplyflow.kz', password: bcrypt.hashSync('warehouse123', 10), fullName: 'Гүлмира Ахметова', role: 'Warehouse' },
                    ];
                    return [4 /*yield*/, Promise.all(userSeeds.map(function (u) { return prisma.user.create({ data: u }); }))];
                case 11:
                    users = _l.sent();
                    console.log("Created ".concat(users.length, " users"));
                    customerSeeds = [
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
                    return [4 /*yield*/, Promise.all(customerSeeds.map(function (c) { return prisma.customer.create({ data: c }); }))];
                case 12:
                    customers = _l.sent();
                    console.log("Created ".concat(customers.length, " customers"));
                    productSeeds = [
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
                    return [4 /*yield*/, Promise.all(productSeeds.map(function (p) { return prisma.product.create({ data: p }); }))];
                case 13:
                    products = _l.sent();
                    console.log("Created ".concat(products.length, " products"));
                    // ── AppConfig ──
                    return [4 /*yield*/, prisma.appConfig.create({ data: { key: 'beta', value: '0.05' } })];
                case 14:
                    // ── AppConfig ──
                    _l.sent();
                    return [4 /*yield*/, prisma.appConfig.create({ data: { key: 'company_name', value: 'SupplyFlow Ltd.' } })];
                case 15:
                    _l.sent();
                    console.log('Created AppConfig entries');
                    now = new Date();
                    d2to3yrAgo = { start: new Date('2023-05-28'), end: new Date('2024-05-28') };
                    d1to2yrAgo = { start: new Date('2024-05-28'), end: new Date('2025-05-28') };
                    d3to12moAgo = { start: new Date('2025-05-28'), end: new Date('2026-02-28') };
                    recentDays = { start: new Date(now.getTime() - 5 * 86400000), end: now };
                    recentWeeks = { start: new Date(now.getTime() - 28 * 86400000), end: new Date(now.getTime() - 5 * 86400000) };
                    orderSeeds = [];
                    customerOrderCounts = {};
                    customerLastOrder = {};
                    productQtyAdjustments = {};
                    productReservedAdjustments = {};
                    // ── 10 Delivered, 2-3 years ago ──
                    for (i = 0; i < 10; i++) {
                        date = randomDate(d2to3yrAgo.start, d2to3yrAgo.end);
                        addOrder({
                            customerIdx: randomInt(0, 9),
                            userIdx: randomInt(0, 4),
                            status: 'Delivered',
                            date: date,
                            deadline: new Date(date.getTime() + randomInt(3, 21) * 86400000),
                            items: pickItems(randomInt(1, 3)),
                        });
                    }
                    // ── 15 Delivered, 1-2 years ago ──
                    for (i = 0; i < 15; i++) {
                        date = randomDate(d1to2yrAgo.start, d1to2yrAgo.end);
                        addOrder({
                            customerIdx: randomInt(0, 9),
                            userIdx: randomInt(0, 4),
                            status: 'Delivered',
                            date: date,
                            deadline: new Date(date.getTime() + randomInt(3, 21) * 86400000),
                            items: pickItems(randomInt(1, 3)),
                        });
                    }
                    // ── 15 Delivered, 3-12 months ago ──
                    for (i = 0; i < 15; i++) {
                        date = randomDate(d3to12moAgo.start, d3to12moAgo.end);
                        addOrder({
                            customerIdx: randomInt(0, 9),
                            userIdx: randomInt(0, 4),
                            status: 'Delivered',
                            date: date,
                            deadline: new Date(date.getTime() + randomInt(3, 21) * 86400000),
                            items: pickItems(randomInt(1, 3)),
                        });
                    }
                    lowStockProductIdxs = [4, 2, 14, 12, 10, 8];
                    statuses = ['Pending', 'Pending', 'Pending', 'Reserved', 'Reserved'];
                    for (i = 0; i < 5; i++) {
                        date = randomDate(recentDays.start, recentDays.end);
                        deadline = new Date(now.getTime() + randomInt(24, 72) * 3600000);
                        prodIdx = lowStockProductIdxs[i % lowStockProductIdxs.length];
                        addOrder({
                            customerIdx: randomInt(0, 9),
                            userIdx: randomInt(0, 4),
                            status: statuses[i],
                            date: date,
                            deadline: deadline,
                            items: __spreadArray([
                                { productIdx: prodIdx, quantity: randomInt(1, 3) }
                            ], (i % 2 === 0 ? [{ productIdx: randomInt(0, 14), quantity: randomInt(1, 5) }] : []), true),
                            notes: statuses[i] === 'Pending' ? 'Жеткізу шұғыл' : 'Тауар резервте',
                        });
                    }
                    // ── 3 Shipped, recent weeks ──
                    for (i = 0; i < 3; i++) {
                        date = randomDate(recentWeeks.start, recentWeeks.end);
                        addOrder({
                            customerIdx: randomInt(0, 9),
                            userIdx: randomInt(0, 4),
                            status: 'Shipped',
                            date: date,
                            deadline: new Date(date.getTime() + randomInt(3, 14) * 86400000),
                            items: pickItems(randomInt(1, 2)),
                            notes: 'Жөнелтілді',
                        });
                    }
                    // ── 2 Cancelled ──
                    for (i = 0; i < 2; i++) {
                        date = randomDate(d1to2yrAgo.start, d3to12moAgo.end);
                        customerIdx = i === 0 ? 6 : randomInt(0, 9);
                        addOrder({
                            customerIdx: customerIdx,
                            userIdx: randomInt(0, 4),
                            status: 'Cancelled',
                            date: date,
                            deadline: new Date(date.getTime() + randomInt(3, 14) * 86400000),
                            items: pickItems(randomInt(1, 2)),
                            notes: 'Бұйрықтан бас тартылды',
                        });
                    }
                    _i = 0, orderSeeds_1 = orderSeeds;
                    _l.label = 16;
                case 16:
                    if (!(_i < orderSeeds_1.length)) return [3 /*break*/, 19];
                    s = orderSeeds_1[_i];
                    itemsWithPrice = s.items.map(function (item) { return ({
                        productId: products[item.productIdx].id,
                        quantity: item.quantity,
                        unitPrice: products[item.productIdx].unitPrice,
                    }); });
                    totalAmount = itemsWithPrice.reduce(function (sum, i) { return sum + i.unitPrice * i.quantity; }, 0);
                    costAmount = totalAmount * 0.7;
                    return [4 /*yield*/, prisma.order.create({
                            data: {
                                customerId: customers[s.customerIdx].id,
                                userId: users[s.userIdx].id,
                                status: s.status,
                                totalAmount: totalAmount,
                                costAmount: costAmount,
                                deliveryAddress: "\u0433. \u0410\u043B\u043C\u0430\u0442\u044B, \u0443\u043B. \u0410\u0431\u0430\u044F, \u0434. ".concat(randomInt(1, 200)),
                                deadline: s.deadline,
                                notes: (_k = s.notes) !== null && _k !== void 0 ? _k : null,
                                createdAt: s.date,
                                updatedAt: s.date,
                                items: {
                                    create: itemsWithPrice,
                                },
                            },
                        })];
                case 17:
                    _l.sent();
                    _l.label = 18;
                case 18:
                    _i++;
                    return [3 /*break*/, 16];
                case 19:
                    console.log("Created ".concat(orderSeeds.length, " orders with items"));
                    _a = 0, _b = Object.entries(productQtyAdjustments);
                    _l.label = 20;
                case 20:
                    if (!(_a < _b.length)) return [3 /*break*/, 23];
                    _c = _b[_a], idxStr = _c[0], adjustment = _c[1];
                    idx = parseInt(idxStr);
                    return [4 /*yield*/, prisma.product.update({
                            where: { id: products[idx].id },
                            data: { quantityOnHand: { increment: adjustment } },
                        })];
                case 21:
                    _l.sent();
                    _l.label = 22;
                case 22:
                    _a++;
                    return [3 /*break*/, 20];
                case 23:
                    _d = 0, _e = Object.entries(productReservedAdjustments);
                    _l.label = 24;
                case 24:
                    if (!(_d < _e.length)) return [3 /*break*/, 27];
                    _f = _e[_d], idxStr = _f[0], adjustment = _f[1];
                    idx = parseInt(idxStr);
                    return [4 /*yield*/, prisma.product.update({
                            where: { id: products[idx].id },
                            data: { quantityReserved: { increment: adjustment } },
                        })];
                case 25:
                    _l.sent();
                    _l.label = 26;
                case 26:
                    _d++;
                    return [3 /*break*/, 24];
                case 27:
                    console.log('Updated product stock levels');
                    _g = 0, _h = Object.entries(customerOrderCounts);
                    _l.label = 28;
                case 28:
                    if (!(_g < _h.length)) return [3 /*break*/, 31];
                    _j = _h[_g], idxStr = _j[0], count = _j[1];
                    idx = parseInt(idxStr);
                    return [4 /*yield*/, prisma.customer.update({
                            where: { id: customers[idx].id },
                            data: {
                                totalOrders: count,
                                lastOrderDate: customerLastOrder[idx],
                            },
                        })];
                case 29:
                    _l.sent();
                    _l.label = 30;
                case 30:
                    _g++;
                    return [3 /*break*/, 28];
                case 31:
                    console.log('Updated customer order counts');
                    console.log('Seed completed successfully');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('Seed failed:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
