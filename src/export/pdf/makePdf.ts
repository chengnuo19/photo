import type { BuiltBook } from '../../data/buildPages';
import type { BookDoc } from '../../data/schema';
import { FilmCancelled, snapper, type Snap } from '../film/film';
import type { PressHandle } from '../film/press';
import { pagesFor, turnsOf } from '../film/renderer';
import { MM, PdfWriter } from './writer';

/**
 * The book as a PDF, from the same page pictures as the drawn video:
 * - `home`: A4 landscape, one sheet per open spread (with its caption), the covers alone —
 *   for a home printer or to send;
 * - `print`: every page on its own at 300 dpi with 3 mm bleed (edge pixels carried outward),
 *   inner pages and covers in two files, as printers ask — zipped together.
 */
export type PdfKind = 'home' | 'print';

export interface PdfOptions {
  kind: PdfKind;
  /** Print: finished page height in cm. */
  heightCm?: number;
}

interface Source {
  book: BookDoc;
  built: BuiltBook;
  press: PressHandle;
  onProgress: (text: string, fraction?: number) => void;
  signal?: AbortSignal;
}

const HOME_DPI = 200;
const PRINT_DPI = 300;
const BLEED_MM = 3;
const A4 = { w: 297 * MM, h: 210 * MM };
const MARGIN = 10 * MM;

async function jpeg(canvas: HTMLCanvasElement, quality: number) {
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
  if (!blob) throw new Error('图片编码失败');
  return new Uint8Array(await blob.arrayBuffer());
}

const free = (c: HTMLCanvasElement) => void (c.width = c.height = 0);

/** Size of one page in the press (CSS pixels). */
function pageBox(press: PressHandle) {
  const el = press.page(1) ?? press.page(0);
  if (!el) throw new Error('页面还没有排好');
  return { w: el.offsetWidth, h: el.offsetHeight };
}

/** Physical page size for print, in cm (for the options shown before making it). */
export function printSize(pageAspect: number, heightCm: number) {
  return { w: Math.round(heightCm * pageAspect * 10) / 10, h: heightCm };
}

export async function makePdf(src: Source, opts: PdfOptions): Promise<{ blob: Blob; ext: 'pdf' | 'zip'; pages: number }> {
  if (src.built.layout !== 'landscape') throw new Error('PDF 需要两页摊开的排版');
  src.onProgress('准备字体和页面…', 0);
  const snap = await snapper(src.book, src.press.root()?.textContent ?? '');
  const check = () => {
    if (src.signal?.aborted) throw new FilmCancelled();
  };
  const title = src.book.meta.title || '回忆绘本';
  return opts.kind === 'print' ? printPdf(src, snap, check, title, opts.heightCm ?? 21) : homePdf(src, snap, check, title);
}

/* ------------------------------------------------------------------ A4, spread by spread */

async function homePdf(src: Source, snap: Snap, check: () => void, title: string) {
  const { built, press } = src;
  const box = pageBox(press);
  const pdf = new PdfWriter(title);
  const rests = [0, ...turnsOf(built).map((t) => t.to)];
  const last = built.pages.length - 1;
  for (const [k, i] of rests.entries()) {
    check();
    src.onProgress(`正在排第 ${k + 1}/${rests.length} 页…`, k / rests.length);
    const idx = pagesFor(built, i);
    const single = i === 0 || i === last;
    const capEl = single ? null : press.caption(built.pages[i].view);
    // room for the spread (and its caption line) inside the margins
    const capRatio = capEl ? (capEl.offsetHeight + box.h * 0.03) / box.h : 0;
    const spreadW = box.w * idx.length;
    const availW = A4.w - MARGIN * 2;
    const availH = A4.h - MARGIN * 2;
    const ptPerCss = Math.min(availW / spreadW, availH / (box.h * (1 + capRatio)));
    const scale = (ptPerCss * HOME_DPI) / 72;
    const pics: HTMLCanvasElement[] = [];
    for (const p of idx) {
      const el = press.page(p);
      if (el) pics.push(await snap(el, scale));
    }
    check();
    const cap = capEl ? await snap(capEl, scale) : null;
    const pw = pics[0]?.width ?? Math.round(box.w * scale);
    const ph = pics[0]?.height ?? Math.round(box.h * scale);
    const gap = cap ? Math.round(box.h * 0.03 * scale) : 0;
    const c = document.createElement('canvas');
    c.width = pw * pics.length;
    c.height = ph + (cap ? gap + cap.height : 0);
    const g = c.getContext('2d')!;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    pics.forEach((pic, j) => g.drawImage(pic, j * pw, 0, pw, ph));
    if (cap) g.drawImage(cap, (c.width - cap.width) / 2, ph + gap);
    const w = c.width * (72 / HOME_DPI);
    const h = c.height * (72 / HOME_DPI);
    pdf.addPage({
      width: A4.w,
      height: A4.h,
      jpeg: await jpeg(c, 0.88),
      px: { w: c.width, h: c.height },
      // centred on the sheet (PDF measures from the bottom)
      place: { x: (A4.w - w) / 2, y: (A4.h - h) / 2, w, h },
    });
    [...pics, c].forEach(free);
    if (cap) free(cap);
  }
  src.onProgress('正在写入 PDF…', 1);
  return { blob: pdf.finish(), ext: 'pdf' as const, pages: pdf.pages };
}

/* ------------------------------------------------------------------ for the printer */

async function printPdf(src: Source, snap: Snap, check: () => void, title: string, heightCm: number) {
  const { built, press } = src;
  const box = pageBox(press);
  const trimH = heightCm * 10 * MM;
  const trimW = trimH * (box.w / box.h);
  const bleed = BLEED_MM * MM;
  const toPx = (pt: number) => Math.round((pt / 72) * PRINT_DPI);
  const scale = toPx(trimH) / box.h;
  const bleedPx = toPx(bleed);
  const inner = new PdfWriter(`${title} · 内页`);
  const covers = new PdfWriter(`${title} · 封面`);
  const last = built.pages.length - 1;
  for (let i = 0; i <= last; i++) {
    check();
    src.onProgress(`正在排第 ${i + 1}/${last + 1} 页（印刷精度）…`, i / (last + 1));
    const el = press.page(i);
    if (!el) continue;
    const pic = await snap(el, scale);
    const c = withBleed(pic, bleedPx);
    free(pic);
    const page = {
      width: trimW + bleed * 2,
      height: trimH + bleed * 2,
      jpeg: await jpeg(c, 0.92),
      px: { w: c.width, h: c.height },
      trim: { x: bleed, y: bleed, w: trimW, h: trimH },
    };
    free(c);
    (i === 0 || i === last ? covers : inner).addPage(page);
  }
  src.onProgress('正在写入 PDF…', 1);
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const cm = (pt: number) => (pt / MM / 10).toFixed(1);
  zip.file('内页.pdf', inner.finish());
  zip.file('封面.pdf', covers.finish());
  zip.file(
    '印刷说明.txt',
    [
      `《${title}》印刷文件`,
      '',
      `成品尺寸：${cm(trimW)} × ${cm(trimH)} cm（每页）`,
      `出血：四边各 ${BLEED_MM} mm（PDF 页面已含出血，裁切框 TrimBox 已标好）`,
      `精度：${PRINT_DPI} dpi，RGB`,
      `内页：${inner.pages} 页（含扉页、献词、结尾的信和衬页）`,
      '封面：封面和封底各一页（不含书脊，书脊宽度请按纸张和页数向印厂确认）',
      '',
      '文字已排成图片，印厂无需字体文件。',
    ].join('\r\n'),
  );
  return { blob: await zip.generateAsync({ type: 'blob' }), ext: 'zip' as const, pages: inner.pages + covers.pages };
}

/** The page with `b` extra pixels on every side, filled by stretching its edge pixels outward. */
function withBleed(pic: HTMLCanvasElement, b: number) {
  const w = pic.width;
  const h = pic.height;
  const c = document.createElement('canvas');
  c.width = w + b * 2;
  c.height = h + b * 2;
  const g = c.getContext('2d')!;
  // anything see-through (rounded corners) prints as white, not as JPEG black
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  g.imageSmoothingEnabled = false;
  g.drawImage(pic, b, b);
  g.drawImage(pic, 0, 0, 1, h, 0, b, b, h); // left
  g.drawImage(pic, w - 1, 0, 1, h, w + b, b, b, h); // right
  g.drawImage(pic, 0, 0, w, 1, b, 0, w, b); // top
  g.drawImage(pic, 0, h - 1, w, 1, b, h + b, w, b); // bottom
  g.drawImage(pic, 0, 0, 1, 1, 0, 0, b, b); // corners
  g.drawImage(pic, w - 1, 0, 1, 1, w + b, 0, b, b);
  g.drawImage(pic, 0, h - 1, 1, 1, 0, h + b, b, b);
  g.drawImage(pic, w - 1, h - 1, 1, 1, w + b, h + b, b, b);
  return c;
}
