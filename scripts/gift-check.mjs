// The gift ceremonies and the slideshow, end to end (dev server):
//   1. a new book with an unlock time tomorrow, a question (two accepted answers, a hint) and
//      "play by itself once opened"
//   2. the exported zip, opened from disk with the clock before the unlock time: countdown,
//      the gift will not open; then the clock moves past it: the question; wrong answers shake
//      and after three the hint shows; a right answer (written differently) opens it
//   3. once open, the book turns its own pages to the back cover; a tap pauses it
//   4. in the app the author can skip the wait (the exported book cannot)
//
//   node scripts/gift-check.mjs <out-dir> [photo-dir=public/assets/samples/storybook] [--no-build]
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import JSZip from 'jszip';

const [outDir, photoDir = 'public/assets/samples/storybook'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!outDir) {
  console.log('usage: node scripts/gift-check.mjs <out-dir> [photo-dir]');
  process.exit(2);
}
const base = process.env.BASE ?? 'http://localhost:5173/';
fs.mkdirSync(outDir, { recursive: true });
const shot = (p, name) => p.screenshot({ path: path.join(outDir, `${name}.png`) });
const log = (...a) => console.log('•', ...a);
const fails = [];
const expect = (ok, what) => (ok ? log('ok  ', what) : (fails.push(what), log('FAIL', what)));
if (!process.argv.includes('--no-build')) execFileSync('npm run build:viewer', { stdio: 'inherit', shell: true });

const photos = fs.readdirSync(photoDir).slice(0, 5).map((f) => path.join(photoDir, f));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

/* 1. the book and its gift settings */
await page.goto(`${base}#/new`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 30000 });
await page.getByRole('button', { name: /^选择「/ }).first().click();
await page.waitForTimeout(500);
await page.locator('[role=dialog] input[type=file]').setInputFiles(photos);
await page.waitForURL(/#\/book\/.+\/edit/, { timeout: 60000 });
const id = page.url().match(/#\/book\/([^/]+)\/edit/)[1];
await page.waitForTimeout(1500);

const unlock = new Date(Date.now() + 26 * 3600 * 1000);
unlock.setSeconds(0, 0);
const p2 = (n) => String(n).padStart(2, '0');
const local = `${unlock.getFullYear()}-${p2(unlock.getMonth() + 1)}-${p2(unlock.getDate())}T${p2(unlock.getHours())}:${p2(unlock.getMinutes())}`;
await page.getByRole('button', { name: '导出' }).click();
await page.locator('input[type=datetime-local]').fill(local);
await page.getByRole('button', { name: '加一个拆封问题' }).click();
await page.getByPlaceholder('我们第一次见面是在哪里？').fill('我们第一次见面是在哪里？');
await page.getByPlaceholder('人民公园，公园').fill('人民公园，Central Park');
await page.getByPlaceholder('那天下着雨').fill('那天下着雨');
await page.getByRole('button', { name: /^打开后自动放映/ }).click();
await page.waitForTimeout(400);
await shot(page, 'g01-settings');
const gift = await page.evaluate(async (id) => {
  const db = await new Promise((r) => {
    const q = indexedDB.open('memory-book');
    q.onsuccess = () => r(q.result);
  });
  await new Promise((r) => setTimeout(r, 900));
  return new Promise((r) => {
    const q = db.transaction('books').objectStore('books').get(id);
    q.onsuccess = () => r(q.result.doc.gift);
  });
}, id);
log('gift', JSON.stringify(gift));
expect(gift.unlockAt === unlock.getTime(), 'unlock time saved');
expect(gift.quiz?.answers.length === 2 && !JSON.stringify(gift).includes('人民公园'), 'two answers saved, hashed (not readable in the book)');
expect(gift.autoplay === true, 'autoplay saved');

/* 4 (first). the author can skip the wait in the app */
await page.goto(`${base}#/book/${id}`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 30000 });
await page.waitForTimeout(800);
expect(await page.getByText(/后可以拆开/).count(), 'the app shows the countdown');
expect(await page.getByRole('button', { name: /跳过等待/ }).count(), 'the author can skip the wait in the app');

/* 2. exported, from disk */
await page.goto(`${base}#/book/${id}/edit`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 30000 });
await page.waitForTimeout(1200);
await page.getByRole('button', { name: '导出' }).click();
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.getByRole('button', { name: '网站文件夹（.zip）' }).click()]);
const zipFile = path.join(outDir, 'gift.zip');
await dl.saveAs(zipFile);
const zip = await JSZip.loadAsync(fs.readFileSync(zipFile));
const siteDir = path.join(outDir, 'site');
fs.rmSync(siteDir, { recursive: true, force: true });
for (const [name, entry] of Object.entries(zip.files)) {
  if (entry.dir) continue;
  const dest = path.join(siteDir, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, await entry.async('nodebuffer'));
}
const html = fs.readFileSync(path.join(siteDir, 'index.html'), 'utf8');
expect(!html.includes('人民公园') && !html.includes('Central Park'), 'the answers are not in the exported page');

const site = await ctx.newPage();
site.on('pageerror', (e) => errors.push('export: ' + e.message));
await site.clock.install({ time: new Date(unlock.getTime() - 3 * 3600 * 1000 - 5 * 60 * 1000) });
await site.goto(pathToFileURL(path.join(siteDir, 'index.html')).href, { waitUntil: 'load' });
await site.waitForTimeout(1500);
const countdown = await site.locator('[data-unwrap] [role=status]').innerText().catch(() => '');
log('countdown', countdown.replace(/\s+/g, ' '));
expect(/3\s*小时/.test(countdown) || /03:0[45]/.test(countdown), 'countdown shows about 3 hours to go');
expect((await site.getByRole('button', { name: /跳过等待/ }).count()) === 0, 'no skip button in the exported book');
await shot(site, 'g02-countdown');
await site.getByRole('button', { name: /^拆开/ }).click({ force: true });
await site.keyboard.press('ArrowRight');
await site.waitForTimeout(800);
expect(await site.locator('[data-unwrap]:not([data-open])').count(), 'the gift does not open before its time');

await site.clock.fastForward(3 * 3600 * 1000 + 6 * 60 * 1000);
await site.waitForTimeout(1500);
const question = site.getByText('我们第一次见面是在哪里？');
expect(await question.count(), 'after the unlock time the question shows');
await shot(site, 'g03-question');
const answer = site.getByRole('textbox', { name: /答案/ });
for (const wrong of ['家里', '学校', '咖啡馆']) {
  await answer.fill(wrong);
  await answer.press('Enter');
  await site.waitForTimeout(500);
}
expect(await site.getByText('那天下着雨').count(), 'the hint shows after three wrong answers');
expect(await site.locator('[data-unwrap]:not([data-open])').count(), 'wrong answers do not open it');
await shot(site, 'g04-hint');
await answer.fill('  central  PARK! ');
await answer.press('Enter');
await site.waitForTimeout(800);
const gb = site.getByRole('button', { name: /^拆开/ });
if (await gb.count()) await gb.click();
await site.waitForTimeout(2500);
expect((await site.locator('[data-unwrap]').count()) === 0 || (await site.locator('[data-unwrap][data-open]').count()) > 0, 'the right answer (written differently) opens it');

/* 3. it plays itself; a tap pauses it, and it carries on to the back cover */
const phases = [];
let paused = false;
for (let i = 0; i < 60; i++) {
  await site.clock.runFor(1000);
  await site.waitForTimeout(250);
  phases.push(await site.locator('[data-phase]').getAttribute('data-phase'));
  if (!paused && phases.filter((p) => p === 'flipping').length >= 2 && phases.at(-1) === 'reading') {
    paused = true;
    await shot(site, 'g05-playing');
    await site.mouse.click(30, 450);
    await site.waitForTimeout(400);
    expect(await site.getByRole('button', { name: /继续放映/ }).count(), 'a tap pauses the slideshow');
    const before = phases.length;
    for (let j = 0; j < 8; j++) await site.clock.runFor(1000);
    await site.waitForTimeout(300);
    const still = await site.locator('[data-phase]').getAttribute('data-phase');
    expect(still === 'reading', `paused: no page turns (${still})`);
    await site.getByRole('button', { name: /继续放映/ }).click();
    phases.push('|resumed|');
    void before;
  }
  if (phases.at(-1) === 'ended') break;
}
log('phases', phases.join(' '));
expect(phases.includes('reading'), 'the slideshow opened the book');
expect(phases.at(-1) === 'ended', 'it played on to the closed back cover');
expect((await site.getByRole('button', { name: /自动放映/ }).count()) > 0, 'at the end it offers to play again');

await browser.close();
if (errors.length) fails.push(...errors.map((e) => 'error: ' + e.slice(0, 200)));
console.log(fails.length ? `FAIL\n  ${fails.join('\n  ')}` : 'PASS');
process.exit(fails.length ? 1 : 0);
