import type { Dir } from '../core/input';
import type { Rng } from '../core/rng';
import { createMon, isAlive, type Mon } from './mon';

export type ControlMode = 'auto' | 'touch' | 'keys';

export interface Options {
  textSpeed: 0 | 1 | 2;
  music: boolean;
  sfx: boolean;
  battleAnim: boolean;
  /** which interface the page shows: virtual handheld (touch) or keyboard + mouse */
  controls: ControlMode;
  /** KeyboardEvent.code values bound to START and SELECT */
  startKeys: string[];
  selectKeys: string[];
  /** save automatically at safe moments (new areas, story events, every few minutes) */
  autosave: boolean;
}

export const DEFAULT_OPTIONS: Options = {
  textSpeed: 1,
  music: true,
  sfx: true,
  battleAnim: true,
  controls: 'auto',
  startKeys: ['KeyM', 'ShiftLeft', 'ShiftRight'],
  selectKeys: ['KeyN'],
  autosave: true,
};

export interface GameState {
  version: 2;
  name: string;
  rival: string;
  map: string;
  x: number;
  y: number;
  dir: Dir;
  money: number;
  badges: string[];
  party: Mon[];
  box: Mon[];
  bag: Record<string, number>;
  flags: Record<string, boolean>;
  seen: number[];
  caught: number[];
  heal: { map: string; x: number; y: number };
  repel: number;
  steps: number;
  /** seconds */
  playTime: number;
  seed: number;
  uid: number;
  starter: number;
  savedAt: number;
  /** riding the driftboard */
  surfing?: boolean;
}

export function newState(rng: Rng): GameState {
  return {
    version: 2,
    name: 'REN',
    rival: 'VEX',
    map: 'home',
    x: 2,
    y: 5,
    dir: 'down',
    money: 3000,
    badges: [],
    party: [],
    box: [],
    bag: { potion: 1 },
    flags: {},
    seen: [],
    caught: [],
    heal: { map: 'home', x: 2, y: 5 },
    repel: 0,
    steps: 0,
    playTime: 0,
    seed: Math.floor(rng.next() * 2 ** 31),
    uid: 1,
    starter: 0,
    savedAt: 0,
  };
}

export const BADGES = ['BOULDER', 'RIPPLE', 'SPARK', 'BLOOM', 'VENOM', 'MIND', 'CINDER', 'FROST'] as const;
export const BADGE_COLORS = ['#a08850', '#4890f0', '#f0c828', '#58b848', '#a858c0', '#f060a0', '#f07830', '#78d0e8'];

export function flag(s: GameState, k: string): boolean {
  return !!s.flags[k];
}

export function setFlag(s: GameState, k: string, v = true) {
  if (v) s.flags[k] = true;
  else delete s.flags[k];
}

export function addItem(s: GameState, id: string, n = 1) {
  s.bag[id] = (s.bag[id] ?? 0) + n;
}

export function removeItem(s: GameState, id: string, n = 1): boolean {
  const c = s.bag[id] ?? 0;
  if (c < n) return false;
  if (c - n <= 0) delete s.bag[id];
  else s.bag[id] = c - n;
  return true;
}

export function itemCount(s: GameState, id: string): number {
  return s.bag[id] ?? 0;
}

export function markSeen(s: GameState, sp: number) {
  if (!s.seen.includes(sp)) s.seen.push(sp);
}

export function markCaught(s: GameState, sp: number) {
  markSeen(s, sp);
  if (!s.caught.includes(sp)) s.caught.push(sp);
}

export function newMon(s: GameState, sp: number, lvl: number, rng: Rng, ot?: string): Mon {
  return createMon(sp, lvl, rng, s.uid++, ot ?? s.name);
}

/** Adds to the party, or to storage if the party is full. Returns where it went. */
export function receiveMon(s: GameState, m: Mon): 'party' | 'box' {
  markCaught(s, m.sp);
  if (s.party.length < 6) {
    s.party.push(m);
    return 'party';
  }
  s.box.push(m);
  return 'box';
}

export function anyAlive(s: GameState): boolean {
  return s.party.some(isAlive);
}

export function hasBadge(s: GameState, b: string) {
  return s.badges.includes(b);
}
