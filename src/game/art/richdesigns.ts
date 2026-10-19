/**
 * Hand-designed Wildkin drawn with the detailed renderer in rich.ts.
 * Each design paints back to front on a 48x48 grid, ground line at y = 46.
 * `back` draws the view from behind (no face) for the player's side of battle.
 * Wildkin without an entry here use the procedural archetype art.
 */
import { Pix, ramp, OUT } from './rich';

type Design = (p: Pix, back: boolean) => void;

const W = '#ffffff';

// ---------------------------------------------------------------- Sproutle line
// A seedling hare: leaf-shaped ears, a sprouting bud on its head, cream muzzle and belly.

const leafGreen = ramp('#6cc44c');
const deepLeaf = ramp('#3f9a45');
const cream = ramp('#f2eec4', '#5a4a6a');
const budPink = ramp('#f0709a');
const veinLight = '#c6f07a';

const eyeBig = ['.kkk.', 'kwwgk', 'kwggk', 'kgddk', 'kgddk', '.kkk.'];
const eyePal = { k: OUT, w: W, g: '#3c8c4a', d: '#14261a' };

const sproutle: Design = (p, back) => {
  // ears, behind the head
  p.leaf(19, 17, 14, 1, 3.2, leafGreen, { vein: veinLight });
  p.leaf(29, 17, 34, 1, 3.2, leafGreen, { vein: veinLight });
  // feet and body
  p.ellipse(18.5, 44, 5, 2.6, leafGreen);
  p.ellipse(29.5, 44, 5, 2.6, leafGreen);
  p.ellipse(24, 36.5, 8.5, 8, leafGreen);
  if (back) p.ellipse(24, 40, 3.6, 3.2, cream);
  else p.ellipse(24, 38.5, 5, 5.2, cream, { lineIn: false });
  p.ellipse(15.5, 35.5, 2.6, 3.6, leafGreen, { rot: 20 });
  p.ellipse(32.5, 35.5, 2.6, 3.6, leafGreen, { rot: -20 });
  // leafy cheek tufts, then the head
  p.leaf(15, 25, 9.5, 28, 2.2, leafGreen);
  p.leaf(33, 25, 38.5, 28, 2.2, leafGreen);
  p.ellipse(24, 22.5, 11.5, 9.5, leafGreen);
  // sprout: stem, two leaves, bud
  p.line(24, 14, 24, 9, deepLeaf[1], 2);
  p.leaf(24, 11, 18, 8, 2.2, deepLeaf);
  p.leaf(25, 11, 31, 8, 2.2, deepLeaf);
  p.ellipse(24.5, 7, 2.4, 2.8, budPink);
  p.px(24, 4, budPink[1]);
  if (back) return;
  // face
  p.ellipse(24, 27.5, 4.2, 2.4, cream, { lineIn: false });
  p.stamp(16, 20, eyeBig, eyePal);
  p.stamp(27, 20, eyeBig, eyePal);
  p.stamp(23, 25, ['nn'], { n: '#3a2a3a' });
  p.stamp(22, 27, ['k...k', '.kpk.'], { k: OUT, p: '#e8606a' });
  // toes
  for (const fx of [15, 18, 27, 30]) p.px(fx + 1, 45, leafGreen[0]);
  p.px(14, 25, '#f497a8');
  p.px(15, 25, '#f497a8');
  p.px(33, 25, '#f497a8');
  p.px(34, 25, '#f497a8');
};

/** Five round petals around a centre, for blossoms. */
function blossom(p: Pix, x: number, y: number, r: number, petal = budPink, centre = '#ffd84a') {
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    p.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75, r * 0.75, petal, { lineIn: k > 0 });
  }
  p.px(x - 0.5, y - 0.5, centre);
  if (r >= 2) {
    p.px(x + 0.5, y - 0.5, centre);
    p.px(x - 0.5, y + 0.5, '#e0a020');
    p.px(x + 0.5, y + 0.5, '#e0a020');
  }
}

/** Thorny vine wrapped across a leaf ear: diagonal bands with little thorns. */
function vineBands(p: Pix, bx: number, by: number, tx: number, ty: number, w: number, n: number) {
  const vine = '#7c5a34';
  const thorn = '#d8c890';
  for (let k = 1; k <= n; k++) {
    const t = k / (n + 1);
    const cx = bx + (tx - bx) * t;
    const cy = by + (ty - by) * t;
    p.line(cx - w, cy + 1, cx + w, cy - 1, vine);
    p.px(cx - 0.5, cy - 0.5, thorn);
  }
}

const brambleGreen = ramp('#4cae4c');
const sharpL = ['kk....', 'kwgkk.', 'kggddk', '.kkkk.'];

const bramblebun: Design = (p, back) => {
  // long ears wrapped in thorny vines
  p.leaf(19, 15, 12, 0, 3.6, brambleGreen, { vein: veinLight });
  p.leaf(29, 15, 36, 0, 3.6, brambleGreen, { vein: veinLight });
  vineBands(p, 19, 15, 12, 0, 2.5, 2);
  vineBands(p, 29, 15, 36, 0, 2.5, 2);
  // big stomping feet and legs
  p.ellipse(14.5, 44.5, 6.5, 2.6, brambleGreen);
  p.ellipse(33.5, 44.5, 6.5, 2.6, brambleGreen);
  p.ellipse(17, 39.5, 5, 5.5, brambleGreen);
  p.ellipse(31, 39.5, 5, 5.5, brambleGreen);
  // body
  p.ellipse(24, 33.5, 10, 9, brambleGreen);
  if (back) p.ellipse(24, 39, 4, 3.4, cream);
  else p.ellipse(24, 35.5, 6, 6, cream, { lineIn: false });
  p.ellipse(13, 32.5, 3, 5, brambleGreen, { rot: 18 });
  p.ellipse(35, 32.5, 3, 5, brambleGreen, { rot: -18 });
  // leaf collar with a blossom
  p.leaf(21, 27, 12, 28.5, 2.6, deepLeaf);
  p.leaf(27, 27, 36, 28.5, 2.6, deepLeaf);
  p.leaf(22, 28, 17, 32, 2.2, deepLeaf);
  p.leaf(26, 28, 31, 32, 2.2, deepLeaf);
  // head and leafy crown
  p.leaf(24, 13, 18, 5, 2.4, deepLeaf);
  p.leaf(24, 13, 30, 5, 2.4, deepLeaf);
  p.leaf(24, 13, 24, 3, 2.4, deepLeaf, { vein: veinLight });
  p.ellipse(24, 19.5, 11, 8.5, brambleGreen);
  p.leaf(14, 22, 9, 25, 2, brambleGreen);
  p.leaf(34, 22, 39, 25, 2, brambleGreen);
  blossom(p, 24, 6, 1.6);
  if (back) return;
  blossom(p, 24, 28.5, 2.2);
  p.ellipse(24, 23.5, 4.4, 2.6, cream, { lineIn: false });
  p.stamp(15, 17, sharpL, eyePal);
  p.stamp(27, 17, sharpL, eyePal, true);
  p.px(31, 18, W);
  p.px(32, 18, eyePal.g);
  p.stamp(23, 21, ['nn'], { n: '#3a2a3a' });
  p.stamp(22, 23, ['k...k', '.kkk.'], { k: OUT });
  p.px(13, 22, '#f497a8');
  p.px(35, 22, '#f497a8');
  for (const fx of [11, 14, 32, 35]) p.px(fx + 1, 46, brambleGreen[0]);
};

const sageGreen = ramp('#3e9c4a');
const mantle = ramp('#2c7a3e');
const bloomPink = ramp('#f070b0');
const gem = ramp('#48c0f0', '#1a2a6a', '#f0ffff');
const vineBrown = ramp('#8a6438');

const thornhare: Design = (p, back) => {
  // ears, blossoms at their bases
  p.leaf(19.5, 12, 13, 0, 3.2, sageGreen, { vein: veinLight });
  p.leaf(28.5, 12, 35, 0, 3.2, sageGreen, { vein: veinLight });
  // leaf mantle draped from the shoulders
  p.leaf(17, 21, 3, 36, 5.5, mantle, { vein: '#5cb85a' });
  p.leaf(31, 21, 45, 36, 5.5, mantle, { vein: '#5cb85a' });
  // legs and feet
  p.ellipse(13.5, 45, 7, 2.4, sageGreen);
  p.ellipse(34.5, 45, 7, 2.4, sageGreen);
  p.ellipse(16.5, 40, 5.5, 5.5, sageGreen);
  p.ellipse(31.5, 40, 5.5, 5.5, sageGreen);
  // torso
  p.poly([[13, 24], [35, 24], [33, 38], [24, 41], [15, 38]], sageGreen);
  if (back) p.ellipse(24, 39, 4, 3.2, cream);
  else p.ellipse(24, 30, 6.5, 6.5, cream, { lineIn: false });
  // arms down to vine-wrapped fists
  p.ellipse(12, 29, 3.4, 6, sageGreen, { rot: 14 });
  p.ellipse(36, 29, 3.4, 6, sageGreen, { rot: -14 });
  p.ellipse(10.5, 35.5, 3.8, 3.4, sageGreen);
  p.ellipse(37.5, 35.5, 3.8, 3.4, sageGreen);
  for (const [a, b] of [[7, 13], [35, 41]]) {
    p.line(a, 33, b, 32, vineBrown[1]);
    p.line(a, 35, b, 34, vineBrown[3]);
  }
  // head
  p.ellipse(24, 15.5, 10.5, 8, sageGreen);
  p.leaf(15.5, 18, 10.5, 21, 1.8, sageGreen);
  p.leaf(32.5, 18, 37.5, 21, 1.8, sageGreen);
  // blossoms on the shoulders and at the ears
  blossom(p, 14.5, 23, 2.3, bloomPink);
  blossom(p, 33.5, 23, 2.3, bloomPink);
  const tiny = ['.p.', 'pyp', '.p.'];
  p.stamp(17, 8, tiny, { p: bloomPink[3], y: '#ffd84a' });
  p.stamp(29, 8, tiny, { p: bloomPink[3], y: '#ffd84a' });
  if (back) return;
  // gem, eyes with brows, muzzle
  p.stamp(23, 9, ['.g.', 'ghg', '.g.'], { g: gem[2], h: gem[4] });
  p.px(24, 11, gem[1]);
  p.stamp(17, 14, sharpL, eyePal);
  p.stamp(26, 14, sharpL, eyePal, true);
  p.px(30, 15, W);
  p.px(31, 15, eyePal.g);
  p.line(16, 12.5, 21, 13.5, sageGreen[0]);
  p.line(27, 13.5, 32, 12.5, sageGreen[0]);
  p.ellipse(24, 20, 4, 2.3, cream, { lineIn: false });
  p.stamp(23, 18, ['nn'], { n: '#3a2a3a' });
  p.stamp(22, 20, ['k...k', '.kkk.'], { k: OUT });
  for (const fx of [10, 13, 33, 36]) p.px(fx + 1, 46, sageGreen[0]);
};

export const RICH: Record<string, Design> = {
  Sproutle: sproutle,
  Bramblebun: bramblebun,
  Thornhare: thornhare,
};
