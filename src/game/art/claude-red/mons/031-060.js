// Vendored from https://github.com/levy-street/pokemon-claude-red (no licence; see the README attribution).
const G = globalThis.G;
// Pokémon sprite definitions (batch 031-060). See src/art/pokesprite.js for the primitive format.
(function () {
'use strict';
const INK = '#1b1a2e';
// small upturned mouth (centre pixel at cx,cy)
const smile = (cx, cy, hw) => ({ t: 'mouth', x: cx, y: cy, w: hw, style: 'smile' });
// generic 1px ink stroke (face detail)
const ink = (pts, c, w) => ({ t: 'l', pts, w: w || 0.9, c: c || INK, flat: true, line: false, face: true, g: 'ink', z: 9 });
// a sweeping fluffy tail from (bx,by) at angle a (deg, 0 = right, 90 = up) of length L
const sweep = (bx, by, a, L, w, c, g, z, bend) => {
  const pts = []; const b = bend === undefined ? 18 : bend;
  for (let k = 0; k <= 4; k++) {
    const t = k / 4, ang = (a - b + 2 * b * t) * Math.PI / 180, r = L * t;
    pts.push(bx + Math.cos(ang) * r, by - Math.sin(ang) * r);
  }
  return { t: 'l', pts, w, w2: w * 0.45, c, g, z };
};
const tipOf = (part, rx, c) => ({ t: 'spot', x: part.pts[part.pts.length - 2], y: part.pts[part.pts.length - 1], rx, ry: rx, c, on: part.g });
// uniformly scale a part list about (ox, oy) - used to size evolutions consistently
const scaled = (k, ox, oy, parts, dx, dy) => parts.map(p => {
  const q = Object.assign({}, p), X = v => ox + (v - ox) * k + (dx || 0), Y = v => oy + (v - oy) * k + (dy || 0);
  if (q.x !== undefined) { q.x = X(q.x); q.y = Y(q.y); }
  if (q.x1 !== undefined) { q.x1 = X(q.x1); q.y1 = Y(q.y1); q.x2 = X(q.x2); q.y2 = Y(q.y2); }
  if (q.pts) q.pts = q.pts.map((v, i) => i % 2 ? Y(v) : X(v));
  ['rx', 'ry', 'r1', 'r2'].forEach(f => { if (q[f] !== undefined) q[f] *= k; });
  if (q.t !== 'eye' && q.t !== 'mouth') { if (q.w !== undefined && !(q.w < 1)) q.w *= k; if (q.w2 !== undefined) q.w2 *= k; }
  return q;
});

// ---------------------------------------------------------------- NIDO line
// @NIDOQUEEN
G.defMon('NIDOQUEEN', { pal: { body: '#5c96c8', dark: '#3c6898', belly: '#ecdcac', plate: '#c4ae78', inner: '#2c4c78', claw: '#f4f0e8' }, parts: scaled(1, 32, 59.5, [
  { t: 'l', pts: [44, 50, 52, 53, 58, 56, 62, 57], w: 10, w2: 3, c: 'body', g: 'tail', z: -3 },
  { t: 'p', pts: [49, 52, 53, 45, 55, 53], c: 'body', g: 'tail', z: -3 },
  { t: 'c', x1: 42, y1: 46, x2: 45, y2: 56, r1: 6.5, r2: 5.5, c: 'body', g: 'legB', z: -2 },
  { t: 'e', x: 47, y: 58, rx: 5.5, ry: 2.6, c: 'body', g: 'legB', z: -2 },
  // back spikes
  { t: 'p', pts: [38, 24, 45, 20, 44, 28], c: 'body', g: 'body', z: -1 },
  { t: 'p', pts: [43, 30, 51, 27, 47, 35], c: 'body', g: 'body', z: -1 },
  { t: 'p', pts: [45, 36, 53, 35, 47, 42], c: 'body', g: 'body', z: -1 },
  { t: 'p', pts: [45, 42, 52, 44, 45, 48], c: 'body', g: 'body', z: -1 },
  { t: 'c', x1: 43, y1: 30, x2: 48, y2: 38, r1: 4, r2: 3.4, c: 'body', g: 'armB', z: -1 },
  { t: 'e', x: 35, y: 40, rx: 14, ry: 15, c: 'body', g: 'body' },
  { t: 'e', x: 29, y: 42, rx: 9, ry: 12, c: 'belly', g: 'belly', z: 0.5, face: true },
  { t: 'stripe', pts: [20, 36, 38, 36], w: 1, c: 'plate', on: 'belly' },
  { t: 'stripe', pts: [20, 41, 38, 41], w: 1, c: 'plate', on: 'belly' },
  { t: 'stripe', pts: [20, 46, 38, 46], w: 1, c: 'plate', on: 'belly' },
  { t: 'stripe', pts: [20, 51, 38, 51], w: 1, c: 'plate', on: 'belly' },
  { t: 'c', x1: 31, y1: 48, x2: 28, y2: 56, r1: 7, r2: 6, c: 'body', g: 'legF', z: 1 },
  { t: 'e', x: 25, y: 58, rx: 6.5, ry: 2.8, c: 'body', g: 'legF', z: 1 },
  { t: 'p', pts: [18, 58, 19, 56, 21, 59], c: 'claw', g: 'claw', z: 1.5 },
  { t: 'p', pts: [21, 59, 22, 56, 24, 60], c: 'claw', g: 'claw', z: 1.5 },
  { t: 'c', x1: 25, y1: 31, x2: 17, y2: 39, r1: 4.2, r2: 3.6, c: 'body', g: 'armF', z: 2 },
  { t: 'p', pts: [13, 39, 14, 43, 16, 41], c: 'claw', g: 'claw2', z: 2 },
  { t: 'p', pts: [16, 42, 18, 45, 19, 42], c: 'claw', g: 'claw2', z: 2 },
  // head
  { t: 'p', pts: [26, 17, 33, 6, 34, 20], c: 'body', g: 'earB', z: 2 },
  { t: 'p', pts: [28, 17, 32, 10, 32, 18], c: 'inner', g: 'earB', z: 2, face: true },
  { t: 'e', x: 24, y: 21, rx: 9, ry: 8, c: 'body', g: 'head', z: 3 },
  { t: 'e', x: 15, y: 24, rx: 6.5, ry: 4.6, c: 'body', g: 'head', z: 3 },
  { t: 'p', pts: [16, 16, 14, 5, 22, 13], c: 'body', g: 'earF', z: 3.5 },
  { t: 'p', pts: [17, 15, 16, 9, 20, 13], c: 'inner', g: 'earF', z: 3.5, face: true },
  { t: 'p', pts: [20, 14, 22, 9, 25, 14], c: 'body', g: 'head', z: 3 },
  { t: 'eye', x: 19, y: 21, s: 2.8, style: 'angry', iris: '#c83040', look: [-1, 0] },
  { t: 'mouth', x: 12, y: 26, w: 2.5, style: 'line' },
], -1, -2) });
// @NIDORAN_M
G.defMon('NIDORAN_M', { pal: { body: '#c88ad6', spot: '#8a50a8', ear: '#48a8a0', horn: '#f4e8f8', tooth: '#ffffff' }, parts: scaled(0.9, 32, 59.5, [
  { t: 'c', x1: 45, y1: 51, x2: 46, y2: 57, r1: 3.6, r2: 3.4, c: 'body', g: 'legB2', z: -2 },
  { t: 'c', x1: 30, y1: 51, x2: 30, y2: 57, r1: 3.6, r2: 3.4, c: 'body', g: 'legB1', z: -2 },
  { t: 'p', pts: [31, 42, 34, 33, 37, 41], c: 'body', g: 'body', z: -1 },
  { t: 'p', pts: [38, 41, 42, 33, 44, 41], c: 'body', g: 'body', z: -1 },
  { t: 'p', pts: [44, 43, 49, 37, 50, 44], c: 'body', g: 'body', z: -1 },
  { t: 'l', pts: [49, 48, 54, 46, 56, 41], w: 3, w2: 1.6, c: 'body', g: 'tail', z: -1 },
  { t: 'e', x: 39, y: 48, rx: 12.5, ry: 8.5, c: 'body', g: 'body' },
  { t: 'spot', x: 40, y: 44, rx: 2.4, ry: 1.8, c: 'spot', on: 'body' },
  { t: 'spot', x: 46, y: 49, rx: 2, ry: 1.6, c: 'spot', on: 'body' },
  { t: 'spot', x: 34, y: 47, rx: 1.8, ry: 1.5, c: 'spot', on: 'body' },
  { t: 'c', x1: 34, y1: 52, x2: 33, y2: 58, r1: 3.9, r2: 3.6, c: 'body', g: 'legF1', z: 1 },
  { t: 'c', x1: 48, y1: 52, x2: 49, y2: 58, r1: 3.9, r2: 3.6, c: 'body', g: 'legF2', z: 1 },
  { t: 'p', pts: [24, 34, 28, 22, 35, 11, 38, 22, 36, 33], c: 'body', g: 'earB', z: 1 },
  { t: 'p', pts: [27, 33, 30, 23, 35, 15, 36, 23, 34, 32], c: 'ear', g: 'earB', z: 1, face: true },
  { t: 'e', x: 23, y: 40, rx: 10, ry: 9, c: 'body', g: 'head', z: 2 },
  { t: 'e', x: 15, y: 43, rx: 6, ry: 4.6, c: 'body', g: 'head', z: 2 },
  { t: 'p', pts: [13, 37, 4, 29, 3, 16, 14, 24, 21, 31], c: 'body', g: 'earF', z: 3 },
  { t: 'p', pts: [14, 35, 6, 28, 5, 19, 13, 26, 18, 31], c: 'ear', g: 'earF', z: 3, face: true },
  { t: 'p', pts: [19, 33, 21, 20, 26, 32], c: 'horn', g: 'horn', z: 2.5 },
  { t: 'spot', x: 29, y: 41, rx: 2.2, ry: 1.8, c: 'spot', on: 'head' },
  { t: 'spot', x: 24, y: 46, rx: 1.4, ry: 1.2, c: 'spot', on: 'head' },
  { t: 'p', pts: [10.5, 46, 11, 49, 12.5, 49, 13, 46], c: 'tooth', g: 'tooth', z: 3, face: true, line: false, flat: true },
  { t: 'eye', x: 18, y: 40, s: 3, style: 'angry', iris: '#c02838', look: [-1, 0] },
], 0, -1) });
// @NIDORINO
G.defMon('NIDORINO', { pal: { body: '#c870c0', spot: '#823e96', ear: '#4c86a8', horn: '#f4e8f8', tooth: '#ffffff' }, parts: scaled(0.96, 32, 59.5, [
  { t: 'c', x1: 47, y1: 48, x2: 49, y2: 57, r1: 4.6, r2: 4.2, c: 'body', g: 'legB2', z: -2 },
  { t: 'c', x1: 29, y1: 47, x2: 28, y2: 57, r1: 4.6, r2: 4.2, c: 'body', g: 'legB1', z: -2 },
  { t: 'p', pts: [29, 36, 33, 23, 37, 35], c: 'body', g: 'body', z: -1 },
  { t: 'p', pts: [36, 34, 41, 21, 44, 34], c: 'body', g: 'body', z: -1 },
  { t: 'p', pts: [43, 35, 50, 24, 51, 37], c: 'body', g: 'body', z: -1 },
  { t: 'p', pts: [49, 38, 57, 31, 55, 42], c: 'body', g: 'body', z: -1 },
  { t: 'l', pts: [53, 45, 58, 43, 61, 37], w: 3.8, w2: 1.8, c: 'body', g: 'tail', z: -1 },
  { t: 'e', x: 40, y: 43, rx: 15.5, ry: 10.5, c: 'body', g: 'body' },
  { t: 'spot', x: 41, y: 38, rx: 2.8, ry: 2, c: 'spot', on: 'body' },
  { t: 'spot', x: 49, y: 44, rx: 2.4, ry: 2, c: 'spot', on: 'body' },
  { t: 'spot', x: 33, y: 43, rx: 2, ry: 1.6, c: 'spot', on: 'body' },
  { t: 'spot', x: 42, y: 48, rx: 1.8, ry: 1.4, c: 'spot', on: 'body' },
  { t: 'c', x1: 33, y1: 48, x2: 32, y2: 58, r1: 5, r2: 4.4, c: 'body', g: 'legF1', z: 1 },
  { t: 'c', x1: 50, y1: 48, x2: 52, y2: 58, r1: 5, r2: 4.4, c: 'body', g: 'legF2', z: 1 },
  { t: 'p', pts: [23, 25, 27, 14, 35, 3, 37, 15, 35, 25], c: 'body', g: 'earB', z: 1 },
  { t: 'p', pts: [26, 24, 29, 15, 34, 8, 35, 16, 33, 24], c: 'ear', g: 'earB', z: 1, face: true },
  { t: 'e', x: 22, y: 31, rx: 10.5, ry: 9.5, c: 'body', g: 'head', z: 2 },
  { t: 'e', x: 13, y: 35, rx: 7, ry: 5, c: 'body', g: 'head', z: 2 },
  { t: 'p', pts: [12, 28, 3, 20, 2, 6, 13, 15, 20, 23], c: 'body', g: 'earF', z: 3 },
  { t: 'p', pts: [13, 26, 5, 19, 4, 10, 12, 17, 17, 23], c: 'ear', g: 'earF', z: 3, face: true },
  { t: 'p', pts: [16, 25, 19, 4, 25, 24], c: 'horn', g: 'horn', z: 2.5 },
  { t: 'spot', x: 29, y: 33, rx: 2.2, ry: 1.8, c: 'spot', on: 'head' },
  { t: 'p', pts: [7.5, 38, 8, 41, 9.5, 41, 10, 38], c: 'tooth', g: 'tooth', z: 3, face: true, line: false, flat: true },
  { t: 'eye', x: 17, y: 31, s: 3.2, style: 'angry', iris: '#c02838', look: [-1, 0] },
], 0, -2) });
// @NIDOKING
G.defMon('NIDOKING', { pal: { body: '#a064b4', belly: '#ecdcb4', plate: '#c8b080', horn: '#ece4f0', spike: '#e8e0e8', inner: '#6a3a80', claw: '#f4f0e8' }, parts: scaled(0.97, 32, 59.5, [
  { t: 'l', pts: [44, 50, 52, 53, 58, 55, 62, 52], w: 10, w2: 3, c: 'body', g: 'tail', z: -3 },
  { t: 'c', x1: 42, y1: 46, x2: 45, y2: 56, r1: 6.5, r2: 5.5, c: 'body', g: 'legB', z: -2 },
  { t: 'e', x: 47, y: 58, rx: 5.5, ry: 2.6, c: 'body', g: 'legB', z: -2 },
  // back spikes
  { t: 'p', pts: [36, 21, 46, 15, 42, 26], c: 'spike', g: 'spk', z: -1 },
  { t: 'p', pts: [41, 27, 52, 24, 46, 33], c: 'spike', g: 'spk', z: -1 },
  { t: 'p', pts: [45, 34, 54, 33.5, 47, 40], c: 'spike', g: 'spk', z: -1 },
  { t: 'p', pts: [46, 41, 54, 43, 46, 47], c: 'spike', g: 'spk', z: -1 },
  { t: 'p', pts: [51, 50, 57, 46, 55, 53], c: 'spike', g: 'spk', z: -1 },
  { t: 'c', x1: 42, y1: 28, x2: 47, y2: 36, r1: 4, r2: 3.4, c: 'body', g: 'armB', z: -1 },
  // hulking body with plated belly
  { t: 'e', x: 35, y: 38, rx: 13.5, ry: 16, rot: -6, c: 'body', g: 'body' },
  { t: 'e', x: 29, y: 41, rx: 8, ry: 12.5, rot: -6, c: 'belly', g: 'belly', z: 0.5, face: true },
  { t: 'stripe', pts: [20, 33, 38, 33], w: 1, c: 'plate', on: 'belly' },
  { t: 'stripe', pts: [20, 38, 38, 38], w: 1, c: 'plate', on: 'belly' },
  { t: 'stripe', pts: [20, 43, 38, 43], w: 1, c: 'plate', on: 'belly' },
  { t: 'stripe', pts: [20, 48, 38, 48], w: 1, c: 'plate', on: 'belly' },
  { t: 'c', x1: 32, y1: 47, x2: 28, y2: 56, r1: 7, r2: 6, c: 'body', g: 'legF', z: 1 },
  { t: 'e', x: 25, y: 58, rx: 6.5, ry: 2.8, c: 'body', g: 'legF', z: 1 },
  { t: 'p', pts: [18, 58, 19, 56, 21, 59], c: 'claw', g: 'claw', z: 1.5 },
  { t: 'p', pts: [21, 59, 22, 56, 24, 60], c: 'claw', g: 'claw', z: 1.5 },
  { t: 'c', x1: 25, y1: 28, x2: 16, y2: 36, r1: 4.6, r2: 3.8, c: 'body', g: 'armF', z: 2 },
  { t: 'p', pts: [12, 36, 12.5, 40.5, 15, 38], c: 'claw', g: 'claw2', z: 2 },
  { t: 'p', pts: [15, 39, 16.5, 43, 18, 39.5], c: 'claw', g: 'claw2', z: 2 },
  // head: big ears, tall forehead horn, fanged jaw
  { t: 'p', pts: [29, 16, 41, 6, 37, 20], c: 'body', g: 'earB', z: 2 },
  { t: 'p', pts: [31.5, 15.5, 38.5, 9.5, 35.5, 18], c: 'inner', g: 'earB', z: 2, face: true },
  { t: 'e', x: 25, y: 18.5, rx: 9.5, ry: 8, c: 'body', g: 'head', z: 3 },
  { t: 'e', x: 14, y: 21.5, rx: 8.5, ry: 5, rot: -8, c: 'body', g: 'head', z: 3 },
  { t: 'p', pts: [25, 12, 31, 2, 34, 15], c: 'body', g: 'earF', z: 3.2 },
  { t: 'p', pts: [27, 12.5, 31, 5.5, 32.5, 13.5], c: 'inner', g: 'earF', z: 3.2, face: true },
  { t: 'p', pts: [14, 16.5, 10, 1, 22.5, 13], c: 'horn', g: 'horn', z: 3.5, gloss: true },
  { t: 'eye', x: 19.5, y: 17.5, s: 3.2, style: 'angry', iris: '#40a070', look: [-1, 0] },
  { t: 'mouth', x: 10.5, y: 23.5, w: 3, style: 'fang' },
], -1, -1) });

// ---------------------------------------------------------------- CLEFAIRY line
// @CLEFAIRY
G.defMon('CLEFAIRY', { pal: { body: '#f8b4c4', tip: '#6c4438', wing: '#fbe0e8', curl: '#e8809c' }, parts: scaled(0.86, 32, 59.5, [
  // curly tail
  { t: 'l', pts: [44, 51, 50, 51, 53.5, 47, 51.5, 43, 48.5, 44.5], w: 3.4, w2: 2.2, c: 'body', g: 'tail', z: -2 },
  // little fairy wing on the back
  { t: 'p', pts: [42, 38, 48, 28, 54, 27, 52, 33, 56, 35, 51, 40, 45, 43], c: 'wing', g: 'wing', z: -1 },
  { t: 'stripe', pts: [44, 39, 51, 31], w: 0.8, c: '#e8b0c0', on: 'wing' },
  { t: 'stripe', pts: [45, 41, 53, 36], w: 0.8, c: '#e8b0c0', on: 'wing' },
  { t: 'c', x1: 41, y1: 42, x2: 45.5, y2: 45, r1: 2.6, r2: 2.4, c: 'body', g: 'armB', z: -1 },
  // round body
  { t: 'e', x: 33, y: 45, rx: 12, ry: 11, c: 'body', g: 'body' },
  { t: 'e', x: 31, y: 35, rx: 12.5, ry: 11, c: 'body', g: 'body' },
  // pointed ears with brown tips
  { t: 'p', pts: [35, 28, 43, 10.5, 46, 29], c: 'body', g: 'earB', z: -0.5 },
  { t: 'spot', x: 44, y: 12, rx: 3, ry: 4, c: 'tip', on: 'earB' },
  { t: 'p', pts: [19.5, 30, 14, 11.5, 27.5, 25.5], c: 'body', g: 'earF', z: 1 },
  { t: 'spot', x: 15, y: 13.5, rx: 3, ry: 4, c: 'tip', on: 'earF' },
  // forehead curl
  { t: 'l', pts: [30.5, 27, 28, 23.5, 24, 23, 22.5, 26, 25, 27.5], w: 3, w2: 1.6, c: 'curl', g: 'curl', z: 1 },
  { t: 'e', x: 27, y: 57, rx: 5.2, ry: 2.7, c: 'body', g: 'footL', z: 1 },
  { t: 'e', x: 40, y: 57, rx: 4.8, ry: 2.5, c: 'body', g: 'footR', z: 0.5 },
  { t: 'c', x1: 24, y1: 43, x2: 19, y2: 46, r1: 2.8, r2: 2.6, c: 'body', g: 'armF', z: 2 },
  { t: 'eye', x: 22.5, y: 34, s: 2.4, look: [-0.6, -0.3], sclera: false, wide: 0.7 },
  { t: 'eye', x: 30.5, y: 34, s: 2.4, look: [-0.6, -0.3], sclera: false, wide: 0.7 },
  { t: 'spot', x: 18.5, y: 38.5, rx: 2, ry: 1.2, c: '#f890a8', on: 'body', face: true },
  smile(25.5, 40, 1.5),
]) });
// @CLEFABLE
G.defMon('CLEFABLE', { pal: { body: '#f8b4c4', tip: '#6c4438', wing: '#f6c6d4', curl: '#f4a4b8' }, parts: scaled(1, 32, 59.5, [
  { t: 'l', pts: [44, 50, 51, 51, 55, 46, 53, 41, 49, 42], w: 3.6, w2: 2.4, c: 'body', g: 'tail', z: -2 },
  { t: 'e', x: 50, y: 28, rx: 4.4, ry: 9, rot: 40, c: 'wing', g: 'wing', z: -1 },
  { t: 'e', x: 52, y: 36, rx: 3.6, ry: 7, rot: 70, c: 'wing', g: 'wing2', z: -1.2 },
  { t: 'c', x1: 42, y1: 36, x2: 48, y2: 40, r1: 3, r2: 2.6, c: 'body', g: 'armB', z: -1 },
  { t: 'e', x: 34, y: 45, rx: 12.5, ry: 12.5, c: 'body', g: 'body' },
  { t: 'e', x: 31, y: 29, rx: 11.5, ry: 10, c: 'body', g: 'body' },
  { t: 'p', pts: [35, 22, 44, 3, 47, 24], c: 'body', g: 'earB', z: -0.5 },
  { t: 'spot', x: 44, y: 5, rx: 3.2, ry: 4.2, c: 'tip', on: 'earB' },
  { t: 'p', pts: [20, 23, 13, 5, 27, 19], c: 'body', g: 'earF', z: 1 },
  { t: 'spot', x: 14, y: 7, rx: 3.2, ry: 4.2, c: 'tip', on: 'earF' },
  { t: 'l', pts: [31, 20, 27, 16, 22, 16, 20, 20, 22, 22, 24, 20], w: 2.8, w2: 1.4, c: 'curl', g: 'curl', z: 1 },
  { t: 'c', x1: 29, y1: 53, x2: 27, y2: 57, r1: 4, r2: 3.6, c: 'body', g: 'legL', z: 1 },
  { t: 'e', x: 25, y: 58, rx: 5.5, ry: 2.6, c: 'body', g: 'legL', z: 1 },
  { t: 'c', x1: 41, y1: 53, x2: 42, y2: 57, r1: 3.8, r2: 3.4, c: 'body', g: 'legR', z: 0.5 },
  { t: 'e', x: 42, y: 58, rx: 5, ry: 2.4, c: 'body', g: 'legR', z: 0.5 },
  { t: 'c', x1: 25, y1: 38, x2: 17, y2: 42, r1: 3, r2: 2.6, c: 'body', g: 'armF', z: 2 },
  { t: 'eye', x: 23, y: 28, s: 2.2, look: [-0.6, 0], sclera: false },
  { t: 'eye', x: 30.5, y: 28, s: 2.2, look: [-0.6, 0], sclera: false },
  smile(26, 33, 1),
], 0, -1) });

// ---------------------------------------------------------------- VULPIX line
// @VULPIX
G.defMon('VULPIX', { pal: { body: '#cc5c34', tail: '#e87838', curl: '#f4a050', paw: '#f0d4a4', inner: '#6a3020' }, parts: [
  // tails
  { t: 'l', pts: [44, 46, 52, 44, 58, 38, 56, 34], w: 5, w2: 3.4, c: 'tail', g: 't1', z: -3 },
  { t: 'l', pts: [43, 44, 49, 38, 53, 30, 50, 27], w: 5, w2: 3.4, c: 'tail', g: 't2', z: -3 },
  { t: 'l', pts: [42, 44, 44, 36, 45, 27, 42, 24], w: 5, w2: 3.4, c: 'tail', g: 't3', z: -3 },
  { t: 'l', pts: [45, 48, 54, 49, 60, 46, 60, 42], w: 5, w2: 3.4, c: 'tail', g: 't4', z: -2.5 },
  { t: 'l', pts: [44, 45, 51, 40, 56, 33, 55, 29], w: 5, w2: 3.4, c: 'tail', g: 't5', z: -2.5 },
  { t: 'l', pts: [43, 44, 47, 37, 49, 29, 47, 26], w: 5, w2: 3.4, c: 'tail', g: 't6', z: -2.5 },
  { t: 'spot', x: 56, y: 35, rx: 3, ry: 3, c: 'curl', on: 't1' },
  { t: 'spot', x: 51, y: 28, rx: 3, ry: 3, c: 'curl', on: 't2' },
  { t: 'spot', x: 43, y: 25, rx: 3, ry: 3, c: 'curl', on: 't3' },
  { t: 'spot', x: 60, y: 43, rx: 3, ry: 3, c: 'curl', on: 't4' },
  { t: 'spot', x: 55.5, y: 30, rx: 3, ry: 3, c: 'curl', on: 't5' },
  { t: 'spot', x: 48, y: 27, rx: 3, ry: 3, c: 'curl', on: 't6' },
  { t: 'c', x1: 43, y1: 50, x2: 44, y2: 57, r1: 2.6, r2: 2.4, c: 'body', g: 'legB2', z: -1 },
  { t: 'c', x1: 29, y1: 50, x2: 29, y2: 57, r1: 2.6, r2: 2.4, c: 'body', g: 'legB1', z: -1 },
  { t: 'e', x: 44, y: 58, rx: 3, ry: 1.8, c: 'paw', g: 'legB2', z: -1 },
  { t: 'e', x: 28, y: 58, rx: 3, ry: 1.8, c: 'paw', g: 'legB1', z: -1 },
  { t: 'e', x: 37, y: 48, rx: 11, ry: 7.2, c: 'body', g: 'body' },
  { t: 'c', x1: 32, y1: 51, x2: 31, y2: 57, r1: 3.1, r2: 2.8, c: 'body', g: 'legF1', z: 1 },
  { t: 'c', x1: 45, y1: 51, x2: 47, y2: 57, r1: 3.1, r2: 2.8, c: 'body', g: 'legF2', z: 1 },
  { t: 'e', x: 30, y: 58.3, rx: 3.2, ry: 1.8, c: 'paw', g: 'legF1', z: 1 },
  { t: 'e', x: 47, y: 58.3, rx: 3.2, ry: 1.8, c: 'paw', g: 'legF2', z: 1 },
  { t: 'p', pts: [25, 32, 32, 19, 33, 34], c: 'body', g: 'earB', z: 1 },
  { t: 'p', pts: [27, 31, 31, 23, 31, 32], c: 'inner', g: 'earB', z: 1, face: true },
  { t: 'e', x: 23, y: 38, rx: 8.5, ry: 7.5, c: 'body', g: 'head', z: 2 },
  { t: 'e', x: 15, y: 41, rx: 5.5, ry: 3.6, c: 'body', g: 'head', z: 2 },
  { t: 'p', pts: [16, 34, 13, 21, 23, 31], c: 'body', g: 'earF', z: 3 },
  { t: 'p', pts: [17, 32, 15, 25, 21, 31], c: 'inner', g: 'earF', z: 3, face: true },
  { t: 'l', pts: [18, 32, 20, 28, 24, 28, 23, 31], w: 3, w2: 2, c: 'curl', g: 'tuft', z: 3.5 },
  { t: 'l', pts: [23, 31, 25, 27, 29, 28, 28, 31], w: 3, w2: 2, c: 'curl', g: 'tuft', z: 3.4 },
  { t: 'e', x: 10, y: 40.5, rx: 1.2, ry: 1, c: '#2a1a18', g: 'nose', z: 3 },
  { t: 'eye', x: 19, y: 37.5, s: 2.8, iris: '#7a4020', look: [-1, 0], sclera: false },
  smile(13, 43, 1),
] });
// @NINETALES
{
  const tails = [];
  for (let i = 0; i < 9; i++) {
    const a = 22 + i * 11, L = 17 + i * 1.1 + (i % 2 ? 3 : 0);
    const tl = sweep(39 + i * 0.7, 45 - i * 0.5, a, L, 7.5, 'body', 'nt' + i, (i % 2 ? -4.5 : -4) - i * 0.05, i % 2 ? -8 : -16);
    tails.push(tl, tipOf(tl, 2.8, 'tip'));
  }
  G.defMon('NINETALES', { pal: { body: '#f2e2a4', tip: '#ee9a44', mane: '#fbf3d0', inner: '#c89858', paw: '#e4c888' }, parts: tails.concat([
    { t: 'c', x1: 45, y1: 48, x2: 47, y2: 57, r1: 3.2, r2: 2.4, c: 'body', g: 'legB2', z: -1 },
    { t: 'c', x1: 29, y1: 47, x2: 27, y2: 57, r1: 3, r2: 2.2, c: 'body', g: 'legB1', z: -1 },
    { t: 'e', x: 38, y: 46, rx: 12.5, ry: 7.5, c: 'body', g: 'body' },
    { t: 'c', x1: 32, y1: 49, x2: 30, y2: 58, r1: 3.2, r2: 2.4, c: 'body', g: 'legF1', z: 1 },
    { t: 'c', x1: 47, y1: 50, x2: 50, y2: 58, r1: 3.6, r2: 2.4, c: 'body', g: 'legF2', z: 1 },
    { t: 'e', x: 29, y: 58.6, rx: 3, ry: 1.5, c: 'paw', g: 'legF1', z: 1 },
    { t: 'e', x: 50, y: 58.6, rx: 3, ry: 1.5, c: 'paw', g: 'legF2', z: 1 },
    { t: 'c', x1: 30, y1: 42, x2: 21, y2: 29, r1: 6, r2: 4.6, c: 'body', g: 'neck', z: 1.5 },
    { t: 'e', x: 26, y: 40, rx: 7, ry: 7.5, c: 'mane', g: 'mane', z: 1.8 },
    { t: 'p', pts: [20, 42, 23, 50, 26, 45, 29, 51, 31, 44], c: 'mane', g: 'mane', z: 1.8 },
    { t: 'p', pts: [22, 20, 29, 11, 29, 24], c: 'body', g: 'earB', z: 2 },
    { t: 'p', pts: [24, 20, 28, 15, 28, 22], c: 'inner', g: 'earB', z: 2, face: true },
    { t: 'e', x: 19, y: 26, rx: 7.5, ry: 6.5, c: 'body', g: 'head', z: 3 },
    { t: 'e', x: 12, y: 29, rx: 5.5, ry: 3.3, rot: 8, c: 'body', g: 'head', z: 3 },
    { t: 'p', pts: [14, 21, 12, 10, 21, 18], c: 'body', g: 'earF', z: 3.5 },
    { t: 'p', pts: [15, 20, 14, 14, 19, 18], c: 'inner', g: 'earF', z: 3.5, face: true },
    { t: 'p', pts: [16, 21, 20, 17, 26, 15, 33, 16, 29, 18, 35, 21, 29, 22, 33, 26, 26, 24, 21, 24], c: 'mane', g: 'crest', z: 3.6 },
    { t: 'e', x: 7, y: 28.6, rx: 1.1, ry: 1, c: INK, g: 'nose', z: 3 },
    { t: 'eye', x: 15, y: 26, s: 2.6, style: 'angry', iris: '#c82828', look: [-1, 0] },
    ink([8.5, 31.5, 12.5, 31.5]),
  ]) });
}
// ---------------------------------------------------------------- JIGGLYPUFF line
// @JIGGLYPUFF
G.defMon('JIGGLYPUFF', { pal: { body: '#f8bccc', inner: '#3a2a3a', curl: '#f2a4b8' }, parts: scaled(0.86, 32, 59.5, [
  { t: 'e', x: 38, y: 57, rx: 5, ry: 2.6, c: 'body', g: 'footR', z: -1 },
  { t: 'p', pts: [36, 29, 43, 17, 47, 33], c: 'body', g: 'earB', z: -0.5 },
  { t: 'p', pts: [38, 29, 43, 20, 45, 31], c: 'inner', g: 'earB', z: -0.5, face: true },
  { t: 'e', x: 33, y: 42, rx: 15.5, ry: 14.5, c: 'body', g: 'body' },
  { t: 'p', pts: [17, 34, 14, 19, 27, 28], c: 'body', g: 'earF', z: 1 },
  { t: 'p', pts: [18, 32, 16, 23, 24, 28], c: 'inner', g: 'earF', z: 1, face: true },
  { t: 'l', pts: [34, 28.5, 29, 27, 25, 28.5, 23, 32, 24.5, 35, 27.5, 34.5, 27.5, 32], w: 3.6, w2: 1.6, c: 'curl', g: 'curl', z: 1 },
  { t: 'e', x: 25, y: 57, rx: 5.5, ry: 2.8, c: 'body', g: 'footL', z: 1 },
  { t: 'c', x1: 20, y1: 47, x2: 17, y2: 49, r1: 2.4, r2: 2.2, c: 'body', g: 'armF', z: 1 },
  { t: 'c', x1: 46, y1: 46, x2: 49, y2: 48, r1: 2.4, r2: 2.2, c: 'body', g: 'armB', z: -1 },
  { t: 'eye', x: 22, y: 41, s: 4.2, iris: '#3aa0c0', look: [-0.8, 0] },
  { t: 'eye', x: 33, y: 41, s: 4.2, iris: '#3aa0c0', look: [-0.8, 0] },
  smile(27, 49, 1),
]) });
// @WIGGLYTUFF
G.defMon('WIGGLYTUFF', { pal: { body: '#f8b8c8', belly: '#fdf0f3', inner: '#3a2a3a', tuft: '#fcd6e0' }, parts: scaled(0.92, 32, 59.5, [
  { t: 'p', pts: [36, 22, 46, 3, 49, 24], c: 'body', g: 'earB', z: -0.5 },
  { t: 'p', pts: [38, 21, 46, 7, 47, 23], c: 'inner', g: 'earB', z: -0.5, face: true },
  { t: 'c', x1: 44, y1: 41, x2: 49, y2: 45, r1: 2.8, r2: 2.6, c: 'body', g: 'armB', z: -1 },
  { t: 'e', x: 41, y: 57, rx: 5, ry: 2.6, c: 'body', g: 'footR', z: -1 },
  { t: 'e', x: 33, y: 39, rx: 15, ry: 18, c: 'body', g: 'body' },
  { t: 'spot', x: 28, y: 46, rx: 9, ry: 10, c: 'belly', on: 'body', face: true },
  { t: 'p', pts: [18, 26, 10, 6, 27, 19], c: 'body', g: 'earF', z: 1 },
  { t: 'p', pts: [19, 24, 12, 10, 24, 19], c: 'inner', g: 'earF', z: 1, face: true },
  { t: 'e', x: 32, y: 19, rx: 7.5, ry: 6, c: 'tuft', g: 'tuft', z: 1.2 },
  { t: 'l', pts: [26, 22, 23, 17, 26, 12, 32, 11, 37, 14], w: 5, w2: 3.5, c: 'tuft', g: 'tuft2', z: 1.3 },
  { t: 'l', pts: [26, 22, 29, 21, 30, 18, 28, 16], w: 2.4, w2: 1.4, c: 'tuft', g: 'tuft3', z: 1.4 },
  { t: 'e', x: 24, y: 57, rx: 5.5, ry: 2.8, c: 'body', g: 'footL', z: 1 },
  { t: 'c', x1: 21, y1: 41, x2: 16, y2: 45, r1: 2.8, r2: 2.6, c: 'body', g: 'armF', z: 1 },
  { t: 'eye', x: 22, y: 32, s: 3.4, iris: '#3aa0c0', look: [-0.8, 0] },
  { t: 'eye', x: 32, y: 32, s: 3.4, iris: '#3aa0c0', look: [-0.8, 0] },
  smile(26, 39, 1),
]) });
// ---------------------------------------------------------------- ZUBAT line
// @ZUBAT
G.defMon('ZUBAT', { pal: { body: '#5a9ad8', mem: '#a872c8', inner: '#9a5ab8' }, parts: scaled(0.88, 32, 59.5, [
  { t: 'l', pts: [34, 36, 36, 44, 38, 52], w: 2.6, w2: 2, c: 'body', g: 'legB', z: -2 },
  { t: 'e', x: 38.5, y: 52.5, rx: 2, ry: 2.8, rot: -20, c: 'body', g: 'legB', z: -2 },
  { t: 'p', pts: [36, 24, 46, 12, 58, 12, 62, 26, 57, 24, 54, 30, 49, 27, 44, 32, 37, 30], c: 'body', g: 'wingB', z: -1 },
  { t: 'p', pts: [38, 27, 46, 15, 57, 15, 60, 24, 57, 22, 54, 28, 49, 25, 44, 30, 38, 29], c: 'mem', g: 'wingB', z: -1, line: false },
  { t: 'e', x: 32, y: 29, rx: 7.5, ry: 8.5, c: 'body', g: 'body' },
  { t: 'p', pts: [26, 24, 22, 7, 32, 21], c: 'body', g: 'earF', z: 1 },
  { t: 'p', pts: [27, 22, 24, 12, 30, 21], c: 'inner', g: 'earF', z: 1, face: true },
  { t: 'p', pts: [33, 22, 38, 6, 40, 25], c: 'body', g: 'earB', z: -0.5 },
  { t: 'p', pts: [34, 22, 38, 11, 38, 23], c: 'inner', g: 'earB', z: -0.5, face: true },
  { t: 'p', pts: [28, 27, 16, 14, 6, 15, 2, 30, 8, 27, 11, 34, 16, 29, 22, 35, 28, 32], c: 'body', g: 'wingF', z: 1 },
  { t: 'p', pts: [26, 28, 16, 17, 7, 18, 4, 27, 8, 25, 11, 31, 16, 27, 22, 32, 26, 31], c: 'mem', g: 'wingF', z: 1, line: false, face: true },
  { t: 'l', pts: [29, 36, 29, 45, 30, 54], w: 2.6, w2: 2, c: 'body', g: 'legF', z: 1 },
  { t: 'e', x: 30.5, y: 54.5, rx: 2, ry: 2.8, rot: -10, c: 'body', g: 'legF', z: 1 },
  { t: 'mouth', x: 29, y: 28, w: 3.6, style: 'fang' },
], 0, -2) });
// @GOLBAT
G.defMon('GOLBAT', { pal: { body: '#5a9ad8', mem: '#a872c8', inner: '#9a5ab8', mouth: '#7a1c2c', tongue: '#e0607a', fang: '#ffffff' }, parts: scaled(0.95, 32, 59.5, [
  { t: 'p', pts: [38, 26, 48, 8, 60, 6, 63, 30, 58, 26, 55, 34, 50, 29, 45, 36, 40, 33], c: 'body', g: 'wingB', z: -1 },
  { t: 'p', pts: [40, 28, 48, 11, 59, 9, 61, 27, 58, 23, 55, 31, 50, 26, 45, 33, 41, 31], c: 'mem', g: 'wingB', z: -1, line: false },
  { t: 'c', x1: 37, y1: 46, x2: 38, y2: 52, r1: 2.8, r2: 2.4, c: 'body', g: 'legB', z: -2 },
  { t: 'e', x: 39, y: 53, rx: 3, ry: 1.8, c: 'body', g: 'legB', z: -2 },
  { t: 'e', x: 31, y: 33, rx: 14.5, ry: 14.5, c: 'body', g: 'body' },
  { t: 'p', pts: [23, 23, 17, 5, 30, 18], c: 'body', g: 'earF', z: 1 },
  { t: 'p', pts: [24, 21, 20, 9, 28, 18], c: 'inner', g: 'earF', z: 1, face: true },
  { t: 'p', pts: [33, 20, 39, 3, 43, 23], c: 'body', g: 'earB', z: -0.5 },
  // huge mouth
  { t: 'e', x: 26, y: 38, rx: 11, ry: 9.5, c: 'mouth', g: 'mouth', z: 0.5, face: true, flat: true },
  { t: 'spot', x: 27, y: 45, rx: 8, ry: 4.5, c: 'tongue', on: 'mouth' },
  { t: 'p', pts: [17, 30, 19.5, 36, 22, 30], c: 'fang', g: 'fang', z: 0.6, face: true },
  { t: 'p', pts: [30, 29, 32.5, 35, 35, 30], c: 'fang', g: 'fang', z: 0.6, face: true },
  { t: 'p', pts: [19, 46, 21, 41.5, 23, 46], c: 'fang', g: 'fang', z: 0.6, face: true },
  { t: 'p', pts: [29, 46, 31, 41.5, 33, 46], c: 'fang', g: 'fang', z: 0.6, face: true },
  { t: 'p', pts: [22, 30, 12, 14, 3, 12, 1, 36, 6, 32, 9, 40, 14, 35, 18, 42, 21, 38], c: 'body', g: 'wingF', z: 1 },
  { t: 'p', pts: [20, 31, 12, 17, 4, 16, 3, 33, 6, 29, 9, 37, 14, 32, 18, 38, 20, 36], c: 'mem', g: 'wingF', z: 1, line: false, face: true },
  { t: 'c', x1: 28, y1: 47, x2: 27, y2: 53, r1: 2.8, r2: 2.4, c: 'body', g: 'legF', z: 1 },
  { t: 'e', x: 26, y: 54, rx: 3.2, ry: 1.8, c: 'body', g: 'legF', z: 1 },
  { t: 'eye', x: 23, y: 24, s: 2, style: 'angry', iris: '#c03040', look: [-1, 0], wide: 1 },
  { t: 'eye', x: 32, y: 24, s: 2, style: 'angry', iris: '#c03040', look: [-1, 0], wide: 1 },
], 0, 0) });
// ---------------------------------------------------------------- ODDISH line
// @ODDISH
G.defMon('ODDISH', { pal: { body: '#4a6cb0', leaf: '#5cb048', vein: '#3c8030', foot: '#3c5898' }, parts: [
  { t: 'e', x: 39, y: 57, rx: 4, ry: 2.4, c: 'foot', g: 'footR', z: -1 },
  { t: 'p', pts: [33, 36, 44, 22, 54, 20, 48, 30, 38, 38], c: 'leaf', g: 'lf1', z: -1 },
  { t: 'p', pts: [32, 35, 36, 20, 42, 12, 42, 24, 36, 36], c: 'leaf', g: 'lf2', z: -1.2 },
  { t: 'p', pts: [30, 36, 24, 22, 22, 12, 30, 20, 34, 35], c: 'leaf', g: 'lf3', z: -0.5 },
  { t: 'e', x: 31, y: 47, rx: 11, ry: 10, c: 'body', g: 'body' },
  { t: 'p', pts: [29, 38, 18, 30, 10, 30, 16, 36, 27, 40], c: 'leaf', g: 'lf4', z: 1 },
  { t: 'p', pts: [33, 38, 42, 32, 51, 33, 46, 38, 35, 41], c: 'leaf', g: 'lf5', z: 0.5 },
  { t: 'stripe', pts: [46, 25, 36, 36], w: 1, c: 'vein', on: 'lf1' },
  { t: 'stripe', pts: [40, 16, 34, 34], w: 1, c: 'vein', on: 'lf2' },
  { t: 'stripe', pts: [24, 16, 32, 34], w: 1, c: 'vein', on: 'lf3' },
  { t: 'stripe', pts: [14, 32, 28, 39], w: 1, c: 'vein', on: 'lf4' },
  { t: 'stripe', pts: [48, 34, 35, 39], w: 1, c: 'vein', on: 'lf5' },
  { t: 'e', x: 26, y: 57, rx: 4.4, ry: 2.6, c: 'foot', g: 'footL', z: 1 },
  { t: 'eye', x: 25, y: 46, s: 2.4, iris: '#c02830', look: [-1, 0], sclera: false },
  { t: 'eye', x: 33, y: 46, s: 2.4, iris: '#c02830', look: [-1, 0], sclera: false },
] });

// @GLOOM
G.defMon('GLOOM', { pal: { body: '#4a6cb0', petal: '#c4503c', dot: '#eeb878', leaf: '#5cb048', foot: '#3c5898', drool: '#f4e27a' }, parts: [
  { t: 'e', x: 40, y: 57, rx: 4.4, ry: 2.4, c: 'foot', g: 'footR', z: -1 },
  { t: 'c', x1: 42, y1: 44, x2: 47, y2: 47, r1: 2.6, r2: 2.4, c: 'body', g: 'armB', z: -1 },
  { t: 'e', x: 32, y: 45, rx: 13, ry: 12.5, c: 'body', g: 'body' },
  { t: 'p', pts: [28, 33, 19, 30, 12, 33, 20, 36], c: 'leaf', g: 'lfA', z: 0.1 },
  { t: 'p', pts: [37, 33, 46, 30, 53, 33, 45, 36], c: 'leaf', g: 'lfB', z: 0.1 },
  // flower
  { t: 'e', x: 32, y: 16, rx: 10, ry: 6, c: 'petal', g: 'pB', z: 0.2 },
  { t: 'e', x: 19, y: 23, rx: 10, ry: 6.5, rot: 25, c: 'petal', g: 'pL', z: 0.3 },
  { t: 'e', x: 45, y: 23, rx: 10, ry: 6.5, rot: -25, c: 'petal', g: 'pR', z: 0.3 },
  { t: 'e', x: 32, y: 29, rx: 11, ry: 5.5, c: 'petal', g: 'pF', z: 0.5 },
  { t: 'spot', x: 32, y: 14, rx: 3, ry: 2, c: 'dot', on: 'pB' },
  { t: 'spot', x: 16, y: 22, rx: 2.6, ry: 2, c: 'dot', on: 'pL' },
  { t: 'spot', x: 22, y: 26, rx: 1.6, ry: 1.3, c: 'dot', on: 'pL' },
  { t: 'spot', x: 48, y: 22, rx: 2.6, ry: 2, c: 'dot', on: 'pR' },
  { t: 'spot', x: 42, y: 26, rx: 1.6, ry: 1.3, c: 'dot', on: 'pR' },
  { t: 'spot', x: 27, y: 29, rx: 2.6, ry: 1.8, c: 'dot', on: 'pF' },
  { t: 'spot', x: 37, y: 30, rx: 2, ry: 1.5, c: 'dot', on: 'pF' },
  { t: 'e', x: 32, y: 22, rx: 4.5, ry: 3.2, c: '#8a3028', g: 'ctr', z: 0.4 },
  { t: 'e', x: 26, y: 57, rx: 5, ry: 2.6, c: 'foot', g: 'footL', z: 1 },
  { t: 'c', x1: 21, y1: 46, x2: 16, y2: 49, r1: 2.6, r2: 2.4, c: 'body', g: 'armF', z: 1 },
  { t: 'eye', x: 25, y: 43, s: 2.6, style: 'sleepy', iris: '#c02830', look: [-1, 0] },
  { t: 'eye', x: 34, y: 43, s: 2.6, style: 'sleepy', iris: '#c02830', look: [-1, 0] },
  { t: 'mouth', x: 29, y: 48, w: 2.2, style: 'open' },
  { t: 'c', x1: 27.5, y1: 51, x2: 27.5, y2: 55, r1: 0.9, r2: 1.5, c: 'drool', g: 'drool', z: 2, face: true, gloss: true, line: false },
] });
// @VILEPLUME
G.defMon('VILEPLUME', { pal: { body: '#4a6cb0', petal: '#e04a3c', dot: '#fad0c4', ctr: '#5a3a78', pollen: '#e8c8f0', foot: '#3c5898' }, parts: [
  { t: 'c', x1: 40, y1: 50, x2: 41, y2: 56, r1: 3.6, r2: 3.4, c: 'body', g: 'legB', z: -1 },
  { t: 'e', x: 41, y: 57.5, rx: 4.4, ry: 2.2, c: 'foot', g: 'legB', z: -1 },
  { t: 'c', x1: 42, y1: 40, x2: 49, y2: 44, r1: 3, r2: 2.6, c: 'body', g: 'armB', z: -1 },
  { t: 'e', x: 32, y: 44, rx: 11.5, ry: 11, c: 'body', g: 'body' },
  // flower (back petals first)
  { t: 'e', x: 44, y: 14, rx: 12, ry: 8, rot: -30, c: 'petal', g: 'p1', z: 0.1 },
  { t: 'e', x: 21, y: 13, rx: 12, ry: 8, rot: 30, c: 'petal', g: 'p2', z: 0.2 },
  { t: 'e', x: 50, y: 26, rx: 11, ry: 7.5, rot: 15, c: 'petal', g: 'p3', z: 0.4 },
  { t: 'e', x: 14, y: 26, rx: 11, ry: 7.5, rot: -15, c: 'petal', g: 'p4', z: 0.5 },
  { t: 'e', x: 32, y: 30, rx: 12, ry: 6, c: 'petal', g: 'p5', z: 0.6 },
  { t: 'spot', x: 44, y: 11, rx: 2, ry: 1.6, c: 'dot', on: 'p1' },
  { t: 'spot', x: 49, y: 15, rx: 1.6, ry: 1.3, c: 'dot', on: 'p1' },
  { t: 'spot', x: 39, y: 13, rx: 1.4, ry: 1.2, c: 'dot', on: 'p1' },
  { t: 'spot', x: 20, y: 10, rx: 2, ry: 1.6, c: 'dot', on: 'p2' },
  { t: 'spot', x: 15, y: 14, rx: 1.6, ry: 1.3, c: 'dot', on: 'p2' },
  { t: 'spot', x: 25, y: 12, rx: 1.4, ry: 1.2, c: 'dot', on: 'p2' },
  { t: 'spot', x: 53, y: 25, rx: 2, ry: 1.6, c: 'dot', on: 'p3' },
  { t: 'spot', x: 57, y: 29, rx: 1.4, ry: 1.2, c: 'dot', on: 'p3' },
  { t: 'spot', x: 10, y: 25, rx: 2, ry: 1.6, c: 'dot', on: 'p4' },
  { t: 'spot', x: 7, y: 29, rx: 1.4, ry: 1.2, c: 'dot', on: 'p4' },
  { t: 'spot', x: 26, y: 32, rx: 1.8, ry: 1.4, c: 'dot', on: 'p5' },
  { t: 'spot', x: 38, y: 32, rx: 1.8, ry: 1.4, c: 'dot', on: 'p5' },
  { t: 'spot', x: 32, y: 34, rx: 1.4, ry: 1.1, c: 'dot', on: 'p5' },
  { t: 'e', x: 32, y: 21, rx: 9, ry: 6, c: 'ctr', g: 'ctr', z: 0.55 },
  { t: 'spot', x: 29, y: 19, rx: 1, ry: 0.8, c: 'pollen', on: 'ctr' },
  { t: 'spot', x: 34, y: 18, rx: 1, ry: 0.8, c: 'pollen', on: 'ctr' },
  { t: 'spot', x: 37, y: 21, rx: 1, ry: 0.8, c: 'pollen', on: 'ctr' },
  { t: 'spot', x: 27, y: 22, rx: 1, ry: 0.8, c: 'pollen', on: 'ctr' },
  { t: 'c', x1: 28, y1: 51, x2: 27, y2: 56, r1: 3.8, r2: 3.6, c: 'body', g: 'legF', z: 1 },
  { t: 'e', x: 26, y: 58, rx: 4.8, ry: 2.4, c: 'foot', g: 'legF', z: 1 },
  { t: 'c', x1: 23, y1: 41, x2: 16, y2: 45, r1: 3, r2: 2.6, c: 'body', g: 'armF', z: 1 },
  { t: 'eye', x: 25, y: 41, s: 2.6, style: 'angry', iris: '#c02830', look: [-1, 0] },
  { t: 'eye', x: 34, y: 41, s: 2.6, style: 'angry', iris: '#c02830', look: [-1, 0], flip: true },
  smile(29, 47, 1),
] });

// ---------------------------------------------------------------- PARAS line
// @PARAS
G.defMon('PARAS', { pal: { body: '#f0903c', cap: '#e44a30', dot: '#fad870', claw: '#faeac8', eye: '#fffae8', stem: '#f4dcb0' }, parts: [
  { t: 'c', x1: 44, y1: 52, x2: 48, y2: 57, r1: 2, r2: 1.5, c: 'body', g: 'legB3', z: -2 },
  { t: 'c', x1: 35, y1: 53, x2: 37, y2: 58, r1: 2, r2: 1.5, c: 'body', g: 'legB2', z: -2 },
  { t: 'c', x1: 25, y1: 52, x2: 23, y2: 56, r1: 2.4, r2: 1.8, c: 'body', g: 'clawB', z: -2 },
  { t: 'p', pts: [23, 53, 18, 54, 17, 57, 20, 56, 21, 59, 24, 58, 25, 56], c: 'claw', g: 'clawB', z: -2 },
  { t: 'e', x: 38, y: 48, rx: 13, ry: 8.5, c: 'body', g: 'body' },
  { t: 'e', x: 24, y: 47, rx: 8.5, ry: 8, c: 'body', g: 'body' },
  { t: 'stripe', pts: [34, 40, 34, 57], w: 1, c: '#c86828', on: 'body', backOnly: true },
  { t: 'stripe', pts: [43, 40, 43, 57], w: 1, c: '#c86828', on: 'body', backOnly: true },
  // mushrooms
  { t: 'c', x1: 43, y1: 42, x2: 44, y2: 36, r1: 3, r2: 2.6, c: 'stem', g: 'stemB', z: 0.2 },
  { t: 'e', x: 45, y: 33, rx: 10.5, ry: 6.5, rot: -8, c: 'cap', g: 'capB', z: 0.3 },
  { t: 'spot', x: 41, y: 30.5, rx: 2, ry: 1.4, c: 'dot', on: 'capB' },
  { t: 'spot', x: 48, y: 29.5, rx: 1.6, ry: 1.2, c: 'dot', on: 'capB' },
  { t: 'spot', x: 51, y: 34, rx: 1.4, ry: 1.1, c: 'dot', on: 'capB' },
  { t: 'spot', x: 44, y: 35, rx: 1.3, ry: 1, c: 'dot', on: 'capB' },
  { t: 'c', x1: 30, y1: 41, x2: 29, y2: 36, r1: 2.6, r2: 2.4, c: 'stem', g: 'stemA', z: 0.4 },
  { t: 'e', x: 29, y: 33, rx: 8.5, ry: 5.5, rot: 8, c: 'cap', g: 'capA', z: 0.5 },
  { t: 'spot', x: 26, y: 31.5, rx: 1.8, ry: 1.3, c: 'dot', on: 'capA' },
  { t: 'spot', x: 32, y: 31, rx: 1.4, ry: 1.1, c: 'dot', on: 'capA' },
  { t: 'spot', x: 29, y: 35, rx: 1.2, ry: 1, c: 'dot', on: 'capA' },
  { t: 'c', x1: 30, y1: 53, x2: 31, y2: 58, r1: 2.2, r2: 1.7, c: 'body', g: 'legF1', z: 1 },
  { t: 'c', x1: 40, y1: 54, x2: 43, y2: 58.5, r1: 2.2, r2: 1.7, c: 'body', g: 'legF2', z: 1 },
  { t: 'c', x1: 20, y1: 51, x2: 14, y2: 55, r1: 2.8, r2: 2.2, c: 'body', g: 'clawF', z: 2 },
  { t: 'p', pts: [14, 51, 8, 53, 6, 57, 11, 55, 11, 59, 15, 58, 17, 55], c: 'claw', g: 'clawF', z: 2 },
  { t: 'e', x: 18, y: 45, rx: 2.9, ry: 3.6, c: INK, g: 'rimA', z: 1.9, face: true, flat: true },
  { t: 'e', x: 25, y: 44.5, rx: 2.9, ry: 3.6, c: INK, g: 'rimB', z: 1.9, face: true, flat: true },
  { t: 'e', x: 18, y: 45, rx: 2, ry: 2.7, c: 'eye', g: 'eyeA', z: 2, face: true, gloss: true, line: false },
  { t: 'e', x: 25, y: 44.5, rx: 2, ry: 2.7, c: 'eye', g: 'eyeB', z: 2, face: true, gloss: true, line: false },
] });
// @PARASECT
G.defMon('PARASECT', { pal: { body: '#ec8a3a', cap: '#e05432', dot: '#fad880', claw: '#faeac8', eye: '#f8f4e8', under: '#f4c890' }, parts: [
  { t: 'c', x1: 44, y1: 46, x2: 49, y2: 57, r1: 2.4, r2: 1.8, c: 'body', g: 'legB3', z: -2 },
  { t: 'c', x1: 36, y1: 48, x2: 39, y2: 58, r1: 2.4, r2: 1.8, c: 'body', g: 'legB2', z: -2 },
  { t: 'c', x1: 20, y1: 46, x2: 16, y2: 54, r1: 2.6, r2: 2, c: 'body', g: 'clawB', z: -2 },
  { t: 'p', pts: [18, 52, 13, 53, 11, 57, 14, 56, 15, 59, 19, 58, 20, 55], c: 'claw', g: 'clawB', z: -2 },
  { t: 'e', x: 32, y: 45, rx: 11, ry: 7.5, c: 'body', g: 'body' },
  { t: 'c', x1: 29, y1: 49, x2: 30, y2: 58, r1: 2.6, r2: 2, c: 'body', g: 'legF1', z: 1 },
  { t: 'c', x1: 40, y1: 49, x2: 44, y2: 58.5, r1: 2.6, r2: 2, c: 'body', g: 'legF2', z: 1 },
  { t: 'e', x: 24, y: 43, rx: 7, ry: 6, c: 'body', g: 'head', z: 0.5 },
  // giant mushroom
  { t: 'e', x: 36, y: 26, rx: 25, ry: 14, rot: -6, c: 'cap', g: 'cap', z: 0.6 },
  { t: 'e', x: 34, y: 37, rx: 20, ry: 5, rot: -6, c: 'under', g: 'under', z: 0.55, frontOnly: true },
  { t: 'spot', x: 22, y: 21, rx: 3.4, ry: 2.4, c: 'dot', on: 'cap' },
  { t: 'spot', x: 33, y: 17, rx: 3, ry: 2.2, c: 'dot', on: 'cap' },
  { t: 'spot', x: 45, y: 16, rx: 3.2, ry: 2.4, c: 'dot', on: 'cap' },
  { t: 'spot', x: 53, y: 22, rx: 2.6, ry: 2.2, c: 'dot', on: 'cap' },
  { t: 'spot', x: 40, y: 25, rx: 2.4, ry: 1.8, c: 'dot', on: 'cap' },
  { t: 'spot', x: 27, y: 29, rx: 2.4, ry: 1.8, c: 'dot', on: 'cap' },
  { t: 'spot', x: 15, y: 29, rx: 2, ry: 1.6, c: 'dot', on: 'cap' },
  { t: 'spot', x: 50, y: 31, rx: 2.2, ry: 1.7, c: 'dot', on: 'cap' },
  { t: 'c', x1: 21, y1: 47, x2: 14, y2: 52, r1: 2.8, r2: 2.2, c: 'body', g: 'clawF', z: 2 },
  { t: 'p', pts: [14, 48, 7, 50, 5, 55, 10, 53, 10, 58, 15, 57, 17, 53], c: 'claw', g: 'clawF', z: 2 },
  { t: 'e', x: 19, y: 43, rx: 2.4, ry: 2, c: 'eye', g: 'eyeA', z: 1, face: true, gloss: true },
  { t: 'e', x: 26, y: 42.5, rx: 2.4, ry: 2, c: 'eye', g: 'eyeB', z: 1, face: true, gloss: true },
] });

// ---------------------------------------------------------------- VENONAT line
// @VENONAT
{
  const fuzz = [];
  // little tufts of fur around the upper silhouette
  for (let a = 20; a <= 200; a += 18) {
    const r = a * Math.PI / 180, cx = 33 + Math.cos(r) * 14.5, cy = 39 - Math.sin(r) * 14.5;
    const ox = Math.cos(r) * 3.4, oy = -Math.sin(r) * 3.4, px = -Math.sin(r) * 2.2, py = -Math.cos(r) * 2.2;
    fuzz.push({ t: 'p', pts: [cx + px, cy + py, cx + ox + px * 0.2, cy + oy + py * 0.2, cx - px, cy - py], c: 'body', g: 'body' });
  }
  G.defMon('VENONAT', { pal: { body: '#8a5cb8', fur: '#7a4ca8', eye: '#e8404a', eyeL: '#ff9a9a', mand: '#f4f0f0', foot: '#6a4090' }, parts: scaled(0.88, 32, 59.5, [
    { t: 'e', x: 40, y: 57, rx: 4, ry: 2.4, c: 'foot', g: 'footR', z: -1 },
    { t: 'l', pts: [36, 26, 38, 16, 43, 10], w: 1.6, w2: 1.2, c: 'fur', g: 'antB', z: -1 },
    { t: 'e', x: 43.5, y: 9.5, rx: 2, ry: 2, c: 'body', g: 'antB', z: -1 },
    ...fuzz,
    { t: 'e', x: 33, y: 39, rx: 15, ry: 15, c: 'body', g: 'body' },
    { t: 'l', pts: [27, 25, 23, 16, 17, 11], w: 1.6, w2: 1.2, c: 'fur', g: 'antF', z: 1 },
    { t: 'e', x: 16.5, y: 10.5, rx: 2, ry: 2, c: 'body', g: 'antF', z: 1 },
    { t: 'e', x: 22, y: 36, rx: 5.2, ry: 5.8, c: 'eye', g: 'eyeA', z: 1, face: true, gloss: true },
    { t: 'e', x: 35.5, y: 35.5, rx: 5.6, ry: 6.2, c: 'eye', g: 'eyeB', z: 1, face: true, gloss: true },
    { t: 'spot', x: 20.5, y: 34, rx: 2, ry: 2.2, c: 'eyeL', on: 'eyeA' },
    { t: 'spot', x: 34, y: 33.5, rx: 2.2, ry: 2.4, c: 'eyeL', on: 'eyeB' },
    { t: 'p', pts: [25, 45, 26.5, 49.5, 28.5, 46], c: 'mand', g: 'mand', z: 1.2, face: true },
    { t: 'p', pts: [30.5, 45.5, 32, 50, 34, 46.5], c: 'mand', g: 'mand', z: 1.2, face: true },
    { t: 'e', x: 26, y: 57, rx: 4.6, ry: 2.6, c: 'foot', g: 'footL', z: 1 },
  ], 0, 0) });
}
// @VENOMOTH
G.defMon('VENOMOTH', { pal: { body: '#9a72c4', wing: '#c6aae6', vein: '#a888d0', spot: '#7c58ac', eye: '#4a8ad4', eyeL: '#a8d4ff', leg: '#e8dcf4' }, parts: [
  // far wings
  { t: 'p', pts: [36, 26, 42, 10, 52, 3, 61, 5, 62, 14, 56, 24, 46, 30], c: 'wing', g: 'wUB', z: -2 },
  { t: 'p', pts: [38, 34, 50, 32, 58, 36, 56, 44, 48, 46, 40, 40], c: 'wing', g: 'wLB', z: -2.2 },
  { t: 'spot', x: 57, y: 8, rx: 3, ry: 2.4, c: 'spot', on: 'wUB' },
  { t: 'spot', x: 50, y: 7, rx: 1.6, ry: 1.3, c: 'spot', on: 'wUB' },
  { t: 'spot', x: 58, y: 16, rx: 1.6, ry: 1.3, c: 'spot', on: 'wUB' },
  { t: 'spot', x: 53, y: 41, rx: 2.2, ry: 1.8, c: 'spot', on: 'wLB' },
  { t: 'stripe', pts: [38, 27, 50, 12, 58, 8], w: 0.8, c: 'vein', on: 'wUB' },
  { t: 'l', pts: [28, 18, 31, 9, 36, 5], w: 1.4, w2: 1, c: 'body', g: 'antB', z: -1 },
  // body
  { t: 'e', x: 36, y: 45, rx: 5.5, ry: 8.5, rot: -20, c: 'body', g: 'abd', z: -0.5 },
  { t: 'stripe', pts: [30, 42, 41, 40], w: 1, c: '#7a54a4', on: 'abd' },
  { t: 'stripe', pts: [31, 46, 42, 44], w: 1, c: '#7a54a4', on: 'abd' },
  { t: 'stripe', pts: [33, 50, 42, 48], w: 1, c: '#7a54a4', on: 'abd' },
  { t: 'e', x: 31, y: 34, rx: 6.5, ry: 6.5, c: 'body', g: 'thx' },
  { t: 'c', x1: 27, y1: 38, x2: 25, y2: 44, r1: 1.3, r2: 1.1, c: 'leg', g: 'legA', z: 0.5 },
  { t: 'c', x1: 31, y1: 39, x2: 31, y2: 45, r1: 1.3, r2: 1.1, c: 'leg', g: 'legB', z: 0.5 },
  { t: 'e', x: 25, y: 25, rx: 7, ry: 6.5, c: 'body', g: 'head', z: 1 },
  // near wings
  { t: 'p', pts: [26, 30, 20, 16, 12, 6, 3, 7, 2, 18, 7, 28, 16, 33], c: 'wing', g: 'wUF', z: 2 },
  { t: 'p', pts: [26, 36, 16, 36, 7, 40, 9, 48, 17, 49, 24, 42], c: 'wing', g: 'wLF', z: 1.8 },
  { t: 'spot', x: 6, y: 11, rx: 3, ry: 2.4, c: 'spot', on: 'wUF' },
  { t: 'spot', x: 13, y: 9, rx: 1.6, ry: 1.3, c: 'spot', on: 'wUF' },
  { t: 'spot', x: 5, y: 21, rx: 1.6, ry: 1.3, c: 'spot', on: 'wUF' },
  { t: 'spot', x: 12, y: 45, rx: 2.2, ry: 1.8, c: 'spot', on: 'wLF' },
  { t: 'stripe', pts: [25, 30, 14, 16, 6, 11], w: 0.8, c: 'vein', on: 'wUF' },
  { t: 'stripe', pts: [24, 38, 12, 43], w: 0.8, c: 'vein', on: 'wLF' },
  { t: 'l', pts: [21, 19, 18, 10, 13, 5], w: 1.4, w2: 1, c: 'body', g: 'antF', z: 2.2 },
  { t: 'e', x: 20, y: 25, rx: 3.6, ry: 4.2, c: 'eye', g: 'eyeA', z: 2.5, face: true, gloss: true },
  { t: 'e', x: 28.5, y: 24, rx: 3.4, ry: 4, c: 'eye', g: 'eyeB', z: 2.5, face: true, gloss: true },
  { t: 'spot', x: 19, y: 23.5, rx: 1.4, ry: 1.6, c: 'eyeL', on: 'eyeA' },
  { t: 'spot', x: 27.5, y: 22.5, rx: 1.3, ry: 1.5, c: 'eyeL', on: 'eyeB' },
  { t: 'p', pts: [22, 30, 23, 33, 25, 30.5], c: 'leg', g: 'mand', z: 2.6, face: true },
] });

// ---------------------------------------------------------------- DIGLETT line
// @DIGLETT
G.defMon('DIGLETT', { pal: { body: '#b0703e', nose: '#f07a92', dirt: '#8a6440', rock: '#a8988a' }, parts: scaled(1, 32, 59.5, [
  { t: 'e', x: 33, y: 45, rx: 8.5, ry: 13, c: 'body', g: 'body' },
  { t: 'e', x: 32, y: 58, rx: 15, ry: 4.5, c: 'dirt', g: 'dirt', z: 1 },
  { t: 'e', x: 24, y: 57, rx: 5, ry: 3.5, c: 'dirt', g: 'dirt', z: 1 },
  { t: 'e', x: 41, y: 56.5, rx: 5.5, ry: 3.5, c: 'dirt', g: 'dirt', z: 1 },
  { t: 'e', x: 19, y: 59, rx: 2.2, ry: 1.6, c: 'rock', g: 'rk1', z: 1.5 },
  { t: 'e', x: 45, y: 59.5, rx: 1.8, ry: 1.3, c: 'rock', g: 'rk2', z: 1.5 },
  { t: 'e', x: 27, y: 46, rx: 3.8, ry: 2.8, c: 'nose', g: 'nose', z: 2, face: true, gloss: true },
  { t: 'eye', x: 26, y: 40, s: 2.2, look: [-0.5, 0], sclera: false },
  { t: 'eye', x: 32, y: 40, s: 2.2, look: [-0.5, 0], sclera: false },
], 0, -2) });
// @DUGTRIO
G.defMon('DUGTRIO', { pal: { body: '#b0703e', nose: '#f07a92', dirt: '#8a6440', rock: '#a8988a' }, parts: scaled(1, 32, 59.5, [
  { t: 'e', x: 36, y: 38, rx: 8.5, ry: 14, c: 'body', g: 'dB' },
  { t: 'e', x: 48, y: 46, rx: 8, ry: 12, c: 'body', g: 'dR', z: 0.5 },
  { t: 'e', x: 22, y: 45, rx: 8.5, ry: 12.5, c: 'body', g: 'dL', z: 1 },
  { t: 'e', x: 34, y: 58, rx: 25, ry: 5, c: 'dirt', g: 'dirt', z: 2 },
  { t: 'e', x: 16, y: 57, rx: 7, ry: 4, c: 'dirt', g: 'dirt', z: 2 },
  { t: 'e', x: 51, y: 56.5, rx: 8, ry: 4, c: 'dirt', g: 'dirt', z: 2 },
  { t: 'e', x: 33, y: 55.5, rx: 6, ry: 3.5, c: 'dirt', g: 'dirt', z: 2 },
  { t: 'e', x: 8, y: 59.5, rx: 2.2, ry: 1.6, c: 'rock', g: 'rk1', z: 2.5 },
  { t: 'e', x: 57, y: 60, rx: 1.8, ry: 1.3, c: 'rock', g: 'rk2', z: 2.5 },
  { t: 'e', x: 30.5, y: 39, rx: 3.6, ry: 2.6, c: 'nose', g: 'nB', z: 0.2, face: true, gloss: true },
  { t: 'e', x: 43, y: 47, rx: 3.4, ry: 2.5, c: 'nose', g: 'nR', z: 0.7, face: true, gloss: true },
  { t: 'e', x: 16, y: 46, rx: 3.8, ry: 2.8, c: 'nose', g: 'nL', z: 1.2, face: true, gloss: true },
  { t: 'eye', x: 30, y: 33, s: 2.1, look: [-0.5, 0], sclera: false },
  { t: 'eye', x: 36, y: 33, s: 2.1, look: [-0.5, 0], sclera: false },
  { t: 'eye', x: 43, y: 41, s: 2, look: [-0.5, 0], sclera: false },
  { t: 'eye', x: 48.5, y: 41, s: 2, look: [-0.5, 0], sclera: false },
  { t: 'eye', x: 15, y: 40, s: 2.2, look: [-0.5, 0], sclera: false },
  { t: 'eye', x: 21, y: 40, s: 2.2, look: [-0.5, 0], sclera: false },
], 0, -3) });

// ---------------------------------------------------------------- MEOWTH line
// @MEOWTH
G.defMon('MEOWTH', { pal: { body: '#f2e0aa', brown: '#9a6a3c', inner: '#5a3a2c', coin: '#f8cc38', wh: '#3a3040' }, parts: scaled(0.86, 32, 59.5, [
  { t: 'l', pts: [38, 52, 46, 52, 52, 46, 54, 37, 51, 31], w: 2.6, w2: 2.2, c: 'body', g: 'tail', z: -3 },
  { t: 'e', x: 51, y: 31, rx: 2.8, ry: 3.4, c: 'brown', g: 'tail', z: -3 },
  { t: 'c', x1: 38, y1: 42, x2: 43, y2: 46, r1: 2, r2: 1.8, c: 'body', g: 'armB', z: -1 },
  { t: 'c', x1: 36, y1: 51, x2: 38, y2: 57, r1: 2.4, r2: 2.2, c: 'body', g: 'legB', z: -1 },
  { t: 'e', x: 39, y: 58, rx: 3.6, ry: 1.8, c: 'brown', g: 'legB', z: -1 },
  { t: 'e', x: 32, y: 46, rx: 7.5, ry: 8.5, c: 'body', g: 'body' },
  { t: 'c', x1: 29, y1: 51, x2: 28, y2: 57, r1: 2.6, r2: 2.4, c: 'body', g: 'legF', z: 1 },
  { t: 'e', x: 26.5, y: 58.3, rx: 4, ry: 2, c: 'brown', g: 'legF', z: 1 },
  { t: 'c', x1: 27, y1: 42, x2: 21, y2: 46, r1: 2, r2: 1.8, c: 'body', g: 'armF', z: 2 },
  { t: 'p', pts: [30, 19, 38, 7, 40, 22], c: 'body', g: 'earB', z: 2 },
  { t: 'p', pts: [32, 19, 37.5, 11, 38.5, 21], c: 'inner', g: 'earB', z: 2, face: true },
  { t: 'e', x: 27, y: 28, rx: 12, ry: 9.5, c: 'body', g: 'head', z: 3 },
  { t: 'p', pts: [15, 23, 11, 9, 23, 18], c: 'body', g: 'earF', z: 3.5 },
  { t: 'p', pts: [16, 21, 13, 13, 21, 18], c: 'inner', g: 'earF', z: 3.5, face: true },
  { t: 'e', x: 23.5, y: 19, rx: 4.2, ry: 4, c: 'coin', g: 'coin', z: 4, gloss: true },
  { t: 'e', x: 23.5, y: 19, rx: 1.8, ry: 1.7, c: '#d49a18', g: 'coinC', z: 4.1, line: false, face: true },
  ink([17.5, 31.5, 12.5, 30.5, 8.5, 30.5], 'wh'),
  ink([17.5, 33.5, 12.5, 34.5, 9.5, 35.5], 'wh'),
  { t: 'l', pts: [37.5, 30.5, 41.5, 29.5, 44.5, 29.5], w: 0.9, c: 'wh', g: 'whB', z: 2.8, line: false, flat: true },
  { t: 'l', pts: [37.5, 32.5, 41.5, 33.5, 43.5, 34.5], w: 0.9, c: 'wh', g: 'whB', z: 2.8, line: false, flat: true },
  { t: 'eye', x: 20, y: 27, s: 3, iris: '#3a3040', look: [-1, 0] },
  { t: 'eye', x: 29, y: 27, s: 3, iris: '#3a3040', look: [-1, 0] },
  { t: 'mouth', x: 19, y: 32, w: 2, style: 'fang' },
], 0, 0) });
// @PERSIAN
G.defMon('PERSIAN', { pal: { body: '#f2e2b4', inner: '#4a4050', gem: '#e83a40', wh: '#3a3040', paw: '#e8d4a0' }, parts: scaled(1.05, 32, 59.5, [
  // curling tail
  { t: 'l', pts: [50, 42, 56, 37, 58.5, 28, 57, 20, 53, 17.5, 50, 20.5, 52, 23], w: 3.2, w2: 2, c: 'body', g: 'tail', z: -3 },
  // far legs
  { t: 'c', x1: 47, y1: 46, x2: 49, y2: 57, r1: 3.4, r2: 2.3, c: 'body', g: 'legB2', z: -1 },
  { t: 'c', x1: 28, y1: 46, x2: 27, y2: 57, r1: 2.8, r2: 2.2, c: 'body', g: 'legB1', z: -1 },
  // slender body
  { t: 'e', x: 39, y: 43.5, rx: 14, ry: 7.5, c: 'body', g: 'body' },
  { t: 'c', x1: 32, y1: 47, x2: 30.5, y2: 58, r1: 2.8, r2: 2.2, c: 'body', g: 'legF1', z: 1 },
  { t: 'c', x1: 49, y1: 47, x2: 52.5, y2: 58, r1: 3.6, r2: 2.2, c: 'body', g: 'legF2', z: 1 },
  { t: 'e', x: 29.5, y: 58.5, rx: 3.2, ry: 1.6, c: 'paw', g: 'legF1', z: 1 },
  { t: 'e', x: 52.5, y: 58.5, rx: 3.2, ry: 1.6, c: 'paw', g: 'legF2', z: 1 },
  { t: 'c', x1: 31, y1: 41, x2: 23, y2: 33, r1: 5.2, r2: 4.4, c: 'body', g: 'neck', z: 1.5 },
  // broad head, big ears
  { t: 'p', pts: [24, 26, 32, 12.5, 34, 28], c: 'body', g: 'earB', z: 2 },
  { t: 'p', pts: [26.5, 25.5, 31.5, 16.5, 32.5, 26.5], c: 'inner', g: 'earB', z: 2, face: true },
  { t: 'e', x: 20, y: 31, rx: 12.5, ry: 8.5, c: 'body', g: 'head', z: 3 },
  { t: 'e', x: 10.5, y: 34, rx: 4.2, ry: 3.2, c: 'body', g: 'head', z: 3 },
  { t: 'p', pts: [11.5, 27, 8, 13.5, 20.5, 23.5], c: 'body', g: 'earF', z: 3.5 },
  { t: 'p', pts: [12.5, 25.5, 10, 16.5, 18, 23.5], c: 'inner', g: 'earF', z: 3.5, face: true },
  { t: 'e', x: 17, y: 25, rx: 3.2, ry: 2.6, c: 'gem', g: 'gem', z: 4, gloss: true, face: true },
  { t: 'e', x: 7, y: 33.5, rx: 1.3, ry: 1, c: '#d87890', g: 'nose', z: 3.2, face: true },
  // long curling whiskers
  ink([10, 35.5, 6.5, 35, 3.5, 33.5, 3, 30.5], 'wh', 1.1),
  ink([10, 37.5, 6.5, 39.5, 4, 41.5, 4.5, 44], 'wh', 1.1),
  { t: 'l', pts: [30, 33, 35, 32, 38, 29.5], w: 1.1, c: 'wh', g: 'whB', z: 2.8, line: false, flat: true },
  { t: 'l', pts: [30, 35.5, 35, 37, 37.5, 39.5], w: 1.1, c: 'wh', g: 'whB', z: 2.8, line: false, flat: true },
  { t: 'eye', x: 12.5, y: 30, s: 2.6, style: 'sleepy', iris: '#c02830', look: [-1, 0], wide: 1 },
  { t: 'eye', x: 21, y: 30, s: 2.6, style: 'sleepy', iris: '#c02830', look: [-1, 0], wide: 1 },
  ink([8.5, 36.5, 11.5, 36.5]),
], 0.5, 0) });

// ---------------------------------------------------------------- PSYDUCK line
// @PSYDUCK
G.defMon('PSYDUCK', { pal: { body: '#f6d454', beak: '#f2e6b4', hair: '#2a2430', white: '#ffffff' }, parts: scaled(0.86, 32, 59.5, [
  { t: 'e', x: 44, y: 51, rx: 3.5, ry: 3, c: 'body', g: 'tail', z: -2 },
  { t: 'e', x: 41, y: 58, rx: 5, ry: 2.2, c: 'beak', g: 'footR', z: -1 },
  { t: 'c', x1: 42, y1: 40, x2: 43, y2: 30, r1: 2.6, r2: 2.4, c: 'body', g: 'armB', z: -1 },
  { t: 'e', x: 35, y: 47, rx: 10.5, ry: 10, c: 'body', g: 'body' },
  { t: 'l', pts: [32, 17, 31, 11, 28, 8], w: 1.2, w2: 1, c: 'hair', g: 'hair', z: 0.5, flat: true },
  { t: 'l', pts: [34, 17, 35, 10, 38, 7], w: 1.2, w2: 1, c: 'hair', g: 'hair', z: 0.5, flat: true },
  { t: 'l', pts: [33, 17, 33, 9], w: 1.2, w2: 1, c: 'hair', g: 'hair', z: 0.5, flat: true },
  { t: 'e', x: 31, y: 27, rx: 12, ry: 10.5, c: 'body', g: 'head', z: 1 },
  { t: 'e', x: 18, y: 31, rx: 7.5, ry: 2.6, rot: -4, c: 'beak', g: 'beakU', z: 2 },
  { t: 'e', x: 19.5, y: 34, rx: 6, ry: 2.2, rot: -4, c: 'beak', g: 'beakL', z: 1.9 },
  { t: 'e', x: 22, y: 24, rx: 3.6, ry: 4, c: 'white', g: 'eyeA', z: 2, face: true, flat: true },
  { t: 'e', x: 31, y: 24, rx: 3.6, ry: 4, c: 'white', g: 'eyeB', z: 2, face: true, flat: true },
  { t: 'eye', x: 21, y: 24, s: 1, style: 'dot' },
  { t: 'eye', x: 30, y: 24, s: 1, style: 'dot' },
  { t: 'e', x: 27, y: 58, rx: 5.5, ry: 2.4, c: 'beak', g: 'footL', z: 1 },
  { t: 'c', x1: 29, y1: 41, x2: 25, y2: 33, r1: 2.8, r2: 2.6, c: 'body', g: 'armF', z: 3 },
], 0, 0) });

// @GOLDUCK
G.defMon('GOLDUCK', { pal: { body: '#4c8cd0', beak: '#f6e4a0', gem: '#e8403a', web: '#f2dc84' }, parts: [
  // tail
  { t: 'p', pts: [41, 47, 51, 52, 55, 57, 46, 55, 40, 51], c: 'body', g: 'tail', z: -3 },
  // back leg + arm
  { t: 'c', x1: 42, y1: 44, x2: 46, y2: 51, r1: 4.4, r2: 3, c: 'body', g: 'legB', z: -2 },
  { t: 'c', x1: 46, y1: 51, x2: 45, y2: 57, r1: 3, r2: 2.2, c: 'body', g: 'legB', z: -2 },
  { t: 'p', pts: [41, 56, 52, 55.5, 52, 59, 40, 59], c: 'web', g: 'footB', z: -2 },
  { t: 'c', x1: 41, y1: 28, x2: 47, y2: 35, r1: 3, r2: 2.4, c: 'body', g: 'armB', z: -1 },
  { t: 'c', x1: 47, y1: 35, x2: 50, y2: 41, r1: 2.4, r2: 2.1, c: 'body', g: 'armB', z: -1 },
  { t: 'p', pts: [48, 40, 53, 40, 54.5, 44, 51.5, 43, 50, 45.5], c: 'web', g: 'handB', z: -1 },
  // slender torso
  { t: 'e', x: 36, y: 36, rx: 9.5, ry: 12, rot: -10, c: 'body', g: 'body' },
  { t: 'c', x1: 33, y1: 26, x2: 29.5, y2: 20, r1: 4.6, r2: 4, c: 'body', g: 'body' },
  { t: 'stripe', pts: [33, 26, 37, 34, 37, 44], w: 1, c: '#3a70b0', on: 'body', backOnly: true },
  // front leg
  { t: 'c', x1: 33, y1: 44, x2: 29.5, y2: 51, r1: 4.8, r2: 3.2, c: 'body', g: 'legF', z: 1 },
  { t: 'c', x1: 29.5, y1: 51, x2: 29, y2: 57, r1: 3.2, r2: 2.4, c: 'body', g: 'legF', z: 1 },
  { t: 'p', pts: [22, 56, 33, 55.5, 33.5, 59.5, 21, 59.5], c: 'web', g: 'footF', z: 1 },
  // front arm reaching forward, webbed hand
  { t: 'c', x1: 30, y1: 29, x2: 24, y2: 36, r1: 3.2, r2: 2.5, c: 'body', g: 'armF', z: 2 },
  { t: 'c', x1: 24, y1: 36, x2: 18, y2: 38, r1: 2.5, r2: 2.2, c: 'body', g: 'armF', z: 2 },
  { t: 'p', pts: [18.5, 36, 12.5, 34.5, 11, 37.5, 13.5, 38.5, 12, 41.5, 17.5, 41], c: 'web', g: 'handF', z: 2 },
  // head: swept-back crest, long bill, forehead gem
  { t: 'p', pts: [31, 12, 45, 9.5, 38.5, 14, 45, 17.5, 33, 18.5], c: 'body', g: 'crest', z: 2.5 },
  { t: 'e', x: 27.5, y: 15.5, rx: 9.5, ry: 8.2, c: 'body', g: 'head', z: 3 },
  { t: 'e', x: 14, y: 18.5, rx: 9.5, ry: 2.8, rot: -3, c: 'beak', g: 'beakU', z: 4 },
  { t: 'e', x: 16, y: 21.8, rx: 7.5, ry: 2.3, rot: -3, c: 'beak', g: 'beakL', z: 3.9 },
  { t: 'e', x: 24, y: 9, rx: 2.5, ry: 2.3, c: 'gem', g: 'gem', z: 4, gloss: true, face: true },
  { t: 'eye', x: 22, y: 14, s: 2.7, style: 'angry', iris: '#d03030', look: [-1, 0] },
  { t: 'eye', x: 30, y: 13.5, s: 2.7, style: 'angry', iris: '#d03030', look: [-1, 0], flip: true },
] });
// ---------------------------------------------------------------- MANKEY line
// @MANKEY
{
  const fur = (cx, cy, R, from, to, n, c, g, z, len) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (from + (to - from) * i / (n - 1)) * Math.PI / 180;
      const x = cx + Math.cos(a) * R, y = cy - Math.sin(a) * R, ox = Math.cos(a) * len, oy = -Math.sin(a) * len;
      const px = -Math.sin(a) * 2.4, py = -Math.cos(a) * 2.4;
      out.push({ t: 'p', pts: [x + px, y + py, x + ox, y + oy, x - px, y - py], c, g, z });
    }
    return out;
  };
  G.defMon('MANKEY', { pal: { body: '#eedcbc', brown: '#9a6e48', nose: '#f0a898', inner: '#e8b8a0' }, parts: [
    { t: 'l', pts: [42, 50, 50, 50, 54, 44, 53, 38], w: 1.8, w2: 1.6, c: 'body', g: 'tail', z: -3 },
    { t: 'e', x: 53, y: 37, rx: 2.4, ry: 2.4, c: 'brown', g: 'tail', z: -3 },
    { t: 'c', x1: 38, y1: 50, x2: 40, y2: 56, r1: 2.2, r2: 2, c: 'brown', g: 'legB', z: -2 },
    { t: 'e', x: 41, y: 57.5, rx: 3.4, ry: 1.8, c: 'brown', g: 'legB', z: -2 },
    { t: 'c', x1: 42, y1: 41, x2: 47, y2: 36, r1: 2, r2: 1.8, c: 'brown', g: 'armB', z: -1 },
    { t: 'e', x: 47.5, y: 34.5, rx: 2.6, ry: 2.6, c: 'brown', g: 'armB', z: -1 },
    ...fur(33, 40, 12, -60, 230, 22, 'body', 'body', 0, 2.6),
    { t: 'e', x: 33, y: 40, rx: 12.5, ry: 12, c: 'body', g: 'body' },
    { t: 'p', pts: [44, 34, 49, 30, 47, 37], c: 'body', g: 'earB', z: -0.5 },
    { t: 'c', x1: 29, y1: 51, x2: 27, y2: 56, r1: 2.4, r2: 2.2, c: 'brown', g: 'legF', z: 1 },
    { t: 'e', x: 25.5, y: 57.5, rx: 3.8, ry: 2, c: 'brown', g: 'legF', z: 1 },
    { t: 'c', x1: 23, y1: 44, x2: 16, y2: 40, r1: 2.2, r2: 2, c: 'brown', g: 'armF', z: 2 },
    { t: 'e', x: 14.5, y: 38.5, rx: 2.8, ry: 2.8, c: 'brown', g: 'armF', z: 2 },
    { t: 'e', x: 25, y: 40.5, rx: 4.4, ry: 3.2, c: 'nose', g: 'nose', z: 1.5, face: true },
    { t: 'e', x: 23.5, y: 40.5, rx: 0.8, ry: 1, c: '#6a3a38', g: 'nost', z: 1.6, face: true, line: false, flat: true },
    { t: 'e', x: 26.5, y: 40.5, rx: 0.8, ry: 1, c: '#6a3a38', g: 'nost', z: 1.6, face: true, line: false, flat: true },
    { t: 'eye', x: 23.5, y: 35.5, s: 1.8, look: [-1, 0], sclera: false },
    { t: 'eye', x: 30.5, y: 35.5, s: 1.8, look: [-1, 0], sclera: false },
    ink([21.5, 31.5, 23.5, 32.5, 25.5, 33.5]),
    ink([32.5, 31.5, 30.5, 32.5, 28.5, 33.5]),
    { t: 'mouth', x: 26, y: 45, w: 2.2, style: 'fang' },
  ] });
  G.defMon('PRIMEAPE', { pal: { body: '#eedcbc', brown: '#9a6e48', nose: '#f0a898', cuff: '#a8a8b8' }, parts: [
    { t: 'c', x1: 40, y1: 46, x2: 44, y2: 55, r1: 3.4, r2: 3, c: 'brown', g: 'legB', z: -2 },
    { t: 'e', x: 45, y: 57.5, rx: 4.6, ry: 2.2, c: 'brown', g: 'legB', z: -2 },
    { t: 'c', x1: 43, y1: 34, x2: 50, y2: 26, r1: 3, r2: 2.6, c: 'brown', g: 'armB', z: -1 },
    { t: 'c', x1: 47, y1: 30, x2: 48.5, y2: 28.5, r1: 3.2, r2: 3.2, c: 'cuff', g: 'cuffB', z: -0.9 },
    { t: 'e', x: 51, y: 24, rx: 3.6, ry: 3.6, c: 'brown', g: 'armB', z: -1 },
    ...fur(33, 37, 16, -70, 240, 20, 'body', 'body', 0, 4.2),
    { t: 'e', x: 33, y: 37, rx: 16.5, ry: 16, c: 'body', g: 'body' },
    { t: 'c', x1: 29, y1: 48, x2: 25, y2: 55, r1: 3.6, r2: 3.2, c: 'brown', g: 'legF', z: 1 },
    { t: 'e', x: 22.5, y: 57.5, rx: 5, ry: 2.4, c: 'brown', g: 'legF', z: 1 },
    { t: 'c', x1: 22, y1: 42, x2: 13, y2: 38, r1: 3, r2: 2.6, c: 'brown', g: 'armF', z: 2 },
    { t: 'c', x1: 16, y1: 39.5, x2: 14.5, y2: 38.8, r1: 3.3, r2: 3.3, c: 'cuff', g: 'cuffF', z: 2.1 },
    { t: 'e', x: 10, y: 36.5, rx: 4, ry: 4, c: 'brown', g: 'armF', z: 2 },
    { t: 'e', x: 21, y: 36, rx: 5, ry: 3.8, c: 'nose', g: 'nose', z: 1.5, face: true },
    { t: 'e', x: 19.5, y: 36, rx: 0.8, ry: 1, c: '#6a3a38', g: 'nost', z: 1.6, face: true, line: false, flat: true },
    { t: 'e', x: 22.5, y: 36, rx: 0.8, ry: 1, c: '#6a3a38', g: 'nost', z: 1.6, face: true, line: false, flat: true },
    { t: 'eye', x: 21, y: 29, s: 2.6, style: 'angry', iris: '#c83030', look: [-1, 0] },
    { t: 'eye', x: 29, y: 29, s: 2.6, style: 'angry', iris: '#c83030', look: [-1, 0] },
    ink([17.5, 25.5, 20.5, 26.5, 23.5, 26.5]),
    ink([26.5, 26.5, 29.5, 26.5, 32.5, 25.5]),
    { t: 'mouth', x: 24, y: 42, w: 3, style: 'fang' },
  ] });
}

// ---------------------------------------------------------------- GROWLITHE line
// @GROWLITHE
G.defMon('GROWLITHE', { pal: { body: '#f0883a', cream: '#f6e2b0', stripe: '#2a2230', nose: '#2a2230' }, parts: [
  { t: 'l', pts: [45, 46, 51, 43, 55, 37, 55, 31], w: 7, w2: 3, c: 'cream', g: 'tail', z: -3 },
  { t: 'c', x1: 44, y1: 50, x2: 45, y2: 57, r1: 3, r2: 2.6, c: 'body', g: 'legB2', z: -2 },
  { t: 'c', x1: 29, y1: 50, x2: 28, y2: 57, r1: 3, r2: 2.6, c: 'body', g: 'legB1', z: -2 },
  { t: 'e', x: 37, y: 47, rx: 11.5, ry: 7.5, c: 'body', g: 'body' },
  { t: 'stripe', pts: [37, 40, 36, 44, 37, 47], w: 1.6, c: 'stripe', on: 'body' },
  { t: 'stripe', pts: [42, 40, 41, 45, 42, 48], w: 1.6, c: 'stripe', on: 'body' },
  { t: 'stripe', pts: [47, 42, 46, 46, 47, 49], w: 1.4, c: 'stripe', on: 'body' },
  { t: 'e', x: 27, y: 46, rx: 6, ry: 6.5, c: 'cream', g: 'chest', z: 0.5, face: true },
  { t: 'c', x1: 31, y1: 51, x2: 30, y2: 57, r1: 3.2, r2: 2.8, c: 'body', g: 'legF1', z: 1 },
  { t: 'c', x1: 45, y1: 51, x2: 47, y2: 57, r1: 3.2, r2: 2.8, c: 'body', g: 'legF2', z: 1 },
  { t: 'stripe', pts: [28, 53.5, 33, 53.5], w: 1.2, c: 'stripe', on: 'legF1' },
  { t: 'stripe', pts: [44, 53.5, 49, 53.5], w: 1.2, c: 'stripe', on: 'legF2' },
  { t: 'p', pts: [26, 31, 32, 26, 33, 35], c: 'body', g: 'earB', z: 1 },
  { t: 'e', x: 22, y: 36, rx: 8.5, ry: 7.5, c: 'body', g: 'head', z: 2 },
  { t: 'e', x: 14.5, y: 39, rx: 5.2, ry: 3.6, c: 'body', g: 'head', z: 2 },
  { t: 'p', pts: [15, 33, 13, 25, 21, 30], c: 'body', g: 'earF', z: 2.5 },
  { t: 'p', pts: [17, 30, 20, 26, 23, 28, 26, 25, 28, 28, 31, 27, 30, 31, 25, 32, 20, 32], c: 'cream', g: 'tuft', z: 3 },
  { t: 'stripe', pts: [27, 34, 30, 36], w: 1.2, c: 'stripe', on: 'head' },
  { t: 'e', x: 9.8, y: 38, rx: 1.4, ry: 1.2, c: 'nose', g: 'nose', z: 3 },
  { t: 'eye', x: 18, y: 35.5, s: 2.6, iris: '#5a3020', look: [-1, 0] },
  smile(13, 42, 1),
] });
// @ARCANINE
G.defMon('ARCANINE', { pal: { body: '#f08434', cream: '#f6e2b0', stripe: '#2a2230', nose: '#2a2230' }, parts: scaled(0.95, 32, 59.5, [
  { t: 'l', pts: [52, 36, 57, 32, 59.5, 24, 58.5, 15, 55, 11], w: 9, w2: 4.5, c: 'cream', g: 'tail', z: -3 },
  { t: 'c', x1: 50, y1: 40, x2: 52, y2: 56, r1: 5, r2: 3.6, c: 'body', g: 'legB2', z: -2 },
  { t: 'e', x: 53, y: 58, rx: 4.5, ry: 2.2, c: 'body', g: 'legB2', z: -2 },
  { t: 'c', x1: 31, y1: 42, x2: 31, y2: 56, r1: 4.2, r2: 3.4, c: 'body', g: 'legB1', z: -2 },
  { t: 'e', x: 30, y: 58, rx: 4.2, ry: 2, c: 'body', g: 'legB1', z: -2 },
  { t: 'e', x: 41, y: 36, rx: 15, ry: 9.5, rot: 6, c: 'body', g: 'body' },
  { t: 'stripe', pts: [40, 27, 39, 32, 40, 37], w: 1.8, c: 'stripe', on: 'body' },
  { t: 'stripe', pts: [46, 28, 45, 33, 46, 38], w: 1.8, c: 'stripe', on: 'body' },
  { t: 'stripe', pts: [52, 31, 51, 36, 52, 40], w: 1.6, c: 'stripe', on: 'body' },
  { t: 'p', pts: [32, 42, 38, 46, 42, 43, 46, 47, 50, 43, 54, 44, 52, 39, 36, 40], c: 'cream', g: 'belly', z: 0.3 },
  // mane / ruff
  { t: 'e', x: 24, y: 30, rx: 10, ry: 11, c: 'cream', g: 'mane', z: 1 },
  { t: 'p', pts: [15, 32, 12, 42, 18, 39, 19, 46, 24, 41, 27, 47, 30, 40, 34, 43, 33, 32], c: 'cream', g: 'mane', z: 1 },
  { t: 'c', x1: 25, y1: 42, x2: 24, y2: 56, r1: 4.6, r2: 3.6, c: 'body', g: 'legF1', z: 1.2 },
  { t: 'e', x: 22.5, y: 58.2, rx: 4.6, ry: 2.2, c: 'body', g: 'legF1', z: 1.2 },
  { t: 'p', pts: [27, 43, 31, 45, 30, 50, 28, 48, 27, 53], c: 'cream', g: 'fluffF1', z: 1.3 },
  { t: 'c', x1: 47, y1: 42, x2: 47, y2: 56, r1: 4.8, r2: 3.6, c: 'body', g: 'legF2', z: 1 },
  { t: 'e', x: 46, y: 58.2, rx: 4.6, ry: 2.2, c: 'body', g: 'legF2', z: 1 },
  { t: 'p', pts: [49, 43, 53, 45, 52, 50, 50, 48, 49, 53], c: 'cream', g: 'fluffF2', z: 1.1 },
  { t: 'stripe', pts: [19, 51.5, 29, 51.5], w: 1.2, c: 'stripe', on: 'legF1' },
  { t: 'stripe', pts: [42, 51.5, 52, 51.5], w: 1.2, c: 'stripe', on: 'legF2' },
  // head
  { t: 'p', pts: [22, 11, 28, 4, 29, 15], c: 'body', g: 'earB', z: 1.5 },
  { t: 'e', x: 18, y: 18, rx: 9, ry: 8, c: 'body', g: 'head', z: 2 },
  { t: 'e', x: 9.5, y: 21.5, rx: 6.5, ry: 4, c: 'body', g: 'head', z: 2 },
  { t: 'p', pts: [12, 13, 10, 4, 18, 10], c: 'body', g: 'earF', z: 2.5 },
  { t: 'p', pts: [15, 12, 19, 8, 24, 6, 31, 6, 37, 10, 41, 14, 34, 14, 38, 19, 30, 17, 26, 14, 20, 14], c: 'cream', g: 'tuft', z: 3 },
  { t: 'p', pts: [20, 22, 25, 26, 20, 28, 16, 26], c: 'cream', g: 'cheek', z: 2.2, face: true },
  { t: 'stripe', pts: [23, 18, 26, 20], w: 1.2, c: 'stripe', on: 'head' },
  { t: 'e', x: 3.8, y: 20.3, rx: 1.5, ry: 1.3, c: 'nose', g: 'nose', z: 3 },
  { t: 'eye', x: 14, y: 17.5, s: 2.6, style: 'angry', iris: '#5a3020', look: [-1, 0] },
  ink([5.5, 24.5, 9.5, 24.5, 12.5, 23.5]),
], 0, 0) });
// ---------------------------------------------------------------- POLIWAG
// @POLIWAG
{
  const spiral = [];
  for (let k = 0; k <= 40; k++) {
    const a = k / 40 * Math.PI * 3.6, r = 0.6 + k / 40 * 7.2;
    spiral.push(26 + Math.cos(a) * r * 0.9, 47 + Math.sin(a) * r);
  }
  G.defMon('POLIWAG', { pal: { body: '#5c88d4', belly: '#f4f6fa', fin: '#d4e2f4', lip: '#f296b0', foot: '#4a74c0' }, parts: [
    { t: 'p', pts: [40, 44, 49, 38, 57, 37, 60, 43, 56, 49, 47, 51], c: 'fin', g: 'tail', z: -2 },
    { t: 'e', x: 38, y: 57, rx: 4, ry: 2.2, c: 'foot', g: 'footR', z: -1 },
    { t: 'e', x: 31, y: 45, rx: 13.5, ry: 12.5, c: 'body', g: 'body' },
    { t: 'spot', x: 26, y: 47, rx: 9, ry: 9.5, c: 'belly', on: 'body', face: true },
    { t: 'stripe', pts: spiral, w: 1.4, c: '#2a2430', on: 'body', face: true },
    { t: 'e', x: 24, y: 58, rx: 4.4, ry: 2.2, c: 'foot', g: 'footL', z: 1 },
    { t: 'eye', x: 22, y: 35, s: 3.4, look: [-0.8, 0] },
    { t: 'eye', x: 32, y: 34, s: 3.4, look: [-0.8, 0] },
    { t: 'e', x: 17, y: 41.5, rx: 2.4, ry: 1.6, c: 'lip', g: 'lip', z: 1, face: true },
  ] });
}

})();
