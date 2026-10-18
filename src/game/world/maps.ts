/**
 * The region of VARROW: every map, NPC, sign, item and story script.
 */
import { buildTiles } from '../art/tiles';
import type { Dir } from '../core/input';
import { species, SP } from '../data/species';
import { rivalStarter, TRAINERS } from '../data/trainers';
import { healMon } from '../systems/mon';
import { saveGame } from '../systems/save';
import { hasBadge, type GameState } from '../systems/state';
import { EndingScene } from '../scenes/ending';
import { building, CAVE, havenInterior, houseInterior, IN, makeMap, martInterior, matWarps, OUT, setTile, type Exit } from './build';
import type { EncounterTable, MapDef, NpcDef, Script, ScriptCtx, Warp } from './types';

const door = (x: number, y: number, to: string, tx: number, ty: number, dir: Dir = 'up'): Warp => ({ x, y, to, tx, ty, dir });
const not = (k: string) => (s: GameState) => !s.flags[k];
const has = (k: string) => (s: GameState) => !!s.flags[k];

/** Push the player back one tile (for blocked paths). */
async function pushBack(c: ScriptCtx, dir: Dir) {
  await c.walkPlayer([dir]);
}

const ENC: Record<string, EncounterTable> = {
  route1: {
    rate: 0.1,
    table: [
      { sp: SP.NIBBIT, min: 2, max: 4, w: 40 },
      { sp: SP.FLUFFIN, min: 2, max: 4, w: 38 },
      { sp: SP.SPOREKIN, min: 3, max: 4, w: 15 },
      { sp: SP.ZAPLING, min: 3, max: 4, w: 7 },
    ],
  },
  route2: {
    rate: 0.1,
    table: [
      { sp: SP.NIBBIT, min: 5, max: 7, w: 25 },
      { sp: SP.FLUFFIN, min: 5, max: 7, w: 20 },
      { sp: SP.THORNET, min: 4, max: 7, w: 25 },
      { sp: SP.SPOREKIN, min: 5, max: 7, w: 15 },
      { sp: SP.ZAPLING, min: 5, max: 6, w: 10 },
      { sp: SP.GLIMMOTH, min: 6, max: 6, w: 5 },
    ],
  },
  cave: {
    rate: 0.07,
    table: [
      { sp: SP.PEBBIT, min: 8, max: 11, w: 40 },
      { sp: SP.WISPET, min: 8, max: 10, w: 25 },
      { sp: SP.GLIMMOTH, min: 8, max: 10, w: 20 },
      { sp: SP.CINDRIP, min: 9, max: 11, w: 12 },
      { sp: SP.IRONOX, min: 12, max: 12, w: 3 },
    ],
  },
  route3: {
    rate: 0.1,
    table: [
      { sp: SP.MUDGILL, min: 12, max: 15, w: 30 },
      { sp: SP.THORNET, min: 12, max: 14, w: 18 },
      { sp: SP.FLUFFIN, min: 13, max: 15, w: 18 },
      { sp: SP.ZAPLING, min: 12, max: 14, w: 15 },
      { sp: SP.PSYQUILL, min: 13, max: 14, w: 12 },
      { sp: SP.SKYROOST, min: 16, max: 16, w: 7 },
    ],
  },
  route4: {
    rate: 0.1,
    table: [
      { sp: SP.CINDRIP, min: 18, max: 20, w: 20 },
      { sp: SP.PEBBIT, min: 18, max: 20, w: 18 },
      { sp: SP.WISPET, min: 19, max: 21, w: 18 },
      { sp: SP.GNAWLORD, min: 19, max: 21, w: 18 },
      { sp: SP.FROSTLING, min: 18, max: 19, w: 12 },
      { sp: SP.DUSKFANG, min: 20, max: 21, w: 7 },
      { sp: SP.BOULDRAKE, min: 22, max: 22, w: 7 },
    ],
  },
  route5: {
    rate: 0.1,
    table: [
      { sp: SP.FROSTLING, min: 28, max: 31, w: 20 },
      { sp: SP.PSYQUILL, min: 29, max: 31, w: 18 },
      { sp: SP.DUSKFANG, min: 29, max: 31, w: 16 },
      { sp: SP.STORMANE, min: 29, max: 30, w: 14 },
      { sp: SP.IRONOX, min: 30, max: 31, w: 12 },
      { sp: SP.PHANTAIL, min: 31, max: 31, w: 10 },
      { sp: SP.GALECREST, min: 32, max: 32, w: 5 },
      { sp: SP.LUNAMOTH, min: 31, max: 32, w: 5 },
    ],
  },
};

// ---------------------------------------------------------------- scripts

const momTalk: Script = async (c) => {
  if (!c.flag('gotStarter')) {
    await c.say([
      'MOM: Morning, sleepyhead! PROF. FENN came by earlier looking for you.',
      "She's in her lab, just north of here. Don't keep her waiting!",
    ]);
    return;
  }
  await c.say('MOM: Oh, you look worn out! Take a little rest.');
  c.g.sfx('heal');
  await c.wait(60);
  for (const m of c.s.party) healMon(m);
  c.s.heal = { map: 'home', x: 2, y: 5 };
  await c.say(c.flag('champion') ? "MOM: My child, the CHAMPION! I'm so proud of you!" : 'MOM: There! Your Wildkin look full of energy again. Be safe out there!');
};

const profStop: Script = async (c) => {
  await c.emote('player');
  await c.say(["PROF. FENN: Hey! Wait! Don't go out there!", 'Wild Wildkin live in that tall grass! You need a partner of your own to stay safe.']);
  await c.say('PROF. FENN: Come with me to my lab!');
  await c.warp('lab', 4, 4, 'up');
};

const labEnter: Script = async (c) => {
  if (c.flag('gotStarter') || c.flag('labIntro')) return;
  c.set('labIntro');
  await c.say([
    'PROF. FENN: Here we are! On that table are three Wildkin, each one waiting for a partner.',
    'Go ahead, {PLAYER}. Choose the one that speaks to you!',
  ]);
  await c.say("{RIVAL}: Hey, Grandma! What about me?! I've been waiting forever!");
  await c.say('PROF. FENN: Patience, {RIVAL}. You can choose right after.');
};

function pickStarter(sp: number): Script {
  return async (c) => {
    if (c.flag('gotStarter')) {
      const taken = sp === c.s.starter || sp === rivalStarter(c.s);
      await c.say(taken ? 'This pod is empty now.' : "PROF. FENN's last Wildkin rests in this pod. It looks content.");
      return;
    }
    if (!c.flag('labIntro')) {
      await c.say("These pods belong to PROF. FENN. Better talk to her first.");
      return;
    }
    const s = species(sp);
    await c.say(`It's ${s.name.toUpperCase()}, the ${s.types[0]} Wildkin! ${s.dex}`);
    if (!(await c.yesNo(`So, you want ${s.name.toUpperCase()}?`))) return;
    c.s.starter = sp;
    c.set('gotStarter');
    await c.say(`PROF. FENN: A fine choice! ${s.name.toUpperCase()} is all yours.`);
    await c.receiveMon(sp, 5);
    const rs = species(rivalStarter(c.s));
    await c.say(`{RIVAL}: Then I'll take this one! ${rs.name.toUpperCase()}, you and me are going to be legends!`);
    await c.say(`{RIVAL} received ${rs.name.toUpperCase()}!`);
  };
}

const labRivalBattle: Script = async (c) => {
  c.faceToward('rival');
  await c.say("{RIVAL}: Wait up, {PLAYER}! We've both got Wildkin now. Let's see whose is stronger!");
  await c.battle('rival1');
  await c.say("{RIVAL}: Okay, okay! I'm going out to train right now. Next time you won't stand a chance! See ya!");
  c.hide('rival');
  c.set('rivalLeftLab');
  await c.say('PROF. FENN: What spirit! {PLAYER}, before you go, take these.');
  c.set('gotDex');
  c.g.sfx('item');
  await c.say('{PLAYER} received the WILDEX! It records every Wildkin you see and catch.');
  await c.give('pod', 5);
  await c.say([
    'PROF. FENN: Throw CAPTURE PODS at weakened wild Wildkin to catch them.',
    'BRINDLE TOWN is north along ROUTE 1. Its GYM is a fine first challenge. Good luck, {PLAYER}!',
  ]);
};

const profTalk: Script = async (c) => {
  if (!c.flag('gotStarter')) {
    await c.say('PROF. FENN: Go on! Pick one of the three pods on the table.');
    return;
  }
  if (c.flag('champion')) {
    await c.say(`PROF. FENN: CHAMPION {PLAYER}! Your WILDEX has ${c.s.caught.length} entries. Can you find all 37?`);
    return;
  }
  const n = c.s.caught.length;
  await c.say(
    n < 8
      ? `PROF. FENN: You've caught ${n} kinds of Wildkin. Every one teaches us something new!`
      : `PROF. FENN: ${n} kinds already?! You're a natural researcher, {PLAYER}!`,
  );
  if (n >= 15 && !c.flag('profGift')) {
    c.set('profGift');
    await c.say("PROF. FENN: Here, take these. You've earned them.");
    await c.give('ultrapod', 3);
  }
};

function leaderAfter(badge: string, gift: [string, number], lines: string[]): Script {
  return async (c) => {
    await c.badge(badge);
    await c.say(lines[0]);
    await c.give(gift[0], gift[1]);
    for (const l of lines.slice(1)) await c.say(l);
  };
}

// ---------------------------------------------------------------- builders

function gymInterior(id: string, name: string, floor: string, exit: Exit, npcs: NpcDef[], signText: string): MapDef {
  const f = floor;
  const rows = [
    'WWnWWWWnWW',
    `p${f.repeat(8)}p`,
    f.repeat(10),
    `${f}${f}pp${f}${f}pp${f}${f}`,
    f.repeat(10),
    `p${f.repeat(8)}p`,
    f.repeat(10),
    `${f}${f}pp${f}${f}pp${f}${f}`,
    f.repeat(10),
    `p${f.repeat(8)}p`,
    f.repeat(10),
    f.repeat(10),
    `${f}${f}${f}o${f}${f}o${f}${f}${f}`,
    `${f.repeat(4)}mm${f.repeat(4)}`,
  ];
  return makeMap({
    id,
    name,
    rows,
    legend: IN,
    border: 'void',
    music: 'gym',
    outdoor: false,
    warps: matWarps(4, 13, exit),
    npcs,
    signs: [
      { x: 3, y: 12, text: signText },
      { x: 6, y: 12, text: signText },
    ],
  });
}

function buildAll(): Record<string, MapDef> {
  buildTiles();
  const M: Record<string, MapDef> = {};
  const add = (m: MapDef) => (M[m.id] = m);

  // ======================= HEARTHVALE =======================
  const hv = makeMap({
    id: 'hearthvale',
    name: 'HEARTHVALE',
    legend: OUT,
    border: 'tree',
    music: 'town',
    outdoor: true,
    rows: [
      'TTTTTTTTT::TTTTTTTTT',
      'TT.......::.......TT',
      'TT.f.f...::.......TT',
      'TT.......::.......TT',
      'TT.......::S......TT',
      'TT.......::.......TT',
      'TT.......:::::::..TT',
      'TT.......::.......TT',
      'TT.......::.......TT',
      'TT.......::.......TT',
      'TT.......::.......TT',
      'TT.......::.......TT',
      'TT.......::.......TT',
      'TT..:::::::::::...TT',
      'TT.S.....::...S...TT',
      'TT.ff...#~~~~#.ff.TT',
      'TT......#~~~~#....TT',
      'TTTTTTTTTTTTTTTTTTTT',
    ],
    connections: { up: { map: 'route1', offset: 0 } },
    signs: [
      { x: 3, y: 14, text: 'HEARTHVALE: Where every journey starts warm.' },
      { x: 14, y: 14, text: "{RIVAL}'s house" },
      { x: 11, y: 4, text: "PROF. FENN'S WILDKIN LAB" },
    ],
    npcs: [
      { id: 'girl', x: 6, y: 7, dir: 'down', look: 'girl', move: 'wander', radius: 2, talk: 'Did you know? You can store Wildkin in a LINK TERMINAL at any HAVEN. Technology is amazing!' },
      {
        id: 'oldman',
        x: 15,
        y: 15,
        dir: 'left',
        look: 'oldman',
        move: 'look',
        talk: async (c) =>
          c.say(
            c.flag('gotStarter')
              ? 'Ah, you have a partner now! Treat it kindly, and it will follow you anywhere.'
              : 'Tall grass hides wild Wildkin. Without a partner of your own, it is no place for a child!',
          ),
      },
    ],
    triggers: [{ x: 9, y: 1, w: 2, cond: not('gotStarter'), run: profStop }],
  });
  const hvHome = building(hv, 3, 9, 5, 'red', 'house');
  const hvRival = building(hv, 12, 9, 5, 'blue', 'house');
  const hvLab = building(hv, 12, 2, 6, 'teal', 'lab');
  hv.warps.push(door(hvHome.x, hvHome.y, 'home', 3, 7), door(hvRival.x, hvRival.y, 'rivalhome', 3, 7), door(hvLab.x, hvLab.y, 'lab', 4, 11));
  add(hv);

  const home = houseInterior('home', 'HOME', { map: 'hearthvale', x: hvHome.x, y: hvHome.y + 1 }, [
    { id: 'mom', x: 5, y: 4, dir: 'left', look: 'mom', talk: momTalk },
  ], 1);
  home.signs = [
    { x: 6, y: 1, text: 'A show about a young trainer crossing a vast desert with a Wildkin. Gripping stuff!' },
    { x: 0, y: 1, text: "MOM's cookbooks. One is titled '101 Snacks Wildkin Love'." },
    { x: 7, y: 1, text: 'A shelf of comics about heroic Wildkin.' },
  ];
  add(home);
  add(
    houseInterior('rivalhome', "{RIVAL}'S HOUSE", { map: 'hearthvale', x: hvRival.x, y: hvRival.y + 1 }, [
      {
        id: 'june',
        x: 4,
        y: 4,
        dir: 'down',
        look: 'lass',
        move: 'look',
        talk: async (c) => {
          if (!c.flag('gotStarter')) {
            await c.say("JUNE: Hi, {PLAYER}! My little sibling {RIVAL} ran off to Grandma's lab at dawn. So impatient!");
            return;
          }
          if (!c.flag('junePotion')) {
            c.set('junePotion');
            await c.say("JUNE: You got a Wildkin too? Then you'll need these. Don't tell {RIVAL} I gave you a head start!");
            await c.give('potion', 2);
            return;
          }
          await c.say('JUNE: Grandma says every Wildkin has a story. I hope you find lots of them!');
        },
      },
    ]),
  );

  add(
    makeMap({
      id: 'lab',
      name: "FENN'S LAB",
      legend: IN,
      border: 'void',
      music: 'haven',
      outdoor: false,
      rows: [
        'WWnWWWWnWW',
        'BBBB==BBBB',
        '=L======L=',
        '==========',
        '=====kkk==',
        '==========',
        '==========',
        '==========',
        'BB======BB',
        '==========',
        '==========',
        '====mm====',
      ],
      warps: matWarps(4, 11, { map: 'hearthvale', x: hvLab.x, y: hvLab.y + 1 }),
      onEnter: labEnter,
      npcs: [
        { id: 'prof', x: 4, y: 3, dir: 'down', look: 'prof', talk: profTalk },
        {
          id: 'rival',
          x: 3,
          y: 6,
          dir: 'up',
          look: 'rival',
          cond: not('rivalLeftLab'),
          talk: async (c) =>
            c.say(c.flag('gotStarter') ? "{RIVAL}: My Wildkin's gonna be way stronger than yours." : "{RIVAL}: Hurry up and pick, {PLAYER}! I'm next!"),
        },
        { id: 'aide', x: 8, y: 9, dir: 'left', look: 'scholar', move: 'look', talk: 'I am an aide to PROF. FENN. She was the one who first named the twelve Wildkin types!' },
      ],
      signs: [
        { x: 5, y: 4, text: pickStarter(SP.EMBERKIT) },
        { x: 6, y: 4, text: pickStarter(SP.SPLASHEL) },
        { x: 7, y: 4, text: pickStarter(SP.SPROUTLE) },
        { x: 1, y: 2, text: 'A humming research machine. Its screen shows a map of VARROW.' },
        { x: 8, y: 2, text: 'A machine that analyzes Wildkin DNA. It beeps cheerfully.' },
        { x: 0, y: 1, text: "Research notes: 'FLAME beats LEAF. LEAF beats TIDE. TIDE beats FLAME.'" },
        { x: 9, y: 1, text: "Research notes: 'Wildkin evolve as they grow stronger through battle.'" },
      ],
      triggers: [{ x: 2, y: 9, w: 6, cond: (s) => !!s.flags.gotStarter && !s.flags['tr:rival1'], run: labRivalBattle }],
    }),
  );

  // ======================= ROUTE 1 =======================
  add(
    makeMap({
      id: 'route1',
      name: 'ROUTE 1',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: ENC.route1,
      rows: [
        'TTTTTTTTT::TTTTTTTTT',
        'TT,,,,,..::..,,,,,TT',
        'TT,,,,,..::..,,,,,TT',
        'TT,,,,,..::..,,,,,TT',
        'TT.......::.......TT',
        'TT..______________TT',
        'TT..,,,,..::......TT',
        'TT..,,,,..::..T...TT',
        'TT..,,,,..::......TT',
        'TT........::..,,,,TT',
        'TT.TTT....::..,,,,TT',
        'TT........::..,,,,TT',
        'TT....f...::.....STT',
        'TT______..::______TT',
        'TT,,,,,,..::,,,,,,TT',
        'TT,,,,,,..::,,,,,,TT',
        'TT........::......TT',
        'TTTT......::....TTTT',
        'TT........::......TT',
        'TT..,,,,..::..,,..TT',
        'TT..,,,,..::..,,..TT',
        'TT........::......TT',
        'TT~~~~....::....TTTT',
        'TT~~~~....::......TT',
        'TT........::..,,,,TT',
        'TT........::..,,,,TT',
        'TT..f.....::......TT',
        'TT........::......TT',
        'TT........::......TT',
        'TTTTTTTTT::TTTTTTTTT',
      ],
      connections: { up: { map: 'brindle', offset: 2 }, down: { map: 'hearthvale', offset: 0 } },
      signs: [{ x: 17, y: 12, text: 'ROUTE 1   North: BRINDLE TOWN   South: HEARTHVALE' }],
      items: [
        { id: 'r1potion', x: 16, y: 7, item: 'potion' },
        { id: 'r1pod', x: 3, y: 27, item: 'pod', n: 2 },
      ],
      npcs: [
        { id: 'pip', x: 14, y: 16, dir: 'left', look: 'youngster', trainer: 'r1_pip', sight: 4 },
        {
          id: 'helper',
          x: 7,
          y: 24,
          dir: 'down',
          look: 'boy',
          move: 'wander',
          talk: 'Weaken a wild Wildkin before you throw a CAPTURE POD. Sleeping or paralyzed ones are easier to catch!',
        },
        { id: 'jumper', x: 12, y: 4, dir: 'down', look: 'girl', move: 'look', talk: 'You can hop down ledges, but you can never climb back up them!' },
      ],
    }),
  );

  // ======================= BRINDLE TOWN =======================
  const br = makeMap({
    id: 'brindle',
    name: 'BRINDLE TOWN',
    legend: OUT,
    border: 'tree',
    music: 'town',
    outdoor: true,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'TT....................TT',
      'TT....................TT',
      'TT....................TT',
      'TT....................TT',
      'TT........S...........TT',
      'TT..:::::::::::::::...TT',
      'TT..:.........S....:..TT',
      '::::::.............:..TT',
      '::::::.............:..TT',
      'TT..:..............:..TT',
      'TT..:..............:..TT',
      'TT..:..............:..TT',
      'TT..:..............:..TT',
      'TT..:::::::::::::::::.TT',
      'TT.ff......::......ff.TT',
      'TT.........::.........TT',
      'TT.B.......::.......B.TT',
      'TT.........::.........TT',
      'TTTTTTTTTTT::TTTTTTTTTTT',
    ],
    connections: { down: { map: 'route1', offset: -2 }, left: { map: 'route2', offset: 0 } },
    signs: [
      { x: 14, y: 7, text: 'BRINDLE TOWN: Green roots, steady hearts.' },
      { x: 10, y: 5, text: 'BRINDLE GYM   LEADER: MOSSA   The gardener of unyielding roots!' },
    ],
    npcs: [
      { id: 'kid', x: 12, y: 10, dir: 'down', look: 'boy', move: 'wander', talk: 'MOSSA uses LEAF Wildkin. FLAME and GALE moves work great on them!' },
      { id: 'lady', x: 7, y: 16, dir: 'right', look: 'mom', move: 'look', talk: 'West of town is ROUTE 2 and the WHISPER CAVE. Strange people in dark hoods went in there yesterday...' },
      { id: 'gard', x: 18, y: 17, dir: 'left', look: 'gardener', move: 'look', talk: 'A HAVEN heals your Wildkin for free. The MARKET sells CAPTURE PODS. Use both often!' },
    ],
  });
  const brGym = building(br, 3, 2, 7, 'green', 'gym');
  const brHouse = building(br, 14, 2, 5, 'red', 'house');
  const brHaven = building(br, 6, 10, 5, 'red', 'haven');
  const brMart = building(br, 13, 10, 4, 'blue', 'mart');
  br.warps.push(
    door(brGym.x, brGym.y, 'brindle_gym', 4, 13),
    door(brHouse.x, brHouse.y, 'brindle_house', 3, 7),
    door(brHaven.x, brHaven.y, 'brindle_haven', 4, 7),
    door(brMart.x, brMart.y, 'brindle_mart', 3, 7),
  );
  add(br);
  add(
    havenInterior('brindle_haven', 'BRINDLE HAVEN', { map: 'brindle', x: brHaven.x, y: brHaven.y + 1 }, [
      { id: 'hk1', x: 7, y: 5, dir: 'left', look: 'hiker', talk: 'I heal up here before every expedition. Never leave home with a tired team!' },
    ]),
  );
  add(martInterior('brindle_mart', 'BRINDLE MARKET', { map: 'brindle', x: brMart.x, y: brMart.y + 1 }, ['pod', 'potion', 'fullcure', 'repel']));
  add(
    houseInterior('brindle_house', 'HOUSE', { map: 'brindle', x: brHouse.x, y: brHouse.y + 1 }, [
      {
        id: 'zapgirl',
        x: 5,
        y: 4,
        dir: 'down',
        look: 'girl',
        talk: async (c) => {
          if (c.flag('giftZap')) {
            await c.say('How is my Zapling doing? Give it lots of head pats. Carefully!');
            return;
          }
          if (!c.flag('gotStarter')) {
            await c.say('My Zapling had a litter of pups! Come back when you are a trainer.');
            return;
          }
          if (await c.yesNo("My Zapling had a litter of sparky pups! I can't keep them all. Would you take one?")) {
            if (c.s.party.length >= 6 && c.s.box.length > 200) {
              await c.say('Oh, you have no room at all.');
              return;
            }
            c.set('giftZap');
            await c.receiveMon(SP.ZAPLING, 8);
            await c.say('Zapling are VOLT type. They zap TIDE and GALE Wildkin silly!');
          } else await c.say('Oh, okay. Let me know if you change your mind.');
        },
      },
    ]),
  );
  add(
    gymInterior(
      'brindle_gym',
      'BRINDLE GYM',
      'l',
      { map: 'brindle', x: brGym.x, y: brGym.y + 1 },
      [
        {
          id: 'mossa',
          x: 4,
          y: 2,
          dir: 'down',
          look: 'mossa',
          trainer: 'g1_mossa',
          sight: 0,
          afterWin: leaderAfter('SPROUT', ['superpotion', 2], [
            'MOSSA: Take these as well. Every gardener needs a little help sometimes.',
            'MOSSA: With the SPROUT BADGE, the cave guard on ROUTE 2 will let you pass into WHISPER CAVE.',
          ]),
          talk: 'MOSSA: Grow steadily, and never forget the roots that hold you up.',
        },
        { id: 'lin', x: 1, y: 6, dir: 'right', look: 'gardener', trainer: 'g1_lin', sight: 4 },
        { id: 'holly', x: 8, y: 10, dir: 'left', look: 'lass', trainer: 'g1_ash', sight: 4 },
        { id: 'guide1', x: 7, y: 12, dir: 'left', look: 'boy', talk: "Hey, future champ! MOSSA's LEAF Wildkin hate FLAME, FROST, GALE and TOXIN moves." },
      ],
      'BRINDLE GYM   Certified trainers: those who bloom.',
    ),
  );

  // ======================= ROUTE 2 =======================
  add(
    makeMap({
      id: 'route2',
      name: 'ROUTE 2',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: ENC.route2,
      rows: [
        'MMMMMMMMTTTTTTTTTTTTTTTTTTTTTT',
        'MMMMMMMMTT,,,,,,....,,,,,,,,TT',
        'MMMMCMMMTT,,,,,,....,,,,,,,,TT',
        'T...:...TT......TT..........TT',
        'T...:.......,,,,TT....T.....TT',
        'T...:.......,,,,........,,,,TT',
        'T...::::::::::::::::::..,,,,TT',
        'T..,,,,..............:..,,,,TT',
        'T..,,,,..............:::::::::',
        'T..,,,,...TTTT.......:::::::::',
        'T.........TTTT..,,,,,,......TT',
        'T..f......TTTT..,,,,,,....S.TT',
        'T...............,,,,,,......TT',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      ],
      connections: { right: { map: 'brindle', offset: 0 } },
      warps: [door(4, 2, 'cave', 11, 18)],
      signs: [{ x: 26, y: 11, text: 'ROUTE 2   West: WHISPER CAVE   East: BRINDLE TOWN' }],
      items: [
        { id: 'r2pods', x: 2, y: 12, item: 'pod', n: 3 },
        { id: 'r2potion', x: 27, y: 1, item: 'potion' },
        { id: 'r2repel', x: 13, y: 1, item: 'repel' },
      ],
      npcs: [
        {
          id: 'guard',
          x: 4,
          y: 3,
          dir: 'down',
          look: 'guard',
          cond: (s) => !hasBadge(s, 'SPROUT'),
          talk: "Sorry, kid. Rockfalls in WHISPER CAVE. Only trainers with BRINDLE GYM's SPROUT BADGE may enter.",
        },
        { id: 'tess', x: 12, y: 3, dir: 'down', look: 'girl', trainer: 'r2_tess', sight: 3 },
        { id: 'mina', x: 23, y: 10, dir: 'left', look: 'lass', trainer: 'r2_mina', sight: 4 },
        { id: 'dale', x: 8, y: 8, dir: 'down', look: 'boy', trainer: 'r2_dale', sight: 3 },
      ],
    }),
  );

  // ======================= WHISPER CAVE =======================
  add(
    makeMap({
      id: 'cave',
      name: 'WHISPER CAVE',
      legend: CAVE,
      border: 'cavewall',
      music: 'cave',
      outdoor: false,
      encounters: ENC.cave,
      rows: [
        'wwwwwwwwwwwwwwwwwwwwwwww',
        'wwwwwwwwwwwwwwwwwwwewwww',
        'wggggggggwwwwwwwwwgggwww',
        'wggRgggggwww*wwwggggggww',
        'wggggwwgggggggggggRgggww',
        'wgggwwwggggggggggggggggw',
        'wwgggwwgggRRgggwwwwgggww',
        'wwgggggggggggggwwwwgggww',
        'wwwwwwgggwwwwgggggggggww',
        'wggggggggwwwwgggRggwwwww',
        'wgRgggggggggggggggggwwww',
        'wgggwwwwwwwggggwwgggggww',
        'wggg*wwwwwwggggwwgggggww',
        'wggggggggggggggwwgggRgww',
        'wwwwggggRggggggggggggggw',
        'wwwwggggggwwwwwwgggggggw',
        'wwwwggggggwwww*wwwwwgggw',
        'wggggggggggggggggggggggw',
        'wgggggggggggwwwwwwwwwwww',
        'wwwwwwwwwwwewwwwwwwwwwww',
      ],
      warps: [door(11, 19, 'route2', 4, 3, 'down'), door(19, 1, 'route3', 5, 19, 'up')],
      items: [
        { id: 'cvsuper', x: 1, y: 17, item: 'superpotion' },
        { id: 'cvrope', x: 21, y: 13, item: 'escaperope' },
        { id: 'cvcandy', x: 2, y: 3, item: 'candy' },
        { id: 'cvpods', x: 11, y: 5, item: 'pod', n: 3 },
      ],
      signs: [
        { x: 12, y: 3, text: 'A cluster of GLOW CRYSTALS. Someone has chipped pieces away.' },
        { x: 4, y: 12, text: 'A cluster of GLOW CRYSTALS. They pulse with a faint warmth.' },
        { x: 14, y: 16, text: 'A cluster of GLOW CRYSTALS. Fresh pickaxe marks surround it.' },
      ],
      npcs: [
        { id: 'bram', x: 5, y: 13, dir: 'right', look: 'hiker', trainer: 'cv_bram', sight: 3 },
        { id: 'grunt1', x: 13, y: 10, dir: 'down', look: 'grunt', trainer: 'cv_grunt1', sight: 3 },
        { id: 'grunt2', x: 20, y: 5, dir: 'left', look: 'grunt', trainer: 'cv_grunt2', sight: 4 },
        {
          id: 'sable',
          x: 19,
          y: 2,
          dir: 'down',
          look: 'sable',
          trainer: 'cv_sable',
          sight: 2,
          cond: not('caveCleared'),
          afterWin: async (c) => {
            await c.say([
              "SABLE: The crystals were only a test. The real prize is the EMBER CORE, and it's practically ours already.",
              'SABLE: Interfere again and the HOLLOW ORDER will not be so gentle. Farewell.',
            ]);
            await c.flash();
            c.hide('sable');
            c.set('caveCleared');
            await c.say('SABLE vanished in a puff of smoke! The way north to ROUTE 3 is open.');
          },
        },
      ],
    }),
  );

  // ======================= ROUTE 3 =======================
  add(
    makeMap({
      id: 'route3',
      name: 'ROUTE 3',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: ENC.route3,
      rows: [
        'TTTTTTTTTTT::TTTTTTTTTTT',
        'TT,,,,,....::....,,,,,TT',
        'TT,,,,,....::....,,,,,TT',
        'TT.........::.........TT',
        'TT..~~~~~~~bb~~~~~~~..TT',
        'TT.~~~~~~~~bb~~~~~~~~.TT',
        'TT.~~~~~~~~bb~~~~~~~~.TT',
        'TT.~~~~~~~~bb~~~~~~~~.TT',
        'TT.~~~~~~~~bb~~~~~~~~.TT',
        'TT..~~~~~~~bb~~~~~~~..TT',
        'TT...,,,,..::..,,,,,.STT',
        'TT...,,,,..::..,,,,,..TT',
        'TT.........::.........TT',
        'TT...:::::::..........TT',
        'TT...:..,,,,,,....,,..TT',
        'TT...:..,,,,,,....,,..TT',
        'TT...:........T.......TT',
        'TT...:..f...........f.TT',
        'TT...:................TT',
        'TT...:................TT',
        'MMMMMCMMMMMMMMMMMMMMMMMM',
        'MMMMMMMMMMMMMMMMMMMMMMMM',
      ],
      connections: { up: { map: 'cindermoor', offset: 1 } },
      warps: [door(5, 20, 'cave', 19, 2, 'down')],
      signs: [{ x: 21, y: 10, text: 'ROUTE 3   LAKE SERENE BRIDGE   North: CINDERMOOR CITY' }],
      items: [
        { id: 'r3great', x: 20, y: 1, item: 'greatpod' },
        { id: 'r3super', x: 2, y: 17, item: 'superpotion' },
        { id: 'r3cure', x: 21, y: 18, item: 'fullcure', n: 2 },
      ],
      npcs: [
        { id: 'finn', x: 11, y: 4, dir: 'down', look: 'sailor', trainer: 'r3_finn', sight: 3 },
        { id: 'rue', x: 12, y: 9, dir: 'up', look: 'lass', trainer: 'r3_rue', sight: 3 },
        { id: 'kip', x: 16, y: 12, dir: 'left', look: 'hiker', trainer: 'r3_kip', sight: 3 },
        { id: 'ivo', x: 8, y: 16, dir: 'right', look: 'scholar', trainer: 'r3_ivo', sight: 4 },
      ],
    }),
  );

  // ======================= CINDERMOOR CITY =======================
  const cm = makeMap({
    id: 'cindermoor',
    name: 'CINDERMOOR CITY',
    legend: OUT,
    border: 'tree',
    music: 'town',
    outdoor: true,
    rows: [
      'TTTTTTTTTTTT::TTTTTTTTTTTT',
      'TT..........::..........TT',
      'TT..........::..........TT',
      'TT..........::..........TT',
      'TT..........::..........TT',
      'TT..........::..........TT',
      'TT..::::::::::::::::::..TT',
      'TT..:.......::.......:..TT',
      'TT..:.......::.......:..TT',
      'TT..:.......::.......:..TT',
      'TT..:.......::.......:..TT',
      'TT..:.......::.......:..TT',
      'TT..:.......::.......:..TT',
      'TT..:.......::.......:..TT',
      'TT..::::::::::::::::::..TT',
      'TT..........::......S...TT',
      'TT..........::.......ff.TT',
      'TT.......f..::..f.....B.TT',
      'TT..........::..........TT',
      'TT.....B....::....B...f.TT',
      'TT..........::..........TT',
      'TTTTTTTTTTTT::TTTTTTTTTTTT',
    ],
    connections: { down: { map: 'route3', offset: -1 }, up: { map: 'route4', offset: -2 } },
    signs: [{ x: 20, y: 15, text: 'CINDERMOOR CITY: Forged in fire, tempered by time.' }],
    npcs: [
      {
        id: 'rival',
        x: 12,
        y: 16,
        dir: 'down',
        look: 'rival',
        cond: () => false,
      },
      {
        id: 'nguard',
        x: 14,
        y: 1,
        dir: 'down',
        look: 'guard',
        cond: (s) => !hasBadge(s, 'CINDER'),
        talk: 'The mountain trail on ROUTE 4 is rough. I only let through trainers with the CINDER BADGE.',
      },
      { id: 'smith', x: 10, y: 9, dir: 'down', look: 'oldman', move: 'look', talk: 'VULK of the GYM can melt iron with a glare! Bring TIDE or STONE Wildkin if you challenge him.' },
      { id: 'tourist', x: 16, y: 18, dir: 'left', look: 'girl', move: 'wander', talk: 'The MUSEUM here has the EMBER CORE, an ancient stone said to hold the first sunrise!' },
    ],
    triggers: [
      {
        x: 12,
        y: 20,
        w: 2,
        cond: (s) => !s.flags['tr:rival2'],
        run: async (c) => {
          c.show('rival', c.s.x, 16, 'down');
          await c.emote('rival');
          await c.walkNpc('rival', ['down', 'down', 'down']);
          c.facePlayer('up');
          await c.say(TRAINERS_INTRO('rival2'));
          const won = await c.battle('rival2');
          if (!won) return;
          await c.say([
            "{RIVAL}: Grr. Okay, I'll admit it. You're not bad. But I'm getting the CINDER BADGE before you!",
            "{RIVAL}: Oh, and Grandma says some creeps in hoods are poking around the MUSEUM. Weird, right? See ya!",
          ]);
          await c.walkNpc('rival', ['up', 'up', 'up', 'up'], 2);
          c.hide('rival');
        },
      },
      {
        x: 12,
        y: 1,
        w: 2,
        cond: (s) => !hasBadge(s, 'CINDER'),
        run: async (c) => {
          await c.say('GUARD: Hold it! The trail north is closed to trainers without the CINDER BADGE.');
          await pushBack(c, 'down');
        },
      },
    ],
  });
  const cmGym = building(cm, 3, 2, 7, 'red', 'gym');
  const cmMuseum = building(cm, 15, 2, 7, 'purple', 'museum');
  const cmHaven = building(cm, 5, 9, 5, 'red', 'haven');
  const cmMart = building(cm, 15, 9, 4, 'blue', 'mart');
  const cmHouse = building(cm, 3, 16, 5, 'gold', 'house');
  cm.warps.push(
    door(cmGym.x, cmGym.y, 'cinder_gym', 4, 13),
    door(cmMuseum.x, cmMuseum.y, 'cinder_museum', 4, 7),
    door(cmHaven.x, cmHaven.y, 'cinder_haven', 4, 7),
    door(cmMart.x, cmMart.y, 'cinder_mart', 3, 7),
    door(cmHouse.x, cmHouse.y, 'cinder_house', 3, 7),
  );
  add(cm);
  add(
    havenInterior('cinder_haven', 'CINDERMOOR HAVEN', { map: 'cindermoor', x: cmHaven.x, y: cmHaven.y + 1 }, [
      { id: 'ch1', x: 2, y: 5, dir: 'right', look: 'ace', talk: 'Status problems like burns and poison wear down your Wildkin every turn. FULL CURE fixes them all!' },
    ]),
  );
  add(
    martInterior('cinder_mart', 'CINDERMOOR MARKET', { map: 'cindermoor', x: cmMart.x, y: cmMart.y + 1 }, [
      'pod',
      'greatpod',
      'potion',
      'superpotion',
      'fullcure',
      'revive',
      'repel',
      'escaperope',
    ]),
  );
  add(
    houseInterior('cinder_house', 'HOUSE', { map: 'cindermoor', x: cmHouse.x, y: cmHouse.y + 1 }, [
      {
        id: 'grandpa',
        x: 5,
        y: 4,
        dir: 'down',
        look: 'oldman',
        talk: async (c) => {
          if (c.flag('candyGift')) {
            await c.say('Wildkin grow fastest when they battle often. That candy was just a little push!');
            return;
          }
          c.set('candyGift');
          await c.say("You remind me of myself at your age, all fire and wanderlust! Here, I've no use for this anymore.");
          await c.give('candy');
        },
      },
    ], 1),
  );
  add(
    makeMap({
      id: 'cinder_museum',
      name: 'CINDERMOOR MUSEUM',
      legend: IN,
      border: 'void',
      music: 'haven',
      outdoor: false,
      rows: ['WWnWWWWnWW', '=o==LL==o=', '==========', '==tt==tt==', '==========', 'p========p', '==========', '====mm===='],
      warps: matWarps(4, 7, { map: 'cindermoor', x: cmMuseum.x, y: cmMuseum.y + 1 }),
      signs: [
        { x: 1, y: 1, text: 'A statue of SOLMARA, the dawn phoenix. Legend says its first flight lit the very first sunrise.' },
        { x: 8, y: 1, text: 'A statue of SOLMARA. Its stone wings are spread wide toward the sky.' },
        {
          x: 4,
          y: 1,
          text: async (c) =>
            c.say(
              hasBadge(c.s, 'CINDER')
                ? c.flag('spireCleared')
                  ? 'The display case is empty. The plaque now reads: EMBER CORE, entrusted to {PLAYER}.'
                  : 'The glass is shattered! The EMBER CORE is gone!'
                : 'A glowing orange stone rests here: the EMBER CORE. It feels warm even through the glass.',
            ),
        },
        { x: 5, y: 1, text: 'A machine that monitors the EMBER CORE. Its readings spike now and then.' },
        { x: 2, y: 3, text: 'A fossil of an ancient Wildkin with enormous wings.' },
        { x: 3, y: 3, text: "A tablet: 'When darkness covets the dawn, the dawn will choose its keeper.'" },
        { x: 6, y: 3, text: 'Old CAPTURE PODS made of carved wood and woven reeds.' },
        { x: 7, y: 3, text: 'A map of VARROW drawn centuries ago. The HOLLOW SPIRE is marked with a black flame.' },
      ],
      npcs: [
        {
          id: 'curator',
          x: 7,
          y: 5,
          dir: 'left',
          look: 'scholar',
          talk: async (c) => {
            if (!hasBadge(c.s, 'CINDER')) {
              await c.say('CURATOR: Welcome! Our treasure is the EMBER CORE. Some say SOLMARA itself sleeps within.');
              return;
            }
            if (!c.flag('spireCleared')) {
              c.set('raidKnown');
              await c.say([
                'CURATOR: Oh, it was awful! People in dark hoods smashed the case and stole the EMBER CORE!',
                'CURATOR: Their leader, NYX, said something about a ritual at the HOLLOW SPIRE on ROUTE 4. Please, stop them!',
              ]);
              return;
            }
            if (!c.flag('museumReward')) {
              c.set('museumReward');
              await c.say("CURATOR: You recovered the EMBER CORE! It seems to have chosen you. Please keep it safe. And take this, with our thanks.");
              await c.give('ultrapod', 3);
              return;
            }
            await c.say('CURATOR: The whole city is talking about you, {PLAYER}!');
          },
        },
      ],
    }),
  );
  add(
    gymInterior(
      'cinder_gym',
      'CINDERMOOR GYM',
      'F',
      { map: 'cindermoor', x: cmGym.x, y: cmGym.y + 1 },
      [
        {
          id: 'vulk',
          x: 4,
          y: 2,
          dir: 'down',
          look: 'vulk',
          trainer: 'g2_vulk',
          sight: 0,
          afterWin: async (c) => {
            await leaderAfter('CINDER', ['revive', 2], ['VULK: And take these. Even the hottest fire needs a second spark sometimes.'])(c);
            await c.wait(20);
            c.g.sfx('super');
            await c.flash();
            await c.say([
              'VULK: Whoa! Did you feel that rumble? It came from the MUSEUM!',
              'VULK: Go check it out, {PLAYER}! I have a bad feeling about this.',
            ]);
          },
          talk: 'VULK: Your fire burns bright! Keep it lit, no matter how hard the wind blows.',
        },
        { id: 'kai', x: 1, y: 6, dir: 'right', look: 'firebreather', trainer: 'g2_kai', sight: 4 },
        { id: 'dov', x: 8, y: 10, dir: 'left', look: 'hiker', trainer: 'g2_dov', sight: 4 },
        { id: 'guide2', x: 7, y: 12, dir: 'left', look: 'boy', talk: "VULK's FLAME Wildkin can't stand TIDE and STONE moves. FROST and LEAF moves will barely tickle them!" },
      ],
      'CINDERMOOR GYM   LEADER: VULK   The flame that never dies!',
    ),
  );

  // ======================= ROUTE 4 =======================
  const r4 = makeMap({
    id: 'route4',
    name: 'ROUTE 4',
    legend: OUT,
    border: 'cliff',
    music: 'route',
    outdoor: true,
    encounters: ENC.route4,
    rows: [
      'TTTTTTTTTT::TTTTTTTTTT',
      'MM........::........MM',
      'MM........::...,,,,.MM',
      'MM........::...,,,,.MM',
      'MM........::........MM',
      'MM..::::::::........MM',
      'MM..:.....::...R....MM',
      'MM,,:,,...::........MM',
      'MM,,:,,...::..,,,,..MM',
      'MM..:.....::..,,,,..MM',
      'MM..:.....::........MM',
      'MM__:_____::______..MM',
      'MM..:.....::.....,,.MM',
      'MM..:,,,,.::.....,,.MM',
      'MM..:,,,,.::........MM',
      'MM..::::::::........MM',
      'MM........::...T....MM',
      'MM.,,,,...::........MM',
      'MM.,,,,...::..,,,,..MM',
      'MM........::..,,,,..MM',
      'MM....R...::........MM',
      'MM........::......S.MM',
      'MM.,,,,...::........MM',
      'MM.,,,,...::..,,,,..MM',
      'MM........::..,,,,..MM',
      'MM........::........MM',
      'MM..f.....::.....f..MM',
      'MM........::........MM',
      'MM........::........MM',
      'TTTTTTTTTT::TTTTTTTTTT',
    ],
    connections: { down: { map: 'cindermoor', offset: 2 }, up: { map: 'galewick', offset: 0 } },
    signs: [{ x: 18, y: 21, text: 'ROUTE 4   MOUNTAIN TRAIL   North: GALEWICK' }],
    items: [
      { id: 'r4super', x: 19, y: 2, item: 'superpotion' },
      { id: 'r4revive', x: 3, y: 20, item: 'revive' },
      { id: 'r4great', x: 18, y: 24, item: 'greatpod', n: 2 },
      { id: 'r4hyper', x: 19, y: 25, item: 'hyperpotion' },
    ],
    npcs: [
      {
        id: 'blockA',
        x: 10,
        y: 1,
        dir: 'down',
        look: 'grunt',
        cond: not('spireCleared'),
        talk: 'GRUNT: Nobody passes while the ritual is underway! Orders from NYX herself!',
      },
      {
        id: 'blockB',
        x: 11,
        y: 1,
        dir: 'down',
        look: 'grunt',
        cond: not('spireCleared'),
        talk: 'GRUNT: The dawn will rise for the HOLLOW ORDER alone! Go home, kid.',
      },
      { id: 'bo', x: 7, y: 9, dir: 'right', look: 'hiker', trainer: 'r4_bo', sight: 3 },
      { id: 'ana', x: 13, y: 19, dir: 'left', look: 'ace', trainer: 'r4_ana', sight: 3 },
      { id: 'ty', x: 6, y: 23, dir: 'right', look: 'birdkeeper', trainer: 'r4_ty', sight: 4 },
      { id: 'r4grunt', x: 6, y: 6, dir: 'down', look: 'grunt', trainer: 'r4_grunt', sight: 3, cond: not('spireCleared') },
    ],
  });
  const spDoor = building(r4, 2, 1, 6, 'purple', 'spire');
  r4.warps.push(door(spDoor.x, spDoor.y, 'spire1', 5, 11));
  add(r4);

  add(
    makeMap({
      id: 'spire1',
      name: 'HOLLOW SPIRE 1F',
      legend: IN,
      border: 'void',
      music: 'hideout',
      outdoor: false,
      rows: [
        'wwwwwwwwwwww',
        'wsssssssszsw',
        'wssssssssssw',
        'wsswwwwwwssw',
        'wssssssssssw',
        'wssssssssssw',
        'wsssswwwwssw',
        'wssssssssssw',
        'wssssssssssw',
        'wwwsssssswww',
        'wssssssssssw',
        'wwwwwmmwwwww',
      ],
      warps: [...matWarps(5, 11, { map: 'route4', x: spDoor.x, y: spDoor.y + 1 }), door(9, 1, 'spire2', 9, 10, 'up')],
      npcs: [
        { id: 'sg1', x: 8, y: 7, dir: 'left', look: 'grunt', trainer: 'sp_grunt1', sight: 4 },
        { id: 'sg2', x: 2, y: 4, dir: 'right', look: 'grunt', trainer: 'sp_grunt2', sight: 5 },
        { id: 'sable', x: 9, y: 2, dir: 'down', look: 'sable', trainer: 'sp_sable', sight: 2, cond: (s) => !s.flags['tr:sp_sable'] },
      ],
      items: [{ id: 'spfull', x: 1, y: 10, item: 'fullcure', n: 2 }],
    }),
  );

  const spire2Enter: Script = async (c) => {
    if (c.flag('spireCleared')) setTile(M.spire2, 5, 1, 'pedestal_empty');
  };
  add(
    makeMap({
      id: 'spire2',
      name: 'HOLLOW SPIRE TOP',
      legend: IN,
      border: 'void',
      music: 'hideout',
      outdoor: false,
      rows: [
        'wwwwwwwwwwww',
        'wwwssAssswww',
        'wwsssssssssw',
        'wssssssssssw',
        'wssssssssssw',
        'wsswwsswwssw',
        'wssssssssssw',
        'wssssssssssw',
        'wssssssssssw',
        'wssssssssssw',
        'wssssssssssw',
        'wwwwwwwwwzww',
      ],
      warps: [door(9, 11, 'spire1', 9, 2, 'down')],
      onEnter: spire2Enter,
      items: [{ id: 'spultra', x: 1, y: 9, item: 'ultrapod', n: 2 }],
      npcs: [
        {
          id: 'nyx',
          x: 5,
          y: 3,
          dir: 'down',
          look: 'nyx',
          trainer: 'sp_nyx',
          sight: 5,
          cond: not('nyxDefeated'),
          afterWin: async (c) => {
            await c.say('NYX: ...What is this light?!');
            c.g.sfx('evolve');
            await c.flash();
            await c.flash();
            await c.say([
              'The EMBER CORE on the pedestal blazes like a tiny sun!',
              'NYX: It burns! It will not answer to us... HOLLOW ORDER, fall back!',
            ]);
            c.hide('nyx');
            c.set('nyxDefeated');
            await c.say('NYX fled down the stairs! The EMBER CORE still glows on the pedestal.');
          },
        },
      ],
      signs: [
        {
          x: 5,
          y: 1,
          text: async (c) => {
            if (c.flag('spireCleared')) {
              await c.say('An empty stone pedestal, still warm to the touch.');
              return;
            }
            if (!c.flag('nyxDefeated')) {
              await c.say('The EMBER CORE rests on the pedestal, guarded by NYX.');
              return;
            }
            await c.say('The EMBER CORE trembles... A blinding light pours out of it!');
            c.g.sfx('evolve');
            await c.flash();
            await c.say('SOLMARA, the dawn phoenix, has awakened!');
            const r = await c.wild(SP.SOLMARA, 35, { music: 'boss' });
            if (r === 'lose') return;
            if (r === 'caught') await c.say('The legendary SOLMARA has chosen to travel with you!');
            else await c.say('SOLMARA soared through the roof and vanished into the clouds...');
            setTile(M.spire2, 5, 1, 'pedestal_empty');
            c.set('spireCleared');
            await c.give('embercore');
            await c.say('The EMBER CORE has gone cool and calm. The HOLLOW ORDER has fled. The road north to GALEWICK is clear!');
          },
        },
      ],
    }),
  );

  // ======================= GALEWICK =======================
  const gw = makeMap({
    id: 'galewick',
    name: 'GALEWICK',
    legend: OUT,
    border: 'tree',
    music: 'town',
    outdoor: true,
    rows: [
      'TTTTTTTTTT::TTTTTTTTTT',
      'TT........::........TT',
      'TT........::........TT',
      'TT........::........TT',
      'TT........::........TT',
      'TT........::........TT',
      'TT.:::::::::::::::..TT',
      'TT.:......::.....:..TT',
      'TT.:......::.....:..TT',
      'TT.:......::.....:..TT',
      'TT.:......::.....:..TT',
      'TT.:......::.....:..TT',
      'TT.:......::.....:..TT',
      'TT.:::::::::::::::..TT',
      'TT........::....S...TT',
      'TT.ff.....::.....ff.TT',
      'TT.B......::......B.TT',
      'TTTTTTTTTT::TTTTTTTTTT',
    ],
    connections: { down: { map: 'route4', offset: 0 }, up: { map: 'route5', offset: -1 } },
    signs: [{ x: 16, y: 14, text: 'GALEWICK: The town where the winds are born.' }],
    npcs: [
      {
        id: 'vguard',
        x: 9,
        y: 1,
        dir: 'down',
        look: 'guard',
        talk: async (c) =>
          c.say(hasBadge(c.s, 'GALE') ? 'VICTORY PATH lies north. SUMMIT HALL awaits you, champion-to-be!' : 'Beyond here is VICTORY PATH. Only trainers with all three badges may pass.'),
      },
      { id: 'windgirl', x: 12, y: 9, dir: 'down', look: 'girl', move: 'wander', talk: "ISOLDE trains in the wind every morning. Her FROST and GALE Wildkin hate FLAME, STONE and VOLT moves!" },
      { id: 'elder', x: 8, y: 15, dir: 'right', look: 'oldman', move: 'look', talk: 'They say the HOLLOW SPIRE was built long ago to cage the dawn. Thank goodness someone stopped that ORDER!' },
    ],
    triggers: [
      {
        x: 10,
        y: 1,
        w: 2,
        cond: (s) => !hasBadge(s, 'GALE'),
        run: async (c) => {
          await c.say('GUARD: Halt! You need the GALE BADGE from ISOLDE before you can walk VICTORY PATH.');
          await pushBack(c, 'down');
        },
      },
    ],
  });
  const gwGym = building(gw, 2, 2, 7, 'grey', 'gym');
  const gwHouse = building(gw, 13, 2, 5, 'green', 'house');
  const gwHaven = building(gw, 3, 9, 5, 'red', 'haven');
  const gwMart = building(gw, 13, 9, 4, 'blue', 'mart');
  gw.warps.push(
    door(gwGym.x, gwGym.y, 'gale_gym', 4, 13),
    door(gwHouse.x, gwHouse.y, 'gale_house', 3, 7),
    door(gwHaven.x, gwHaven.y, 'gale_haven', 4, 7),
    door(gwMart.x, gwMart.y, 'gale_mart', 3, 7),
  );
  add(gw);
  add(
    havenInterior('gale_haven', 'GALEWICK HAVEN', { map: 'galewick', x: gwHaven.x, y: gwHaven.y + 1 }, [
      { id: 'gh1', x: 7, y: 5, dir: 'left', look: 'skier', talk: 'The CHAMPION, ELOWEN, trains MIND and SHADE Wildkin. SHADE beats MIND, SPIRIT beats SHADE!' },
    ]),
  );
  add(
    martInterior('gale_mart', 'GALEWICK MARKET', { map: 'galewick', x: gwMart.x, y: gwMart.y + 1 }, [
      'greatpod',
      'ultrapod',
      'superpotion',
      'hyperpotion',
      'fullcure',
      'revive',
      'repel',
      'escaperope',
    ]),
  );
  add(
    houseInterior('gale_house', 'HOUSE', { map: 'galewick', x: gwHouse.x, y: gwHouse.y + 1 }, [
      {
        id: 'scholar',
        x: 5,
        y: 4,
        dir: 'down',
        look: 'scholar',
        talk: async (c) => {
          if (c.flag('ultraGift')) {
            await c.say('The harder a Wildkin is to catch, the better the pod you need. ULTRA PODS work wonders.');
            return;
          }
          c.set('ultraGift');
          await c.say('A traveler! I study rare Wildkin. If you ever meet a GALECREST on VICTORY PATH, you will need these.');
          await c.give('ultrapod', 2);
        },
      },
    ]),
  );
  add(
    gymInterior(
      'gale_gym',
      'GALEWICK GYM',
      'i',
      { map: 'galewick', x: gwGym.x, y: gwGym.y + 1 },
      [
        {
          id: 'isolde',
          x: 4,
          y: 2,
          dir: 'down',
          look: 'isolde',
          trainer: 'g3_isolde',
          sight: 0,
          afterWin: leaderAfter('GALE', ['hyperpotion', 2], [
            'ISOLDE: These will help you on the climb ahead.',
            'ISOLDE: With three badges, VICTORY PATH is open to you. At its peak, CHAMPION ELOWEN waits.',
          ]),
          talk: 'ISOLDE: The wind does not stop for anyone. Neither should you.',
        },
        { id: 'bea', x: 1, y: 6, dir: 'right', look: 'skier', trainer: 'g3_bea', sight: 4 },
        { id: 'tor', x: 8, y: 10, dir: 'left', look: 'birdkeeper', trainer: 'g3_tor', sight: 4 },
        { id: 'guide3', x: 7, y: 12, dir: 'left', look: 'boy', talk: "ISOLDE's team is FROST and GALE. FLAME, STONE and VOLT moves cut right through the storm!" },
      ],
      'GALEWICK GYM   LEADER: ISOLDE   The eye of the storm!',
    ),
  );

  // ======================= ROUTE 5 / VICTORY PATH =======================
  const r5 = makeMap({
    id: 'route5',
    name: 'VICTORY PATH',
    legend: OUT,
    border: 'cliff',
    music: 'route',
    outdoor: true,
    encounters: ENC.route5,
    rows: [
      'MMMMMMMMMMMMMMMMMMMM',
      'MM................MM',
      'MM................MM',
      'MM................MM',
      'MM................MM',
      'MM.......::.......MM',
      'MM.......::.......MM',
      'MM.,,,,..::..,,,,.MM',
      'MM.,,,,..::..,,,,.MM',
      'MM.......::.......MM',
      'MM___....::....___MM',
      'MM.......::.......MM',
      'MM..R....::....R..MM',
      'MM.,,,,..::..,,,,.MM',
      'MM.,,,,..::..,,,,.MM',
      'MM.......::.......MM',
      'MM.......::.......MM',
      'MM..f....::....f..MM',
      'MM.,,,,..::..,,,,.MM',
      'MM.,,,,..::..,,,,.MM',
      'MM.......::.......MM',
      'MM.......::.......MM',
      'MM.......::.......MM',
      'MMMMMMMMM::MMMMMMMMM',
    ],
    connections: { down: { map: 'galewick', offset: 1 } },
    items: [
      { id: 'r5revive', x: 3, y: 14, item: 'revive', n: 2 },
      { id: 'r5hyper', x: 16, y: 8, item: 'hyperpotion', n: 2 },
      { id: 'r5candy', x: 16, y: 21, item: 'candy' },
    ],
    npcs: [
      { id: 'vera', x: 8, y: 9, dir: 'right', look: 'ace', trainer: 'r5_vera', sight: 3 },
      { id: 'otto', x: 11, y: 15, dir: 'left', look: 'ace', trainer: 'r5_otto', sight: 3 },
      { id: 'luz', x: 8, y: 20, dir: 'right', look: 'scholar', trainer: 'r5_luz', sight: 3 },
      {
        id: 'rival',
        x: 10,
        y: 5,
        dir: 'down',
        look: 'rival',
        cond: (s) => !s.flags['tr:rival3'],
        talk: "{RIVAL}: SUMMIT HALL is right behind me. But you'll have to get through me first!",
      },
    ],
    triggers: [
      {
        x: 2,
        y: 6,
        w: 16,
        cond: (s) => !s.flags['tr:rival3'],
        run: async (c) => {
          await c.emote('rival');
          const dx = c.s.x - 10;
          const path: Dir[] = new Array(Math.abs(dx)).fill(dx > 0 ? 'right' : 'left');
          await c.walkNpc('rival', path);
          c.face('rival', 'down');
          c.facePlayer('up');
          await c.say(TRAINERS_INTRO('rival3'));
          const won = await c.battle('rival3');
          if (!won) return;
          await c.say([
            '{RIVAL}: ...You know, back in the lab, I thought I picked the better partner.',
            "{RIVAL}: Turns out it was never about the pick. Go on, {PLAYER}. Show the CHAMPION what HEARTHVALE is made of!",
          ]);
          await c.walkNpc('rival', ['down', 'down'], 2);
          c.hide('rival');
        },
      },
    ],
  });
  const hall = building(r5, 7, 1, 6, 'gold', 'hall');
  r5.warps.push(door(hall.x, hall.y, 'summit', 5, 13));
  add(r5);

  add(
    makeMap({
      id: 'summit',
      name: 'SUMMIT HALL',
      legend: IN,
      border: 'void',
      music: 'gym',
      outdoor: false,
      rows: [
        'WWnWWWWWWnWW',
        '%o%%%gg%%%o%',
        '%%%%%gg%%%%%',
        '%%%%%gg%%%%%',
        '%o%%%gg%%%o%',
        '%%%%%gg%%%%%',
        '%%%%%gg%%%%%',
        '%o%%%gg%%%o%',
        '%%%%%gg%%%%%',
        '%%%%%gg%%%%%',
        '%%%%%gg%%%%%',
        '%%%%%gg%%%%%',
        '%%%%%gg%%%%%',
        '%%%%%mm%%%%%',
      ],
      warps: matWarps(5, 13, { map: 'route5', x: hall.x, y: hall.y + 1 }),
      signs: [
        { x: 1, y: 1, text: 'A statue of a past CHAMPION, its Wildkin at its side.' },
        { x: 10, y: 1, text: 'A statue of a past CHAMPION. The plaque is worn smooth by time.' },
        { x: 1, y: 4, text: 'Engraved in gold: TRUST YOUR WILDKIN, AND THEY WILL TRUST YOU.' },
        { x: 10, y: 4, text: 'Engraved in gold: EVERY CHAMPION WAS ONCE A BEGINNER.' },
        { x: 1, y: 7, text: 'A statue of SOLMARA, wings spread over the hall.' },
        { x: 10, y: 7, text: 'A statue of SOLMARA, eyes fixed on the horizon.' },
      ],
      npcs: [
        {
          id: 'elowen',
          x: 5,
          y: 2,
          dir: 'down',
          look: 'elowen',
          trainer: 'champ',
          sight: 0,
          talk: async (c) => {
            await c.say(c.flag('champion') ? 'ELOWEN: Welcome back, CHAMPION. VARROW is in good hands.' : 'ELOWEN: Come back when you are ready.');
            if (c.flag('champion') && (await c.yesNo('ELOWEN: Shall we battle again, for old times\' sake?'))) {
              c.set('tr:champ', false);
              await c.say(TRAINERS_INTRO('champ'));
              await c.battle('champ');
            }
          },
          afterWin: async (c) => {
            if (c.flag('champion')) {
              await c.say('ELOWEN: Splendid as ever. Thank you, CHAMPION.');
              return;
            }
            await c.say([
              'ELOWEN: You and your Wildkin fought as one. That is the heart of a true CHAMPION.',
              'ELOWEN: From this day, your name is carved into SUMMIT HALL, {PLAYER}.',
            ]);
            await c.say("PROF. FENN: {PLAYER}! I ran all the way up the mountain! You did it! I'm so proud of you.");
            await c.say("{RIVAL}: Heh. Guess I'll just have to become CHAMPION after you. Congrats, {PLAYER}.");
            c.set('champion');
            await c.g.open(new EndingScene());
            for (const m of c.s.party) healMon(m);
            c.s.heal = { map: 'home', x: 2, y: 5 };
            await c.warp('home', 2, 5, 'down');
            await c.say("MOM: Welcome home, CHAMPION! Tell me everything! ...But rest first. Your Wildkin are all healed up.");
            if (await c.yesNo('Save your game?')) {
              if (saveGame(c.s)) {
                c.g.sfx('save');
                await c.say('{PLAYER} saved the game!');
              }
            }
            await c.say('Your adventure continues! Try to complete the WILDEX, and challenge ELOWEN again anytime.');
          },
        },
      ],
    }),
  );

  return M;
}

function TRAINERS_INTRO(id: string) {
  return TRAINERS[id].intro;
}

let cache: Record<string, MapDef> | null = null;

export function allMaps(): Record<string, MapDef> {
  if (!cache) cache = buildAll();
  return cache;
}

export function getMap(id: string): MapDef {
  const m = allMaps()[id];
  if (!m) throw new Error('Unknown map ' + id);
  return m;
}
