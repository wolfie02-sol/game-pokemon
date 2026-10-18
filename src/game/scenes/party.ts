import { creatureIcon } from '../art/creatures';
import { drawText, padLeft } from '../core/font';
import type { Game } from '../core/game';
import { box, cursor, hpBar, rect, UI } from '../core/gfx';
import { Modal } from '../core/scene';
import { isAlive, maxHp, monName } from '../systems/mon';
import { say } from './dialog';
import { SummaryScene } from './summary';

export type PartyMode = 'field' | 'battle' | 'forced' | 'item' | 'pick';

/**
 * Party list. Returns the selected index (battle/forced/item/pick) or -1.
 * In field mode it handles summary and reordering itself.
 */
export class PartyScene extends Modal<number> {
  opaque = true;
  idx = 0;
  sub: { items: string[]; idx: number } | null = null;
  swapFrom: number | null = null;
  busy = false;
  t = 0;
  wheelScroll = true;

  constructor(
    g: Game,
    private mode: PartyMode,
    private current = -1,
    private prompt?: string,
  ) {
    super();
    this.g = g;
    if (mode === 'forced') {
      const alive = g.state!.party.findIndex((m, i) => i !== current && isAlive(m));
      this.idx = Math.max(0, alive);
    }
  }

  get party() {
    return this.g.state!.party;
  }

  update() {
    this.t++;
    if (this.busy) return;
    const i = this.g.input;
    const n = this.party.length;
    if (this.sub) {
      const s = this.sub;
      if (i.repeat('up')) s.idx = (s.idx + s.items.length - 1) % s.items.length;
      if (i.repeat('down')) s.idx = (s.idx + 1) % s.items.length;
      if (i.pressed('b')) {
        this.sub = null;
        this.g.sfx('cancel');
        return;
      }
      if (i.pressed('a')) {
        this.g.sfx('confirm');
        void this.subAction(s.items[s.idx]);
      }
      return;
    }
    if (i.repeat('up')) {
      this.idx = (this.idx + n - 1) % n;
      this.g.sfx('select');
    }
    if (i.repeat('down')) {
      this.idx = (this.idx + 1) % n;
      this.g.sfx('select');
    }
    if (i.pressed('b')) {
      if (this.swapFrom !== null) {
        this.swapFrom = null;
        this.g.sfx('cancel');
        return;
      }
      if (this.mode === 'forced') {
        this.g.sfx('error');
        return;
      }
      this.g.sfx('cancel');
      this.finish(-1);
      return;
    }
    if (i.pressed('a')) {
      this.g.sfx('confirm');
      if (this.swapFrom !== null) {
        const a = this.swapFrom;
        const b = this.idx;
        [this.party[a], this.party[b]] = [this.party[b], this.party[a]];
        this.swapFrom = null;
        return;
      }
      if (this.mode === 'item' || this.mode === 'pick') {
        this.finish(this.idx);
        return;
      }
      if (this.mode === 'forced') {
        const m = this.party[this.idx];
        if (!isAlive(m) || this.idx === this.current) {
          void this.blockMsg(!isAlive(m) ? 'There is no energy left to battle!' : `${monName(m)} is already out!`);
          return;
        }
        this.finish(this.idx);
        return;
      }
      this.sub = {
        items: this.mode === 'battle' ? ['SHIFT', 'SUMMARY', 'CANCEL'] : ['SUMMARY', 'SWITCH', 'CANCEL'],
        idx: 0,
      };
    }
  }

  private async blockMsg(t: string) {
    this.busy = true;
    await say(this.g, t);
    this.busy = false;
  }

  private async subAction(a: string) {
    this.sub = null;
    if (a === 'CANCEL') return;
    if (a === 'SUMMARY') {
      this.busy = true;
      const ni = await this.g.open(new SummaryScene(this.g, this.party, this.idx));
      this.idx = ni;
      this.busy = false;
      return;
    }
    if (a === 'SWITCH') {
      this.swapFrom = this.idx;
      return;
    }
    if (a === 'SHIFT') this.finish(this.idx);
  }

  draw(c: CanvasRenderingContext2D) {
    rect(c, 0, 0, 160, 144, UI.paper);
    this.party.forEach((m, k) => {
      const y = 2 + k * 20;
      const sel = k === this.idx;
      if (!this.sub && !this.busy) this.g.pick(this, 2, y, 156, 19, () => this.idx !== k && ((this.idx = k), true));
      if (sel) rect(c, 2, y, 156, 19, UI.paperShade);
      if (this.swapFrom === k) rect(c, 2, y, 156, 19, '#f8d8a8');
      const bounce = sel && isAlive(m) && Math.floor(this.t / 8) % 2 ? -1 : 0;
      c.drawImage(creatureIcon(m.sp), 10, y + 1 + bounce);
      drawText(c, monName(m), 30, y + 1, isAlive(m) ? UI.ink : UI.muted);
      drawText(c, `Lv${m.lvl}`, 120, y + 1);
      if (m.status) {
        rect(c, 98, y, 20, 9, '#a858c0');
        drawText(c, m.status, 99, y + 1, '#ffffff');
      } else if (!isAlive(m)) {
        rect(c, 98, y, 20, 9, UI.muted);
        drawText(c, 'FNT', 99, y + 1, '#ffffff');
      }
      hpBar(c, 30, y + 12, 48, m.hp / maxHp(m));
      drawText(c, `${padLeft(m.hp, 3)}/${padLeft(maxHp(m), 3)}`, 98, y + 10);
      if (sel) cursor(c, 2, y + 6);
    });
    const msg =
      this.prompt ??
      (this.swapFrom !== null
        ? 'Move to where?'
        : this.mode === 'forced'
          ? 'Bring out which Wildkin?'
          : this.mode === 'item'
            ? 'Use on which Wildkin?'
            : 'Choose a Wildkin.');
    box(c, 0, 122, 160, 22);
    drawText(c, msg, 8, 129);
    if (this.sub) {
      const w = 70;
      const h = this.sub.items.length * 12 + 10;
      box(c, 160 - w, 122 - h, w, h);
      this.sub.items.forEach((it, k) => {
        const sub = this.sub!;
        this.g.pick(this, 160 - w + 3, 122 - h + 3 + k * 12, w - 6, 12, () => sub.idx !== k && ((sub.idx = k), true));
        drawText(c, it, 160 - w + 14, 122 - h + 6 + k * 12);
        if (k === this.sub!.idx) cursor(c, 160 - w + 6, 122 - h + 6 + k * 12);
      });
    }
  }
}
