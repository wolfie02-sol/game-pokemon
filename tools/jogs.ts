/** Finds 2-wide vertical roads that jog sideways by one tile between rows (usually a row-length typo). */
import { TILES } from '../src/game/art/tiles';
import { allMaps } from '../src/game/world/maps';
const maps = allMaps();
const isPath = (n: string) => /path|road|dirt|cobble/.test(n);
let n = 0;
for (const m of Object.values(maps)) {
  const runs = (y: number) => {
    const out: [number, number][] = [];
    let x = 0;
    while (x < m.w) {
      if (isPath(TILES[m.tiles[y * m.w + x]].name)) { let e = x; while (e < m.w && isPath(TILES[m.tiles[y * m.w + e]].name)) e++; out.push([x, e - x]); x = e; } else x++;
    }
    return out;
  };
  const hits: string[] = [];
  for (let y = 0; y + 1 < m.h; y++) {
    const a = runs(y).filter((r) => r[1] === 2);
    for (const [x] of a) {
      // skip down through crossing roads (rows where a long run covers this column)
      let y2 = y + 1;
      while (y2 < m.h && runs(y2).some((r) => r[1] > 2 && r[0] <= x && r[0] + r[1] >= x + 2)) y2++;
      if (y2 >= m.h) continue;
      // hop over a single row with no road here (a ledge or fence line)
      if (!runs(y2).some((r) => r[0] <= x + 2 && r[0] + r[1] >= x - 1) && y2 + 1 < m.h) y2++;
      const b = runs(y2).filter((r) => r[1] === 2);
      if (!b.some((r) => r[0] === x) && b.some((r) => Math.abs(r[0] - x) === 1)) hits.push(`y${y}->${y2} x${x}`);
    }
  }
  if (hits.length) { n++; console.log(m.id, hits.join('  ')); }
}
console.log('maps with jogs', n);
