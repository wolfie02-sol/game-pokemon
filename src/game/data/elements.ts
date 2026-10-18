export type Element =
  | 'BEAST'
  | 'FLAME'
  | 'TIDE'
  | 'LEAF'
  | 'VOLT'
  | 'FROST'
  | 'STONE'
  | 'GALE'
  | 'TOXIN'
  | 'MIND'
  | 'SHADE'
  | 'SPIRIT';

export const ELEMENTS: Element[] = [
  'BEAST',
  'FLAME',
  'TIDE',
  'LEAF',
  'VOLT',
  'FROST',
  'STONE',
  'GALE',
  'TOXIN',
  'MIND',
  'SHADE',
  'SPIRIT',
];

/** attacker -> defender -> multiplier (missing entries are 1x). */
const CHART: Partial<Record<Element, Partial<Record<Element, number>>>> = {
  BEAST: { STONE: 0.5, SHADE: 0 },
  FLAME: { LEAF: 2, FROST: 2, FLAME: 0.5, TIDE: 0.5, STONE: 0.5 },
  TIDE: { FLAME: 2, STONE: 2, TIDE: 0.5, LEAF: 0.5 },
  LEAF: { TIDE: 2, STONE: 2, FLAME: 0.5, LEAF: 0.5, GALE: 0.5, TOXIN: 0.5 },
  VOLT: { TIDE: 2, GALE: 2, LEAF: 0.5, VOLT: 0.5, STONE: 0 },
  FROST: { LEAF: 2, GALE: 2, FLAME: 0.5, FROST: 0.5, TIDE: 0.5 },
  STONE: { FLAME: 2, FROST: 2, GALE: 2, VOLT: 2, LEAF: 0.5 },
  GALE: { LEAF: 2, STONE: 0.5, VOLT: 0.5 },
  TOXIN: { LEAF: 2, SPIRIT: 2, TOXIN: 0.5, STONE: 0.5, SHADE: 0.5 },
  MIND: { TOXIN: 2, MIND: 0.5, SHADE: 0 },
  SHADE: { MIND: 2, SHADE: 2, SPIRIT: 0.5, BEAST: 0 },
  SPIRIT: { SHADE: 2, TOXIN: 0.5, FLAME: 0.5 },
};

export function effectiveness(atk: Element, def: Element[]): number {
  let m = 1;
  for (const d of def) m *= CHART[atk]?.[d] ?? 1;
  return m;
}
