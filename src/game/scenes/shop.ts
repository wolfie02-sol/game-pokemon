import { drawText, padLeft, wrap } from '../core/font';
import type { Game } from '../core/game';
import { box, cursor, UI } from '../core/gfx';
import { Modal } from '../core/scene';
import { item, ITEMS } from '../data/items';
import { addItem, removeItem } from '../systems/state';
import { drawTextBox, say, yesNo } from './dialog';

type Stage = 'menu' | 'buy' | 'sell' | 'qty';

export class ShopScene extends Modal<void> {
  stage: Stage = 'menu';
  menuIdx = 0;
  idx = 0;
  scroll = 0;
  qty = 1;
  selling = false;
  busy = false;
  wheelScroll = true;

  constructor(
    g: Game,
    private stock: string[],
  ) {
    super();
    this.g = g;
  }

  get s() {
    return this.g.state!;
  }

  sellList(): string[] {
    return Object.keys(ITEMS).filter((id) => (this.s.bag[id] ?? 0) > 0 && item(id).price > 0);
  }

  list(): string[] {
    return this.stage === 'sell' || (this.stage === 'qty' && this.selling) ? this.sellList() : this.stock;
  }

  update() {
    if (this.busy) return;
    const i = this.g.input;
    if (this.stage === 'menu') {
      if (i.repeat('up')) this.menuIdx = (this.menuIdx + 2) % 3;
      if (i.repeat('down')) this.menuIdx = (this.menuIdx + 1) % 3;
      if (i.pressed('b') || (i.pressed('a') && this.menuIdx === 2)) {
        this.busy = true;
        void say(this.g, 'Thank you! Please come again!').then(() => this.finish());
        return;
      }
      if (i.pressed('a')) {
        this.g.sfx('confirm');
        this.selling = this.menuIdx === 1;
        if (this.selling && !this.sellList().length) {
          this.busy = true;
          void say(this.g, "You don't have anything to sell.").then(() => (this.busy = false));
          return;
        }
        this.stage = this.selling ? 'sell' : 'buy';
        this.idx = 0;
        this.scroll = 0;
      }
      return;
    }
    const list = this.list();
    if (this.stage === 'buy' || this.stage === 'sell') {
      const n = list.length + 1;
      if (i.repeat('up')) this.idx = (this.idx + n - 1) % n;
      if (i.repeat('down')) this.idx = (this.idx + 1) % n;
      if (this.idx < this.scroll) this.scroll = this.idx;
      if (this.idx >= this.scroll + 5) this.scroll = this.idx - 4;
      if (i.pressed('b') || (i.pressed('a') && this.idx === list.length)) {
        this.stage = 'menu';
        this.g.sfx('cancel');
        return;
      }
      if (i.pressed('a')) {
        const id = list[this.idx];
        const price = this.unitPrice(id);
        if (!this.selling && price > this.s.money) {
          this.busy = true;
          this.g.sfx('error');
          void say(this.g, "You don't have enough money.").then(() => (this.busy = false));
          return;
        }
        this.qty = 1;
        this.stage = 'qty';
        this.g.sfx('confirm');
      }
      return;
    }
    // qty
    const id = list[this.idx];
    const max = this.selling ? (this.s.bag[id] ?? 0) : Math.max(1, Math.min(99, Math.floor(this.s.money / this.unitPrice(id))));
    if (i.repeat('up')) this.qty = this.qty >= max ? 1 : this.qty + 1;
    if (i.repeat('down')) this.qty = this.qty <= 1 ? max : this.qty - 1;
    if (i.repeat('right')) this.qty = Math.min(max, this.qty + 10);
    if (i.repeat('left')) this.qty = Math.max(1, this.qty - 10);
    if (i.pressed('b')) {
      this.stage = this.selling ? 'sell' : 'buy';
      return;
    }
    if (i.pressed('a')) void this.confirm(id);
  }

  private unitPrice(id: string) {
    return this.selling ? Math.floor(item(id).price / 2) : item(id).price;
  }

  private async confirm(id: string) {
    this.busy = true;
    const def = item(id);
    const total = this.unitPrice(id) * this.qty;
    const ok = await yesNo(
      this.g,
      this.selling
        ? `I can pay $${total} for ${this.qty} ${def.name.toUpperCase()}. OK?`
        : `${def.name.toUpperCase()}, and you want ${this.qty}? That'll be $${total}. OK?`,
    );
    if (ok) {
      if (this.selling) {
        removeItem(this.s, id, this.qty);
        this.s.money += total;
      } else {
        this.s.money -= total;
        addItem(this.s, id, this.qty);
      }
      this.g.sfx('buy');
      await say(this.g, 'Here you are! Thank you!');
      if (!this.selling && id === 'pod' && this.qty >= 10) {
        addItem(this.s, 'greatpod', 1);
        await say(this.g, 'You bought 10 or more pods, so please take this GREAT POD as a bonus!');
      }
    }
    this.stage = this.selling ? 'sell' : 'buy';
    if (this.selling && !this.sellList().length) this.stage = 'menu';
    if (this.idx > this.list().length) this.idx = this.list().length;
    this.busy = false;
  }

  draw(c: CanvasRenderingContext2D) {
    // money
    box(c, 96, 0, 64, 22);
    drawText(c, `$${this.s.money}`, 104, 7);
    if (this.stage === 'menu') {
      box(c, 0, 0, 64, 46);
      ['BUY', 'SELL', 'QUIT'].forEach((t, k) => {
        if (!this.busy) this.g.pick(this, 3, 4 + k * 12, 58, 12, () => this.menuIdx !== k && ((this.menuIdx = k), true));
        drawText(c, t, 16, 7 + k * 12);
        if (k === this.menuIdx) cursor(c, 7, 7 + k * 12);
      });
      if (!this.busy) drawTextBox(c, ['Hello! What would you', 'like to do today?']);
      return;
    }
    const list = this.list();
    box(c, 0, 24, 160, 72);
    const rows = [...list.map((id) => [item(id).name.toUpperCase(), `$${padLeft(this.unitPrice(id), 4)}`]), ['CANCEL', '']];
    rows.slice(this.scroll, this.scroll + 5).forEach(([n, p], k) => {
      const y = 31 + k * 12;
      const idx = k + this.scroll;
      if (this.stage !== 'qty' && !this.busy) this.g.pick(this, 3, y - 3, 154, 12, () => this.idx !== idx && ((this.idx = idx), true));
      drawText(c, n, 14, y);
      drawText(c, p, 112, y);
      if (k + this.scroll === this.idx) cursor(c, 5, y);
    });
    if (this.stage === 'qty') {
      const id = list[this.idx];
      box(c, 80, 74, 80, 22);
      if (!this.busy) {
        this.g.button(this, 80, 74, 40, 22, 'down');
        this.g.button(this, 120, 74, 40, 22, 'a');
      }
      drawText(c, `x${padLeft(this.qty, 2)}`, 86, 81);
      drawText(c, `$${this.unitPrice(id) * this.qty}`, 112, 81);
    }
    if (!this.busy) {
      const id = list[this.idx];
      drawTextBox(c, id ? wrap(item(id).desc, 24).slice(0, 2) : ['Anything else?']);
    }
    void UI;
  }
}
