import { launch, start, st, top, press, walk, idle, mashUntilIdle, shot, wait } from './lib.mjs';
const { browser, page, errors } = await launch();
const results = [];
const check = (name, ok, info = '') => { results.push(`${ok ? 'PASS' : 'FAIL'} ${name} ${info}`); };
const ow = (fn, arg) => page.evaluate(([f, a]) => { const g = window.__wildkin; const t = g.scenes.find((s) => s.constructor.name === 'Overworld'); return new Function('ow', 'a', f)(t, a); }, [fn, arg]);

// a) hedge trimming east of Riverton
await start(page, { map: 'riverton', x: 23, y: 9, bag: { shears: 1 }, patch: { dir: 'right' } });
await press(page, 'right', 30);
await press(page, 'a'); await wait(300);
await mashUntilIdle(page, 30);
let moved = await walk(page, 'right', 3);
let s = await st(page);
check('trim hedge and leave Riverton east', s.map === 'route9', JSON.stringify(s));
await shot(page, 'mech_a');

// b) surfing at Volthaven
await start(page, { map: 'volthaven', x: 12, y: 18, bag: { driftboard: 1 }, patch: { dir: 'left', repel: 999 } });
await press(page, 'left', 30);
await press(page, 'a'); await wait(300);
await mashUntilIdle(page, 30);
s = await st(page);
check('mount driftboard', s.surfing && s.x === 11, JSON.stringify(s));
moved = await walk(page, 'down', 2);
s = await st(page);
check('surf on water', s.surfing && moved >= 1, JSON.stringify(s) + ' moved ' + moved);
await shot(page, 'mech_b');
await walk(page, 'up', 1);
moved = await walk(page, 'right', 1);
s = await st(page);
check('dismount on dock', !s.surfing && s.x >= 12, JSON.stringify(s));

// c) fishing starts a battle
await start(page, { map: 'volthaven', x: 12, y: 18, bag: { rod: 1 }, patch: { dir: 'left' } });
await press(page, 'left', 30);
let fishTop = 'none';
for (let k = 0; k < 6 && fishTop !== 'BattleScene'; k++) {
  ow('ow.fish(); return 1');
  for (let i = 0; i < 25; i++) { await wait(150); fishTop = await top(page); if (fishTop === 'BattleScene') break; await press(page, 'a', 30); }
  if (fishTop !== 'BattleScene') await mashUntilIdle(page, 20);
}
check('fishing hooks a wild battle', fishTop === 'BattleScene', fishTop);
await shot(page, 'mech_c');

// d) flying
await start(page, { map: 'astra', x: 18, y: 12, flags: ['visit:brindle', 'visit:riverton', 'visit:astra'] });
const targets = await ow('return ow.flyTargets().map(t => t.id)');
await ow("ow.flyTo('brindle'); return 1");
await wait(1500);
s = await st(page);
check('fly to a visited town', s.map === 'brindle' && targets.length === 3, JSON.stringify(targets) + ' ' + JSON.stringify(s));

// e) locked gym door on Cindermoor
await start(page, { map: 'cindermoor', x: 8, y: 7, patch: { dir: 'up' } });
await walk(page, 'up', 1);
await wait(300);
const lockedTop = await top(page);
await mashUntilIdle(page, 20);
s = await st(page);
check('locked gym door pushes back', s.map === 'cindermoor' && s.y === 7 && lockedTop === 'TextScene', lockedTop + ' ' + JSON.stringify(s));
await start(page, { map: 'cindermoor', x: 8, y: 7, bag: { manorkey: 1 }, patch: { dir: 'up' } });
await walk(page, 'up', 1);
await wait(800);
s = await st(page);
check('key opens the gym', s.map === 'cinder_gym', JSON.stringify(s));

// f) smashing a cracked boulder in Victory Cave
await start(page, { map: 'vcave1', x: 6, y: 7, bag: { pick: 1 }, patch: { dir: 'up' } });
await press(page, 'up', 30);
await press(page, 'a'); await wait(300);
await mashUntilIdle(page, 30);
moved = await walk(page, 'up', 2);
s = await st(page);
check('rock pick breaks boulder', s.y <= 6, JSON.stringify(s));
await shot(page, 'mech_f');

// g) league: beat the first ELITE FOUR member and pass the door
await start(page, { map: 'e4_1', x: 4, y: 7, party: [['Pyrolion', 100], ['Abyshell', 100]], badges: ['BOULDER','RIPPLE','SPARK','BLOOM','VENOM','MIND','CINDER','FROST'] });
await walk(page, 'up', 1);
let ok = await mashUntilIdle(page, 600);
s = await st(page);
const beaten = await page.evaluate(() => !!window.__wildkin.state.flags['tr:e4_1']);
check('elite four battle completes', ok && beaten, JSON.stringify(s));
moved = await walk(page, 'up', 8);
await wait(800);
s = await st(page);
check('door to next hall opens', s.map === 'e4_2', JSON.stringify(s));
await shot(page, 'mech_g');

console.log(results.join('\n'));
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
