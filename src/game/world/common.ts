/**
 * Shared helpers for building the region: encounter tables, script snippets
 * and small NPC patterns that many towns reuse.
 */
import type { Dir } from '../core/input';
import { speciesByName } from '../data/species';
import { TRAINERS } from '../data/trainers';
import { hasBadge, type GameState } from '../systems/state';
import type { EncounterTable, NpcDef, Script, ScriptCtx } from './types';

export const not = (k: string) => (s: GameState) => !s.flags[k];
export const has = (k: string) => (s: GameState) => !!s.flags[k];
export const badges = (n: number) => (s: GameState) => s.badges.length >= n;
export const beat = (id: string) => (s: GameState) => !!s.flags['tr:' + id];

/** "Fluffin 2-4 40, Nibbit 2-5 35" */
export function enc(rate: number, spec: string): EncounterTable {
  return {
    rate,
    table: spec
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const [name, range, w] = p.split(/\s+/);
        const [min, max] = range.split('-').map(Number);
        return { sp: speciesByName(name), min, max: max ?? min, w: Number(w) };
      }),
  };
}

export async function pushBack(c: ScriptCtx, dir: Dir) {
  await c.walkPlayer([dir]);
}

export function intro(id: string): string {
  return TRAINERS[id].intro;
}

/** After a gym win: badge, prize, closing lines. */
export function leaderAfter(badge: string, gift: [string, number] | null, lines: string[]): Script {
  return async (c) => {
    await c.badge(badge);
    if (lines[0]) await c.say(lines[0]);
    if (gift) await c.give(gift[0], gift[1]);
    for (const l of lines.slice(1)) await c.say(l);
  };
}

/** NPC that hands over an item once, then repeats a line. */
export function giver(flagKey: string, item: string, n: number, first: string | string[], after: string, cond?: (s: GameState) => boolean, notYet?: string): Script {
  return async (c) => {
    if (c.flag(flagKey)) {
      await c.say(after);
      return;
    }
    if (cond && !cond(c.s)) {
      await c.say(notYet ?? after);
      return;
    }
    await c.say(first);
    c.set(flagKey);
    await c.give(item, n);
  };
}

/** NPC that gives a Wildkin once. */
export function monGiver(flagKey: string, name: string, lvl: number, ask: string, yes: string, after: string, cond?: (s: GameState) => boolean, notYet?: string): Script {
  return async (c) => {
    if (c.flag(flagKey)) {
      await c.say(after);
      return;
    }
    if (cond && !cond(c.s)) {
      await c.say(notYet ?? after);
      return;
    }
    if (!(await c.yesNo(ask))) {
      await c.say('Oh, okay. Let me know if you change your mind.');
      return;
    }
    c.set(flagKey);
    await c.receiveMon(speciesByName(name), lvl);
    if (yes) await c.say(yes);
  };
}

/** A guard who blocks a tile until a condition holds. */
export function guard(id: string, x: number, y: number, dir: Dir, until: (s: GameState) => boolean, line: string, look = 'guard'): NpcDef {
  return { id, x, y, dir, look, cond: (s) => !until(s), talk: line };
}

export function badgeGuardText(n: number, place: string) {
  return `Only trainers with ${n} or more BADGES may pass beyond this point to ${place}.`;
}

export { hasBadge };
