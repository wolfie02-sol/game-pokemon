import { creatureSprite } from '../art/creatures';
import { silhouette } from '../art/pixel';
import type { Game } from '../core/game';
import { rect } from '../core/gfx';
import { Modal } from '../core/scene';
import { move } from '../data/moves';
import { species } from '../data/species';
import { evolve, monName, movesAt, type Mon } from '../systems/mon';
import { markCaught as markCaughtEvo } from '../systems/state';
import { say, yesNo } from './dialog';
import { ForgetMoveScene } from './summary';

/** Shared out-of-battle move learning flow. */
export async function learnMoveDialog(g: Game, m: Mon, id: string) {
  const mv = move(id);
  if (m.moves.some((x) => x.id === id)) return;
  if (m.moves.length < 4) {
    m.moves.push({ id, pp: mv.pp });
    g.sfx('item');
    await say(g, `${monName(m)} learned ${mv.name.toUpperCase()}!`);
    return;
  }
  for (;;) {
    await say(g, `${monName(m)} wants to learn ${mv.name.toUpperCase()}. But it already knows 4 moves.`);
    if (await yesNo(g, 'Forget a move to make room?')) {
      const slot = await g.open(new ForgetMoveScene(g, m, id));
      if (slot >= 0) {
        const old = move(m.moves[slot].id);
        m.moves[slot] = { id, pp: mv.pp };
        await say(g, `1, 2, and... Poof! ${monName(m)} forgot ${old.name.toUpperCase()} and learned ${mv.name.toUpperCase()}!`);
        return;
      }
    }
    if (await yesNo(g, `Stop learning ${mv.name.toUpperCase()}?`)) {
      await say(g, `${monName(m)} did not learn ${mv.name.toUpperCase()}.`);
      return;
    }
  }
}

export class EvolutionScene extends Modal<boolean> {
  opaque = true;
  t = 0;
  phase: 'intro' | 'anim' | 'done' = 'intro';
  showNew = false;
  cancelled = false;
  flash = 0;

  constructor(
    g: Game,
    private mon: Mon,
    private to: number,
    private noCancel = false,
  ) {
    super();
    this.g = g;
  }

  enter() {
    this.g.audio.stop();
    void this.run();
  }

  private async run() {
    const g = this.g;
    const from = this.mon.sp;
    const oldName = monName(this.mon);
    await say(g, `What? ${oldName} is evolving!`);
    this.phase = 'anim';
    g.sfx('evolve');
    await new Promise<void>((res) => {
      this.animDone = res;
    });
    if (this.cancelled) {
      await say(g, `Huh? ${oldName} stopped evolving!`);
      this.finish(false);
      return;
    }
    this.flash = 20;
    evolve(this.mon, this.to);
    markCaughtEvo(g.state!, this.to);
    this.showNew = true;
    this.phase = 'done';
    g.sfx('levelup');
    await say(g, `Congratulations! Your ${oldName} evolved into ${species(this.to).name.toUpperCase()}!`);
    for (const id of movesAt(species(this.to), this.mon.lvl)) await learnMoveDialog(g, this.mon, id);
    void from;
    this.finish(true);
  }

  private animDone: (() => void) | null = null;

  update() {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.phase !== 'anim') return;
    // speed up the swap as time passes
    const p = this.t;
    const period = Math.max(3, 24 - Math.floor(p / 10));
    this.showNew = Math.floor(p / period) % 2 === 1;
    if (this.g.input.pressed('b') && !this.noCancel) {
      this.cancelled = true;
      this.showNew = false;
      this.phase = 'done';
      this.animDone?.();
      return;
    }
    if (p > 220) {
      this.phase = 'done';
      this.animDone?.();
    }
  }

  draw(c: CanvasRenderingContext2D) {
    rect(c, 0, 0, 160, 144, '#f8f4e8');
    const sp = this.showNew ? this.to : this.mon.sp;
    let spr = creatureSprite(this.phase === 'done' ? this.mon.sp : sp);
    if (this.phase === 'anim') spr = silhouette(creatureSprite(sp), '#3a3450');
    c.drawImage(spr, 56, 30);
    if (this.phase === 'anim') {
      for (let k = 0; k < 8; k++) {
        const a = this.t / 12 + (k / 8) * Math.PI * 2;
        const r = 36 + Math.sin(this.t / 9) * 6;
        rect(c, 80 + Math.cos(a) * r, 54 + Math.sin(a) * r * 0.7, 2, 2, k % 2 ? '#f8d040' : '#88c8f0');
      }
    }
    if (this.flash > 0) {
      c.globalAlpha = this.flash / 20;
      rect(c, 0, 0, 160, 144, '#ffffff');
      c.globalAlpha = 1;
    }
  }
}
