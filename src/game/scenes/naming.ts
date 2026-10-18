import { drawText } from '../core/font';
import type { Game } from '../core/game';
import { box, cursor, rect, UI } from '../core/gfx';
import { Modal } from '../core/scene';

const GRID = ['ABCDEFGHI', 'JKLMNOPQR', 'STUVWXYZ ', 'abcdefghi', 'jklmnopqr', 'stuvwxyz-'];
const MAX = 10;

/** Name entry with optional preset list. Returns the chosen name. */
export class NamingScene extends Modal<string> {
  opaque = true;
  name = '';
  cx = 0;
  cy = 0;
  presetIdx = 0;
  stage: 'preset' | 'grid';
  t = 0;

  constructor(
    g: Game,
    private title: string,
    private presets: string[],
    private fallback: string,
  ) {
    super();
    this.g = g;
    this.stage = presets.length ? 'preset' : 'grid';
  }

  update() {
    this.t++;
    const i = this.g.input;
    if (this.stage === 'preset') {
      const n = this.presets.length + 1;
      if (i.repeat('up')) this.presetIdx = (this.presetIdx + n - 1) % n;
      if (i.repeat('down')) this.presetIdx = (this.presetIdx + 1) % n;
      if (i.pressed('a')) {
        this.g.sfx('confirm');
        if (this.presetIdx === 0) this.stage = 'grid';
        else this.finish(this.presets[this.presetIdx - 1]);
      }
      return;
    }
    const rows = GRID.length + 1;
    if (i.repeat('up')) this.cy = (this.cy + rows - 1) % rows;
    if (i.repeat('down')) this.cy = (this.cy + 1) % rows;
    if (i.repeat('left')) this.cx = (this.cx + 8) % 9;
    if (i.repeat('right')) this.cx = (this.cx + 1) % 9;
    if (i.repeat('up') || i.repeat('down') || i.repeat('left') || i.repeat('right')) this.g.sfx('select');
    if (i.pressed('start')) {
      this.cy = GRID.length;
      this.cx = 5;
    }
    if (i.pressed('b')) {
      this.name = this.name.slice(0, -1);
      this.g.sfx('cancel');
    }
    if (i.pressed('a')) {
      if (this.cy === GRID.length) {
        if (this.cx >= 5) this.done();
        else this.name = this.name.slice(0, -1);
        return;
      }
      const ch = GRID[this.cy][this.cx];
      if (this.name.length < MAX) {
        this.name += ch;
        this.g.sfx('select');
      } else this.g.sfx('error');
      if (this.name.length === MAX) {
        this.cy = GRID.length;
        this.cx = 5;
      }
    }
  }

  private done() {
    const n = this.name.trim();
    this.g.sfx('confirm');
    this.finish(n.length ? n : this.fallback);
  }

  draw(c: CanvasRenderingContext2D) {
    rect(c, 0, 0, 160, 144, UI.paper);
    drawText(c, this.title, 8, 6);
    if (this.stage === 'preset') {
      box(c, 8, 20, 90, (this.presets.length + 1) * 12 + 10);
      ['NEW NAME', ...this.presets].forEach((p, k) => {
        this.g.pick(this, 11, 23 + k * 12, 84, 12, () => this.presetIdx !== k && ((this.presetIdx = k), true));
        drawText(c, p, 22, 26 + k * 12);
        if (k === this.presetIdx) cursor(c, 14, 26 + k * 12);
      });
      return;
    }
    // name field
    for (let k = 0; k < MAX; k++) {
      const ch = this.name[k] ?? '';
      drawText(c, ch, 20 + k * 8, 20);
      rect(c, 20 + k * 8, 30, 6, 1, k === this.name.length && Math.floor(this.t / 15) % 2 ? UI.accent : UI.ink);
    }
    box(c, 0, 38, 160, 106);
    GRID.forEach((row, y) => {
      for (let x = 0; x < 9; x++) {
        this.g.pick(this, 13 + x * 14, 43 + y * 13, 14, 13, () => (this.cx !== x || this.cy !== y) && ((this.cx = x), (this.cy = y), true));
        const ch = row[x] === ' ' ? '·' : row[x];
        drawText(c, ch, 20 + x * 14, 46 + y * 13);
      }
    });
    const ly = GRID.length;
    this.g.pick(this, 10, 43 + ly * 13, 40, 13, () => (this.cy !== ly || this.cx >= 5) && ((this.cy = ly), (this.cx = 0), true));
    this.g.pick(this, 94, 43 + ly * 13, 40, 13, () => (this.cy !== ly || this.cx < 5) && ((this.cy = ly), (this.cx = 5), true));
    drawText(c, 'DEL', 20, 46 + GRID.length * 13);
    drawText(c, 'END', 104, 46 + GRID.length * 13, UI.accent);
    if (this.cy === GRID.length) cursor(c, this.cx >= 5 ? 96 : 12, 46 + GRID.length * 13);
    else cursor(c, 12 + this.cx * 14, 46 + this.cy * 13);
  }
}
