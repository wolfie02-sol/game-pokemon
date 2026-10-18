/**
 * Original 16x16 tileset, painted procedurally with the same shaded,
 * outlined style as the creatures.
 */
import { makeCanvas } from '../core/gfx';
import { drawText } from '../core/font';
import { mix } from './pixel';

export const TS = 16;

export interface TileDef {
  idx: number;
  name: string;
  solid: boolean;
  grass?: boolean;
  ledge?: boolean;
  water?: boolean;
  counter?: boolean;
  /** cave floors roll encounters on maps that allow them */
  cave?: boolean;
  /** hedge the HEDGE SHEARS can trim */
  cut?: boolean;
  /** cracked boulder the ROCK PICK can break */
  smash?: boolean;
  frames: HTMLCanvasElement[];
  /** alternate looks picked per map cell to avoid visible repetition */
  variants?: HTMLCanvasElement[];
}

interface Mat {
  d: string;
  m: string;
  l: string;
}
const mat = (m: string, d?: string, l?: string): Mat => ({ m, d: d ?? mix(m, '#1a1030', 0.3), l: l ?? mix(m, '#ffffff', 0.35) });

const C = {
  ink: '#2a2238',
  g1: '#b4e07c',
  g2: '#90cc5c',
  g3: '#68a844',
  g4: '#4a8434',
  t1: '#4e9c3a',
  t2: '#2f6c2c',
  t3: '#80c654',
  p1: '#f2e0ae',
  p2: '#dec490',
  p3: '#c4a46c',
  s1: '#f4e6b8',
  s2: '#e2cc94',
  w1: '#68b8f4',
  w2: '#4490dc',
  w3: '#d0f0ff',
  w4: '#2e70c0',
  trunk: '#86562e',
  trunkD: '#5a3820',
  wall: '#f6eedc',
  wallS: '#ddd0b4',
  wood1: '#dcae6c',
  wood2: '#c08a50',
  wood3: '#9a6838',
};

class P16 {
  c = makeCanvas(TS, TS);
  x = this.c.getContext('2d')!;
  buf: (string | null)[] = new Array(TS * TS).fill(null);

  fill(col: string) {
    this.buf.fill(col);
    return this;
  }
  p(x: number, y: number, col: string) {
    if (x < 0 || y < 0 || x >= TS || y >= TS) return;
    this.buf[y * TS + x] = col;
  }
  r(x: number, y: number, w: number, h: number, col: string) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.p(i, j, col);
  }
  get(x: number, y: number) {
    return this.buf[y * TS + x];
  }
  /** shaded, outlined ellipse */
  ell(cx: number, cy: number, rx: number, ry: number, m: Mat, outline: string | null = C.ink) {
    const inside = (x: number, y: number) => {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      return nx * nx + ny * ny <= 1;
    };
    if (outline)
      for (let y = 0; y < TS; y++)
        for (let x = 0; x < TS; x++)
          if (!inside(x, y) && (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1))) this.p(x, y, outline);
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        if (!inside(x, y)) continue;
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const s = -0.55 * nx - 0.8 * ny > 0.45 ? m.l : 0.45 * nx + 0.85 * ny > 0.5 ? m.d : m.m;
        this.p(x, y, s);
      }
  }
  /** outlined rectangle with top highlight */
  box(x: number, y: number, w: number, h: number, m: Mat, outline = C.ink) {
    this.r(x, y, w, h, outline);
    this.r(x + 1, y + 1, w - 2, h - 2, m.m);
    this.r(x + 1, y + 1, w - 2, 1, m.l);
    this.r(x + 1, y + h - 2, w - 2, 1, m.d);
  }
  rows(rows: string[], pal: Record<string, string>, ox = 0, oy = 0) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const col = pal[row[i]];
        if (col) this.p(ox + i, oy + j, col);
      }
    });
  }
  done(): HTMLCanvasElement {
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        const col = this.buf[y * TS + x];
        if (col) {
          this.x.fillStyle = col;
          this.x.fillRect(x, y, 1, 1);
        }
      }
    return this.c;
  }
}

// ---------- base textures ----------

function grass(t: P16) {
  t.fill(C.g2);
  const tufts: [number, number][] = [
    [2, 3],
    [10, 2],
    [6, 9],
    [13, 11],
    [1, 13],
  ];
  for (const [x, y] of tufts) {
    t.p(x, y, C.g3);
    t.p(x + 2, y, C.g3);
    t.p(x + 1, y + 1, C.g3);
    t.p(x + 1, y - 1, C.g1);
  }
  return t;
}

function path(t: P16) {
  t.fill(C.p1);
  const dots: [number, number, string][] = [
    [3, 2, C.p2],
    [11, 4, C.p3],
    [6, 7, C.p2],
    [14, 10, C.p2],
    [2, 12, C.p3],
    [9, 13, C.p2],
    [12, 1, C.p2],
  ];
  for (const [x, y, c] of dots) {
    t.p(x, y, c);
    t.p(x + 1, y, c);
  }
  return t;
}

function caveFloor(t: P16) {
  t.fill('#9a8670');
  const dots: [number, number][] = [
    [2, 3],
    [9, 1],
    [13, 7],
    [5, 10],
    [11, 13],
    [1, 14],
  ];
  for (const [x, y] of dots) {
    t.p(x, y, '#7c6a58');
    t.p(x + 1, y, '#7c6a58');
    t.p(x, y - 1, '#b8a48a');
  }
  return t;
}

function wood(t: P16) {
  t.fill(C.wood1);
  for (let y = 0; y < TS; y += 4) {
    t.r(0, y + 3, TS, 1, C.wood2);
    const seam = (y / 4) % 2 === 0 ? 5 : 12;
    t.r(seam, y, 1, 3, C.wood2);
  }
  t.p(2, 1, mix(C.wood1, '#fff', 0.3));
  t.p(9, 5, mix(C.wood1, '#fff', 0.3));
  return t;
}

function checker(t: P16, a: string, b: string) {
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) t.p(x, y, ((x >> 3) + (y >> 3)) % 2 ? b : a);
  t.r(0, 0, TS, 1, mix(a, '#fff', 0.3));
  return t;
}

// ---------- registry ----------

export const TILES: TileDef[] = [];
const byName = new Map<string, TileDef>();

function add(name: string, solid: boolean, frames: HTMLCanvasElement[], extra: Partial<TileDef> = {}) {
  const def: TileDef = { idx: TILES.length, name, solid, frames, ...extra };
  TILES.push(def);
  byName.set(name, def);
  return def;
}

export function tile(name: string): TileDef {
  const t = byName.get(name);
  if (!t) throw new Error('Unknown tile ' + name);
  return t;
}

export function tileIdx(name: string): number {
  return tile(name).idx;
}

let built = false;

export function buildTiles() {
  if (built) return;
  built = true;

  add('void', true, [new P16().fill('#0d0c16').done()]);
  {
    const base = grass(new P16()).done();
    // variant: sparse tufts in different spots
    const v1 = new P16().fill(C.g2);
    for (const [x, y] of [
      [5, 4],
      [12, 9],
      [2, 11],
    ] as [number, number][]) {
      v1.p(x, y, C.g3);
      v1.p(x + 2, y, C.g3);
      v1.p(x + 1, y + 1, C.g3);
      v1.p(x + 1, y - 1, C.g1);
    }
    // variant: a tiny clover / pebble detail
    const v2 = grass(new P16());
    v2.p(9, 6, '#f8f4e8');
    v2.p(10, 6, C.g1);
    v2.p(4, 13, '#b8b0a0');
    v2.p(5, 13, '#d8d0c0');
    // variant: plain with one light patch
    const v3 = new P16().fill(C.g2);
    v3.r(6, 6, 3, 1, C.g1);
    v3.p(7, 7, C.g1);
    v3.p(13, 2, C.g3);
    v3.p(2, 9, C.g3);
    add('grass', false, [base], { variants: [base, base, v1.done(), base, v2.done(), v3.done(), base, v1.done()] });
  }

  // tall grass
  const tall = (shift: number) => {
    const t = new P16().fill(C.t1);
    for (const [bx, by] of [
      [1, 2],
      [9, 2],
      [5, 9],
      [13, 9],
    ] as [number, number][]) {
      const x = (bx + shift) % 16;
      for (let i = 0; i < 6; i++) {
        t.p((x + i) % 16, by + 5, C.t2);
      }
      t.p(x % 16, by + 4, C.t2);
      t.p((x + 1) % 16, by + 2, C.t3);
      t.p((x + 1) % 16, by + 3, C.t3);
      t.p((x + 2) % 16, by + 4, C.t2);
      t.p((x + 3) % 16, by + 1, C.t3);
      t.p((x + 3) % 16, by + 2, C.t3);
      t.p((x + 3) % 16, by + 3, C.t3);
      t.p((x + 4) % 16, by + 4, C.t2);
      t.p((x + 5) % 16, by + 3, C.t3);
      t.p((x + 5) % 16, by + 4, C.t2);
    }
    return t.done();
  };
  add('tallgrass', false, [tall(0), tall(0), tall(0), tall(1)], { grass: true });
  add('path', false, [path(new P16()).done()]);
  {
    const t = new P16().fill(C.s1);
    for (const [x, y] of [
      [3, 3],
      [12, 6],
      [7, 11],
      [1, 9],
      [14, 14],
    ] as [number, number][])
      t.p(x, y, C.s2);
    add('sand', false, [t.done()]);
  }
  // flowers (2 frames)
  {
    const fl = (f: number) => {
      const t = grass(new P16());
      const spots: [number, number, string][] = [
        [3, 3, '#f05868'],
        [11, 10, '#ffffff'],
        [12, 2, '#f8d040'],
        [4, 11, '#ffffff'],
      ];
      for (const [x, y, c] of spots) {
        const o = f ? 1 : 0;
        t.p(x + o, y, c);
        t.p(x - 1 + o, y + 1, c);
        t.p(x + 1 + o, y + 1, c);
        t.p(x + o, y + 2, c);
        t.p(x + o, y + 1, '#f8c020');
      }
      return t.done();
    };
    add('flower', false, [fl(0), fl(1)]);
  }
  // tree
  {
    const t = grass(new P16());
    t.r(6, 11, 4, 5, C.ink);
    t.r(7, 11, 2, 5, C.trunk);
    t.p(8, 13, C.trunkD);
    t.ell(8, 6.5, 7.5, 6.5, mat('#4c9a48', '#2c6434', '#80c860'));
    t.ell(5, 5, 2.5, 2, mat('#5cac50', '#4c9a48', '#90d468'), null);
    t.ell(10.5, 8, 2.5, 2, mat('#4c9a48', '#3a7c3c', '#70bc58'), null);
    add('tree', true, [t.done()]);
  }
  // water (3 frames)
  {
    const wf = (f: number) => {
      const t = new P16().fill(C.w2);
      for (let y = 0; y < 16; y += 4) {
        const off = (f * 2 + (y % 8 === 0 ? 0 : 4)) % 16;
        for (let i = 0; i < 4; i++) t.p((off + i) % 16, y + 1, C.w1);
        t.p((off + 1) % 16, y, C.w3);
        t.p((off + 2) % 16, y, C.w3);
        for (let i = 0; i < 3; i++) t.p((off + 9 + i) % 16, y + 2, C.w4);
      }
      return t.done();
    };
    add('water', true, [wf(0), wf(1), wf(2), wf(1)], { water: true });
  }
  // ledge
  {
    const t = grass(new P16());
    t.r(0, 10, 16, 1, C.ink);
    t.r(0, 11, 16, 2, C.g4);
    t.r(0, 13, 16, 3, C.g3);
    for (let x = 1; x < 16; x += 4) t.p(x, 11, C.g3);
    add('ledge', false, [t.done()], { ledge: true });
  }
  // fence
  {
    const t = grass(new P16());
    const wd = mat('#f4ecdc', '#c8b8a0', '#ffffff');
    t.r(0, 5, 16, 4, C.ink);
    t.r(0, 6, 16, 2, wd.m);
    t.r(0, 7, 16, 1, wd.d);
    t.box(5, 1, 6, 14, wd);
    t.p(5, 1, C.g2);
    t.p(10, 1, C.g2);
    add('fence', true, [t.done()]);
  }
  // sign
  {
    const t = grass(new P16());
    t.r(7, 9, 2, 6, C.ink);
    t.p(7, 10, C.trunk);
    t.p(7, 12, C.trunk);
    t.box(2, 2, 12, 9, mat(C.wood1, C.wood3, '#f0c888'));
    t.r(4, 5, 8, 1, C.wood3);
    t.r(4, 7, 6, 1, C.wood3);
    add('sign', true, [t.done()]);
  }
  // boulder
  {
    const t = grass(new P16());
    t.ell(8, 9, 7, 6, mat('#a8a0b0', '#686078', '#d8d0e0'));
    t.p(5, 9, '#686078');
    t.p(6, 10, '#686078');
    add('rock', true, [t.done()]);
  }
  // cliff wall
  {
    const t = new P16().fill('#b08c60');
    for (let y = 0; y < 16; y += 5) {
      t.r(0, y, 16, 1, '#8a6a44');
      const s = (y / 5) % 2 ? 4 : 11;
      t.r(s, y, 1, 5, '#8a6a44');
      t.r(s + 1, y + 1, 3, 1, '#c8a878');
    }
    add('cliff', true, [t.done()]);
  }
  // cave mouth in cliff
  {
    const t = new P16().fill('#b08c60');
    for (let y = 0; y < 16; y += 5) t.r(0, y, 16, 1, '#8a6a44');
    t.ell(8, 14, 6.5, 10, mat('#1a1420', '#0d0a12', '#2a2030'));
    add('cavemouth', false, [t.done()]);
  }
  // bridge
  {
    const t = new P16().fill(C.wood2);
    for (let y = 0; y < 16; y += 3) {
      t.r(1, y, 14, 2, C.wood1);
      t.r(1, y + 2, 14, 1, C.wood3);
    }
    t.r(0, 0, 1, 16, C.ink);
    t.r(15, 0, 1, 16, C.ink);
    add('bridge', false, [t.done()]);
  }
  // hedge / bush
  {
    const t = grass(new P16());
    t.ell(8, 8.5, 7.5, 7, mat('#3e8a3c', '#24582c', '#62b052'));
    t.p(5, 6, '#7cc860');
    t.p(10, 9, '#7cc860');
    add('bush', true, [t.done()], { cut: true });
  }

  // ---------- buildings ----------
  const roofs: Record<string, string> = {
    red: '#d85040',
    blue: '#4c78d8',
    teal: '#38a8a0',
    purple: '#8858c0',
    grey: '#7c7890',
    green: '#4c9a50',
    gold: '#d8a838',
  };
  for (const [name, col] of Object.entries(roofs)) {
    const m = mat(col);
    const roof = (part: string) => {
      const t = new P16().fill(m.m);
      for (let y = 2; y < 16; y += 4) {
        t.r(0, y + 2, 16, 1, m.d);
        const off = (y / 4) % 2 ? 2 : 6;
        for (let x = off; x < 16; x += 8) t.p(x, y, m.d);
      }
      if (part.includes('T')) {
        t.r(0, 0, 16, 1, C.ink);
        t.r(0, 1, 16, 2, m.l);
      }
      if (part.includes('B')) {
        t.r(0, 12, 16, 2, m.d);
        t.r(0, 14, 16, 1, C.ink);
        t.r(0, 15, 16, 1, mix(m.d, '#000', 0.4));
      }
      if (part.includes('L')) t.r(0, 0, 1, 16, C.ink);
      if (part.includes('R')) t.r(15, 0, 1, 16, C.ink);
      return t.done();
    };
    for (const part of ['TL', 'T', 'TR', 'L', 'M', 'R', 'BL', 'B', 'BR']) add(`roof_${name}_${part}`, true, [roof(part)]);
  }
  const wallBase = (side?: 'L' | 'R') => {
    const t = new P16().fill(C.wall);
    t.r(0, 13, 16, 2, C.wallS);
    t.r(0, 15, 16, 1, C.ink);
    for (let y = 3; y < 13; y += 5) t.r(0, y, 16, 1, '#ece2cc');
    if (side === 'L') t.r(0, 0, 1, 16, C.ink);
    if (side === 'R') t.r(15, 0, 1, 16, C.ink);
    return t;
  };
  add('wall', true, [wallBase().done()]);
  add('wallL', true, [wallBase('L').done()]);
  add('wallR', true, [wallBase('R').done()]);
  {
    const t = wallBase();
    t.r(3, 3, 10, 8, C.ink);
    t.r(4, 4, 8, 6, '#88c8f0');
    t.r(4, 4, 3, 2, '#d8f0ff');
    t.r(7, 4, 1, 6, C.ink);
    t.r(4, 7, 8, 1, C.ink);
    add('window', true, [t.done()]);
  }
  {
    const t = wallBase();
    t.r(3, 2, 10, 14, C.ink);
    t.r(4, 3, 8, 13, '#a86838');
    t.r(4, 3, 8, 2, '#c88850');
    t.r(5, 6, 6, 4, '#8a5028');
    t.p(10, 10, '#f8d040');
    t.r(3, 15, 10, 1, '#70482a');
    add('door', false, [t.done()]);
  }
  // glass sliding door for public buildings
  {
    const t = wallBase();
    t.r(2, 2, 12, 14, C.ink);
    t.r(3, 3, 10, 13, '#a8d8f0');
    t.r(3, 3, 4, 3, '#e0f4ff');
    t.r(8, 3, 1, 13, C.ink);
    add('glassdoor', false, [t.done()]);
  }
  const plaque = (label: string, bg: string, fg: string) => {
    const t = wallBase();
    t.r(2, 2, 12, 11, C.ink);
    t.r(3, 3, 10, 9, bg);
    const c = t.done();
    const x = c.getContext('2d')!;
    drawText(x, label, 5, 3, fg);
    return c;
  };
  add('plaqueH', true, [plaque('H', '#f05868', '#ffffff')]);
  add('plaqueM', true, [plaque('M', '#4c78d8', '#ffffff')]);
  add('plaqueG', true, [plaque('G', '#383048', '#f8d040')]);
  add('plaqueS', true, [plaque('*', '#8858c0', '#ffffff')]);

  // ---------- interiors ----------
  add('floor', false, [wood(new P16()).done()]);
  add('tiles', false, [checker(new P16(), '#eceaf4', '#d6d2e4').done()]);
  add('marble', false, [checker(new P16(), '#f4eef8', '#e4dcf0').done()]);
  {
    const iw = (win: boolean) => {
      const t = new P16().fill('#f0dcb8');
      for (let x = 1; x < 16; x += 4) t.r(x, 0, 1, 12, '#e2c69a');
      t.r(0, 12, 16, 3, '#9a6838');
      t.r(0, 12, 16, 1, '#c08a50');
      t.r(0, 15, 16, 1, C.ink);
      if (win) {
        t.r(3, 2, 10, 8, C.ink);
        t.r(4, 3, 8, 6, '#88c8f0');
        t.r(4, 3, 3, 2, '#d8f0ff');
        t.r(7, 3, 1, 6, C.ink);
      }
      return t.done();
    };
    add('iwall', true, [iw(false)]);
    add('iwallwin', true, [iw(true)]);
  }
  {
    const t = new P16();
    wood(t);
    t.r(1, 3, 14, 11, C.ink);
    t.r(2, 4, 12, 9, '#d05040');
    t.r(3, 5, 10, 7, '#e06850');
    t.r(4, 7, 8, 3, '#d05040');
    add('mat', false, [t.done()]);
  }
  {
    const t = new P16();
    checker(t, '#eceaf4', '#d6d2e4');
    t.r(0, 0, 16, 9, C.ink);
    t.r(0, 1, 16, 4, '#f8f2e4');
    t.r(0, 5, 16, 3, '#c09060');
    t.r(0, 8, 16, 1, C.ink);
    t.r(0, 9, 16, 6, '#a87448');
    t.r(0, 9, 16, 1, '#c89060');
    t.r(0, 15, 16, 1, C.ink);
    add('counter', true, [t.done()], { counter: true });
  }
  {
    const t = new P16();
    wood(t);
    t.box(1, 2, 14, 10, mat('#c08a50', '#8a5a30', '#e0b070'));
    t.r(2, 12, 2, 3, C.ink);
    t.r(12, 12, 2, 3, C.ink);
    add('table', true, [t.done()]);
  }
  {
    const t = new P16();
    wood(t);
    t.box(1, 2, 14, 10, mat('#c08a50', '#8a5a30', '#e0b070'));
    t.r(2, 12, 2, 3, C.ink);
    t.r(12, 12, 2, 3, C.ink);
    t.ell(8, 6.5, 3.5, 3.5, mat('#e85050', '#a83030', '#ff9090'));
    t.r(5, 7, 7, 1, C.ink);
    t.r(5, 8, 7, 2, '#f8f4e8');
    t.r(7, 6, 3, 3, C.ink);
    t.p(8, 7, '#ffffff');
    add('podtable', true, [t.done()]);
  }
  {
    const t = new P16().fill(C.wood3);
    t.r(0, 0, 16, 16, C.ink);
    t.r(1, 1, 14, 14, C.wood3);
    const books = ['#d85040', '#4c78d8', '#f0c040', '#58b050', '#8858c0', '#e88838'];
    for (let row = 0; row < 2; row++) {
      const y = 2 + row * 7;
      t.r(1, y + 5, 14, 1, C.ink);
      for (let i = 0; i < 6; i++) t.r(2 + i * 2, y, 2, 5, books[(i + row * 2) % books.length]);
      for (let i = 0; i < 6; i++) t.p(2 + i * 2, y, '#ffffff55');
    }
    add('bookshelf', true, [t.done()]);
  }
  {
    const t = new P16();
    wood(t);
    t.box(4, 10, 8, 6, mat('#c06838', '#904020', '#e08850'));
    t.ell(8, 6, 5.5, 5, mat('#4c9a48', '#2c6434', '#80c860'));
    t.ell(5, 3.5, 2, 2, mat('#5cac50', '#4c9a48', '#90d468'), null);
    add('plant', true, [t.done()]);
  }
  {
    const t = new P16();
    wood(t);
    t.box(1, 0, 14, 16, mat('#5878d0', '#3858a8', '#88a8f0'));
    t.box(3, 1, 10, 5, mat('#ffffff', '#d0d0e0', '#ffffff'));
    t.r(2, 8, 12, 1, '#88a8f0');
    add('bed', true, [t.done()]);
  }
  {
    const t = new P16();
    wood(t);
    t.box(1, 8, 14, 8, mat('#a87848', '#7a5030', '#c89868'));
    t.box(3, 0, 10, 9, mat('#d8d4e4', '#a8a4b8', '#f0f0f8'));
    t.r(4, 1, 8, 6, '#3c58a0');
    t.r(5, 2, 3, 2, '#78c8f0');
    t.p(11, 6, '#58e070');
    add('pc', true, [t.done()]);
  }
  {
    const t = new P16();
    wood(t);
    t.box(1, 2, 14, 12, mat('#585468', '#383448', '#787488'));
    t.r(3, 4, 10, 7, '#2a3a58');
    t.r(4, 5, 4, 2, '#68a8d8');
    t.r(2, 14, 2, 2, C.ink);
    t.r(12, 14, 2, 2, C.ink);
    add('tv', true, [t.done()]);
  }
  {
    const t = new P16();
    checker(t, '#eceaf4', '#d6d2e4');
    t.box(0, 2, 16, 13, mat('#e0dcf0', '#a8a4c0', '#ffffff'));
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 2; j++) {
        t.r(2 + i * 4, 5 + j * 4, 3, 3, C.ink);
        t.p(3 + i * 4, 6 + j * 4, '#f05868');
      }
    t.r(1, 3, 14, 1, '#58c0f0');
    add('healer', true, [t.done()], { counter: true });
  }
  {
    const t = new P16().fill('#c84850');
    t.r(1, 1, 14, 14, '#e0b040');
    t.r(2, 2, 12, 12, '#c84850');
    t.r(5, 5, 6, 6, '#e0b040');
    t.r(6, 6, 4, 4, '#a83040');
    add('rug', false, [t.done()]);
  }
  {
    const t = new P16();
    checker(t, '#eceaf4', '#d6d2e4');
    for (let i = 0; i < 4; i++) {
      t.r(1, 1 + i * 4, 14, 3, '#b8b0c8');
      t.r(1, 1 + i * 4, 14, 1, '#e0dcea');
      t.r(1, 4 + i * 4, 14, 1, C.ink);
    }
    t.r(0, 0, 1, 16, C.ink);
    t.r(15, 0, 1, 16, C.ink);
    add('stairs', false, [t.done()]);
  }
  {
    const t = new P16();
    checker(t, '#eceaf4', '#d6d2e4');
    t.box(1, 0, 14, 15, mat('#a8acc0', '#787c90', '#d0d4e4'));
    t.r(3, 2, 10, 5, '#304058');
    t.r(4, 3, 3, 1, '#58e070');
    t.r(4, 5, 6, 1, '#58c0f0');
    for (let i = 0; i < 4; i++) t.p(3 + i * 3, 10, ['#f05868', '#f8d040', '#58e070', '#58c0f0'][i]);
    add('machine', true, [t.done()]);
  }
  {
    const t = new P16();
    checker(t, '#e8e4ec', '#d4cee0');
    t.box(3, 9, 10, 7, mat('#a8a0b8', '#787088', '#d0c8dc'));
    t.ell(8, 6, 4.5, 5.5, mat('#c0b8d0', '#8a8098', '#e8e0f0'));
    t.p(8, 5, '#f8d040');
    add('statue', true, [t.done()]);
  }
  {
    const t = new P16().fill('#c03848');
    t.r(0, 0, 1, 16, '#e0b040');
    t.r(15, 0, 1, 16, '#e0b040');
    t.r(1, 0, 1, 16, '#902838');
    add('carpet', false, [t.done()]);
  }
  // gym floors
  add('gymfloor_leaf', false, [checker(new P16(), '#c8e8a8', '#b0d890').done()]);
  add('gymfloor_flame', false, [checker(new P16(), '#f0c8a0', '#e0b088').done()]);
  add('gymfloor_frost', false, [checker(new P16(), '#d8f0fc', '#c0e0f4').done()]);

  // ---------- cave ----------
  {
    const base = caveFloor(new P16()).done();
    const v1 = new P16().fill('#9a8670');
    v1.p(4, 5, '#7c6a58');
    v1.p(11, 11, '#7c6a58');
    v1.p(11, 10, '#b8a48a');
    const v2 = caveFloor(new P16());
    v2.r(7, 8, 2, 2, '#867260');
    v2.p(7, 8, '#b8a48a');
    add('cavefloor', false, [base], { cave: true, variants: [base, base, v1.done(), base, v2.done(), base] });
  }
  {
    const t = new P16().fill('#5c4a48');
    for (let y = 0; y < 16; y += 4) {
      t.r(0, y, 16, 1, '#40302e');
      const s = (y / 4) % 2 ? 3 : 10;
      t.r(s, y, 1, 4, '#40302e');
      t.r(s + 1, y + 1, 3, 1, '#7a6662');
    }
    add('cavewall', true, [t.done()]);
  }
  {
    const t = caveFloor(new P16());
    t.ell(8, 9, 7, 6, mat('#8a7a78', '#584a48', '#b8a8a0'));
    add('caverock', true, [t.done()]);
  }
  {
    const t = caveFloor(new P16());
    t.ell(8, 8, 7, 7, mat('#fff8d8', '#f0e0a0', '#ffffff'), null);
    t.ell(8, 8, 4, 4, mat('#ffffff', '#fff4c8', '#ffffff'), null);
    add('caveexit', false, [t.done()]);
  }
  {
    const t = caveFloor(new P16());
    t.ell(5, 10, 2.5, 3.5, mat('#68d0f0', '#2878b8', '#d8f8ff'));
    t.ell(10, 8, 3, 5, mat('#88e0f8', '#3888c8', '#e0faff'));
    add('crystal', true, [t.done()]);
  }

  // ---------- spire ----------
  {
    const t = new P16().fill('#5c4c7c');
    t.r(0, 0, 16, 1, '#7a68a0');
    t.r(0, 0, 1, 16, '#7a68a0');
    t.r(15, 0, 1, 16, '#3e3258');
    t.r(0, 15, 16, 1, '#3e3258');
    t.p(7, 7, '#9a88c8');
    t.p(8, 8, '#9a88c8');
    add('spirefloor', false, [t.done()], { cave: true });
  }
  {
    const t = new P16().fill('#2e2442');
    t.r(0, 12, 16, 3, '#1e1830');
    t.r(0, 15, 16, 1, C.ink);
    t.r(6, 3, 4, 6, '#3c3058');
    t.p(7, 5, '#e050a0');
    t.p(8, 6, '#e050a0');
    add('spirewall', true, [t.done()]);
  }
  {
    const t = new P16().fill('#5c4c7c');
    t.box(2, 8, 12, 8, mat('#8070a8', '#5a4c80', '#a898d0'));
    t.ell(8, 6, 4, 4, mat('#ff9838', '#d05820', '#fff070'));
    add('pedestal', true, [t.done()]);
  }
  {
    const t = new P16().fill('#5c4c7c');
    t.box(2, 8, 12, 8, mat('#8070a8', '#5a4c80', '#a898d0'));
    add('pedestal_empty', true, [t.done()]);
  }
  {
    const t = new P16();
    checker(t, '#f4eef8', '#e4dcf0');
    t.r(0, 0, 16, 16, '#d8a838');
    t.r(1, 0, 14, 16, '#e8c060');
    t.r(3, 0, 10, 16, '#c03848');
    add('goldcarpet', false, [t.done()]);
  }

  // ---------- regional terrain ----------
  {
    // snowfield
    const snow = (t: P16) => {
      t.fill('#eef4fa');
      for (const [x, y] of [[3, 3], [11, 6], [6, 11], [13, 13], [1, 9]] as [number, number][]) {
        t.p(x, y, '#d0dcec');
        t.p(x + 1, y, '#d0dcec');
        t.p(x, y - 1, '#ffffff');
      }
      return t;
    };
    const base = snow(new P16()).done();
    const v1 = new P16().fill('#eef4fa');
    v1.p(8, 8, '#d0dcec');
    v1.p(3, 12, '#d0dcec');
    add('snow', false, [base], { variants: [base, base, v1.done(), base] });
    const tree = snow(new P16());
    tree.r(7, 12, 2, 4, C.ink);
    tree.p(7, 13, C.trunk);
    tree.rows(
      [
        '.......k........',
        '......kWk.......',
        '.....kWgWk......',
        '....kggggWk.....',
        '.....kWggk......',
        '....kWggggk.....',
        '...kggggggWk....',
        '....kWggggk.....',
        '...kWggggggk....',
        '..kgggggggggk...',
        '..kkkkkkkkkkk...',
      ],
      { k: C.ink, g: '#3a7a58', W: '#f4faff' },
      1,
      1,
    );
    add('snowtree', true, [tree.done()]);
    const tg = new P16().fill('#dce8f2');
    for (const [bx, by] of [[1, 2], [9, 2], [5, 9], [13, 9]] as [number, number][]) {
      for (let i = 0; i < 5; i++) tg.p((bx + i) % 16, by + 5, '#7aa0b8');
      tg.p(bx % 16, by + 3, '#7aa0b8');
      tg.p((bx + 1) % 16, by + 2, '#ffffff');
      tg.p((bx + 2) % 16, by + 1, '#9ec0d4');
      tg.p((bx + 3) % 16, by + 2, '#ffffff');
      tg.p((bx + 4) % 16, by + 3, '#7aa0b8');
    }
    add('snowgrass', false, [tg.done()], { grass: true });
  }
  {
    // volcanic ash
    const ash = (t: P16) => {
      t.fill('#a8a0a0');
      for (const [x, y] of [[2, 3], [10, 2], [6, 9], [13, 11], [1, 13]] as [number, number][]) {
        t.p(x, y, '#8a8080');
        t.p(x + 1, y, '#8a8080');
        t.p(x, y - 1, '#c4bcb8');
      }
      return t;
    };
    add('ash', false, [ash(new P16()).done()]);
    const tree = ash(new P16());
    tree.r(7, 6, 2, 10, C.ink);
    tree.r(7, 6, 1, 10, '#5a4a40');
    tree.r(3, 5, 4, 1, C.ink);
    tree.r(9, 3, 4, 1, C.ink);
    tree.r(3, 3, 1, 3, C.ink);
    tree.r(12, 1, 1, 3, C.ink);
    tree.r(8, 8, 4, 1, C.ink);
    add('deadtree', true, [tree.done()]);
    const ag = new P16().fill('#807070');
    for (const [bx, by] of [[1, 2], [9, 2], [5, 9], [13, 9]] as [number, number][]) {
      for (let i = 0; i < 5; i++) ag.p((bx + i) % 16, by + 5, '#584848');
      ag.p((bx + 1) % 16, by + 2, '#a89890');
      ag.p((bx + 2) % 16, by + 1, '#c86848');
      ag.p((bx + 3) % 16, by + 2, '#a89890');
      ag.p((bx + 4) % 16, by + 4, '#584848');
    }
    add('ashgrass', false, [ag.done()], { grass: true });
  }
  {
    // marsh reeds
    const m = (shift: number) => {
      const t = new P16().fill('#6a9a58');
      for (const [bx, by] of [[1, 1], [8, 3], [4, 9], [12, 9]] as [number, number][]) {
        const x = (bx + shift) % 16;
        for (let i = 0; i < 6; i++) t.p(x + (i % 3), by + i, i % 2 ? '#3e6a3a' : '#9ac070');
        t.p(x + 1, by, '#c8a060');
        t.p(x + 1, by + 1, '#a07838');
      }
      t.p(6, 14, '#5a88c0');
      t.p(7, 14, '#78a8d8');
      return t.done();
    };
    add('marsh', false, [m(0), m(0), m(1)], { grass: true });
  }
  {
    const t = new P16().fill(C.w2);
    t.r(1, 0, 14, 16, C.wood2);
    for (let y = 0; y < 16; y += 4) {
      t.r(1, y, 14, 3, C.wood1);
      t.r(1, y + 3, 14, 1, C.wood3);
    }
    t.r(0, 0, 1, 16, C.ink);
    t.r(15, 0, 1, 16, C.ink);
    add('dock', false, [t.done()]);
  }
  {
    const t = grass(new P16());
    t.ell(8, 9, 7, 6, mat('#b0a090', '#706050', '#d8ccc0'));
    t.r(5, 6, 1, 4, C.ink);
    t.r(6, 9, 3, 1, C.ink);
    t.r(9, 9, 1, 3, C.ink);
    t.p(10, 6, C.ink);
    t.p(11, 7, C.ink);
    add('crackrock', true, [t.done()], { smash: true });
    const c = caveFloor(new P16());
    c.ell(8, 9, 7, 6, mat('#a89080', '#685040', '#d0c0b0'));
    c.r(5, 6, 1, 4, C.ink);
    c.r(6, 9, 3, 1, C.ink);
    c.r(9, 9, 1, 3, C.ink);
    add('cavecrack', true, [c.done()], { smash: true });
  }
  {
    // street lamp and crate decorations
    const l = grass(new P16());
    l.r(7, 5, 2, 10, C.ink);
    l.r(7, 5, 1, 10, '#585468');
    l.r(4, 13, 8, 2, C.ink);
    l.box(5, 0, 6, 6, mat('#f8e070', '#c8a030', '#fffad0'));
    add('lamp', true, [l.done()]);
    const k = path(new P16());
    k.box(1, 2, 14, 13, mat(C.wood1, C.wood3, '#f0c888'));
    k.r(2, 8, 12, 1, C.wood3);
    k.r(7, 3, 1, 11, C.wood3);
    add('crate', true, [k.done()]);
    const f = (fr: number) => {
      const t = path(new P16());
      t.ell(8, 9, 7.5, 6.5, mat('#c0b8c8', '#888098', '#e8e0f0'));
      t.ell(8, 9, 5.5, 4.5, mat(C.w1, C.w2, C.w3), null);
      t.r(7, 2 + fr, 2, 7 - fr, '#d0f0ff');
      t.p(6, 4 + fr, C.w3);
      t.p(9, 3 + fr, C.w3);
      return t.done();
    };
    add('fountain', true, [f(0), f(1)]);
  }
  {
    // rock jutting out of the sea
    const wf = (f: number) => {
      const t = new P16().fill(C.w2);
      for (let y = 0; y < 16; y += 4) {
        const off = (f * 2 + (y % 8 === 0 ? 0 : 4)) % 16;
        for (let i = 0; i < 4; i++) t.p((off + i) % 16, y + 1, C.w1);
      }
      t.ell(8, 9, 6.5, 5.5, mat('#9890a0', '#5c5468', '#c8c0d0'));
      for (let x = 2; x < 14; x++) if (x % 3) t.p(x, 14, C.w3);
      return t.done();
    };
    add('searock', true, [wf(0), wf(1), wf(2), wf(1)]);
  }
  // more gym floors
  add('gymfloor_stone', false, [checker(new P16(), '#e0d4bc', '#cfc0a4').done()]);
  add('gymfloor_tide', false, [checker(new P16(), '#c8e0f8', '#b0d0f0').done()]);
  add('gymfloor_volt', false, [checker(new P16(), '#f8eca8', '#ecdc88').done()]);
  add('gymfloor_toxin', false, [checker(new P16(), '#e0cce8', '#ccb4dc').done()]);
  add('gymfloor_mind', false, [checker(new P16(), '#f8d0e4', '#f0bcd8').done()]);
  // ice and magma caves
  {
    const ice = (t: P16) => {
      t.fill('#b8d8ec');
      for (const [x, y] of [[2, 3], [9, 1], [13, 7], [5, 10], [11, 13]] as [number, number][]) {
        t.p(x, y, '#e8f8ff');
        t.p(x + 1, y, '#98bcd8');
      }
      return t;
    };
    add('icefloor', false, [ice(new P16()).done()], { cave: true });
    const w = new P16().fill('#6890b8');
    for (let y = 0; y < 16; y += 4) {
      w.r(0, y, 16, 1, '#4a6c94');
      const sx = (y / 4) % 2 ? 3 : 10;
      w.r(sx, y, 1, 4, '#4a6c94');
      w.r(sx + 1, y + 1, 3, 1, '#a8d0f0');
    }
    add('icewall', true, [w.done()]);
    const r = ice(new P16());
    r.ell(8, 9, 7, 6, mat('#d8f0ff', '#88b0d0', '#ffffff'));
    add('icerock', true, [r.done()]);
    const mg = (t: P16) => {
      t.fill('#6a4844');
      for (const [x, y] of [[2, 3], [9, 1], [13, 7], [5, 10], [11, 13]] as [number, number][]) {
        t.p(x, y, '#e86838');
        t.p(x + 1, y, '#523430');
      }
      return t;
    };
    add('magmafloor', false, [mg(new P16()).done()], { cave: true });
    const mw = new P16().fill('#3a2624');
    for (let y = 0; y < 16; y += 4) {
      mw.r(0, y, 16, 1, '#281816');
      mw.r((y / 4) % 2 ? 3 : 10, y + 1, 3, 1, '#c85030');
    }
    add('magmawall', true, [mw.done()]);
    const lava = (fr: number) => {
      const t = new P16().fill('#e85828');
      for (let y = 0; y < 16; y += 4) {
        const off = (fr * 3 + (y % 8 ? 5 : 0)) % 16;
        for (let i = 0; i < 4; i++) t.p((off + i) % 16, y + 1, '#ffb040');
        t.p((off + 9) % 16, y + 2, '#b83818');
      }
      return t.done();
    };
    add('lava', true, [lava(0), lava(1), lava(2)]);
  }
  // snow and ash versions of props that sit on grass
  for (const [suffix, pal] of Object.entries(GROUND_PAL)) {
    for (const name of ['sign', 'lamp', 'rock', 'crackrock', 'fence', 'ledge', 'bush']) {
      const base = tile(name);
      const { idx: _i, name: _n, frames, ...extra } = base;
      void _i;
      void _n;
      add(`${name}_${suffix}`, base.solid, frames.map((f) => recolor(f, pal)), extra);
    }
  }
  {
    // ruined manor floor: scorched planks (rolls encounters like a cave)
    const t = wood(new P16());
    for (const [x, y] of [[3, 2], [10, 7], [6, 12], [13, 13]] as [number, number][]) {
      t.p(x, y, '#3a2a28');
      t.p(x + 1, y, '#5a4030');
    }
    t.r(0, 9, 5, 1, '#6a4a30');
    add('ruinfloor', false, [t.done()], { cave: true });
  }
  {
    // ladder / hole between cave floors
    const t = caveFloor(new P16());
    t.r(3, 1, 10, 14, C.ink);
    t.r(4, 2, 8, 12, '#2a2030');
    for (let y = 3; y < 14; y += 3) t.r(4, y, 8, 1, C.wood2);
    t.r(4, 2, 1, 12, C.wood1);
    t.r(11, 2, 1, 12, C.wood1);
    add('ladder', false, [t.done()]);
    const u = caveFloor(new P16());
    u.box(3, 2, 10, 13, mat(C.wood1, C.wood3, '#f0c888'));
    for (let y = 4; y < 14; y += 3) u.r(4, y, 8, 1, C.wood3);
    add('ladderup', false, [u.done()]);
  }
}

// ---------- ground palettes ----------

export type Ground = 'grass' | 'snow' | 'ash';

const GROUND_PAL: Record<Exclude<Ground, 'grass'>, Record<string, string>> = {
  snow: { [C.g1]: '#ffffff', [C.g2]: '#eef4fa', [C.g3]: '#d0dcec', [C.g4]: '#b8c8dc' },
  ash: { [C.g1]: '#c4bcb8', [C.g2]: '#a8a0a0', [C.g3]: '#8a8080', [C.g4]: '#706868' },
};

/** Copy a tile canvas, swapping exact colours. */
function recolor(src: HTMLCanvasElement, pal: Record<string, string>): HTMLCanvasElement {
  const c = makeCanvas(TS, TS);
  const x = c.getContext('2d')!;
  x.drawImage(src, 0, 0);
  const img = x.getImageData(0, 0, TS, TS);
  const d = img.data;
  const map = Object.entries(pal).map(([from, to]) => [hexRgb(from), hexRgb(to)] as const);
  for (let i = 0; i < d.length; i += 4) {
    for (const [f, t] of map) {
      if (d[i] === f[0] && d[i + 1] === f[1] && d[i + 2] === f[2]) {
        d[i] = t[0];
        d[i + 1] = t[1];
        d[i + 2] = t[2];
        break;
      }
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}

function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ---------- terrain edge overlays ----------

export type EdgeFamily = 'path' | 'sand' | 'water' | 'tallgrass';
type Side = 'up' | 'down' | 'left' | 'right';

/** Which family a tile belongs to for edge blending, and which neighbours count as "same". */
const FAMILY: Record<string, EdgeFamily> = { path: 'path', sand: 'sand', water: 'water', tallgrass: 'tallgrass' };
const JOINS: Record<EdgeFamily, Set<string>> = {
  path: new Set(['path', 'door', 'glassdoor', 'cavemouth', 'sand', 'bridge', 'dock']),
  sand: new Set(['sand', 'path', 'door', 'glassdoor']),
  water: new Set(['water', 'bridge', 'dock']),
  tallgrass: new Set(['tallgrass']),
};

export function edgeFamily(t: TileDef): EdgeFamily | undefined {
  return FAMILY[t.name];
}

export function joins(fam: EdgeFamily, neighbour: TileDef): boolean {
  return JOINS[fam].has(neighbour.name) || neighbour.name.startsWith('roof_') || neighbour.name.startsWith('wall') || neighbour.name === 'window' || neighbour.name.startsWith('plaque');
}

function rotated(src: HTMLCanvasElement, quarter: number): HTMLCanvasElement {
  const c = makeCanvas(TS, TS);
  const x = c.getContext('2d')!;
  x.translate(TS / 2, TS / 2);
  x.rotate((quarter * Math.PI) / 2);
  x.drawImage(src, -TS / 2, -TS / 2);
  return c;
}

const edgeCache = new Map<string, HTMLCanvasElement>();

/** Overlay drawn on top of a tile along one side where it meets a different terrain. */
export function edgeOverlay(fam: EdgeFamily, side: Side, ground: Ground = 'grass'): HTMLCanvasElement {
  if (ground !== 'grass') {
    const key = fam + side + ground;
    const hit = edgeCache.get(key);
    if (hit) return hit;
    const out = recolor(edgeOverlay(fam, side), GROUND_PAL[ground]);
    edgeCache.set(key, out);
    return out;
  }
  const key = fam + side;
  const hit = edgeCache.get(key);
  if (hit) return hit;
  const t = new P16();
  if (fam === 'path' || fam === 'sand') {
    // grass lip spilling over the edge, with a soft shadow under it
    const shade = fam === 'path' ? C.p2 : C.s2;
    for (let x = 0; x < TS; x++) {
      t.p(x, 0, C.g2);
      if (x % 4 !== 3) t.p(x, 1, C.g2);
      if (x % 4 === 1) t.p(x, 2, C.g2);
      t.p(x, x % 4 === 1 ? 3 : x % 4 === 3 ? 1 : 2, shade);
    }
    t.p(5, 0, C.g3);
    t.p(12, 0, C.g3);
  } else if (fam === 'water') {
    // bright foam line along the shore
    for (let x = 0; x < TS; x++) {
      t.p(x, 0, C.w4);
      t.p(x, 1, x % 3 === 0 ? C.w1 : C.w3);
      if (x % 5 === 2) t.p(x, 2, C.w3);
    }
  } else {
    // tall grass gets a darker rim where it meets short grass
    for (let x = 0; x < TS; x++) if (x % 2 === 0) t.p(x, 0, C.t2);
  }
  const up = t.done();
  const variants: Record<Side, HTMLCanvasElement> = { up, right: rotated(up, 1), down: rotated(up, 2), left: rotated(up, 3) };
  for (const s of Object.keys(variants) as Side[]) edgeCache.set(fam + s, variants[s]);
  return variants[side];
}
