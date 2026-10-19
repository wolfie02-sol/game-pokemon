import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
export const SHOTS = new URL('./shots', import.meta.url).pathname;
import fs from 'node:fs';
fs.mkdirSync(SHOTS, { recursive: true });

export async function launch(opts = {}) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: opts.viewport ?? { width: 1100, height: 900 }, hasTouch: !!opts.touch, isMobile: !!opts.touch });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });
  await page.goto('http://localhost:4173/');
  await page.waitForFunction(() => window.__wildkin && window.__wildkinDebug);
  return { browser, page, errors };
}

export const top = (page) => page.evaluate(() => { const g = window.__wildkin; return g.scenes[g.scenes.length - 1].constructor.name; });
export const st = (page) => page.evaluate(() => { const s = window.__wildkin.state; return { map: s.map, x: s.x, y: s.y, dir: s.dir, surfing: !!s.surfing, money: s.money, badges: s.badges.slice() }; });
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function start(page, opts) {
  await page.evaluate((o) => window.__wildkinDebug.start(o), opts);
  await wait(400);
}

const KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', a: 'KeyZ', b: 'KeyX', start: 'KeyM' };
export async function press(page, k, hold = 60) {
  await page.keyboard.down(KEY[k]);
  await wait(hold);
  await page.keyboard.up(KEY[k]);
  await wait(60);
}

/** Overworld idle: top scene is the overworld and no script running. */
export async function idle(page) {
  return page.evaluate(() => {
    const g = window.__wildkin;
    const t = g.scenes[g.scenes.length - 1];
    return t.constructor.name === 'Overworld' && t.busy === 0 && !t.moving && t.fade === 0;
  });
}

/** Press A until the overworld is idle again (dialogs, battles with A-spam). */
export async function mashUntilIdle(page, max = 400, key = 'a') {
  for (let i = 0; i < max; i++) {
    if (await idle(page)) return true;
    await press(page, key, 40);
  }
  return false;
}

/** Walk n tiles in a direction (returns tiles actually moved). */
export async function walk(page, dir, n = 1) {
  let moved = 0;
  for (let i = 0; i < n; i++) {
    const a = await st(page);
    await page.keyboard.down(KEY[dir]);
    let ok = false;
    for (let t = 0; t < 40; t++) {
      await wait(20);
      const b = await st(page);
      if (b.x !== a.x || b.y !== a.y || b.map !== a.map) { ok = true; break; }
      if (!(await page.evaluate(() => { const g = window.__wildkin; return g.scenes[g.scenes.length - 1].constructor.name === 'Overworld'; }))) break;
    }
    await page.keyboard.up(KEY[dir]);
    for (let t = 0; t < 40; t++) {
      const busy = await page.evaluate(() => { const g = window.__wildkin; const o = g.scenes.find((x) => x.constructor.name === 'Overworld'); return !!(o && o.moving); });
      if (!busy) break;
      await wait(20);
    }
    await wait(30);
    if (!ok) break;
    moved++;
  }
  return moved;
}

export async function shot(page, name) {
  await page.locator('canvas').first().screenshot({ path: `${SHOTS}/${name}.png` });
}
