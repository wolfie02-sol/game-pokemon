import { Game } from './core/game';
import { TitleScene } from './scenes/title';
import { Overworld } from './scenes/overworld';
import { buildTiles, TILES, TS } from './art/tiles';
import { charFrame, charSprites, itemBallSprite, LOOKS } from './art/people';
import { allMaps } from './world/maps';
import { newMon, newState, receiveMon, type GameState } from './systems/state';
import { speciesByName } from './data/species';
import { TRAINERS } from './data/trainers';
import { MOVES } from './data/moves';

export { Game };
export type { Btn } from './core/input';

/**
 * Small testing hook used by the automated browser checks: start a game at a
 * given place with a given party, without playing through the intro.
 */
export function debugApi(g: Game) {
  return {
    maps: allMaps,
    trainers: TRAINERS,
    /** Draw a whole map (tiles, NPCs, items) to a data URL for visual review. */
    renderMap(id: string): string {
      const m = allMaps()[id];
      const c = document.createElement('canvas');
      c.width = m.w * TS;
      c.height = m.h * TS;
      const x = c.getContext('2d')!;
      for (let ty = 0; ty < m.h; ty++)
        for (let tx = 0; tx < m.w; tx++) {
          const d = TILES[m.tiles[ty * m.w + tx]];
          x.drawImage(d.variants ? d.variants[0] : d.frames[0], tx * TS, ty * TS);
        }
      for (const it of m.items) x.drawImage(itemBallSprite(), it.x * TS, it.y * TS);
      for (const n of m.npcs) x.drawImage(charFrame(charSprites(LOOKS[n.look] ?? LOOKS.boy), n.dir, 0), n.x * TS, n.y * TS - 4);
      x.fillStyle = 'rgba(255,0,0,0.35)';
      for (const w of m.warps) x.fillRect(w.x * TS + 4, w.y * TS + 4, 8, 8);
      return c.toDataURL();
    },
    start(opts: { map: string; x: number; y: number; party?: [string, number][]; flags?: string[]; bag?: Record<string, number>; badges?: string[]; patch?: Partial<GameState> }) {
      const s = newState(g.rng);
      s.flags.gotStarter = true;
      s.flags.gotDex = true;
      s.starter = 4;
      for (const f of opts.flags ?? []) s.flags[f] = true;
      Object.assign(s.bag, opts.bag ?? {});
      s.badges = opts.badges ?? [];
      for (const [name, lvl] of opts.party ?? [['Emberkit', 10]]) receiveMon(s, newMon(s, speciesByName(name), lvl, g.rng));
      s.map = opts.map;
      s.x = opts.x;
      s.y = opts.y;
      Object.assign(s, opts.patch ?? {});
      g.state = s;
      g.reset(new Overworld(g));
      return s;
    },
  };
}

/** Create and start the game on a canvas. */
export function createGame(canvas: HTMLCanvasElement): Game {
  buildTiles();
  allMaps();
  const g = new Game(canvas);
  g.push(new TitleScene());
  g.start();
  (window as unknown as { __wildkinDebug: unknown }).__wildkinDebug = debugApi(g);
  (window as unknown as { __allMoves: string[] }).__allMoves = Object.keys(MOVES);
  return g;
}
