import { withPhotos } from '../data/samples';
import { createElement, type CSSProperties } from 'react';
import type { BookDoc, Spread, ThemeId } from '../data/schema';
import { useEffect, useSyncExternalStore } from 'react';
import { kitPages } from './kit/pages';
import { storybookDef } from './storybook/pages';
import type { DecorOption, PageProps, Palette, Theme, ThemeDef } from './types';

/**
 * Themes load on demand — each is its own chunk (components, ornaments, desk scene, CSS), so
 * opening the shelf or a book only downloads the themes on screen. The storybook theme stays
 * in the main bundle as the default and the fallback while another theme is on its way.
 * Order here is the order themes are listed in.
 */
const LOADERS: Record<ThemeId, () => Promise<ThemeDef>> = {
  storybook: async () => storybookDef,
  film: () => import('./film/pages').then((m) => m.filmDef),
  journal: () => import('./journal/theme').then((m) => m.journalDef),
  museum: () => import('./museum/theme').then((m) => m.museumDef),
  watercolor: () => import('./watercolor/theme').then((m) => m.watercolorDef),
  starry: () => import('./starry/theme').then((m) => m.starryDef),
  wednesday: () => import('./wednesday/theme').then((m) => m.wednesdayDef),
  stranger: () => import('./stranger/theme').then((m) => m.strangerDef),
  pokemon: () => import('./pokemon/theme').then((m) => m.pokemonDef),
  ghibli: () => import('./ghibli/theme').then((m) => m.ghibliDef),
  wizard: () => import('./wizard/theme').then((m) => m.wizardDef),
};
const ORDER = Object.keys(LOADERS) as ThemeId[];

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

const THEMES = new Map<ThemeId, Theme>([['storybook', resolve(storybookDef)]]);
const pending = new Map<ThemeId, Promise<Theme>>();
const listeners = new Set<() => void>();
let version = 0;

/** A loaded theme; the storybook theme until `loadTheme(id)` has finished. */
export function getTheme(id: ThemeId): Theme {
  return THEMES.get(id) ?? THEMES.get('storybook')!;
}

export function isThemeLoaded(id: ThemeId) {
  return THEMES.has(id) || !(id in LOADERS);
}

export function loadTheme(id: ThemeId): Promise<Theme> {
  if (THEMES.has(id)) return Promise.resolve(THEMES.get(id)!);
  const load = LOADERS[id];
  if (!load) return Promise.resolve(getTheme(id));
  if (!pending.has(id)) {
    pending.set(
      id,
      load().then(
        (def) => {
          const t = resolve(def);
          THEMES.set(id, t);
          version++;
          listeners.forEach((l) => l());
          return t;
        },
        (err) => {
          pending.delete(id); // a flaky connection may succeed next time
          throw err;
        },
      ),
    );
  }
  return pending.get(id)!;
}

export function loadThemes(ids: Iterable<ThemeId>) {
  return Promise.all([...new Set(ids)].map(loadTheme));
}

export const loadAllThemes = () => loadThemes(ORDER);

/** Themes that have loaded, in catalogue order (all of them after `loadAllThemes()`). */
export function listThemes(): Theme[] {
  return ORDER.filter((id) => THEMES.has(id)).map((id) => THEMES.get(id)!);
}

/** The theme a book id / sample id needs, without loading anything. */
export function sampleThemeId(sampleId: string): ThemeId {
  const t = sampleId.replace(/^sample-/, '') as ThemeId;
  return t in LOADERS ? t : 'storybook';
}

/**
 * Re-render when themes arrive, and report whether the requested ones are ready.
 * `'all'` loads the whole catalogue (theme gallery, style menu).
 */
export function useThemes(ids: ThemeId[] | 'all'): boolean {
  useSyncExternalStore(subscribe, () => version);
  const want = ids === 'all' ? ORDER : ids;
  const key = want.join('|');
  useEffect(() => {
    void loadThemes(want).catch(() => undefined);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return want.every(isThemeLoaded);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Warm the rest of the catalogue once the page is idle (stickers from other themes, the style menu). */
export function preloadThemesWhenIdle() {
  const go = () => void loadAllThemes().catch(() => undefined);
  if ('requestIdleCallback' in window) window.requestIdleCallback(go, { timeout: 6000 });
  else setTimeout(go, 3000);
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
