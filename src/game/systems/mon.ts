import type { Rng } from '../core/rng';
import { move, type Status } from '../data/moves';
import { species, type Species } from '../data/species';

export interface MoveSlot {
  id: string;
  pp: number;
}

export interface Mon {
  uid: number;
  sp: number;
  nick: string | null;
  lvl: number;
  exp: number;
  hp: number;
  moves: MoveSlot[];
  status: Status | null;
  /** remaining sleep turns */
  sleep: number;
  /** individual values 0-15: hp, atk, def, spd, spc */
  iv: [number, number, number, number, number];
  ot: string;
}

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  spc: number;
}

export const MAX_LEVEL = 100;

/** Exp needed to reach a level: the classic "medium fast" curve, level cubed. */
export function expFor(lvl: number): number {
  if (lvl <= 1) return 0;
  return lvl * lvl * lvl;
}

export function stats(m: Mon): Stats {
  const s = species(m.sp);
  const calc = (i: number) => Math.floor(((s.base[i] + m.iv[i]) * 2 * m.lvl) / 100);
  return {
    hp: calc(0) + m.lvl + 10,
    atk: calc(1) + 5,
    def: calc(2) + 5,
    spd: calc(3) + 5,
    spc: calc(4) + 5,
  };
}

export function maxHp(m: Mon): number {
  return stats(m).hp;
}

export function monName(m: Mon): string {
  return m.nick ?? species(m.sp).name.toUpperCase();
}

export function movesAt(s: Species, lvl: number): string[] {
  return s.learn.filter(([l]) => l === lvl).map(([, id]) => id);
}

export function createMon(sp: number, lvl: number, rng: Rng, uid: number, ot = ''): Mon {
  const s = species(sp);
  const known: string[] = [];
  for (const [l, id] of s.learn) {
    if (l <= lvl && !known.includes(id)) {
      known.push(id);
      if (known.length > 4) known.shift();
    }
  }
  const m: Mon = {
    uid,
    sp,
    nick: null,
    lvl,
    exp: expFor(lvl),
    hp: 1,
    moves: known.map((id) => ({ id, pp: move(id).pp })),
    status: null,
    sleep: 0,
    iv: [rng.int(16), rng.int(16), rng.int(16), rng.int(16), rng.int(16)],
    ot,
  };
  m.hp = maxHp(m);
  return m;
}

export function healMon(m: Mon) {
  m.hp = maxHp(m);
  m.status = null;
  m.sleep = 0;
  for (const mv of m.moves) mv.pp = move(mv.id).pp;
}

/** Restore PP: amount per move (99 = full). */
export function restorePP(m: Mon, amount: number): boolean {
  let any = false;
  for (const mv of m.moves) {
    const max = move(mv.id).pp;
    if (mv.pp < max) {
      mv.pp = Math.min(max, mv.pp + amount);
      any = true;
    }
  }
  return any;
}

export function isAlive(m: Mon): boolean {
  return m.hp > 0;
}

/** Experience gained for defeating `foe`. */
/**
 * Experience for knocking out `foe`, as earned by a Wildkin of level
 * `receiver`. Classic base (yield x level / 7, x1.5 from trainers) scaled by
 * the level gap: foes more than 5 levels below the receiver give less (half its level: about 60-75%,
 * a quarter of it: about 30%, never under 25%),
 * foes above give up to 1.5x, so grinding weak Wildkin stops paying and
 * under-levelled team members catch up.
 */
/**
 * Basic-stage Wildkin have generous exp yields compared with the classics
 * (about 1.7x), and early routes are full of them, which is what pushed teams
 * far past the early gyms. Their yield is trimmed here; final stages are unchanged.
 */
const STAGE_YIELD = [0.6, 0.82, 1];

export function expReward(foe: Mon, trainer: boolean, receiver = foe.lvl): number {
  const s = species(foe.sp);
  const base = ((s.expYield * (STAGE_YIELD[s.stage] ?? 1) * foe.lvl) / 7) * (trainer ? 1.5 : 1);
  // the first 5 levels of difference are free, so training a few levels above the local Wildkin stays reasonable
  const eff = receiver > foe.lvl ? Math.max(foe.lvl, receiver - 5) : receiver;
  const gap = ((2 * foe.lvl + 10) / (foe.lvl + eff + 10)) ** 2;
  return Math.max(1, Math.floor(base * Math.min(1.5, Math.max(0.25, gap))));
}

/** Bench Wildkin at least this many levels below the team's strongest get a catch-up share. */
export const CATCH_UP_GAP = 3;
/** Fraction of a knockout's exp a lagging bench Wildkin receives... */
export const CATCH_UP_SHARE = 0.25;
/** ...or this much once it trails by FAR_BEHIND levels or more, so new or neglected members can rejoin. */
export const CATCH_UP_FAR_SHARE = 0.5;
export const FAR_BEHIND = 6;

/** The catch-up fraction for a bench Wildkin of level `lvl` when the team's strongest is `top` (0 = none). */
export function catchUpShare(lvl: number, top: number): number {
  const gap = top - lvl;
  if (gap >= FAR_BEHIND) return CATCH_UP_FAR_SHARE;
  if (gap >= CATCH_UP_GAP) return CATCH_UP_SHARE;
  return 0;
}

export interface LevelEvent {
  lvl: number;
  before: Stats;
  after: Stats;
  learn: string[];
}

/** Adds experience and returns one event per level gained. HP rises with max HP. */
export function addExp(m: Mon, amount: number): LevelEvent[] {
  const evs: LevelEvent[] = [];
  m.exp += amount;
  while (m.lvl < MAX_LEVEL && m.exp >= expFor(m.lvl + 1)) {
    const before = stats(m);
    m.lvl++;
    const after = stats(m);
    if (m.hp > 0) m.hp += after.hp - before.hp;
    evs.push({ lvl: m.lvl, before, after, learn: movesAt(species(m.sp), m.lvl) });
  }
  if (m.lvl >= MAX_LEVEL) m.exp = Math.min(m.exp, expFor(MAX_LEVEL));
  return evs;
}

export function knowsMove(m: Mon, id: string) {
  return m.moves.some((x) => x.id === id);
}

/** Pending evolution for this mon, if its level qualifies. */
export function evolutionFor(m: Mon): number | null {
  const s = species(m.sp);
  const e = s.evos.find((x) => x.lvl && m.lvl >= x.lvl);
  return e ? e.to : null;
}

/** Evolution triggered by using a shard item on this mon. */
export function evolutionByItem(m: Mon, itemId: string): number | null {
  const e = species(m.sp).evos.find((x) => x.item === itemId);
  return e ? e.to : null;
}

export function evolve(m: Mon, to: number) {
  const before = maxHp(m);
  m.sp = to;
  const after = maxHp(m);
  if (m.hp > 0) m.hp += after - before;
}
