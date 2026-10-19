import { TILES } from '../src/game/art/tiles';
import { allMaps } from '../src/game/world/maps';
const maps = allMaps();
const ch = (n: string) => /path|road|dirt|stair/.test(n) ? '=' : /tallgrass|snowgrass|ashgrass/.test(n) ? '"' : /grass|snow$|ash$/.test(n) ? '.' : /water|sea/.test(n) ? '~' : /tree/.test(n) ? 'T' : n[0].toUpperCase();
const pairs = [['route1','woods'],['riverton','route5'],['route7','riverton'],['bellmoor','route14'],['astra','route21'],['bloomfield','route17'],['route17','mirecoast'],['route22','galewick'],['galewick','route23'],['hearthvale','route1'],['woods','route2'],['route2','brindle']];
for (const [lo, hi] of pairs) {
  // lo is south of hi? find which connection
  const A = maps[lo], B = maps[hi];
  let up = A.connections?.up?.map === hi ? A : B.connections?.up?.map === lo ? B : null;
  if (!up) { console.log('no vertical', lo, hi); continue; }
  const south = up, north = maps[up.connections!.up!.map];
  const off = up.connections!.up!.offset;
  console.log(`== ${north.id} (above) / ${south.id} (below) offset ${off}`);
  const W = Math.max(south.w, north.w + Math.abs(off)) + 2;
  for (let y = north.h - 4; y < north.h; y++) { let r = ''; for (let x = 0; x < south.w; x++) { const j = x + off; r += j >= 0 && j < north.w ? ch(TILES[north.tiles[y * north.w + j]].name) : ' '; } console.log('N ' + r); }
  for (let y = 0; y < 4; y++) { let r = ''; for (let x = 0; x < south.w; x++) r += ch(TILES[south.tiles[y * south.w + x]].name); console.log('S ' + r); }
}
