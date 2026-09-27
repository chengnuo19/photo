import { createElement, Fragment } from 'react';
import { Scene } from '../components/Scene/Scene';
import { Unwrap } from '../components/Unwrap/Unwrap';
import type { BookDoc } from '../data/schema';
import { srcToBlob } from '../storage/assets';
import { forEachSrc, mapSrcs } from '../storage/db';
import { fontsOf, getTheme } from '../themes';
import { ensureFonts } from '../themes/fonts';

/**
 * Export a book as something that can be shared without this app:
 *
 * - `zip`:  a static site (index.html + assets/ + fonts/) — drop it on Netlify/Vercel/GitHub
 *           Pages, or just double-click index.html; nothing is fetched at runtime.
 * - `html`: one self-contained file with images, music and fonts inlined as data URIs.
 *
 * Both start from the prebuilt reader template (public/viewer/viewer.html) and embed the
 * book JSON plus only the font slices the book's text actually needs.
 */
export type ExportKind = 'zip' | 'html';

export interface ExportResult {
  blob: Blob;
  filename: string;
}

type Progress = (msg: string) => void;

/** Text the reader itself shows (so its glyphs get included). */
const UI_TEXT = '回忆绘本轻点封面，打开这本书再读一遍— 完 —音乐静音暂停播放书已合上。按右方向键或点击封面打开这张图片没能加载出来©·/ ';
const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');

export async function exportBook(doc: BookDoc, kind: ExportKind, progress: Progress = () => {}): Promise<ExportResult> {
  progress('准备阅读器…');
  const template = await loadTemplate();

  // ---- assets
  const srcs: string[] = [];
  forEachSrc(doc, (s) => {
    if (s && !srcs.includes(s)) srcs.push(s);
  });
  const assetOut = new Map<string, { path: string; blob: Blob }>();
  let n = 0;
  for (const src of srcs) {
    n++;
    progress(`整理图片和音乐 ${n}/${srcs.length}…`);
    const blob = await srcToBlob(src);
    assetOut.set(src, { path: `assets/${String(n).padStart(3, '0')}.${extOf(blob.type, src)}`, blob });
  }

  // ---- fonts: only the slices this book's text touches
  progress('挑选需要的字体…');
  await ensureFonts(fontsOf(doc), doc.themeId);
  const chars = new Set([...bookText(doc), ...UI_TEXT, ...ASCII, ...(await sceneText(doc))].map((c) => c.codePointAt(0)!));
  const families = fontsOf(doc);
  const faces = collectFontFaces().filter((f) => families.includes(f.family) && f.ranges.some(([a, b]) => hasCharIn(chars, a, b)));
  const fontOut: { face: FontFaceInfo; path: string; blob: Blob }[] = [];
  let k = 0;
  for (const face of faces) {
    k++;
    progress(`打包字体 ${k}/${faces.length}…`);
    const res = await fetch(face.url);
    if (!res.ok) continue;
    fontOut.push({ face, path: `fonts/${String(k).padStart(3, '0')}.woff2`, blob: await res.blob() });
  }

  progress('写入文件…');
  if (kind === 'zip') {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const mapped = mapSrcs(doc, (s) => assetOut.get(s)?.path ?? s);
    const css = fontOut.map((f) => fontFaceCss(f.face, f.path)).join('\n');
    zip.file('index.html', inject(template, mapped, css));
    for (const a of assetOut.values()) zip.file(a.path, a.blob);
    for (const f of fontOut) zip.file(f.path, f.blob);
    zip.file('README.txt', readme(doc));
    const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    return { blob, filename: `${safeName(doc.meta.title)}-回忆绘本.zip` };
  }

  const dataUris = new Map<string, string>();
  for (const [src, a] of assetOut) dataUris.set(src, await toDataUri(a.blob));
  const mapped = mapSrcs(doc, (s) => dataUris.get(s) ?? s);
  const fontCss: string[] = [];
  for (const f of fontOut) fontCss.push(fontFaceCss(f.face, await toDataUri(f.blob)));
  const html = inject(template, mapped, fontCss.join('\n'));
  return { blob: new Blob([html], { type: 'text/html' }), filename: `${safeName(doc.meta.title)}-回忆绘本.html` };
}

export function download({ blob, filename }: ExportResult) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/* ------------------------------------------------------------------ helpers */

async function loadTemplate() {
  const res = await fetch(`${import.meta.env.BASE_URL}viewer/viewer.html`, { cache: 'no-cache' });
  const text = res.ok ? await res.text() : '';
  if (!text.includes('id="book-data"')) throw new Error('找不到阅读器模板（public/viewer/viewer.html），请先运行 npm run build:viewer');
  return text;
}

const BS = String.fromCharCode(92); // backslash
const LS = String.fromCharCode(0x2028);
const LINE_SEPARATORS = new RegExp('[' + LS + String.fromCharCode(0x2029) + ']', 'g');

function inject(template: string, book: BookDoc, fontCss: string) {
  // Escape '<' (no '</script>' can end the block early) and U+2028/2029 (invalid in older JS).
  const json = JSON.stringify(book).replace(/</g, BS + 'u003c').replace(LINE_SEPARATORS, (c) => BS + (c === LS ? 'u2028' : 'u2029'));
  const title = esc(book.meta.title || '回忆绘本');
  const desc = esc([book.meta.kicker, book.meta.subtitle].filter(Boolean).join(' · ') || '一本可以翻开的回忆绘本');
  const meta = [
    `<meta name="description" content="${desc}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:type" content="book" />`,
  ].join('\n    ');
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace('<!--BOOK_META-->', meta)
    .replace('<!--BOOK_FONTS-->', fontCss ? `<style>\n${fontCss}\n</style>` : '')
    .replace(/<script id="book-data" type="application\/json">[\s\S]*?<\/script>/, () => `<script id="book-data" type="application/json">${json}</script>`);
}

function bookText(doc: BookDoc): string[] {
  const m = doc.meta;
  const parts = [
    m.kicker, m.title, m.subtitle, m.author, m.dateLine,
    ...m.coverLines, ...m.closingLines,
    m.dedication?.to, m.dedication?.body,
    m.letter?.salutation, m.letter?.body, m.letter?.signoff, m.letter?.date,
    ...doc.spreads.flatMap((s) => [s.caption, s.stamp?.date, s.stamp?.place]),
  ];
  return [...parts.filter(Boolean).join('')];
}

interface FontFaceInfo {
  family: string;
  weight: string;
  style: string;
  unicodeRange: string;
  ranges: [number, number][];
  url: string;
}

/** Read the app's own @font-face rules (fontsource slices) with their resolved woff2 URLs. */
function collectFontFaces(): FontFaceInfo[] {
  const out: FontFaceInfo[] = [];
  const walk = (rules: CSSRuleList, base: string) => {
    for (const r of Array.from(rules)) {
      if (r instanceof CSSFontFaceRule) {
        const st = r.style;
        const family = st.getPropertyValue('font-family').replace(/["']/g, '').trim();
        const src = st.getPropertyValue('src');
        const m = src.match(/url\(\s*["']?([^"')]+\.woff2[^"')]*)["']?\s*\)/);
        if (!m) continue;
        const ur = st.getPropertyValue('unicode-range') || 'U+0-10FFFF';
        out.push({
          family,
          weight: st.getPropertyValue('font-weight') || '400',
          style: st.getPropertyValue('font-style') || 'normal',
          unicodeRange: ur,
          ranges: parseRanges(ur),
          url: new URL(m[1], base).href,
        });
      } else if ('cssRules' in r && (r as CSSGroupingRule).cssRules) {
        walk((r as CSSGroupingRule).cssRules, base);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules, sheet.href ?? location.href);
    } catch {
      /* cross-origin sheet */
    }
  }
  return out;
}

function parseRanges(ur: string): [number, number][] {
  return ur.split(',').map((part) => {
    const p = part.trim().replace(/^U\+/i, '');
    if (p.includes('?')) return [parseInt(p.replace(/\?/g, '0'), 16), parseInt(p.replace(/\?/g, 'F'), 16)];
    const [a, b] = p.split('-');
    return [parseInt(a, 16), parseInt(b ?? a, 16)];
  });
}

function hasCharIn(chars: Set<number>, a: number, b: number) {
  for (const c of chars) if (c >= a && c <= b) return true;
  return false;
}

function fontFaceCss(f: FontFaceInfo, url: string) {
  return `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(${url}) format('woff2');unicode-range:${f.unicodeRange};}`;
}

function extOf(type: string, src: string) {
  const byType: Record<string, string> = {
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
  };
  return byType[type] ?? src.split(/[?#]/)[0].split('.').pop()?.slice(0, 5) ?? 'bin';
}

const toDataUri = (blob: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const safeName = (s: string) => (s || '无题').replace(/[\\/:*?"<>|\s]+/g, '').slice(0, 40) || '无题';

function readme(doc: BookDoc) {
  return `《${doc.meta.title || '无题'}》— 回忆绘本

这是一本可以在浏览器里翻开的书。

■ 自己看
  直接双击 index.html 即可打开（不需要网络）。

■ 分享给别人（得到一个链接）
  任选一种，都免费：
  1. Netlify Drop：打开 https://app.netlify.com/drop ，把整个文件夹拖进去。
  2. Vercel：安装 Vercel CLI 后，在这个文件夹里运行 vercel deploy。
  3. GitHub Pages：新建仓库，上传这些文件，在 Settings → Pages 里开启。

■ 文件说明
  index.html   书本身（文字和版式都在里面）
  assets/      图片与音乐
  fonts/       这本书用到的字体片段
`;
}

/**
 * Text drawn by the theme's desk scene and gift wrapping (labels on props, the gift tag…):
 * rendered to static markup once, so their glyphs are packed too. Loaded only when exporting.
 */
async function sceneText(doc: BookDoc) {
  try {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const theme = getTheme(doc.themeId);
    const noop = () => undefined;
    const html = renderToStaticMarkup(
      createElement(
        Fragment,
        null,
        createElement(Scene, { theme, mode: 'read', sound: false }),
        createElement(Unwrap, { theme, book: doc, sound: false, onOpen: noop, onDone: noop }),
      ),
    );
    return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
  } catch {
    return '';
  }
}
