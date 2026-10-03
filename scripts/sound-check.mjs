// Theme music: render every theme's score offline (30 s each), check it is not silent, does
// not clip and that the themes sit at a similar loudness, and save WAVs to listen to.
// Needs the dev server (it imports the sources directly).
//
//   node scripts/sound-check.mjs <out-dir> [theme…]
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, ...only] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!outDir) {
  console.log('usage: node scripts/sound-check.mjs <out-dir> [theme…]');
  process.exit(2);
}
const base = process.env.BASE ?? 'http://localhost:5173/';
const SECONDS = Number(process.env.SECONDS ?? 30);
const THEMES = ['storybook', 'film', 'journal', 'museum', 'watercolor', 'starry', 'wednesday', 'stranger', 'pokemon', 'ghibli', 'wizard'].filter(
  (t) => !only.length || only.includes(t),
);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext()).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base, { waitUntil: 'load' });

const rows = [];
for (const theme of THEMES) {
  const res = await page.evaluate(
    async ({ theme, seconds }) => {
      const mod = await import(`/src/themes/${theme}/music.ts`);
      const { renderScore } = await import('/src/sound/score.ts');
      const score = mod[`${theme}Music`];
      const rate = 44100;
      const oc = new OfflineAudioContext(2, rate * seconds, rate);
      const g = renderScore(oc, score, oc.destination, 0, seconds);
      g.gain.value = 1;
      const buf = await oc.startRendering();
      const L = buf.getChannelData(0);
      const R = buf.getChannelData(1);
      let sum = 0;
      let peak = 0;
      const win = rate; // loudest second, quietest second
      const secs = [];
      for (let i = 0; i < L.length; i++) {
        const m = (L[i] + R[i]) / 2;
        sum += m * m;
        peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
        if (i % win === win - 1) secs.push(0);
      }
      for (let s = 0; s < Math.floor(L.length / win); s++) {
        let a = 0;
        for (let i = s * win; i < (s + 1) * win; i++) a += ((L[i] + R[i]) / 2) ** 2;
        secs[s] = Math.sqrt(a / win);
      }
      const db = (x) => (x > 0 ? 20 * Math.log10(x) : -200);
      // 16-bit WAV
      const n = L.length;
      const out = new DataView(new ArrayBuffer(44 + n * 4));
      const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
      w(0, 'RIFF');
      out.setUint32(4, 36 + n * 4, true);
      w(8, 'WAVE');
      w(12, 'fmt ');
      out.setUint32(16, 16, true);
      out.setUint16(20, 1, true);
      out.setUint16(22, 2, true);
      out.setUint32(24, rate, true);
      out.setUint32(28, rate * 4, true);
      out.setUint16(32, 4, true);
      out.setUint16(34, 16, true);
      w(36, 'data');
      out.setUint32(40, n * 4, true);
      for (let i = 0; i < n; i++) {
        out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true);
        out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true);
      }
      let bin = '';
      const bytes = new Uint8Array(out.buffer);
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return {
        rms: db(Math.sqrt(sum / L.length)),
        peak: db(peak),
        quietest: db(Math.min(...secs.slice(1))),
        loudest: db(Math.max(...secs)),
        wav: btoa(bin),
      };
    },
    { theme, seconds: SECONDS },
  );
  fs.writeFileSync(path.join(outDir, `${theme}.wav`), Buffer.from(res.wav, 'base64'));
  rows.push({ theme, rms: res.rms, peak: res.peak, quietest: res.quietest, loudest: res.loudest });
  console.log(`${theme.padEnd(11)} rms ${res.rms.toFixed(1)} dB  peak ${res.peak.toFixed(1)} dB  seconds ${res.quietest.toFixed(1)}…${res.loudest.toFixed(1)} dB`);
}
await browser.close();

const rms = rows.map((r) => r.rms);
const spread = Math.max(...rms) - Math.min(...rms);
const problems = [];
for (const r of rows) {
  if (r.rms < -45) problems.push(`${r.theme}: too quiet (${r.rms.toFixed(1)} dB)`);
  if (r.peak > -1) problems.push(`${r.theme}: clips (peak ${r.peak.toFixed(1)} dB)`);
  if (r.quietest < -60) problems.push(`${r.theme}: a silent second (${r.quietest.toFixed(1)} dB)`);
}
if (spread > 9) problems.push(`loudness differs by ${spread.toFixed(1)} dB between themes`);
if (errors.length) problems.push(...errors);
console.log(problems.length ? `FAIL\n  ${problems.join('\n  ')}` : `PASS (loudness spread ${spread.toFixed(1)} dB)`);
process.exit(problems.length ? 1 : 0);
