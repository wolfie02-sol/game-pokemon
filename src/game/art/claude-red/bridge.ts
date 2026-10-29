import './load';
import { makeCanvas } from '../../core/gfx';
import { POKE_BY_SPECIES } from './species-map';

/** Packed 0xAABBGGRR surface from the vendored rasterizer. */
export interface PixelSurface {
  w: number;
  h: number;
  data: Uint32Array;
}

interface CharFrames {
  down: PixelSurface[];
  up: PixelSurface[];
  left: PixelSurface[];
  right: PixelSurface[];
}

function runtime(): {
  CAST: Record<string, Record<string, unknown>>;
  MONDEFS: Record<string, unknown>;
  chars: { makeCharacter: (def: Record<string, unknown>) => CharFrames };
  pokeSprite: (name: string, view: 'front' | 'back', size?: number) => PixelSurface;
} {
  return (globalThis as unknown as { G: ReturnType<typeof runtime> }).G;
}

/** Claude Red overworld definition for a cast id (red, oak, rocket, ...). */
export function castOf(id: string): Record<string, unknown> {
  const def = runtime().CAST[id];
  if (!def) throw new Error('Unknown Claude Red character: ' + id);
  return def;
}

/** 16×24 walk frames: down/up/left/right, three frames each. Right is a mirror of left. */
export function makeCharacterFrames(def: Record<string, unknown>): CharFrames {
  const rest = { ...def };
  delete rest.id;
  return runtime().chars.makeCharacter(rest);
}

/** Copy a packed surface into a canvas. Memory order is RGBA on little-endian. */
export function surfaceToCanvas(s: PixelSurface): HTMLCanvasElement {
  const c = makeCanvas(s.w, s.h);
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  const img = ctx.createImageData(s.w, s.h);
  img.data.set(new Uint8Array(s.data.buffer, s.data.byteOffset, s.w * s.h * 4));
  ctx.putImageData(img, 0, 0);
  return c;
}

export function pokeSpecies(sp: number): string {
  const name = POKE_BY_SPECIES[sp];
  if (!name) throw new Error('No Claude Red sprite for species ' + sp);
  return name;
}

export function renderMon(name: string, view: 'front' | 'back', size: number): PixelSurface {
  if (!runtime().MONDEFS[name]) throw new Error('Missing Claude Red mon sprite: ' + name);
  return runtime().pokeSprite(name, view, size);
}
