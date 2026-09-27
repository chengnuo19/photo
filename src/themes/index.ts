import { withPhotos } from '../data/samples';
import { createElement, type CSSProperties } from 'react';
import type { BookDoc, Spread, ThemeId } from '../data/schema';
import { filmDef } from './film/pages';
import { journalDef } from './journal/theme';
import { museumDef } from './museum/theme';
import { watercolorDef } from './watercolor/theme';
import { starryDef } from './starry/theme';
import { pokemonDef } from './pokemon/theme';
import { ghibliDef } from './ghibli/theme';
import { wizardDef } from './wizard/theme';
import { strangerDef } from './stranger/theme';
import { wednesdayDef } from './wednesday/theme';
import { kitPages } from './kit/pages';
import { storybookDef } from './storybook/pages';
import type { DecorOption, PageProps, Palette, Theme, ThemeDef } from './types';

const DEFS: ThemeDef[] = [
  storybookDef,
  filmDef,
  journalDef,
  museumDef,
  watercolorDef,
  starryDef,
  wednesdayDef,
  strangerDef,
  pokemonDef,
  ghibliDef,
  wizardDef,
];

function resolve(def: ThemeDef): Theme {
  const covers = def.covers;
  const Cover = (p: PageProps) => {
    const v = covers.find((c) => c.id === p.book.coverVariant) ?? covers[0];
    return v ? createElement(v.Component, p) : createElement(kitPages.cover, p);
  };
  return {
    ...def,
    pages: { ...kitPages, ...def.pages, ...(covers.length ? { cover: Cover } : {}) } as Theme['pages'],
    // every sample book shows real photographs (data/samples.ts)
    sample: () => withPhotos(def.sample()),
  };
}

const THEMES = new Map<ThemeId, Theme>(DEFS.map((d) => [d.id, resolve(d)]));

export function getTheme(id: ThemeId): Theme {
  return THEMES.get(id) ?? THEMES.get('storybook')!;
}

export function listThemes(): Theme[] {
  return [...THEMES.values()];
}

export function paletteOf(theme: Theme, id?: string): Palette {
  return theme.palettes.find((p) => p.id === id) ?? theme.palettes[0];
}

/**
 * Quiet text (dates, places, running heads, captions on the table) is derived from each
 * palette's own ink and paper, so it stays legible (≥ 3:1) whatever the palette.
 */
const DERIVED = {
  '--ink-faint': 'color-mix(in srgb, var(--ink) 60%, var(--paper))',
  '--room-ink': 'color-mix(in srgb, var(--room-strong) 62%, var(--room))',
};

/** CSS custom properties for a book's theme + palette (apply to the room and the stage). */
export function themeStyle(book: BookDoc): CSSProperties {
  return { ...DERIVED, ...paletteOf(getTheme(book.themeId), book.paletteId).vars } as CSSProperties;
}

/** The decoration a spread shows: its own choice, else the theme default. */
export function activeDecor(theme: Theme, spread: Spread): DecorOption | null {
  const d = spread.overrides?.decor;
  if (d === 'none') return null;
  const fallback = theme.defaultDecor ?? theme.decor[0]?.id;
  const want = !d || d === 'theme' ? fallback : d;
  // an id from another theme (after a theme switch) falls back to this theme's default
  return theme.decor.find((x) => x.id === want) ?? theme.decor.find((x) => x.id === fallback) ?? null;
}

/** Stickers are looked up in the current theme first, then any theme (they survive a theme switch). */
export function findSticker(name: string, theme: Theme) {
  if (theme.stickers[name]) return theme.stickers[name];
  for (const t of THEMES.values()) if (t.stickers[name]) return t.stickers[name];
  return undefined;
}

/** Fonts every theme's pages rely on, plus the theme's own. */
export const BASE_FONTS = ['Noto Serif SC', 'LXGW WenKai', 'Cormorant Garamond'];
export function fontsOf(book: BookDoc) {
  return [...new Set([...BASE_FONTS, ...getTheme(book.themeId).fonts])];
}
