/**
 * Chapter 5: ROUTES 14-17, the SLEEPER, MIRECOAST and the WILDLANDS PARK.
 */
import { SP } from '../../data/species';
import { T } from '../../data/trainers';
import { building, door, gymInterior, havenInterior, houseInterior, IN, makeMap, martInterior, matWarps, OUT, type World } from '../build';
import { enc, giver, leaderAfter, not } from '../common';
import type { Script } from '../types';

const sleeper: Script = async (c) => {
  if (!c.s.bag.chime) {
    await c.say(['A huge SLEEPER is snoring in the middle of the path...', 'It will not budge. Maybe a loud, clear sound would wake it.']);
    return;
  }
  await c.say('{PLAYER} rang the DAWN CHIME! Its clear tone rings across the hills...');
  c.g.sfx('levelup');
  await c.wait(40);
  await c.emote(c.self?.def.id ?? 'sleeper');
  await c.say('The SLEEPER woke up! It looks grumpy!');
  const r = await c.wild(SP.SLUMBEAR, 30, { music: 'boss' });
  if (r === 'lose') return;
  c.set('slumbearDone');
  c.hide('sleeper');
  if (r === 'caught') {
    c.set('slumbearCaught');
    return;
  }
  // not caught: it settles down for another nap off the road, so it can't be missed for good
  c.set('slumbearRoams');
  await c.say('The SLEEPER lumbered off and flopped down for another nap in the corner of the meadow.');
};

const sleeperAgain: Script = async (c) => {
  await c.say('The SLEEPER is dozing in the corner again. It opens one eye, annoyed!');
  const r = await c.wild(SP.SLUMBEAR, 30, { music: 'boss' });
  if (r === 'lose') return;
  c.hide('sleeper2');
  if (r === 'caught') {
    c.set('slumbearCaught');
    return;
  }
  await c.say('The SLEEPER wandered off. It will be back for a nap later.');
};

export function build(W: World) {
  // ======================= ROUTE 14 =======================
  W.add(
    makeMap({
      id: 'route14',
      name: 'ROUTE 14',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Budling 24-28 20, Vinelet 24-28 20, Skyroost 25-28 15, Dashbird 24-27 15, Emberfen 24-27 10, Pursy 24-27 10, Embercolt 25-28 10'),
      rows: [
        'TTTTTTTTT..TTTTTTTTT',
        'TT.......::.......TT',
        'TTTTTTTTT:TTTTTTTTTT',
        'TTTTTTTTT:TTTTTTTTTT',
        'TT.......::.......TT',
        'TT.,,,,..::..,,,,.TT',
        'TT.,,,,..::..,,,,.TT',
        'TT.......::.......TT',
        'TT..TT...::...TT..TT',
        'TT..TT...::...TT..TT',
        'TT.......::...S...TT',
        'TT,,,,...::...,,,,TT',
        'TT,,,,...::...,,,,TT',
        'TT.......::.......TT',
        'TT___....::....___TT',
        'TT.......::.......TT',
        'TT..,,,,.::.,,,,..TT',
        'TT..,,,,.::.,,,,..TT',
        'TT.......::.......TT',
        'TTTT.....::.....TTTT',
        'TT.......::.......TT',
        'TT.,,,...::...,,,.TT',
        'TT.,,,...::...,,,.TT',
        'TT.......::.......TT',
        'TT..f....::....f..TT',
        'TT.......::.......TT',
        '::::::::::::......TT',
        '::::::::::::......TT',
        'TT................TT',
        'TTTTTTTTTTTTTTTTTTTT',
      ],
      signs: [{ x: 14, y: 10, text: 'ROUTE 14   North: BELLMOOR   South-west: the coast road to MIRECOAST' }],
      items: [{ id: 'r14tm', x: 17, y: 28, item: 'tm08' }],
      npcs: [
        { id: 'sleeper', x: 9, y: 3, dir: 'down', look: 'sleeper', cond: not('slumbearDone'), talk: sleeper },
        { id: 'sleeper2', x: 17, y: 4, dir: 'down', look: 'sleeper', cond: (s) => !!s.flags.slumbearRoams && !s.flags.slumbearCaught, talk: sleeperAgain },
        { id: 't1', x: 6, y: 7, dir: 'right', look: 'birdkeeper', trainer: T('r14_pip', 'BIRDKEEPER', 'PIPER', [['Skyroost', 28], ['Dashbird', 28]]), sight: 3 },
        { id: 't2', x: 13, y: 13, dir: 'left', look: 'beauty', trainer: T('r14_sky', 'BEAUTY', 'SKYE', [['Emberfen', 28], ['Lunapuff', 29]]), sight: 4 },
        { id: 't3', x: 5, y: 20, dir: 'right', look: 'tamer', trainer: T('r14_ock', 'TAMER', 'OCKER', [['Embercolt', 29], ['Rhinoxen', 29]]), sight: 4 },
        { id: 't4', x: 14, y: 23, dir: 'left', look: 'birdkeeper', trainer: T('r14_jon', 'BIRDKEEPER', 'JON', [['Lancebeak', 29], ['Pecklet', 27], ['Skyroost', 28]]), sight: 3 },
      ],
    }),
  );

  // ======================= ROUTE 15 =======================
  W.add(
    makeMap({
      id: 'route15',
      name: 'ROUTE 15',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Budling 25-29 20, Vinelet 25-29 20, Pyropup 25-28 15, Skyroost 26-29 15, Dashbird 25-28 15, Emberfen 25-28 15'),
      surf: enc(0.08, 'Jellune 25-32 80, Medusail 30-35 5, Sealpup 25-30 15'),
      fish: enc(1, 'Finnet 20-30 30, Seasprig 20-30 25, Pinchet 20-30 25, Starlet 20-30 20'),
      rows: [
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        'TT,,,,,,....,,,,,,....,,,,,,TT',
        'TT,,,,,,....,,,,,,....,,,,,,TT',
        'TT....TT......TT......TT....TT',
        'TT....TT......TT......TT....TT',
        '::::::::::::::::::::::::::::::',
        '::::::::::::::::::::::::::::::',
        'TT..........S.......,,,,....TT',
        'TT..,,,,,,..........,,,,....TT',
        'TT..,,,,,,.....TT...........TT',
        'TTssssss......TT......ssssssTT',
        'TT~~~~~~ssssssssssssss~~~~~~TT',
        'TT~~~~~~~~~~~~~~~~~~~~~~~~~~TT',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      ],
      signs: [{ x: 12, y: 7, text: 'ROUTE 15   The coast road. West: MIRECOAST   East: ROUTE 14' }],
      items: [{ id: 'r15a', x: 26, y: 9, item: 'ultrapod', n: 2 }],
      npcs: [
        { id: 't1', x: 9, y: 3, dir: 'down', look: 'girl', trainer: T('r15_ava', 'PICNICKER', 'AVA', [['Budling', 28], ['Wiltbloom', 29], ['Emberfen', 28]]), sight: 1 },
        { id: 't2', x: 18, y: 8, dir: 'left', look: 'boy', trainer: T('r15_lee', 'CAMPER', 'LEE', [['Pyropup', 29], ['Dashbird', 29]]), sight: 4 },
        { id: 't3', x: 25, y: 4, dir: 'down', look: 'beauty', trainer: T('r15_may', 'BEAUTY', 'MAY', [['Pursy', 29], ['Purrloft', 30]]), sight: 0 },
        { id: 't4', x: 5, y: 9, dir: 'right', look: 'birdkeeper', trainer: T('r15_kim', 'BIRDKEEPER', 'KIM', [['Skyroost', 30], ['Lancebeak', 30]]), sight: 3 },
      ],
    }),
  );

  // ======================= ROUTE 16 =======================
  W.add(
    makeMap({
      id: 'route16',
      name: 'ROUTE 16',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Pursy 26-30 20, Dashbird 26-30 20, Pyropup 26-29 15, Lancebeak 27-30 15, Embercolt 27-30 15, Venomaw 27-30 15'),
      rows: [
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        'TT..,,,,....TT....,,,,......TT',
        'TT..,,,,....TT....,,,,......TT',
        'TT..........TT..............TT',
        'TT....,,,,..........,,,,....TT',
        '::::::::::::::::::::::::::::::',
        '::::::::::::::::::::::::::::::',
        'TT....,,,,......S...,,,,....TT',
        'TT....,,,,..TT......,,,,....TT',
        'TT..........TT..............TT',
        'TT__________....____________TT',
        'TT..f.....................f.TT',
        'TT..........................TT',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      ],
      signs: [{ x: 16, y: 7, text: 'ROUTE 16   West: MIRECOAST, the town by the marsh' }],
      items: [{ id: 'r16a', x: 2, y: 12, item: 'tm25' }],
      npcs: [
        { id: 't1', x: 8, y: 3, dir: 'down', look: 'tamer', trainer: T('r16_rex', 'TAMER', 'REX', [['Venomaw', 30], ['Embercolt', 30]]), sight: 1 },
        { id: 't2', x: 22, y: 9, dir: 'left', look: 'racer', trainer: T('r16_zip', 'RACER', 'ZIP', [['Dashbird', 30], ['Galesprint', 31]]), sight: 4 },
        { id: 't3', x: 14, y: 11, dir: 'up', look: 'racer', trainer: T('r16_vex', 'RACER', 'VROOM', [['Smogpuff', 30], ['Oozle', 30], ['Smogpuff', 30]]), sight: 3 },
      ],
    }),
  );

  // ======================= ROUTE 17: WINDRUSH ROAD =======================
  W.add(
    makeMap({
      id: 'route17',
      name: 'WINDRUSH ROAD',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Pecklet 24-28 20, Lancebeak 26-30 15, Dashbird 25-29 20, Coilkit 24-28 15, Venomaw 27-30 10, Thistlet 25-28 10, Brambrisk 27-30 10'),
      rows: [
        'TTTTTTTTT..TTTTTTTTT',
        'TT.......::.....,.TT',
        'TT..,,,..::.....,.TT',
        'TT__________..___.TT',
        'TT.......::.......TT',
        'TT.,,,,..::..,,,,.TT',
        'TT.......::.......TT',
        'TT___.__________..TT',
        'TT.......::.......TT',
        'TT..TT...::...TT..TT',
        'TT..TT...::...TT..TT',
        'TT.......::...S..,TT',
        'TT__________.____.TT',
        'TT.......::.......TT',
        'TT.,,,...::...,,,.TT',
        'TT.,,,...::...,,,.TT',
        'TT.......::.......TT',
        'TT.___________...,TT',
        'TT.......::.......TT',
        'TTTT.....::.....TTTT',
        'TT.......::.......TT',
        'TT______.________.TT',
        'TT.......::.......TT',
        'TT..,,,,.::.,,,,..TT',
        'TT..,,,,.::.,,,,..TT',
        'TT.......::.......TT',
        'TT__________..___.TT',
        'TT.......::.......TT',
        'TT..TT...::...TT..TT',
        'TT..TT...::...TT..TT',
        'TT.......::.......TT',
        'TT___.__________..TT',
        'TT.......::.......TT',
        'TT.,,,,..::..,,,,.TT',
        'TT.,,,,..::..,,,,.TT',
        'TT.......::.......TT',
        'TT__________.____.TT',
        'TT.......::.......TT',
        'TT..f....::....f..TT',
        'TTTTTTTTT..TTTTTTTTT',
      ],
      signs: [{ x: 14, y: 11, text: 'WINDRUSH ROAD   All downhill to MIRECOAST. Hold B to run!' }],
      items: [
        { id: 'r17a', x: 2, y: 2, item: 'fullrestore' },
        { id: 'r17b', x: 17, y: 30, item: 'ether' },
      ],
      npcs: [
        { id: 't1', x: 6, y: 4, dir: 'right', look: 'racer', trainer: T('r17_ace', 'RACER', 'ACE', [['Dashbird', 28], ['Galesprint', 29]]), sight: 3 },
        { id: 't2', x: 13, y: 8, dir: 'left', look: 'racer', trainer: T('r17_jet', 'RACER', 'JET', [['Venomaw', 29], ['Coilkit', 28]]), sight: 3 },
        { id: 't3', x: 6, y: 16, dir: 'right', look: 'racer', trainer: T('r17_kix', 'RACER', 'KIX', [['Smogpuff', 29], ['Scrapape', 29], ['Furyape', 30]]), sight: 3 },
        { id: 't4', x: 13, y: 22, dir: 'left', look: 'racer', trainer: T('r17_ray', 'RACER', 'RAY', [['Lancebeak', 30]]), sight: 3 },
        { id: 't5', x: 6, y: 30, dir: 'right', look: 'racer', trainer: T('r17_ozz', 'RACER', 'OZZ', [['Venomaw', 29], ['Brambrisk', 30]]), sight: 3 },
        { id: 't6', x: 13, y: 35, dir: 'left', look: 'racer', trainer: T('r17_bo', 'RACER', 'BOLT', [['Galesprint', 30], ['Dashbird', 30]]), sight: 3 },
      ],
    }),
  );

  // ======================= MIRECOAST =======================
  const mc = makeMap({
    id: 'mirecoast',
    name: 'MIRECOAST',
    legend: OUT,
    border: 'tree',
    music: 'town',
    outdoor: true,
    fly: { x: 7, y: 11 },
    surf: enc(0.08, 'Jellune 25-35 85, Medusail 30-35 5, Sealpup 25-32 10'),
    fish: enc(1, 'Finnet 20-30 25, Seasprig 20-30 25, Pinchet 20-30 25, Clamlet 20-30 15, Starlet 20-30 10'),
    rows: [
      'TTTTTTTTTTTTT::TTTTTTTTTTTTT',
      'TT...........::...........TT',
      'TT...........::...........TT',
      'TT...........::...........TT',
      'TT...........::...........TT',
      'TT...........::...........TT',
      'TT..::::::::::::::::::::..TT',
      'TT..:........::........:..TT',
      'TT..:........::........:..TT',
      'TT..:........::........:..TT',
      'TT..:........::........:..TT',
      'TT..::::::::::::::::::::::::',
      'TT..::::::::::::::::::::::::',
      'TT..:........::........:..TT',
      'TT..:........::........:..TT',
      'TT..:........::........:..TT',
      'TT..:........::........:..TT',
      'TT..::::::::::::::::::::..TT',
      'TTssssssssssssssssssssssssTT',
      'TT~~~~~~~~~~dd~~~~~~~~~~~~TT',
      'TT~~~~~~~~~~dd~~~~~~~~~~~~TT',
      'TT~~~~~~~~~~~~~~~~~~~~~~~~TT',
      'TT~~~~~~~~~~~~~~~~~~~~~~~~TT',
      'TT~~~~~~~~~~~~~~~~~~~~~~~~TT',
    ],
    signs: [],
    npcs: [
      { id: 'c1', x: 22, y: 15, dir: 'down', look: 'girl', move: 'wander', talk: "SILAS of the GYM is a master of TOXIN Wildkin. EARTH and MIND moves are your best friends there." },
      { id: 'c2', x: 10, y: 18, dir: 'down', look: 'fisher', move: 'look', talk: 'Across the sea to the south lie the FROSTDEEP ISLES, and beyond them, CINDERMOOR. You need a way to cross water, though.' },
      { id: 'c3', x: 24, y: 5, dir: 'left', look: 'gentleman', move: 'look', talk: 'The WILDLANDS PARK is full of Wildkin found nowhere else. The far rest house hides a prize, they say.' },
    ],
  });
  const mcGym = building(mc, 5, 1, 7, 'purple', 'gym');
  const mcPark = building(mc, 16, 1, 7, 'green', 'hall');
  const mcHaven = building(mc, 5, 7, 5, 'red', 'haven');
  const mcMart = building(mc, 16, 7, 4, 'blue', 'mart');
  const mcWarden = building(mc, 5, 13, 5, 'gold', 'house');
  const mcHouse = building(mc, 16, 13, 5, 'teal', 'house');
  mc.warps.push(
    // the story's order: MIND (Astra) comes before VENOM, which keeps the level curve steady
    { ...door(mcGym.x, mcGym.y, 'mire_gym', 4, 13), cond: (s) => s.badges.length >= 5, locked: 'The GYM doors are sealed with vines. A sign reads: CHALLENGERS NEED FIVE BADGES. - SILAS' },
    door(mcPark.x, mcPark.y, 'park_gate', 4, 6),
    door(mcHaven.x, mcHaven.y, 'mire_haven', 4, 7),
    door(mcMart.x, mcMart.y, 'mire_mart', 3, 7),
    door(mcWarden.x, mcWarden.y, 'mire_warden', 3, 7),
    door(mcHouse.x, mcHouse.y, 'mire_house', 4, 7),
  );
  mc.signs.push({ x: 12, y: 5, text: 'MIRECOAST: Where the marsh meets the sea.' });
  W.add(mc);
  W.add(havenInterior('mire_haven', 'MIRECOAST HAVEN', { map: 'mirecoast', x: mcHaven.x, y: mcHaven.y + 1 }, [{ id: 'h1', x: 7, y: 5, dir: 'left', look: 'swimmer', talk: 'With a DRIFTBOARD you can ride across the sea. Wild Wildkin swim up to you out there!' }]));
  W.add(martInterior('mire_mart', 'MIRECOAST MARKET', { map: 'mirecoast', x: mcMart.x, y: mcMart.y + 1 }, ['greatpod', 'ultrapod', 'hyperpotion', 'superpotion', 'fullcure', 'revive', 'superrepel', 'maxrepel', 'escaperope']));
  W.add(
    houseInterior('mire_warden', "WARDEN'S HOUSE", { map: 'mirecoast', x: mcWarden.x, y: mcWarden.y + 1 }, [
      {
        id: 'warden',
        x: 5,
        y: 4,
        dir: 'down',
        look: 'oldman',
        talk: giver(
          'gotPick',
          'pick',
          1,
          ['WARDEN: The VENOM BADGE! SILAS does not hand those out lightly.', 'WARDEN: I used this ROCK PICK to clear trails in the park for forty years. Cracked boulders crumble at a single tap. Take it!'],
          'WARDEN: Cracked boulders block old tunnels all over VARROW. That pick will open them up.',
          (s) => s.badges.includes('VENOM'),
          'WARDEN: I keep the WILDLANDS PARK. If you beat SILAS at the GYM, come see me. I might have something for you.',
        ),
      },
    ]),
  );
  W.add(
    houseInterior(
      'mire_house',
      'HOUSE',
      { map: 'mirecoast', x: mcHouse.x, y: mcHouse.y + 1 },
      [
        {
          id: 'girl',
          x: 5,
          y: 4,
          dir: 'down',
          look: 'swimmer',
          talk: giver('mireTM', 'tm26', 1, 'I trained my Lancebeak by diving off the cliffs! Here, take this TM. DRILL BEAK hits like a hammer.', 'GALE moves crush LEAF, BRAWL and SWARM types.'),
        },
      ],
      2,
    ),
  );
  W.add(
    makeMap({
      id: 'park_gate',
      name: 'WILDLANDS GATE',
      legend: IN,
      border: 'void',
      music: 'haven',
      outdoor: false,
      rows: ['WWWWzzWWWW', '==========', '==cccccc==', '==========', 'p========p', '==========', '====mm===='],
      warps: [...matWarps(4, 6, { map: 'mirecoast', x: mcPark.x, y: mcPark.y + 1 }), door(4, 0, 'park_e', 10, 22, 'up'), door(5, 0, 'park_e', 11, 22, 'up')],
      npcs: [{ id: 'att', x: 4, y: 1, dir: 'down', look: 'clerk', talk: 'Welcome to the WILDLANDS PARK! Wildkin here roam free. Catch all you like, and please do not feed the PINCERBEETS.' }],
    }),
  );
  const parkEnc = enc(0.1, 'Clodcalf 26-30 15, Pouchroo 27-31 10, Wildbull 28-32 10, Dashbird 26-30 10, Nutlet 26-30 10, Rhinoxen 30-32 8, Sporekin 26-30 10, Fungrave 30-32 6, Scythid 30-32 5, Pincerbeet 30-32 5, Mendlamb 28-30 3, Kitmote 25-27 3, Armadil 28-31 5');
  const park_e = makeMap({
    id: 'park_e',
    name: 'WILDLANDS PARK',
    legend: OUT,
    border: 'tree',
    music: 'route',
    outdoor: true,
    encounters: parkEnc,
    surf: enc(0.08, 'Pondlet 25-30 50, Croakard 30-33 20, Quackle 25-30 30'),
    fish: enc(1, 'Mudgill 15-30 40, Wyrmlet 20-25 10, Pondlet 20-30 30, Finnet 20-30 20'),
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'TT,,,,....,,,,,....,,,TT',
      'TT,,,,....,,,,,....,,,TT',
      'TT....TT........TT....TT',
      'TT....TT..~~~~..TT....TT',
      '::::......~~~~......,,TT',
      '::::......~~~~......,,TT',
      'TT,,,,.................T',
      'TT,,,,....,,,,,,.......T',
      'TT........,,,,,,....,,TT',
      'TT..TTTT............,,TT',
      'TT..TTTT..,,,,,,,,....TT',
      'TT........,,,,,,,,....TT',
      'TT,,,,..............,,TT',
      'TT,,,,....TTTT......,,TT',
      'TT........TTTT........TT',
      'TT..,,,,,,......,,,,..TT',
      'TT..,,,,,,......,,,,..TT',
      'TT....................TT',
      'TT..f.....::......f...TT',
      'TT........::..........TT',
      'TT........::..........TT',
      'TT........::..........TT',
      'TTTTTTTTTT::TTTTTTTTTTTT',
    ],
    warps: [door(10, 23, 'park_gate', 4, 1, 'down'), door(11, 23, 'park_gate', 5, 1, 'down')],
    items: [
      { id: 'pk1', x: 21, y: 1, item: 'ultrapod', n: 3 },
      { id: 'pk2', x: 2, y: 13, item: 'tm28' },
      { id: 'pk3', x: 21, y: 18, item: 'maxpotion' },
    ],
    npcs: [{ id: 'ranger', x: 12, y: 18, dir: 'down', look: 'hiker', move: 'look', talk: 'The rest house in the western half of the park belongs to an old surfer. Nobody has seen him in years.' }],
  });
  W.add(park_e);
  const park_w = makeMap({
    id: 'park_w',
    name: 'WILDLANDS PARK WEST',
    legend: OUT,
    border: 'tree',
    music: 'route',
    outdoor: true,
    encounters: parkEnc,
    fish: enc(1, 'Mudgill 15-30 30, Wyrmlet 20-25 15, Seasprig 20-30 25, Finnet 20-30 30'),
    surf: enc(0.08, 'Pondlet 25-30 40, Quackle 25-30 30, Croakard 30-33 20, Wyrmlet 22-25 10'),
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'TT,,,,,,..........,,,,TT',
      'TT,,,,,,..........,,,,TT',
      'TT......~~~~~~~~......TT',
      'TT......~~~~~~~~......TT',
      'TT......~~~~~~~~......::',
      'TT,,,,..~~~~~~~~......::',
      'TT,,,,................TT',
      'TT.......,,,,,,.......TT',
      'TT..TT...,,,,,,...TT..TT',
      'TT..TT............TT..TT',
      'TT....................TT',
      'TT,,,,,,........,,,,,,TT',
      'TT,,,,,,........,,,,,,TT',
      'TT....................TT',
      'TT....................TT',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    items: [
      { id: 'pw1', x: 2, y: 1, item: 'candy' },
      { id: 'pw2', x: 21, y: 13, item: 'fullrestore' },
    ],
  });
  const rest = building(park_w, 9, 10, 5, 'teal', 'house');
  park_w.warps.push(door(rest.x, rest.y, 'resthouse', 3, 7));
  W.add(park_w);
  W.add(
    houseInterior('resthouse', 'REST HOUSE', { map: 'park_w', x: rest.x, y: rest.y + 1 }, [
      {
        id: 'surfer',
        x: 5,
        y: 3,
        dir: 'down',
        look: 'swimmer',
        talk: giver(
          'gotBoard',
          'driftboard',
          1,
          ['OLD SURFER: Whoa, a visitor! Nobody finds this place.', "OLD SURFER: You've got that look... the look of someone who wants to see what's past the horizon. Take my DRIFTBOARD, kid!"],
          'OLD SURFER: Face the water and press A to ride. Wild Wildkin swim right up to you out there. Gnarly!',
          (s) => s.badges.length >= 6,
          "OLD SURFER: Whoa, a visitor! The sea out past the park is rough, kid. Come back with six BADGES and I'll lend you my DRIFTBOARD.",
        ),
      },
    ]),
  );
  W.add(
    gymInterior(
      'mire_gym',
      'MIRECOAST GYM',
      'y',
      { map: 'mirecoast', x: mcGym.x, y: mcGym.y + 1 },
      [
        {
          id: 'silas',
          x: 4,
          y: 2,
          dir: 'down',
          look: 'silas',
          trainer: T('g5', 'LEADER', 'SILAS', [['Smogpuff', 36], ['Venomaw', 37], ['Thornmarch', 38], ['Sludgemaw', 38], ['Smogcloud', 40]], {
            look: 'silas',
            money: 99,
            smart: true,
            music: 'boss',
            potions: 1,
            intro: 'Heh heh. You found your way through my marsh. I am SILAS. Poison is patient. It wins slowly, then all at once.',
            lose: 'Hmph. You shrugged off my venom. Take the VENOM BADGE.',
            after: '',
          }),
          sight: 0,
          afterWin: leaderAfter('VENOM', ['tm21', 1], ['SILAS: VENOM SEEP. Badly poisons the foe. Worse every turn.', 'SILAS: The WARDEN would like to see you. He has a tool for breaking stubborn rocks.']),
          talk: 'SILAS: Patience is the strongest poison of all.',
        },
        { id: 'gt1', x: 1, y: 6, dir: 'right', look: 'tamer', trainer: T('g5_vik', 'TAMER', 'VIK', [['Venomaw', 35], ['Coilkit', 33]]), sight: 4 },
        { id: 'gt2', x: 7, y: 9, dir: 'left', look: 'scientist', trainer: T('g5_ivo', 'SCIENTIST', 'IVO', [['Oozle', 34], ['Smogpuff', 35]]), sight: 4 },
        { id: 'gt3', x: 3, y: 4, dir: 'down', look: 'mystic', trainer: T('g5_nim', 'MYSTIC', 'NIM', [['Nocturne', 35], ['Phantail', 36]]), sight: 3 },
        { id: 'guide', x: 7, y: 12, dir: 'left', look: 'boy', talk: "SILAS's TOXIN team crumbles against EARTH and MIND moves!" },
      ],
      'MIRECOAST GYM   LEADER: SILAS   The venom that waits!',
      2,
    ),
  );

  W.link('bellmoor', 'down', 'route14');
  W.link('route14', 'left', 'route15');
  W.link('route15', 'left', 'route16');
  W.link('route16', 'left', 'mirecoast');
  W.link('bloomfield', 'down', 'route17');
  W.link('route17', 'down', 'mirecoast');
  W.link('park_e', 'left', 'park_w');
}
