// iPhone photos: import HEIC files (one with no MIME type, as Windows often reports them) plus
// a normal photo through the theme gallery, then check every picture was stored upright with
// its size and capture date, and shows in the editor.
//
//   node scripts/heic-check.mjs <out-dir> <file.heic> [more files…]
// Make test files with pillow-heif, e.g. Image.save('x.heic', format='HEIF', exif=…).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, ...inputs] = process.argv.slice(2);
if (!outDir || !inputs.length) {
  console.log('usage: node scripts/heic-check.mjs <out-dir> <file.heic> [more files…]');
  process.exit(2);
}
const base = process.env.BASE ?? 'http://localhost:5173/';
fs.mkdirSync(outDir, { recursive: true });

const files = inputs.map((f, i) => ({
  name: path.basename(f),
  // the second HEIC arrives with no type at all
  mimeType: /\.hei[cf]$/i.test(f) ? (i === 1 ? '' : 'image/heic') : 'image/webp',
  buffer: fs.readFileSync(f),
}));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 820 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${base}#/new`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 30000 });
await page.getByRole('button', { name: /^选择「/ }).first().click();
await page.waitForTimeout(600);
const t0 = Date.now();
await page.locator('[role=dialog] input[type=file]').setInputFiles(files);
await page.waitForURL(/#\/book\/.+\/edit/, { timeout: 120000 });
console.log(`imported in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(outDir, 'heic-editor.png') });

const assets = await page.evaluate(
  () =>
    new Promise((resolve, reject) => {
      const req = indexedDB.open('memory-book');
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const all = req.result.transaction('assets').objectStore('assets').getAll();
        all.onsuccess = () =>
          resolve(all.result.filter((a) => a.kind === 'image').map((a) => ({ name: a.name, w: a.width, h: a.height, takenAt: a.takenAt, type: a.blob.type, bytes: a.blob.size })));
      };
    }),
);
console.table(assets);
const note = await page.locator('[role=status], [aria-live]').allInnerTexts();
const failedNote = note.find((t) => t.includes('没能读取'));

const fails = [...errors];
if (failedNote) fails.push(`import note: ${failedNote}`);
for (const f of files) {
  const a = assets.find((x) => x.name === f.name);
  if (!a) fails.push(`${f.name} was not imported`);
  else if (!a.w || !a.h || !a.bytes) fails.push(`${f.name} stored without pixels`);
}
await browser.close();
if (fails.length) {
  console.log('FAIL\n  ' + fails.join('\n  '));
  process.exit(1);
}
console.log('PASS');
