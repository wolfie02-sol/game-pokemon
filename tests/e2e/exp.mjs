// Experience sharing in real battles: fighters split, lagging bench catches up, others get nothing.
import { launch, start, top, press, wait } from './lib.mjs';
const { browser, page, errors } = await launch();
const res = [];
const ok = (n, c, d = '') => res.push(`${c ? 'PASS' : 'FAIL'} ${n}${c ? '' : ' :: ' + d}`);
const ev = (f, a) => page.evaluate(f, a);
const exps = () => ev(() => window.__wildkin.state.party.map((m) => m.exp));

async function fight(opts) {
  await start(page, { map: 'route1', x: 9, y: 10, party: opts.party });
  await wait(200);
  const before = await exps();
  await ev((foeLvl) => {
    void window.__wildkin.scenes[0].run(async (c) => {
      await c.wild(16, foeLvl);
    });
  }, opts.foeLvl);
  for (let i = 0; i < 60 && (await top(page)) !== 'BattleScene'; i++) await wait(100);
  let switched = false;
  for (let i = 0; i < 400 && (await top(page)) !== 'Overworld'; i++) {
    const st = await ev(() => {
      const b = window.__wildkin.scenes.at(-1);
      return { scene: b.constructor.name, kind: b.ui?.kind, cmd: b.cmdIdx, meIdx: b.meIdx, foeHp: b.foe?.mon.hp };
    });
    if (st.scene === 'BattleScene' && st.kind === 'cmd') {
      if (opts.switchTo !== undefined && !switched) {
        // go to PARTY (bottom-left)
        if (st.cmd !== 2) {
          if (st.cmd % 2 !== 0) await press(page, 'left');
          if (st.cmd < 2) await press(page, 'down');
        }
        await press(page, 'a');
        await wait(200);
        for (let k = 0; k < opts.switchTo; k++) await press(page, 'down');
        await press(page, 'a');
        await press(page, 'a'); // SHIFT
        switched = true;
        continue;
      }
      // weaken the foe to 1 HP so the next hit always knocks it out, then FIGHT
      await ev(() => {
        const b = window.__wildkin.scenes.at(-1);
        b.foe.mon.hp = Math.min(b.foe.mon.hp, 1);
      });
      if (st.cmd !== 0) {
        if (st.cmd % 2 !== 0) await press(page, 'left');
        if (st.cmd >= 2) await press(page, 'up');
      }
      await press(page, 'a');
      await wait(100);
      // pick the first damaging move
      const slot = await ev(() => {
        const b = window.__wildkin.scenes.at(-1);
        const M = window.__wildkinDebug.data.MOVES;
        return Math.max(0, b.me.mon.moves.findIndex((m) => M[m.id].pow > 0));
      });
      for (let k = 0; k < 4 && (await ev(() => window.__wildkin.scenes.at(-1).moveIdx)) !== slot; k++) await press(page, 'down');
      await press(page, 'a');
      continue;
    }
    await press(page, 'a', 30);
  }
  const after = await exps();
  return after.map((e, i) => e - before[i]);
}

// 1. lead alone, bench level-matched gets nothing, lagging bench gets a small share
let d = await fight({ party: [['Emberkit', 20], ['Fluffin', 19], ['Nibbit', 12]], foeLvl: 20 });
ok('the fighter gets the full share', d[0] > 0, JSON.stringify(d));
ok('a bench Wildkin within 2 levels of the top gets nothing', d[1] === 0, JSON.stringify(d));
ok('a lagging bench Wildkin gets a small catch-up share', d[2] > 0 && d[2] < d[0], JSON.stringify(d));

// 2. switching splits the exp between the two fighters
d = await fight({ party: [['Emberkit', 20], ['Fluffin', 20]], foeLvl: 20, switchTo: 1 });
ok('both fighters get exp after a switch', d[0] > 0 && d[1] > 0, JSON.stringify(d));
ok('the split is even', Math.abs(d[0] - d[1]) <= 2, JSON.stringify(d));

// 3. weak foes give much less to a strong Wildkin
const strong = await fight({ party: [['Emberkit', 40]], foeLvl: 10 });
const even = await fight({ party: [['Emberkit', 10]], foeLvl: 10 });
ok('a Lv40 earns far less than a Lv10 from the same Lv10 foe', strong[0] < even[0] * 0.5, `${strong[0]} vs ${even[0]}`);

ok('no page errors', errors.length === 0, errors.join('|'));
console.log(res.join('\n'));
console.log(res.filter((r) => r.startsWith('FAIL')).length, 'failed of', res.length);
await browser.close();
