export type PdfLocale = 'kk' | 'ru' | 'en';

export interface PdfDict {
    common: {
      no: string;
      name: string;
      sku: string;
      qty: string;
      unit: string;
      price: string;
      sum: string;
      total: string;
      noVat: string;
      vat: string;
      withVat: string;
      vatRate: string;
      copy: string;
      copySupplier: string;
      copyBuyer: string;
      copyExecutor: string;
      copyCustomer: string;
      signHint: string;
      noForms: string;
      date: string;
      copyReceived: string;
      copyIssued: string;
    };
  party: {
    seller: string;
    buyer: string;
    supplier: string;
    customer: string;
    payer: string;
    payee: string;
    consignor: string;
    consignee: string;
    shipper: string;
    saller: string;
    subSeller: string;
    subBuyer: string;
    inProduction: string;
    finSource: string;
    inn: string;
    kpp: string;
    address: string;
    bank: string;
    bik: string;
    account: string;
    phone: string;
    email: string;
  };
  totals: {
    subtotal: string;
    vat: string;
    total: string;
    sumInWords: string;
    paid: string;
    balance: string;
    issueTotal: string;
    income: string;
    expense: string;
    debit: string;
    credit: string;
  };
  signatures: {
    director: string;
    accountant: string;
    cashier: string;
    allowedBy: string;
    releasedBy: string;
    receivedBy: string;
    acceptedBy: string;
    issued: string;
    headOfDept: string;
    delivered: string;
    accepted: string;
    commissionChair: string;
    commissionMember: string;
    mol: string;
    seal: string;
  };
    forms: {
      invoice: string;
      invoiceVat: string;
      torg12: string;
      upd: string;
      act: string;
      m4: string;
      m11: string;
      m15: string;
      inv3: string;
      pko: string;
      rko: string;
      ko4: string;
      paymentOrder: string;
      bankStatement: string;
      incomingTorg12: string;
      incomingInvoiceVat: string;
      incomingUpd: string;
      incomingAct: string;
    };
    extras: {
      validity: string;
      legalForce: string;
      typeSFDOP: string;
      typeUPD2: string;
      onDate: string;
      basis: string;
      purpose: string;
      counterparty: string;
      warehouse: string;
      mol: string;
      receive: string;
      transferFrom: string;
      transferTo: string;
      description: string;
      kindPayment: string;
      incoming: string;
      outgoing: string;
      accountShort: string;
      bikShort: string;
      edIssued: string;
      corrAccount: string;
      inventory: string;
      itemsCount: string;
      totalQty: string;
      valid5days: string;
      line: string;
      units: string;
      incomingWaybill: string;
      incomingInvoice: string;
    };
}

const dict: Record<PdfLocale, PdfDict> = {
  kk: {
    common: {
      no: '№',
      name: 'Атауы',
      sku: 'Артикул',
      qty: 'Саны',
      unit: 'Өлш. бірлігі',
      price: 'Бағасы',
      sum: 'Сомасы',
      total: 'Барлығы:',
      noVat: 'ҚҚС-сыз',
      vat: 'ҚҚС',
      withVat: 'ҚҚС-мен',
      vatRate: 'ҚҚС (12%):',
      copy: 'Дана №',
      copySupplier: 'Жеткізуші данасы',
      copyBuyer: 'Сатып алушы данасы',
      copyExecutor: 'Орындаушы данасы',
      copyCustomer: 'Тапсырыс беруші данасы',
      signHint: '(қолы)',
      noForms: 'Қол жетімді формалар жоқ',
      date: 'Күні',
      copyReceived: 'Қабылдаған дана',
      copyIssued: 'Тапсырған дана',
    },
    party: {
      seller: 'Жеткізуші / Сатушы:',
      buyer: 'Сатып алушы:',
      supplier: 'Жеткізуші:',
      customer: 'Сатып алушы:',
      payer: 'Төлеуші:',
      payee: 'Алушы:',
      consignor: 'Жөнелтуші:',
      consignee: 'Алушы:',
      shipper: 'Жөнелтуші:',
      saller: 'Сатушы:',
      subSeller: 'Сатушы',
      subBuyer: 'Сатып алушы',
      inProduction: 'Өндірістік бөлімше',
      finSource: 'Қаржыландыру көзі',
      inn: 'ЖСН/БСН:',
      kpp: 'КБЕ:',
      address: 'Мекенжайы:',
      bank: 'Банкі:',
      bik: 'БСН:',
      account: 'Шот:',
      phone: 'Тел:',
      email: 'Email:',
    },
    totals: {
      subtotal: 'ҚҚС-сыз:',
      vat: 'ҚҚС (12%):',
      total: 'Барлығы ҚҚС-мен:',
      sumInWords: 'Сомасы сөзбен:',
      paid: 'Төленді:',
      balance: 'Қалдық:',
      issueTotal: 'Барлығы босатылды:',
      income: 'Кіріс',
      expense: 'Шығыс',
      debit: 'Дебет',
      credit: 'Кредит',
    },
    signatures: {
      director: 'Басшы',
      accountant: 'Бас бухгалтер',
      cashier: 'Кассир',
      allowedBy: 'Рұқсат еткен',
      releasedBy: 'Босатқан (қойма меңгерушісі)',
      receivedBy: 'Қабылдаған',
      acceptedBy: 'Қабылдаған',
      issued: 'Шығарған',
      headOfDept: 'Бөлім басшысы',
      delivered: 'Тапсырған (орындаушы)',
      accepted: 'Қабылдаған (тапсырыс беруші)',
      commissionChair: 'Комиссия төрағасы',
      commissionMember: 'Комиссия мүшесі',
      mol: 'Материалдық жауапты тұлға',
      seal: 'М.О.',
    },
    forms: {
      invoice: 'ШОТ ТӨЛЕМГЕ',
      invoiceVat: 'ШОТ-ФАКТУРА',
      torg12: 'ТАУАРЛЫҚ КОЛХАТ',
      upd: 'ӘМБЕБАП БЕРУ ҚҰЖАТЫ',
      act: 'ОРЫНДАЛҒАН ЖҰМЫСТАР АКТІСІ',
      m4: 'КІРІС ОРДЕРІ (М-4)',
      m11: 'ТАЛАП-КОЛХАТ (М-11)',
      m15: 'ІШКІ АУЫСТЫРУ КОЛХАТЫ (М-15)',
      inv3: 'ИНВЕНТАРИЗАЦИЯЛЫҚ ТІЗІМДЕМЕ (ИНВ-3)',
      pko: 'КІРІС КАССА ОРДЕРІ (КО-1)',
      rko: 'ШЫҒЫС КАССА ОРДЕРІ (КО-2)',
      ko4: 'КАССА КІТАБЫ (КО-4)',
      paymentOrder: 'ТӨЛЕМ ТАПСЫРМАСЫ',
      bankStatement: 'БАНК ҮЗІНДІСІ',
      incomingTorg12: 'КІРІС КОЛХАТЫ',
      incomingInvoiceVat: 'КІРІС ШОТ-ФАКТУРА',
      incomingUpd: 'ӘМБЕБАП БЕРУ ҚҰЖАТЫ (КІРІС)',
      incomingAct: 'ҚАБЫЛДАУ АКТІСІ',
    },
    extras: {
      validity: 'Шот 5 (бес) банк күні ішінде жарамды.',
      legalForce: 'Тауарлық колхат қол қойылған және мөр басылған кезде заңды күшке ие.',
      typeSFDOP: 'Статус: 1 (ШФДОТ — шот-фактура және беру құжаты).',
      typeUPD2: 'Статус: 2 (ИШБҚ — кіріс).',
      onDate: 'күні',
      basis: 'Негіздеме:',
      purpose: 'Төлем мақсаты:',
      counterparty: 'Контрагент:',
      warehouse: 'Қойма:',
      mol: 'МОТ:',
      receive: 'Қабылдады:',
      transferFrom: 'қоймасынан',
      transferTo: 'қоймасына',
      description: 'Сипаттама:',
      kindPayment: 'Төлем түрі:',
      incoming: 'кіріс',
      outgoing: 'шығыс',
      accountShort: 'Шот:',
      bikShort: 'БСН:',
      edIssued: 'Шығарылған күні:',
      corrAccount: 'Корр. шот:',
      inventory: 'Инвентаризация',
      itemsCount: 'Барлық атаулар:',
      totalQty: 'Жалпы саны:',
      valid5days: 'Шот 5 (бес) банк күні ішінде жарамды',
      line: 'Корр. шот',
      units: 'бірл.',
      incomingWaybill: 'Кіріс колхаты тауарлық-материалдық құндылықтарды сатып алушының қабылдағанын растайды.',
      incomingInvoice: 'Кіріс шот-фактура сатушымен сатып алушыға ұсынылған.',
    },
  },
  ru: {
    common: {
      no: '№',
      name: 'Наименование',
      sku: 'Артикул',
      qty: 'Кол-во',
      unit: 'Ед. изм.',
      price: 'Цена',
      sum: 'Сумма',
      total: 'Итого:',
      noVat: 'Без НДС',
      vat: 'НДС',
      withVat: 'С НДС',
      vatRate: 'НДС (12%):',
      copy: 'Экземпляр №',
      copySupplier: 'Экземпляр поставщика',
      copyBuyer: 'Экземпляр покупателя',
      copyExecutor: 'Экземпляр исполнителя',
      copyCustomer: 'Экземпляр заказчика',
      signHint: '(подпись)',
      noForms: 'Нет доступных форм',
      date: 'Дата',
      copyReceived: 'Экземпляр получателя',
      copyIssued: 'Экземпляр сдавшего',
    },
    party: {
      seller: 'Поставщик / Продавец:',
      buyer: 'Покупатель:',
      supplier: 'Поставщик:',
      customer: 'Покупатель:',
      payer: 'Плательщик:',
      payee: 'Получатель:',
      consignor: 'Грузоотправитель:',
      consignee: 'Грузополучатель:',
      shipper: 'Грузоотправитель:',
      saller: 'Продавец:',
      subSeller: 'Продавец',
      subBuyer: 'Покупатель',
      inProduction: 'Производственное подразделение',
      finSource: 'Источник финансирования',
      inn: 'ИНН:',
      kpp: 'КПП:',
      address: 'Адрес:',
      bank: 'Банк:',
      bik: 'БИК:',
      account: 'Р/с:',
      phone: 'Тел:',
      email: 'Email:',
    },
    totals: {
      subtotal: 'Итого без НДС:',
      vat: 'НДС (12%):',
      total: 'Всего с НДС:',
      sumInWords: 'Сумма прописью:',
      paid: 'Оплачено:',
      balance: 'Остаток:',
      issueTotal: 'Итого отпущено:',
      income: 'Приход',
      expense: 'Расход',
      debit: 'Дебет',
      credit: 'Кредит',
    },
    signatures: {
      director: 'Руководитель',
      accountant: 'Главный бухгалтер',
      cashier: 'Кассир',
      allowedBy: 'Отпуск разрешил',
      releasedBy: 'Отпустил (зав. складом)',
      receivedBy: 'Получил',
      acceptedBy: 'Принял',
      issued: 'Сдал',
      headOfDept: 'Начальник отдела',
      delivered: 'Работы сдал (исполнитель)',
      accepted: 'Работы принял (заказчик)',
      commissionChair: 'Председатель комиссии',
      commissionMember: 'Член комиссии',
      mol: 'Материально ответственное лицо',
      seal: 'М.П.',
    },
    forms: {
      invoice: 'СЧЁТ НА ОПЛАТУ',
      invoiceVat: 'СЧЁТ-ФАКТУРА',
      torg12: 'ТОВАРНАЯ НАКЛАДНАЯ',
      upd: 'УНИВЕРСАЛЬНЫЙ ПЕРЕДАТОЧНЫЙ ДОКУМЕНТ',
      act: 'АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)',
      m4: 'ПРИХОДНЫЙ ОРДЕР (М-4)',
      m11: 'ТРЕБОВАНИЕ-НАКЛАДНАЯ (М-11)',
      m15: 'НАКЛАДНАЯ НА ВНУТРЕННЕЕ ПЕРЕМЕЩЕНИЕ (М-15)',
      inv3: 'ИНВЕНТАРИЗАЦИОННАЯ ОПИСЬ (ИНВ-3)',
      pko: 'ПРИХОДНЫЙ КАССОВЫЙ ОРДЕР (КО-1)',
      rko: 'РАСХОДНЫЙ КАССОВЫЙ ОРДЕР (КО-2)',
      ko4: 'КАССОВАЯ КНИГА (КО-4)',
      paymentOrder: 'ПЛАТЁЖНОЕ ПОРУЧЕНИЕ',
      bankStatement: 'БАНКОВСКАЯ ВЫПИСКА',
      incomingTorg12: 'ПРИХОДНАЯ НАКЛАДНАЯ',
      incomingInvoiceVat: 'ВХОДЯЩИЙ СЧЁТ-ФАКТУРА',
      incomingUpd: 'УНИВЕРСАЛЬНЫЙ ПЕРЕДАТОЧНЫЙ ДОКУМЕНТ (ВХ.)',
      incomingAct: 'АКТ ПРИЁМА',
    },
    extras: {
      validity: 'Счёт действителен в течение 5 (пяти) банковских дней.',
      legalForce: 'Товарная накладная имеет юридическую силу при наличии подписей и печати.',
      typeSFDOP: 'Статус: 1 (СЧФДОП — счёт-фактура и передаточный документ).',
      typeUPD2: 'Статус: 2 (ИУПД — исправленный универсальный передаточный документ / входящий).',
      onDate: 'от',
      basis: 'Основание:',
      purpose: 'Назначение платежа:',
      counterparty: 'Контрагент:',
      warehouse: 'Склад:',
      mol: 'МОЛ:',
      receive: 'Принял на склад:',
      transferFrom: 'со склада',
      transferTo: 'на склад',
      description: 'Описание:',
      kindPayment: 'Вид платежа:',
      incoming: 'входящий',
      outgoing: 'исходящий',
      accountShort: 'Счёт:',
      bikShort: 'БИК:',
      edIssued: 'Дата отпуска:',
      corrAccount: 'Корр. счёт:',
      inventory: 'Инвентаризация',
      itemsCount: 'Всего наименований:',
      totalQty: 'Общее кол-во:',
      valid5days: 'Счёт действителен в течение 5 (пяти) банковских дней',
      line: 'Корр. счёт',
      units: 'ед.',
      incomingWaybill: 'Приходная накладная подтверждает получение товарно-материальных ценностей покупателем.',
      incomingInvoice: 'Входящий счёт-фактура предъявлен продавцом покупателю.',
    },
  },
  en: {
    common: {
      no: '#',
      name: 'Description',
      sku: 'SKU',
      qty: 'Qty',
      unit: 'Unit',
      price: 'Price',
      sum: 'Amount',
      total: 'Total:',
      noVat: 'Excl. VAT',
      vat: 'VAT',
      withVat: 'Incl. VAT',
      vatRate: 'VAT (12%):',
      copy: 'Copy #',
      copySupplier: 'Supplier copy',
      copyBuyer: 'Buyer copy',
      copyExecutor: 'Executor copy',
      copyCustomer: 'Customer copy',
      signHint: '(signature)',
      noForms: 'No forms available',
      date: 'Date',
      copyReceived: 'Recipient copy',
      copyIssued: 'Issuer copy',
    },
    party: {
      seller: 'Supplier / Seller:',
      buyer: 'Buyer:',
      supplier: 'Supplier:',
      customer: 'Customer:',
      payer: 'Payer:',
      payee: 'Payee:',
      consignor: 'Shipper:',
      consignee: 'Consignee:',
      shipper: 'Shipper:',
      saller: 'Seller:',
      subSeller: 'Seller',
      subBuyer: 'Buyer',
      inProduction: 'Production department',
      finSource: 'Funding source',
      inn: 'Tax ID:',
      kpp: 'Reg. #:',
      address: 'Address:',
      bank: 'Bank:',
      bik: 'SWIFT/BIC:',
      account: 'A/C:',
      phone: 'Phone:',
      email: 'Email:',
    },
    totals: {
      subtotal: 'Subtotal (excl. VAT):',
      vat: 'VAT (12%):',
      total: 'Total (incl. VAT):',
      sumInWords: 'Amount in words:',
      paid: 'Paid:',
      balance: 'Balance:',
      issueTotal: 'Total released:',
      income: 'Income',
      expense: 'Expense',
      debit: 'Debit',
      credit: 'Credit',
    },
    signatures: {
      director: 'Director',
      accountant: 'Chief accountant',
      cashier: 'Cashier',
      allowedBy: 'Approved by',
      releasedBy: 'Released by (warehouse mgr)',
      receivedBy: 'Received by',
      acceptedBy: 'Accepted by',
      issued: 'Issued by',
      headOfDept: 'Head of department',
      delivered: 'Delivered (executor)',
      accepted: 'Accepted (customer)',
      commissionChair: 'Commission chair',
      commissionMember: 'Commission member',
      mol: 'Responsible person',
      seal: 'Seal',
    },
    forms: {
      invoice: 'INVOICE',
      invoiceVat: 'TAX INVOICE',
      torg12: 'WAYBILL',
      upd: 'UNIVERSAL TRANSFER DOCUMENT',
      act: 'ACT OF COMPLETED WORKS',
      m4: 'RECEIPT ORDER (M-4)',
      m11: 'REQUISITION-WAYBILL (M-11)',
      m15: 'INTERNAL TRANSFER NOTE (M-15)',
      inv3: 'INVENTORY LIST (INV-3)',
      pko: 'CASH RECEIPT ORDER (KO-1)',
      rko: 'CASH PAYMENT ORDER (KO-2)',
      ko4: 'CASH BOOK (KO-4)',
      paymentOrder: 'PAYMENT ORDER',
      bankStatement: 'BANK STATEMENT',
      incomingTorg12: 'INCOMING WAYBILL',
      incomingInvoiceVat: 'INCOMING TAX INVOICE',
      incomingUpd: 'UNIVERSAL TRANSFER DOCUMENT (INCOMING)',
      incomingAct: 'ACCEPTANCE ACT',
    },
    extras: {
      validity: 'Invoice is valid for 5 (five) banking days.',
      legalForce: 'Waybill has legal force with signatures and seal.',
      typeSFDOP: 'Status: 1 (Invoice + transfer document).',
      typeUPD2: 'Status: 2 (Incoming universal transfer document).',
      onDate: 'dated',
      basis: 'Basis:',
      purpose: 'Purpose of payment:',
      counterparty: 'Counterparty:',
      warehouse: 'Warehouse:',
      mol: 'Custodian:',
      receive: 'Received at warehouse:',
      transferFrom: 'from warehouse',
      transferTo: 'to warehouse',
      description: 'Description:',
      kindPayment: 'Payment type:',
      incoming: 'incoming',
      outgoing: 'outgoing',
      accountShort: 'A/C:',
      bikShort: 'SWIFT:',
      edIssued: 'Issue date:',
      corrAccount: 'Cor. account:',
      inventory: 'Inventory',
      itemsCount: 'Total items:',
      totalQty: 'Total qty:',
      valid5days: 'Valid for 5 banking days',
      line: 'Cor. account',
      units: 'units',
      incomingWaybill: 'Incoming waybill confirms receipt of goods by the buyer.',
      incomingInvoice: 'Incoming tax invoice issued by the seller to the buyer.',
    },
  },
};

export function getDict(locale: string): PdfDict {
  const lc = (locale || 'ru').toLowerCase();
  if (lc.startsWith('kk')) return dict.kk;
  if (lc.startsWith('en')) return dict.en;
  return dict.ru;
}

export function t(locale: string): PdfDict {
  return getDict(locale);
}
