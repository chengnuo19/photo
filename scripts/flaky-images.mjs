// Images on a flaky connection: every sample photo's first N requests fail with a network
// error (like a VPN switching mid-download). Every photo must still end up on the page.
//
//   node scripts/flaky-images.mjs <out-dir> [book-id=sample-stranger] [failures=3]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, id = 'sample-stranger', n = '3'] = process.argv.slice(2);
const failures = Number(n);
const base = process.env.BASE ?? 'http://localhost:5173/';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const tries = new Map();
await page.route('**/assets/samples/**', (route) => {
  const key = new URL(route.request().url()).pathname;
  const k = (tries.get(key) ?? 0) + 1;
  tries.set(key, k);
  return k <= failures ? route.abort('internetdisconnected') : route.continue();
});

await page.goto(`${base}#/book/${id}`, { waitUntil: 'domcontentloaded' });
await page.locator('main[data-ready]').waitFor({ timeout: 60000 });
await page.waitForTimeout(1500);
// walk through the book so every spread's photos mount
await page.keyboard.press('ArrowRight'); // opens the gift if wrapped
await page.waitForTimeout(2500);
const count = await page.evaluate(() => document.querySelectorAll('[data-phase]').length);
for (let i = 0; i < 14 && count; i++) {
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1300);
  const notes = await page.locator('[data-state=error] span').allInnerTexts();
  if (notes.length) console.log(`  spread ${i}: ${[...new Set(notes)].join(' / ')}`);
  if ((await page.locator('[data-phase]').getAttribute('data-phase')) === 'ended') break;
}
// give the slowest retry schedule time, then check the whole book again from the start
await page.waitForTimeout(12000);
let broken = 0;
let checked = 0;
const views = await page.evaluate(() => document.querySelectorAll('[data-phase]').length);
for (let i = 0; i < 16 && views; i++) {
  const r = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('[data-state]')];
    return { errors: imgs.filter((e) => e.getAttribute('data-state') === 'error').length, total: imgs.length };
  });
  broken = Math.max(broken, r.errors);
  checked = Math.max(checked, r.total);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(900);
}
await page.screenshot({ path: path.join(outDir, `flaky-${id}.png`) });
const failedAtLeastOnce = [...tries.values()].filter((v) => v > failures).length;
console.log(`photos requested: ${tries.size}, recovered after ${failures} failures: ${failedAtLeastOnce}, image slots still broken: ${broken}`);
if (broken) process.exitCode = 1;
await browser.close();
