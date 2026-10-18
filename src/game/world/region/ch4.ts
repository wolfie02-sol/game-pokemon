/**
 * Chapter 4: ROUTES 9-13, GLOOM TUNNEL, STORMWORKS, BELLMOOR and its BELL TOWER,
 * ASTRA CITY and its OBSERVATORY, the UNDERPASS, BLOOMFIELD and the ARCADE hideout.
 */
import { SP } from '../../data/species';
import { rivalStarter, T } from '../../data/trainers';
import { building, CAVE, door, gymInterior, havenInterior, houseInterior, IN, makeMap, martInterior, matWarps, OUT, type World } from '../build';
import { enc, giver, intro, leaderAfter, monGiver, not, pushBack } from '../common';
import type { Script } from '../types';

const lockdown = (dir: 'left' | 'right' | 'up'): Script => async (c) => {
  await c.say('GUARD: Sorry! ASTRA CITY is under lockdown. The HOLLOW ORDER has been seen near the OBSERVATORY. Nobody goes in or out!');
  await pushBack(c, dir);
};

const spirit: Script = async (c) => {
  if (!c.s.bag.lens) {
    await c.say(['A cold, shadowy shape blocks the stairs. It wails without a sound...', 'You cannot make out what it is. Something seems to be holding it here.']);
    return;
  }
  await c.say('{PLAYER} held up the SPECTRAL LENS... The shape becomes clear: it is the spirit of a BONEHOUND!');
  await c.say('The spirit looks at you for a long moment, then seems to smile. It fades peacefully into the light.');
  c.set('spiritGone');
  c.hide('spirit');
};

export function build(W: World) {
  // ======================= ROUTE 9 =======================
  W.add(
    makeMap({
      id: 'route9',
      name: 'ROUTE 9',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Pecklet 15-18 25, Scrapape 15-18 20, Thistlet 15-18 20, Coilkit 15-18 15, Dunemole 16-18 10, Gnawlord 18-19 10'),
      rows: [
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        'TT,,,,,.....TTTT.....,,,,,..TT',
        'TT,,,,,.....TTTT.....,,,,,..TT',
        'TT......,,,,......,,,,......TT',
        'TT..TT..,,,,..TT..,,,,..TT..TT',
        '::::::::::::::::::::::::::::::',
        '::::::::::::::::::::::::::::::',
        'TT..,,,,,..TT......TT..,,,,,TT',
        'TT..,,,,,..TT..S...TT..,,,,,TT',
        'TT.........TT......TT.......TT',
        'TT___________....___________TT',
        'TT..f.......,,,,.........f..TT',
        'TT..........,,,,............TT',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      ],
      signs: [{ x: 15, y: 8, text: 'ROUTE 9   West: RIVERTON CITY   East: ROUTE 10 and GLOOM TUNNEL' }],
      items: [
        { id: 'r9tm', x: 2, y: 12, item: 'tm01' },
        { id: 'r9cure', x: 27, y: 1, item: 'fullcure' },
      ],
      npcs: [
        { id: 't1', x: 7, y: 3, dir: 'down', look: 'hiker', trainer: T('r9_axl', 'HIKER', 'AXL', [['Pebbit', 19], ['Dunemole', 19], ['Pebbit', 19]]), sight: 2 },
        { id: 't2', x: 17, y: 4, dir: 'down', look: 'girl', trainer: T('r9_cel', 'PICNICKER', 'CEL', [['Thistlet', 19], ['Budling', 20]]), sight: 1 },
        { id: 't3', x: 22, y: 9, dir: 'left', look: 'boy', trainer: T('r9_dom', 'CAMPER', 'DOM', [['Scrapape', 20], ['Coilkit', 20]]), sight: 3 },
        { id: 't4', x: 9, y: 11, dir: 'right', look: 'boy', trainer: T('r9_ugo', 'BUG FAN', 'UGO', [['Vespire', 20], ['Fuzzmoth', 21]]), sight: 3 },
        { id: 't5', x: 26, y: 7, dir: 'left', look: 'hiker', trainer: T('r9_kit', 'HIKER', 'KIT', [['Bouldrake', 21]]), sight: 2 },
      ],
    }),
  );

  // ======================= ROUTE 10 =======================
  const r10 = makeMap({
    id: 'route10',
    name: 'ROUTE 10',
    legend: OUT,
    border: 'tree',
    music: 'route',
    outdoor: true,
    encounters: enc(0.1, 'Zapling 16-20 25, Pecklet 16-19 20, Coilkit 16-19 15, Thistlet 16-19 15, Coilorb 17-20 15, Grapplet 18-20 10'),
    surf: enc(0.08, 'Jellune 20-28 70, Quackle 20-28 30'),
    fish: enc(1, 'Mudgill 10-20 40, Pondlet 15-22 30, Finnet 15-22 30'),
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'TT,,,,......~~~~~~~~~~TT',
      'TT,,,,......~~~~~~~~~~TT',
      'TT..........~~~~~~~~~~TT',
      'TT..TT......~~~~~~~~~~TT',
      '::::::::::..~~~~~~~~~~TT',
      '::::::::::..~~~~~~~~~~TT',
      'TT......::..~~~~~~~~~~TT',
      'TT.,,,,.::..~~~~~~~~~~TT',
      'TT.,,,,.::..~~ssssss~~TT',
      'TT......::..~~s.....~~TT',
      'TT..TT..::..~~s.....~~TT',
      'TT..TT..::..~~s.....~~TT',
      'TT......::..~~s.....~~TT',
      'TT,,,,..::..~~ssssss~~TT',
      'TT,,,,..::..~~~~~~~~~~TT',
      'TT......::..~~~~~~~~~~TT',
      'TT......::..........TTTT',
      'TT.,,,..::..,,,,....TTTT',
      'TT.,,,..::..,,,,....TTTT',
      'TT......::......S...TTTT',
      'TT______::_______...TTTT',
      'TT......::..........TTTT',
      'TT..,,,,::,,,,......TTTT',
      'TT..,,,,::,,,,......TTTT',
      'TT......::..........TTTT',
      'TT......::..........TTTT',
      'MMMMMMMMMCMMMMMMMMMMMMMM',
      'MMMMMMMMMMMMMMMMMMMMMMMM',
      'MMMMMMMMMMMMMMMMMMMMMMMM',
    ],
    warps: [door(9, 27, 'gloom1', 9, 2, 'down')],
    signs: [{ x: 16, y: 20, text: 'ROUTE 10   GLOOM TUNNEL ahead. It is dark inside. Stay close to the walls.' }],
    items: [{ id: 'r10ether', x: 2, y: 1, item: 'ether' }],
    npcs: [
      { id: 't1', x: 6, y: 7, dir: 'down', look: 'engineer', trainer: T('r10_vic', 'ENGINEER', 'VIC', [['Coilorb', 21], ['Zapling', 21]]), sight: 2 },
      { id: 't2', x: 11, y: 18, dir: 'left', look: 'hiker', trainer: T('r10_lew', 'HIKER', 'LEW', [['Pebbit', 20], ['Graniteel', 21]]), sight: 2 },
      { id: 't3', x: 3, y: 22, dir: 'right', look: 'girl', trainer: T('r10_kay', 'PICNICKER', 'KAY', [['Puffmote', 21], ['Thistlet', 21]]), sight: 4 },
      { id: 't4', x: 15, y: 25, dir: 'left', look: 'blackbelt', trainer: T('r10_bud', 'BLACKBELT', 'BUD', [['Grapplet', 21], ['Scrapape', 21]]), sight: 4 },
    ],
  });
  const sw = building(r10, 15, 10, 5, 'grey', 'lab');
  r10.warps.push(door(sw.x, sw.y, 'stormworks', 7, 12));
  W.add(r10);

  W.add(
    makeMap({
      id: 'stormworks',
      name: 'STORMWORKS',
      legend: { ...IN, '.': 'tiles' },
      border: 'void',
      music: 'hideout',
      outdoor: false,
      escape: true,
      encounters: enc(0.08, 'Coilorb 30-34 25, Zappod 30-34 25, Zapling 30-33 15, Dynacoil 34-37 15, Thunderpod 34-37 10, Voltboxer 33-36 10'),
      rows: [
        'WWWWWWWWWWWWWWWW',
        'W..LL......LL..W',
        'W..............W',
        'W.LLLL....LLLL.W',
        'W..............W',
        'W..LL..LL..LL..W',
        'W..............W',
        'WLL..LLLLLL..LLW',
        'W..............W',
        'W.LL..LL..LL...W',
        'W..............W',
        'W..............W',
        'W......mm......W',
      ],
      warps: matWarps(7, 12, { map: 'route10', x: sw.x, y: sw.y + 1 }),
      items: [
        { id: 'swtm', x: 1, y: 10, item: 'tm13' },
        { id: 'swmax', x: 14, y: 1, item: 'maxpotion' },
        { id: 'swelix', x: 1, y: 4, item: 'elixir' },
      ],
      npcs: [
        {
          id: 'voltwing',
          x: 7,
          y: 1,
          dir: 'down',
          look: 'bird_volt',
          cond: not('voltwingDone'),
          talk: async (c) => {
            await c.say('Kreee-zzzak! The air crackles with static!');
            const r = await c.wild(SP.VOLTWING, 50, { noRun: true, music: 'boss' });
            if (r === 'lose') return;
            c.set('voltwingDone');
            c.hide('voltwing');
            if (r !== 'caught') await c.say('VOLTWING flew off in a burst of lightning!');
          },
        },
      ],
      signs: [{ x: 3, y: 1, text: 'A huge generator. A sign reads: STORMWORKS POWER PLANT. CLOSED FOR REPAIRS.' }],
    }),
  );

  // ======================= GLOOM TUNNEL =======================
  const gloomEnc = enc(0.08, 'Duskbat 16-21 30, Pebbit 16-21 25, Scrapape 17-20 15, Grapplet 17-20 15, Graniteel 18-21 10, Puffmote 18-20 5');
  W.add(
    makeMap({
      id: 'gloom1',
      name: 'GLOOM TUNNEL',
      legend: CAVE,
      border: 'cavewall',
      music: 'cave',
      outdoor: false,
      escape: true,
      encounters: gloomEnc,
      rows: [
        'wwwwwwwwwwwwwwwwwwww',
        'wwwwwwwwwewwwwwwwwww',
        'wwggggggggggggggggww',
        'wwgRggggwwwggggRggww',
        'wwgggggwwwwwgggggggw',
        'wggggwwwwwwwwwwgggww',
        'wggggwgggggggwwgggww',
        'wwgggwgRgggggwwgggww',
        'wwgggggggwwgggggRgww',
        'wwwwwwwwwwwwwwwgggww',
        'wwwwwwwwwwwwwwwhggww',
        'wwwwwwwwwwwwwwwwwwww',
        'wggggggwwwwwwwgggggw',
        'wgggRgggggggggggRggw',
        'wghgggwwwwwgggggggww',
        'wggggggggRggggggggew',
        'wwwwwwwwwwwwwwwwwwww',
      ],
      warps: [door(9, 1, 'route10', 9, 26, 'up'), door(15, 10, 'gloom2', 19, 2, 'down'), door(2, 14, 'gloom2', 2, 13, 'up'), door(18, 15, 'route11', 8, 2, 'down')],
      items: [
        { id: 'gl1a', x: 2, y: 2, item: 'superpotion', n: 2 },
        { id: 'gl1b', x: 18, y: 4, item: 'escaperope' },
      ],
      npcs: [
        { id: 'h1', x: 12, y: 6, dir: 'left', look: 'hiker', trainer: T('gl_ron', 'HIKER', 'RON', [['Graniteel', 21], ['Pebbit', 20], ['Pebbit', 20]]), sight: 4 },
        { id: 'p1', x: 3, y: 4, dir: 'down', look: 'girl', trainer: T('gl_isa', 'PICNICKER', 'ISA', [['Puffmote', 22], ['Hummaloon', 22]]), sight: 3 },
        { id: 'h2', x: 11, y: 13, dir: 'down', look: 'hiker', trainer: T('gl_mo', 'HIKER', 'MO', [['Bouldrake', 23]]), sight: 2 },
      ],
    }),
  );
  W.add(
    makeMap({
      id: 'gloom2',
      name: 'GLOOM TUNNEL B1',
      legend: CAVE,
      border: 'cavewall',
      music: 'cave',
      outdoor: false,
      escape: true,
      encounters: gloomEnc,
      rows: [
        'wwwwwwwwwwwwwwwwwwwwww',
        'wggggggggwwwwggggggggw',
        'wgRgggggggggggggRgguww',
        'wggggwwwgggwwwgggggggw',
        'wwgggwwwgggwwwggwwwggw',
        'wggggggggRgggggggwwggw',
        'wgRggwwwwwwwwggggggggw',
        'wggggw*ggggggggRggwwww',
        'wwwggwgggwwwwgggggggww',
        'wggggggggwwwwggRgggggw',
        'wggRgggggggggggggwwggw',
        'wgggwwwwgggRggggggggww',
        'wgggggggggwwwwwgggggww',
        'wwuggggggggggggggggggw',
        'wwwwwwwwwwwwwwwwwwwwww',
      ],
      warps: [door(19, 2, 'gloom1', 15, 10, 'up'), door(2, 13, 'gloom1', 2, 14, 'down')],
      items: [
        { id: 'gl2a', x: 1, y: 1, item: 'tm15' },
        { id: 'gl2b', x: 20, y: 9, item: 'greatpod', n: 3 },
      ],
      npcs: [
        { id: 'b1', x: 6, y: 9, dir: 'right', look: 'blackbelt', trainer: T('gl_ken', 'BLACKBELT', 'KEN', [['Grapplet', 22], ['Grapplet', 22], ['Brawnox', 23]]), sight: 3 },
        { id: 'm1', x: 14, y: 5, dir: 'left', look: 'mystic', trainer: T('gl_ola', 'MYSTIC', 'OLA', [['Wispet', 22], ['Wispet', 22]]), sight: 4 },
        { id: 'h1', x: 16, y: 11, dir: 'left', look: 'hiker', trainer: T('gl_vad', 'HIKER', 'VAD', [['Dunemole', 22], ['Graniteel', 23]]), sight: 4 },
      ],
    }),
  );

  // ======================= ROUTE 11 =======================
  W.add(
    makeMap({
      id: 'route11',
      name: 'ROUTE 11',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Pecklet 18-21 25, Pursy 18-21 25, Dreamtap 18-21 25, Coilkit 18-21 15, Fuzzmoth 19-21 10'),
      rows: [
        'MMMMMMMMMMMMMMMMMMMM',
        'MMMMMMMMCMMMMMMMMMMM',
        'TT......:.........TT',
        'TT.,,,..:...,,,,..TT',
        'TT.,,,..:...,,,,..TT',
        'TT......:.........TT',
        'TT..TT..:.....TT..TT',
        'TT..TT..:..S..TT..TT',
        'TT......:.........TT',
        'TT,,,,..:...,,,,,.TT',
        'TT,,,,..:...,,,,,.TT',
        'TT......:.........TT',
        'TT......::........TT',
        'TTTTTTTT::TTTTTTTTTT',
      ],
      warps: [door(8, 1, 'gloom1', 17, 15, 'left')],
      signs: [{ x: 11, y: 7, text: 'ROUTE 11   South: BELLMOOR, town of the BELL TOWER' }],
      npcs: [
        { id: 't1', x: 13, y: 5, dir: 'left', look: 'mystic', trainer: T('r11_una', 'MYSTIC', 'UNA', [['Wispet', 22], ['Duskbat', 22]]), sight: 4 },
        { id: 't2', x: 4, y: 11, dir: 'right', look: 'gentleman', trainer: T('r11_fitz', 'GENTLEMAN', 'FITZ', [['Purrloft', 24]]), sight: 3 },
      ],
    }),
  );

  // ======================= BELLMOOR =======================
  const bm = makeMap({
    id: 'bellmoor',
    name: 'BELLMOOR',
    legend: OUT,
    border: 'tree',
    music: 'tower',
    outdoor: true,
    fly: { x: 7, y: 14 },
    rows: [
      'TTTTTTTT::TTTTTTTTTT',
      'TT......::........TT',
      'TT......::........TT',
      'TT......::........TT',
      'TT......::........TT',
      'TT......::...S....TT',
      'TT..::::::::::::..TT',
      'TT..:..........:..TT',
      '::::::.........:..TT',
      '::::::.........:..TT',
      'TT..:..........:..TT',
      'TT..:..........:..TT',
      'TT..:..........:..TT',
      'TT..:..........:..TT',
      'TT..::::::::::::..TT',
      'TT.f.....::.....f.TT',
      'TT.......::.......TT',
      'TTTTTTTTT::TTTTTTTTT',
    ],
    signs: [{ x: 13, y: 5, text: 'BELL TOWER: Resting place of beloved Wildkin. Please be quiet.' }],
    npcs: [
      { id: 'mourner', x: 15, y: 8, dir: 'down', look: 'oldman', move: 'look', talk: 'Strange people in hoods went up the BELL TOWER and took the ELDER with them. The bell has not rung since...' },
      { id: 'girl', x: 10, y: 8, dir: 'down', look: 'girl', move: 'wander', talk: 'Some say the spirits in the tower can only be seen with a SPECTRAL LENS. I heard one is hidden somewhere in BLOOMFIELD.' },
      {
        id: 'slumbearSign',
        x: 11,
        y: 16,
        dir: 'down',
        look: 'hiker',
        move: 'look',
        talk: async (c) => c.say(c.flag('slumbearDone') ? 'The road south is clear now. The coast is beautiful this time of year.' : 'A huge SLEEPER is napping on the road south. Nothing wakes it! Well, the BELL TOWER chime might...'),
      },
    ],
  });
  const tower = building(bm, 10, 1, 5, 'purple', 'spire');
  const bmHouse = building(bm, 2, 1, 5, 'green', 'house');
  const bmHaven = building(bm, 5, 10, 5, 'red', 'haven');
  const bmMart = building(bm, 11, 10, 4, 'blue', 'mart');
  bm.warps.push(
    door(tower.x, tower.y, 'tower1', 4, 8),
    door(bmHouse.x, bmHouse.y, 'bellmoor_house', 3, 7),
    door(bmHaven.x, bmHaven.y, 'bellmoor_haven', 4, 7),
    door(bmMart.x, bmMart.y, 'bellmoor_mart', 3, 7),
  );
  W.add(bm);
  W.add(havenInterior('bellmoor_haven', 'BELLMOOR HAVEN', { map: 'bellmoor', x: bmHaven.x, y: bmHaven.y + 1 }, [{ id: 'h1', x: 7, y: 5, dir: 'left', look: 'mystic', talk: 'SHADE Wildkin are immune to BEAST and BRAWL moves. And BEAST moves cannot touch them either!' }]));
  W.add(martInterior('bellmoor_mart', 'BELLMOOR MARKET', { map: 'bellmoor', x: bmMart.x, y: bmMart.y + 1 }, ['greatpod', 'superpotion', 'fullcure', 'antidote', 'burnsalve', 'wakebell', 'thawdrop', 'unnumb', 'escaperope', 'superrepel', 'revive']));
  W.add(
    houseInterior('bellmoor_house', 'HOUSE', { map: 'bellmoor', x: bmHouse.x, y: bmHouse.y + 1 }, [
      {
        id: 'boy',
        x: 5,
        y: 4,
        dir: 'down',
        look: 'youngster',
        talk: giver(
          'gotFossipupTip',
          'xdefend',
          1,
          'My Fossipup misses its parent. People say a BONEHOUND spirit still wanders the tower... Here, take this. Be careful up there.',
          'If you see the BONEHOUND spirit, tell it we miss it.',
        ),
      },
    ]),
  );

  // ---- BELL TOWER
  const towerEnc = enc(0.08, 'Wispet 18-24 70, Phantail 22-26 10, Fossipup 20-24 15, Duskbat 20-22 5');
  W.add(
    makeMap({
      id: 'tower1',
      name: 'BELL TOWER 1F',
      legend: IN,
      border: 'void',
      music: 'tower',
      outdoor: false,
      escape: true,
      encounters: towerEnc,
      rows: ['wwwwwwwwww', 'wssssssszw', 'wssssssssw', 'wsswwwwssw', 'wssssssssw', 'wssssssssw', 'wsssswwssw', 'wssssssssw', 'wssssssssw', 'wwwwmmwwww'],
      warps: [...matWarps(4, 9, { map: 'bellmoor', x: tower.x, y: tower.y + 1 }), door(8, 1, 'tower2', 8, 2, 'down')],
      npcs: [
        { id: 'rival', x: 6, y: 4, dir: 'down', look: 'rival', cond: (s) => !s.flags['tr:rival5'] },
        { id: 'm1', x: 1, y: 2, dir: 'down', look: 'mystic', trainer: T('tw_hil', 'MYSTIC', 'HILDA', [['Wispet', 23], ['Wispet', 24]]), sight: 3 },
        { id: 'keeper', x: 8, y: 7, dir: 'left', look: 'oldman', talk: 'This tower honours Wildkin who have passed on. Lately the spirits are restless.' },
      ],
      triggers: [
        {
          x: 4,
          y: 7,
          w: 4,
          cond: (s) => !s.flags['tr:rival5'],
          run: async (c) => {
            await c.emote('rival');
            c.faceToward('rival');
            await c.say(intro('rival5'));
            const won = await c.battle('rival5');
            if (!won) return;
            await c.say("{RIVAL}: I came to pay respects. Grandma's first Wildkin rests here. ...Don't make it weird. Bye.");
            await c.walkNpc('rival', ['left', 'left', 'down', 'down', 'down', 'down', 'down'], 2);
            c.hide('rival');
          },
        },
      ],
    }),
  );
  W.add(
    makeMap({
      id: 'tower2',
      name: 'BELL TOWER 2F',
      legend: IN,
      border: 'void',
      music: 'tower',
      outdoor: false,
      escape: true,
      encounters: towerEnc,
      rows: ['wwwwwwwwww', 'wzwssssszw', 'wssssssssw', 'wsswwwwssw', 'wssssssssw', 'wssssssssw', 'wwwsssswww', 'wssssssssw', 'wssssssssw', 'wwwwwwwwww'],
      warps: [door(8, 1, 'tower1', 8, 2, 'down'), door(1, 1, 'tower3', 8, 6, 'left')],
      items: [
        { id: 'twdusk', x: 1, y: 8, item: 'dusk' },
        { id: 'twrev', x: 8, y: 8, item: 'revive' },
      ],
      npcs: [
        { id: 'spirit', x: 1, y: 2, dir: 'down', look: 'spirit', cond: not('spiritGone'), talk: spirit },
        { id: 'm1', x: 5, y: 4, dir: 'left', look: 'mystic', trainer: T('tw_rua', 'MYSTIC', 'RUA', [['Wispet', 24], ['Phantail', 25]]), sight: 3 },
        { id: 'm2', x: 6, y: 7, dir: 'right', look: 'mystic', trainer: T('tw_sam', 'MYSTIC', 'SAM', [['Fossipup', 24], ['Wispet', 24]]), sight: 2 },
      ],
    }),
  );
  W.add(
    makeMap({
      id: 'tower3',
      name: 'BELL TOWER TOP',
      legend: IN,
      border: 'void',
      music: 'hideout',
      outdoor: false,
      escape: true,
      rows: ['wwwwwwwwww', 'wwwssAswww', 'wssssssssw', 'wssssssssw', 'wsswsswssw', 'wssssssssw', 'wssssssszw', 'wwwwwwwwww'],
      warps: [door(8, 6, 'tower2', 1, 2, 'down')],
      npcs: [
        { id: 'g1', x: 2, y: 5, dir: 'right', look: 'grunt', trainer: T('tw_gr1', 'HOLLOW', 'GRUNT', [['Coilkit', 25], ['Venomaw', 26]]), sight: 4 },
        { id: 'g2', x: 7, y: 3, dir: 'down', look: 'grunt', trainer: T('tw_gr2', 'HOLLOW', 'GRUNT', [['Duskbat', 25], ['Nocturne', 26]]), sight: 2 },
        {
          id: 'sable',
          x: 5,
          y: 3,
          dir: 'down',
          look: 'sable',
          cond: not('towerCleared'),
          trainer: T('tw_sable', 'ADMIN', 'SABLE', [['Nocturne', 27], ['Venomaw', 27], ['Phantail', 28]], {
            look: 'sable',
            money: 60,
            smart: true,
            music: 'boss',
            intro: 'You again! The DAWN CHIME is the second key to the RIFT. The old man will hand it over, one way or another!',
            lose: 'Again?! Fine. Keep your bell. The OBSERVATORY in ASTRA is already ours. You are far too late.',
            after: '',
          }),
          sight: 3,
          afterWin: async (c) => {
            await c.flash();
            c.hide('sable');
            c.set('towerCleared');
            await c.say('SABLE fled down the stairs!');
          },
        },
        {
          id: 'elder',
          x: 5,
          y: 2,
          dir: 'down',
          look: 'oldman',
          talk: async (c) => {
            if (!c.flag('towerCleared')) {
              await c.say('ELDER: Child, run! These people want the DAWN CHIME!');
              return;
            }
            if (!c.flag('gotChime')) {
              c.set('gotChime');
              await c.say(['ELDER: You saved me, and the bell! The ORDER wanted its tone to open the RIFT. Never let them have it.', 'ELDER: Take the DAWN CHIME with you. Its tone can wake even the great SLEEPER on the road south.']);
              await c.give('chime');
              await c.say('ELDER: I hear ASTRA has lifted its lockdown now that the ORDER has fled the tower... but they are surely at the OBSERVATORY. Be careful.');
              return;
            }
            await c.say('ELDER: The spirits are at peace again. Thank you, {PLAYER}.');
          },
        },
      ],
      signs: [{ x: 5, y: 1, text: 'The great bell of BELLMOOR. Its bronze glows faintly orange.' }],
    }),
  );

  // ======================= ROUTE 12 =======================
  const r12 = makeMap({
    id: 'route12',
    name: 'ROUTE 12',
    legend: OUT,
    border: 'tree',
    music: 'route',
    outdoor: true,
    encounters: enc(0.1, 'Budling 20-24 20, Vinelet 20-24 20, Skyroost 21-24 20, Pursy 20-24 15, Fuzzmoth 21-24 15, Bladewing 22-24 5, Emberfen 21-23 5'),
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TT,,,,,.......,,,,.......,,,TT',
      'TT,,,,,.......,,,,.......,,,TT',
      'TT......TT...........TT.....TT',
      'TT......TT...........TT.....TT',
      'TT..........................TT',
      '::::::::::::::::::::::::::::::',
      '::::::::::::::::::::::::::::::',
      'TT..,,,,....S.....,,,,....,,TT',
      'TT..,,,,..........,,,,....,,TT',
      'TT........,,,,,,......f.....TT',
      'TT..f.....,,,,,,............TT',
      'TT..........................TT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    signs: [{ x: 12, y: 8, text: 'ROUTE 12   West: ASTRA CITY   East: BELLMOOR   UNDERPASS to BLOOMFIELD' }],
    npcs: [
      { id: 't1', x: 6, y: 9, dir: 'right', look: 'beauty', trainer: T('r12_lux', 'BEAUTY', 'LUX', [['Pursy', 24], ['Purrloft', 25]]), sight: 3 },
      { id: 't2', x: 24, y: 4, dir: 'left', look: 'birdkeeper', trainer: T('r12_cas', 'BIRDKEEPER', 'CASPER', [['Skyroost', 24], ['Pecklet', 23], ['Lancebeak', 25]]), sight: 3 },
      { id: 't3', x: 20, y: 11, dir: 'left', look: 'girl', trainer: T('r12_dee', 'PICNICKER', 'DEE', [['Wiltbloom', 25], ['Budling', 24]]), sight: 4 },
    ],
  });
  const upE = building(r12, 14, 2, 5, 'grey', 'house');
  r12.warps.push(door(upE.x, upE.y, 'underpass_e', 3, 5));
  W.add(r12);

  // ---- UNDERPASS
  const gate = (id: string, exit: { map: string; x: number; y: number }, to: string, tx: number): ReturnType<typeof makeMap> =>
    makeMap({
      id,
      name: 'UNDERPASS GATE',
      legend: IN,
      border: 'void',
      music: 'haven',
      outdoor: false,
      rows: ['WWnWWnWW', '..z.....', '........', '........', 'p......p', '...mm...'],
      warps: [...matWarps(3, 5, exit), door(2, 1, 'underpass', tx, 1, 'left')],
      npcs: [{ id: 'old', x: 6, y: 2, dir: 'left', look: 'oldman', talk: 'The UNDERPASS runs beneath ASTRA CITY, from ROUTE 12 to ROUTE 13. Handy when the city is closed!' }],
    });
  W.add(gate('underpass_e', { map: 'route12', x: upE.x, y: upE.y + 1 }, 'underpass', 28));
  W.add(
    makeMap({
      id: 'underpass',
      name: 'UNDERPASS',
      legend: IN,
      border: 'void',
      music: 'cave',
      outdoor: false,
      rows: ['WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', 'z============================z', 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW'],
      warps: [door(29, 1, 'underpass_e', 2, 2, 'down'), door(0, 1, 'underpass_w', 2, 2, 'down')],
      items: [{ id: 'upnug', x: 15, y: 1, item: 'tm22' }],
    }),
  );

  // ======================= ASTRA CITY =======================
  const ac = makeMap({
    id: 'astra',
    name: 'ASTRA CITY',
    legend: OUT,
    border: 'tree',
    music: 'city',
    outdoor: true,
    fly: { x: 18, y: 12 },
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
      '::::::::::::::::::::::::::::',
      '::::::::::::::::::::::::::::',
      'TT..:........::........:..TT',
      'TT..:........::........:..TT',
      'TT..:........::........:..TT',
      'TT..:........::........:..TT',
      'TT..:........::........:..TT',
      'TT..::::::::::::::::::::..TT',
      'TT...L.......::.......L...TT',
      'TT...........::...........TT',
      'TT....f......F........f...TT',
      'TT........................TT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    signs: [],
    npcs: [
      { id: 'gN', x: 13, y: 1, dir: 'down', look: 'guard', cond: not('towerCleared'), talk: 'ASTRA CITY is under lockdown. Nobody goes north until the HOLLOW ORDER is dealt with.' },
      { id: 'gW', x: 1, y: 11, dir: 'right', look: 'guard', cond: not('towerCleared'), talk: 'ASTRA CITY is under lockdown. Please turn back.' },
      { id: 'gE', x: 26, y: 11, dir: 'left', look: 'guard', cond: not('towerCleared'), talk: 'ASTRA CITY is under lockdown. Please turn back.' },
      { id: 'gymGrunt', x: 8, y: 11, dir: 'down', look: 'grunt', cond: not('observatoryCleared'), talk: 'GRUNT: The GYM is closed! Our boss NYX locked the leader out. Go cry somewhere else!' },
      { id: 'cit1', x: 22, y: 15, dir: 'down', look: 'girl', move: 'wander', talk: 'The OBSERVATORY watches the sky for rare Wildkin. Now the HOLLOW ORDER wants its big lens for something...' },
      { id: 'cit2', x: 10, y: 20, dir: 'right', look: 'gentleman', move: 'look', talk: 'ASTRA is the heart of VARROW. Roads lead to every corner of the region from here.' },
    ],
    triggers: [
      { x: 14, y: 1, cond: not('towerCleared'), run: lockdown('up') },
      { x: 1, y: 12, cond: not('towerCleared'), run: lockdown('left') },
      { x: 26, y: 12, cond: not('towerCleared'), run: lockdown('right') },
    ],
  });
  const acObs = building(ac, 5, 1, 7, 'purple', 'museum');
  const acDojo = building(ac, 16, 1, 6, 'grey', 'house');
  const acGym = building(ac, 5, 7, 7, 'purple', 'gym');
  const acHaven = building(ac, 16, 7, 5, 'red', 'haven');
  const acMart = building(ac, 5, 13, 4, 'blue', 'mart');
  const acHouse = building(ac, 9, 13, 4, 'gold', 'house');
  const acHouse2 = building(ac, 16, 13, 5, 'green', 'house');
  ac.warps.push(
    door(acObs.x, acObs.y, 'obs1', 5, 8),
    door(acDojo.x, acDojo.y, 'dojo', 4, 9),
    door(acGym.x, acGym.y, 'astra_gym', 4, 13),
    door(acHaven.x, acHaven.y, 'astra_haven', 4, 7),
    door(acMart.x, acMart.y, 'astra_mart', 3, 7),
    door(acHouse.x, acHouse.y, 'astra_mime', 3, 7),
    door(acHouse2.x, acHouse2.y, 'astra_house', 4, 7),
  );
  ac.signs.push(
    { x: 4, y: 5, text: 'ASTRA OBSERVATORY: Watching the skies of VARROW.' },
    { x: 12, y: 21, text: 'ASTRA CITY: The shining heart of VARROW.' },
  );
  W.add(ac);
  W.add(havenInterior('astra_haven', 'ASTRA HAVEN', { map: 'astra', x: acHaven.x, y: acHaven.y + 1 }, [{ id: 'h1', x: 7, y: 5, dir: 'left', look: 'scientist', talk: 'MIND Wildkin have few weaknesses. SWARM and SHADE moves are your best bet.' }]));
  W.add(martInterior('astra_mart', 'ASTRA MARKET', { map: 'astra', x: acMart.x, y: acMart.y + 1 }, ['greatpod', 'ultrapod', 'superpotion', 'hyperpotion', 'fullcure', 'revive', 'superrepel', 'maxrepel', 'escaperope']));
  W.add(
    houseInterior(
      'astra_mime',
      "MIME'S HOUSE",
      { map: 'astra', x: acHouse.x, y: acHouse.y + 1 },
      [
        { id: 'mime', x: 2, y: 3, dir: 'right', look: 'mime', talk: "...It's miming that there is a wall here. You can almost see it!" },
        {
          id: 'girl',
          x: 5,
          y: 4,
          dir: 'left',
          look: 'girl',
          talk: monGiver('gotMimeon', 'Mimeon', 30, 'My Mimeon had a baby who keeps building invisible walls all over the house! Would you like to raise it?', 'It already loves you! Mimeon can make invisible walls in battle too.', 'How is my Mimeon doing? Still miming?'),
        },
      ],
      1,
    ),
  );
  W.add(
    houseInterior(
      'astra_house',
      'HOUSE',
      { map: 'astra', x: acHouse2.x, y: acHouse2.y + 1 },
      [
        {
          id: 'man',
          x: 5,
          y: 4,
          dir: 'down',
          look: 'gentleman',
          talk: giver('astraTM', 'tm19', 1, 'You look like someone who never rests! Take this TM. RESTORE heals half your health in a pinch.', 'Even champions need a breather now and then.'),
        },
      ],
      2,
    ),
  );
  W.add(
    makeMap({
      id: 'dojo',
      name: 'ASTRA DOJO',
      legend: { ...IN, '.': 'floor' },
      border: 'void',
      music: 'gym',
      outdoor: false,
      rows: ['WWnWWnWWnW', '..o....o..', '..........', '.*......*.', '.*......*.', '.*......*.', '.*......*.', '..........', '..........', '....mm....'],
      warps: matWarps(4, 9, { map: 'astra', x: acDojo.x, y: acDojo.y + 1 }),
      npcs: [
        {
          id: 'master',
          x: 4,
          y: 1,
          dir: 'down',
          look: 'blackbelt',
          trainer: T('dojo_master', 'BLACKBELT', 'MASTER TAO', [['Brawnox', 34], ['Furyape', 34], ['Bulwfrog', 35]], {
            intro: 'HYAAH! I am MASTER TAO of the ASTRA DOJO! Show me your fighting spirit!',
            lose: 'OOF! Your spirit is unbreakable!',
            after: 'Choose wisely. Kicks or punches, both are a way of life.',
            smart: true,
          }),
          sight: 0,
          afterWin: async (c) => c.say('MASTER TAO: As is tradition, take one of my prized pupils! They wait on the statues behind me.'),
        },
        { id: 'b1', x: 2, y: 4, dir: 'right', look: 'blackbelt', trainer: T('dojo_b1', 'BLACKBELT', 'RIKU', [['Grapplet', 31], ['Scrapape', 31]]), sight: 3 },
        { id: 'b2', x: 7, y: 6, dir: 'left', look: 'blackbelt', trainer: T('dojo_b2', 'BLACKBELT', 'DAN', [['Brawnox', 32]]), sight: 3 },
      ],
      signs: [
        {
          x: 2,
          y: 1,
          text: async (c) => {
            if (!c.flag('tr:dojo_master')) return c.say('A training statue. MASTER TAO is watching you closely.');
            if (c.flag('dojoGift')) return c.say('A training statue, polished by years of practice.');
            if (await c.yesNo('A pupil named KICKWELL bows deeply. Take KICKWELL?')) {
              c.set('dojoGift');
              await c.receiveMon(SP.KICKWELL, 30);
            }
          },
        },
        {
          x: 7,
          y: 1,
          text: async (c) => {
            if (!c.flag('tr:dojo_master')) return c.say('A training statue. MASTER TAO is watching you closely.');
            if (c.flag('dojoGift')) return c.say('A training statue, polished by years of practice.');
            if (await c.yesNo('A pupil named JABSTER raises its fists. Take JABSTER?')) {
              c.set('dojoGift');
              await c.receiveMon(SP.JABSTER, 30);
            }
          },
        },
      ],
    }),
  );
  W.add(
    gymInterior(
      'astra_gym',
      'ASTRA GYM',
      'j',
      { map: 'astra', x: acGym.x, y: acGym.y + 1 },
      [
        {
          id: 'orin',
          x: 4,
          y: 2,
          dir: 'down',
          look: 'orin',
          trainer: T('g6', 'LEADER', 'ORIN', [['Augurowl', 38], ['Mimeon', 37], ['Hypnotapir', 38], ['Oracleon', 43]], {
            look: 'orin',
            money: 99,
            smart: true,
            music: 'boss',
            potions: 1,
            intro: 'I saw you coming three days ago. I am ORIN. My mind is calm and my Wildkin see every move before it happens.',
            lose: 'I foresaw many futures... and in most of them, you won. The MIND BADGE.',
            after: '',
          }),
          sight: 0,
          afterWin: leaderAfter('MIND', ['tm16', 1], ['ORIN: PSYBLAST, a pure wave of thought. Use it wisely.', 'ORIN: Your path leads to the sea, the frozen north, and finally the SUMMIT. I can see it clearly.']),
          talk: 'ORIN: The future is not fixed. You proved that.',
        },
        { id: 'gt1', x: 1, y: 6, dir: 'right', look: 'scholar', trainer: T('g6_ada', 'SCHOLAR', 'ADA', [['Dreamtap', 34], ['Augurowl', 35]]), sight: 4 },
        { id: 'gt2', x: 8, y: 10, dir: 'left', look: 'mystic', trainer: T('g6_lux', 'MYSTIC', 'LUNE', [['Mallarch', 35], ['Hypnotapir', 36]]), sight: 4 },
        { id: 'gt3', x: 3, y: 4, dir: 'down', look: 'scholar', trainer: T('g6_kai', 'SCHOLAR', 'KAITO', [['Psyquill', 33], ['Augurowl', 34], ['Mimeon', 34]]), sight: 2 },
        { id: 'guide', x: 7, y: 12, dir: 'left', look: 'boy', talk: "ORIN's MIND team only fears SWARM and SHADE moves. BRAWL and TOXIN moves are useless!" },
      ],
      'ASTRA GYM   LEADER: ORIN   The mind that sees tomorrow!',
      0,
    ),
  );

  // ---- OBSERVATORY
  W.add(
    makeMap({
      id: 'obs1',
      name: 'OBSERVATORY 1F',
      legend: IN,
      border: 'void',
      music: 'hideout',
      outdoor: false,
      rows: ['WWnWWWWWWnWW', '%%%%%%%%%%z%', '%LL%%%%%%%%%', '%%%%%%%%%%%%', '%%tt%%%%tt%%', '%%%%%%%%%%%%', 'p%%%%%%%%%%p', '%%%%%%%%%%%%', '%%%%%mm%%%%%'],
      warps: [...matWarps(5, 8, { map: 'astra', x: acObs.x, y: acObs.y + 1 }), door(10, 1, 'obs2', 10, 2, 'down')],
      npcs: [
        { id: 'g1', x: 6, y: 5, dir: 'left', look: 'grunt', trainer: T('ob_gr1', 'HOLLOW', 'GRUNT', [['Venomaw', 31], ['Nocturne', 31]]), sight: 4 },
        { id: 'g2', x: 9, y: 3, dir: 'down', look: 'grunt', trainer: T('ob_gr2', 'HOLLOW', 'GRUNT', [['Smogpuff', 31], ['Oozle', 32]]), sight: 2 },
        { id: 'sci', x: 1, y: 3, dir: 'right', look: 'scientist', talk: async (c) => c.say(c.flag('observatoryCleared') ? 'Thank you! The OBSERVATORY is ours again!' : 'The ORDER barged in and took over the SKY LENS upstairs! Please help!') },
      ],
    }),
  );
  W.add(
    makeMap({
      id: 'obs2',
      name: 'OBSERVATORY 2F',
      legend: IN,
      border: 'void',
      music: 'hideout',
      outdoor: false,
      rows: ['WWnWWWWWWnWW', '%z%%%%%%%%z%', '%%%%%%%%%%%%', '%%LL%%%%LL%%', '%%%%%%%%%%%%', '%%%%%%%%%%%%', '%%tt%%%%tt%%', '%%%%%%%%%%%%', '%%%%%%%%%%%%'],
      warps: [door(10, 1, 'obs1', 10, 2, 'down'), door(1, 1, 'obs3', 1, 6, 'up')],
      items: [{ id: 'obcandy', x: 11, y: 8, item: 'candy' }],
      npcs: [
        { id: 'rival', x: 5, y: 4, dir: 'down', look: 'rival', cond: (s) => !s.flags['tr:rival6'] },
        { id: 'g1', x: 2, y: 7, dir: 'right', look: 'grunt', trainer: T('ob_gr3', 'HOLLOW', 'GRUNT', [['Coilkit', 32], ['Venomaw', 32], ['Nocturne', 33]]), sight: 4 },
        { id: 's1', x: 9, y: 5, dir: 'left', look: 'scientist', trainer: T('ob_sci', 'SCIENTIST', 'OBERT', [['Dynacoil', 33], ['Zappod', 32]]), sight: 3 },
        {
          id: 'glidelyn',
          x: 10,
          y: 7,
          dir: 'left',
          look: 'scientist',
          talk: monGiver(
            'gotGlidelyn',
            'Glidelyn',
            30,
            "The ORDER was going to take this GLIDELYN. It's gentle and loves to ferry people across water. Would you take care of it?",
            'GLIDELYN can carry you on the water once you have a DRIFTBOARD. Well, it will swim beside you, at least!',
            'Is GLIDELYN happy? It used to sing to the moon from our roof.',
            (s) => !!s.flags.observatoryCleared,
            'Please... chase the ORDER out first!',
          ),
        },
      ],
      triggers: [
        {
          x: 3,
          y: 3,
          w: 6,
          h: 3,
          cond: (s) => !s.flags['tr:rival6'],
          run: async (c) => {
            await c.emote('rival');
            c.faceToward('rival');
            await c.say(intro('rival6'));
            const won = await c.battle('rival6');
            if (!won) return;
            await c.say("{RIVAL}: NYX is right upstairs. Go! I'll keep any grunts from following you.");
            await c.walkNpc('rival', ['right', 'right', 'right', 'right', 'right', 'up', 'up'], 2);
            c.hide('rival');
          },
        },
      ],
    }),
  );
  W.add(
    makeMap({
      id: 'obs3',
      name: 'OBSERVATORY DOME',
      legend: IN,
      border: 'void',
      music: 'hideout',
      outdoor: false,
      rows: ['WWWWWWWWWWWW', 'WW%%LLLL%%WW', '%%%%%%%%%%%%', '%%%%%%%%%%%%', '%%%%%%%%%%%%', '%%%%%%%%%%%%', '%z%%%%%%%%%%', 'WWWWWWWWWWWW'],
      warps: [door(1, 6, 'obs2', 1, 2, 'down')],
      npcs: [
        {
          id: 'corvin',
          x: 4,
          y: 5,
          dir: 'left',
          look: 'corvin',
          cond: not('tr:ob_corvin'),
          trainer: T('ob_corvin', 'ADMIN', 'CORVIN', [['Smogcloud', 36], ['Venomaw', 36], ['Nocturne', 37]], {
            look: 'corvin',
            money: 60,
            smart: true,
            music: 'boss',
            intro: 'You took my LENS in BLOOMFIELD. You will not take this one. NYX needs time!',
            lose: 'Tch. Go on, then. See what happens when you face NYX.',
            after: '',
          }),
          sight: 3,
          afterWin: async (c) => c.hide('corvin'),
        },
        {
          id: 'nyx',
          x: 6,
          y: 2,
          dir: 'down',
          look: 'nyx',
          cond: not('observatoryCleared'),
          trainer: T('ob_nyx', 'BOSS', 'NYX', [['Nocturne', 38], ['Smogcloud', 38], ['Venomaw', 39], ['Duskwraith', 41]], {
            look: 'nyx',
            money: 80,
            smart: true,
            music: 'boss',
            potions: 1,
            intro: 'So you are the child who keeps ruining my plans. With the SKY LENS I can find the RIFT, and what sleeps beyond it will answer to the HOLLOW ORDER. Step aside!',
            lose: 'The crystals, the chime, the lens... each one slipped through my fingers because of you.',
            after: '',
          }),
          sight: 2,
          afterWin: async (c) => {
            await c.say(['NYX: The RIFT will open on its own one day, child. When it does, remember that I warned you.', 'NYX: HOLLOW ORDER, withdraw!']);
            await c.flash();
            c.hide('nyx');
            c.set('observatoryCleared');
            await c.say('NYX and the HOLLOW ORDER fled the OBSERVATORY!');
          },
        },
        {
          id: 'director',
          x: 9,
          y: 3,
          dir: 'left',
          look: 'scientist',
          talk: async (c) => {
            if (!c.flag('observatoryCleared')) {
              await c.say('DIRECTOR: They have the SKY LENS aimed at the northern sea! Stop them, please!');
              return;
            }
            if (!c.flag('gotWhistle')) {
              c.set('gotWhistle');
              await c.say(['DIRECTOR: You saved the OBSERVATORY and all of ASTRA! Please accept these.', 'DIRECTOR: The SKY WHISTLE calls a friendly bird to fly you to any town you have visited.']);
              await c.give('skywhistle');
              await c.say("DIRECTOR: And this MASTER POD was the ORDER's prize. It catches any Wildkin without fail. Use it well.");
              await c.give('masterpod');
              await c.say("DIRECTOR: ASTRA's GYM is open again too. ORIN has been waiting.");
              return;
            }
            await c.say('DIRECTOR: The SKY LENS shows storms gathering around the RIFT, north of DRIFTWOOD CAPE. Strange...');
          },
        },
      ],
      signs: [{ x: 4, y: 1, text: 'The great SKY LENS. It is aimed at a swirling storm far to the north.' }],
    }),
  );

  // ======================= ROUTE 13 =======================
  const r13 = makeMap({
    id: 'route13',
    name: 'ROUTE 13',
    legend: OUT,
    border: 'tree',
    music: 'route',
    outdoor: true,
    encounters: enc(0.1, 'Budling 22-26 20, Vinelet 22-26 20, Pursy 22-26 15, Skyroost 23-26 15, Dashbird 22-25 15, Hummaloon 22-25 10, Bladewing 24-26 5'),
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TT..,,,,,......,,,,,....,,,,TT',
      'TT..,,,,,......,,,,,....,,,,TT',
      'TT......TT..........TT......TT',
      'TT......TT..........TT......TT',
      'TT..........................TT',
      '::::::::::::::::::::::::::::::',
      '::::::::::::::::::::::::::::::',
      'TT..,,,,..........S..,,,,..TTT',
      'TT..,,,,.............,,,,..TTT',
      'TT.......,,,,,,.............TT',
      'TT..f....,,,,,,........f....TT',
      'TT..........................TT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    signs: [{ x: 18, y: 8, text: 'ROUTE 13   West: BLOOMFIELD   East: ASTRA CITY' }],
    npcs: [
      { id: 't1', x: 5, y: 3, dir: 'down', look: 'busker', trainer: T('r13_rio', 'BUSKER', 'RIO', [['Hummaloon', 26], ['Choralloon', 26]]), sight: 2 },
      { id: 't2', x: 22, y: 9, dir: 'left', look: 'lass', trainer: T('r13_eve', 'LASS', 'EVE', [['Pursy', 25], ['Puffmote', 26], ['Lunapuff', 27]]), sight: 3 },
      { id: 't3', x: 14, y: 12, dir: 'up', look: 'birdkeeper', trainer: T('r13_ash', 'BIRDKEEPER', 'ASH', [['Dashbird', 26], ['Skyroost', 26]]), sight: 2 },
    ],
  });
  const upW = building(r13, 11, 2, 5, 'grey', 'house');
  r13.warps.push(door(upW.x, upW.y, 'underpass_w', 3, 5));
  W.add(r13);
  W.add(gate('underpass_w', { map: 'route13', x: upW.x, y: upW.y + 1 }, 'underpass', 1));

  // ======================= BLOOMFIELD =======================
  const bf = makeMap({
    id: 'bloomfield',
    name: 'BLOOMFIELD',
    legend: OUT,
    border: 'tree',
    music: 'city',
    outdoor: true,
    fly: { x: 18, y: 12 },
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TT........................TT',
      'TT........................TT',
      'TT........................TT',
      'TT........................TT',
      'TT........................TT',
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
      'TT..:........::........:..TT',
      'TT..::::::::::::::::::::..TT',
      'TT.f.........::.........f.TT',
      'TT...F.......::.......F...TT',
      'TT.f.........::.........f.TT',
      'TT...........::...........TT',
      'TTTTTTTTTTTTT::TTTTTTTTTTTTT',
    ],
    signs: [{ x: 12, y: 19, text: 'BLOOMFIELD: The city of rainbow gardens.' }],
    npcs: [
      { id: 'c1', x: 22, y: 15, dir: 'down', look: 'girl', move: 'wander', talk: "MOSSA's LEAF Wildkin wilt against FLAME, FROST, GALE, TOXIN and SWARM moves." },
      { id: 'c2', x: 9, y: 20, dir: 'right', look: 'oldman', move: 'look', talk: 'The ARCADE across the street is always full of shady folks in hoods. Very suspicious.' },
      { id: 'c3', x: 14, y: 3, dir: 'down', look: 'racer', move: 'look', talk: 'WINDRUSH ROAD heads south from here, all downhill to MIRECOAST. Fastest ride in VARROW!' },
    ],
  });
  const bfStore = building(bf, 5, 1, 8, 'teal', 'mart');
  const bfArcade = building(bf, 16, 1, 7, 'purple', 'hall');
  const bfGym = building(bf, 5, 7, 7, 'green', 'gym');
  const bfHaven = building(bf, 16, 7, 5, 'red', 'haven');
  const bfKit = building(bf, 5, 13, 5, 'gold', 'house');
  const bfBreeder = building(bf, 16, 13, 5, 'teal', 'house');
  bf.warps.push(
    door(bfStore.x, bfStore.y, 'bloom_store', 5, 6),
    door(bfArcade.x, bfArcade.y, 'arcade', 5, 7),
    door(bfGym.x, bfGym.y, 'bloom_gym', 4, 13),
    door(bfHaven.x, bfHaven.y, 'bloom_haven', 4, 7),
    door(bfKit.x, bfKit.y, 'bloom_kit', 3, 7),
    door(bfBreeder.x, bfBreeder.y, 'bloom_breeder', 4, 7),
  );
  W.add(bf);
  W.add(havenInterior('bloom_haven', 'BLOOMFIELD HAVEN', { map: 'bloomfield', x: bfHaven.x, y: bfHaven.y + 1 }, [{ id: 'h1', x: 2, y: 5, dir: 'right', look: 'beauty', talk: 'The STORE sells TMs and evolution shards. Shards make some Wildkin evolve on the spot!' }]));
  W.add(
    makeMap({
      id: 'bloom_store',
      name: 'BLOOMFIELD STORE',
      legend: IN,
      border: 'void',
      music: 'haven',
      outdoor: false,
      rows: ['WWnWWWWWWnWW', '============', 'cccc====cccc', '============', '=BBB====BBB=', '============', 'p====mm====p'],
      warps: matWarps(5, 6, { map: 'bloomfield', x: bfStore.x, y: bfStore.y + 1 }),
      npcs: [
        {
          id: 'clerk1',
          x: 1,
          y: 1,
          dir: 'down',
          look: 'clerk',
          talk: async (c) => {
            await c.say('Medicine and pods, right here!');
            await c.shop(['pod', 'greatpod', 'ultrapod', 'potion', 'superpotion', 'hyperpotion', 'fullcure', 'revive', 'repel', 'superrepel']);
          },
        },
        {
          id: 'clerk2',
          x: 10,
          y: 1,
          dir: 'down',
          look: 'clerk',
          talk: async (c) => {
            await c.say('Battle boosters and TMs! Teach your Wildkin something new!');
            await c.shop(['xattack', 'xdefend', 'xspeed', 'xspecial', 'xaccuracy', 'tm01', 'tm02', 'tm03', 'tm04', 'tm07', 'tm09', 'tm20', 'tm27']);
          },
        },
        {
          id: 'clerk3',
          x: 6,
          y: 4,
          dir: 'down',
          look: 'beauty',
          talk: async (c) => {
            await c.say('Evolution shards, polished by hand! Use one on the right Wildkin and watch it change!');
            await c.shop(['cinder', 'ripple', 'spark', 'sprout']);
          },
        },
      ],
      signs: [
        { x: 1, y: 4, text: 'A display of TMs. Each one teaches a single move, then breaks.' },
        { x: 9, y: 4, text: 'Glittering shards in four colors. A note says: DUSK SHARDS ARE NOT SOLD, ONLY FOUND.' },
      ],
    }),
  );
  W.add(
    houseInterior(
      'bloom_kit',
      'HOUSE',
      { map: 'bloomfield', x: bfKit.x, y: bfKit.y + 1 },
      [
        {
          id: 'girl',
          x: 5,
          y: 4,
          dir: 'down',
          look: 'lass',
          talk: monGiver('gotKitmote', 'Kitmote', 25, 'My Kitmote had kits! I want this one to go on adventures. Would you take it?', 'KITMOTE changes when it touches a CINDER, RIPPLE or SPARK SHARD. Which will you choose?', 'Has your KITMOTE evolved yet? Each shard brings out a different side of it!'),
        },
      ],
      1,
    ),
  );
  W.add(
    houseInterior(
      'bloom_breeder',
      "BREEDER'S HOUSE",
      { map: 'bloomfield', x: bfBreeder.x, y: bfBreeder.y + 1 },
      [
        {
          id: 'breeder',
          x: 5,
          y: 3,
          dir: 'down',
          look: 'gardener',
          talk: async (c) => {
            if (c.flag('gotBreederStarter')) {
              await c.say('BREEDER: Raise it well! It came from PROF. FENN herself, you know.');
              return;
            }
            if (!c.s.badges.includes('BLOOM')) {
              await c.say('BREEDER: I raise partner Wildkin for PROF. FENN. I give one to every trainer who earns the BLOOM BADGE from MOSSA!');
              return;
            }
            const choices = [SP.SPROUTLE, SP.EMBERKIT, SP.SPLASHEL].filter((x) => x !== c.s.starter && x !== rivalStarter(c.s));
            const sp = choices[0];
            await c.say('BREEDER: The BLOOM BADGE! As promised, take this partner. It is the same kind {RIVAL} chose... we had a spare!');
            c.set('gotBreederStarter');
            c.set('gift:' + sp);
            await c.receiveMon(sp, 25);
          },
        },
      ],
      2,
    ),
  );
  W.add(
    makeMap({
      id: 'arcade',
      name: 'STARLIGHT ARCADE',
      legend: IN,
      border: 'void',
      music: 'city',
      outdoor: false,
      rows: ['WWnWWWWWWnWW', '%%%%%%%%%LzL', '%LL%LL%LL%%%', '%%%%%%%%%%%%', '%LL%LL%LL%%%', '%%%%%%%%%%%%', 'p%%%%%%%%%%p', '%%%%%mm%%%%%'],
      warps: [...matWarps(5, 7, { map: 'bloomfield', x: bfArcade.x, y: bfArcade.y + 1 }), door(10, 1, 'hideout1', 1, 2, 'down')],
      npcs: [
        {
          id: 'guardGrunt',
          x: 10,
          y: 2,
          dir: 'down',
          look: 'grunt',
          cond: not('tr:ar_grunt'),
          trainer: T('ar_grunt', 'HOLLOW', 'GRUNT', [['Coilkit', 26], ['Duskbat', 26], ['Smogpuff', 27]], {
            intro: 'Hey! Nothing behind me! Just a wall! A normal, boring wall! ...Okay fine, battle!',
            lose: 'Argh! Go ahead, see if I care!',
            after: '',
          }),
          sight: 1,
          afterWin: async (c) => {
            c.hide('guardGrunt');
            await c.say('The GRUNT ran off, revealing a hidden staircase!');
          },
        },
        {
          id: 'owner',
          x: 1,
          y: 1,
          dir: 'down',
          look: 'gentleman',
          talk: monGiver(
            'gotPixelon',
            'Pixelon',
            26,
            'You chased the ORDER out of my basement! As thanks, take my grand prize: a PIXELON, a Wildkin made of pure light!',
            'PIXELON was built in a lab, but it has a real heart. Treat it kindly.',
            'Business is booming now that the ORDER is gone!',
            (s) => !!s.flags.hideoutCleared,
            'Welcome to the STARLIGHT ARCADE! ...Please ignore the hooded folks in the back.',
          ),
        },
        { id: 'gambler', x: 3, y: 3, dir: 'up', look: 'gentleman', talk: 'I keep losing coins to this machine. I think it hates me.' },
      ],
      signs: [
        { x: 1, y: 2, text: 'A flashing game machine. You are not old enough to play.' },
        { x: 4, y: 4, text: 'A game machine. The screen shows a tiny Hummaloon dancing.' },
      ],
    }),
  );
  W.add(
    makeMap({
      id: 'hideout1',
      name: 'HIDEOUT B1',
      legend: IN,
      border: 'void',
      music: 'hideout',
      outdoor: false,
      escape: true,
      rows: [
        'WWWWWWWWWWWWWWWW',
        '=z====W=========',
        '======W===LL====',
        '==WW==W=========',
        '==WW======WWWW==',
        '==========W=====',
        'WWWW==WW==W==LL=',
        '======WW========',
        '=LL===========WW',
        '==========WW====',
        '=====WW=======z=',
        'WWWWWWWWWWWWWWWW',
      ],
      warps: [door(1, 1, 'arcade', 10, 2, 'down'), door(14, 10, 'hideout2', 1, 2, 'down')],
      items: [
        { id: 'hd1a', x: 15, y: 1, item: 'hyperpotion' },
        { id: 'hd1b', x: 0, y: 9, item: 'tm20' },
      ],
      npcs: [
        { id: 'g1', x: 4, y: 5, dir: 'right', look: 'grunt', trainer: T('hd_gr1', 'HOLLOW', 'GRUNT', [['Duskbat', 27], ['Venomaw', 28]]), sight: 4 },
        { id: 'g2', x: 12, y: 3, dir: 'down', look: 'grunt', trainer: T('hd_gr2', 'HOLLOW', 'GRUNT', [['Smogpuff', 28], ['Oozle', 28]]), sight: 3 },
        { id: 'g3', x: 7, y: 9, dir: 'right', look: 'grunt', trainer: T('hd_gr3', 'HOLLOW', 'GRUNT', [['Coilkit', 27], ['Nibbit', 27], ['Gnawlord', 28]]), sight: 3 },
      ],
    }),
  );
  W.add(
    makeMap({
      id: 'hideout2',
      name: 'HIDEOUT B2',
      legend: IN,
      border: 'void',
      music: 'hideout',
      outdoor: false,
      escape: true,
      rows: ['WWWWWWWWWWWWWW', '=z============', '==============', '==LL==WW==LL==', '==============', 'WWWW======WWWW', '==============', '=====tttt=====', '==============', 'WWWWWWWWWWWWWW'],
      warps: [door(1, 1, 'hideout1', 14, 9, 'up')],
      items: [{ id: 'hd2a', x: 13, y: 8, item: 'ultrapod', n: 3 }],
      npcs: [
        { id: 'g1', x: 11, y: 2, dir: 'left', look: 'grunt', trainer: T('hd_gr4', 'HOLLOW', 'GRUNT', [['Nocturne', 29], ['Smogpuff', 29]]), sight: 5 },
        {
          id: 'corvin',
          x: 7,
          y: 6,
          dir: 'up',
          look: 'corvin',
          cond: not('hideoutCleared'),
          trainer: T('hd_corvin', 'ADMIN', 'CORVIN', [['Smogpuff', 29], ['Venomaw', 30], ['Nocturne', 31]], {
            look: 'corvin',
            money: 60,
            smart: true,
            music: 'boss',
            intro: 'I am CORVIN, admin of the HOLLOW ORDER. This arcade funds our great work. And this SPECTRAL LENS will help us pry the CHIME from that tower!',
            lose: 'Impossible! The ORDER does not lose to children!',
            after: '',
          }),
          sight: 3,
          afterWin: async (c) => {
            await c.say(['CORVIN: Keep the wretched LENS. It only shows ghosts anyway.', 'CORVIN: SABLE is already at the BELL TOWER. You are too late, child.']);
            await c.give('lens');
            await c.flash();
            c.hide('corvin');
            c.set('hideoutCleared');
            await c.say('CORVIN escaped through a secret passage!');
          },
        },
      ],
    }),
  );
  W.add(
    gymInterior(
      'bloom_gym',
      'BLOOMFIELD GYM',
      'l',
      { map: 'bloomfield', x: bfGym.x, y: bfGym.y + 1 },
      [
        {
          id: 'mossa',
          x: 4,
          y: 2,
          dir: 'down',
          look: 'mossa',
          trainer: T('g4', 'LEADER', 'MOSSA', [['Tanglewick', 26], ['Snaptrap', 28], ['Wiltbloom', 29]], {
            look: 'mossa',
            money: 99,
            smart: true,
            music: 'boss',
            intro: "Welcome to BLOOMFIELD GYM. I'm MOSSA. Roots run deep here, and so does our resolve. Show me how you have grown!",
            lose: 'Splendid! You have grown such strong roots. Take the BLOOM BADGE.',
            after: '',
          }),
          sight: 0,
          afterWin: leaderAfter('BLOOM', ['tm24', 1], ['MOSSA: SUN LANCE, focused sunlight. Grand power, but you must rest after.', 'MOSSA: The BREEDER next door has been waiting to meet someone with this badge.']),
          talk: 'MOSSA: Grow steadily, and never forget the roots that hold you up.',
        },
        { id: 'gt1', x: 1, y: 6, dir: 'right', look: 'lass', trainer: T('g4_lin', 'LASS', 'LIN', [['Budling', 24], ['Wiltbloom', 25]]), sight: 4 },
        { id: 'gt2', x: 8, y: 10, dir: 'left', look: 'beauty', trainer: T('g4_holly', 'BEAUTY', 'HOLLY', [['Vinelet', 25], ['Snaptrap', 26]]), sight: 4 },
        { id: 'gt3', x: 8, y: 6, dir: 'left', look: 'gardener', trainer: T('g4_ian', 'PICNICKER', 'FERN', [['Nutlet', 25], ['Tanglewick', 25]], { look: 'gardener' }), sight: 2 },
        { id: 'guide', x: 7, y: 12, dir: 'left', look: 'boy', talk: "MOSSA's LEAF team wilts against FLAME, FROST, GALE, TOXIN and SWARM moves!" },
      ],
      'BLOOMFIELD GYM   LEADER: MOSSA   The gardener of unyielding roots!',
      0,
    ),
  );

  W.link('riverton', 'right', 'route9');
  W.link('route9', 'right', 'route10');
  W.link('route11', 'down', 'bellmoor');
  W.link('bellmoor', 'left', 'route12');
  W.link('route12', 'left', 'astra');
  W.link('astra', 'left', 'route13');
  W.link('route13', 'left', 'bloomfield');
}
