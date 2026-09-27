// Gift wrapping for every theme: wrapped, mid-opening, and the book afterwards.
//   node scripts/unwrap-sheet.mjs <out-dir> [themeIds,comma] [WxH]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, only = '', size = '1440x900'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const base = process.env.BASE ?? 'http://localhost:5173/';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const mobile = w < 720;
const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(base, { waitUntil: 'networkidle' });
const themes = await page.evaluate(async () => (await import('/src/themes/index.ts')).listThemes().map((t) => ({ id: t.id, name: t.name })));
const shots = [];
for (const t of themes.filter((t) => !only || only.split(',').includes(t.id))) {
  await page.evaluate(async (themeId) => {
    sessionStorage.clear();
    const db = await import('/src/storage/db.ts');
    const reg = await import('/src/themes/index.ts');
    const s = reg.getTheme(themeId).sample();
    await db.putBook({ ...s, id: 'gift-' + themeId, gift: { unwrap: true, to: '小满', from: '阿葵' } });
    location.hash = '#/book/gift-' + themeId;
  }, t.id);
  await page.waitForTimeout(2200);
  shots.push({ label: `${t.name} · 包装`, b: (await page.screenshot({ type: 'jpeg', quality: 80 })).toString('base64') });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(520);
  shots.push({ label: `${t.name} · 拆开中`, b: (await page.screenshot({ type: 'jpeg', quality: 80 })).toString('base64') });
  await page.waitForTimeout(1700);
  shots.push({ label: `${t.name} · 之后`, b: (await page.screenshot({ type: 'jpeg', quality: 80 })).toString('base64') });
  await page.goto(base + '#/', { waitUntil: 'networkidle' });
}
const tw = mobile ? 260 : 420;
const th = Math.round((tw * h) / w);
const html = `<body style="margin:0;background:#666;display:grid;grid-template-columns:repeat(3,${tw}px);gap:6px;padding:6px;font:13px sans-serif;color:#fff">${shots
  .map((s) => `<figure style="margin:0"><img src="data:image/jpeg;base64,${s.b}" style="width:${tw}px;height:${th}px;display:block"><figcaption>${s.label}</figcaption></figure>`)
  .join('')}</body>`;
const sheet = await browser.newPage({ viewport: { width: 3 * (tw + 6) + 6, height: 400 } });
await sheet.setContent(html);
const file = path.join(outDir, `unwrap-${only.replace(/,/g, '_') || 'all'}-${size}.png`);
await sheet.screenshot({ path: file, fullPage: true });
console.log('sheet', path.basename(file), shots.length);
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no errors');
await browser.close();
