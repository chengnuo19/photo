import type { BookDoc } from '../data/schema';
import { fontsOf } from '../themes';

/**
 * The font slices a book needs. Fontsource ships each CJK font as ~100 slices by unicode
 * range; a book's text touches a handful. Exports pack only those, and the video recorder
 * embeds only those in its page pictures.
 */

/** Text the reader itself shows (so its glyphs get included). */
const UI_TEXT = '回忆绘本轻点封面，打开这本书再读一遍— 完 —音乐静音暂停播放书已合上。按右方向键或点击封面打开这张图片没能加载出来©·/ ';
const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');

/** @font-face rules (with their slice URLs) for the fonts `doc` uses and the characters it shows, plus `extraText`. */
export function facesFor(doc: BookDoc, extraText = ''): FontFaceInfo[] {
  const chars = new Set([...bookText(doc), ...UI_TEXT, ...ASCII, ...extraText].map((c) => c.codePointAt(0)!));
  const families = fontsOf(doc);
  return collectFontFaces().filter((f) => families.includes(f.family) && f.ranges.some(([a, b]) => hasCharIn(chars, a, b)));
}

function bookText(doc: BookDoc): string[] {
  const m = doc.meta;
  const parts = [
    m.kicker, m.title, m.subtitle, m.author, m.dateLine,
    ...m.coverLines, ...m.closingLines,
    m.dedication?.to, m.dedication?.body,
    m.letter?.salutation, m.letter?.body, m.letter?.signoff, m.letter?.date,
    ...doc.spreads.flatMap((s) => [s.caption, s.title, s.text, s.stamp?.date, s.stamp?.place]),
  ];
  return [...parts.filter(Boolean).join('')];
}

export interface FontFaceInfo {
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

export function fontFaceCss(f: FontFaceInfo, url: string) {
  return `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(${url}) format('woff2');unicode-range:${f.unicodeRange};}`;
}

export const toDataUri = (blob: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
