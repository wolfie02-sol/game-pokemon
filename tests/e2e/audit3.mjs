import { launch, start, st, top, press, walk, idle, mashUntilIdle, wait, shot } from './lib.mjs';
import { drive } from './battledrv.mjs';
const ok = (name, cond, info = '') => console.log(cond ? 'PASS' : 'FAIL', name, info);
const { browser, page, errors } = await launch();
const ev = (f, a) => page.evaluate(f, a);
async function menuPick(label) {
  await press(page, 'start'); await wait(250);
  const items = await ev(() => window.__wildkin.scenes.at(-1).items());
  const k = items.indexOf(label);
  await ev((k) => { const m = window.__wildkin.scenes.at(-1); m.idx = k; }, k);
  await press(page, 'a'); await wait(250);
  return items;
}
// SAVE via menu, reload, continue
await start(page, { map: 'riverton', x: 8, y: 17, party: [['Splashel', 20], ['Nibbit', 7]], badges: ['BOULDER'], bag: { potion: 3 }, patch: { money: 4321, name: 'TESTER' } });
await ev(() => localStorage.removeItem('wildkin-ember-save-v2'));
const items = await menuPick('SAVE');
console.log('menu items', items, 'idx field ok?', await top(page));
for (let i = 0; i < 20; i++) { const t = await top(page); if (t === 'ChoiceScene') { await ev(() => { window.__wildkin.scenes.at(-1).idx = 0; }); await press(page, 'a'); } else if (await idle(page)) break; else await press(page, 'a', 40); }
const saved = await ev(() => !!localStorage.getItem('wildkin-ember-save-v2'));
ok('save writes to storage', saved);
await page.reload();
await page.waitForFunction(() => window.__wildkin);
await wait(600);
await press(page, 'a'); await wait(300); // press start
const titleItems = await ev(() => window.__wildkin.scenes.at(-1).menuItems?.());
ok('title offers CONTINUE', Array.isArray(titleItems) && titleItems[0] === 'CONTINUE', JSON.stringify(titleItems));
await press(page, 'a'); await wait(1500);
const s = await ev(() => { const s = window.__wildkin.state; return { map: s.map, x: s.x, y: s.y, money: s.money, name: s.name, party: s.party.length, badges: s.badges, potion: s.bag.potion }; });
ok('continue restores state', s.map === 'riverton' && s.money === 4321 && s.party === 2 && s.potion === 3 && s.name === 'TESTER', JSON.stringify(s));
// save code export/import round trip
const rt = await ev(async () => { const g = window.__wildkin; return { top: g.scenes.at(-1).constructor.name }; });
// GYM: Brindle leader
await start(page, { map: 'brindle_gym', x: 4, y: 3, party: [['Splashel', 30]] });
const gym = await ev(() => { const ow = window.__wildkin.scenes.at(-1); return ow.map.npcs.map((n) => [n.id, n.x, n.y, !!n.trainer]); });
console.log('gym npcs', JSON.stringify(gym));
console.log('errors', JSON.stringify(errors));
await browser.close();
