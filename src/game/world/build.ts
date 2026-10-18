import { tileIdx } from '../art/tiles';
import type { MapDef, NpcDef } from './types';

export const OUT: Record<string, string> = {
  '.': 'grass',
  ',': 'tallgrass',
  ':': 'path',
  s: 'sand',
  f: 'flower',
  T: 'tree',
  '~': 'water',
  _: 'ledge',
  '#': 'fence',
  S: 'sign',
  b: 'bridge',
  M: 'cliff',
  C: 'cavemouth',
  R: 'rock',
  B: 'bush',
  x: 'void',
};

export const IN: Record<string, string> = {
  W: 'iwall',
  n: 'iwallwin',
  '.': 'floor',
  '=': 'tiles',
  '%': 'marble',
  m: 'mat',
  B: 'bookshelf',
  c: 'counter',
  t: 'table',
  k: 'podtable',
  P: 'pc',
  p: 'plant',
  d: 'bed',
  H: 'healer',
  r: 'rug',
  x: 'void',
  L: 'machine',
  o: 'statue',
  z: 'stairs',
  V: 'tv',
  '*': 'carpet',
  g: 'goldcarpet',
  l: 'gymfloor_leaf',
  F: 'gymfloor_flame',
  i: 'gymfloor_frost',
  s: 'spirefloor',
  w: 'spirewall',
  A: 'pedestal',
};

export const CAVE: Record<string, string> = {
  w: 'cavewall',
  g: 'cavefloor',
  R: 'caverock',
  e: 'caveexit',
  '*': 'crystal',
};

type MapInit = Omit<MapDef, 'tiles' | 'w' | 'h' | 'border' | 'warps' | 'npcs' | 'signs' | 'items' | 'triggers'> &
  Partial<Pick<MapDef, 'warps' | 'npcs' | 'signs' | 'items' | 'triggers'>> & {
    rows: string[];
    legend: Record<string, string>;
    border: string;
  };

export function makeMap(init: MapInit): MapDef {
  const { rows, legend, border, ...rest } = init;
  const w = rows[0].length;
  rows.forEach((r, i) => {
    if (r.length !== w) throw new Error(`Map ${init.id}: row ${i} has width ${r.length}, expected ${w}`);
  });
  const tiles: number[] = [];
  for (const r of rows)
    for (const ch of r) {
      const name = legend[ch];
      if (!name) throw new Error(`Map ${init.id}: unknown tile char '${ch}'`);
      tiles.push(tileIdx(name));
    }
  return {
    warps: [],
    npcs: [],
    signs: [],
    items: [],
    triggers: [],
    ...rest,
    w,
    h: rows.length,
    tiles,
    border: tileIdx(border),
  };
}

export function setTile(m: MapDef, x: number, y: number, name: string) {
  m.tiles[y * m.w + x] = tileIdx(name);
}

export type BuildingKind = 'house' | 'haven' | 'mart' | 'gym' | 'lab' | 'museum' | 'spire' | 'hall';

/** Stamps a 4-row building and returns its door position. */
export function building(m: MapDef, x: number, y: number, w: number, roof: string, kind: BuildingKind) {
  const doorX = x + Math.floor(w / 2);
  for (let i = 0; i < w; i++) {
    const part = i === 0 ? 'L' : i === w - 1 ? 'R' : '';
    setTile(m, x + i, y, `roof_${roof}_T${part}`);
    setTile(m, x + i, y + 1, `roof_${roof}_B${part}`);
    const wallName = i === 0 ? 'wallL' : i === w - 1 ? 'wallR' : 'wall';
    setTile(m, x + i, y + 2, wallName);
    setTile(m, x + i, y + 3, wallName);
  }
  const winCols = w >= 5 ? [1, w - 2] : [];
  for (const c of winCols) {
    setTile(m, x + c, y + 2, 'window');
    if (w >= 7) setTile(m, x + c, y + 3, 'window');
  }
  const plaque: Partial<Record<BuildingKind, string>> = {
    haven: 'plaqueH',
    mart: 'plaqueM',
    gym: 'plaqueG',
    museum: 'plaqueS',
    hall: 'plaqueG',
  };
  if (plaque[kind]) setTile(m, doorX, y + 2, plaque[kind]!);
  const glass = kind === 'haven' || kind === 'mart' || kind === 'museum' || kind === 'hall';
  setTile(m, doorX, y + 3, glass ? 'glassdoor' : 'door');
  return { x: doorX, y: y + 3 };
}

export interface Exit {
  map: string;
  x: number;
  y: number;
}

/** Warp pair for the 2-tile mat at the bottom of an interior. */
export function matWarps(matX: number, matY: number, exit: Exit) {
  return [
    { x: matX, y: matY, to: exit.map, tx: exit.x, ty: exit.y, dir: 'down' as const, edge: 'down' as const },
    { x: matX + 1, y: matY, to: exit.map, tx: exit.x, ty: exit.y, dir: 'down' as const, edge: 'down' as const },
  ];
}

export function houseInterior(id: string, name: string, exit: Exit, npcs: NpcDef[], variant = 0): MapDef {
  const rows = [
    ['WnWWWWnW', 'BB....d.', '........', '..tt....', '........', 'p......p', '........', '...mm...'],
    ['WWnWWnWW', 'B.....VB', '........', '...tt...', '...tt...', '........', 'p......p', '...mm...'],
  ][variant % 2];
  return makeMap({
    id,
    name,
    rows,
    legend: IN,
    border: 'void',
    music: 'town',
    outdoor: false,
    warps: matWarps(3, 7, exit),
    npcs,
    signs: [{ x: 0, y: 1, text: 'Shelves of travel guides and old Wildkin almanacs.' }],
  });
}

export function havenInterior(id: string, name: string, exit: Exit, extra: NpcDef[] = []): MapDef {
  return makeMap({
    id,
    name,
    rows: ['WWnWWWWnWW', '===H======', '==cccccc=P', '==========', 'p=rr======', '==rr=====p', '==========', '====mm===='],
    legend: IN,
    border: 'void',
    music: 'haven',
    outdoor: false,
    warps: matWarps(4, 7, exit),
    havenSpot: { x: 4, y: 3 },
    npcs: [{ id: 'keeper', x: 4, y: 1, dir: 'down', look: 'keeper', talk: async (c) => c.heal() }, ...extra],
    signs: [
      {
        x: 9,
        y: 2,
        text: async (c) => {
          await c.say('{PLAYER} booted up the LINK TERMINAL.');
          await c.storage();
        },
      },
    ],
  });
}

export function martInterior(id: string, name: string, exit: Exit, stock: string[], extra: NpcDef[] = []): MapDef {
  return makeMap({
    id,
    name,
    rows: ['WWnWWnWW', '=====BBB', 'cccc====', '=====BBB', '========', 'p====BBB', '========', '===mm==='],
    legend: IN,
    border: 'void',
    music: 'haven',
    outdoor: false,
    warps: matWarps(3, 7, exit),
    npcs: [
      {
        id: 'clerk',
        x: 1,
        y: 1,
        dir: 'down',
        look: 'clerk',
        talk: async (c) => {
          await c.say('Welcome to the MARKET! How can I help?');
          await c.shop(stock);
        },
      },
      ...extra,
    ],
    signs: [
      { x: 5, y: 1, text: 'Neatly stacked boxes of CAPTURE PODS.' },
      { x: 5, y: 3, text: 'Bottles of POTION in every size.' },
      { x: 5, y: 5, text: 'A display of hiking gear.' },
    ],
  });
}
