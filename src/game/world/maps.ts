/**
 * The region of VARROW, assembled from its chapters.
 */
import { buildTiles } from '../art/tiles';
import { World } from './build';
import { build as ch1 } from './region/ch1';
import { build as ch2 } from './region/ch2';
import { build as ch3 } from './region/ch3';
import { build as ch4 } from './region/ch4';
import { build as ch5 } from './region/ch5';
import { build as ch6 } from './region/ch6';
import { build as ch7 } from './region/ch7';
import type { MapDef } from './types';

let cache: Record<string, MapDef> | null = null;

export function allMaps(): Record<string, MapDef> {
  if (!cache) {
    buildTiles();
    const W = new World();
    for (const ch of [ch1, ch2, ch3, ch4, ch5, ch6, ch7]) ch(W);
    cache = W.maps;
  }
  return cache;
}

export function getMap(id: string): MapDef {
  const m = allMaps()[id];
  if (!m) throw new Error('Unknown map ' + id);
  return m;
}
