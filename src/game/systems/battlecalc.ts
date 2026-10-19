import type { Rng } from '../core/rng';
import { effectiveness } from '../data/elements';
import { move, STRUGGLE, type MoveDef, type StatKey } from '../data/moves';
import { species } from '../data/species';
import { maxHp, stats, type Mon } from './mon';

export interface Stages {
  atk: number;
  def: number;
  spd: number;
  spc: number;
  acc: number;
  eva: number;
}

export const emptyStages = (): Stages => ({ atk: 0, def: 0, spd: 0, spc: 0, acc: 0, eva: 0 });

export function stageMul(st: number): number {
  return st >= 0 ? (2 + st) / 2 : 2 / (2 - st);
}

export function accMul(st: number): number {
  return st >= 0 ? (3 + st) / 3 : 3 / (3 - st);
}

export interface Fighter {
  mon: Mon;
  stages: Stages;
  flinch: boolean;
  /** turns of confusion left */
  conf?: number;
  /** badly-poisoned counter */
  toxic?: number;
  seeded?: boolean;
  /** turns left bound by a trapping move */
  trap?: number;
  /** must skip the next turn */
  recharge?: boolean;
  reflect?: number;
  light?: number;
}

/** Fresh battle state for a Wildkin entering the field. */
export function fighter(mon: Mon): Fighter {
  return { mon, stages: emptyStages(), flinch: false };
}

export function effStat(f: Fighter, key: Exclude<StatKey, 'acc' | 'eva'>): number {
  const s = stats(f.mon);
  let v = s[key] * stageMul(f.stages[key]);
  if (key === 'spd' && f.mon.status === 'PAR') v *= 0.25;
  if (key === 'atk' && f.mon.status === 'BRN') v *= 0.5;
  return Math.max(1, Math.floor(v));
}

export interface DamageResult {
  damage: number;
  eff: number;
  crit: boolean;
}

export function calcDamage(rng: Rng, atk: Fighter, def: Fighter, mv: MoveDef, rollRandom = true): DamageResult {
  const eff = effectiveness(mv.type, species(def.mon.sp).types);
  if (eff === 0 || mv.pow === 0) return { damage: 0, eff, crit: false };
  if (mv.fixed) {
    const dmg = mv.fixed === 'level' ? atk.mon.lvl : mv.fixed === 'half' ? Math.max(1, Math.floor(def.mon.hp / 2)) : mv.fixed;
    return { damage: dmg, eff: 1, crit: false };
  }
  const critChance = mv.highCrit ? 1 / 4 : 1 / 16;
  const crit = rollRandom ? rng.chance(critChance) : false;
  const phys = mv.cat === 'phys';
  let a = effStat(atk, phys ? 'atk' : 'spc');
  let d = effStat(def, phys ? 'def' : 'spc');
  if (mv.explode) d = Math.max(1, Math.floor(d / 2));
  if (crit) {
    // crits ignore the attacker's negative and defender's positive stages
    const sa = stats(atk.mon);
    const sd = stats(def.mon);
    a = Math.max(a, phys ? sa.atk : sa.spc);
    d = Math.min(d, phys ? sd.def : sd.spc);
  }
  const lvl = atk.mon.lvl;
  let dmg = Math.floor(Math.floor((Math.floor((2 * lvl) / 5 + 2) * mv.pow * a) / d) / 50) + 2;
  if (!crit && phys && def.reflect) dmg = Math.floor(dmg / 2);
  if (!crit && !phys && def.light) dmg = Math.floor(dmg / 2);
  if (crit) dmg = Math.floor(dmg * 1.75);
  if (species(atk.mon.sp).types.includes(mv.type)) dmg = Math.floor(dmg * 1.5);
  dmg = Math.floor(dmg * eff);
  if (rollRandom) dmg = Math.floor((dmg * rng.range(217, 255)) / 255);
  return { damage: Math.max(1, dmg), eff, crit };
}

export function hits(rng: Rng, atk: Fighter, def: Fighter, mv: MoveDef): boolean {
  if (mv.acc === 0) return true;
  const stage = Math.max(-6, Math.min(6, atk.stages.acc - def.stages.eva));
  const p = (mv.acc / 100) * accMul(stage);
  return rng.next() < Math.min(1, p);
}

/** Returns true if `a` moves before `b`. */
export function goesFirst(rng: Rng, a: Fighter, am: MoveDef, b: Fighter, bm: MoveDef): boolean {
  const pa = am.priority ?? 0;
  const pb = bm.priority ?? 0;
  if (pa !== pb) return pa > pb;
  const sa = effStat(a, 'spd');
  const sb = effStat(b, 'spd');
  if (sa !== sb) return sa > sb;
  return rng.chance(0.5);
}

export interface CatchResult {
  caught: boolean;
  shakes: number;
}

export function catchAttempt(rng: Rng, target: Mon, podMul: number): CatchResult {
  const max = maxHp(target);
  const rate = species(target.sp).catchRate;
  let status = 1;
  if (target.status === 'SLP' || target.status === 'FRZ') status = 2;
  else if (target.status) status = 1.5;
  const a = (((3 * max - 2 * target.hp) * rate * podMul) / (3 * max)) * status;
  if (a >= 255) return { caught: true, shakes: 3 };
  const b = 1048560 / Math.sqrt(Math.sqrt(16711680 / Math.max(1, a)));
  let shakes = 0;
  for (let i = 0; i < 4; i++) {
    if (rng.int(65536) < b) shakes++;
    else break;
  }
  return { caught: shakes === 4, shakes: Math.min(3, shakes) };
}

export function runChance(me: Fighter, foe: Fighter, attempts: number): number {
  const a = effStat(me, 'spd');
  const b = Math.max(1, effStat(foe, 'spd'));
  return Math.min(1, (a / b) * 0.5 + 0.35 + attempts * 0.15);
}

export function usableMoves(m: Mon): number[] {
  return m.moves.map((mv, i) => (mv.pp > 0 ? i : -1)).filter((i) => i >= 0);
}

/** AI: mostly picks the highest expected damage move, sometimes a useful status move. */
export function chooseAiMove(rng: Rng, me: Fighter, foe: Fighter, smart: boolean): MoveDef & { slot: number } {
  const usable = usableMoves(me.mon);
  if (!usable.length) return { ...STRUGGLE, slot: -1 };
  const scored = usable.map((slot) => {
    const mv = move(me.mon.moves[slot].id);
    let score: number;
    if (mv.cat === 'status') {
      score = 12;
      if (mv.status && foe.mon.status) score = 0;
      if (mv.conf && foe.conf) score = 0;
      if (mv.seed && (foe.seeded || species(foe.mon.sp).types.includes('LEAF'))) score = 0;
      if (mv.screen && (mv.screen === 'reflect' ? me.reflect : me.light)) score = 0;
      if (mv.haze) score = foe.stages.atk + foe.stages.spc + foe.stages.spd > 1 ? 30 : 0;
      if (mv.rest) score = me.mon.hp / maxHp(me.mon) < 0.35 ? 55 : 0;
      if (mv.heal) score = me.mon.hp / maxHp(me.mon) < 0.45 ? 60 : 0;
      if (mv.stat) {
        const target = mv.stat.who === 'self' ? me : foe;
        const cur = target.stages[mv.stat.key];
        if ((mv.stat.delta > 0 && cur >= 4) || (mv.stat.delta < 0 && cur <= -4)) score = 0;
        else if (mv.stat.who === 'self' && cur >= 2) score = 4;
      }
    } else {
      const { damage, eff } = calcDamage(rng, me, foe, mv, false);
      const hitsN = mv.multi ? (mv.multi[0] + mv.multi[1]) / 2 : 1;
      score = eff === 0 ? 0 : damage * hitsN * ((mv.acc || 100) / 100);
      if (mv.explode) score = me.mon.hp / maxHp(me.mon) < 0.3 ? score : score * 0.2;
      if (mv.recharge) score *= 0.7;
      if (damage * hitsN >= foe.mon.hp && !mv.explode) score += 200;
    }
    return { slot, mv, score };
  });
  // ordinary trainers pick loosely; bosses only rarely make a casual choice
  if (!smart || rng.chance(0.1)) {
    const viable = scored.filter((s) => s.score > 0);
    const pick = rng.pick(viable.length ? viable : scored);
    return { ...pick.mv, slot: pick.slot };
  }
  scored.sort((x, y) => y.score - x.score);
  return { ...scored[0].mv, slot: scored[0].slot };
}

/**
 * Bosses usually (70%) send in the Wildkin that matches up best against the
 * player's current one (its best attack against the player's, minus the
 * player's best against it), and they keep their ace (listed last) for last.
 * The rest of the time they go in listed order, so they read as smart but
 * not as perfect counter-pickers. Ordinary trainers keep their listed order.
 */
export function pickNextFoe(rng: Rng, party: Mon[], vs: Fighter, smart: boolean): number {
  const alive = party.map((m, i) => (m.hp > 0 ? i : -1)).filter((i) => i >= 0);
  if (!smart || alive.length <= 1) return alive[0] ?? -1;
  const ace = party.length - 1;
  const pool = alive.filter((i) => i !== ace);
  if (!pool.length) return ace;
  if (!rng.chance(0.7)) return pool[0];
  let best = pool[0];
  let bestScore = -Infinity;
  for (const i of pool) {
    const f = fighter(party[i]);
    const dealt = Math.max(0, ...f.mon.moves.map((s) => (move(s.id).cat === 'status' ? 0 : calcDamage(rng, f, vs, move(s.id), false).damage)));
    const taken = Math.max(0, ...vs.mon.moves.map((s) => (move(s.id).cat === 'status' ? 0 : calcDamage(rng, vs, f, move(s.id), false).damage)));
    const score = dealt / Math.max(1, vs.mon.hp) - taken / Math.max(1, f.mon.hp);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}
