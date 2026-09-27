import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Fontsource lists a .woff fallback after every .woff2 slice. Every browser that can run this
 * app reads woff2, so drop the fallback: shorter @font-face rules in the first stylesheet, and
 * ~1,000 unused font files that no longer ship with the build.
 */
function woff2Only(): { postcssPlugin: string; Declaration: (d: { prop: string; value: string; parent?: { type?: string; name?: string } }) => void } {
  return {
    postcssPlugin: 'woff2-only',
    Declaration(decl) {
      if (decl.prop !== 'src' || decl.parent?.type !== 'atrule' || decl.parent.name !== 'font-face') return;
      const parts = decl.value.split(/,(?![^(]*\))/);
      const kept = parts.filter((p) => !/format\(\s*["']?woff["']?\s*\)/.test(p));
      if (kept.length && kept.length < parts.length) decl.value = kept.join(',');
    },
  };
}

// (read without @types/node: the app itself has no Node typings)
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

export default defineConfig({
  plugins: [react() as Plugin[]],
  // GitHub Pages serves the site under /photo/ (set in .github/workflows/deploy.yml); local dev stays at /
  base: env.BASE_PATH ?? '/',
  server: { port: 5173 },
  css: { postcss: { plugins: [woff2Only()] } },
  build: {
    // Never inline font slices as base64: they would all download with the first CSS (the
    // CJK fonts come in ~100 slices each), and the exporter picks slices by their .woff2 URL.
    assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
  },
});
