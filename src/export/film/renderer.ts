import type { BuiltBook } from '../../data/buildPages';
import { between, edgeLines, restFor, type Rest } from '../../components/Book/geometry';
import { computeBookSize } from '../../hooks/useBookSize';
import { FlipCalculation } from '../../vendor/page-flip/Flip/FlipCalculation';
import { FlipCorner, FlipDirection } from '../../vendor/page-flip/Flip/Flip';
import { EASE_PAGE } from '../../vendor/page-flip/Render/Render';

/**
 * Draws the book on a canvas, frame by frame, for the phone video: the same geometry as the
 * reader (book size, table position, the flip engine's fold maths and fold shadows), with each
 * page a picture taken of the real page (see press.tsx).
 *
 * Everything is laid out in the CSS pixels of a virtual screen (`frame`) and scaled to the
 * video size, so a 9:16 video looks like the book on a phone and a 16:9 one like on a laptop.
 */

export type FilmFormat = 'portrait' | 'landscape';

/** The virtual screen each format imitates, and the video size. */
export const FORMATS: Record<FilmFormat, { w: number; h: number; outW: number; outH: number }> = {
  portrait: { w: 414, h: 736, outW: 1080, outH: 1920 },
  landscape: { w: 1280, h: 720, outW: 1920, outH: 1080 },
};

export type Picture = CanvasImageSource & { width: number; height: number };

export interface Look {
  /** Table colour behind everything (when there is no scene picture). */
  room: string;
  paper: string;
  paperDeep: string;
  paperEdge: string;
  /** The desk scene around the book, if it could be pictured. */
  scene?: Picture;
}

export interface Geometry {
  format: FilmFormat;
  landscape: boolean;
  /** Virtual screen (CSS px) and the scale to video pixels. */
  vw: number;
  vh: number;
  scale: number;
  /** One page (CSS px). */
  W: number;
  H: number;
  /** Left edge of the book area (the open spread in landscape) and its top. */
  left: number;
  top: number;
  /** Where the caption line starts under the book. */
  captionTop: number;
}

export function geometryFor(format: FilmFormat): Geometry {
  const f = FORMATS[format];
  const b = computeBookSize(f.w, f.h);
  const landscape = b.layout === 'landscape';
  // same padding as the reading stage (Book.module.css .stage)
  const padTop = landscape ? Math.max(56, f.h * 0.075) : Math.max(48, f.h * 0.08);
  const padBottom = landscape ? Math.max(84, f.h * 0.1) : Math.max(72, f.h * 0.12);
  const areaW = landscape ? b.pageWidth * 2 : b.pageWidth;
  const top = padTop + (f.h - padTop - padBottom - b.pageHeight) / 2;
  return {
    format,
    landscape,
    vw: f.w,
    vh: f.h,
    scale: f.outW / f.w,
    W: b.pageWidth,
    H: b.pageHeight,
    left: (f.w - areaW) / 2,
    top,
    captionTop: top + b.pageHeight + Math.max(20, f.h * 0.028),
  };
}

/** What happens between two resting positions of the book. */
export interface Turn {
  from: number;
  to: number;
  hard: boolean;
}

/** Every page turn from the closed cover to the closed back cover. */
export function turnsOf(built: BuiltBook): Turn[] {
  const last = built.pages.length - 1;
  const turns: Turn[] = [];
  if (built.layout === 'landscape') {
    // cover → first spread, spread → spread …, last spread → back cover
    let i = 0;
    while (i < last) {
      const to = i === 0 ? 1 : Math.min(last, i + 2);
      turns.push({ from: i, to, hard: i === 0 || to === last });
      i = to;
    }
  } else {
    for (let i = 0; i < last; i++) turns.push({ from: i, to: i + 1, hard: !!built.pages[i].hard });
  }
  return turns;
}

/** Pages visible at rest on index `i`, and during the turn that starts there. */
export function pagesFor(built: BuiltBook, t: Turn | number): number[] {
  const last = built.pages.length - 1;
  const at = (i: number) => (i >= 0 && i <= last ? [i] : []);
  if (typeof t === 'number') {
    if (built.layout !== 'landscape') return at(t);
    if (t === 0) return [0];
    if (t === last) return [last];
    return [t, t + 1];
  }
  if (built.layout !== 'landscape') return [...at(t.from), ...at(t.to)];
  if (t.from === 0) return [0, 1, 2];
  if (t.to === last) return [t.from, t.from + 1, last];
  return [t.from, t.from + 1, t.from + 2, t.from + 3];
}

const SHADOW = (a: number) => `rgba(46, 32, 20, ${a.toFixed(3)})`;

export class FilmRenderer {
  readonly g: Geometry;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly last: number;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly built: BuiltBook,
    readonly look: Look,
    format: FilmFormat,
    /** Clear instead of painting the table (pictures for the long image). */
    private readonly transparent = false,
  ) {
    this.g = geometryFor(format);
    const f = FORMATS[format];
    canvas.width = f.outW;
    canvas.height = f.outH;
    this.ctx = canvas.getContext('2d', { alpha: transparent })!;
    this.last = built.pages.length - 1;
  }

  /* ------------------------------------------------------------------ frames */

  /** The book lying open (or closed) at page index `i`. */
  rest(i: number, page: (i: number) => Picture | undefined, caption?: { pic: Picture; alpha: number }) {
    const { ctx, g } = this;
    this.begin();
    const r = restFor(i, this.last, g.landscape, g.W);
    const spine = this.spine(r);
    this.base(r, spine, i);
    const [a, b] = pagesFor(this.built, i);
    if (!g.landscape) this.page(page(a), spine, g.top);
    else if (i === 0) this.page(page(0), spine, g.top);
    else if (i === this.last) this.page(page(this.last), spine - g.W, g.top);
    else {
      this.page(page(a), spine - g.W, g.top);
      this.page(page(b), spine, g.top);
    }
    if (caption && caption.alpha > 0) this.caption(caption.pic, caption.alpha);
    ctx.restore();
  }

  /** Turn `t` at progress `p` (0…1, before easing). */
  turn(t: Turn, p: number, page: (i: number) => Picture | undefined, caption?: { pic: Picture; alpha: number }) {
    const { ctx, g } = this;
    this.begin();
    const k = EASE_PAGE(Math.min(1, Math.max(0, p)));
    const r = between(restFor(t.from, this.last, g.landscape, g.W), restFor(t.to, this.last, g.landscape, g.W), k);
    const spine = this.spine(r);
    this.base(r, spine, k < 0.5 ? t.from : t.to);
    if (t.hard) this.hardTurn(t, k, spine, page);
    else this.softTurn(t, k, spine, page);
    if (caption && caption.alpha > 0) this.caption(caption.pic, caption.alpha);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ pieces */

  private begin() {
    const { ctx, g, look, canvas } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = look.room;
    if (this.transparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (look.scene && !this.transparent) {
      // cover the frame, centred
      const s = Math.max(canvas.width / look.scene.width, canvas.height / look.scene.height);
      const w = look.scene.width * s;
      const h = look.scene.height * s;
      ctx.drawImage(look.scene, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    }
    ctx.setTransform(g.scale, 0, 0, g.scale, 0, 0);
    ctx.imageSmoothingQuality = 'high';
  }

  /** x of the spine (landscape) or of the page's left edge (portrait), in CSS px. */
  private spine(r: Rest) {
    const { g } = this;
    return g.landscape ? g.left + g.W + r.shift : g.left;
  }

  /** Table shadow and the paper block with its stacked page edges, under the visible halves. */
  private base(r: Rest, spine: number, index: number) {
    const { ctx, g, look } = this;
    const halves: [number, number, number][] = []; // x, width, direction
    if (g.landscape) {
      if (r.l > 0.001) halves.push([spine - g.W * r.l, g.W * r.l, -1]);
      if (r.r > 0.001) halves.push([spine, g.W * r.r, 1]);
    } else halves.push([spine, g.W, 1]);
    const s = g.scale;
    for (const [x, w] of halves) {
      ctx.save();
      ctx.fillStyle = look.paperDeep;
      ctx.shadowColor = 'rgba(70, 52, 30, 0.22)';
      ctx.shadowBlur = 34 * s;
      ctx.shadowOffsetY = 16 * s;
      ctx.fillRect(x, g.top, w, g.H);
      ctx.shadowColor = 'rgba(70, 52, 30, 0.14)';
      ctx.shadowBlur = 5 * s;
      ctx.shadowOffsetY = 2 * s;
      ctx.fillRect(x, g.top, w, g.H);
      ctx.restore();
    }
    // stacked edges: leaves already read on the left, still to come on the right
    const leftLeaves = g.landscape ? index : 0;
    const rightLeaves = this.last - index - (g.landscape ? 1 : 0);
    for (const [x, w, dir] of halves) {
      const n = edgeLines(dir < 0 ? leftLeaves : rightLeaves);
      for (let i = n; i >= 1; i--) {
        ctx.fillStyle = i % 2 ? look.paperEdge : look.paper;
        ctx.fillRect(x + dir * i * 1.4, g.top + i * 1.1, w, g.H);
        ctx.fillRect(x, g.top + i * 1.1, w, g.H);
      }
      ctx.fillStyle = look.paperDeep;
      ctx.fillRect(x, g.top, w, g.H);
    }
  }

  private page(pic: Picture | undefined, x: number, y: number) {
    const { ctx, g, look } = this;
    if (pic) ctx.drawImage(pic, x, y, g.W, g.H);
    else {
      ctx.fillStyle = look.paper;
      ctx.fillRect(x, y, g.W, g.H);
    }
  }

  private caption(pic: Picture, alpha: number) {
    const { ctx, g } = this;
    const w = pic.width / g.scale;
    const h = pic.height / g.scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(pic, (g.vw - w) / 2, g.captionTop + (1 - alpha) * 3, w, h);
    ctx.restore();
  }

  /**
   * A paper page: the fold maths of the flip engine (FlipCalculation) drawn the way its
   * HTML renderer does — next page revealed under the fold, the back of the leaf rotated
   * over it, and the two fold shadows.
   */
  private softTurn(t: Turn, k: number, spine: number, page: (i: number) => Picture | undefined) {
    const { ctx, g } = this;
    const { W, H, top } = g;
    let front: number, back: Picture | undefined, bottom: number | undefined, left: number | undefined;
    if (g.landscape) {
      left = t.from;
      front = t.from + 1;
      back = page(t.from + 2);
      bottom = t.from + 3 <= this.last ? t.from + 3 : undefined;
    } else {
      // single pages: the engine turns a copy of the page itself; its back shows it faintly
      front = t.from;
      back = this.ghost(page(t.from));
      bottom = t.to;
    }

    if (left !== undefined) this.page(page(left), spine - W, top);
    this.page(page(front), spine, top);

    const calc = new FlipCalculation(FlipDirection.FORWARD, FlipCorner.TOP, String(W), String(H));
    const margin = H / 10;
    const from = { x: W - margin, y: margin };
    const to = { x: -W, y: 0 };
    const pos = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
    if (!calc.calc(pos)) return; // at the very start / end the fold is degenerate: pages at rest
    const G = (p: { x: number; y: number }) => ({ x: spine + p.x, y: top + p.y });
    const poly = (pts: ({ x: number; y: number } | null)[]) => {
      ctx.beginPath();
      pts.filter((p): p is { x: number; y: number } => !!p).forEach((p, i) => (i ? ctx.lineTo(G(p).x, G(p).y) : ctx.moveTo(G(p).x, G(p).y)));
      ctx.closePath();
    };

    // the next page, uncovered by the fold
    if (bottom !== undefined) {
      ctx.save();
      poly(calc.getBottomClipArea());
      ctx.clip();
      this.page(page(bottom), spine, top);
      ctx.restore();
    } else {
      // nothing under it (single-page view of the last page): the table shows through
    }

    const progress = calc.getFlippingProgress();
    const shadow = {
      pos: G(calc.getShadowStartPoint()),
      angle: calc.getShadowAngle() + (3 * Math.PI) / 2,
      width: ((W * 3) / 4) * (progress / 100),
      opacity: ((100 - progress) * 0.55) / 100,
    };

    // outer shadow: cast by the lifted leaf on the page below
    if (shadow.width > 0.5) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(spine, top, W, H);
      ctx.clip();
      ctx.translate(shadow.pos.x, shadow.pos.y);
      ctx.rotate(shadow.angle);
      const gr = ctx.createLinearGradient(0, 0, shadow.width, 0);
      gr.addColorStop(0, SHADOW(shadow.opacity));
      gr.addColorStop(1, SHADOW(0));
      ctx.fillStyle = gr;
      ctx.fillRect(0, -100, shadow.width, H * 2);
      ctx.restore();
    }

    // the leaf's back, rotated over
    ctx.save();
    poly(calc.getFlippingClipArea());
    ctx.clip();
    const corner = G(calc.getActiveCorner());
    ctx.translate(corner.x, corner.y);
    ctx.rotate(calc.getAngle());
    if (back) ctx.drawImage(back, 0, 0, W, H);
    else {
      ctx.fillStyle = this.look.paper;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // inner shadow: the curve of the leaf near the fold
    const inner = (shadow.width * 3) / 4;
    if (inner > 0.5) {
      const r = calc.getRect();
      ctx.save();
      poly([r.topLeft, r.topRight, r.bottomRight, r.bottomLeft]);
      ctx.clip();
      ctx.translate(shadow.pos.x, shadow.pos.y);
      ctx.rotate(shadow.angle);
      const gr = ctx.createLinearGradient(0, 0, -inner, 0);
      gr.addColorStop(0.05, SHADOW(shadow.opacity));
      gr.addColorStop(0.15, SHADOW(0.05));
      gr.addColorStop(0.35, SHADOW(shadow.opacity));
      gr.addColorStop(1, SHADOW(0));
      ctx.fillStyle = gr;
      ctx.fillRect(-inner, -100, inner, H * 2);
      ctx.restore();
    }
  }

  /**
   * A board (the covers): rotates about the spine in perspective, drawn in thin vertical
   * strips. The front shows until it stands upright, then the back.
   */
  private hardTurn(t: Turn, k: number, spine: number, page: (i: number) => Picture | undefined) {
    const { ctx, g } = this;
    const { W, H, top } = g;
    let front: Picture | undefined, back: Picture | undefined;
    if (g.landscape) {
      if (t.from === 0) {
        front = page(0);
        back = page(1);
        this.page(page(2), spine, top); // the first spread's right page, under the cover
      } else {
        this.page(page(t.from), spine - W, top); // the last spread's left page stays
        front = page(t.from + 1);
        back = page(this.last);
      }
    } else {
      front = page(t.from);
      this.page(page(t.to), spine, top);
    }

    const theta = Math.PI * k;
    const c = Math.cos(theta);
    const upright = 1 - Math.abs(c);

    // shadow the leaf casts on the page it is lifting from / landing on
    if (upright > 0.01) {
      const tip = spine + W * c;
      const reach = W * 0.35 * upright;
      const dir = c >= 0 ? 1 : -1;
      if (g.landscape || dir > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(dir > 0 ? spine : spine - W, top, W, H);
        ctx.clip();
        const gr = ctx.createLinearGradient(tip, 0, tip + dir * reach, 0);
        gr.addColorStop(0, SHADOW(0.32 * upright));
        gr.addColorStop(1, SHADOW(0));
        ctx.fillStyle = gr;
        ctx.fillRect(Math.min(tip, tip + dir * reach), top, reach, H);
        ctx.restore();
      }
    }

    const face = c >= 0 ? front : back;
    const P = 3400; // the engine's CSS perspective
    const N = 48;
    const cy = top + H / 2;
    for (let i = 0; i < N; i++) {
      const d0 = (W * i) / N;
      const d1 = (W * (i + 1)) / N;
      const x0 = spine + (d0 * c * P) / (P - d0 * Math.sin(theta));
      const x1 = spine + (d1 * c * P) / (P - d1 * Math.sin(theta));
      const f = P / (P - ((d0 + d1) / 2) * Math.sin(theta));
      const h = H * f;
      const xl = Math.min(x0, x1);
      const w = Math.abs(x1 - x0) + 0.6;
      // image column: the front's spine edge is its left, the back's is its right
      const src = c >= 0 ? d0 : W - d1;
      if (face) {
        const sx = (src / W) * face.width;
        const sw = ((d1 - d0) / W) * face.width;
        ctx.drawImage(face, sx, 0, sw, face.height, xl, cy - h / 2, w, h);
      } else if (!g.landscape && c < 0) {
        ctx.fillStyle = this.look.paper;
        ctx.fillRect(xl, cy - h / 2, w, h);
      }
    }
    // light: the board darkens as it stands up
    if (upright > 0.01) {
      const far = spine + ((W * c * P) / (P - W * Math.sin(theta)));
      const f = P / (P - W * Math.sin(theta));
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(spine, top);
      ctx.lineTo(far, cy - (H * f) / 2);
      ctx.lineTo(far, cy + (H * f) / 2);
      ctx.lineTo(spine, top + H);
      ctx.closePath();
      ctx.fillStyle = SHADOW(0.3 * upright * upright);
      ctx.fill();
      ctx.restore();
    }
  }

  private ghosts = new WeakMap<object, HTMLCanvasElement>();

  /** A page seen from behind: its print shows through faintly. */
  private ghost(pic: Picture | undefined): Picture | undefined {
    if (!pic) return undefined;
    let c = this.ghosts.get(pic);
    if (!c) {
      c = document.createElement('canvas');
      c.width = pic.width;
      c.height = pic.height;
      const x = c.getContext('2d')!;
      x.translate(pic.width, 0);
      x.scale(-1, 1);
      x.drawImage(pic, 0, 0);
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.globalAlpha = 0.82;
      x.fillStyle = this.look.paper;
      x.fillRect(0, 0, c.width, c.height);
      this.ghosts.set(pic, c);
    }
    return c;
  }
}
