/**
 * Static checks for the whole region: warps, connections, NPC/item placement,
 * reachability inside each map, trainer references and Wildex obtainability.
 */
import { TILES } from '../src/game/art/tiles';
import { ALL_SPECIES } from '../src/game/data/species';
import { TRAINERS } from '../src/game/data/trainers';
import { ITEMS } from '../src/game/data/items';
import { allMaps } from '../src/game/world/maps';
import type { MapDef } from '../src/game/world/types';

const maps = allMaps();
const ids = Object.keys(maps);
let errors = 0;
let warns = 0;
const err = (m: string) => {
  errors++;
  console.log('ERROR ' + m);
};
const warn = (m: string) => {
  warns++;
  if (process.argv.includes('-v')) console.log('warn  ' + m);
};

const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
type Dir = keyof typeof D;

function tile(m: MapDef, x: number, y: number) {
  return TILES[m.tiles[y * m.w + x]];
}
function inb(m: MapDef, x: number, y: number) {
  return x >= 0 && y >= 0 && x < m.w && y < m.h;
}

interface Abil {
  cut: boolean;
  surf: boolean;
  smash: boolean;
}
const ALL: Abil = { cut: true, surf: true, smash: true };

function passable(m: MapDef, x: number, y: number, a: Abil, npcs: Set<string>) {
  if (!inb(m, x, y)) return false;
  if (npcs.has(x + ',' + y)) return false;
  const t = tile(m, x, y);
  if (t.ledge) return false;
  if (!t.solid) return true;
  if (t.water && a.surf) return true;
  if (t.cut && a.cut) return true;
  if (t.smash && a.smash) return true;
  return false;
}

function bfs(m: MapDef, starts: [number, number][], a: Abil): Set<string> {
  const npcs = new Set(m.npcs.filter((n) => (!n.move || n.move !== 'wander') && !m.id.startsWith('e4_') && !(n.cond && /flags|bag/.test(n.cond.toString()))).map((n) => n.x + ',' + n.y));
  const seen = new Set<string>();
  const q: [number, number][] = [];
  for (const [x, y] of starts) {
    if (!inb(m, x, y)) continue;
    const k = x + ',' + y;
    if (!seen.has(k)) {
      seen.add(k);
      q.push([x, y]);
    }
  }
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const d of Object.keys(D) as Dir[]) {
      let nx = x + D[d][0];
      let ny = y + D[d][1];
      if (!inb(m, nx, ny)) continue;
      const t = tile(m, nx, ny);
      if (t.ledge) {
        if (d !== 'down') continue;
        ny += 1;
        if (!passable(m, nx, ny, a, npcs)) continue;
      } else if (!passable(m, nx, ny, a, npcs)) continue;
      const k = nx + ',' + ny;
      if (!seen.has(k)) {
        seen.add(k);
        q.push([nx, ny]);
      }
    }
  }
  return seen;
}

// ---- entry points per map
const entries: Record<string, [number, number][]> = {};
const addEntry = (id: string, x: number, y: number) => (entries[id] ??= []).push([x, y]);
for (const m of Object.values(maps)) {
  for (const w of m.warps) {
    if (!maps[w.to]) {
      err(`${m.id}: warp to missing map ${w.to}`);
      continue;
    }
    const t = maps[w.to];
    if (!inb(t, w.tx, w.ty)) err(`${m.id}: warp to ${w.to} (${w.tx},${w.ty}) out of bounds`);
    else if (tile(t, w.tx, w.ty).solid && !tile(t, w.tx, w.ty).cut) err(`${m.id}: warp lands on solid ${tile(t, w.tx, w.ty).name} in ${w.to} (${w.tx},${w.ty})`);
    addEntry(w.to, w.tx, w.ty);
    if (!inb(m, w.x, w.y)) err(`${m.id}: warp source out of bounds`);
  }
  if (m.fly) addEntry(m.id, m.fly.x, m.fly.y);
  if (m.havenSpot) addEntry(m.id, m.havenSpot.x, m.havenSpot.y);
  for (const [d, c] of Object.entries(m.connections ?? {})) {
    if (!c) continue;
    const n = maps[c.map];
    if (!n) {
      err(`${m.id}: connection to missing ${c.map}`);
      continue;
    }
    // edge cells of this map that lead into n
    if (d === 'up' || d === 'down') {
      const y = d === 'up' ? 0 : m.h - 1;
      for (let x = 0; x < m.w; x++) {
        const nx = x + c.offset;
        const ny = d === 'up' ? n.h - 1 : 0;
        if (nx >= 0 && nx < n.w && !tile(m, x, y).solid) addEntry(m.id, x, y);
        if (nx >= 0 && nx < n.w && tile(m, x, y).water) addEntry(m.id, x, y);
        void ny;
      }
    } else {
      const x = d === 'left' ? 0 : m.w - 1;
      for (let y = 0; y < m.h; y++) {
        const ny = y + c.offset;
        if (ny >= 0 && ny < n.h && (!tile(m, x, y).solid || tile(m, x, y).water || tile(m, x, y).cut)) addEntry(m.id, x, y);
      }
    }
  }
}
addEntry('home', 2, 5);

for (const id of ids) {
  const m = maps[id];
  const ent = entries[id];
  if (!ent?.length) {
    err(`${id}: no way in`);
    continue;
  }
  const reach = bfs(m, ent, ALL);
  const reachNone = bfs(m, ent, { cut: false, surf: false, smash: false });
  const near = (x: number, y: number, across = false) => {
    for (const d of Object.keys(D) as Dir[]) {
      const ax = x + D[d][0];
      const ay = y + D[d][1];
      if (reach.has(ax + ',' + ay)) return true;
      if (across && inb(m, ax, ay) && tile(m, ax, ay).counter && reach.has(ax + D[d][0] + ',' + (ay + D[d][1]))) return true;
    }
    return false;
  };
  for (const w of m.warps) {
    if (w.edge) {
      if (!reach.has(w.x + ',' + w.y)) err(`${id}: mat warp (${w.x},${w.y}) unreachable`);
    } else if (!reach.has(w.x + ',' + w.y) && !near(w.x, w.y)) err(`${id}: warp at (${w.x},${w.y}) -> ${w.to} unreachable`);
    else if (!tile(m, w.x, w.y).solid && !reach.has(w.x + ',' + w.y)) err(`${id}: warp tile (${w.x},${w.y}) -> ${w.to} not reachable`);
    if (tile(m, w.x, w.y).solid) err(`${id}: warp source on solid tile ${tile(m, w.x, w.y).name} (${w.x},${w.y})`);
  }
  for (const n of m.npcs) {
    if (!inb(m, n.x, n.y)) {
      err(`${id}: npc ${n.id} out of bounds`);
      continue;
    }
    const t = tile(m, n.x, n.y);
    if (t.solid && !(t.water && (n.look === 'swimmer' || n.look === 'sailor'))) err(`${id}: npc ${n.id} on solid tile ${t.name} (${n.x},${n.y})`);
    if (n.trainer && !TRAINERS[n.trainer]) err(`${id}: npc ${n.id} unknown trainer ${n.trainer}`);
    if ((n.talk || n.trainer) && n.cond?.toString() !== '() => false' && !near(n.x, n.y, true)) warn(`${id}: npc ${n.id} at (${n.x},${n.y}) cannot be talked to`);
  }
  for (const it of m.items) {
    if (!ITEMS[it.item]) err(`${id}: item ${it.id} unknown item ${it.item}`);
    if (!inb(m, it.x, it.y) || tile(m, it.x, it.y).solid) err(`${id}: item ${it.id} on solid/out of bounds (${it.x},${it.y})`);
    else if (!near(it.x, it.y)) err(`${id}: item ${it.id} at (${it.x},${it.y}) unreachable`);
  }
  for (const s of m.signs) {
    if (!inb(m, s.x, s.y)) err(`${id}: sign out of bounds (${s.x},${s.y})`);
    else if (!near(s.x, s.y, true)) warn(`${id}: sign at (${s.x},${s.y}) unreachable`);
  }
  for (const t of m.triggers) {
    if (!inb(m, t.x, t.y)) err(`${id}: trigger out of bounds`);
  }
  // count cells that need abilities
  const gated = [...reach].filter((k) => !reachNone.has(k)).length;
  if (gated && process.argv.includes('-v')) console.log(`info  ${id}: ${gated} cells need field items`);
  // connection edges reachable
  for (const [d, c] of Object.entries(m.connections ?? {})) {
    if (!c) continue;
    let ok = false;
    for (const [x, y] of entries[id]) {
      if ((d === 'up' && y === 0) || (d === 'down' && y === m.h - 1) || (d === 'left' && x === 0) || (d === 'right' && x === m.w - 1)) if (reach.has(x + ',' + y)) ok = true;
    }
    if (!ok) err(`${id}: ${d} edge to ${c.map} unreachable`);
  }
}

// ---- trainers referenced but never placed
const placed = new Set<string>();
for (const m of Object.values(maps)) for (const n of m.npcs) if (n.trainer) placed.add(n.trainer);
const unplaced = Object.keys(TRAINERS).filter((t) => !placed.has(t) && !/^rival|^e4_|^champ/.test(t));
if (unplaced.length) warn('trainers defined but not placed: ' + unplaced.join(' '));

// ---- obtainability
const wild = new Set<number>();
for (const m of Object.values(maps)) for (const t of [m.encounters, m.surf, m.fish]) if (t) for (const e of t.table) wild.add(e.sp);
const GIFTS = (process.env.GIFTS ?? '').split(',').filter(Boolean);
const have = new Set<number>(wild);
for (const g of GIFTS) {
  const s = ALL_SPECIES.find((x) => x.name.toUpperCase() === g.toUpperCase());
  if (s) have.add(s.id);
}
for (let k = 0; k < 4; k++) for (const s of ALL_SPECIES) if (have.has(s.id)) for (const e of s.evos) have.add(e.to);
const missing = ALL_SPECIES.filter((s) => !have.has(s.id)).map((s) => s.name);
console.log(`maps ${ids.length}  trainers ${Object.keys(TRAINERS).length}  wild species ${wild.size}  obtainable ${have.size}/${ALL_SPECIES.length}`);
if (missing.length) console.log('not obtainable: ' + missing.join(' '));
console.log(`${errors} errors, ${warns} warnings`);
process.exit(errors ? 1 : 0);
