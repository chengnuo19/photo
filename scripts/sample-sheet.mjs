// Walk every built-in sample book from the gift wrapping to the back cover; one sheet per theme.
//   node scripts/sample-sheet.mjs <out-dir> [themeIds,comma] [WxH]
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
page.on('requestfailed', (r) => errors.push('failed ' + r.url()));
await page.goto(base, { waitUntil: 'networkidle' });
const themes = await page.evaluate(async () => (await import('/src/themes/index.ts')).listThemes().map((t) => ({ id: t.id, name: t.name, sample: t.sample().id })));
for (const t of themes.filter((t) => !only || only.split(',').includes(t.id))) {
  await page.goto(base + '#/book/' + t.sample, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  const shots = [(await page.screenshot({ type: 'jpeg', quality: 78 })).toString('base64')];
  if (await page.locator('[data-unwrap]').count()) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
  }
  for (let i = 0; i < 24; i++) {
    shots.push((await page.screenshot({ type: 'jpeg', quality: 78 })).toString('base64'));
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1300);
    if ((await page.evaluate(() => document.querySelector('[data-phase]')?.dataset.phase)) === 'ended') break;
  }
  const tw = mobile ? 260 : 480;
  const th = Math.round((tw * h) / w);
  const cols = mobile ? 5 : 3;
  const html = `<body style="margin:0;background:#777;display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:4px;padding:4px;font:13px sans-serif;color:#fff"><div style="grid-column:1/-1">${t.name}</div>${shots.map((b) => `<img src="data:image/jpeg;base64,${b}" style="width:${tw}px;height:${th}px">`).join('')}</body>`;
  const sheet = await browser.newPage({ viewport: { width: cols * (tw + 4) + 4, height: 400 } });
  await sheet.setContent(html);
  await sheet.screenshot({ path: path.join(outDir, `sample-${t.id}${mobile ? '-m' : ''}.jpg`), fullPage: true, type: 'jpeg', quality: 80 });
  await sheet.close();
  console.log('sheet', t.id, shots.length);
}
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no errors');
await browser.close();
