import { creatureIcon } from '../art/creatures';
import { drawText } from '../core/font';
import type { Game } from '../core/game';
import { box, cursor, rect, UI } from '../core/gfx';
import { Modal } from '../core/scene';
import { isAlive, monName } from '../systems/mon';
import { drawTextBox, say, yesNo } from './dialog';
import { PartyScene } from './party';
import { SummaryScene } from './summary';

/** LINK TERMINAL storage: withdraw / deposit / release. */
export class StorageScene extends Modal<void> {
  menuIdx = 0;
  stage: 'menu' | 'withdraw' | 'release' = 'menu';
  idx = 0;
  scroll = 0;
  busy = false;
  wheelScroll = true;

  constructor(g: Game) {
    super();
    this.g = g;
  }

  get s() {
    return this.g.state!;
  }

  update() {
    if (this.busy) return;
    const i = this.g.input;
    if (this.stage === 'menu') {
      if (i.repeat('up')) this.menuIdx = (this.menuIdx + 3) % 4;
      if (i.repeat('down')) this.menuIdx = (this.menuIdx + 1) % 4;
      if (i.pressed('b') || (i.pressed('a') && this.menuIdx === 3)) {
        this.g.sfx('cancel');
        this.finish();
        return;
      }
      if (i.pressed('a')) {
        this.g.sfx('confirm');
        if (this.menuIdx === 0 || this.menuIdx === 2) {
          if (!this.s.box.length) {
            this.busy = true;
            void say(this.g, 'There are no Wildkin in storage.').then(() => (this.busy = false));
            return;
          }
          this.stage = this.menuIdx === 0 ? 'withdraw' : 'release';
          this.idx = 0;
          this.scroll = 0;
        } else void this.deposit();
      }
      return;
    }
    const n = this.s.box.length + 1;
    if (i.repeat('up')) this.idx = (this.idx + n - 1) % n;
    if (i.repeat('down')) this.idx = (this.idx + 1) % n;
    if (this.idx < this.scroll) this.scroll = this.idx;
    if (this.idx >= this.scroll + 6) this.scroll = this.idx - 5;
    if (i.pressed('b') || (i.pressed('a') && this.idx === this.s.box.length)) {
      this.stage = 'menu';
      this.g.sfx('cancel');
      return;
    }
    if (i.pressed('select') && this.idx < this.s.box.length) {
      this.busy = true;
      void this.g.open(new SummaryScene(this.g, this.s.box, this.idx)).then(() => (this.busy = false));
      return;
    }
    if (i.pressed('a')) void (this.stage === 'withdraw' ? this.withdraw() : this.release());
  }

  private async withdraw() {
    this.busy = true;
    const s = this.s;
    if (s.party.length >= 6) {
      await say(this.g, 'Your party is full! Deposit a Wildkin first.');
    } else {
      const [m] = s.box.splice(this.idx, 1);
      s.party.push(m);
      this.g.sfx('confirm');
      await say(this.g, `${monName(m)} was withdrawn.`);
      if (!s.box.length) this.stage = 'menu';
      this.idx = Math.min(this.idx, s.box.length);
    }
    this.busy = false;
  }

  private async deposit() {
    this.busy = true;
    const s = this.s;
    const idx = await this.g.open(new PartyScene(this.g, 'pick', -1, 'Deposit which Wildkin?'));
    if (idx >= 0) {
      const alive = s.party.filter(isAlive).length;
      if (s.party.length <= 1 || (isAlive(s.party[idx]) && alive <= 1)) {
        await say(this.g, "You can't deposit your last healthy Wildkin!");
      } else {
        const [m] = s.party.splice(idx, 1);
        s.box.push(m);
        this.g.sfx('confirm');
        await say(this.g, `${monName(m)} was stored.`);
      }
    }
    this.busy = false;
  }

  private async release() {
    this.busy = true;
    const m = this.s.box[this.idx];
    if (await yesNo(this.g, `Release ${monName(m)} back to the wild? This cannot be undone.`)) {
      this.s.box.splice(this.idx, 1);
      await say(this.g, `${monName(m)} was released. Bye bye, ${monName(m)}!`);
      if (!this.s.box.length) this.stage = 'menu';
      this.idx = Math.min(this.idx, this.s.box.length);
    }
    this.busy = false;
  }

  draw(c: CanvasRenderingContext2D) {
    if (this.stage === 'menu') {
      box(c, 0, 0, 100, 58);
      ['WITHDRAW', 'DEPOSIT', 'RELEASE', 'LOG OFF'].forEach((t, k) => {
        if (!this.busy) this.g.pick(this, 3, 4 + k * 12, 94, 12, () => this.menuIdx !== k && ((this.menuIdx = k), true));
        drawText(c, t, 16, 7 + k * 12);
        if (k === this.menuIdx) cursor(c, 7, 7 + k * 12);
      });
      if (!this.busy) drawTextBox(c, [`Party ${this.s.party.length}/6`, `Storage ${this.s.box.length}`]);
      return;
    }
    rect(c, 0, 0, 160, 144, UI.paper);
    drawText(c, this.stage === 'withdraw' ? 'WITHDRAW' : 'RELEASE', 6, 4);
    drawText(c, 'SELECT: info', 86, 4, UI.muted);
    box(c, 0, 14, 160, 130);
    const rows = [...this.s.box.map((m) => m), null];
    rows.slice(this.scroll, this.scroll + 6).forEach((m, k) => {
      const y = 22 + k * 19;
      const idx = k + this.scroll;
      if (!this.busy) this.g.pick(this, 3, y - 6, 154, 19, () => this.idx !== idx && ((this.idx = idx), true));
      if (m) {
        c.drawImage(creatureIcon(m.sp), 16, y - 3);
        drawText(c, monName(m), 36, y);
        drawText(c, `Lv${m.lvl}`, 120, y);
      } else drawText(c, 'CANCEL', 36, y);
      if (k + this.scroll === this.idx) cursor(c, 6, y);
    });
  }
}
