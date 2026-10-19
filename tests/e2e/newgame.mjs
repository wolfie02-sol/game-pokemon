import { launch, start, st, top, press, walk, idle, mashUntilIdle, wait, shot } from './lib.mjs';
const { browser, page, errors } = await launch();
await wait(800);
for (let i = 0; i < 200; i++) {
  const t = await top(page);
  if (t === 'Overworld' && (await idle(page))) break;
  if (t === 'NamingScene') { await press(page, 'down'); await press(page, 'a'); continue; }
  await press(page, 'a', 40);
}
console.log('after intro', await top(page), await st(page));
await page.evaluate(() => { const s = window.__wildkin.state; s.map; });
// lab pick
await start(page, { map: 'lab', x: 6, y: 5, party: [], flags: ['labIntro'], patch: { flags: { labIntro: true } } });
await page.evaluate(() => { const s = window.__wildkin.state; delete s.flags.gotStarter; delete s.flags.gotDex; s.party = []; });
await press(page, 'up', 30); await press(page, 'a');
let ch = 0; for (let i = 0; i < 80; i++) { const t = await top(page); if (await idle(page)) break; if (t === 'ChoiceScene') { await press(page, ch++ === 0 ? 'a' : 'b', 40); continue; } await press(page, 'a', 40); }
console.log('party', await page.evaluate(() => window.__wildkin.state.party.map((m) => m.sp)), 'starter', await page.evaluate(() => window.__wildkin.state.starter));
await walk(page, 'down', 4);
const ok = await mashUntilIdle(page, 500);
console.log('rival1 beaten', await page.evaluate(() => !!window.__wildkin.state.flags['tr:rival1']), 'dex', await page.evaluate(() => !!window.__wildkin.state.flags.gotDex));
console.log('errors', errors);
await browser.close();
