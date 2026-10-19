/**
 * Chapter 3: ROUTE 7, VOLTHAVEN PORT, the STARLIGHT FERRY, ROUTE 8 and BURROW TUNNEL.
 */
import { T } from '../../data/trainers';
import { building, CAVE, door, gymInterior, havenInterior, houseInterior, IN, makeMap, martInterior, matWarps, OUT, type World } from '../build';
import { enc, giver, intro, leaderAfter, pushBack } from '../common';
import type { Script } from '../types';

const dockGate: Script = async (c) => {
  if (c.flag('ferryGone')) {
    await c.say('The STARLIGHT FERRY has sailed. Only gulls remain at the end of the dock.');
    await pushBack(c, 'up');
    return;
  }
  if (!c.s.bag.ferryticket) {
    await c.say('SAILOR: Ahoy! Boarding the STARLIGHT FERRY needs a ticket. No ticket, no cruise!');
    await pushBack(c, 'up');
    return;
  }
  if (!c.flag('showedTicket')) {
    c.set('showedTicket');
    await c.say('SAILOR: A FERRY TICKET! Welcome aboard. The trainer cruise is in full swing!');
  }
};

const ferryLeaves: Script = async (c) => {
  if (c.s.bag.shears && !c.flag('ferryGone')) {
    c.set('ferryGone');
    c.g.sfx('exclaim');
    await c.say('BWOOOOOM! The STARLIGHT FERRY sounded its horn and sailed out to sea!');
  }
};

export function build(W: World) {
  // ======================= ROUTE 7 =======================
  W.add(
    makeMap({
      id: 'route7',
      name: 'ROUTE 7',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Fluffin 13-16 25, Pursy 13-16 25, Budling 13-16 20, Vinelet 13-16 20, Coilkit 14-16 10'),
      rows: [
        'TTTTTTTTT..TTTTTTTTT',
        'TT.......::.......TT',
        'TT.,,,,..::..,,,,.TT',
        'TT.,,,,..::..,,,,.TT',
        'TT.......::.......TT',
        'TT...TT..::..TT...TT',
        'TT...TT..::..TT...TT',
        'TT.......::.......TT',
        'TT,,,,...::...,,,,TT',
        'TT,,,,...::...,,,,TT',
        'TT.......::...S...TT',
        'TT__.....::.....__TT',
        'TT.......::.......TT',
        'TT..,,,,.::.,,,,..TT',
        'TT..,,,,.::.,,,,..TT',
        'TT.......::.......TT',
        'TTTT.....::.....TTTT',
        'TT.......::.......TT',
        'TT.,,,...::...,,,.TT',
        'TT.,,,...::...,,,.TT',
        'TT.......::.......TT',
        'TTTTTTTTT..TTTTTTTTT',
      ],
      signs: [{ x: 14, y: 10, text: 'ROUTE 7   North: RIVERTON CITY   South: VOLTHAVEN PORT' }],
      items: [{ id: 'r7great', x: 2, y: 8, item: 'greatpod', n: 2 }],
      npcs: [
        { id: 't1', x: 6, y: 4, dir: 'right', look: 'boy', trainer: T('r7_jay', 'CAMPER', 'JAY', [['Pursy', 16], ['Coilkit', 16]]), sight: 3 },
        { id: 't2', x: 13, y: 12, dir: 'left', look: 'girl', trainer: T('r7_una', 'PICNICKER', 'UNA', [['Budling', 15], ['Fluffin', 15], ['Budling', 16]]), sight: 3 },
        { id: 't3', x: 6, y: 17, dir: 'right', look: 'boy', trainer: T('r7_hal', 'BUG FAN', 'HAL', [['Hivecap', 15], ['Cocoonix', 15], ['Vespire', 17]]), sight: 3 },
        { id: 't4', x: 13, y: 20, dir: 'left', look: 'girl', trainer: T('r7_ria', 'PICNICKER', 'RIA', [['Vinelet', 17], ['Pursy', 17]]), sight: 3 },
      ],
    }),
  );

  // ======================= VOLTHAVEN PORT =======================
  const vh = makeMap({
    id: 'volthaven',
    name: 'VOLTHAVEN PORT',
    legend: OUT,
    border: 'tree',
    music: 'town',
    outdoor: true,
    fly: { x: 8, y: 13 },
    onEnter: ferryLeaves,
    fish: enc(1, 'Mudgill 10-20 30, Finnet 12-20 25, Pinchet 12-20 25, Starlet 12-18 20'),
    surf: enc(0.08, 'Jellune 15-25 80, Medusail 25-30 5, Quackle 20-25 15'),
    rows: [
      'TTTTTTTTTTTT..TTTTTTTTTTTT',
      'TT..........::..........TT',
      'TT..........::..........TT',
      'TT..........::..........TT',
      'TT..........::..........TT',
      'TT....S.B...::..........TT',
      'TT..::::::::::::::::::..TT',
      'TT..:.......::.......:..TT',
      'TT..:.......::.......:::::',
      'TT..:.......::.......:::::',
      'TT..:.......::.......:..TT',
      'TT..:.......::.......:..TT',
      'TT..:.......::.......:..TT',
      'TT..:.......::.......:..TT',
      'TT..::::::::::::::::::..TT',
      'TT..f.L.....::...S.L.f..TT',
      'TTssssssssssddssssssssssTT',
      'TT~~~~~~~~~~dd~~~~~~~~~~TT',
      'TT~~~~~~~~~~dd~~~~~~~~~~TT',
      'TT~~~~~~~~~~dd~~~~~~~~~~TT',
      'TT~~~~~~~~~~dd~~~~~~~~~~TT',
      'TT~~~~~~~~~~~~~~~~~~~~~~TT',
    ],
    warps: [door(12, 20, 'ferry', 8, 7, 'up'), door(13, 20, 'ferry', 9, 7, 'up')],
    signs: [
      { x: 6, y: 5, text: 'VOLTHAVEN GYM   LEADER: CASS   The lightning that strikes twice!' },
      { x: 17, y: 15, text: 'VOLTHAVEN PORT: Gateway to the open sea. STARLIGHT FERRY pier ahead.' },
    ],
    npcs: [
      { id: 'sailor', x: 11, y: 16, dir: 'right', look: 'sailor', move: 'look', talk: async (c) => c.say(c.flag('ferryGone') ? 'The ferry is off on its cruise around VARROW. It will be gone a long while.' : 'The STARLIGHT FERRY is hosting a trainer cruise. Ticket holders only!') },
      { id: 'kid', x: 13, y: 11, dir: 'down', look: 'youngster', move: 'look', talk: "Somebody let a hedge grow over the GYM's front step! CASS has been stuck inside for weeks. She doesn't seem to mind." },
      { id: 'eng', x: 7, y: 12, dir: 'right', look: 'engineer', move: 'look', talk: 'CASS used to be an engineer at the STORMWORKS power plant. Her VOLT Wildkin hate EARTH moves!' },
    ],
    triggers: [{ x: 12, y: 16, w: 2, run: dockGate, cond: () => true }],
  });
  const vhGym = building(vh, 5, 1, 7, 'gold', 'gym');
  const vhClub = building(vh, 15, 1, 5, 'purple', 'house');
  const vhHaven = building(vh, 6, 8, 5, 'red', 'haven');
  const vhMart = building(vh, 15, 8, 4, 'blue', 'mart');
  vh.warps.push(
    door(vhGym.x, vhGym.y, 'volthaven_gym', 4, 13),
    door(vhClub.x, vhClub.y, 'volthaven_club', 4, 7),
    door(vhHaven.x, vhHaven.y, 'volthaven_haven', 4, 7),
    door(vhMart.x, vhMart.y, 'volthaven_mart', 3, 7),
  );
  W.add(vh);
  W.add(havenInterior('volthaven_haven', 'VOLTHAVEN HAVEN', { map: 'volthaven', x: vhHaven.x, y: vhHaven.y + 1 }, [{ id: 'h1', x: 2, y: 5, dir: 'right', look: 'sailor', talk: 'Status problems like burns and poison wear down your Wildkin every turn. FULL CURE fixes them all!' }]));
  W.add(martInterior('volthaven_mart', 'VOLTHAVEN MARKET', { map: 'volthaven', x: vhMart.x, y: vhMart.y + 1 }, ['pod', 'greatpod', 'potion', 'superpotion', 'antidote', 'burnsalve', 'unnumb', 'wakebell', 'thawdrop', 'repel', 'escaperope', 'xspeed']));
  W.add(
    houseInterior(
      'volthaven_club',
      'WILDKIN FAN CLUB',
      { map: 'volthaven', x: vhClub.x, y: vhClub.y + 1 },
      [
        {
          id: 'chair',
          x: 5,
          y: 3,
          dir: 'down',
          look: 'gentleman',
          talk: giver(
            'clubGift',
            'tm07',
            1,
            [
              "CHAIRMAN: Welcome to the WILDKIN FAN CLUB! Shall I tell you about my beloved Pursy? It sleeps on my hat, you know. And it loves the smell of rain...",
              'CHAIRMAN: ...You listened to all of that! Such patience deserves a reward.',
            ],
            'CHAIRMAN: Come back anytime and I will tell you about my Pursy again!',
          ),
        },
        { id: 'fan1', x: 2, y: 4, dir: 'right', look: 'lass', talk: 'I adore Hummaloon. When they sing, my whole house falls asleep. Even the goldfish.' },
        { id: 'fan2', x: 7, y: 5, dir: 'left', look: 'boy', talk: 'Did you know Kitmote can evolve three different ways? It depends on which shard it touches!' },
      ],
      2,
      [
        { x: 0, y: 1, text: 'Fan letters to famous trainers, never sent.' },
        { x: 3, y: 1, text: 'A video of Wildkin dancing. Everyone in the club has watched it a hundred times.' },
      ],
    ),
  );
  W.add(
    gymInterior(
      'volthaven_gym',
      'VOLTHAVEN GYM',
      'v',
      { map: 'volthaven', x: vhGym.x, y: vhGym.y + 1 },
      [
        {
          id: 'cass',
          x: 4,
          y: 2,
          dir: 'down',
          look: 'cass',
          trainer: T('g3', 'LEADER', 'CASS', [['Coilorb', 21], ['Zappod', 22], ['Zapling', 22], ['Stormane', 25]], {
            look: 'cass',
            money: 99,
            smart: true,
            music: 'boss',
            intro: 'Finally, somebody trimmed that hedge! I am CASS. I used to wire storm towers for a living. Let us see how you handle a few thousand volts!',
            lose: 'Whoa! You short-circuited my whole team! The SPARK BADGE is yours, kid.',
            after: '',
          }),
          sight: 0,
          afterWin: leaderAfter('SPARK', ['tm12', 1], ['CASS: And take ARC BOLT. Arcing lightning, ninety power. Zap away!', 'CASS: East of RIVERTON, past the hedge, a tunnel leads to BELLMOOR. Take a lantern... or just be brave.']),
          talk: 'CASS: Electricity flows to the path of least resistance. You never take that path, do you?',
        },
        { id: 'gt1', x: 1, y: 6, dir: 'right', look: 'engineer', trainer: T('g3_wyn', 'ENGINEER', 'WYN', [['Zappod', 20], ['Coilorb', 20]]), sight: 4 },
        { id: 'gt2', x: 7, y: 9, dir: 'left', look: 'sailor', trainer: T('g3_ott', 'SAILOR', 'OTT', [['Zapling', 21], ['Pinchet', 20]]), sight: 4 },
        { id: 'gt3', x: 3, y: 4, dir: 'down', look: 'engineer', trainer: T('g3_bix', 'ENGINEER', 'BIX', [['Coilorb', 21], ['Zappod', 21]]), sight: 3 },
        { id: 'guide', x: 7, y: 12, dir: 'left', look: 'boy', talk: "CASS's VOLT team is helpless against EARTH moves. GALE types should stay far away!" },
      ],
      'VOLTHAVEN GYM   LEADER: CASS   The lightning that strikes twice!',
      2,
    ),
  );

  // ======================= STARLIGHT FERRY =======================
  W.add(
    makeMap({
      id: 'ferry',
      name: 'STARLIGHT FERRY',
      legend: IN,
      border: 'void',
      music: 'haven',
      outdoor: false,
      rows: [
        'WWWWnWWWWnWWWWnWWW',
        '..................',
        '.tt..tt.....tt..z.',
        '..................',
        'WWWW..WWWWWW..WWWW',
        '..................',
        '.tt...........tt..',
        '..................',
        'p.......mm.......p',
      ],
      warps: [...matWarps(8, 8, { map: 'volthaven', x: 12, y: 19 }), door(16, 2, 'ferry_cabin', 3, 6, 'up')],
      npcs: [
        { id: 's1', x: 4, y: 5, dir: 'right', look: 'sailor', trainer: T('fr_bo', 'SAILOR', 'BOSUN', [['Pinchet', 19], ['Sealpup', 19]]), sight: 4 },
        { id: 's2', x: 13, y: 7, dir: 'left', look: 'sailor', trainer: T('fr_rex', 'SAILOR', 'REX', [['Finnet', 18], ['Jellune', 19], ['Pinchet', 19]]), sight: 4 },
        { id: 'g1', x: 9, y: 1, dir: 'down', look: 'gentleman', trainer: T('fr_hugo', 'GENTLEMAN', 'HUGO', [['Pyropup', 20], ['Pursy', 19]]), sight: 2 },
        { id: 'b1', x: 2, y: 3, dir: 'right', look: 'beauty', trainer: T('fr_ina', 'BEAUTY', 'INA', [['Hummaloon', 19], ['Budling', 20]]), sight: 3 },
        { id: 'rival', x: 15, y: 1, dir: 'down', look: 'rival', cond: (s) => !s.flags['tr:rival4'] },
        { id: 'chef', x: 1, y: 7, dir: 'right', look: 'oldman', move: 'look', talk: 'The captain is upstairs in his cabin. He has not left it all cruise!' },
      ],
      triggers: [
        {
          x: 13,
          y: 2,
          w: 3,
          h: 2,
          cond: (s) => !s.flags['tr:rival4'],
          run: async (c) => {
            await c.emote('rival');
            c.faceToward('rival');
            await c.say(intro('rival4'));
            const won = await c.battle('rival4');
            if (!won) return;
            await c.say("{RIVAL}: The captain gave me nothing but a lecture. Maybe he'll like you better. Later!");
            await c.walkNpc('rival', ['down', 'down', 'left', 'left', 'down', 'down'], 2);
            c.hide('rival');
          },
        },
      ],
    }),
  );
  W.add(
    makeMap({
      id: 'ferry_cabin',
      name: "CAPTAIN'S CABIN",
      legend: IN,
      border: 'void',
      music: 'haven',
      outdoor: false,
      rows: ['WWnWWnWW', 'B..tt..B', '........', '.d....p.', '........', 'p.......', '...z....'],
      warps: [door(3, 6, 'ferry', 16, 3, 'down')],
      npcs: [
        {
          id: 'captain',
          x: 4,
          y: 3,
          dir: 'down',
          look: 'captain',
          talk: giver(
            'gotShears',
            'shears',
            1,
            [
              'CAPTAIN: Hm? LORNE sent you? Ha! That old landlubber never could stand the waves.',
              "CAPTAIN: I used to tend the ferry's garden with these, but there's no garden at sea. Take them. They trim any hedge in VARROW!",
            ],
            'CAPTAIN: Face a hedge and press A to trim it with the HEDGE SHEARS. Now, I must chart our course!',
          ),
        },
      ],
      signs: [{ x: 3, y: 1, text: 'Sea charts. A storm labeled THE RIFT swirls off the northern cape.' }],
    }),
  );

  // ======================= ROUTE 8 =======================
  W.add(
    makeMap({
      id: 'route8',
      name: 'ROUTE 8',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Pursy 14-18 25, Pecklet 14-17 20, Coilkit 14-17 15, Dreamtap 14-18 15, Scrapape 15-17 15, Dunemole 15-17 10'),
      rows: [
        'TTTTTTTTTTTTTTTTTTTTTTMMMMMMMM',
        'TT..,,,,,....,,,,,....MMMMMMMM',
        'TT..,,,,,....,,,,,....MMMCMMMM',
        'TT....TT.......TT.....::::::MM',
        'TT....TT..,,,..TT.....:.....MM',
        'TT........,,,.........:.....MM',
        'TT..::::::::::::::::::::....MM',
        '::::::.........,,,,,........MM',
        '::::::....S....,,,,,....,,,.MM',
        'TT.......TTTT...........,,,.MM',
        'TT..f....TTTT....__________.MM',
        'TT.....................f....MM',
        'TT..,,,,,,.........,,,,,....MM',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      ],
      warps: [door(25, 2, 'burrow', 22, 8, 'left')],
      signs: [{ x: 10, y: 8, text: 'ROUTE 8   West: VOLTHAVEN PORT   East cave: BURROW TUNNEL' }],
      items: [
        { id: 'r8xatk', x: 26, y: 12, item: 'xattack' },
        { id: 'r8super', x: 2, y: 1, item: 'superpotion', n: 2 },
      ],
      npcs: [
        { id: 't1', x: 8, y: 2, dir: 'down', look: 'youngster', trainer: T('r8_eli', 'YOUNGSTER', 'ELI', [['Pursy', 18], ['Coilkit', 18]]), sight: 3 },
        { id: 't2', x: 14, y: 5, dir: 'left', look: 'engineer', trainer: T('r8_ray', 'ENGINEER', 'RAY', [['Zapling', 19], ['Coilorb', 19]]), sight: 4 },
        { id: 't3', x: 18, y: 9, dir: 'left', look: 'youngster', trainer: T('r8_cy', 'YOUNGSTER', 'CY', [['Dreamtap', 19], ['Scrapape', 19]]), sight: 3 },
        { id: 't4', x: 21, y: 4, dir: 'down', look: 'scholar', trainer: T('r8_vin', 'SCHOLAR', 'VIN', [['Dreamtap', 18], ['Psyquill', 19], ['Dreamtap', 19]]), sight: 2 },
        { id: 't5', x: 6, y: 12, dir: 'right', look: 'lass', trainer: T('r8_fey', 'LASS', 'FEY', [['Hummaloon', 18], ['Pursy', 19], ['Puffmote', 19]]), sight: 4 },
      ],
    }),
  );

  // ======================= BURROW TUNNEL =======================
  W.add(
    makeMap({
      id: 'burrow',
      name: 'BURROW TUNNEL',
      legend: CAVE,
      border: 'cavewall',
      music: 'cave',
      outdoor: false,
      escape: true,
      encounters: enc(0.08, 'Dunemole 15-22 90, Quarrymole 25-29 10'),
      rows: [
        'wwwwwwwwwwwwwwwwwwwwwwwwww',
        'wwwewwwwwwwwwwwwwwwwwwwwww',
        'wwgggwwwwwwwwwwwwwwwwwwwww',
        'wwgggwwwwwwwwwwwwwwwwwwwww',
        'wwwKwwwwwwwwwwwwwwwwwwwwww',
        'wwgggggggwwwgggggggwwwwwww',
        'wgggRggggggggggRgggggggggw',
        'wgggggggwwwwggggggwwwggggw',
        'wggRgggggggggggggggggggegw',
        'wwwwwwwwwwwwwwwwwwwwwwwwww',
      ],
      warps: [door(3, 1, 'route2', 17, 3, 'down'), door(23, 8, 'route8', 25, 3, 'down')],
      items: [{ id: 'btmax', x: 1, y: 6, item: 'maxrepel' }],
      npcs: [{ id: 'digger', x: 10, y: 6, dir: 'down', look: 'hiker', move: 'look', talk: 'A cracked boulder seals the far end of the tunnel. With a ROCK PICK you could break it.' }],
    }),
  );

  W.link('riverton', 'down', 'route7');
  W.link('route7', 'down', 'volthaven');
  W.link('volthaven', 'right', 'route8');
}
