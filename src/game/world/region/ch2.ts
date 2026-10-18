/**
 * Chapter 2: ROUTE 3, WHISPER CAVE, ROUTE 4, RIVERTON CITY, LANTERN BRIDGE (R5) and DRIFTWOOD CAPE (R6).
 */
import { T } from '../../data/trainers';
import { building, CAVE, door, gymInterior, havenInterior, houseInterior, makeMap, martInterior, OUT, type World } from '../build';
import { enc, giver, intro, leaderAfter, not } from '../common';
import type { Script } from '../types';

const fossil = (id: string, item: string, other: string, name: string): Script => async (c) => {
  if (!c.flag('caveCleared')) {
    await c.say('SABLE: Hands off! These fossils belong to the HOLLOW ORDER!');
    return;
  }
  if (!(await c.yesNo(`It's a ${name}. Take it?`))) return;
  c.set('item:' + id);
  c.set('item:' + other);
  c.set('fossilChoice:' + item);
  await c.give(item);
  await c.say('The other fossil crumbled back into the rock... Maybe more are buried somewhere far away.');
};

export function build(W: World) {
  // ======================= ROUTE 3 =======================
  W.add(
    makeMap({
      id: 'route3',
      name: 'ROUTE 3',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Pecklet 6-8 30, Nibbit 6-8 20, Coilkit 6-9 20, Thistlet 6-9 20, Hummaloon 5-7 10'),
      rows: [
        'TTTTTTTTTTTTTTTTTTTTTTMMMMMMMM',
        'TT,,,,,.....,,,,,.....MMMMMMMM',
        'TT,,,,,.....,,,,,.....MMMMCMMM',
        'TT.........TTT........::::::MM',
        'TT..TTT....TTT....,,,,..:...MM',
        'TT.....______.....,,,,..:...MM',
        '::::::::::::::::::::::::::..MM',
        '::::::::::::::::::::::::....MM',
        'TT....,,,,,,.....TTTT.......MM',
        'TT....,,,,,,.....TTTT..,,,,.MM',
        'TT.........S...........,,,,.MM',
        'TT..f.....TTTT.............MMM',
        'TT........TTTT....f.....MMMMMM',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      ],
      warps: [door(26, 2, 'cave1', 1, 15, 'up')],
      signs: [{ x: 11, y: 10, text: 'ROUTE 3   East: WHISPER CAVE   West: BRINDLE TOWN' }],
      items: [
        { id: 'r3potion', x: 2, y: 1, item: 'potion', n: 2 },
        { id: 'r3repel', x: 26, y: 9, item: 'repel' },
      ],
      npcs: [
        { id: 'y1', x: 8, y: 3, dir: 'down', look: 'youngster', trainer: T('r3_ben', 'YOUNGSTER', 'BEN', [['Nibbit', 9], ['Coilkit', 9]]), sight: 3 },
        { id: 'l1', x: 15, y: 8, dir: 'down', look: 'lass', trainer: T('r3_jo', 'LASS', 'JO', [['Fluffin', 9], ['Fluffin', 9], ['Thistlet', 9]]), sight: 3 },
        { id: 'b1', x: 20, y: 4, dir: 'left', look: 'boy', trainer: T('r3_kel', 'BUG FAN', 'KEL', [['Larvule', 9], ['Cocoonix', 9], ['Thornet', 10]]), sight: 3 },
        { id: 'y2', x: 22, y: 10, dir: 'left', look: 'youngster', trainer: T('r3_rob', 'YOUNGSTER', 'ROB', [['Pecklet', 10], ['Thistlet', 10]]), sight: 4 },
        { id: 'l2', x: 5, y: 9, dir: 'right', look: 'lass', trainer: T('r3_amy', 'LASS', 'AMY', [['Hummaloon', 11]]), sight: 3 },
        { id: 'helper', x: 24, y: 5, dir: 'left', look: 'hiker', move: 'look', talk: 'WHISPER CAVE is full of fossils. Lately the HOLLOW ORDER has been digging them up. Creeps!' },
      ],
    }),
  );

  // ======================= WHISPER CAVE =======================
  W.add(
    makeMap({
      id: 'cave1',
      name: 'WHISPER CAVE',
      legend: CAVE,
      border: 'cavewall',
      music: 'cave',
      outdoor: false,
      escape: true,
      encounters: enc(0.07, 'Duskbat 8-11 40, Pebbit 8-11 35, Sporekin 9-10 12, Puffmote 9-10 8, Dunemole 9-11 5'),
      rows: [
        'wwwwwwwwwwwwwwwwwwwwwwww',
        'wgggggggggwwwwwwwwwwwwww',
        'wgRggggggggggggwwwgggggw',
        'wgggwwwwwgggRggwwwggggew',
        'wgggwgggwggggggwwwgggggw',
        'wgggwg*gwgggwwwwwwwwRggw',
        'wggggggggggwwwwwwwggggww',
        'wwwwgggRgggwwwwwwwggghww',
        'wggggggggggggwwwwwwwwwww',
        'wgRgggwwwwggggggggggggww',
        'wgggggwwwwgggggRggggggww',
        'wggggggggggggwwwwggggggw',
        'wwwgggggwwwggwwwwggg*ggw',
        'wggggRgggggggggggggggggw',
        'wggggggggwwwwwggggggRggw',
        'wgggggggggggggggghgggggw',
        'weggggggggggggggggggggww',
        'wwwwwwwwwwwwwwwwwwwwwwww',
      ],
      warps: [door(1, 16, 'route3', 26, 3, 'down'), door(17, 15, 'caveb1', 2, 13, 'up'), door(21, 7, 'caveb1', 17, 2, 'down'), door(22, 3, 'route4', 2, 4, 'down')],
      items: [
        { id: 'cvsuper', x: 1, y: 2, item: 'superpotion' },
        { id: 'cvrope', x: 5, y: 4, item: 'escaperope' },
        { id: 'cvcandy', x: 22, y: 13, item: 'candy' },
        { id: 'cvtm', x: 19, y: 2, item: 'tm09' },
      ],
      signs: [
        { x: 6, y: 5, text: 'A cluster of GLOW CRYSTALS. Someone has chipped pieces away.' },
        { x: 20, y: 12, text: 'A cluster of GLOW CRYSTALS. They pulse with a faint warmth.' },
      ],
      npcs: [
        { id: 'h1', x: 12, y: 13, dir: 'left', look: 'hiker', trainer: T('cv_dex', 'HIKER', 'DEX', [['Pebbit', 10], ['Pebbit', 10], ['Dunemole', 11]]), sight: 3 },
        { id: 's1', x: 11, y: 9, dir: 'down', look: 'scholar', trainer: T('cv_lu', 'SCHOLAR', 'LU', [['Duskbat', 11], ['Puffmote', 11]]), sight: 3 },
        { id: 'g1', x: 3, y: 11, dir: 'right', look: 'grunt', trainer: T('cv_gr1', 'HOLLOW', 'GRUNT', [['Duskbat', 11], ['Coilkit', 11]]), sight: 4 },
      ],
    }),
  );
  W.add(
    makeMap({
      id: 'caveb1',
      name: 'WHISPER CAVE B1',
      legend: CAVE,
      border: 'cavewall',
      music: 'cave',
      outdoor: false,
      escape: true,
      encounters: enc(0.07, 'Duskbat 9-12 35, Pebbit 9-12 30, Sporekin 10-12 15, Puffmote 10-12 10, Fossipup 10-12 10'),
      rows: [
        'wwwwwwwwwwwwwwwwwwww',
        'wggggggwwwwwwgggggww',
        'wgg*ggggggggggggguww',
        'wggggggwwwwwwggggggw',
        'wwwgggwwwwwwwwwgggww',
        'wgggggggRggggwwgggww',
        'wggRgggggggggggggggw',
        'wgggwwwwwgggggwwwggw',
        'wgggw***wgggRgw*wggw',
        'wggggggggggggggggggw',
        'wwwwgggwwwwwwgggwwww',
        'wggggggggggggggggggw',
        'wggRggggwwggggRggggw',
        'wgugggggwwgggggggggw',
        'wggggggggggggggggggw',
        'wwwwwwwwwwwwwwwwwwww',
      ],
      warps: [door(2, 13, 'cave1', 17, 15, 'up'), door(17, 2, 'cave1', 21, 7, 'down')],
      items: [
        { id: 'fossilA', x: 9, y: 5, item: 'spiralfossil', script: fossil('fossilA', 'spiralfossil', 'fossilB', 'SPIRAL FOSSIL') },
        { id: 'fossilB', x: 11, y: 5, item: 'shellfossil', script: fossil('fossilB', 'shellfossil', 'fossilA', 'SHELL FOSSIL') },
        { id: 'cbdusk', x: 1, y: 1, item: 'dusk' },
        { id: 'cbpods', x: 18, y: 13, item: 'pod', n: 3 },
        { id: 'cbether', x: 18, y: 7, item: 'ether' },
      ],
      npcs: [
        { id: 'g2', x: 6, y: 11, dir: 'right', look: 'grunt', trainer: T('cv_gr2', 'HOLLOW', 'GRUNT', [['Nibbit', 11], ['Duskbat', 12]]), sight: 4 },
        { id: 'g3', x: 13, y: 9, dir: 'left', look: 'grunt', trainer: T('cv_gr3', 'HOLLOW', 'GRUNT', [['Coilkit', 12], ['Thistlet', 12]]), sight: 4 },
        {
          id: 'sable',
          x: 10,
          y: 6,
          dir: 'down',
          look: 'sable',
          trainer: T('cv_sable', 'ADMIN', 'SABLE', [['Duskbat', 12], ['Coilkit', 13], ['Wispet', 14]], {
            look: 'sable',
            money: 50,
            smart: true,
            music: 'boss',
            intro: "A child, wandering into the HOLLOW ORDER's dig? How tiresome. Those GLOW CRYSTALS are ours, and so are the fossils.",
            lose: 'Hmph. Enough. We have the crystals we came for.',
            after: '',
          }),
          sight: 3,
          cond: not('caveCleared'),
          afterWin: async (c) => {
            await c.say([
              'SABLE: The crystals are only the first key. When the RIFT opens, the HOLLOW ORDER will hold the oldest power in VARROW.',
              'SABLE: Take a fossil if you like, child. Consider it a souvenir of your last adventure. Farewell.',
            ]);
            await c.flash();
            c.hide('sable');
            c.set('caveCleared');
            await c.say('SABLE vanished in a puff of smoke!');
          },
        },
      ],
    }),
  );

  // ======================= ROUTE 4 =======================
  W.add(
    makeMap({
      id: 'route4',
      name: 'ROUTE 4',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Pecklet 9-12 30, Coilkit 9-12 25, Nibbit 9-12 20, Thistlet 10-12 15, Dunemole 10-12 10'),
      fish: enc(1, 'Mudgill 5-10 70, Pondlet 8-12 30'),
      rows: [
        'TTTTTTTTTTTTTTTTTTTTTTTT',
        'MMMMT,,,,,......,,,,,TTT',
        'MMMMT,,,,,......,,,,,.TT',
        'MMCM..........___.....TT',
        'MM:::::::::::......:::::',
        'MM.........::......:::::',
        'TT.,,,,....::...f.....TT',
        'TT.,,,,..S.::.........TT',
        'TT_______..::.._______TT',
        'TT.........::.........TT',
        'TT..,,,,,..::..,,,,,..TT',
        'TT..,,,,,..::..,,,,,..TT',
        'TT.........::.......~~TT',
        'TTTTTTTTTTTTTTTTTTTTTTTT',
      ],
      warps: [door(2, 3, 'cave1', 21, 3, 'left')],
      signs: [{ x: 9, y: 7, text: 'ROUTE 4   East: RIVERTON CITY   West: WHISPER CAVE' }],
      items: [{ id: 'r4tm', x: 21, y: 2, item: 'tm06' }],
      npcs: [
        { id: 'l1', x: 14, y: 6, dir: 'left', look: 'lass', trainer: T('r4_mei', 'LASS', 'MEI', [['Thistlet', 12], ['Coilkit', 12]]), sight: 3 },
        { id: 'c1', x: 6, y: 9, dir: 'right', look: 'boy', trainer: T('r4_nat', 'CAMPER', 'NAT', [['Dunemole', 12], ['Nibbit', 13]]), sight: 4 },
      ],
    }),
  );

  // ======================= RIVERTON CITY =======================
  const rv = makeMap({
    id: 'riverton',
    name: 'RIVERTON CITY',
    legend: OUT,
    border: 'tree',
    music: 'town',
    outdoor: true,
    fly: { x: 8, y: 17 },
    fish: enc(1, 'Mudgill 5-15 60, Pondlet 10-15 25, Finnet 10-15 15'),
    rows: [
      'TTTTTTTTTTTT::TTTTTTTTTTTT',
      'TT..........::..........TT',
      'TT..........::..........TT',
      'TT..........::..........TT',
      'TT..........::..........TT',
      'TT.........S::..........TT',
      'TT..::::::::::::::::::..TT',
      'TT..:.....S.::.......:..TT',
      'TT..:.......::.......:..TT',
      '::::::.....~~~~.....::::B:',
      '::::::.....~~~~.....::::B:',
      'TT..:......~~~~......:..TT',
      'TT..:......~~~~......:..TT',
      'TT..:................:..TT',
      'TT..:................:..TT',
      'TT..:................:..TT',
      'TT..:................:..TT',
      'TT..::::::::::::::::::..TT',
      'TT.f........::.......f..TT',
      'TT..L.......::.......L..TT',
      'TT..........::..........TT',
      'TTTTTTTTTTTT::TTTTTTTTTTTT',
    ],
    signs: [
      { x: 10, y: 7, text: 'RIVERTON CITY: Where four roads meet the river.' },
      { x: 11, y: 5, text: 'RIVERTON GYM   LEADER: NERISSA   The tide that turns every battle!' },
    ],
    npcs: [
      { id: 'kid', x: 13, y: 14, dir: 'down', look: 'girl', move: 'wander', talk: "NERISSA's TIDE Wildkin hate VOLT and LEAF moves. FLAME moves just fizzle on them." },
      { id: 'cop', x: 22, y: 12, dir: 'up', look: 'guard', move: 'look', talk: 'Someone planted a hedge across the east road. You would need HEDGE SHEARS to get through.' },
      { id: 'sailor', x: 6, y: 18, dir: 'right', look: 'sailor', move: 'look', talk: 'The STARLIGHT FERRY docks at VOLTHAVEN, south of here. You need a ticket, though.' },
      { id: 'old', x: 8, y: 8, dir: 'down', look: 'oldman', move: 'wander', talk: 'North across LANTERN BRIDGE lives LORNE, a researcher of sea Wildkin. Odd fellow, but kind.' },
    ],
  });
  const rvGym = building(rv, 5, 1, 7, 'blue', 'gym');
  const rvHouse = building(rv, 15, 1, 5, 'green', 'house');
  const rvHouse2 = building(rv, 15, 7, 5, 'gold', 'house');
  const rvHaven = building(rv, 6, 13, 5, 'red', 'haven');
  const rvMart = building(rv, 16, 13, 4, 'blue', 'mart');
  rv.warps.push(
    door(rvGym.x, rvGym.y, 'riverton_gym', 4, 13),
    door(rvHouse.x, rvHouse.y, 'riverton_fisher', 3, 7),
    door(rvHouse2.x, rvHouse2.y, 'riverton_house', 3, 7),
    door(rvHaven.x, rvHaven.y, 'riverton_haven', 4, 7),
    door(rvMart.x, rvMart.y, 'riverton_mart', 3, 7),
  );
  W.add(rv);
  W.add(havenInterior('riverton_haven', 'RIVERTON HAVEN', { map: 'riverton', x: rvHaven.x, y: rvHaven.y + 1 }, [{ id: 'h1', x: 7, y: 5, dir: 'left', look: 'lass', talk: 'Your WILDEX can tell you a Wildkin\'s types. Check them before every gym battle!' }]));
  W.add(martInterior('riverton_mart', 'RIVERTON MARKET', { map: 'riverton', x: rvMart.x, y: rvMart.y + 1 }, ['pod', 'greatpod', 'potion', 'superpotion', 'antidote', 'burnsalve', 'unnumb', 'wakebell', 'escaperope', 'repel']));
  W.add(
    houseInterior('riverton_fisher', "FISHER'S HOUSE", { map: 'riverton', x: rvHouse.x, y: rvHouse.y + 1 }, [
      {
        id: 'fisher',
        x: 5,
        y: 4,
        dir: 'down',
        look: 'fisher',
        talk: giver(
          'gotRod',
          'rod',
          1,
          ['FISHING GURU: Ah, a fellow fan of the water! Do you like to fish?', 'FISHING GURU: Take this FISHING ROD. Face any water and use it from your BAG!'],
          'FISHING GURU: Different waters hide different Wildkin. The sea is full of surprises!',
        ),
      },
    ]),
  );
  W.add(
    houseInterior(
      'riverton_house',
      'HOUSE',
      { map: 'riverton', x: rvHouse2.x, y: rvHouse2.y + 1 },
      [
        { id: 'mom', x: 2, y: 3, dir: 'right', look: 'mom', talk: 'My son wants to be a gym leader someday. He practices on the bridge every evening.' },
        { id: 'kid', x: 5, y: 4, dir: 'left', look: 'youngster', talk: 'Did you know some Wildkin can only learn moves from TMs? You can buy them in BLOOMFIELD!' },
      ],
      1,
    ),
  );
  W.add(
    gymInterior(
      'riverton_gym',
      'RIVERTON GYM',
      'a',
      { map: 'riverton', x: rvGym.x, y: rvGym.y + 1 },
      [
        {
          id: 'nerissa',
          x: 4,
          y: 2,
          dir: 'down',
          look: 'nerissa',
          trainer: T('g2', 'LEADER', 'NERISSA', [['Seasprig', 18], ['Clamlet', 18], ['Croakard', 21]], {
            look: 'nerissa',
            money: 99,
            smart: true,
            music: 'boss',
            intro: "Welcome to RIVERTON GYM! I'm NERISSA. My Wildkin flow like the river: gentle, then all at once. Ready to get swept away?",
            lose: 'Wow, you held your ground against the current! Here, the RIPPLE BADGE.',
            after: '',
          }),
          sight: 0,
          afterWin: leaderAfter('RIPPLE', ['tm11', 1], ['NERISSA: Take RIPTIDE too. A crashing wave for any Wildkin that loves the water.', 'NERISSA: Head north over LANTERN BRIDGE to meet LORNE, or south to the port of VOLTHAVEN.']),
          talk: 'NERISSA: Rivers always find a way around rocks. Keep flowing, {PLAYER}!',
        },
        { id: 'gt1', x: 1, y: 6, dir: 'right', look: 'swimmer', trainer: T('g2_lia', 'SWIMMER', 'LIA', [['Pondlet', 16], ['Jellune', 16]]), sight: 4 },
        { id: 'gt2', x: 8, y: 10, dir: 'left', look: 'fisher', trainer: T('g2_ike', 'FISHER', 'IKE', [['Finnet', 17], ['Mudgill', 15], ['Mudgill', 15]]), sight: 4 },
        { id: 'guide', x: 7, y: 12, dir: 'left', look: 'boy', talk: "NERISSA's TIDE team fears VOLT and LEAF moves. If you picked SPROUTLE, today is your day!" },
      ],
      'RIVERTON GYM   LEADER: NERISSA   The tide that turns every battle!',
      1,
    ),
  );

  // ======================= ROUTE 5: LANTERN BRIDGE =======================
  W.add(
    makeMap({
      id: 'route5',
      name: 'LANTERN BRIDGE',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Budling 12-14 30, Vinelet 12-14 30, Fluffin 12-14 20, Psyquill 10-12 10, Pecklet 12-13 10'),
      surf: enc(0.08, 'Pondlet 15-20 50, Quackle 15-20 40, Jellune 15-20 10'),
      fish: enc(1, 'Mudgill 5-15 50, Pondlet 12-16 30, Quackle 12-16 20'),
      rows: [
        'TTTTTTTTT..TTTTTTTTT',
        'TT..,,,..::..,,,..TT',
        'TT..,,,..::..,,,..TT',
        'TT........:.......TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT~~~~~~~bb~~~~~~~TT',
        'TT.......::.......TT',
        'TT..f....::....f..TT',
        'TT.......::...S...TT',
        'TT.......::.......TT',
        'TTTTTTTTT..TTTTTTTTT',
      ],
      signs: [{ x: 14, y: 20, text: 'LANTERN BRIDGE   Five trainers guard it. Beat them all for a prize!' }],
      npcs: [
        { id: 'rival', x: 9, y: 17, dir: 'down', look: 'rival', cond: () => false },
        { id: 't1', x: 9, y: 16, dir: 'right', look: 'boy', trainer: T('r5_t1', 'CAMPER', 'LEN', [['Budling', 14], ['Vinelet', 14]]), sight: 1 },
        { id: 't2', x: 9, y: 13, dir: 'right', look: 'lass', trainer: T('r5_t2', 'LASS', 'NOOR', [['Pursy', 15], ['Fluffin', 14]]), sight: 2 },
        { id: 't3', x: 9, y: 10, dir: 'right', look: 'youngster', trainer: T('r5_t3', 'YOUNGSTER', 'TIM', [['Coilkit', 14], ['Thistlet', 15]]), sight: 2 },
        { id: 't4', x: 9, y: 7, dir: 'right', look: 'lass', trainer: T('r5_t4', 'LASS', 'PEG', [['Budling', 15], ['Pondlet', 15]]), sight: 2 },
        { id: 't5', x: 9, y: 4, dir: 'right', look: 'boy', trainer: T('r5_t5', 'CAMPER', 'GUS', [['Dunemole', 16]]), sight: 2 },
        {
          id: 'recruiter',
          x: 10,
          y: 2,
          dir: 'down',
          look: 'grunt',
          trainer: T('r5_grunt', 'HOLLOW', 'RECRUITER', [['Coilkit', 15], ['Duskbat', 16]], {
            intro: 'Five wins in a row! Impressive. Here is your prize... and an offer. Join the HOLLOW ORDER! No? Then I will take you by force!',
            lose: 'Argh! You really are strong. Fine, keep your prize!',
            after: 'Recruiting is harder than it looks.',
          }),
          sight: 2,
          afterWin: async (c) => {
            await c.say('RECRUITER: Here, the bridge prize. Do not tell my boss I gave it away.');
            await c.give('candy');
          },
        },
      ],
      triggers: [
        {
          x: 9,
          y: 19,
          w: 2,
          cond: (s) => !s.flags['tr:rival3'],
          run: async (c) => {
            c.show('rival', c.s.x, 18, 'down');
            await c.emote('rival');
            c.facePlayer('up');
            await c.say(intro('rival3'));
            const won = await c.battle('rival3');
            if (!won) return;
            await c.say(["{RIVAL}: I heard LORNE across the bridge has a FERRY TICKET he doesn't need. I'm getting on that boat first!", 'Smell ya later!']);
            await c.walkNpc('rival', c.s.x === 9 ? ['left', 'left', 'left'] : ['right', 'right', 'right'], 2);
            c.hide('rival');
          },
        },
      ],
    }),
  );

  // ======================= ROUTE 6: DRIFTWOOD CAPE =======================
  const r6 = makeMap({
    id: 'route6',
    name: 'DRIFTWOOD CAPE',
    legend: OUT,
    border: 'tree',
    music: 'route',
    outdoor: true,
    encounters: enc(0.1, 'Budling 13-16 30, Vinelet 13-16 30, Fluffin 13-16 20, Psyquill 12-14 10, Pursy 13-15 10'),
    surf: enc(0.08, 'Jellune 15-25 60, Drowsel 15-22 25, Quackle 18-24 15'),
    fish: enc(1, 'Mudgill 10-20 30, Finnet 12-20 30, Starlet 12-20 20, Seasprig 12-20 20'),
    rows: [
      'TTTTTTTTTTTTTTTTTTTT~~~~~~~~TT',
      'TT,,,,,,..,,,,.....s~~~~~~~~TT',
      'TT,,,,,,..,,,,.....ss~~~~~~~TT',
      'TT................sss~~~~~~~TT',
      'TT..TT....TT.......ssss~~~~~TT',
      'TT..TT....TT.........sss~~~~TT',
      'TT.......::::::::::::::..s~~TT',
      'TT.......::.,,,,..........s~TT',
      'TT.......::.,,,,..........sTTT',
      'TT..,,,..::...............TTTT',
      'TT..,,,..::...............TTTT',
      'TT.......::...............TTTT',
      'TT.......::::::::::::.....TTTT',
      'TTTTTTTTT..TTTTTTTTTTTTTTTTTTT',
    ],
    items: [{ id: 'r6tm', x: 2, y: 1, item: 'tm10' }],
    npcs: [
      { id: 'p1', x: 6, y: 7, dir: 'right', look: 'girl', trainer: T('r6_ali', 'PICNICKER', 'ALI', [['Budling', 16], ['Fluffin', 16]]), sight: 3 },
      { id: 'c1', x: 14, y: 3, dir: 'down', look: 'boy', trainer: T('r6_ned', 'CAMPER', 'NED', [['Vinelet', 15], ['Pursy', 16]]), sight: 2 },
      { id: 'p2', x: 22, y: 7, dir: 'left', look: 'girl', trainer: T('r6_zoe', 'PICNICKER', 'ZOE', [['Psyquill', 14], ['Budling', 17]]), sight: 4 },
      {
        id: 'riftguard',
        x: 19,
        y: 2,
        dir: 'right',
        look: 'sailor',
        move: 'look',
        talk: async (c) =>
          c.say(c.flag('champion') ? 'The storms around the RIFT have calmed for you, CHAMPION. The way north across the water is open.' : 'The waters north of this cape lead to the RIFT. Strange storms circle it. Only the CHAMPION may sail beyond.'),
      },
    ],
    signs: [],
    triggers: [
      {
        x: 20,
        y: 1,
        w: 8,
        cond: (s) => !s.flags.champion,
        run: async (c) => {
          await c.say('A fierce storm churns the water ahead. It is far too rough to ride through!');
          await c.walkPlayer(['down']);
        },
      },
    ],
  });
  const cottage = building(r6, 17, 8, 5, 'teal', 'house');
  r6.warps.push(door(cottage.x, cottage.y, 'cottage', 3, 7));
  W.add(r6);
  W.add(
    houseInterior(
      'cottage',
      "LORNE'S COTTAGE",
      { map: 'route6', x: cottage.x, y: cottage.y + 1 },
      [
        {
          id: 'lorne',
          x: 5,
          y: 3,
          dir: 'down',
          look: 'scholar',
          talk: giver(
            'gotTicket',
            'ferryticket',
            1,
            [
              'LORNE: Oh! A visitor! Sorry about the mess. I study the Wildkin of the open sea.',
              'LORNE: The STARLIGHT FERRY sent me a ticket for its trainer cruise, but I get seasick just looking at boats.',
              'LORNE: Would you go in my place? The captain is an old friend. Tell him LORNE says hello!',
            ],
            'LORNE: The ferry docks at VOLTHAVEN, south of RIVERTON. Bring me stories of the sea!',
          ),
        },
      ],
      2,
      [
        { x: 0, y: 1, text: 'Charts of ocean currents, scribbled with notes about a storm called the RIFT.' },
        { x: 3, y: 1, text: 'A TV playing a documentary about deep-sea Wildkin.' },
      ],
    ),
  );

  W.link('route3', 'left', 'brindle');
  W.link('route4', 'right', 'riverton');
  W.link('riverton', 'up', 'route5');
  W.link('route5', 'up', 'route6');
}
