import { launch, start, top, press, wait, idle } from './lib.mjs';
const { browser, page, errors } = await launch();
const N = parseInt(process.argv[2] ?? '30');
let done = 0, stuck = 0, turns = 0;
for (let b = 0; b < N; b++) {
  const mine = 1 + Math.floor(Math.random() * 151);
  await start(page, { map: 'route1', x: 9, y: 10, party: [[mine, 50]].map(([i, l]) => [String(i), l]).map(() => ['Pyrolion', 50]) });
  await page.evaluate(() => {
    const g = window.__wildkin;
    const ow = g.scenes.find((s) => s.constructor.name === 'Overworld');
    ow.run(async (c) => { await c.wild(1 + Math.floor(Math.random() * 151), 45 + Math.floor(Math.random() * 10)); });
  });
  for (let i = 0; i < 40 && (await top(page)) !== 'BattleScene'; i++) await wait(100);
  await page.evaluate(() => {
    const g = window.__wildkin;
    const bs = g.scenes.find((s) => s.constructor.name === 'BattleScene');
    const ids = window.__allMoves;
    const pick = () => { const out = []; while (out.length < 4) { const id = ids[Math.floor(Math.random() * ids.length)]; if (!out.includes(id)) out.push(id); } return out.map((id) => ({ id, pp: 30 })); };
    bs.foe.mon.moves = pick();
    bs.foe.mon.hp = Math.ceil(bs.foe.mon.hp / 3);
    bs.disp[0] = bs.foe.mon.hp;
    for (const m of g.state.party) m.moves = pick();
  });
  let finished = false;
  for (let i = 0; i < 400; i++) {
    const t = await top(page);
    if (t === 'Overworld' && (await idle(page))) { finished = true; break; }
    await page.evaluate(() => { const g = window.__wildkin; const bs = g.scenes.find((s) => s.constructor.name === 'BattleScene'); if (bs && bs.ui.kind === 'move') bs.moveIdx = Math.floor(Math.random() * bs.me.mon.moves.length); if (bs && bs.ui.kind === 'cmd') bs.cmdIdx = 0; });
    if (t === 'ForgetMoveScene' || t === 'NamingScene') await press(page, 'b', 25);
    else await press(page, 'a', 25);
    turns++;
  }
  if (finished) done++; else { stuck++; console.log('stuck at', await top(page), await page.evaluate(() => { const g = window.__wildkin; const bs = g.scenes.find((s) => s.constructor.name === 'BattleScene'); return bs ? JSON.stringify({ ui: bs.ui.kind, me: bs.me.mon.hp, foe: bs.foe.mon.hp, moves: bs.me.mon.moves.map((m) => m.id + ':' + m.pp), fm: bs.foe.mon.moves.map((m) => m.id) }) : ''; })); }
}
console.log('battles finished', done, 'stuck', stuck, 'presses', turns);
console.log('errors:', errors.length ? errors.slice(0, 10).join('\n') : 'none');
await browser.close();
