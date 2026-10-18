import { makeCanvas } from '../core/gfx';

/** Builds a canvas from rows of palette characters ('.' = transparent). */
export function fromStrings(rows: string[], pal: Record<string, string>): HTMLCanvasElement {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const c = makeCanvas(w, h);
  const x = c.getContext('2d')!;
  rows.forEach((row, y) => {
    for (let i = 0; i < row.length; i++) {
      const col = pal[row[i]];
      if (col) {
        x.fillStyle = col;
        x.fillRect(i, y, 1, 1);
      }
    }
  });
  return c;
}

export function mirror(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = makeCanvas(src.width, src.height);
  const x = c.getContext('2d')!;
  x.translate(src.width, 0);
  x.scale(-1, 1);
  x.drawImage(src, 0, 0);
  return c;
}

const silCache = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>();

/** Silhouette of a sprite in one colour (used for evolution flashes and catches). Cached. */
export function silhouette(src: HTMLCanvasElement, color: string): HTMLCanvasElement {
  let byColor = silCache.get(src);
  if (!byColor) {
    byColor = new Map();
    silCache.set(src, byColor);
  }
  const hit = byColor.get(color);
  if (hit) return hit;
  const c = makeCanvas(src.width, src.height);
  byColor.set(color, c);
  const x = c.getContext('2d')!;
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return '#' + r.map((v) => v.toString(16).padStart(2, '0')).join('');
}
