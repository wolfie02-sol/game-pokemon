// Vendored from https://github.com/levy-street/pokemon-claude-red (no licence; see the README attribution).
const G = globalThis.G;
// Pokémon sprite definitions (batch 001-030). See src/art/pokesprite.js for the primitive format.
(function () {
'use strict';
const r1 = v => Math.round(v * 10) / 10;
// Pointed leaf / petal / feather polygon from base (x1,y1) to tip (x2,y2).
// w: max half-width, bend: sideways bow of the midline (+ = to the left of travel), b0: base width fraction.
function leaf(x1, y1, x2, y2, w, bend, b0, n) {
  n = n || 10; bend = bend || 0; b0 = b0 || 0;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = dy / L, ny = -dx / L;
  const A = [], B = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const prof = b0 + (1 - b0) * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.9);
    const hw = w * (i === n ? 0 : prof);
    const off = bend * 4 * t * (1 - t);
    const cx = x1 + dx * t + nx * off, cy = y1 + dy * t + ny * off;
    A.push([cx + nx * hw, cy + ny * hw]); B.unshift([cx - nx * hw, cy - ny * hw]);
  }
  return A.concat(B.slice(1)).flat().map(r1);
}
const P = (pts, o) => Object.assign({ t: 'p', pts }, o);
// Scale (k, about the ground point 32,60) and translate (dx,dy) a list of parts.
function xf(parts, k, dx, dy) {
  dx = dx || 0; dy = dy || 0;
  const X = v => r1(32 + (v - 32) * k + dx), Y = v => r1(60 + (v - 60) * k + dy);
  return parts.map(p => {
    const q = Object.assign({}, p);
    if (q.x !== undefined) { q.x = X(q.x); q.y = Y(q.y); }
    if (q.x1 !== undefined) { q.x1 = X(q.x1); q.y1 = Y(q.y1); q.x2 = X(q.x2); q.y2 = Y(q.y2); }
    for (const key of ['rx', 'ry', 'r1', 'r2', 'w', 'w2']) if (q[key] !== undefined) q[key] = r1(q[key] * k);
    if (q.t === 'eye' && q.s) q.s = r1(Math.max(2.2, q.s * k));
    if (q.t === 'mouth' && q.w) q.w = r1(Math.max(1.5, q.w * k));
    if (q.pts) q.pts = q.pts.map((v, i) => i % 2 ? Y(v) : X(v));
    return q;
  });
}
// Fan of feathers: bases spaced along (bx1,by1)->(bx2,by2), one pointed feather to each tip [x,y,...].
function fan(bx1, by1, bx2, by2, tips, w, o, bend) {
  const n = tips.length / 2, out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1), bx = bx1 + (bx2 - bx1) * t, by = by1 + (by2 - by1) * t;
    out.push(Object.assign({ t: 'p', pts: leaf(bx, by, tips[i * 2], tips[i * 2 + 1], w, bend || 0, 0.5) }, o, { g: o.g + i, z: (o.z || 0) - i * 0.01 }));
  }
  return out;
}
// Shrink a polygon toward (cx,cy) (defaults to its vertex centroid) by factor k.
function shrink(pts, k, cx, cy) {
  const n = pts.length / 2;
  if (cx === undefined) { cx = 0; cy = 0; for (let i = 0; i < n; i++) { cx += pts[i * 2] / n; cy += pts[i * 2 + 1] / n; } }
  return pts.map((v, i) => r1(i % 2 ? cy + (v - cy) * k : cx + (v - cx) * k));
}

// ---------------------------------------------------------------- IVYSAUR
G.defMon('IVYSAUR', { pal: { skin: '#68bcb0', spot: '#3c8a80', leaf: '#4aac48', leafD: '#2e7c34', bud: '#f482a2', budD: '#c44874', trunk: '#9a6a3c' }, parts: [
  { t: 'c', x1: 56, y1: 47, x2: 57, y2: 56, r1: 4.3, r2: 4.1, c: 'skin', g: 'legB2', z: -2 },
  { t: 'c', x1: 46, y1: 49, x2: 47, y2: 56, r1: 4.7, r2: 4.4, c: 'skin', g: 'legB', z: -1 },
  { t: 'e', x: 39, y: 45, rx: 18, ry: 10.5, c: 'skin', g: 'body' },
  { t: 'spot', x: 47, y: 50, rx: 3, ry: 2, c: 'spot', on: 'body' },
  { t: 'spot', x: 54, y: 44, rx: 2, ry: 1.6, c: 'spot', on: 'body' },
  { t: 'c', x1: 41, y1: 38, x2: 41, y2: 27, r1: 3.6, r2: 3, c: 'trunk', g: 'trunk', z: 0.5 },
  P(leaf(41, 30, 55, 13, 5.5, 1), { c: 'leafD', g: 'leafBk', z: 0.4 }),
  P(leaf(42, 32, 62, 30, 6.5, -3), { c: 'leaf', g: 'leafR', z: 0.6 }),
  { t: 'stripe', pts: [44, 31, 53, 29, 61, 30], w: 1, c: 'leafD', on: 'leafR' },
  P(leaf(40, 31, 19, 24, 6.5, 3), { c: 'leaf', g: 'leafL', z: 0.6 }),
  { t: 'stripe', pts: [38, 30, 29, 25, 20, 24], w: 1, c: 'leafD', on: 'leafL' },
  { t: 'e', x: 41, y: 22, rx: 6, ry: 8, c: 'bud', g: 'bud', z: 0.8, gloss: true },
  P([37, 17, 41, 8, 45, 17], { c: 'bud', g: 'bud', z: 0.8 }),
  { t: 'stripe', pts: [41, 10, 41, 29], w: 1.2, c: 'budD', on: 'bud' },
  { t: 'stripe', pts: [37.5, 16, 36.5, 27], w: 1.1, c: 'budD', on: 'bud' },
  { t: 'stripe', pts: [44.5, 16, 45.5, 27], w: 1.1, c: 'budD', on: 'bud' },
  P(leaf(41, 33, 33, 43, 5, 1), { c: 'leaf', g: 'leafF', z: 1.2 }),
  { t: 'c', x1: 18, y1: 46, x2: 17, y2: 56, r1: 4.4, r2: 4.1, c: 'skin', g: 'legF' },
  { t: 'c', x1: 30, y1: 48, x2: 30, y2: 56, r1: 4.7, r2: 4.4, c: 'skin', g: 'legF2' },
  { t: 'e', x: 21, y: 36, rx: 13.5, ry: 11, c: 'skin', g: 'head', z: 2 },
  P([10, 30, 10, 20, 18, 26], { c: 'skin', g: 'head', z: 2 }),
  P([25, 26, 30, 18, 33, 28], { c: 'skin', g: 'head', z: 2 }),
  { t: 'spot', x: 31, y: 34, rx: 2.4, ry: 2, c: 'spot', on: 'head' },
  { t: 'spot', x: 13, y: 30, rx: 1.8, ry: 1.4, c: 'spot', on: 'head' },
  { t: 'eye', x: 15, y: 35, s: 3, style: 'angry', iris: '#d03040', look: [-1, 0] },
  { t: 'eye', x: 27, y: 36, s: 3, style: 'angry', iris: '#d03040', look: [-1, 0], flip: true },
  { t: 'mouth', x: 17, y: 42, w: 3, style: 'open' },
] });

// ---------------------------------------------------------------- VENUSAUR
G.defMon('VENUSAUR', { pal: { skin: '#5eb0a4', spot: '#387c74', petal: '#f07888', petalD: '#d05068', petalS: '#fae0e6', center: '#f4d870', leaf: '#44a44c', leafD: '#2a6c34', leafL: '#78c878', trunk: '#8a5a30' }, parts: [
  { t: 'c', x1: 55, y1: 49, x2: 56, y2: 54, r1: 6, r2: 5.6, c: 'skin', g: 'legB2', z: -2 },
  { t: 'c', x1: 46, y1: 50, x2: 47, y2: 54.5, r1: 6.6, r2: 6.2, c: 'skin', g: 'legB', z: -1 },
  { t: 'e', x: 38, y: 45, rx: 22.5, ry: 12.5, c: 'skin', g: 'body' },
  { t: 'spot', x: 48, y: 51, rx: 3.2, ry: 2.4, c: 'spot', on: 'body' },
  { t: 'spot', x: 56, y: 45, rx: 2.4, ry: 2, c: 'spot', on: 'body' },
  { t: 'spot', x: 40, y: 54, rx: 2.2, ry: 1.6, c: 'spot', on: 'body' },
  { t: 'c', x1: 39, y1: 36, x2: 39, y2: 26, r1: 5.5, r2: 5, c: 'trunk', g: 'trunk', z: 0.5 },
  { t: 'stripe', pts: [37, 27, 37, 36], w: 0.8, c: '#6a4020', on: 'trunk' },
  // big drooping palm fronds
  P(leaf(35, 32, 3, 40, 8.5, 5), { c: 'leaf', g: 'lfL', z: 0.6 }),
  { t: 'stripe', pts: [34, 32, 20, 31, 5, 39], w: 1.1, c: 'leafL', on: 'lfL' },
  P(leaf(43, 32, 62, 45, 8.5, -5), { c: 'leaf', g: 'lfR', z: 0.6 }),
  { t: 'stripe', pts: [44, 32, 55, 35, 61, 44], w: 1.1, c: 'leafL', on: 'lfR' },
  P(leaf(38, 34, 29, 48, 7, 2.5), { c: 'leafD', g: 'lfF', z: 0.7 }),
  { t: 'stripe', pts: [38, 35, 31, 46], w: 0.9, c: 'leaf', on: 'lfF' },
  P(leaf(41, 34, 48, 47, 6.5, -2.5), { c: 'leafD', g: 'lfF2', z: 0.65 }),
  { t: 'stripe', pts: [41, 35, 47, 45], w: 0.9, c: 'leaf', on: 'lfF2' },
  // big pink flower with veined petals
  { t: 'e', x: 41, y: 10.5, rx: 9, ry: 5.5, rot: -5, c: 'petal', g: 'pB', z: 1 },
  { t: 'e', x: 21, y: 17, rx: 11, ry: 6.5, rot: 12, c: 'petal', g: 'pL', z: 1 },
  { t: 'e', x: 56, y: 17, rx: 6.5, ry: 6, rot: -12, c: 'petal', g: 'pR', z: 1 },
  { t: 'stripe', pts: [36, 12, 46, 9], w: 0.8, c: 'petalD', on: 'pB' },
  { t: 'stripe', pts: [30, 19, 13, 14], w: 0.8, c: 'petalD', on: 'pL' },
  { t: 'stripe', pts: [51, 19, 60, 15], w: 0.8, c: 'petalD', on: 'pR' },
  { t: 'spot', x: 39, y: 8.5, rx: 2, ry: 1.3, c: 'petalS', on: 'pB' },
  { t: 'spot', x: 16, y: 14, rx: 2.2, ry: 1.5, c: 'petalS', on: 'pL' },
  { t: 'spot', x: 58, y: 14.5, rx: 1.8, ry: 1.4, c: 'petalS', on: 'pR' },
  { t: 'e', x: 39, y: 18, rx: 7.5, ry: 4.4, c: 'center', g: 'ctr', z: 1.1 },
  { t: 'e', x: 39, y: 18.5, rx: 4, ry: 2.2, c: '#e0b048', g: 'ctr', z: 1.12, line: false },
  { t: 'e', x: 28, y: 26, rx: 12, ry: 6.5, rot: -12, c: 'petal', g: 'pFL', z: 1.2 },
  { t: 'e', x: 51, y: 26, rx: 11.5, ry: 6.5, rot: 14, c: 'petal', g: 'pFR', z: 1.2 },
  { t: 'stripe', pts: [36, 23, 19, 29], w: 0.8, c: 'petalD', on: 'pFL' },
  { t: 'stripe', pts: [43, 23, 60, 29], w: 0.8, c: 'petalD', on: 'pFR' },
  { t: 'spot', x: 23, y: 25.5, rx: 2.4, ry: 1.6, c: 'petalS', on: 'pFL' },
  { t: 'spot', x: 56, y: 25.5, rx: 2.4, ry: 1.6, c: 'petalS', on: 'pFR' },
  // front legs + big head
  { t: 'c', x1: 18, y1: 49, x2: 17, y2: 54, r1: 6, r2: 5.7, c: 'skin', g: 'legF' },
  { t: 'c', x1: 31, y1: 50, x2: 31, y2: 54.5, r1: 6.6, r2: 6.2, c: 'skin', g: 'legF2' },
  { t: 'stripe', pts: [14, 57.5, 14, 60], w: 0.8, c: 'spot', on: 'legF' },
  { t: 'stripe', pts: [28, 58, 28, 60.5], w: 0.8, c: 'spot', on: 'legF2' },
  { t: 'e', x: 17, y: 42.5, rx: 15.5, ry: 10.5, c: 'skin', g: 'head', z: 2 },
  P([4.5, 37.5, 5.5, 30, 12, 34.5], { c: 'skin', g: 'head', z: 2 }),
  P([23, 34.5, 27.5, 28.5, 30.5, 36.5], { c: 'skin', g: 'head', z: 2 }),
  { t: 'spot', x: 28, y: 43, rx: 2.6, ry: 2.2, c: 'spot', on: 'head' },
  { t: 'spot', x: 18, y: 34.5, rx: 2, ry: 1.3, c: 'spot', on: 'head' },
  { t: 'eye', x: 9.5, y: 41, s: 2.8, style: 'angry', iris: '#d03040', look: [-1, 0], wide: 1.1 },
  { t: 'eye', x: 21, y: 41.5, s: 2.8, style: 'angry', iris: '#d03040', look: [-1, 0], flip: true, wide: 1.1 },
  { t: 'mouth', x: 13, y: 47.5, w: 3.5, style: 'fang' },
] });

// ---------------------------------------------------------------- CHARMELEON
G.defMon('CHARMELEON', { pal: { skin: '#e85838', belly: '#f8d8a0', flame: '#f8c030', flameR: '#e84020' }, parts: [
  { t: 'l', pts: [42, 50, 52, 51, 57, 45, 58, 37], w: 5, w2: 3, c: 'skin', g: 'tail', z: -2 },
  P([54, 37, 53, 26, 56, 29, 58, 18, 61, 27, 62, 37, 58, 39], { c: 'flameR', g: 'fl', z: -1, flat: true }),
  { t: 'e', x: 58, y: 32, rx: 2.6, ry: 4.4, c: 'flame', g: 'fl2', flat: true },
  { t: 'c', x1: 40, y1: 35, x2: 45, y2: 40, r1: 2.5, r2: 2, c: 'skin', g: 'armB', z: -1 },
  { t: 'c', x1: 40, y1: 48, x2: 42, y2: 57, r1: 4.3, r2: 3.6, c: 'skin', g: 'legR' },
  { t: 'c', x1: 30, y1: 48, x2: 29, y2: 57, r1: 4.6, r2: 3.8, c: 'skin', g: 'legL', z: 1 },
  { t: 'e', x: 35, y: 40, rx: 9, ry: 12, c: 'skin', g: 'body' },
  { t: 'spot', x: 31, y: 43, rx: 5.5, ry: 8, c: 'belly', on: 'body', face: true },
  { t: 'c', x1: 27, y1: 34, x2: 21, y2: 39, r1: 2.6, r2: 2.2, c: 'skin', g: 'armF', z: 2 },
  P([31, 14, 44, 8, 37, 20], { c: 'skin', g: 'horn', z: 0.5 }),
  { t: 'e', x: 28, y: 19, rx: 9, ry: 8.5, c: 'skin', g: 'head', z: 1 },
  { t: 'c', x1: 26, y1: 21, x2: 17, y2: 22, r1: 6, r2: 5, c: 'skin', g: 'head', z: 1 },
  { t: 'eye', x: 21, y: 18, s: 2.4, style: 'angry', iris: '#2a6078', look: [-1, 0], wide: 0.9 },
  { t: 'eye', x: 29, y: 18, s: 2.4, style: 'angry', iris: '#2a6078', look: [-1, 0], flip: true, wide: 0.9 },
  { t: 'mouth', x: 16, y: 24, w: 2.5, style: 'fang' },
] });

// ---------------------------------------------------------------- CHARIZARD
G.defMon('CHARIZARD', { pal: { skin: '#f08830', belly: '#f8dc98', memb: '#3a88b0', flame: '#f8c030', flameR: '#e84020' }, parts: [
  P([34, 30, 32, 14, 34, 2, 40, 6, 46, 12, 44, 16, 47, 22, 43, 23, 44, 30, 40, 29], { c: 'skin', g: 'wingL', z: -5 }),
  P([35, 28, 34, 12, 35, 6, 41, 9, 44, 13], { c: 'memb', on: 'wingL', face: true }),
  P([40, 34, 44, 18, 52, 6, 58, 2, 62, 10, 62, 21, 58, 19, 60, 29, 55, 28, 55, 36, 51, 33, 46, 38], { c: 'skin', g: 'wingR', z: -4 }),
  P([42, 33, 46, 18, 53, 8, 60, 11, 60, 19], { c: 'memb', on: 'wingR', face: true }),
  { t: 'l', pts: [44, 53, 53, 56, 59, 52, 60, 46], w: 5.5, w2: 3, c: 'skin', g: 'tail', z: -2 },
  P([57, 46, 56, 37, 58, 39, 59, 31, 62, 38, 62, 46], { c: 'flameR', g: 'fl', z: -1, flat: true }),
  { t: 'e', x: 59.5, y: 42, rx: 2.2, ry: 3.6, c: 'flame', g: 'fl2', flat: true },
  { t: 'c', x1: 42, y1: 36, x2: 46, y2: 41, r1: 2.6, r2: 2.2, c: 'skin', g: 'armB', z: -1 },
  { t: 'e', x: 43, y: 50, rx: 5.5, ry: 6.5, c: 'skin', g: 'legR' },
  { t: 'c', x1: 44, y1: 53, x2: 46, y2: 57, r1: 3.6, r2: 3.2, c: 'skin', g: 'legR' },
  { t: 'e', x: 37, y: 43, rx: 11, ry: 12.5, c: 'skin', g: 'body' },
  { t: 'c', x1: 35, y1: 36, x2: 27, y2: 21, r1: 5.8, r2: 4.2, c: 'skin', g: 'body' },
  { t: 'spot', x: 32, y: 46, rx: 7, ry: 9, c: 'belly', on: 'body', face: true },
  { t: 'stripe', pts: [23, 24, 27, 33, 30, 40], w: 5, c: 'belly', on: 'body', face: true },
  { t: 'e', x: 30, y: 51, rx: 6, ry: 7, c: 'skin', g: 'legL', z: 1 },
  { t: 'c', x1: 29, y1: 53, x2: 28, y2: 57, r1: 3.8, r2: 3.4, c: 'skin', g: 'legL', z: 1 },
  { t: 'c', x1: 28, y1: 37, x2: 22, y2: 42, r1: 2.6, r2: 2.2, c: 'skin', g: 'armF', z: 3 },
  P([25, 12, 36, 7, 29, 16], { c: 'skin', g: 'horn', z: 1.5 }),
  P([22, 11, 31, 3, 26, 13], { c: 'skin', g: 'horn2', z: 1.4 }),
  { t: 'e', x: 23, y: 15, rx: 7.5, ry: 6.6, c: 'skin', g: 'head', z: 2 },
  { t: 'c', x1: 20, y1: 17.5, x2: 11, y2: 18.5, r1: 5, r2: 4, c: 'skin', g: 'head', z: 2 },
  { t: 'eye', x: 17, y: 14, s: 2.4, style: 'angry', iris: '#2a5898', look: [-1, 0] },
  { t: 'eye', x: 24, y: 13.5, s: 2.6, style: 'angry', iris: '#2a5898', look: [-1, 0], flip: true },
  { t: 'mouth', x: 10, y: 20, w: 3, style: 'line' },
] });

// ---------------------------------------------------------------- WARTORTLE
G.defMon('WARTORTLE', { pal: { skin: '#94ace8', shell: '#a86c3c', rim: '#f4ecd0', plas: '#f0d890', fluff: '#f0f2fa', fluffD: '#a4acdc' }, parts: xf([
  { t: 'e', x: 52, y: 41, rx: 9.5, ry: 11.5, c: 'fluff', g: 'tail', z: -3 },
  { t: 'e', x: 56, y: 30, rx: 6, ry: 7, c: 'fluff', g: 'tail', z: -3 },
  { t: 'stripe', pts: [46, 48, 54, 46, 59, 39, 57, 31, 53, 29], w: 1.6, c: 'fluffD', on: 'tail' },
  { t: 'c', x1: 44, y1: 36, x2: 50, y2: 40, r1: 3.2, r2: 3, c: 'skin', g: 'armB', z: -2 },
  { t: 'e', x: 37, y: 42, rx: 14, ry: 14.5, c: 'shell', g: 'shell', z: -1, bz: 3 },
  { t: 'stripe', pts: [29, 32, 45, 32], w: 1.2, c: '#7a4a24', on: 'shell', backOnly: true },
  { t: 'stripe', pts: [27, 43, 47, 43], w: 1.2, c: '#7a4a24', on: 'shell', backOnly: true },
  { t: 'stripe', pts: [37, 29, 37, 56], w: 1.2, c: '#7a4a24', on: 'shell', backOnly: true },
  { t: 'e', x: 36, y: 42, rx: 12.5, ry: 13, c: 'rim', g: 'rim', z: -0.5, face: true },
  { t: 'e', x: 31, y: 43, rx: 9, ry: 11.5, c: 'plas', g: 'plas', face: true },
  { t: 'stripe', pts: [22, 40, 40, 40], w: 1, c: '#b89860', on: 'plas' },
  { t: 'stripe', pts: [22, 47, 40, 47], w: 1, c: '#b89860', on: 'plas' },
  { t: 'c', x1: 29, y1: 51, x2: 28, y2: 56, r1: 4.4, r2: 4.2, c: 'skin', g: 'legL', z: 1 },
  { t: 'c', x1: 42, y1: 51, x2: 44, y2: 56, r1: 4.4, r2: 4.2, c: 'skin', g: 'legR', z: 0 },
  { t: 'c', x1: 23, y1: 35, x2: 16, y2: 40, r1: 3.3, r2: 2.9, c: 'skin', g: 'armF', z: 2 },
  P([18, 16, 15, 9, 16, 2, 19, 6, 22, 1, 23, 7, 28, 4, 26, 10, 25, 15], { c: 'fluff', g: 'earL', z: 0.5 }),
  { t: 'stripe', pts: [20, 15, 19, 9, 20, 5], w: 1, c: 'fluffD', on: 'earL' },
  { t: 'stripe', pts: [23, 14, 23, 10, 26, 7], w: 1, c: 'fluffD', on: 'earL' },
  P([33, 22, 38, 15, 46, 9, 51, 8, 48, 12, 52, 13, 48, 16, 51, 19, 45, 19, 46, 23, 39, 23], { c: 'fluff', g: 'earR', z: 1.5 }),
  { t: 'stripe', pts: [37, 19, 43, 14, 49, 10], w: 1, c: 'fluffD', on: 'earR' },
  { t: 'stripe', pts: [38, 22, 44, 18, 49, 17], w: 1, c: 'fluffD', on: 'earR' },
  { t: 'e', x: 27, y: 22, rx: 11.5, ry: 10.5, c: 'skin', g: 'head', z: 1 },
  { t: 'eye', x: 21, y: 21, s: 3.2, iris: '#6a3828', look: [-1, 0] },
  { t: 'eye', x: 31, y: 21, s: 3.2, iris: '#6a3828', look: [-1, 0] },
  { t: 'mouth', x: 21, y: 27, w: 3, style: 'fang' },
], 0.94, 0, 0) });

// ---------------------------------------------------------------- BLASTOISE
G.defMon('BLASTOISE', { pal: { skin: '#6890d8', shell: '#8a5a30', rim: '#f4ecd0', plas: '#e8d890', cannon: '#b0b4c0', muzzle: '#303040' }, parts: [
  { t: 'c', x1: 53, y1: 36, x2: 58, y2: 44, r1: 4.6, r2: 4.2, c: 'skin', g: 'armB', z: -2 },
  { t: 'c', x1: 46, y1: 50, x2: 47, y2: 54, r1: 6.4, r2: 6, c: 'skin', g: 'legR' },
  { t: 'e', x: 38, y: 38, rx: 20, ry: 20, c: 'shell', g: 'shell', z: -1, bz: 3 },
  { t: 'stripe', pts: [26, 26, 50, 26], w: 1.4, c: '#5e3c1c', on: 'shell', backOnly: true },
  { t: 'stripe', pts: [20, 40, 56, 40], w: 1.4, c: '#5e3c1c', on: 'shell', backOnly: true },
  { t: 'stripe', pts: [38, 18, 38, 58], w: 1.4, c: '#5e3c1c', on: 'shell', backOnly: true },
  { t: 'e', x: 36, y: 39, rx: 18, ry: 18.5, c: 'rim', g: 'rim', z: -0.5, face: true },
  { t: 'e', x: 30, y: 42, rx: 12.5, ry: 15, c: 'plas', g: 'plas', face: true },
  { t: 'stripe', pts: [16, 38, 44, 38], w: 1.1, c: '#b8a060', on: 'plas' },
  { t: 'stripe', pts: [16, 47, 44, 47], w: 1.1, c: '#b8a060', on: 'plas' },
  { t: 'c', x1: 31, y1: 50, x2: 30, y2: 54, r1: 6.8, r2: 6.2, c: 'skin', g: 'legL', z: 1 },
  { t: 'c', x1: 30, y1: 19, x2: 12, y2: 11, r1: 3.8, r2: 3.6, c: 'cannon', g: 'canL', z: 1.5, gloss: true },
  { t: 'e', x: 10.8, y: 10.5, rx: 1.6, ry: 2.8, rot: 24, c: 'muzzle', on: 'canL', face: true },
  { t: 'c', x1: 52, y1: 25, x2: 35, y2: 16, r1: 4.6, r2: 4.3, c: 'cannon', g: 'canR', z: 3, gloss: true },
  { t: 'e', x: 33.6, y: 15.4, rx: 2, ry: 3.4, rot: 28, c: 'muzzle', on: 'canR', face: true },
  { t: 'e', x: 50, y: 26, rx: 5.5, ry: 4.5, c: 'shell', g: 'mountR', z: 2.9 },
  { t: 'c', x1: 25, y1: 37, x2: 16, y2: 46, r1: 5.2, r2: 4.6, c: 'skin', g: 'armF', z: 3 },
  { t: 'e', x: 14, y: 47, rx: 4.6, ry: 4.2, c: 'skin', g: 'armF', z: 3 },
  { t: 'e', x: 23, y: 28, rx: 11, ry: 9, c: 'skin', g: 'head', z: 3.5 },
  P([15, 23, 13, 16, 20, 21], { c: 'skin', g: 'head', z: 3.5 }),
  P([27, 21, 31, 15, 32, 23], { c: 'skin', g: 'head', z: 3.5 }),
  { t: 'eye', x: 18, y: 27, s: 2.8, style: 'angry', iris: '#6a3828', look: [-1, 0] },
  { t: 'eye', x: 27, y: 27, s: 2.8, style: 'angry', iris: '#6a3828', look: [-1, 0], flip: true },
  { t: 'mouth', x: 18, y: 33, w: 3.5, style: 'smile' },
] });

// ---------------------------------------------------------------- CATERPIE
G.defMon('CATERPIE', { pal: { body: '#80c850', belly: '#f8e890', ring: '#f4f0b0', ant: '#e84830', eyeR: '#f8f0c8' }, parts: [
  P([49, 53, 58, 50, 54, 57], { c: 'body', g: 's0', z: -5 }),
  { t: 'e', x: 50, y: 55.5, rx: 3.6, ry: 3.2, c: 'body', g: 's1', z: -4 },
  { t: 'e', x: 45, y: 55, rx: 4.5, ry: 4, c: 'body', g: 's2', z: -3 },
  { t: 'e', x: 39, y: 54, rx: 5, ry: 4.6, c: 'body', g: 's3', z: -2 },
  { t: 'e', x: 34, y: 51, rx: 5, ry: 5, c: 'body', g: 's4', z: -1 },
  { t: 'e', x: 31, y: 46.5, rx: 5, ry: 4.6, c: 'body', g: 's5', z: 0 },
  { t: 'spot', x: 45, y: 58, rx: 3, ry: 1.4, c: 'belly', on: 's2' },
  { t: 'spot', x: 38, y: 57.5, rx: 3.5, ry: 1.6, c: 'belly', on: 's3' },
  { t: 'spot', x: 31, y: 54, rx: 3, ry: 2.4, c: 'belly', on: 's4' },
  { t: 'spot', x: 28, y: 49, rx: 3, ry: 2.4, c: 'belly', on: 's5' },
  { t: 'spot', x: 40, y: 52, rx: 1.8, ry: 1.8, c: 'ring', on: 's3' },
  { t: 'spot', x: 35.5, y: 48.5, rx: 1.8, ry: 1.8, c: 'ring', on: 's4' },
  { t: 'spot', x: 46, y: 53, rx: 1.5, ry: 1.5, c: 'ring', on: 's2' },
  { t: 'l', pts: [29, 35, 30, 30.5], w: 1.8, c: 'ant', g: 'ant', z: 0.5, flat: true },
  { t: 'l', pts: [26.5, 27, 30, 30.5, 33.5, 27], w: 1.8, w2: 1.4, c: 'ant', g: 'ant', z: 0.5, flat: true },
  { t: 'e', x: 28, y: 40, rx: 7.5, ry: 7, c: 'body', g: 'head', z: 1 },
  { t: 'spot', x: 23, y: 39.5, rx: 3.4, ry: 3.8, c: 'eyeR', on: 'head', face: true },
  { t: 'spot', x: 22, y: 44.5, rx: 2.4, ry: 1.6, c: 'belly', on: 'head', face: true },
  { t: 'eye', x: 23, y: 39.5, s: 2.5, sclera: false, look: [-1, 0] },
] });

// ---------------------------------------------------------------- METAPOD
G.defMon('METAPOD', { pal: { shell: '#78b848', line: '#4a8430', face: '#98d068' }, parts: xf([
  { t: 'e', x: 38, y: 55, rx: 8, ry: 4, c: 'shell', g: 'shell' },
  { t: 'e', x: 41, y: 45, rx: 9.5, ry: 12, rot: 18, c: 'shell', g: 'shell' },
  { t: 'e', x: 36, y: 31, rx: 10, ry: 8.5, rot: -20, c: 'shell', g: 'shell', gloss: true },
  P([28, 26, 36, 15, 44, 26], { c: 'shell', g: 'shell' }),
  { t: 'e', x: 30, y: 33, rx: 6.5, ry: 4.6, rot: -12, c: 'face', g: 'face', z: 1, face: true },
  { t: 'stripe', pts: [31, 41, 40, 40, 50, 37], w: 1.2, c: 'line', on: 'shell' },
  { t: 'stripe', pts: [31, 49, 41, 49, 49, 46], w: 1.2, c: 'line', on: 'shell' },
  { t: 'stripe', pts: [36, 16, 42, 24, 46, 34], w: 1.2, c: 'line', on: 'shell', backOnly: true },
  { t: 'eye', x: 27.5, y: 33, s: 2.2, style: 'sleepy', iris: '#3a3050', look: [-1, 0] },
  { t: 'eye', x: 33.5, y: 32, s: 2.2, style: 'sleepy', iris: '#3a3050', look: [-1, 0] },
], 0.88, 0, 0) });

// ---------------------------------------------------------------- BUTTERFREE
(function () {
  const wFU = [25, 26, 18, 12, 8, 7, 3, 12, 5, 21, 14, 27];
  const wFL = [27, 35, 17, 33, 9, 38, 10, 45, 17, 46, 24, 41];
  const wNU = [35, 27, 43, 11, 54, 4, 62, 8, 61, 20, 53, 28, 43, 31];
  const wNL = [36, 37, 48, 34, 58, 40, 57, 49, 49, 50, 41, 44];
  G.defMon('BUTTERFREE', { pal: { body: '#50508c', eye: '#e03858', wing: '#f8f8f8', wingK: '#262636', limb: '#88c8e8' }, parts: [
    P(wFU, { c: 'wingK', g: 'wFU', z: -3 }), P(shrink(wFU, 0.86, 22, 23), { c: 'wing', on: 'wFU' }),
    { t: 'stripe', pts: [23, 25, 12, 14], w: 0.9, c: 'wingK', on: 'wFU' },
    P(wFL, { c: 'wingK', g: 'wFL', z: -3.5 }), P(shrink(wFL, 0.78, 25, 38), { c: 'wing', on: 'wFL' }),
    P(wNU, { c: 'wingK', g: 'wNU', z: -3 }), P(shrink(wNU, 0.87, 39, 27), { c: 'wing', on: 'wNU' }),
    { t: 'stripe', pts: [38, 28, 52, 12], w: 0.9, c: 'wingK', on: 'wNU' },
    { t: 'stripe', pts: [40, 29, 58, 18], w: 0.9, c: 'wingK', on: 'wNU' },
    P(wNL, { c: 'wingK', g: 'wNL', z: -3.5 }), P(shrink(wNL, 0.78, 39, 39), { c: 'wing', on: 'wNL' }),
    { t: 'stripe', pts: [39, 39, 52, 44], w: 0.9, c: 'wingK', on: 'wNL' },
    { t: 'c', x1: 34, y1: 44, x2: 36, y2: 51, r1: 1.8, r2: 1.6, c: 'limb', g: 'legR', z: -1 },
    { t: 'e', x: 31, y: 38, rx: 6, ry: 8.5, c: 'body', g: 'body' },
    { t: 'c', x1: 29, y1: 45, x2: 27, y2: 52, r1: 1.9, r2: 1.7, c: 'limb', g: 'legL', z: 1 },
    { t: 'c', x1: 28, y1: 37, x2: 23, y2: 40, r1: 1.8, r2: 1.6, c: 'limb', g: 'armL', z: 2 },
    { t: 'l', pts: [24, 17, 21, 9, 16, 6], w: 1.3, c: 'wingK', g: 'ant', z: 0.5, flat: true },
    { t: 'l', pts: [29, 17, 33, 9, 38, 7], w: 1.3, c: 'wingK', g: 'ant', z: 0.5, flat: true },
    { t: 'e', x: 26, y: 25, rx: 8.5, ry: 7.5, c: 'body', g: 'head', z: 1 },
    { t: 'e', x: 20, y: 24, rx: 4, ry: 5, c: 'eye', g: 'eyeL', z: 2, gloss: true, face: true },
    { t: 'e', x: 30, y: 24, rx: 4.3, ry: 5.2, c: 'eye', g: 'eyeR', z: 2, gloss: true, face: true },
    { t: 'mouth', x: 24, y: 30, w: 2, style: 'fang' },
  ] });
})();

// ---------------------------------------------------------------- WEEDLE
G.defMon('WEEDLE', { pal: { body: '#d8a038', nose: '#f07c78', sting: '#ece4d4', foot: '#e87070' }, parts: [
  P([51, 52, 57, 42, 56, 53], { c: 'sting', g: 'sting2', z: -5 }),
  { t: 'e', x: 51, y: 55, rx: 3.6, ry: 3.2, c: 'body', g: 's1', z: -4 },
  { t: 'e', x: 45.5, y: 54, rx: 4.6, ry: 4.2, c: 'body', g: 's2', z: -3 },
  { t: 'e', x: 39, y: 53, rx: 5, ry: 4.8, c: 'body', g: 's3', z: -2 },
  { t: 'e', x: 32.5, y: 51, rx: 5.2, ry: 5.2, c: 'body', g: 's4', z: -1 },
  { t: 'e', x: 39, y: 58.5, rx: 1.4, ry: 1, c: 'foot', g: 'f1', z: -1.5 },
  { t: 'e', x: 32, y: 57.5, rx: 1.4, ry: 1, c: 'foot', g: 'f2', z: -0.5 },
  { t: 'e', x: 45, y: 58.5, rx: 1.3, ry: 0.9, c: 'foot', g: 'f3', z: -2.5 },
  P([24, 39, 27, 29, 31, 40], { c: 'sting', g: 'sting', z: 0.5 }),
  { t: 'e', x: 26, y: 45, rx: 7, ry: 6.5, c: 'body', g: 'head', z: 1 },
  { t: 'e', x: 20, y: 47.5, rx: 3.6, ry: 3.2, c: 'nose', g: 'nose', z: 2, gloss: true, face: true },
  { t: 'eye', x: 23.5, y: 43, s: 1.9, sclera: false, look: [-1, 0] },
] });

// ---------------------------------------------------------------- KAKUNA
G.defMon('KAKUNA', { pal: { shell: '#e4c440', line: '#a88a22', slit: '#c09a26' }, parts: [
  // back arm nub
  { t: 'p', pts: [45, 39, 51, 45, 45, 45], c: 'shell', g: 'armB', z: -1 },
  // segmented cocoon body tapering to a point
  { t: 'p', pts: [34, 55, 38.5, 60, 42, 55], c: 'shell', g: 'seg4' },
  { t: 'e', x: 38, y: 54, rx: 5.5, ry: 3.6, c: 'shell', g: 'seg3', z: 0.2 },
  { t: 'e', x: 37.5, y: 49, rx: 7.5, ry: 4.6, c: 'shell', g: 'seg2', z: 0.4 },
  { t: 'e', x: 37, y: 43, rx: 9, ry: 5.5, c: 'shell', g: 'seg1', z: 0.6 },
  // hooded head
  { t: 'p', pts: [27, 38, 27.5, 31, 31, 24.5, 37, 20.5, 42, 22.5, 45.5, 29, 46.5, 38], c: 'shell', g: 'head', z: 1 },
  { t: 'e', x: 37, y: 33, rx: 9.6, ry: 6.8, c: 'shell', g: 'head', z: 1, gloss: true },
  { t: 'stripe', pts: [37.5, 21, 39, 28, 45, 33], w: 1, c: 'line', on: 'head', backOnly: true },
  // face slit
  { t: 'stripe', pts: [27.5, 30.5, 33, 30, 40, 31.5], w: 1.1, c: 'line', on: 'head', face: true },
  // front arm nub
  { t: 'p', pts: [29, 40, 23.5, 46, 30, 45.5], c: 'shell', g: 'armF', z: 2 },
  { t: 'p', pts: [27.5, 32.5, 33, 34.3, 32.2, 36.8, 28.5, 36.3], c: '#1b1a2e', g: 'eyeL', z: 3, flat: true, face: true },
  { t: 'shine', x: 29.5, y: 34.3 },
  { t: 'p', pts: [35, 34.3, 40.5, 32.5, 39.8, 36.3, 36, 36.8], c: '#1b1a2e', g: 'eyeR', z: 3, flat: true, face: true },
  { t: 'shine', x: 37, y: 34.3 },
] });

// ---------------------------------------------------------------- BEEDRILL
G.defMon('BEEDRILL', { pal: { body: '#f0c830', blk: '#302838', sting: '#eceaf0', eye: '#e02838', wing: '#d4eaf8' }, parts: [
  P(leaf(33, 25, 41, 3, 5, -1), { c: 'wing', g: 'wF', z: -4, gloss: true }),
  P(leaf(36, 26, 58, 5, 6.5, 2), { c: 'wing', g: 'wN1', z: -3, gloss: true }),
  P(leaf(37, 29, 62, 22, 5.5, 1), { c: 'wing', g: 'wN2', z: -3.2, gloss: true }),
  { t: 'stripe', pts: [37, 26, 48, 15, 57, 6], w: 0.8, c: '#98b8d0', on: 'wN1' },
  { t: 'stripe', pts: [38, 29, 50, 25, 61, 22], w: 0.8, c: '#98b8d0', on: 'wN2' },
  { t: 'e', x: 44, y: 42, rx: 8.5, ry: 12.5, rot: -35, c: 'body', g: 'abd', z: -1 },
  { t: 'stripe', pts: [35, 42, 45, 33], w: 2.4, c: 'blk', on: 'abd' },
  { t: 'stripe', pts: [40, 48, 51, 38], w: 2.4, c: 'blk', on: 'abd' },
  { t: 'c', x1: 51, y1: 49, x2: 57, y2: 58, r1: 2.8, r2: 0.4, c: 'sting', g: 'st3', z: -1.5 },
  { t: 'l', pts: [33, 36, 34, 42, 32, 46], w: 1.2, c: 'blk', g: 'leg1', z: -0.5, flat: true },
  { t: 'l', pts: [37, 38, 39, 43, 38, 48], w: 1.2, c: 'blk', g: 'leg2', z: -0.5, flat: true },
  { t: 'e', x: 32, y: 31, rx: 5.5, ry: 6, c: 'blk', g: 'thx' },
  { t: 'c', x1: 32, y1: 27, x2: 26, y2: 31, r1: 2, r2: 1.8, c: 'body', g: 'armB', z: -0.5 },
  { t: 'c', x1: 27, y1: 31, x2: 14, y2: 30, r1: 3.4, r2: 0.4, c: 'sting', g: 'st2', z: -0.5 },
  { t: 'c', x1: 33, y1: 34, x2: 27, y2: 39, r1: 2.2, r2: 2, c: 'body', g: 'armF', z: 2 },
  { t: 'c', x1: 28, y1: 40, x2: 13, y2: 43, r1: 3.8, r2: 0.4, c: 'sting', g: 'st1', z: 2 },
  { t: 'l', pts: [22, 14, 19, 7, 15, 5], w: 1.1, c: 'blk', g: 'ant', z: 0.5, flat: true },
  { t: 'l', pts: [26, 14, 28, 7, 32, 4], w: 1.1, c: 'blk', g: 'ant', z: 0.5, flat: true },
  { t: 'e', x: 24, y: 21, rx: 7.5, ry: 7, c: 'body', g: 'head', z: 1 },
  { t: 'e', x: 19.5, y: 20, rx: 3.4, ry: 4.4, rot: -15, c: 'eye', g: 'eyeL', z: 2, gloss: true, face: true },
  { t: 'e', x: 27.5, y: 19.5, rx: 3, ry: 4, rot: 15, c: 'eye', g: 'eyeR', z: 2, gloss: true, face: true },
  { t: 'mouth', x: 21, y: 26, w: 2, style: 'fang' },
] });

// ---------------------------------------------------------------- PIDGEY
G.defMon('PIDGEY', { pal: { body: '#b87c48', cream: '#f4dcae', wing: '#8c5a30', beak: '#b88878', feet: '#e8a080', blk: '#282028' }, parts: xf([
  P(leaf(45, 49, 61, 53, 3.2, 0, 0.4), { c: 'wing', g: 'tail1', z: -3 }),
  P(leaf(45, 47, 60, 45, 3.2, 0, 0.4), { c: 'body', g: 'tail2', z: -3.2 }),
  { t: 'l', pts: [40, 53, 41, 58], w: 1.6, c: 'feet', g: 'legR', z: -1, flat: true },
  { t: 'l', pts: [38, 59, 41, 58, 44, 59], w: 1.3, c: 'feet', g: 'legR', z: -1, flat: true },
  { t: 'e', x: 38, y: 46, rx: 11, ry: 10.5, c: 'body', g: 'body' },
  { t: 'spot', x: 33, y: 50, rx: 7.5, ry: 7, c: 'cream', on: 'body', face: true },
  { t: 'l', pts: [33, 54, 32, 58.5], w: 1.6, c: 'feet', g: 'legL', z: 1, flat: true },
  { t: 'l', pts: [29, 59.5, 32, 58.5, 35, 59.5], w: 1.3, c: 'feet', g: 'legL', z: 1, flat: true },
  P(leaf(40, 38, 54, 54, 6, -2, 0.3), { c: 'wing', g: 'wing', z: 1 }),
  { t: 'stripe', pts: [44, 50, 52, 52], w: 1.2, c: 'cream', on: 'wing' },
  { t: 'stripe', pts: [42, 46, 50, 48], w: 1, c: 'body', on: 'wing' },
  P(leaf(29, 25, 36, 19, 2.6, 1, 0.3), { c: 'body', g: 'crest', z: 1.4 }),
  P(leaf(27, 25, 29, 18, 2.2, 0, 0.3), { c: 'body', g: 'crest', z: 1.4 }),
  { t: 'e', x: 28, y: 32, rx: 9, ry: 8.5, c: 'body', g: 'head', z: 1.5 },
  { t: 'spot', x: 23, y: 36, rx: 5.5, ry: 4.5, c: 'cream', on: 'head', face: true },
  P([21, 31, 13, 34, 21, 37], { c: 'beak', g: 'beak', z: 2 }),
  { t: 'l', pts: [24, 31, 32, 32.5], w: 1.5, w2: 0.8, c: 'blk', g: 'mask', z: 1.6, flat: true, face: true },
  { t: 'eye', x: 23.5, y: 31, s: 2.3, iris: '#402818', look: [-1, 0] },
], 0.88, 2, 0) });

// ---------------------------------------------------------------- PIDGEOTTO
G.defMon('PIDGEOTTO', { pal: { body: '#b87c48', cream: '#f4dcae', wing: '#8c5a30', crest: '#e04838', crestY: '#f4cc48', beak: '#c09080', feet: '#e8a080', blk: '#282028' }, parts: xf([
  P(leaf(45, 50, 62, 57, 3.6, 0, 0.4), { c: 'crest', g: 'tail1', z: -3 }),
  P(leaf(45, 48, 62, 49, 3.6, 0, 0.4), { c: 'crest', g: 'tail2', z: -3.2 }),
  P(leaf(45, 46, 60, 41, 3.2, 0, 0.4), { c: 'wing', g: 'tail3', z: -3.4 }),
  { t: 'l', pts: [41, 52, 42, 58], w: 2, c: 'feet', g: 'legR', z: -1, flat: true },
  { t: 'l', pts: [38.5, 59, 42, 58, 45.5, 59], w: 1.5, c: 'feet', g: 'legR', z: -1, flat: true },
  { t: 'e', x: 38, y: 43, rx: 12, ry: 12.5, c: 'body', g: 'body' },
  { t: 'spot', x: 32, y: 47, rx: 8, ry: 9, c: 'cream', on: 'body', face: true },
  { t: 'l', pts: [33, 53, 32, 58.5], w: 2, c: 'feet', g: 'legL', z: 1, flat: true },
  { t: 'l', pts: [28.5, 59.5, 32, 58.5, 35.5, 59.5], w: 1.5, c: 'feet', g: 'legL', z: 1, flat: true },
  P(leaf(41, 32, 57, 55, 7, -2.5, 0.3), { c: 'wing', g: 'wing', z: 1 }),
  { t: 'stripe', pts: [46, 50, 55, 52], w: 1.3, c: 'cream', on: 'wing' },
  { t: 'stripe', pts: [44, 44, 53, 46], w: 1, c: 'body', on: 'wing' },
  { t: 'stripe', pts: [43, 38, 50, 40], w: 1, c: 'body', on: 'wing' },
  P(leaf(29, 20, 47, 11, 3.4, -2, 0.4), { c: 'crestY', g: 'crest1', z: 1.2 }),
  P(leaf(28, 19, 44, 4, 3.4, -2, 0.4), { c: 'crest', g: 'crest2', z: 1.3 }),
  { t: 'spot', x: 44, y: 11.5, rx: 3, ry: 2.5, c: 'crest', on: 'crest1' },
  { t: 'e', x: 27, y: 26, rx: 9, ry: 8.5, c: 'body', g: 'head', z: 1.5 },
  { t: 'spot', x: 22, y: 30, rx: 5.5, ry: 4.5, c: 'cream', on: 'head', face: true },
  P([20, 24, 13, 26, 10, 29, 14, 28.5, 20, 31], { c: 'beak', g: 'beak', z: 2 }),
  { t: 'l', pts: [22, 24.5, 32, 26], w: 1.8, w2: 0.8, c: 'blk', g: 'mask', z: 1.6, flat: true, face: true },
  { t: 'eye', x: 23, y: 24.5, s: 2.4, style: 'angry', iris: '#402818', look: [-1, 0], wide: 0.9 },
], 0.94, 0, 0) });

// ---------------------------------------------------------------- PIDGEOT
G.defMon('PIDGEOT', { pal: { body: '#c08450', cream: '#f4dcae', wing: '#9a6436', wingL: '#c89060', wingK: '#6a4020', crest: '#e84838', crestY: '#f8d048', beak: '#c89080', feet: '#e8a080', blk: '#282028' }, parts: [
  P([32, 33, 28, 22, 22, 13, 14, 6, 5, 2, 3, 9, 8, 11, 4, 16, 10, 18, 7, 23, 13, 24, 11, 29, 18, 29, 19, 34, 26, 36], { c: 'wing', g: 'wingL', z: -4 }),
  P([32, 33, 28, 22, 22, 13, 14, 6, 5, 2, 12, 9, 19, 17, 24, 25, 27, 34], { c: 'wingL', on: 'wingL' }),
  { t: 'stripe', pts: [8, 11, 16, 15], w: 0.8, c: 'wingK', on: 'wingL' },
  { t: 'stripe', pts: [10, 18, 18, 21], w: 0.8, c: 'wingK', on: 'wingL' },
  { t: 'stripe', pts: [13, 24, 21, 26], w: 0.8, c: 'wingK', on: 'wingL' },
  { t: 'stripe', pts: [18, 29, 24, 31], w: 0.8, c: 'wingK', on: 'wingL' },
  P([40, 37, 44, 25, 50, 15, 57, 7, 62, 2, 62, 10, 59, 12, 62, 18, 57, 20, 60, 26, 54, 27, 56, 33, 50, 33, 50, 39, 45, 40], { c: 'wing', g: 'wingR', z: -4 }),
  P([40, 37, 44, 25, 50, 15, 57, 7, 62, 2, 55, 12, 50, 20, 46, 28, 44, 37], { c: 'wingL', on: 'wingR' }),
  { t: 'stripe', pts: [59, 12, 52, 16], w: 0.8, c: 'wingK', on: 'wingR' },
  { t: 'stripe', pts: [57, 20, 50, 22], w: 0.8, c: 'wingK', on: 'wingR' },
  { t: 'stripe', pts: [54, 27, 48, 28], w: 0.8, c: 'wingK', on: 'wingR' },
  { t: 'stripe', pts: [50, 33, 46, 34], w: 0.8, c: 'wingK', on: 'wingR' },
  P(leaf(44, 52, 61, 59, 4, 0, 0.4), { c: 'crest', g: 'tail1', z: -3 }),
  P(leaf(44, 50, 62, 52, 4, 0, 0.4), { c: 'crestY', g: 'tail2', z: -3.2 }),
  P(leaf(44, 48, 62, 44, 3.6, 0, 0.4), { c: 'crest', g: 'tail3', z: -3.4 }),
  { t: 'l', pts: [42, 53, 43, 59], w: 2.2, c: 'feet', g: 'legR', z: -1, flat: true },
  { t: 'l', pts: [39, 60, 43, 59, 47, 60], w: 1.6, c: 'feet', g: 'legR', z: -1, flat: true },
  { t: 'e', x: 37, y: 44, rx: 12.5, ry: 13, c: 'body', g: 'body' },
  { t: 'c', x1: 34, y1: 36, x2: 28, y2: 26, r1: 7, r2: 6, c: 'body', g: 'body' },
  { t: 'e', x: 35.5, y: 26, rx: 6.5, ry: 7.5, rot: -25, c: 'body', g: 'body' },
  { t: 'spot', x: 31, y: 47, rx: 8.5, ry: 10.5, c: 'cream', on: 'body', face: true },
  { t: 'l', pts: [32, 55, 31, 59.5], w: 2.2, c: 'feet', g: 'legL', z: 1, flat: true },
  { t: 'l', pts: [27, 60.5, 31, 59.5, 35, 60.5], w: 1.6, c: 'feet', g: 'legL', z: 1, flat: true },
  { t: 'l', pts: [20, 14.5, 27, 11, 35, 11.5, 43, 15, 49, 21, 53, 29], w: 7, w2: 1.4, c: 'crestY', g: 'crest1', z: 1.2 },
  { t: 'l', pts: [30, 13.5, 37, 15.5, 42, 20, 45, 27], w: 3.6, w2: 1, c: 'crest', g: 'crest2', z: 1.1 },
  { t: 'stripe', pts: [22, 12, 28, 8.5, 36, 8.5, 45, 12, 52, 18.5, 56, 28], w: 4, w2: 1.4, c: 'crest', on: 'crest1' },
  { t: 'e', x: 25, y: 22, rx: 9, ry: 8.5, c: 'body', g: 'head', z: 1.5 },
  { t: 'spot', x: 20, y: 26, rx: 5.5, ry: 4.5, c: 'cream', on: 'head', face: true },
  P([18, 20, 10, 22, 7, 26, 11, 25, 18, 27], { c: 'beak', g: 'beak', z: 2 }),
  { t: 'l', pts: [20, 20.5, 31, 22], w: 1.8, w2: 0.8, c: 'blk', g: 'mask', z: 1.6, flat: true, face: true },
  { t: 'eye', x: 21, y: 20.5, s: 2.4, style: 'angry', iris: '#402818', look: [-1, 0], wide: 0.9 },
] });

// ---------------------------------------------------------------- RATTATA
G.defMon('RATTATA', { pal: { fur: '#a070b8', belly: '#f0e0b8', earIn: '#e8a8c0', tooth: '#fafafa', whisk: '#f0e8f8', nose: '#e86888' }, parts: [
  { t: 'l', pts: [48, 52, 56, 51, 60, 45, 59, 39, 55, 38, 53, 42], w: 2.6, w2: 1.4, c: 'fur', g: 'tail', z: -3 },
  { t: 'c', x1: 44, y1: 52, x2: 44, y2: 57, r1: 2.3, r2: 2, c: 'fur', g: 'legB2', z: -2 },
  { t: 'e', x: 40, y: 48, rx: 11, ry: 8.5, c: 'fur', g: 'body' },
  { t: 'spot', x: 36, y: 54, rx: 8, ry: 3.6, c: 'belly', on: 'body', face: true },
  { t: 'e', x: 49, y: 51, rx: 5, ry: 5.5, c: 'fur', g: 'legB', z: 0.5 },
  { t: 'e', x: 47, y: 57.5, rx: 3.5, ry: 1.6, c: 'belly', g: 'footB', z: 0.6 },
  { t: 'c', x1: 34, y1: 52, x2: 34, y2: 57.5, r1: 2.1, r2: 1.9, c: 'fur', g: 'legF2', z: -0.5 },
  { t: 'c', x1: 29, y1: 52, x2: 28, y2: 58, r1: 2.3, r2: 2, c: 'fur', g: 'legF', z: 1 },
  { t: 'e', x: 21, y: 33, rx: 4, ry: 5.5, rot: -12, c: 'fur', g: 'earL', z: 1.4 },
  { t: 'spot', x: 20.5, y: 33, rx: 2.4, ry: 3.6, rot: -12, c: 'earIn', on: 'earL', face: true },
  { t: 'e', x: 30, y: 33, rx: 4.6, ry: 6, rot: 15, c: 'fur', g: 'earR', z: 1.5 },
  { t: 'spot', x: 29.5, y: 33.5, rx: 2.8, ry: 4, rot: 15, c: 'earIn', on: 'earR', face: true },
  { t: 'e', x: 26, y: 42, rx: 9, ry: 8, c: 'fur', g: 'head', z: 2 },
  { t: 'e', x: 18, y: 45, rx: 5.5, ry: 4.2, c: 'fur', g: 'head', z: 2 },
  { t: 'spot', x: 18, y: 47.5, rx: 5, ry: 2.6, c: 'belly', on: 'head', face: true },
  { t: 'e', x: 13, y: 44.5, rx: 1.4, ry: 1.2, c: 'nose', g: 'nose', z: 2.5, face: true },
  P([15, 48, 15, 52, 18, 52, 18, 48], { c: 'tooth', g: 'tooth', z: 2.6, face: true }),
  { t: 'l', pts: [15, 46, 8, 44], w: 0.8, c: 'whisk', g: 'wh', z: 3, flat: true, line: false, face: true },
  { t: 'l', pts: [15, 47.5, 8, 48.5], w: 0.8, c: 'whisk', g: 'wh', z: 3, flat: true, line: false, face: true },
  { t: 'eye', x: 22, y: 40, s: 2.8, iris: '#c02848', look: [-1, 0] },
] });

// ---------------------------------------------------------------- RATICATE
G.defMon('RATICATE', { pal: { fur: '#c89058', belly: '#f4e4c0', earIn: '#f0c8a0', tooth: '#fafafa', whisk: '#faf4e8', nose: '#8a4a30' }, parts: [
  { t: 'l', pts: [46, 55, 55, 56, 60, 50, 60, 42, 57, 38], w: 3.4, w2: 1.8, c: 'fur', g: 'tail', z: -3 },
  { t: 'e', x: 45, y: 51, rx: 7, ry: 7, c: 'fur', g: 'legB', z: -1 },
  { t: 'e', x: 45, y: 58, rx: 5, ry: 2, c: 'belly', g: 'footB', z: -0.9 },
  { t: 'c', x1: 40, y1: 36, x2: 45, y2: 42, r1: 2.6, r2: 2.2, c: 'fur', g: 'armB', z: -1 },
  { t: 'e', x: 37, y: 44, rx: 11, ry: 12.5, c: 'fur', g: 'body' },
  { t: 'spot', x: 32, y: 47, rx: 7, ry: 9.5, c: 'belly', on: 'body', face: true },
  { t: 'e', x: 38, y: 53, rx: 7, ry: 6, c: 'fur', g: 'legF', z: 0.5 },
  { t: 'e', x: 33, y: 58.5, rx: 5, ry: 2, c: 'belly', g: 'footF', z: 0.6 },
  { t: 'c', x1: 29, y1: 40, x2: 23, y2: 45, r1: 2.8, r2: 2.4, c: 'fur', g: 'armF', z: 2.5 },
  { t: 'e', x: 22.5, y: 45.5, rx: 2.8, ry: 2.2, c: 'belly', g: 'handF', z: 2.6 },
  { t: 'e', x: 32, y: 20, rx: 4, ry: 4.5, rot: 25, c: 'fur', g: 'earR', z: 1.5 },
  { t: 'spot', x: 32, y: 20.5, rx: 2.4, ry: 2.8, rot: 25, c: 'earIn', on: 'earR', face: true },
  { t: 'e', x: 21, y: 20, rx: 3.4, ry: 4, rot: -20, c: 'fur', g: 'earL', z: 1.4 },
  P(leaf(33, 31, 42, 28, 2.4, 0, 0.4), { c: 'belly', g: 'tuft1', z: 1.9 }),
  P(leaf(33, 34, 42, 35, 2.4, 0, 0.4), { c: 'belly', g: 'tuft2', z: 1.9 }),
  { t: 'e', x: 26, y: 29, rx: 10.5, ry: 9, c: 'fur', g: 'head', z: 2 },
  { t: 'e', x: 17, y: 33, rx: 6.5, ry: 5, c: 'fur', g: 'head', z: 2 },
  { t: 'spot', x: 17, y: 36, rx: 6, ry: 3, c: 'belly', on: 'head', face: true },
  { t: 'e', x: 11.5, y: 32, rx: 1.8, ry: 1.5, c: 'nose', g: 'nose', z: 2.5, face: true },
  P([13, 36, 12.5, 44, 17, 44, 16.5, 36], { c: 'tooth', g: 'tooth', z: 2.6, face: true }),
  { t: 'stripe', pts: [14.8, 37, 14.8, 44], w: 0.6, c: '#c8c0b0', on: 'tooth' },
  { t: 'l', pts: [15, 33, 6, 29], w: 0.9, c: 'whisk', g: 'wh', z: 3, flat: true, face: true },
  { t: 'l', pts: [15, 34.5, 5, 34], w: 0.9, c: 'whisk', g: 'wh', z: 3, flat: true, face: true },
  { t: 'l', pts: [15, 36, 6, 39], w: 0.9, c: 'whisk', g: 'wh', z: 3, flat: true, face: true },
  { t: 'eye', x: 21, y: 27, s: 2.5, style: 'angry', iris: '#302020', look: [-1, 0] },
  { t: 'eye', x: 29, y: 27, s: 2.3, style: 'angry', iris: '#302020', look: [-1, 0], flip: true },
] });

// ---------------------------------------------------------------- SPEAROW
G.defMon('SPEAROW', { pal: { body: '#a87444', cream: '#f0d8b0', wing: '#c84c34', beak: '#f0a890', feet: '#e8a080', blk: '#282028' }, parts: xf([
  P([31, 34, 26, 24, 18, 18, 22, 25, 16, 26, 24, 31], { c: 'wing', g: 'wingL', z: -4 }),
  P(leaf(45, 49, 60, 53, 3, 0, 0.4), { c: 'body', g: 'tail1', z: -3 }),
  P(leaf(45, 47, 59, 45, 3, 0, 0.4), { c: 'body', g: 'tail2', z: -3.2 }),
  { t: 'l', pts: [40, 53, 41, 58], w: 1.6, c: 'feet', g: 'legR', z: -1, flat: true },
  { t: 'l', pts: [38, 59, 41, 58, 44, 59], w: 1.3, c: 'feet', g: 'legR', z: -1, flat: true },
  { t: 'e', x: 38, y: 46, rx: 10.5, ry: 10, c: 'body', g: 'body' },
  { t: 'spot', x: 33, y: 50, rx: 7, ry: 6.5, c: 'cream', on: 'body', face: true },
  { t: 'l', pts: [33, 54, 32, 58.5], w: 1.6, c: 'feet', g: 'legL', z: 1, flat: true },
  { t: 'l', pts: [29, 59.5, 32, 58.5, 35, 59.5], w: 1.3, c: 'feet', g: 'legL', z: 1, flat: true },
  P([40, 40, 46, 30, 54, 24, 60, 22, 58, 27, 61, 29, 56, 33, 59, 36, 52, 38, 54, 42, 46, 44], { c: 'wing', g: 'wingR', z: 1 }),
  { t: 'stripe', pts: [44, 40, 52, 31, 58, 25], w: 1, c: '#8a3024', on: 'wingR' },
  P([29, 26, 31, 19, 34, 25, 38, 21, 37, 28], { c: 'body', g: 'crest', z: 1.4 }),
  { t: 'e', x: 28, y: 32, rx: 8.5, ry: 8, c: 'body', g: 'head', z: 1.5 },
  { t: 'spot', x: 24, y: 36.5, rx: 5, ry: 3.5, c: 'cream', on: 'head', face: true },
  P([21, 31, 12, 33.5, 15, 34.5, 21, 36.5], { c: 'beak', g: 'beak', z: 2 }),
  { t: 'l', pts: [24, 30.5, 31, 32], w: 1.6, w2: 0.8, c: 'blk', g: 'mask', z: 1.6, flat: true, face: true },
  { t: 'eye', x: 24, y: 30.5, s: 2.3, style: 'angry', iris: '#402818', look: [-1, 0], wide: 0.9 },
], 0.88, 2, 0) });

// ---------------------------------------------------------------- FEAROW
G.defMon('FEAROW', { pal: { body: '#a87444', cream: '#f0dcb4', wing: '#8a5c34', wingL: '#b88450', wingK: '#5a3818', crest: '#d84830', beak: '#f0a890', feet: '#e8a080', blk: '#282028' }, parts: [
  P([38, 36, 34, 26, 28, 17, 20, 10, 12, 6, 12, 11, 16, 13, 13, 17, 19, 19, 17, 24, 24, 25, 23, 30, 30, 31, 31, 37], { c: 'wing', g: 'wingL', z: -4 }),
  P([38, 36, 34, 26, 28, 17, 20, 10, 12, 6, 20, 13, 27, 21, 31, 29, 34, 37], { c: 'wingL', on: 'wingL' }),
  { t: 'stripe', pts: [16, 13, 22, 16], w: 0.8, c: 'wingK', on: 'wingL' },
  { t: 'stripe', pts: [19, 19, 25, 21], w: 0.8, c: 'wingK', on: 'wingL' },
  { t: 'stripe', pts: [24, 25, 29, 27], w: 0.8, c: 'wingK', on: 'wingL' },
  P([44, 39, 48, 28, 53, 17, 58, 9, 62, 3, 62, 11, 59, 14, 62, 19, 57, 22, 60, 28, 54, 30, 56, 36, 50, 36, 50, 42], { c: 'wing', g: 'wingR', z: -4 }),
  P([44, 39, 48, 28, 53, 17, 58, 9, 62, 3, 57, 13, 53, 22, 49, 31, 47, 40], { c: 'wingL', on: 'wingR' }),
  { t: 'stripe', pts: [59, 14, 54, 18], w: 0.8, c: 'wingK', on: 'wingR' },
  { t: 'stripe', pts: [57, 22, 52, 25], w: 0.8, c: 'wingK', on: 'wingR' },
  { t: 'stripe', pts: [54, 30, 49, 32], w: 0.8, c: 'wingK', on: 'wingR' },
  { t: 'stripe', pts: [50, 36, 47, 38], w: 0.8, c: 'wingK', on: 'wingR' },
  P(leaf(48, 52, 62, 58, 3.5, 0, 0.4), { c: 'wing', g: 'tail1', z: -3 }),
  P(leaf(48, 50, 62, 50, 3.5, 0, 0.4), { c: 'body', g: 'tail2', z: -3.2 }),
  { t: 'l', pts: [45, 54, 46, 59], w: 2, c: 'feet', g: 'legR', z: -1, flat: true },
  { t: 'l', pts: [42.5, 60, 46, 59, 49.5, 60], w: 1.5, c: 'feet', g: 'legR', z: -1, flat: true },
  { t: 'e', x: 41, y: 46, rx: 12, ry: 11, c: 'body', g: 'body' },
  { t: 'spot', x: 36, y: 51, rx: 8, ry: 6.5, c: 'cream', on: 'body', face: true },
  { t: 'l', pts: [36, 54, 35, 59.5], w: 2, c: 'feet', g: 'legL', z: 1, flat: true },
  { t: 'l', pts: [31.5, 60.5, 35, 59.5, 38.5, 60.5], w: 1.5, c: 'feet', g: 'legL', z: 1, flat: true },
  { t: 'l', pts: [37, 42, 31, 33, 29, 24, 29, 16], w: 10, w2: 7.5, c: 'cream', g: 'neck', z: 0.5 },
  P([31, 41, 29, 35, 33, 37, 35, 32, 38, 36, 42, 33, 42, 38, 47, 37, 44, 42], { c: 'body', g: 'ruff', z: 0.6 }),
  P([30, 9, 34, 1, 36, 8, 42, 3, 40, 11, 46, 10, 39, 16], { c: 'crest', g: 'crest', z: 1.4 }),
  { t: 'e', x: 29, y: 13, rx: 8, ry: 7, c: 'body', g: 'head', z: 1.5 },
  { t: 'spot', x: 26, y: 18.5, rx: 5.5, ry: 3, c: 'cream', on: 'head', face: true },
  { t: 'c', x1: 24, y1: 15, x2: 4, y2: 20, r1: 3.6, r2: 0.8, c: 'beak', g: 'beak', z: 2 },
  { t: 'stripe', pts: [23, 16, 6, 20], w: 0.6, c: '#b86858', on: 'beak' },
  { t: 'l', pts: [26, 11.5, 34, 13], w: 1.5, w2: 0.8, c: 'blk', g: 'mask', z: 1.6, flat: true, face: true },
  { t: 'eye', x: 26, y: 11.5, s: 2.4, style: 'angry', iris: '#402818', look: [-1, 0], wide: 0.9 },
] });

// ---------------------------------------------------------------- EKANS
G.defMon('EKANS', { pal: { body: '#a070c0', band: '#f0d050', belly: '#f4e4a8' }, parts: [
  { t: 'l', pts: [48, 52, 55, 50, 58, 44], w: 5, w2: 3, c: 'body', g: 'tail', z: -4 },
  { t: 'e', x: 58.5, y: 40, rx: 2.6, ry: 4, c: 'band', g: 'rattle', z: -3.9 },
  { t: 'stripe', pts: [55, 40, 62, 40], w: 0.8, c: '#b89020', on: 'rattle' },
  { t: 'e', x: 38, y: 53, rx: 16, ry: 6, c: 'body', g: 'coil1', z: -2 },
  { t: 'e', x: 37, y: 47.5, rx: 12, ry: 5, c: 'body', g: 'coil2', z: -1 },
  { t: 'l', pts: [43, 46, 41, 38, 35, 31, 28, 27], w: 8.5, w2: 7, c: 'body', g: 'neck', z: 0 },
  { t: 'stripe', pts: [35, 47, 34, 39, 29, 33], w: 4.5, c: 'belly', on: 'neck', face: true },
  { t: 'stripe', pts: [30, 25, 32, 34], w: 2.6, c: 'band', on: 'neck' },
  { t: 'e', x: 24, y: 25, rx: 8.5, ry: 6.5, c: 'body', g: 'head', z: 1 },
  { t: 'e', x: 17, y: 27, rx: 5, ry: 3.8, c: 'body', g: 'head', z: 1 },
  { t: 'eye', x: 20, y: 23, s: 2.5, style: 'angry', iris: '#e8c030', look: [-1, 0], wide: 1 },
  { t: 'eye', x: 27, y: 22.5, s: 2.3, style: 'angry', iris: '#e8c030', look: [-1, 0], flip: true, wide: 1 },
  { t: 'mouth', x: 15, y: 28.5, w: 2.5, style: 'tongue' },
] });

// ---------------------------------------------------------------- ARBOK
G.defMon('ARBOK', { pal: { body: '#8a5cac', belly: '#f0dc98', red: '#d83838', yel: '#f0d040', blk: '#282030' }, parts: [
  { t: 'l', pts: [50, 56, 57, 54, 60, 48, 58, 43], w: 5, w2: 1.4, c: 'body', g: 'tail', z: -4 },
  { t: 'e', x: 38, y: 54, rx: 19, ry: 6.5, c: 'body', g: 'coil1', z: -2 },
  { t: 'e', x: 39, y: 48, rx: 14, ry: 5.5, c: 'body', g: 'coil2', z: -1 },
  { t: 'l', pts: [44, 48, 40, 42, 36, 36], w: 9, w2: 8, c: 'body', g: 'neck', z: -0.5 },
  { t: 'e', x: 35, y: 28, rx: 14, ry: 15, c: 'body', g: 'hood', z: 0 },
  { t: 'e', x: 35, y: 22, rx: 15, ry: 10, c: 'body', g: 'hood', z: 0 },
  { t: 'spot', x: 34, y: 30, rx: 5.5, ry: 6, c: 'red', on: 'hood', face: true },
  { t: 'stripe', pts: [23, 23, 27, 19, 32, 22], w: 1.6, c: 'blk', on: 'hood', face: true },
  { t: 'stripe', pts: [37, 22, 42, 19, 47, 23], w: 1.6, c: 'blk', on: 'hood', face: true },
  { t: 'spot', x: 27, y: 25, rx: 3, ry: 2.2, c: 'yel', on: 'hood', face: true },
  { t: 'spot', x: 42, y: 25, rx: 3, ry: 2.2, c: 'yel', on: 'hood', face: true },
  { t: 'stripe', pts: [25, 36, 29, 40, 34, 41, 39, 40, 44, 36], w: 1.8, c: 'blk', on: 'hood', face: true },
  { t: 'stripe', pts: [27, 34, 30, 37], w: 2.5, c: 'yel', on: 'hood', face: true },
  { t: 'stripe', pts: [42, 34, 39, 37], w: 2.5, c: 'yel', on: 'hood', face: true },
  { t: 'e', x: 27, y: 11, rx: 9, ry: 6.5, c: 'body', g: 'head', z: 1 },
  { t: 'e', x: 19, y: 13.5, rx: 6, ry: 4.2, c: 'body', g: 'head', z: 1 },
  { t: 'spot', x: 20, y: 17, rx: 6, ry: 2, c: 'belly', on: 'head', face: true },
  { t: 'eye', x: 22, y: 9.5, s: 2.5, style: 'angry', iris: '#e8c030', look: [-1, 0], wide: 1 },
  { t: 'eye', x: 30, y: 9, s: 2.3, style: 'angry', iris: '#e8c030', look: [-1, 0], flip: true, wide: 1 },
  { t: 'mouth', x: 16, y: 14.5, w: 3, style: 'fang' },
] });

// ---------------------------------------------------------------- RAICHU
G.defMon('RAICHU', { pal: { fur: '#ec9430', belly: '#f8e0a8', cheek: '#f8e040', brown: '#9a5a2c', earIn: '#f8d860', tail: '#302830', bolt: '#f4c430' }, parts: [
  // long thin black tail ending in a lightning-bolt tip
  { t: 'l', pts: [42, 53, 50, 57, 56, 54, 57, 46, 55, 38], w: 1.9, w2: 1.5, c: 'tail', g: 'tail', z: -3, flat: true },
  P([53, 39, 57, 32, 54, 31, 60, 21, 62, 22, 59, 28, 62.5, 29, 56, 40], { c: 'bolt', g: 'bolt', z: -2.9 }),
  { t: 'e', x: 42, y: 57.5, rx: 4.8, ry: 2.3, c: 'fur', g: 'footR', z: -1 },
  { t: 'spot', x: 39, y: 58.5, rx: 2.4, ry: 1.6, c: 'brown', on: 'footR' },
  { t: 'c', x1: 42, y1: 40, x2: 47, y2: 44, r1: 2.6, r2: 2.2, c: 'fur', g: 'armR', z: -1 },
  { t: 'spot', x: 47.5, y: 44.5, rx: 2, ry: 2, c: 'brown', on: 'armR' },
  // chubby body, cream belly
  { t: 'e', x: 36, y: 46, rx: 11.5, ry: 11.5, c: 'fur', g: 'body' },
  { t: 'spot', x: 32, y: 48.5, rx: 7.5, ry: 8.5, c: 'belly', on: 'body', face: true },
  { t: 'stripe', pts: [30, 44, 42, 44], w: 1.6, c: 'brown', on: 'body', backOnly: true },
  { t: 'stripe', pts: [31, 48, 42, 48], w: 1.6, c: 'brown', on: 'body', backOnly: true },
  { t: 'e', x: 29, y: 58, rx: 5, ry: 2.4, c: 'fur', g: 'footL', z: 1 },
  { t: 'spot', x: 26, y: 58.5, rx: 2.4, ry: 1.6, c: 'brown', on: 'footL' },
  { t: 'c', x1: 28, y1: 40, x2: 22, y2: 44, r1: 2.7, r2: 2.3, c: 'fur', g: 'armL', z: 2 },
  { t: 'spot', x: 21.5, y: 44.5, rx: 2.1, ry: 2.1, c: 'brown', on: 'armL' },
  // big curled-tip ears: brown outside, yellow inside
  P(leaf(24, 24, 11, 6, 6.4, -2.5, 0.4), { c: 'brown', g: 'earL', z: 1 }),
  P(leaf(23.5, 22, 13.5, 9.5, 3.8, -1.5, 0.3), { c: 'earIn', on: 'earL', face: true }),
  { t: 'l', pts: [11.5, 7, 7, 6, 6, 9.5], w: 2.6, w2: 1.4, c: 'brown', g: 'earL', z: 1 },
  P(leaf(33, 22, 48, 6, 6.6, 2.5, 0.4), { c: 'brown', g: 'earR', z: 0.5 }),
  P(leaf(33.5, 20, 45.5, 9.5, 4, 1.5, 0.3), { c: 'earIn', on: 'earR', face: true }),
  { t: 'l', pts: [47.5, 7, 52, 6, 53, 9.5], w: 2.6, w2: 1.4, c: 'brown', g: 'earR', z: 0.5 },
  // head
  { t: 'e', x: 29, y: 30, rx: 12.5, ry: 10.5, c: 'fur', g: 'head', z: 2 },
  { t: 'spot', x: 19.5, y: 34, rx: 3.6, ry: 3, c: 'cheek', on: 'head', face: true },
  { t: 'spot', x: 39, y: 34, rx: 3.4, ry: 3, c: 'cheek', on: 'head', face: true },
  { t: 'eye', x: 24, y: 28, s: 3, look: [-0.5, -0.2], sclera: false, wide: 0.8 },
  { t: 'eye', x: 33, y: 28, s: 3, look: [-0.5, -0.2], sclera: false, wide: 0.8 },
  { t: 'mouth', x: 28.5, y: 33, w: 2.5, style: 'open' },
] });

// ---------------------------------------------------------------- SANDSHREW
G.defMon('SANDSHREW', { pal: { body: '#e8d070', belly: '#f8f0d0', brick: '#b89838', claw: '#f8f8f0' }, parts: [
  { t: 'c', x1: 45, y1: 54, x2: 53, y2: 57, r1: 3.4, r2: 1.6, c: 'body', g: 'tail', z: -3 },
  { t: 'e', x: 42, y: 57.5, rx: 4.5, ry: 2.2, c: 'body', g: 'footR', z: -1 },
  { t: 'c', x1: 40, y1: 42, x2: 44, y2: 46, r1: 2.3, r2: 2, c: 'body', g: 'armR', z: -1 },
  { t: 'e', x: 37, y: 47, rx: 10.5, ry: 11, c: 'body', g: 'body' },
  { t: 'spot', x: 32, y: 50, rx: 6.5, ry: 8, c: 'belly', on: 'body', face: true },
  { t: 'stripe', pts: [40, 37, 47, 40], w: 1, c: 'brick', on: 'body' },
  { t: 'stripe', pts: [41, 44, 47.5, 46], w: 1, c: 'brick', on: 'body' },
  { t: 'stripe', pts: [41, 51, 47, 52], w: 1, c: 'brick', on: 'body' },
  { t: 'stripe', pts: [44, 38, 44, 44], w: 1, c: 'brick', on: 'body' },
  { t: 'stripe', pts: [45, 45.5, 45, 51], w: 1, c: 'brick', on: 'body' },
  { t: 'stripe', pts: [30, 38, 44, 38], w: 1, c: 'brick', on: 'body', backOnly: true },
  { t: 'stripe', pts: [28, 45, 46, 45], w: 1, c: 'brick', on: 'body', backOnly: true },
  { t: 'stripe', pts: [28, 52, 46, 52], w: 1, c: 'brick', on: 'body', backOnly: true },
  { t: 'e', x: 30, y: 58, rx: 4.8, ry: 2.3, c: 'body', g: 'footL', z: 1 },
  { t: 'l', pts: [26, 58.5, 24.5, 59.5], w: 1, c: 'claw', g: 'clawF', z: 1.1, flat: true },
  { t: 'c', x1: 29, y1: 42, x2: 23, y2: 46, r1: 2.5, r2: 2.2, c: 'body', g: 'armL', z: 2 },
  { t: 'l', pts: [21.5, 46, 19.5, 48], w: 1.1, c: 'claw', g: 'clawA', z: 2.1, flat: true },
  { t: 'l', pts: [23, 47.5, 21.5, 50], w: 1.1, c: 'claw', g: 'clawA', z: 2.1, flat: true },
  P([23, 29, 22, 23, 27, 27], { c: 'body', g: 'head', z: 1.5 }),
  P([30, 28, 33, 22, 34, 30], { c: 'body', g: 'head', z: 1.5 }),
  { t: 'e', x: 27, y: 34, rx: 8, ry: 7.5, c: 'body', g: 'head', z: 1.5 },
  { t: 'e', x: 20, y: 37, rx: 5, ry: 3.6, rot: 10, c: 'body', g: 'head', z: 1.5 },
  { t: 'spot', x: 21, y: 39.5, rx: 5, ry: 2, c: 'belly', on: 'head', face: true },
  { t: 'e', x: 15.5, y: 37.5, rx: 1.3, ry: 1.1, c: '#3a3040', g: 'nose', z: 2, face: true },
  { t: 'eye', x: 22.5, y: 33, s: 2.3, sclera: false, look: [-1, 0] },
] });

// ---------------------------------------------------------------- SANDSLASH
(function () {
  // spines radiating from the back arc
  const spines = [];
  const cx = 38, cy = 43, R = 12.5;
  for (let i = 0; i < 9; i++) {
    const a = (-120 + i * 18) * Math.PI / 180, a2 = a + 0.14;
    const bx = cx + Math.cos(a) * R, by = cy + Math.sin(a) * R * 1.05;
    const L = i === 0 || i === 8 ? 8 : 11;
    const tx = cx + Math.cos(a2) * (R + L), ty = cy + Math.sin(a2) * (R * 1.05 + L);
    spines.push(P(leaf(bx - Math.cos(a) * 3, by - Math.sin(a) * 3, r1(tx), r1(ty), 3.4, 0, 0.6), { c: i % 2 ? 'spine' : 'spineL', g: 'sp' + i, z: -2 + (i % 2) * 0.1 }));
  }
  G.defMon('SANDSLASH', { pal: { body: '#e0c050', belly: '#f4e8b8', spine: '#a86c34', spineL: '#c88c48', claw: '#f8f8f0' }, parts: [
    ...spines,
    { t: 'c', x1: 47, y1: 55, x2: 55, y2: 58, r1: 3.6, r2: 1.8, c: 'body', g: 'tail', z: -3 },
    { t: 'e', x: 45, y: 57.5, rx: 5, ry: 2.5, c: 'body', g: 'footR', z: -1 },
    { t: 'c', x1: 43, y1: 42, x2: 47, y2: 47, r1: 2.8, r2: 2.4, c: 'body', g: 'armR', z: -1 },
    { t: 'e', x: 38, y: 46, rx: 12.5, ry: 12.5, c: 'body', g: 'body' },
    { t: 'spot', x: 32, y: 50, rx: 7.5, ry: 8.5, c: 'belly', on: 'body', face: true },
    { t: 'stripe', pts: [30, 42, 34, 44], w: 0.8, c: '#c8a860', on: 'body', face: true },
    { t: 'stripe', pts: [29, 47, 34, 49], w: 0.8, c: '#c8a860', on: 'body', face: true },
    { t: 'stripe', pts: [29, 52, 34, 54], w: 0.8, c: '#c8a860', on: 'body', face: true },
    { t: 'e', x: 31, y: 58, rx: 5.5, ry: 2.6, c: 'body', g: 'footL', z: 1 },
    { t: 'l', pts: [26.5, 58, 24, 59.5], w: 1.3, c: 'claw', g: 'clawF', z: 1.1 },
    { t: 'l', pts: [28, 59.5, 26, 60.5], w: 1.3, c: 'claw', g: 'clawF', z: 1.1 },
    { t: 'c', x1: 28, y1: 41, x2: 21, y2: 46, r1: 3, r2: 2.6, c: 'body', g: 'armL', z: 2 },
    P(leaf(20, 46, 14, 52, 1.8, 1, 0.5), { c: 'claw', g: 'clawA1', z: 2.1 }),
    P(leaf(21.5, 47.5, 17, 54, 1.8, 1, 0.5), { c: 'claw', g: 'clawA2', z: 2.1 }),
    P([22, 26, 21, 19, 27, 24], { c: 'body', g: 'head', z: 1.5 }),
    { t: 'e', x: 26, y: 31, rx: 8.5, ry: 7.5, c: 'body', g: 'head', z: 1.5 },
    { t: 'e', x: 18, y: 34, rx: 5.5, ry: 3.6, rot: 10, c: 'body', g: 'head', z: 1.5 },
    { t: 'spot', x: 19, y: 36.5, rx: 5.5, ry: 2, c: 'belly', on: 'head', face: true },
    { t: 'e', x: 13, y: 34.5, rx: 1.3, ry: 1.1, c: '#3a3040', g: 'nose', z: 2, face: true },
    { t: 'eye', x: 21, y: 30, s: 2.4, style: 'angry', sclera: false, look: [-1, 0], wide: 1 },
  ] });
})();

// ---------------------------------------------------------------- NIDORAN_F
G.defMon('NIDORAN_F', { pal: { body: '#9cc0ec', spot: '#5a7cc0', earIn: '#f0f4fc', tooth: '#fafafa' }, parts: [
  { t: 'c', x1: 49, y1: 48, x2: 54, y2: 45, r1: 2.4, r2: 1.6, c: 'body', g: 'tail', z: -3 },
  { t: 'c', x1: 44, y1: 52, x2: 45, y2: 57, r1: 3.2, r2: 3, c: 'body', g: 'legB2', z: -2 },
  { t: 'c', x1: 31, y1: 52, x2: 31, y2: 57, r1: 3.2, r2: 3, c: 'body', g: 'legF2', z: -2 },
  P(leaf(35, 42, 35, 37, 1.8, 0, 0.6), { c: 'body', g: 'sp1', z: -0.5 }),
  P(leaf(40, 41, 41, 36, 1.8, 0, 0.6), { c: 'body', g: 'sp2', z: -0.5 }),
  P(leaf(45, 42, 47, 37.5, 1.7, 0, 0.6), { c: 'body', g: 'sp3', z: -0.5 }),
  { t: 'e', x: 39, y: 48.5, rx: 12, ry: 8, c: 'body', g: 'body' },
  { t: 'spot', x: 43, y: 46, rx: 2.2, ry: 1.8, c: 'spot', on: 'body' },
  { t: 'spot', x: 38, y: 51, rx: 1.8, ry: 1.5, c: 'spot', on: 'body' },
  { t: 'spot', x: 48, y: 50, rx: 1.6, ry: 1.4, c: 'spot', on: 'body' },
  { t: 'c', x1: 48, y1: 52, x2: 49, y2: 58, r1: 3.4, r2: 3.2, c: 'body', g: 'legB', z: 0.5 },
  { t: 'c', x1: 35, y1: 53, x2: 35, y2: 58, r1: 3.4, r2: 3.2, c: 'body', g: 'legF', z: 0.5 },
  P(leaf(20, 37, 13, 24, 4.2, -0.5, 0.4), { c: 'body', g: 'earL', z: 1 }),
  P(leaf(20, 35.5, 14.5, 27, 2.3, -0.3, 0.3), { c: 'earIn', on: 'earL', face: true }),
  P(leaf(28, 36, 35, 23, 4.6, 0.5, 0.4), { c: 'body', g: 'earR', z: 1.8 }),
  P(leaf(28.5, 34.5, 33.5, 26, 2.6, 0.3, 0.3), { c: 'earIn', on: 'earR', face: true }),
  P([22, 36, 23, 32, 25, 36], { c: 'body', g: 'horn', z: 1.9 }),
  { t: 'e', x: 24, y: 43, rx: 9.5, ry: 8, c: 'body', g: 'head', z: 2 },
  { t: 'e', x: 17, y: 46, rx: 4.8, ry: 3.6, c: 'body', g: 'head', z: 2 },
  { t: 'spot', x: 29.5, y: 41, rx: 1.8, ry: 1.5, c: 'spot', on: 'head' },
  P([14.5, 48, 15, 51, 16.5, 48], { c: 'tooth', g: 'tooth', z: 2.5, face: true }),
  P([17.5, 48.5, 18, 51.5, 19.5, 48.5], { c: 'tooth', g: 'tooth', z: 2.5, face: true }),
  { t: 'eye', x: 20, y: 42, s: 2.8, iris: '#c82838', look: [-1, 0] },
] });

// ---------------------------------------------------------------- NIDORINA
G.defMon('NIDORINA', { pal: { body: '#8cb0e0', spot: '#4a68b0', earIn: '#f0f4fc', tooth: '#fafafa', spike: '#e8eef8' }, parts: [
  { t: 'c', x1: 50, y1: 46, x2: 57, y2: 42, r1: 3, r2: 1.8, c: 'body', g: 'tail', z: -3 },
  { t: 'c', x1: 46, y1: 51, x2: 47, y2: 56, r1: 4, r2: 3.8, c: 'body', g: 'legB2', z: -2 },
  { t: 'c', x1: 30, y1: 51, x2: 30, y2: 56, r1: 4, r2: 3.8, c: 'body', g: 'legF2', z: -2 },
  P(leaf(34, 36, 33, 28, 2.6, 0, 0.5), { c: 'spike', g: 'sp1', z: -0.5 }),
  P(leaf(40, 35, 40, 27, 2.6, 0, 0.5), { c: 'spike', g: 'sp2', z: -0.5 }),
  P(leaf(46, 37, 48, 30, 2.4, 0, 0.5), { c: 'spike', g: 'sp3', z: -0.5 }),
  P(leaf(51, 40, 55, 34, 2.2, 0, 0.5), { c: 'spike', g: 'sp4', z: -0.5 }),
  { t: 'e', x: 40, y: 46, rx: 14, ry: 10, c: 'body', g: 'body' },
  { t: 'spot', x: 45, y: 42, rx: 2.6, ry: 2.2, c: 'spot', on: 'body' },
  { t: 'spot', x: 39, y: 48, rx: 2.2, ry: 1.8, c: 'spot', on: 'body' },
  { t: 'spot', x: 50, y: 48, rx: 2, ry: 1.7, c: 'spot', on: 'body' },
  { t: 'spot', x: 33, y: 41, rx: 1.8, ry: 1.5, c: 'spot', on: 'body' },
  { t: 'c', x1: 50, y1: 52, x2: 51, y2: 56, r1: 4.4, r2: 4.1, c: 'body', g: 'legB', z: 0.5 },
  { t: 'c', x1: 35, y1: 53, x2: 35, y2: 56, r1: 4.4, r2: 4.1, c: 'body', g: 'legF', z: 0.5 },
  P(leaf(19, 31, 10, 15, 5, -1, 0.4), { c: 'body', g: 'earL', z: 1 }),
  P(leaf(18.5, 29, 11.5, 18, 2.8, -0.6, 0.3), { c: 'earIn', on: 'earL', face: true }),
  P(leaf(28, 30, 36, 13, 5.5, 1, 0.4), { c: 'body', g: 'earR', z: 1.8 }),
  P(leaf(28.5, 28, 34.5, 17, 3, 0.6, 0.3), { c: 'earIn', on: 'earR', face: true }),
  { t: 'e', x: 23, y: 38, rx: 10, ry: 8.5, c: 'body', g: 'head', z: 2 },
  { t: 'e', x: 15, y: 41.5, rx: 5, ry: 4, c: 'body', g: 'head', z: 2 },
  { t: 'spot', x: 29, y: 35, rx: 2, ry: 1.6, c: 'spot', on: 'head' },
  P([12, 43, 12.5, 47, 14.5, 43], { c: 'tooth', g: 'tooth', z: 2.5, face: true }),
  P([16, 44, 16.5, 48, 18.5, 44], { c: 'tooth', g: 'tooth', z: 2.5, face: true }),
  { t: 'eye', x: 17.5, y: 37, s: 2.6, style: 'angry', iris: '#c82838', look: [-1, 0], wide: 0.9 },
  { t: 'eye', x: 26, y: 36.5, s: 2.4, style: 'angry', iris: '#c82838', look: [-1, 0], flip: true, wide: 0.9 },
] });

// @@END@@
})();
