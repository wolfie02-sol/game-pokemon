/** Original 16x16 overworld character sprites with palette-swapped looks. */
import type { Dir } from '../core/input';
import { fromStrings, mirror, mix } from './pixel';

export interface Look {
  style: 'cap' | 'short' | 'long';
  hair: string;
  /** cap colour (cap style only) */
  cap?: string;
  shirt: string;
  pants?: string;
  shoes?: string;
  skin?: string;
}

const DOWN0 = [
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhHHHHhhk...',
  '...khhhhhhhhk...',
  '..kkhhhhhhhhkk..',
  '..kkkkkkkkkkkk..',
  '...kssssssssk...',
  '...ksessssesk...',
  '...kssssssssk...',
  '....kssssssk....',
  '...kcwccccwck...',
  '..ksccccccccsk..',
  '..kskccccccksk..',
  '...kkppppppkk...',
  '....kppkkppk....',
  '....kbbkkbbk....',
];
const WALK_DOWN_LEGS = ['...kkppppppkk...', '....kppkkpk.....', '....kbbk.kk.....'];

const UP0 = [
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhHHHHhhk...',
  '...khhhhhhhhk...',
  '...khhhhhhhhk...',
  '...khhhhhhhhk...',
  '...kaaaaaaaak...',
  '...kaaaaaaaak...',
  '...ksaaaaaask...',
  '....kssssssk....',
  '...kcCCCCCCck...',
  '..ksCCCCCCCCsk..',
  '..kskccccccksk..',
  '...kkppppppkk...',
  '....kppkkppk....',
  '....kbbkkbbk....',
];

const LEFT0 = [
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khHHHhhhhk...',
  '...khhhhhhhhk...',
  '..kkkkhhhhhhk...',
  '..kkkkkkkkkkk...',
  '...ksssaaaaak...',
  '...kesssaaaak...',
  '...ksssssaaak...',
  '....ksssssk.....',
  '....kcccccck....',
  '....kcsccCck....',
  '....kcsccCck....',
  '....kkppppkk....',
  '.....kppppk.....',
  '.....kbbbbk.....',
];
const WALK_LEFT_LEGS = ['....kkppppkk....', '....kpk..kpk....', '...kbbk..kbbk...'];

function setChar(row: string, i: number, ch: string) {
  return row.slice(0, i) + ch + row.slice(i + 1);
}

function styled(base: string[], dir: 'down' | 'up' | 'left', style: Look['style']): string[] {
  const r = [...base];
  if (style === 'cap') return r;
  if (dir === 'down') {
    r[4] = '...khhhhhhhhk...';
    r[5] = '...khhhhhhhhk...';
    r[6] = '...khsssssshk...';
  } else if (dir === 'up') {
    // back of head is already hair
  } else {
    r[4] = '...khhhhhhhhk...';
    r[5] = '...khhhhhhhhk...';
  }
  if (style === 'long') {
    for (let y = 6; y <= 10; y++) {
      if (dir === 'down' || dir === 'up') {
        r[y] = setChar(setChar(setChar(setChar(r[y], 2, 'k'), 3, 'a'), 12, 'a'), 13, 'k');
      } else {
        r[y] = setChar(setChar(setChar(r[y], 11, 'a'), 12, 'a'), 13, 'k');
      }
    }
  }
  return r;
}

function withLegs(base: string[], legs: string[]): string[] {
  return [...base.slice(0, 13), ...legs];
}

export interface CharSprites {
  down: HTMLCanvasElement[];
  up: HTMLCanvasElement[];
  left: HTMLCanvasElement[];
  right: HTMLCanvasElement[];
}

const cache = new Map<string, CharSprites>();

export function charSprites(look: Look): CharSprites {
  const key = JSON.stringify(look);
  const hit = cache.get(key);
  if (hit) return hit;
  const hairCol = look.hair;
  const top = look.style === 'cap' ? (look.cap ?? '#e04838') : hairCol;
  const pal: Record<string, string> = {
    k: '#201a2e',
    h: top,
    H: mix(top, '#ffffff', 0.35),
    a: hairCol,
    s: look.skin ?? '#f8d0a8',
    e: '#201a2e',
    c: look.shirt,
    C: mix(look.shirt, '#1a1030', 0.25),
    w: '#f8f4e8',
    p: look.pants ?? '#34384e',
    b: look.shoes ?? '#a84838',
  };
  const d0 = styled(DOWN0, 'down', look.style);
  const u0 = styled(UP0, 'up', look.style);
  const l0 = styled(LEFT0, 'left', look.style);
  const dw = fromStrings(withLegs(d0, WALK_DOWN_LEGS), pal);
  const uw = fromStrings(withLegs(u0, WALK_DOWN_LEGS), pal);
  const left = [fromStrings(l0, pal), fromStrings(withLegs(l0, WALK_LEFT_LEGS), pal)];
  const s: CharSprites = {
    down: [fromStrings(d0, pal), dw, mirror(dw)],
    up: [fromStrings(u0, pal), uw, mirror(uw)],
    left,
    right: left.map(mirror),
  };
  cache.set(key, s);
  return s;
}

/** Frame for a direction and walk phase (0 = standing). */
export function charFrame(s: CharSprites, dir: Dir, phase: number): HTMLCanvasElement {
  if (dir === 'left' || dir === 'right') return s[dir][phase === 0 ? 0 : 1];
  return s[dir][phase];
}

export const LOOKS: Record<string, Look> = {
  player: { style: 'cap', cap: '#e04838', hair: '#3a2a28', shirt: '#3870d8', pants: '#2a3048', shoes: '#c84838' },
  rival: { style: 'short', hair: '#e8a038', shirt: '#9850c0', pants: '#30304a', shoes: '#383048' },
  prof: { style: 'short', hair: '#d8d8e0', shirt: '#f0f0f8', pants: '#5a5070', shoes: '#584038' },
  mom: { style: 'long', hair: '#8a4a30', shirt: '#f07890', pants: '#3a3a58' },
  keeper: { style: 'long', hair: '#f090b0', shirt: '#f8f8ff', pants: '#f8f8ff', shoes: '#f090b0' },
  clerk: { style: 'cap', cap: '#4c78d8', hair: '#3a2a28', shirt: '#4c78d8', pants: '#2a3048' },
  grunt: { style: 'long', hair: '#3a3048', shirt: '#3a3048', pants: '#2a2236', shoes: '#e050a0' },
  sable: { style: 'long', hair: '#c8c0d8', shirt: '#5a3878', pants: '#2a2236', shoes: '#e050a0' },
  nyx: { style: 'long', hair: '#e050a0', shirt: '#2e2442', pants: '#1e1830', shoes: '#e050a0' },
  mossa: { style: 'long', hair: '#58a048', shirt: '#e8d8a0', pants: '#6a5038' },
  vulk: { style: 'short', hair: '#e04020', shirt: '#f08030', pants: '#3a2a28' },
  isolde: { style: 'long', hair: '#d8f0ff', shirt: '#5890d8', pants: '#e8f0f8', shoes: '#5890d8' },
  elowen: { style: 'long', hair: '#8858c0', shirt: '#f0e0ff', pants: '#8858c0', shoes: '#d8a838' },
  youngster: { style: 'cap', cap: '#f0c030', hair: '#5a3a28', shirt: '#f0c030', pants: '#3858a8' },
  lass: { style: 'long', hair: '#a86838', shirt: '#f080a8', pants: '#f8f4e8' },
  hiker: { style: 'cap', cap: '#8a5a30', hair: '#3a2a28', shirt: '#58904c', pants: '#6a5038' },
  oldman: { style: 'short', hair: '#e8e8f0', shirt: '#988870', pants: '#5a4a38' },
  girl: { style: 'long', hair: '#2a2028', shirt: '#58b8a8', pants: '#3a3a58' },
  boy: { style: 'short', hair: '#5a3a28', shirt: '#e05848', pants: '#3a3a58' },
  gardener: { style: 'cap', cap: '#e8d8a0', hair: '#5a3a28', shirt: '#68a848', pants: '#6a5038' },
  firebreather: { style: 'short', hair: '#f8d040', shirt: '#d84830', pants: '#2a2236' },
  skier: { style: 'cap', cap: '#78c8f0', hair: '#c88848', shirt: '#f8f8ff', pants: '#5890d8' },
  birdkeeper: { style: 'cap', cap: '#58a848', hair: '#3a2a28', shirt: '#c8a868', pants: '#585040' },
  ace: { style: 'short', hair: '#2a2028', shirt: '#f8f4e8', pants: '#c83848', shoes: '#c83848' },
  scholar: { style: 'short', hair: '#6a4a38', shirt: '#7068a8', pants: '#3a3458' },
  guard: { style: 'cap', cap: '#3858a8', hair: '#3a2a28', shirt: '#3858a8', pants: '#2a3048', shoes: '#201a2e' },
  sailor: { style: 'cap', cap: '#f8f8ff', hair: '#3a2a28', shirt: '#4878c8', pants: '#f8f8ff' },
  fisher: { style: 'cap', cap: '#68904c', hair: '#5a3a28', shirt: '#d8c890', pants: '#4a5870' },
  swimmer: { style: 'short', hair: '#e8b038', shirt: '#f8c8a0', pants: '#3878d8', shoes: '#f8c8a0', skin: '#f8c8a0' },
  mystic: { style: 'long', hair: '#e8e0f0', shirt: '#6858a0', pants: '#4a3c78', shoes: '#2a2238' },
  blackbelt: { style: 'short', hair: '#2a2028', shirt: '#f8f4e8', pants: '#f8f4e8', shoes: '#2a2028' },
  beauty: { style: 'long', hair: '#f0c040', shirt: '#e85090', pants: '#e85090', shoes: '#f8f8ff' },
  gentleman: { style: 'short', hair: '#a8a0a0', shirt: '#4a3c58', pants: '#2a2236', shoes: '#201a2e' },
  engineer: { style: 'cap', cap: '#f0c030', hair: '#3a2a28', shirt: '#e88830', pants: '#4a5870' },
  scientist: { style: 'short', hair: '#58a8c8', shirt: '#f0f0f8', pants: '#5a6080', shoes: '#384050' },
  busker: { style: 'short', hair: '#c83848', shirt: '#2a2a3a', pants: '#3a5888', shoes: '#c83848' },
  racer: { style: 'cap', cap: '#e83838', hair: '#2a2028', shirt: '#f8f8ff', pants: '#2a2028', shoes: '#e83838' },
  tamer: { style: 'cap', cap: '#8a5a30', hair: '#2a2028', shirt: '#a87848', pants: '#4a3828' },
  captain: { style: 'cap', cap: '#283868', hair: '#f8f8ff', shirt: '#283868', pants: '#283868', shoes: '#201a2e' },
  corvin: { style: 'short', hair: '#585068', shirt: '#2e2442', pants: '#1e1830', shoes: '#58c0a0' },
  garrick: { style: 'short', hair: '#6a5038', shirt: '#988060', pants: '#5a4a38', shoes: '#3a2a28' },
  nerissa: { style: 'long', hair: '#e86048', shirt: '#4890f0', pants: '#f8f4e8', shoes: '#4890f0' },
  cass: { style: 'cap', cap: '#f0c828', hair: '#f8e8a0', shirt: '#4a5870', pants: '#2a3048', shoes: '#f0c828' },
  silas: { style: 'short', hair: '#583878', shirt: '#2e2442', pants: '#58304a', shoes: '#a858c0' },
  orin: { style: 'long', hair: '#2a2028', shirt: '#f060a0', pants: '#4a2840', shoes: '#f060a0' },
  thorne: { style: 'short', hair: '#2a2028', shirt: '#c04838', pants: '#2a2028', shoes: '#c04838' },
  wren: { style: 'long', hair: '#f8f8ff', shirt: '#98a8f0', pants: '#5868a8', shoes: '#f8f8ff' },
  morrigan: { style: 'long', hair: '#a8a0c8', shirt: '#3a2a58', pants: '#2a1e40', shoes: '#6858a0' },
  vesper: { style: 'short', hair: '#e04838', shirt: '#7058e8', pants: '#2a2048', shoes: '#f0c040' },
  mime: { style: 'short', hair: '#f8f8ff', shirt: '#f0b0c8', pants: '#5878d8', shoes: '#f8f8ff', skin: '#f8f4f8' },
};

// ---------- small overworld objects ----------

let itemBall: HTMLCanvasElement | null = null;
export function itemBallSprite(): HTMLCanvasElement {
  if (itemBall) return itemBall;
  itemBall = fromStrings(
    [
      '................',
      '................',
      '................',
      '................',
      '.....kkkkkk.....',
      '....krrlrrrk....',
      '...krrlrrrrrk...',
      '...krrrrrrrrk...',
      '...kkkkwwkkkk...',
      '...kwwkwwkwwk...',
      '...kwwwkkwwwk...',
      '....kwwwwwwk....',
      '.....kkkkkk.....',
      '................',
      '................',
      '................',
    ],
    { k: '#201a2e', r: '#e04848', l: '#ff9898', w: '#f8f4e8' },
  );
  return itemBall;
}

let bubble: HTMLCanvasElement | null = null;
export function exclaimSprite(): HTMLCanvasElement {
  if (bubble) return bubble;
  bubble = fromStrings(
    [
      '..kkkkkkkkkkk...',
      '.kwwwwwwwwwwwk..',
      '.kwwwwkkwwwwwk..',
      '.kwwwwkkwwwwwk..',
      '.kwwwwkkwwwwwk..',
      '.kwwwwkkwwwwwk..',
      '.kwwwwkkwwwwwk..',
      '.kwwwwwwwwwwwk..',
      '.kwwwwkkwwwwwk..',
      '.kwwwwkkwwwwwk..',
      '.kwwwwwwwwwwwk..',
      '..kkkkkwwkkkk...',
      '......kwk.......',
      '.......k........',
      '................',
      '................',
    ],
    { k: '#201a2e', w: '#f8f4e8' },
  );
  return bubble;
}
