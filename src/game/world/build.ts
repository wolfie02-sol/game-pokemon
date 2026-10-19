import { TILES, tileIdx } from '../art/tiles';
import type { Dir } from '../core/input';
import type { MapDef, NpcDef, SignDef, Warp } from './types';

/** Outdoor legend (green country). Regional legends override a few keys. */
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
  d: 'dock',
  M: 'cliff',
  C: 'cavemouth',
  R: 'rock',
  O: 'searock',
  K: 'crackrock',
  B: 'bush',
  L: 'lamp',
  k: 'crate',
  F: 'fountain',
  m: 'marsh',
  x: 'void',
};

const PROPS = (sfx: string) => ({ S: 'sign_' + sfx, L: 'lamp_' + sfx, R: 'rock_' + sfx, K: 'crackrock_' + sfx, '#': 'fence_' + sfx, _: 'ledge_' + sfx, B: 'bush_' + sfx });
export const SNOW: Record<string, string> = { ...OUT, ...PROPS('snow'), '.': 'snow', ',': 'snowgrass', T: 'snowtree', f: 'snow' };
export const ASH: Record<string, string> = { ...OUT, ...PROPS('ash'), '.': 'ash', ',': 'ashgrass', T: 'deadtree', f: 'ash' };

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
  s: 'spirefloor',
  w: 'spirewall',
  A: 'pedestal',
};

export const CAVE: Record<string, string> = {
  w: 'cavewall',
  g: 'cavefloor',
  R: 'caverock',
  K: 'cavecrack',
  e: 'caveexit',
  '*': 'crystal',
  h: 'ladder',
  u: 'ladderup',
  '~': 'water',
  b: 'bridge',
};
export const ICECAVE: Record<string, string> = { ...CAVE, w: 'icewall', g: 'icefloor', R: 'icerock' };
export const MAGMA: Record<string, string> = { ...CAVE, w: 'magmawall', g: 'magmafloor', '~': 'lava' };

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
    ground: legend['.'] === 'snow' ? 'snow' : legend['.'] === 'ash' ? 'ash' : 'grass',
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

export function tileName(m: MapDef, x: number, y: number): string {
  return TILES[m.tiles[y * m.w + x]].name;
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
  const glass = kind === 'haven' || kind === 'mart' || kind === 'museum' || kind === 'hall' || kind === 'lab';
  setTile(m, doorX, y + 3, glass ? 'glassdoor' : 'door');
  return { x: doorX, y: y + 3 };
}

export interface Exit {
  map: string;
  x: number;
  y: number;
}

export const door = (x: number, y: number, to: string, tx: number, ty: number, dir: Dir = 'up'): Warp => ({ x, y, to, tx, ty, dir });

/** Warp pair for the 2-tile mat at the bottom of an interior. */
export function matWarps(matX: number, matY: number, exit: Exit) {
  return [
    { x: matX, y: matY, to: exit.map, tx: exit.x, ty: exit.y, dir: 'down' as const, edge: 'down' as const },
    { x: matX + 1, y: matY, to: exit.map, tx: exit.x, ty: exit.y, dir: 'down' as const, edge: 'down' as const },
  ];
}

// ------------------------------------------------------------------ world registry

const WALK = (t: number, water: boolean) => {
  const d = TILES[t];
  return !d.solid || (water && !!d.water) || !!d.cut || !!d.smash;
};

export class World {
  maps: Record<string, MapDef> = {};

  add<T extends MapDef>(m: T): T {
    if (this.maps[m.id]) throw new Error('Duplicate map ' + m.id);
    this.maps[m.id] = m;
    return m;
  }

  get(id: string): MapDef {
    const m = this.maps[id];
    if (!m) throw new Error('Unknown map ' + id);
    return m;
  }

  /**
   * Connect two outdoor maps edge to edge. The offset is worked out by lining up
   * the first walkable (or surfable) cell on each shared edge.
   */
  link(aId: string, dir: Dir, bId: string) {
    const a = this.get(aId);
    const b = this.get(bId);
    const edgeA = edgeCells(a, dir);
    const opp: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };
    const edgeB = edgeCells(b, opp[dir]);
    const fa = edgeA.findIndex((t) => WALK(t, true));
    const fb = edgeB.findIndex((t) => WALK(t, true));
    if (fa < 0 || fb < 0) throw new Error(`link ${aId} ${dir} ${bId}: no open edge`);
    const wa = edgeA.slice(fa).findIndex((t) => !WALK(t, true));
    const wb = edgeB.slice(fb).findIndex((t) => !WALK(t, true));
    const spanA = wa < 0 ? edgeA.length - fa : wa;
    const spanB = wb < 0 ? edgeB.length - fb : wb;
    if (spanA !== spanB) throw new Error(`link ${aId} ${dir} ${bId}: openings differ (${spanA} vs ${spanB})`);
    const off = fb - fa;
    a.connections = { ...a.connections, [dir]: { map: bId, offset: off } };
    b.connections = { ...b.connections, [opp[dir]]: { map: aId, offset: -off } };
  }
}

/**
 * Where a road reaches a map edge, the gap in the tree line on the neighbouring
 * map is often plain ground. Pave that one edge tile when the road carries on
 * just inside it, so roads read as continuous when crossing between maps.
 */
export function joinEdgeRoads(maps: Record<string, MapDef>) {
  const isRoad = (t: number) => /^(path|road)/.test(TILES[t].name);
  const isGround = (t: number) => /^(grass|snow|ash|sand)$/.test(TILES[t].name);
  const isTree = (t: number) => /tree/.test(TILES[t].name);
  const step: Record<Dir, [number, number]> = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] };
  const cell = (m: MapDef, dir: Dir, i: number, depth: number): [number, number] => {
    const [dx, dy] = step[dir];
    if (dir === 'up') return [i, depth * dy];
    if (dir === 'down') return [i, m.h - 1 + depth * dy];
    if (dir === 'left') return [depth * dx, i];
    return [m.w - 1 + depth * dx, i];
  };
  const at = (m: MapDef, [x, y]: [number, number]) => (x >= 0 && y >= 0 && x < m.w && y < m.h ? m.tiles[y * m.w + x] : -1);
  const opp: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };
  for (const a of Object.values(maps)) {
    for (const dir of Object.keys(a.connections ?? {}) as Dir[]) {
      const c = a.connections![dir]!;
      const b = maps[c.map];
      const n = dir === 'up' || dir === 'down' ? a.w : a.h;
      for (let i = 0; i < n; i++) {
        const j = i + c.offset;
        const ea = cell(a, dir, i, 0), eb = cell(b, opp[dir], j, 0);
        const ta = at(a, ea), tb = at(b, eb);
        if (ta < 0 || tb < 0) continue;
        // a's edge is ground, b's edge is road, and the road resumes just inside a
        if (isGround(ta) && isRoad(tb) && isRoad(at(a, cell(a, dir, i, 1)))) a.tiles[ea[1] * a.w + ea[0]] = at(a, cell(a, dir, i, 1));
        // a's edge is a plain gap through a tree wall: carry b's road through the gap
        else if (isGround(ta) && isRoad(tb)) {
          for (let d = 0; d < 6; d++) {
            const p = cell(a, dir, i, d);
            if (!isGround(at(a, p))) break;
            const side = [cell(a, dir, i - 1, d), cell(a, dir, i + 1, d)].map((q) => at(a, q));
            if (!side.some((t) => t >= 0 && isTree(t))) break;
            a.tiles[p[1] * a.w + p[0]] = tb;
          }
        }
      }
    }
  }
}

function edgeCells(m: MapDef, dir: Dir): number[] {
  const out: number[] = [];
  if (dir === 'up' || dir === 'down') {
    const y = dir === 'up' ? 0 : m.h - 1;
    for (let x = 0; x < m.w; x++) out.push(m.tiles[y * m.w + x]);
  } else {
    const x = dir === 'left' ? 0 : m.w - 1;
    for (let y = 0; y < m.h; y++) out.push(m.tiles[y * m.w + x]);
  }
  return out;
}

// ------------------------------------------------------------------ interiors

export function houseInterior(id: string, name: string, exit: Exit, npcs: NpcDef[], variant = 0, signs?: SignDef[]): MapDef {
  const rows = [
    ['WnWWWWnW', 'BB....d.', '........', '..tt....', '........', 'p......p', '........', '...mm...'],
    ['WWnWWnWW', 'B.....VB', '........', '...tt...', '...tt...', '........', 'p......p', '...mm...'],
    ['WnWWnWWnWW', 'BB.V..BB.d', '..........', '...tt.....', '...tt.....', '..........', 'p........p', '....mm....'],
  ][variant % 3];
  const matX = variant % 3 === 2 ? 4 : 3;
  return makeMap({
    id,
    name,
    rows,
    legend: IN,
    border: 'void',
    music: 'town',
    outdoor: false,
    warps: matWarps(matX, rows.length - 1, exit),
    npcs,
    signs: signs ?? [{ x: 0, y: 1, text: 'Shelves of travel guides and old Wildkin almanacs.' }],
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

/** Gym hall: 10 wide, 14 tall, three obstacle patterns. */
export function gymInterior(id: string, name: string, floor: string, exit: Exit, npcs: NpcDef[], signText: string, layout = 0): MapDef {
  const f = floor;
  const R = (s: string) => s.replace(/_/g, f);
  const layouts = [
    ['WWnWWWWnWW', 'p________p', '__________', '__pp__pp__', '__________', 'p________p', '__________', '__pp__pp__', '__________', 'p________p', '__________', '__________', '___o__o___', '____mm____'],
    ['WWnWWWWnWW', 'p__pppp__p', '__________', 'pppp__pppp', '__________', '_pp____pp_', '__________', 'pp__pp__pp', '__________', '__pp__pp__', '__________', '__________', '___o__o___', '____mm____'],
    ['WWnWWWWnWW', 'p________p', '__________', '_pp_pp_pp_', '__________', 'pp______pp', '__________', '_pp_pp_pp_', '__________', 'pp______pp', '__________', '__________', '___o__o___', '____mm____'],
  ];
  return makeMap({
    id,
    name,
    rows: layouts[layout % 3].map(R),
    legend: { ...IN, l: 'gymfloor_leaf', F: 'gymfloor_flame', i: 'gymfloor_frost', q: 'gymfloor_stone', a: 'gymfloor_tide', v: 'gymfloor_volt', y: 'gymfloor_toxin', j: 'gymfloor_mind' },
    border: 'void',
    music: 'gym',
    outdoor: false,
    warps: matWarps(4, 13, exit),
    npcs,
    signs: [
      { x: 3, y: 12, text: signText },
      { x: 6, y: 12, text: signText },
    ],
  });
}
