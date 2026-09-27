// Contrast audit: for every theme × palette, walk the whole sample book and report text whose
// colour is too close to the solid background behind it (WCAG ratio < 3).
// Backgrounds painted with images/gradients are reported as "unknown" and skipped.
//
//   node scripts/contrast-audit.mjs [themeIds,comma]
import { chromium } from 'playwright-core';

const only = process.argv[2] ?? '';
const base = process.env.BASE ?? 'http://localhost:5173/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: 'networkidle' });

const themes = await page.evaluate(async () => {
  const t = await import('/src/themes/index.ts');
  return t.listThemes().map((x) => ({ id: x.id, palettes: x.palettes.map((p) => p.id), covers: x.covers.map((c) => c.id) }));
});

const AUDIT = () => {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const out = [];
  const pages = [...document.querySelectorAll('.stf__item')].filter((e) => e.style.display !== 'none');
  for (const pg of pages) {
    const walker = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const text = n.textContent.trim();
      if (!text) continue;
      const el = n.parentElement;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || +cs.opacity === 0 || el.closest('svg')) continue;
      const fg = parse(cs.color);
      if (!fg || fg.a === 0) continue; // outlined text (transparent fill) is judged by its stroke/glow
      if (el.parentElement?.querySelector(':scope > img, :scope > div img')) continue; // text laid over a photo
      let bg = null;
      let unknown = false;
      for (let a = el; a; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (s.backgroundImage && s.backgroundImage !== 'none' && !a.classList.contains('paper')) {
          unknown = true;
          break;
        }
        const c = parse(s.backgroundColor);
        if (c && c.a > 0.5) {
          bg = c;
          break;
        }
      }
      if (unknown || !bg) continue;
      const r = ratio(fg, bg);
      if (r < 3) out.push(`${r.toFixed(2)}  "${text.slice(0, 16)}"  ${cs.color} on rgb(${bg.r},${bg.g},${bg.b})  .${[...el.classList].join('.')}`);
    }
  }
  return out;
};

let problems = 0;
for (const t of themes.filter((x) => !only || only.split(',').includes(x.id))) {
  for (const pal of t.palettes) {
    for (const cover of pal === t.palettes[0] ? t.covers : [t.covers[0]]) {
      const id = `audit-${t.id}-${pal}-${cover}`;
      await page.evaluate(
        async ({ themeId, pal, cover, id }) => {
          const db = await import('/src/storage/db.ts');
          const reg = await import('/src/themes/index.ts');
          await db.putBook({ ...reg.getTheme(themeId).sample(), id, paletteId: pal, coverVariant: cover });
          location.hash = '#/book/' + id;
        },
        { themeId: t.id, pal, cover, id },
      );
      await page.waitForTimeout(1600);
      const found = new Set();
      for (let i = 0; i < 24; i++) {
        for (const f of await page.evaluate(AUDIT)) found.add(f);
        const phase = await page.evaluate(() => document.querySelector('[data-phase]')?.dataset.phase);
        if (phase === 'ended') break;
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(1150);
      }
      if (found.size) {
        problems += found.size;
        console.log(`\n✗ ${t.id} · ${pal} · ${cover}`);
        for (const f of found) console.log('   ' + f);
      } else {
        console.log(`✓ ${t.id} · ${pal} · ${cover}`);
      }
    }
  }
}
console.log(`\n${problems} low-contrast text runs`);
await browser.close();
