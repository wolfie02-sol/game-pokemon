import { drawText } from './font';

export const W = 160;
export const H = 144;

export const UI = {
  ink: '#1a1626',
  paper: '#f8f4e8',
  paperShade: '#e4dcc8',
  frame: '#3a3450',
  accent: '#e0483c',
  muted: '#8a8296',
  hpGreen: '#3cc058',
  hpYellow: '#f0b828',
  hpRed: '#e04030',
  expBlue: '#4c8ef0',
  bg: '#0d0c16',
};

export function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Handheld-style framed text box: dark outer line, light inner gap, dark inner line. */
export function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  panel(ctx, x, y, w, h);
}

/** Box variant that keeps corners opaque on top of other drawing. */
export function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  rect(ctx, x + 1, y, w - 2, h, UI.ink);
  rect(ctx, x, y + 1, w, h - 2, UI.ink);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, UI.paper);
  rect(ctx, x + 2, y + 2, w - 4, h - 4, UI.frame);
  rect(ctx, x + 3, y + 3, w - 6, h - 6, UI.paper);
}

export function cursor(ctx: CanvasRenderingContext2D, x: number, y: number, color = UI.ink) {
  drawText(ctx, '▶', x, y, color);
}

export function hpColor(frac: number): string {
  if (frac > 0.5) return UI.hpGreen;
  if (frac > 0.2) return UI.hpYellow;
  return UI.hpRed;
}

/** HP bar with "HP" label. Width is the inner bar width. */
export function hpBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, frac: number) {
  rect(ctx, x, y, 12, 5, UI.ink);
  // tiny "HP" label drawn as pixels to fit in 5px height
  ctx.fillStyle = '#f0c030';
  const px = (dx: number, dy: number) => ctx.fillRect(x + 1 + dx, y + dy, 1, 1);
  // H
  [0, 1, 2, 3, 4].forEach((dy) => {
    px(0, dy);
    px(2, dy);
  });
  px(1, 2);
  // P
  [0, 1, 2, 3, 4].forEach((dy) => px(4, dy));
  px(5, 0);
  px(6, 1);
  px(5, 2);
  rect(ctx, x + 12, y, w + 2, 5, UI.ink);
  rect(ctx, x + 13, y + 1, w, 3, '#5a5268');
  const f = Math.max(0, Math.min(1, frac));
  const fw = Math.ceil(w * f);
  if (fw > 0) {
    rect(ctx, x + 13, y + 1, fw, 3, hpColor(f));
    rect(ctx, x + 13, y + 1, fw, 1, 'rgba(255,255,255,0.35)');
  }
}

export function expBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, frac: number) {
  rect(ctx, x, y, w + 2, 3, UI.ink);
  rect(ctx, x + 1, y + 1, w, 1, '#5a5268');
  const fw = Math.floor(w * Math.max(0, Math.min(1, frac)));
  if (fw > 0) rect(ctx, x + 1, y + 1, fw, 1, UI.expBlue);
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Fade overlay quantised to 4 steps so it reads like palette fading. */
export function fadeOverlay(ctx: CanvasRenderingContext2D, amount: number, color = '#000') {
  const steps = Math.round(Math.max(0, Math.min(1, amount)) * 4) / 4;
  if (steps <= 0) return;
  ctx.globalAlpha = steps;
  rect(ctx, 0, 0, W, H, color);
  ctx.globalAlpha = 1;
}

export const TYPE_COLORS: Record<string, string> = {
  BEAST: '#a89c88',
  FLAME: '#f07830',
  TIDE: '#4890f0',
  LEAF: '#58b848',
  VOLT: '#f0c828',
  FROST: '#78d0e8',
  BRAWL: '#c04838',
  TOXIN: '#a858c0',
  EARTH: '#d0a850',
  GALE: '#98a8f0',
  MIND: '#f060a0',
  SWARM: '#98b828',
  STONE: '#a08850',
  SHADE: '#6858a0',
  WYRM: '#7058e8',
};
