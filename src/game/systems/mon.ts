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

export function expFor(lvl: number): number {
  if (lvl <= 1) return 0;
  return Math.floor(0.8 * lvl * lvl * lvl);
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
export function expReward(foe: Mon, trainer: boolean): number {
  const s = species(foe.sp);
  return Math.max(1, Math.floor(((s.expYield * foe.lvl) / 5) * (trainer ? 1.5 : 1)));
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
