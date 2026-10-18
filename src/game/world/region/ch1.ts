/**
 * Chapter 1: HEARTHVALE, ROUTE 1, THICKET WOODS, ROUTE 2 and BRINDLE TOWN.
 */
import { species, SP } from '../../data/species';
import { rivalStarter, T } from '../../data/trainers';
import { healMon } from '../../systems/mon';
import { building, door, gymInterior, havenInterior, houseInterior, IN, makeMap, martInterior, matWarps, OUT, type World } from '../build';
import { enc, giver, intro, leaderAfter, not } from '../common';
import type { Script } from '../types';

// ---------------------------------------------------------------- scripts

const momTalk: Script = async (c) => {
  if (!c.flag('gotStarter')) {
    await c.say(['MOM: Morning, sleepyhead! PROF. FENN came by earlier looking for you.', "She's in her lab, just north of here. Don't keep her waiting!"]);
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
  await c.say(['PROF. FENN: Here we are! On that table are three Wildkin, each one waiting for a partner.', 'Go ahead, {PLAYER}. Choose the one that speaks to you!']);
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
      await c.say('These pods belong to PROF. FENN. Better talk to her first.');
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
    'PROF. FENN: There are over a hundred and fifty kinds of Wildkin in VARROW. Fill that WILDEX for me!',
    'BRINDLE TOWN lies north, past ROUTE 1 and THICKET WOODS. Its GYM is a fine first test. Good luck, {PLAYER}!',
  ]);
};

const profTalk: Script = async (c) => {
  if (!c.flag('gotStarter')) {
    await c.say('PROF. FENN: Go on! Pick one of the three pods on the table.');
    return;
  }
  const n = c.s.caught.length;
  if (n >= 150 && !c.flag('gotOrigen')) {
    await c.say(['PROF. FENN: {PLAYER}... one hundred and fifty kinds! I have something I have kept secret for years.', 'This Wildkin hatched from a glowing egg I found as a girl. I think it was waiting for you.']);
    c.set('gotOrigen');
    await c.receiveMon(SP.ORIGEN, 30);
    return;
  }
  if (c.s.badges.length >= 8 && !c.flag('gotThirdStarter')) {
    const left = [SP.SPROUTLE, SP.EMBERKIT, SP.SPLASHEL].find((x) => x !== c.s.starter && x !== rivalStarter(c.s) && !c.flag('gift:' + x));
    if (left) {
      await c.say("PROF. FENN: Eight badges! You deserve the last Wildkin from my lab. It has been waiting so patiently.");
      c.set('gotThirdStarter');
      c.set('gift:' + left);
      await c.receiveMon(left, 25);
      return;
    }
  }
  if (c.flag('champion')) {
    await c.say(`PROF. FENN: CHAMPION {PLAYER}! Your WILDEX has ${n} entries. Can you find all 151?`);
    return;
  }
  await c.say(n < 10 ? `PROF. FENN: You've caught ${n} kinds of Wildkin. Every one teaches us something new!` : `PROF. FENN: ${n} kinds already?! You're a natural researcher, {PLAYER}!`);
  if (n >= 30 && !c.flag('profGift')) {
    c.set('profGift');
    await c.say("PROF. FENN: Here, take these. You've earned them.");
    await c.give('ultrapod', 5);
  }
};

// ---------------------------------------------------------------- build

export function build(W: World) {
  // ======================= HEARTHVALE =======================
  const hv = makeMap({
    id: 'hearthvale',
    name: 'HEARTHVALE',
    legend: OUT,
    border: 'tree',
    music: 'town',
    outdoor: true,
    fly: { x: 5, y: 13 },
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
      'TT.ff...s~~~~s.ff.TT',
      'TT..L...s~~~~s..L.TT',
      'TTTTTTTT~~~~~~TTTTTT',
    ],
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
              ? 'Ah, you have a partner now! The sea to the south leads to CINDERMOOR, if you ever find a way to cross it.'
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
  W.add(hv);

  const home = houseInterior('home', 'HOME', { map: 'hearthvale', x: hvHome.x, y: hvHome.y + 1 }, [{ id: 'mom', x: 5, y: 4, dir: 'left', look: 'mom', talk: momTalk }], 1);
  home.signs = [
    { x: 6, y: 1, text: 'A show about a young trainer crossing a vast desert with a Wildkin. Gripping stuff!' },
    { x: 0, y: 1, text: "MOM's cookbooks. One is titled '101 Snacks Wildkin Love'." },
    { x: 7, y: 1, text: 'A shelf of comics about heroic Wildkin.' },
  ];
  W.add(home);
  W.add(
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
            await c.give('potion', 3);
            return;
          }
          if (c.s.badges.length >= 3 && !c.flag('juneMap')) {
            c.set('juneMap');
            await c.say('JUNE: Grandma says you are doing great. Here, these always come in handy on long trips.');
            await c.give('superpotion', 3);
            return;
          }
          await c.say('JUNE: Grandma says every Wildkin has a story. I hope you find lots of them!');
        },
      },
    ]),
  );

  W.add(
    makeMap({
      id: 'lab',
      name: "FENN'S LAB",
      legend: IN,
      border: 'void',
      music: 'haven',
      outdoor: false,
      rows: ['WWnWWWWnWW', 'BBBB==BBBB', '=L======L=', '==========', '=====kkk==', '==========', '==========', '==========', 'BB======BB', '==========', '==========', '====mm===='],
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
          talk: async (c) => c.say(c.flag('gotStarter') ? "{RIVAL}: My Wildkin's gonna be way stronger than yours." : "{RIVAL}: Hurry up and pick, {PLAYER}! I'm next!"),
        },
        { id: 'aide', x: 8, y: 9, dir: 'left', look: 'scholar', move: 'look', talk: 'I am an aide to PROF. FENN. She was the one who first charted all fifteen Wildkin types!' },
        {
          id: 'aide2',
          x: 1,
          y: 6,
          dir: 'right',
          look: 'scientist',
          talk: giver('labPods', 'pod', 5, 'You are heading out? Take some extra CAPTURE PODS. The PROF insists!', 'Weaken wild Wildkin before you throw a pod. Status problems help too!', (s) => !!s.flags.gotDex, 'The PROF wants to talk to you first.'),
        },
      ],
      signs: [
        { x: 5, y: 4, text: pickStarter(SP.EMBERKIT) },
        { x: 6, y: 4, text: pickStarter(SP.SPLASHEL) },
        { x: 7, y: 4, text: pickStarter(SP.SPROUTLE) },
        { x: 1, y: 2, text: 'A humming research machine. Its screen shows a map of VARROW.' },
        { x: 8, y: 2, text: 'A machine that analyzes Wildkin DNA. It beeps cheerfully.' },
        { x: 0, y: 1, text: "Research notes: 'FLAME beats LEAF. LEAF beats TIDE. TIDE beats FLAME.'" },
        { x: 9, y: 1, text: "Research notes: 'Some Wildkin evolve only when they touch a special shard.'" },
      ],
      triggers: [{ x: 2, y: 9, w: 6, cond: (s) => !!s.flags.gotStarter && !s.flags['tr:rival1'], run: labRivalBattle }],
    }),
  );

  // ======================= ROUTE 1 =======================
  W.add(
    makeMap({
      id: 'route1',
      name: 'ROUTE 1',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Fluffin 2-4 45, Nibbit 2-4 45, Pecklet 3-4 10'),
      fish: enc(1, 'Mudgill 5-10 100'),
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
      signs: [{ x: 17, y: 12, text: 'ROUTE 1   North: THICKET WOODS   South: HEARTHVALE' }],
      items: [
        { id: 'r1potion', x: 16, y: 7, item: 'potion' },
        { id: 'r1pod', x: 3, y: 27, item: 'pod', n: 2 },
      ],
      npcs: [
        { id: 'pip', x: 14, y: 16, dir: 'left', look: 'youngster', trainer: T('r1_pip', 'YOUNGSTER', 'PIP', [['Nibbit', 3], ['Nibbit', 4]]), sight: 4 },
        { id: 'helper', x: 7, y: 24, dir: 'down', look: 'boy', move: 'wander', talk: 'Weaken a wild Wildkin before you throw a CAPTURE POD. Sleeping or paralyzed ones are easier to catch!' },
        { id: 'jumper', x: 12, y: 4, dir: 'down', look: 'girl', move: 'look', talk: 'You can hop down ledges, but you can never climb back up them!' },
      ],
    }),
  );

  // ======================= THICKET WOODS =======================
  W.add(
    makeMap({
      id: 'woods',
      name: 'THICKET WOODS',
      legend: OUT,
      border: 'tree',
      music: 'cave',
      outdoor: true,
      encounters: enc(0.09, 'Larvule 3-5 30, Thornet 3-5 30, Cocoonix 4-6 12, Hivecap 4-6 12, Fluffin 4-5 10, Zapling 4-5 4, Glimmoth 7-7 1, Vespire 7-7 1'),
      rows: [
        'TTTTTTTTTTT..TTTTTTTTTTT',
        'TT,,,,.....::....,,,TTTT',
        'TT,,,,.....::....,,,TTTT',
        'TT..TTTTTTTTTTTTT...,,TT',
        'TT..TTTTTTTTTTTTT...,,TT',
        'TT........TT,,,,,...TTTT',
        'TT,,......TT,,,,,...TTTT',
        'TTTTTTTT..TT..TTTTTT..TT',
        'TTTTTTTT..TT..TTTTTT..TT',
        'TT,,,,....TT........,,TT',
        'TT,,,,....TT........,,TT',
        'TT..TTTTTTTTTTTTTTTTTTTT',
        'TT..TTTTTTTTTTTTTTTTTTTT',
        'TT......,,,,,,,,......TT',
        'TT......,,,,,,,,......TT',
        'TTTTTTTTTTTTTTTTTTT...TT',
        'TTTTTTTTTTTTTTTTTTT...TT',
        'TT.......,,,,,,,,.....TT',
        'TT.......,,,,,,,,.....TT',
        'TT..TTTTTTTTTTTTTTTTTTTT',
        'TT..TTTTTTTTTTTTTTTTTTTT',
        'TT..,,,,,,,,,,,,,,,,..TT',
        'TT..,,,,,,,,,,,,,,,,..TT',
        'TTTTTTTTTTTTTTTTTT....TT',
        'TTTTTTTTTTTTTTTTTT....TT',
        'TT......,,,,,,,,......TT',
        'TT......,,,,,,,,......TT',
        'TT..TTTTTTT..TTTTTTT..TT',
        'TT..TTTTTTT..TTTTTTT..TT',
        'TTTTTTTTTTT..TTTTTTTTTTT',
      ],
      items: [
        { id: 'wdpod', x: 2, y: 9, item: 'pod', n: 3 },
        { id: 'wdpotion', x: 21, y: 4, item: 'potion', n: 2 },
        { id: 'wdantidote', x: 2, y: 25, item: 'antidote', n: 2 },
        { id: 'wdtm', x: 3, y: 2, item: 'tm02' },
      ],
      npcs: [
        { id: 'bug1', x: 16, y: 25, dir: 'left', look: 'boy', trainer: T('wd_rik', 'BUG FAN', 'RIK', [['Larvule', 5], ['Thornet', 5]]), sight: 4 },
        { id: 'bug2', x: 9, y: 17, dir: 'down', look: 'boy', trainer: T('wd_sol', 'BUG FAN', 'SOL', [['Thornet', 6], ['Hivecap', 6]]), sight: 2 },
        { id: 'bug3', x: 4, y: 13, dir: 'right', look: 'boy', trainer: T('wd_pim', 'BUG FAN', 'PIM', [['Larvule', 6], ['Cocoonix', 6], ['Thornet', 6]]), sight: 3 },
        { id: 'lass1', x: 14, y: 9, dir: 'left', look: 'lass', trainer: T('wd_ivy', 'LASS', 'IVY', [['Fluffin', 6], ['Larvule', 7]]), sight: 3 },
        { id: 'woodsman', x: 15, y: 2, dir: 'down', look: 'oldman', move: 'look', talk: 'Larvule wrap themselves in silk, then burst out with wings. The woods are full of little wonders.' },
      ],
      signs: [],
    }),
  );

  // ======================= ROUTE 2 =======================
  W.add(
    makeMap({
      id: 'route2',
      name: 'ROUTE 2',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Fluffin 4-6 30, Nibbit 4-6 30, Pecklet 4-6 25, Larvule 4-5 8, Thornet 4-5 7'),
      rows: [
        'TTTTTTTTT..TTTTTTTTT',
        'TT.......::.....MMTT',
        'TT.,,,...::.....MCTT',
        'TT.,,,...::......:TT',
        'TT.......::::::::.TT',
        'TT___....::.....__TT',
        'TT.......::.......TT',
        'TT..,,,,.::.,,,,..TT',
        'TT..,,,,.::.,,,,..TT',
        'TT.......::.......TT',
        'TT..f....::....f..TT',
        'TT.......::....S..TT',
        'TTTTT....::....TTTTT',
        'TT.......::.......TT',
        'TT.,,,,..::..,,,,.TT',
        'TT.,,,,..::..,,,,.TT',
        'TT.......::.......TT',
        'TTTTTTTTT..TTTTTTTTT',
      ],
      warps: [door(17, 2, 'burrow', 3, 2, 'down')],
      signs: [{ x: 16, y: 11, text: 'ROUTE 2   North: BRINDLE TOWN   East cave: BURROW TUNNEL' }],
      items: [{ id: 'r2great', x: 3, y: 2, item: 'superpotion' }],
      npcs: [
        { id: 'rival', x: 9, y: 0, dir: 'down', look: 'rival', cond: () => false },
        { id: 'pic1', x: 13, y: 14, dir: 'left', look: 'girl', trainer: T('r2_bea', 'PICNICKER', 'BEA', [['Fluffin', 7], ['Pecklet', 7]]), sight: 3 },
      ],
      triggers: [
        {
          x: 9,
          y: 6,
          w: 2,
          cond: (s) => !s.flags['tr:rival2'] && !!s.flags.gotDex,
          run: async (c) => {
            c.show('rival', c.s.x, 2, 'down');
            await c.emote('rival');
            await c.walkNpc('rival', ['down', 'down', 'down']);
            c.facePlayer('up');
            await c.say(intro('rival2'));
            const won = await c.battle('rival2');
            if (!won) return;
            await c.say("{RIVAL}: The BRINDLE GYM uses STONE Wildkin. Good luck with THAT, slowpoke!");
            await c.walkNpc('rival', ['up', 'up', 'up', 'up'], 2);
            c.hide('rival');
          },
        },
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
    fly: { x: 8, y: 14 },
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'TT....................TT',
      'TT....................TT',
      'TT....................TT',
      'TT....................TT',
      'TT........S...........TT',
      'TT..:::::::::::::::...TT',
      'TT..:.........S....:..TT',
      'TT..:..............:::::',
      'TT..:..............:::::',
      'TT..:..............:..TT',
      'TT..:..............:..TT',
      'TT..:..............:..TT',
      'TT..:..............:..TT',
      'TT..:::::::::::::::::.TT',
      'TT.ff......::......ff.TT',
      'TT.........::.........TT',
      'TT.B.......::.......B.TT',
      'TT.....L...::...L.....TT',
      'TTTTTTTTTTT..TTTTTTTTTTT',
    ],
    signs: [
      { x: 14, y: 7, text: 'BRINDLE TOWN: A gray stone town, steady as bedrock.' },
      { x: 10, y: 5, text: 'BRINDLE GYM   LEADER: GARRICK   The rock that does not crack!' },
    ],
    npcs: [
      { id: 'kid', x: 12, y: 10, dir: 'down', look: 'boy', move: 'wander', talk: 'GARRICK uses STONE Wildkin. TIDE and LEAF moves work great on them. BEAST moves barely scratch them!' },
      { id: 'lady', x: 7, y: 16, dir: 'right', look: 'mom', move: 'look', talk: 'East of town is ROUTE 3 and WHISPER CAVE. Strange people in dark hoods went in there yesterday...' },
      { id: 'gard', x: 18, y: 17, dir: 'left', look: 'gardener', move: 'look', talk: 'A HAVEN heals your Wildkin for free. The MARKET sells CAPTURE PODS. Use both often!' },
      {
        id: 'eguard',
        x: 22,
        y: 8,
        dir: 'left',
        look: 'guard',
        cond: (s) => s.badges.length < 1,
        talk: 'Rockfalls in WHISPER CAVE! Only trainers with the BOULDER BADGE from our GYM may head east.',
      },
    ],
  });
  const brGym = building(br, 3, 2, 7, 'grey', 'gym');
  const brMuseum = building(br, 14, 2, 5, 'purple', 'museum');
  const brHaven = building(br, 6, 10, 5, 'red', 'haven');
  const brMart = building(br, 13, 10, 4, 'blue', 'mart');
  br.warps.push(
    door(brGym.x, brGym.y, 'brindle_gym', 4, 13),
    door(brMuseum.x, brMuseum.y, 'brindle_museum', 4, 7),
    door(brHaven.x, brHaven.y, 'brindle_haven', 4, 7),
    door(brMart.x, brMart.y, 'brindle_mart', 3, 7),
  );
  br.triggers.push({
    x: 22,
    y: 9,
    cond: (s) => s.badges.length < 1,
    run: async (c) => {
      await c.say('GUARD: Hold on! The way east is closed until you earn the BOULDER BADGE.');
      await c.walkPlayer(['left']);
    },
  });
  W.add(br);
  W.add(havenInterior('brindle_haven', 'BRINDLE HAVEN', { map: 'brindle', x: brHaven.x, y: brHaven.y + 1 }, [{ id: 'hk1', x: 7, y: 5, dir: 'left', look: 'hiker', talk: 'I heal up here before every expedition. Never leave home with a tired team!' }]));
  W.add(martInterior('brindle_mart', 'BRINDLE MARKET', { map: 'brindle', x: brMart.x, y: brMart.y + 1 }, ['pod', 'potion', 'antidote', 'unnumb', 'wakebell', 'escaperope', 'repel']));
  W.add(
    makeMap({
      id: 'brindle_museum',
      name: 'BRINDLE MUSEUM',
      legend: IN,
      border: 'void',
      music: 'haven',
      outdoor: false,
      rows: ['WWnWWWWnWW', '=o==LL==o=', '==========', '==tt==tt==', '==========', 'p========p', '==========', '====mm===='],
      warps: matWarps(4, 7, { map: 'brindle', x: brMuseum.x, y: brMuseum.y + 1 }),
      signs: [
        { x: 1, y: 1, text: 'A statue of an ancient winged Wildkin, carved from local granite.' },
        { x: 8, y: 1, text: 'A statue of a coiled shell Wildkin. Fossils like it are found in WHISPER CAVE.' },
        { x: 4, y: 1, text: 'A machine that scans fossils. Its screen reads: REVIVAL POSSIBLE AT CINDERMOOR LAB.' },
        { x: 5, y: 1, text: 'A machine that measures the age of stones.' },
        { x: 2, y: 3, text: 'A SPIRAL FOSSIL. Its shell coils like a snail.' },
        { x: 3, y: 3, text: 'A SHELL FOSSIL. Two sickle claws poke out of the rock.' },
        { x: 6, y: 3, text: 'Ancient CAPTURE PODS made of carved stone.' },
        { x: 7, y: 3, text: 'A chunk of amber. Something with wings is trapped inside.' },
      ],
      npcs: [
        {
          id: 'curator',
          x: 7,
          y: 5,
          dir: 'left',
          look: 'scholar',
          talk: giver(
            'gotAmber',
            'amber',
            1,
            'CURATOR: You have the eyes of an explorer. This OLD AMBER is a spare. The lab in CINDERMOOR can bring what is inside back to life!',
            'CURATOR: The CINDERMOOR LAB is on an island to the far south. You will need a way across the sea.',
            (s) => s.badges.length >= 1,
            'CURATOR: Welcome! Our fossils come from WHISPER CAVE, east of town. Come back after you earn the BOULDER BADGE.',
          ),
        },
      ],
    }),
  );
  W.add(
    gymInterior(
      'brindle_gym',
      'BRINDLE GYM',
      'q',
      { map: 'brindle', x: brGym.x, y: brGym.y + 1 },
      [
        {
          id: 'garrick',
          x: 4,
          y: 2,
          dir: 'down',
          look: 'garrick',
          trainer: T('g1', 'LEADER', 'GARRICK', [['Pebbit', 12], ['Armadil', 14]], {
            look: 'garrick',
            money: 99,
            smart: true,
            music: 'boss',
            intro: "So you've come. I'm GARRICK, leader of BRINDLE GYM. My Wildkin are as solid as the mountain. Can you crack them?",
            lose: 'I took you for a pebble, but you are a landslide. The BOULDER BADGE is yours.',
            after: '',
          }),
          sight: 0,
          afterWin: leaderAfter('BOULDER', ['tm03', 1], [
            'GARRICK: Take this too. It teaches MUD VOLLEY, an EARTH move that slows the foe down.',
            'GARRICK: With the BOULDER BADGE, the guard will let you head east to WHISPER CAVE. Stay sharp in there.',
          ]),
          talk: 'GARRICK: A trainer must be like stone: steady, patient, and impossible to push around.',
        },
        { id: 'gt1', x: 1, y: 6, dir: 'right', look: 'hiker', trainer: T('g1_bo', 'HIKER', 'BO', [['Pebbit', 9], ['Dunemole', 9]]), sight: 4 },
        { id: 'gt2', x: 8, y: 9, dir: 'left', look: 'boy', trainer: T('g1_tad', 'CAMPER', 'TAD', [['Clodcalf', 10]]), sight: 4 },
        { id: 'guide1', x: 7, y: 12, dir: 'left', look: 'boy', talk: "Yo, future champ! GARRICK's STONE Wildkin crumble against TIDE, LEAF, BRAWL and EARTH moves!" },
      ],
      'BRINDLE GYM   LEADER: GARRICK   Certified trainers: who have cracked the rock.',
      0,
    ),
  );

  W.link('hearthvale', 'up', 'route1');
  W.link('route1', 'up', 'woods');
  W.link('woods', 'up', 'route2');
  W.link('route2', 'up', 'brindle');
}

export { intro };
