// Balance checks that need no browser. Run: node tools/run.mjs tests/unit/balance.ts
import { TRAINERS, trainerTeam } from '../../src/game/data/trainers';
import { species } from '../../src/game/data/species';
import { canLearnTM } from '../../src/game/data/items';
import { bossMoveset } from '../../src/game/data/bossmoves';
import { MOVES } from '../../src/game/data/moves';
import { allMaps } from '../../src/game/world/maps';
import { newState } from '../../src/game/systems/state';
import { expReward, catchUpShare, type Mon } from '../../src/game/systems/mon';
import { Rng } from '../../src/game/core/rng';

allMaps();
const res: string[] = [];
const ok = (n: string, c: boolean, d = '') => res.push(`${c ? 'PASS' : 'FAIL'} ${n}${c ? '' : ' :: ' + d}`);
const foe = (sp: number, lvl: number) => ({ sp, lvl }) as Mon;

// experience formula
const same = expReward(foe(16, 20), false, 20);
const low = expReward(foe(16, 10), false, 20);
const high = expReward(foe(16, 30), false, 20);
const tr = expReward(foe(16, 20), true, 20);
const adj = species(16).expYield * [0.6, 0.82, 1][species(16).stage];
ok('same-level exp is (stage-adjusted) yield x level / 7', same === Math.floor((adj * 20) / 7), String(same));
ok('trainer Wildkin give 1.5x', tr === Math.floor(((adj * 20) / 7) * 1.5), String(tr));
ok('a foe at half your level gives a reduced share', low / expReward(foe(16, 10), false, 10) < 0.8, `${low}`);
ok('a foe at a quarter of your level gives about a third', expReward(foe(16, 10), false, 40) / expReward(foe(16, 10), false, 10) < 0.4);
ok('a foe a few levels below gives full exp', expReward(foe(16, 16), false, 20) === expReward(foe(16, 16), false, 16));
ok('a stronger foe gives a bonus (capped at 1.5x)', high > expReward(foe(16, 30), false, 30) && high <= 1.5 * expReward(foe(16, 30), false, 30) + 1, `${high}`);
ok('no catch-up within 2 levels of the top', catchUpShare(18, 20) === 0);
ok('25% catch-up at 3-5 levels behind', catchUpShare(16, 20) === 0.25);
ok('50% catch-up at 6+ levels behind', catchUpShare(12, 20) === 0.5);

// boss move sets are legal and full
let illegal = 0;
let checked = 0;
for (const starter of [1, 4, 7]) {
  const s = newState(new Rng(1));
  s.starter = starter;
  for (const t of Object.values(TRAINERS)) {
    if (!t.smart) continue;
    const tms = /^champ$/.test(t.id);
    for (const [sp, l] of trainerTeam(t, s)) {
      const set = bossMoveset(sp, l, tms);
      if (!set) continue;
      checked++;
      const sx = species(sp);
      for (const id of set) {
        const legal = !!MOVES[id] && (sx.learn.some(([lv, m]) => m === id && lv <= l) || (tms && canLearnTM(sx, id)));
        if (!legal) {
          illegal++;
          res.push(`  illegal: ${t.id} ${sx.name} ${id}`);
        }
      }
      if (new Set(set).size !== set.length || set.length > 4) {
        illegal++;
        res.push(`  bad set: ${t.id} ${sx.name} ${set.join(',')}`);
      }
    }
  }
}
ok(`boss move sets legal (${checked} Wildkin)`, illegal === 0, String(illegal));

// boss curve follows the journal order and stays in the target bands
const s = newState(new Rng(1));
s.starter = 4;
const top = (id: string) => Math.max(...trainerTeam(TRAINERS[id], s).map((x) => x[1]));
const curve: [string, number, number][] = [
  ['g1', 10, 14], ['g2', 15, 20], ['g3', 20, 25], ['g4', 25, 30], ['g6', 30, 36], ['g5', 35, 40], ['g7', 40, 45], ['g8', 45, 50],
  ['e4_1', 50, 58], ['e4_2', 50, 58], ['e4_3', 50, 58], ['e4_4', 50, 58], ['champ', 55, 62],
];
let prev = 0;
for (const [id, lo, hi] of curve) {
  const m = top(id);
  ok(`${id} ace level ${m} within ${lo}-${hi}`, m >= lo && m <= hi);
  ok(`${id} not below the previous boss`, m >= prev, `${m} < ${prev}`);
  prev = m;
}
console.log(res.join('\n'));
console.log(res.filter((r) => r.startsWith('FAIL')).length, 'failed of', res.filter((r) => /^(PASS|FAIL)/.test(r)).length);
