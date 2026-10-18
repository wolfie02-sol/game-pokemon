import { creatureSprite } from '../art/creatures';
import { drawText, padLeft, wrap } from '../core/font';
import type { Game } from '../core/game';
import { box, cursor, expBar, hpBar, rect, TYPE_COLORS, UI } from '../core/gfx';
import { Modal } from '../core/scene';
import { move } from '../data/moves';
import { species } from '../data/species';
import { expFor, maxHp, monName, stats, type Mon } from '../systems/mon';

function typeTag(c: CanvasRenderingContext2D, t: string, x: number, y: number) {
  rect(c, x, y, 38, 9, TYPE_COLORS[t]);
  drawText(c, t, x + 1, y + 1, '#ffffff');
}

/** Two-page Wildkin summary. Returns the index being viewed when closed. */
export class SummaryScene extends Modal<number> {
  opaque = true;
  wheelScroll = true;
  page = 0;
  moveSel = 0;
  constructor(
    g: Game,
    private list: Mon[],
    private idx: number,
  ) {
    super();
    this.g = g;
  }

  update() {
    const i = this.g.input;
    if (i.pressed('left') || i.pressed('right')) {
      this.page = 1 - this.page;
      this.g.sfx('select');
    }
    if (this.page === 1) {
      const n = this.list[this.idx].moves.length;
      if (i.repeat('up') && this.moveSel > 0) this.moveSel--;
      else if (i.repeat('down') && this.moveSel < n - 1) this.moveSel++;
      else if (i.repeat('up') || i.repeat('down')) this.switchMon(i.repeat('up') ? -1 : 1);
    } else {
      if (i.repeat('up')) this.switchMon(-1);
      if (i.repeat('down')) this.switchMon(1);
    }
    if (i.pressed('b') || i.pressed('a')) {
      this.g.sfx('cancel');
      this.finish(this.idx);
    }
  }

  private switchMon(d: number) {
    const n = this.list.length;
    if (n < 2) return;
    this.idx = (this.idx + d + n) % n;
    this.moveSel = 0;
    this.g.sfx('select');
  }

  draw(c: CanvasRenderingContext2D) {
    const m = this.list[this.idx];
    const s = species(m.sp);
    rect(c, 0, 0, 160, 144, UI.paper);
    rect(c, 0, 0, 160, 12, '#3a3450');
    drawText(c, this.page === 0 ? 'INFO' : 'MOVES', 6, 2, '#ffffff');
    drawText(c, '◀ ▶', 130, 2, '#ffffff');
    this.g.button(this, 126, 0, 17, 12, 'left');
    this.g.button(this, 143, 0, 17, 12, 'right');
    c.drawImage(creatureSprite(m.sp), 2, 14);
    drawText(c, `No.${padLeft(s.id, 3).replace(/ /g, '0')}`, 52, 16);
    drawText(c, monName(m), 52, 26);
    drawText(c, `Lv${m.lvl}`, 52, 36);
    s.types.forEach((t, k) => typeTag(c, t, 52 + k * 42, 46));
    if (this.page === 0) {
      const st = stats(m);
      hpBar(c, 6, 66, 60, m.hp / maxHp(m));
      drawText(c, `${m.hp}/${maxHp(m)}`, 90, 64);
      drawText(c, `STATUS ${m.status ?? 'OK'}`, 6, 74);
      const rows: [string, number][] = [
        ['ATTACK', st.atk],
        ['DEFENSE', st.def],
        ['SPEED', st.spd],
        ['SPECIAL', st.spc],
      ];
      box(c, 0, 84, 92, 60);
      rows.forEach(([n, v], k) => {
        drawText(c, n, 6, 90 + k * 12);
        drawText(c, padLeft(v, 3), 66, 90 + k * 12);
      });
      box(c, 92, 84, 68, 60);
      drawText(c, 'EXP', 98, 90);
      drawText(c, padLeft(m.exp, 7), 110, 99);
      drawText(c, 'NEXT', 98, 110);
      drawText(c, padLeft(Math.max(0, expFor(m.lvl + 1) - m.exp), 7), 110, 119);
      expBar(c, 98, 132, 54, (m.exp - expFor(m.lvl)) / Math.max(1, expFor(m.lvl + 1) - expFor(m.lvl)));
      drawText(c, `OT ${m.ot || '?'}`, 100, 16);
    } else {
      box(c, 0, 58, 160, 58);
      m.moves.forEach((mv, k) => {
        const d = move(mv.id);
        this.g.pick(this, 3, 61 + k * 12, 154, 12, () => this.moveSel !== k && ((this.moveSel = k), true), 'select');
        drawText(c, d.name.toUpperCase(), 14, 64 + k * 12, UI.ink);
        drawText(c, `${padLeft(mv.pp, 2)}/${padLeft(d.pp, 2)}`, 118, 64 + k * 12);
        if (k === this.moveSel) cursor(c, 5, 64 + k * 12);
      });
      const d = move(m.moves[this.moveSel]?.id ?? m.moves[0].id);
      box(c, 0, 114, 160, 30);
      typeTag(c, d.type, 6, 120);
      drawText(c, d.cat === 'status' ? 'STATUS' : `POW ${d.pow}`, 50, 121);
      drawText(c, `ACC ${d.acc || '--'}`, 104, 121);
      drawText(c, wrap(d.desc, 24)[0], 6, 132);
    }
  }
}

/** Pick which of 4 moves to forget for a new one. Returns slot or -1. */
export class ForgetMoveScene extends Modal<number> {
  opaque = true;
  wheelScroll = true;
  idx = 0;
  constructor(
    g: Game,
    private m: Mon,
    private newId: string,
  ) {
    super();
    this.g = g;
  }
  update() {
    const i = this.g.input;
    if (i.repeat('up')) this.idx = (this.idx + 4) % 5;
    if (i.repeat('down')) this.idx = (this.idx + 1) % 5;
    if (i.pressed('b')) {
      this.g.sfx('cancel');
      this.finish(-1);
    }
    if (i.pressed('a')) {
      this.g.sfx('confirm');
      this.finish(this.idx === 4 ? -1 : this.idx);
    }
  }
  draw(c: CanvasRenderingContext2D) {
    rect(c, 0, 0, 160, 144, UI.paper);
    drawText(c, `Forget which move?`, 6, 4);
    drawText(c, monName(this.m), 6, 14, UI.muted);
    box(c, 0, 24, 160, 70);
    const ids = [...this.m.moves.map((x) => x.id), this.newId];
    ids.forEach((id, k) => {
      const d = move(id);
      const y = 30 + k * 12;
      this.g.pick(this, 3, y - 3, 154, 12, () => this.idx !== k && ((this.idx = k), true));
      drawText(c, (k === 4 ? 'NEW ' : '') + d.name.toUpperCase(), 14, y, k === 4 ? '#d04838' : UI.ink);
      if (k === this.idx) cursor(c, 5, y);
    });
    const d = move(ids[this.idx]);
    box(c, 0, 96, 160, 48);
    typeTag(c, d.type, 6, 102);
    drawText(c, d.cat === 'status' ? 'STATUS' : `POW ${d.pow}`, 50, 103);
    drawText(c, `PP ${d.pp}`, 110, 103);
    wrap(d.desc, 24)
      .slice(0, 2)
      .forEach((l, k) => drawText(c, l, 6, 116 + k * 10));
  }
}
