// Contact sheets for themes: every theme × palette, a book using all 8 layouts,
// one screenshot per reading view, assembled into a single image.
//
//   node scripts/theme-sheet.mjs <out-dir> [themeIds,comma] [WxH] [palette|all]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, only = '', size = '1440x900', paletteArg = 'all'] = process.argv.slice(2);
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
  return t.listThemes().map((x) => ({ id: x.id, name: x.name, palettes: x.palettes.map((p) => p.id), covers: x.covers.map((c) => c.id) }));
});
const selected = themes.filter((t) => !only || only.split(',').includes(t.id));

for (const t of selected) {
  const palettes = paletteArg === 'all' ? t.palettes : [paletteArg === 'first' ? t.palettes[0] : paletteArg];
  for (const pal of palettes) {
    for (const cover of pal === t.palettes[0] ? t.covers : [t.covers[0]]) {
      const id = `sheet-${t.id}-${pal}-${cover}`;
      await page.evaluate(
        async ({ themeId, pal, cover, id }) => {
          const db = await import('/src/storage/db.ts');
          const reg = await import('/src/themes/index.ts');
          const sample = reg.getTheme(themeId).sample();
          const imgs = sample.spreads.flatMap((s) => s.images);
          const pick = (i) => ({ ...imgs[i % imgs.length], focal: { x: 0.3 + ((i * 0.23) % 0.5), y: 0.5 } });
          const L = (layout, n, extra = {}) => ({ id: `${layout}-x`, layout, images: Array.from({ length: n }, (_, i) => pick(i + layout.length)), caption: `${layout} 的说明文字`, stamp: { date: '9.14', place: '某个地方' }, ...extra });
          const book = {
            ...sample,
            id,
            themeId,
            paletteId: pal,
            coverVariant: cover,
            spreads: [
              ...sample.spreads.slice(0, 1),
              L('photo-text', 1, { title: '那天的湖', text: '清晨的湖面没有一丝风，远处的山倒映在水里。\n我们坐在岸边，谁也没有说话。' }),
              L('hero-small', 3),
              L('grid', 4),
              L('collage', 5, { stickers: Object.keys(reg.getTheme(themeId).stickers).slice(0, 3).map((k, i) => ({ id: 's' + i, src: 'theme:' + k, x: 0.2 + i * 0.3, y: 0.12 + (i % 2) * 0.76, rot: i * 12 - 10, scale: 0.08 })) }),
              L('text', 0, { caption: '有些地方只去过一次，\n却会在心里住很久。', title: '写在路上', text: '火车穿过一片又一片麦田。窗外的光很好，我把这一段写下来，免得以后忘记。' }),
              L('two-pages', 2),
              L('polaroid', 1),
            ],
          };
          await db.putBook(book);
          location.hash = '#/book/' + id;
        },
        { themeId: t.id, pal, cover, id },
      );
      await page.waitForTimeout(2600);
      const shots = [];
      const snap = async () => shots.push((await page.screenshot({ type: 'jpeg', quality: 80 })).toString('base64'));
      await snap();
      // walk every view
      const views = await page.evaluate(() => document.querySelectorAll('.stf__item').length);
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(1250);
        await snap();
        const phase = await page.evaluate(() => document.querySelector('[data-phase]')?.dataset.phase);
        if (phase === 'ended') break;
      }
      // assemble
      const cols = mobile ? 5 : 3;
      const tw = mobile ? 260 : 480;
      const th = Math.round((tw * h) / w);
      const html = `<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:4px;padding:4px;font:12px sans-serif">
        <div style="grid-column:1/-1;color:#fff;padding:4px">${t.name} · ${pal} · cover ${cover} · ${views} pages</div>
        ${shots.map((b) => `<img src="data:image/jpeg;base64,${b}" style="width:${tw}px;height:${th}px">`).join('')}</body>`;
      const sheet = await browser.newPage({ viewport: { width: cols * (tw + 4) + 4, height: 400 } });
      await sheet.setContent(html);
      const file = path.join(outDir, `${t.id}-${pal}-${cover}${mobile ? '-m' : ''}.png`);
      await sheet.screenshot({ path: file, fullPage: true });
      await sheet.close();
      console.log('sheet', path.basename(file), shots.length, 'views');
    }
  }
}
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no errors');
await browser.close();
