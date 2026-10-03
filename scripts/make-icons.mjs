// Draw the home-screen icons (public/icons/*.png) from one SVG: a closed picture book with
// the red star of the favicon, on the room's paper colour.
//
//   node scripts/make-icons.mjs
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const book = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#f3ecdf"/>
  <g transform="translate(256 256) scale(${(1 - pad * 2).toFixed(3)}) translate(-256 -256)">
    <ellipse cx="262" cy="440" rx="150" ry="18" fill="#6b5236" opacity=".16"/>
    <rect x="128" y="76" width="262" height="352" rx="10" fill="#e8dcc6"/>
    <rect x="118" y="68" width="262" height="352" rx="10" fill="#b5553f"/>
    <rect x="118" y="68" width="30" height="352" rx="8" fill="#9a4533"/>
    <rect x="168" y="104" width="182" height="220" rx="6" fill="#fbf6ec"/>
    <path d="M259 150l18.6 39.6 43.4 5-32.2 29.4 9 42.8L259 244.6l-38.8 22.2 9-42.8L197 194.6l43.4-5z" fill="#e8453c"/>
    <rect x="186" y="346" width="146" height="10" rx="5" fill="#fbf6ec" opacity=".85"/>
    <rect x="212" y="370" width="94" height="8" rx="4" fill="#fbf6ec" opacity=".6"/>
  </g>
</svg>`;

const out = fileURLToPath(new URL('../public/icons/', import.meta.url));
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
for (const [name, size, pad] of [
  ['icon-192.png', 192, 0.02],
  ['icon-512.png', 512, 0.02],
  ['icon-maskable-512.png', 512, 0.14], // Android crops maskable icons to a circle / squircle
  ['apple-touch-icon.png', 180, 0.04],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${book(pad)}`);
  await page.screenshot({ path: out + name });
  console.log('wrote', name);
}
await browser.close();
