import type { GameState } from '../systems/state';
import { speciesByName } from './species';

export interface TrainerDef {
  id: string;
  cls: string;
  name: string;
  look: string;
  team: [number, number][] | ((s: GameState) => [number, number][]);
  /** prize money per level of the last Wildkin */
  money: number;
  intro: string;
  /** shown in battle when defeated */
  lose: string;
  /** overworld line after being defeated */
  after: string;
  music?: 'battle' | 'boss';
  smart?: boolean;
  /** potions the trainer may use */
  potions?: number;
}

/** Registry filled in as maps are built. */
export const TRAINERS: Record<string, TrainerDef> = {};

const CLASS: Record<string, { look: string; money: number; intro: string[]; lose: string[]; after: string[] }> = {
  YOUNGSTER: {
    look: 'youngster',
    money: 15,
    intro: ['Hey! You looked at me! That means we battle!', "My Wildkin are the coolest in the whole school. I'll show you!", "I've been waiting all day for someone to battle!"],
    lose: ['Aww, no fair!', "I'll tell my big brother about this!", 'My Wildkin did their best...'],
    after: ['I should train in the tall grass more.', 'Next time I will win for sure.', 'Shorts are comfy for battling. Just saying.'],
  },
  LASS: {
    look: 'lass',
    money: 15,
    intro: ["Aren't my Wildkin adorable? They're tough too!", "Let's have a nice friendly battle!", 'You seem nice. Battle me anyway!'],
    lose: ['Adorable AND defeated...', 'Oh! You are strong!', "That wasn't very friendly of you!"],
    after: ['I want to collect every cute Wildkin there is.', 'I brush my Wildkin every single night.', 'Strong trainers are kind of cool.'],
  },
  'BUG FAN': {
    look: 'boy',
    money: 10,
    intro: ['Bugs are the best! Want to see my collection?', 'I caught these in the woods this morning!', 'Swarm Wildkin are tougher than they look!'],
    lose: ['My bugs! Noooo!', 'Maybe I need more bugs.', 'They need a nap now.'],
    after: ['Bug Wildkin evolve really fast.', 'Check the trees for Larvule.', 'I wonder how many bugs live in these woods.'],
  },
  HIKER: {
    look: 'hiker',
    money: 35,
    intro: ['These trails are my second home! Battle!', 'Mountain paths make for tough Wildkin!', 'Hoo boy! A climber! Let me test you!'],
    lose: ['Rock-solid loss.', 'Avalanche of defeat!', 'I got crushed like gravel!'],
    after: ['Watch your step. The rocks are loose.', 'Nothing beats fresh mountain air.', 'Stone types can take a hit, but water wears them down.'],
  },
  CAMPER: {
    look: 'boy',
    money: 20,
    intro: ["I've camped out here for days. Battle me!", 'Nothing like a battle by the campfire!', 'You look like you need some trail experience!'],
    lose: ['My tent is safer than my strategy.', 'Out of marshmallows and out of luck.', 'I will sleep on that one.'],
    after: ['The stars are amazing out here.', 'Always pack extra potions.', 'I love the smell of pine trees.'],
  },
  PICNICKER: {
    look: 'girl',
    money: 20,
    intro: ['Battling is the best part of a picnic!', 'Want to battle before lunch?', 'My Wildkin ate well. They are ready!'],
    lose: ['My sandwiches got squished.', 'Oh well, back to lunch.', 'You win! Want a cookie?'],
    after: ['I packed snacks for my Wildkin too.', 'Grass routes are perfect for picnics.', 'Do you like flowers? I love flowers.'],
  },
  FISHER: {
    look: 'fisher',
    money: 35,
    intro: ['You scared the fish away! Now you owe me a battle!', 'I reel in battles too!', 'Hooked another challenger!'],
    lose: ['The one that got away...', 'Snapped my line!', 'Guess I have to throw this one back.'],
    after: ['Patience is the secret of fishing.', 'Some Wildkin only bite at a fishing rod.', 'Mudgill everywhere. Always Mudgill.'],
  },
  SWIMMER: {
    look: 'swimmer',
    money: 5,
    intro: ['The water is great! Battle me!', 'Swimming builds strong Wildkin!', 'Splash! Got you!'],
    lose: ['Glub glub...', 'I swallowed some seawater.', "I'm all wet. Well, wetter."],
    after: ['Watch out for Jellune in these waters.', 'My arms are getting tired.', 'I swim here every day.'],
  },
  SAILOR: {
    look: 'sailor',
    money: 30,
    intro: ['Ahoy! Let us battle, landlubber!', 'Sea-tough Wildkin coming at you!', 'Anchors aweigh! Battle!'],
    lose: ['Sunk like an anchor!', 'Man overboard!', 'Blown off course!'],
    after: ['The sea is moody today.', 'Tide types rule the waves.', 'A sailor always respects a strong foe.'],
  },
  SCHOLAR: {
    look: 'scholar',
    money: 40,
    intro: ['Have you studied type matchups? Let me quiz you!', 'I have a theory about battles. Let us test it.', 'For science! Battle!'],
    lose: ['You pass! With honors!', 'My theory needs revising.', 'Fascinating. I lost.'],
    after: ['Mind types fear Swarm and Shade moves.', 'Wyrm moves are super effective only on other Wyrms.', 'Earth moves cannot touch Gale types.'],
  },
  MYSTIC: {
    look: 'mystic',
    money: 30,
    intro: ['The spirits whisper your name...', 'Kehh... leave this place...', 'I sense a strong will. Show me.'],
    lose: ['The spirits are calm now.', 'Kehh... you are strong...', 'The veil has lifted.'],
    after: ['Shade types cannot touch Beast types, and Beasts cannot touch them.', 'Rest in peace, little ones.', 'This tower remembers every Wildkin.'],
  },
  BLACKBELT: {
    look: 'blackbelt',
    money: 25,
    intro: ['Hyah! Show me your fighting spirit!', 'My fists are my Wildkin! Wait, no...', 'Train hard, battle harder!'],
    lose: ['Ugh! A worthy foe!', 'I must train harder!', 'You have a warrior heart.'],
    after: ['Brawl types smash Beast, Stone and Frost.', 'Discipline wins battles.', 'One hundred push-ups a day!'],
  },
  BIRDKEEPER: {
    look: 'birdkeeper',
    money: 25,
    intro: ['My birds will ruffle your feathers!', 'Taking flight! Battle!', 'Have you seen how fast my birds are?'],
    lose: ['Grounded...', 'Clipped wings!', 'My birds need a rest.'],
    after: ['Volt and Stone moves knock birds out of the sky.', 'Birds love windy routes.', 'I wish I could fly.'],
  },
  BEAUTY: {
    look: 'beauty',
    money: 70,
    intro: ['Battle me with style!', 'Elegance is strength, darling.', 'My Wildkin are as lovely as they are fierce.'],
    lose: ['How rude!', 'My hair is ruined.', 'Lovely battle, though.'],
    after: ['A beautiful battle is a good battle.', 'I groom my Wildkin with rose oil.', 'Style is everything.'],
  },
  GENTLEMAN: {
    look: 'gentleman',
    money: 70,
    intro: ['A friendly match, young one?', 'I shall show you refined battling.', 'Shall we, then?'],
    lose: ['Well played indeed.', 'A splendid victory for you.', 'I yield, with pleasure.'],
    after: ['Battling keeps an old man young.', 'Manners matter, even in battle.', 'Tea after battles is a must.'],
  },
  ENGINEER: {
    look: 'engineer',
    money: 50,
    intro: ['Watch out for live wires! And my Wildkin!', 'I keep this place humming. Battle!', 'Safety first! Battle second!'],
    lose: ['Short circuit!', 'Blew a fuse!', 'Power outage!'],
    after: ['Volt types love it in here.', 'Never touch the generators.', 'Earth types ground electric attacks.'],
  },
  SCIENTIST: {
    look: 'scientist',
    money: 50,
    intro: ['You are interfering with research!', 'Data point acquired. Now battle!', 'My Wildkin are scientifically superior!'],
    lose: ['My hypothesis was wrong!', 'Error! Error!', 'Back to the lab...'],
    after: ['The observatory studies the sky and its Wildkin.', 'Science needs failures to progress.', 'Mind types have very few weaknesses.'],
  },
  BUSKER: {
    look: 'busker',
    money: 30,
    intro: ['Let me play you a battle tune!', 'Rock out with me!', 'This one goes out to you!'],
    lose: ['Broke a string!', 'Encore? No? Okay.', 'That was off-key.'],
    after: ['Music makes Wildkin happy.', 'I play for coins on the weekends.', 'The crowd loved that battle.'],
  },
  RACER: {
    look: 'racer',
    money: 30,
    intro: ['Speed is everything! Battle!', 'Out of my lane! Or battle me!', 'I am the fastest on this road!'],
    lose: ['Spun out!', 'Flat tire!', 'You win the race.'],
    after: ['This road goes downhill all the way to MIRECOAST.', 'Ledges are a one-way trip.', 'Faster, faster!'],
  },
  TAMER: {
    look: 'tamer',
    money: 40,
    intro: ['My Wildkin obey only me. Watch!', 'Wild hearts, tamed! Battle!', 'Crack! My team is ready!'],
    lose: ['They ran wild on me!', 'I need a better whip... I mean whistle.', 'Tamed by you.'],
    after: ['Trust is the key to taming.', 'Strong Wildkin respect strong trainers.', 'Even wild ones can be friends.'],
  },
  ACE: {
    look: 'ace',
    money: 50,
    intro: ["I'm on my way to the SUMMIT. You're a warm-up!", 'Only the best walk this path!', 'Let us see if you are league material.'],
    lose: ["Okay, you're not a warm-up.", 'You are the best, then.', 'League material indeed.'],
    after: ['Keep your HP topped up.', 'The ELITE FOUR are no joke.', 'Balance your team types.'],
  },
  HOLLOW: {
    look: 'grunt',
    money: 30,
    intro: ['The HOLLOW ORDER is busy here. Scram, kid!', 'You saw nothing! Got it? No? Then battle!', 'Meddler! The ORDER will crush you!'],
    lose: ['Ugh! The admin will not like this...', 'Lost to a kid! Again!', 'Our plans... ruined...'],
    after: ['We are just... collecting stuff. Yeah.', 'NYX will deal with you.', 'Go away before more of us show up.'],
  },
};

let autoId = 0;

/**
 * Register a trainer. `team` entries are [species name or id, level].
 * Lines default to the class's pool, picked by a stable index.
 */
export function T(
  id: string,
  cls: string,
  name: string,
  team: [string | number, number][],
  opts: Partial<Pick<TrainerDef, 'intro' | 'lose' | 'after' | 'look' | 'money' | 'smart' | 'music' | 'potions'>> = {},
): string {
  const c = CLASS[cls] ?? CLASS.YOUNGSTER;
  const k = autoId++;
  if (TRAINERS[id]) throw new Error('Duplicate trainer ' + id);
  TRAINERS[id] = {
    id,
    cls,
    name,
    look: opts.look ?? c.look,
    money: opts.money ?? c.money,
    team: team.map(([sp, lv]) => [typeof sp === 'number' ? sp : speciesByName(sp), lv]),
    intro: opts.intro ?? c.intro[k % c.intro.length],
    lose: opts.lose ?? c.lose[k % c.lose.length],
    after: opts.after ?? c.after[k % c.after.length],
    smart: opts.smart,
    music: opts.music,
    potions: opts.potions,
  };
  return id;
}

/** Register a trainer whose team depends on the save (rival). */
export function TDyn(def: TrainerDef): string {
  TRAINERS[def.id] = def;
  return def.id;
}

// ---------------------------------------------------------------- rival

/** The rival always picks the partner with the type advantage. */
const RIVAL_PICK: Record<number, number> = { 1: 4, 4: 7, 7: 1 };

export function rivalStarter(s: GameState): number {
  return RIVAL_PICK[s.starter] ?? 7;
}

/** The rival's Kitmote evolution covers their starter's weakness. */
function rivalKit(s: GameState): number {
  const r = rivalStarter(s);
  return r === 4 ? speciesByName('Ripplekit') : r === 7 ? speciesByName('Sparkit') : speciesByName('Flarekit');
}

const N = speciesByName;

const RIVAL_TEAMS: ((s: GameState) => [number, number][])[] = [
  (s) => [[rivalStarter(s), 5]],
  (s) => [[N('Fluffin'), 9], [rivalStarter(s), 9]],
  (s) => [[N('Skyroost'), 18], [N('Coilkit'), 15], [N('Kitmote'), 16], [rivalStarter(s) + 1, 19]],
  (s) => [[N('Skyroost'), 19], [N('Dunemole'), 18], [N('Kitmote'), 18], [rivalStarter(s) + 1, 22]],
  (s) => [[N('Skyroost'), 25], [N('Psyquill'), 21], [N('Venomaw'), 23], [N('Kitmote'), 23], [rivalStarter(s) + 1, 26]],
  (s) => [[N('Tempestrel'), 37], [N('Augurowl'), 35], [N('Venomaw'), 35], [rivalKit(s), 36], [rivalStarter(s) + 2, 40]],
  (s) => [[N('Tempestrel'), 47], [N('Oracleon'), 47], [N('Ironox'), 45], [N('Swamplash'), 46], [rivalKit(s), 48], [rivalStarter(s) + 2, 53]],
];

const RIVAL_LINES: [string, string][] = [
  ["Hold on! Let's see whose partner is stronger!", 'What?! I picked the better one, I swear!'],
  ['Hey, slowpoke! I caught a Wildkin already. Battle me!', "Hmph. Lucky. I'm off to BRINDLE TOWN. Don't keep up!"],
  ["Took you long enough! I've been training nonstop. Show me what you've got!", "Tch... you're getting good. Too good."],
  ['Fancy meeting you on the ferry! Let us see if you have your sea legs!', 'Ugh. Seasick. That is my excuse.'],
  ['What are you doing in this tower? Never mind. Battle!', 'Even here you beat me? Unreal.'],
  ['The ORDER took over the observatory and I came to kick them out. You first, though!', "Fine! You go up and deal with NYX. I'll guard the stairs."],
  ["So you made it all the way here. Only one of us walks into the SUMMIT. It's going to be me!", "...Fine. You earned it. Go on. And don't you dare lose up there."],
];

RIVAL_TEAMS.forEach((team, k) =>
  TDyn({
    id: `rival${k + 1}`,
    cls: 'RIVAL',
    name: '{RIVAL}',
    look: 'rival',
    money: 20 + k * 10,
    team,
    intro: RIVAL_LINES[k][0],
    lose: RIVAL_LINES[k][1],
    after: '',
    music: 'boss',
    smart: k >= 2,
    potions: k >= 4 ? 1 : 0,
  }),
);

export function trainerTeam(t: TrainerDef, s: GameState): [number, number][] {
  return typeof t.team === 'function' ? t.team(s) : t.team;
}
