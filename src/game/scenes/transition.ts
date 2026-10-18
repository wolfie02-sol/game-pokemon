import type { Game } from '../core/game';
import { H, rect, W } from '../core/gfx';
import { Modal } from '../core/scene';

/** Flash, then horizontal bars sweep in from alternating sides. */
class BattleTransition extends Modal<void> {
  t = 0;
  constructor(private trainer: boolean) {
    super();
  }
  enter() {
    this.g.sfx('encounter');
    this.g.music(this.trainer ? 'battle' : 'battle');
  }
  update() {
    this.t++;
    if (this.t >= 58) this.finish();
  }
  draw(c: CanvasRenderingContext2D) {
    const t = this.t;
    if (t < 24) {
      if (Math.floor(t / 4) % 2 === 0) {
        c.globalAlpha = 0.75;
        rect(c, 0, 0, W, H, t < 12 ? '#ffffff' : '#000000');
        c.globalAlpha = 1;
      }
      return;
    }
    const p = Math.min(1, (t - 24) / 30);
    const bars = 9;
    const bh = H / bars;
    for (let i = 0; i < bars; i++) {
      const w = W * Math.min(1, p * 1.4 - (this.trainer ? (i % 3) * 0.12 : 0));
      if (w <= 0) continue;
      if (i % 2 === 0) rect(c, 0, i * bh, w, bh + 1, '#0d0c16');
      else rect(c, W - w, i * bh, w, bh + 1, '#0d0c16');
    }
  }
}

export function battleTransition(g: Game, trainer: boolean): Promise<void> {
  return g.open(new BattleTransition(trainer));
}

/** Simple fade to/from black as its own scene (used by title/intro). */
export class FadeScene extends Modal<void> {
  t = 0;
  constructor(
    private dir: 'in' | 'out',
    private frames = 16,
  ) {
    super();
  }
  update() {
    this.t++;
    if (this.t >= this.frames) this.finish();
  }
  draw(c: CanvasRenderingContext2D) {
    const p = this.t / this.frames;
    const a = this.dir === 'out' ? p : 1 - p;
    c.globalAlpha = Math.round(a * 4) / 4;
    rect(c, 0, 0, W, H, '#000');
    c.globalAlpha = 1;
  }
}
