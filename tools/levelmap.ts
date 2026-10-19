// Per map, in the order a playthrough first entered them: highest trainer and wild levels.
import fs from 'node:fs';
import { allMaps } from '../src/game/world/maps';
import { TRAINERS, trainerTeam } from '../src/game/data/trainers';
import { newState } from '../src/game/systems/state';
import { Rng } from '../src/game/core/rng';
const maps = allMaps();
const visited: string[] = JSON.parse(fs.readFileSync(process.cwd() + '/tools/data-trainer-order.json', 'utf8')).visited;
const s = newState(new Rng(1));
s.starter = 4;
for (const id of visited) {
  const m = maps[id];
  if (!m) continue;
  const tl = m.npcs.filter((n) => n.trainer).map((n) => Math.max(...trainerTeam(TRAINERS[n.trainer!], s).map((x) => x[1])));
  const wl = m.encounters ? Math.max(...m.encounters.table.map((e) => e.max)) : 0;
  if (!tl.length && !wl) continue;
  console.log(`${id.padEnd(16)} trainers ${tl.length ? Math.min(...tl) + '-' + Math.max(...tl) : '-'}`.padEnd(40) + ` wild max ${wl || '-'}`);
}
