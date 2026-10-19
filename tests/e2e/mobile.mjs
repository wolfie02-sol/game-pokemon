// iPhone-sized layout and touch checks (Chromium with iPhone viewport, touch and DPR emulation).
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';

const BASE = process.env.BASE || 'http://localhost:4175/';
const SHOTS = new URL('./shots/', import.meta.url).pathname;
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
// visible Safari viewport sizes (with the address bar showing), not raw screen sizes
const sizes = [
  ['iPhoneSE-portrait', 375, 548],
  ['iPhoneSE-landscape', 667, 320],
  ['iPhone14-portrait', 390, 664],
  ['iPhone14-landscape', 844, 340],
  ['iPhone15ProMax-portrait', 430, 740],
  ['iPhone15ProMax-landscape', 932, 380],
  ['iPhone14-fullscreen', 390, 844],
];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const res = [];
const ok = (n, c, d = '') => res.push(`${c ? 'PASS' : 'FAIL'} ${n}${c ? '' : ' :: ' + d}`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

for (const [name, w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE);
  await page.waitForFunction(() => window.__wildkinDebug && window.__wildkin);
  await page.evaluate(() => window.__wildkinDebug.start({ map: 'brindle', x: 12, y: 7, party: [['Emberkit', 20]] }));
  await wait(500);
  const m = await page.evaluate(() => {
    const r = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom };
    };
    const rt = (label) => {
      const el = [...document.querySelectorAll('.pill')].find((p) => p.textContent.includes(label));
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom };
    };
    return {
      layout: document.querySelector('.page').className,
      canvas: r('canvas'),
      dpad: r('.dpad'),
      a: r('.round.a'),
      b: r('.round.b'),
      start: rt('START'),
      select: rt('SELECT'),
      scrollW: document.documentElement.scrollWidth,
      iw: innerWidth,
      ih: innerHeight,
      touchAction: getComputedStyle(document.querySelector('.dpad')).touchAction,
      callout: getComputedStyle(document.querySelector('.round.a')).webkitTouchCallout,
    };
  });
  const inside = (b) => b && b.x >= 0 && b.y >= 0 && b.r <= m.iw + 0.5 && b.b <= m.ih + 0.5;
  const overlap = (p, q) => p && q && p.x < q.r && q.x < p.r && p.y < q.b && q.y < p.b;
  ok(`${name}: touch layout chosen`, /touch/.test(m.layout), m.layout);
  ok(`${name}: no sideways scroll`, m.scrollW <= m.iw, `${m.scrollW} > ${m.iw}`);
  ok(`${name}: game screen fully visible`, inside(m.canvas), JSON.stringify(m.canvas));
  ok(`${name}: screen at least 2x (readable text)`, m.canvas && m.canvas.w >= 300, String(m.canvas && m.canvas.w));
  for (const k of ['dpad', 'a', 'b', 'start', 'select']) ok(`${name}: ${k} on screen`, inside(m[k]), JSON.stringify(m[k]));
  for (const k of ['a', 'b']) ok(`${name}: ${k} at least 44px`, m[k] && m[k].w >= 44 && m[k].h >= 44, JSON.stringify(m[k]));
  ok(`${name}: start/select tall enough to hit`, m.start && m.start.h >= 28, JSON.stringify(m.start));
  for (const k of ['dpad', 'a', 'b', 'start', 'select']) ok(`${name}: ${k} clear of the screen`, !overlap(m[k], m.canvas), JSON.stringify([m[k], m.canvas]));
  // the A/B letters sit under the buttons; START must not cover them
  const labelB = await page.evaluate(() => { const b = document.querySelector('.round.b span').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom }; });
  const labelA = await page.evaluate(() => { const b = document.querySelector('.round.a span').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom }; });
  ok(`${name}: START/SELECT clear of the A/B labels`, !overlap(m.start, labelB) && !overlap(m.start, labelA) && !overlap(m.select, labelB), JSON.stringify([m.start, labelB]));
  ok(`${name}: A and B do not overlap`, Math.hypot(m.a.x + m.a.w / 2 - m.b.x - m.b.w / 2, m.a.y + m.a.h / 2 - m.b.y - m.b.h / 2) >= Math.min(m.a.w, m.b.w) * 0.9);
  ok(`${name}: controls ignore page gestures`, m.touchAction === 'none', m.touchAction);
  await page.screenshot({ path: `${SHOTS}m_${name}.png` });

  // real touch input: walk with the d-pad, open the menu with START, close with B
  const before = await page.evaluate(() => [window.__wildkin.state.x, window.__wildkin.state.y]);
  const dp = m.dpad;
  const cx = dp.x + dp.w / 2;
  const cy = dp.y + dp.h * 0.85;
  const cdp = await ctx.newCDPSession(page);
  const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', cx, cy);
  await wait(450);
  await touch('touchEnd', cx, cy);
  await wait(300);
  const after = await page.evaluate(() => [window.__wildkin.state.x, window.__wildkin.state.y]);
  ok(`${name}: holding d-pad down walks`, after[1] > before[1], `${before} -> ${after}`);
  const tapAt = async (b) => {
    await touch('touchStart', b.x + b.w / 2, b.y + b.h / 2);
    await wait(90);
    await touch('touchEnd', b.x + b.w / 2, b.y + b.h / 2);
    await wait(250);
  };
  await tapAt(m.start);
  const menu = await page.evaluate(() => window.__wildkin.scenes.at(-1).constructor.name);
  ok(`${name}: START opens the menu`, menu === 'StartMenu', menu);
  await page.screenshot({ path: `${SHOTS}m_${name}_menu.png` });
  await tapAt(m.b);
  const closed = await page.evaluate(() => window.__wildkin.scenes.at(-1).constructor.name);
  ok(`${name}: B closes it`, closed === 'Overworld', closed);
  // dialogue and battle readable at this size
  await page.evaluate(() => {
    void window.__wildkin.scenes[0].run(async (c) => {
      await c.wild(16, 5);
    });
  });
  await wait(1500);
  await tapAt(m.a);
  await wait(800);
  await page.screenshot({ path: `${SHOTS}m_${name}_battle.png` });
  const bs = await page.evaluate(() => window.__wildkin.scenes.at(-1).constructor.name);
  ok(`${name}: battle opens and responds to taps`, bs === 'BattleScene', bs);
  ok(`${name}: no page errors`, errs.length === 0, errs.join('|'));
  await ctx.close();
}
console.log(res.join('\n'));
console.log(res.filter((r) => r.startsWith('FAIL')).length, 'failed of', res.length);
await browser.close();
