/**
 * Overworld characters from Pokémon Claude Red (16×24, three walk frames per direction).
 * Each look is one of that project's cast definitions. See docs/sprite-map.md.
 */
import type { Dir } from '../core/input';
import { castOf, makeCharacterFrames, surfaceToCanvas } from './claude-red/bridge';
import { fromStrings } from './pixel';

export interface Look {
  id: string;
  [key: string]: unknown;
}

export interface CharSprites {
  down: HTMLCanvasElement[];
  up: HTMLCanvasElement[];
  left: HTMLCanvasElement[];
  right: HTMLCanvasElement[];
}

/** Native frame size of a Claude Red overworld character. */
export const CHAR_W = 16;
export const CHAR_H = 24;

const cache = new Map<string, CharSprites>();

function L(id: string): Look {
  return { id, ...castOf(id) };
}

export function charSprites(look: Look): CharSprites {
  const hit = cache.get(look.id);
  if (hit) return hit;
  const frames = makeCharacterFrames(look);
  const paint = (list: { w: number; h: number; data: Uint32Array }[]) => list.map(surfaceToCanvas);
  const s: CharSprites = {
    down: paint(frames.down),
    up: paint(frames.up),
    left: paint(frames.left),
    right: paint(frames.right),
  };
  cache.set(look.id, s);
  return s;
}

/** Frame for a direction and walk phase (0 = standing, 1 and 2 = the two step frames). */
export function charFrame(s: CharSprites, dir: Dir, phase: number): HTMLCanvasElement {
  const frames = s[dir];
  const i = phase <= 0 ? 0 : 1 + ((phase - 1) % Math.max(1, frames.length - 1));
  return frames[Math.min(i, frames.length - 1)];
}

/**
 * Draw a character so its feet sit on `feetY`. `x` is the left edge.
 * Scale 1 is the overworld (16×24). Battle and the title use a larger scale.
 */
export function drawChar(c: CanvasRenderingContext2D, frame: HTMLCanvasElement, x: number, feetY: number, scale = 1) {
  const w = frame.width * scale;
  const h = frame.height * scale;
  c.drawImage(frame, Math.round(x), Math.round(feetY - h), Math.round(w), Math.round(h));
}

/**
 * Old 16×16 sprites were drawn 4px above the tile, so their feet landed 12px
 * below the tile top. Taller Claude Red sprites keep that same foot line.
 */
export const CHAR_FEET = 12;

export const LOOKS: Record<string, Look> = {
  player: L('red'),
  rival: L('blue'),
  prof: L('oak'),
  mom: L('mom'),
  keeper: L('nurse'),
  clerk: L('clerk'),
  grunt: L('rocket'),
  sable: L('channeler'),
  nyx: L('giovanni'),
  corvin: L('rocket'),
  garrick: L('brock'),
  nerissa: L('misty'),
  cass: L('surge'),
  mossa: L('erika'),
  silas: L('koga'),
  orin: L('sabrina'),
  vulk: L('blaine'),
  isolde: L('lorelei'),
  thorne: L('bruno'),
  wren: L('cooltrainer_f'),
  morrigan: L('agatha'),
  vesper: L('lance'),
  elowen: L('cooltrainer_f'),
  youngster: L('youngster'),
  lass: L('girl'),
  hiker: L('hiker'),
  oldman: L('gramps'),
  girl: L('little_girl'),
  boy: L('little_boy'),
  gardener: L('safari_zone_worker'),
  firebreather: L('biker'),
  skier: L('sailor'),
  birdkeeper: L('gym_guide'),
  ace: L('cooltrainer_m'),
  scholar: L('super_nerd'),
  guard: L('guard'),
  sailor: L('sailor'),
  fisher: L('fisher'),
  swimmer: L('swimmer'),
  mystic: L('channeler'),
  blackbelt: L('bruno'),
  beauty: L('beauty'),
  gentleman: L('gentleman'),
  engineer: L('silph_worker_m'),
  scientist: L('scientist'),
  busker: L('gambler'),
  racer: L('bike_shop_clerk'),
  tamer: L('warden'),
  captain: L('captain'),
  mime: L('rocker'),
};

// ---------- small overworld objects ----------

let itemBall: HTMLCanvasElement | null = null;
/** Poké Ball from Claude Red's object sprites, drawn on the 16×16 item tile. */
export function itemBallSprite(): HTMLCanvasElement {
  if (itemBall) return itemBall;
  itemBall = fromStrings(
    [
      '................',
      '................',
      '................',
      '................',
      '................',
      '.....OOOOOO.....',
      '....OLRRRRRO....',
      '...ORLRRRRRrO...',
      '...ORRRRRRRrO...',
      '...OOOOWWOOOO...',
      '...OWWOWKOWwO...',
      '...OWWWOOWWwO...',
      '....OWWWWWwO....',
      '.....OOOOOO.....',
      '................',
      '................',
    ],
    { O: '#1b1a2e', R: '#e04848', r: '#a82838', L: '#ff9a8a', W: '#f8f8f8', w: '#c8c8d8', K: '#3a3a48' },
  );
  return itemBall;
}

let bubble: HTMLCanvasElement | null = null;
/** Alert bubble. Claude Red has no separate emote sprite, so this one stays. */
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
