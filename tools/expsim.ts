// Simulates player levels at each boss under an experience formula, using the
// order in which a real playthrough beat the trainers (tools/data-trainer-order.json).
// Usage: node tools/run.mjs tools/expsim.ts
import fs from 'node:fs';
import { TRAINERS, trainerTeam } from '../src/game/data/trainers';
import { allMaps } from '../src/game/world/maps';
import { species } from '../src/game/data/species';
import { newState } from '../src/game/systems/state';
import { Rng } from '../src/game/core/rng';

allMaps();
const order: string[] = JSON.parse(fs.readFileSync(process.cwd() + '/tools/data-trainer-order.json', 'utf8')).order;
const s = newState(new Rng(1));
s.starter = 4;
const BOSSES = /^(g[1-8]|rival\d|e4_\d|champ|cv_sable|.*nyx.*|.*boss.*|.*director.*)$/;

type P = { lvl: number; exp: number };
const CURVE = Number(process.env.CURVE ?? 0.8);
const DIV = Number(process.env.DIV ?? 5);
const SCALE = process.env.SCALE === '1';
const xp = (l: number) => (l <= 1 ? 0 : Math.floor(CURVE * l * l * l));
const lvlOf = (exp: number) => {
  let l = 1;
  while (l < 100 && exp >= xp(l + 1)) l++;
  return l;
};
function reward(foeSp: number, foeLvl: number, trainer: boolean, recv: number) {
  const base = (species(foeSp).expYield * foeLvl) / DIV * (trainer ? 1.5 : 1);
  const sc = SCALE ? Math.min(2, Math.max(0.1, ((2 * foeLvl + 10) / (foeLvl + recv + 10)) ** 2.5)) : 1;
  return Math.max(1, Math.floor(base * sc));
}
// wild battles per stretch between trainers (a normal player meets a few while walking)
const WILD_PER_TRAINER = Number(process.env.WILD ?? 1.5);
const TEAM = Number(process.env.TEAM ?? 1);

function run(label: string) {
  const team: P[] = Array.from({ length: TEAM }, () => ({ lvl: 5, exp: xp(5) }));
  const SHARE = Number(process.env.SHARE ?? 0);
  const give = (foeSp: number, foeLvl: number, trainer: boolean, who: number) => {
    const p = team[who];
    p.exp += reward(foeSp, foeLvl, trainer, p.lvl);
    p.lvl = lvlOf(p.exp);
    const top = Math.max(...team.map((q) => q.lvl));
    for (const q of team) if (q !== p && q.lvl <= top - 3 && SHARE > 0) { q.exp += Math.floor(SHARE * reward(foeSp, foeLvl, trainer, q.lvl)); q.lvl = lvlOf(q.exp); }
  };
  let turn = 0;
  const rows: string[] = [];
  for (const k of order) {
    if (!k.startsWith('tr:')) continue;
    const id = k.slice(3);
    const t = TRAINERS[id];
    if (!t) continue;
    const foes = trainerTeam(t, s);
    const avg = foes.reduce((a, f) => a + f[1], 0) / foes.length;
    // a few wild Wildkin around the trainer's level on the way
    for (let w = 0; w < WILD_PER_TRAINER; w++) give(foes[0][0], Math.max(2, Math.round(avg - 2)), false, turn++ % TEAM);
    if (BOSSES.test(id)) {
      const maxL = Math.max(...foes.map((f) => f[1]));
      rows.push(`${id.padEnd(10)} boss max ${String(maxL).padStart(3)} | team ${team.map((p) => p.lvl).join('/')}`);
    }
    for (const [sp, l] of foes) give(sp, l, true, turn++ % TEAM);
  }
  console.log(`== ${label} (team ${TEAM}, wild/trainer ${WILD_PER_TRAINER})`);
  console.log(rows.join('\n'));
}
run(`curve ${CURVE} div ${DIV} scale ${SCALE} share ${process.env.SHARE ?? 0}`);
void species;
