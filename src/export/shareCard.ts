import type { BookDoc } from '../data/schema';
import { srcToBlob } from '../storage/assets';
import { getTheme, themeStyle } from '../themes';

/**
 * Pictures that stand for the book when it is shared as a link:
 *
 * - `card`: 1200×630 — the cover photo as a book on the table with the title beside it
 *           (og:image, and the image WeChat picks up as the chat thumbnail);
 * - `icon`: 180×180 — a square crop of the cover photo (favicon / home-screen icon).
 *
 * Colours come from the book's own theme and palette, so the card looks like the book.
 */
export interface ShareImages {
  card: Blob;
  icon: Blob;
}

export async function makeShareImages(doc: BookDoc): Promise<ShareImages | null> {
  try {
    const colors = themeColors(doc);
    const photo = await coverBitmap(doc);
    const [card, icon] = await Promise.all([drawCard(doc, photo, colors), drawIcon(photo, colors)]);
    photo?.close();
    return { card, icon };
  } catch {
    return null;
  }
}

interface Colors {
  paper: string;
  ink: string;
  soft: string;
  room: string;
  accent: string;
}

/** Resolve the theme's CSS custom properties (defaults + palette) the way the page would. */
function themeColors(doc: BookDoc): Colors {
  const probe = document.createElement('div');
  probe.className = getTheme(doc.themeId).className;
  Object.assign(probe.style, { position: 'fixed', visibility: 'hidden', pointerEvents: 'none' });
  for (const [k, v] of Object.entries(themeStyle(doc))) probe.style.setProperty(k, String(v));
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const get = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  const c: Colors = {
    paper: get('--paper', '#f6f1e6'),
    ink: get('--ink', '#3a3128'),
    soft: get('--ink-soft', '#6d5d48'),
    room: get('--room', '#f7f2e7'),
    accent: get('--accent', get('--ink-soft', '#8a6d4a')),
  };
  probe.remove();
  return c;
}

async function coverBitmap(doc: BookDoc): Promise<ImageBitmap | null> {
  const img = doc.cover.image ?? doc.spreads.find((s) => s.images[0])?.images[0];
  if (!img) return null;
  try {
    return await createImageBitmap(await srcToBlob(img.src));
  } catch {
    return null;
  }
}

/** Draw `bm` to cover the box (object-fit: cover). */
function cover(ctx: CanvasRenderingContext2D, bm: ImageBitmap, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / bm.width, h / bm.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(bm, (bm.width - sw) / 2, (bm.height - sh) / 2, sw, sh, x, y, w, h);
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

const toJpeg = (c: HTMLCanvasElement, q = 0.88) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', q));

const SERIF = '"Noto Serif SC", "Songti SC", serif';
const HAND = '"LXGW WenKai", "Kaiti SC", serif';

async function drawCard(doc: BookDoc, photo: ImageBitmap | null, c: Colors) {
  const W = 1200;
  const H = 630;
  const [cv, ctx] = canvas(W, H);
  await document.fonts.load(`600 60px "Noto Serif SC"`, doc.meta.title || '回忆绘本').catch(() => undefined);

  // the table
  ctx.fillStyle = c.room;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.3, H * 0.45, 40, W * 0.3, H * 0.45, W * 0.7);
  glow.addColorStop(0, 'rgba(255,255,255,0.35)');
  glow.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // a closed book: shadow, page edges, cover
  const bw = 400;
  const bh = 500;
  const bx = 110;
  const by = (H - bh) / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(40, 28, 16, 0.32)';
  ctx.shadowBlur = 38;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = c.paper;
  ctx.fillRect(bx + 6, by + 6, bw, bh);
  ctx.restore();
  for (let i = 5; i >= 1; i--) {
    ctx.fillStyle = i % 2 ? c.paper : 'rgba(0,0,0,0.08)';
    ctx.fillRect(bx + i * 1.2, by + i * 1.2, bw, bh);
  }
  ctx.fillStyle = c.paper;
  ctx.fillRect(bx, by, bw, bh);
  if (photo) {
    const m = 26;
    cover(ctx, photo, bx + m, by + m, bw - m * 2, bh - m * 2 - 70);
    ctx.fillStyle = c.ink;
    ctx.font = `600 26px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.fillText(clip(ctx, doc.meta.title || '回忆绘本', bw - 60), bx + bw / 2, by + bh - 36);
  } else {
    ctx.fillStyle = c.ink;
    ctx.font = `600 40px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.fillText(clip(ctx, doc.meta.title || '回忆绘本', bw - 60), bx + bw / 2, by + bh / 2);
  }
  // spine shading
  const spine = ctx.createLinearGradient(bx, 0, bx + 30, 0);
  spine.addColorStop(0, 'rgba(40,25,10,0.22)');
  spine.addColorStop(1, 'rgba(40,25,10,0)');
  ctx.fillStyle = spine;
  ctx.fillRect(bx, by, 30, bh);

  // words beside it
  const tx = 600;
  const maxW = W - tx - 80;
  ctx.textAlign = 'left';
  let y = 210;
  if (doc.meta.kicker) {
    ctx.fillStyle = c.soft;
    ctx.font = `28px ${HAND}`;
    ctx.fillText(clip(ctx, doc.meta.kicker, maxW), tx, y);
    y += 78;
  }
  ctx.fillStyle = c.ink;
  ctx.font = `600 64px ${SERIF}`;
  for (const line of wrap(ctx, doc.meta.title || '回忆绘本', maxW).slice(0, 2)) {
    ctx.fillText(line, tx, y);
    y += 80;
  }
  if (doc.meta.subtitle) {
    ctx.fillStyle = c.soft;
    ctx.font = `28px ${SERIF}`;
    ctx.fillText(clip(ctx, doc.meta.subtitle, maxW), tx, y + 4);
    y += 56;
  }
  const to = doc.gift?.to || doc.meta.dedication?.to;
  const by2 = [doc.meta.author && `© ${doc.meta.author}`, doc.meta.dateLine].filter(Boolean).join('  ·  ');
  ctx.fillStyle = c.soft;
  ctx.font = `24px ${HAND}`;
  if (to && doc.gift?.unwrap !== false) ctx.fillText(clip(ctx, `送给 ${to.replace(/^给/, '')}`, maxW), tx, Math.max(y + 40, 470));
  else if (by2) ctx.fillText(clip(ctx, by2, maxW), tx, Math.max(y + 40, 470));
  ctx.globalAlpha = 0.6;
  ctx.font = `20px ${HAND}`;
  ctx.fillText('回忆绘本 · 轻点翻开', tx, H - 70);
  ctx.globalAlpha = 1;
  return toJpeg(cv);
}

async function drawIcon(photo: ImageBitmap | null, c: Colors) {
  const S = 180;
  const [cv, ctx] = canvas(S, S);
  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, S, S);
  if (photo) cover(ctx, photo, 0, 0, S, S);
  else {
    ctx.fillStyle = c.ink;
    ctx.font = `600 90px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('书', S / 2, S / 2 + 4);
  }
  return toJpeg(cv, 0.86);
}

function clip(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > max) t = t.slice(0, -1);
  return t + '…';
}

/** Break CJK / Latin text into lines no wider than `max`. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = [];
  let line = '';
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > max && line) {
      lines.push(line);
      line = ch;
    } else line += ch;
  }
  if (line) lines.push(line);
  if (lines.length > 2) lines[1] = clip(ctx, lines.slice(1).join(''), max);
  return lines;
}
