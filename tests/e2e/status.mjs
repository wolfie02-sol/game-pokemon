import { launch, start, top, press, wait, idle, mashUntilIdle, shot } from './lib.mjs';
const { browser, page, errs } = await launch();
const res = [];
const ok = (n, c, d = '') => { res.push(`${c ? 'PASS' : 'FAIL'} ${n} ${c ? '' : d}`); };
const ev = (f, a) => page.evaluate(f, a);
async function toCmd() { for (let i = 0; i < 200; i++) { const k = await ev(() => { const b = window.__wildkin.scenes.at(-1); return b.constructor.name === 'BattleScene' ? b.ui.kind : b.constructor.name; }); if (k === 'cmd') return true; if (k === 'Overworld') return false; await press(page, 'a', 30); } return false; }
async function useMove(i) { await ev(() => { window.__wildkin.scenes.at(-1).cmdIdx = 0; }); await press(page, 'a', 40); await ev((i) => { window.__wildkin.scenes.at(-1).moveIdx = i; }, i); await press(page, 'a', 40); }
const foe = () => ev(() => { const b = window.__wildkin.scenes.at(-1); return { st: b.foe.mon.status, hp: b.foe.mon.hp, sleep: b.foe.mon.sleep }; });
for (const [mv, want] of [['hushsong', 'SLP'], ['miasma', 'PSN'], ['joltwave', 'PAR']]) {
  await start(page, { map: 'route1', x: 9, y: 10, party: [['Emberkit', 40]] });
  await ev((mv) => { const m = window.__wildkin.state.party[0]; m.moves = [{ id: mv, pp: 30 }, { id: 'sparkspit', pp: 30 }]; }, mv);
  await ev(() => { const ow = window.__wildkin.scenes.at(-1); ow.run(async (c) => { await c.wild(16, 30); }); });
  await wait(300);
  let got = null;
  for (let t = 0; t < 6 && !got; t++) { if (!(await toCmd())) break; await useMove(0); await wait(200); await toCmd(); const f = await foe(); if (f.st) got = f; }
  ok(`${mv} inflicts ${want}`, got && got.st === want, JSON.stringify(got));
  if (want === 'PSN' && got) { const h0 = got.hp; await useMove(0); await toCmd(); const f = await foe(); ok('poison chips HP at end of turn', f.hp < h0, `${h0}->${f.hp}`); }
  if (want === 'SLP') await shot(page, 's_sleep');
  for (let i = 0; i < 40 && (await top(page)) !== 'Overworld'; i++) { await ev(() => { const b = window.__wildkin.scenes.at(-1); if (b.foe) b.foe.mon.hp = 0; }); await press(page, 'a', 40); }
  await mashUntilIdle(page, 200);
}
// burn on own mon persists after battle; antidote cures poison in field
await start(page, { map: 'route1', x: 9, y: 10, party: [['Emberkit', 20]], bag: { antidote: 1, repel: 1, potion: 1 } });
await ev(() => { const m = window.__wildkin.state.party[0]; m.status = 'PSN'; m.hp = 10; });
// walk 4 steps on route: field poison
const hp0 = await ev(() => window.__wildkin.state.party[0].hp);
for (let i = 0; i < 4; i++) { await press(page, i % 2 ? 'left' : 'right', 220); await wait(50); }
await mashUntilIdle(page, 50, 'b');
const hp1 = await ev(() => window.__wildkin.state.party[0].hp);
ok('field poison drains HP while walking', hp1 < hp0, `${hp0}->${hp1}`);
console.log(res.join('\n')); console.log('errors', errs);
await browser.close();
