import { registerCyrillicFonts, font, formatDate, formatNumber } from './pdfkit-helpers';
import { drawTable, Column } from './pdfkit-table';

type PDFKit = any;

export interface PartyInfo {
  name: string;
  inn?: string;
  kpp?: string;
  address?: string;
  bank?: string;
  bik?: string;
  account?: string;
  phone?: string;
  email?: string;
}

export interface BaseRenderOptions {
  title: string;
  number?: string;
  date?: Date | string;
  seller: PartyInfo;
  buyer: PartyInfo;
  columns: Column[];
  rows: Array<Record<string, any>>;
  totals?: Array<{ label: string; value: string; bold?: boolean }>;
  footer?: string;
  signatures?: Array<{ label: string; value?: string }>;
  copies?: number;
  copyLabel?: string | ((n: number, total: number) => string);
  paperSize?: 'A4' | 'A5' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  locale?: string;
  currency?: string;
  vatRate?: number;
}

export interface RendererContext {
  doc: PDFKit;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  y: number;
  locale: string;
  currency: string;
}

export function createPdfBuffer(opts: BaseRenderOptions): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const PDFDocument = (await import('pdfkit')).default;
      const copies = Math.max(1, opts.copies || 1);
      const doc = new PDFDocument({
        margin: 40,
        size: opts.paperSize || 'A4',
        layout: opts.orientation || 'portrait',
        info: {
          Title: opts.title,
          Author: opts.seller.name,
          Subject: opts.number || '',
        },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      registerCyrillicFonts(doc);
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      const yStart = 40;

      for (let copyIdx = 0; copyIdx < copies; copyIdx++) {
        if (copyIdx > 0) doc.addPage();
        let y = yStart;

        // Title
        doc.font(font('bold')).fontSize(16).fillColor('#000');
        doc.text(opts.title, margin, y, { width: contentWidth, align: 'center' });
        y = doc.y + 4;

        // Sub-line: number, date, copy label
        doc.font(font('regular')).fontSize(9).fillColor('#444');
        const sub: string[] = [];
        if (opts.number) sub.push(`№ ${opts.number}`);
        if (opts.date) sub.push(`от ${formatDate(opts.date, opts.locale || 'ru-RU')}`);
        if (copies > 1) {
          const label = opts.copyLabel
            ? (typeof opts.copyLabel === 'function' ? opts.copyLabel(copyIdx + 1, copies) : opts.copyLabel)
            : `Экземпляр № ${copyIdx + 1}`;
          sub.push(label);
        }
        if (sub.length) {
          doc.text(sub.join('   '), margin, y, { width: contentWidth, align: 'center' });
          y = doc.y + 12;
        } else {
          y += 8;
        }

        // Parties: seller (left) | buyer (right)
        const colPartyWidth = contentWidth / 2 - 8;
        const partyTop = y;
        const partyHeight = drawParty(doc, opts.seller, margin, y, colPartyWidth, 'Поставщик / Продавец:');
        const buyerHeight = drawParty(doc, opts.buyer, margin + contentWidth / 2 + 8, y, colPartyWidth, 'Покупатель:');
        y += Math.max(partyHeight, buyerHeight) + 8;

        // Table
        const marginBottom = opts.signatures && opts.signatures.length ? 100 : 60;
        y = drawTable(doc, {
          startX: margin,
          startY: y,
          columns: opts.columns,
          rows: opts.rows,
          pageWidth: contentWidth,
          pageHeight,
          marginBottom,
        });

        // Totals
        if (opts.totals && opts.totals.length) {
          y += 8;
          const labelX = margin + contentWidth - 280;
          doc.font(font('regular')).fontSize(9).fillColor('#000');
          for (const t of opts.totals) {
            doc.font(t.bold ? font('bold') : font('regular'));
            doc.text(t.label, labelX, y, { width: 160, align: 'right' });
            doc.text(t.value, labelX + 165, y, { width: 110, align: 'right' });
            y += 14;
          }
          y += 4;
        }

        // Signatures
        if (opts.signatures && opts.signatures.length) {
          const sigTop = pageHeight - 80;
          const sigColWidth = contentWidth / opts.signatures.length;
          opts.signatures.forEach((sig, idx) => {
            const sx = margin + sigColWidth * idx;
            doc.font(font('regular')).fontSize(8).fillColor('#666');
            doc.text(sig.label, sx, sigTop, { width: sigColWidth - 8 });
            doc.moveTo(sx, sigTop + 30).lineTo(sx + sigColWidth - 16, sigTop + 30).stroke('#aaa');
            doc.fontSize(7).fillColor('#999');
            doc.text('(подпись)', sx, sigTop + 32, { width: sigColWidth - 8 });
            if (sig.value) {
              doc.fontSize(8).fillColor('#000');
              doc.text(sig.value, sx, sigTop + 50, { width: sigColWidth - 8 });
            }
          });
        }

        // Footer
        if (opts.footer) {
          doc.font(font('regular')).fontSize(7).fillColor('#888');
          doc.text(opts.footer, margin, pageHeight - 30, { width: contentWidth, align: 'center' });
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function drawParty(doc: PDFKit, p: PartyInfo, x: number, y: number, w: number, label: string): number {
  doc.font(font('bold')).fontSize(8).fillColor('#1a237e');
  doc.text(label, x, y, { width: w });
  let cy = doc.y + 2;
  doc.font(font('regular')).fontSize(9).fillColor('#000');
  doc.text(p.name, x, cy, { width: w });
  cy = doc.y + 2;
  if (p.inn) {
    doc.text(`ИНН: ${p.inn}${p.kpp ? ' / КПП: ' + p.kpp : ''}`, x, cy, { width: w });
    cy = doc.y + 2;
  }
  if (p.address) {
    doc.text(p.address, x, cy, { width: w });
    cy = doc.y + 2;
  }
  if (p.bank) {
    doc.text(`Банк: ${p.bank}${p.bik ? ' (БИК ' + p.bik + ')' : ''}`, x, cy, { width: w });
    cy = doc.y + 2;
  }
  if (p.account) {
    doc.text(`Р/с: ${p.account}`, x, cy, { width: w });
    cy = doc.y + 2;
  }
  if (p.phone) {
    doc.text(`Тел: ${p.phone}`, x, cy, { width: w });
    cy = doc.y + 2;
  }
  if (p.email) {
    doc.text(`Email: ${p.email}`, x, cy, { width: w });
    cy = doc.y + 2;
  }
  return cy - y + 4;
}

export interface FormContext {
  locale: string;
  currency: string;
  seller: PartyInfo;
  buyer: PartyInfo;
}

export function defaultSeller(): PartyInfo {
  return {
    name: 'ТОО "SupplyFlow"',
    inn: '123456789012',
    kpp: '831',
    address: '010000, г. Астана, ул. Мангилик Ел 57А, БЦ "Аура"',
    bank: 'АО "Halyk Bank"',
    bik: 'HSBKKZKX',
    account: 'KZ12345...',
    phone: '+7 (7172) 000-000',
    email: 'info@supplyflow.kz',
  };
}

export function partyFromCustomer(c: any): PartyInfo {
  return {
    name: c.company || c.fullName || c.name || '—',
    inn: c.inn,
    address: c.address,
    phone: c.phone,
    email: c.email,
  };
}

export function partyFromSupplier(s: any): PartyInfo {
  return {
    name: s.name || '—',
    inn: s.inn,
    address: s.address,
    phone: s.phone,
    email: s.email,
    bank: s.bankName,
    account: s.bankAccount,
    bik: s.bic,
  };
}

export function partyFromUser(u: any): PartyInfo {
  return {
    name: u.fullName || u.email || '—',
    phone: u.phone,
    email: u.email,
  };
}

export function partyFromEmployee(e: any): PartyInfo {
  return {
    name: e.fullName || '—',
    inn: e.inn,
    phone: e.phone,
    email: e.email,
  };
}

export function partyFromWarehouse(w: any): PartyInfo {
  return {
    name: w.name || '—',
    address: w.address,
  };
}

export function partyFromWorkshop(w: any): PartyInfo {
  return {
    name: w.name || '—',
    address: w.head ? `Начальник: ${w.head.fullName || w.head}` : undefined,
  };
}
