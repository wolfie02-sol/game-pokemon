/**
 * Creature sprites from Pokémon Claude Red, rasterised at the 48×48 size this
 * game's battles, summary and Wildex already assume. Icons are a 16×16 reduction
 * of that sprite so party and PC slots stay the same size.
 * The species id → Pokémon mapping lives in claude-red/species-map.ts.
 */
import { makeCanvas } from '../core/gfx';
import { pokeSpecies, renderMon, surfaceToCanvas } from './claude-red/bridge';

const N = 48;
const OUTLINE = '#201a2e';
const EYE = '#1a1626';

const cache = new Map<string, HTMLCanvasElement>();

export function creatureSprite(sp: number, back = false): HTMLCanvasElement {
  const k = sp + (back ? 'b' : 'f');
  let c = cache.get(k);
  if (!c) {
    c = surfaceToCanvas(renderMon(pokeSpecies(sp), back ? 'back' : 'front', N));
    cache.set(k, c);
  }
  return c;
}

/** 16×16 icon: crop to the sprite's bounds, downscale by majority colour, re-outline. */
export function creatureIcon(sp: number): HTMLCanvasElement {
  const k = sp + 'i';
  const hit = cache.get(k);
  if (hit) return hit;
  const src = creatureSprite(sp);
  const sctx = src.getContext('2d');
  if (!sctx) throw new Error('2d context unavailable');
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
  const size = Math.max(maxX - minX + 1, maxY - minY + 1, 1);
  const T = 14;
  const scale = size / T;
  const ox = minX - (size - (maxX - minX + 1)) / 2;
  const oy = minY - (size - (maxY - minY + 1));
  const out = makeCanvas(16, 16);
  const octx = out.getContext('2d');
  if (!octx) throw new Error('2d context unavailable');
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
