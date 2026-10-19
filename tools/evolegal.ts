// Flags trainer Wildkin that are below the level at which their species evolves into them.
import { TRAINERS, trainerTeam } from '../src/game/data/trainers';
import { ALL_SPECIES, species } from '../src/game/data/species';
import { allMaps } from '../src/game/world/maps';
import { newState } from '../src/game/systems/state';
import { Rng } from '../src/game/core/rng';
allMaps();
const minLvl = new Map<number, number>();
for (const sp of ALL_SPECIES) for (const e of sp.evos) if (e.lvl) minLvl.set(e.to, Math.min(minLvl.get(e.to) ?? 999, e.lvl));
let bad = 0;
for (const starter of [1, 4, 7]) {
  const s = newState(new Rng(1));
  s.starter = starter;
  for (const t of Object.values(TRAINERS)) {
    if (!t.smart && starter !== 1) continue;
    for (const [sp, l] of trainerTeam(t, s)) {
      const need = minLvl.get(sp);
      if (need && l < need) { bad++; console.log(`${t.id}: ${species(sp).name} L${l} < evolves at ${need}`); }
    }
  }
}
console.log('early evolutions:', bad);
