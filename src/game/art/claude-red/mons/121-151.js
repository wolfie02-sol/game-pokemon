// Vendored from https://github.com/levy-street/pokemon-claude-red (no licence; see the README attribution).
const G = globalThis.G;
// Pokémon sprite definitions (batch 121-151). See src/art/pokesprite.js for the primitive format.
(function () {
  'use strict';
  // n-pointed star polygon: outer radius R, inner radius r, rotation in degrees, optional x/y squash
  const star = (cx, cy, R, r, n, rot, sx, sy) => {
    sx = sx || 1; sy = sy || 1; const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = ((rot || 0) - 90 + i * 180 / n) * Math.PI / 180, rr = i % 2 ? r : R;
      pts.push(+(cx + Math.cos(a) * rr * sx).toFixed(2), +(cy + Math.sin(a) * rr * sy).toFixed(2));
    }
    return pts;
  };
  // translate every part of a definition (for hovering / re-centring)
  const shift = (parts, dx, dy) => parts.map(p => {
    const q = Object.assign({}, p);
    if (q.x !== undefined) { q.x += dx; q.y += dy; }
    if (q.x1 !== undefined) { q.x1 += dx; q.y1 += dy; q.x2 += dx; q.y2 += dy; }
    if (q.pts) q.pts = q.pts.map((v, i) => v + (i % 2 ? dy : dx));
    return q;
  });

  G.defMon('STARMIE', { pal: { star: '#9a7cc4', starB: '#7e62aa', gold: '#f0c038', gem: '#e8304a' }, parts: [
    { t: 'p', pts: star(33, 33, 23.5, 12, 5, 26, 0.94, 1), c: 'starB', g: 'back', z: -1, bz: 1 },
    { t: 'p', pts: star(31, 33, 25, 12.5, 5, -10, 0.94, 1), c: 'star', g: 'front' },
    { t: 'p', pts: star(30, 33, 9.8, 8, 10, 0), c: 'gold', g: 'ring', z: 1, gloss: true, face: true },
    { t: 'e', x: 29.5, y: 33, rx: 5.6, ry: 6, c: 'gem', g: 'gem', z: 2, gloss: true, face: true },
    { t: 'e', x: 33, y: 33, rx: 6, ry: 6.5, c: 'starB', g: 'hub', z: 2, backOnly: true },
    { t: 'shine', x: 27, y: 30 },
  ] });

  G.defMon('MR_MIME', { pal: { skin: '#fcd8cc', white: '#f8f2f4', pad: '#e8687e', hair: '#4a7ccc', shoe: '#4a7ccc', cheek: '#e84858' }, parts: [
    // back arm and hand (reaching forward, behind the body)
    { t: 'c', x1: 41, y1: 31, x2: 30, y2: 26, r1: 2.2, r2: 2, c: 'white', g: 'armB', z: -2 },
    { t: 'e', x: 41, y: 31, rx: 3.6, ry: 3.4, c: 'pad', g: 'shB', z: -1 },
    // legs
    { t: 'c', x1: 38, y1: 45, x2: 41, y2: 55, r1: 2.4, r2: 2.1, c: 'white', g: 'legB', z: -1 },
    { t: 'e', x: 40, y: 50, rx: 3.2, ry: 3, c: 'pad', g: 'kneeB', z: -0.5 },
    { t: 'e', x: 44, y: 56.5, rx: 4.6, ry: 2.6, c: 'shoe', g: 'footB', z: -0.4 },
    { t: 'l', pts: [48, 57, 50, 55, 49, 53], w: 2, w2: 1.4, c: 'shoe', g: 'footB', z: -0.4 },
    { t: 'c', x1: 30, y1: 45, x2: 27, y2: 55, r1: 2.5, r2: 2.2, c: 'white', g: 'legF', z: 0.5 },
    { t: 'e', x: 28.5, y: 50, rx: 3.4, ry: 3.2, c: 'pad', g: 'kneeF', z: 1 },
    { t: 'e', x: 24, y: 57.5, rx: 5, ry: 2.7, c: 'shoe', g: 'footF', z: 1 },
    { t: 'l', pts: [19.5, 58, 17, 56, 18, 53.5], w: 2.2, w2: 1.4, c: 'shoe', g: 'footF', z: 1 },
    // torso
    { t: 'e', x: 34, y: 38, rx: 8.5, ry: 9, c: 'white', g: 'body' },
    { t: 'spot', x: 32, y: 39, rx: 3.6, ry: 3.8, c: 'pad', on: 'body', face: true },
    { t: 'e', x: 27, y: 31, rx: 3.8, ry: 3.6, c: 'pad', g: 'shF', z: 2 },
    // front arm and big hand raised (mime wall)
    { t: 'c', x1: 26, y1: 32, x2: 18, y2: 33, r1: 2.2, r2: 2, c: 'white', g: 'armF', z: 3 },
    { t: 'e', x: 15, y: 31, rx: 3.4, ry: 4, c: 'white', g: 'handF', z: 4 },
    { t: 'c', x1: 13, y1: 29, x2: 11.5, y2: 23.5, r1: 1.3, r2: 1.2, c: 'white', g: 'handF', z: 4 },
    { t: 'c', x1: 15, y1: 28, x2: 14.5, y2: 22.5, r1: 1.3, r2: 1.2, c: 'white', g: 'handF', z: 4 },
    { t: 'c', x1: 17, y1: 29, x2: 17.5, y2: 23.5, r1: 1.3, r2: 1.2, c: 'white', g: 'handF', z: 4 },
    { t: 'c', x1: 18, y1: 31, x2: 20.5, y2: 27, r1: 1.2, r2: 1.1, c: 'white', g: 'handF', z: 4 },
    // back hand (higher, left of the face)
    { t: 'e', x: 23, y: 19, rx: 3, ry: 3.6, c: 'white', g: 'handB', z: -1.5 },
    { t: 'c', x1: 21.5, y1: 17, x2: 20.5, y2: 12, r1: 1.2, r2: 1.1, c: 'white', g: 'handB', z: -1.5 },
    { t: 'c', x1: 23.5, y1: 16, x2: 23.5, y2: 11, r1: 1.2, r2: 1.1, c: 'white', g: 'handB', z: -1.5 },
    { t: 'c', x1: 25.5, y1: 17, x2: 26.5, y2: 12.5, r1: 1.2, r2: 1.1, c: 'white', g: 'handB', z: -1.5 },
    { t: 'c', x1: 29, y1: 26, x2: 24, y2: 21, r1: 2, r2: 1.8, c: 'white', g: 'armB', z: -2 },
    // head
    { t: 'e', x: 26, y: 13, rx: 4.2, ry: 4, c: 'hair', g: 'hairF', z: 4 },
    { t: 'p', pts: [23, 12, 22, 5, 28, 10], c: 'hair', g: 'hairF', z: 4 },
    { t: 'e', x: 41, y: 13, rx: 4.2, ry: 4, c: 'hair', g: 'hairB', z: 3 },
    { t: 'p', pts: [39, 10, 45, 5, 44, 12], c: 'hair', g: 'hairB', z: 3 },
    { t: 'e', x: 34, y: 20, rx: 8.5, ry: 8, c: 'skin', g: 'head', z: 3.5 },
    { t: 'spot', x: 27.5, y: 23, rx: 2.4, ry: 2.2, c: 'cheek', on: 'head', face: true },
    { t: 'spot', x: 39.5, y: 23, rx: 2.2, ry: 2.2, c: 'cheek', on: 'head', face: true },
    { t: 'eye', x: 30, y: 19, s: 2.4, look: [-1, 0] },
    { t: 'eye', x: 36, y: 19, s: 2.4, look: [-1, 0] },
    { t: 'mouth', x: 32, y: 24, w: 2, style: 'smile' },
  ] });

  G.defMon('SCYTHER', { pal: { body: '#86c05a', belly: '#f0ecc0', blade: '#f0f0e2', wing: '#e8f2f4', vein: '#b8ccd4' }, parts: [
    // wings
    { t: 'p', pts: [38, 28, 48, 10, 57, 5, 61, 10, 55, 26, 42, 34], c: 'wing', g: 'wing1', z: -4, flat: true },
    { t: 'stripe', pts: [40, 30, 57, 9], w: 0.8, c: 'vein', on: 'wing1' },
    { t: 'p', pts: [40, 33, 54, 25, 62, 27, 61, 33, 50, 39, 42, 39], c: 'wing', g: 'wing2', z: -3, flat: true },
    { t: 'stripe', pts: [42, 36, 61, 30], w: 0.8, c: 'vein', on: 'wing2' },
    // back scythe
    { t: 'c', x1: 38, y1: 31, x2: 30, y2: 42, r1: 2.6, r2: 2.2, c: 'body', g: 'armB', z: -2 },
    { t: 'p', pts: [31, 43, 25, 37, 18, 33, 12, 34, 9, 38, 8, 47, 12, 41, 16, 39, 21, 40, 27, 47], c: 'blade', g: 'bladeB', z: -0.5, gloss: true },
    // abdomen and legs
    { t: 'e', x: 45, y: 45, rx: 10, ry: 6, rot: 28, c: 'body', g: 'abd', z: -1 },
    { t: 'stripe', pts: [42, 38, 38, 44], w: 1, c: '#5e9a3e', on: 'abd' },
    { t: 'stripe', pts: [47, 41, 43, 48], w: 1, c: '#5e9a3e', on: 'abd' },
    { t: 'stripe', pts: [51, 44, 48, 51], w: 1, c: '#5e9a3e', on: 'abd' },
    { t: 'c', x1: 41, y1: 45, x2: 46, y2: 51, r1: 3, r2: 2.4, c: 'body', g: 'legB', z: -1.5 },
    { t: 'c', x1: 46, y1: 51, x2: 45, y2: 57, r1: 2.4, r2: 2, c: 'body', g: 'legB', z: -1.5 },
    { t: 'p', pts: [41, 58.5, 45, 55, 49, 58.5], c: 'body', g: 'legB', z: -1.5 },
    { t: 'c', x1: 34, y1: 44, x2: 28, y2: 50, r1: 3.6, r2: 2.6, c: 'body', g: 'legF', z: 1 },
    { t: 'c', x1: 28, y1: 50, x2: 30, y2: 57, r1: 2.6, r2: 2.1, c: 'body', g: 'legF', z: 1 },
    { t: 'p', pts: [25, 59, 30, 55, 35, 59], c: 'body', g: 'legF', z: 1 },
    // torso with segmented cream belly
    { t: 'e', x: 34, y: 36, rx: 8, ry: 11, rot: -12, c: 'body', g: 'torso' },
    { t: 'spot', x: 30, y: 38, rx: 4.5, ry: 8.5, rot: -12, c: 'belly', on: 'torso', face: true },
    { t: 'stripe', pts: [26, 34, 33, 33], w: 0.8, c: '#c8c490', on: 'torso', face: true },
    { t: 'stripe', pts: [26, 38, 34, 37.5], w: 0.8, c: '#c8c490', on: 'torso', face: true },
    { t: 'stripe', pts: [27, 42, 34, 42], w: 0.8, c: '#c8c490', on: 'torso', face: true },
    // head with backswept crest
    { t: 'c', x1: 31, y1: 28, x2: 27, y2: 23, r1: 3.4, r2: 3, c: 'body', g: 'neck', z: 0.5 },
    { t: 'p', pts: [22, 14, 31, 7, 40, 3, 34, 11, 29, 17], c: 'body', g: 'head', z: 2 },
    { t: 'e', x: 24, y: 19, rx: 7, ry: 6.2, c: 'body', g: 'head', z: 2 },
    { t: 'p', pts: [18, 20, 20, 25, 25, 24], c: 'body', g: 'head', z: 2 },
    { t: 'eye', x: 20.5, y: 18, s: 2.4, style: 'angry', iris: '#243018', look: [-1, 0], flip: true },
    { t: 'eye', x: 26, y: 18, s: 2.2, style: 'angry', iris: '#243018', look: [-1, 0] },
    { t: 'mouth', x: 20, y: 23, w: 1.5, style: 'line' },
    // front scythe (held forward)
    { t: 'c', x1: 28, y1: 31, x2: 22, y2: 35, r1: 3, r2: 2.6, c: 'body', g: 'armF', z: 3 },
    { t: 'p', pts: [25, 35, 19, 27, 12, 22, 6, 22, 2, 27, 2, 37, 6, 31, 10, 29, 15, 31, 21, 39], c: 'blade', g: 'bladeF', z: 3.5, gloss: true },
  ] });

  G.defMon('JYNX', { pal: { skin: '#7c5cb4', hair: '#f8d858', hairD: '#d0a030', dress: '#d83838', dressD: '#a82830', lips: '#f478a8' }, parts: [
    // long hair flowing down the back to the floor
    { t: 'p', pts: [21, 11, 29, 4, 37, 4, 45, 10, 47, 22, 48, 36, 51, 49, 53, 58, 42, 58, 22, 58, 11, 58, 13, 49, 15, 36, 16, 22], c: 'hair', g: 'hairBk', z: -3 },
    { t: 'stripe', pts: [45, 16, 47, 34, 50, 50, 51, 57], w: 1, c: 'hairD', on: 'hairBk' },
    { t: 'stripe', pts: [18, 20, 16, 36, 14, 50, 13, 57], w: 1, c: 'hairD', on: 'hairBk' },
    { t: 'stripe', pts: [32, 5, 32, 57], w: 1, c: 'hairD', on: 'hairBk', backOnly: true },
    // back arm (raised, dancing)
    { t: 'c', x1: 38, y1: 34, x2: 45, y2: 29, r1: 2.6, r2: 2.3, c: 'skin', g: 'armB', z: -1 },
    { t: 'e', x: 47.5, y: 27.5, rx: 3, ry: 2.8, c: 'skin', g: 'armB', z: -1 },
    // red dress (bell)
    { t: 'c', x1: 32, y1: 33, x2: 32, y2: 47, r1: 7, r2: 11.5, c: 'dress', g: 'dress' },
    { t: 'p', pts: [22, 46, 42, 46, 45, 57, 19, 57], c: 'dress', g: 'dress' },
    { t: 'e', x: 32, y: 57, rx: 13, ry: 2.4, c: 'dress', g: 'dress' },
    { t: 'stripe', pts: [26, 45, 23, 58], w: 1, c: 'dressD', on: 'dress' },
    { t: 'stripe', pts: [32, 46, 32, 59], w: 1, c: 'dressD', on: 'dress' },
    { t: 'stripe', pts: [38, 45, 41, 58], w: 1, c: 'dressD', on: 'dress' },
    // head
    { t: 'e', x: 30, y: 20, rx: 10.2, ry: 9.8, c: 'skin', g: 'head', z: 1 },
    // hair crown with centre parting framing the face
    { t: 'p', pts: [19.5, 27, 19, 16, 22.5, 8, 30, 4, 37.5, 5, 42.5, 10, 44, 20, 43, 30, 39.5, 20, 35, 13.5, 29, 11, 23.5, 16, 22, 27], c: 'hair', g: 'bangs', z: 2 },
    { t: 'stripe', pts: [29, 5, 29, 11], w: 0.9, c: 'hairD', on: 'bangs' },
    { t: 'stripe', pts: [36, 7, 41, 16, 41.5, 26], w: 0.8, c: 'hairD', on: 'bangs' },
    { t: 'p', pts: [19, 18, 23, 8, 30, 4.5, 38, 6, 43, 12, 45, 26, 43, 38, 32, 40, 20, 38, 18, 28], c: 'hair', g: 'bangs', z: 2, backOnly: true },
    { t: 'stripe', pts: [31, 5, 31, 40], w: 0.9, c: 'hairD', on: 'bangs', backOnly: true },
    // face
    { t: 'e', x: 27, y: 25.5, rx: 4.4, ry: 2.8, c: 'lips', g: 'lips', z: 3, gloss: true, face: true },
    { t: 'stripe', pts: [23, 25.6, 31, 25.6], w: 0.7, c: '#b83870', on: 'lips' },
    { t: 'eye', x: 25, y: 19.5, s: 3, style: 'sleepy', iris: '#3a9858', look: [-1, 0] },
    { t: 'eye', x: 32.5, y: 19.5, s: 3, style: 'sleepy', iris: '#3a9858', look: [-1, 0] },
    // front arm (raised)
    { t: 'c', x1: 27, y1: 34, x2: 19, y2: 30, r1: 2.7, r2: 2.4, c: 'skin', g: 'armF', z: 3 },
    { t: 'e', x: 16.5, y: 28.5, rx: 3.2, ry: 3, c: 'skin', g: 'armF', z: 3 },
    { t: 'c', x1: 15, y1: 27, x2: 12.5, y2: 24.5, r1: 1.1, r2: 0.9, c: 'skin', g: 'armF', z: 3 },
    { t: 'c', x1: 17, y1: 26.5, x2: 16, y2: 23, r1: 1.1, r2: 0.9, c: 'skin', g: 'armF', z: 3 },
  ] });

  G.defMon('ELECTABUZZ', { pal: { fur: '#f8d438', dark: '#2c2830' }, parts: [
    // striped tail
    { t: 'l', pts: [42, 50, 51, 52, 57, 47, 60, 39], w: 5.5, w2: 2.5, c: 'fur', g: 'tail', z: -3 },
    { t: 'stripe', pts: [49, 48, 49, 56], w: 1.5, c: 'dark', on: 'tail' },
    { t: 'stripe', pts: [54, 46, 58, 51], w: 1.5, c: 'dark', on: 'tail' },
    { t: 'stripe', pts: [56, 41, 62, 43], w: 1.5, c: 'dark', on: 'tail' },
    // back arm (guard, fist up)
    { t: 'c', x1: 44, y1: 31, x2: 50, y2: 37, r1: 3.8, r2: 3.2, c: 'fur', g: 'armB', z: -2 },
    { t: 'c', x1: 50, y1: 37, x2: 50, y2: 29, r1: 3.2, r2: 3, c: 'fur', g: 'armB', z: -2 },
    { t: 'e', x: 50, y: 27, rx: 3.6, ry: 3.4, c: 'fur', g: 'armB', z: -2 },
    { t: 'stripe', pts: [47, 35, 53, 34], w: 1.3, c: 'dark', on: 'armB' },
    { t: 'stripe', pts: [46, 30, 53, 30], w: 1.3, c: 'dark', on: 'armB' },
    // legs
    { t: 'c', x1: 41, y1: 47, x2: 43, y2: 56, r1: 5, r2: 4.2, c: 'fur', g: 'legB', z: -1 },
    { t: 'e', x: 44, y: 57.5, rx: 5, ry: 2.4, c: 'fur', g: 'legB', z: -1 },
    { t: 'stripe', pts: [38, 50, 47, 50], w: 1.4, c: 'dark', on: 'legB' },
    { t: 'c', x1: 29, y1: 47, x2: 27, y2: 56, r1: 5.4, r2: 4.5, c: 'fur', g: 'legF', z: 1 },
    { t: 'e', x: 25.5, y: 57.5, rx: 5.5, ry: 2.5, c: 'fur', g: 'legF', z: 1 },
    { t: 'stripe', pts: [23, 50, 34, 51], w: 1.4, c: 'dark', on: 'legF' },
    // burly body
    { t: 'e', x: 35, y: 36, rx: 12.5, ry: 11, c: 'fur', g: 'body' },
    { t: 'e', x: 35, y: 44, rx: 10.5, ry: 7.5, c: 'fur', g: 'body' },
    // chest zigzag + belly bolt
    { t: 'stripe', pts: [23, 32, 27, 35, 31, 31, 35, 35, 39, 31, 43, 35, 47, 32], w: 1.7, c: 'dark', on: 'body', face: true },
    { t: 'stripe', pts: [32, 38, 29, 43, 34, 43, 31, 49], w: 1.6, c: 'dark', on: 'body', face: true },
    { t: 'stripe', pts: [24, 30, 29, 34, 33, 30, 37, 34, 41, 30, 45, 34, 49, 30], w: 1.8, c: 'dark', on: 'body', backOnly: true },
    { t: 'stripe', pts: [26, 41, 31, 44, 35, 40, 39, 44, 44, 41], w: 1.8, c: 'dark', on: 'body', backOnly: true },
    // head with antennae
    { t: 'l', pts: [21, 15, 17, 9, 12, 6], w: 2, w2: 1.2, c: 'fur', g: 'ant1', z: 1 },
    { t: 'l', pts: [28, 14, 30, 8, 28, 3], w: 2, w2: 1.2, c: 'fur', g: 'ant2', z: 1 },
    { t: 'e', x: 25, y: 21.5, rx: 10, ry: 8.5, c: 'fur', g: 'head', z: 2 },
    { t: 'e', x: 19, y: 26, rx: 5.5, ry: 3.8, c: 'fur', g: 'head', z: 2 },
    { t: 'stripe', pts: [27, 14, 30, 17.5], w: 1.6, c: 'dark', on: 'head', backOnly: true },
    { t: 'stripe', pts: [31, 16.5, 34, 19.5], w: 1.4, c: 'dark', on: 'head' },
    { t: 'eye', x: 19, y: 21, s: 2.7, style: 'round', look: [-1, 0] },
    { t: 'eye', x: 26.5, y: 21, s: 2.7, style: 'round', look: [-1, 0] },
    { t: 'stripe', pts: [15.5, 16.5, 21.5, 18.5], w: 1.4, c: 'dark', on: 'head', face: true },
    { t: 'stripe', pts: [24, 18.5, 30.5, 16.5], w: 1.4, c: 'dark', on: 'head', face: true },
    { t: 'stripe', pts: [15, 26, 19, 26.5, 23, 25.8], w: 0.9, c: 'dark', on: 'head', face: true },
    { t: 'p', pts: [16.2, 26, 17.2, 28.3, 18.2, 26.2], c: '#ffffff', g: 'fangL', z: 2.5, flat: true, line: false, face: true },
    { t: 'p', pts: [20, 26.3, 21, 28.5, 22, 26], c: '#ffffff', g: 'fangR', z: 2.5, flat: true, line: false, face: true },
    // front arm with raised fist
    { t: 'c', x1: 26, y1: 33, x2: 18, y2: 40, r1: 4, r2: 3.3, c: 'fur', g: 'armF', z: 3 },
    { t: 'c', x1: 18, y1: 40, x2: 13, y2: 36, r1: 3.3, r2: 3, c: 'fur', g: 'armF', z: 3 },
    { t: 'e', x: 11.5, y: 34, rx: 3.8, ry: 3.6, c: 'fur', g: 'armF', z: 3 },
    { t: 'stripe', pts: [15, 35, 14, 41], w: 1.4, c: 'dark', on: 'armF' },
    { t: 'stripe', pts: [20, 33, 25, 38], w: 1.4, c: 'dark', on: 'armF' },
  ] });

  G.defMon('MAGMAR', { pal: { body: '#f8b830', fire: '#e8481c', fire2: '#f87830', belly: '#f8e070', lip: '#f8d850', pink: '#f08888' }, parts: [
    // tail with flame tip
    { t: 'l', pts: [44, 50, 52, 52, 57, 48], w: 5.5, w2: 3.5, c: 'body', g: 'tail', z: -3 },
    { t: 'p', pts: [54, 48, 56, 38, 59, 42, 61, 34, 63, 44, 60, 51], c: 'fire', g: 'tailF', z: -2.5, flat: true },
    { t: 'e', x: 58.5, y: 45, rx: 2, ry: 3.5, c: 'lip', g: 'tailF2', z: -2.4, flat: true },
    // back arm
    { t: 'c', x1: 42, y1: 32, x2: 49, y2: 38, r1: 3, r2: 2.4, c: 'fire', g: 'armB', z: -2 },
    { t: 'p', pts: [41, 30, 47, 27, 45, 33], c: 'fire', g: 'armB', z: -2 },
    { t: 'e', x: 50, y: 39, rx: 2.6, ry: 2.4, c: 'body', g: 'handB', z: -2 },
    // legs
    { t: 'e', x: 41, y: 50, rx: 5.5, ry: 6, c: 'body', g: 'legB', z: -1 },
    { t: 'c', x1: 42, y1: 53, x2: 43, y2: 57, r1: 3, r2: 3, c: 'body', g: 'legB', z: -1 },
    { t: 'spot', x: 43, y: 48, rx: 2, ry: 1.6, c: 'pink', on: 'legB' },
    { t: 'e', x: 28, y: 50, rx: 6, ry: 6.5, c: 'body', g: 'legF', z: 1 },
    { t: 'c', x1: 27, y1: 53, x2: 25, y2: 57.5, r1: 3.4, r2: 3.2, c: 'body', g: 'legF', z: 1 },
    { t: 'spot', x: 26, y: 48, rx: 2.2, ry: 1.8, c: 'pink', on: 'legF' },
    // body
    { t: 'e', x: 35, y: 40, rx: 10, ry: 11.5, c: 'body', g: 'body' },
    { t: 'spot', x: 31, y: 42, rx: 5.5, ry: 8, c: 'belly', on: 'body', face: true },
    { t: 'stripe', pts: [27, 37, 31, 39, 35, 37], w: 1.3, c: 'fire', on: 'body', face: true },
    { t: 'stripe', pts: [27, 43, 31, 45, 35, 43], w: 1.3, c: 'fire', on: 'body', face: true },
    { t: 'stripe', pts: [28, 33, 34, 36, 40, 33, 44, 37], w: 2, c: 'fire', on: 'body', backOnly: true },
    { t: 'stripe', pts: [27, 41, 34, 44, 40, 41, 44, 45], w: 2, c: 'fire', on: 'body', backOnly: true },
    // head: flame crest, yellow face, duck lips
    { t: 'p', pts: [22, 16, 20, 6, 26, 11, 30, 2, 33, 10, 39, 5, 38, 14, 44, 13, 38, 22, 28, 20], c: 'fire', g: 'crest', z: 1.5 },
    { t: 'e', x: 28, y: 21, rx: 8, ry: 7.5, c: 'body', g: 'head', z: 2 },
    { t: 'spot', x: 31, y: 15, rx: 6, ry: 3.5, c: 'fire', on: 'head' },
    { t: 'e', x: 20, y: 25, rx: 5.5, ry: 3, rot: -8, c: 'lip', g: 'lips', z: 3, face: true },
    { t: 'stripe', pts: [15, 25.5, 22, 25], w: 0.8, c: '#b88830', on: 'lips' },
    { t: 'eye', x: 23, y: 19.5, s: 2.3, style: 'angry', iris: '#e84030', look: [-1, 0], flip: true },
    { t: 'eye', x: 29, y: 19.5, s: 2.2, style: 'angry', iris: '#e84030', look: [-1, 0] },
    // front arm (flame shoulder)
    { t: 'p', pts: [24, 30, 20, 25, 28, 28], c: 'fire', g: 'armF', z: 3 },
    { t: 'c', x1: 26, y1: 32, x2: 18, y2: 38, r1: 3.4, r2: 2.6, c: 'fire', g: 'armF', z: 3 },
    { t: 'c', x1: 18, y1: 38, x2: 14, y2: 34, r1: 2.6, r2: 2.2, c: 'fire', g: 'armF', z: 3 },
    { t: 'e', x: 13, y: 33, rx: 2.8, ry: 2.6, c: 'body', g: 'handF', z: 3.5 },
  ] });

  G.defMon('PINSIR', { pal: { body: '#b8946a', dark: '#886a48', horn: '#e8e4d8', teeth: '#f8f8f0' }, parts: [
    // far horn
    { t: 'p', pts: [33, 19, 38, 14, 41, 9, 41, 4, 38, 1, 34, 0.5, 36, 3, 37, 5, 34, 6, 36, 8, 33, 10, 35, 12, 31, 14, 33, 16, 29, 19], c: 'horn', g: 'hornB', z: -1 },
    // arms/legs behind
    { t: 'c', x1: 42, y1: 36, x2: 48, y2: 42, r1: 3, r2: 2.6, c: 'body', g: 'armB', z: -2 },
    { t: 'p', pts: [47, 40, 53, 41, 54, 44, 50, 44, 51, 47, 46, 45], c: 'body', g: 'armB', z: -2 },
    { t: 'c', x1: 41, y1: 50, x2: 42, y2: 57, r1: 4.4, r2: 4, c: 'body', g: 'legB', z: -1 },
    { t: 'p', pts: [37, 59, 41, 55, 47, 59], c: 'body', g: 'legB', z: -1 },
    // body with bands
    { t: 'e', x: 35, y: 41, rx: 11.5, ry: 13, c: 'body', g: 'body' },
    { t: 'stripe', pts: [24, 34, 46, 34], w: 1.2, c: 'dark', on: 'body' },
    { t: 'stripe', pts: [24, 40, 46, 40], w: 1.2, c: 'dark', on: 'body' },
    { t: 'stripe', pts: [24, 46, 46, 46], w: 1.2, c: 'dark', on: 'body' },
    { t: 'stripe', pts: [25, 51, 45, 51], w: 1.2, c: 'dark', on: 'body' },
    { t: 'c', x1: 30, y1: 50, x2: 28, y2: 57, r1: 4.8, r2: 4.3, c: 'body', g: 'legF', z: 1 },
    { t: 'p', pts: [21, 59.5, 28, 55, 34, 59.5], c: 'body', g: 'legF', z: 1 },
    // head
    { t: 'e', x: 27, y: 25, rx: 9, ry: 7.5, c: 'body', g: 'head', z: 2 },
    { t: 'stripe', pts: [20, 19, 27, 21, 35, 19], w: 1.2, c: 'dark', on: 'head' },
    { t: 'p', pts: [18, 24, 22, 24, 23, 32, 19, 32], c: '#3a2a28', g: 'mouth', z: 3, flat: true, face: true },
    { t: 'stripe', pts: [18, 26, 23, 26], w: 1, c: 'teeth', on: 'mouth' },
    { t: 'stripe', pts: [18.5, 28.5, 23.5, 28.5], w: 1, c: 'teeth', on: 'mouth' },
    { t: 'stripe', pts: [19, 31, 24, 31], w: 1, c: 'teeth', on: 'mouth' },
    { t: 'eye', x: 20.5, y: 21.5, s: 2.2, style: 'angry', iris: '#303030', look: [-1, 0], flip: true },
    { t: 'eye', x: 28, y: 22, s: 2.2, style: 'angry', iris: '#303030', look: [-1, 0] },
    // near horn with inner spikes
    { t: 'p', pts: [19, 21, 13, 15, 10, 9, 11, 4, 14, 1, 19, 0.5, 17, 3, 16.5, 5, 20, 6, 17.5, 8, 21, 10, 19, 12, 23, 14, 21.5, 16, 26, 19], c: 'horn', g: 'hornF', z: 2.5 },
    // front arm with claws
    { t: 'c', x1: 26, y1: 35, x2: 19, y2: 41, r1: 3.2, r2: 2.8, c: 'body', g: 'armF', z: 3 },
    { t: 'p', pts: [20, 38, 13, 37, 10, 40, 14, 42, 11, 45, 16, 46, 21, 44], c: 'body', g: 'armF', z: 3 },
  ] });

  G.defMon('TAUROS', { pal: { body: '#c89a5c', mane: '#7a5838', horn: '#d8d8d0', nose: '#a8a0b8', hoof: '#5a5060', pad: '#a8a0b8' }, parts: [
    // three tails
    { t: 'l', pts: [52, 36, 57, 30, 58, 22], w: 1.6, w2: 1.2, c: 'body', g: 't1', z: -3 },
    { t: 'e', x: 58, y: 19.5, rx: 2.4, ry: 3.4, c: 'mane', g: 't1', z: -3 },
    { t: 'l', pts: [53, 38, 59, 35, 61, 28], w: 1.6, w2: 1.2, c: 'body', g: 't2', z: -3.2 },
    { t: 'e', x: 61.5, y: 25.5, rx: 2.2, ry: 3.2, c: 'mane', g: 't2', z: -3.2 },
    { t: 'l', pts: [53, 40, 58, 42, 61, 38], w: 1.6, w2: 1.2, c: 'body', g: 't3', z: -3.4 },
    { t: 'e', x: 61.5, y: 35.5, rx: 2, ry: 3, c: 'mane', g: 't3', z: -3.4 },
    // far legs
    { t: 'c', x1: 46, y1: 44, x2: 49, y2: 55, r1: 4.6, r2: 3.4, c: 'body', g: 'legBB', z: -2 },
    { t: 'e', x: 49.5, y: 56, rx: 3.2, ry: 2, c: 'hoof', g: 'legBB', z: -2 },
    { t: 'c', x1: 26, y1: 44, x2: 24, y2: 55, r1: 4.4, r2: 3.4, c: 'body', g: 'legFB', z: -2 },
    { t: 'e', x: 23.5, y: 56, rx: 3.2, ry: 2, c: 'hoof', g: 'legFB', z: -2 },
    // body
    { t: 'e', x: 39, y: 37, rx: 16.5, ry: 11, c: 'body', g: 'body' },
    { t: 'e', x: 28, y: 34, rx: 10, ry: 10.5, c: 'body', g: 'body' },
    // near legs
    { t: 'c', x1: 42, y1: 43, x2: 43, y2: 56, r1: 5, r2: 3.6, c: 'body', g: 'legBF', z: 1 },
    { t: 'e', x: 43, y: 57.5, rx: 3.6, ry: 2.2, c: 'hoof', g: 'legBF', z: 1 },
    { t: 'c', x1: 30, y1: 43, x2: 30, y2: 56, r1: 5, r2: 3.6, c: 'body', g: 'legFF', z: 1 },
    { t: 'e', x: 29.5, y: 57.5, rx: 3.6, ry: 2.2, c: 'hoof', g: 'legFF', z: 1 },
    // mane over neck and brow
    { t: 'e', x: 26, y: 26, rx: 9, ry: 9, c: 'mane', g: 'mane', z: 2 },
    { t: 'p', pts: [18, 32, 20, 38, 24, 34, 27, 40, 30, 35, 34, 38, 35, 30], c: 'mane', g: 'mane', z: 2 },
    { t: 'p', pts: [22, 18, 26, 14, 30, 18, 33, 15, 35, 22, 30, 24], c: 'mane', g: 'mane', z: 2 },
    // head
    { t: 'e', x: 16, y: 30, rx: 7, ry: 6.5, c: 'body', g: 'head', z: 3 },
    { t: 'e', x: 11, y: 34, rx: 4.8, ry: 4, c: 'nose', g: 'nose', z: 3.5 },
    { t: 'spot', x: 8.5, y: 34, rx: 1, ry: 1.2, c: '#58506a', on: 'nose' },
    { t: 'e', x: 17, y: 25, rx: 3, ry: 1.8, c: 'pad', g: 'brow', z: 3.5 },
    { t: 'eye', x: 15, y: 28.5, s: 2, style: 'angry', iris: '#303030', look: [-1, 0], flip: true },
    // horns
    { t: 'l', pts: [21, 24, 16, 20, 15, 14, 18, 9], w: 4.4, w2: 1.2, c: 'horn', g: 'hornF', z: 4 },
    { t: 'l', pts: [27, 21, 30, 15, 35, 12, 38, 13], w: 4, w2: 1.2, c: 'horn', g: 'hornB', z: 1.8 },
  ] });

  G.defMon('MAGIKARP', { pal: { body: '#f06030', belly: '#f8d8a0', fin: '#f8e4b8', whisk: '#f8d040', lip: '#f8e8d0' }, parts: [
    // tail fin
    { t: 'p', pts: [46, 40, 57, 29, 60, 33, 56, 41, 61, 49, 57, 53], c: 'fin', g: 'tail', z: -2 },
    { t: 'stripe', pts: [48, 40, 58, 32], w: 0.8, c: '#d8b888', on: 'tail' },
    { t: 'stripe', pts: [48, 42, 58, 50], w: 0.8, c: '#d8b888', on: 'tail' },
    // dorsal crown fin
    { t: 'p', pts: [22, 26, 22, 18, 26, 21, 28, 15, 31, 20, 34, 15, 36, 21, 40, 18, 40, 25, 30, 29], c: 'fin', g: 'dorsal', z: -1 },
    // far pectoral fin
    { t: 'p', pts: [34, 44, 38, 50, 32, 50], c: 'fin', g: 'finB', z: -1 },
    // body
    { t: 'e', x: 32, y: 38, rx: 15.5, ry: 11.5, rot: -5, c: 'body', g: 'body' },
    { t: 'spot', x: 30, y: 46, rx: 12, ry: 4.5, c: 'belly', on: 'body', face: true },
    { t: 'stripe', pts: [31, 31, 29, 34, 31, 37], w: 0.8, c: '#c84424', on: 'body' },
    { t: 'stripe', pts: [37, 30, 35, 33, 37, 36], w: 0.8, c: '#c84424', on: 'body' },
    { t: 'stripe', pts: [43, 31, 41, 34, 43, 37], w: 0.8, c: '#c84424', on: 'body' },
    { t: 'stripe', pts: [34, 36, 32, 39, 34, 42], w: 0.8, c: '#c84424', on: 'body' },
    { t: 'stripe', pts: [40, 36, 38, 39, 40, 42], w: 0.8, c: '#c84424', on: 'body' },
    // lips
    { t: 'e', x: 17, y: 42, rx: 3.6, ry: 4.4, c: 'lip', g: 'lip', z: 1 },
    { t: 'e', x: 16.5, y: 42, rx: 1.8, ry: 2.6, c: '#a83040', g: 'mouthIn', z: 2, flat: true, face: true },
    // whiskers
    { t: 'l', pts: [20, 36, 15, 33, 11, 28, 12, 22], w: 1.6, w2: 1.2, c: 'whisk', g: 'wh1', z: 2 },
    { t: 'l', pts: [20, 46, 15, 50, 13, 55], w: 1.6, w2: 1.2, c: 'whisk', g: 'wh2', z: 2 },
    // near pectoral fin
    { t: 'p', pts: [26, 44, 29, 52, 22, 52, 20, 49], c: 'fin', g: 'finF', z: 2 },
    { t: 'eye', x: 22.5, y: 35.5, s: 3.6, iris: '#303030', look: [0, 0] },
  ] });

  G.defMon('GYARADOS', { pal: { body: '#3a8ad8', bodyD: '#2a64b0', belly: '#f0e0a0', fin: '#e8f0f8', fang: '#ffffff', mouth: '#a02030', whisk: '#f0f0f8' }, parts: [
    // tail fin
    { t: 'p', pts: [52, 30, 53, 16, 58, 22, 63, 12, 62, 25, 63.5, 33, 57, 32], c: 'body', g: 'tailfin', z: -4 },
    { t: 'stripe', pts: [55, 29, 57, 21], w: 0.8, c: '#80b8f0', on: 'tailfin' },
    { t: 'stripe', pts: [58, 30, 61.5, 19], w: 0.8, c: '#80b8f0', on: 'tailfin' },
    // dorsal fins along the back
    { t: 'p', pts: [30, 25, 39, 21, 36, 30], c: 'fin', g: 'dfin1', z: -3 },
    { t: 'p', pts: [35, 35, 44, 34, 37, 41], c: 'fin', g: 'dfin2', z: -3 },
    { t: 'p', pts: [49, 45, 43, 43, 49, 40], c: 'fin', g: 'dfin3', z: -3 },
    { t: 'p', pts: [50, 35, 44, 32, 50, 29], c: 'fin', g: 'dfin4', z: -3 },
    // serpentine body
    { t: 'l', pts: [22, 24, 29, 33, 27, 44, 33, 53.5, 45, 56, 54, 50, 57, 40, 55, 30], w: 15, w2: 8, c: 'body', g: 'coil', z: -2 },
    { t: 'stripe', pts: [15, 27, 22, 35, 20, 45, 25, 56, 40, 64, 53, 60, 62, 50, 63, 38, 61, 28], w: 7, c: 'belly', on: 'coil', face: true },
    { t: 'stripe', pts: [16, 32, 26, 31], w: 0.8, c: '#c8b070', on: 'coil', face: true },
    { t: 'stripe', pts: [18, 38, 26, 37], w: 0.8, c: '#c8b070', on: 'coil', face: true },
    { t: 'stripe', pts: [17, 44, 24, 45], w: 0.8, c: '#c8b070', on: 'coil', face: true },
    { t: 'stripe', pts: [20, 50, 27, 52], w: 0.8, c: '#c8b070', on: 'coil', face: true },
    { t: 'stripe', pts: [29, 60, 32, 55], w: 0.8, c: '#c8b070', on: 'coil', face: true },
    { t: 'stripe', pts: [37, 62, 39, 57], w: 0.8, c: '#c8b070', on: 'coil', face: true },
    { t: 'stripe', pts: [40, 48, 48, 50, 52, 44], w: 1, c: 'bodyD', on: 'coil', backOnly: true },
    // head: three-pointed crest, white cheek fin
    { t: 'p', pts: [17, 9, 16, 0.5, 22, 6, 26, 0.5, 28, 7, 35, 3, 32, 13, 22, 13], c: 'bodyD', g: 'crest', z: 1 },
    { t: 'p', pts: [26, 17, 36, 13, 38, 20, 34, 25, 28, 24], c: 'fin', g: 'cheek', z: 1.5 },
    { t: 'stripe', pts: [29, 19, 36, 16], w: 0.7, c: '#b0c0d8', on: 'cheek' },
    { t: 'e', x: 20, y: 14, rx: 10, ry: 7, c: 'body', g: 'head', z: 2 },
    { t: 'e', x: 10, y: 16.5, rx: 8.5, ry: 4.5, rot: 6, c: 'body', g: 'head', z: 2 },
    // roaring open mouth with fangs
    { t: 'p', pts: [2, 19, 21, 20, 25, 24, 18, 32, 5, 29], c: 'mouth', g: 'mouth', z: 2.2, flat: true, face: true },
    { t: 'e', x: 12, y: 30.5, rx: 10, ry: 3.4, rot: -8, c: 'belly', g: 'jaw', z: 2.5, face: true },
    { t: 'p', pts: [3, 19.4, 5.5, 25.5, 8, 19.7], c: 'fang', g: 'fang1', z: 3, flat: true, line: false, face: true },
    { t: 'p', pts: [13.5, 20.2, 16, 25.5, 18.5, 20.5], c: 'fang', g: 'fang2', z: 3, flat: true, line: false, face: true },
    { t: 'p', pts: [6, 29.3, 8.5, 24, 11, 29.7], c: 'fang', g: 'fang3', z: 3, flat: true, line: false, face: true },
    { t: 'p', pts: [15, 29.7, 17, 25, 19, 29.2], c: 'fang', g: 'fang4', z: 3, flat: true, line: false, face: true },
    { t: 'l', pts: [8, 16.5, 3.5, 17.5, 2, 22, 3, 28], w: 1.6, w2: 0.9, c: 'whisk', g: 'wh', z: 3, face: true },
    { t: 'l', pts: [12, 18, 10, 24, 11, 28], w: 1.3, w2: 0.8, c: 'whisk', g: 'wh2', z: 1.9, face: true },
    { t: 'eye', x: 18.5, y: 12.5, s: 2.8, style: 'angry', iris: '#d83030', look: [-1, 0] },
  ] });

  G.defMon('LAPRAS', { pal: { body: '#5aa8e0', belly: '#f0ead0', shell: '#9aa0b4', knob: '#c8ccd8', horn: '#9aa0b4' }, parts: [
    // far flipper
    { t: 'e', x: 57, y: 50, rx: 6, ry: 3, rot: 25, c: 'body', g: 'flipB', z: -3 },
    // body and shell
    { t: 'e', x: 39, y: 47, rx: 18, ry: 9, c: 'body', g: 'body', z: -1 },
    { t: 'spot', x: 34, y: 54, rx: 15, ry: 5, c: 'belly', on: 'body', face: true },
    { t: 'e', x: 42, y: 39, rx: 17, ry: 11, c: 'shell', g: 'shell', z: 0, bz: 1 },
    { t: 'e', x: 33, y: 32, rx: 2.8, ry: 2.2, c: 'knob', g: 'k1', z: 1 },
    { t: 'e', x: 42, y: 29.5, rx: 3, ry: 2.3, c: 'knob', g: 'k2', z: 1 },
    { t: 'e', x: 51, y: 31, rx: 2.8, ry: 2.2, c: 'knob', g: 'k3', z: 1 },
    { t: 'e', x: 38, y: 38, rx: 2.8, ry: 2.2, c: 'knob', g: 'k4', z: 1 },
    { t: 'e', x: 48, y: 38, rx: 2.8, ry: 2.2, c: 'knob', g: 'k5', z: 1 },
    { t: 'e', x: 56, y: 39, rx: 2.4, ry: 2, c: 'knob', g: 'k6', z: 1 },
    { t: 'e', x: 43, y: 46, rx: 2.4, ry: 1.8, c: 'knob', g: 'k7', z: 1, backOnly: true },
    { t: 'e', x: 33, y: 45, rx: 2.4, ry: 1.8, c: 'knob', g: 'k8', z: 1, backOnly: true },
    // neck and head
    { t: 'c', x1: 29, y1: 44, x2: 20, y2: 24, r1: 6, r2: 4.2, c: 'body', g: 'neck', z: 2 },
    { t: 'stripe', pts: [23, 46, 16, 28], w: 4.5, c: 'belly', on: 'neck', face: true },
    { t: 'p', pts: [20, 11, 22, 3, 26, 11], c: 'horn', g: 'horn', z: 2.5 },
    { t: 'l', pts: [24, 15, 29, 12, 31, 15, 29, 17], w: 3, w2: 1.8, c: 'body', g: 'ear', z: 2.6 },
    { t: 'e', x: 19, y: 17, rx: 7, ry: 6.5, c: 'body', g: 'head', z: 3 },
    { t: 'e', x: 13, y: 20, rx: 5, ry: 4, c: 'body', g: 'head', z: 3 },
    { t: 'spot', x: 14, y: 24, rx: 5, ry: 2, c: 'belly', on: 'head', face: true },
    { t: 'eye', x: 16, y: 16.5, s: 2.6, iris: '#2a2840', look: [-1, 0] },
    { t: 'mouth', x: 12, y: 21, w: 2, style: 'smile' },
    // front flipper
    { t: 'e', x: 22, y: 54, rx: 8, ry: 3.4, rot: -18, c: 'body', g: 'flipF', z: 3 },
  ] });

  G.defMon('DITTO', { pal: { body: '#b494d8' }, parts: [
    { t: 'e', x: 32, y: 50, rx: 15, ry: 8.5, c: 'body', g: 'body' },
    { t: 'e', x: 30, y: 44, rx: 10, ry: 7, c: 'body', g: 'body' },
    { t: 'e', x: 17, y: 50, rx: 3.5, ry: 3, rot: -30, c: 'body', g: 'body' },
    { t: 'e', x: 46, y: 49, rx: 3.5, ry: 3, rot: 30, c: 'body', g: 'body' },
    { t: 'e', x: 24, y: 40.5, rx: 3.5, ry: 3, c: 'body', g: 'body' },
    { t: 'eye', x: 26, y: 45, s: 1, style: 'dot' },
    { t: 'eye', x: 33, y: 45, s: 1, style: 'dot' },
    { t: 'mouth', x: 29.5, y: 49, w: 5, style: 'line' },
    { t: 'shine', x: 27, y: 40 },
  ] });

  G.defMon('EEVEE', { pal: { fur: '#c88c50', cream: '#f4e0b4', tip: '#7a4a28' }, parts: [
    // tail
    { t: 'e', x: 49, y: 42, rx: 7, ry: 10, rot: 25, c: 'fur', g: 'tail', z: -2 },
    { t: 'spot', x: 53, y: 34, rx: 6, ry: 5, c: 'cream', on: 'tail' },
    // far legs
    { t: 'c', x1: 35, y1: 50, x2: 36, y2: 57, r1: 2.4, r2: 2.2, c: 'fur', g: 'legFB', z: -1 },
    // body
    { t: 'e', x: 39, y: 49, rx: 10, ry: 7.5, c: 'fur', g: 'body' },
    { t: 'e', x: 44, y: 54, rx: 5.5, ry: 4.5, c: 'fur', g: 'haunch', z: 0.5 },
    { t: 'e', x: 41, y: 58, rx: 4, ry: 1.8, c: 'fur', g: 'haunch', z: 0.5 },
    { t: 'c', x1: 30, y1: 49, x2: 29, y2: 57, r1: 2.6, r2: 2.4, c: 'fur', g: 'legF', z: 1 },
    // collar
    { t: 'p', pts: star(31, 41, 8.5, 6.2, 9, 10, 1, 0.8), c: 'cream', g: 'collar', z: 1.5 },
    // head
    { t: 'p', pts: [17, 28, 9, 10, 13, 8, 27, 23], c: 'fur', g: 'earF', z: 2.4 },
    { t: 'spot', x: 11, y: 9, rx: 3.5, ry: 4, c: 'tip', on: 'earF' },
    { t: 'p', pts: [27, 24, 35, 6, 39, 8, 36, 27], c: 'fur', g: 'earB', z: 1.8 },
    { t: 'spot', x: 37, y: 7, rx: 3, ry: 4, c: 'tip', on: 'earB' },
    { t: 'e', x: 26, y: 30, rx: 9, ry: 7.5, c: 'fur', g: 'head', z: 2.5 },
    { t: 'e', x: 19, y: 33, rx: 4.5, ry: 3.2, c: 'fur', g: 'head', z: 2.5 },
    { t: 'eye', x: 22, y: 29.5, s: 2.8, iris: '#5a3018', look: [-1, 0] },
    { t: 'eye', x: 29, y: 29.5, s: 2.6, iris: '#5a3018', look: [-1, 0] },
    { t: 'eye', x: 15.5, y: 32.5, s: 1, style: 'dot', face: true },
    { t: 'mouth', x: 19, y: 34, w: 1.5, style: 'smile' },
  ] });

  G.defMon('VAPOREON', { pal: { body: '#68b4e4', dark: '#2e6aa8', fin: '#eef2f8', finE: '#9cc8ec' }, parts: [
    // fish tail
    { t: 'l', pts: [46, 46, 54, 44, 58, 37, 57, 28], w: 6, w2: 3.4, c: 'body', g: 'tail', z: -3 },
    { t: 'p', pts: [57, 30, 50, 20, 54, 20, 58, 25, 62, 17, 64, 20, 60, 31], c: 'dark', g: 'tfin', z: -2.8 },
    // dorsal ridge
    { t: 'p', pts: [30, 36, 36, 34, 42, 36, 48, 38, 52, 42, 46, 41, 40, 40, 34, 40], c: 'dark', g: 'ridge', z: 0.5 },
    // far legs
    { t: 'c', x1: 44, y1: 48, x2: 47, y2: 56, r1: 2.6, r2: 2.2, c: 'body', g: 'legBB', z: -2 },
    { t: 'c', x1: 32, y1: 48, x2: 33, y2: 56, r1: 2.4, r2: 2.2, c: 'body', g: 'legFB', z: -2 },
    // body
    { t: 'e', x: 39, y: 46, rx: 12, ry: 7, c: 'body', g: 'body' },
    { t: 'c', x1: 42, y1: 49, x2: 42, y2: 57, r1: 3.2, r2: 2.4, c: 'body', g: 'legBF', z: 1 },
    { t: 'c', x1: 29, y1: 49, x2: 28, y2: 57, r1: 2.8, r2: 2.4, c: 'body', g: 'legFF', z: 1 },
    // neck frill
    { t: 'p', pts: [22, 34, 18, 42, 24, 40, 25, 47, 29, 42, 32, 47, 33, 40, 37, 43, 34, 34], c: 'fin', g: 'frill', z: 1.5 },
    { t: 'stripe', pts: [21, 38, 25, 36, 28, 44], w: 0.8, c: 'finE', on: 'frill' },
    // head with ear fins and crest
    { t: 'p', pts: [27, 25, 34, 16, 42, 17, 36, 22, 40, 26, 32, 29], c: 'fin', g: 'earB', z: 1.8 },
    { t: 'stripe', pts: [30, 26, 38, 18], w: 1, c: 'finE', on: 'earB' },
    { t: 'p', pts: [22, 23, 26, 13, 30, 12, 29, 19], c: 'dark', g: 'crest', z: 2 },
    { t: 'e', x: 24, y: 30, rx: 8, ry: 7, c: 'body', g: 'head', z: 2.5 },
    { t: 'e', x: 17, y: 33, rx: 4.2, ry: 3.2, c: 'body', g: 'head', z: 2.5 },
    { t: 'p', pts: [20, 25, 13, 18, 10, 21, 13, 23, 12, 27, 18, 28], c: 'fin', g: 'earF', z: 2.8 },
    { t: 'stripe', pts: [18, 26, 12, 20], w: 1, c: 'finE', on: 'earF' },
    { t: 'eye', x: 21, y: 30, s: 2.6, iris: '#1e2a48', look: [-1, 0] },
    { t: 'eye', x: 28, y: 30, s: 2.4, iris: '#1e2a48', look: [-1, 0] },
    { t: 'mouth', x: 16.5, y: 34, w: 1.5, style: 'smile' },
  ] });

  G.defMon('JOLTEON', { pal: { fur: '#f8d438', white: '#f8f6ec', furD: '#d8a820' }, parts: [
    // far legs
    { t: 'c', x1: 46, y1: 46, x2: 49, y2: 56, r1: 2.6, r2: 2, c: 'fur', g: 'legBB', z: -2 },
    { t: 'c', x1: 32, y1: 46, x2: 33, y2: 56, r1: 2.4, r2: 2, c: 'fur', g: 'legFB', z: -2 },
    // spiky rump
    { t: 'p', pts: [42, 36, 52, 30, 50, 36, 60, 34, 54, 40, 62, 44, 53, 46, 57, 52, 48, 50, 42, 48], c: 'fur', g: 'body', z: -0.5 },
    { t: 'p', pts: [34, 38, 38, 30, 41, 37, 46, 29, 46, 38], c: 'fur', g: 'body', z: -0.5 },
    // body
    { t: 'e', x: 39, y: 44, rx: 11, ry: 7, c: 'fur', g: 'body' },
    { t: 'c', x1: 43, y1: 47, x2: 43, y2: 57, r1: 3, r2: 2.2, c: 'fur', g: 'legBF', z: 1 },
    { t: 'c', x1: 30, y1: 47, x2: 29, y2: 57, r1: 2.6, r2: 2.2, c: 'fur', g: 'legFF', z: 1 },
    // spiky white collar
    { t: 'p', pts: [22, 34, 19, 43, 25, 40, 26, 48, 29, 42, 33, 47, 33, 40, 38, 41, 34, 33], c: 'white', g: 'collar', z: 1.5 },
    // head
    { t: 'p', pts: [18, 26, 8, 12, 10, 11, 25, 22], c: 'fur', g: 'earF', z: 2.4 },
    { t: 'p', pts: [28, 22, 33, 6, 35, 7, 34, 24], c: 'fur', g: 'earB', z: 1.8 },
    { t: 'spot', x: 11, y: 17, rx: 2, ry: 5, rot: -35, c: 'white', on: 'earF', face: true },
    { t: 'e', x: 24, y: 29, rx: 8.5, ry: 7, c: 'fur', g: 'head', z: 2.5 },
    { t: 'e', x: 17, y: 32, rx: 4.2, ry: 3.2, c: 'fur', g: 'head', z: 2.5 },
    { t: 'p', pts: [27, 22, 34, 20, 31, 26], c: 'fur', g: 'head', z: 2.5 },
    { t: 'eye', x: 20.5, y: 28.5, s: 2.6, iris: '#1a1a28', look: [-1, 0] },
    { t: 'eye', x: 27.5, y: 28.5, s: 2.4, iris: '#1a1a28', look: [-1, 0] },
    { t: 'mouth', x: 16.5, y: 33, w: 1.5, style: 'smile' },
  ] });

  G.defMon('FLAREON', { pal: { fur: '#f07838', cream: '#f8dc98', creamD: '#e8b860' }, parts: [
    // big fluffy tail
    { t: 'e', x: 51, y: 36, rx: 8, ry: 12, rot: 20, c: 'cream', g: 'tail', z: -2 },
    { t: 'p', pts: star(51, 36, 11.5, 9, 9, 0, 0.72, 1), c: 'cream', g: 'tail', z: -2 },
    { t: 'stripe', pts: [48, 44, 52, 34, 51, 26], w: 1, c: 'creamD', on: 'tail' },
    // far legs
    { t: 'c', x1: 44, y1: 48, x2: 46, y2: 56, r1: 2.8, r2: 2.2, c: 'fur', g: 'legBB', z: -1.5 },
    { t: 'c', x1: 32, y1: 48, x2: 33, y2: 56, r1: 2.6, r2: 2.2, c: 'fur', g: 'legFB', z: -1.5 },
    // body
    { t: 'e', x: 39, y: 46, rx: 11, ry: 7.5, c: 'fur', g: 'body' },
    { t: 'c', x1: 42, y1: 49, x2: 42, y2: 57, r1: 3.3, r2: 2.4, c: 'fur', g: 'legBF', z: 1 },
    { t: 'c', x1: 29, y1: 49, x2: 28, y2: 57, r1: 3, r2: 2.4, c: 'fur', g: 'legFF', z: 1 },
    // mane
    { t: 'p', pts: star(29, 40, 10, 7.5, 10, 0, 0.9, 0.85), c: 'cream', g: 'mane', z: 1.5 },
    // head
    { t: 'p', pts: [18, 26, 9, 10, 12, 9, 25, 22], c: 'fur', g: 'earF', z: 2.4 },
    { t: 'spot', x: 13, y: 16, rx: 2, ry: 5, rot: -30, c: '#c05028', on: 'earF', face: true },
    { t: 'p', pts: [29, 22, 34, 6, 37, 7, 35, 25], c: 'fur', g: 'earB', z: 1.8 },
    { t: 'e', x: 24, y: 29, rx: 8.5, ry: 7.2, c: 'fur', g: 'head', z: 2.5 },
    { t: 'e', x: 17, y: 32, rx: 4.2, ry: 3.2, c: 'fur', g: 'head', z: 2.5 },
    { t: 'p', pts: [22, 23, 24, 15, 27, 20, 30, 14, 31, 22, 27, 25], c: 'cream', g: 'tuft', z: 2.7 },
    { t: 'eye', x: 20.5, y: 29, s: 2.6, iris: '#3a1a10', look: [-1, 0] },
    { t: 'eye', x: 27.5, y: 29, s: 2.4, iris: '#3a1a10', look: [-1, 0] },
    { t: 'mouth', x: 16.5, y: 33, w: 1.5, style: 'smile' },
  ] });

  G.defMon('PORYGON', { pal: { pink: '#f07c94', pinkL: '#f8a8b8', blue: '#40a4d8', blueL: '#78c8f0', white: '#ffffff' }, parts: [
    // tail fin
    { t: 'p', pts: [49, 36, 60, 29, 62, 33, 51, 41], c: 'blue', g: 'tail', z: -2 },
    // far legs
    { t: 'p', pts: [44, 45, 50, 43, 50, 54, 45, 56], c: 'pink', g: 'legB', z: -1 },
    // body: blue back, pink front facet
    { t: 'p', pts: [28, 30, 40, 26, 52, 31, 51, 43, 38, 48, 28, 43], c: 'blue', g: 'body' },
    { t: 'p', pts: [28, 30, 40, 26, 52, 31, 40, 34], c: 'blueL', g: 'bodyTop', z: 0.2 },
    { t: 'p', pts: [28, 33, 38, 36, 38, 48, 28, 43], c: 'pink', g: 'chest', z: 0.5 },
    { t: 'p', pts: [30, 45, 37, 47, 36, 57, 30, 56], c: 'pink', g: 'legF', z: 1 },
    { t: 'p', pts: [30, 56, 36, 57, 36, 58, 30, 58], c: 'pinkL', g: 'legF', z: 1 },
    // head
    { t: 'p', pts: [14, 21, 22, 13, 34, 15, 37, 25, 29, 32, 16, 30], c: 'pink', g: 'head', z: 2 },
    { t: 'p', pts: [14, 21, 22, 13, 34, 15, 26, 20], c: 'pinkL', g: 'headTop', z: 2.2 },
    { t: 'p', pts: [17, 21, 3, 26, 17, 30], c: 'blue', g: 'beak', z: 2.5 },
    { t: 'p', pts: [17, 21, 3, 26, 12, 24], c: 'blueL', g: 'beakTop', z: 2.6 },
    { t: 'eye', x: 22, y: 24, s: 3.2, iris: '#304888', look: [-1, 0] },
    { t: 'eye', x: 30, y: 24, s: 2.6, iris: '#304888', look: [-1, 0] },
  ] });

  G.defMon('OMANYTE', { pal: { shell: '#ecdcaa', shellD: '#c0a468', body: '#7cbce8' }, parts: [
    // tentacles
    { t: 'l', pts: [20, 48, 17, 53, 18, 57], w: 2.2, w2: 1.4, c: 'body', g: 'ten1', z: 1 },
    { t: 'l', pts: [24, 50, 23, 55, 25, 58], w: 2.2, w2: 1.4, c: 'body', g: 'ten2', z: 1 },
    { t: 'l', pts: [29, 51, 29, 56, 32, 58], w: 2.2, w2: 1.4, c: 'body', g: 'ten3', z: 0.5 },
    { t: 'l', pts: [33, 50, 35, 54, 38, 56], w: 2, w2: 1.3, c: 'body', g: 'ten4', z: 0.2 },
    // body
    { t: 'e', x: 26, y: 45, rx: 8.5, ry: 7, c: 'body', g: 'body', z: 0 },
    // spiral shell
    { t: 'e', x: 37, y: 38, rx: 12, ry: 11, c: 'shell', g: 'shell', z: -1, bz: 2 },
    { t: 'p', pts: [30, 29, 33, 24, 35, 28], c: 'shell', g: 'shell', z: -1, bz: 2 },
    { t: 'p', pts: [39, 27, 43, 23, 43, 28], c: 'shell', g: 'shell', z: -1, bz: 2 },
    { t: 'stripe', pts: [34, 38, 36, 35, 39, 36, 40, 40, 37, 43, 32, 42, 30, 37, 32, 31, 38, 29, 44, 32, 47, 38, 46, 45], w: 1.4, c: 'shellD', on: 'shell' },
    { t: 'eye', x: 22, y: 43, s: 3, iris: '#e8b020', look: [-1, 0] },
    { t: 'eye', x: 29, y: 43, s: 2.6, iris: '#e8b020', look: [-1, 0] },
  ] });

  G.defMon('OMASTAR', { pal: { shell: '#ecdcaa', shellD: '#c0a468', body: '#6cb0e4', beak: '#f0e8c8' }, parts: [
    // tentacles
    { t: 'l', pts: [16, 44, 11, 50, 11, 57], w: 2.8, w2: 1.6, c: 'body', g: 'ten1', z: 1 },
    { t: 'l', pts: [21, 47, 18, 53, 20, 58], w: 2.8, w2: 1.6, c: 'body', g: 'ten2', z: 1.1 },
    { t: 'l', pts: [27, 48, 27, 54, 30, 58], w: 2.8, w2: 1.6, c: 'body', g: 'ten3', z: 1 },
    { t: 'l', pts: [33, 48, 36, 53, 39, 57], w: 2.6, w2: 1.5, c: 'body', g: 'ten4', z: 0.6 },
    { t: 'l', pts: [38, 46, 44, 50, 47, 55], w: 2.4, w2: 1.4, c: 'body', g: 'ten5', z: 0.4 },
    { t: 'l', pts: [13, 40, 7, 44, 5, 50], w: 2.4, w2: 1.4, c: 'body', g: 'ten6', z: 0.8 },
    // body
    { t: 'e', x: 25, y: 39, rx: 11, ry: 9, c: 'body', g: 'body', z: 0 },
    // big spiral shell with spikes
    { t: 'p', pts: [26, 22, 27, 10, 33, 18], c: 'shell', g: 'shell', z: -1, bz: 2 },
    { t: 'p', pts: [33, 17, 39, 5, 42, 16], c: 'shell', g: 'shell', z: -1, bz: 2 },
    { t: 'p', pts: [44, 18, 53, 10, 51, 22], c: 'shell', g: 'shell', z: -1, bz: 2 },
    { t: 'p', pts: [51, 27, 61, 24, 55, 33], c: 'shell', g: 'shell', z: -1, bz: 2 },
    { t: 'p', pts: [54, 40, 62, 44, 53, 46], c: 'shell', g: 'shell', z: -1, bz: 2 },
    { t: 'e', x: 40, y: 32, rx: 15, ry: 14, c: 'shell', g: 'shell', z: -1, bz: 2 },
    { t: 'stripe', pts: [38, 32, 41, 28, 45, 30, 46, 35, 42, 39, 36, 38, 33, 33, 35, 25, 42, 22, 50, 25, 53, 32, 52, 41, 46, 46], w: 1.8, c: 'shellD', on: 'shell' },
    // beak
    { t: 'p', pts: [15, 43, 23, 43, 19, 50], c: 'beak', g: 'beak', z: 2, face: true },
    { t: 'stripe', pts: [19, 43, 19, 49], w: 0.7, c: '#a09070', on: 'beak' },
    { t: 'eye', x: 18, y: 36, s: 3, style: 'angry', iris: '#e8b020', look: [-1, 0], flip: true },
    { t: 'eye', x: 27, y: 36, s: 2.8, style: 'angry', iris: '#e8b020', look: [-1, 0] },
  ] });

  G.defMon('KABUTO', { pal: { shell: '#b87838', shellL: '#d8a060', under: '#2a2426', leg: '#e0c070', eye: '#ff6030' }, parts: [
    // legs
    { t: 'l', pts: [22, 52, 19, 56, 20, 58], w: 1.8, w2: 1.3, c: 'leg', g: 'l1', z: 1 },
    { t: 'l', pts: [28, 53, 27, 58], w: 1.8, w2: 1.3, c: 'leg', g: 'l2', z: 1 },
    { t: 'l', pts: [36, 53, 37, 58], w: 1.8, w2: 1.3, c: 'leg', g: 'l3', z: 0 },
    { t: 'l', pts: [42, 52, 45, 57], w: 1.8, w2: 1.3, c: 'leg', g: 'l4', z: 0 },
    // dark underside/face
    { t: 'e', x: 30, y: 50, rx: 13, ry: 5, c: 'under', g: 'under', z: 0.5, face: true },
    // dome shell
    { t: 'e', x: 33, y: 46, rx: 15, ry: 12, c: 'shell', g: 'shell', z: 0 },
    { t: 'stripe', pts: [19, 46, 26, 43, 35, 42, 45, 43, 48, 46], w: 1.2, c: '#8a5424', on: 'shell' },
    { t: 'stripe', pts: [33, 35, 34, 42], w: 1, c: '#8a5424', on: 'shell' },
    { t: 'e', x: 26, y: 51, rx: 9, ry: 5, c: 'under', g: 'face', z: 1, face: true },
    { t: 'e', x: 21.5, y: 50.5, rx: 2, ry: 1.5, c: 'eye', g: 'eyeL', z: 2, flat: true, gloss: true, face: true },
    { t: 'e', x: 28.5, y: 50.5, rx: 1.8, ry: 1.5, c: 'eye', g: 'eyeR', z: 2, flat: true, gloss: true, face: true },
  ] });

  G.defMon('KABUTOPS', { pal: { body: '#b0783c', dark: '#7a4e24', belly: '#e8cc88', blade: '#dcdce4', face: '#241c1c', eye: '#ff7040' }, parts: [
    // tail with small fin
    { t: 'l', pts: [40, 48, 46, 53, 52, 55, 56, 53], w: 5, w2: 2, c: 'body', g: 'tail', z: -3 },
    { t: 'p', pts: [54, 54, 58, 48.5, 58.5, 55, 55.5, 57], c: 'dark', g: 'tail', z: -3 },
    // dorsal fins
    { t: 'p', pts: [39, 29, 48, 23, 45, 32], c: 'dark', g: 'fin1', z: -2 },
    { t: 'p', pts: [41, 35, 51, 32, 45, 40], c: 'dark', g: 'fin2', z: -2 },
    { t: 'p', pts: [41, 41, 50, 41, 43, 46], c: 'dark', g: 'fin3', z: -2 },
    // back scythe arm (raised)
    { t: 'c', x1: 40, y1: 31, x2: 48, y2: 30, r1: 2.6, r2: 2.2, c: 'body', g: 'armB', z: -1.5 },
    { t: 'p', pts: [50, 33, 55, 28.5, 58, 22, 58.5, 15, 56, 9.5, 54.5, 15.5, 53, 22, 49.5, 27, 46.5, 31], c: 'blade', g: 'bladeB', z: -1.6, gloss: true },
    // legs
    { t: 'c', x1: 39, y1: 45, x2: 44, y2: 51, r1: 3.6, r2: 2.4, c: 'body', g: 'legB', z: -1 },
    { t: 'c', x1: 44, y1: 51, x2: 42, y2: 57, r1: 2.4, r2: 2, c: 'body', g: 'legB', z: -1 },
    { t: 'p', pts: [37, 59.5, 42, 55, 47, 59.5], c: 'body', g: 'legB', z: -1 },
    { t: 'c', x1: 31, y1: 46, x2: 26, y2: 51, r1: 3.9, r2: 2.6, c: 'body', g: 'legF', z: 1 },
    { t: 'c', x1: 26, y1: 51, x2: 28, y2: 57, r1: 2.6, r2: 2.2, c: 'body', g: 'legF', z: 1 },
    { t: 'p', pts: [22, 60, 27.5, 55, 34, 60], c: 'body', g: 'legF', z: 1 },
    // torso
    { t: 'e', x: 34.5, y: 37, rx: 8, ry: 11.5, rot: -12, c: 'body', g: 'torso' },
    { t: 'spot', x: 30.5, y: 39, rx: 4.6, ry: 9.5, rot: -12, c: 'belly', on: 'torso', face: true },
    { t: 'stripe', pts: [25, 33, 34, 32], w: 0.8, c: '#b89858', on: 'torso', face: true },
    { t: 'stripe', pts: [25, 37.5, 35, 37], w: 0.8, c: '#b89858', on: 'torso', face: true },
    { t: 'stripe', pts: [26, 42, 35, 42], w: 0.8, c: '#b89858', on: 'torso', face: true },
    { t: 'stripe', pts: [27, 46, 35, 46.5], w: 0.8, c: '#b89858', on: 'torso', face: true },
    // neck + head: dark face under a swept-back crescent helmet
    { t: 'c', x1: 33, y1: 29, x2: 28, y2: 21, r1: 3.6, r2: 3.2, c: 'body', g: 'neck', z: 1 },
    { t: 'e', x: 22.5, y: 20.5, rx: 7, ry: 5.5, c: 'face', g: 'face', z: 2, face: true },
    { t: 'p', pts: [12.5, 22, 12.5, 16.5, 16, 11.5, 22, 8.5, 30, 7.5, 39, 8, 49, 5, 42, 12, 35, 16, 30, 18, 25, 17.5, 20, 18, 16, 19.5, 14.5, 22.5], c: 'body', g: 'dome', z: 2.5, gloss: true },
    { t: 'e', x: 30, y: 16, rx: 7.5, ry: 6.5, c: 'body', g: 'dome', z: 2.5, backOnly: true },
    { t: 'stripe', pts: [16, 15, 22, 11.5, 31, 10.5, 42, 8.5], w: 0.9, c: 'dark', on: 'dome' },
    { t: 'stripe', pts: [13.5, 22, 16.5, 19.5, 21, 18, 26, 17.6, 31, 17.8, 37, 15, 44, 10.5], w: 1.3, c: 'dark', on: 'dome', face: true },
    { t: 'e', x: 18.5, y: 20.5, rx: 1.7, ry: 1.3, c: 'eye', g: 'eye1', z: 3, flat: true, line: false, face: true },
    { t: 'e', x: 25, y: 20.5, rx: 1.6, ry: 1.3, c: 'eye', g: 'eye2', z: 3, flat: true, line: false, face: true },
    { t: 'shine', x: 18, y: 20 }, { t: 'shine', x: 24.5, y: 20 },
    // front scythe arm (forward, blade sweeping down)
    { t: 'c', x1: 29, y1: 30, x2: 22, y2: 35, r1: 3, r2: 2.6, c: 'body', g: 'armF', z: 3 },
    { t: 'p', pts: [23, 37, 18, 30, 12, 25.5, 6, 24.5, 2.5, 27, 2, 33, 4, 38, 5.5, 32, 9, 29.5, 14, 31, 19, 38], c: 'blade', g: 'bladeF', z: 3.5, gloss: true },
    { t: 'stripe', pts: [21, 35, 15, 29, 9, 27, 4, 29], w: 0.7, c: '#a8a8b8', on: 'bladeF' },
  ] });

  G.defMon('AERODACTYL', { pal: { body: '#b4a8c8', wing: '#8a74b0', wingD: '#6a5890', mouth: '#a83040', teeth: '#ffffff' }, parts: [
    // far wing
    { t: 'p', pts: [28, 26, 22, 12, 18, 2, 24, 6, 30, 10, 36, 20], c: 'wing', g: 'wingB', z: -3 },
    // tail with spade tip
    { t: 'l', pts: [40, 36, 50, 40, 56, 44], w: 4, w2: 1.8, c: 'body', g: 'tail', z: -2 },
    { t: 'p', pts: [54, 42, 60, 40, 63, 46, 58, 48], c: 'body', g: 'tail', z: -2 },
    // legs
    { t: 'c', x1: 38, y1: 38, x2: 42, y2: 46, r1: 3, r2: 2, c: 'body', g: 'legB', z: -1 },
    { t: 'p', pts: [39, 47, 42, 45, 46, 49, 42, 49], c: 'body', g: 'legB', z: -1 },
    { t: 'c', x1: 32, y1: 38, x2: 32, y2: 47, r1: 3.2, r2: 2.2, c: 'body', g: 'legF', z: 1 },
    { t: 'p', pts: [28, 49, 31, 46, 36, 49, 32, 50], c: 'body', g: 'legF', z: 1 },
    // body
    { t: 'e', x: 34, y: 32, rx: 9, ry: 8, rot: 20, c: 'body', g: 'body' },
    { t: 'c', x1: 30, y1: 28, x2: 21, y2: 24, r1: 4.6, r2: 3.8, c: 'body', g: 'body' },
    // head
    { t: 'p', pts: [20, 17, 26, 13, 30, 14, 25, 19], c: 'body', g: 'head', z: 2 },
    { t: 'e', x: 18, y: 22, rx: 6.5, ry: 5.5, c: 'body', g: 'head', z: 2 },
    { t: 'p', pts: [14, 18, 3, 21, 4, 23, 14, 24], c: 'body', g: 'head', z: 2 },
    { t: 'p', pts: [4, 24, 14, 24, 16, 27, 7, 29], c: 'mouth', g: 'mouth', z: 2.2, flat: true, face: true },
    { t: 'p', pts: [7, 29, 16, 27, 17, 30, 9, 31], c: 'body', g: 'jaw', z: 2.4 },
    { t: 'p', pts: [6, 23.5, 7, 26, 8, 23.5], c: 'teeth', g: 't1', z: 2.5, flat: true, face: true },
    { t: 'p', pts: [10, 23.5, 11, 26, 12, 23.5], c: 'teeth', g: 't2', z: 2.5, flat: true, face: true },
    { t: 'p', pts: [9, 29, 10, 26.5, 11, 29], c: 'teeth', g: 't3', z: 2.5, flat: true, face: true },
    { t: 'eye', x: 17, y: 20, s: 2.2, style: 'angry', iris: '#c03030', look: [-1, 0] },
    // near wing (membrane with finger bones)
    { t: 'p', pts: [30, 28, 34, 16, 42, 6, 50, 2, 62, 8, 56, 12, 58, 20, 50, 20, 50, 28, 42, 30, 38, 36], c: 'wing', g: 'wingF', z: 1.5 },
    { t: 'l', pts: [31, 28, 36, 16, 44, 6, 50, 2], w: 2.6, w2: 1.6, c: 'body', g: 'wingF', z: 1.6 },
    { t: 'stripe', pts: [44, 7, 56, 12], w: 0.8, c: 'wingD', on: 'wingF' },
    { t: 'stripe', pts: [40, 12, 50, 20], w: 0.8, c: 'wingD', on: 'wingF' },
    { t: 'stripe', pts: [36, 18, 45, 29], w: 0.8, c: 'wingD', on: 'wingF' },
  ] });

  G.defMon('SNORLAX', { pal: { body: '#2e6878', cream: '#f2e2c0', claw: '#ffffff', pad: '#a8845a' }, parts: [
    // far arm
    { t: 'e', x: 55, y: 40, rx: 5, ry: 8, rot: -15, c: 'body', g: 'armB', z: -1 },
    // huge body
    { t: 'e', x: 32, y: 41, rx: 25, ry: 19, c: 'body', g: 'body' },
    { t: 'spot', x: 29, y: 45, rx: 18, ry: 15, c: 'cream', on: 'body', face: true },
    // feet with soles
    { t: 'e', x: 46, y: 55, rx: 7, ry: 5.5, c: 'cream', g: 'footB', z: 1 },
    { t: 'spot', x: 46, y: 56, rx: 3.5, ry: 2.8, c: 'pad', on: 'footB', face: true },
    { t: 'e', x: 16, y: 56, rx: 7.5, ry: 6, c: 'cream', g: 'footF', z: 1.5 },
    { t: 'spot', x: 16, y: 57, rx: 3.8, ry: 3, c: 'pad', on: 'footF', face: true },
    // near arm
    { t: 'e', x: 9, y: 40, rx: 5.5, ry: 9, rot: 20, c: 'body', g: 'armF', z: 2 },
    // head
    { t: 'p', pts: [17, 11, 19, 3, 24, 9], c: 'body', g: 'head', z: 3 },
    { t: 'p', pts: [33, 9, 39, 3, 40, 11], c: 'body', g: 'head', z: 3 },
    { t: 'e', x: 28, y: 16, rx: 13.5, ry: 10, c: 'body', g: 'head', z: 3 },
    { t: 'p', pts: [15, 22, 16, 15, 21, 13, 26, 16, 31, 13, 36, 15, 39, 21, 36, 26, 20, 26], c: 'cream', g: 'face', z: 3.5, face: true },
    { t: 'eye', x: 21, y: 18, s: 2, style: 'closed' },
    { t: 'eye', x: 31, y: 18, s: 2, style: 'closed' },
    { t: 'mouth', x: 26, y: 21, w: 4, style: 'smile' },
    { t: 'p', pts: [22.5, 22, 23.5, 24, 24.5, 22], c: 'claw', g: 'fang1', z: 4, flat: true, face: true },
    { t: 'p', pts: [27.5, 22, 28.5, 24, 29.5, 22], c: 'claw', g: 'fang2', z: 4, flat: true, face: true },
  ] });

  G.defMon('ARTICUNO', { pal: { body: '#8ccaf0', dark: '#3a6cb8', wing: '#a8daf8', beak: '#a0a8b8', leg: '#8890a8' }, parts: [
    // far wing
    { t: 'p', pts: [40, 26, 48, 13, 56, 7, 63, 8, 59, 13, 63, 17, 57, 20, 60, 25, 52, 27, 53, 31, 45, 31], c: 'wing', g: 'wingB', z: -4 },
    { t: 'stripe', pts: [56, 9, 62, 9], w: 1.6, c: 'dark', on: 'wingB' },
    // long tail streamers
    { t: 'l', pts: [40, 42, 46, 50, 54, 55, 61, 54, 62, 47, 58, 44], w: 6, w2: 2.4, c: 'body', g: 'tail', z: -3 },
    { t: 'l', pts: [38, 44, 42, 54, 50, 60, 57, 61], w: 4.5, w2: 1.8, c: 'dark', g: 'tail2', z: -3.2 },
    // legs
    { t: 'l', pts: [34, 42, 34, 52, 32, 58], w: 1.8, w2: 1.4, c: 'leg', g: 'legB', z: -1 },
    { t: 'l', pts: [28, 43, 26, 52, 24, 58], w: 1.8, w2: 1.4, c: 'leg', g: 'legF', z: 1 },
    { t: 'p', pts: [20, 59.5, 24, 57, 28, 59.5], c: 'leg', g: 'legF', z: 1 },
    { t: 'p', pts: [28, 59, 32, 57, 36, 59], c: 'leg', g: 'legB', z: -1 },
    // body and neck
    { t: 'e', x: 32, y: 35, rx: 9, ry: 11, rot: -25, c: 'body', g: 'body' },
    { t: 'c', x1: 28, y1: 30, x2: 21, y2: 20, r1: 5, r2: 3.8, c: 'body', g: 'body' },
    // head and crest
    { t: 'p', pts: [20, 13, 22, 3, 25, 11], c: 'dark', g: 'crest', z: 1.5 },
    { t: 'p', pts: [22, 13, 27, 1, 29, 12], c: 'dark', g: 'crest', z: 1.4 },
    { t: 'p', pts: [24, 15, 33, 5, 31, 16], c: 'dark', g: 'crest', z: 1.3 },
    { t: 'e', x: 19, y: 17, rx: 6, ry: 5.2, c: 'body', g: 'head', z: 2 },
    { t: 'p', pts: [14, 16, 8, 19.5, 14, 21], c: 'beak', g: 'beak', z: 2.5 },
    { t: 'eye', x: 16.5, y: 16, s: 2.2, style: 'angry', iris: '#d83040', look: [-1, 0] },
    // near wing
    { t: 'p', pts: [29, 30, 31, 18, 36, 8, 44, 2, 56, 1, 51, 6, 57, 8, 49, 12, 55, 15, 47, 18, 52, 22, 44, 24, 47, 29, 39, 30, 40, 34, 34, 33], c: 'wing', g: 'wingF', z: 1.8 },
    { t: 'stripe', pts: [45, 3, 55, 2], w: 1.6, c: 'dark', on: 'wingF' },
    { t: 'stripe', pts: [38, 12, 50, 8], w: 0.8, c: '#70a8d8', on: 'wingF' },
    { t: 'stripe', pts: [36, 19, 48, 16], w: 0.8, c: '#70a8d8', on: 'wingF' },
    { t: 'stripe', pts: [34, 26, 44, 25], w: 0.8, c: '#70a8d8', on: 'wingF' },
  ] });

  G.defMon('ZAPDOS', { pal: { body: '#f8d030', wingL: '#fce878', wingD: '#d8a820', dark: '#2a2830', beak: '#f8b848', leg: '#e89040' }, parts: [
    // far wing (behind, darker), peeking out left of the near wing
    { t: 'p', pts: [33, 30, 31, 20, 30, 9, 34, 13, 35, 3, 39, 11, 42, 5, 43, 16, 42, 26], c: 'wingD', g: 'wingB', z: -4 },
    // spiky tail
    { t: 'p', pts: [38, 42, 48, 42, 46, 45, 59, 45, 51, 49.5, 61, 55, 48, 53, 50, 60, 42, 51, 36, 47], c: 'body', g: 'tail', z: -3 },
    { t: 'stripe', pts: [40, 45.5, 48, 47.5, 55, 52], w: 0.8, c: 'wingD', on: 'tail' },
    // legs
    { t: 'l', pts: [35, 44, 37, 51, 35, 57], w: 2.2, w2: 1.6, c: 'leg', g: 'legB', z: -1 },
    { t: 'l', pts: [31, 59, 35, 57, 39, 59], w: 1.4, c: 'leg', g: 'legB', z: -1 },
    { t: 'l', pts: [28, 45, 26, 51, 24, 57], w: 2.3, w2: 1.7, c: 'leg', g: 'legF', z: 1 },
    { t: 'l', pts: [19, 59.5, 24, 57, 29, 59.5], w: 1.5, c: 'leg', g: 'legF', z: 1 },
    // body with spiky belly feathers
    { t: 'e', x: 31, y: 38, rx: 8, ry: 9.5, rot: -30, c: 'body', g: 'body' },
    { t: 'p', pts: [25, 43, 22, 50, 28, 47, 30, 53, 33, 47, 38, 49, 36, 41], c: 'body', g: 'body' },
    // neck with spiky throat
    { t: 'c', x1: 28, y1: 33, x2: 19, y2: 23, r1: 4.6, r2: 3.4, c: 'body', g: 'body' },
    { t: 'p', pts: [21, 29, 14, 31, 19, 33, 14, 37, 22, 36, 20, 40, 27, 37], c: 'body', g: 'body' },
    // head with backswept spiky crest
    { t: 'p', pts: [16, 17, 10, 9, 17, 12.5, 16, 3, 22, 11, 27, 4, 26, 13.5, 33, 12, 25, 20, 19, 22], c: 'body', g: 'crest', z: 1.9 },
    { t: 'e', x: 17, y: 19.5, rx: 5.6, ry: 4.8, c: 'body', g: 'head', z: 2 },
    { t: 'p', pts: [13, 17.5, 1.5, 21, 13, 23.5], c: 'beak', g: 'beak', z: 2.5 },
    { t: 'stripe', pts: [2.5, 21, 12.5, 20.6], w: 0.6, c: '#a85818', on: 'beak' },
    { t: 'eye', x: 15.5, y: 18.5, s: 2.2, style: 'angry', look: [-1, 0] },
    // near wing: long jagged wing swept up and back
    { t: 'p', pts: [30, 34, 34, 25, 40, 17, 48, 9, 58, 1.5, 57, 8.5, 62.5, 9, 57, 14.5, 62, 19, 54, 21, 58, 27, 49, 27, 51, 33, 43, 32, 40, 38], c: 'body', g: 'wingF', z: 1.8 },
    { t: 'p', pts: [36, 30, 40, 22, 47, 15, 54, 9, 53, 14, 57, 15, 52, 18, 55, 22, 48, 23, 48, 28, 42, 29], c: 'wingL', g: 'wingF', z: 1.85, line: false },
    { t: 'stripe', pts: [34, 31, 42, 22, 52, 12], w: 1.1, c: 'dark', on: 'wingF' },
    { t: 'stripe', pts: [38, 34, 46, 27, 55, 19], w: 1.1, c: 'dark', on: 'wingF' },
    { t: 'stripe', pts: [41, 36, 47, 31.5, 53, 27], w: 1.1, c: 'dark', on: 'wingF' },
  ] });

  G.defMon('MOLTRES', { pal: { body: '#f8c838', fire: '#f06020', fire2: '#f8a028', fireY: '#fce060', beak: '#c89058', leg: '#c89058' }, parts: [
    // far flame wing
    { t: 'p', pts: [42, 28, 48, 18, 52, 8, 56, 14, 60, 6, 61, 15, 64, 16, 61, 23, 64, 28, 56, 28, 56, 33, 49, 31], c: 'fire', g: 'wingB', z: -4, flat: true },
    // flame tail
    { t: 'p', pts: [38, 40, 48, 38, 56, 34, 54, 40, 64, 40, 58, 46, 64, 52, 54, 51, 58, 58, 48, 53, 44, 58, 40, 50, 36, 47], c: 'fire', g: 'tail', z: -3, flat: true },
    { t: 'p', pts: [40, 42, 50, 41, 58, 42, 52, 46, 57, 52, 48, 49, 44, 53, 40, 47], c: 'fire2', g: 'tail', z: -2.9, flat: true, line: false },
    { t: 'p', pts: [41, 44, 50, 44, 52, 47, 44, 48], c: 'fireY', g: 'tail', z: -2.8, flat: true, line: false },
    // legs
    { t: 'l', pts: [34, 41, 35, 50, 33, 57], w: 1.8, w2: 1.4, c: 'leg', g: 'legB', z: -1 },
    { t: 'p', pts: [29, 59, 33, 56, 37, 59], c: 'leg', g: 'legB', z: -1 },
    { t: 'l', pts: [28, 42, 26, 51, 24, 58], w: 1.8, w2: 1.4, c: 'leg', g: 'legF', z: 1 },
    { t: 'p', pts: [20, 60, 24, 57, 28, 60], c: 'leg', g: 'legF', z: 1 },
    // body
    { t: 'e', x: 32, y: 34, rx: 9, ry: 11, rot: -25, c: 'body', g: 'body' },
    { t: 'c', x1: 28, y1: 30, x2: 20, y2: 21, r1: 5, r2: 3.8, c: 'body', g: 'body' },
    // head with flame crest sweeping back
    { t: 'p', pts: [16, 15, 12, 5, 18, 10, 18, 1, 23, 8, 28, 2, 27, 10, 33, 9, 27, 16, 22, 18], c: 'fire', g: 'crest', z: 1.9, flat: true },
    { t: 'p', pts: [18, 14, 17, 7, 21, 11, 24, 6, 24, 12, 28, 12, 23, 16], c: 'fire2', g: 'crest', z: 1.95, flat: true, line: false },
    { t: 'e', x: 19, y: 18, rx: 6, ry: 5.2, c: 'body', g: 'head', z: 2 },
    { t: 'p', pts: [14.5, 17, 5, 21, 14.5, 23], c: 'beak', g: 'beak', z: 2.5 },
    { t: 'eye', x: 17, y: 17, s: 2.2, style: 'angry', iris: '#303030', look: [-1, 0] },
    // near flame wing
    { t: 'p', pts: [30, 31, 33, 20, 38, 10, 39, 2, 44, 8, 49, 0.5, 51, 9, 58, 3, 57, 12, 64, 12, 58, 19, 63, 24, 54, 25, 57, 31, 47, 29, 44, 35, 36, 34], c: 'fire', g: 'wingF', z: 1.8, flat: true },
    { t: 'p', pts: [33, 30, 36, 20, 40, 12, 44, 15, 49, 7, 51, 15, 56, 11, 55, 18, 59, 23, 51, 23, 52, 28, 45, 27, 41, 32], c: 'fire2', g: 'wingF', z: 1.85, flat: true, line: false },
    { t: 'p', pts: [36, 29, 39, 21, 43, 19, 48, 14, 50, 20, 47, 25, 41, 27], c: 'fireY', g: 'wingF', z: 1.9, flat: true, line: false },
  ] });

  G.defMon('_SUBSTITUTE', { pal: { plush: '#f4e6cc', stitch: '#b89468', cheek: '#f0b0a0' }, parts: [
    // legs and far arm
    { t: 'e', x: 38, y: 56, rx: 5, ry: 3.5, c: 'plush', g: 'legB', z: -1 },
    { t: 'e', x: 44, y: 43, rx: 3.4, ry: 4.6, rot: -30, c: 'plush', g: 'armB', z: -1 },
    // body
    { t: 'e', x: 33, y: 46, rx: 10, ry: 10, c: 'plush', g: 'body' },
    { t: 'stripe', pts: [30, 38, 30, 54], w: 0.8, c: 'stitch', on: 'body', face: true },
    { t: 'stripe', pts: [28.5, 41, 31.5, 41], w: 0.7, c: 'stitch', on: 'body', face: true },
    { t: 'stripe', pts: [28.5, 45, 31.5, 45], w: 0.7, c: 'stitch', on: 'body', face: true },
    { t: 'stripe', pts: [28.5, 49, 31.5, 49], w: 0.7, c: 'stitch', on: 'body', face: true },
    { t: 'e', x: 27, y: 57, rx: 5.5, ry: 3.6, c: 'plush', g: 'legF', z: 1 },
    { t: 'e', x: 20, y: 44, rx: 3.6, ry: 4.8, rot: 35, c: 'plush', g: 'armF', z: 2 },
    // head with little round ears
    { t: 'e', x: 21, y: 17, rx: 4, ry: 4, c: 'plush', g: 'earF', z: 2.5 },
    { t: 'spot', x: 21, y: 17, rx: 2, ry: 2, c: 'cheek', on: 'earF' },
    { t: 'e', x: 39, y: 16, rx: 3.6, ry: 3.6, c: 'plush', g: 'earB', z: 2.4 },
    { t: 'e', x: 30, y: 27, rx: 12, ry: 10.5, c: 'plush', g: 'head', z: 3 },
    { t: 'stripe', pts: [30, 17, 31, 37], w: 0.8, c: 'stitch', on: 'head', backOnly: true },
    { t: 'spot', x: 21, y: 31, rx: 2.4, ry: 1.6, c: 'cheek', on: 'head', face: true },
    { t: 'spot', x: 36, y: 31, rx: 2.2, ry: 1.6, c: 'cheek', on: 'head', face: true },
    { t: 'eye', x: 24, y: 26, s: 1.6, style: 'dot' },
    { t: 'eye', x: 32, y: 26, s: 1.6, style: 'dot' },
    { t: 'stripe', pts: [25.5, 30.5, 28, 32, 30.5, 30.5], w: 0.9, c: '#8a6440', on: 'head', face: true },
  ] });

  G.defMon('DRATINI', { pal: { body: '#6c9ce4', belly: '#f4f4fa', fin: '#f4f4fa' }, parts: [
    // coiled body
    { t: 'l', pts: [25, 31, 31, 40, 26, 48, 30, 55, 41, 55.5, 48, 51, 52, 45, 57, 46], w: 11, w2: 4, c: 'body', g: 'body', z: -1 },
    { t: 'stripe', pts: [21, 32, 27, 40, 22, 48, 27, 58.5, 41, 59, 50, 54.5], w: 6, c: 'belly', on: 'body', face: true },
    // ear fins
    { t: 'p', pts: [27, 22, 35, 16, 33, 21, 38, 22, 33, 25, 36, 29, 28, 28], c: 'fin', g: 'fin', z: 0.5 },
    // head
    { t: 'e', x: 22, y: 25, rx: 7.5, ry: 7, c: 'body', g: 'head', z: 1 },
    { t: 'e', x: 15.5, y: 28, rx: 4.5, ry: 3.6, c: 'body', g: 'head', z: 1 },
    { t: 'spot', x: 14, y: 30.5, rx: 4, ry: 1.8, c: 'belly', on: 'head', face: true },
    { t: 'e', x: 19.5, y: 18.5, rx: 2, ry: 1.6, c: 'fin', g: 'nub', z: 1.5 },
    { t: 'eye', x: 18.5, y: 24.5, s: 2.8, iris: '#302848', look: [-1, 0] },
    { t: 'eye', x: 25, y: 24.5, s: 2.4, iris: '#302848', look: [-1, 0] },
    { t: 'mouth', x: 14, y: 29, w: 1.5, style: 'smile' },
  ] });

  G.defMon('DRAGONAIR', { pal: { body: '#5c94e4', belly: '#f4f4fa', wing: '#f4f4fa', orb: '#2c6ce0', horn: '#f4f4fa' }, parts: [
    // body S-curve rising into tail
    { t: 'l', pts: [24, 21, 29, 32, 26, 43, 30, 52, 42, 55.5, 52, 52, 56, 43, 54, 34, 52, 27], w: 11.5, w2: 3.5, c: 'body', g: 'body', z: -1 },
    { t: 'stripe', pts: [19.5, 23, 25, 33, 21.5, 43, 26, 55.5, 42, 59.5, 54, 55.5], w: 6.5, c: 'belly', on: 'body', face: true },
    { t: 'l', pts: [52, 27, 51, 22, 53, 18], w: 2.4, w2: 1.2, c: 'body', g: 'tailTip', z: -1.5 },
    { t: 'e', x: 53.5, y: 33, rx: 3, ry: 3, c: 'orb', g: 'orb2', z: 0, gloss: true },
    { t: 'e', x: 52, y: 26.5, rx: 2.7, ry: 2.7, c: 'orb', g: 'orb3', z: 0, gloss: true },
    // wing ears
    { t: 'p', pts: [23, 13, 30, 7, 35, 6, 33, 10, 37, 11, 33, 14, 35, 17, 28, 17], c: 'wing', g: 'wingB', z: 0.5 },
    // head
    { t: 'e', x: 19, y: 15, rx: 6.5, ry: 6, c: 'body', g: 'head', z: 1 },
    { t: 'e', x: 13, y: 17.5, rx: 4.5, ry: 3.2, c: 'body', g: 'head', z: 1 },
    { t: 'spot', x: 12, y: 20, rx: 4, ry: 1.6, c: 'belly', on: 'head', face: true },
    { t: 'p', pts: [15, 10, 13, 2, 18, 9], c: 'horn', g: 'horn', z: 1.2 },
    { t: 'p', pts: [21, 13, 26, 5, 31, 3, 28, 8, 31, 9, 26, 13, 28, 16, 22, 17], c: 'wing', g: 'wingF', z: 1.5 },
    { t: 'eye', x: 16, y: 14.5, s: 2.4, iris: '#302848', look: [-1, 0] },
    { t: 'mouth', x: 11.5, y: 18.5, w: 1.3, style: 'smile' },
    // neck orb
    { t: 'e', x: 21, y: 25, rx: 3.2, ry: 3.2, c: 'orb', g: 'orb1', z: 1.5, gloss: true, face: true },
    { t: 'shine', x: 20, y: 24 },
  ] });

  G.defMon('DRAGONITE', { pal: { body: '#f4a850', belly: '#f8e2a8', wing: '#58a898', stripe: '#d8b070' }, parts: [
    // wings (teal membrane on orange frame)
    { t: 'p', pts: [38, 27, 46, 14, 54, 9, 62, 16, 58, 18, 60, 25, 55, 26, 55, 33, 49, 32, 44, 35], c: 'wing', g: 'wingB', z: -3 },
    { t: 'l', pts: [38, 27, 46, 14, 54, 9, 62, 16], w: 2.4, w2: 1.4, c: 'body', g: 'wingB', z: -2.9 },
    // tail
    { t: 'l', pts: [42, 50, 52, 55, 60, 54, 63, 50], w: 8, w2: 2, c: 'body', g: 'tail', z: -2 },
    // legs
    { t: 'e', x: 42, y: 53, rx: 5.5, ry: 6, c: 'body', g: 'legB', z: -1 },
    { t: 'e', x: 44, y: 58, rx: 5, ry: 2.5, c: 'body', g: 'legB', z: -1 },
    // body
    { t: 'e', x: 34, y: 40, rx: 13, ry: 16, c: 'body', g: 'body' },
    { t: 'spot', x: 30, y: 43, rx: 8.5, ry: 13, c: 'belly', on: 'body', face: true },
    { t: 'stripe', pts: [22, 36, 37, 36], w: 1, c: 'stripe', on: 'body', face: true },
    { t: 'stripe', pts: [22, 41, 38, 41], w: 1, c: 'stripe', on: 'body', face: true },
    { t: 'stripe', pts: [22, 46, 38, 46], w: 1, c: 'stripe', on: 'body', face: true },
    { t: 'stripe', pts: [23, 51, 37, 51], w: 1, c: 'stripe', on: 'body', face: true },
    { t: 'e', x: 27, y: 54, rx: 6, ry: 6, c: 'body', g: 'legF', z: 1 },
    { t: 'e', x: 25, y: 58.5, rx: 5.5, ry: 2.6, c: 'body', g: 'legF', z: 1 },
    // head
    { t: 'c', x1: 30, y1: 28, x2: 24, y2: 20, r1: 5, r2: 4.5, c: 'body', g: 'body', z: 0 },
    { t: 'l', pts: [22, 10, 18, 4, 13, 2, 11, 4], w: 1.6, w2: 1, c: 'body', g: 'ant1', z: 1.5 },
    { t: 'l', pts: [27, 10, 28, 4, 32, 1, 34, 3], w: 1.6, w2: 1, c: 'body', g: 'ant2', z: 1 },
    { t: 'e', x: 23, y: 16, rx: 8, ry: 7, c: 'body', g: 'head', z: 2 },
    { t: 'e', x: 16, y: 19, rx: 5.5, ry: 4.2, c: 'body', g: 'head', z: 2 },
    { t: 'p', pts: [18, 11, 18.5, 7, 21, 10], c: 'body', g: 'head', z: 2 },
    { t: 'eye', x: 19.5, y: 15, s: 2.6, iris: '#302830', look: [-1, 0] },
    { t: 'eye', x: 26, y: 15, s: 2.4, iris: '#302830', look: [-1, 0] },
    { t: 'mouth', x: 14.5, y: 20, w: 2, style: 'smile' },
    { t: 'e', x: 11.5, y: 18, rx: 0.6, ry: 0.6, c: '#8a5a30', g: 'nos', z: 2.5, flat: true, face: true },
    // near wing tip peeking and arm
    { t: 'p', pts: [30, 26, 34, 16, 38, 13, 38, 20, 36, 28], c: 'wing', g: 'wingF', z: -0.5 },
    { t: 'c', x1: 25, y1: 32, x2: 18, y2: 38, r1: 3.4, r2: 3, c: 'body', g: 'armF', z: 3 },
    { t: 'e', x: 16.5, y: 39, rx: 3, ry: 2.8, c: 'body', g: 'armF', z: 3 },
  ] });

  G.defMon('MEWTWO', { pal: { body: '#d0c4dc', purple: '#9a6cbc' }, parts: [
    // tail
    { t: 'l', pts: [38, 42, 48, 49, 56, 47, 61, 39, 60, 28], w: 7, w2: 6.4, c: 'body', g: 'tail', z: -3 },
    { t: 'stripe', pts: [58, 44, 61, 38, 60, 25], w: 8, c: 'purple', on: 'tail' },
    // far arm
    { t: 'c', x1: 36, y1: 24, x2: 42, y2: 32, r1: 2.6, r2: 2, c: 'body', g: 'armB', z: -2 },
    { t: 'c', x1: 42, y1: 32, x2: 44, y2: 38, r1: 2, r2: 1.8, c: 'body', g: 'armB', z: -2 },
    { t: 'e', x: 44.5, y: 39.5, rx: 2.2, ry: 2, c: 'body', g: 'armB', z: -2 },
    // far leg
    { t: 'e', x: 37.5, y: 45, rx: 6, ry: 7.5, c: 'body', g: 'legB', z: -1 },
    { t: 'c', x1: 38, y1: 50, x2: 39, y2: 58, r1: 2.8, r2: 2.2, c: 'body', g: 'legB', z: -1 },
    { t: 'e', x: 39.5, y: 59, rx: 3, ry: 1.6, c: 'body', g: 'legB', z: -1 },
    // torso
    { t: 'e', x: 31, y: 37, rx: 6.5, ry: 7.5, c: 'purple', g: 'abd' },
    { t: 'e', x: 30, y: 26, rx: 9.5, ry: 7.5, c: 'body', g: 'chest', z: 0.5 },
    { t: 'e', x: 36.5, y: 23.5, rx: 4, ry: 3.6, c: 'body', g: 'chest', z: 0.5 },
    // near leg
    { t: 'e', x: 27.5, y: 46, rx: 6.5, ry: 8, c: 'body', g: 'legF', z: 1 },
    { t: 'c', x1: 27, y1: 51, x2: 26, y2: 58, r1: 3, r2: 2.4, c: 'body', g: 'legF', z: 1 },
    { t: 'e', x: 24.5, y: 59.5, rx: 3.4, ry: 1.7, c: 'body', g: 'legF', z: 1 },
    // head, horns and neck tube
    { t: 'c', x1: 28, y1: 20, x2: 25, y2: 15, r1: 2.6, r2: 2.4, c: 'body', g: 'neck', z: 1.5 },
    { t: 'l', pts: [27, 12, 31, 14, 33, 18, 33, 22], w: 2.8, w2: 2.6, c: 'body', g: 'tube', z: 1.2 },
    { t: 'p', pts: [18, 8, 16, 1, 22, 6], c: 'body', g: 'head', z: 2 },
    { t: 'p', pts: [24, 6, 27, 0.5, 28, 8], c: 'body', g: 'head', z: 2 },
    { t: 'e', x: 22, y: 11, rx: 6.2, ry: 5.4, c: 'body', g: 'head', z: 2 },
    { t: 'e', x: 17.5, y: 13, rx: 3.4, ry: 2.8, c: 'body', g: 'head', z: 2 },
    { t: 'eye', x: 19, y: 11, s: 2.2, style: 'angry', iris: '#8a48b8', look: [-1, 0], flip: true },
    { t: 'eye', x: 24, y: 11, s: 2, style: 'angry', iris: '#8a48b8', look: [-1, 0] },
    { t: 'mouth', x: 16.5, y: 14.5, w: 1.2, style: 'line' },
    // near arm reaching forward with three round fingers
    { t: 'e', x: 24.5, y: 23.5, rx: 4.2, ry: 3.8, c: 'body', g: 'armF', z: 3 },
    { t: 'c', x1: 24, y1: 25, x2: 19, y2: 31, r1: 3.2, r2: 2.4, c: 'body', g: 'armF', z: 3 },
    { t: 'c', x1: 19, y1: 31, x2: 13, y2: 33, r1: 2.2, r2: 1.9, c: 'body', g: 'armF', z: 3 },
    { t: 'l', pts: [12, 33, 9, 30.5, 8, 29], w: 1.4, w2: 1.2, c: 'body', g: 'armF', z: 3 },
    { t: 'l', pts: [12, 33, 8, 33.5, 7, 33], w: 1.4, w2: 1.2, c: 'body', g: 'armF', z: 3 },
    { t: 'l', pts: [12, 34, 9, 36.5, 8, 37], w: 1.4, w2: 1.2, c: 'body', g: 'armF', z: 3 },
    { t: 'e', x: 8, y: 29, rx: 1.3, ry: 1.3, c: 'body', g: 'armF', z: 3 },
    { t: 'e', x: 6.5, y: 33, rx: 1.3, ry: 1.3, c: 'body', g: 'armF', z: 3 },
    { t: 'e', x: 8, y: 37, rx: 1.3, ry: 1.3, c: 'body', g: 'armF', z: 3 },
  ] });

  G.defMon('MEW', { pal: { body: '#f8b8d0' }, parts: shift([
    // long thin tail with oval tip
    { t: 'l', pts: [38, 42, 46, 48, 53, 44, 56, 34, 55, 24], w: 1.8, w2: 1.8, c: 'body', g: 'tail', z: -2 },
    { t: 'e', x: 55, y: 20.5, rx: 3, ry: 4.4, c: 'body', g: 'tail', z: -2 },
    // body and limbs
    { t: 'c', x1: 36, y1: 43, x2: 40, y2: 49, r1: 2.6, r2: 2.2, c: 'body', g: 'legB', z: -1 },
    { t: 'e', x: 41.5, y: 51, rx: 2.6, ry: 3.4, rot: -20, c: 'body', g: 'legB', z: -1 },
    { t: 'e', x: 33, y: 38, rx: 6, ry: 7, rot: -15, c: 'body', g: 'body' },
    { t: 'c', x1: 31, y1: 43, x2: 30, y2: 49, r1: 2.8, r2: 2.4, c: 'body', g: 'legF', z: 1 },
    { t: 'e', x: 29, y: 51, rx: 2.8, ry: 3.6, rot: 15, c: 'body', g: 'legF', z: 1 },
    { t: 'c', x1: 28, y1: 37, x2: 23, y2: 40, r1: 1.8, r2: 1.6, c: 'body', g: 'armF', z: 2 },
    // head with big ears
    { t: 'p', pts: [17, 22, 16, 13, 24, 18], c: 'body', g: 'head', z: 3 },
    { t: 'p', pts: [30, 17, 36, 11, 36, 21], c: 'body', g: 'head', z: 3 },
    { t: 'e', x: 26, y: 26, rx: 9.5, ry: 8.5, c: 'body', g: 'head', z: 3 },
    { t: 'eye', x: 21.5, y: 26, s: 3.6, iris: '#3c78d8', look: [-1, 0] },
    { t: 'eye', x: 29.5, y: 26, s: 3.2, iris: '#3c78d8', look: [-1, 0] },
    { t: 'mouth', x: 24, y: 31.5, w: 1.5, style: 'smile' },
  ], 0, -4) });

  // @@END
})();
