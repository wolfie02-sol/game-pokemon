import type { Element } from './elements';

/** TOX is "badly poisoned": damage grows every turn of a battle. */
export type Status = 'PSN' | 'BRN' | 'PAR' | 'SLP' | 'FRZ' | 'TOX';
export type StatKey = 'atk' | 'def' | 'spd' | 'spc' | 'acc' | 'eva';

export interface StatEffect {
  who: 'self' | 'foe';
  key: StatKey;
  delta: number;
  chance: number;
}

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
  /** Stat stage changes. */
  stat?: StatEffect;
  stat2?: StatEffect;
  flinch?: number;
  drain?: number;
  recoil?: number;
  heal?: number;
  highCrit?: boolean;
  /** strikes several times in one turn */
  multi?: [number, number];
  /** ignores stats: a fixed amount, the user's level, or half the target's HP */
  fixed?: number | 'level' | 'half';
  /** chance to confuse */
  conf?: number;
  /** plants a draining seed on the foe */
  seed?: boolean;
  /** halves physical (reflect) or special (light) damage for 5 turns */
  screen?: 'reflect' | 'light';
  /** resets every stat change on the field */
  haze?: boolean;
  /** fully heals, then sleeps for two turns */
  rest?: boolean;
  /** the user faints after attacking */
  explode?: boolean;
  /** binds the foe for 2-5 turns of residual damage */
  trap?: boolean;
  /** the user must rest the next turn */
  recharge?: boolean;
  desc: string;
}

/**
 * Damage category follows the type, in the classic handheld style: elemental
 * types hit with SPECIAL, physical types (beast, brawl, toxin, earth, gale,
 * swarm, stone, shade) hit with ATTACK.
 */
const SPECIAL_TYPES = new Set<Element>(['FLAME', 'TIDE', 'LEAF', 'VOLT', 'FROST', 'MIND', 'WYRM']);
export function categoryFor(t: Element): 'phys' | 'spec' {
  return SPECIAL_TYPES.has(t) ? 'spec' : 'phys';
}

/** Attack move: category is derived from the type. */
const A = (m: Omit<MoveDef, 'cat'>): MoveDef => ({ ...m, cat: categoryFor(m.type) });
/** Status move. */
const S = (m: Omit<MoveDef, 'cat' | 'pow'>): MoveDef => ({ ...m, pow: 0, cat: 'status' });
const st = (who: 'self' | 'foe', key: StatKey, delta: number, chance = 1): StatEffect => ({ who, key, delta, chance });

export const MOVES: Record<string, MoveDef> = Object.fromEntries(
  [
    // ---------------- BEAST ----------------
    A({ id: 'bump', name: 'Bump', type: 'BEAST', pow: 40, acc: 100, pp: 35, desc: 'A full-body nudge.' }),
    A({ id: 'claw', name: 'Claw Swipe', type: 'BEAST', pow: 40, acc: 100, pp: 35, desc: 'Rakes with sharp claws.' }),
    A({ id: 'dash', name: 'Dart Dash', type: 'BEAST', pow: 40, acc: 100, pp: 30, priority: 1, desc: 'Always strikes first.' }),
    A({ id: 'swipes', name: 'Flurry Swipes', type: 'BEAST', pow: 18, acc: 85, pp: 15, multi: [2, 5], desc: 'Hits 2 to 5 times.' }),
    A({ id: 'ram', name: 'Ram', type: 'BEAST', pow: 70, acc: 100, pp: 15, flinch: 0.3, desc: 'May make the foe flinch.' }),
    A({ id: 'heavyslam', name: 'Heavy Slam', type: 'BEAST', pow: 80, acc: 85, pp: 20, desc: 'A crushing drop.' }),
    A({ id: 'feralbite', name: 'Feral Bite', type: 'BEAST', pow: 80, acc: 90, pp: 15, flinch: 0.1, desc: 'Bites with huge fangs.' }),
    A({ id: 'pounce', name: 'Pounce', type: 'BEAST', pow: 85, acc: 100, pp: 15, status: { s: 'PAR', chance: 0.3 }, desc: 'May paralyze the foe.' }),
    A({ id: 'rush', name: 'Reckless Rush', type: 'BEAST', pow: 90, acc: 85, pp: 20, recoil: 0.25, desc: 'Hurts the user too.' }),
    A({ id: 'stampede', name: 'Stampede', type: 'BEAST', pow: 120, acc: 90, pp: 5, recoil: 0.33, desc: 'Massive charge. Recoil.' }),
    A({ id: 'overdrive', name: 'Overdrive Beam', type: 'BEAST', pow: 150, acc: 90, pp: 5, recharge: true, desc: 'Huge power. Must rest after.' }),
    A({ id: 'lastblaze', name: 'Last Blaze', type: 'BEAST', pow: 170, acc: 100, pp: 5, explode: true, desc: 'The user faints. Enormous power.' }),
    A({ id: 'stardart', name: 'Star Dart', type: 'BEAST', pow: 60, acc: 0, pp: 20, desc: 'Never misses.' }),
    A({ id: 'coilbind', name: 'Coil Bind', type: 'BEAST', pow: 15, acc: 90, pp: 20, trap: true, desc: 'Squeezes for 2-5 turns.' }),
    A({ id: 'gnaw', name: 'Halving Gnaw', type: 'BEAST', pow: 1, acc: 90, pp: 10, fixed: 'half', desc: "Cuts the foe's HP in half." }),
    A({ id: 'sonicpop', name: 'Sonic Pop', type: 'BEAST', pow: 1, acc: 90, pp: 20, fixed: 20, desc: 'Always deals 20 damage.' }),
    A({ id: 'crushjaw', name: 'Crushing Jaw', type: 'BEAST', pow: 100, acc: 90, pp: 10, flinch: 0.2, desc: 'May cause flinching.' }),
    S({ id: 'snarl', name: 'Snarl', type: 'BEAST', acc: 100, pp: 40, stat: st('foe', 'atk', -1), desc: 'Lowers foe ATTACK.' }),
    S({ id: 'glare', name: 'Glare', type: 'BEAST', acc: 100, pp: 30, stat: st('foe', 'def', -1), desc: 'Lowers foe DEFENSE.' }),
    S({ id: 'shriek', name: 'Shriek', type: 'BEAST', acc: 85, pp: 40, stat: st('foe', 'def', -2), desc: 'Sharply lowers DEFENSE.' }),
    S({ id: 'rally', name: 'Rally', type: 'BEAST', acc: 0, pp: 20, stat: st('self', 'atk', 2), desc: 'Sharply raises ATTACK.' }),
    S({ id: 'bristle', name: 'Bristle', type: 'BEAST', acc: 0, pp: 30, stat: st('self', 'def', 1), desc: 'Raises DEFENSE.' }),
    S({ id: 'afterimage', name: 'Afterimage', type: 'BEAST', acc: 0, pp: 15, stat: st('self', 'eva', 1), desc: 'Raises evasion.' }),
    S({ id: 'sandflick', name: 'Sand Flick', type: 'BEAST', acc: 100, pp: 15, stat: st('foe', 'acc', -1), desc: 'Lowers foe accuracy.' }),
    S({ id: 'hushsong', name: 'Hush Song', type: 'BEAST', acc: 55, pp: 15, status: { s: 'SLP', chance: 1 }, desc: 'A lullaby that brings sleep.' }),
    S({ id: 'dizzydance', name: 'Dizzy Dance', type: 'BEAST', acc: 75, pp: 20, conf: 1, desc: 'Confuses the foe.' }),
    S({ id: 'mend', name: 'Mend', type: 'BEAST', acc: 0, pp: 10, heal: 0.5, desc: 'Restores half max HP.' }),
    S({ id: 'nap', name: 'Deep Nap', type: 'BEAST', acc: 0, pp: 10, rest: true, desc: 'Full heal, then sleeps 2 turns.' }),
    // ---------------- FLAME ----------------
    A({ id: 'sparkspit', name: 'Spark Spit', type: 'FLAME', pow: 40, acc: 100, pp: 25, status: { s: 'BRN', chance: 0.1 }, desc: 'May burn the foe.' }),
    A({ id: 'embercoil', name: 'Ember Coil', type: 'FLAME', pow: 35, acc: 85, pp: 15, trap: true, desc: 'Traps the foe in fire.' }),
    A({ id: 'cinderfang', name: 'Cinder Fang', type: 'FLAME', pow: 65, acc: 95, pp: 15, status: { s: 'BRN', chance: 0.1 }, desc: 'A burning bite.' }),
    A({ id: 'blazewheel', name: 'Blaze Wheel', type: 'FLAME', pow: 75, acc: 100, pp: 15, status: { s: 'BRN', chance: 0.1 }, desc: 'Rolls in a ring of fire.' }),
    A({ id: 'flareburst', name: 'Flare Burst', type: 'FLAME', pow: 90, acc: 100, pp: 15, status: { s: 'BRN', chance: 0.1 }, desc: 'A blast of flame.' }),
    A({ id: 'pyrewave', name: 'Pyre Wave', type: 'FLAME', pow: 95, acc: 95, pp: 10, status: { s: 'BRN', chance: 0.2 }, desc: 'A rolling wall of fire.' }),
    A({ id: 'sunblaze', name: 'Sunblaze', type: 'FLAME', pow: 110, acc: 85, pp: 5, status: { s: 'BRN', chance: 0.3 }, desc: 'A scorching inferno.' }),
    S({ id: 'smolder', name: 'Smolder', type: 'FLAME', acc: 85, pp: 15, status: { s: 'BRN', chance: 1 }, desc: 'Burns the foe.' }),
    S({ id: 'heatshimmer', name: 'Heat Shimmer', type: 'FLAME', acc: 0, pp: 20, stat: st('self', 'eva', 1), stat2: st('self', 'spc', 1), desc: 'Raises evasion and SPECIAL.' }),
    // ---------------- TIDE ----------------
    A({ id: 'bubblet', name: 'Bubblet', type: 'TIDE', pow: 40, acc: 100, pp: 30, stat: st('foe', 'spd', -1, 0.1), desc: 'May lower SPEED.' }),
    A({ id: 'splashjet', name: 'Splash Jet', type: 'TIDE', pow: 45, acc: 100, pp: 25, desc: 'Squirts water.' }),
    A({ id: 'riptrap', name: 'Rip Trap', type: 'TIDE', pow: 35, acc: 85, pp: 15, trap: true, desc: 'Drags the foe in a whirl.' }),
    A({ id: 'cascade', name: 'Cascade', type: 'TIDE', pow: 80, acc: 100, pp: 15, flinch: 0.2, desc: 'May cause flinching.' }),
    A({ id: 'tidelash', name: 'Tide Lash', type: 'TIDE', pow: 80, acc: 95, pp: 10, desc: 'A watery tail whip.' }),
    A({ id: 'pincersmash', name: 'Pincer Smash', type: 'TIDE', pow: 90, acc: 85, pp: 10, highCrit: true, desc: 'High critical ratio.' }),
    A({ id: 'riptide', name: 'Riptide', type: 'TIDE', pow: 90, acc: 100, pp: 15, desc: 'A crashing wave.' }),
    A({ id: 'torrent', name: 'Torrent Cannon', type: 'TIDE', pow: 110, acc: 80, pp: 5, desc: 'High-pressure water.' }),
    S({ id: 'shellup', name: 'Shell Up', type: 'TIDE', acc: 0, pp: 20, stat: st('self', 'def', 2), desc: 'Sharply raises DEFENSE.' }),
    S({ id: 'calmmist', name: 'Calm Mist', type: 'TIDE', acc: 0, pp: 20, haze: true, desc: 'Erases all stat changes.' }),
    // ---------------- LEAF ----------------
    A({ id: 'vinesnap', name: 'Vine Snap', type: 'LEAF', pow: 45, acc: 100, pp: 25, desc: 'Lashes with vines.' }),
    A({ id: 'sapsip', name: 'Sap Sip', type: 'LEAF', pow: 30, acc: 100, pp: 20, drain: 0.5, desc: 'Drains HP from the foe.' }),
    A({ id: 'leafcutter', name: 'Leaf Cutter', type: 'LEAF', pow: 55, acc: 95, pp: 25, highCrit: true, desc: 'High critical ratio.' }),
    A({ id: 'deepsap', name: 'Deep Sap', type: 'LEAF', pow: 60, acc: 100, pp: 15, drain: 0.5, desc: 'Drains a lot of HP.' }),
    A({ id: 'thornvolley', name: 'Thorn Volley', type: 'LEAF', pow: 90, acc: 100, pp: 15, desc: 'A storm of thorns.' }),
    A({ id: 'petalgale', name: 'Petal Gale', type: 'LEAF', pow: 100, acc: 95, pp: 10, desc: 'A whirlwind of petals.' }),
    A({ id: 'bloomburst', name: 'Bloom Burst', type: 'LEAF', pow: 120, acc: 85, pp: 5, desc: 'An explosive blossom.' }),
    A({ id: 'sunlance', name: 'Sun Lance', type: 'LEAF', pow: 130, acc: 100, pp: 5, recharge: true, desc: 'Focused sunlight. Must rest.' }),
    S({ id: 'sporecloud', name: 'Spore Cloud', type: 'LEAF', acc: 75, pp: 15, status: { s: 'SLP', chance: 1 }, desc: 'Puts the foe to sleep.' }),
    S({ id: 'numbpollen', name: 'Numbing Pollen', type: 'LEAF', acc: 75, pp: 30, status: { s: 'PAR', chance: 1 }, desc: 'Paralyzes the foe.' }),
    S({ id: 'bitterpollen', name: 'Bitter Pollen', type: 'LEAF', acc: 75, pp: 35, status: { s: 'PSN', chance: 1 }, desc: 'Poisons the foe.' }),
    S({ id: 'leechsprout', name: 'Leech Sprout', type: 'LEAF', acc: 90, pp: 10, seed: true, desc: 'Steals HP every turn.' }),
    S({ id: 'sunsoak', name: 'Sun Soak', type: 'LEAF', acc: 0, pp: 20, stat: st('self', 'spc', 1), desc: 'Raises SPECIAL.' }),
    S({ id: 'photosynth', name: 'Photosynth', type: 'LEAF', acc: 0, pp: 10, heal: 0.5, desc: 'Restores half max HP.' }),
    // ---------------- VOLT ----------------
    A({ id: 'zap', name: 'Zap', type: 'VOLT', pow: 40, acc: 100, pp: 30, status: { s: 'PAR', chance: 0.1 }, desc: 'May paralyze.' }),
    A({ id: 'voltbite', name: 'Volt Bite', type: 'VOLT', pow: 65, acc: 95, pp: 15, status: { s: 'PAR', chance: 0.1 }, desc: 'Electric fangs.' }),
    A({ id: 'sparkdash', name: 'Spark Dash', type: 'VOLT', pow: 75, acc: 100, pp: 15, status: { s: 'PAR', chance: 0.3 }, desc: 'A charged tackle.' }),
    A({ id: 'arcbolt', name: 'Arc Bolt', type: 'VOLT', pow: 90, acc: 100, pp: 15, status: { s: 'PAR', chance: 0.1 }, desc: 'Arcing lightning.' }),
    A({ id: 'voltrush', name: 'Volt Rush', type: 'VOLT', pow: 100, acc: 95, pp: 10, recoil: 0.25, desc: 'A reckless charge. Recoil.' }),
    A({ id: 'thunderclap', name: 'Thunderclap', type: 'VOLT', pow: 110, acc: 70, pp: 10, status: { s: 'PAR', chance: 0.3 }, desc: 'A deafening strike.' }),
    S({ id: 'joltwave', name: 'Jolt Wave', type: 'VOLT', acc: 90, pp: 20, status: { s: 'PAR', chance: 1 }, desc: 'Paralyzes the foe.' }),
    S({ id: 'ionveil', name: 'Ion Veil', type: 'VOLT', acc: 0, pp: 20, screen: 'light', desc: 'Halves SPECIAL damage taken.' }),
    S({ id: 'overcharge', name: 'Overcharge', type: 'VOLT', acc: 0, pp: 20, stat: st('self', 'spd', 2), desc: 'Sharply raises SPEED.' }),
    // ---------------- FROST ----------------
    A({ id: 'chillbreath', name: 'Chill Breath', type: 'FROST', pow: 40, acc: 100, pp: 25, status: { s: 'FRZ', chance: 0.1 }, desc: 'May freeze.' }),
    A({ id: 'iceneedle', name: 'Ice Needle', type: 'FROST', pow: 40, acc: 100, pp: 30, priority: 1, desc: 'Always strikes first.' }),
    A({ id: 'hailshards', name: 'Hail Shards', type: 'FROST', pow: 25, acc: 90, pp: 20, multi: [2, 5], desc: 'Hits 2 to 5 times.' }),
    A({ id: 'frostfang', name: 'Frost Fang', type: 'FROST', pow: 65, acc: 95, pp: 15, status: { s: 'FRZ', chance: 0.1 }, desc: 'A freezing bite.' }),
    A({ id: 'auroraray', name: 'Aurora Ray', type: 'FROST', pow: 65, acc: 100, pp: 20, stat: st('foe', 'atk', -1, 0.3), desc: 'May lower ATTACK.' }),
    A({ id: 'glacierbeam', name: 'Glacier Beam', type: 'FROST', pow: 90, acc: 100, pp: 10, status: { s: 'FRZ', chance: 0.1 }, desc: 'A beam of ice.' }),
    A({ id: 'whiteout', name: 'Whiteout Gale', type: 'FROST', pow: 110, acc: 70, pp: 5, status: { s: 'FRZ', chance: 0.1 }, desc: 'A raging snowstorm.' }),
    S({ id: 'rimewall', name: 'Rime Wall', type: 'FROST', acc: 0, pp: 20, screen: 'reflect', desc: 'Halves physical damage taken.' }),
    S({ id: 'frozenhush', name: 'Frozen Hush', type: 'FROST', acc: 0, pp: 20, haze: true, desc: 'Freezes away stat changes.' }),
    // ---------------- BRAWL ----------------
    A({ id: 'edgechop', name: 'Edge Chop', type: 'BRAWL', pow: 50, acc: 100, pp: 25, highCrit: true, desc: 'High critical ratio.' }),
    A({ id: 'sweepkick', name: 'Sweep Kick', type: 'BRAWL', pow: 50, acc: 90, pp: 20, flinch: 0.3, desc: 'May cause flinching.' }),
    A({ id: 'twinkick', name: 'Twin Kick', type: 'BRAWL', pow: 30, acc: 100, pp: 30, multi: [2, 2], desc: 'Kicks twice.' }),
    A({ id: 'mountaintoss', name: 'Mountain Toss', type: 'BRAWL', pow: 1, acc: 100, pp: 20, fixed: 'level', desc: "Damage equals the user's level." }),
    A({ id: 'shatterpalm', name: 'Shatter Palm', type: 'BRAWL', pow: 75, acc: 100, pp: 15, desc: 'A palm strike that breaks guard.' }),
    A({ id: 'grapple', name: 'Grapple Throw', type: 'BRAWL', pow: 80, acc: 80, pp: 20, recoil: 0.25, desc: 'A risky throw. Recoil.' }),
    A({ id: 'skyknee', name: 'Sky Knee', type: 'BRAWL', pow: 100, acc: 90, pp: 10, desc: 'A soaring knee strike.' }),
    A({ id: 'titanblow', name: 'Titan Blow', type: 'BRAWL', pow: 120, acc: 75, pp: 5, conf: 0.3, desc: 'May confuse the foe.' }),
    S({ id: 'bracestance', name: 'Brace Stance', type: 'BRAWL', acc: 0, pp: 20, stat: st('self', 'atk', 1), stat2: st('self', 'def', 1), desc: 'Raises ATTACK and DEFENSE.' }),
    // ---------------- TOXIN ----------------
    A({ id: 'sting', name: 'Toxic Sting', type: 'TOXIN', pow: 15, acc: 100, pp: 35, status: { s: 'PSN', chance: 0.3 }, desc: 'May poison.' }),
    A({ id: 'fumepuff', name: 'Fume Puff', type: 'TOXIN', pow: 30, acc: 70, pp: 20, status: { s: 'PSN', chance: 0.4 }, desc: 'Noxious gas. May poison.' }),
    A({ id: 'acidspray', name: 'Acid Spray', type: 'TOXIN', pow: 40, acc: 100, pp: 30, stat: st('foe', 'def', -1, 0.1), desc: 'May lower DEFENSE.' }),
    A({ id: 'venomfang', name: 'Venom Fang', type: 'TOXIN', pow: 70, acc: 100, pp: 15, status: { s: 'PSN', chance: 0.3 }, desc: 'Poisonous fangs.' }),
    A({ id: 'blightbomb', name: 'Blight Bomb', type: 'TOXIN', pow: 90, acc: 100, pp: 10, status: { s: 'PSN', chance: 0.3 }, desc: 'A toxic explosion.' }),
    A({ id: 'bilesurge', name: 'Bile Surge', type: 'TOXIN', pow: 95, acc: 100, pp: 10, status: { s: 'PSN', chance: 0.1 }, desc: 'A wave of sludge.' }),
    A({ id: 'grimecannon', name: 'Grime Cannon', type: 'TOXIN', pow: 120, acc: 80, pp: 5, status: { s: 'PSN', chance: 0.3 }, desc: 'Fires filthy muck.' }),
    S({ id: 'miasma', name: 'Miasma', type: 'TOXIN', acc: 90, pp: 20, status: { s: 'PSN', chance: 1 }, desc: 'Poisons the foe.' }),
    S({ id: 'venomseep', name: 'Venom Seep', type: 'TOXIN', acc: 85, pp: 10, status: { s: 'TOX', chance: 1 }, desc: 'Badly poisons the foe.' }),
    S({ id: 'oozeshell', name: 'Ooze Shell', type: 'TOXIN', acc: 0, pp: 20, stat: st('self', 'def', 2), desc: 'Sharply raises DEFENSE.' }),
    // ---------------- EARTH ----------------
    A({ id: 'mudflick', name: 'Mud Flick', type: 'EARTH', pow: 20, acc: 100, pp: 10, stat: st('foe', 'acc', -1), desc: 'Lowers foe accuracy.' }),
    A({ id: 'sandsnare', name: 'Sand Snare', type: 'EARTH', pow: 35, acc: 85, pp: 15, trap: true, desc: 'Traps the foe in sand.' }),
    A({ id: 'boneboomer', name: 'Bone Boomer', type: 'EARTH', pow: 50, acc: 90, pp: 10, multi: [2, 2], desc: 'Strikes twice.' }),
    A({ id: 'mudvolley', name: 'Mud Volley', type: 'EARTH', pow: 55, acc: 95, pp: 15, stat: st('foe', 'spd', -1), desc: 'Lowers SPEED.' }),
    A({ id: 'burrow', name: 'Burrow Strike', type: 'EARTH', pow: 80, acc: 100, pp: 10, desc: 'Strikes from underground.' }),
    A({ id: 'earthshake', name: 'Earthshake', type: 'EARTH', pow: 100, acc: 100, pp: 10, desc: 'Shakes the ground.' }),
    A({ id: 'riftquake', name: 'Rift Quake', type: 'EARTH', pow: 120, acc: 85, pp: 5, desc: 'Splits the earth open.' }),
    S({ id: 'dustcloak', name: 'Dust Cloak', type: 'EARTH', acc: 0, pp: 15, stat: st('self', 'eva', 1), desc: 'Raises evasion.' }),
    // ---------------- GALE ----------------
    A({ id: 'beakjab', name: 'Beak Jab', type: 'GALE', pow: 35, acc: 100, pp: 35, desc: 'Jabs with a beak.' }),
    A({ id: 'wingflick', name: 'Wing Flick', type: 'GALE', pow: 40, acc: 100, pp: 35, desc: 'Whips up a breeze.' }),
    A({ id: 'aerialace', name: 'Swift Wing', type: 'GALE', pow: 60, acc: 0, pp: 20, desc: 'Never misses.' }),
    A({ id: 'skyslash', name: 'Sky Slash', type: 'GALE', pow: 75, acc: 95, pp: 15, highCrit: true, desc: 'High critical ratio.' }),
    A({ id: 'drillbeak', name: 'Drill Beak', type: 'GALE', pow: 80, acc: 100, pp: 20, desc: 'A spinning peck.' }),
    A({ id: 'divebomb', name: 'Dive Bomb', type: 'GALE', pow: 90, acc: 95, pp: 15, desc: 'Plunges from the sky.' }),
    A({ id: 'tempest', name: 'Tempest', type: 'GALE', pow: 110, acc: 70, pp: 10, conf: 0.3, desc: 'A violent cyclone.' }),
    S({ id: 'updraft', name: 'Updraft', type: 'GALE', acc: 0, pp: 20, stat: st('self', 'spd', 2), desc: 'Sharply raises SPEED.' }),
    S({ id: 'downfeather', name: 'Down Feathers', type: 'GALE', acc: 100, pp: 15, stat: st('foe', 'atk', -2), desc: 'Sharply lowers ATTACK.' }),
    S({ id: 'roost', name: 'Perch Rest', type: 'GALE', acc: 0, pp: 10, heal: 0.5, desc: 'Restores half max HP.' }),
    // ---------------- MIND ----------------
    A({ id: 'psyripple', name: 'Psy Ripple', type: 'MIND', pow: 50, acc: 100, pp: 25, conf: 0.1, desc: 'May confuse.' }),
    A({ id: 'mindpoke', name: 'Mind Poke', type: 'MIND', pow: 65, acc: 100, pp: 20, stat: st('foe', 'spd', -1, 0.1), desc: 'A telekinetic jab.' }),
    A({ id: 'mindwave', name: 'Mind Wave', type: 'MIND', pow: 1, acc: 90, pp: 15, fixed: 'level', desc: "Damage equals the user's level." }),
    A({ id: 'psyblast', name: 'Psyblast', type: 'MIND', pow: 90, acc: 100, pp: 10, stat: st('foe', 'spc', -1, 0.3), desc: 'A psychic shockwave.' }),
    A({ id: 'mindstorm', name: 'Mindstorm', type: 'MIND', pow: 120, acc: 85, pp: 5, conf: 0.2, desc: 'An overwhelming mental tide.' }),
    S({ id: 'focusmind', name: 'Focus Mind', type: 'MIND', acc: 0, pp: 20, stat: st('self', 'spc', 2), desc: 'Sharply raises SPECIAL.' }),
    S({ id: 'blinkstep', name: 'Blink Step', type: 'MIND', acc: 0, pp: 30, stat: st('self', 'spd', 2), desc: 'Sharply raises SPEED.' }),
    S({ id: 'prismguard', name: 'Prism Guard', type: 'MIND', acc: 0, pp: 30, stat: st('self', 'def', 2), desc: 'Sharply raises DEFENSE.' }),
    S({ id: 'mirrorward', name: 'Mirror Ward', type: 'MIND', acc: 0, pp: 20, screen: 'reflect', desc: 'Halves physical damage taken.' }),
    S({ id: 'mindveil', name: 'Mind Veil', type: 'MIND', acc: 0, pp: 30, screen: 'light', desc: 'Halves SPECIAL damage taken.' }),
    S({ id: 'lull', name: 'Lull', type: 'MIND', acc: 60, pp: 20, status: { s: 'SLP', chance: 1 }, desc: 'Lulls the foe to sleep.' }),
    S({ id: 'bendgaze', name: 'Bend Gaze', type: 'MIND', acc: 80, pp: 15, stat: st('foe', 'acc', -1), desc: 'Lowers foe accuracy.' }),
    S({ id: 'restore', name: 'Restore', type: 'MIND', acc: 0, pp: 10, heal: 0.5, desc: 'Restores half max HP.' }),
    // ---------------- SWARM ----------------
    A({ id: 'pinvolley', name: 'Pin Volley', type: 'SWARM', pow: 18, acc: 85, pp: 20, multi: [2, 5], desc: 'Hits 2 to 5 times.' }),
    A({ id: 'twinbarb', name: 'Twin Barb', type: 'SWARM', pow: 25, acc: 100, pp: 20, multi: [2, 2], status: { s: 'PSN', chance: 0.2 }, desc: 'Hits twice. May poison.' }),
    A({ id: 'siphonbite', name: 'Siphon Bite', type: 'SWARM', pow: 40, acc: 100, pp: 15, drain: 0.5, desc: 'Drains HP from the foe.' }),
    A({ id: 'glowsignal', name: 'Glow Signal', type: 'SWARM', pow: 75, acc: 100, pp: 15, conf: 0.1, desc: 'A dazzling flash. May confuse.' }),
    A({ id: 'crosscut', name: 'Cross Cut', type: 'SWARM', pow: 80, acc: 100, pp: 15, desc: 'Slashes in an X.' }),
    A({ id: 'dronebuzz', name: 'Drone Buzz', type: 'SWARM', pow: 90, acc: 100, pp: 10, stat: st('foe', 'spc', -1, 0.1), desc: 'A droning wave of sound.' }),
    A({ id: 'greathorn', name: 'Great Horn', type: 'SWARM', pow: 110, acc: 85, pp: 10, desc: 'A brutal horn ram.' }),
    S({ id: 'silkshot', name: 'Silk Shot', type: 'SWARM', acc: 95, pp: 40, stat: st('foe', 'spd', -1), desc: 'Lowers foe SPEED.' }),
    S({ id: 'hiveguard', name: 'Hive Guard', type: 'SWARM', acc: 0, pp: 20, stat: st('self', 'def', 1), stat2: st('self', 'spc', 1), desc: 'Raises DEFENSE and SPECIAL.' }),
    // ---------------- STONE ----------------
    A({ id: 'pebble', name: 'Pebble Toss', type: 'STONE', pow: 50, acc: 90, pp: 15, desc: 'Hurls small rocks.' }),
    A({ id: 'shardspin', name: 'Shard Spin', type: 'STONE', pow: 25, acc: 90, pp: 15, multi: [2, 5], desc: 'Hits 2 to 5 times.' }),
    A({ id: 'rubble', name: 'Rubble Drop', type: 'STONE', pow: 75, acc: 90, pp: 10, flinch: 0.3, desc: 'May cause flinching.' }),
    A({ id: 'cragedge', name: 'Crag Edge', type: 'STONE', pow: 100, acc: 80, pp: 5, highCrit: true, desc: 'High critical ratio.' }),
    A({ id: 'bouldercrash', name: 'Boulder Crash', type: 'STONE', pow: 110, acc: 80, pp: 5, desc: 'Drops a boulder.' }),
    S({ id: 'stoneskin', name: 'Stone Skin', type: 'STONE', acc: 0, pp: 20, stat: st('self', 'def', 2), desc: 'Sharply raises DEFENSE.' }),
    S({ id: 'rockpolish', name: 'Rock Polish', type: 'STONE', acc: 0, pp: 20, stat: st('self', 'spd', 2), desc: 'Sharply raises SPEED.' }),
    // ---------------- SHADE ----------------
    A({ id: 'chilltouch', name: 'Chill Touch', type: 'SHADE', pow: 30, acc: 100, pp: 30, status: { s: 'PAR', chance: 0.3 }, desc: 'May paralyze.' }),
    A({ id: 'nighttoll', name: 'Night Toll', type: 'SHADE', pow: 1, acc: 100, pp: 15, fixed: 'level', desc: "Damage equals the user's level." }),
    A({ id: 'duskbite', name: 'Dusk Bite', type: 'SHADE', pow: 60, acc: 100, pp: 25, flinch: 0.1, desc: 'Bites from the dark.' }),
    A({ id: 'phantomclaw', name: 'Phantom Claw', type: 'SHADE', pow: 70, acc: 100, pp: 15, highCrit: true, desc: 'High critical ratio.' }),
    A({ id: 'shadepulse', name: 'Shade Pulse', type: 'SHADE', pow: 80, acc: 100, pp: 15, desc: 'A wave of shadow.' }),
    A({ id: 'nightlash', name: 'Night Lash', type: 'SHADE', pow: 100, acc: 90, pp: 10, stat: st('foe', 'def', -1, 0.2), desc: 'Lashes with night.' }),
    S({ id: 'spook', name: 'Spook', type: 'SHADE', acc: 100, pp: 30, stat: st('foe', 'spc', -1), desc: 'Lowers foe SPECIAL.' }),
    S({ id: 'hauntlight', name: 'Haunt Light', type: 'SHADE', acc: 100, pp: 10, conf: 1, desc: 'Confuses the foe.' }),
    // ---------------- WYRM ----------------
    A({ id: 'wyrmfury', name: 'Wyrm Fury', type: 'WYRM', pow: 1, acc: 100, pp: 10, fixed: 40, desc: 'Always deals 40 damage.' }),
    A({ id: 'scaletwister', name: 'Scale Twister', type: 'WYRM', pow: 40, acc: 100, pp: 20, flinch: 0.2, desc: 'May cause flinching.' }),
    A({ id: 'drakebreath', name: 'Drake Breath', type: 'WYRM', pow: 60, acc: 100, pp: 20, status: { s: 'PAR', chance: 0.3 }, desc: 'May paralyze.' }),
    A({ id: 'wyrmclaw', name: 'Wyrm Claw', type: 'WYRM', pow: 80, acc: 100, pp: 15, desc: 'Rends with ancient claws.' }),
    A({ id: 'dragonsurge', name: 'Dragon Surge', type: 'WYRM', pow: 120, acc: 90, pp: 5, recharge: true, desc: 'Must rest after use.' }),
    S({ id: 'scaledance', name: 'Scale Dance', type: 'WYRM', acc: 0, pp: 20, stat: st('self', 'atk', 1), stat2: st('self', 'spd', 1), desc: 'Raises ATTACK and SPEED.' }),
    // ---------------- signature moves ----------------
    A({ id: 'dawnflare', name: 'Dawn Flare', type: 'FLAME', pow: 120, acc: 90, pp: 5, status: { s: 'BRN', chance: 0.3 }, desc: 'The light of the first sunrise.' }),
    A({ id: 'stormspear', name: 'Storm Spear', type: 'VOLT', pow: 120, acc: 90, pp: 5, status: { s: 'PAR', chance: 0.3 }, desc: 'A lance of living lightning.' }),
    A({ id: 'rimecrown', name: 'Rime Crown', type: 'FROST', pow: 120, acc: 90, pp: 5, status: { s: 'FRZ', chance: 0.2 }, desc: 'A crown of glacial light.' }),
    A({ id: 'voidpulse', name: 'Void Pulse', type: 'MIND', pow: 140, acc: 90, pp: 5, stat: st('foe', 'spc', -1, 0.5), desc: 'A pulse from beyond the rift.' }),
    A({ id: 'genesis', name: 'Genesis Spark', type: 'MIND', pow: 100, acc: 100, pp: 10, stat: st('self', 'spc', 1, 0.5), desc: 'The spark that began all Wildkin.' }),
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

