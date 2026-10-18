export type ItemKind = 'heal' | 'cure' | 'revive' | 'pod' | 'field' | 'key' | 'candy';

export interface ItemDef {
  id: string;
  name: string;
  price: number;
  kind: ItemKind;
  /** heal amount, pod multiplier, repel steps */
  value: number;
  battle: boolean;
  field: boolean;
  desc: string;
}

const I = (i: ItemDef) => i;

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(
  [
    I({ id: 'pod', name: 'Capture Pod', price: 200, kind: 'pod', value: 1, battle: true, field: false, desc: 'A pod for catching wild Wildkin.' }),
    I({ id: 'greatpod', name: 'Great Pod', price: 600, kind: 'pod', value: 1.5, battle: true, field: false, desc: 'A better pod. Higher catch rate.' }),
    I({ id: 'ultrapod', name: 'Ultra Pod', price: 1200, kind: 'pod', value: 2, battle: true, field: false, desc: 'A top-grade pod for tough catches.' }),
    I({ id: 'potion', name: 'Potion', price: 200, kind: 'heal', value: 20, battle: true, field: true, desc: 'Restores 20 HP.' }),
    I({ id: 'superpotion', name: 'Super Potion', price: 600, kind: 'heal', value: 50, battle: true, field: true, desc: 'Restores 50 HP.' }),
    I({ id: 'hyperpotion', name: 'Hyper Potion', price: 1200, kind: 'heal', value: 120, battle: true, field: true, desc: 'Restores 120 HP.' }),
    I({ id: 'fullcure', name: 'Full Cure', price: 300, kind: 'cure', value: 0, battle: true, field: true, desc: 'Cures any status problem.' }),
    I({ id: 'revive', name: 'Revive', price: 1500, kind: 'revive', value: 0.5, battle: true, field: true, desc: 'Revives a fainted Wildkin.' }),
    I({ id: 'repel', name: 'Repel Spray', price: 350, kind: 'field', value: 100, battle: false, field: true, desc: 'Keeps weak wild Wildkin away.' }),
    I({ id: 'escaperope', name: 'Escape Rope', price: 500, kind: 'field', value: 0, battle: false, field: true, desc: 'Escape to the last HAVEN.' }),
    I({ id: 'candy', name: 'Rare Candy', price: 0, kind: 'candy', value: 1, battle: false, field: true, desc: 'Raises a Wildkin by 1 level.' }),
    I({ id: 'embercore', name: 'Ember Core', price: 0, kind: 'key', value: 0, battle: false, field: false, desc: 'A warm stone. It hums faintly.' }),
  ].map((i) => [i.id, i]),
);

export function item(id: string): ItemDef {
  const i = ITEMS[id];
  if (!i) throw new Error('Unknown item ' + id);
  return i;
}
