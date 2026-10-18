// Run: npx tsx tests/paginate.test.ts
import fs from 'node:fs';
import { paginate, sentences, wrapWords, LINE_CHARS, BASE_LINES, MAX_LINES } from '../src/game/core/paginate';

let fails = 0;
const check = (cond: boolean, msg: string) => {
  if (!cond) {
    fails++;
    console.log('FAIL:', msg);
  }
};

/** Verify every page holds whole sentences and every line fits the box. */
function verify(text: string, label: string) {
  const pages = paginate(text);
  const sents = text.split(/\n\s*\n/).flatMap((p) => sentences(p.replace(/\n/g, ' ')));
  // rebuild the page strings and make sure each sentence lives in exactly one page
  const pageStr = pages.map((p) => p.join(' '));
  for (const s of sents) {
    const norm = s.replace(/\s+/g, ' ');
    const owner = pageStr.filter((ps) => ps.includes(norm));
    if (wrapWords(norm).length <= MAX_LINES) check(owner.length >= 1, `${label}: sentence split across pages: "${norm}"`);
  }
  for (const p of pages) {
    for (const l of p) check(l.length <= LINE_CHARS, `${label}: line too long "${l}"`);
    check(p.length <= MAX_LINES, `${label}: page has ${p.length} lines`);
  }
  // nothing lost
  const joined = pages.flat().join(' ').replace(/\s+/g, ' ').trim();
  check(joined === text.replace(/\s+/g, ' ').trim(), `${label}: text changed`);
  return pages;
}

// --- hand-written cases ---
const short = verify('Hello!', 'short');
check(short.length === 1 && short[0].length === 1, 'short is one page, one line');

const multi = verify('Hi there! I love Wildkin. Do you?', 'multi');
check(multi.length === 1, 'three short sentences share one page');

const longOne = 'This is one very long sentence that keeps going and going well past three lines of the dialogue box without ever stopping for breath.';
const lp = verify(longOne, 'long sentence');
check(lp.length === 1 && lp[0].length > BASE_LINES, 'long sentence stays on one page with a taller box');

const mixed = verify(
  'PROF. FENN: Here we are! On that table are three Wildkin, each one waiting for a partner. Go ahead, REN. Choose the one that speaks to you!',
  'prof intro',
);
check(!mixed.some((p) => p.join(' ').startsWith('FENN')), 'PROF. abbreviation not treated as sentence end');

const ellipsis = verify('1, 2, and... Poof! ZAPLING forgot BUMP and learned ZAP!', 'ellipsis');
check(ellipsis.length >= 1, 'ellipsis ok');

const speakers = verify('PROF. FENN: Hi.\n\nVEX: Yo!', 'speakers');
check(speakers.length === 2, 'speaker change forces a new page');

// --- every dialogue string in the game ---
const files = ['src/game/world/maps.ts', 'src/game/data/trainers.ts', 'src/game/scenes/battle.ts', 'src/game/scenes/overworld.ts', 'src/game/scenes/title.ts', 'src/game/data/species.ts'];
let count = 0;
let maxLines = 0;
let longest = '';
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const re = /(['"`])((?:\\.|(?!\1).){30,})\1/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const t = m[2].replace(/\\'/g, "'").replace(/\$\{[^}]+\}/g, 'WILDKINNAME').replace(/\{PLAYER\}|\{RIVAL\}/g, 'CORIN');
    if (!/[a-z]/.test(t) || !/ /.test(t) || /^[\w.,:~_#|-]+$/.test(t) || /\d+:\w+ \d+:/.test(t)) continue;
    const pages = verify(t, `${f}`);
    count++;
    for (const p of pages)
      if (p.length > maxLines) {
        maxLines = p.length;
        longest = p.join(' ');
      }
  }
}
console.log(`checked ${count} game strings; tallest page ${maxLines} lines: "${longest}"`);
console.log(fails ? `${fails} FAILURES` : 'all paginate checks passed');
process.exit(fails ? 1 : 0);
