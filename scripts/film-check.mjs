// The drawn video (no screen capture): make it in portrait and landscape, check the MP4
// (duration, size, audio) with ffprobe, and cut frames into a contact sheet to look at.
// Also makes the long picture the same way.
//
//   node scripts/film-check.mjs <out-dir> [book-id=sample-stranger] [--phone] [--only=portrait|landscape|image]
// --phone emulates a touch phone (the path phones take: no screen capture offered at all).
import { chromium, devices } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const [outDir = 'shots/film', id = 'sample-stranger'] = args.filter((a) => !a.startsWith('--'));
const phone = flags.includes('--phone');
const only = flags.find((f) => f.startsWith('--only='))?.slice(7);
const base = process.env.BASE ?? 'http://localhost:5173/';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext(
  phone ? { ...devices['iPhone 13'], defaultBrowserType: undefined, acceptDownloads: true } : { viewport: { width: 1440, height: 900 }, acceptDownloads: true },
);
const fails = [];

async function make(mode, format) {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => fails.push(`${mode}/${format}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && console.log('  console:', m.text().slice(0, 200)));
  await page.goto(`${base}#/book/${id}/record/${mode}`, { waitUntil: 'load' });
  await page.locator('main[data-ready]').waitFor({ timeout: 60000 });
  const direct = page.getByRole('button', { name: /^直接生成/ });
  if (await direct.count()) await direct.click();
  if (mode === 'video') await page.getByRole('radio', { name: format === 'portrait' ? /竖屏/ : /横屏/ }).click();
  const t0 = Date.now();
  await page.getByRole('button', { name: '开始生成' }).click();
  await page.screenshot({ path: path.join(outDir, `${mode}-${format}-running.png`) });
  const done = page.getByRole('button', { name: '下载文件' });
  await done.waitFor({ timeout: 300000 }).catch(async () => {
    fails.push(`${mode}/${format}: not finished — ${await page.locator('section[role=dialog]').innerText().catch(() => '?')}`);
  });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), done.click()]);
  const file = path.join(outDir, `${mode}-${format}${path.extname(dl.suggestedFilename())}`);
  await dl.saveAs(file);
  const note = await page.locator('section[role=dialog] p').first().innerText();
  console.log(`${mode}/${format}: ${secs} s — ${note.replace(/\s+/g, ' ')}`);
  await page.screenshot({ path: path.join(outDir, `${mode}-${format}-done.png`) });
  await page.close();
  return file;
}

function inspect(file) {
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]).toString());
  const v = probe.streams.find((s) => s.codec_type === 'video');
  const a = probe.streams.find((s) => s.codec_type === 'audio');
  console.log(`  ${path.basename(file)}: ${v.codec_name} ${v.width}x${v.height} ${Number(probe.format.duration).toFixed(1)} s, ${(probe.format.size / 1e6).toFixed(1)} MB, audio: ${a ? a.codec_name : 'none'}`);
  // one frame every 1.2 s → contact sheet
  const sheet = file.replace(/\.\w+$/, '-sheet.jpg');
  const vertical = v.height > v.width;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf', `fps=1/1.2,scale=${vertical ? 180 : 320}:-1,tile=${vertical ? '8x3' : '6x6'}`, '-frames:v', '1', sheet]);
  // and a burst through the first page turn (cover opening) and a paper turn
  const burst = file.replace(/\.\w+$/, '-turns.jpg');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '1.1', '-t', '6', '-i', file, '-vf', `fps=8,scale=${vertical ? 180 : 320}:-1,tile=${vertical ? '8x6' : '6x8'}`, '-frames:v', '1', burst]);
  if (!a) fails.push(`${path.basename(file)} has no audio`);
}

const jobs = [
  ['video', 'portrait'],
  ['video', 'landscape'],
  ['image', 'landscape'],
].filter(([m, f]) => !only || only === (m === 'image' ? 'image' : f));
for (const [mode, format] of jobs) {
  const file = await make(mode, format).catch((e) => fails.push(`${mode}/${format}: ${e.message}`));
  if (typeof file === 'string' && mode === 'video') inspect(file);
}

await browser.close();
if (fails.length) {
  console.log('FAIL\n  ' + fails.join('\n  '));
  process.exit(1);
}
console.log('PASS');
