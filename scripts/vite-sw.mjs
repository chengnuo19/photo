// Vite plugin: after the build, write dist/sw.js = a manifest of every file in dist (path →
// content hash) + src/sw/service-worker.js. Plain JS so vite.config.ts needs no Node typings.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Never precached: large and rarely needed, or only needed together with files that are not
 * precached either (a theme's font rules without its font files) — cached the first time used.
 */
const LAZY = [/heic-to/i, /^viewer\//, /^books\//, /^assets\/\d{3}(-italic)?-[^/]+\.css$/];
/** Chunks built from these packages (only the video recorder and iPhone photos need them). */
const LAZY_PACKAGES = /node_modules[\\/](mediabunny|modern-screenshot|heic-to)[\\/]/;

export default function serviceWorker() {
  let outDir = 'dist';
  let enabled = true;
  const lazyChunks = new Set();
  return {
    name: 'mb-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      // the export template builds with its own config (no index.html, no worker)
      enabled = !config.build.rollupOptions?.input?.toString().includes('viewer.html');
    },
    generateBundle(_, bundle) {
      for (const f of Object.values(bundle)) {
        if (f.type === 'chunk' && Object.keys(f.modules).some((id) => LAZY_PACKAGES.test(id))) lazyChunks.add(f.fileName);
      }
    },
    closeBundle() {
      if (!enabled) return;
      const files = {};
      const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else {
            const rel = path.relative(outDir, full).split(path.sep).join('/');
            if (rel === 'sw.js') continue;
            files[rel] = crypto.createHash('sha1').update(fs.readFileSync(full)).digest('hex').slice(0, 10);
          }
        }
      };
      walk(outDir);
      const precache = Object.keys(files).filter(
        (p) => (p === 'index.html' || p === 'manifest.webmanifest' || p.startsWith('icons/') || /^assets\/.+\.(js|css)$/.test(p)) && !LAZY.some((re) => re.test(p)) && !lazyChunks.has(p),
      );
      const version = crypto.createHash('sha1').update(JSON.stringify(files)).digest('hex').slice(0, 10);
      const source = fs.readFileSync(new URL('../src/sw/service-worker.js', import.meta.url), 'utf8');
      const head =
        `self.MB_VERSION = ${JSON.stringify(version)};\n` +
        `self.MB_PRECACHE = ${JSON.stringify(precache)};\n` +
        `self.MB_FILES = ${JSON.stringify(files)};\n`;
      fs.writeFileSync(path.join(outDir, 'sw.js'), head + source);
      const kb = (n) => `${Math.round(n / 1024)} KB`;
      const size = precache.reduce((s, p) => s + fs.statSync(path.join(outDir, p)).size, 0);
      console.log(`sw.js: ${Object.keys(files).length} files known, ${precache.length} precached (${kb(size)})`);
    },
  };
}
