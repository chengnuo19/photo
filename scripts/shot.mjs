// Visual QA helper: drive the book with Playwright (system Chrome) and take screenshots.
//
//   node scripts/shot.mjs <out-dir> <WxH> "<steps>" [url]
//
// steps are separated by '|':
//   wait:<ms>  key:<Key>  click:<x>:<y>  drag:<x1>:<y1>:<x2>:<y2>  shot:<name>
//   eval:<js>  resize:<W>x<H>  midflip:<name>  (screenshot ~40% into a flip after ArrowRight)
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';

const [outDir, size = '1600x900', steps = 'wait:2500|shot:initial', url = 'http://localhost:5173/'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const mobile = w < 720;
const page = await browser.newPage({
  viewport: { width: w, height: h },
  deviceScaleFactor: mobile ? 2 : 1,
  hasTouch: mobile,
  isMobile: mobile,
});
const logs = [];
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

// BLOCK=<substring> aborts matching requests (to test failed images); REDUCED=1 emulates reduced motion
if (process.env.BLOCK) await page.route((u) => u.href.includes(process.env.BLOCK), (r) => r.abort());
if (process.env.REDUCED) await page.emulateMedia({ reducedMotion: 'reduce' });

await page.goto(url, { waitUntil: 'networkidle' });

for (const step of steps.split('|').map((s) => s.trim()).filter(Boolean)) {
  const [cmd, ...a] = step.split(':');
  if (cmd === 'wait') await page.waitForTimeout(Number(a[0]));
  else if (cmd === 'key') await page.keyboard.press(a[0]);
  else if (cmd === 'click') await page.mouse.click(Number(a[0]), Number(a[1]));
  else if (cmd === 'tap') await page.touchscreen.tap(Number(a[0]), Number(a[1]));
  else if (cmd === 'swipe') {
    // quick horizontal touch swipe via CDP
    const [x1, y, x2] = a.map(Number);
    const cdp = await page.context().newCDPSession(page);
    const pt = (x) => [{ x, y }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x1) });
    for (let i = 1; i <= 6; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x1 + ((x2 - x1) * i) / 6) });
      await page.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  else if (cmd === 'drag') {
    const [x1, y1, x2, y2] = a.map(Number);
    await page.mouse.move(x1, y1);
    await page.mouse.down();
    for (let i = 1; i <= 24; i++) await page.mouse.move(x1 + ((x2 - x1) * i) / 24, y1 + ((y2 - y1) * i) / 24);
    await page.mouse.up();
  } else if (cmd === 'resize') {
    const [rw, rh] = a[0].split('x').map(Number);
    await page.setViewportSize({ width: rw, height: rh });
  } else if (cmd === 'shot') {
    await page.screenshot({ path: path.join(outDir, `${a[0]}.png`) });
  } else if (cmd === 'midflip') {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(Number(a[1] ?? 380));
    await page.screenshot({ path: path.join(outDir, `${a[0]}.png`) });
  } else if (cmd === 'eval') {
    const r = await page.evaluate(a.join(':'));
    console.log('eval ->', JSON.stringify(r));
  }
}

console.log(logs.length ? logs.join('\n') : 'no console errors');
await browser.close();
