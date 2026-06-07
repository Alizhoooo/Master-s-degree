import { existsSync } from 'fs';

type PDFKit = any;

let registered = false;
let regularFontPath = '';
let boldFontPath = '';
let italicFontPath = '';
let boldItalicFontPath = '';

const FONT_CANDIDATES_REGULAR = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/TTF/DejaVuSans.ttf',
];

const FONT_CANDIDATES_BOLD = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
  '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
];

const FONT_CANDIDATES_ITALIC = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf',
  '/usr/share/fonts/dejavu/DejaVuSans-Oblique.ttf',
];

const FONT_CANDIDATES_BOLD_ITALIC = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf',
  '/usr/share/fonts/dejavu/DejaVuSans-BoldOblique.ttf',
];

function pickFirst(candidates: string[]): string {
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0];
}

export function registerCyrillicFonts(doc: PDFKit): void {
  if (registered) {
    doc.registerFont('Cyr', regularFontPath);
    doc.registerFont('Cyr-Bold', boldFontPath);
    if (existsSync(italicFontPath)) doc.registerFont('Cyr-Italic', italicFontPath);
    if (existsSync(boldItalicFontPath)) doc.registerFont('Cyr-BoldItalic', boldItalicFontPath);
    return;
  }

  regularFontPath = pickFirst(FONT_CANDIDATES_REGULAR);
  boldFontPath = pickFirst(FONT_CANDIDATES_BOLD);
  italicFontPath = pickFirst(FONT_CANDIDATES_ITALIC);
  boldItalicFontPath = pickFirst(FONT_CANDIDATES_BOLD_ITALIC);

  doc.registerFont('Cyr', regularFontPath);
  doc.registerFont('Cyr-Bold', boldFontPath);
  if (existsSync(italicFontPath)) doc.registerFont('Cyr-Italic', italicFontPath);
  if (existsSync(boldItalicFontPath)) doc.registerFont('Cyr-BoldItalic', boldItalicFontPath);
  registered = true;
}

export function font(name: 'regular' | 'bold' | 'italic' | 'bold-italic' = 'regular'): string {
  switch (name) {
    case 'bold':
      return 'Cyr-Bold';
    case 'italic':
      return 'Cyr-Italic';
    case 'bold-italic':
      return 'Cyr-BoldItalic';
    default:
      return 'Cyr';
  }
}

export function formatNumber(value: number, decimals = 2, locale = 'ru-RU'): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value || 0);
}

export function formatCurrency(value: number, currency = '₸', locale = 'ru-RU'): string {
  return `${formatNumber(value, 2, locale)} ${currency}`;
}

export function formatDate(value: Date | string | null | undefined, locale = 'ru-RU'): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString(locale);
}

interface UnitDef {
  power: number;
  forms: string[];
  short: string;
}

const UNITS: UnitDef[] = [
  { power: 3, forms: ['миллиард', 'миллиарда', 'миллиардов'], short: 'млрд' },
  { power: 2, forms: ['миллион', 'миллиона', 'миллионов'], short: 'млн' },
  { power: 1, forms: ['тысяча', 'тысячи', 'тысяч'], short: 'тыс.' },
];

function plural(n: number, forms: string[]): string {
  const n100 = n % 100;
  const n10 = n % 10;
  if (n100 >= 11 && n100 <= 14) return forms[2];
  if (n10 === 1) return forms[0];
  if (n10 >= 2 && n10 <= 4) return forms[1];
  return forms[2];
}

const HUNDREDS = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
const TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const ONES_M = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const ONES_F = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];

function tripleToWords(n: number, feminine: boolean): string {
  if (n === 0) return '';
  const h = Math.floor(n / 100);
  const t = n % 100;
  const o = n % 10;
  const parts: string[] = [];
  if (h) parts.push(HUNDREDS[h]);
  if (t >= 10 && t < 20) {
    parts.push(TEENS[t - 10]);
  } else {
    if (t >= 20) parts.push(TENS[Math.floor(t / 10)]);
    if (o) parts.push(feminine ? ONES_F[o] : ONES_M[o]);
  }
  return parts.filter(Boolean).join(' ');
}

export function numberToWords(value: number): string {
  if (value === 0) return 'ноль';
  const negative = value < 0;
  const abs = Math.abs(Math.floor(value));
  const kop = Math.round((value - Math.floor(value)) * 100);

  let intPart = abs;
  const out: string[] = [];
  for (const { power, forms } of UNITS) {
    const div = Math.pow(1000, power);
    const n = Math.floor(intPart / div) % 1000;
    if (n) {
      const fem = power === 1;
      const words = tripleToWords(n, fem);
      if (words) out.push(`${words} ${plural(n, forms)}`);
    }
  }
  const lastThree = intPart % 1000;
  if (lastThree) {
    out.push(tripleToWords(lastThree, false));
  }
  let result = out.reverse().join(' ').trim();
  result = result.charAt(0).toUpperCase() + result.slice(1);

  const rub = plural(Math.abs(value), ['рубль', 'рубля', 'рублей']);
  const kopWord = plural(kop, ['копейка', 'копейки', 'копеек']);
  const sign = negative ? 'минус ' : '';
  return `${sign}${result} ${rub} ${formatNumber(kop, 0)} ${kopWord}`.trim();
}
