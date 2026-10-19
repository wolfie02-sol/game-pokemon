// Prints the move sets bosses will use (smart trainers).
import { TRAINERS, trainerTeam } from '../src/game/data/trainers';
import { species } from '../src/game/data/species';
import { move } from '../src/game/data/moves';
import { bossMoveset } from '../src/game/data/bossmoves';
import { allMaps } from '../src/game/world/maps';
import { newState } from '../src/game/systems/state';
import { Rng } from '../src/game/core/rng';
allMaps();
const s = newState(new Rng(1));
s.starter = 4;
for (const t of Object.values(TRAINERS)) {
  if (!t.smart) continue;
  console.log(`${t.id} ${t.name}`);
  for (const [sp, l] of trainerTeam(t, s)) {
    const set = bossMoveset(sp, l, /^champ$/.test(t.id));
    console.log(`  ${species(sp).name} L${l} [${species(sp).types.join('/')}]: ${set ? set.map((id) => `${move(id).name}(${move(id).type[0]}${move(id).cat === 'status' ? '·s' : move(id).pow})`).join(', ') : '(default)'}`);
  }
}
