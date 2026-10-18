import { Game } from './core/game';
import { TitleScene } from './scenes/title';
import { buildTiles } from './art/tiles';
import { allMaps } from './world/maps';

export { Game };
export type { Btn } from './core/input';

/** Create and start the game on a canvas. */
export function createGame(canvas: HTMLCanvasElement): Game {
  buildTiles();
  allMaps();
  const g = new Game(canvas);
  g.push(new TitleScene());
  g.start();
  return g;
}
