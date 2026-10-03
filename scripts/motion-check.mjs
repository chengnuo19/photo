// Moving photos, end to end (dev server):
//   1. a new book from photos plus a 12 s 1280×720 clip with sound (and a broken "clip")
//   2. the clip is stored small: ≤ 10 s, no sound, long edge 720, H.264 — with a still
//   3. it loops on its page in the reader; the exported zip carries it and plays it from disk
//   4. backups carry it; the long picture (stills only) still works
//
//   node scripts/motion-check.mjs <out-dir> [photo-dir=public/assets/samples/storybook] [--no-build]
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import JSZip from 'jszip';

const [outDir, photoDir = 'public/assets/samples/storybook'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!outDir) {
  console.log('usage: node scripts/motion-check.mjs <out-dir> [photo-dir]');
  process.exit(2);
}
const base = process.env.BASE ?? 'http://localhost:5173/';
fs.mkdirSync(outDir, { recursive: true });
const shot = (p, name) => p.screenshot({ path: path.join(outDir, `${name}.png`) });
const log = (...a) => console.log('•', ...a);
const fails = [];
const expect = (ok, what) => (ok ? log('ok  ', what) : (fails.push(what), log('FAIL', what)));
if (!process.argv.includes('--no-build')) execFileSync('npm run build:viewer', { stdio: 'inherit', shell: true });

const clip = path.join(outDir, 'sea.mp4');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30:duration=12', '-f', 'lavfi', '-i', 'sine=frequency=300:duration=12', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', clip]);
const broken = path.join(outDir, 'broken.mp4');
fs.writeFileSync(broken, Buffer.from('this is not a video at all'.repeat(40)));
const probe = (f) => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', f]).toString());

const photos = fs.readdirSync(photoDir).slice(0, 2).map((f) => path.join(photoDir, f));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

/* 1. import */
await page.goto(`${base}#/new`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 30000 });
await page.getByRole('button', { name: /^选择「/ }).first().click();
await page.waitForTimeout(500);
const t0 = Date.now();
await page.locator('[role=dialog] input[type=file]').setInputFiles([...photos, clip, broken]);
await page.waitForURL(/#\/book\/.+\/edit/, { timeout: 120000 });
log(`imported in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const id = page.url().match(/#\/book\/([^/]+)\/edit/)[1];
await page.waitForTimeout(2500);
const note = await page.locator('[role=status], [role=alert]').allInnerTexts().catch(() => []);
log('note', note.join(' | ').slice(0, 200));
expect(note.some((t) => /broken\.mp4/.test(t)), 'the broken clip is reported by name');

/* 2. stored small */
const stored = await page.evaluate(async (id) => {
  const db = await new Promise((r) => {
    const q = indexedDB.open('memory-book');
    q.onsuccess = () => r(q.result);
  });
  const get = (store, key) =>
    new Promise((r) => {
      const q = db.transaction(store).objectStore(store).get(key);
      q.onsuccess = () => r(q.result);
    });
  const book = await get('books', id);
  let img = null;
  let spreadIndex = -1;
  book.doc.spreads.forEach((s, i) => s.images.forEach((im) => im.motion && ((img = im), (spreadIndex = i))));
  if (!img) return { found: false };
  const v = await get('assets', img.motion.src.slice(6));
  const still = await get('assets', img.src.slice(6));
  const buf = new Uint8Array(await v.blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { found: true, spreadIndex, seconds: img.motion.seconds, kind: v.kind, type: v.blob.type, size: v.blob.size, still: still?.blob.type, b64: btoa(bin) };
}, id);
expect(stored.found, 'a spread has a moving photo');
if (stored.found) {
  const out = path.join(outDir, 'stored.mp4');
  fs.writeFileSync(out, Buffer.from(stored.b64, 'base64'));
  const p = probe(out);
  const v = p.streams.find((s) => s.codec_type === 'video');
  log('stored clip', stored.type, (stored.size / 1024).toFixed(0) + ' KB', v.codec_name, `${v.width}x${v.height}`, Number(p.format.duration).toFixed(2) + ' s', 'still', stored.still);
  expect(stored.kind === 'video' && stored.type === 'video/mp4' && v.codec_name === 'h264', 'stored as H.264 MP4');
  expect(Math.max(v.width, v.height) <= 720, 'long edge at most 720');
  expect(Number(p.format.duration) <= 10.2 && stored.seconds <= 10, `trimmed to 10 s (${Number(p.format.duration).toFixed(1)})`);
  expect(!p.streams.some((s) => s.codec_type === 'audio'), 'no sound');
  expect(/image\/(webp|jpeg)/.test(stored.still), 'with a still picture');
}

/* 3. plays on its page */
const goToClip = async (p) => {
  for (let i = 0; i < 12; i++) {
    const t = await p.evaluate(() => {
      const v = [...document.querySelectorAll('video[data-clip]')].find((x) => {
        const r = x.getBoundingClientRect();
        return r.width > 50 && !x.paused;
      });
      return v ? v.currentTime : -1;
    });
    if (t >= 0) return true;
    await p.keyboard.press('ArrowRight');
    await p.waitForTimeout(1600);
  }
  return false;
};
await page.goto(`${base}#/book/${id}`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 30000 });
await page.waitForTimeout(700);
if (await page.getByRole('button', { name: /^拆开/ }).count()) {
  await page.getByRole('button', { name: /^拆开/ }).click();
  await page.waitForTimeout(1800);
}
expect(await goToClip(page), 'the clip loops on its page in the reader');
const t1 = await page.evaluate(() => [...document.querySelectorAll('video[data-clip]')].find((x) => !x.paused)?.currentTime ?? -1);
await page.waitForTimeout(1200);
const t2 = await page.evaluate(() => [...document.querySelectorAll('video[data-clip]')].find((x) => !x.paused)?.currentTime ?? -1);
expect(t2 > t1, `and it is moving (${t1.toFixed(2)} → ${t2.toFixed(2)})`);
await shot(page, 'v01-reader');

/* 4a. exported zip from disk */
await page.goto(`${base}#/book/${id}/edit`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 30000 });
await page.waitForTimeout(1200);
await page.getByRole('button', { name: '导出' }).click();
expect(await page.getByText(/书里有会动的照片/).count(), 'the export menu warns that a single file would be large');
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.getByRole('button', { name: '网站文件夹（.zip）' }).click()]);
const zipFile = path.join(outDir, 'book.zip');
await dl.saveAs(zipFile);
const zip = await JSZip.loadAsync(fs.readFileSync(zipFile));
expect(Object.keys(zip.files).some((f) => /^assets\/.+\.mp4$/.test(f)), 'the zip carries the clip');
const siteDir = path.join(outDir, 'site');
fs.rmSync(siteDir, { recursive: true, force: true });
for (const [name, entry] of Object.entries(zip.files)) {
  if (entry.dir) continue;
  const dest = path.join(siteDir, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, await entry.async('nodebuffer'));
}
const site = await ctx.newPage();
site.on('pageerror', (e) => errors.push('export: ' + e.message));
await site.goto(pathToFileURL(path.join(siteDir, 'index.html')).href, { waitUntil: 'load' });
await site.waitForTimeout(1200);
await site.getByRole('button', { name: /^拆开/ }).click();
await site.waitForTimeout(1800);
expect(await goToClip(site), 'the exported book (file://) plays the clip');
await shot(site, 'v02-export');
await site.close();

/* 4b. backup carries it; the long picture works with stills */
const backup = await page.evaluate(async (id) => {
  const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/src\/storage\/backup\.ts/.test(n)) ?? '/src/storage/backup.ts';
  const dbUrl = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/src\/storage\/db\.ts/.test(n)) ?? '/src/storage/db.ts';
  const { backupBooks } = await import(url);
  const { getBook } = await import(dbUrl);
  const { blob } = await backupBooks([(await getBook(id)).doc]);
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}, id);
const mbook = await JSZip.loadAsync(Buffer.from(backup, 'base64'));
expect(Object.keys(mbook.files).some((f) => /\.mp4$/.test(f)), 'the backup (.mbook) carries the clip as .mp4');

await page.goto(`${base}#/book/${id}/record/image`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 60000 });
const direct = page.getByRole('button', { name: /^直接生成/ });
if (await direct.count()) await direct.click();
await page.getByRole('button', { name: '开始生成' }).click();
const done = page.getByRole('button', { name: '下载文件' });
const ok = await done.waitFor({ timeout: 180000 }).then(() => true, () => false);
expect(ok, 'the long picture is made (stills stand in for clips)');
if (ok) {
  const [img] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), done.click()]);
  await img.saveAs(path.join(outDir, 'long.jpg'));
}

await browser.close();
if (errors.length) fails.push(...errors.map((e) => 'error: ' + e.slice(0, 200)));
console.log(fails.length ? `FAIL\n  ${fails.join('\n  ')}` : 'PASS');
process.exit(fails.length ? 1 : 0);
