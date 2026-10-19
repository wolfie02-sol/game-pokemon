import type { Element } from './elements';
import { MOVES } from './moves';
import type { Status } from './moves';
import type { Species } from './species';

export type ItemKind =
  | 'heal'
  | 'cure'
  | 'revive'
  | 'pp'
  | 'pod'
  | 'field'
  | 'key'
  | 'candy'
  | 'evo'
  | 'tm'
  | 'xstat';

export interface ItemDef {
  id: string;
  name: string;
  price: number;
  kind: ItemKind;
  /** heal amount (9999 = full), pod multiplier, repel steps, revive fraction */
  value: number;
  battle: boolean;
  field: boolean;
  desc: string;
  /** status cured (cure items without it cure everything) */
  cures?: Status[];
  /** TM: the move taught */
  move?: string;
  /** X items: stat raised */
  stat?: 'atk' | 'def' | 'spd' | 'spc' | 'acc';
}

const I = (i: ItemDef) => i;

export const TM_MOVES = [
  'rally', 'swipes', 'mudvolley', 'iceneedle', 'glacierbeam', 'whiteout', 'ram', 'overdrive', 'edgechop', 'mountaintoss',
  'riptide', 'arcbolt', 'thunderclap', 'earthshake', 'burrow', 'psyblast', 'mindveil', 'mirrorward', 'restore', 'nap',
  'venomseep', 'cragedge', 'flareburst', 'sunlance', 'shadepulse', 'drillbeak', 'rush', 'crushjaw', 'lastblaze', 'wyrmfury',
];

const TM_PRICE: Record<string, number> = { rally: 2000, ram: 3000, iceneedle: 2000, mudvolley: 2000, swipes: 2000, edgechop: 2000, nap: 3000, rush: 4000 };

export const TM_IDS = TM_MOVES.map((_, k) => `tm${String(k + 1).padStart(2, '0')}`);

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(
  [
    // pods
    I({ id: 'pod', name: 'Capture Pod', price: 200, kind: 'pod', value: 1, battle: true, field: false, desc: 'A pod for catching wild Wildkin.' }),
    I({ id: 'greatpod', name: 'Great Pod', price: 600, kind: 'pod', value: 1.5, battle: true, field: false, desc: 'A better pod. Higher catch rate.' }),
    I({ id: 'ultrapod', name: 'Ultra Pod', price: 1200, kind: 'pod', value: 2, battle: true, field: false, desc: 'A top-grade pod for tough catches.' }),
    I({ id: 'masterpod', name: 'Master Pod', price: 0, kind: 'pod', value: 255, battle: true, field: false, desc: 'Catches any wild Wildkin without fail.' }),
    // medicine
    I({ id: 'potion', name: 'Potion', price: 300, kind: 'heal', value: 20, battle: true, field: true, desc: 'Restores 20 HP.' }),
    I({ id: 'superpotion', name: 'Super Potion', price: 700, kind: 'heal', value: 50, battle: true, field: true, desc: 'Restores 50 HP.' }),
    I({ id: 'hyperpotion', name: 'Hyper Potion', price: 1500, kind: 'heal', value: 200, battle: true, field: true, desc: 'Restores 200 HP.' }),
    I({ id: 'maxpotion', name: 'Max Potion', price: 2500, kind: 'heal', value: 9999, battle: true, field: true, desc: 'Fully restores HP.' }),
    I({ id: 'antidote', name: 'Antidote', price: 100, kind: 'cure', value: 0, battle: true, field: true, cures: ['PSN', 'TOX'], desc: 'Cures poison.' }),
    I({ id: 'burnsalve', name: 'Burn Salve', price: 250, kind: 'cure', value: 0, battle: true, field: true, cures: ['BRN'], desc: 'Heals a burn.' }),
    I({ id: 'wakebell', name: 'Wake Bell', price: 250, kind: 'cure', value: 0, battle: true, field: true, cures: ['SLP'], desc: 'Wakes a sleeping Wildkin.' }),
    I({ id: 'thawdrop', name: 'Thaw Drop', price: 250, kind: 'cure', value: 0, battle: true, field: true, cures: ['FRZ'], desc: 'Thaws a frozen Wildkin.' }),
    I({ id: 'unnumb', name: 'Unnumb Gel', price: 200, kind: 'cure', value: 0, battle: true, field: true, cures: ['PAR'], desc: 'Cures paralysis.' }),
    I({ id: 'fullcure', name: 'Full Cure', price: 600, kind: 'cure', value: 0, battle: true, field: true, desc: 'Cures any status problem.' }),
    I({ id: 'fullrestore', name: 'Full Restore', price: 3000, kind: 'heal', value: 99999, battle: true, field: true, desc: 'Full HP and cures status.' }),
    I({ id: 'revive', name: 'Revive', price: 1500, kind: 'revive', value: 0.5, battle: true, field: true, desc: 'Revives a fainted Wildkin.' }),
    I({ id: 'maxrevive', name: 'Max Revive', price: 0, kind: 'revive', value: 1, battle: true, field: true, desc: 'Revives with full HP.' }),
    I({ id: 'ether', name: 'Ether', price: 0, kind: 'pp', value: 10, battle: true, field: true, desc: 'Restores 10 PP to every move.' }),
    I({ id: 'elixir', name: 'Elixir', price: 0, kind: 'pp', value: 99, battle: true, field: true, desc: 'Fully restores PP of every move.' }),
    // battle boosters
    I({ id: 'xattack', name: 'X Attack', price: 500, kind: 'xstat', value: 1, stat: 'atk', battle: true, field: false, desc: 'Raises ATTACK in battle.' }),
    I({ id: 'xdefend', name: 'X Defend', price: 550, kind: 'xstat', value: 1, stat: 'def', battle: true, field: false, desc: 'Raises DEFENSE in battle.' }),
    I({ id: 'xspeed', name: 'X Speed', price: 350, kind: 'xstat', value: 1, stat: 'spd', battle: true, field: false, desc: 'Raises SPEED in battle.' }),
    I({ id: 'xspecial', name: 'X Special', price: 350, kind: 'xstat', value: 1, stat: 'spc', battle: true, field: false, desc: 'Raises SPECIAL in battle.' }),
    I({ id: 'xaccuracy', name: 'X Accuracy', price: 950, kind: 'xstat', value: 1, stat: 'acc', battle: true, field: false, desc: 'Raises accuracy in battle.' }),
    // field
    I({ id: 'repel', name: 'Repel Spray', price: 350, kind: 'field', value: 100, battle: false, field: true, desc: 'Keeps weak wild Wildkin away.' }),
    I({ id: 'superrepel', name: 'Super Repel', price: 500, kind: 'field', value: 200, battle: false, field: true, desc: 'A longer-lasting repel.' }),
    I({ id: 'maxrepel', name: 'Max Repel', price: 700, kind: 'field', value: 250, battle: false, field: true, desc: 'The longest-lasting repel.' }),
    I({ id: 'escaperope', name: 'Escape Rope', price: 550, kind: 'field', value: 0, battle: false, field: true, desc: 'Escape a cave to the last HAVEN.' }),
    I({ id: 'candy', name: 'Rare Candy', price: 0, kind: 'candy', value: 1, battle: false, field: true, desc: 'Raises a Wildkin by 1 level.' }),
    // evolution shards
    I({ id: 'cinder', name: 'Cinder Shard', price: 2100, kind: 'evo', value: 0, battle: false, field: true, desc: 'A warm shard. Some Wildkin evolve when touched by it.' }),
    I({ id: 'ripple', name: 'Ripple Shard', price: 2100, kind: 'evo', value: 0, battle: false, field: true, desc: 'A cool blue shard that sloshes like water.' }),
    I({ id: 'spark', name: 'Spark Shard', price: 2100, kind: 'evo', value: 0, battle: false, field: true, desc: 'A shard that crackles with static.' }),
    I({ id: 'sprout', name: 'Sprout Shard', price: 2100, kind: 'evo', value: 0, battle: false, field: true, desc: 'A green shard with a leaf pattern inside.' }),
    I({ id: 'dusk', name: 'Dusk Shard', price: 0, kind: 'evo', value: 0, battle: false, field: true, desc: 'A shard as dark as a moonless night.' }),
    // key items
    I({ id: 'ferryticket', name: 'Ferry Ticket', price: 0, kind: 'key', value: 0, battle: false, field: false, desc: 'A ticket for the STARLIGHT FERRY.' }),
    I({ id: 'shears', name: 'Hedge Shears', price: 0, kind: 'key', value: 0, battle: false, field: false, desc: 'Trims hedges that block the way.' }),
    I({ id: 'driftboard', name: 'Driftboard', price: 0, kind: 'key', value: 0, battle: false, field: false, desc: 'Ride it to cross water. Face the water and press A.' }),
    I({ id: 'pick', name: 'Rock Pick', price: 0, kind: 'key', value: 0, battle: false, field: false, desc: 'Breaks cracked boulders.' }),
    I({ id: 'rod', name: 'Fishing Rod', price: 0, kind: 'key', value: 0, battle: false, field: true, desc: 'Face water and use it to fish for Wildkin.' }),
    I({ id: 'skywhistle', name: 'Sky Whistle', price: 0, kind: 'key', value: 0, battle: false, field: true, desc: 'Calls a bird to fly you to a town you have visited.' }),
    I({ id: 'lens', name: 'Spectral Lens', price: 0, kind: 'key', value: 0, battle: false, field: false, desc: 'Reveals the true shape of spirits.' }),
    I({ id: 'chime', name: 'Dawn Chime', price: 0, kind: 'key', value: 0, battle: false, field: false, desc: 'Its clear tone wakes even the deepest sleeper.' }),
    I({ id: 'manorkey', name: 'Manor Key', price: 0, kind: 'key', value: 0, battle: false, field: false, desc: 'A scorched key from the old manor.' }),
    I({ id: 'parcel', name: 'Sealed Parcel', price: 0, kind: 'key', value: 0, battle: false, field: false, desc: 'A parcel for PROF. FENN.' }),
    I({ id: 'spiralfossil', name: 'Spiral Fossil', price: 0, kind: 'key', value: 0, battle: false, field: false, desc: 'A fossil of a spiral-shelled Wildkin.' }),
    I({ id: 'shellfossil', name: 'Shell Fossil', price: 0, kind: 'key', value: 0, battle: false, field: false, desc: 'A fossil of a clawed shell Wildkin.' }),
    I({ id: 'amber', name: 'Old Amber', price: 0, kind: 'key', value: 0, battle: false, field: false, desc: 'Amber with ancient DNA inside.' }),
    I({ id: 'tea', name: 'Spring Tea', price: 0, kind: 'key', value: 0, battle: false, field: false, desc: 'A flask of warm herbal tea.' }),
    // technique machines
    ...TM_MOVES.map((m, k) =>
      I({
        id: TM_IDS[k],
        name: `TM${String(k + 1).padStart(2, '0')} ${MOVES[m].name}`.slice(0, 16),
        price: TM_PRICE[m] ?? 0,
        kind: 'tm',
        value: 0,
        move: m,
        battle: false,
        field: true,
        desc: `Teaches ${MOVES[m].name.toUpperCase()}. ${MOVES[m].desc}`,
      }),
    ),
  ].map((i) => [i.id, i]),
);

export function item(id: string): ItemDef {
  const i = ITEMS[id];
  if (!i) throw new Error('Unknown item ' + id);
  return i;
}

/** which extra types a family can pick up from TMs */
const COVER: Partial<Record<Element, Element[]>> = {
  TIDE: ['FROST'],
  FROST: ['TIDE'],
  STONE: ['EARTH'],
  EARTH: ['STONE'],
  BRAWL: ['EARTH', 'STONE'],
  WYRM: ['FLAME', 'TIDE', 'VOLT', 'FROST'],
  SHADE: ['MIND'],
  MIND: ['SHADE'],
  GALE: [],
  TOXIN: ['SHADE'],
};

export function canLearnTM(s: Species, moveId: string): boolean {
  const m = MOVES[moveId];
  if (!m) return false;
  if (s.name === 'Mudgill' || s.name === 'Larvule' || s.name === 'Cocoonix' || s.name === 'Hivecap' || s.name === 'Thornet') return false;
  if (moveId === 'lastblaze') return s.types.some((t) => t === 'STONE' || t === 'VOLT' || t === 'TOXIN');
  if (m.type === 'BEAST') return true;
  if (s.types.includes(m.type)) return true;
  for (const t of s.types) if (COVER[t]?.includes(m.type)) return true;
  // strong physical fighters pick up brawl and earth moves
  if ((m.type === 'BRAWL' || m.type === 'EARTH' || m.type === 'STONE') && s.base[1] >= 85 && s.art.arch !== 'bird' && s.art.arch !== 'fish') return true;
  // mind moves for clever, high-special Wildkin
  if (m.type === 'MIND' && s.base[4] >= 90) return true;
  return false;
}
