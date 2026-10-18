import type { Element } from './elements';

export type Arch =
  | 'quad'
  | 'biped'
  | 'bird'
  | 'blob'
  | 'fish'
  | 'serpent'
  | 'moth'
  | 'ghost'
  | 'plant'
  | 'golem'
  | 'turtle';

export interface ArtSpec {
  arch: Arch;
  /** main body colour */
  c1: string;
  /** accent colour */
  c2: string;
  /** belly / muzzle colour */
  c3?: string;
  /** 0.5 - 1.0: overall size inside the 48px frame */
  size: number;
  ears?: 'point' | 'round' | 'long' | 'fin' | 'none';
  tail?: 'flame' | 'leaf' | 'plain' | 'bolt' | 'fin' | 'fluff' | 'none';
  eyes?: 'round' | 'sharp' | 'sleepy' | 'big';
  extra?: string[];
}

export interface Species {
  id: number;
  name: string;
  types: Element[];
  /** hp, atk, def, spd, spc */
  base: [number, number, number, number, number];
  catchRate: number;
  expYield: number;
  evo?: { lvl: number; to: number };
  learn: [number, string][];
  dex: string;
  kind: string;
  art: ArtSpec;
}

function L(s: string): [number, string][] {
  return s
    .trim()
    .split(/\s+/)
    .map((t) => {
      const [l, m] = t.split(':');
      return [parseInt(l), m] as [number, string];
    });
}

const S: Species[] = [
  {
    id: 1, name: 'Emberkit', types: ['FLAME'], base: [39, 52, 43, 65, 55], catchRate: 45, expYield: 62, evo: { lvl: 16, to: 2 },
    learn: L('1:claw 1:snarl 7:sparkspit 12:dash 17:cinderfang 24:rally 31:flareburst 40:sunblaze'),
    kind: 'Kindle Cub', dex: 'Its tail flame flickers brighter when it is happy. It naps in warm ash.',
    art: { arch: 'quad', c1: '#f08038', c2: '#ffd040', c3: '#fff0c8', size: 0.62, ears: 'point', tail: 'flame', eyes: 'big' },
  },
  {
    id: 2, name: 'Blazelynx', types: ['FLAME'], base: [58, 66, 58, 82, 68], catchRate: 45, expYield: 142, evo: { lvl: 36, to: 3 },
    learn: L('1:claw 1:snarl 1:sparkspit 12:dash 17:cinderfang 26:rally 33:flareburst 44:sunblaze'),
    kind: 'Ember Lynx', dex: 'Tufts of fire crown its ears. It stalks prey across scorched ridges.',
    art: { arch: 'quad', c1: '#e86030', c2: '#ffc838', c3: '#fff0c8', size: 0.8, ears: 'point', tail: 'flame', eyes: 'sharp', extra: ['cheeks'] },
  },
  {
    id: 3, name: 'Pyrolion', types: ['FLAME', 'STONE'], base: [80, 88, 80, 100, 88], catchRate: 45, expYield: 230,
    learn: L('1:claw 1:sparkspit 1:cinderfang 26:rally 33:flareburst 36:rubble 44:sunblaze 50:earthshake'),
    kind: 'Magma King', dex: 'Its mane is molten rock. A single roar can melt a boulder to slag.',
    art: { arch: 'quad', c1: '#d04828', c2: '#ffb030', c3: '#f8d8a0', size: 1, ears: 'round', tail: 'flame', eyes: 'sharp', extra: ['mane'] },
  },
  {
    id: 4, name: 'Splashel', types: ['TIDE'], base: [44, 48, 65, 43, 52], catchRate: 45, expYield: 63, evo: { lvl: 16, to: 5 },
    learn: L('1:bump 1:glare 7:bubblet 12:shellup 15:splashjet 22:ram 30:tidelash 37:riptide 45:torrent'),
    kind: 'Puddle Shell', dex: 'It hides in its soft shell when startled and squirts water at its foes.',
    art: { arch: 'turtle', c1: '#58a8f0', c2: '#c89858', c3: '#f8f0c0', size: 0.6, eyes: 'big', tail: 'plain' },
  },
  {
    id: 5, name: 'Torrentoise', types: ['TIDE'], base: [59, 63, 80, 58, 66], catchRate: 45, expYield: 142, evo: { lvl: 36, to: 6 },
    learn: L('1:bump 1:bubblet 1:shellup 15:splashjet 24:ram 32:tidelash 39:riptide 47:torrent'),
    kind: 'Current Shell', dex: 'Fins on its shell let it glide through rapids faster than a canoe.',
    art: { arch: 'turtle', c1: '#3c88e0', c2: '#a87840', c3: '#f0e8b8', size: 0.8, eyes: 'round', tail: 'fin', extra: ['fins'] },
  },
  {
    id: 6, name: 'Abyshell', types: ['TIDE', 'STONE'], base: [80, 84, 102, 76, 86], catchRate: 45, expYield: 232,
    learn: L('1:bump 1:splashjet 1:shellup 32:tidelash 36:rubble 39:riptide 47:torrent 52:earthshake'),
    kind: 'Deep Fortress', dex: 'Coral-like spires grow from its shell. It guards ancient sea trenches.',
    art: { arch: 'turtle', c1: '#2c68c0', c2: '#808898', c3: '#e8e0b0', size: 1, eyes: 'sharp', tail: 'fin', extra: ['spikes', 'fins'] },
  },
  {
    id: 7, name: 'Sproutle', types: ['LEAF'], base: [45, 49, 49, 47, 65], catchRate: 45, expYield: 64, evo: { lvl: 16, to: 8 },
    learn: L('1:bump 1:snarl 7:vinesnap 11:sapsip 15:sporecloud 20:leafcutter 28:photosynth 34:thornvolley 44:bloomburst'),
    kind: 'Seedling', dex: 'The bud on its head drinks sunlight. It hops through meadows at dawn.',
    art: { arch: 'biped', c1: '#68c058', c2: '#f080a0', c3: '#f0f8d0', size: 0.6, ears: 'long', eyes: 'big', extra: ['leafhead'] },
  },
  {
    id: 8, name: 'Bramblebun', types: ['LEAF'], base: [60, 62, 63, 62, 80], catchRate: 45, expYield: 141, evo: { lvl: 36, to: 9 },
    learn: L('1:bump 1:vinesnap 1:sapsip 15:sporecloud 22:leafcutter 30:photosynth 37:thornvolley 46:bloomburst'),
    kind: 'Thicket Hare', dex: 'Thorny vines wrap its ears. It defends the forest with a fierce stomp.',
    art: { arch: 'biped', c1: '#48a848', c2: '#e86090', c3: '#e0f0c0', size: 0.8, ears: 'long', eyes: 'round', extra: ['leafhead', 'collar'] },
  },
  {
    id: 9, name: 'Thornhare', types: ['LEAF', 'SPIRIT'], base: [80, 82, 83, 82, 100], catchRate: 45, expYield: 236,
    learn: L('1:vinesnap 1:sapsip 1:leafcutter 30:photosynth 36:moonbeam 37:thornvolley 46:bloomburst 52:radiant'),
    kind: 'Bloom Sage', dex: 'Flowers bloom wherever it steps. Old tales say it guards the first seed.',
    art: { arch: 'biped', c1: '#389040', c2: '#f070b0', c3: '#f0f8e0', size: 1, ears: 'long', eyes: 'sharp', extra: ['leafhead', 'collar', 'gem'] },
  },
  {
    id: 10, name: 'Nibbit', types: ['BEAST'], base: [30, 56, 35, 72, 25], catchRate: 255, expYield: 51, evo: { lvl: 18, to: 11 },
    learn: L('1:bump 1:snarl 4:dash 9:claw 14:feralbite 22:rally 29:rush'),
    kind: 'Nibbler', dex: 'It gnaws on anything, including signposts. Its teeth never stop growing.',
    art: { arch: 'quad', c1: '#a07850', c2: '#e8c8a0', c3: '#f0e0c8', size: 0.55, ears: 'round', tail: 'plain', eyes: 'round', extra: ['whiskers', 'teeth'] },
  },
  {
    id: 11, name: 'Gnawlord', types: ['BEAST'], base: [55, 81, 60, 97, 50], catchRate: 127, expYield: 135,
    learn: L('1:bump 1:snarl 1:dash 9:claw 14:feralbite 24:rally 32:rush 40:stampede'),
    kind: 'Big Nibbler', dex: 'It rules burrows that stretch for miles under farmland.',
    art: { arch: 'quad', c1: '#806040', c2: '#e0b880', c3: '#f0d8b0', size: 0.78, ears: 'round', tail: 'plain', eyes: 'sharp', extra: ['whiskers', 'teeth', 'stripes'] },
  },
  {
    id: 12, name: 'Fluffin', types: ['GALE'], base: [40, 45, 40, 56, 35], catchRate: 255, expYield: 50, evo: { lvl: 18, to: 13 },
    learn: L('1:beakjab 1:snarl 5:wingflick 12:dash 19:updraft 25:skyslash 34:tempest'),
    kind: 'Puffball Bird', dex: 'It is mostly fluff. On windy days it simply lets the breeze carry it.',
    art: { arch: 'bird', c1: '#f0e0c0', c2: '#f0a040', c3: '#fff8e8', size: 0.55, eyes: 'big', tail: 'fluff' },
  },
  {
    id: 13, name: 'Skyroost', types: ['GALE', 'BEAST'], base: [65, 66, 58, 82, 52], catchRate: 90, expYield: 140,
    learn: L('1:beakjab 1:wingflick 12:dash 21:updraft 27:skyslash 33:feralbite 38:tempest'),
    kind: 'Cliff Hawk', dex: 'It nests on the highest cliffs and dives at speeds that whistle.',
    art: { arch: 'bird', c1: '#c89860', c2: '#e04838', c3: '#f8e8c8', size: 0.85, eyes: 'sharp', tail: 'fluff', extra: ['crest'] },
  },
  {
    id: 14, name: 'Sporekin', types: ['TOXIN'], base: [42, 42, 52, 30, 65], catchRate: 190, expYield: 60, evo: { lvl: 22, to: 15 },
    learn: L('1:bump 1:sting 6:acidspray 11:sporecloud 16:sapsip 21:miasma 27:venomfang 34:blightbomb'),
    kind: 'Mushroom', dex: 'It puffs drowsy spores from its cap. Never nap near a Sporekin patch.',
    art: { arch: 'plant', c1: '#f0e0c8', c2: '#a050c8', c3: '#fff8f0', size: 0.55, eyes: 'sleepy', extra: ['cap', 'spots'] },
  },
  {
    id: 15, name: 'Fungrave', types: ['TOXIN', 'SHADE'], base: [65, 62, 75, 40, 92], catchRate: 75, expYield: 150,
    learn: L('1:sting 1:acidspray 1:sporecloud 21:miasma 24:duskbite 30:venomfang 36:shadepulse 42:blightbomb'),
    kind: 'Gloom Cap', dex: 'It grows in graveyards and glows faintly violet on moonless nights.',
    art: { arch: 'plant', c1: '#c8b8d0', c2: '#6830a0', c3: '#e8e0f0', size: 0.85, eyes: 'sharp', extra: ['cap', 'spots'] },
  },
  {
    id: 16, name: 'Pebbit', types: ['STONE'], base: [40, 80, 100, 20, 30], catchRate: 255, expYield: 60, evo: { lvl: 25, to: 17 },
    learn: L('1:bump 1:bristle 6:pebble 11:stoneskin 16:ram 21:rubble 29:earthshake 36:bouldercrash'),
    kind: 'Pebble', dex: 'Often mistaken for an ordinary rock until someone trips over it.',
    art: { arch: 'golem', c1: '#9890a0', c2: '#706878', c3: '#c8c0c8', size: 0.55, eyes: 'round' },
  },
  {
    id: 17, name: 'Bouldrake', types: ['STONE'], base: [70, 105, 120, 35, 45], catchRate: 90, expYield: 150,
    learn: L('1:bump 1:pebble 1:stoneskin 16:ram 21:rubble 31:earthshake 40:bouldercrash'),
    kind: 'Megalith', dex: 'It rolls down mountainsides on purpose. Avalanches follow its moods.',
    art: { arch: 'golem', c1: '#888098', c2: '#c09050', c3: '#b8b0c0', size: 0.9, eyes: 'sharp', extra: ['spikes'] },
  },
  {
    id: 18, name: 'Glimmoth', types: ['SPIRIT'], base: [45, 30, 40, 70, 72], catchRate: 190, expYield: 64, evo: { lvl: 24, to: 19 },
    learn: L('1:glimmer 1:flicker 8:wingflick 13:lull 18:dazzle 23:moonbeam 31:soothe'),
    kind: 'Lamp Moth', dex: 'Its wing dust sparkles like starlight. Lost travelers follow its glow.',
    art: { arch: 'moth', c1: '#f0d0e8', c2: '#f8f080', c3: '#fff8ff', size: 0.6, eyes: 'big' },
  },
  {
    id: 19, name: 'Lunamoth', types: ['SPIRIT', 'GALE'], base: [65, 45, 55, 92, 102], catchRate: 75, expYield: 158,
    learn: L('1:glimmer 1:wingflick 1:lull 18:dazzle 26:moonbeam 32:soothe 38:tempest 44:radiant'),
    kind: 'Moon Moth', dex: 'It only flies under the full moon, scattering silver light below.',
    art: { arch: 'moth', c1: '#c8b8f0', c2: '#f8e070', c3: '#f8f0ff', size: 0.95, eyes: 'round', extra: ['gem'] },
  },
  {
    id: 20, name: 'Wispet', types: ['SHADE'], base: [35, 40, 30, 80, 72], catchRate: 190, expYield: 62, evo: { lvl: 28, to: 21 },
    learn: L('1:spook 1:flicker 8:duskbite 14:lull 20:shadepulse 27:mindpoke 34:nightlash'),
    kind: 'Wisp', dex: 'A puff of shadow that giggles in empty halls. Harmless, mostly.',
    art: { arch: 'ghost', c1: '#8068c0', c2: '#f0e060', c3: '#b0a0e0', size: 0.55, eyes: 'big' },
  },
  {
    id: 21, name: 'Phantail', types: ['SHADE'], base: [60, 65, 50, 105, 100], catchRate: 75, expYield: 160,
    learn: L('1:spook 1:duskbite 1:lull 20:shadepulse 30:mindpoke 36:nightlash 44:focusmind'),
    kind: 'Specter', dex: 'Its long tail fades into smoke. It slips through walls to play tricks.',
    art: { arch: 'ghost', c1: '#5c48a0', c2: '#f04878', c3: '#9080d0', size: 0.9, eyes: 'sharp', extra: ['horns'] },
  },
  {
    id: 22, name: 'Zapling', types: ['VOLT'], base: [35, 55, 30, 90, 52], catchRate: 190, expYield: 62, evo: { lvl: 26, to: 23 },
    learn: L('1:bump 1:snarl 5:zap 10:dash 15:joltwave 20:voltbite 28:arcbolt 36:thunderclap'),
    kind: 'Spark Pup', dex: 'Static builds in its fur. Petting it is a shocking experience.',
    art: { arch: 'quad', c1: '#f0d040', c2: '#384870', c3: '#fff4c0', size: 0.56, ears: 'point', tail: 'bolt', eyes: 'big', extra: ['cheeks'] },
  },
  {
    id: 23, name: 'Stormane', types: ['VOLT'], base: [62, 90, 58, 112, 82], catchRate: 75, expYield: 168,
    learn: L('1:bump 1:zap 1:dash 15:joltwave 22:voltbite 30:arcbolt 38:thunderclap 44:pounce'),
    kind: 'Storm Wolf', dex: 'Thunderheads gather above packs of Stormane before a hunt.',
    art: { arch: 'quad', c1: '#e8c030', c2: '#2c3860', c3: '#fff0b0', size: 0.88, ears: 'point', tail: 'bolt', eyes: 'sharp', extra: ['mane'] },
  },
  {
    id: 24, name: 'Mudgill', types: ['TIDE'], base: [45, 62, 45, 55, 40], catchRate: 190, expYield: 60, evo: { lvl: 24, to: 25 },
    learn: L('1:bump 1:splashjet 7:glare 12:bubblet 18:ram 23:tidelash 30:riptide'),
    kind: 'Mudfish', dex: 'It wriggles across muddy banks between ponds, croaking like a frog.',
    art: { arch: 'fish', c1: '#70a888', c2: '#d0b060', c3: '#e8f0c8', size: 0.6, eyes: 'round', extra: ['whiskers'] },
  },
  {
    id: 25, name: 'Swamplash', types: ['TIDE', 'TOXIN'], base: [80, 92, 72, 70, 62], catchRate: 75, expYield: 158,
    learn: L('1:bump 1:splashjet 1:sting 18:ram 25:tidelash 30:venomfang 36:riptide 42:blightbomb'),
    kind: 'Bog Serpent', dex: 'It coils in murky swamps. Its fins drip a numbing slime.',
    art: { arch: 'serpent', c1: '#508870', c2: '#c8a040', c3: '#d8e8b0', size: 0.92, eyes: 'sharp', extra: ['fins'] },
  },
  {
    id: 26, name: 'Frostling', types: ['FROST'], base: [50, 45, 50, 50, 68], catchRate: 190, expYield: 64, evo: { lvl: 30, to: 27 },
    learn: L('1:bump 1:chillbreath 8:flicker 14:iceneedle 20:frostfang 27:glacierbeam 36:whiteout'),
    kind: 'Snowdrop', dex: 'It is born in the first snowfall and melts if it gets too excited.',
    art: { arch: 'blob', c1: '#b8e8f8', c2: '#5890d8', c3: '#f0fcff', size: 0.55, eyes: 'big', extra: ['spikes'] },
  },
  {
    id: 27, name: 'Glaciarch', types: ['FROST', 'STONE'], base: [92, 96, 110, 50, 82], catchRate: 60, expYield: 178,
    learn: L('1:bump 1:chillbreath 1:iceneedle 20:frostfang 30:rubble 33:glacierbeam 40:earthshake 46:whiteout'),
    kind: 'Iceberg', dex: 'A walking glacier. Its footsteps leave frost on summer grass.',
    art: { arch: 'golem', c1: '#a8d8f0', c2: '#5880c8', c3: '#e8f8ff', size: 0.95, eyes: 'sharp', extra: ['spikes'] },
  },
  {
    id: 28, name: 'Cindrip', types: ['FLAME'], base: [42, 52, 36, 55, 62], catchRate: 190, expYield: 62, evo: { lvl: 26, to: 29 },
    learn: L('1:bump 1:sparkspit 7:smolder 12:snarl 18:cinderfang 25:flareburst 33:sunblaze'),
    kind: 'Lava Drop', dex: 'A blob of living lava. It leaves little scorch marks wherever it naps.',
    art: { arch: 'blob', c1: '#e85030', c2: '#ffd040', c3: '#ffb070', size: 0.52, eyes: 'round', extra: ['flamehead'] },
  },
  {
    id: 29, name: 'Magmole', types: ['FLAME', 'STONE'], base: [76, 92, 76, 50, 70], catchRate: 75, expYield: 162,
    learn: L('1:bump 1:sparkspit 1:smolder 18:cinderfang 26:rubble 30:flareburst 36:earthshake 42:sunblaze'),
    kind: 'Magma Mole', dex: 'It tunnels through volcano walls, leaving glowing burrows behind.',
    art: { arch: 'quad', c1: '#6c4848', c2: '#ff8830', c3: '#ffc070', size: 0.86, ears: 'round', tail: 'none', eyes: 'sleepy', extra: ['spikes', 'claws'] },
  },
  {
    id: 30, name: 'Psyquill', types: ['MIND'], base: [40, 35, 38, 75, 82], catchRate: 120, expYield: 66, evo: { lvl: 30, to: 31 },
    learn: L('1:beakjab 1:flicker 6:mindpoke 12:lull 18:focusmind 24:wingflick 29:psyblast 38:soothe'),
    kind: 'Seer Chick', dex: 'It stares at a spot on the wall for hours. Some say it sees tomorrow.',
    art: { arch: 'bird', c1: '#58c8b8', c2: '#f070a0', c3: '#e8fff8', size: 0.56, eyes: 'big', tail: 'fluff', extra: ['crest'] },
  },
  {
    id: 31, name: 'Oracleon', types: ['MIND'], base: [65, 50, 62, 96, 122], catchRate: 45, expYield: 175,
    learn: L('1:mindpoke 1:lull 1:focusmind 24:soothe 30:psyblast 36:moonbeam 42:shadepulse'),
    kind: 'Oracle', dex: 'It speaks in riddles that always come true. Scholars travel far to listen.',
    art: { arch: 'biped', c1: '#48a8a0', c2: '#f060a0', c3: '#e0f8f0', size: 0.92, ears: 'fin', eyes: 'sleepy', extra: ['gem', 'collar'] },
  },
  {
    id: 32, name: 'Thornet', types: ['LEAF', 'TOXIN'], base: [42, 58, 42, 66, 40], catchRate: 190, expYield: 58, evo: { lvl: 20, to: 33 },
    learn: L('1:sting 1:vinesnap 6:glare 11:sapsip 16:venomfang 22:leafcutter 30:blightbomb'),
    kind: 'Briar Bug', dex: 'It hides among rose bushes. Its stinger looks just like a thorn.',
    art: { arch: 'moth', c1: '#88c048', c2: '#a050b8', c3: '#e0f0b0', size: 0.55, eyes: 'sharp', extra: ['stinger'] },
  },
  {
    id: 33, name: 'Vespire', types: ['LEAF', 'TOXIN'], base: [65, 88, 55, 92, 55], catchRate: 75, expYield: 150,
    learn: L('1:sting 1:vinesnap 1:glare 16:venomfang 24:leafcutter 30:skyslash 34:blightbomb 40:thornvolley'),
    kind: 'Thorn Wasp', dex: 'Swarms of Vespire guard wild orchards and chase off greedy pickers.',
    art: { arch: 'moth', c1: '#70a838', c2: '#8838a8', c3: '#d8e8a0', size: 0.88, eyes: 'sharp', extra: ['stinger', 'stripes'] },
  },
  {
    id: 34, name: 'Ironox', types: ['STONE', 'BEAST'], base: [88, 102, 98, 58, 42], catchRate: 45, expYield: 175,
    learn: L('1:bump 1:glare 1:pebble 15:ram 22:rubble 30:rush 38:earthshake 46:stampede'),
    kind: 'Iron Bull', dex: 'Its horns are harder than steel. Miners follow it to find ore veins.',
    art: { arch: 'quad', c1: '#787088', c2: '#e0d0a0', c3: '#a8a0b8', size: 0.92, ears: 'round', tail: 'plain', eyes: 'sharp', extra: ['horns'] },
  },
  {
    id: 35, name: 'Galecrest', types: ['GALE', 'FROST'], base: [72, 72, 66, 98, 92], catchRate: 25, expYield: 190,
    learn: L('1:wingflick 1:chillbreath 1:updraft 20:iceneedle 28:skyslash 34:glacierbeam 40:tempest 46:whiteout'),
    kind: 'Frost Raptor', dex: 'It rides blizzards across the peaks. Its cry heralds the first snow.',
    art: { arch: 'bird', c1: '#88b8e8', c2: '#f8f8ff', c3: '#e0f0ff', size: 0.95, eyes: 'sharp', tail: 'fluff', extra: ['crest'] },
  },
  {
    id: 36, name: 'Duskfang', types: ['SHADE', 'BEAST'], base: [70, 96, 62, 92, 66], catchRate: 45, expYield: 172,
    learn: L('1:claw 1:spook 1:duskbite 18:feralbite 26:shadepulse 32:rally 38:nightlash 44:stampede'),
    kind: 'Night Hound', dex: 'Its eyes glow red at dusk. It hunts only in the hour before dark.',
    art: { arch: 'quad', c1: '#403858', c2: '#e83850', c3: '#686088', size: 0.88, ears: 'point', tail: 'plain', eyes: 'sharp', extra: ['mane'] },
  },
  {
    id: 37, name: 'Solmara', types: ['FLAME', 'SPIRIT'], base: [100, 100, 100, 100, 125], catchRate: 3, expYield: 255,
    learn: L('1:flareburst 1:moonbeam 1:soothe 1:updraft 40:sunblaze 45:radiant 50:tempest'),
    kind: 'Dawn Phoenix', dex: 'Legends say its first flight lit the very first sunrise over Varrow.',
    art: { arch: 'bird', c1: '#ff9838', c2: '#fff070', c3: '#ffe8c0', size: 1, eyes: 'sharp', tail: 'flame', extra: ['crest', 'gem', 'flamehead'] },
  },
];

export const SPECIES: Record<number, Species> = Object.fromEntries(S.map((s) => [s.id, s]));
export const SPECIES_COUNT = S.length;
export const ALL_SPECIES = S;

export function species(id: number): Species {
  const s = SPECIES[id];
  if (!s) throw new Error('Unknown species ' + id);
  return s;
}

export const SP = {
  EMBERKIT: 1,
  BLAZELYNX: 2,
  PYROLION: 3,
  SPLASHEL: 4,
  TORRENTOISE: 5,
  ABYSHELL: 6,
  SPROUTLE: 7,
  BRAMBLEBUN: 8,
  THORNHARE: 9,
  NIBBIT: 10,
  GNAWLORD: 11,
  FLUFFIN: 12,
  SKYROOST: 13,
  SPOREKIN: 14,
  FUNGRAVE: 15,
  PEBBIT: 16,
  BOULDRAKE: 17,
  GLIMMOTH: 18,
  LUNAMOTH: 19,
  WISPET: 20,
  PHANTAIL: 21,
  ZAPLING: 22,
  STORMANE: 23,
  MUDGILL: 24,
  SWAMPLASH: 25,
  FROSTLING: 26,
  GLACIARCH: 27,
  CINDRIP: 28,
  MAGMOLE: 29,
  PSYQUILL: 30,
  ORACLEON: 31,
  THORNET: 32,
  VESPIRE: 33,
  IRONOX: 34,
  GALECREST: 35,
  DUSKFANG: 36,
  SOLMARA: 37,
} as const;
