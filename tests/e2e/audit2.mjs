import { launch, start, st, top, press, walk, idle, mashUntilIdle, wait, shot } from './lib.mjs';
import { drive } from './battledrv.mjs';
const { browser, page, errors } = await launch();
const ok = (name, cond, info = '') => console.log(cond ? 'PASS' : 'FAIL', name, info);
const ev = (f, a) => page.evaluate(f, a);
const S = () => ev(() => { const s = window.__wildkin.state; return { money: s.money, bag: { ...s.bag }, party: s.party.map((m) => ({ sp: m.sp, hp: m.hp, lvl: m.lvl, exp: m.exp, status: m.status })), map: s.map, x: s.x, y: s.y, boxN: JSON.stringify(s.boxes ?? s.box ?? []).length, seen: Object.keys(s.seen ?? {}).length, caught: Object.keys(s.caught ?? {}).length }; });
const wild = (sp, lvl) => ev(([sp, lvl]) => { const ow = window.__wildkin.scenes.at(-1); ow.run(async (c) => { await c.wild(sp, lvl); }); }, [sp, lvl]);
const trainer = (id) => ev((id) => { const ow = window.__wildkin.scenes.at(-1); ow.run(async (c) => { await c.battle(id); }); }, id);
// RUN
await start(page, { map: 'route1', x: 9, y: 10, party: [['Emberkit', 30]] });
await wild(16, 3);
let r = await drive(page, () => ({ cmd: 3 }));
ok('run from wild battle', r.end === 'overworld', JSON.stringify(r.log));
// FIGHT and win
await start(page, { map: 'route1', x: 9, y: 10, party: [['Emberkit', 30]] });
const b0 = await S();
await wild(16, 3);
r = await drive(page, () => ({ cmd: 0, move: 0 }));
const b1 = await S();
ok('win wild battle, gain exp', r.end === 'overworld' && b1.party[0].exp > b0.party[0].exp, `${b0.party[0].exp}->${b1.party[0].exp}`);
// CATCH
await start(page, { map: 'route1', x: 9, y: 10, party: [['Emberkit', 5]], bag: { pod: 60 } });
const c0 = await S();
await wild(16, 2);
r = await drive(page, () => ({ cmd: 1, item: 'pod' }));
const c1 = await S();
ok('catch with pods', c1.party.length === 2 || c1.boxN > c0.boxN, `party ${c1.party.length} pods left ${c1.bag.pod} caught ${c0.caught}->${c1.caught}`);
// CATCH into box when party full
await start(page, { map: 'route1', x: 9, y: 10, party: [['Emberkit', 5],['Nibbit',3],['Nibbit',3],['Nibbit',3],['Nibbit',3],['Nibbit',3]], bag: { pod: 60 } });
const d0 = await S();
await wild(16, 2);
r = await drive(page, () => ({ cmd: 1, item: 'pod' }));
const d1 = await S();
ok('catch goes to box when party full', d1.boxN > d0.boxN, `${d0.boxN}->${d1.boxN}`);
// DEFEAT -> whiteout
await start(page, { map: 'route2', x: 9, y: 10, party: [['Nibbit', 2]], patch: { money: 1000, heal: { map: 'brindle_haven', x: 4, y: 3 } } });
await wild(146, 60);
r = await drive(page, () => ({ cmd: 0, move: 0 }));
const w1 = await S();
ok('whiteout returns to haven and halves money', w1.map === 'brindle_haven' && w1.money === 500 && w1.party[0].hp > 0, JSON.stringify([w1.map, w1.money, w1.party[0].hp]));
// TRAINER battle win + money
await start(page, { map: 'route1', x: 9, y: 10, party: [['Pyrolion', 60]], patch: { money: 100 } });
await trainer('r1_pip');
r = await drive(page, () => ({ cmd: 0, move: 0 }));
const t1 = await S();
ok('trainer win pays money and sets flag', t1.money > 100 && await ev(() => !!window.__wildkin.state.flags['tr:r1_pip']), String(t1.money));
// EVOLUTION by level
await start(page, { map: 'route1', x: 9, y: 10, party: [['Emberkit', 15]] });
await ev(() => { const m = window.__wildkin.state.party[0]; m.exp = m.exp + 100000; });
await wild(16, 5);
let sawEvo = false;
// slot 1 is SPARK SPIT (Twin Kick at Lv10 pushed CLAW out, so slot 0 is a status move now)
r = await drive(page, (u) => ({ cmd: 0, move: 1 }));
const e1 = await S();
ok('evolution after level up', e1.party[0].sp !== 4, JSON.stringify(e1.party[0]));
// STATUS: poison ticks in field? check sleep/paralysis applied by a status move
console.log('errors', JSON.stringify(errors));
await browser.close();
