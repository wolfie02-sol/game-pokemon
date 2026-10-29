// Vendored from https://github.com/levy-street/pokemon-claude-red (no licence; see the README attribution).
const G = globalThis.G;
// Overworld character sprites (16x24): hand-drawn head/body templates with region codes,
// recoloured per character. Directions: down, up, left (right = mirrored left). 3 frames each.
(function (G) {
  'use strict';
  const { Surface, hex, shade, mix } = G.gfx;
  const P = G.PAL;

  // Region codes:
  // O outline  S skin  s skin-shade  E eye  W white  M mouth
  // H hair  h hair-shade  L hair-light   C hat  c hat-shade  K hat-light/emblem  B brim
  // T shirt  t shirt-shade  U shirt-light  A accent   P pants  p pants-shade  F shoes  f shoe-light
  // G bag/extra  g bag-shade  X coat  x coat-shade
  const HEADS = {
    cap: {
      down: [
        '................',
        '.....OOOOOO.....',
        '...OOCKKKKCOO...',
        '..OCCKKKKKKCcO..',
        '..OCCCKKKKCCcO..',
        '.OcCCCCCCCCCccO.',
        '.OBBBBBBBBBBBBO.',
        '.OhHSSSSSSSSHhO.',
        '.OHSSESSSSESShO.',
        '..OSSESSSSESSO..',
        '..OsSSSSSSSSsO..',
        '...OOssSSssOO...',
      ],
      up: [
        '................',
        '.....OOOOOO.....',
        '...OOCCCCCCOO...',
        '..OCCCCCCCCCcO..',
        '..OCCCCCCCCCcO..',
        '.OcCCCCCCCCCccO.',
        '.OcccBBBBBBcccO.',
        '.OHHHHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '..OhHHHHHHHHhO..',
        '..OhhHHHHHHhhO..',
        '...OOhhhhhhOO...',
      ],
      left: [
        '................',
        '......OOOOO.....',
        '....OOKKKCCOO...',
        '...OKKKKCCCCcO..',
        '...OCKKKCCCCcO..',
        '..OBCCCCCCCCccO.',
        '.OBBBBBOcccccO..',
        '..OOSSSSOHHHhO..',
        '...OSESSSSHHhO..',
        '...OSESSSSShO...',
        '...OsSSSSSsO....',
        '....OOsSSsO.....',
      ],
    },
    spiky: {
      down: [
        '.....O...O......',
        '...OOHO.OHO.O...',
        '..OHHHOOHHOOHO..',
        '..OLHHHHHHHHHhO.',
        '.OHLHHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '.OHHhHHHHHHhHhO.',
        '.OHSSSSSSSSSShO.',
        '.OhSSESSSSESShO.',
        '..OSSESSSSESSO..',
        '..OsSSSSSSSSsO..',
        '...OOssSSssOO...',
      ],
      up: [
        '.....O...O......',
        '...OOHO.OHO.O...',
        '..OHHHOOHHOOHO..',
        '..OHHHHHHHHHHhO.',
        '.OHHLHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '.OhHHHHHHHHHHhO.',
        '..OhHHHHHHHHhO..',
        '..OhhHHHHHHhhO..',
        '...OOhhhhhhOO...',
      ],
      left: [
        '......O..O......',
        '....OOHOOHO.O...',
        '...OHHHHHHOOHO..',
        '..OHLHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        'OHHHHHHHHHHHHhO.',
        '.OOHSHHHHHHHhO..',
        '..OSSSSSHHHHhO..',
        '...OSESSSSHHhO..',
        '...OSESSSSShO...',
        '...OsSSSSSsO....',
        '....OOsSSsO.....',
      ],
    },
    short: {
      down: [
        '................',
        '................',
        '.....OOOOOO.....',
        '...OOHHHHHHOO...',
        '..OHLHHHHHHHhO..',
        '.OHLHHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '.OHhSSSSSSSShhO.',
        '.OHSSESSSSESShO.',
        '..OSSESSSSESSO..',
        '..OsSSSSSSSSsO..',
        '...OOssSSssOO...',
      ],
      up: [
        '................',
        '................',
        '.....OOOOOO.....',
        '...OOHHHHHHOO...',
        '..OHHLHHHHHHhO..',
        '.OHHHHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '.OhHHHHHHHHHhhO.',
        '..OhHHHHHHHHhO..',
        '..OhhHHHHHHhhO..',
        '...OOsSSSSsOO...',
      ],
      left: [
        '................',
        '................',
        '......OOOOO.....',
        '....OOHHHHHOO...',
        '...OHLHHHHHHhO..',
        '..OHHHHHHHHHHhO.',
        '..OHHHHHHHHHHhO.',
        '..OOSSSHHHHHhO..',
        '...OSESSSSHHhO..',
        '...OSESSSSShO...',
        '...OsSSSSSsO....',
        '....OOsSSsO.....',
      ],
    },
    long: {
      down: [
        '................',
        '................',
        '.....OOOOOO.....',
        '...OOHHHHHHOO...',
        '..OHLLHHHHHHhO..',
        '.OHLHHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '.OHHSSSSSSSSHhO.',
        'OHHSSESSSSESShhO',
        'OHhSSESSSSESShhO',
        'OHhsSSSSSSSSshhO',
        'OhhOOssSSssOOhhO',
      ],
      up: [
        '................',
        '................',
        '.....OOOOOO.....',
        '...OOHHHHHHOO...',
        '..OHHLHHHHHHhO..',
        '.OHHLHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        'OHHHHHHHHHHHHhhO',
        'OHHHHHHHHHHHHhhO',
        'OHhHHHHHHHHHhhhO',
        'OhhhHHHHHHHhhhhO',
      ],
      left: [
        '................',
        '................',
        '......OOOOO.....',
        '....OOHHHHHOO...',
        '...OHLHHHHHHhO..',
        '..OHHHHHHHHHHhO.',
        '..OHHHHHHHHHHhO.',
        '..OOSSSHHHHHHhO.',
        '...OSESSSSHHHhO.',
        '...OSESSSSHHhhO.',
        '...OsSSSSSHHhhO.',
        '....OOsSSsOhhhO.',
      ],
    },
    bald: {
      down: [
        '................',
        '................',
        '.....OOOOOO.....',
        '...OOSSSSSSOO...',
        '..OSWSSSSSSSsO..',
        '.OSWSSSSSSSSSsO.',
        '.OHSSSSSSSSSShO.',
        '.OHSSSSSSSSSShO.',
        '.OHSSESSSSESShO.',
        '..OSSESSSSESSO..',
        '..OsSSSSSSSSsO..',
        '...OOssSSssOO...',
      ],
      up: [
        '................',
        '................',
        '.....OOOOOO.....',
        '...OOSSSSSSOO...',
        '..OSSWSSSSSSsO..',
        '.OSSWSSSSSSSSsO.',
        '.OSSSSSSSSSSSsO.',
        '.OHSSSSSSSSSShO.',
        '.OHHHHHHHHHHHhO.',
        '..OhHHHHHHHHhO..',
        '..OhhHHHHHHhhO..',
        '...OOsSSSSsOO...',
      ],
      left: [
        '................',
        '................',
        '......OOOOO.....',
        '....OOSSSSSOO...',
        '...OSWSSSSSSsO..',
        '..OSWSSSSSSSSsO.',
        '..OSSSSSSSSHHhO.',
        '..OOSSSSSSHHhO..',
        '...OSESSSSHHhO..',
        '...OSESSSSShO...',
        '...OsSSSSSsO....',
        '....OOsSSsO.....',
      ],
    },
    hat: { // wide-brim hat (fisher, hiker, safari)
      down: [
        '................',
        '.....OOOOOO.....',
        '....OCCKKCCO....',
        '...OCCCCCCCcO...',
        '...OcCCCCCCcO...',
        'OOOBBBBBBBBBBOOO',
        'OBBBBBBBBBBBBBBO',
        '.OOhSSSSSSSShOO.',
        '..OSSESSSSESSO..',
        '..OSSESSSSESSO..',
        '..OsSSSSSSSSsO..',
        '...OOssSSssOO...',
      ],
      up: [
        '................',
        '.....OOOOOO.....',
        '....OCCCCCCO....',
        '...OCCCCCCCcO...',
        '...OcCCCCCCcO...',
        'OOOBBBBBBBBBBOOO',
        'OBBBBBBBBBBBBBBO',
        '.OOHHHHHHHHHhOO.',
        '..OhHHHHHHHHhO..',
        '..OhHHHHHHHHhO..',
        '..OhhHHHHHHhhO..',
        '...OOsSSSSsOO...',
      ],
      left: [
        '................',
        '......OOOOO.....',
        '.....OCCKCCO....',
        '....OCCCCCCcO...',
        '....OcCCCCCcO...',
        'OOOBBBBBBBBBBOO.',
        'OBBBBBBBBBBBBBBO',
        '..OOSSSSHHHhOO..',
        '...OSESSSSHHhO..',
        '...OSESSSSShO...',
        '...OsSSSSSsO....',
        '....OOsSSsO.....',
      ],
    },
    beanie: { // knit cap / bandana / helmet style (C colors)
      down: [
        '................',
        '.....OOOOOO.....',
        '...OOCCCCCCOO...',
        '..OCKCCCCCCCcO..',
        '.OCKCCCCCCCCCcO.',
        '.OCCCCCCCCCCCcO.',
        '.OccccccccccccO.',
        '.OhHSSSSSSSSHhO.',
        '.OHSSESSSSESShO.',
        '..OSSESSSSESSO..',
        '..OsSSSSSSSSsO..',
        '...OOssSSssOO...',
      ],
      up: [
        '................',
        '.....OOOOOO.....',
        '...OOCCCCCCOO...',
        '..OCCKCCCCCCcO..',
        '.OCCKCCCCCCCCcO.',
        '.OCCCCCCCCCCCcO.',
        '.OccccccccccccO.',
        '.OHHHHHHHHHHHhO.',
        '.OhHHHHHHHHHHhO.',
        '..OhHHHHHHHHhO..',
        '..OhhHHHHHHhhO..',
        '...OOsSSSSsOO...',
      ],
      left: [
        '................',
        '......OOOOO.....',
        '....OOCCCCCOO...',
        '...OCKCCCCCCcO..',
        '..OCKCCCCCCCCcO.',
        '..OCCCCCCCCCCcO.',
        '..OcccccccccccO.',
        '..OOSSSSSHHHhO..',
        '...OSESSSSHHhO..',
        '...OSESSSSShO...',
        '...OsSSSSSsO....',
        '....OOsSSsO.....',
      ],
    },
    bun: { // hair tied up (granny, nurse base)
      down: [
        '.....OOOOOO.....',
        '....OHLHHHhO....',
        '....OhHHHHhO....',
        '...OOHHHHHHOO...',
        '..OHLHHHHHHHhO..',
        '.OHLHHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '.OHhSSSSSSSShhO.',
        '.OHSSESSSSESShO.',
        '..OSSESSSSESSO..',
        '..OsSSSSSSSSsO..',
        '...OOssSSssOO...',
      ],
      up: [
        '.....OOOOOO.....',
        '....OHLHHHhO....',
        '....OhHHHHhO....',
        '...OOHHHHHHOO...',
        '..OHHLHHHHHHhO..',
        '.OHHHHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '.OhHHHHHHHHHhhO.',
        '..OhHHHHHHHHhO..',
        '..OhhHHHHHHhhO..',
        '...OOsSSSSsOO...',
      ],
      left: [
        '.........OOOO...',
        '........OHLHhO..',
        '........OhHHhO..',
        '....OOHHHOhhO...',
        '...OHLHHHHHHhO..',
        '..OHHHHHHHHHHhO.',
        '..OHHHHHHHHHHhO.',
        '..OOSSSHHHHHhO..',
        '...OSESSSSHHhO..',
        '...OSESSSSShO...',
        '...OsSSSSSsO....',
        '....OOsSSsO.....',
      ],
    },
    pony: { // ponytail
      down: [
        '................',
        '................',
        '.....OOOOOO.....',
        '...OOHHHHHHOO...',
        '..OHLLHHHHHHhO..',
        '.OHLHHHHHHHHHhO.',
        '.OHHHHHHHHHHHhO.',
        '.OHhSSSSSSSShhO.',
        '.OHSSESSSSESShO.',
        '..OSSESSSSESSO..',
        '..OsSSSSSSSSsO..',
        '...OOssSSssOO...',
      ],
      up: [
        '................',
        '................',
        '.....OOOOOO.....',
        '...OOHHHHHHOO...',
        '..OHHLHHHHHHhO..',
        '.OHHLHHHHHHHHhO.',
        '.OHHHHHAAHHHHhO.',
        '.OHHHHHOOHHHHhO.',
        '.OhHHHOHHOHHhhO.',
        '..OhHHOHhOHhO...',
        '..OhhHOHhOhhO...',
        '...OOsOhhOOO....',
      ],
      left: [
        '................',
        '................',
        '......OOOOO.....',
        '....OOHHHHHOO...',
        '...OHLHHHHHHhOO.',
        '..OHHHHHHHHHAHhO',
        '..OHHHHHHHHHhOHO',
        '..OOSSSHHHHHhOHO',
        '...OSESSSSHHhOhO',
        '...OSESSSSShO.OO',
        '...OsSSSSSsO....',
        '....OOsSSsO.....',
      ],
    },
  };

  // Bodies: rows 12..23, three frames per direction (stand, step A, step B)
  const BODY = {
    normal: {
      down: [[
        '.....OTTTTO.....',
        '...OOTTAATTOO...',
        '..OTTTUTTTTTtO..',
        '..OTOTTTTTTOtO..',
        '..OTOtTTTTtOtO..',
        '..OSOPPPPPPOSO..',
        '...OOPPPPPPOO...',
        '....OPPppPPO....',
        '....OPPOOPPO....',
        '....OPpOOpPO....',
        '....OFFOOFFO....',
        '.....OO..OO.....',
      ], [
        '.....OTTTTO.....',
        '...OOTTAATTOO...',
        '..OTTTUTTTTTtO..',
        '..OTOTTTTTTOtO..',
        '..OSOtTTTTtOtO..',
        '...OOPPPPPPOSO..',
        '....OPPPPPPOO...',
        '....OPPppPPO....',
        '....OPPOOPPO....',
        '....OFFOOpPO....',
        '.....OOO.FFO....',
        '..........OO....',
      ], [
        '.....OTTTTO.....',
        '...OOTTAATTOO...',
        '..OTTTUTTTTTtO..',
        '..OTOTTTTTTOtO..',
        '..OTOtTTTTtOSO..',
        '..OSOPPPPPPOO...',
        '...OOPPPPPPO....',
        '....OPPppPPO....',
        '....OPPOOPPO....',
        '....OPpOOFFO....',
        '....OFFO.OOO....',
        '....OO..........',
      ]],
      up: [[
        '.....OTTTTO.....',
        '...OOTTTTTTOO...',
        '..OTTTTTTTTTtO..',
        '..OTOTTTTTTOtO..',
        '..OTOtTTTTtOtO..',
        '..OSOPPPPPPOSO..',
        '...OOPPPPPPOO...',
        '....OPPppPPO....',
        '....OPPOOPPO....',
        '....OPpOOpPO....',
        '....OFFOOFFO....',
        '.....OO..OO.....',
      ], [
        '.....OTTTTO.....',
        '...OOTTTTTTOO...',
        '..OTTTTTTTTTtO..',
        '..OTOTTTTTTOtO..',
        '..OTOtTTTTtOSO..',
        '..OSOPPPPPPOO...',
        '...OOPPPPPPO....',
        '....OPPppPPO....',
        '....OPPOOPPO....',
        '....OPpOOFFO....',
        '....OFFO.OOO....',
        '....OO..........',
      ], [
        '.....OTTTTO.....',
        '...OOTTTTTTOO...',
        '..OTTTTTTTTTtO..',
        '..OTOTTTTTTOtO..',
        '..OSOtTTTTtOtO..',
        '...OOPPPPPPOSO..',
        '....OPPPPPPOO...',
        '....OPPppPPO....',
        '....OPPOOPPO....',
        '....OFFOOpPO....',
        '.....OOO.FFO....',
        '..........OO....',
      ]],
      left: [[
        '.....OTTTO......',
        '....OTTTTTO.....',
        '....OTUTTTtO....',
        '....OTTTTTtO....',
        '....OTTTTttO....',
        '....OSPPPPpO....',
        '.....OPPPPO.....',
        '.....OPPPpO.....',
        '.....OPPPpO.....',
        '.....OPPppO.....',
        '....OFFFFpO.....',
        '....OOOOOOO.....',
      ], [
        '.....OTTTO......',
        '....OTTTTTO.....',
        '....OTUTTTtO....',
        '....OTTTTTtO....',
        '...OSTTTTttO....',
        '....OOPPPPpO....',
        '.....OPPPPpO....',
        '....OPPOOPpO....',
        '....OPPO.OppO...',
        '...OPPO..OppO...',
        '...OFFO...OFFO..',
        '...OOO.....OOO..',
      ], [
        '.....OTTTO......',
        '....OTTTTTO.....',
        '....OTUTTTtO....',
        '....OTTTTTtSO...',
        '....OTTTTttOO...',
        '.....OPPPPpO....',
        '.....OPPPPpO....',
        '....OppOOPPO....',
        '....OppO.OPPO...',
        '...OppO..OPPO...',
        '...OFFO...OFFO..',
        '...OOO.....OOO..',
      ]],
    },
  };
  // Long coat: shirt rows continue as coat over the legs
  // Lab coat: sleeves and sides in coat colour with the shirt/tie showing down the front, hem over the hips
  BODY.coat = transformBody(BODY.normal, (row, y, dir) => {
    const coat = c => c === 'T' || c === 'U' ? 'X' : c === 't' ? 'x' : c;
    if (y <= 4) return [...row].map((c, x) => dir === 'down' && x >= 6 && x <= 9 ? c : dir === 'left' && x <= 6 && y >= 1 ? c : coat(c)).join('');
    if (y >= 5 && y <= 7) return row.replace(/P/g, 'X').replace(/p/g, 'x');
    return row;
  });
  // Dress / skirt: widen pants region into a skirt
  BODY.dress = transformBody(BODY.normal, (row, y, dir) => {
    if (y === 5 || y === 6) return row.replace(/P/g, 'T').replace(/p/g, 't');
    if (y === 7) return dir === 'left' ? row.replace(/P/g, 'T').replace(/p/g, 't') : row.replace('....OPPppPPO....', '...OTTTttTTTO...');
    if (y >= 8 && y <= 9) return row.replace(/P/g, 'S').replace(/p/g, 's');
    return row;
  });
  // Shorts: bare legs below the hem
  BODY.shorts = transformBody(BODY.normal, (row, y) => y >= 8 && y <= 9 ? row.replace(/P/g, 'S').replace(/p/g, 's') : row);
  // Swimsuit: bare skin with trunks
  BODY.swim = transformBody(BODY.normal, (row, y) => {
    if (y <= 4) return row.replace(/[TUt]/g, 'S').replace(/A/g, 'S');
    if (y >= 7 && y <= 9) return row.replace(/P/g, 'S').replace(/p/g, 's');
    return row;
  });
  function transformBody(body, fn) {
    const out = {};
    for (const dir in body) out[dir] = body[dir].map(fr => fr.map((row, y) => fn(row, y, dir)));
    return out;
  }

  function buildPal(p) {
    const c = (v, d) => hex(v || d);
    const skin = c(p.skin, '#f0b88a'), hair = c(p.hair, '#4a3428'), hat = c(p.hat, '#d03a3a'), shirt = c(p.shirt, '#4a78c8');
    const pants = c(p.pants, '#3a4058'), shoes = c(p.shoes, '#2e2e3e'), accent = c(p.accent, '#f8f8f8'), coat = c(p.coat, '#f4f4f8');
    return {
      O: P.outline, S: skin, s: shade(skin, -0.25), E: hex('#1e1a2a'), W: hex('#ffffff'), M: shade(skin, -0.45),
      H: hair, h: shade(hair, -0.3), L: shade(hair, 0.3), C: hat, c: shade(hat, -0.3), K: p.hatK ? hex(p.hatK) : shade(hat, 0.45), B: p.brim ? hex(p.brim) : shade(hat, -0.45),
      T: shirt, t: shade(shirt, -0.28), U: shade(shirt, 0.3), A: accent, P: pants, p: shade(pants, -0.3), F: shoes, f: shade(shoes, 0.3),
      X: coat, x: shade(coat, -0.2), G: hex(p.bag || '#c8a040'), g: shade(hex(p.bag || '#c8a040'), -0.3),
    };
  }
  function paint(s, rows, pal, oy) {
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < 16; x++) {
      const ch = rows[y][x]; if (ch === '.' || ch === undefined) continue;
      const c = pal[ch]; if (c !== undefined) s.pset(x, oy + y, c);
    }
  }

  // Accessories drawn after composing (direction-aware)
  function extras(s, def, dir, frame, pal) {
    if (def.backpack && dir !== 'down') {
      const G1 = hex(def.backpack), g1 = shade(G1, -0.3), l1 = shade(G1, 0.3);
      if (dir === 'up') {
        for (let y = 13; y < 19; y++) for (let x = 4; x < 12; x++) s.pset(x, y, (y === 13 || x === 4 || x === 11 || y === 18) ? P.outline : (y < 15 ? l1 : x > 8 ? g1 : G1));
        s.pset(7, 15, P.outline); s.pset(8, 15, P.outline);
      } else {
        for (let y = 13; y < 19; y++) for (let x = 9; x < 13; x++) s.pset(x, y, (x === 12 || y === 13 || y === 18) ? P.outline : (x === 11 ? g1 : G1));
      }
    }
    if (def.glasses && dir !== 'up') {
      const gl = hex('#2a2a3a');
      if (dir === 'down') { s.pset(3, 8, gl); s.pset(4, 8, gl); s.pset(5, 8, gl); s.pset(6, 8, gl); s.pset(9, 8, gl); s.pset(10, 8, gl); s.pset(11, 8, gl); s.pset(12, 8, gl); s.pset(7, 8, gl); s.pset(8, 8, gl); }
      else { s.pset(3, 8, gl); s.pset(4, 8, gl); s.pset(5, 8, gl); s.pset(6, 8, gl); }
    }
    if (def.beard && dir !== 'up') {
      const bc = hex(def.beard);
      if (dir === 'down') { for (let x = 4; x < 12; x++) { s.pset(x, 10, bc); s.pset(x, 11, bc); } for (let x = 5; x < 11; x++) s.pset(x, 12, bc); s.pset(7, 10, pal.M); s.pset(8, 10, pal.M); }
      else { for (let x = 3; x < 8; x++) { s.pset(x, 10, bc); s.pset(x, 11, bc); } }
    }
    if (def.emblem && dir === 'down') { // e.g. Rocket 'R'
      const ec = hex(def.emblem);
      const R = ['##.', '#.#', '##.', '#.#'];
      R.forEach((r, y) => { for (let x = 0; x < 3; x++) if (r[x] === '#') s.pset(7 + x, 14 + y, ec); });
    }
  }

  const cache = {};
  function makeCharacter(def) {
    const key = JSON.stringify(def);
    if (cache[key]) return cache[key];
    const pal = buildPal(def);
    const head = HEADS[def.head || 'short'], body = BODY[def.body || 'normal'];
    const frames = {};
    for (const dir of ['down', 'up', 'left']) {
      frames[dir] = [0, 1, 2].map(f => {
        const s = new Surface(16, 24);
        paint(s, body[dir][f], pal, 12);
        paint(s, head[dir], pal, 0);
        extras(s, def, dir, f, pal);
        return s;
      });
    }
    frames.right = frames.left.map(s => s.flipped());
    cache[key] = frames;
    return frames;
  }

  G.chars = { HEADS, BODY, makeCharacter, buildPal };
})(globalThis.G);
