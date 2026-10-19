// Rough boss difficulty check: simulated battles between a sensible player team
// and each boss, many times over. It models damage, accuracy, speed, crits,
// stat stages from setup moves, sleep/paralysis/poison/burn, potions and
// switching to the best matchup. It is a guide, not a substitute for play.
// Usage: node tools/run.mjs tools/bosssim.ts [levelOffset=-1] [trials=300]
import fs from 'node:fs';
import { TRAINERS, trainerTeam } from '../src/game/data/trainers';
import { species, speciesByName } from '../src/game/data/species';
import { move, type MoveDef } from '../src/game/data/moves';
import { bossMoveset } from '../src/game/data/bossmoves';
import { allMaps } from '../src/game/world/maps';
import { createMon, maxHp, type Mon } from '../src/game/systems/mon';
import { newState } from '../src/game/systems/state';
import { Rng } from '../src/game/core/rng';
import { calcDamage, chooseAiMove, fighter, goesFirst, hits, pickNextFoe, type Fighter } from '../src/game/systems/battlecalc';

const maps = allMaps();
const visited: string[] = JSON.parse(fs.readFileSync(process.cwd() + '/tools/data-trainer-order.json', 'utf8')).visited;
const OFFSET = Number(process.argv[2] ?? -1);
const TRIALS = Number(process.argv[3] ?? 300);
const rng = new Rng(12345);
let uid = 1;

// what a player could have caught before reaching each boss's map (wild tables in visit order)
const bossMap: Record<string, string> = {};
for (const [id, m] of Object.entries(maps)) for (const n of m.npcs) if (n.trainer && TRAINERS[n.trainer]?.smart) bossMap[n.trainer] = id;
function poolBefore(mapId: string): number[] {
  const out = new Set<number>();
  for (const id of visited) {
    if (id === mapId) break;
    const m = maps[id];
    for (const t of [m?.encounters, m?.surf, m?.fish]) for (const e of t?.table ?? []) out.add(e.sp);
  }
  return [...out];
}
// fully evolve by level where possible
function evolveTo(sp: number, lvl: number): number {
  let cur = sp;
  for (let k = 0; k < 3; k++) {
    const e = species(cur).evos.find((x) => x.lvl && x.lvl <= lvl);
    if (!e) break;
    cur = e.to;
  }
  return cur;
}
function makeMon(sp: number, lvl: number, moves?: string[]): Mon {
  const m = createMon(sp, lvl, rng, uid++);
  const set = moves ?? bossMoveset(sp, lvl, false);
  if (set) m.moves = set.map((id) => ({ id, pp: move(id).pp }));
  m.iv = [8, 8, 8, 8, 8];
  m.hp = maxHp(m);
  return m;
}
// a sensible team: the starter line plus the five best-rounded catches available, with type variety
function playerTeam(lvl: number, pool: number[], starter: number): Mon[] {
  const scored = pool
    .map((sp) => evolveTo(sp, lvl))
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((sp) => ({ sp, total: species(sp).base.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total);
  const team = [makeMon(evolveTo(starter, lvl), lvl)];
  const types = new Set(species(team[0].sp).types);
  for (const c of scored) {
    if (team.length >= 6) break;
    const t = species(c.sp).types;
    if (t.every((x) => types.has(x))) continue;
    t.forEach((x) => types.add(x));
    team.push(makeMon(c.sp, lvl - 1));
  }
  return team;
}

type Side = { party: Mon[]; f: Fighter; potions: number; smart: boolean };
function best(att: Fighter, def: Fighter): MoveDef {
  let bm = move(att.mon.moves[0].id);
  let bd = -1;
  for (const s of att.mon.moves) {
    const mv = move(s.id);
    if (s.pp <= 0) continue;
    const d = mv.cat === 'status' ? 0 : calcDamage(rng, att, def, mv, false).damage * ((mv.acc || 100) / 100);
    if (d > bd) {
      bd = d;
      bm = mv;
    }
  }
  return bm;
}
function act(a: Fighter, d: Fighter, mv: MoveDef) {
  if (a.mon.hp <= 0) return;
  if (a.mon.status === 'SLP') {
    a.mon.sleep--;
    if (a.mon.sleep > 0) return;
    a.mon.status = null;
  }
  if (a.mon.status === 'PAR' && rng.chance(0.25)) return;
  if (!hits(rng, a, d, mv)) return;
  if (mv.cat === 'status') {
    if (mv.status && !d.mon.status) {
      d.mon.status = mv.status.s;
      if (mv.status.s === 'SLP') d.mon.sleep = 2 + rng.int(3);
    }
    if (mv.stat) {
      const t = mv.stat.who === 'self' ? a : d;
      t.stages[mv.stat.key] = Math.max(-6, Math.min(6, t.stages[mv.stat.key] + mv.stat.delta));
    }
    if (mv.heal) a.mon.hp = Math.min(maxHp(a.mon), a.mon.hp + Math.floor(maxHp(a.mon) * 0.5));
    return;
  }
  const hitsN = mv.multi ? mv.multi[0] + rng.int(mv.multi[1] - mv.multi[0] + 1) : 1;
  for (let k = 0; k < hitsN; k++) d.mon.hp = Math.max(0, d.mon.hp - calcDamage(rng, a, d, mv).damage);
  if (mv.status && !d.mon.status && d.mon.hp > 0 && rng.chance(mv.status.chance)) d.mon.status = mv.status.s;
}
function residual(f: Fighter) {
  if (f.mon.hp > 0 && (f.mon.status === 'PSN' || f.mon.status === 'BRN' || f.mon.status === 'TOX')) f.mon.hp = Math.max(0, f.mon.hp - Math.floor(maxHp(f.mon) / 8));
}
function battle(me: Side, foe: Side): boolean {
  for (let turn = 0; turn < 300; turn++) {
    if (me.f.mon.hp <= 0) {
      const nx = pickNextFoe(rng, me.party, foe.f, true);
      if (nx < 0) return false;
      me.f = fighter(me.party[nx]);
    }
    if (foe.f.mon.hp <= 0) {
      const nx = pickNextFoe(rng, foe.party, me.f, foe.smart);
      if (nx < 0) return true;
      foe.f = fighter(foe.party[nx]);
      // a sensible player switches to the best matchup when the foe changes
      const sw = pickNextFoe(rng, me.party, foe.f, true);
      if (sw >= 0 && me.party[sw] !== me.f.mon && rng.chance(0.6)) {
        me.f = fighter(me.party[sw]);
        act(foe.f, me.f, chooseAiMove(rng, foe.f, me.f, foe.smart));
        continue;
      }
    }
    // potion when low
    if (me.potions > 0 && me.f.mon.hp < maxHp(me.f.mon) * 0.3) {
      me.potions--;
      me.f.mon.hp = Math.min(maxHp(me.f.mon), me.f.mon.hp + 60);
      act(foe.f, me.f, chooseAiMove(rng, foe.f, me.f, foe.smart));
      residual(me.f);
      continue;
    }
    const mm = best(me.f, foe.f);
    const fm = chooseAiMove(rng, foe.f, me.f, foe.smart);
    const first = goesFirst(rng, me.f, mm, foe.f, fm);
    if (first) {
      act(me.f, foe.f, mm);
      act(foe.f, me.f, fm);
    } else {
      act(foe.f, me.f, fm);
      act(me.f, foe.f, mm);
    }
    residual(me.f);
    residual(foe.f);
  }
  return false;
}

const s = newState(new Rng(1));
const order = ['g1', 'cv_sable', 'rival3', 'g2', 'rival4', 'g3', 'g4', 'rival5', 'hd_corvin', 'tw_sable', 'rival6', 'ob_nyx', 'g6', 'g5', 'g7', 'g8', 'rival7', 'e4_1', 'e4_2', 'e4_3', 'e4_4', 'champ'];
console.log(`player team at boss ace level ${OFFSET >= 0 ? '+' : ''}${OFFSET}, ${TRIALS} trials, 3 potions (5 for the league)`);
for (const starterName of ['Emberkit', 'Sproutle', 'Splashel']) {
  const starter = speciesByName(starterName);
  s.starter = starter;
  const row: string[] = [];
  for (const id of order) {
    const t = TRAINERS[id];
    if (!t) continue;
    const team = trainerTeam(t, s);
    const ace = Math.max(...team.map((x) => x[1]));
    const lvl = Math.max(5, ace + OFFSET);
    const pool = poolBefore(bossMap[id] ?? 'e4_1');
    let wins = 0;
    for (let k = 0; k < TRIALS; k++) {
      const mine = playerTeam(lvl, pool, starter);
      const theirs = team.map(([sp, l]) => makeMon(sp, l, t.smart ? (bossMoveset(sp, l, /^champ$/.test(id)) ?? undefined) : undefined));
      if (battle({ party: mine, f: fighter(mine[0]), potions: /^(e4|champ)/.test(id) ? 5 : 3, smart: true }, { party: theirs, f: fighter(theirs[0]), potions: 0, smart: !!t.smart })) wins++;
    }
    row.push(`${id}:${Math.round((100 * wins) / TRIALS)}%`);
  }
  console.log(starterName.padEnd(9), row.join(' '));
}
