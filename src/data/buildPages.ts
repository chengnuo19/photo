import type { BookDoc, BookImage, Spread, SpreadLayout } from './schema';

export type Layout = 'landscape' | 'portrait';

/** A reading position: what the reader is looking at (drives caption + polaroid preview). */
export type ViewKind = 'cover' | 'title' | 'dedication' | 'story' | 'letter' | 'finis' | 'back';

export interface View {
  key: string;
  kind: ViewKind;
  spread?: Spread;
}

export type PageKind =
  | 'cover'
  | 'back-cover'
  | 'endpaper'
  | 'title'
  | 'dedication'
  | 'image'
  | 'polaroid'
  | 'note'
  | 'letter'
  | 'finis'
  | 'blank'
  // story pages added with the layout kit
  | 'framed' // one photo with margins
  | 'writing' // heading + body text
  | 'quote' // a large quote
  | 'stack' // two photos stacked
  | 'collage'; // scattered prints (spread-wide layer)

/** Which part of a spread-wide layer (stickers, collage, full-spread art) a page shows. */
export type LayerPart = 'left' | 'right' | 'full';

export interface PageSpec {
  key: string;
  kind: PageKind;
  /** Hard pages rotate like board (covers). */
  hard?: boolean;
  /** Index into `views`. */
  view: number;
  side: 'left' | 'right' | 'single';
  spread?: Spread;
  images?: BookImage[];
  /** Index of each entry of `images` within `spread.images` (for editing). */
  imageIndexes?: number[];
  /** For full-spread images: which half of the artwork this page shows. */
  half?: 'left' | 'right';
  /** For spread-wide layers (stickers, collage): which part this page shows. */
  part?: LayerPart;
}

export interface BuiltBook {
  layout: Layout;
  pages: PageSpec[];
  views: View[];
}

type Slot = Omit<PageSpec, 'side' | 'view' | 'key' | 'spread' | 'part'> & { id: string };

/**
 * Layout table: how each spread layout splits into physical pages.
 * `land` returns [left, right]; `port` returns one or more single pages.
 * Images are referenced by index into `spread.images`.
 */
const LAYOUTS: Record<SpreadLayout, { land: (s: Spread) => [Slot, Slot]; port: (s: Spread) => Slot[] }> = {
  'full-spread': {
    land: () => [
      { id: 'l', kind: 'image', imageIndexes: [0], half: 'left' },
      { id: 'r', kind: 'image', imageIndexes: [0], half: 'right' },
    ],
    port: () => [{ id: 'p', kind: 'image', imageIndexes: [0] }],
  },
  'two-pages': {
    land: () => [
      { id: 'l', kind: 'image', imageIndexes: [0] },
      { id: 'r', kind: 'image', imageIndexes: [1] },
    ],
    port: (s) => [{ id: 'a', kind: 'image', imageIndexes: [0] }, ...(s.images[1] ? [{ id: 'b', kind: 'image' as const, imageIndexes: [1] }] : [])],
  },
  polaroid: {
    land: (s) => {
      const idx = s.images.map((_, i) => i);
      const right = idx.filter((i) => i % 2 === 1);
      return [
        { id: 'l', kind: 'polaroid', imageIndexes: idx.filter((i) => i % 2 === 0) },
        right.length ? { id: 'r', kind: 'polaroid', imageIndexes: right } : { id: 'r', kind: 'note' },
      ];
    },
    port: (s) => [{ id: 'p', kind: 'polaroid', imageIndexes: s.images.slice(0, 3).map((_, i) => i) }],
  },
  'photo-text': {
    land: () => [
      { id: 'l', kind: 'framed', imageIndexes: [0] },
      { id: 'r', kind: 'writing' },
    ],
    port: () => [
      { id: 'a', kind: 'framed', imageIndexes: [0] },
      { id: 'b', kind: 'writing' },
    ],
  },
  'hero-small': {
    land: () => [
      { id: 'l', kind: 'image', imageIndexes: [0] },
      { id: 'r', kind: 'stack', imageIndexes: [1, 2] },
    ],
    port: () => [
      { id: 'a', kind: 'image', imageIndexes: [0] },
      { id: 'b', kind: 'stack', imageIndexes: [1, 2] },
    ],
  },
  grid: {
    land: () => [
      { id: 'l', kind: 'stack', imageIndexes: [0, 1] },
      { id: 'r', kind: 'stack', imageIndexes: [2, 3] },
    ],
    port: () => [
      { id: 'a', kind: 'stack', imageIndexes: [0, 1] },
      { id: 'b', kind: 'stack', imageIndexes: [2, 3] },
    ],
  },
  collage: {
    land: (s) => [
      { id: 'l', kind: 'collage', imageIndexes: s.images.map((_, i) => i).slice(0, 5) },
      { id: 'r', kind: 'collage', imageIndexes: s.images.map((_, i) => i).slice(0, 5) },
    ],
    port: (s) => [{ id: 'p', kind: 'collage', imageIndexes: s.images.map((_, i) => i).slice(0, 4) }],
  },
  text: {
    land: () => [
      { id: 'l', kind: 'quote' },
      { id: 'r', kind: 'writing' },
    ],
    port: () => [{ id: 'p', kind: 'writing' }],
  },
};

/** How many images each layout shows (used by the editor and auto layout). */
export const LAYOUT_CAPACITY: Record<SpreadLayout, number> = {
  'full-spread': 1,
  'two-pages': 2,
  polaroid: 3,
  'photo-text': 1,
  'hero-small': 3,
  grid: 4,
  collage: 5,
  text: 0,
};

/**
 * Turn the logical book into the physical page list for the flip engine.
 *
 * Landscape (two-page spreads, cover shown alone):
 *   [cover] [endpaper | title] [ · | dedication] [story L | story R]… [ · | letter] [finis | endpaper] [back]
 * The count is always 1 + 2n + 1, so the back cover lands alone on the left like a real book.
 *
 * Portrait (one page at a time): each spread becomes one or more single pages (see LAYOUTS).
 */
export function buildPages(book: BookDoc, layout: Layout): BuiltBook {
  const pages: PageSpec[] = [];
  const views: View[] = [];

  const addView = (v: View) => {
    views.push(v);
    return views.length - 1;
  };
  const lr = (left: Omit<PageSpec, 'side' | 'view'>, right: Omit<PageSpec, 'side' | 'view'>, view: number) => {
    pages.push({ ...left, side: 'left', view }, { ...right, side: 'right', view });
  };
  const single = (p: Omit<PageSpec, 'side' | 'view'>, view: number) => {
    pages.push({ ...p, side: 'single', view });
  };
  const land = layout === 'landscape';

  // Cover
  const vCover = addView({ key: 'cover', kind: 'cover' });
  pages.push({ key: 'cover', kind: 'cover', hard: true, view: vCover, side: land ? 'right' : 'single' });

  // Title
  const vTitle = addView({ key: 'title', kind: 'title' });
  if (land) lr({ key: 'endpaper-front', kind: 'endpaper' }, { key: 'title', kind: 'title' }, vTitle);
  else single({ key: 'title', kind: 'title' }, vTitle);

  // Dedication
  if (book.meta.dedication?.body) {
    const v = addView({ key: 'dedication', kind: 'dedication' });
    if (land) lr({ key: 'dedication-blank', kind: 'blank' }, { key: 'dedication', kind: 'dedication' }, v);
    else single({ key: 'dedication', kind: 'dedication' }, v);
  }

  // Story
  for (const spread of book.spreads) {
    const v = addView({ key: spread.id, kind: 'story', spread });
    const def = LAYOUTS[spread.layout] ?? LAYOUTS['full-spread'];
    const toSpec = ({ id, ...slot }: Slot, part: LayerPart): Omit<PageSpec, 'side' | 'view'> => ({
      ...slot,
      key: `${spread.id}-${id}`,
      spread,
      part,
      images: slot.imageIndexes?.map((i) => spread.images[i]).filter(Boolean),
    });
    if (land) {
      const [l, r] = def.land(spread);
      lr(toSpec(l, 'left'), toSpec(r, 'right'), v);
    } else {
      const ps = def.port(spread);
      // A spread split over two portrait pages shows each half of its spread-wide layer.
      ps.forEach((p, i) => single(toSpec(p, ps.length === 1 ? 'full' : i === 0 ? 'left' : 'right'), v));
    }
  }

  // Letter
  if (book.meta.letter?.body) {
    const v = addView({ key: 'letter', kind: 'letter' });
    if (land) lr({ key: 'letter-blank', kind: 'blank' }, { key: 'letter', kind: 'letter' }, v);
    else single({ key: 'letter', kind: 'letter' }, v);
  }

  // Finis
  const vFinis = addView({ key: 'finis', kind: 'finis' });
  if (land) lr({ key: 'finis', kind: 'finis' }, { key: 'endpaper-back', kind: 'endpaper' }, vFinis);
  else single({ key: 'finis', kind: 'finis' }, vFinis);

  // Back cover
  const vBack = addView({ key: 'back', kind: 'back' });
  pages.push({ key: 'back-cover', kind: 'back-cover', hard: true, view: vBack, side: land ? 'left' : 'single' });

  return { layout, pages, views };
}

/** First image of a view, used for the "next page" polaroid preview. */
export function viewPreviewImage(view: View | undefined): BookImage | undefined {
  return view?.spread?.images[0];
}
