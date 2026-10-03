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

/** Where a song link opens (the reader's own music app plays it). */
export type MusicPlatform = 'netease' | 'qq' | 'kugou' | 'kuwo' | 'apple' | 'spotify' | 'other';

/**
 * The book's music. Absent = the theme's own music.
 * - `theme`: synthesised by the theme (sound/score.ts), nothing to download
 * - `file`:  a song the author added; `start` = seconds to skip (start at the chorus)
 * - `link`:  a song on a music platform, opened in the reader's app (cannot play inside the book)
 * - `none`:  silence
 */
export type MusicChoice =
  | { kind: 'theme' }
  | { kind: 'file'; src: AssetSrc; title?: string; start?: number }
  | { kind: 'link'; url: string; title?: string; platform: MusicPlatform }
  | { kind: 'none' };

/** What a chapter can play (a link is for the whole book only). */
export type ChapterMusic = Exclude<MusicChoice, { kind: 'link' }>;

/** A chapter starts at the spread that carries it and runs until the next one. */
export interface Chapter {
  title?: string;
  /** Absent = keep playing what was playing. */
  music?: ChapterMusic;
}

/** A spoken note for a page, played when the reader arrives there. */
export interface VoiceNote {
  src: AssetSrc;
  seconds: number;
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
  /** A new chapter begins here. */
  chapter?: Chapter;
  voice?: VoiceNote;
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

/** How the book is given (data/gift.ts). The wait and the question are a ritual, not a lock. */
export interface Gift {
  unwrap?: boolean;
  to?: string;
  from?: string;
  /** Not to be opened before this moment (ms since 1970). */
  unlockAt?: number;
  /** Answer this first. `answers` are salted hashes of the accepted answers. */
  quiz?: { question: string; answers: string[]; salt: string; hint?: string };
  /** Once opened, the book turns its own pages. */
  autoplay?: boolean;
}

/** Current document version (data/migrate.ts upgrades older ones). */
export const DOC_VERSION = 2;

export interface BookDoc {
  id: string;
  version: 1 | 2;
  themeId: ThemeId;
  /** Colour variant of the theme; defaults to the theme's first palette. */
  paletteId?: string;
  /** Cover composition; defaults to the theme's first cover. */
  coverVariant?: string;
  meta: BookMeta;
  cover: { image?: BookImage };
  /** Absent = the theme's music. */
  music?: MusicChoice;
  sound: { flip: boolean };
  /** Gift wrapping shown before the cover when the book is shared (default on). */
  gift?: Gift;
  /** Apply the theme's photo filter (default on). */
  photoFilter?: boolean;
  spreads: Spread[];
}
