import { drawText } from '../core/font';
import type { Game } from '../core/game';
import { box, cursor, UI } from '../core/gfx';
import { BASE_LINES, LINE_CHARS, paginate } from '../core/paginate';
import { Modal } from '../core/scene';

export { LINE_CHARS };

/** Line pitch inside the dialogue box. */
export const LINE_H = 11;
/** Standard (3-line) box height and its top edge. */
export const TB_H = 48;
export const TB_Y = 144 - TB_H;

/** Height of a dialogue box that shows `n` lines. Grows upward for long sentences. */
export function boxHeight(n: number): number {
  return Math.max(TB_H, 14 + Math.max(n, BASE_LINES) * LINE_H);
}

/** Replace {PLAYER}/{RIVAL} tokens. */
export function fmt(g: Game, text: string): string {
  const s = g.state;
  return text.replace(/\{PLAYER\}/g, s?.name ?? 'REN').replace(/\{RIVAL\}/g, s?.rival ?? 'VEX');
}

const SPEAKER = /^[A-Z0-9][A-Z0-9 .'-]{0,18}:\s/;

/**
 * Join several dialogue strings into one paginatable text. Strings by the same
 * speaker flow together sentence by sentence; a new speaker tag starts a new page.
 */
export function joinDialogue(parts: string[]): string {
  return parts.reduce((acc, p, i) => {
    if (i === 0) return p;
    return acc + (SPEAKER.test(p) ? '\n\n' : ' ') + p;
  }, '');
}

/** Draw a dialogue box sized to its lines, revealing `reveal` characters. */
export function drawTextBox(c: CanvasRenderingContext2D, lines: string[], reveal = 9999) {
  const h = boxHeight(lines.length);
  const y = 144 - h;
  box(c, 0, y, 160, h);
  let left = reveal;
  lines.forEach((ln, i) => {
    const part = ln.slice(0, Math.max(0, left));
    left -= ln.length;
    drawText(c, part, 8, y + 7 + i * LINE_H, UI.ink);
  });
  return y;
}

/** Blinking "more text" arrow in the box's bottom-right corner. */
export function drawMoreArrow(c: CanvasRenderingContext2D, t: number) {
  if (Math.floor(t / 16) % 2 === 0) drawText(c, '▼', 146, 144 - 13, UI.ink);
}

/** Typewriter text box. Pages hold whole sentences; resolves when dismissed. */
export class TextScene extends Modal<void> {
  pages: string[][];
  page = 0;
  shown = 0;
  t = 0;

  constructor(
    g: Game,
    text: string,
    private opts: { auto?: number; noWait?: boolean } = {},
  ) {
    super();
    this.pages = paginate(fmt(g, text));
  }

  private pageLen(): number {
    return this.pages[this.page].join('').length;
  }

  private isLast() {
    return this.page >= this.pages.length - 1;
  }

  update() {
    const i = this.g.input;
    this.t++;
    const fast = i.down('a') || i.down('b');
    if (this.shown < this.pageLen()) {
      this.shown += this.g.textRate() * (fast ? 4 : 1);
      if (i.pressed('a') || i.pressed('b')) this.shown = this.pageLen();
      return;
    }
    const last = this.isLast();
    if (last && this.opts.noWait) {
      this.finish();
      return;
    }
    if (last && this.opts.auto !== undefined) {
      this.opts.auto--;
      if (this.opts.auto <= 0 || i.pressed('a')) this.finish();
      return;
    }
    if (i.pressed('a') || i.pressed('b')) {
      this.g.sfx('select');
      if (last) this.finish();
      else {
        this.page++;
        this.shown = 0;
      }
    }
  }

  draw(c: CanvasRenderingContext2D) {
    drawTextBox(c, this.pages[this.page], Math.floor(this.shown));
    const done = this.shown >= this.pageLen();
    if (done && !(this.isLast() && (this.opts.noWait || this.opts.auto !== undefined))) drawMoreArrow(c, this.t);
    // click / tap anywhere advances, exactly like pressing A
    this.g.region(this, { x: 0, y: 0, w: 160, h: 144, click: () => this.g.input.tap('a') });
  }
}

/** Prompt text plus a list of options above the text box. */
export class ChoiceScene extends Modal<number> {
  idx = 0;
  lines: string[];
  wheelScroll = true;
  constructor(
    g: Game,
    prompt: string,
    private options: string[],
    private cancelIdx: number | null = null,
  ) {
    super();
    const pages = paginate(fmt(g, prompt));
    this.lines = pages[pages.length - 1];
  }

  update() {
    const i = this.g.input;
    if (i.repeat('up')) {
      this.idx = (this.idx + this.options.length - 1) % this.options.length;
      this.g.sfx('select');
    }
    if (i.repeat('down')) {
      this.idx = (this.idx + 1) % this.options.length;
      this.g.sfx('select');
    }
    if (i.pressed('a')) {
      this.g.sfx('confirm');
      this.finish(this.idx);
    } else if (i.pressed('b') && this.cancelIdx !== null) {
      this.g.sfx('cancel');
      this.finish(this.cancelIdx);
    }
  }

  draw(c: CanvasRenderingContext2D) {
    const hasPrompt = this.lines.join('').length > 0;
    const top = hasPrompt ? drawTextBox(c, this.lines) : 144;
    const w = Math.max(...this.options.map((o) => o.length)) * 6 + 22;
    const h = this.options.length * 12 + 10;
    const x = 160 - w;
    const y = top - h;
    box(c, x, y, w, h);
    this.options.forEach((o, k) => {
      drawText(c, o, x + 14, y + 6 + k * 12, UI.ink);
      if (k === this.idx) cursor(c, x + 6, y + 6 + k * 12);
      this.g.region(this, {
        x: x + 3,
        y: y + 3 + k * 12,
        w: w - 6,
        h: 12,
        hover: () => {
          if (this.idx !== k) {
            this.idx = k;
            this.g.sfx('select');
          }
        },
        click: () => this.g.input.tap('a'),
      });
    });
  }
}

export function say(g: Game, text: string | string[]): Promise<void> {
  const t = Array.isArray(text) ? joinDialogue(text) : text;
  return g.open(new TextScene(g, t));
}

export function sayAuto(g: Game, text: string, frames = 40): Promise<void> {
  return g.open(new TextScene(g, text, { auto: frames }));
}

export async function ask(g: Game, prompt: string, options: string[], cancelIdx: number | null = null): Promise<number> {
  await g.open(new TextScene(g, prompt, { noWait: true }));
  return g.open(new ChoiceScene(g, prompt, options, cancelIdx));
}

export async function yesNo(g: Game, prompt: string): Promise<boolean> {
  return (await ask(g, prompt, ['YES', 'NO'], 1)) === 0;
}
