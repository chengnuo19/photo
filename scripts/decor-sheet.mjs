// Decoration audit: for every theme, each decor option on three layouts
// (full spread / two pages / photo + text), one screenshot per view, one sheet per theme.
//
//   node scripts/decor-sheet.mjs <out-dir> [themeIds,comma] [WxH] [palette]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, only = '', size = '1440x900', paletteArg = ''] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const base = process.env.BASE ?? 'http://localhost:5173/';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const mobile = w < 720;
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(base, { waitUntil: 'networkidle' });

const themes = await page.evaluate(async () => {
  const t = await import('/src/themes/index.ts');
  return t.listThemes().map((x) => ({ id: x.id, name: x.name, decor: x.decor.map((d) => d.id) }));
});

for (const t of themes.filter((t) => !only || only.split(',').includes(t.id))) {
  const id = `decor-${t.id}`;
  const labels = await page.evaluate(
    async ({ themeId, id, pal }) => {
      const db = await import('/src/storage/db.ts');
      const reg = await import('/src/themes/index.ts');
      const theme = reg.getTheme(themeId);
      const sample = theme.sample();
      const imgs = sample.spreads.flatMap((s) => s.images);
      const spreads = [];
      const labels = [];
      theme.decor.forEach((d, di) => {
        for (const [layout, n] of [['full-spread', 1], ['two-pages', 2], ['photo-text', 1]]) {
          spreads.push({
            id: `${d.id}-${layout}`,
            layout,
            images: Array.from({ length: n }, (_, i) => imgs[(di + i) % imgs.length]),
            caption: `${d.label} · ${layout}`,
            stamp: { date: '7.4', place: '某地' },
            title: '那天',
            text: '装饰不应该压住照片的主体。',
            overrides: { decor: d.id },
          });
          labels.push(`${d.label} · ${layout}`);
        }
      });
      await db.putBook({ ...sample, id, paletteId: pal || undefined, spreads, meta: { ...sample.meta, dedication: undefined, letter: undefined } });
      location.hash = '#/book/' + id;
      return labels;
    },
    { themeId: t.id, id, pal: paletteArg },
  );
  await page.waitForTimeout(2400);
  const shots = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1250);
    const info = await page.evaluate(() => ({
      phase: document.querySelector('[data-phase]')?.dataset.phase,
      cap: document.querySelector('[class*="caption"]')?.textContent ?? '',
    }));
    if (info.phase === 'ended') break;
    if (labels.some((l) => info.cap.includes(l))) shots.push((await page.screenshot({ type: 'jpeg', quality: 78 })).toString('base64'));
  }
  const cols = 3;
  const tw = mobile ? 260 : 520;
  const th = Math.round((tw * h) / w);
  const html = `<body style="margin:0;background:#777;display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:4px;padding:4px;font:13px sans-serif">
    <div style="grid-column:1/-1;color:#fff;padding:4px">${t.name} · 装饰 ${t.decor.join(' / ')}</div>
    ${shots.map((b) => `<img src="data:image/jpeg;base64,${b}" style="width:${tw}px;height:${th}px">`).join('')}</body>`;
  const sheet = await browser.newPage({ viewport: { width: cols * (tw + 4) + 4, height: 400 } });
  await sheet.setContent(html);
  const file = path.join(outDir, `decor-${t.id}${paletteArg ? '-' + paletteArg : ''}${mobile ? '-m' : ''}.png`);
  await sheet.screenshot({ path: file, fullPage: true });
  await sheet.close();
  console.log('sheet', path.basename(file), shots.length, 'shots');
}
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no errors');
await browser.close();
