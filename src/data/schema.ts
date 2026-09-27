/**
 * Book document model.
 *
 * A book is authored as logical *spreads* (what a reader sees when the book lies open).
 * `buildPages()` turns spreads into the physical page sequence the flip engine needs,
 * which differs between the two-page (landscape) and single-page (portrait) layouts.
 */

export type ThemeId =
  | 'storybook'
  | 'film'
  | 'wednesday'
  | 'stranger'
  | 'journal'
  | 'museum'
  | 'watercolor'
  | 'starry'
  | 'pokemon'
  | 'ghibli'
  | 'wizard';

/** Image location. Plain URL for now; editor-stored blobs will resolve to object URLs. */
export type AssetSrc = string;

/** Focal point used for cropping, 0..1 on each axis. */
export interface Focal {
  x: number;
  y: number;
}

export interface BookImage {
  src: AssetSrc;
  alt: string;
  focal?: Focal;
  /** Small version for the polaroid preview; falls back to `src`. */
  thumb?: AssetSrc;
}

/**
 * - `full-spread`: one image across both pages (the reference look)
 * - `two-pages`:   one image per page
 * - `polaroid`:    photos laid on paper as instant prints
 * - `photo-text`:  a framed photo facing a page of writing
 * - `hero-small`:  one large image facing two small ones
 * - `grid`:        four photos, two per page
 * - `collage`:     3–5 prints scattered across the spread, scrapbook style
 * - `text`:        words only — a quote facing a page of writing
 */
export type SpreadLayout = 'full-spread' | 'two-pages' | 'polaroid' | 'photo-text' | 'hero-small' | 'grid' | 'collage' | 'text';

/** A sticker on a spread. Coordinates are relative to the whole spread (0..1). */
export interface Sticker {
  id: string;
  /** `theme:<name>` for a theme sticker, otherwise an image source (asset ref / URL). */
  src: string;
  x: number;
  y: number;
  /** Degrees. */
  rot: number;
  /** Width relative to the spread width. */
  scale: number;
}

export interface Stamp {
  date?: string;
  place?: string;
}

export interface SpreadOverrides {
  /** Decoration id from the theme's decor options; 'none' for none; absent/'theme' = theme default. */
  decor?: string;
  captionStyle?: 'serif' | 'hand';
  /** false = this spread's photos skip the theme's photo filter. */
  filter?: boolean;
}

export interface Spread {
  id: string;
  layout: SpreadLayout;
  images: BookImage[];
  caption?: string;
  /** Heading and body for the writing pages (photo-text / text layouts). */
  title?: string;
  text?: string;
  stamp?: Stamp;
  /**
   * Optional real photo behind an illustration. Shown as the small polaroid beside the book;
   * when absent the polaroid previews the next spread.
   */
  snapshot?: BookImage;
  stickers?: Sticker[];
  overrides?: SpreadOverrides;
}

export interface Dedication {
  to?: string;
  body: string;
}

export interface Letter {
  salutation?: string;
  body: string;
  signoff?: string;
  date?: string;
}

export interface BookMeta {
  /** Small line above the title, e.g. "一次春天的旅行". */
  kicker?: string;
  title: string;
  subtitle?: string;
  author?: string;
  dateLine?: string;
  /** Short lines typeset on the front cover. */
  coverLines: string[];
  /** Short lines typeset on the back cover. */
  closingLines: string[];
  dedication?: Dedication;
  letter?: Letter;
}

export interface BookDoc {
  id: string;
  version: 1;
  themeId: ThemeId;
  /** Colour variant of the theme; defaults to the theme's first palette. */
  paletteId?: string;
  /** Cover composition; defaults to the theme's first cover. */
  coverVariant?: string;
  meta: BookMeta;
  cover: { image?: BookImage };
  music?: { src: AssetSrc; title?: string };
  sound: { flip: boolean };
  /** Gift wrapping shown before the cover when the book is shared (default on). */
  gift?: { unwrap?: boolean; to?: string; from?: string };
  /** Apply the theme's photo filter (default on). */
  photoFilter?: boolean;
  spreads: Spread[];
}
