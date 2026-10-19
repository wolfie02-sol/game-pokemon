// Finds NPCs that cut a map in two: places reachable from the map's entrances
// when NPCs are ignored but not when they stand where they are placed.
import { TILES } from '../src/game/art/tiles';
import { buildTiles } from '../src/game/art/tiles';
import { allMaps } from '../src/game/world/maps';
try { buildTiles(); } catch {}
const maps = allMaps();
const D: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
let found = 0;
for (const m of Object.values(maps)) {
  const walk = (x: number, y: number) => {
    const t = TILES[m.tiles[y * m.w + x]];
    return !t.solid && !t.water && !t.ledge;
  };
  const items = new Set(m.items.map((i) => i.y * m.w + i.x));
  const starts: number[] = [];
  for (const w of m.warps) starts.push(w.y * m.w + w.x);
  const edgeStarts: number[] = [];
  for (const dir of Object.keys(m.connections ?? {})) {
    for (let i = 0; i < (dir === 'up' || dir === 'down' ? m.w : m.h); i++) {
      const [x, y] = dir === 'up' ? [i, 0] : dir === 'down' ? [i, m.h - 1] : dir === 'left' ? [0, i] : [m.w - 1, i];
      if (walk(x, y)) edgeStarts.push(y * m.w + x);
    }
  }
  const reachable = (blockers: Set<number>, from: number[] = [...starts, ...edgeStarts]) => {
    const seen = new Set<number>();
    const q = from.filter((k) => !blockers.has(k));
    q.forEach((k) => seen.add(k));
    while (q.length) {
      const k = q.pop()!;
      const x = k % m.w, y = Math.floor(k / m.w);
      for (const [dx, dy] of D) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
        const nk = ny * m.w + nx;
        if (seen.has(nk) || blockers.has(nk) || items.has(nk) || !walk(nx, ny)) continue;
        // ledges: allow hopping down
        seen.add(nk); q.push(nk);
      }
      // hop down ledges
      const below = (y + 1) * m.w + x;
      if (y + 2 < m.h && TILES[m.tiles[below]].ledge) {
        const nk = (y + 2) * m.w + x;
        if (!seen.has(nk) && walk(x, y + 2) && !blockers.has(nk)) { seen.add(nk); q.push(nk); }
      }
    }
    return seen;
  };
  const free = reachable(new Set());
  const npcs = m.npcs.filter((n) => n.x >= 0 && n.y >= 0 && n.x < m.w && n.y < m.h);
  const blocked = reachable(new Set(npcs.map((n) => n.y * m.w + n.x)));
  const cut = [...free].filter((k) => !blocked.has(k) && !npcs.some((n) => n.y * m.w + n.x === k));
  // entrances that can reach each other only when NPCs are ignored
  const ents = [...starts, ...edgeStarts.filter((_, i) => i % 1 === 0)];
  const npcSet = new Set(npcs.map((n) => n.y * m.w + n.x));
  const splits: string[] = [];
  const seenPair = new Set<string>();
  for (const a of starts) {
    const withN = reachable(npcSet, [a]);
    const without = reachable(new Set(), [a]);
    for (const b of ents) {
      if (b === a || !without.has(b) || withN.has(b)) continue;
      const key = [Math.min(a, b), Math.max(a, b)].join('-');
      if (seenPair.has(key)) continue;
      seenPair.add(key);
      splits.push(`(${a % m.w},${Math.floor(a / m.w)})x(${b % m.w},${Math.floor(b / m.w)})`);
    }
  }
  if (splits.length) {
    const culpritsS = npcs.filter((n) => {
      const others = new Set(npcs.filter((o) => o !== n).map((o) => o.y * m.w + o.x));
      return starts.some((a) => { const r = reachable(others, [a]); const r2 = reachable(npcSet, [a]); return [...r].length > [...r2].length + 1; });
    });
    console.log(`!! ${m.id}: entrances separated by NPCs: ${splits.slice(0, 6).join(' ')} by ${culpritsS.map((n) => `${n.id}(${n.x},${n.y})${n.trainer ? ' trainer' : ''}${n.cond ? ' cond' : ''}`).join(', ')}`);
  }
  if (!cut.length) continue;
  // which npcs are responsible
  const culprits = npcs.filter((n) => {
    const others = new Set(npcs.filter((o) => o !== n).map((o) => o.y * m.w + o.x));
    const r = reachable(others);
    return cut.some((k) => r.has(k));
  });
  const warpsCut = m.warps.filter((w) => cut.includes(w.y * m.w + w.x)).map((w) => `${w.to}@${w.x},${w.y}`);
  found++;
  console.log(`${m.id}: ${cut.length} tiles cut off; warps cut: ${warpsCut.join(' ') || '-'}; by ${culprits.map((n) => `${n.id}(${n.x},${n.y})${n.trainer ? ' trainer' : ''}${n.cond ? ' cond' : ''}`).join(', ')}`);
}
console.log('maps with blocking NPCs:', found);
