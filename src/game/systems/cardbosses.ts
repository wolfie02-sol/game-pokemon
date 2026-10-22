import type { GameState } from './state';

/**
 * Card bosses: after you beat these trainers once, talking to them again offers
 * a CARD CHALLENGE, a rematch with a team scaled to your level and a chance at
 * a real card. The server decides the odds and enforces the daily limit; ids
 * must match BOSSES in server/src/config.js.
 */
export const CARD_BOSSES = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'e4_1', 'e4_2', 'e4_3', 'e4_4', 'champ'] as const;

export function isCardBoss(trainerId: string): boolean {
  return (CARD_BOSSES as readonly string[]).includes(trainerId);
}

/** Level of the player's strongest Wildkin. */
export function strongestLevel(s: GameState): number {
  return s.party.reduce((m, p) => Math.max(m, p.lvl), 1);
}

/**
 * The rematch team: same Wildkin, levelled up to match the player. The ace
 * sits a few levels above the player, later bosses push harder, and nobody is
 * ever weaker than in the original fight.
 */
export function rematchTeam(base: [number, number][], playerLevel: number, trainerId: string): [number, number][] {
  const tier = Math.max(0, CARD_BOSSES.indexOf(trainerId as (typeof CARD_BOSSES)[number]));
  const bonus = Math.floor(tier / 3);
  const n = base.length;
  return base.map(([sp, lvl], i) => {
    const step = n > 1 ? Math.round((i * 3) / (n - 1)) : 3;
    return [sp, Math.min(100, Math.max(lvl, playerLevel - 2 + step + bonus))];
  });
}

/** What the page (React) provides so card battles can talk to the rewards server. */
export interface CardHooks {
  preview(boss: string, level: number): Promise<{ odds: number; left: number; limit: number; eligible: boolean; need: number; resetsInSec: number }>;
  start(boss: string, level: number): Promise<{ battleId: number; left: number; limit: number }>;
  finish(battleId: number, won: boolean): Promise<{ won: boolean; card?: string; note?: string }>;
}
