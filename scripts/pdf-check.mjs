// Handwritten signature and PDF export, end to end (dev server):
//   1. a new book; sign the closing letter on the pad (mouse strokes); the signature shows on the page
//   2. "家用打印": an A4-landscape PDF, one sheet per open spread, covers alone
//   3. "交给印刷厂": a zip with 内页.pdf / 封面.pdf / 印刷说明.txt — single pages at the chosen size
//      with 3 mm bleed and a TrimBox
// Checks the files with pdfinfo / pdfimages (xpdf or poppler, e.g. from TeX Live) when they are
// on PATH, and cuts the page pictures into contact sheets to look at.
//
//   node scripts/pdf-check.mjs <out-dir> [photo-dir=public/assets/samples/storybook]
import { chromium } from 'playwright-core';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const [outDir, photoDir = 'public/assets/samples/storybook'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!outDir) {
  console.log('usage: node scripts/pdf-check.mjs <out-dir> [photo-dir]');
  process.exit(2);
}
const base = process.env.BASE ?? 'http://localhost:5173/';
fs.mkdirSync(outDir, { recursive: true });
const shot = (p, name) => p.screenshot({ path: path.join(outDir, `${name}.png`) });
const log = (...a) => console.log('•', ...a);
const fails = [];
const expect = (ok, what) => (ok ? log('ok  ', what) : (fails.push(what), log('FAIL', what)));
const has = (tool) => spawnSync(tool, ['-v']).error === undefined;
const xpdf = has('pdfinfo') && has('pdfimages');
if (!xpdf) log('pdfinfo / pdfimages not found: checking the files by reading them');

/** Pages, page boxes (points) of a PDF. */
function info(file) {
  if (xpdf) {
    const out = execFileSync('pdfinfo', ['-box', '-f', '1', '-l', '1', file]).toString();
    const pages = Number(/Pages:\s+(\d+)/.exec(out)?.[1]);
    const box = (name) => /(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/.exec(new RegExp(`${name}:\\s+(.*)`).exec(out)?.[1] ?? '')?.slice(1).map(Number);
    return { pages, media: box('MediaBox'), trim: box('TrimBox'), text: out };
  }
  const s = fs.readFileSync(file).toString('latin1');
  const pages = (s.match(/\/Type \/Page\b/g) ?? []).length;
  const media = /\/MediaBox \[([^\]]+)\]/.exec(s)?.[1].split(' ').map(Number);
  const trim = /\/TrimBox \[([^\]]+)\]/.exec(s)?.[1].split(' ').map(Number);
  return { pages, media, trim, text: '' };
}

/** The page pictures, side by side in a sheet. */
function sheet(file, name, cols) {
  const dir = path.join(outDir, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  if (xpdf) execFileSync('pdfimages', ['-j', file, path.join(dir, 'p')]);
  else {
    const buf = fs.readFileSync(file);
    const s = buf.toString('latin1');
    let n = 0;
    for (const m of s.matchAll(/\/DCTDecode \/Length (\d+) >>\nstream\n/g)) {
      const at = m.index + m[0].length;
      fs.writeFileSync(path.join(dir, `p-${String(n++).padStart(3, '0')}.jpg`), buf.subarray(at, at + Number(m[1])));
    }
  }
  const jpgs = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort();
  // pages differ in size (covers alone, spreads open): same-size thumbnails first, then a sheet
  jpgs.forEach((f, i) =>
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(dir, f), '-vf', 'scale=300:220:force_original_aspect_ratio=decrease,pad=300:220:(ow-iw)/2:(oh-ih)/2:white', path.join(dir, `t-${String(i).padStart(3, '0')}.png`)]),
  );
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-start_number', '0', '-i', path.join(dir, 't-%03d.png'), '-vf', `tile=${cols}x${Math.ceil(jpgs.length / cols)}`, '-frames:v', '1', path.join(outDir, `${name}.jpg`)]);
  return jpgs.length;
}

const photos = fs.readdirSync(photoDir).slice(0, 4).map((f) => path.join(photoDir, f));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

/* 1. sign the letter */
await page.goto(`${base}#/new`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 30000 });
await page.getByRole('button', { name: /^选择「/ }).first().click();
await page.waitForTimeout(500);
await page.locator('[role=dialog] input[type=file]').setInputFiles(photos);
await page.waitForURL(/#\/book\/.+\/edit/, { timeout: 60000 });
const id = page.url().match(/#\/book\/([^/]+)\/edit/)[1];
await page.waitForTimeout(1800);
await page.getByRole('button', { name: '信', exact: true }).click();
await page.waitForTimeout(1200);
await page.getByRole('button', { name: '手写签名' }).click();
const pad = page.locator('[role=dialog][aria-label="手写签名"] svg');
const b = await pad.boundingBox();
const stroke = async (pts) => {
  await page.mouse.move(b.x + pts[0][0] * b.width, b.y + pts[0][1] * b.height);
  await page.mouse.down();
  for (const [x, y] of pts.slice(1)) await page.mouse.move(b.x + x * b.width, b.y + y * b.height, { steps: 6 });
  await page.mouse.up();
};
await stroke([[0.2, 0.6], [0.26, 0.3], [0.3, 0.62], [0.36, 0.34], [0.42, 0.6]]);
await stroke([[0.48, 0.5], [0.56, 0.32], [0.6, 0.6], [0.7, 0.4], [0.8, 0.55]]);
await stroke([[0.3, 0.72], [0.75, 0.68]]);
await shot(page, 'p01-pad');
await page.getByRole('button', { name: '放到信上' }).click();
await page.waitForTimeout(1500);
const sigOnPage = await page.locator('svg[aria-label="手写签名"] path').count();
expect(sigOnPage > 0, 'the signature shows on the letter page');
await shot(page, 'p02-signed');
const sig = await page.evaluate(async (id) => {
  const db = await new Promise((r) => {
    const q = indexedDB.open('memory-book');
    q.onsuccess = () => r(q.result);
  });
  return new Promise((r) => {
    const q = db.transaction('books').objectStore('books').get(id);
    q.onsuccess = () => r(q.result.doc.meta.letter?.signature);
  });
}, id);
expect(sig?.d?.startsWith('M') && sig.w > 50 && sig.h > 20, `signature stored as a path (${sig?.w}×${sig?.h}, ${sig?.d?.length} chars)`);

/* 2. home printing */
async function make(kind, height) {
  await page.goto(`${base}?k=${kind}#/book/${id}/record/pdf`, { waitUntil: 'load' });
  await page.locator('main[data-ready]').waitFor({ timeout: 60000 });
  await page.getByRole('radio', { name: kind === 'home' ? /家用打印/ : /交给印刷厂/ }).click();
  if (height) await page.getByRole('radio', { name: new RegExp(`× ${height} cm`) }).click();
  await shot(page, `p03-${kind}-intro`);
  const t0 = Date.now();
  await page.getByRole('button', { name: '开始生成' }).click();
  const done = page.getByRole('button', { name: '下载文件' });
  await done.waitFor({ timeout: 400000 });
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), done.click()]);
  const file = path.join(outDir, dl.suggestedFilename());
  await dl.saveAs(file);
  const note = await page.locator('section[role=dialog] p').first().innerText();
  log(`${kind}: ${((Date.now() - t0) / 1000).toFixed(1)} s — ${note.replace(/\s+/g, ' ')}`);
  return file;
}

const homeFile = await make('home');
expect(homeFile.endsWith('.pdf'), 'a .pdf file');
const home = info(homeFile);
log('home', home.pages, 'pages', home.media);
expect(home.pages >= 5, `several pages (${home.pages})`);
expect(home.media && Math.abs(home.media[2] - 841.89) < 1 && Math.abs(home.media[3] - 595.28) < 1, 'A4 landscape');
const homePics = sheet(homeFile, 'home-sheet', 4);
expect(homePics === home.pages, `one picture per page (${homePics})`);

/* 3. for the printer, 21 cm */
const printZip = await make('print', 21);
expect(printZip.endsWith('.zip'), 'print files come as a zip');
const zip = await JSZip.loadAsync(fs.readFileSync(printZip));
const names = Object.keys(zip.files);
expect(['内页.pdf', '封面.pdf', '印刷说明.txt'].every((n) => names.includes(n)), `zip holds 内页.pdf, 封面.pdf, 印刷说明.txt (${names.join(', ')})`);
for (const n of ['内页.pdf', '封面.pdf']) fs.writeFileSync(path.join(outDir, n), await zip.file(n).async('nodebuffer'));
const innerInfo = info(path.join(outDir, '内页.pdf'));
const coverInfo = info(path.join(outDir, '封面.pdf'));
log('inner', innerInfo.pages, 'pages, media', innerInfo.media, 'trim', innerInfo.trim);
log('cover', coverInfo.pages, 'pages');
const mm = 72 / 25.4;
const [, , mw, mh] = innerInfo.media ?? [0, 0, 0, 0];
const [tx, ty, tx2, ty2] = innerInfo.trim ?? [0, 0, 0, 0];
expect(Math.abs(mh - (210 + 6) * mm) < 1.5, `page height 21 cm + 2 × 3 mm bleed (${(mh / mm).toFixed(1)} mm)`);
expect(Math.abs(tx - 3 * mm) < 0.5 && Math.abs(ty - 3 * mm) < 0.5 && Math.abs(ty2 - ty - 210 * mm) < 1, 'TrimBox marks the finished page inside the bleed');
expect(coverInfo.pages === 2, 'covers: front and back');
const innerPics = sheet(path.join(outDir, '内页.pdf'), 'print-sheet', 6);
const dpi = await (async () => {
  const first = fs.readdirSync(path.join(outDir, 'print-sheet')).find((f) => f.endsWith('.jpg'));
  const p = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', path.join(outDir, 'print-sheet', first)]).toString());
  return p.streams[0].height / ((mh / 72) || 1);
})();
expect(dpi > 290 && dpi < 310, `about 300 dpi (${dpi.toFixed(0)})`);
log('inner pictures', innerPics, '(width', ((mw - tx * 2) / mm / 10).toFixed(1), 'cm)');

await browser.close();
if (errors.length) fails.push(...errors.map((e) => 'error: ' + e.slice(0, 200)));
console.log(fails.length ? `FAIL\n  ${fails.join('\n  ')}` : 'PASS');
process.exit(fails.length ? 1 : 0);
