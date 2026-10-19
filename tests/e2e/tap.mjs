import { launch, start, st, top, press, idle, wait } from './lib.mjs';
for (const touch of [false, true]) {
const { browser, page, errors } = await launch(touch ? { touch: true, viewport: { width: 390, height: 844 } } : {});
await start(page, { map: 'lab', x: 2, y: 7, party: [], flags: ['labIntro'] });
await page.evaluate(() => { const s = window.__wildkin.state; delete s.flags.gotStarter; delete s.flags.gotDex; s.party = []; });
const info = await page.evaluate(() => { const g = window.__wildkin; const ow = g.scenes[g.scenes.length-1]; return { w: ow.map.w, h: ow.map.h }; });
async function tapTile(tx, ty) {
  const s = await st(page);
  const TS = 16, mw = info.w*TS, mh = info.h*TS;
  let camX = s.x*TS - 64, camY = s.y*TS - 64;
  if (mw <= 160) camX = (mw-160)/2; 
  if (mh <= 144) camY = (mh-144)/2; 
  camX = Math.round(camX); camY = Math.round(camY);
  const r = await page.evaluate(() => { const b = document.querySelector('canvas').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
  const k = r.w / 160;
  const px = r.x + (tx*TS - camX + 8) * k, py = r.y + (ty*TS - camY + 8) * k;
  if (touch) await page.touchscreen.tap(px, py); else await page.mouse.click(px, py);
}
console.log('map', info, await st(page));
await tapTile(6, 4);
let saw = false;
for (let i = 0; i < 60; i++) { await wait(100); const t = await top(page); if (t !== 'Overworld' || !(await idle(page))) { saw = true; if (t !== 'Overworld') break; } }
console.log(touch ? 'touch' : 'mouse', 'after tap', await top(page), await st(page));
// finish choice
for (let i = 0; i < 60; i++) { if (await idle(page)) break; await press(page, 'a', 40); }
console.log('starter', await page.evaluate(() => window.__wildkin.state.starter), 'party', await page.evaluate(() => window.__wildkin.state.party.length));
console.log('errors', errors);
await browser.close();
}
