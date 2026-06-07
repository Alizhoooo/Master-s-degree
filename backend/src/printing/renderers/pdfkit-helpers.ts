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

interface LocaleWords {
  ones: string[];
  teens: string[];
  tens: string[];
  hundreds: string[];
  units: UnitDef[];
  currency: { int: string[]; frac: string[]; intWord: string; fracWord: string };
  negative: string;
  zero: string;
  femPower: number;
}

const WORDS: Record<string, LocaleWords> = {
  ru: {
    ones: ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
    teens: ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'],
    tens: ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'],
    hundreds: ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'],
    units: [
      { power: 3, forms: ['миллиард', 'миллиарда', 'миллиардов'], short: 'млрд' },
      { power: 2, forms: ['миллион', 'миллиона', 'миллионов'], short: 'млн' },
      { power: 1, forms: ['тысяча', 'тысячи', 'тысяч'], short: 'тыс.' },
    ],
    currency: { int: ['рубль', 'рубля', 'рублей'], frac: ['копейка', 'копейки', 'копеек'], intWord: 'рубль', fracWord: 'копейка' },
    negative: 'минус',
    zero: 'ноль',
    femPower: 1,
  },
  kk: {
    ones: ['', 'бір', 'екі', 'үш', 'төрт', 'бес', 'алты', 'жеті', 'сегіз', 'тоғыз'],
    teens: ['он', 'он бір', 'он екі', 'он үш', 'он төрт', 'он бес', 'он алты', 'он жеті', 'он сегіз', 'он тоғыз'],
    tens: ['', '', 'жиырма', 'отыз', 'қырық', 'елу', 'алпыс', 'жетпіс', 'сексен', 'тоқсан'],
    hundreds: ['', 'жүз', 'екі жүз', 'үш жүз', 'төрт жүз', 'бес жүз', 'алты жүз', 'жеті жүз', 'сегіз жүз', 'тоғыз жүз'],
    units: [
      { power: 3, forms: ['миллиард', 'миллиард', 'миллиард'], short: 'млрд' },
      { power: 2, forms: ['миллион', 'миллион', 'миллион'], short: 'млн' },
      { power: 1, forms: ['мың', 'мың', 'мың'], short: 'мың' },
    ],
    currency: { int: ['теңге', 'теңге', 'теңге'], frac: ['тиын', 'тиын', 'тиын'], intWord: 'теңге', fracWord: 'тиын' },
    negative: 'минус',
    zero: 'ноль',
    femPower: 1,
  },
  en: {
    ones: ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
    teens: ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'],
    tens: ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
    hundreds: ['', 'one hundred', 'two hundred', 'three hundred', 'four hundred', 'five hundred', 'six hundred', 'seven hundred', 'eight hundred', 'nine hundred'],
    units: [
      { power: 3, forms: ['billion', 'billion', 'billion'], short: 'B' },
      { power: 2, forms: ['million', 'million', 'million'], short: 'M' },
      { power: 1, forms: ['thousand', 'thousand', 'thousand'], short: 'K' },
    ],
    currency: { int: ['dollar', 'dollars', 'dollars'], frac: ['cent', 'cents', 'cents'], intWord: 'dollars', fracWord: 'cents' },
    negative: 'minus',
    zero: 'zero',
    femPower: 1,
  },
};

function plural(n: number, forms: string[], lang: string): string {
  const a = Math.abs(n) | 0;
  if (lang === 'en') return forms[1];
  const n100 = a % 100;
  const n10 = a % 10;
  if (n100 >= 11 && n100 <= 14) return forms[2];
  if (n10 === 1) return forms[0];
  if (n10 >= 2 && n10 <= 4) return forms[1];
  return forms[2];
}

function tripleToWords(n: number, fem: boolean, w: LocaleWords): string {
  if (n === 0) return '';
  const h = Math.floor(n / 100);
  const t = n % 100;
  const o = n % 10;
  const parts: string[] = [];
  if (h) parts.push(w.hundreds[h]);
  if (t >= 10 && t < 20) {
    parts.push(w.teens[t - 10]);
  } else {
    if (t >= 20) parts.push(w.tens[Math.floor(t / 10)]);
    if (o) {
      if (fem && w.units[w.femPower] && o < 3) {
        parts.push(['бір', 'екі'].includes(w.ones[o]) ? w.ones[o] : w.ones[o]);
      } else {
        parts.push(w.ones[o]);
      }
    }
  }
  return parts.filter(Boolean).join(w === WORDS.en ? ' ' : ' ');
}

function getWords(locale: string): LocaleWords {
  const lc = (locale || 'ru').toLowerCase();
  if (lc.startsWith('kk')) return WORDS.kk;
  if (lc.startsWith('en')) return WORDS.en;
  return WORDS.ru;
}

export function numberToWords(value: number, locale = 'ru'): string {
  const w = getWords(locale);
  if (value === 0) {
    return w.zero;
  }
  const negative = value < 0;
  const abs = Math.abs(value);
  const intPart = Math.floor(abs);
  const frac = Math.round((abs - intPart) * 100);

  const out: string[] = [];
  let rest = intPart;
  for (const { power, forms } of w.units) {
    const div = Math.pow(1000, power);
    const n = Math.floor(rest / div) % 1000;
    if (n) {
      const fem = power === w.femPower;
      const words = tripleToWords(n, fem, w);
      if (words) out.push(`${words} ${plural(n, forms, w === WORDS.en ? 'en' : 'ru')}`);
    }
  }
  const lastThree = intPart % 1000;
  if (lastThree || out.length === 0) {
    out.push(tripleToWords(lastThree, false, w));
  }
  let result = out.reverse().join(' ').trim();
  if (result) result = result.charAt(0).toUpperCase() + result.slice(1);

  const intForms = w.currency.int;
  const fracForms = w.currency.frac;
  const sign = negative ? `${w.negative} ` : '';
  const intWord = plural(Math.abs(intPart), intForms, w === WORDS.en ? 'en' : 'ru');
  const fracWord = plural(frac, fracForms, w === WORDS.en ? 'en' : 'ru');
  return `${sign}${result} ${intWord} ${formatNumber(frac, 0)} ${fracWord}`.trim();
}
