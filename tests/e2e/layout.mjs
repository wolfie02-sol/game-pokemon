import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { SHOTS, wait } from './lib.mjs';
const vps = [['phone', 390, 844, true], ['phoneL', 844, 390, true], ['small', 360, 640, true], ['tablet', 820, 1180, true], ['laptop', 1366, 768, false], ['wide', 1920, 1080, false]];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [name, w, h, touch] of vps) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://localhost:4173/');
  await page.waitForFunction(() => window.__wildkinDebug);
  await wait(500);
  await page.screenshot({ path: `${SHOTS}/L_${name}_title.png` });
  await page.evaluate(() => window.__wildkinDebug.start({ map: 'brindle', x: 10, y: 12, party: [['Emberkit', 20]] }));
  await wait(500);
  const m = await page.evaluate(() => { const c = document.querySelector('canvas').getBoundingClientRect(); return { canvas: [Math.round(c.x), Math.round(c.y), Math.round(c.width), Math.round(c.height)], scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight }; });
  console.log(name, JSON.stringify(m), errs);
  await page.screenshot({ path: `${SHOTS}/L_${name}_world.png` });
  await page.close();
}
await browser.close();
