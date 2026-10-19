/**
 * Detailed pixel-art renderer for hand-designed Wildkin.
 *
 * A design is a small function that layers shapes back to front on a 48x48 grid:
 * lit ellipses and polygons with five-tone colour ramps (hue-shifted shadows and
 * highlights), inner contour lines where a shape overlaps one behind it, a dark
 * outer outline, and pixel stamps for eyes and mouths. Everything is still drawn
 * in code at runtime; there are no image files.
 *
 * To tweak a creature, edit its design in richdesigns.ts and run
 * `node tools/spriteview.mjs <name>` to see the front, back and party icon side by side.
 */
import { makeCanvas } from '../core/gfx';
import { mix } from './pixel';

export const SIZE = 48;
export const OUT = '#181224';

/** deep (inner lines), dark, mid, light, highlight */
export type Ramp = [string, string, string, string, string];

/** Build a five-tone ramp from a base colour: cool purple shadows, warm light. */
export function ramp(base: string, shadow = '#24164a', light = '#fff6d2'): Ramp {
  return [mix(base, shadow, 0.66), mix(base, shadow, 0.36), base, mix(base, light, 0.34), mix(base, light, 0.72)];
}

type Pt = [number, number];
const L = (() => {
  const v = [-0.45, -0.65, 0.62];
  const n = Math.hypot(v[0], v[1], v[2]);
  return v.map((x) => x / n);
})();

export interface ShapeOpts {
  /** draw a dark contour where this shape overlaps an earlier one (default true) */
  lineIn?: boolean;
  /** use a single tone of the ramp instead of lighting (0-4) */
  flat?: number;
  /** extra light/dark bias, roughly -0.3 .. 0.3 */
  bias?: number;
  /** only paint where something is already drawn (for markings) */
  onTop?: boolean;
}

export class Pix {
  col: (string | null)[] = new Array(SIZE * SIZE).fill(null);
  id = new Int16Array(SIZE * SIZE);
  private next = 1;

  get(x: number, y: number): string | null {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return null;
    return this.col[y * SIZE + x];
  }

  px(x: number, y: number, c: string | null) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    this.col[y * SIZE + x] = c;
  }

  private tone(r: Ramp, i: number, o: ShapeOpts): string {
    if (o.flat !== undefined) return r[o.flat];
    i += o.bias ?? 0;
    return i > 0.95 ? r[4] : i > 0.66 ? r[3] : i > 0.3 ? r[2] : r[1];
  }

  /** Paint a mask with a per-pixel normal function. */
  private fill(inside: (x: number, y: number) => boolean, normal: (x: number, y: number) => [number, number, number], r: Ramp, o: ShapeOpts) {
    const sid = this.next++;
    const mask = new Uint8Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) if (inside(x, y) && (!o.onTop || this.col[y * SIZE + x] !== null)) mask[y * SIZE + x] = 1;
    const at = (x: number, y: number) => x >= 0 && y >= 0 && x < SIZE && y < SIZE && mask[y * SIZE + x] === 1;
    const lineIn = o.lineIn ?? true;
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        if (!at(x, y)) continue;
        const k = y * SIZE + x;
        let edgeOverOther = false;
        if (lineIn) {
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx;
            const ny = y + dy;
            if (at(nx, ny)) continue;
            const nk = ny * SIZE + nx;
            if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && this.col[nk] !== null && this.id[nk] !== sid) edgeOverOther = true;
          }
        }
        if (edgeOverOther) this.col[k] = r[0];
        else {
          const [a, b, c] = normal(x, y);
          this.col[k] = this.tone(r, a * L[0] + b * L[1] + c * L[2], o);
        }
        this.id[k] = sid;
      }
  }

  /** Lit ellipse; rot in degrees. */
  ellipse(cx: number, cy: number, rx: number, ry: number, r: Ramp, o: ShapeOpts & { rot?: number } = {}) {
    const a = ((o.rot ?? 0) * Math.PI) / 180;
    const cs = Math.cos(a);
    const sn = Math.sin(a);
    const loc = (x: number, y: number) => {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      return [(dx * cs + dy * sn) / rx, (-dx * sn + dy * cs) / ry];
    };
    this.fill(
      (x, y) => {
        const [u, v] = loc(x, y);
        return u * u + v * v <= 1;
      },
      (x, y) => {
        const [u, v] = loc(x, y);
        const z = Math.sqrt(Math.max(0, 1 - u * u - v * v));
        return [u * cs - v * sn, u * sn + v * cs, z];
      },
      r,
      o,
    );
  }

  /** Lit polygon, shaded like a soft pillow from its edges. */
  poly(pts: Pt[], r: Ramp, o: ShapeOpts = {}) {
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
    // distance to the edge gives a dome-shaped height field
    const d = new Float32Array(SIZE * SIZE).fill(0);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) d[y * SIZE + x] = inP(x, y) ? 999 : 0;
    for (let pass = 0; pass < 2; pass++) {
      const ys = pass ? [...Array(SIZE).keys()].reverse() : [...Array(SIZE).keys()];
      for (const y of ys)
        for (const x of pass ? [...Array(SIZE).keys()].reverse() : [...Array(SIZE).keys()]) {
          const k = y * SIZE + x;
          if (!d[k]) continue;
          const s = pass ? 1 : -1;
          const nb = (xx: number, yy: number) => (xx < 0 || yy < 0 || xx >= SIZE || yy >= SIZE ? 0 : d[yy * SIZE + xx]);
          d[k] = Math.min(d[k], nb(x + s, y) + 1, nb(x, y + s) + 1, nb(x + s, y + s) + 1.41, nb(x - s, y + s) + 1.41);
        }
    }
    let max = 1;
    for (const v of d) if (v < 999) max = Math.max(max, v);
    const R = Math.max(1.5, max * 0.9);
    const h = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return 0;
      const t = Math.min(1, d[y * SIZE + x] / R);
      return R * Math.sqrt(1 - (1 - t) * (1 - t));
    };
    this.fill(
      inP,
      (x, y) => {
        const gx = (h(x + 1, y) - h(x - 1, y)) / 2;
        const gy = (h(x, y + 1) - h(x, y - 1)) / 2;
        const n = Math.hypot(gx, gy, 1);
        return [-gx / n, -gy / n, 1 / n];
      },
      r,
      o,
    );
  }

  /** A leaf or petal: a pointed oval from base to tip with the given half-width. */
  leaf(bx: number, by: number, tx: number, ty: number, w: number, r: Ramp, o: ShapeOpts & { vein?: string } = {}) {
    const dx = tx - bx;
    const dy = ty - by;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    const pts: Pt[] = [];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const half = w * Math.sin(Math.PI * Math.pow(t, 0.8));
      pts.push([bx + dx * t - uy * half, by + dy * t + ux * half]);
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const half = w * Math.sin(Math.PI * Math.pow(t, 0.8));
      pts.push([bx + dx * t + uy * half, by + dy * t - ux * half]);
    }
    this.poly(pts, r, o);
    if (o.vein) this.line(bx + ux, by + uy, bx + dx * 0.78, by + dy * 0.78, o.vein);
  }

  line(x0: number, y0: number, x1: number, y1: number, c: string, width = 1) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = y0 + ((y1 - y0) * i) / n;
      for (let w = 0; w < width; w++) this.px(Math.floor(x + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? w : 0)), Math.floor(y + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 0 : w)), c);
    }
  }

  /** Stamp rows of palette characters; '.' is skipped. */
  stamp(x: number, y: number, rows: string[], pal: Record<string, string>, flip = false) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[flip ? row.length - 1 - i : i];
        if (ch !== '.' && pal[ch]) this.px(x + i, y + j, pal[ch]);
      }
    });
  }

  /** Outer outline, then the finished canvas. */
  finish(): HTMLCanvasElement {
    const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < SIZE && y < SIZE && this.col[y * SIZE + x] !== null;
    const edge: number[] = [];
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) if (!filled(x, y) && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) edge.push(y * SIZE + x);
    for (const k of edge) this.col[k] = OUT;
    const c = makeCanvas(SIZE, SIZE);
    const ctx = c.getContext('2d')!;
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const v = this.col[y * SIZE + x];
        if (v) {
          ctx.fillStyle = v;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    return c;
  }
}
