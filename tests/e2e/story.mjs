import { launch, start, st, top, press, walk, idle, mashUntilIdle, shot, wait } from './lib.mjs';
const { browser, page, errors } = await launch();
const R = [];
const check = (n, ok, info = '') => R.push(`${ok ? 'PASS' : 'FAIL'} ${n} ${info}`);
const flags = () => page.evaluate(() => window.__wildkin.state.flags);
const bag = () => page.evaluate(() => window.__wildkin.state.bag);
const party = () => page.evaluate(() => window.__wildkin.state.party.map((m) => m.sp));
const strong = [['Pyrolion', 100], ['Abyshell', 100], ['Thornhare', 100]];
const B8 = ['BOULDER', 'RIPPLE', 'SPARK', 'BLOOM', 'VENOM', 'MIND', 'CINDER', 'FROST'];
const face = async (d) => { await press(page, d, 30); await wait(100); };
const talk = async (max = 300) => { await press(page, 'a'); await wait(200); return mashUntilIdle(page, max); };

// Whisper Cave: Sable then fossil
await start(page, { map: 'caveb1', x: 10, y: 8, party: strong, patch: { repel: 999 } });
await walk(page, 'up', 1); await mashUntilIdle(page, 600);
let f = await flags();
check('Sable defeated in Whisper Cave', !!f.caveCleared);
await walk(page, 'up', 2); // to (10,5)
await face('left'); await talk(60);
f = await flags();
check('fossil picked, other gone', !!f['fossilChoice:spiralfossil'] && !!f['item:fossilB']);

// Lorne gives the ticket
await start(page, { map: 'cottage', x: 5, y: 4, party: strong });
await face('up'); await talk(60);
check('ferry ticket from LORNE', !!(await bag()).ferryticket);

// dock gate without ticket pushes back
await start(page, { map: 'volthaven', x: 12, y: 15, party: strong });
await walk(page, 'down', 1); await wait(300); await mashUntilIdle(page, 30);
let s = await st(page);
check('dock blocked without ticket', s.y === 15, JSON.stringify(s));

// with ticket: board ferry, rival, captain, leave
await start(page, { map: 'volthaven', x: 12, y: 15, party: strong, bag: { ferryticket: 1 } });
for (let i = 0; i < 9; i++) { await walk(page, 'down', 1); await mashUntilIdle(page, 20); if ((await st(page)).map === 'ferry') break; }
s = await st(page);
check('boarded the ferry', s.map === 'ferry', JSON.stringify(s));
await start(page, { map: 'ferry', x: 14, y: 3, party: strong, bag: { ferryticket: 1 } });
await walk(page, 'left', 1); await mashUntilIdle(page, 600);
f = await flags();
check('ferry rival battle', !!f['tr:rival4']);
await start(page, { map: 'ferry_cabin', x: 4, y: 4, party: strong, bag: { ferryticket: 1 } });
await face('up'); await talk(60);
check('captain gives shears', !!(await bag()).shears);
await start(page, { map: 'ferry', x: 8, y: 7, party: strong, bag: { ferryticket: 1, shears: 1 } });
await walk(page, 'down', 1); await page.keyboard.down('ArrowDown'); await wait(300); await page.keyboard.up('ArrowDown');
await wait(800); await mashUntilIdle(page, 20);
f = await flags();
s = await st(page);
check('ferry departs after shears', !!f.ferryGone && s.map === 'volthaven', JSON.stringify(s));

// Bell tower: spirit blocks without lens, vanishes with it
await start(page, { map: 'tower2', x: 1, y: 3, party: strong, patch: { repel: 999 } });
await face('up'); await talk(30);
f = await flags();
check('spirit blocks without lens', !f.spiritGone);
await start(page, { map: 'tower2', x: 1, y: 3, party: strong, bag: { lens: 1 }, patch: { repel: 999 } });
await face('up'); await talk(30);
f = await flags();
check('lens reveals spirit', !!f.spiritGone);
await start(page, { map: 'tower3', x: 5, y: 6, party: strong, flags: ['spiritGone'], patch: { repel: 999 } });
for (let i = 0; i < 4; i++) { await walk(page, 'up', 1); await mashUntilIdle(page, 600); }
await face('up'); await talk(60);
f = await flags();
check('Sable at tower, chime received', !!f.towerCleared && !!(await bag()).chime);

// Astra gate opens after tower
await start(page, { map: 'astra', x: 26, y: 12, party: strong, flags: ['towerCleared'] });
const moved = await walk(page, 'left', 3);
s = await st(page);
check('Astra open after tower', moved === 3, JSON.stringify(s));
await start(page, { map: 'astra', x: 27, y: 12, party: strong });
await walk(page, 'left', 1); await wait(300); await mashUntilIdle(page, 30);
s = await st(page);
check('Astra locked before tower', s.x >= 26, JSON.stringify(s));

// Sleeper wakes with chime
await start(page, { map: 'route14', x: 9, y: 4, party: strong, bag: { chime: 1 } });
await face('up'); await talk(600);
f = await flags();
check('sleeper woken and battled', !!f.slumbearDone);

// Observatory: Nyx and the director
await start(page, { map: 'obs3', x: 6, y: 5, party: strong, flags: ['tr:ob_corvin'] });
await walk(page, 'up', 1); await mashUntilIdle(page, 600);
f = await flags();
check('Nyx defeated', !!f.observatoryCleared);
await start(page, { map: 'obs3', x: 8, y: 3, party: strong, flags: ['observatoryCleared', 'tr:ob_corvin', 'tr:ob_nyx'] });
await face('right'); await talk(60);
const bg = await bag();
check('director gives whistle and master pod', !!bg.skywhistle && !!bg.masterpod);

// Breeder needs BLOOM
await start(page, { map: 'bloom_breeder', x: 5, y: 4, party: strong });
await face('up'); await talk(30);
let p = await party();
check('breeder refuses before BLOOM', p.length === 3);
await start(page, { map: 'bloom_breeder', x: 5, y: 4, party: strong, badges: ['BOULDER', 'RIPPLE', 'SPARK', 'BLOOM'] });
await face('up'); await press(page, 'a'); await wait(200);
for (let i = 0; i < 40; i++) { const t = await top(page); if (t === 'NamingScene') { await press(page, 'b'); } if (await idle(page)) break; await press(page, t === 'ChoiceScene' ? 'b' : 'a', 40); }
p = await party();
check('breeder gives a starter', p.length === 4 && p[3] === 7, JSON.stringify(p));

// Fossil revival
await start(page, { map: 'cinder_lab', x: 5, y: 3, party: strong, bag: { amber: 1 } });
await face('up'); await press(page, 'a'); await wait(200);
for (let i = 0; i < 40; i++) { const t = await top(page); if (await idle(page)) break; await press(page, t === 'ChoiceScene' && i > 4 ? 'b' : 'a', 40); }
p = await party();
check('amber revived', p.includes(142), JSON.stringify(p));

// Champion
await start(page, { map: 'champ_room', x: 4, y: 7, party: strong, badges: B8 });
await walk(page, 'up', 1);
for (let i = 0; i < 900; i++) { const t = await top(page); const s2 = await st(page); if (s2.map === 'home' && (await idle(page))) break; await press(page, t === 'ChoiceScene' ? 'a' : 'a', 30); }
f = await flags();
s = await st(page);
check('champion and return home', !!f.champion && s.map === 'home', JSON.stringify(s));

console.log(R.join('\n'));
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
