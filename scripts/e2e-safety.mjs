// End-to-end check of the "don't lose my book" features:
// import progress (incl. an unreadable file) → storage note → backup (.mbook) → delete →
// restore → the restored book opens with its photos → resume reading → record pages load.
//
//   node scripts/e2e-safety.mjs <out-dir> <photo-dir>
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, photoDir] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:5173/';
fs.mkdirSync(outDir, { recursive: true });
const shot = (p, name) => p.screenshot({ path: path.join(outDir, `${name}.png`) });
const log = (...a) => console.log('•', ...a);
const fail = (msg) => {
  console.error('✗', msg);
  process.exitCode = 1;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

// an unreadable "photo" next to real ones
const bogus = path.join(outDir, 'broken.jpg');
fs.writeFileSync(bogus, 'not really a jpeg');
const photos = [...fs.readdirSync(photoDir).map((f) => path.join(photoDir, f)), bogus];

// 1. create a book from the gallery; watch the progress toast
await page.goto(base, { waitUntil: 'networkidle' });
await page.getByText('新建一本').click();
await page.waitForTimeout(1500);
await page.getByRole('button', { name: '选择「暖白插画绘本」' }).click();
await page.waitForTimeout(500);
const progress = [];
const poll = setInterval(async () => {
  const t = await page.locator('[role=status]').allInnerTexts().catch(() => []);
  t.forEach((x) => x.includes('正在整理照片') && progress.push(x));
}, 80);
await page.locator('[role=dialog] input[type=file]').setInputFiles(photos);
await page.waitForURL(/#\/book\/.+\/edit/, { timeout: 30000 });
clearInterval(poll);
log('progress seen', [...new Set(progress)].slice(-2).join(' | ') || '(too fast)');
await page.waitForTimeout(2000);
const note = await page.locator('[role=alert]').innerText().catch(() => '');
log('unreadable-file note:', note || '(none)');
if (!note.includes('broken.jpg')) fail('no note about the unreadable file');
await shot(page, 's01-editor');
const bookUrl = page.url();

// 2. storage note on the shelf
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const footer = await page.locator('footer').innerText();
log('shelf footer:', footer);
if (!/已用/.test(footer)) fail('no storage usage in footer');

// 3. backup
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '备份', exact: true }).first().click()]);
const backupPath = path.join(outDir, dl.suggestedFilename());
await dl.saveAs(backupPath);
log('backup', dl.suggestedFilename(), Math.round(fs.statSync(backupPath).size / 1024), 'KB');

// 4. delete, then restore
page.once('dialog', (d) => d.accept());
await page.getByRole('button', { name: '删除' }).first().click();
await page.waitForTimeout(1200);
const afterDelete = await page.locator('main li').count();
await page.locator('input[accept*=".mbook"]').setInputFiles(backupPath);
await page.waitForTimeout(2500);
const afterRestore = await page.locator('main li').count();
log('shelf items: after delete', afterDelete, '→ after restore', afterRestore);
if (afterRestore !== afterDelete + 1) fail('restore did not add the book back');
await shot(page, 's02-restored');

// 5. restored book opens with its photos
await page.goto(bookUrl.replace('/edit', ''), { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const broken = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => i.complete && !i.naturalWidth).length);
log('reader broken images', broken);
if (broken) fail('restored book has broken images');

// 6. resume: read a few spreads, reload, continue
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(1800);
for (let i = 0; i < 3; i++) {
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1400);
}
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3500);
const resume = page.getByRole('button', { name: /接着上次读/ });
log('resume offered', await resume.isVisible());
if (!(await resume.isVisible())) fail('no resume button after reload');
await resume.click();
await page.waitForTimeout(1500);
const phase = await page.locator('[data-phase]').getAttribute('data-phase');
log('after resume phase', phase);
if (phase !== 'reading') fail('resume did not open the book');
await shot(page, 's03-resumed');

// 7. record pages render (capture itself needs a person to pick the tab)
for (const mode of ['video', 'image']) {
  await page.goto(bookUrl.replace('/edit', `/record/${mode}`), { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const title = await page.locator('[role=dialog] h1').innerText();
  log(`record/${mode}:`, title, '| start button', await page.getByRole('button', { name: '开始' }).isVisible());
  await shot(page, `s04-record-${mode}`);
}

console.log(errors.length ? `errors:\n  ${errors.join('\n  ')}` : 'no errors');
if (errors.length) process.exitCode = 1;
await browser.close();
