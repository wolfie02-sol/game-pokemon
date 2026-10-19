import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true });
await page.goto('http://localhost:4173/');
await page.waitForFunction(() => window.__wildkinDebug);
await new Promise(r=>setTimeout(r,500)); await page.evaluate(() => window.__wildkinDebug.start({ map: 'brindle', x: 10, y: 12, party: [['Emberkit', 20]] })); await new Promise(r=>setTimeout(r,500)); console.log(await page.evaluate(()=>[innerWidth, document.documentElement.scrollWidth]));
console.log(await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); const cs=getComputedStyle(el); if (r.right > 355 || cs.position==="fixed" || el.scrollWidth>el.clientWidth+1) out.push([el.tagName, el.className, Math.round(r.right), Math.round(r.bottom), Math.round(r.width), el.scrollWidth, el.clientWidth]); }
  return JSON.stringify(out.slice(0, 30));
}));
await page.screenshot({ path: new URL('./shots/full_small.png', import.meta.url).pathname, fullPage: false });
await browser.close();
