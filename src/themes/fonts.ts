/**
 * Theme fonts are loaded on demand: each import only registers @font-face rules (the glyph
 * files themselves download slice by slice when text needs them). Keeping them out of the
 * main stylesheet keeps the first paint light — most books only ever use one theme.
 */
const LOADERS: Record<string, () => Promise<unknown>> = {
  'Noto Serif SC@300': () => import('@fontsource/noto-serif-sc/300.css'),
  'Noto Serif SC@900': () => import('@fontsource/noto-serif-sc/900.css'),
  UnifrakturMaguntia: () => import('@fontsource/unifrakturmaguntia/400.css'),
  'Special Elite': () => import('@fontsource/special-elite/400.css'),
  VT323: () => import('@fontsource/vt323/400.css'),
  Caveat: () => import('@fontsource/caveat/400.css'),
  Cinzel: () => Promise.all([import('@fontsource/cinzel/400.css'), import('@fontsource/cinzel/600.css')]),
  'Cinzel Decorative': () => import('@fontsource/cinzel-decorative/700.css'),
  Fredoka: () => import('@fontsource/fredoka/500.css'),
  'Press Start 2P': () => import('@fontsource/press-start-2p/400.css'),
  'ZCOOL KuaiLe': () => import('@fontsource/zcool-kuaile/400.css'),
  'Ma Shan Zheng': () => import('@fontsource/ma-shan-zheng/400.css'),
};

/** Extra weights some themes need beyond the base 400/600. */
const EXTRA_WEIGHTS: Record<string, string[]> = {
  museum: ['Noto Serif SC@300'],
  stranger: ['Noto Serif SC@900'],
};

const started = new Map<string, Promise<unknown>>();

export function ensureFonts(families: string[], themeId?: string) {
  const keys = [...families, ...(themeId ? EXTRA_WEIGHTS[themeId] ?? [] : [])];
  return Promise.all(
    keys.map((k) => {
      const load = LOADERS[k];
      if (!load) return undefined;
      if (!started.has(k)) started.set(k, load().catch(() => undefined));
      return started.get(k);
    }),
  );
}
