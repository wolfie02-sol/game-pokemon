import type { Element } from './elements';

export type Status = 'PSN' | 'BRN' | 'PAR' | 'SLP' | 'FRZ';
export type StatKey = 'atk' | 'def' | 'spd' | 'spc' | 'acc';

export interface MoveDef {
  id: string;
  name: string;
  type: Element;
  cat: 'phys' | 'spec' | 'status';
  pow: number;
  /** 0 = never misses */
  acc: number;
  pp: number;
  priority?: number;
  /** Secondary status (chance 0-1; 1 for pure status moves). */
  status?: { s: Status; chance: number };
  /** Stat stage change. */
  stat?: { who: 'self' | 'foe'; key: StatKey; delta: number; chance: number };
  flinch?: number;
  drain?: number;
  recoil?: number;
  heal?: number;
  highCrit?: boolean;
  desc: string;
}

const M = (m: MoveDef) => m;

export const MOVES: Record<string, MoveDef> = Object.fromEntries(
  [
    // BEAST
    M({ id: 'bump', name: 'Bump', type: 'BEAST', cat: 'phys', pow: 40, acc: 100, pp: 35, desc: 'A full-body nudge.' }),
    M({ id: 'claw', name: 'Claw Swipe', type: 'BEAST', cat: 'phys', pow: 40, acc: 100, pp: 35, desc: 'Rakes with sharp claws.' }),
    M({ id: 'dash', name: 'Dart Dash', type: 'BEAST', cat: 'phys', pow: 40, acc: 100, pp: 30, priority: 1, desc: 'Always strikes first.' }),
    M({ id: 'ram', name: 'Ram', type: 'BEAST', cat: 'phys', pow: 70, acc: 100, pp: 15, flinch: 0.3, desc: 'May make the foe flinch.' }),
    M({ id: 'heavyslam', name: 'Heavy Slam', type: 'BEAST', cat: 'phys', pow: 80, acc: 85, pp: 20, desc: 'A crushing drop.' }),
    M({ id: 'feralbite', name: 'Feral Bite', type: 'BEAST', cat: 'phys', pow: 80, acc: 90, pp: 15, flinch: 0.1, desc: 'Bites with huge fangs.' }),
    M({ id: 'pounce', name: 'Pounce', type: 'BEAST', cat: 'phys', pow: 85, acc: 100, pp: 15, status: { s: 'PAR', chance: 0.3 }, desc: 'May paralyze the foe.' }),
    M({ id: 'rush', name: 'Reckless Rush', type: 'BEAST', cat: 'phys', pow: 90, acc: 85, pp: 20, recoil: 0.25, desc: 'Hurts the user too.' }),
    M({ id: 'stampede', name: 'Stampede', type: 'BEAST', cat: 'phys', pow: 120, acc: 90, pp: 5, recoil: 0.33, desc: 'Massive charge. Recoil.' }),
    M({ id: 'stardart', name: 'Star Dart', type: 'BEAST', cat: 'spec', pow: 60, acc: 0, pp: 20, desc: 'Never misses.' }),
    M({ id: 'snarl', name: 'Snarl', type: 'BEAST', cat: 'status', pow: 0, acc: 100, pp: 40, stat: { who: 'foe', key: 'atk', delta: -1, chance: 1 }, desc: 'Lowers foe ATTACK.' }),
    M({ id: 'glare', name: 'Glare', type: 'BEAST', cat: 'status', pow: 0, acc: 100, pp: 30, stat: { who: 'foe', key: 'def', delta: -1, chance: 1 }, desc: 'Lowers foe DEFENSE.' }),
    M({ id: 'rally', name: 'Rally', type: 'BEAST', cat: 'status', pow: 0, acc: 0, pp: 20, stat: { who: 'self', key: 'atk', delta: 2, chance: 1 }, desc: 'Sharply raises ATTACK.' }),
    M({ id: 'bristle', name: 'Bristle', type: 'BEAST', cat: 'status', pow: 0, acc: 0, pp: 30, stat: { who: 'self', key: 'def', delta: 1, chance: 1 }, desc: 'Raises DEFENSE.' }),
    M({ id: 'mend', name: 'Mend', type: 'BEAST', cat: 'status', pow: 0, acc: 0, pp: 10, heal: 0.5, desc: 'Restores half max HP.' }),
    // FLAME
    M({ id: 'sparkspit', name: 'Spark Spit', type: 'FLAME', cat: 'spec', pow: 40, acc: 100, pp: 25, status: { s: 'BRN', chance: 0.1 }, desc: 'May burn the foe.' }),
    M({ id: 'cinderfang', name: 'Cinder Fang', type: 'FLAME', cat: 'phys', pow: 65, acc: 95, pp: 15, status: { s: 'BRN', chance: 0.1 }, desc: 'Burning bite.' }),
    M({ id: 'flareburst', name: 'Flare Burst', type: 'FLAME', cat: 'spec', pow: 90, acc: 100, pp: 15, status: { s: 'BRN', chance: 0.1 }, desc: 'A blast of flame.' }),
    M({ id: 'sunblaze', name: 'Sunblaze', type: 'FLAME', cat: 'spec', pow: 110, acc: 85, pp: 5, status: { s: 'BRN', chance: 0.3 }, desc: 'Scorching inferno.' }),
    M({ id: 'smolder', name: 'Smolder', type: 'FLAME', cat: 'status', pow: 0, acc: 85, pp: 15, status: { s: 'BRN', chance: 1 }, desc: 'Burns the foe.' }),
    // TIDE
    M({ id: 'bubblet', name: 'Bubblet', type: 'TIDE', cat: 'spec', pow: 40, acc: 100, pp: 30, stat: { who: 'foe', key: 'spd', delta: -1, chance: 0.1 }, desc: 'May lower SPEED.' }),
    M({ id: 'splashjet', name: 'Splash Jet', type: 'TIDE', cat: 'spec', pow: 45, acc: 100, pp: 25, desc: 'Squirts water.' }),
    M({ id: 'tidelash', name: 'Tide Lash', type: 'TIDE', cat: 'phys', pow: 80, acc: 90, pp: 10, desc: 'A watery tail whip.' }),
    M({ id: 'riptide', name: 'Riptide', type: 'TIDE', cat: 'spec', pow: 90, acc: 100, pp: 15, desc: 'A crashing wave.' }),
    M({ id: 'torrent', name: 'Torrent Cannon', type: 'TIDE', cat: 'spec', pow: 110, acc: 80, pp: 5, desc: 'High-pressure water.' }),
    M({ id: 'shellup', name: 'Shell Up', type: 'TIDE', cat: 'status', pow: 0, acc: 0, pp: 20, stat: { who: 'self', key: 'def', delta: 2, chance: 1 }, desc: 'Sharply raises DEFENSE.' }),
    // LEAF
    M({ id: 'vinesnap', name: 'Vine Snap', type: 'LEAF', cat: 'phys', pow: 45, acc: 100, pp: 25, desc: 'Lashes with vines.' }),
    M({ id: 'sapsip', name: 'Sap Sip', type: 'LEAF', cat: 'spec', pow: 40, acc: 100, pp: 20, drain: 0.5, desc: 'Drains HP from foe.' }),
    M({ id: 'leafcutter', name: 'Leaf Cutter', type: 'LEAF', cat: 'spec', pow: 55, acc: 95, pp: 25, highCrit: true, desc: 'High critical ratio.' }),
    M({ id: 'sporecloud', name: 'Spore Cloud', type: 'LEAF', cat: 'status', pow: 0, acc: 75, pp: 15, status: { s: 'SLP', chance: 1 }, desc: 'Puts the foe to sleep.' }),
    M({ id: 'thornvolley', name: 'Thorn Volley', type: 'LEAF', cat: 'spec', pow: 90, acc: 100, pp: 15, desc: 'A storm of thorns.' }),
    M({ id: 'bloomburst', name: 'Bloom Burst', type: 'LEAF', cat: 'spec', pow: 120, acc: 85, pp: 5, desc: 'Explosive blossom.' }),
    M({ id: 'photosynth', name: 'Photosynth', type: 'LEAF', cat: 'status', pow: 0, acc: 0, pp: 10, heal: 0.5, desc: 'Restores half max HP.' }),
    // VOLT
    M({ id: 'zap', name: 'Zap', type: 'VOLT', cat: 'spec', pow: 40, acc: 100, pp: 30, status: { s: 'PAR', chance: 0.1 }, desc: 'May paralyze.' }),
    M({ id: 'voltbite', name: 'Volt Bite', type: 'VOLT', cat: 'phys', pow: 65, acc: 95, pp: 15, status: { s: 'PAR', chance: 0.1 }, desc: 'Electric fangs.' }),
    M({ id: 'arcbolt', name: 'Arc Bolt', type: 'VOLT', cat: 'spec', pow: 90, acc: 100, pp: 15, status: { s: 'PAR', chance: 0.1 }, desc: 'Arcing lightning.' }),
    M({ id: 'thunderclap', name: 'Thunderclap', type: 'VOLT', cat: 'spec', pow: 110, acc: 70, pp: 10, status: { s: 'PAR', chance: 0.3 }, desc: 'Deafening strike.' }),
    M({ id: 'joltwave', name: 'Jolt Wave', type: 'VOLT', cat: 'status', pow: 0, acc: 90, pp: 20, status: { s: 'PAR', chance: 1 }, desc: 'Paralyzes the foe.' }),
    // FROST
    M({ id: 'chillbreath', name: 'Chill Breath', type: 'FROST', cat: 'spec', pow: 40, acc: 100, pp: 25, status: { s: 'FRZ', chance: 0.1 }, desc: 'May freeze.' }),
    M({ id: 'iceneedle', name: 'Ice Needle', type: 'FROST', cat: 'phys', pow: 40, acc: 100, pp: 30, priority: 1, desc: 'Always strikes first.' }),
    M({ id: 'frostfang', name: 'Frost Fang', type: 'FROST', cat: 'phys', pow: 65, acc: 95, pp: 15, status: { s: 'FRZ', chance: 0.1 }, desc: 'Freezing bite.' }),
    M({ id: 'glacierbeam', name: 'Glacier Beam', type: 'FROST', cat: 'spec', pow: 90, acc: 100, pp: 10, status: { s: 'FRZ', chance: 0.1 }, desc: 'A beam of ice.' }),
    M({ id: 'whiteout', name: 'Whiteout Gale', type: 'FROST', cat: 'spec', pow: 110, acc: 70, pp: 5, status: { s: 'FRZ', chance: 0.1 }, desc: 'A raging snowstorm.' }),
    // STONE
    M({ id: 'pebble', name: 'Pebble Toss', type: 'STONE', cat: 'phys', pow: 50, acc: 90, pp: 15, desc: 'Hurls small rocks.' }),
    M({ id: 'rubble', name: 'Rubble Drop', type: 'STONE', cat: 'phys', pow: 75, acc: 90, pp: 10, flinch: 0.2, desc: 'May cause flinching.' }),
    M({ id: 'earthshake', name: 'Earthshake', type: 'STONE', cat: 'phys', pow: 100, acc: 100, pp: 10, desc: 'Shakes the ground.' }),
    M({ id: 'bouldercrash', name: 'Boulder Crash', type: 'STONE', cat: 'phys', pow: 110, acc: 80, pp: 5, desc: 'Drops a boulder.' }),
    M({ id: 'stoneskin', name: 'Stone Skin', type: 'STONE', cat: 'status', pow: 0, acc: 0, pp: 20, stat: { who: 'self', key: 'def', delta: 2, chance: 1 }, desc: 'Sharply raises DEFENSE.' }),
    // GALE
    M({ id: 'wingflick', name: 'Wing Flick', type: 'GALE', cat: 'spec', pow: 40, acc: 100, pp: 35, desc: 'Whips up a breeze.' }),
    M({ id: 'beakjab', name: 'Beak Jab', type: 'GALE', cat: 'phys', pow: 45, acc: 100, pp: 30, desc: 'Jabs with a beak.' }),
    M({ id: 'skyslash', name: 'Sky Slash', type: 'GALE', cat: 'phys', pow: 75, acc: 95, pp: 15, highCrit: true, desc: 'High critical ratio.' }),
    M({ id: 'tempest', name: 'Tempest', type: 'GALE', cat: 'spec', pow: 110, acc: 70, pp: 10, desc: 'A violent cyclone.' }),
    M({ id: 'updraft', name: 'Updraft', type: 'GALE', cat: 'status', pow: 0, acc: 0, pp: 20, stat: { who: 'self', key: 'spd', delta: 2, chance: 1 }, desc: 'Sharply raises SPEED.' }),
    // TOXIN
    M({ id: 'sting', name: 'Toxic Sting', type: 'TOXIN', cat: 'phys', pow: 35, acc: 100, pp: 35, status: { s: 'PSN', chance: 0.3 }, desc: 'May poison.' }),
    M({ id: 'acidspray', name: 'Acid Spray', type: 'TOXIN', cat: 'spec', pow: 40, acc: 100, pp: 30, stat: { who: 'foe', key: 'def', delta: -1, chance: 0.1 }, desc: 'May lower DEFENSE.' }),
    M({ id: 'venomfang', name: 'Venom Fang', type: 'TOXIN', cat: 'phys', pow: 70, acc: 100, pp: 15, status: { s: 'PSN', chance: 0.3 }, desc: 'Poisonous fangs.' }),
    M({ id: 'blightbomb', name: 'Blight Bomb', type: 'TOXIN', cat: 'spec', pow: 90, acc: 100, pp: 10, status: { s: 'PSN', chance: 0.3 }, desc: 'Toxic explosion.' }),
    M({ id: 'miasma', name: 'Miasma', type: 'TOXIN', cat: 'status', pow: 0, acc: 90, pp: 20, status: { s: 'PSN', chance: 1 }, desc: 'Poisons the foe.' }),
    // MIND
    M({ id: 'mindpoke', name: 'Mind Poke', type: 'MIND', cat: 'spec', pow: 50, acc: 100, pp: 25, stat: { who: 'foe', key: 'spd', delta: -1, chance: 0.1 }, desc: 'A telekinetic jab.' }),
    M({ id: 'psyblast', name: 'Psyblast', type: 'MIND', cat: 'spec', pow: 90, acc: 100, pp: 10, stat: { who: 'foe', key: 'spc', delta: -1, chance: 0.1 }, desc: 'Psychic shockwave.' }),
    M({ id: 'focusmind', name: 'Focus Mind', type: 'MIND', cat: 'status', pow: 0, acc: 0, pp: 20, stat: { who: 'self', key: 'spc', delta: 2, chance: 1 }, desc: 'Sharply raises SPECIAL.' }),
    M({ id: 'lull', name: 'Lull', type: 'MIND', cat: 'status', pow: 0, acc: 60, pp: 20, status: { s: 'SLP', chance: 1 }, desc: 'Lulls foe to sleep.' }),
    // SHADE
    M({ id: 'duskbite', name: 'Dusk Bite', type: 'SHADE', cat: 'phys', pow: 60, acc: 100, pp: 25, flinch: 0.1, desc: 'Bites from the dark.' }),
    M({ id: 'shadepulse', name: 'Shade Pulse', type: 'SHADE', cat: 'spec', pow: 80, acc: 100, pp: 15, desc: 'A wave of shadow.' }),
    M({ id: 'nightlash', name: 'Night Lash', type: 'SHADE', cat: 'spec', pow: 100, acc: 90, pp: 10, desc: 'Lashes with night.' }),
    M({ id: 'spook', name: 'Spook', type: 'SHADE', cat: 'status', pow: 0, acc: 100, pp: 30, stat: { who: 'foe', key: 'spc', delta: -1, chance: 1 }, desc: 'Lowers foe SPECIAL.' }),
    // SPIRIT
    M({ id: 'glimmer', name: 'Glimmer', type: 'SPIRIT', cat: 'spec', pow: 40, acc: 100, pp: 30, desc: 'A spark of light.' }),
    M({ id: 'moonbeam', name: 'Moonbeam', type: 'SPIRIT', cat: 'spec', pow: 85, acc: 100, pp: 15, stat: { who: 'foe', key: 'spc', delta: -1, chance: 0.3 }, desc: 'Silver moonlight.' }),
    M({ id: 'radiant', name: 'Radiant Burst', type: 'SPIRIT', cat: 'spec', pow: 110, acc: 85, pp: 5, desc: 'Blinding radiance.' }),
    M({ id: 'soothe', name: 'Soothe', type: 'SPIRIT', cat: 'status', pow: 0, acc: 0, pp: 10, heal: 0.5, desc: 'Restores half max HP.' }),
    M({ id: 'dazzle', name: 'Dazzle', type: 'SPIRIT', cat: 'status', pow: 0, acc: 100, pp: 20, stat: { who: 'foe', key: 'atk', delta: -2, chance: 1 }, desc: 'Sharply lowers ATTACK.' }),
    M({ id: 'flicker', name: 'Flicker', type: 'SPIRIT', cat: 'status', pow: 0, acc: 100, pp: 20, stat: { who: 'foe', key: 'acc', delta: -1, chance: 1 }, desc: 'Lowers foe accuracy.' }),
  ].map((m) => [m.id, m]),
);

export const STRUGGLE: MoveDef = {
  id: 'struggle',
  name: 'Struggle',
  type: 'BEAST',
  cat: 'phys',
  pow: 50,
  acc: 0,
  pp: 1,
  recoil: 0.25,
  desc: 'Used when out of PP.',
};

export function move(id: string): MoveDef {
  const m = MOVES[id];
  if (!m) throw new Error('Unknown move ' + id);
  return m;
}
