/** Reports path tiles that don't line up across map connections. */
import { TILES } from '../src/game/art/tiles';
import { allMaps } from '../src/game/world/maps';
import type { MapDef } from '../src/game/world/types';
const maps = allMaps();
const name = (m: MapDef, x: number, y: number) => TILES[m.tiles[y * m.w + x]]?.name ?? '?';
const isPath = (n: string) => /path|road|dirt|sand|bridge|plank|dock|cobble|ash$|snowpath|stair/.test(n);
let bad = 0;
const seen = new Set<string>();
for (const a of Object.values(maps)) {
  for (const [dir, c] of Object.entries(a.connections ?? {})) {
    if (!c) continue;
    const key = [a.id, c.map].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    const b = maps[c.map];
    const rows: string[] = [];
    const n = dir === 'up' || dir === 'down' ? a.w : a.h;
    const mism: number[] = [];
    for (let i = 0; i < n; i++) {
      const j = i + c.offset;
      let ta: string, tb: string;
      if (dir === 'up') { if (j < 0 || j >= b.w) continue; ta = name(a, i, 0); tb = name(b, j, b.h - 1); }
      else if (dir === 'down') { if (j < 0 || j >= b.w) continue; ta = name(a, i, a.h - 1); tb = name(b, j, 0); }
      else if (dir === 'left') { if (j < 0 || j >= b.h) continue; ta = name(a, 0, i); tb = name(b, b.w - 1, j); }
      else { if (j < 0 || j >= b.h) continue; ta = name(a, a.w - 1, i); tb = name(b, 0, j); }
      if (isPath(ta) !== isPath(tb)) mism.push(i);
      rows.push(`${i}:${ta}/${tb}`);
    }
    if (mism.length) {
      bad++;
      console.log(`${a.id} ${dir} ${c.map} offset ${c.offset} mismatch at ${mism.join(',')}`);
      if (process.argv.includes('-v')) console.log('   ' + rows.filter((r) => !/^\d+:(tree|wall|rock|cliff|snowtree|deadtree|water)\w*\/(tree|wall|rock|cliff|snowtree|deadtree|water)/.test(r)).join('  '));
    }
  }
}
console.log('links checked', seen.size, 'with path mismatches', bad);
