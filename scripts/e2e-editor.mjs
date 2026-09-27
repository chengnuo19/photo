// End-to-end check: shelf → sample-book gallery → create from photos → edit in place
// (layout, decor, stickers, theme/palette) → export zip + html → open the exports from disk.
//
//   node scripts/e2e-editor.mjs <out-dir> <photo-dir>
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import JSZip from 'jszip';

const [outDir, photoDir] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:5173/';
fs.mkdirSync(outDir, { recursive: true });
const shot = (p, name) => p.screenshot({ path: path.join(outDir, `${name}.png`) });
const log = (...a) => console.log('•', ...a);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const photos = fs.readdirSync(photoDir).map((f) => path.join(photoDir, f));

// 1. shelf → gallery
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.getByText('新建一本').click();
await page.waitForTimeout(1800);
await shot(page, 'g01-gallery');

// 2. pick the travel journal, old-map palette, then photos
await page.getByRole('button', { name: '选择「复古旅行手账」' }).click();
await page.waitForTimeout(600);
await page.getByRole('button', { name: '旧地图蓝' }).click();
await page.waitForTimeout(400);
await shot(page, 'g02-card');
await page.locator('[role=dialog] input[type=file]').setInputFiles(photos);
await page.waitForURL(/#\/book\/.+\/edit/, { timeout: 30000 });
await page.waitForTimeout(2500);
log('editor', page.url());
const tiles = await page.locator('nav[aria-label="页面"] li').count();
log('strip tiles', tiles);
await shot(page, 'g03-editor-cover');

// 3. title (journal ticket)
await page.locator('nav[aria-label="页面"] li button').nth(1).click();
await page.waitForTimeout(600);
const h1 = page.locator('h1[contenteditable]').first();
await h1.click();
await page.keyboard.press('Control+A');
await page.keyboard.type('南岛公路');
await page.mouse.click(40, 450);
await page.waitForTimeout(500);
log('title now', await h1.innerText());

// 4. first story spread: layout, decor, stickers
await page.locator('nav[aria-label="页面"] li button').nth(3).click();
await page.waitForTimeout(800);
await shot(page, 'g04-story');
await page.getByRole('radio', { name: '手账拼贴' }).click();
await page.waitForTimeout(700);
await page.getByRole('button', { name: '邮戳' }).click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: '加贴纸' }).click();
await page.waitForTimeout(300);
await page.locator('[role=menu] button[title="指南针"]').click();
await page.waitForTimeout(300);
const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: '上传自己的贴纸（PNG）' }).click()]);
await chooser.setFiles(photos[0]);
await page.waitForTimeout(1500);
await page.getByRole('button', { name: '加贴纸' }).click(); // close tray
const st = page.locator('div[data-editing][style*="rotate"]').first();
log('stickers', await page.locator('div[data-editing][style*="rotate"]').count());
if (await st.count()) {
  const b = await st.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 - 120, b.y + b.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
}
await shot(page, 'g05-collage-stickers');

// 5. style menu
await page.getByRole('button', { name: /^风格/ }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: '星期三 · 暗紫' }).click();
await page.waitForTimeout(1200);
await page.mouse.click(10, 450);
await page.waitForTimeout(600);
await shot(page, 'g06-wednesday');
await page.getByRole('button', { name: /^风格/ }).click();
await page.getByRole('button', { name: '怪奇物语 · 颠倒世界' }).click();
await page.waitForTimeout(1200);
await page.mouse.click(10, 450);
await page.waitForTimeout(400);
await shot(page, 'g07-stranger');

// 6. undo / redo
await page.keyboard.press('Control+z');
await page.waitForTimeout(300);
await page.keyboard.press('Control+Shift+z');
await page.waitForTimeout(600);

// 7. exports
async function doExport(label) {
  await page.getByRole('button', { name: '导出' }).click();
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.getByRole('button', { name: label }).click()]);
  const file = path.join(outDir, dl.suggestedFilename());
  await dl.saveAs(file);
  log('exported', path.basename(file), (fs.statSync(file).size / 1024).toFixed(0) + ' KB');
  return file;
}
const zipFile = await doExport('网站文件夹（.zip）');
await page.waitForTimeout(2600);
const htmlFile = await doExport('单个网页文件（.html）');

const zip = await JSZip.loadAsync(fs.readFileSync(zipFile));
const siteDir = path.join(outDir, 'site');
fs.rmSync(siteDir, { recursive: true, force: true });
for (const [name, entry] of Object.entries(zip.files)) {
  if (entry.dir) continue;
  const dest = path.join(siteDir, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, await entry.async('nodebuffer'));
}
const listing = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
log('zip files', listing.length, 'fonts', listing.filter((n) => n.startsWith('fonts/')).length, 'assets', listing.filter((n) => n.startsWith('assets/')).length);

// 8. open the exports from disk
for (const [name, file] of [['zip', path.join(siteDir, 'index.html')], ['html', htmlFile]]) {
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('requestfailed', (r) => errs.push('failed ' + r.url().slice(0, 80)));
  await p.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  await p.waitForTimeout(2200);
  await shot(p, `g08-${name}-wrapped`);
  const wrapped = await p.locator('[data-unwrap]').count();
  await p.keyboard.press('Enter');
  await p.waitForTimeout(2000);
  await shot(p, `g08-${name}-cover`);
  const unwrapped = !(await p.locator('[data-unwrap]').count());
  log(name, 'gift wrap shown:', wrapped > 0, 'opened:', unwrapped);
  for (let i = 0; i < 3; i++) {
    await p.keyboard.press('ArrowRight');
    await p.waitForTimeout(1400);
  }
  await shot(p, `g09-${name}-story`);
  const fonts = await p.evaluate(() => ({ vt: document.fonts.check('16px VT323', 'REC'), cn: document.fonts.check('900 16px "Noto Serif SC"', '南岛公路') }));
  log(name, 'title:', await p.title(), 'fonts:', JSON.stringify(fonts), errs.length ? errs : 'no errors');
  await p.close();
}

console.log(errors.length ? 'EDITOR ERRORS:\n' + errors.join('\n') : 'editor: no errors');
await browser.close();
