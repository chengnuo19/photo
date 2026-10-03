// Music, chapters and voice notes, end to end (dev server — it listens to the music bus):
//   1. new book from photos; music menu: theme music by default, then a song (a 453 Hz tone, between semitones so no theme note matches it)
//      starting at 0:05
//   2. a voice note recorded on page 2 (Chrome's fake microphone), a chapter on page 3 that
//      switches to the theme's music
//   3. reading: the song plays after unwrapping, ducks under the voice note, gives way to the
//      theme music at the chapter, fades out at the end
//   4. the exported zip opened from disk (file://): the song still plays (unrouted element)
//
//   node scripts/music-check.mjs <out-dir> [photo-dir=public/assets/samples/storybook] [--no-build]
// (builds the export template first: the dev server does not rebuild it on its own)
import { chromium } from 'playwright-core';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import JSZip from 'jszip';

const [outDir, photoDir = 'public/assets/samples/storybook'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!outDir) {
  console.log('usage: node scripts/music-check.mjs <out-dir> [photo-dir]');
  process.exit(2);
}
const base = process.env.BASE ?? 'http://localhost:5173/';
fs.mkdirSync(outDir, { recursive: true });
const shot = (p, name) => p.screenshot({ path: path.join(outDir, `${name}.png`) });
const log = (...a) => console.log('•', ...a);
const fails = [];
const expect = (ok, what) => (ok ? log('ok  ', what) : (fails.push(what), log('FAIL', what)));

if (!process.argv.includes('--no-build')) execFileSync('npm run build:viewer', { stdio: 'inherit', shell: true });

const song = path.join(outDir, 'tone-440.mp3');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=453:duration=40', '-ac', '2', '-b:a', '128k', song]);
const photos = fs.readdirSync(photoDir).map((f) => path.join(photoDir, f));

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true, permissions: ['microphone'] });
// every <audio> that is ever played, to inspect from the tests
await ctx.addInitScript(() => {
  window.__media = [];
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (!window.__media.includes(this)) window.__media.push(this);
    return play.call(this);
  };
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

/* 1. create, music menu */
await page.goto(`${base}#/new`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 30000 });
await page.getByRole('button', { name: /^选择「/ }).first().click();
await page.waitForTimeout(500);
await page.locator('[role=dialog] input[type=file]').setInputFiles(photos);
await page.waitForURL(/#\/book\/.+\/edit/, { timeout: 60000 });
const id = page.url().match(/#\/book\/([^/]+)\/edit/)[1];
await page.waitForTimeout(2000);

await page.getByRole('button', { name: '音乐', exact: true }).click();
expect((await page.getByRole('radio', { name: '主题音乐' }).getAttribute('aria-checked')) === 'true', 'theme music is the default');
await shot(page, 'm01-music-menu');
const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('radio', { name: '上传的歌' }).click()]);
await chooser.setFiles(song);
await page.getByText('当前：tone-440').waitFor({ timeout: 10000 });
const range = page.locator('input[type=range]');
await range.waitFor({ timeout: 10000 });
await range.evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, '5');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(300);
await shot(page, 'm02-song');
await page.getByRole('button', { name: '音乐', exact: true }).click();

/* 2. voice note on page 2, chapter on page 3 */
await page.getByRole('button', { name: /^第 2 页/ }).click();
await page.waitForTimeout(900);
await page.getByRole('button', { name: /^语音留言/ }).click();
await page.getByRole('button', { name: '开始录音' }).click();
await page.waitForTimeout(3200);
await shot(page, 'm03-recording');
await page.getByRole('button', { name: '录好了' }).click();
await page.getByText(/这一页有一段/).waitFor({ timeout: 15000 });
await shot(page, 'm04-voice');
await page.getByRole('button', { name: /^语音留言/ }).click();

await page.getByRole('button', { name: /^第 3 页/ }).click();
await page.waitForTimeout(900);
await page.getByRole('button', { name: '章节', exact: true }).click();
await page.getByRole('button', { name: '从这一页开始新的一章' }).click();
await page.getByPlaceholder(/^第 \d+ 章$/).fill('下半本');
await page.locator('[class*=wide]').getByRole('radio', { name: '主题音乐' }).click();
await page.waitForTimeout(400);
await shot(page, 'm05-chapter');
await page.getByRole('button', { name: '章节', exact: true }).click();
await page.waitForTimeout(1500);
await shot(page, 'm06-strip');

const doc = await page.evaluate(async (id) => {
  const db = await new Promise((r, j) => {
    const q = indexedDB.open('memory-book');
    q.onsuccess = () => r(q.result);
    q.onerror = () => j(q.error);
  });
  const get = (store, key) =>
    new Promise((r) => {
      const q = db.transaction(store).objectStore(store).get(key);
      q.onsuccess = () => r(q.result);
    });
  const book = await get('books', id);
  const voice = book.doc.spreads[1].voice;
  const asset = voice && (await get('assets', voice.src.slice(6)));
  return { doc: book.doc, voiceType: asset?.blob.type, voiceSize: asset?.blob.size };
}, id);
expect(doc.doc.version === 2, 'saved as version 2');
expect(doc.doc.music?.kind === 'file' && doc.doc.music.start === 5, `song stored with start 0:05 (${JSON.stringify(doc.doc.music)?.slice(0, 80)})`);
expect(doc.doc.spreads[1].voice?.seconds >= 2 && doc.doc.spreads[1].voice?.seconds <= 5, `voice note ~3 s (${doc.doc.spreads[1].voice?.seconds})`);
expect(doc.voiceType === 'audio/mp4', `voice stored as AAC (${doc.voiceType}, ${doc.voiceSize} B)`);
expect(doc.doc.spreads[2].chapter?.title === '下半本' && doc.doc.spreads[2].chapter.music?.kind === 'theme', 'chapter with theme music');

/* 3. reading */
await page.goto(`${base}#/book/${id}`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 30000 });
await page.waitForTimeout(800);
await page.evaluate(async () => {
  // the very module the app uses (after edits Vite serves it with a ?t= stamp)
  const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/src\/sound\/engine\.ts/.test(n)) ?? '/src/sound/engine.ts';
  const { audio } = await import(url);
  window.__probe = () => {
    const a = audio();
    if (!window.__an) {
      window.__an = a.ctx.createAnalyser();
      window.__an.fftSize = 8192;
      window.__an.smoothingTimeConstant = 0;
      a.music.connect(window.__an);
    }
    const an = window.__an;
    const t = new Float32Array(an.fftSize);
    an.getFloatTimeDomainData(t);
    let s = 0;
    for (const x of t) s += x * x;
    const f = new Float32Array(an.frequencyBinCount);
    an.getFloatFrequencyData(f);
    const hz = a.ctx.sampleRate / an.fftSize;
    let peak = 0;
    for (let i = 1; i < f.length; i++) if (f[i] > f[peak]) peak = i;
    const b = Math.round(453 / hz);
    return { db: 20 * Math.log10(Math.sqrt(s / t.length) + 1e-9), peakHz: Math.round(peak * hz), a440: Math.max(f[b - 1], f[b], f[b + 1]) };
  };
});
const probe = () => page.evaluate(() => window.__probe());
await probe(); // the analyser starts listening now
const gift = page.getByRole('button', { name: /^拆开/ });
if (await gift.count()) await gift.click();
else await page.keyboard.press('ArrowRight');
await page.waitForTimeout(4000);
let p = await probe();
log('after opening', p);
expect(p.db > -40 && Math.abs(p.peakHz - 453) < 8, 'the song plays after unwrapping');
const songLevel = p.db;
const song440 = p.a440;

let voiceSeen = false;
let chapterSeen = false;
for (let i = 0; i < 16; i++) {
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1800);
  p = await probe();
  const speaking = await page.getByRole('button', { name: '停止留言' }).count();
  const view = await page.evaluate(() => document.querySelector('[aria-current="true"]')?.getAttribute('aria-label') ?? '');
  log(`turn ${i + 1}`, p, speaking ? 'voice playing' : '');
  if (speaking && !voiceSeen) {
    voiceSeen = true;
    await page.waitForTimeout(700); // the duck takes 0.4 s
    const under = await probe();
    expect(under.db < songLevel - 10, `music ducks under the voice note (${under.db.toFixed(1)} vs ${songLevel.toFixed(1)} dB)`);
    await shot(page, 'm07-voice-playing');
    await page.getByRole('button', { name: '听一段留言' }).waitFor({ timeout: 10000 });
    await page.waitForTimeout(1600); // and 1.2 s to come back
    const back = await probe();
    expect(back.db > songLevel - 4, `music comes back after the voice note (${back.db.toFixed(1)} dB)`);
    continue;
  }
  if (voiceSeen && !chapterSeen) {
    chapterSeen = true;
    await page.waitForTimeout(2500);
    const c = await probe();
    log('chapter', c, view);
    expect(c.a440 < song440 - 25 && c.db > -45, `the chapter plays the theme music instead of the song (453 Hz ${c.a440.toFixed(0)} vs ${song440.toFixed(0)} dB, ${c.db.toFixed(1)} dB)`);
  }
  if (await page.locator('[data-phase="ended"]').count()) break;
}
expect(voiceSeen, 'a voice note played on page 2');
await page.waitForTimeout(4500);
p = await probe();
expect(p.db < -55, `music faded out at the end (${p.db.toFixed(1)} dB)`);
await shot(page, 'm08-end');

/* 4. exported zip from disk */
await page.goto(`${base}#/book/${id}/edit`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 30000 });
await page.waitForTimeout(1500);
await page.getByRole('button', { name: '导出' }).click();
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.getByRole('button', { name: '网站文件夹（.zip）' }).click()]);
const zipFile = path.join(outDir, 'book.zip');
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
const files = Object.keys(zip.files);
expect(files.some((f) => /^assets\/.+\.mp3$/.test(f)) && files.some((f) => /^assets\/.+\.m4a$/.test(f)), 'zip has the song and the voice note');
const site = await ctx.newPage();
site.on('pageerror', (e) => errors.push('export: ' + e.message));
await site.goto(pathToFileURL(path.join(siteDir, 'index.html')).href, { waitUntil: 'load' });
await site.waitForTimeout(1500);
await site.getByRole('button', { name: /^拆开/ }).click();
await site.waitForTimeout(4000);
const media = await site.evaluate(() =>
  window.__media.filter((m) => !m.currentSrc.startsWith('data:')).map((m) => ({ src: m.currentSrc.split('/').slice(-2).join('/'), paused: m.paused, volume: m.volume, t: m.currentTime })),
);
log('export media', media);
const songEl = media.find((m) => /\.mp3$/.test(m.src));
expect(songEl && !songEl.paused && songEl.volume > 0.3 && songEl.t >= 5, 'exported book (file://) plays the song from 0:05 at volume');
await shot(site, 'm09-export');
await site.close();

/* 5. the drawn video carries the music sections and the voice note */
await page.goto(`${base}#/book/${id}/record/video`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 60000 });
const direct = page.getByRole('button', { name: /^直接生成/ });
if (await direct.count()) await direct.click();
await page.getByRole('radio', { name: /横屏/ }).click();
await page.getByRole('button', { name: '开始生成' }).click();
const done = page.getByRole('button', { name: '下载文件' });
await done.waitFor({ timeout: 300000 });
const [vid] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), done.click()]);
const film = path.join(outDir, 'film' + path.extname(vid.suggestedFilename()));
await vid.saveAs(film);
const probeFilm = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', film]).toString());
const fa = probeFilm.streams.find((x) => x.codec_type === 'audio');
const vd = spawnSync('ffmpeg', ['-v', 'info', '-i', film, '-af', 'volumedetect', '-vn', '-f', 'null', '-']).stderr.toString();
const meanDb = Number(/mean_volume: (-?[\d.]+)/.exec(vd)?.[1] ?? -99);
log('film', Number(probeFilm.format.duration).toFixed(1), 's, audio', fa?.codec_name, 'mean', meanDb, 'dB');
expect(!!fa && meanDb > -45, `the drawn video has sound (${meanDb} dB)`);

/* 6. a song link: the reader sees a card that opens the music app */
await page.goto(`${base}#/book/${id}/edit`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 30000 });
await page.waitForTimeout(1200);
await page.getByRole('button', { name: '音乐', exact: true }).click();
await page.getByRole('radio', { name: '音乐 App 里的歌' }).click();
await page.locator('textarea').fill('分享歌手的单曲《晴天》: https://163cn.tv/abc123 (来自@网易云音乐)');
await page.getByText('《晴天》 · 网易云音乐').waitFor({ timeout: 5000 });
await shot(page, 'm10-link');
await page.getByRole('button', { name: '音乐', exact: true }).click();
await page.waitForTimeout(1200);
await page.goto(`${base}#/book/${id}`, { waitUntil: 'load' });
await page.locator('main[data-ready]').waitFor({ timeout: 30000 });
await page.waitForTimeout(600);
if (await page.getByRole('button', { name: /^拆开/ }).count()) await page.getByRole('button', { name: /^拆开/ }).click();
else await page.keyboard.press('ArrowRight');
const card = page.getByRole('link', { name: '在网易云音乐里播放' });
await card.waitFor({ timeout: 8000 }).catch(() => undefined);
expect((await card.getAttribute('href').catch(() => null)) === 'https://163cn.tv/abc123', 'the reader gets a "play in NetEase Cloud Music" link');
await shot(page, 'm11-link-card');

await browser.close();
if (errors.length) fails.push(...errors.map((e) => 'error: ' + e.slice(0, 200)));
console.log(fails.length ? `FAIL\n  ${fails.join('\n  ')}` : 'PASS');
process.exit(fails.length ? 1 : 0);
