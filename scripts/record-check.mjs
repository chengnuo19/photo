// Run the long-image and flip-video recorders unattended (Chrome auto-accepts "share this tab").
//
//   node scripts/record-check.mjs <out-dir> [book-id=sample-nz] [image|video|both]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, id = 'sample-nz', which = 'both'] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:5173/';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome',
  headless: false,
  args: ['--auto-accept-this-tab-capture', '--autoplay-policy=no-user-gesture-required', '--window-size=1600,1000'],
});
const ctx = await browser.newContext({ viewport: null, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

for (const mode of which === 'both' ? ['image', 'video'] : [which]) {
  await page.goto(`${base}#/book/${id}/record/${mode}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const t0 = Date.now();
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 240000 }),
    page.getByRole('button', { name: '开始' }).click(),
  ]);
  const file = path.join(outDir, dl.suggestedFilename());
  await dl.saveAs(file);
  await page.waitForTimeout(800);
  const msg = await page.locator('[role=dialog] p').first().innerText().catch(() => '');
  console.log('•', mode, dl.suggestedFilename(), Math.round(fs.statSync(file).size / 1024), 'KB', `${((Date.now() - t0) / 1000).toFixed(0)}s`, '|', msg);
}

console.log(errors.length ? `errors:\n  ${errors.join('\n  ')}` : 'no errors');
await browser.close();
