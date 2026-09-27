// Desk scenes: every theme's sample book, closed and open, at one or more screen sizes.
//
//   node scripts/scene-sheet.mjs <out-dir> [themeIds,comma] [WxH,WxH]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, only = '', sizes = '1600x900'] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:5173/';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];

for (const size of sizes.split(',')) {
  const [w, h] = size.split('x').map(Number);
  const mobile = w < 720;
  const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(base, { waitUntil: 'networkidle' });
  const themes = await page.evaluate(async () => (await import('/src/themes/index.ts')).listThemes().map((t) => ({ id: t.id, name: t.name, sample: t.sample().id })));
  const shots = [];
  for (const t of themes.filter((t) => !only || only.split(',').includes(t.id))) {
    await page.goto(base + '#/book/' + t.sample, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    shots.push({ label: `${t.name} · 合上`, b: (await page.screenshot({ type: 'jpeg', quality: 80 })).toString('base64') });
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1300);
    }
    shots.push({ label: `${t.name} · 打开`, b: (await page.screenshot({ type: 'jpeg', quality: 80 })).toString('base64') });
  }
  await page.close();
  const tw = mobile ? 300 : 640;
  const th = Math.round((tw * h) / w);
  const cols = mobile ? 6 : 2;
  const html = `<body style="margin:0;background:#666;display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:6px;padding:6px;font:13px sans-serif;color:#fff">${shots
    .map((s) => `<figure style="margin:0"><img src="data:image/jpeg;base64,${s.b}" style="width:${tw}px;height:${th}px;display:block"><figcaption>${s.label}</figcaption></figure>`)
    .join('')}</body>`;
  const sheet = await browser.newPage({ viewport: { width: cols * (tw + 6) + 6, height: 400 } });
  await sheet.setContent(html);
  const file = path.join(outDir, `scenes-${only.replace(/,/g, '_') || 'all'}-${size}.png`);
  await sheet.screenshot({ path: file, fullPage: true });
  await sheet.close();
  console.log('sheet', path.basename(file), shots.length);
}
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no errors');
await browser.close();
