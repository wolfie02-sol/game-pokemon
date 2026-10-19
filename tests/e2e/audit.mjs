import { launch, start, st, top, press, walk, idle, mashUntilIdle, wait, shot } from './lib.mjs';
const { browser, page, errors } = await launch();
const res = [];
const ok = (name, cond, info = '') => { res.push([cond ? 'PASS' : 'FAIL', name, info]); console.log(cond ? 'PASS' : 'FAIL', name, info); };
const ev = (f, a) => page.evaluate(f, a);
const S = () => ev(() => { const s = window.__wildkin.state; return { money: s.money, bag: { ...s.bag }, party: s.party.map((m) => ({ sp: m.sp, hp: m.hp, lvl: m.lvl, status: m.status })), box: (s.boxes ?? s.box ?? []).flat ? (s.boxes ?? s.box ?? []).flat().length : 0, map: s.map, x: s.x, y: s.y, heal: s.heal, caught: Object.keys(s.caught ?? {}).length }; });
async function choose(match) {
  for (let i = 0; i < 60; i++) {
    const t = await top(page);
    if (t === 'ChoiceScene') {
      const opts = await ev(() => window.__wildkin.scenes.at(-1).options);
      const k = opts.findIndex((o) => match.test(o));
      if (k < 0) return opts;
      await ev((k) => { window.__wildkin.scenes.at(-1).idx = k; }, k);
      await press(page, 'a');
      return true;
    }
    await press(page, 'a', 40);
  }
  return false;
}
async function step(name, f) { try { await f(); } catch (e) { ok(name, false, 'exception ' + e.message); } }

// 1. Haven heal via the keeper
await step('haven heal', async () => {
  await start(page, { map: 'brindle_haven', x: 4, y: 3, party: [['Emberkit', 12]] });
  await ev(() => { const m = window.__wildkin.state.party[0]; m.hp = 1; m.status = 'psn'; });
  await press(page, 'up', 30); await press(page, 'a');
  await choose(/YES/i);
  await mashUntilIdle(page);
  const s = await S();
  ok('haven heal', s.party[0].hp > 1 && !s.party[0].status, JSON.stringify(s.party[0]) + ' heal=' + JSON.stringify(s.heal));
});
// 2. Mart buy
await step('mart buy', async () => {
  await start(page, { map: 'brindle_mart', x: 1, y: 3, party: [['Emberkit', 12]] });
  const before = await S();
  await press(page, 'up', 30); await press(page, 'a');
  for (let i = 0; i < 40 && (await top(page)) !== 'ShopScene'; i++) await press(page, 'a', 40);
  ok('mart opens shop', (await top(page)) === 'ShopScene');
  await press(page, 'a'); await wait(150); // BUY
  await press(page, 'a'); await wait(150); // first item -> qty
  await press(page, 'a'); await wait(150); // confirm qty 1
  for (let i = 0; i < 6; i++) { if ((await top(page)) === 'ChoiceScene') await choose(/YES/i); else await press(page, 'a', 40); }
  for (let i = 0; i < 10 && (await top(page)) !== 'Overworld'; i++) await press(page, 'b', 40);
  await mashUntilIdle(page, 50, 'b');
  const after = await S();
  ok('mart buy spends money and adds item', after.money < before.money && Object.values(after.bag).reduce((a, b) => a + b, 0) > Object.values(before.bag).reduce((a, b) => a + b, 0), `${before.money}->${after.money}`);
});
// 3. Storage PC
await step('storage', async () => {
  await start(page, { map: 'brindle_haven', x: 9, y: 3, party: [['Emberkit', 12], ['Nibbit', 5]] });
  await press(page, 'up', 30); await press(page, 'a');
  for (let i = 0; i < 30 && !/Storage/.test(await top(page)); i++) { if ((await top(page)) === 'ChoiceScene') { const r = await choose(/BOX|STORAGE|PC|WILDKIN/i); if (r !== true) console.log('pc options', r); } else await press(page, 'a', 40); }
  ok('PC opens storage', /Storage/.test(await top(page)), await top(page));
  await shot(page, 'a_storage');
  for (let i = 0; i < 10 && (await top(page)) !== 'Overworld'; i++) await press(page, 'b', 40);
  await mashUntilIdle(page, 40, 'b');
});
// 4. Wild encounter in grass + run
await step('wild encounter', async () => {
  await start(page, { map: 'route1', x: 4, y: 2, party: [['Emberkit', 30]] });
  let got = false;
  for (let i = 0; i < 80 && !got; i++) { await walk(page, i % 2 ? 'left' : 'right', 1); const t = await top(page); if (t !== 'Overworld') got = true; else if (!(await idle(page))) { await wait(300); if ((await top(page)) !== 'Overworld') got = true; } }
  ok('wild encounter in tall grass', got);
  if (got) {
    for (let i = 0; i < 20 && (await top(page)) !== 'BattleScene'; i++) await wait(150);
    await shot(page, 'a_wild');
    // choose RUN: set menu to run via keys: down, right
    for (let i = 0; i < 12; i++) await press(page, 'a', 40);
    const ph = await ev(() => { const b = window.__wildkin.scenes.find((x) => x.constructor.name === 'BattleScene'); return b ? b.phase ?? b.stage ?? b.mode : 'gone'; });
    await mashUntilIdle(page, 300);
    ok('wild battle ends back on overworld', await idle(page));
  }
});
// 5. Catching
await step('catch', async () => {
  await start(page, { map: 'route1', x: 9, y: 10, party: [['Emberkit', 5]], bag: { pod: 40, greatpod: 10 } });
  const before = await S();
  await ev(() => { const g = window.__wildkin; const ow = g.scenes.at(-1); ow.run(async (c) => { await c.wild(16, 3); }); });
  for (let i = 0; i < 30 && (await top(page)) !== 'BattleScene'; i++) await wait(100);
  // drive bag throws through the internal action API if present
  const api = await ev(() => { const b = window.__wildkin.scenes.find((x) => x.constructor.name === 'BattleScene'); return Object.getOwnPropertyNames(Object.getPrototypeOf(b)).join(','); });
  console.log('battle api', api);
  await browser.close();
});
console.log(JSON.stringify(errors));
await browser.close().catch(() => {});
