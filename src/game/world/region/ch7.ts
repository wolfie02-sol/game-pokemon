/**
 * Chapter 7: the road to the SUMMIT. ROUTES 21-24, GALEWICK, VICTORY CAVE, the
 * SUMMIT LEAGUE (ELITE FOUR and CHAMPION), and the post-game RIFT beyond ROUTE 25.
 */
import { SP } from '../../data/species';
import { T } from '../../data/trainers';
import { saveGame } from '../../systems/save';
import { healMon } from '../../systems/mon';
import { EndingScene } from '../../scenes/ending';
import { building, CAVE, door, gymInterior, havenInterior, houseInterior, IN, makeMap, martInterior, matWarps, OUT, SNOW, type World } from '../build';
import { enc, giver, intro, leaderAfter, not, pushBack } from '../common';
import type { MapDef, Script } from '../types';

const E4 = ['e4_1', 'e4_2', 'e4_3', 'e4_4', 'champ'];

const leagueLobbyEnter: Script = async (c) => {
  // the league can be challenged again and again after becoming champion
  if (c.flag('champion')) for (const id of E4) c.set('tr:' + id, false);
};

export function build(W: World) {
  // ======================= ROUTE 21 =======================
  W.add(
    makeMap({
      id: 'route21',
      name: 'ROUTE 21',
      legend: OUT,
      border: 'tree',
      music: 'route',
      outdoor: true,
      encounters: enc(0.1, 'Skyroost 32-36 15, Purrloft 32-36 15, Wiltbloom 32-36 15, Snaptrap 32-36 15, Hypnotapir 33-36 10, Tanglewick 32-35 10, Venomaw 33-36 10, Augurowl 32-35 10'),
      rows: [
        'TTTTTTTTT..TTTTTTTTT',
        'TT.......::.......TT',
        'TT.,,,,..::..,,,,.TT',
        'TT.,,,,..::..,,,,.TT',
        'TT.......::.......TT',
        'TT__.....::.....__TT',
        'TT.......::.......TT',
        'TT..,,,,.::.,,,,..TT',
        'TT..,,,,.::.,,,,..TT',
        'TT.......::...S...TT',
        'TT..TT...::...TT..TT',
        'TT..TT...::...TT..TT',
        'TT.......::.......TT',
        'TT,,,,...::...,,,,TT',
        'TT,,,,...::...,,,,TT',
        'TT.......::.......TT',
        'TTTT.....::.....TTTT',
        'TT.......::.......TT',
        'TT.,,,...::...,,,.TT',
        'TT.,,,...::...,,,.TT',
        'TT.......::.......TT',
        'TT___....::....___TT',
        'TT.......::.......TT',
        'TT..f....::....f..TT',
        'TTTTTTTTT..TTTTTTTTT',
      ],
      signs: [{ x: 14, y: 9, text: 'ROUTE 21   North: GALEWICK, through the snow   South: ASTRA CITY' }],
      items: [{ id: 'r21tm', x: 17, y: 13, item: 'tm04' }],
      npcs: [
        { id: 't1', x: 6, y: 4, dir: 'right', look: 'beauty', trainer: T('r21_ivy', 'BEAUTY', 'IVY', [['Wiltbloom', 35], ['Snaptrap', 35], ['Tanglewick', 36]]), sight: 3 },
        { id: 't2', x: 13, y: 12, dir: 'left', look: 'gentleman', trainer: T('r21_lord', 'GENTLEMAN', 'LORD', [['Purrloft', 36], ['Pyrehound', 37]]), sight: 3 },
        { id: 't3', x: 6, y: 17, dir: 'right', look: 'scholar', trainer: T('r21_ada', 'SCHOLAR', 'MIRA', [['Hypnotapir', 36], ['Augurowl', 36]]), sight: 3 },
        { id: 't4', x: 13, y: 22, dir: 'left', look: 'tamer', trainer: T('r21_tam', 'TAMER', 'BRUNO', [['Venomaw', 36], ['Rhinoxen', 37]]), sight: 3 },
      ],
    }),
  );

  // ======================= ROUTE 22 (snow) =======================
  W.add(
    makeMap({
      id: 'route22',
      name: 'ROUTE 22',
      legend: SNOW,
      border: 'snowtree',
      music: 'snow',
      outdoor: true,
      encounters: enc(0.1, 'Sealpup 33-37 20, Skyroost 34-37 15, Purrloft 34-37 15, Rhinoxen 34-38 15, Lazyloth 34-37 10, Frostwaltz 34-36 5, Clodcalf 33-36 15, Thistlet 33-36 5'),
      rows: [
        'TTTTTTTTT..TTTTTTTTT',
        'TT.......::.......TT',
        'TT,,,,...::...,,,,TT',
        'TT,,,,...::...,,,,TT',
        'TT.......::.......TT',
        'TT..TT...::...TT..TT',
        'TT..TT...::...TT..TT',
        'TT.......::.......TT',
        'TT.,,,,..::..,,,,.TT',
        'TT.,,,,..::..,,,,.TT',
        'TT.......::..S....TT',
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
        'TTTTTTTTT..TTTTTTTTT',
      ],
      signs: [{ x: 13, y: 10, text: 'ROUTE 22   GALEWICK lies ahead. Dress warmly!' }],
      items: [{ id: 'r22a', x: 2, y: 2, item: 'thawdrop', n: 3 }],
      npcs: [
        { id: 't1', x: 6, y: 7, dir: 'right', look: 'skier', trainer: T('r22_bea', 'HIKER', 'BEA', [['Sealpup', 37], ['Glacieal', 38]], { look: 'skier' }), sight: 3 },
        { id: 't2', x: 13, y: 15, dir: 'left', look: 'skier', trainer: T('r22_tor', 'HIKER', 'TOR', [['Rhinoxen', 38], ['Lazyloth', 38]], { look: 'skier' }), sight: 3 },
        { id: 't3', x: 6, y: 20, dir: 'right', look: 'birdkeeper', trainer: T('r22_wil', 'BIRDKEEPER', 'WILLA', [['Tempestrel', 38], ['Lancebeak', 37]]), sight: 3 },
      ],
    }),
  );

  // ======================= GALEWICK =======================
  const gw = makeMap({
    id: 'galewick',
    name: 'GALEWICK',
    legend: SNOW,
    border: 'snowtree',
    music: 'snow',
    outdoor: true,
    fly: { x: 5, y: 13 },
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
      'TT.L......::.....L..TT',
      'TT........::........TT',
      'TTTTTTTTTT::TTTTTTTTTT',
    ],
    signs: [{ x: 16, y: 14, text: 'GALEWICK: The town where the winds are born.' }],
    npcs: [
      { id: 'vguard', x: 9, y: 1, dir: 'down', look: 'guard', talk: async (c) => c.say(c.s.badges.length >= 8 ? 'VICTORY CAVE lies north. The SUMMIT awaits you, champion-to-be!' : 'Beyond here is ROUTE 23 and VICTORY CAVE. Only trainers with all eight badges may pass.') },
      { id: 'windgirl', x: 12, y: 9, dir: 'down', look: 'girl', move: 'wander', talk: "ISOLDE trains in the blizzard every morning. Her FROST Wildkin hate FLAME, BRAWL, STONE and... uh, the other one. Steel? No, that's not a type!" },
      { id: 'elder', x: 8, y: 15, dir: 'right', look: 'oldman', move: 'look', talk: 'The GYM only opens for trainers with seven badges. ISOLDE does not waste time on the unready.' },
    ],
    triggers: [
      {
        x: 10,
        y: 1,
        w: 2,
        cond: (s) => s.badges.length < 8,
        run: async (c) => {
          await c.say('GUARD: Halt! You need all eight BADGES to walk ROUTE 23.');
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
    { ...door(gwGym.x, gwGym.y, 'gale_gym', 4, 13), cond: (s) => s.badges.length >= 7, locked: 'The GYM door is frozen shut. A sign reads: CHALLENGERS NEED SEVEN BADGES. - ISOLDE' },
    door(gwHouse.x, gwHouse.y, 'gale_house', 3, 7),
    door(gwHaven.x, gwHaven.y, 'gale_haven', 4, 7),
    door(gwMart.x, gwMart.y, 'gale_mart', 3, 7),
  );
  W.add(gw);
  W.add(havenInterior('gale_haven', 'GALEWICK HAVEN', { map: 'galewick', x: gwHaven.x, y: gwHaven.y + 1 }, [{ id: 'gh1', x: 7, y: 5, dir: 'left', look: 'skier', talk: 'The CHAMPION, ELOWEN, uses a bit of everything. Bring a balanced team!' }]));
  W.add(martInterior('gale_mart', 'GALEWICK MARKET', { map: 'galewick', x: gwMart.x, y: gwMart.y + 1 }, ['ultrapod', 'hyperpotion', 'maxpotion', 'fullrestore', 'fullcure', 'revive', 'maxrepel', 'escaperope', 'thawdrop']));
  W.add(
    houseInterior('gale_house', 'HOUSE', { map: 'galewick', x: gwHouse.x, y: gwHouse.y + 1 }, [
      {
        id: 'scholar',
        x: 5,
        y: 4,
        dir: 'down',
        look: 'scholar',
        talk: giver('ultraGift', 'ultrapod', 5, 'A traveler! I study rare Wildkin. If you meet one of the legendary birds, you will need these.', 'The harder a Wildkin is to catch, the better the pod you need. ULTRA PODS work wonders.'),
      },
    ]),
  );
  W.add(
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
          trainer: T('g8', 'LEADER', 'ISOLDE', [['Glacieal', 45], ['Frostwaltz', 46], ['Dozelord', 46], ['Pearlfort', 47], ['Glidelyn', 49]], {
            look: 'isolde',
            money: 99,
            smart: true,
            music: 'boss',
            potions: 2,
            intro: 'The wind told me you were coming. I am ISOLDE. Seven badges... Let us see if you can stand in a true blizzard.',
            lose: 'The storm has passed, and you still stand. The FROST BADGE is yours. All eight!',
            after: '',
          }),
          sight: 0,
          afterWin: leaderAfter('FROST', ['tm05', 1], ['ISOLDE: GLACIER BEAM. A beam of pure winter.', 'ISOLDE: With eight badges, ROUTE 23 and VICTORY CAVE are open to you. At the top, the SUMMIT LEAGUE waits.']),
          talk: 'ISOLDE: The wind does not stop for anyone. Neither should you.',
        },
        { id: 'gt1', x: 1, y: 6, dir: 'right', look: 'skier', trainer: T('g8_bea', 'HIKER', 'SNOW', [['Sealpup', 44], ['Glacieal', 45]], { look: 'skier' }), sight: 4 },
        { id: 'gt2', x: 8, y: 9, dir: 'left', look: 'skier', trainer: T('g8_tor', 'HIKER', 'FLURRY', [['Frostwaltz', 44], ['Pearlfort', 45]], { look: 'skier' }), sight: 4 },
        { id: 'gt3', x: 4, y: 6, dir: 'down', look: 'beauty', trainer: T('g8_ice', 'BEAUTY', 'CRYSTAL', [['Dozelord', 45], ['Mallarch', 45]]), sight: 3 },
        { id: 'guide3', x: 7, y: 12, dir: 'left', look: 'boy', talk: "ISOLDE's FROST team melts against FLAME, BRAWL and STONE moves. Her ice beams hurt LEAF, EARTH, GALE and WYRM types!" },
      ],
      'GALEWICK GYM   LEADER: ISOLDE   The eye of the storm!',
      1,
    ),
  );

  // ======================= ROUTE 23 =======================
  W.add(
    makeMap({
      id: 'route23',
      name: 'ROUTE 23',
      legend: SNOW,
      border: 'cliff',
      music: 'snow',
      outdoor: true,
      encounters: enc(0.1, 'Lancebeak 40-44 20, Tempestrel 42-44 10, Rhinoxen 40-44 15, Venomaw 40-44 15, Purrloft 40-44 15, Furyape 40-43 15, Galesprint 40-43 10'),
      rows: [
        'MMMMMMMMMMMMMMMMMMMM',
        'MMMMMMMMMCMMMMMMMMMM',
        'MM.......:........MM',
        'MM.,,,,..:...,,,,.MM',
        'MM.,,,,..:...,,,,.MM',
        'MM.......:........MM',
        'MM.......::.......MM',
        'MM..RR...::...RR..MM',
        'MM.......::.......MM',
        'MM.,,,,..::..,,,,.MM',
        'MM.,,,,..::..,,,,.MM',
        'MM.......::...S...MM',
        'MM__.....::.....__MM',
        'MM.......::.......MM',
        'MM..,,,,.::.,,,,..MM',
        'MM..,,,,.::.,,,,..MM',
        'MM.......::.......MM',
        'MM.......::.......MM',
        'MMMMMMMMM..MMMMMMMMM',
      ],
      warps: [door(9, 1, 'vcave1', 11, 16, 'up')],
      signs: [{ x: 14, y: 11, text: 'ROUTE 23   VICTORY CAVE ahead. Only the strong reach the SUMMIT.' }],
      npcs: [
        { id: 'rival', x: 9, y: 3, dir: 'down', look: 'rival', cond: (s) => !s.flags['tr:rival7'] },
        { id: 't1', x: 6, y: 13, dir: 'right', look: 'ace', trainer: T('r23_vera', 'ACE', 'VERA', [['Stormane', 44], ['Lunamoth', 44], ['Bulwfrog', 45]]), sight: 3 },
        { id: 't2', x: 13, y: 16, dir: 'left', look: 'ace', trainer: T('r23_otto', 'ACE', 'OTTO', [['Megalith', 45], ['Magmole', 44], ['Ironox', 45]]), sight: 3 },
      ],
      triggers: [
        {
          x: 9,
          y: 6,
          w: 2,
          cond: (s) => !s.flags['tr:rival7'],
          run: async (c) => {
            await c.emote('rival');
            await c.walkNpc('rival', ['down', 'down']);
            if (c.s.x === 10) c.face('rival', 'right');
            c.facePlayer(c.s.x === 10 ? 'left' : 'up');
            await c.say(intro('rival7'));
            const won = await c.battle('rival7');
            if (!won) return;
            await c.say(['{RIVAL}: ...You know, back in the lab, I thought I picked the better partner.', "{RIVAL}: Turns out it was never about the pick. Go on, {PLAYER}. Show the LEAGUE what HEARTHVALE is made of!"]);
            await c.walkNpc('rival', ['down', 'down', 'down', 'down'], 2);
            c.hide('rival');
          },
        },
      ],
    }),
  );

  // ======================= VICTORY CAVE =======================
  const vEnc = enc(0.08, 'Bouldrake 40-44 20, Graniteel 40-44 15, Quarrymole 40-44 10, Brawnox 40-44 15, Nocturne 40-44 15, Ironox 42-45 10, Bonehound 41-44 10, Jabster 42-44 3, Kickwell 42-44 2');
  W.add(
    makeMap({
      id: 'vcave1',
      name: 'VICTORY CAVE',
      legend: CAVE,
      border: 'cavewall',
      music: 'cave',
      outdoor: false,
      escape: true,
      encounters: vEnc,
      rows: [
        'wwwwwwwwwwwwwwwwwwwwwwww',
        'wggggggggwwwwwwwwwgggggw',
        'wgRgggggggggggggggggRhgw',
        'wgggwwwwgggwwwwgggggggww',
        'wgggwwwwgggwwwwggwwwwwww',
        'wggggggggggggggggggggggw',
        'wwwwwwKwwwwwwwwwwwKwwwww',
        'wggggggggggwwwgggggggggw',
        'wgRgggggggggggggggRggggw',
        'wggggwwwwgggggwwwwgggggw',
        'wggggwwwwgggggwwwwggg*gw',
        'wggggggggggRgggggggggggw',
        'wwwwwgggggggggggggwwwwww',
        'wggggggggwwwwwwgggggggww',
        'wgRggggggwwwwwwgggggRggw',
        'wggggggggggggggggggggggw',
        'wwwwwwwwwwwggwwwwwwwwwww',
        'wwwwwwwwwwwewwwwwwwwwwww',
      ],
      warps: [door(11, 17, 'route23', 9, 2, 'down'), door(21, 2, 'vcave2', 21, 2, 'down')],
      items: [
        { id: 'vc1a', x: 1, y: 1, item: 'tm14' },
        { id: 'vc1b', x: 22, y: 15, item: 'maxrevive' },
        { id: 'vc1c', x: 1, y: 13, item: 'fullrestore' },
      ],
      npcs: [
        { id: 't1', x: 8, y: 11, dir: 'right', look: 'blackbelt', trainer: T('vc_bk', 'BLACKBELT', 'GORO', [['Titanox', 45], ['Bonehound', 44]]), sight: 4 },
        { id: 't2', x: 15, y: 8, dir: 'left', look: 'ace', trainer: T('vc_ace1', 'ACE', 'NAIA', [['Clawlord', 45], ['Gulpvine', 45], ['Pyrehound', 46]]), sight: 4 },
        { id: 't3', x: 4, y: 2, dir: 'right', look: 'ace', trainer: T('vc_ace2', 'ACE', 'DORIAN', [['Medusail', 45], ['Blazesteed', 46]]), sight: 4 },
      ],
    }),
  );
  W.add(
    makeMap({
      id: 'vcave2',
      name: 'VICTORY CAVE B1',
      legend: CAVE,
      border: 'cavewall',
      music: 'cave',
      outdoor: false,
      escape: true,
      encounters: vEnc,
      rows: [
        'wwwwwwwwwwwwwwwwwwwwwwww',
        'wwwwwwwwwewwwwwwwwwggggw',
        'wggggggggggggggggggggugw',
        'wgRggggwwwwwwwggggRggggw',
        'wggggggwwwwwwwgggggggggw',
        'wwwKwwwwgggggggwwwwwwKww',
        'wggggggggggRgggggggggggw',
        'wggg~~~~gggggggg~~~~gggw',
        'wggg~~~~ggggRggg~~~~gggw',
        'wggggggggggggggggggggggw',
        'wwwwwwwwwwwwwwwwwwwwwwww',
      ],
      warps: [door(21, 2, 'vcave1', 21, 2, 'down'), door(9, 1, 'route24', 9, 14, 'up')],
      items: [
        { id: 'vc2a', x: 1, y: 6, item: 'ultrapod', n: 3 },
        { id: 'vc2b', x: 22, y: 9, item: 'elixir' },
      ],
      npcs: [
        { id: 't1', x: 18, y: 4, dir: 'left', look: 'ace', trainer: T('vc_ace3', 'ACE', 'SELENE', [['Starmind', 46], ['Oracleon', 46], ['Glacieal', 46]]), sight: 4 },
        { id: 't2', x: 6, y: 9, dir: 'right', look: 'tamer', trainer: T('vc_tam', 'TAMER', 'HAAKON', [['Ironox', 46], ['Armadrill', 46], ['Wildbull', 47]]), sight: 5 },
      ],
    }),
  );

  // ======================= ROUTE 24 and the SUMMIT =======================
  W.add(
    makeMap({
      id: 'route24',
      name: 'ROUTE 24',
      legend: SNOW,
      border: 'cliff',
      music: 'snow',
      outdoor: true,
      rows: [
        'MMMMMMMMM..MMMMMMMMM',
        'MM.......::.......MM',
        'MM..TT...::...TT..MM',
        'MM..TT...::...TT..MM',
        'MM.......::.......MM',
        'MM.f.....::.....f.MM',
        'MM.......::.......MM',
        'MM..L....::....L..MM',
        'MM.......::.......MM',
        'MM.......::.......MM',
        'MM..TT...::...TT..MM',
        'MM..TT...::...TT..MM',
        'MM.......::.......MM',
        'MMMMMMMM.::.MMMMMMMM',
        'MMMMMMMMM:MMMMMMMMMM',
        'MMMMMMMMMCMMMMMMMMMM',
      ],
      warps: [door(9, 15, 'vcave2', 9, 2, 'down')],
      signs: [],
      npcs: [],
    }),
  );
  const sm = makeMap({
    id: 'summit',
    name: 'SUMMIT PLATEAU',
    legend: SNOW,
    border: 'cliff',
    music: 'league',
    outdoor: true,
    fly: { x: 9, y: 9 },
    rows: [
      'MMMMMMMMMMMMMMMMMMMM',
      'MM................MM',
      'MM................MM',
      'MM................MM',
      'MM................MM',
      'MM.......::.......MM',
      'MM.L.....::.....L.MM',
      'MM.......::.......MM',
      'MM.......::.......MM',
      'MM.......::.......MM',
      'MM.......::.......MM',
      'MMMMMMMMM..MMMMMMMMM',
    ],
    signs: [],
  });
  const league = building(sm, 6, 1, 8, 'gold', 'hall');
  sm.warps.push(door(league.x, league.y, 'league', 4, 6));
  W.add(sm);
  W.add(
    makeMap({
      id: 'league',
      name: 'SUMMIT LEAGUE',
      legend: IN,
      border: 'void',
      music: 'league',
      outdoor: false,
      rows: ['WWWWzzWWWW', '%%%%gg%%%%', '%%%%gg%%%%', '%%%%gg%%%%', 'p%%%gg%%%p', '%%%%gg%%%%', '%%%%mm%%%%'],
      warps: [...matWarps(4, 6, { map: 'summit', x: league.x, y: league.y + 1 }), door(4, 0, 'e4_1', 4, 7, 'up'), door(5, 0, 'e4_1', 4, 7, 'up')],
      havenSpot: { x: 4, y: 4 },
      onEnter: leagueLobbyEnter,
      npcs: [
        { id: 'keeper', x: 1, y: 2, dir: 'right', look: 'keeper', talk: async (c) => c.heal() },
        {
          id: 'clerk',
          x: 8,
          y: 2,
          dir: 'left',
          look: 'clerk',
          talk: async (c) => {
            await c.say('Final supplies before the ELITE FOUR!');
            await c.shop(['ultrapod', 'maxpotion', 'fullrestore', 'fullcure', 'revive', 'maxrepel']);
          },
        },
        { id: 'guard', x: 6, y: 1, dir: 'down', look: 'guard', talk: 'Beyond these stairs wait the ELITE FOUR and the CHAMPION. Once you go up, there is no turning back until you win, or fall.' },
      ],
      signs: [],
    }),
  );

  const room = (id: string, name: string, member: { id: string; look: string; trainer: string; win: string }, next: string): MapDef =>
    makeMap({
      id,
      name,
      legend: IN,
      border: 'void',
      music: 'league',
      outdoor: false,
      rows: ['WWWWzWWWW', '%%%%g%%%%', '%o%%g%%o%', '%%%%g%%%%', '%%%%g%%%%', '%o%%g%%o%', '%%%%g%%%%', '%%%%g%%%%', 'WWWWWWWWW'],
      warps: [{ ...door(4, 0, next, next === 'hall' ? 4 : 4, 7, 'up'), cond: (s) => !!s.flags['tr:' + member.trainer], locked: 'The door will not open until you win.' }],
      npcs: [
        {
          id: member.id,
          x: 4,
          y: 1,
          dir: 'down',
          look: member.look,
          trainer: member.trainer,
          sight: 6,
          // once beaten they stand aside (below), so coming back after a loss never finds the stairs blocked
          cond: (s) => !s.flags['tr:' + member.trainer],
          afterWin: async (c) => {
            await c.say(member.win);
            await c.walkNpc(member.id, ['right']);
            c.face(member.id, 'left');
          },
        },
        {
          id: member.id + '_aside',
          x: 5,
          y: 1,
          dir: 'left',
          look: member.look,
          cond: (s) => !!s.flags['tr:' + member.trainer],
          talk: member.win || 'Go on. The CHAMPION is watching.',
        },
      ],
    });

  T('e4_1', 'ELITE FOUR', 'THORNE', [['Bulwfrog', 50], ['Jabster', 51], ['Kickwell', 51], ['Furyape', 50], ['Titanox', 53]], {
    look: 'thorne',
    money: 99,
    smart: true,
    music: 'boss',
    potions: 2,
    intro: 'Welcome to the SUMMIT LEAGUE. I am THORNE of the ELITE FOUR. My fists and my Wildkin are one and the same. Hyah!',
    lose: 'A crushing defeat. You have earned your way forward.',
    after: '',
  });
  T('e4_2', 'ELITE FOUR', 'WREN', [['Galesprint', 50], ['Lancebeak', 51], ['Nocturne', 51], ['Pterolith', 52], ['Tempestrel', 53]], {
    look: 'wren',
    money: 99,
    smart: true,
    music: 'boss',
    potions: 2,
    intro: 'I am WREN. Up here, the wind is mine. Have you ever battled someone who never touches the ground?',
    lose: 'Grounded at last. The sky is yours to cross.',
    after: '',
  });
  T('e4_3', 'ELITE FOUR', 'MORRIGAN', [['Duskwraith', 52], ['Nocturne', 52], ['Phantail', 52], ['Venomaw', 53], ['Duskwraith', 55]], {
    look: 'morrigan',
    money: 99,
    smart: true,
    music: 'boss',
    potions: 2,
    intro: 'Mm. Another bright young thing. I am MORRIGAN. My SHADE Wildkin have haunted this hall for longer than you have been alive.',
    lose: 'Hmph. You have more spirit than I expected.',
    after: '',
  });
  T('e4_4', 'ELITE FOUR', 'VESPER', [['Swamplash', 52], ['Dragonet', 51], ['Dragonet', 51], ['Pterolith', 53], ['Skywyrm', 56]], {
    look: 'vesper',
    money: 99,
    smart: true,
    music: 'boss',
    potions: 2,
    intro: 'I am VESPER, last of the ELITE FOUR. WYRM Wildkin are the oldest and proudest of all. Only another WYRM, or ice, truly frightens them.',
    lose: 'Remarkable. The CHAMPION awaits beyond this door.',
    after: '',
  });
  T('champ', 'CHAMPION', 'ELOWEN', [['Tempestrel', 54], ['Oracleon', 54], ['Megalith', 54], ['Rafflare', 55], ['Medusail', 55], ['Pyrehound', 58]], {
    look: 'elowen',
    money: 200,
    smart: true,
    music: 'boss',
    potions: 3,
    intro: 'So you are the one who chased the HOLLOW ORDER out of every corner of VARROW. I am ELOWEN, CHAMPION of the SUMMIT. Give me everything you have.',
    lose: 'Magnificent. The title of CHAMPION is yours. VARROW has a new legend.',
    after: '',
  });

  W.add(room('e4_1', "THORNE'S HALL", { id: 'thorne', look: 'thorne', trainer: 'e4_1', win: 'THORNE: Go. The next door is open.' }, 'e4_2'));
  W.add(room('e4_2', "WREN'S HALL", { id: 'wren', look: 'wren', trainer: 'e4_2', win: 'WREN: Fly on, then.' }, 'e4_3'));
  W.add(room('e4_3', "MORRIGAN'S HALL", { id: 'morrigan', look: 'morrigan', trainer: 'e4_3', win: 'MORRIGAN: Go on. VESPER will not be so gentle.' }, 'e4_4'));
  W.add(room('e4_4', "VESPER'S HALL", { id: 'vesper', look: 'vesper', trainer: 'e4_4', win: 'VESPER: The CHAMPION waits. Go.' }, 'champ_room'));
  const champRoom = room('champ_room', "CHAMPION'S HALL", { id: 'elowen', look: 'elowen', trainer: 'champ', win: '' }, 'champ_room');
  champRoom.warps = [];
  champRoom.npcs[0].afterWin = async (c) => {
    await c.say(['ELOWEN: You and your Wildkin fought as one. That is the heart of a true CHAMPION.', 'ELOWEN: From this day, your name is carved into the SUMMIT, {PLAYER}.']);
    await c.say("PROF. FENN: {PLAYER}! I climbed all the way up the mountain! You did it! I'm so proud of you.");
    await c.say("{RIVAL}: Heh. Guess I'll just have to become CHAMPION after you. Congrats, {PLAYER}.");
    const first = !c.flag('champion');
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
    if (first) await c.say(['Your adventure continues! The storms around the RIFT north of DRIFTWOOD CAPE have calmed.', 'Complete the WILDEX, and challenge the LEAGUE again anytime.']);
  };
  champRoom.npcs[0].talk = async (c) => c.say('ELOWEN: Welcome, challenger.');
  W.add(champRoom);

  // ======================= ROUTE 25 and the RIFT (post-game) =======================
  W.add(
    makeMap({
      id: 'route25',
      name: 'RIFT SEA',
      legend: OUT,
      border: 'tree',
      music: 'sea',
      outdoor: true,
      encounters: enc(0.1, 'Wiltbloom 45-50 20, Snaptrap 45-50 20, Venomaw 46-50 15, Purrloft 46-50 15, Gloopy 44-48 10, Lancebeak 46-50 10, Lunamoth 46-50 10'),
      surf: enc(0.08, 'Medusail 45-50 30, Croakard 45-50 25, Mallarch 45-50 25, Glacieal 45-50 20'),
      fish: enc(1, 'Swamplash 40-50 15, Wyrmlet 30-40 15, Clawlord 45-50 20, Crownfin 45-50 20, Tidesteed 45-50 15, Starmind 45-50 15'),
      rows: [
        'TTTTTTTTTTTTTTTTTTTTTTTT',
        'TT~~~~~~~~~~~~~~~~~~~~TT',
        'TT~~~~MMMMMMMM~~~~~~~~TT',
        'TT~~~MMMMCMMMMM~~~~~~~TT',
        'TT~~~ss,,,,,,ss~~~~~~~TT',
        'TT~~~ss,,,,,,ss~~~~~~~TT',
        'TT~~~~ssssssss~~~~~~~~TT',
        'TT~~~~~~~~~~~~~~~~~~~~TT',
        'TT~~~~~~~~~~~~~ssss~~~TT',
        'TT~~~~~~~~~~~~ssssss~~TT',
        'TT~~~~~~~~~~~~~ssss~~~TT',
        'TT~~~~~~~~~~~~~~~~~~~~TT',
        'TT~~~~~~~~~~~~~~~~~~~~TT',
        'TTTTTTTTTTTTTTTTT~~~~~~~',
        'TTTTTTTTTTTTTTTT~~~~~~~~',
        'TTTTTTTTTTTTTTTT~~~~~~~~',
      ],
      warps: [door(9, 3, 'rift1', 11, 15, 'up')],
      items: [
        { id: 'fossilA2', x: 16, y: 9, item: 'spiralfossil', cond: (s) => !!s.flags['fossilChoice:shellfossil'] },
        { id: 'fossilB2', x: 17, y: 9, item: 'shellfossil', cond: (s) => !!s.flags['fossilChoice:spiralfossil'] },
        { id: 'r25dusk', x: 18, y: 9, item: 'dusk' },
      ],
      npcs: [
        { id: 's1', x: 10, y: 8, dir: 'down', look: 'swimmer', trainer: T('r25_kai', 'SWIMMER', 'KAILANI', [['Medusail', 50], ['Starmind', 50], ['Pearlfort', 51]]), sight: 4 },
        { id: 'a1', x: 11, y: 5, dir: 'down', look: 'ace', trainer: T('r25_ace', 'ACE', 'ROWAN', [['Skywyrm', 52], ['Duskwraith', 51], ['Ironox', 51]]), sight: 1 },
      ],
    }),
  );
  const riftEnc = enc(0.08, 'Gloopy 46-52 15, Megalith 48-52 10, Purrloft 46-50 10, Rafflare 48-52 10, Dragonet 48-54 10, Wildbull 48-52 10, Armadrill 48-52 10, Nocturne 48-52 10, Duskwraith 50-54 5, Galesprint 48-52 10');
  W.add(
    makeMap({
      id: 'rift1',
      name: 'RIFT CAVERN',
      legend: CAVE,
      border: 'cavewall',
      music: 'cave',
      outdoor: false,
      escape: true,
      encounters: riftEnc,
      surf: enc(0.08, 'Glacieal 48-52 40, Swamplash 46-50 20, Medusail 48-52 40'),
      fish: enc(1, 'Swamplash 45-55 30, Wyrmlet 30-40 20, Dragonet 45-55 10, Clawlord 45-55 40'),
      rows: [
        'wwwwwwwwwwwwwwwwwwwwwwww',
        'wggggggwwwwwwwwwwwgggggw',
        'wgRggggggggggggggggggRhw',
        'wggg~~~~gggggggg~~~~gggw',
        'wggg~~~~ggg*gggg~~~~gggw',
        'wggggggggggggggggggggggw',
        'wwwwwwwgggwwwwgggwwwwwww',
        'wgggggggggwwwwgggggggggw',
        'wgRggg*ggggggggggg*gRggw',
        'wggggggggKggggKggggggggw',
        'wwwwgggggggggggggggwwwww',
        'wggggggwwwwwwwwwwggggggw',
        'wgRgggggggggggggggggRggw',
        'wggggggggggggggggggggggw',
        'wwwwwwwwwwwggwwwwwwwwwww',
        'wwwwwwwwwwwggwwwwwwwwwww',
        'wwwwwwwwwwwewwwwwwwwwwww',
      ],
      warps: [door(11, 16, 'route25', 9, 4, 'down'), door(22, 2, 'rift2', 2, 2, 'down')],
      items: [
        { id: 'rf1a', x: 1, y: 1, item: 'maxrevive' },
        { id: 'rf1b', x: 22, y: 13, item: 'candy', n: 2 },
        { id: 'rf1c', x: 1, y: 12, item: 'elixir' },
      ],
    }),
  );
  W.add(
    makeMap({
      id: 'rift2',
      name: 'RIFT DEPTHS',
      legend: CAVE,
      border: 'cavewall',
      music: 'hideout',
      outdoor: false,
      escape: true,
      encounters: riftEnc,
      rows: [
        'wwwwwwwwwwwwwwwwwwww',
        'wwwwwww*****wwwwwwww',
        'wuggggg*ggg*gggggggw',
        'wggggggggggggggggggw',
        'wgRgggg~~~~~~ggggRgw',
        'wggggg~~~gg~~~gggggw',
        'wggggg~~gggg~~gggggw',
        'wggggg~~~gg~~~gggggw',
        'wgggggg~~gg~~ggggggw',
        'wggggggggggggggggggw',
        'wwwwwwwwwwwwwwwwwwww',
      ],
      warps: [door(1, 2, 'rift1', 22, 3, 'down')],
      items: [{ id: 'rf2a', x: 18, y: 9, item: 'maxrevive' }],
      npcs: [
        {
          id: 'nullmind',
          x: 9,
          y: 6,
          dir: 'down',
          look: 'nullmind',
          cond: not('nullmindDone'),
          talk: async (c) => {
            await c.say(['...', 'A vast, quiet mind brushes against yours. It is curious. And very, very lonely.', 'NULLMIND rises from the heart of the RIFT!']);
            const r = await c.wild(SP.NULLMIND, 70, { noRun: true, music: 'boss' });
            if (r === 'lose') return;
            c.hide('nullmind');
            if (r === 'caught') {
              c.set('nullmindDone');
              await c.say('NULLMIND seems calm for the first time in ages. It is no longer alone.');
              return;
            }
            // not caught: back the next time the RIFT is visited, so it can't be missed for good
            await c.say('NULLMIND drifted back into the depths of the RIFT. It will surface again when you return.');
          },
        },
      ],
      signs: [{ x: 9, y: 1, text: 'Glowing crystals hum with a strange, sad tune.' }],
    }),
  );

  W.link('astra', 'up', 'route21');
  W.link('route21', 'up', 'route22');
  W.link('route22', 'up', 'galewick');
  W.link('galewick', 'up', 'route23');
  W.link('route24', 'up', 'summit');
  W.link('route6', 'up', 'route25');
}

