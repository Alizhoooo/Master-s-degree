export type TranslationKey =
  | 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | 'OnHold'
  | 'VIP' | 'Regular' | 'Problematic' | 'New'
  | 'Draft' | 'Posted' | 'Closed' | 'Active' | 'Inactive' | 'Archived'
  | 'Planned' | 'InProgress' | 'Completed' | 'Cancelled_'
  | 'New_' | 'Acknowledged' | 'Resolved'
  | 'Sale' | 'Purchase' | 'WriteOff' | 'Production' | 'Return' | 'Transfer'
  | 'Goods' | 'Service' | 'Material' | 'Product' | 'SemiFinished'
  | 'Receipt' | 'Issue' | 'TransferIn' | 'TransferOut' | 'Adjustment' | 'Inventory'
  | 'Critical' | 'Warning' | 'Info' | 'Expired'
  | 'Income' | 'Expense' | 'In' | 'Out'
  | 'Calculated' | 'Paid' | 'Partial'
  | 'Cash' | 'Bank'
  | 'Urgent' | 'High' | 'Medium' | 'Low';

export const translations: Record<string, Record<TranslationKey, string>> = {
  kk: {
    Pending: 'Күтуде', Confirmed: 'Расталды', Processing: 'Өңделуде', Shipped: 'Жіберілді',
    Delivered: 'Жеткізілді', Cancelled: 'Бас тартылды', Returned: 'Қайтарылды', OnHold: 'Кідіртілді',
    VIP: 'VIP', Regular: 'Қарапайым', Problematic: 'Проблемалы', New: 'Жаңа',
    Draft: 'Жоба', Posted: 'Жарияланды', Closed: 'Жабық', Active: 'Белсенді', Inactive: 'Белсенді емес', Archived: 'Мұрағатталған',
    Planned: 'Жоспарланған', InProgress: 'Орындалуда', Completed: 'Аяқталды', Cancelled_: 'Бас тартылды',
    New_: 'Жаңа', Acknowledged: 'Қабылданды', Resolved: 'Шешілді',
    Sale: 'Сатылым', Purchase: 'Сатып алу', WriteOff: 'Есептен шығару', Production: 'Өндіріс', Return: 'Қайтару', Transfer: 'Ауыстыру',
    Goods: 'Тауар', Service: 'Қызмет', Material: 'Материал', Product: 'Өнім', SemiFinished: 'Жартылай дайын',
    Receipt: 'Қабылдау', Issue: 'Шығару', TransferIn: 'Ауыстыру (кіріс)', TransferOut: 'Ауыстыру (шығыс)',
    Adjustment: 'Түзету', Inventory: 'Түгендеу',
    Critical: 'Маңызды', Warning: 'Ескерту', Info: 'Ақпарат', Expired: 'Мерзімі өткен',
    Income: 'Кіріс', Expense: 'Шығыс', In: 'Кіріс', Out: 'Шығыс',
    Calculated: 'Есептелді', Paid: 'Төленді', Partial: 'Ішінара',
    Cash: 'Қолма-қол', Bank: 'Банк',
    Urgent: 'Шұғыл', High: 'Жоғары', Medium: 'Орташа', Low: 'Төмен',
  },
  ru: {
    Pending: 'В ожидании', Confirmed: 'Подтверждён', Processing: 'В обработке', Shipped: 'Отправлен',
    Delivered: 'Доставлен', Cancelled: 'Отменён', Returned: 'Возвращён', OnHold: 'На удержании',
    VIP: 'VIP', Regular: 'Обычный', Problematic: 'Проблемный', New: 'Новый',
    Draft: 'Черновик', Posted: 'Проведён', Closed: 'Закрыт', Active: 'Активный', Inactive: 'Неактивный', Archived: 'В архиве',
    Planned: 'Запланирован', InProgress: 'Выполняется', Completed: 'Завершён', Cancelled_: 'Отменён',
    New_: 'Новый', Acknowledged: 'Принят', Resolved: 'Решён',
    Sale: 'Продажа', Purchase: 'Покупка', WriteOff: 'Списание', Production: 'Производство', Return: 'Возврат', Transfer: 'Перемещение',
    Goods: 'Товар', Service: 'Услуга', Material: 'Материал', Product: 'Продукт', SemiFinished: 'Полуфабрикат',
    Receipt: 'Поступление', Issue: 'Расход', TransferIn: 'Перемещение (приход)', TransferOut: 'Перемещение (расход)',
    Adjustment: 'Корректировка', Inventory: 'Инвентаризация',
    Critical: 'Критично', Warning: 'Предупреждение', Info: 'Информация', Expired: 'Просрочен',
    Income: 'Приход', Expense: 'Расход', In: 'Входящий', Out: 'Исходящий',
    Calculated: 'Рассчитан', Paid: 'Выплачен', Partial: 'Частично',
    Cash: 'Наличные', Bank: 'Банк',
    Urgent: 'Срочно', High: 'Высокий', Medium: 'Средний', Low: 'Низкий',
  },
  en: {
    Pending: 'Pending', Confirmed: 'Confirmed', Processing: 'Processing', Shipped: 'Shipped',
    Delivered: 'Delivered', Cancelled: 'Cancelled', Returned: 'Returned', OnHold: 'On Hold',
    VIP: 'VIP', Regular: 'Regular', Problematic: 'Problematic', New: 'New',
    Draft: 'Draft', Posted: 'Posted', Closed: 'Closed', Active: 'Active', Inactive: 'Inactive', Archived: 'Archived',
    Planned: 'Planned', InProgress: 'In Progress', Completed: 'Completed', Cancelled_: 'Cancelled',
    New_: 'New', Acknowledged: 'Acknowledged', Resolved: 'Resolved',
    Sale: 'Sale', Purchase: 'Purchase', WriteOff: 'Write-off', Production: 'Production', Return: 'Return', Transfer: 'Transfer',
    Goods: 'Goods', Service: 'Service', Material: 'Material', Product: 'Product', SemiFinished: 'Semi-finished',
    Receipt: 'Receipt', Issue: 'Issue', TransferIn: 'Transfer In', TransferOut: 'Transfer Out',
    Adjustment: 'Adjustment', Inventory: 'Inventory',
    Critical: 'Critical', Warning: 'Warning', Info: 'Info', Expired: 'Expired',
    Income: 'Income', Expense: 'Expense', In: 'In', Out: 'Out',
    Calculated: 'Calculated', Paid: 'Paid', Partial: 'Partial',
    Cash: 'Cash', Bank: 'Bank',
    Urgent: 'Urgent', High: 'High', Medium: 'Medium', Low: 'Low',
  },
};
