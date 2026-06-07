import { registerCyrillicFonts, font } from './pdfkit-helpers';

type PDFKit = any;

export interface Column {
  key: string;
  label: string;
  width: number;
  align?: 'left' | 'right' | 'center';
  formatter?: (value: any, row: any) => string;
}

export interface DrawTableOptions {
  startX: number;
  startY: number;
  columns: Column[];
  rows: Array<Record<string, any>>;
  pageWidth: number;
  pageHeight: number;
  marginBottom: number;
  headerBg?: string;
  headerTextColor?: string;
  altRowBg?: string;
  rowHeight?: number;
  fontSize?: number;
  onPageBreak?: (newY: number) => void;
}

const DEFAULT_HEADER_BG = '#1a237e';
const DEFAULT_HEADER_TEXT = '#ffffff';

export function drawTable(doc: PDFKit, opts: DrawTableOptions): number {
  registerCyrillicFonts(doc);
  const {
    columns, rows, pageWidth, pageHeight, marginBottom,
    headerBg = DEFAULT_HEADER_BG, headerTextColor = DEFAULT_HEADER_TEXT,
    rowHeight = 16, fontSize = 8,
  } = opts;

  let y = opts.startY;
  const colX: number[] = [];
  let acc = opts.startX;
  for (const c of columns) {
    colX.push(acc);
    acc += c.width;
  }
  const tableWidth = columns.reduce((s, c) => s + c.width, 0);

  // Header
  doc.rect(opts.startX, y, tableWidth, rowHeight + 2).fill(headerBg);
  doc.fillColor(headerTextColor).font(font('bold')).fontSize(fontSize);
  columns.forEach((c, i) => {
    const x = colX[i] + 4;
    const w = c.width - 8;
    const align = c.align || 'left';
    const textOpts = align === 'right' ? { width: w, align: 'right' as const } : { width: w, align: align as any };
    doc.text(c.label, x, y + 4, textOpts);
  });
  y += rowHeight + 2;

  // Rows with page break
  doc.fillColor('#000').font(font('regular'));
  let alt = false;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Calculate row height: at least rowHeight, larger if cell wraps
    let cellHeights: number[] = [];
    columns.forEach((c, idx) => {
      const value = c.formatter ? c.formatter(row[c.key], row) : (row[c.key] ?? '');
      const w = c.width - 8;
      const h = doc.heightOfString(String(value), { width: w });
      cellHeights.push(Math.max(rowHeight, h + 6));
    });
    const h = Math.max(...cellHeights);

    if (y + h > pageHeight - marginBottom) {
      doc.addPage();
      y = 40;
      // Repeat header on new page
      doc.rect(opts.startX, y, tableWidth, rowHeight + 2).fill(headerBg);
      doc.fillColor(headerTextColor).font(font('bold')).fontSize(fontSize);
      columns.forEach((c, i) => {
        const x = colX[i] + 4;
        const w = c.width - 8;
        const align = c.align || 'left';
        const textOpts = align === 'right' ? { width: w, align: 'right' as const } : { width: w, align: align as any };
        doc.text(c.label, x, y + 4, textOpts);
      });
      y += rowHeight + 2;
      doc.fillColor('#000').font(font('regular'));
      alt = false;
      if (opts.onPageBreak) opts.onPageBreak(y);
    }

    if (alt && opts.altRowBg) {
      doc.rect(opts.startX, y, tableWidth, h).fill(opts.altRowBg);
      doc.fillColor('#000');
    }
    alt = !alt;

    columns.forEach((c, idx) => {
      const value = c.formatter ? c.formatter(row[c.key], row) : (row[c.key] ?? '');
      const w = c.width - 8;
      const x = colX[idx] + 4;
      const align = c.align || 'left';
      const textOpts = align === 'right' ? { width: w, align: 'right' as const } : { width: w, align: align as any };
      doc.fontSize(fontSize);
      doc.fillColor('#000');
      doc.text(String(value), x, y + 3, textOpts);
    });
    y += h;
  }

  return y;
}
