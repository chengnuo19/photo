import type { ImportedImage } from '../storage/assets';
import { newId } from '../storage/assets';
import type { BookDoc, BookImage, Spread, SpreadLayout, ThemeId } from './schema';

export function createBook(themeId: ThemeId = 'storybook'): BookDoc {
  return {
    id: newId(),
    version: 1,
    themeId,
    meta: {
      kicker: '一段想留住的时光',
      title: '无题',
      subtitle: '写一句副标题',
      author: '',
      dateLine: new Date().getFullYear() + '',
      coverLines: ['把那些', '想记住的瞬间', '留在纸上。'],
      closingLines: ['下次见。'],
      dedication: { to: '给你', body: '在这里写下献词。' },
      letter: { salutation: '亲爱的你：', body: '在这里写一封信。', signoff: '' },
    },
    cover: {},
    sound: { flip: true },
    spreads: [],
  };
}

/** Copy the built-in sample (or any book) as a new editable book. */
export function duplicateBook(doc: BookDoc): BookDoc {
  return { ...structuredClone(doc), id: newId() };
}

const fmtStampDate = (d: Date) => `${d.getMonth() + 1}.${d.getDate()}`;

type Mood = 'default' | 'scrapbook' | 'gallery';
const MOOD: Partial<Record<ThemeId, Mood>> = { journal: 'scrapbook', film: 'scrapbook', museum: 'gallery' };

/** Candidate layouts for a chunk of n photos, most fitting first. */
function candidates(n: number, allLandscape: boolean, mood: Mood): SpreadLayout[] {
  switch (n) {
    case 1:
      return mood === 'gallery' || !allLandscape ? ['photo-text', 'full-spread'] : ['full-spread', 'photo-text'];
    case 2:
      return mood === 'scrapbook' ? ['polaroid', 'two-pages'] : ['two-pages', 'polaroid'];
    case 3:
      return mood === 'scrapbook' ? ['collage', 'hero-small', 'polaroid'] : ['hero-small', 'collage', 'polaroid'];
    case 4:
      return mood === 'scrapbook' ? ['collage', 'grid'] : ['grid', 'collage'];
    default:
      return ['collage'];
  }
}

const GAP = 2 * 60 * 60 * 1000;

/**
 * Turn a batch of imported images into spreads with a varied rhythm:
 * photos are ordered by capture time, grouped into moments (same day, < 2 h apart), and each
 * moment is laid out by how many photos it has — a single landscape gets a full spread, three
 * become one large + two small, four a grid, five a scrapbook collage. Adjacent spreads avoid
 * repeating a layout when there is an alternative. Themes nudge the choice (e.g. the travel
 * journal prefers collages).
 */
export function spreadsFromImages(images: ImportedImage[], themeId: ThemeId = 'storybook'): Spread[] {
  const mood = MOOD[themeId] ?? 'default';
  const sorted = [...images].sort((a, b) => (a.takenAt?.getTime() ?? Infinity) - (b.takenAt?.getTime() ?? Infinity));
  const toImage = (i: ImportedImage): BookImage => ({ src: i.src, thumb: i.thumb, alt: i.name.replace(/\.[^.]+$/, ''), focal: { x: 0.5, y: 0.5 } });
  const stamp = (i: ImportedImage) => (i.takenAt ? { date: fmtStampDate(i.takenAt) } : undefined);
  const isLand = (i: ImportedImage) => i.width / i.height >= 1.15;

  // 1. moments
  const groups: ImportedImage[][] = [];
  const untimed = [1, 3, 2, 4, 1];
  let u = 0;
  for (const img of sorted) {
    const g = groups[groups.length - 1];
    const prev = g?.[g.length - 1];
    const sameMoment =
      prev &&
      (prev.takenAt && img.takenAt
        ? img.takenAt.getTime() - prev.takenAt.getTime() < GAP && img.takenAt.toDateString() === prev.takenAt.toDateString()
        : !prev.takenAt && !img.takenAt && g.length < untimed[u % untimed.length]);
    if (sameMoment) g.push(img);
    else {
      if (g && !g[0].takenAt) u++;
      groups.push([img]);
    }
  }

  // 2. chunks of at most 5
  const chunks: ImportedImage[][] = [];
  for (const g of groups) {
    let rest = g;
    while (rest.length > 5) {
      chunks.push(rest.slice(0, 4));
      rest = rest.slice(4);
    }
    chunks.push(rest);
  }

  // 3. layouts, avoiding immediate repeats
  const out: Spread[] = [];
  for (const c of chunks) {
    const opts = candidates(c.length, c.every(isLand), mood);
    const prev = out[out.length - 1]?.layout;
    const layout = opts.find((l) => l !== prev) ?? opts[0];
    // put the widest picture first for layouts with a hero
    const ordered = layout === 'hero-small' || layout === 'full-spread' ? [...c].sort((a, b) => b.width / b.height - a.width / a.height) : c;
    out.push({
      id: newId(),
      layout,
      images: ordered.map(toImage),
      caption: '',
      ...(layout === 'photo-text' ? { title: '', text: '' } : {}),
      stamp: stamp(c[0]),
    });
  }
  return out;
}

export function moveSpread(doc: BookDoc, from: number, to: number) {
  const [s] = doc.spreads.splice(from, 1);
  doc.spreads.splice(Math.max(0, Math.min(doc.spreads.length, to)), 0, s);
}

export function setLayout(spread: Spread, layout: SpreadLayout) {
  spread.layout = layout;
}

export const LAYOUT_LABELS: Record<SpreadLayout, string> = {
  'full-spread': '整幅跨页',
  'two-pages': '左右两幅',
  polaroid: '拍立得',
  'photo-text': '图文对页',
  'hero-small': '一大两小',
  grid: '四宫格',
  collage: '手账拼贴',
  text: '纯文字',
};
