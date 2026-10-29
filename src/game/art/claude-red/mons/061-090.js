// Vendored from https://github.com/levy-street/pokemon-claude-red (no licence; see the README attribution).
const G = globalThis.G;
// Pokémon sprite definitions (batch 061-090). See src/art/pokesprite.js for the primitive format.
(function () {
  'use strict';
  // Archimedean spiral polyline (for the Poliwag line's belly swirl). dir: 1 clockwise, -1 counter-clockwise.
  function spiral(cx, cy, r, turns, dir, a0) {
    const pts = [], n = Math.round(turns * 18);
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = (a0 || 0) + dir * t * turns * Math.PI * 2, rr = 0.6 + t * (r - 0.6);
      pts.push(+(cx + Math.cos(a) * rr).toFixed(2), +(cy + Math.sin(a) * rr).toFixed(2));
    }
    return pts;
  }
  // Star polygon points (n spikes, outer radius R, inner radius r, rotation in degrees).
  function star(cx, cy, R, r, n, rot) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = ((rot || 0) + i * 180 / n) * Math.PI / 180, rr = i % 2 ? r : R;
      pts.push(+(cx + Math.cos(a) * rr).toFixed(2), +(cy + Math.sin(a) * rr).toFixed(2));
    }
    return pts;
  }
  // Ring of small ellipses along an ellipse outline (rocky/bumpy silhouettes). Angles in degrees.
  function bumps(cx, cy, rx, ry, n, br, a0, a1, extra) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (a0 + (a1 - a0) * (n > 1 ? i / (n - 1) : 0.5)) * Math.PI / 180;
      const r = br * (0.85 + 0.3 * ((i * 7) % 5) / 4);
      out.push(Object.assign({ t: 'e', x: +(cx + Math.cos(a) * rx).toFixed(2), y: +(cy + Math.sin(a) * ry).toFixed(2), rx: +r.toFixed(2), ry: +(r * 0.9).toFixed(2) }, extra));
    }
    return out;
  }
  // One Magnemite unit (steel ball, eye, two horseshoe magnets, screws); k scales it, id keeps groups distinct.
  function magnemite(cx, cy, k, id, z, opts) {
    opts = opts || {};
    const P = (x, y) => [+(cx + x * k).toFixed(2), +(cy + y * k).toFixed(2)];
    const L = (arr) => arr.reduce((a, v, i) => (i % 2 ? a : a.concat(P(v, arr[i + 1]))), []);
    let out = [
      { t: 'l', pts: L([-18, -5, -13, -5, -10, -3, -10, 3, -13, 5, -18, 5]), w: 3 * k, c: 'steel', g: 'magL' + id, z: z - 0.2 },
      { t: 'c', x1: P(-21, -5)[0], y1: P(-21, -5)[1], x2: P(-17, -5)[0], y2: P(-17, -5)[1], r1: 1.6 * k, c: 'blu', g: 'tipL1' + id, z: z - 0.1 },
      { t: 'c', x1: P(-21, 5)[0], y1: P(-21, 5)[1], x2: P(-17, 5)[0], y2: P(-17, 5)[1], r1: 1.6 * k, c: 'red', g: 'tipL2' + id, z: z - 0.1 },
      { t: 'l', pts: L([17, -5, 13, -5, 10, -3, 10, 3, 13, 5, 17, 5]), w: 2.8 * k, c: 'steel', g: 'magR' + id, z: z - 0.3 },
      { t: 'c', x1: P(20, -5)[0], y1: P(20, -5)[1], x2: P(16, -5)[0], y2: P(16, -5)[1], r1: 1.5 * k, c: 'red', g: 'tipR1' + id, z: z - 0.25 },
      { t: 'c', x1: P(20, 5)[0], y1: P(20, 5)[1], x2: P(16, 5)[0], y2: P(16, 5)[1], r1: 1.5 * k, c: 'blu', g: 'tipR2' + id, z: z - 0.25 },
      { t: 'e', x: cx, y: cy, rx: 9 * k, ry: 9 * k, c: 'steel', g: 'ball' + id, z, gloss: true },
      { t: 'eye', x: +(cx - 1.5 * k).toFixed(2), y: cy, s: 3.8 * k, look: [-0.6, 0] },
    ];
    if (opts.noL) out = out.filter(p => !/^(magL|tipL)/.test(p.g || ''));
    if (opts.noR) out = out.filter(p => !/^(magR|tipR)/.test(p.g || ''));
    if (!opts.noTop) out.push(
      { t: 'c', x1: cx, y1: P(0, -8)[1], x2: cx, y2: P(0, -12)[1], r1: 1.1 * k, c: 'screw', g: 'scT' + id, z: z - 0.4 },
      { t: 'e', x: cx, y: P(0, -12.5)[1], rx: 2.6 * k, ry: 1.2 * k, c: 'screw', g: 'scT' + id, z: z - 0.4 });
    if (!opts.noBottom) out.push(
      { t: 'c', x1: P(-5, 7)[0], y1: P(-5, 7)[1], x2: P(-7, 11)[0], y2: P(-7, 11)[1], r1: 1.1 * k, c: 'screw', g: 'scL' + id, z: z - 0.4 },
      { t: 'e', x: P(-7.5, 12)[0], y: P(-7.5, 12)[1], rx: 2.5 * k, ry: 1.2 * k, rot: 25, c: 'screw', g: 'scL' + id, z: z - 0.4 },
      { t: 'c', x1: P(5, 7)[0], y1: P(5, 7)[1], x2: P(7, 11)[0], y2: P(7, 11)[1], r1: 1.1 * k, c: 'screw', g: 'scR' + id, z: z - 0.4 },
      { t: 'e', x: P(7.5, 12)[0], y: P(7.5, 12)[1], rx: 2.5 * k, ry: 1.2 * k, rot: -25, c: 'screw', g: 'scR' + id, z: z - 0.4 });
    return out;
  }
  // Uniformly scale a part list about (ox, oy) - used to tune overall size of a sprite.
  function sc(k, ox, oy, parts) {
    const tx = v => +(ox + (v - ox) * k).toFixed(2), ty = v => +(oy + (v - oy) * k).toFixed(2);
    return parts.map(p => {
      const q = Object.assign({}, p);
      if (q.x !== undefined) { q.x = tx(q.x); q.y = ty(q.y); }
      for (const f of ['rx', 'ry', 'r1', 'r2', 'w', 'w2']) if (q[f] !== undefined) q[f] = +(q[f] * k).toFixed(2);
      if (q.s !== undefined) q.s = +(q.s * Math.sqrt(k)).toFixed(2);
      if (q.x1 !== undefined) { q.x1 = tx(q.x1); q.y1 = ty(q.y1); q.x2 = tx(q.x2); q.y2 = ty(q.y2); }
      if (q.pts) q.pts = q.pts.map((v, i) => i % 2 === 0 ? tx(v) : ty(v));
      return q;
    });
  }

  G.defMon('POLIWHIRL', { pal: { skin: '#5a8ad8', belly: '#f4f4fa', sw: '#262838', glove: '#f4f4fa' }, parts: [
    { t: 'c', x1: 44, y1: 36, x2: 53, y2: 30, r1: 3.2, r2: 2.8, c: 'skin', g: 'armB', z: -2 },
    { t: 'e', x: 55, y: 28, rx: 4.2, ry: 4.2, c: 'glove', g: 'handB', z: -1 },
    { t: 'c', x1: 40, y1: 49, x2: 43, y2: 55, r1: 4, r2: 3.6, c: 'skin', g: 'legB', z: -1 },
    { t: 'e', x: 45, y: 57, rx: 5.5, ry: 3, c: 'skin', g: 'legB', z: -1 },
    { t: 'e', x: 33, y: 38, rx: 16, ry: 15, c: 'skin', g: 'body' },
    { t: 'e', x: 24, y: 26, rx: 4.4, ry: 4, c: 'skin', g: 'body' },
    { t: 'e', x: 36, y: 25, rx: 4.4, ry: 4, c: 'skin', g: 'body' },
    { t: 'spot', x: 29, y: 40, rx: 11, ry: 11, c: 'belly', on: 'body', face: true },
    { t: 'stripe', pts: spiral(29, 40, 9.5, 2.6, 1, -1.2), w: 1.5, c: 'sw', on: 'body', face: true },
    { t: 'c', x1: 27, y1: 50, x2: 25, y2: 55, r1: 4.2, r2: 3.8, c: 'skin', g: 'legF', z: 1 },
    { t: 'e', x: 23, y: 57, rx: 6, ry: 3.2, c: 'skin', g: 'legF', z: 1 },
    { t: 'c', x1: 21, y1: 37, x2: 12, y2: 31, r1: 3.4, r2: 3, c: 'skin', g: 'armF', z: 2 },
    { t: 'e', x: 10, y: 29, rx: 4.6, ry: 4.6, c: 'glove', g: 'handF', z: 3 },
    { t: 'eye', x: 24, y: 26, s: 3.6, look: [-1, 0] },
    { t: 'eye', x: 36, y: 25, s: 3.6, look: [-1, 0] },
  ] });

  G.defMon('POLIWRATH', { pal: { skin: '#3f68c0', belly: '#f4f4fa', sw: '#262838', glove: '#f4f4fa' }, parts: [
    { t: 'c', x1: 46, y1: 30, x2: 57, y2: 37, r1: 5.4, r2: 4.4, c: 'skin', g: 'armB', z: -2 },
    { t: 'c', x1: 57, y1: 37, x2: 57, y2: 26, r1: 4.4, r2: 3.8, c: 'skin', g: 'armB', z: -2 },
    { t: 'e', x: 57, y: 21, rx: 5.4, ry: 5.8, c: 'glove', g: 'handB', z: -1 },
    { t: 'c', x1: 42, y1: 48, x2: 45, y2: 55, r1: 6, r2: 5, c: 'skin', g: 'legB', z: -1 },
    { t: 'e', x: 47, y: 57.5, rx: 7.5, ry: 3.6, c: 'skin', g: 'legB', z: -1 },
    { t: 'e', x: 33, y: 37, rx: 18.5, ry: 17, c: 'skin', g: 'body' },
    { t: 'e', x: 23, y: 24, rx: 4.6, ry: 4.2, c: 'skin', g: 'body' },
    { t: 'e', x: 36, y: 23, rx: 4.6, ry: 4.2, c: 'skin', g: 'body' },
    { t: 'spot', x: 28, y: 39, rx: 13, ry: 13, c: 'belly', on: 'body', face: true },
    { t: 'stripe', pts: spiral(28, 39, 11.5, 2.6, -1, 2.2), w: 1.8, c: 'sw', on: 'body', face: true },
    { t: 'c', x1: 25, y1: 49, x2: 22, y2: 55, r1: 6, r2: 5.2, c: 'skin', g: 'legF', z: 1 },
    { t: 'e', x: 19, y: 57.5, rx: 8, ry: 3.8, c: 'skin', g: 'legF', z: 1 },
    { t: 'c', x1: 18, y1: 32, x2: 7, y2: 38, r1: 5.8, r2: 4.8, c: 'skin', g: 'armF', z: 2 },
    { t: 'c', x1: 7, y1: 38, x2: 8, y2: 26, r1: 4.8, r2: 4, c: 'skin', g: 'armF', z: 2 },
    { t: 'e', x: 8.5, y: 21, rx: 6, ry: 6.2, c: 'glove', g: 'handF', z: 3 },
    { t: 'eye', x: 23, y: 24, s: 3.4, style: 'sleepy', look: [-1, 0] },
    { t: 'eye', x: 36, y: 23, s: 3.4, style: 'sleepy', look: [-1, 0] },
  ] });

  G.defMon('ABRA', { pal: { fur: '#e0b848', armor: '#8a5a32' }, parts: sc(0.86, 34, 59, [
    { t: 'l', pts: [42, 54, 52, 56, 57, 50, 56, 43], w: 5.6, w2: 4, c: 'fur', g: 'tail', z: -3 },
    { t: 'stripe', pts: [54, 51, 60, 50], w: 2.4, c: 'armor', on: 'tail' },
    { t: 'e', x: 35, y: 45, rx: 11, ry: 10, c: 'armor', g: 'body' },
    { t: 'e', x: 42, y: 37, rx: 5, ry: 3.8, c: 'armor', g: 'shB', z: -1 },
    { t: 'e', x: 26, y: 38, rx: 6, ry: 4.5, c: 'armor', g: 'shF', z: 1 },
    { t: 'e', x: 41, y: 55.5, rx: 8, ry: 3.8, c: 'fur', g: 'legB', z: 1 },
    { t: 'e', x: 27, y: 55, rx: 8.5, ry: 4, c: 'fur', g: 'legF', z: 2 },
    { t: 'c', x1: 38, y1: 41, x2: 32, y2: 48, r1: 2.3, r2: 2.1, c: 'fur', g: 'armB', z: 2 },
    { t: 'c', x1: 25, y1: 41, x2: 26, y2: 48, r1: 2.5, r2: 2.3, c: 'fur', g: 'armF', z: 3 },
    { t: 'e', x: 29, y: 49, rx: 3.4, ry: 2.4, c: 'fur', g: 'armF', z: 3 },
    { t: 'p', pts: [20, 26, 12, 9, 29, 21], c: 'fur', g: 'head', z: 4 },
    { t: 'p', pts: [34, 22, 43, 7, 42, 27], c: 'fur', g: 'earB', z: 3 },
    { t: 'e', x: 30, y: 29, rx: 10.5, ry: 9, c: 'fur', g: 'head', z: 4 },
    { t: 'e', x: 20, y: 32.5, rx: 6.2, ry: 4, rot: -10, c: 'fur', g: 'head', z: 4 },
    { t: 'eye', x: 22, y: 28, s: 2.4, style: 'closed' },
    { t: 'eye', x: 31, y: 28, s: 2.4, style: 'closed' },
  ]) });

  G.defMon('KADABRA', { pal: { fur: '#e8bc48', armor: '#8a5a32', star: '#d83828', spoon: '#c8ccd8', wave: '#e04838' }, parts: [
    // tail with brown band
    { t: 'l', pts: [41, 48, 50, 53, 57, 49, 59.5, 40, 58, 33], w: 6, w2: 3.4, c: 'fur', g: 'tail', z: -3 },
    { t: 'stripe', pts: [55, 44, 62, 44], w: 3, c: 'armor', on: 'tail' },
    // back arm, open hand
    { t: 'c', x1: 44, y1: 29, x2: 50, y2: 36, r1: 2.4, r2: 2.1, c: 'fur', g: 'armB', z: -2 },
    { t: 'c', x1: 50, y1: 36, x2: 54.5, y2: 30.5, r1: 2.1, r2: 1.9, c: 'fur', g: 'armB', z: -2 },
    { t: 'e', x: 55, y: 29.5, rx: 2.4, ry: 2.2, c: 'fur', g: 'armB', z: -2 },
    // back leg
    { t: 'c', x1: 39, y1: 45, x2: 43, y2: 51, r1: 3.6, r2: 2.4, c: 'fur', g: 'legB', z: -1 },
    { t: 'c', x1: 43, y1: 51, x2: 42, y2: 57, r1: 2.4, r2: 2, c: 'fur', g: 'legB', z: -1 },
    { t: 'e', x: 44, y: 57.5, rx: 4.6, ry: 1.9, c: 'fur', g: 'legB', z: -1 },
    // hips + armoured torso with red waves
    { t: 'e', x: 35, y: 45, rx: 7, ry: 4.5, c: 'fur', g: 'hip' },
    { t: 'e', x: 35, y: 35, rx: 9, ry: 9.5, c: 'armor', g: 'body', z: 0.5 },
    { t: 'e', x: 35, y: 41, rx: 6.5, ry: 5, c: 'armor', g: 'body', z: 0.5 },
    { t: 'stripe', pts: [27.5, 34.5, 30.5, 33, 33.5, 34.5, 36.5, 33, 39.5, 34.5], w: 1, c: 'wave', on: 'body', face: true },
    { t: 'stripe', pts: [28, 38, 31, 36.5, 34, 38, 37, 36.5, 40, 38], w: 1, c: 'wave', on: 'body', face: true },
    { t: 'stripe', pts: [29.5, 41.5, 32.5, 40, 35.5, 41.5, 38.5, 40], w: 1, c: 'wave', on: 'body', face: true },
    { t: 'e', x: 43.5, y: 27.5, rx: 5, ry: 4, c: 'armor', g: 'shB', z: -1 },
    // front leg
    { t: 'c', x1: 31, y1: 45, x2: 27, y2: 51, r1: 3.8, r2: 2.6, c: 'fur', g: 'legF', z: 1 },
    { t: 'c', x1: 27, y1: 51, x2: 28, y2: 57, r1: 2.6, r2: 2.1, c: 'fur', g: 'legF', z: 1 },
    { t: 'e', x: 25.5, y: 57.5, rx: 5, ry: 2, c: 'fur', g: 'legF', z: 1 },
    // front arm holding the spoon up
    { t: 'e', x: 27, y: 28.5, rx: 5.6, ry: 4.6, c: 'armor', g: 'shF', z: 2 },
    { t: 'c', x1: 26, y1: 30, x2: 19, y2: 38, r1: 2.5, r2: 2.1, c: 'fur', g: 'armF', z: 3 },
    { t: 'c', x1: 19, y1: 38, x2: 11.5, y2: 36, r1: 2.1, r2: 1.9, c: 'fur', g: 'armF', z: 3 },
    { t: 'c', x1: 9.5, y1: 38, x2: 7, y2: 27, r1: 0.9, r2: 0.9, c: 'spoon', g: 'spoon', z: 4, gloss: true },
    { t: 'e', x: 6.5, y: 23, rx: 2.6, ry: 3.6, c: 'spoon', g: 'spoon', z: 4, gloss: true },
    { t: 'e', x: 10, y: 36.5, rx: 2.5, ry: 2.3, c: 'fur', g: 'armF', z: 5 },
    // head: long ears, star, mustache
    { t: 'p', pts: [34, 10, 45, 1.5, 42, 17], c: 'fur', g: 'earB', z: 5 },
    { t: 'p', pts: [21, 13, 9.5, 2.5, 28, 9], c: 'fur', g: 'head', z: 6 },
    { t: 'e', x: 29, y: 16.5, rx: 10.5, ry: 8.8, c: 'fur', g: 'head', z: 6 },
    { t: 'e', x: 18.5, y: 19.5, rx: 6.8, ry: 3.8, rot: -8, c: 'fur', g: 'head', z: 6 },
    { t: 'p', pts: star(28, 10.5, 4.6, 2, 5, -90), c: 'star', g: 'star', z: 7, flat: true, face: true },
    { t: 'l', pts: [16.5, 21.5, 13.5, 28, 13, 36], w: 2.6, w2: 1, c: 'fur', g: 'must', z: 7 },
    { t: 'l', pts: [22, 22.5, 21, 29, 22.5, 36], w: 2.6, w2: 1, c: 'fur', g: 'must2', z: 7 },
    { t: 'eye', x: 22.5, y: 16.5, s: 2.8, style: 'angry', look: [-1, 0.2] },
    { t: 'eye', x: 30.5, y: 16, s: 2.8, style: 'angry', look: [-1, 0.2], flip: true },
  ] });

  G.defMon('ALAKAZAM', { pal: { fur: '#e0b848', armor: '#8a5a32', spoon: '#c8ccd8' }, parts: [
    { t: 'c', x1: 44, y1: 27, x2: 51, y2: 35, r1: 2.2, r2: 1.9, c: 'fur', g: 'armB', z: -2 },
    { t: 'c', x1: 51, y1: 35, x2: 56, y2: 29, r1: 1.9, r2: 1.7, c: 'fur', g: 'armB', z: -2 },
    { t: 'c', x1: 57, y1: 30, x2: 59, y2: 18, r1: 0.9, r2: 0.9, c: 'spoon', g: 'spoonB', z: -1, gloss: true },
    { t: 'e', x: 59.5, y: 14.5, rx: 2.4, ry: 3.4, c: 'spoon', g: 'spoonB', z: -1, gloss: true },
    { t: 'e', x: 56.5, y: 29, rx: 2.2, ry: 2, c: 'fur', g: 'armB', z: 0 },
    { t: 'c', x1: 39, y1: 43, x2: 43, y2: 51, r1: 3.4, r2: 2.2, c: 'fur', g: 'legB', z: -1 },
    { t: 'c', x1: 43, y1: 51, x2: 42, y2: 57, r1: 2.2, r2: 1.9, c: 'fur', g: 'legB', z: -1 },
    { t: 'e', x: 44, y: 58, rx: 4.6, ry: 1.8, c: 'fur', g: 'legB', z: -1 },
    { t: 'e', x: 35, y: 42, rx: 6.5, ry: 5.5, c: 'fur', g: 'hip' },
    { t: 'stripe', pts: [30, 41, 40, 41], w: 0.8, c: '#b08830', on: 'hip', face: true },
    { t: 'e', x: 35, y: 32, rx: 8.5, ry: 8.5, c: 'armor', g: 'body', z: 0.5 },
    { t: 'e', x: 43, y: 24.5, rx: 6, ry: 4.6, c: 'armor', g: 'shB', z: -1 },
    { t: 'c', x1: 31, y1: 43, x2: 27, y2: 51, r1: 3.6, r2: 2.4, c: 'fur', g: 'legF', z: 1 },
    { t: 'c', x1: 27, y1: 51, x2: 28, y2: 57, r1: 2.4, r2: 2, c: 'fur', g: 'legF', z: 1 },
    { t: 'e', x: 25.5, y: 58, rx: 5, ry: 1.9, c: 'fur', g: 'legF', z: 1 },
    { t: 'e', x: 26.5, y: 25.5, rx: 6.8, ry: 5.2, c: 'armor', g: 'shF', z: 2 },
    { t: 'c', x1: 25, y1: 28, x2: 18, y2: 37, r1: 2.2, r2: 1.9, c: 'fur', g: 'armF', z: 3 },
    { t: 'c', x1: 18, y1: 37, x2: 11, y2: 32, r1: 1.9, r2: 1.7, c: 'fur', g: 'armF', z: 3 },
    { t: 'c', x1: 10, y1: 33, x2: 7.5, y2: 21, r1: 0.9, r2: 0.9, c: 'spoon', g: 'spoon', z: 4, gloss: true },
    { t: 'e', x: 7, y: 17.5, rx: 2.4, ry: 3.4, c: 'spoon', g: 'spoon', z: 4, gloss: true },
    { t: 'e', x: 10.5, y: 32, rx: 2.2, ry: 2, c: 'fur', g: 'armF', z: 5 },
    { t: 'p', pts: [35, 8, 51, 2, 41, 14], c: 'fur', g: 'earB', z: 5 },
    { t: 'p', pts: [22, 11, 8, 1.5, 28, 6], c: 'fur', g: 'head', z: 6 },
    { t: 'e', x: 29, y: 14, rx: 10, ry: 8.5, c: 'fur', g: 'head', z: 6 },
    { t: 'e', x: 19, y: 17, rx: 6.2, ry: 3.6, rot: -8, c: 'fur', g: 'head', z: 6 },
    { t: 'l', pts: [17, 19.5, 13, 26, 12, 35, 14, 44], w: 2.6, w2: 1.1, c: 'fur', g: 'must', z: 7 },
    { t: 'l', pts: [22, 20, 20.5, 27, 21, 36, 24, 44], w: 2.6, w2: 1.1, c: 'fur', g: 'must2', z: 7 },
    { t: 'eye', x: 22, y: 14, s: 2.4, style: 'angry', look: [-1, 0.2] },
    { t: 'eye', x: 31, y: 13.5, s: 2.4, style: 'angry', look: [-1, 0.2], flip: true },
  ] });

  G.defMon('MACHOP', { pal: { skin: '#94a8c4', lip: '#f0dcc0' }, parts: sc(0.9, 32, 59, [
    { t: 'c', x1: 42, y1: 51, x2: 48, y2: 54, r1: 2.4, r2: 1.4, c: 'skin', g: 'tail', z: -3 },
    { t: 'c', x1: 41, y1: 37, x2: 49, y2: 38, r1: 3.4, r2: 3, c: 'skin', g: 'armB', z: -2 },
    { t: 'c', x1: 49, y1: 38, x2: 50, y2: 30, r1: 3, r2: 2.8, c: 'skin', g: 'armB', z: -2 },
    { t: 'e', x: 50, y: 27.5, rx: 3.4, ry: 3.2, c: 'skin', g: 'fistB', z: -1 },
    { t: 'c', x1: 38, y1: 50, x2: 40, y2: 56, r1: 4.2, r2: 3.6, c: 'skin', g: 'legB', z: -1 },
    { t: 'e', x: 42, y: 57.5, rx: 4.6, ry: 2.2, c: 'skin', g: 'legB', z: -1 },
    { t: 'e', x: 34, y: 44, rx: 9.5, ry: 9.5, c: 'skin', g: 'body' },
    { t: 'stripe', pts: [28, 47, 38, 47], w: 1, c: '#7088a8', on: 'body', face: true },
    { t: 'stripe', pts: [28, 50, 38, 50], w: 1, c: '#7088a8', on: 'body', face: true },
    { t: 'c', x1: 30, y1: 50, x2: 28, y2: 56, r1: 4.4, r2: 3.8, c: 'skin', g: 'legF', z: 1 },
    { t: 'e', x: 26, y: 57.5, rx: 5, ry: 2.3, c: 'skin', g: 'legF', z: 1 },
    { t: 'e', x: 32, y: 20, rx: 1.8, ry: 2.8, rot: -10, c: 'skin', g: 'crest', z: 1 },
    { t: 'e', x: 28, y: 19.5, rx: 1.8, ry: 2.8, rot: -10, c: 'skin', g: 'crest2', z: 1.1 },
    { t: 'e', x: 24.5, y: 20.5, rx: 1.8, ry: 2.8, rot: -15, c: 'skin', g: 'crest3', z: 1.2 },
    { t: 'e', x: 30, y: 29, rx: 10.5, ry: 9.5, c: 'skin', g: 'head', z: 2 },
    { t: 'e', x: 24, y: 33, rx: 5.6, ry: 4.6, c: 'skin', g: 'head', z: 2 },
    { t: 'spot', x: 23.5, y: 34, rx: 5.2, ry: 3.4, c: 'lip', on: 'head', face: true },
    { t: 'c', x1: 27, y1: 39, x2: 20, y2: 44, r1: 3.6, r2: 3.2, c: 'skin', g: 'armF', z: 4 },
    { t: 'c', x1: 20, y1: 44, x2: 15, y2: 41, r1: 3.2, r2: 3, c: 'skin', g: 'armF', z: 4 },
    { t: 'e', x: 13.5, y: 40, rx: 3.6, ry: 3.4, c: 'skin', g: 'fist', z: 5 },
    { t: 'mouth', x: 22.5, y: 34, w: 3, style: 'line', c: '#7a5850' },
    { t: 'eye', x: 24, y: 27, s: 2.7, style: 'angry', iris: '#d03030', look: [-1, 0.2] },
    { t: 'eye', x: 32.5, y: 26.5, s: 2.7, style: 'angry', iris: '#d03030', look: [-1, 0.2], flip: true },
  ]) });

  G.defMon('MACHOKE', { pal: { skin: '#a4a0c4', skinD: '#8480a8', lip: '#f0dcc0', brief: '#2c2c3c', vein: '#d0505a' }, parts: [
    // back arm: hand on hip
    { t: 'e', x: 46, y: 27.5, rx: 5, ry: 4.5, c: 'skin', g: 'shB', z: -1.5 },
    { t: 'c', x1: 47, y1: 29, x2: 53, y2: 37, r1: 4.8, r2: 4, c: 'skin', g: 'armB', z: -2 },
    { t: 'c', x1: 53, y1: 37, x2: 47, y2: 43, r1: 3.8, r2: 3.4, c: 'skin', g: 'armB', z: -2 },
    { t: 'stripe', pts: [49, 29, 55, 35], w: 1.1, c: 'vein', on: 'armB' },
    { t: 'e', x: 46, y: 44, rx: 3.8, ry: 3.6, c: 'skin', g: 'fistB', z: -1 },
    // back leg
    { t: 'c', x1: 41, y1: 48, x2: 46, y2: 56, r1: 5.6, r2: 4.2, c: 'skin', g: 'legB', z: -1 },
    { t: 'e', x: 48, y: 57.5, rx: 5.5, ry: 2.4, c: 'skin', g: 'legB', z: -1 },
    { t: 'stripe', pts: [42, 47, 47, 53], w: 1.1, c: 'vein', on: 'legB' },
    // V-shaped muscular torso
    { t: 'e', x: 35, y: 30.5, rx: 13, ry: 9, c: 'skin', g: 'body' },
    { t: 'e', x: 35, y: 40, rx: 9, ry: 7, c: 'skin', g: 'body' },
    { t: 'stripe', pts: [24, 32, 29, 35.5, 34, 34], w: 1.1, c: 'skinD', on: 'body', face: true },
    { t: 'stripe', pts: [34, 34, 39, 35.5, 43, 33], w: 1.1, c: 'skinD', on: 'body', face: true },
    { t: 'stripe', pts: [34, 36, 34, 44], w: 0.9, c: 'skinD', on: 'body', face: true },
    { t: 'stripe', pts: [30, 39.5, 38, 39.5], w: 0.8, c: 'skinD', on: 'body', face: true },
    { t: 'stripe', pts: [35, 24, 35, 42], w: 1, c: 'skinD', on: 'body', backOnly: true },
    // black briefs
    { t: 'e', x: 35, y: 46, rx: 10, ry: 4.6, c: 'brief', g: 'brief', z: 0.5 },
    { t: 'p', pts: [26, 45, 44, 45, 40, 50, 35, 52, 30, 50], c: 'brief', g: 'brief', z: 0.5 },
    // front leg
    { t: 'c', x1: 29, y1: 48, x2: 23, y2: 56, r1: 5.8, r2: 4.3, c: 'skin', g: 'legF', z: 1 },
    { t: 'e', x: 21, y: 57.5, rx: 6, ry: 2.5, c: 'skin', g: 'legF', z: 1 },
    { t: 'stripe', pts: [28, 48, 23, 53], w: 1.1, c: 'vein', on: 'legF', face: true },
    // head: triple-ridge crest, big lips
    { t: 'c', x1: 35, y1: 14, x2: 37, y2: 10, r1: 2.3, r2: 2, c: 'skin', g: 'crest3', z: 1.4 },
    { t: 'c', x1: 30.5, y1: 13, x2: 32, y2: 8.5, r1: 2.5, r2: 2.2, c: 'skin', g: 'crest2', z: 1.5 },
    { t: 'c', x1: 26, y1: 14, x2: 26.5, y2: 9.5, r1: 2.3, r2: 2, c: 'skin', g: 'crest1', z: 1.6 },
    { t: 'e', x: 31, y: 19, rx: 8.2, ry: 7.8, c: 'skin', g: 'head', z: 2 },
    { t: 'e', x: 26.5, y: 23, rx: 5.2, ry: 4.4, c: 'skin', g: 'head', z: 2 },
    { t: 'spot', x: 25.5, y: 24.8, rx: 4.4, ry: 2.6, c: 'lip', on: 'head', face: true },
    // front arm: deltoid + hand on hip
    { t: 'e', x: 24.5, y: 27.5, rx: 5.2, ry: 4.6, c: 'skin', g: 'shF', z: 3.5 },
    { t: 'c', x1: 23, y1: 29, x2: 15, y2: 37, r1: 5, r2: 4.2, c: 'skin', g: 'armF', z: 4 },
    { t: 'c', x1: 15, y1: 37, x2: 22, y2: 43, r1: 4, r2: 3.6, c: 'skin', g: 'armF', z: 4 },
    { t: 'stripe', pts: [21, 29, 15, 35], w: 1.2, c: 'vein', on: 'armF' },
    { t: 'e', x: 24, y: 44, rx: 4, ry: 3.8, c: 'skin', g: 'fist', z: 5 },
    { t: 'mouth', x: 25.5, y: 25, w: 3, style: 'line', c: '#8a6058' },
    { t: 'eye', x: 24, y: 18.5, s: 2.8, style: 'angry', iris: '#d03030', look: [-1, 0.2] },
    { t: 'eye', x: 31.5, y: 18, s: 2.8, style: 'angry', iris: '#d03030', look: [-1, 0.2], flip: true },
  ] });

  G.defMon('MACHAMP', { pal: { skin: '#8aa0bc', lip: '#f0dcc0', brief: '#2c2c3c', belt: '#e8c040' }, parts: [
    { t: 'c', x1: 44, y1: 25, x2: 54, y2: 24, r1: 4.6, r2: 4, c: 'skin', g: 'armBT', z: -3 },
    { t: 'c', x1: 54, y1: 24, x2: 56, y2: 13, r1: 4, r2: 3.4, c: 'skin', g: 'armBT', z: -3 },
    { t: 'e', x: 56.5, y: 9, rx: 4.2, ry: 4, c: 'skin', g: 'fistBT', z: -2 },
    { t: 'c', x1: 44, y1: 34, x2: 53, y2: 41, r1: 4.2, r2: 3.6, c: 'skin', g: 'armBL', z: -2 },
    { t: 'c', x1: 53, y1: 41, x2: 57, y2: 36, r1: 3.6, r2: 3.2, c: 'skin', g: 'armBL', z: -2 },
    { t: 'e', x: 58, y: 34, rx: 3.8, ry: 3.6, c: 'skin', g: 'fistBL', z: -1 },
    { t: 'c', x1: 41, y1: 48, x2: 46, y2: 55, r1: 5.8, r2: 4.4, c: 'skin', g: 'legB', z: -1 },
    { t: 'e', x: 48, y: 57.5, rx: 6, ry: 2.6, c: 'skin', g: 'legB', z: -1 },
    { t: 'e', x: 35, y: 33, rx: 12.5, ry: 11.5, c: 'skin', g: 'body' },
    { t: 'stripe', pts: [26, 30, 30, 33, 35, 33], w: 1, c: '#6c84a4', on: 'body', face: true },
    { t: 'stripe', pts: [30, 38, 36, 38], w: 1, c: '#6c84a4', on: 'body', face: true },
    { t: 'e', x: 35, y: 47, rx: 10, ry: 5, c: 'brief', g: 'brief', z: 0.5 },
    { t: 'e', x: 35, y: 43, rx: 10.5, ry: 3.2, c: 'belt', g: 'belt', z: 0.6, gloss: true },
    { t: 'e', x: 29, y: 43.5, rx: 3.4, ry: 3, c: 'belt', g: 'buckle', z: 0.7, gloss: true, face: true },
    { t: 'c', x1: 29, y1: 49, x2: 23, y2: 55, r1: 6, r2: 4.6, c: 'skin', g: 'legF', z: 1 },
    { t: 'e', x: 21, y: 57.5, rx: 6.5, ry: 2.7, c: 'skin', g: 'legF', z: 1 },
    { t: 'e', x: 34, y: 12, rx: 1.8, ry: 2.8, rot: -10, c: 'skin', g: 'crest', z: 6 },
    { t: 'e', x: 30.5, y: 11.5, rx: 1.8, ry: 2.8, rot: -10, c: 'skin', g: 'crest2', z: 6.1 },
    { t: 'e', x: 27, y: 12.5, rx: 1.8, ry: 2.8, rot: -15, c: 'skin', g: 'crest3', z: 6.2 },
    { t: 'e', x: 31, y: 19, rx: 8, ry: 7.5, c: 'skin', g: 'head', z: 7 },
    { t: 'e', x: 26.5, y: 22.5, rx: 4.6, ry: 4, c: 'skin', g: 'head', z: 7 },
    { t: 'spot', x: 26, y: 23.5, rx: 4.4, ry: 3, c: 'lip', on: 'head', face: true },
    { t: 'c', x1: 26, y1: 25, x2: 15, y2: 23, r1: 4.8, r2: 4, c: 'skin', g: 'armFT', z: 4 },
    { t: 'c', x1: 15, y1: 23, x2: 11, y2: 13, r1: 4, r2: 3.4, c: 'skin', g: 'armFT', z: 4 },
    { t: 'e', x: 10, y: 9, rx: 4.4, ry: 4.2, c: 'skin', g: 'fistFT', z: 5 },
    { t: 'c', x1: 27, y1: 34, x2: 18, y2: 42, r1: 4.4, r2: 3.8, c: 'skin', g: 'armFL', z: 4 },
    { t: 'c', x1: 18, y1: 42, x2: 12, y2: 37, r1: 3.8, r2: 3.4, c: 'skin', g: 'armFL', z: 4 },
    { t: 'e', x: 10.5, y: 35, rx: 4, ry: 3.8, c: 'skin', g: 'fistFL', z: 5 },
    { t: 'mouth', x: 25, y: 24, w: 3, style: 'line', c: '#7a5850' },
    { t: 'eye', x: 25.5, y: 18, s: 2.3, style: 'angry', iris: '#d03030', look: [-1, 0.2] },
    { t: 'eye', x: 32.5, y: 17.5, s: 2.3, style: 'angry', iris: '#d03030', look: [-1, 0.2], flip: true },
  ] });

  G.defMon('BELLSPROUT', { pal: { head: '#f0e070', lip: '#e88898', stem: '#78b048', leaf: '#58a040', root: '#a88848' }, parts: [
    { t: 'l', pts: [31, 53, 28, 56, 23, 58], w: 1.6, w2: 1, c: 'root', g: 'root', z: -1 },
    { t: 'l', pts: [32, 53, 35, 56, 40, 58], w: 1.6, w2: 1, c: 'root', g: 'root2', z: -1 },
    { t: 'l', pts: [32, 54, 32, 46, 30, 38, 31, 31], w: 2.4, w2: 2, c: 'stem', g: 'stem' },
    { t: 'p', pts: [32, 45, 26, 41, 17, 42, 24, 47], c: 'leaf', g: 'leafF', z: 1 },
    { t: 'p', pts: [32, 44, 38, 40, 47, 41, 40, 46], c: 'leaf', g: 'leafB', z: -1 },
    { t: 'e', x: 31, y: 24, rx: 6.5, ry: 8.5, rot: -35, c: 'head', g: 'head', z: 2 },
    { t: 'e', x: 25, y: 29.5, rx: 3.8, ry: 2.8, rot: -35, c: 'lip', g: 'lip', z: 3, face: true },
    { t: 'e', x: 24.5, y: 30, rx: 2, ry: 1.3, rot: -35, c: '#6a2838', g: 'mouth', z: 4, face: true, flat: true },
    { t: 'eye', x: 27, y: 22, s: 1.6, sclera: false },
    { t: 'eye', x: 33, y: 21, s: 1.6, sclera: false },
  ] });

  G.defMon('WEEPINBELL', { pal: { body: '#ecd458', lip: '#e89868', stem: '#8a6a3a', leaf: '#58a040', inner: '#9a4838' }, parts: [
    { t: 'l', pts: [36, 22, 36, 15, 40, 12, 44, 14], w: 3, w2: 2, c: 'stem', g: 'stem', z: -1 },
    { t: 'p', pts: [44, 36, 52, 30, 60, 30, 55, 36, 46, 40], c: 'leaf', g: 'leafB', z: -2 },
    { t: 'e', x: 33, y: 36, rx: 13, ry: 14, c: 'body', g: 'body' },
    { t: 'e', x: 33, y: 24, rx: 7, ry: 5, c: 'body', g: 'body' },
    { t: 'e', x: 26, y: 45, rx: 11, ry: 6.5, rot: -20, c: 'lip', g: 'lip', z: 1, face: true },
    { t: 'e', x: 25.5, y: 45.5, rx: 8.5, ry: 4.4, rot: -20, c: 'inner', g: 'inner', z: 2, face: true },
    { t: 'p', pts: [22, 36, 12, 30, 4, 33, 10, 38, 20, 40], c: 'leaf', g: 'leafF', z: 3 },
    { t: 'stripe', pts: [20, 38, 10, 34, 5, 34], w: 0.8, c: '#3c7a30', on: 'leafF' },
    { t: 'eye', x: 27, y: 30, s: 2, sclera: false, look: [-1, 0] },
    { t: 'eye', x: 35, y: 29, s: 2, sclera: false, look: [-1, 0] },
  ] });

  G.defMon('VICTREEBEL', { pal: { body: '#c8d45a', lip: '#e8849a', stem: '#8a6a3a', leaf: '#4c9a40', inner: '#8a3040', tooth: '#f8f8f0' }, parts: [
    { t: 'l', pts: [44, 26, 52, 16, 52, 6, 44, 3], w: 3.2, w2: 2.2, c: 'stem', g: 'vine', z: -2 },
    { t: 'p', pts: [45, 3, 38, 1.5, 32, 5, 37, 8, 44, 6], c: 'leaf', g: 'vleaf', z: -1 },
    { t: 'p', pts: [42, 50, 54, 45, 61, 48, 56, 55, 44, 57], c: 'leaf', g: 'leafB', z: -2 },
    { t: 'e', x: 35, y: 40, rx: 14, ry: 16, c: 'body', g: 'body' },
    { t: 'e', x: 34, y: 54, rx: 8, ry: 5, c: 'body', g: 'body' },
    { t: 'spot', x: 44, y: 34, rx: 1.6, ry: 1.3, c: '#8a8a38', on: 'body' },
    { t: 'spot', x: 46, y: 40, rx: 1.4, ry: 1.2, c: '#8a8a38', on: 'body' },
    { t: 'spot', x: 41, y: 45, rx: 1.3, ry: 1.1, c: '#8a8a38', on: 'body' },
    { t: 'e', x: 30, y: 26, rx: 13, ry: 7.5, rot: -18, c: 'lip', g: 'lip', z: 1 },
    { t: 'e', x: 29.5, y: 26.5, rx: 10.5, ry: 5.2, rot: -18, c: 'inner', g: 'inner', z: 2, face: true },
    { t: 'p', pts: [19, 27, 21, 32, 23, 27.5], c: 'tooth', g: 'tooth', z: 3, face: true },
    { t: 'p', pts: [37, 25, 40, 29, 41, 23.5], c: 'tooth', g: 'tooth2', z: 3, face: true },
    { t: 'p', pts: [25, 54, 14, 49, 3, 52, 10, 58, 26, 59], c: 'leaf', g: 'leafF', z: 3 },
    { t: 'stripe', pts: [24, 56, 12, 53, 5, 53], w: 0.8, c: '#347a30', on: 'leafF' },
    { t: 'eye', x: 24, y: 37, s: 2.2, style: 'angry', look: [-1, 0] },
    { t: 'eye', x: 33, y: 37, s: 2.2, style: 'angry', look: [-1, 0], flip: true },
  ] });

  G.defMon('TENTACOOL', { pal: { dome: '#a8d8f4', body: '#3a70c0', orb: '#e03040', tent: '#8ab0e0' }, parts: [
    { t: 'l', pts: [38, 44, 42, 49, 46, 52, 44, 57], w: 3, w2: 1.8, c: 'tent', g: 'tentB', z: -1 },
    { t: 'e', x: 32, y: 42, rx: 11, ry: 5, c: 'body', g: 'body' },
    { t: 'e', x: 32, y: 33, rx: 14, ry: 10.5, c: 'dome', g: 'dome', z: 1, gloss: true },
    { t: 'e', x: 41, y: 31, rx: 3.8, ry: 3.6, c: 'orb', g: 'orbB', z: 2, gloss: true },
    { t: 'e', x: 23, y: 32, rx: 4.6, ry: 4.2, c: 'orb', g: 'orbF', z: 2, gloss: true },
    { t: 'e', x: 30, y: 40.5, rx: 2, ry: 1.8, c: 'orb', g: 'orbC', z: 2, gloss: true, face: true },
    { t: 'l', pts: [27, 45, 25, 50, 20, 53, 22, 58], w: 3.2, w2: 2, c: 'tent', g: 'tentF', z: 2 },
    { t: 'eye', x: 25, y: 44, s: 1.4, sclera: false },
    { t: 'eye', x: 35, y: 44, s: 1.4, sclera: false },
  ] });

  G.defMon('TENTACRUEL', { pal: { dome: '#80bff0', body: '#3a68b8', orb: '#e03040', tent: '#8aaee0', beak: '#e8e0c8' }, parts: [
    { t: 'l', pts: [38, 40, 45, 46, 52, 48, 57, 55], w: 3.6, w2: 2, c: 'tent', g: 't1', z: -2 },
    { t: 'l', pts: [34, 42, 37, 50, 42, 58], w: 2.6, w2: 1.4, c: 'tent', g: 't2', z: -2 },
    { t: 'l', pts: [30, 42, 29, 50, 32, 58], w: 2.6, w2: 1.4, c: 'tent', g: 't3', z: -2 },
    { t: 'e', x: 32, y: 37, rx: 12, ry: 7, c: 'body', g: 'body' },
    ...bumps(32, 30, 16, 6.5, 7, 2.6, 20, 160, { c: 'dome', g: 'dome', z: 1 }),
    { t: 'e', x: 32, y: 21, rx: 17, ry: 12.5, c: 'dome', g: 'dome', z: 1, gloss: true },
    { t: 'e', x: 43, y: 18, rx: 4.8, ry: 4.4, c: 'orb', g: 'orbB', z: 2, gloss: true },
    { t: 'e', x: 21, y: 19, rx: 5.8, ry: 5.2, c: 'orb', g: 'orbF', z: 2, gloss: true },
    { t: 'e', x: 30, y: 29, rx: 2.4, ry: 2.2, c: 'orb', g: 'orbC', z: 2, gloss: true, face: true },
    { t: 'p', pts: [26, 40, 34, 40, 30, 46], c: 'beak', g: 'beak', z: 3, face: true },
    { t: 'l', pts: [25, 41, 18, 47, 11, 48, 6, 55], w: 3.8, w2: 2, c: 'tent', g: 't4', z: 3 },
    { t: 'l', pts: [28, 43, 24, 50, 18, 57], w: 2.8, w2: 1.4, c: 'tent', g: 't5', z: 4 },
    { t: 'eye', x: 24, y: 36, s: 2.2, style: 'angry', iris: '#c02030', look: [-1, 0] },
    { t: 'eye', x: 36, y: 36, s: 2.2, style: 'angry', iris: '#c02030', look: [-1, 0], flip: true },
  ] });

  G.defMon('GEODUDE', { pal: { rock: '#aaa28e', crack: '#7a7262', brow: '#78705f' }, parts: [
    // back arm: flexed bicep, big fist up
    { t: 'c', x1: 43, y1: 41, x2: 52, y2: 44, r1: 3.8, r2: 3.4, c: 'rock', g: 'armB', z: -2 },
    { t: 'e', x: 48, y: 41.5, rx: 4.2, ry: 3.4, rot: 15, c: 'rock', g: 'armB', z: -2 },
    { t: 'c', x1: 52, y1: 44, x2: 53.5, y2: 36, r1: 3.4, r2: 4, c: 'rock', g: 'armB', z: -2 },
    { t: 'e', x: 53.5, y: 31.5, rx: 4.6, ry: 4.4, c: 'rock', g: 'fistB', z: -1 },
    { t: 'stripe', pts: [51.5, 32, 51.5, 35.5], w: 0.8, c: 'crack', on: 'fistB' },
    { t: 'stripe', pts: [54, 32, 54, 36], w: 0.8, c: 'crack', on: 'fistB' },
    // rocky body
    ...bumps(32, 41, 12.5, 11.5, 12, 2.6, -170, 170, { c: 'rock', g: 'body' }),
    { t: 'e', x: 32, y: 41, rx: 13.5, ry: 12.5, c: 'rock', g: 'body' },
    { t: 'stripe', pts: [37, 50, 40, 47, 43, 49], w: 0.9, c: 'crack', on: 'body' },
    { t: 'stripe', pts: [23, 49, 27, 48], w: 0.9, c: 'crack', on: 'body' },
    { t: 'stripe', pts: [40, 32, 43, 35], w: 0.9, c: 'crack', on: 'body' },
    { t: 'stripe', pts: [27, 31, 31, 33, 36, 31.5], w: 0.9, c: 'crack', on: 'body', backOnly: true },
    { t: 'stripe', pts: [26, 44, 31, 46, 34, 43], w: 0.9, c: 'crack', on: 'body', backOnly: true },
    // heavy rocky brow ridge
    { t: 'p', pts: [19.5, 35, 25, 36, 30, 38, 29.5, 40.5, 24.5, 39.5, 20.5, 38.5], c: 'brow', g: 'browL', z: 1, face: true },
    { t: 'p', pts: [32, 38, 37.5, 35.5, 42.5, 34, 42, 37.5, 37.5, 39.5, 32.5, 40.5], c: 'brow', g: 'browR', z: 1, face: true },
    // front arm: flexed bicep, big fist up
    { t: 'c', x1: 21, y1: 42, x2: 12, y2: 45, r1: 3.9, r2: 3.5, c: 'rock', g: 'armF', z: 2 },
    { t: 'e', x: 16, y: 42, rx: 4.4, ry: 3.5, rot: -15, c: 'rock', g: 'armF', z: 2 },
    { t: 'c', x1: 12, y1: 45, x2: 10.5, y2: 37, r1: 3.5, r2: 4.1, c: 'rock', g: 'armF', z: 2 },
    { t: 'e', x: 10.5, y: 32, rx: 4.8, ry: 4.6, c: 'rock', g: 'fistF', z: 3 },
    { t: 'stripe', pts: [8, 32.5, 8, 36], w: 0.8, c: 'crack', on: 'fistF' },
    { t: 'stripe', pts: [10.5, 32.5, 10.5, 36.5], w: 0.8, c: 'crack', on: 'fistF' },
    { t: 'stripe', pts: [13, 32.5, 13, 36], w: 0.8, c: 'crack', on: 'fistF' },
    { t: 'eye', x: 25.5, y: 42.5, s: 2.5, style: 'round', look: [-1, -0.3] },
    { t: 'eye', x: 35, y: 42.5, s: 2.5, style: 'round', look: [-1, -0.3] },
    { t: 'mouth', x: 30, y: 49.5, w: 3, style: 'frown' },
  ] });

  G.defMon('GRAVELER', { pal: { rock: '#a09a88', crack: '#747060' }, parts: [
    { t: 'c', x1: 44, y1: 28, x2: 53, y2: 24, r1: 3.4, r2: 3, c: 'rock', g: 'armBT', z: -2 },
    { t: 'c', x1: 53, y1: 24, x2: 55, y2: 15, r1: 3, r2: 2.8, c: 'rock', g: 'armBT', z: -2 },
    { t: 'e', x: 55.5, y: 12, rx: 3.8, ry: 3.6, c: 'rock', g: 'fistBT', z: -1 },
    { t: 'c', x1: 45, y1: 40, x2: 54, y2: 44, r1: 3.2, r2: 2.8, c: 'rock', g: 'armBL', z: -2 },
    { t: 'e', x: 56, y: 45, rx: 3.6, ry: 3.4, c: 'rock', g: 'fistBL', z: -1 },
    { t: 'e', x: 41, y: 55, rx: 5, ry: 3.4, c: 'rock', g: 'legB', z: -1 },
    ...bumps(32, 36, 15, 13, 13, 3.4, -170, 170, { c: 'rock', g: 'body' }),
    { t: 'e', x: 32, y: 36, rx: 16, ry: 15, c: 'rock', g: 'body' },
    { t: 'stripe', pts: [40, 44, 43, 41, 46, 43], w: 1, c: 'crack', on: 'body' },
    { t: 'stripe', pts: [22, 26, 25, 24, 28, 25], w: 1, c: 'crack', on: 'body' },
    { t: 'stripe', pts: [38, 26, 41, 28], w: 1, c: 'crack', on: 'body' },
    { t: 'stripe', pts: [24, 48, 27, 46, 29, 48], w: 1, c: 'crack', on: 'body' },
    { t: 'e', x: 25, y: 56, rx: 5.5, ry: 3.6, c: 'rock', g: 'legF', z: 1 },
    { t: 'c', x1: 21, y1: 29, x2: 12, y2: 25, r1: 3.6, r2: 3.2, c: 'rock', g: 'armFT', z: 2 },
    { t: 'c', x1: 12, y1: 25, x2: 10, y2: 15, r1: 3.2, r2: 3, c: 'rock', g: 'armFT', z: 2 },
    { t: 'e', x: 9.5, y: 12, rx: 4.2, ry: 4, c: 'rock', g: 'fistFT', z: 3 },
    { t: 'c', x1: 20, y1: 41, x2: 11, y2: 45, r1: 3.4, r2: 3, c: 'rock', g: 'armFL', z: 2 },
    { t: 'e', x: 9, y: 46, rx: 4, ry: 3.8, c: 'rock', g: 'fistFL', z: 3 },
    { t: 'c', x1: 21, y1: 31.5, x2: 38, y2: 30.5, r1: 1.6, r2: 1.6, c: 'rock', g: 'brow', z: 1, face: true },
    { t: 'eye', x: 25, y: 35, s: 2.6, style: 'angry', look: [-1, 0] },
    { t: 'eye', x: 35, y: 34.5, s: 2.6, style: 'angry', look: [-1, 0], flip: true },
    { t: 'mouth', x: 29, y: 42, w: 4, style: 'fang' },
  ] });

  G.defMon('GOLEM', { pal: { shell: '#948a78', skin: '#c89c6c', skinD: '#9a7048', crack: '#625a4c' }, parts: [
    // back limbs
    { t: 'c', x1: 49, y1: 42, x2: 57, y2: 45, r1: 4.2, r2: 3.6, c: 'skin', g: 'armB', z: -2 },
    { t: 'e', x: 58.5, y: 46, rx: 3.8, ry: 3.4, c: 'skin', g: 'armB', z: -2 },
    { t: 'c', x1: 44, y1: 50, x2: 46, y2: 56, r1: 4.8, r2: 4.4, c: 'skin', g: 'legB', z: -1 },
    { t: 'e', x: 47.5, y: 57.5, rx: 6, ry: 2.6, c: 'skin', g: 'legB', z: -1 },
    // boulder shell with rocky plates
    ...bumps(36, 32, 19, 17, 15, 4.2, -178, 178, { c: 'shell', g: 'shell' }),
    { t: 'e', x: 36, y: 32, rx: 20, ry: 18.5, c: 'shell', g: 'shell' },
    { t: 'stripe', pts: [26, 18, 31, 22, 38, 20, 44, 23, 50, 21], w: 1.2, c: 'crack', on: 'shell' },
    { t: 'stripe', pts: [31, 22, 30, 29], w: 1.1, c: 'crack', on: 'shell' },
    { t: 'stripe', pts: [44, 23, 45, 31, 52, 33], w: 1.1, c: 'crack', on: 'shell' },
    { t: 'stripe', pts: [38, 20, 38, 13], w: 1.1, c: 'crack', on: 'shell' },
    { t: 'stripe', pts: [45, 31, 42, 39, 46, 46], w: 1.1, c: 'crack', on: 'shell' },
    { t: 'stripe', pts: [34, 44, 42, 39], w: 1.1, c: 'crack', on: 'shell' },
    // front limbs
    { t: 'c', x1: 25, y1: 50, x2: 23, y2: 56, r1: 5, r2: 4.6, c: 'skin', g: 'legF', z: 1 },
    { t: 'e', x: 21.5, y: 57.5, rx: 6.5, ry: 2.8, c: 'skin', g: 'legF', z: 1 },
    { t: 'stripe', pts: [16, 57, 16, 60], w: 0.7, c: 'skinD', on: 'legF' },
    { t: 'stripe', pts: [20, 56.5, 20, 60], w: 0.7, c: 'skinD', on: 'legF' },
    { t: 'c', x1: 20, y1: 43, x2: 11, y2: 47, r1: 4.4, r2: 3.8, c: 'skin', g: 'armF', z: 2 },
    { t: 'e', x: 9, y: 48, rx: 4.2, ry: 3.6, c: 'skin', g: 'armF', z: 2 },
    { t: 'stripe', pts: [5.5, 47, 8, 48], w: 0.7, c: 'skinD', on: 'armF' },
    { t: 'stripe', pts: [6, 50, 8.5, 50], w: 0.7, c: 'skinD', on: 'armF' },
    // head poking out under the shell rim
    { t: 'e', x: 24, y: 34.5, rx: 11, ry: 9.5, c: '#57503f', g: 'hole', z: 2.5, face: true, flat: true },
    { t: 'e', x: 20.5, y: 37.5, rx: 9.5, ry: 8.5, c: 'skin', g: 'head', z: 3, face: true },
    { t: 'e', x: 16, y: 40, rx: 5.5, ry: 4.4, c: 'skin', g: 'head', z: 3, face: true },
    { t: 'eye', x: 17, y: 35.5, s: 2.6, style: 'angry', iris: '#c03028', look: [-1, 0] },
    { t: 'eye', x: 25.5, y: 35, s: 2.6, style: 'angry', iris: '#c03028', look: [-1, 0], flip: true },
    { t: 'mouth', x: 16.5, y: 41.5, w: 3.5, style: 'fang' },
  ] });

  G.defMon('PONYTA', { pal: { coat: '#f8eed0', hoof: '#8a8078', f1: '#f8d040', f2: '#f07828', f3: '#e03820' }, parts: sc(0.88, 34, 59, [
    { t: 'p', pts: [46, 36, 54, 28, 62, 30, 58, 36, 62, 40, 56, 42, 58, 48, 50, 42], c: 'f2', g: 'tailO', z: -2, flat: true },
    { t: 'p', pts: [47, 37, 54, 32, 58, 34, 55, 38, 57, 44, 51, 41], c: 'f1', g: 'tailI', z: -1.9, flat: true },
    { t: 'c', x1: 44, y1: 44, x2: 47, y2: 55, r1: 2.6, r2: 1.9, c: 'coat', g: 'legBR', z: -1 },
    { t: 'c', x1: 30, y1: 45, x2: 32, y2: 55, r1: 2.4, r2: 1.8, c: 'coat', g: 'legFR', z: -1 },
    { t: 'e', x: 47.5, y: 56.5, rx: 2.3, ry: 1.8, c: 'hoof', g: 'hoofBR', z: -1 },
    { t: 'e', x: 32.5, y: 56.5, rx: 2.2, ry: 1.8, c: 'hoof', g: 'hoofFR', z: -1 },
    { t: 'e', x: 37, y: 40, rx: 12, ry: 7, c: 'coat', g: 'body' },
    { t: 'c', x1: 41, y1: 42, x2: 42, y2: 56, r1: 3.2, r2: 2.1, c: 'coat', g: 'legBL', z: 1 },
    { t: 'c', x1: 27, y1: 42, x2: 26, y2: 56, r1: 3, r2: 2, c: 'coat', g: 'legFL', z: 1 },
    { t: 'e', x: 42.5, y: 57.5, rx: 2.5, ry: 1.9, c: 'hoof', g: 'hoofBL', z: 1 },
    { t: 'e', x: 26, y: 57.5, rx: 2.5, ry: 1.9, c: 'hoof', g: 'hoofFL', z: 1 },
    { t: 'p', pts: [29, 16, 24, 8, 32, 11, 34, 4, 38, 14, 44, 10, 42, 20, 48, 20, 42, 28, 44, 34, 36, 34], c: 'f2', g: 'maneO', z: 1.5, flat: true },
    { t: 'p', pts: [31, 18, 30, 12, 35, 15, 37, 9, 39, 17, 42, 15, 40, 24, 43, 25, 39, 30, 36, 30], c: 'f1', g: 'maneI', z: 1.6, flat: true },
    { t: 'c', x1: 34, y1: 38, x2: 26, y2: 26, r1: 5, r2: 4.2, c: 'coat', g: 'neck', z: 2 },
    { t: 'e', x: 23, y: 23, rx: 6.5, ry: 5.5, c: 'coat', g: 'head', z: 3 },
    { t: 'e', x: 15.5, y: 27, rx: 4.2, ry: 3.4, rot: 25, c: 'coat', g: 'head', z: 3 },
    { t: 'p', pts: [26, 19, 27, 11, 30, 18], c: 'coat', g: 'ear', z: 2.5 },
    { t: 'p', pts: [22, 18, 19, 10, 27, 12, 25, 18], c: 'f3', g: 'fore', z: 3.5, flat: true },
    { t: 'eye', x: 20.5, y: 22.5, s: 2.6, iris: '#a83028', look: [-1, 0] },
    { t: 'mouth', x: 14, y: 29, w: 1.5, style: 'line' },
  ]) });

  G.defMon('RAPIDASH', { pal: { coat: '#f8eed0', hoof: '#8a8078', horn: '#dcdce4', f1: '#f8d040', f2: '#f07828', f3: '#e03820' }, parts: [
    { t: 'p', pts: [48, 32, 55, 22, 59, 12, 61.5, 22, 59, 30, 61.5, 36, 57.5, 40, 61, 48, 55, 44, 51, 38], c: 'f2', g: 'tailO', z: -2, flat: true },
    { t: 'p', pts: [49, 33, 56, 26, 59, 20, 60, 28, 57, 33, 59, 40, 53, 38], c: 'f1', g: 'tailI', z: -1.9, flat: true },
    { t: 'c', x1: 47, y1: 40, x2: 51, y2: 48, r1: 2.8, r2: 1.9, c: 'coat', g: 'legBR', z: -1 },
    { t: 'c', x1: 51, y1: 48, x2: 50, y2: 56, r1: 1.9, r2: 1.6, c: 'coat', g: 'legBR', z: -1 },
    { t: 'c', x1: 31, y1: 40, x2: 34, y2: 56, r1: 2.4, r2: 1.6, c: 'coat', g: 'legFR', z: -1 },
    { t: 'p', pts: [48, 54, 50, 50, 52, 52, 54, 49, 54, 55], c: 'f2', g: 'fl1', z: -0.9, flat: true },
    { t: 'p', pts: [32, 54, 34, 50, 36, 52, 38, 49, 37, 55], c: 'f2', g: 'fl2', z: -0.9, flat: true },
    { t: 'e', x: 50.5, y: 57, rx: 2.2, ry: 1.7, c: 'hoof', g: 'hoofBR', z: -1 },
    { t: 'e', x: 34.5, y: 57, rx: 2.2, ry: 1.7, c: 'hoof', g: 'hoofFR', z: -1 },
    { t: 'e', x: 39, y: 36, rx: 13, ry: 7, c: 'coat', g: 'body' },
    { t: 'c', x1: 44, y1: 39, x2: 46, y2: 48, r1: 3.2, r2: 2, c: 'coat', g: 'legBL', z: 1 },
    { t: 'c', x1: 46, y1: 48, x2: 44, y2: 57, r1: 2, r2: 1.7, c: 'coat', g: 'legBL', z: 1 },
    { t: 'c', x1: 29, y1: 38, x2: 26, y2: 57, r1: 3, r2: 1.8, c: 'coat', g: 'legFL', z: 1 },
    { t: 'p', pts: [42, 55, 43, 50, 45, 53, 47, 50, 47, 56], c: 'f2', g: 'fl3', z: 1.1, flat: true },
    { t: 'p', pts: [23, 55, 24, 50, 26, 53, 29, 50, 29, 56], c: 'f2', g: 'fl4', z: 1.1, flat: true },
    { t: 'e', x: 44.5, y: 58, rx: 2.4, ry: 1.8, c: 'hoof', g: 'hoofBL', z: 1.2 },
    { t: 'e', x: 26, y: 58, rx: 2.4, ry: 1.8, c: 'hoof', g: 'hoofFL', z: 1.2 },
    { t: 'p', pts: [26, 10, 24, 3, 31, 8, 34, 2, 36, 11, 43, 8, 41, 17, 49, 18, 42, 24, 47, 30, 38, 32, 32, 28], c: 'f2', g: 'maneO', z: 1.5, flat: true },
    { t: 'p', pts: [28, 13, 28, 8, 32, 11, 35, 7, 36, 14, 40, 13, 38, 20, 43, 21, 38, 25, 40, 28, 35, 28], c: 'f1', g: 'maneI', z: 1.6, flat: true },
    { t: 'c', x1: 33, y1: 34, x2: 24, y2: 18, r1: 5, r2: 3.8, c: 'coat', g: 'neck', z: 2 },
    { t: 'e', x: 21, y: 15.5, rx: 6.2, ry: 5, c: 'coat', g: 'head', z: 3 },
    { t: 'e', x: 13.5, y: 19.5, rx: 4.4, ry: 3.2, rot: 28, c: 'coat', g: 'head', z: 3 },
    { t: 'p', pts: [24, 12, 26, 4, 28, 12], c: 'coat', g: 'ear', z: 2.5 },
    { t: 'p', pts: [17, 12, 10, 2, 20, 10], c: 'horn', g: 'horn', z: 3.6, gloss: true },
    { t: 'p', pts: [21, 11, 20, 5, 25, 8, 24, 12], c: 'f3', g: 'fore', z: 3.5, flat: true },
    { t: 'eye', x: 18.5, y: 15, s: 2.4, style: 'angry', iris: '#a83028', look: [-1, 0] },
    { t: 'mouth', x: 12, y: 21.5, w: 1.5, style: 'line' },
  ] });

  G.defMon('SLOWPOKE', { pal: { skin: '#f0a0b4', muz: '#f8e4c8', tip: '#faf4f4' }, parts: [
    { t: 'l', pts: [46, 50, 53, 48, 57, 41, 55, 33, 50, 31], w: 4.2, w2: 3.4, c: 'skin', g: 'tail', z: -2 },
    { t: 'spot', x: 50, y: 31, rx: 3.6, ry: 3, c: 'tip', on: 'tail' },
    { t: 'c', x1: 44, y1: 52, x2: 46, y2: 57, r1: 3.4, r2: 3, c: 'skin', g: 'legB', z: -1 },
    { t: 'e', x: 38, y: 49, rx: 12, ry: 7.5, c: 'skin', g: 'body' },
    { t: 'c', x1: 34, y1: 52, x2: 34, y2: 57, r1: 3.4, r2: 3, c: 'skin', g: 'legF2', z: 0.5 },
    { t: 'c', x1: 26, y1: 51, x2: 23, y2: 57, r1: 3.4, r2: 3, c: 'skin', g: 'legF', z: 2 },
    { t: 'e', x: 17, y: 31.5, rx: 3.2, ry: 2.4, rot: -20, c: 'skin', g: 'earF', z: 0.5 },
    { t: 'e', x: 29, y: 31, rx: 3, ry: 2.3, rot: 20, c: 'skin', g: 'earB', z: 0.5 },
    { t: 'e', x: 22, y: 40, rx: 11, ry: 9.5, c: 'skin', g: 'head', z: 1 },
    { t: 'e', x: 16, y: 45, rx: 7.5, ry: 4.6, c: 'skin', g: 'head', z: 1 },
    { t: 'spot', x: 16, y: 46, rx: 7.2, ry: 4.4, c: 'muz', on: 'head', face: true },
    { t: 'eye', x: 16, y: 38, s: 2.8, look: [0, 0] },
    { t: 'eye', x: 25.5, y: 37.5, s: 2.8, look: [0, 0] },
    { t: 'mouth', x: 14, y: 46, w: 3, style: 'open' },
  ] });

  G.defMon('SLOWBRO', { pal: { skin: '#f0a0b4', muz: '#f8e4c8', shell: '#a8a8bc', sp: '#7a7a92', spike: '#d8d8e4' }, parts: [
    { t: 'c', x1: 40, y1: 48, x2: 46, y2: 48, r1: 3.6, r2: 3.4, c: 'skin', g: 'tail', z: -3 },
    { t: 'p', pts: [44, 36, 47, 27, 50, 36], c: 'spike', g: 'spk1', z: -2.2 },
    { t: 'p', pts: [52, 39, 60, 33, 57, 42], c: 'spike', g: 'spk2', z: -2.2 },
    { t: 'p', pts: [55, 49, 63, 50, 56, 55], c: 'spike', g: 'spk3', z: -2.2 },
    { t: 'e', x: 50, y: 46, rx: 9, ry: 10, rot: 15, c: 'shell', g: 'shellder', z: -2 },
    { t: 'stripe', pts: spiral(50, 46, 8.5, 1.6, 1, 0.6), w: 1.2, c: 'sp', on: 'shellder' },
    { t: 'c', x1: 38, y1: 52, x2: 40, y2: 57, r1: 3.8, r2: 3.4, c: 'skin', g: 'legB', z: -1 },
    { t: 'e', x: 41, y: 58, rx: 4, ry: 2, c: 'skin', g: 'legB', z: -1 },
    { t: 'c', x1: 40, y1: 36, x2: 45, y2: 42, r1: 2.8, r2: 2.4, c: 'skin', g: 'armB', z: -1 },
    { t: 'e', x: 33, y: 43, rx: 11, ry: 12.5, c: 'skin', g: 'body' },
    { t: 'spot', x: 29, y: 46, rx: 7, ry: 9, c: 'muz', on: 'body', face: true },
    { t: 'c', x1: 28, y1: 52, x2: 26, y2: 57, r1: 4, r2: 3.6, c: 'skin', g: 'legF', z: 1 },
    { t: 'e', x: 24.5, y: 58, rx: 4.6, ry: 2.2, c: 'skin', g: 'legF', z: 1 },
    { t: 'c', x1: 25, y1: 37, x2: 19, y2: 44, r1: 2.9, r2: 2.5, c: 'skin', g: 'armF', z: 2 },
    { t: 'e', x: 22, y: 14.5, rx: 3.2, ry: 2.4, rot: -20, c: 'skin', g: 'earF', z: 2.5 },
    { t: 'e', x: 34, y: 14, rx: 3, ry: 2.3, rot: 20, c: 'skin', g: 'earB', z: 2.5 },
    { t: 'e', x: 27, y: 23, rx: 11, ry: 9.5, c: 'skin', g: 'head', z: 3 },
    { t: 'e', x: 21, y: 28, rx: 7.5, ry: 4.6, c: 'skin', g: 'head', z: 3 },
    { t: 'spot', x: 21, y: 29, rx: 7.2, ry: 4.4, c: 'muz', on: 'head', face: true },
    { t: 'eye', x: 21, y: 21, s: 2.8, look: [0, 0] },
    { t: 'eye', x: 30.5, y: 20.5, s: 2.8, look: [0, 0] },
    { t: 'mouth', x: 19, y: 29, w: 3, style: 'open' },
  ] });

  G.defMon('MAGNEMITE', { pal: { steel: '#b4bcc8', screw: '#a0a8b4', red: '#e04040', blu: '#4070d8' }, parts: [
    ...magnemite(32, 36, 1.05, '', 0),
  ] });

  G.defMon('MAGNETON', { pal: { steel: '#b4bcc8', screw: '#a0a8b4', red: '#e04040', blu: '#4070d8' }, parts: [
    ...magnemite(32, 25, 0.86, 'a', 0, { noBottom: true }),
    ...magnemite(21.5, 41, 0.86, 'b', 2, { noTop: true, noR: true }),
    ...magnemite(42.5, 41, 0.86, 'c', 1, { noTop: true, noL: true }),
  ] });

  G.defMon('FARFETCHD', { pal: { body: '#a88058', wing: '#7e5a38', cream: '#ecdcb8', beak: '#f0c040', leekW: '#eef0d8', leekG: '#58a840', brow: '#2c2420' }, parts: [
    { t: 'c', x1: 43, y1: 46, x2: 50, y2: 26, r1: 1.8, r2: 1.8, c: 'leekW', g: 'leekW', z: -3 },
    { t: 'c', x1: 50, y1: 26, x2: 55, y2: 12, r1: 1.9, r2: 1.8, c: 'leekG', g: 'leekG', z: -3 },
    { t: 'p', pts: [54, 14, 51, 2, 56, 9, 60, 3, 58, 14], c: 'leekG', g: 'leekG', z: -3 },
    { t: 'p', pts: [44, 44, 56, 42, 60, 47, 50, 50], c: 'wing', g: 'tail', z: -2 },
    { t: 'c', x1: 34, y1: 50, x2: 36, y2: 57, r1: 1.4, r2: 1.2, c: 'beak', g: 'legB', z: -1 },
    { t: 'e', x: 35, y: 58, rx: 3.4, ry: 1.3, c: 'beak', g: 'legB', z: -1 },
    { t: 'e', x: 35, y: 41, rx: 12, ry: 10, c: 'body', g: 'body' },
    { t: 'spot', x: 29, y: 44, rx: 7, ry: 7, c: 'cream', on: 'body', face: true },
    { t: 'c', x1: 28, y1: 50, x2: 27, y2: 57, r1: 1.5, r2: 1.3, c: 'beak', g: 'legF', z: 1 },
    { t: 'e', x: 25.5, y: 58, rx: 3.6, ry: 1.4, c: 'beak', g: 'legF', z: 1 },
    { t: 'e', x: 41, y: 40, rx: 9, ry: 7, rot: -25, c: 'wing', g: 'wing', z: 2 },
    { t: 'stripe', pts: [36, 44, 44, 38, 49, 33], w: 1, c: '#5c4028', on: 'wing' },
    { t: 'stripe', pts: [38, 47, 46, 42, 50, 38], w: 1, c: '#5c4028', on: 'wing' },
    { t: 'e', x: 24, y: 25, rx: 8.5, ry: 8, c: 'body', g: 'head', z: 3 },
    { t: 'spot', x: 21, y: 28, rx: 5.5, ry: 4.4, c: 'cream', on: 'head', face: true },
    { t: 'e', x: 12.5, y: 29, rx: 6, ry: 2.6, rot: 6, c: 'beak', g: 'beak', z: 4 },
    { t: 'stripe', pts: [17, 22, 22, 24, 28, 22], w: 1.4, c: 'brow', on: 'head', face: true },
    { t: 'eye', x: 21.5, y: 25.5, s: 2.2, iris: '#1b1a2e', look: [-1, 0] },
  ] });

  G.defMon('DODUO', { pal: { body: '#b88450', beak: '#ecd4a4', leg: '#d8b480', dk: '#7a5230' }, parts: [
    { t: 'c', x1: 40, y1: 44, x2: 44, y2: 51, r1: 1.6, r2: 1.2, c: 'leg', g: 'legB', z: -2 },
    { t: 'c', x1: 44, y1: 51, x2: 42, y2: 57, r1: 1.2, r2: 1, c: 'leg', g: 'legB', z: -2 },
    { t: 'l', pts: [42, 57.5, 45, 58.5], w: 1.2, c: 'leg', g: 'legB', z: -2 },
    { t: 'l', pts: [42, 57.5, 39, 58.5], w: 1.2, c: 'leg', g: 'legB', z: -2 },
    { t: 'c', x1: 39, y1: 33, x2: 41, y2: 14, r1: 2.4, r2: 2, c: 'body', g: 'neckB', z: -1 },
    { t: 'p', pts: [38, 12, 27, 15.5, 38, 15], c: 'beak', g: 'beakB', z: -0.5 },
    { t: 'e', x: 41, y: 12, rx: 4.6, ry: 4.4, c: 'body', g: 'headB', z: -0.4 },
    { t: 'e', x: 36, y: 40, rx: 10.5, ry: 9, c: 'body', g: 'body' },
    { t: 'stripe', pts: [40, 36, 45, 40], w: 1, c: 'dk', on: 'body' },
    { t: 'stripe', pts: [38, 41, 44, 45], w: 1, c: 'dk', on: 'body' },
    { t: 'c', x1: 32, y1: 46, x2: 29, y2: 52, r1: 1.6, r2: 1.2, c: 'leg', g: 'legF', z: 1 },
    { t: 'c', x1: 29, y1: 52, x2: 30, y2: 57, r1: 1.2, r2: 1, c: 'leg', g: 'legF', z: 1 },
    { t: 'l', pts: [30, 57.5, 26, 58.5], w: 1.2, c: 'leg', g: 'legF', z: 1 },
    { t: 'l', pts: [30, 57.5, 33, 58.5], w: 1.2, c: 'leg', g: 'legF', z: 1 },
    { t: 'c', x1: 31, y1: 35, x2: 22, y2: 20, r1: 2.6, r2: 2.2, c: 'body', g: 'neckF', z: 1.5 },
    { t: 'p', pts: [16, 18, 3, 23, 16, 22], c: 'beak', g: 'beakF', z: 2 },
    { t: 'e', x: 20, y: 18.5, rx: 5.2, ry: 5, c: 'body', g: 'headF', z: 2.1 },
    { t: 'eye', x: 18.5, y: 17.5, s: 1.6, sclera: false },
    { t: 'eye', x: 39.5, y: 11, s: 1.5, sclera: false },
  ] });

  G.defMon('DODRIO', { pal: { body: '#b07c48', neck: '#3c3440', beak: '#ecd4a4', leg: '#d8b480', tail: '#302830', dk: '#7a5230' }, parts: [
    { t: 'p', pts: [46, 34, 58, 24, 56, 30, 62, 30, 56, 36, 60, 40, 50, 42], c: 'tail', g: 'tail', z: -3 },
    { t: 'c', x1: 42, y1: 45, x2: 47, y2: 51, r1: 2.2, r2: 1.6, c: 'leg', g: 'legB', z: -2 },
    { t: 'c', x1: 47, y1: 51, x2: 45, y2: 57, r1: 1.6, r2: 1.3, c: 'leg', g: 'legB', z: -2 },
    { t: 'l', pts: [45, 57.5, 49, 58.5], w: 1.4, c: 'leg', g: 'legB', z: -2 },
    { t: 'l', pts: [45, 57.5, 41, 58.5], w: 1.4, c: 'leg', g: 'legB', z: -2 },
    { t: 'c', x1: 44, y1: 32, x2: 50, y2: 13, r1: 3, r2: 2.2, c: 'neck', g: 'neck3', z: -1.5 },
    { t: 'p', pts: [52, 7, 50, 1.5, 54, 5, 57, 2, 55, 8], c: 'tail', g: 'crest3', z: -1.4 },
    { t: 'p', pts: [48, 10, 38, 12, 48, 13.5], c: 'beak', g: 'beak3', z: -1.3 },
    { t: 'e', x: 51, y: 10.5, rx: 4.4, ry: 4.2, c: 'body', g: 'head3', z: -1.2 },
    { t: 'c', x1: 38, y1: 31, x2: 35, y2: 10, r1: 3, r2: 2.2, c: 'neck', g: 'neck2', z: -0.8 },
    { t: 'p', pts: [36, 5, 33.5, 1.8, 37, 3.5, 40, 2, 39, 6], c: 'tail', g: 'crest2', z: -0.7 },
    { t: 'p', pts: [31, 8.5, 20, 11, 31, 12], c: 'beak', g: 'beak2', z: -0.6 },
    { t: 'e', x: 35, y: 8.5, rx: 4.6, ry: 4.4, c: 'body', g: 'head2', z: -0.5 },
    { t: 'e', x: 38, y: 40, rx: 12.5, ry: 10, c: 'body', g: 'body' },
    { t: 'stripe', pts: [42, 35, 48, 40], w: 1, c: 'dk', on: 'body' },
    { t: 'stripe', pts: [40, 41, 47, 46], w: 1, c: 'dk', on: 'body' },
    { t: 'c', x1: 33, y1: 47, x2: 29, y2: 52, r1: 2.2, r2: 1.6, c: 'leg', g: 'legF', z: 1 },
    { t: 'c', x1: 29, y1: 52, x2: 30, y2: 57, r1: 1.6, r2: 1.3, c: 'leg', g: 'legF', z: 1 },
    { t: 'l', pts: [30, 57.5, 25.5, 58.5], w: 1.4, c: 'leg', g: 'legF', z: 1 },
    { t: 'l', pts: [30, 57.5, 34, 58.5], w: 1.4, c: 'leg', g: 'legF', z: 1 },
    { t: 'c', x1: 31, y1: 36, x2: 20, y2: 22, r1: 3.2, r2: 2.4, c: 'neck', g: 'neck1', z: 1.5 },
    { t: 'p', pts: [21, 15, 18, 10, 22, 13, 25, 10.5, 24, 16], c: 'tail', g: 'crest1', z: 1.6 },
    { t: 'p', pts: [15, 19, 2, 24, 15, 23], c: 'beak', g: 'beak1', z: 2 },
    { t: 'e', x: 19, y: 19.5, rx: 5.2, ry: 5, c: 'body', g: 'head1', z: 2.1 },
    { t: 'eye', x: 17.5, y: 18.5, s: 1.9, style: 'angry', iris: '#1b1a2e', look: [-1, 0] },
    { t: 'eye', x: 33.5, y: 7.5, s: 1.7, style: 'happy' },
    { t: 'eye', x: 49.5, y: 9.5, s: 1.7, style: 'sad', iris: '#1b1a2e', look: [-1, 0] },
  ] });

  G.defMon('SEEL', { pal: { fur: '#eef2f8', horn: '#e8dcc4', tongue: '#e05868', fin: '#dce6f2' }, parts: [
    { t: 'p', pts: [47, 45, 54, 34, 60, 30, 61, 36, 57, 40, 62, 44, 56, 48, 50, 50], c: 'fin', g: 'tail', z: -2 },
    { t: 'c', x1: 38, y1: 49, x2: 50, y2: 45, r1: 7.5, r2: 4, c: 'fur', g: 'body' },
    { t: 'e', x: 32, y: 47, rx: 12, ry: 9.5, c: 'fur', g: 'body' },
    { t: 'p', pts: [38, 52, 46, 56, 41, 58, 34, 56], c: 'fin', g: 'finB', z: -1 },
    { t: 'p', pts: [26, 51, 17, 56, 22, 58, 31, 56], c: 'fin', g: 'finF', z: 1 },
    { t: 'p', pts: [20, 26, 22, 17, 26, 26], c: 'horn', g: 'horn', z: 1.5 },
    { t: 'e', x: 22, y: 33, rx: 10, ry: 9, c: 'fur', g: 'head', z: 2 },
    { t: 'e', x: 14.5, y: 38, rx: 5.5, ry: 4, c: 'fur', g: 'head', z: 2 },
    { t: 'e', x: 13, y: 42.5, rx: 2.2, ry: 2.8, c: 'tongue', g: 'tongue', z: 2.5, face: true },
    { t: 'eye', x: 15.5, y: 33, s: 1.5, sclera: false },
    { t: 'eye', x: 24, y: 32.5, s: 1.5, sclera: false },
    { t: 'mouth', x: 13, y: 40.5, w: 2, style: 'line' },
  ] });

  G.defMon('DEWGONG', { pal: { fur: '#f0f4fa', horn: '#f4f0e4', fin: '#d8e2f0' }, parts: [
    { t: 'p', pts: [54, 35, 52, 24, 57, 29, 61, 21, 61, 31, 58, 37], c: 'fin', g: 'tail', z: -2 },
    { t: 'c', x1: 40, y1: 48, x2: 52, y2: 43, r1: 8.5, r2: 4.6, c: 'fur', g: 'body' },
    { t: 'c', x1: 52, y1: 43, x2: 56, y2: 35, r1: 4.6, r2: 3, c: 'fur', g: 'body' },
    { t: 'e', x: 31, y: 47, rx: 13, ry: 10, c: 'fur', g: 'body' },
    { t: 'p', pts: [40, 52, 49, 57, 42, 58.5, 35, 56], c: 'fin', g: 'finB', z: -1 },
    { t: 'c', x1: 28, y1: 42, x2: 21, y2: 26, r1: 8.6, r2: 6.4, c: 'fur', g: 'body' },
    { t: 'p', pts: [24, 50, 11, 56, 17, 58.5, 30, 55], c: 'fin', g: 'finF', z: 1 },
    { t: 'p', pts: [16, 14, 15, 2, 22, 13], c: 'horn', g: 'horn', z: 1.5 },
    { t: 'e', x: 19, y: 20.5, rx: 8, ry: 7, c: 'fur', g: 'head', z: 2 },
    { t: 'e', x: 11.5, y: 24.5, rx: 5.5, ry: 3.6, c: 'fur', g: 'head', z: 2 },
    { t: 'eye', x: 14, y: 20, s: 1.6, sclera: false },
    { t: 'eye', x: 21.5, y: 19.5, s: 1.6, sclera: false },
    { t: 'mouth', x: 9.5, y: 26, w: 2, style: 'smile' },
  ] });

  G.defMon('GRIMER', { pal: { goo: '#a070b8', mouth: '#3a2040', inner: '#e070a0' }, parts: [
    { t: 'c', x1: 40, y1: 42, x2: 48, y2: 32, r1: 4.2, r2: 3.4, c: 'goo', g: 'armB', z: -1 },
    { t: 'e', x: 49, y: 29.5, rx: 4, ry: 3.6, c: 'goo', g: 'armB', z: -1 },
    { t: 'e', x: 32, y: 54, rx: 17, ry: 5, c: 'goo', g: 'body' },
    { t: 'e', x: 32, y: 42, rx: 11.5, ry: 13, c: 'goo', g: 'body' },
    { t: 'e', x: 44, y: 51, rx: 4, ry: 3, c: 'goo', g: 'body' },
    { t: 'e', x: 18, y: 52, rx: 3.6, ry: 2.8, c: 'goo', g: 'body' },
    { t: 'e', x: 27, y: 44, rx: 6.5, ry: 6, c: 'mouth', g: 'mouth', z: 1, face: true },
    { t: 'e', x: 27, y: 47.5, rx: 4, ry: 2.4, c: 'inner', g: 'tongue', z: 1.5, face: true },
    { t: 'c', x1: 23, y1: 40, x2: 14, y2: 33, r1: 4.4, r2: 3.6, c: 'goo', g: 'armF', z: 2 },
    { t: 'e', x: 13, y: 30.5, rx: 4.2, ry: 3.8, c: 'goo', g: 'armF', z: 2 },
    { t: 'c', x1: 16, y1: 34, x2: 17, y2: 38.5, r1: 1.4, r2: 1.1, c: 'goo', g: 'armF', z: 2 },
    { t: 'eye', x: 24.5, y: 34, s: 2.2, look: [-0.5, 0] },
    { t: 'eye', x: 33, y: 33.5, s: 2.2, look: [-0.5, 0] },
  ] });

  G.defMon('MUK', { pal: { goo: '#9c6cb8', mouth: '#2e1a34', inner: '#e070a0' }, parts: [
    { t: 'c', x1: 43, y1: 36, x2: 53, y2: 22, r1: 5.4, r2: 4.4, c: 'goo', g: 'armB', z: -1 },
    { t: 'e', x: 54, y: 18.5, rx: 5.2, ry: 4.8, c: 'goo', g: 'armB', z: -1 },
    { t: 'c', x1: 57, y1: 21, x2: 58, y2: 27, r1: 1.6, r2: 1.2, c: 'goo', g: 'armB', z: -1 },
    { t: 'e', x: 32, y: 54, rx: 24, ry: 6, c: 'goo', g: 'body' },
    { t: 'e', x: 33, y: 37, rx: 16, ry: 18, c: 'goo', g: 'body' },
    { t: 'e', x: 50, y: 50, rx: 6, ry: 4.5, c: 'goo', g: 'body' },
    { t: 'e', x: 13, y: 52, rx: 5.5, ry: 3.6, c: 'goo', g: 'body' },
    { t: 'e', x: 27, y: 40, rx: 10, ry: 9.5, c: 'mouth', g: 'mouth', z: 1, face: true },
    { t: 'e', x: 27, y: 45.5, rx: 6.5, ry: 3.5, c: 'inner', g: 'tongue', z: 1.5, face: true },
    { t: 'c', x1: 21, y1: 33, x2: 10, y2: 22, r1: 5.4, r2: 4.4, c: 'goo', g: 'armF', z: 2 },
    { t: 'e', x: 9, y: 18.5, rx: 5.4, ry: 5, c: 'goo', g: 'armF', z: 2 },
    { t: 'c', x1: 12, y1: 23, x2: 13, y2: 30, r1: 1.8, r2: 1.3, c: 'goo', g: 'armF', z: 2 },
    { t: 'c', x1: 5, y1: 21, x2: 5, y2: 25, r1: 1.4, r2: 1, c: 'goo', g: 'armF', z: 2 },
    { t: 'eye', x: 23, y: 26, s: 2.6, look: [-0.5, 0] },
    { t: 'eye', x: 33.5, y: 25.5, s: 2.6, look: [-0.5, 0] },
  ] });

  G.defMon('SHELLDER', { pal: { shell: '#7c5cb4', ridge: '#5c3c90', body: '#2a2434', tongue: '#e8708a' }, parts: [
    { t: 'e', x: 34, y: 50, rx: 15, ry: 7, c: 'shell', g: 'shellB' },
    { t: 'e', x: 27, y: 45, rx: 8.5, ry: 6, c: 'body', g: 'body', z: 0.5, gloss: true, face: true },
    { t: 'e', x: 35, y: 38, rx: 15, ry: 10.5, rot: -8, c: 'shell', g: 'shellT', z: 1 },
    { t: 'stripe', pts: [22, 43, 30, 30], w: 1.1, c: 'ridge', on: 'shellT' },
    { t: 'stripe', pts: [29, 46, 36, 29], w: 1.1, c: 'ridge', on: 'shellT' },
    { t: 'stripe', pts: [37, 47, 42, 30], w: 1.1, c: 'ridge', on: 'shellT' },
    { t: 'stripe', pts: [44, 46, 48, 33], w: 1.1, c: 'ridge', on: 'shellT' },
    { t: 'stripe', pts: [25, 54, 28, 50], w: 1.1, c: 'ridge', on: 'shellB' },
    { t: 'stripe', pts: [34, 56, 35, 51], w: 1.1, c: 'ridge', on: 'shellB' },
    { t: 'stripe', pts: [43, 55, 42, 51], w: 1.1, c: 'ridge', on: 'shellB' },
    { t: 'e', x: 20, y: 50, rx: 4.5, ry: 2.2, rot: 15, c: 'tongue', g: 'tongue', z: 2, face: true },
    { t: 'eye', x: 23, y: 45, s: 2, look: [-1, 0] },
    { t: 'eye', x: 29.5, y: 45, s: 2, look: [-1, 0] },
  ] });
})();
