/**
 * The fifteen Wildkin types. Names are original; the matchup web follows the
 * classic handheld rules so every type has clear strengths and weaknesses.
 */
export type Element =
  | 'BEAST'
  | 'FLAME'
  | 'TIDE'
  | 'LEAF'
  | 'VOLT'
  | 'FROST'
  | 'BRAWL'
  | 'TOXIN'
  | 'EARTH'
  | 'GALE'
  | 'MIND'
  | 'SWARM'
  | 'STONE'
  | 'SHADE'
  | 'WYRM';

export const ELEMENTS: Element[] = [
  'BEAST',
  'FLAME',
  'TIDE',
  'LEAF',
  'VOLT',
  'FROST',
  'BRAWL',
  'TOXIN',
  'EARTH',
  'GALE',
  'MIND',
  'SWARM',
  'STONE',
  'SHADE',
  'WYRM',
];

/** attacker -> defender -> multiplier (missing entries are 1x). */
const CHART: Record<Element, Partial<Record<Element, number>>> = {
  BEAST: { STONE: 0.5, SHADE: 0 },
  FLAME: { FLAME: 0.5, TIDE: 0.5, LEAF: 2, FROST: 2, SWARM: 2, STONE: 0.5, WYRM: 0.5 },
  TIDE: { FLAME: 2, TIDE: 0.5, LEAF: 0.5, EARTH: 2, STONE: 2, WYRM: 0.5 },
  LEAF: { FLAME: 0.5, TIDE: 2, LEAF: 0.5, TOXIN: 0.5, EARTH: 2, GALE: 0.5, SWARM: 0.5, STONE: 2, WYRM: 0.5 },
  VOLT: { TIDE: 2, LEAF: 0.5, VOLT: 0.5, EARTH: 0, GALE: 2, WYRM: 0.5 },
  FROST: { TIDE: 0.5, LEAF: 2, FROST: 0.5, EARTH: 2, GALE: 2, WYRM: 2 },
  BRAWL: { BEAST: 2, FROST: 2, TOXIN: 0.5, GALE: 0.5, MIND: 0.5, SWARM: 0.5, STONE: 2, SHADE: 0 },
  TOXIN: { LEAF: 2, TOXIN: 0.5, EARTH: 0.5, SWARM: 2, STONE: 0.5, SHADE: 0.5 },
  EARTH: { FLAME: 2, LEAF: 0.5, VOLT: 2, TOXIN: 2, GALE: 0, SWARM: 0.5, STONE: 2 },
  GALE: { LEAF: 2, VOLT: 0.5, BRAWL: 2, SWARM: 2, STONE: 0.5 },
  MIND: { BRAWL: 2, TOXIN: 2, MIND: 0.5 },
  SWARM: { FLAME: 0.5, LEAF: 2, BRAWL: 0.5, TOXIN: 2, GALE: 0.5, MIND: 2, SHADE: 0.5 },
  STONE: { FLAME: 2, FROST: 2, BRAWL: 0.5, EARTH: 0.5, GALE: 2, SWARM: 2 },
  SHADE: { BEAST: 0, MIND: 2, SHADE: 2 },
  WYRM: { WYRM: 2 },
};

export function effectiveness(atk: Element, def: Element[]): number {
  let m = 1;
  for (const d of def) m *= CHART[atk][d] ?? 1;
  return m;
}

/** Plain-language matchup summary used by gym guides and the Wildex. */
export function weaknesses(def: Element[]): Element[] {
  return ELEMENTS.filter((a) => effectiveness(a, def) > 1);
}
