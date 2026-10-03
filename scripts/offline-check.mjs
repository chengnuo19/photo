// Offline after one visit: builds with BASE_PATH=/photo/, serves dist, opens the shelf and a
// sample book, waits for the service worker to store the app, then STOPS the server and
// checks the shelf, the book (with its photos) and the theme gallery still open.
//
//   node scripts/offline-check.mjs <out-dir> [book-id=sample-stranger]
import { chromium } from 'playwright-core';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [outDir = 'shots/offline', id = 'sample-stranger'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
fs.mkdirSync(outDir, { recursive: true });
const PORT = 4179;
const base = `http://localhost:${PORT}/photo/`;
const env = { ...process.env, BASE_PATH: '/photo/', MSYS_NO_PATHCONV: '1' };

if (!process.argv.includes('--no-build')) execSync('npx vite build --logLevel warn', { stdio: 'inherit', env, shell: true });

const serve = () => {
  const p = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { env, shell: true, stdio: 'ignore', windowsHide: true });
  return p;
};
const kill = (p) => {
  try {
    if (process.platform === 'win32') execSync(`taskkill /pid ${p.pid} /T /F`, { stdio: 'ignore' });
    else p.kill();
  } catch {
    /* gone */
  }
};
const up = async (want) => {
  for (let i = 0; i < 60; i++) {
    const ok = await fetch(base).then((r) => r.ok, () => false);
    if (ok === want) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server ${want ? 'did not start' : 'did not stop'}`);
};

let server = serve();
await up(true);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 820 } });
const page = await ctx.newPage();
const fails = [];
page.on('pageerror', (e) => fails.push(`pageerror: ${e.message}`));
let offline = false;
const missed = new Set();
page.on('requestfailed', (r) => offline && missed.add(new URL(r.url()).pathname));
page.on('response', (r) => offline && r.status() >= 400 && missed.add(`${new URL(r.url()).pathname} (${r.status()})`));
page.on('console', (m) => offline && m.type() === 'error' && !m.text().includes('ERR_FAILED') && console.log('  console:', m.text().slice(0, 600)));

const ready = () => page.locator('main[data-ready]').waitFor({ timeout: 30000 });
const brokenImages = () =>
  page.evaluate(() => [...document.querySelectorAll('[aria-roledescription="book"] img')].filter((im) => im.complete && !im.naturalWidth).length);

// ---- online: first visit
await page.goto(base, { waitUntil: 'load' });
await ready();
await page.goto(`${base}#/book/${id}`);
await ready();
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(2500);
for (let i = 0; i < 3; i++) {
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1400);
}
const cached = await page.evaluate(async () => {
  await navigator.serviceWorker.ready;
  const want = JSON.parse((await (await fetch('sw.js')).text()).match(/MB_PRECACHE = (\[.*?\]);/)[1]);
  const missing = async () => {
    const keys = new Set((await (await caches.open('mb-files')).keys()).map((r) => new URL(r.url).pathname));
    const page = await (await caches.open('mb-pages')).match(new URL('index.html', location.href).href);
    return want.filter((p) => (p === 'index.html' ? !page : !keys.has(new URL(p, location.href).pathname)));
  };
  for (let i = 0; i < 120; i++) {
    const m = await missing();
    if (!m.length && navigator.serviceWorker.controller) return { precached: want.length };
    await new Promise((r) => setTimeout(r, 500));
  }
  return { precached: want.length, missing: await missing(), timeout: true };
});
console.log('cache after first visit:', cached);
if (cached.timeout) fails.push('precache did not finish');

// ---- offline: stop the server
kill(server);
await up(false);
console.log('server stopped');
offline = true;

const t0 = Date.now();
await page.goto(base, { waitUntil: 'load' });
await ready();
console.log(`shelf offline: ${Date.now() - t0} ms`);
await page.screenshot({ path: path.join(outDir, 'offline-shelf.png') });

await page.goto(`${base}#/book/${id}`);
await ready();
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(2500);
for (let i = 0; i < 2; i++) {
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1400);
}
if (!(await page.locator('[aria-roledescription="book"]').count())) fails.push('the sample book did not open offline');
const broken = await brokenImages();
console.log('broken photos offline in the spreads already seen:', broken);
if (broken) fails.push(`${broken} photos did not load offline`);
await page.screenshot({ path: path.join(outDir, 'offline-book.png') });

await page.goto(`${base}#/new`);
await ready().catch(() => fails.push('theme gallery did not open offline'));
await page.screenshot({ path: path.join(outDir, 'offline-gallery.png') });

if (missed.size) console.log('  not available offline:', [...missed].join(' '));
offline = false;

// ---- a new deploy while offline copies exist: the next online visit gets the new page
server = serve();
await up(true);
await page.goto(base, { waitUntil: 'load' });
await ready();
console.log('back online: ok');

await browser.close();
kill(server);
if (fails.length) {
  console.log('FAIL\n  ' + fails.join('\n  '));
  process.exit(1);
}
console.log('PASS');
