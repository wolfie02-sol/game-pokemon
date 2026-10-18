/**
 * Deterministic level-up learnsets. Every Wildkin learns moves of its own
 * types in a steady power curve, plus useful status moves and a little
 * coverage, so each family plays to its typing.
 */
import type { Element } from './elements';
import { MOVES, type MoveDef } from './moves';
import type { Species } from './species';

/** moves never handed out automatically */
const RESERVED = new Set(['lastblaze', 'overdrive', 'dawnflare', 'stormspear', 'rimecrown', 'voidpulse', 'genesis', 'gnaw', 'sonicpop', 'wyrmfury']);

/** Hand-tuned signature learnsets (level:move ...). */
const CUSTOM: Record<string, string> = {
  Sproutle: '1:bump 1:snarl 7:leechsprout 10:vinesnap 13:bitterpollen 16:sapsip 20:numbpollen 24:leafcutter 30:photosynth 36:thornvolley 44:sunlance',
  Bramblebun: '1:bump 1:snarl 1:leechsprout 10:vinesnap 13:bitterpollen 16:sapsip 22:numbpollen 26:leafcutter 32:twinkick 38:thornvolley 46:sunlance',
  Thornhare: '1:vinesnap 1:twinkick 1:leechsprout 22:numbpollen 26:leafcutter 32:shatterpalm 38:thornvolley 44:skyknee 50:sunlance 56:bracestance',
  Emberkit: '1:claw 1:snarl 7:sparkspit 13:smolder 17:dash 22:cinderfang 28:heatshimmer 34:blazewheel 40:flareburst 46:sunblaze',
  Blazelynx: '1:claw 1:snarl 1:sparkspit 13:smolder 17:dash 24:cinderfang 30:heatshimmer 36:blazewheel 42:flareburst 50:sunblaze',
  Pyrolion: '1:claw 1:sparkspit 1:cinderfang 30:heatshimmer 36:burrow 40:flareburst 46:earthshake 52:sunblaze 58:pyrewave',
  Splashel: '1:bump 1:glare 8:bubblet 13:shellup 17:splashjet 22:ram 28:tidelash 34:calmmist 40:riptide 46:torrent',
  Currentle: '1:bump 1:glare 1:bubblet 13:shellup 17:splashjet 24:ram 31:tidelash 37:calmmist 43:riptide 50:torrent',
  Abyshell: '1:bump 1:bubblet 1:shellup 31:tidelash 36:rubble 42:riptide 48:cragedge 54:torrent 60:stoneskin',
  Solmara: '1:sparkspit 1:wingflick 40:smolder 45:updraft 50:flareburst 55:skyslash 60:dawnflare 65:roost',
  Voltwing: '1:zap 1:beakjab 40:joltwave 45:updraft 50:arcbolt 55:drillbeak 60:stormspear 65:ionveil',
  Galecrest: '1:chillbreath 1:wingflick 40:rimewall 45:updraft 50:glacierbeam 55:skyslash 60:rimecrown 65:frozenhush',
  Nullmind: '1:psyripple 1:afterimage 1:restore 1:psyblast 63:focusmind 66:mindstorm 70:mindveil 75:voidpulse 81:nap',
  Origen: '1:bump 1:psyripple 10:genesis 20:afterimage 30:mindwave 40:psyblast 50:focusmind 60:restore',
  Mudgill: '1:bump 15:splashjet',
  Swamplash: '1:feralbite 20:scaletwister 25:tidelash 32:drakebreath 41:riptide 47:wyrmclaw 52:shriek 58:torrent 64:dragonsurge',
  Gloopy: '1:bump 1:glare 10:afterimage 20:swipes 30:mend 40:stardart',
  Slumbear: '1:ram 1:nap 1:bristle 35:heavyslam 41:shriek 48:crushjaw 56:overdrive',
  Pixelon: '1:bump 1:sonicpop 1:sandflick 23:psyripple 28:afterimage 35:mend 42:stardart 50:overdrive',
  Kitmote: '1:bump 1:sandflick 8:dash 16:glare 23:feralbite 30:afterimage 36:rush',
  Mendlamb: '1:bump 1:hushsong 12:snarl 24:mend 30:bristle 38:dizzydance 44:stardart 50:nap',
  Graniteel: '1:bump 1:shriek 15:coilbind 19:pebble 25:rubble 33:stoneskin 43:burrow 50:cragedge',
  Zappod: '1:bump 1:shriek 17:zap 22:sonicpop 29:joltwave 36:sparkdash 43:lastblaze',
  Thunderpod: '1:bump 1:shriek 1:zap 22:sonicpop 29:joltwave 40:arcbolt 50:lastblaze 56:thunderclap',
  Wyrmlet: '1:coilbind 1:snarl 10:scaletwister 20:wyrmfury 30:drakebreath 40:scaledance 50:wyrmclaw 60:dragonsurge',
  Dragonet: '1:coilbind 1:snarl 1:scaletwister 20:wyrmfury 34:drakebreath 45:scaledance 54:wyrmclaw 65:dragonsurge',
  Skywyrm: '1:coilbind 1:scaletwister 1:wyrmfury 34:drakebreath 45:scaledance 54:wyrmclaw 55:wingflick 61:divebomb 70:dragonsurge',
  Smogpuff: '1:bump 1:fumepuff 24:sandflick 30:lastblaze 37:bilesurge 43:afterimage 48:oozeshell',
  Smogcloud: '1:bump 1:fumepuff 1:sandflick 30:lastblaze 39:bilesurge 47:afterimage 54:oozeshell 60:grimecannon',
};

const ATTACKS: Record<Element, MoveDef[]> = {} as Record<Element, MoveDef[]>;
const STATUSES: Record<Element, MoveDef[]> = {} as Record<Element, MoveDef[]>;
for (const m of Object.values(MOVES)) {
  if (RESERVED.has(m.id)) continue;
  if (m.cat === 'status') (STATUSES[m.type] ??= []).push(m);
  else (ATTACKS[m.type] ??= []).push(m);
}
for (const k of Object.keys(ATTACKS) as Element[]) ATTACKS[k].sort((a, b) => power(a) - power(b) || a.id.localeCompare(b.id));

/** rough power used to order moves into tiers */
function power(m: MoveDef): number {
  if (m.fixed) return 55;
  if (m.multi) return m.pow * ((m.multi[0] + m.multi[1]) / 2);
  if (m.recharge) return m.pow - 10;
  return m.pow;
}

function tier(t: Element, lo: number, hi: number): MoveDef[] {
  return (ATTACKS[t] ?? []).filter((m) => power(m) >= lo && power(m) <= hi);
}

function hash(n: number, salt: number) {
  let h = Math.imul(n * 2654435761 + salt * 40503, 1597334677) >>> 0;
  h ^= h >>> 15;
  return h >>> 0;
}

function pick<T>(list: T[], seed: number, salt: number): T | undefined {
  if (!list.length) return undefined;
  return list[hash(seed, salt) % list.length];
}

function parse(s: string): [number, string][] {
  return s
    .trim()
    .split(/\s+/)
    .map((t) => {
      const [l, m] = t.split(':');
      return [parseInt(l), m] as [number, string];
    });
}

/** First-move fallback by type for the opening slot. */
const OPENER: Partial<Record<Element, string>> = { GALE: 'beakjab', SWARM: 'pinvolley', TOXIN: 'sting', TIDE: 'bubblet', MIND: 'psyripple', SHADE: 'chilltouch', BRAWL: 'edgechop' };

export function generateLearnset(s: Species, evolvedAt: number): [number, string][] {
  if (CUSTOM[s.name]) return parse(CUSTOM[s.name]);
  const [t1, t2] = s.types;
  const seed = s.id;
  const out: [number, string][] = [];
  const used = new Set<string>();
  const add = (lvl: number, m: MoveDef | string | undefined) => {
    const id = typeof m === 'string' ? m : m?.id;
    if (!id || used.has(id) || !MOVES[id]) return;
    used.add(id);
    out.push([lvl, id]);
  };
  // the curve stretches for later stages so evolved forms keep learning
  const delay = s.stage * 3;
  const L = (n: number) => (n <= 1 || n + delay < evolvedAt ? 1 : n + delay);
  const bulky = s.base[2] >= s.base[1] + 15;
  const fast = s.base[3] >= 90;

  // opening moves
  const opener = s.types.includes('BEAST') ? pick(tier('BEAST', 1, 45), seed, 1) : (OPENER[t1] ? MOVES[OPENER[t1]!] : pick(tier('BEAST', 35, 45), seed, 1));
  add(1, opener);
  add(1, pick(STATUSES.BEAST.filter((m) => m.stat?.who === 'foe' && !m.status && !m.conf), seed, 2));
  // early type move
  add(L(7), pick(tier(t1, 1, 50), seed, 3));
  add(L(11), pick((STATUSES[t1] ?? STATUSES.BEAST).filter((m) => !m.heal && !m.rest), seed, 4) ?? pick(tier('BEAST', 35, 45), seed, 4));
  add(L(15), t2 ? pick(tier(t2, 1, 55), seed, 5) : pick(tier(t1, 40, 60), seed, 5));
  add(L(19), pick(tier(t1, 55, 75), seed, 6));
  // utility
  const util = (STATUSES[t1] ?? []).concat(t2 ? STATUSES[t2] ?? [] : []).filter((m) => (bulky ? true : !m.screen) && !used.has(m.id));
  add(L(24), pick(util, seed, 7) ?? pick(STATUSES.BEAST, seed, 7));
  add(L(29), t2 ? pick(tier(t2, 55, 85), seed, 8) : pick(tier('BEAST', 60, 85), seed, 8));
  add(L(34), pick(tier(t1, 76, 95), seed, 9) ?? pick(tier(t1, 60, 95), seed, 9));
  add(L(39), fast ? pick(STATUSES.BEAST.filter((m) => m.stat?.who === 'self'), seed, 10) : pick(tier('BEAST', 70, 100), seed, 10));
  add(L(45), pick(tier(t1, 96, 140), seed, 11) ?? pick(tier(t1, 85, 140), seed, 11));
  if (t2) add(L(51), pick(tier(t2, 86, 140), seed, 12));
  // fill to a decent length for single types
  // top up thin learnsets with anything sensible that is still unused
  const extra = [...tier(t1, 1, 140), ...(t2 ? tier(t2, 1, 140) : []), ...tier('BEAST', 35, 100)].filter((m) => !used.has(m.id));
  let lv = 9;
  for (let k = 0; out.length < 9 && k < 40 && extra.length; k++) {
    const m = extra.splice(hash(seed, 20 + k) % extra.length, 1)[0];
    add(L(lv), m);
    lv += 6;
  }
  out.sort((a, b) => a[0] - b[0]);
  return out;
}
