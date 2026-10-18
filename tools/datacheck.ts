import { ALL_SPECIES } from '../src/game/data/species';
import { MOVES } from '../src/game/data/moves';
import { ELEMENTS } from '../src/game/data/elements';
let bad = 0;
console.log('species', ALL_SPECIES.length, 'moves', Object.keys(MOVES).length);
const typeCount: Record<string, number> = {};
const used = new Set<string>();
for (const s of ALL_SPECIES) {
  for (const t of s.types) { if (!ELEMENTS.includes(t)) { console.log('bad type', s.name, t); bad++; } typeCount[t] = (typeCount[t] ?? 0) + 1; }
  if (s.dex.length > 120) { console.log('dex too long', s.name, s.dex.length); bad++; }
  if (s.kind.length > 16) { console.log('kind long', s.name, s.kind); }
  if (s.name.length > 10) { console.log('name long', s.name); bad++; }
  for (const [l, m] of s.learn) { if (!MOVES[m]) { console.log('missing move', s.name, m); bad++; } used.add(m); }
  if (s.learn.length < 6) console.log('short learnset', s.name, s.learn.length);
  for (const e of s.evos) if (!ALL_SPECIES[e.to - 1]) { console.log('bad evo', s.name); bad++; }
  if (s.base.some((v) => isNaN(v)) || s.base.length !== 5) { console.log('bad base', s.name); bad++; }
}
console.log(typeCount);
console.log('unused moves', Object.keys(MOVES).filter((m) => !used.has(m)).join(' '));
const show = process.argv[2];
if (show) for (const s of ALL_SPECIES.filter((x) => x.name === show)) console.log(s.name, s.stage, JSON.stringify(s.learn));
process.exit(bad ? 1 : 0);
