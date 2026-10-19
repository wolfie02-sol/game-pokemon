/**
 * Chapter 6: the southern seas. ROUTE 18 and 19, the FROSTDEEP ISLES, CINDERMOOR ISLAND
 * with its ruined MANOR and the EMBER CALDERA, and ROUTE 20 back to HEARTHVALE.
 */
import { SP } from '../../data/species';
import { T } from '../../data/trainers';
import { ASH, building, door, gymInterior, havenInterior, houseInterior, ICECAVE, IN, MAGMA, makeMap, martInterior, matWarps, OUT, type World } from '../build';
import { enc, leaderAfter, not } from '../common';
import type { Script } from '../types';

const SEA_SURF = enc(0.08, 'Jellune 30-38 80, Medusail 35-40 10, Sealpup 30-35 10');
const SEA_FISH = enc(1, 'Finnet 25-35 20, Crownfin 33-38 10, Seasprig 25-35 20, Tidesteed 33-38 5, Pinchet 25-35 20, Clamlet 25-35 15, Starlet 25-35 10');

const revive: Script = async (c) => {
  const fossils: [string, string, number][] = [
    ['spiralfossil', 'SPIRAL FOSSIL', SP.SPIRALITH],
    ['shellfossil', 'SHELL FOSSIL', SP.SHELLITH],
    ['amber', 'OLD AMBER', SP.PTEROLITH],
  ];
  const have = fossils.filter(([id]) => c.s.bag[id]);
  if (!have.length) {
    await c.say(['SCIENTIST: I bring ancient Wildkin back to life from fossils!', 'SCIENTIST: Bring me a fossil or a piece of amber and I will show you.']);
    return;
  }
  const [id, name, sp] = have[0];
  if (!(await c.yesNo(`SCIENTIST: Oh! That is a ${name}! Shall I revive the Wildkin inside?`))) return;
  delete c.s.bag[id];
  await c.say('SCIENTIST: Into the machine it goes... whirr... clunk... ding!');
  c.g.sfx('evolve');
  await c.flash();
  await c.receiveMon(sp, 30);
};

export function build(W: World) {
  // ======================= ROUTE 18 (sea) =======================
  const seaRows = (w: number, h: number, top: string, bottom: string, extras: Record<number, string> = {}) => {
    const rows: string[] = [top];
    for (let y = 1; y < h - 1; y++) rows.push(extras[y] ?? 'TT' + '~'.repeat(w - 4) + 'TT');
    rows.push(bottom);
    return rows;
  };
  W.add(
    makeMap({
      id: 'route18',
      name: 'ROUTE 18',
      legend: OUT,
      border: 'tree',
      music: 'sea',
      outdoor: true,
      surf: SEA_SURF,
      fish: SEA_FISH,
      rows: seaRows(28, 30, 'TT~~~~~~~~~~~~~~~~~~~~~~~~TT', 'TTTTTT~~~~~~~~~~~~~~~~TTTTTT', {
        6: 'TT~~~~~~~~~~~~~~~O~~~~~~~~TT',
        8: 'TT~~~~ssss~~~~~~~~~~~~~~~~TT',
        9: 'TT~~~ssssss~~~~~~~~~O~~~~~TT',
        10: 'TT~~~~ssss~~~~~~~~~~~~~~~~TT',
        14: 'TT~~~~~~~~~~O~~~~~~~~~~~~~TT',
        18: 'TT~~~~~~~~~~~~~~sssss~~~~~TT',
        19: 'TT~~~~~~~~~~~~~sssssss~~~~TT',
        20: 'TT~~~~O~~~~~~~~~sssss~~~~~TT',
        25: 'TT~~~~~~~~~~~~~~~~~~~O~~~~TT',
      }),
      items: [
        { id: 'r18a', x: 7, y: 9, item: 'ultrapod', n: 2 },
        { id: 'r18b', x: 18, y: 19, item: 'elixir' },
      ],
      npcs: [
        { id: 's1', x: 12, y: 4, dir: 'down', look: 'swimmer', trainer: T('r18_mia', 'SWIMMER', 'MIA', [['Jellune', 32], ['Medusail', 33]]), sight: 4 },
        { id: 's2', x: 20, y: 11, dir: 'left', look: 'swimmer', trainer: T('r18_cal', 'SWIMMER', 'CAL', [['Sealpup', 33], ['Seasprig', 32], ['Finnet', 32]]), sight: 4 },
        { id: 's3', x: 6, y: 16, dir: 'right', look: 'swimmer', trainer: T('r18_ren', 'SWIMMER', 'RENA', [['Starlet', 33], ['Starmind', 34]]), sight: 4 },
        { id: 's4', x: 14, y: 23, dir: 'up', look: 'swimmer', trainer: T('r18_zed', 'SWIMMER', 'ZED', [['Tidesteed', 34]]), sight: 3 },
        { id: 'f1', x: 17, y: 18, dir: 'left', look: 'fisher', trainer: T('r18_ole', 'FISHER', 'OLE', [['Crownfin', 33], ['Clawlord', 34]]), sight: 3 },
      ],
    }),
  );

  // ======================= ROUTE 19 (sea, split by the FROSTDEEP ridge) =======================
  W.add(
    makeMap({
      id: 'route19',
      name: 'ROUTE 19',
      legend: OUT,
      border: 'tree',
      music: 'sea',
      outdoor: true,
      surf: SEA_SURF,
      fish: SEA_FISH,
      rows: [
        'TTTTTTTTTTTTTTTTMMMMMM~~~~~~~~~~~~~~~~TT',
        'TTTTTTTTTTTT~~~~MMMMMM~~~~~~~~~~~~~~~~TT',
        'TTTTTTTT~~~~~~~~MMMMMM~~~~~~~~~~~~~~~~TT',
        'TTTT~~~~~~~~~~~sMMMMMMs~~~~~~~~~~~~~~~TT',
        '~~~~~~~~~~~~~~ssMMMMMMss~~~~~~~~~~~~~~TT',
        '~~~~~~~~~~~~~~sCMMMMMMCs~~~~~~~~~~~~~~TT',
        '~~~~~~~~~~~~~~ssMMMMMMss~~~~~~~~~~~~~~TT',
        '~~~~~~~~~~~~~~~sMMMMMMs~~~~~~~~~~~~~~~TT',
        '~~~~~~~~~~~~~~~~MMMMMM~~~~~~~~~~~~~~~~TT',
        '~~~~~~~~~~~~~~~~MMMMMM~~~~~~~O~~~~~~~~TT',
        '~~~~~O~~~~~~~~~~MMMMMM~~~~~~~~~~~~~~~~TT',
        '~~~~~~~~~~~~~~~~MMMMMM~~~~~~~~~~~~~~~~TT',
        'TTTTTTTT~~~~~~~~MMMMMM~~~~~~~~~~~~~~~~TT',
        'TTTTTTTTTTTT~~~~MMMMMM~~~~~~~~~~~~~~~~TT',
        'TTTTTTTTTTTTTTTTMMMMMM~~~~~~~~~~~~~~~~TT',
        'TTTTTTTTTTTTTTTTMMMMMMTTTTTTTTTTTTTTTTTT',
      ],
      warps: [door(15, 5, 'frost1', 1, 4, 'right'), door(22, 5, 'frost1', 22, 4, 'left')],
      npcs: [
        { id: 's1', x: 30, y: 4, dir: 'left', look: 'swimmer', trainer: T('r19_ike', 'SWIMMER', 'IKE', [['Jellune', 34], ['Jellune', 34], ['Medusail', 35]]), sight: 5 },
        { id: 's2', x: 27, y: 12, dir: 'up', look: 'swimmer', trainer: T('r19_amy', 'SWIMMER', 'AMI', [['Seasprig', 34], ['Tidesteed', 35]]), sight: 4 },
        { id: 's3', x: 8, y: 7, dir: 'right', look: 'swimmer', trainer: T('r19_bo', 'SWIMMER', 'BOW', [['Sealpup', 35], ['Glacieal', 36]]), sight: 5 },
        { id: 's4', x: 4, y: 3, dir: 'down', look: 'swimmer', trainer: T('r19_lu', 'SWIMMER', 'LULU', [['Starlet', 35], ['Pearlfort', 36]]), sight: 4 },
      ],
    }),
  );

  // ======================= FROSTDEEP ISLES =======================
  const frostEnc = enc(0.08, 'Sealpup 30-35 25, Duskbat 30-34 15, Nocturne 33-36 10, Drowsel 30-35 15, Clamlet 30-34 10, Glacieal 34-38 10, Dozelord 35-38 5, Mallarch 34-37 5, Frostwaltz 33-36 5');
  const frostSurf = enc(0.08, 'Sealpup 30-36 50, Glacieal 34-38 30, Drowsel 30-35 20');
  W.add(
    makeMap({
      id: 'frost1',
      name: 'FROSTDEEP ISLES',
      legend: ICECAVE,
      border: 'icewall',
      music: 'cave',
      outdoor: false,
      escape: true,
      encounters: frostEnc,
      surf: frostSurf,
      rows: [
        'wwwwwwwwwwwwwwwwwwwwwwww',
        'wggggggwwwwwwwwwwggggggw',
        'wgRggggwwwwwwwwwwgggRggw',
        'wggggggwwwwwwwwwwggggggw',
        'eggggRgwwwwwwwwwwgRgggge',
        'wggggggwwwwwwwwwwggggggw',
        'wgg~~ggwwwwwwwwwwgg~~ggw',
        'wgg~~ggwwwwwwwwwwgg~~ggw',
        'wggggggwwwwwwwwwwgggghgw',
        'whgggggwwwwwwwwwwggggggw',
        'wwwwwwwwwwwwwwwwwwwwwwww',
      ],
      warps: [door(0, 4, 'route19', 14, 5, 'left'), door(23, 4, 'route19', 23, 5, 'right'), door(21, 8, 'frost2', 20, 2, 'down'), door(1, 9, 'frost2', 1, 12, 'right')],
      items: [
        { id: 'fr1a', x: 6, y: 1, item: 'thawdrop', n: 3 },
        { id: 'fr1b', x: 17, y: 9, item: 'tm17' },
      ],
    }),
  );
  W.add(
    makeMap({
      id: 'frost2',
      name: 'FROSTDEEP ISLES B1',
      legend: ICECAVE,
      border: 'icewall',
      music: 'cave',
      outdoor: false,
      escape: true,
      encounters: frostEnc,
      surf: frostSurf,
      rows: [
        'wwwwwwwwwwwwwwwwwwwwwwww',
        'wggggggggggwwwwgggggggww',
        'wgRggg~~~gggggggggRgugww',
        'wgggg~~~~~ggwwggggggggww',
        'wwggg~~~~~ggwwgggKggggww',
        'wgggg~~~~~gggggggggggggw',
        'wggggg~~~gggRggwwwwggggw',
        'wgRgggggggggggwwwwwggggw',
        'wgggwwwwgggggggggggggggw',
        'wgggwwwwggggg~~~~~gggggw',
        'wgggggggggggg~~~~~ggRggw',
        'wggRgggggggggggggggggggw',
        'wugggggggggggggggggggggw',
        'wwwwwwwwwwwwwwwwwwwwwwww',
      ],
      warps: [door(20, 2, 'frost1', 21, 8, 'up'), door(1, 12, 'frost1', 1, 9, 'up')],
      items: [
        { id: 'fr2a', x: 1, y: 1, item: 'maxrevive' },
        { id: 'fr2b', x: 22, y: 11, item: 'ultrapod', n: 3 },
        { id: 'fr2c', x: 19, y: 9, item: 'tm18' },
      ],
      npcs: [
        {
          id: 'galecrest',
          x: 16,
          y: 1,
          dir: 'down',
          look: 'bird_frost',
          cond: not('galecrestDone'),
          talk: async (c) => {
            await c.say('Kyeeeee! A freezing wind howls through the cavern!');
            const r = await c.wild(SP.GALECREST, 50, { noRun: true, music: 'boss' });
            if (r === 'lose') return;
            c.hide('galecrest');
            if (r === 'caught') {
              c.set('galecrestDone');
              return;
            }
            // not caught: it leaves for now and is back the next time this place is visited, so it can't be missed for good
            await c.say('GALECREST vanished into a flurry of snow! It might come back if you return later.');
          },
        },
      ],
    }),
  );

  // ======================= CINDERMOOR ISLAND =======================
  const cm = makeMap({
    id: 'cindermoor',
    name: 'CINDERMOOR ISLAND',
    legend: ASH,
    border: 'water',
    music: 'town',
    outdoor: true,
    fly: { x: 6, y: 19 },
    surf: SEA_SURF,
    fish: SEA_FISH,
    rows: [
      'TTTTTT~~~~~~~~~~~~~~~~TTTTTT',
      'TT~~~~~~~~~~~~~~~~~~~~~~~~TT',
      'TT~~ssssssssssssssssssss~~TT',
      'TT~s....................s~TT',
      'TT~s....................s~TT',
      'TT~s....................s~TT',
      'TT~s....................s~TT',
      'TT~s..::::::::::::::::..s~~~',
      'TT~s..:..............:..s~~~',
      'TT~s..:..............:..s~~~',
      'TT~s..:..............:..s~~~',
      'TT~s..:..............:..s~~~',
      'TT~s..:..............:..s~~~',
      'TT~s..:..............:..s~~~',
      'TT~s..::::::::::::::::..s~~~',
      'TT~s....................s~TT',
      'TT~s......MMMMMMM.......s~TT',
      'TT~s......MMMCMMM.......s~TT',
      'TT~s....................s~TT',
      'TT~ssssssssssssssssssssss~TT',
      'TT~~~~~~~~~~~~~~~~~~~~~~~~TT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    warps: [door(13, 17, 'caldera', 9, 11, 'up')],
    signs: [],
    npcs: [
      { id: 'c1', x: 12, y: 15, dir: 'down', look: 'firebreather', move: 'look', talk: 'VULK locked the GYM and lost the key in the old MANOR fire. Typical VULK!' },
      { id: 'c2', x: 22, y: 4, dir: 'left', look: 'scientist', move: 'look', talk: 'The LAB can revive Wildkin from fossils. Bring any you find!' },
      { id: 'c3', x: 4, y: 11, dir: 'right', look: 'oldman', move: 'look', talk: 'The EMBER CALDERA in the volcano is where the dawn phoenix is said to nest. Only fools go in. Fools and trainers.' },
    ],
  });
  const cmGym = building(cm, 5, 3, 7, 'red', 'gym');
  const cmLab = building(cm, 15, 3, 6, 'teal', 'lab');
  const cmManor = building(cm, 8, 9, 6, 'grey', 'house');
  const cmHouse = building(cm, 15, 9, 5, 'gold', 'house');
  const cmHaven = building(cm, 4, 15, 5, 'red', 'haven');
  const cmMart = building(cm, 19, 15, 4, 'blue', 'mart');
  cm.warps.push(
    { ...door(cmGym.x, cmGym.y, 'cinder_gym', 4, 13), cond: (s) => !!s.bag.manorkey || !!s.flags.gymUnlocked, locked: 'The GYM door is locked tight. A sign reads: KEY LOST IN THE MANOR. SORRY! - VULK' },
    door(cmLab.x, cmLab.y, 'cinder_lab', 4, 7),
    door(cmManor.x, cmManor.y, 'manor1', 6, 8),
    door(cmHouse.x, cmHouse.y, 'cinder_house', 3, 7),
    door(cmHaven.x, cmHaven.y, 'cinder_haven', 4, 7),
    door(cmMart.x, cmMart.y, 'cinder_mart', 3, 7),
  );
  cm.signs.push({ x: 12, y: 6, text: 'CINDERMOOR ISLAND: Forged in fire, tempered by the sea.' });
  W.add(cm);
  W.add(havenInterior('cinder_haven', 'CINDERMOOR HAVEN', { map: 'cindermoor', x: cmHaven.x, y: cmHaven.y + 1 }, [{ id: 'h1', x: 7, y: 5, dir: 'left', look: 'firebreather', talk: 'VULK says FLAME types are weak to TIDE, EARTH and STONE. He says it like it is a secret.' }]));
  W.add(martInterior('cinder_mart', 'CINDERMOOR MARKET', { map: 'cindermoor', x: cmMart.x, y: cmMart.y + 1 }, ['ultrapod', 'hyperpotion', 'maxpotion', 'fullcure', 'revive', 'maxrepel', 'escaperope', 'burnsalve']));
  W.add(
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
          await c.say("You remind me of myself at your age, all fire and wanderlust! Here, I've no use for these anymore.");
          await c.give('candy', 2);
        },
      },
    ]),
  );
  W.add(
    makeMap({
      id: 'cinder_lab',
      name: 'CINDERMOOR LAB',
      legend: IN,
      border: 'void',
      music: 'haven',
      outdoor: false,
      rows: ['WWnWWWWnWW', 'BBL====LBB', '==========', '==tt==tt==', '==========', 'L========L', '==========', '====mm===='],
      warps: matWarps(4, 7, { map: 'cindermoor', x: cmLab.x, y: cmLab.y + 1 }),
      npcs: [
        { id: 'reviver', x: 5, y: 2, dir: 'down', look: 'scientist', talk: revive },
        { id: 'sci2', x: 1, y: 4, dir: 'right', look: 'scientist', talk: 'We study the RIFT here. Old records say a Wildkin from before all others sleeps beyond it.' },
      ],
      signs: [
        { x: 2, y: 1, text: 'A FOSSIL REVIVER. Its glass tank bubbles quietly.' },
        { x: 7, y: 1, text: 'A machine humming with readings from the northern sea.' },
      ],
    }),
  );
  const RUIN = { ...IN, '.': 'ruinfloor' };
  const manorEnc = enc(0.07, 'Smogpuff 32-36 20, Oozle 32-36 20, Cindrip 32-36 20, Magmole 34-37 10, Gloopy 30-34 10, Smogcloud 35-38 8, Sludgemaw 35-38 7, Magmaw 34-37 5');
  W.add(
    makeMap({
      id: 'manor1',
      name: 'BURNT MANOR',
      legend: RUIN,
      border: 'void',
      music: 'hideout',
      outdoor: false,
      escape: true,
      encounters: manorEnc,
      rows: ['WWnWWWWWWWWnWW', '.............z', '.BB..tt...BB..', '..............', 'WWWW..WWWW..WW', '..............', '.tt.......tt..', '..............', 'p.....mm.....p'],
      warps: [...matWarps(6, 8, { map: 'cindermoor', x: cmManor.x, y: cmManor.y + 1 }), door(13, 1, 'manor2', 0, 2, 'down')],
      items: [
        { id: 'mn1a', x: 0, y: 1, item: 'tm29' },
        { id: 'mn1b', x: 13, y: 7, item: 'hyperpotion', n: 2 },
      ],
      npcs: [
        { id: 'sci', x: 8, y: 5, dir: 'left', look: 'scientist', trainer: T('mn_sci', 'SCIENTIST', 'BRAM', [['Magmole', 36], ['Smogcloud', 37]]), sight: 4 },
        { id: 'busk', x: 3, y: 3, dir: 'down', look: 'busker', trainer: T('mn_busk', 'BUSKER', 'ZAK', [['Magmaw', 36], ['Cindrip', 35]]), sight: 3 },
      ],
      signs: [{ x: 5, y: 2, text: "A charred journal: 'The RIFT is not a place. It is a door. And something is knocking.'" }],
    }),
  );
  W.add(
    makeMap({
      id: 'manor2',
      name: 'BURNT MANOR 2F',
      legend: RUIN,
      border: 'void',
      music: 'hideout',
      outdoor: false,
      escape: true,
      encounters: manorEnc,
      rows: ['WWnWWWWWWWWnWW', 'z.............', '..LL......LL..', '..............', 'WW..WWWWWW..WW', '..............', '..t........t..', '..............', 'WWWWWWWWWWWWWW'],
      warps: [door(0, 1, 'manor1', 13, 2, 'down')],
      items: [
        { id: 'manorkey', x: 12, y: 7, item: 'manorkey' },
        { id: 'mn2a', x: 1, y: 7, item: 'maxrevive' },
      ],
      npcs: [{ id: 'sci', x: 7, y: 5, dir: 'down', look: 'scientist', trainer: T('mn_sci2', 'SCIENTIST', 'TAYE', [['Dynacoil', 37], ['Gloopy', 35], ['Pixelon', 37]]), sight: 2 }],
      signs: [
        { x: 2, y: 2, text: "A journal: 'Day 61. The creature from the RIFT spoke to me without words. It is lonely. It wants out.'" },
        { x: 11, y: 2, text: "A journal: 'Day 90. I sealed the notes away. If the HOLLOW ORDER finds them, they will try to wake it.'" },
      ],
    }),
  );
  W.add(
    makeMap({
      id: 'caldera',
      name: 'EMBER CALDERA',
      legend: MAGMA,
      border: 'magmawall',
      music: 'cave',
      outdoor: false,
      escape: true,
      encounters: enc(0.08, 'Cindrip 38-42 30, Magmole 40-44 25, Magmaw 40-43 15, Pyropup 38-42 15, Embercolt 38-42 15'),
      rows: [
        'wwwwwwwwwwwwwwwwwwww',
        'wwwwwggggggggggwwwww',
        'wwwggg~~~~~~~~gggwww',
        'wwgg~~~~~~~~~~~~ggww',
        'wggg~~~gggggg~~~gggw',
        'wggg~~gggggggg~~gggw',
        'wggg~~gggggggg~~gggw',
        'wggg~~~gggggg~~~gggw',
        'wggg~~~~~gg~~~~~gggw',
        'wgggg~~~~gg~~~~ggggw',
        'wgRggggggggggggggRgw',
        'wggggggggggggggggggw',
        'wggggggggegggggggggw',
        'wwwwwwwwwwwwwwwwwwww',
      ],
      warps: [door(9, 12, 'cindermoor', 13, 18, 'down')],
      items: [{ id: 'cald1', x: 1, y: 4, item: 'fullrestore' }],
      npcs: [
        {
          id: 'solmara',
          x: 9,
          y: 5,
          dir: 'down',
          look: 'bird_flame',
          cond: not('solmaraDone'),
          talk: async (c) => {
            await c.say('Krrraaaah! A wave of heat rolls over you! The dawn phoenix spreads its wings!');
            const r = await c.wild(SP.SOLMARA, 50, { noRun: true, music: 'boss' });
            if (r === 'lose') return;
            c.hide('solmara');
            if (r === 'caught') {
              c.set('solmaraDone');
              return;
            }
            // not caught: it leaves for now and is back the next time this place is visited, so it can't be missed for good
            await c.say('SOLMARA soared up out of the caldera! It might come back if you return later.');
          },
        },
      ],
    }),
  );
  W.add(
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
          trainer: T('g7', 'LEADER', 'VULK', [['Magmole', 41], ['Blazesteed', 42], ['Magmaw', 42], ['Solfennec', 43], ['Pyrehound', 45]], {
            look: 'vulk',
            money: 99,
            smart: true,
            music: 'boss',
            potions: 1,
            intro: "HA! You found my key? Then you've earned a battle! I'm VULK, and my fire never goes out! Let's see if yours burns as bright!",
            lose: 'What a blaze! You earned this. The CINDER BADGE is yours!',
            after: '',
          }),
          sight: 0,
          afterWin: leaderAfter('CINDER', ['tm23', 1], ['VULK: And take FLARE BURST. A proper blast of flame!', 'VULK: Only GALEWICK in the frozen north is left. Head through ASTRA CITY and keep going until your nose freezes!']),
          talk: 'VULK: Your fire burns bright! Keep it lit, no matter how hard the wind blows.',
        },
        { id: 'gt1', x: 1, y: 6, dir: 'right', look: 'firebreather', trainer: T('g7_kai', 'BUSKER', 'KAI', [['Cindrip', 40], ['Pyropup', 41]], { look: 'firebreather' }), sight: 4 },
        { id: 'gt2', x: 8, y: 9, dir: 'left', look: 'firebreather', trainer: T('g7_dov', 'BUSKER', 'DOV', [['Emberfen', 41], ['Embercolt', 41]], { look: 'firebreather' }), sight: 4 },
        { id: 'gt3', x: 4, y: 6, dir: 'down', look: 'scientist', trainer: T('g7_ira', 'SCIENTIST', 'IRA', [['Magmaw', 42]]), sight: 3 },
        { id: 'guide', x: 7, y: 12, dir: 'left', look: 'boy', talk: "VULK's FLAME team can't stand TIDE, EARTH and STONE moves. LEAF and FROST moves will barely tickle them!" },
      ],
      'CINDERMOOR GYM   LEADER: VULK   The flame that never dies!',
      1,
    ),
  );

  // ======================= ROUTE 20 (sea) =======================
  W.add(
    makeMap({
      id: 'route20',
      name: 'ROUTE 20',
      legend: OUT,
      border: 'tree',
      music: 'sea',
      outdoor: true,
      surf: SEA_SURF,
      fish: SEA_FISH,
      rows: seaRows(28, 26, 'TTTTTTTT~~~~~~TTTTTTTTTTTTTT', 'TTTTTT~~~~~~~~~~~~~~~~TTTTTT', {
        1: 'TTTTTT~~~~~~~~~~TTTTTTTTTTTT',
        2: 'TTTT~~~~~~~~~~~~~~~~TTTTTTTT',
        3: 'TT~~~~~~~~~~~~~~~~~~~~~~TTTT',
        7: 'TT~~~~~~~~O~~~~~~~~~~~~~~~TT',
        11: 'TT~~~~~~~~~~~~~~~ssss~~~~~TT',
        12: 'TT~~~~~~~~~~~~~~ssssss~~~~TT',
        13: 'TT~~~~~~~~~~~~~~~ssss~~~~~TT',
        18: 'TT~~~~O~~~~~~~~~~~~~~~~~~~TT',
      }),
      items: [{ id: 'r20a', x: 19, y: 12, item: 'tm30' }],
      npcs: [
        { id: 's1', x: 8, y: 5, dir: 'down', look: 'swimmer', trainer: T('r20_ana', 'SWIMMER', 'ANA', [['Medusail', 37], ['Jellune', 36]]), sight: 4 },
        { id: 's2', x: 20, y: 9, dir: 'left', look: 'swimmer', trainer: T('r20_ted', 'SWIMMER', 'TED', [['Crownfin', 37], ['Tidesteed', 37]]), sight: 5 },
        { id: 's3', x: 5, y: 15, dir: 'right', look: 'swimmer', trainer: T('r20_sal', 'SWIMMER', 'SAL', [['Clawlord', 38]]), sight: 5 },
        { id: 's4', x: 15, y: 21, dir: 'up', look: 'swimmer', trainer: T('r20_eli', 'SWIMMER', 'ELIN', [['Starmind', 37], ['Pearlfort', 38]]), sight: 4 },
      ],
    }),
  );

  W.link('mirecoast', 'down', 'route18');
  W.link('route18', 'down', 'route19');
  W.link('route19', 'left', 'cindermoor');
  W.link('cindermoor', 'up', 'route20');
  W.link('route20', 'up', 'hearthvale');
}
