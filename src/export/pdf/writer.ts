/**
 * The smallest PDF writer that will do: every page is one JPEG picture placed on the page
 * (DCTDecode — the JPEG bytes go in unchanged). Pages are added one at a time and only their
 * compressed bytes are kept, so a long book does not hold every picture in memory.
 *
 * Units are PostScript points (1/72 inch).
 */

export interface PdfPage {
  /** Page size, points. */
  width: number;
  height: number;
  jpeg: Uint8Array;
  /** Picture size in pixels. */
  px: { w: number; h: number };
  /** Where the picture goes on the page (points, from the bottom left). Defaults to the whole page. */
  place?: { x: number; y: number; w: number; h: number };
  /** For print: the trimmed page inside the bleed (points). */
  trim?: { x: number; y: number; w: number; h: number };
}

const enc = new TextEncoder();
const n = (v: number) => (Math.round(v * 1000) / 1000).toString();

export class PdfWriter {
  private parts: Uint8Array[] = [];
  private size = 0;
  private offsets: number[] = [];
  private pageIds: number[] = [];
  private next = 3; // 1 = catalog, 2 = page tree (written last)

  constructor(private title: string) {
    this.raw('%PDF-1.4\n%âãÏÓ\n');
  }

  get pages() {
    return this.pageIds.length;
  }

  addPage(p: PdfPage) {
    const image = this.next++;
    const content = this.next++;
    const page = this.next++;
    this.obj(image, `<< /Type /XObject /Subtype /Image /Width ${p.px.w} /Height ${p.px.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`, p.jpeg, '\nendstream');
    const at = p.place ?? { x: 0, y: 0, w: p.width, h: p.height };
    const draw = `q ${n(at.w)} 0 0 ${n(at.h)} ${n(at.x)} ${n(at.y)} cm /Im0 Do Q`;
    this.obj(content, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
    const box = `[0 0 ${n(p.width)} ${n(p.height)}]`;
    const trim = p.trim ? ` /TrimBox [${n(p.trim.x)} ${n(p.trim.y)} ${n(p.trim.x + p.trim.w)} ${n(p.trim.y + p.trim.h)}] /BleedBox ${box}` : '';
    this.obj(page, `<< /Type /Page /Parent 2 0 R /MediaBox ${box}${trim} /Resources << /XObject << /Im0 ${image} 0 R >> >> /Contents ${content} 0 R >>`);
    this.pageIds.push(page);
  }

  finish(): Blob {
    this.obj(2, `<< /Type /Pages /Kids [${this.pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${this.pageIds.length} >>`);
    this.obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    const info = this.next++;
    this.obj(info, `<< /Title ${utf16(this.title)} /Producer (Memory Book) >>`);
    const xref = this.size;
    const count = this.next;
    let table = `xref\n0 ${count}\n0000000000 65535 f \n`;
    for (let i = 1; i < count; i++) table += `${String(this.offsets[i] ?? 0).padStart(10, '0')} 00000 n \n`;
    this.raw(table + `trailer\n<< /Size ${count} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(this.parts as BlobPart[], { type: 'application/pdf' });
  }

  private obj(id: number, head: string, body?: Uint8Array, tail = '') {
    this.offsets[id] = this.size;
    this.raw(`${id} 0 obj\n${head}`);
    if (body) this.bytes(body);
    this.raw(`${tail}\nendobj\n`);
  }

  private raw(s: string) {
    // header bytes above 127 must be single bytes, not UTF-8
    const b = /[^\x00-\x7f]/.test(s) ? Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff) : enc.encode(s);
    this.bytes(b);
  }

  private bytes(b: Uint8Array) {
    this.parts.push(b);
    this.size += b.length;
  }
}

/** A text string in UTF-16 (so Chinese titles show in the reader's title bar). */
function utf16(s: string) {
  let hex = 'FEFF';
  for (let i = 0; i < s.length; i++) hex += s.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
  return `<${hex}>`;
}

export const MM = 72 / 25.4;
