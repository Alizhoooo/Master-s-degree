import i18n from './index';

type EnumType =
  | 'statuses'
  | 'tiers'
  | 'orderStatus'
  | 'docStatus'
  | 'production'
  | 'task'
  | 'complaint'
  | 'issueType'
  | 'productType'
  | 'stockType'
  | 'expiry'
  | 'cash'
  | 'bank'
  | 'payroll'
  | 'payment'
  | 'priority'
  | 'timesheetType';

const STATUS_TYPES: EnumType[] = ['statuses', 'orderStatus', 'docStatus', 'production', 'task', 'complaint', 'cash', 'bank', 'payroll', 'payment', 'expiry', 'priority'];

/**
 * Translate an enum value to the current locale.
 * Falls back to original value if no translation is found.
 *
 * @example
 *   <Badge>{enumLabel('Pending', 'statuses')}</Badge>
 *   // kk: 'Күтуде'
 *   // ru: 'В ожидании'
 *   // en: 'Pending'
 */
export function enumLabel(value: string | null | undefined, type: EnumType): string {
  if (value === null || value === undefined) return '';
  const key = `enum.${type}.${value}`;
  const translated = i18n.t(key);
  if (translated && translated !== key) return translated;
  return String(value);
}

/**
 * Convenience: try multiple enum types until a translation is found.
 * Useful when the same value (e.g. 'Pending') could come from different domains.
 */
export function enumLabelAny(value: string | null | undefined, types: EnumType[]): string {
  if (value === null || value === undefined) return '';
  for (const type of types) {
    const translated = i18n.t(`enum.${type}.${value}`);
    if (translated && translated !== `enum.${type}.${value}`) return translated;
  }
  return String(value);
}

/**
 * Best-effort translator: try 'statuses' (most common) first, then the rest.
 */
export function statusLabel(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  for (const type of STATUS_TYPES) {
    const translated = i18n.t(`enum.${type}.${value}`);
    if (translated && translated !== `enum.${type}.${value}`) return translated;
  }
  return String(value);
}

export type { EnumType };
