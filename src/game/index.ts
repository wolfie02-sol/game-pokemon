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
import { SPECIES } from './data/species';
import { ITEMS, canLearnTM } from './data/items';
import { effectiveness } from './data/elements';
import { trainerTeam } from './data/trainers';
import { stats, maxHp, evolutionByItem } from './systems/mon';

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
    /** Read-only game data for automated players (tile flags, species, moves, items). */
    data: { TILES, SPECIES, MOVES, ITEMS, effectiveness, trainerTeam, stats, maxHp, canLearnTM, evolutionByItem },
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
    /** Simulate failures for the recovery tests. */
    crash(kind: 'script' | 'update' | 'fatal' | 'async') {
      if (kind === 'update') g.testThrow = 'once';
      else if (kind === 'fatal') g.testThrow = 'always';
      else if (kind === 'async') void Promise.reject(new Error('Test async error'));
      else {
        const ow = g.scenes.find((x) => x instanceof Overworld) as Overworld | undefined;
        void ow?.run(async (c) => {
          await c.say('Test event starting.');
          throw new Error('Test script error');
        });
      }
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
  g.recover = () => {
    // only events in the overworld can be dropped safely
    const base = g.scenes[0];
    if (!(base instanceof Overworld) || !g.state) return false;
    g.scenes = [base];
    base.recoverFromError();
    g.input.consume();
    g.autosave.pause('error');
    g.autosave.pendingMessage =
      "Something went wrong during that event, so it was stopped. Autosave is paused: SAVE from the menu to keep playing from here, or reload the page to go back to your last save.";
    return true;
  };
  g.push(new TitleScene());
  g.start();
  (window as unknown as { __wildkinDebug: unknown }).__wildkinDebug = debugApi(g);
  (window as unknown as { __allMoves: string[] }).__allMoves = Object.keys(MOVES);
  return g;
}
