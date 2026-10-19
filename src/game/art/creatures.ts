/**
 * Procedural pixel-art generator for original Wildkin creatures.
 * Each creature is built from shaded, outlined primitives on a 48x48 grid
 * according to its ArtSpec, so the whole roster shares one visual language.
 */
import { makeCanvas } from '../core/gfx';
import { species, type ArtSpec } from '../data/species';
import { mix } from './pixel';
import { Pix } from './rich';
import { RICH } from './richdesigns';

const N = 48;
const OUTLINE = '#201a2e';
const EYE = '#1a1626';
const WHITE = '#ffffff';
const FLAME = { d: '#d84020', m: '#f88830', l: '#ffd848' };
const GEM = { d: '#2878b8', m: '#48c0f0', l: '#c8f4ff' };

interface Mat {
  d: string;
  m: string;
  l: string;
}

function mat(hex: string): Mat {
  return { d: mix(hex, '#1a1030', 0.33), m: hex, l: mix(hex, '#ffffff', 0.4) };
}

type Line = 'full' | 'outer' | 'none';
type Pt = [number, number];

class Grid {
  px: (string | null)[] = new Array(N * N).fill(null);

  get(x: number, y: number) {
    if (x < 0 || y < 0 || x >= N || y >= N) return null;
    return this.px[y * N + x];
  }

  set(x: number, y: number, c: string | null) {
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    this.px[y * N + x] = c;
  }

  /** Paint a mask with outline and simple top-left lighting. */
  paint(mask: (x: number, y: number) => boolean, m: Mat, line: Line, shadeFn?: (x: number, y: number) => number) {
    const inside = new Uint8Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (mask(x, y)) inside[y * N + x] = 1;
    const at = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N && inside[y * N + x] === 1;
    if (line !== 'none') {
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          if (at(x, y)) continue;
          if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) {
            if (line === 'full' || this.get(x, y) === null) this.set(x, y, OUTLINE);
          }
        }
    }
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        if (!at(x, y)) continue;
        let s: number;
        if (shadeFn) s = shadeFn(x, y);
        else {
          const tl = !at(x - 1, y) || !at(x, y - 1);
          const br = !at(x + 1, y) || !at(x, y + 1) || !at(x + 1, y + 1);
          s = tl && !br ? 1 : br ? -1 : 0;
        }
        this.set(x, y, s > 0 ? m.l : s < 0 ? m.d : m.m);
      }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, m: Mat, line: Line = 'full', clipY = 99) {
    rx = Math.max(1, rx);
    ry = Math.max(1, ry);
    const inE = (x: number, y: number) => {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      return nx * nx + ny * ny <= 1 && y < clipY;
    };
    this.paint(inE, m, line, (x, y) => {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      if (-0.55 * nx - 0.8 * ny > 0.5) return 1;
      if (0.45 * nx + 0.85 * ny > 0.52) return -1;
      return 0;
    });
  }

  poly(pts: Pt[], m: Mat, line: Line = 'full') {
    const inP = (x: number, y: number) => {
      const px = x + 0.5;
      const py = y + 0.5;
      let c = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    this.paint(inP, m, line);
  }

  dot(x: number, y: number, c: string) {
    this.set(Math.round(x), Math.round(y), c);
  }

  toCanvas(flip = false): HTMLCanvasElement {
    const c = makeCanvas(N, N);
    const ctx = c.getContext('2d')!;
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const col = this.px[y * N + x];
        if (col) {
          ctx.fillStyle = col;
          ctx.fillRect(flip ? N - 1 - x : x, y, 1, 1);
        }
      }
    return c;
  }
}

interface Ctx {
  g: Grid;
  s: number;
  back: boolean;
  a: ArtSpec;
  c1: Mat;
  c2: Mat;
  c3: Mat;
  /** transform design coordinates (designed for size 1, anchored bottom-centre) */
  X: (x: number) => number;
  Y: (y: number) => number;
  R: (r: number) => number;
  has: (e: string) => boolean;
}

function E(c: Ctx, x: number, y: number, rx: number, ry: number, m: Mat, line: Line = 'full', clip?: number) {
  c.g.ellipse(c.X(x), c.Y(y), c.R(rx), c.R(ry), m, line, clip === undefined ? 99 : c.Y(clip));
}
function P(c: Ctx, pts: Pt[], m: Mat, line: Line = 'full') {
  c.g.poly(
    pts.map(([x, y]) => [c.X(x), c.Y(y)] as Pt),
    m,
    line,
  );
}
/** Mirror a design x coordinate around the centre line. */
const mx = (x: number) => 48 - x;

// ---------- features ----------

function eyes(c: Ctx, ex: number, ey: number, spread: number, single = false) {
  if (c.back) return;
  const style = c.a.eyes ?? 'round';
  const small = c.s < 0.7;
  const draw = (cx: number, left: boolean) => {
    const x = Math.round(c.X(cx));
    const y = Math.round(c.Y(ey));
    const g = c.g;
    if (style === 'big') {
      const w = small ? 2 : 3;
      const h = small ? 3 : 4;
      for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) g.dot(x - Math.floor(w / 2) + i, y - Math.floor(h / 2) + j, EYE);
      g.dot(x - Math.floor(w / 2), y - Math.floor(h / 2), WHITE);
      if (!small) g.dot(x - Math.floor(w / 2) + 1, y - Math.floor(h / 2), WHITE);
    } else if (style === 'sharp') {
      const dir = left ? 1 : -1;
      g.dot(x - dir, y - 1, EYE);
      g.dot(x, y - 1, EYE);
      g.dot(x, y, EYE);
      g.dot(x + dir, y, EYE);
      g.dot(x - dir, y, EYE);
      if (!small) {
        g.dot(x + dir, y - 1, EYE);
        g.dot(x - dir * 2, y - 2, EYE);
        g.dot(x, y, WHITE);
      }
    } else if (style === 'sleepy') {
      g.dot(x - 1, y, EYE);
      g.dot(x, y, EYE);
      g.dot(x + 1, y, EYE);
      g.dot(x, y + 1, EYE);
      if (!small) {
        g.dot(x - 1, y - 1, c.c1.d);
        g.dot(x + 1, y - 1, c.c1.d);
      }
    } else {
      g.dot(x, y, EYE);
      g.dot(x, y - 1, EYE);
      g.dot(x + (left ? 1 : -1), y, EYE);
      g.dot(x + (left ? 1 : -1), y - 1, EYE);
      g.dot(x, y - 1, WHITE);
      if (!small) {
        g.dot(x, y + 1, EYE);
        g.dot(x + (left ? 1 : -1), y + 1, EYE);
      }
    }
  };
  if (single) draw(ex, true);
  else {
    draw(24 - spread, true);
    draw(24 + spread, false);
  }
}

function mouth(c: Ctx, x: number, y: number) {
  if (c.back) return;
  const px = Math.round(c.X(x));
  const py = Math.round(c.Y(y));
  c.g.dot(px - 1, py, EYE);
  c.g.dot(px + 1, py, EYE);
  c.g.dot(px, py + 1, EYE);
  if (c.has('teeth')) {
    c.g.dot(px - 1, py + 1, WHITE);
    c.g.dot(px + 1, py + 1, WHITE);
  }
}

function flame(c: Ctx, x: number, y: number, size: number, lean = 0) {
  const fm = FLAME;
  P(
    c,
    [
      [x - 5 * size, y],
      [x - 6 * size + lean, y - 7 * size],
      [x - 2 * size + lean, y - 5 * size],
      [x + lean * 1.4, y - 13 * size],
      [x + 2.5 * size + lean, y - 6 * size],
      [x + 6 * size + lean, y - 9 * size],
      [x + 5 * size, y],
    ],
    fm,
  );
  E(c, x + lean * 0.4, y - 3 * size, 3 * size, 3.5 * size, { d: fm.m, m: fm.l, l: '#fff8d0' }, 'none');
}

function headFeatures(c: Ctx, hx: number, hy: number, hr: number) {
  const a = c.a;
  const ear = a.ears ?? 'none';
  if (ear === 'point') {
    for (const side of [-1, 1]) {
      const f = (x: number) => (side < 0 ? x : mx(x));
      P(c, [[f(hx - hr * 0.95), hy - hr * 0.3], [f(hx - hr * 0.2), hy - hr * 0.8], [f(hx - hr * 0.9), hy - hr * 1.55]], c.c1);
      if (!c.back)
        P(c, [[f(hx - hr * 0.8), hy - hr * 0.5], [f(hx - hr * 0.42), hy - hr * 0.78], [f(hx - hr * 0.82), hy - hr * 1.2]], c.c2, 'none');
    }
  } else if (ear === 'round') {
    for (const side of [-1, 1]) {
      E(c, 24 + side * hr * 0.75, hy - hr * 0.78, hr * 0.38, hr * 0.38, c.c1);
      if (!c.back) E(c, 24 + side * hr * 0.75, hy - hr * 0.74, hr * 0.2, hr * 0.2, c.c2, 'none');
    }
  } else if (ear === 'long') {
    for (const side of [-1, 1]) {
      const top = c.s > 0.9 ? 1.2 : c.s > 0.7 ? 1.3 : 1.45;
      E(c, 24 + side * hr * 0.42, hy - hr * top, hr * 0.28, hr * 0.78, c.c1);
      if (!c.back) E(c, 24 + side * hr * 0.42, hy - hr * (top - 0.05), hr * 0.12, hr * 0.55, c.c2, 'none');
    }
  } else if (ear === 'fin') {
    for (const side of [-1, 1]) {
      const f = (x: number) => (side < 0 ? x : mx(x));
      P(c, [[f(hx - hr * 0.7), hy - hr * 0.5], [f(hx - hr * 1.7), hy - hr * 1.3], [f(hx - hr * 0.9), hy + hr * 0.1]], c.c2);
    }
  }
  if (c.has('horns')) {
    for (const side of [-1, 1]) {
      const f = (x: number) => (side < 0 ? x : mx(x));
      P(c, [[f(hx - hr * 0.55), hy - hr * 0.6], [f(hx - hr * 0.15), hy - hr * 0.85], [f(hx - hr * 0.95), hy - hr * 1.6]], c.c2);
    }
  }
  if (c.has('crest')) {
    P(c, [[hx - hr * 0.35, hy - hr * 0.7], [hx + hr * 0.1, hy - hr * 0.8], [hx - hr * 0.55, hy - hr * 1.7]], c.c2);
    P(c, [[hx - hr * 0.05, hy - hr * 0.8], [hx + hr * 0.4, hy - hr * 0.75], [hx + hr * 0.2, hy - hr * 1.6]], c.c2);
  }
  if (c.has('leafhead')) {
    P(c, [[hx, hy - hr * 0.85], [hx - hr * 0.9, hy - hr * 1.5], [hx - hr * 0.2, hy - hr * 1.7]], mat('#58c048'));
    P(c, [[hx, hy - hr * 0.85], [hx + hr * 0.8, hy - hr * 1.35], [hx + hr * 0.25, hy - hr * 1.6]], mat('#78d058'));
    E(c, hx, hy - hr * 0.95, hr * 0.22, hr * 0.22, c.c2);
  }
  if (c.has('flamehead')) flame(c, hx, hy - hr * 0.7, Math.max(0.5, hr / 14));
  if (c.has('antenna')) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 6; i++) c.g.dot(c.X(hx + side * (hr * 0.3 + i * 0.9)), c.Y(hy - hr * 0.8 - i * 1.2), OUTLINE);
      E(c, hx + side * (hr * 0.3 + 5.5), hy - hr * 0.8 - 7.5, 1.6, 1.6, c.c2);
    }
  }
  if (c.has('halo')) {
    const y = hy - hr * 1.25;
    E(c, hx, y, hr * 0.7, hr * 0.22, mat('#f8d848'), 'outer');
    E(c, hx, y, hr * 0.45, hr * 0.1, { d: '#00000000', m: '#00000000', l: '#00000000' }, 'none');
    for (let x = -Math.round(hr * 0.4); x <= Math.round(hr * 0.4); x++) c.g.set(Math.round(c.X(hx + x)), Math.round(c.Y(y)), null);
  }
  if (c.has('silk')) {
    for (let i = 0; i < 14; i++) c.g.dot(c.X(hx), c.Y(hy - hr - i), '#f8f8f0');
  }
}

/** Bat or insect wings behind the body, attached around (x, y). */
function wings(c: Ctx, x: number, y: number, span: number, membrane = true) {
  for (const side of [-1, 1]) {
    const f = (v: number) => 24 + side * (v - 24);
    if (membrane)
      P(c, [[f(x + 2), y - 4], [f(x + span), y - span * 0.9], [f(x + span * 0.85), y + 2], [f(x + span * 0.55), y - 1], [f(x + span * 0.4), y + 5], [f(x + 2), y + 4]], c.c2);
    else E(c, f(x + span * 0.5), y - span * 0.35, span * 0.55, span * 0.4, { d: c.c3.d, m: c.c3.m, l: '#ffffff' });
  }
}

function faceFeatures(c: Ctx, hx: number, hy: number, hr: number) {
  if (c.back) return;
  if (c.has('cheeks')) {
    E(c, 24 - hr * 0.62, hy + hr * 0.3, hr * 0.17, hr * 0.13, mat('#f06068'), 'none');
    E(c, 24 + hr * 0.62, hy + hr * 0.3, hr * 0.17, hr * 0.13, mat('#f06068'), 'none');
  }
  if (c.has('gem')) {
    P(c, [[hx, hy - hr * 0.72], [hx + hr * 0.17, hy - hr * 0.5], [hx, hy - hr * 0.28], [hx - hr * 0.17, hy - hr * 0.5]], GEM);
  }
  if (c.has('mask')) {
    E(c, hx, hy - hr * 0.25, hr * 0.85, hr * 0.62, mat('#f0ece0'), 'outer');
    for (const side of [-1, 1]) E(c, 24 + side * hr * 0.35, hy - hr * 0.15, hr * 0.17, hr * 0.2, mat('#3a3040'), 'none');
  }
  if (c.has('tusks')) {
    for (const side of [-1, 1]) P(c, [[24 + side * hr * 0.25, hy + hr * 0.35], [24 + side * hr * 0.45, hy + hr * 0.35], [24 + side * hr * 0.42, hy + hr * 0.85]], mat('#fffaf0'));
  }
  if (c.has('beard')) P(c, [[24 - hr * 0.4, hy + hr * 0.45], [24 + hr * 0.4, hy + hr * 0.45], [24, hy + hr * 1.1]], c.c2);
  if (c.has('whiskers')) {
    const y = Math.round(c.Y(hy + hr * 0.38));
    for (const side of [-1, 1]) {
      const x0 = Math.round(c.X(24 + side * hr * 0.45));
      for (let i = 0; i < Math.max(2, Math.round(4 * c.s)); i++) {
        c.g.dot(x0 + side * i, y - (i > 1 ? 1 : 0), OUTLINE);
        c.g.dot(x0 + side * i, y + 2 + (i > 1 ? 1 : 0), OUTLINE);
      }
    }
  }
}

function tail(c: Ctx, bx: number, by: number) {
  const t = c.a.tail ?? 'none';
  const side = 1;
  if (t === 'flame') {
    E(c, bx + 2 * side, by - 2, 2.5, 6, c.c1);
    flame(c, bx + 5 * side, by - 6, 0.9, 2);
  } else if (t === 'plain') {
    E(c, bx + 2, by, 3, 3, c.c1);
    E(c, bx + 5, by - 5, 2.5, 4, c.c1);
    E(c, bx + 6, by - 11, 2.5, 3, c.c2);
  } else if (t === 'bolt') {
    P(
      c,
      [
        [bx, by + 2],
        [bx + 8, by - 4],
        [bx + 4, by - 6],
        [bx + 11, by - 14],
        [bx + 9, by - 6],
        [bx + 12, by - 5],
        [bx + 3, by + 4],
      ],
      c.c1,
    );
    P(c, [[bx + 8, by - 9], [bx + 11, by - 14], [bx + 10, by - 8]], c.c2, 'none');
  } else if (t === 'leaf') {
    P(c, [[bx, by], [bx + 10, by - 6], [bx + 6, by - 14]], mat('#58c048'));
  } else if (t === 'fluff') {
    E(c, 24, by + 3, 9, 4, c.c2);
  } else if (t === 'fin') {
    P(c, [[bx, by], [bx + 9, by - 6], [bx + 7, by + 4]], c.c2);
  }
}

// ---------- archetypes ----------

function quad(c: Ctx) {
  // back legs, tail
  E(c, 24 - 13, 41, 4, 5, c.c1);
  E(c, 24 + 13, 41, 4, 5, c.c1);
  tail(c, 36, 30);
  if (c.has('mane')) {
    for (let i = 0; i < 9; i++) {
      const ang = Math.PI * (0.95 + (i / 8) * 1.1);
      const cx = 24 + Math.cos(ang) * 14;
      const cy = 21 + Math.sin(ang) * 13;
      P(c, [[cx - 4, cy + 2], [cx + 4, cy + 2], [24 + Math.cos(ang) * 20, 21 + Math.sin(ang) * 18]], c.c2);
    }
    E(c, 24, 22, 16, 14, c.c2);
  }
  E(c, 24, 34, 15, 10, c.c1);
  if (!c.back) E(c, 24, 37, 8, 6, c.c3, 'none');
  if (c.has('stripes') && !c.back) {
    for (const dx of [-11, -8, 8, 11]) P(c, [[24 + dx - 1, 28], [24 + dx + 1, 28], [24 + dx, 33]], { d: c.c1.d, m: c.c1.d, l: c.c1.d }, 'none');
  }
  if (c.has('spikes')) {
    for (const dx of [-9, 0, 9]) P(c, [[24 + dx - 4, 27], [24 + dx + 4, 27], [24 + dx, 19 + Math.abs(dx) * 0.4]], c.c2);
  }
  // front legs
  E(c, 24 - 6, 42, 4, 5, c.c1);
  E(c, 24 + 6, 42, 4, 5, c.c1);
  if (c.has('claws') || c.has('collar')) {
    for (const dx of [-7, -5, 5, 7]) c.g.dot(c.X(24 + dx), c.Y(46), WHITE);
  }
  // head
  headFeatures(c, 24, 20, 12);
  E(c, 24, 20, 13, 11, c.c1);
  if (!c.back) {
    E(c, 24, 25, 6.5, 4.5, c.c3, 'none');
    eyes(c, 24, 19, 5);
    mouth(c, 24, 25);
  }
  faceFeatures(c, 24, 20, 12);
}

function biped(c: Ctx) {
  if (c.has('wings')) wings(c, 30, 26, 16);
  E(c, 24 - 7, 44, 5, 3, c.c1);
  E(c, 24 + 7, 44, 5, 3, c.c1);
  tail(c, 33, 38);
  E(c, 24, 33, 10, 10, c.c1);
  if (!c.back) E(c, 24, 35, 6, 6, c.c3, 'none');
  E(c, 24 - 11, 32, 3.5, 6, c.c1);
  E(c, 24 + 11, 32, 3.5, 6, c.c1);
  if (c.has('collar')) {
    P(c, [[13, 22], [35, 22], [31, 27], [17, 27]], c.c2);
  }
  if (c.has('club')) club(c, 36, 34);
  headFeatures(c, 24, 16, 11);
  E(c, 24, 16, 12, 10.5, c.c1);
  if (!c.back) {
    E(c, 24, 20, 5, 3.5, c.c3, 'none');
    eyes(c, 24, 15, 5);
    mouth(c, 24, 20);
  }
  faceFeatures(c, 24, 16, 11);
}

function bird(c: Ctx) {
  // feet
  for (const dx of [-4, 4]) {
    P(c, [[24 + dx - 2, 46], [24 + dx + 2, 46], [24 + dx, 41]], mat('#f0a030'));
  }
  tail(c, 30, 40);
  const wingUp = c.has('crest') ? 2 : 0;
  if (c.has('wings')) {
    for (const side of [-1, 1]) {
      const f = (v: number) => 24 + side * (v - 24);
      P(c, [[f(30), 24], [f(46), 10], [f(47), 22], [f(42), 30], [f(34), 36]], c.c1);
      P(c, [[f(36), 22], [f(46), 12], [f(45), 22]], c.c2, 'none');
    }
  }
  E(c, 24 - 14, 28 - wingUp, 6, 10, c.c1);
  E(c, 24 + 14, 28 - wingUp, 6, 10, c.c1);
  if (!c.back) {
    E(c, 24 - 15, 32, 3, 5, c.c2, 'none');
    E(c, 24 + 15, 32, 3, 5, c.c2, 'none');
  }
  E(c, 24, 32, 12, 11, c.c1);
  if (!c.back) E(c, 24, 35, 7, 7, c.c3, 'none');
  if (c.a.tail === 'flame') flame(c, 24, 46, 1.1);
  headFeatures(c, 24, 17, 10);
  E(c, 24, 17, 10, 9, c.c1);
  if (!c.back) {
    eyes(c, 24, 16, 4.5);
    if (c.has('beak')) P(c, [[21, 19], [27, 19], [24, 30]], mat('#f0a030'));
    else P(c, [[21, 19], [27, 19], [24, 24]], mat('#f0a030'));
  }
  faceFeatures(c, 24, 17, 10);
}

function blob(c: Ctx) {
  if (c.has('silk') || c.has('halo') || c.has('leafhead')) headFeatures(c, 24, 28, 12);
  if (c.has('spikes')) {
    for (const dx of [-8, 0, 8]) P(c, [[24 + dx - 4, 26], [24 + dx + 4, 26], [24 + dx, 15 + Math.abs(dx) * 0.3]], c.c2);
  }
  if (c.has('flamehead')) flame(c, 24, 25, 1);
  E(c, 24, 34, 14, 12, c.c1, 'full', 46);
  if (!c.back) {
    E(c, 24, 39, 8, 5, c.c3, 'none', 46);
    eyes(c, 24, 32, 5);
    if (c.has('teeth')) {
      for (let i = -4; i <= 4; i++) c.g.dot(c.X(24 + i), c.Y(38), EYE);
      for (const i of [-3, 0, 3]) c.g.dot(c.X(24 + i), c.Y(39), WHITE);
    } else mouth(c, 24, 37);
    E(c, 24 - 9, 36, 2, 1.5, mat('#f08890'), 'none');
    E(c, 24 + 9, 36, 2, 1.5, mat('#f08890'), 'none');
  }
}

function fish(c: Ctx) {
  P(c, [[34, 32], [46, 22], [44, 32], [46, 42]], c.c2);
  P(c, [[16, 24], [28, 23], [22, 14]], c.c2);
  E(c, 22, 32, 15, 10, c.c1);
  if (!c.back) E(c, 20, 37, 10, 4, c.c3, 'none');
  P(c, [[20, 36], [28, 36], [26, 43]], c.c2);
  if (!c.back) {
    eyes(c, 14, 29, 0, true);
    c.g.dot(c.X(9), c.Y(35), EYE);
    c.g.dot(c.X(10), c.Y(35), EYE);
    if (c.has('whiskers')) {
      for (let i = 0; i < 4; i++) c.g.dot(c.X(9 - i), c.Y(36 + i), OUTLINE);
    }
  }
}

function serpent(c: Ctx) {
  E(c, 24, 41, 17, 5.5, c.c1);
  E(c, 26, 35, 13, 5, c.c1);
  if (!c.back) E(c, 26, 36, 8, 2, c.c3, 'none');
  E(c, 28, 29, 9, 4.5, c.c1);
  if (c.has('fins')) {
    P(c, [[30, 22], [40, 12], [38, 24]], c.c2);
  }
  E(c, 24, 21, 4.5, 8, c.c1);
  E(c, 21, 13, 9, 7, c.c1);
  if (!c.back) {
    E(c, 16, 16, 5, 3, c.c3, 'none');
    eyes(c, 24, 11, 4);
    c.g.dot(c.X(13), c.Y(17), EYE);
    c.g.dot(c.X(14), c.Y(17), EYE);
  }
}

function moth(c: Ctx) {
  for (const side of [-1, 1]) {
    E(c, 24 + side * 11, 21, 10, 9, c.c1);
    E(c, 24 + side * 9, 33, 7.5, 7, c.c1);
    if (!c.back) {
      E(c, 24 + side * 12, 20, 4, 4, c.c2, 'none');
      E(c, 24 + side * 10, 34, 2.5, 2.5, c.c2, 'none');
    }
  }
  if (c.has('stinger')) P(c, [[22, 38], [26, 38], [24, 47]], c.c2);
  E(c, 24, 30, 4.5, 10, c.c3);
  if (c.has('stripes')) for (const y of [27, 31, 35]) for (let x = -3; x <= 3; x++) c.g.dot(c.X(24 + x), c.Y(y), c.c2.d);
  // antennae
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) c.g.dot(c.X(24 + side * (2 + i)), c.Y(13 - i), OUTLINE);
    c.g.dot(c.X(24 + side * 8), c.Y(6), c.c2.m);
  }
  headFeatures(c, 24, 17, 6);
  E(c, 24, 17, 6, 5, c.c3);
  if (!c.back) eyes(c, 24, 17, 2.5);
  faceFeatures(c, 24, 17, 6);
}

function ghost(c: Ctx) {
  if (c.has('wings')) wings(c, 30, 26, 18);
  E(c, 32, 44, 3.5, 2.5, c.c1);
  E(c, 28, 40, 6, 4.5, c.c1);
  E(c, 24, 34, 10, 7, c.c1);
  E(c, 24 - 13, 28, 3.5, 4.5, c.c1);
  E(c, 24 + 13, 28, 3.5, 4.5, c.c1);
  headFeatures(c, 24, 23, 12);
  E(c, 24, 23, 13, 12.5, c.c1);
  if (!c.back) {
    E(c, 24, 28, 8, 5, c.c3, 'none');
    eyes(c, 24, 21, 5);
    const x = Math.round(c.X(24));
    const y = Math.round(c.Y(28));
    for (let i = -2; i <= 2; i++) c.g.dot(x + i, y, EYE);
    c.g.dot(x - 1, y + 1, c.c2.m);
  }
  faceFeatures(c, 24, 23, 12);
}

function plant(c: Ctx) {
  E(c, 24 - 5, 45, 3.5, 2, c.c1);
  E(c, 24 + 5, 45, 3.5, 2, c.c1);
  if (c.has('vines')) {
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      E(c, 24 + Math.cos(a) * 11, 30 + Math.sin(a) * 10, 5, 5, c.c1);
    }
    E(c, 24, 30, 12, 12, c.c1);
    for (let k = 0; k < 14; k++) c.g.dot(c.X(16 + ((k * 7) % 17)), c.Y(22 + ((k * 5) % 16)), c.c1.d);
    if (!c.back) {
      E(c, 24, 30, 6, 3, mat('#1a1626'), 'none');
      eyes(c, 24, 30, 2.5);
    }
    E(c, 18, 44, 2, 3, c.c2);
    E(c, 30, 44, 2, 3, c.c2);
    return;
  }
  if (c.has('flower')) {
    E(c, 24, 36, 9, 9, c.c1);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 - Math.PI / 2;
      E(c, 24 + Math.cos(a) * 11, 19 + Math.sin(a) * 7, 6.5, 5, c.c2);
    }
    E(c, 24, 19, 6, 4.5, mat('#f8d848'));
    if (c.has('spots')) for (const [dx, dy] of [[-12, 17], [11, 15], [0, 11]]) c.g.dot(c.X(24 + dx), c.Y(dy), c.c3.l);
    if (c.has('teeth') && !c.back) {
      P(c, [[17, 34], [31, 34], [24, 41]], mat('#3a1828'));
      for (const dx of [-5, -2, 1, 4]) c.g.dot(c.X(24 + dx), c.Y(35), WHITE);
    }
    if (!c.back) {
      eyes(c, 24, 31, 4);
      if (!c.has('teeth')) mouth(c, 24, 36);
    }
    return;
  }
  E(c, 24, 36, 9, 9, c.c1);
  E(c, 24, 22, 17, 10, c.c2, 'full', 27);
  if (c.has('spots')) {
    const w = { d: c.c3.m, m: c.c3.m, l: c.c3.l };
    E(c, 24 - 9, 20, 2.5, 2, w, 'none');
    E(c, 24 + 8, 18, 3, 2.5, w, 'none');
    E(c, 24, 15, 2, 1.5, w, 'none');
    E(c, 24 - 2, 23, 1.5, 1.2, w, 'none');
  }
  // cap underside
  for (let x = -14; x <= 14; x++) c.g.dot(c.X(24 + x), c.Y(26.6), c.c2.d);
  if (!c.back) {
    eyes(c, 24, 34, 4);
    mouth(c, 24, 38);
  }
}

function golem(c: Ctx) {
  E(c, 24 - 7, 44, 5.5, 3, c.c1);
  E(c, 24 + 7, 44, 5.5, 3, c.c1);
  if (c.has('spikes')) {
    for (const side of [-1, 1]) {
      P(c, [[24 + side * 10, 24], [24 + side * 18, 25], [24 + side * 17, 15]], c.c2);
    }
  }
  E(c, 24 - 15, 33, 5, 7, c.c1);
  E(c, 24 + 15, 33, 5, 7, c.c1);
  P(c, [[13, 26], [18, 21], [30, 21], [35, 26], [36, 38], [31, 42], [17, 42], [12, 38]], c.c1);
  if (!c.back) {
    P(c, [[16, 31], [21, 28], [23, 33], [18, 36]], c.c2, 'none');
    P(c, [[27, 35], [32, 33], [31, 39], [26, 39]], c.c2, 'none');
  }
  E(c, 24, 17, 9, 8, c.c1);
  if (!c.back) {
    eyes(c, 24, 17, 3.5);
    for (let i = -2; i <= 2; i++) c.g.dot(c.X(24 + i), c.Y(21), EYE);
  }
}

function turtle(c: Ctx) {
  E(c, 24 - 12, 42, 4.5, 4, c.c1);
  E(c, 24 + 12, 42, 4.5, 4, c.c1);
  tail(c, 36, 38);
  if (c.has('fins')) {
    for (const side of [-1, 1]) {
      const f = (x: number) => (side < 0 ? x : mx(x));
      P(c, [[f(10), 30], [f(1), 24], [f(6), 36]], c.c1);
    }
  }
  E(c, 24, 33, 16, 11, c.c2);
  if (!c.back) {
    // shell pattern
    for (const dx of [-8, 0, 8]) {
      const x = c.X(24 + dx);
      for (let i = -2; i <= 2; i++) c.g.dot(x + i, c.Y(29), c.c2.d);
    }
    E(c, 24, 39, 10, 5, c.c3);
  } else {
    for (const dx of [-6, 6]) for (let y = 26; y < 40; y++) c.g.dot(c.X(24 + dx), c.Y(y), c.c2.d);
  }
  if (c.has('spikes')) {
    for (const dx of [-10, 0, 10]) P(c, [[24 + dx - 3, 24], [24 + dx + 3, 24], [24 + dx, 15]], mat('#e8e8f0'));
  }
  headFeatures(c, 24, 20, 10);
  E(c, 24, 20, 10, 9, c.c1);
  if (!c.back) {
    eyes(c, 24, 19, 4.5);
    mouth(c, 24, 24);
  }
  faceFeatures(c, 24, 20, 10);
}

function club(c: Ctx, x: number, y: number) {
  P(c, [[x - 1, y + 10], [x + 2, y + 10], [x + 4, y - 6], [x + 1, y - 7]], mat('#f0ece0'));
  E(c, x + 3, y - 8, 3.5, 3.5, mat('#f0ece0'));
}

function insect(c: Ctx) {
  const mantis = c.has('claws');
  if (c.has('wings')) wings(c, 28, 26, 16, !mantis);
  if (mantis) {
    // upright mantis
    E(c, 24 - 6, 44, 3, 3, c.c1);
    E(c, 24 + 6, 44, 3, 3, c.c1);
    E(c, 24, 35, 8, 10, c.c1);
    if (!c.back) E(c, 24, 37, 4.5, 7, c.c3, 'none');
    for (const side of [-1, 1]) {
      const f = (v: number) => 24 + side * (v - 24);
      P(c, [[f(30), 26], [f(40), 30], [f(44), 18], [f(42), 30], [f(32), 32]], c.c2);
    }
    headFeatures(c, 24, 16, 9);
    P(c, [[13, 14], [35, 14], [24, 25]], c.c1);
    if (!c.back) eyes(c, 24, 15, 6);
    return;
  }
  // segmented grub, front view
  for (const [y, rx, ry] of [
    [41, 11, 6],
    [33, 10, 6],
  ] as [number, number, number][]) {
    for (const side of [-1, 1]) c.g.dot(c.X(24 + side * (rx + 1)), c.Y(y + 3), OUTLINE);
    E(c, 24, y, rx, ry, c.c1);
    if (!c.back) for (const dx of [-6, 0, 6]) c.g.dot(c.X(24 + dx), c.Y(y - 2), c.c2.m);
  }
  if (c.has('stinger')) P(c, [[30, 40], [34, 40], [40, 30]], c.c2);
  headFeatures(c, 24, 22, 10);
  E(c, 24, 22, 10, 9, c.c1);
  if (c.has('spots') && !c.back) for (const [dx, dy] of [[-6, 18], [6, 18]]) E(c, 24 + dx, dy, 1.5, 1.5, c.c2, 'none');
  if (!c.back) {
    E(c, 24, 25, 5, 3, c.c3, 'none');
    eyes(c, 24, 21, 4.5);
    mouth(c, 24, 26);
  }
}

function beetle(c: Ctx) {
  // legs
  for (const side of [-1, 1]) for (const y of [32, 38, 44]) P(c, [[24 + side * 10, y - 1], [24 + side * 18, y + 1], [24 + side * 17, y + 3], [24 + side * 10, y + 2]], mat('#3a3040'));
  if (c.has('cap')) {
    E(c, 24, 22, 17, 9, c.c2, 'full', 26);
    if (c.has('spots')) for (const [dx, dy] of [[-8, 18], [7, 17], [0, 15]]) E(c, 24 + dx, dy, 2.5, 1.8, c.c3, 'none');
    for (let x = -14; x <= 14; x++) c.g.dot(c.X(24 + x), c.Y(25.6), c.c2.d);
  }
  if (c.has('horns')) P(c, [[22, 30], [26, 30], [28, 8], [24, 4], [21, 12]], c.c2);
  E(c, 24, 36, 13, 10, c.c1);
  if (!c.back) for (let y = 28; y < 45; y++) c.g.dot(c.X(24), c.Y(y), c.c1.d);
  if (c.has('spikes')) for (const dx of [-8, 0, 8]) P(c, [[24 + dx - 3, 30], [24 + dx + 3, 30], [24 + dx, 23]], c.c2);
  E(c, 24, 28, 7, 5, c.c1);
  if (!c.back) {
    eyes(c, 24, 28, 3.5);
    if (c.has('horns')) P(c, [[22, 30], [26, 30], [24, 34]], c.c2);
  }
}

function crab(c: Ctx) {
  for (const side of [-1, 1]) for (const k of [0, 1, 2]) P(c, [[24 + side * 9, 38 + k * 2], [24 + side * (17 + k), 42 + k * 2], [24 + side * (16 + k), 44 + k], [24 + side * 9, 41 + k * 2]], c.c1);
  const big = c.has('spikes') ? 1.25 : 1;
  for (const side of [-1, 1]) {
    const cx = 24 + side * 15;
    E(c, 24 + side * 10, 30, 3, 4, c.c1);
    E(c, cx, 21, 7 * (side > 0 ? big : 1), 6 * (side > 0 ? big : 1), c.c1);
    if (!c.back) P(c, [[cx - 2, 14], [cx + 2, 14], [cx, 21]], mat('#201a2e'), 'none');
  }
  E(c, 24, 36, 13, 8, c.c1);
  if (!c.back) E(c, 24, 39, 8, 4, c.c3, 'none');
  for (const side of [-1, 1]) {
    for (let y = 26; y < 31; y++) c.g.dot(c.X(24 + side * 4), c.Y(y), OUTLINE);
    E(c, 24 + side * 4, 25, 2.5, 2.5, c.c2);
  }
  if (!c.back) {
    eyes(c, 24, 25, 4);
    mouth(c, 24, 36);
  }
}

function brute(c: Ctx) {
  if (c.has('wings')) wings(c, 30, 24, 16);
  E(c, 24 - 7, 44, 6, 3.5, c.c1);
  E(c, 24 + 7, 44, 6, 3.5, c.c1);
  E(c, 24 - 7, 39, 5, 5, c.c1);
  E(c, 24 + 7, 39, 5, 5, c.c1);
  if (c.a.tail && c.a.tail !== 'none') tail(c, 34, 38);
  P(c, [[10, 22], [38, 22], [33, 38], [15, 38]], c.c1);
  if (!c.back) E(c, 24, 31, 7, 6, c.c3, 'none');
  if (c.has('spikes')) for (const dx of [-9, 9]) P(c, [[24 + dx - 3, 22], [24 + dx + 3, 22], [24 + dx, 14]], c.c2);
  for (const side of [-1, 1]) {
    E(c, 24 + side * 15, 28, 4.5, 6, c.c1);
    E(c, 24 + side * 16, 36, 5, 4.5, c.c2);
  }
  if (c.has('club')) club(c, 40, 32);
  if (c.has('bolt') && !c.back) P(c, [[22, 24], [27, 24], [24, 29], [27, 29], [20, 36], [23, 30], [20, 30]], mat('#f8e048'), 'none');
  headFeatures(c, 24, 15, 9);
  E(c, 24, 15, 9, 8, c.c1);
  if (!c.back) {
    eyes(c, 24, 14, 4);
    mouth(c, 24, 19);
  }
  faceFeatures(c, 24, 15, 9);
}

function orb(c: Ctx) {
  // shadow
  E(c, 24, 45, 9, 2, mat('#c8c0b0'), 'none');
  const cy = 26;
  if (c.has('cloud')) for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    E(c, 24 + Math.cos(a) * 13, cy + Math.sin(a) * 12, 5, 5, c.c1);
  }
  if (c.has('bolt')) {
    for (const side of [-1, 1]) {
      const f = (v: number) => 24 + side * (v - 24);
      P(c, [[f(34), 18], [f(44), 14], [f(40), 22], [f(46), 22], [f(36), 32], [f(39), 25], [f(34), 26]], mat('#f8e048'));
    }
  }
  E(c, 24, cy, 13, 13, c.c1);
  if (c.a.c2 && !c.back && !c.has('cloud')) E(c, 24, cy + 6, 12, 6, c.c2, 'none', cy + 13);
  if (c.has('halo') || c.has('gem') || c.has('leafhead')) headFeatures(c, 24, cy - 2, 12);
  if (c.has('gem')) faceFeatures(c, 24, cy, 12);
  if (!c.back) {
    eyes(c, 24, cy - 2, 5);
    if (c.has('teeth')) {
      for (let i = -5; i <= 5; i++) c.g.dot(c.X(24 + i), c.Y(cy + 5), EYE);
      for (const i of [-4, -1, 2, 5]) c.g.dot(c.X(24 + i - 1), c.Y(cy + 6), WHITE);
    } else mouth(c, 24, cy + 4);
    if (c.has('cheeks')) {
      E(c, 24 - 9, cy + 3, 2, 1.5, mat('#f06878'), 'none');
      E(c, 24 + 9, cy + 3, 2, 1.5, mat('#f06878'), 'none');
    }
  }
}

function jelly(c: Ctx) {
  for (let k = 0; k < 6; k++) {
    const x = 14 + k * 4;
    for (let y = 26; y < 46; y++) c.g.dot(c.X(x + Math.round(Math.sin(y / 3 + k) * 1.5)), c.Y(y), k % 2 ? c.c2.m : c.c1.d);
  }
  E(c, 24, 20, 14, 11, c.c1, 'full', 27);
  for (let x = -13; x <= 13; x++) c.g.dot(c.X(24 + x), c.Y(26.4), c.c1.d);
  if (!c.back) {
    E(c, 24 - 6, 15, 3, 2.5, { d: c.c3.m, m: c.c3.m, l: '#ffffff' }, 'none');
    if (c.has('gem')) faceFeatures(c, 24, 24, 12);
    for (const side of [-1, 1]) E(c, 24 + side * 5, 21, 2.5, 2.5, c.c2);
    eyes(c, 24, 21, 5);
  }
}

function wyrm(c: Ctx) {
  // wings
  for (const side of [-1, 1]) {
    const f = (v: number) => 24 + side * (v - 24);
    P(c, [[f(28), 24], [f(46), 6], [f(47), 20], [f(42), 26], [f(40), 34], [f(32), 32]], c.c2);
    for (let i = 0; i < 6; i++) c.g.dot(c.X(f(31 + i * 2.5)), c.Y(22 - i * 2.6), c.c2.d);
  }
  // tail
  E(c, 33, 42, 7, 3, c.c1);
  P(c, [[38, 40], [46, 34], [41, 43]], c.c1);
  E(c, 24 - 6, 44, 4, 3, c.c1);
  E(c, 24 + 6, 44, 4, 3, c.c1);
  E(c, 24, 34, 10, 10, c.c1);
  if (!c.back) {
    E(c, 24, 36, 6, 7, c.c3, 'none');
    for (const y of [32, 35, 38, 41]) for (let x = -3; x <= 3; x++) c.g.dot(c.X(24 + x), c.Y(y), c.c3.d);
  }
  E(c, 24, 22, 5, 6, c.c1);
  headFeatures(c, 24, 14, 8);
  E(c, 24, 14, 8, 7, c.c1);
  if (!c.back) {
    E(c, 24, 18, 5, 3, c.c3, 'none');
    eyes(c, 24, 13, 4);
    if (c.has('teeth')) {
      for (const dx of [-2, 2]) c.g.dot(c.X(24 + dx), c.Y(20), WHITE);
    }
    mouth(c, 24, 18);
  }
}

function star(c: Ctx) {
  const pts: Pt[] = [];
  const cy = 30;
  const rot = c.a.size > 0.8 ? Math.PI / 10 : 0;
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k / 10) * Math.PI * 2 + rot;
    const r = k % 2 ? 7 : 17;
    pts.push([24 + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  if (c.a.size > 0.8) {
    // second, offset star behind for the evolved form
    P(
      c,
      pts.map(([x, y]) => [24 + (x - 24) * 0.9, cy + (y - cy) * 0.9 - 0] as Pt).map(([x, y]) => {
        const a = Math.PI / 5;
        const dx = x - 24;
        const dy = y - cy;
        return [24 + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)] as Pt;
      }),
      c.c2,
    );
  }
  P(c, pts, c.c1);
  if (!c.back) {
    E(c, 24, cy, 4.5, 4.5, GEM);
    E(c, 23, cy - 1, 1.5, 1.5, { d: '#ffffff', m: '#ffffff', l: '#ffffff' }, 'none');
  }
}

function clam(c: Ctx) {
  if (c.has('spiral')) {
    // ammonite: coiled shell with tentacled face
    for (let k = 0; k < 7; k++) {
      const x = 15 + k * 3;
      for (let y = 38; y < 46; y++) c.g.dot(c.X(x), c.Y(y + Math.round(Math.sin(k + y) * 0.5)), c.c2.m);
    }
    E(c, 24, 26, 15, 14, c.c1);
    if (c.has('spikes')) for (const dx of [-10, 0, 10]) P(c, [[24 + dx - 3, 14], [24 + dx + 3, 14], [24 + dx, 6]], c.c1);
    if (!c.back) {
      let r = 12;
      for (let a = 0; a < Math.PI * 5; a += 0.12) {
        r = 12 - a * 0.7;
        if (r < 1) break;
        c.g.dot(c.X(24 + Math.cos(a) * r), c.Y(26 + Math.sin(a) * r), c.c1.d);
      }
      E(c, 24, 38, 8, 4, c.c2);
      eyes(c, 24, 37, 4);
    }
    return;
  }
  if (c.has('spikes')) for (let k = 0; k < 7; k++) {
    const a = Math.PI + (k / 6) * Math.PI;
    P(c, [[24 + Math.cos(a - 0.15) * 15, 30 + Math.sin(a - 0.15) * 13], [24 + Math.cos(a + 0.15) * 15, 30 + Math.sin(a + 0.15) * 13], [24 + Math.cos(a) * 22, 30 + Math.sin(a) * 20]], c.c2);
  }
  E(c, 24, 30, 16, 14, c.c1, 'full', 31);
  E(c, 24, 32, 16, 12, c.c1, 'full', 99);
  for (let x = -15; x <= 15; x++) c.g.dot(c.X(24 + x), c.Y(31), OUTLINE);
  if (!c.back) {
    for (const dx of [-9, -3, 3, 9]) for (let y = 19; y < 30; y++) if ((y + dx) % 3) c.g.dot(c.X(24 + dx * (1 - (30 - y) / 30)), c.Y(y), c.c1.d);
    E(c, 24, 31, 8, 3, mat('#2a1a30'), 'none');
    if (c.has('gem')) E(c, 24, 31, 2.5, 2.5, GEM, 'none');
    else {
      eyes(c, 24, 31, 3);
      E(c, 24, 33, 2, 1.5, mat('#f07890'), 'none');
    }
  }
}

const ARCH: Record<ArtSpec['arch'], (c: Ctx) => void> = { quad, biped, bird, blob, fish, serpent, moth, ghost, plant, golem, turtle, insect, beetle, crab, brute, orb, jelly, wyrm, star, clam };

export function drawCreature(a: ArtSpec, back = false): HTMLCanvasElement {
  const g = new Grid();
  const s = a.size;
  const ctx: Ctx = {
    g,
    s,
    back,
    a,
    c1: mat(a.c1),
    c2: mat(a.c2),
    c3: mat(a.c3 ?? '#f8f0e0'),
    X: (x) => 24 + (x - 24) * s,
    Y: (y) => 47 - (47 - y) * s,
    R: (r) => Math.max(1, r * s),
    has: (e) => !!a.extra?.includes(e),
  };
  ARCH[a.arch](ctx);
  return g.toCanvas(back);
}

const cache = new Map<string, HTMLCanvasElement>();

export function creatureSprite(sp: number, back = false): HTMLCanvasElement {
  const k = sp + (back ? 'b' : 'f');
  let c = cache.get(k);
  if (!c) {
    const hand = RICH[species(sp).name];
    if (hand) {
      const p = new Pix();
      hand(p, back);
      c = p.finish();
    } else c = drawCreature(species(sp).art, back);
    cache.set(k, c);
  }
  return c;
}

/** 16x16 icon: crop to the sprite's bounds, downscale by majority colour, re-outline. */
export function creatureIcon(sp: number): HTMLCanvasElement {
  const k = sp + 'i';
  const hit = cache.get(k);
  if (hit) return hit;
  const src = creatureSprite(sp);
  const sctx = src.getContext('2d')!;
  const data = sctx.getImageData(0, 0, N, N).data;
  let minX = N,
    minY = N,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (data[(y * N + x) * 4 + 3] > 0) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
  const size = Math.max(maxX - minX + 1, maxY - minY + 1);
  const T = 14;
  const scale = size / T;
  const ox = minX - (size - (maxX - minX + 1)) / 2;
  const oy = minY - (size - (maxY - minY + 1));
  const out = makeCanvas(16, 16);
  const octx = out.getContext('2d')!;
  const cells: (string | null)[] = new Array(16 * 16).fill(null);
  for (let ty = 0; ty < T; ty++)
    for (let tx = 0; tx < T; tx++) {
      const counts = new Map<string, number>();
      let filled = 0;
      let total = 0;
      for (let sy = Math.floor(oy + ty * scale); sy < Math.floor(oy + (ty + 1) * scale); sy++)
        for (let sx = Math.floor(ox + tx * scale); sx < Math.floor(ox + (tx + 1) * scale); sx++) {
          total++;
          if (sx < 0 || sy < 0 || sx >= N || sy >= N) continue;
          const i = (sy * N + sx) * 4;
          if (data[i + 3] === 0) continue;
          filled++;
          const col = `#${[data[i], data[i + 1], data[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
          if (col === OUTLINE) continue;
          counts.set(col, (counts.get(col) ?? 0) + 1);
        }
      if (filled * 2 >= Math.max(1, total)) {
        let best: string | null = null;
        let bc = 0;
        counts.forEach((v, col) => {
          if (v > bc) {
            bc = v;
            best = col;
          }
        });
        cells[(ty + 1) * 16 + tx + 1] = best ?? EYE;
      }
    }
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < 16 && y < 16 && cells[y * 16 + x] !== null && cells[y * 16 + x] !== OUTLINE;
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const col = cells[y * 16 + x];
      if (col) {
        octx.fillStyle = col;
        octx.fillRect(x, y, 1, 1);
      } else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) {
        octx.fillStyle = OUTLINE;
        octx.fillRect(x, y, 1, 1);
      }
    }
  cache.set(k, out);
  return out;
}
