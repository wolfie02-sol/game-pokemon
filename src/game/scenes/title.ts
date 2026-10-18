import { creatureSprite } from '../art/creatures';
import { charFrame, charSprites, LOOKS } from '../art/people';
import { drawText, drawTextScaled, textWidth } from '../core/font';
import type { Game } from '../core/game';
import { box, cursor, rect } from '../core/gfx';
import { Scene } from '../core/scene';
import { drawSky } from './ending';
import { hasSave, loadGame } from '../systems/save';
import { newState } from '../systems/state';
import { Rng } from '../core/rng';
import { say } from './dialog';
import { drawSaveLine, OptionsScene } from './menus';
import { NamingScene } from './naming';
import { Overworld } from './overworld';
import { FadeScene } from './transition';

const SHOWCASE = [1, 4, 7, 22, 18, 26, 13, 20, 37];

export class TitleScene extends Scene {
  opaque = true;
  t = 0;
  stage: 'press' | 'menu' = 'press';
  idx = 0;
  busy = false;
  monIdx = 0;
  monT = 0;
  hasSave = false;
  saved: ReturnType<typeof loadGame> = null;

  enter() {
    this.g.music('title');
    this.hasSave = hasSave();
    this.saved = this.hasSave ? loadGame() : null;
  }

  menuItems(): string[] {
    return this.hasSave ? ['CONTINUE', 'NEW GAME', 'OPTIONS'] : ['NEW GAME', 'OPTIONS'];
  }

  update() {
    this.t++;
    this.monT++;
    if (this.monT > 240) {
      this.monT = 0;
      this.monIdx = (this.monIdx + 1) % SHOWCASE.length;
    }
    if (this.busy) return;
    const i = this.g.input;
    if (this.stage === 'press') {
      if (i.pressed('start') || i.pressed('a')) {
        this.g.sfx('confirm');
        this.g.music('title');
        this.stage = 'menu';
      }
      return;
    }
    const items = this.menuItems();
    if (i.repeat('up')) {
      this.idx = (this.idx + items.length - 1) % items.length;
      this.g.sfx('select');
    }
    if (i.repeat('down')) {
      this.idx = (this.idx + 1) % items.length;
      this.g.sfx('select');
    }
    if (i.pressed('b')) this.stage = 'press';
    if (i.pressed('a')) {
      this.g.sfx('confirm');
      void this.choose(items[this.idx]);
    }
  }

  private async choose(it: string) {
    const g = this.g;
    this.busy = true;
    if (it === 'OPTIONS') {
      await g.open(new OptionsScene(g));
      this.busy = false;
      return;
    }
    if (it === 'CONTINUE') {
      const st = loadGame();
      if (!st) {
        await say(g, 'The save file could not be read.');
        this.busy = false;
        return;
      }
      await g.open(new FadeScene('out'));
      g.state = st;
      g.rng = new Rng(st.seed ^ Math.floor(st.playTime));
      g.reset(new Overworld(g));
      g.hooks.onChange?.();
      return;
    }
    await g.open(new FadeScene('out'));
    g.reset(new IntroScene());
  }

  draw(c: CanvasRenderingContext2D) {
    drawSky(c, this.t);
    // logo
    const logo = 'WILDKIN';
    const lw = textWidth(logo) * 3;
    const lx = Math.floor((160 - lw) / 2);
    const ly = 12 + Math.round(Math.sin(this.t / 30) * 1.5);
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [2, 2],
      [1, 2],
      [2, 1],
    ])
      drawTextScaled(c, logo, lx + dx, ly + dy, 3, '#1a1030');
    drawTextScaled(c, logo, lx, ly, 3, '#f8d040');
    drawTextScaled(c, logo, lx, ly, 3, '#f8d040');
    // top highlight
    c.save();
    c.beginPath();
    c.rect(0, ly, 160, 9);
    c.clip();
    drawTextScaled(c, logo, lx, ly, 3, '#fff4b0');
    c.restore();
    const sub = 'EMBER EDITION';
    rect(c, 80 - textWidth(sub) / 2 - 4, 43, textWidth(sub) + 8, 11, '#d04838');
    drawText(c, sub, 80 - textWidth(sub) / 2, 45, '#ffffff');

    // showcase creature
    const sp = SHOWCASE[this.monIdx];
    const slide = this.monT < 20 ? (20 - this.monT) * 6 : this.monT > 220 ? -(this.monT - 220) * 6 : 0;
    c.drawImage(creatureSprite(sp), 92 + slide, 72);
    const fr = charFrame(charSprites(LOOKS.player), 'right', 0);
    c.drawImage(fr, 0, 0, 16, 16, 30, 82, 32, 32);

    if (this.stage === 'press') {
      this.g.button(this, 0, 0, 160, 144, 'a');
      if (Math.floor(this.t / 30) % 2 === 0) {
        const p = 'PRESS START';
        rect(c, 80 - textWidth(p) / 2 - 3, 129, textWidth(p) + 6, 11, '#1a1030');
        drawText(c, p, 80 - textWidth(p) / 2, 131, '#f8f4e8');
      }
    } else {
      const items = this.menuItems();
      if (this.saved && items[this.idx] === 'CONTINUE') drawSaveLine(c, this.saved, 58);
      const h = items.length * 12 + 10;
      box(c, 40, 140 - h, 80, h);
      items.forEach((it, k) => {
        this.g.pick(this, 43, 143 - h + k * 12, 74, 12, () => this.idx !== k && ((this.idx = k), true));
        drawText(c, it, 56, 146 - h + k * 12);
        if (k === this.idx) cursor(c, 46, 146 - h + k * 12);
      });
    }
  }
}

// ---------------- INTRO ----------------

class IntroScene extends Scene {
  opaque = true;
  show: 'prof' | 'mon' | 'player' | 'rival' | 'none' = 'none';
  t = 0;
  shrink = 0;

  enter() {
    this.g.music('haven');
    void this.run();
  }

  private async run() {
    const g = this.g;
    g.state = newState(g.rng);
    await g.open(new FadeScene('in'));
    this.show = 'prof';
    await say(g, [
      'Hello there! Welcome to the region of VARROW!',
      "My name is MARISOL FENN, but everyone calls me PROF. FENN. I study the creatures we call WILDKIN.",
    ]);
    this.show = 'mon';
    g.sfx('catch');
    await say(g, [
      'This little one is a Sproutle. Wildkin live in every meadow, cave and lake of VARROW.',
      'Some people battle with them, some study them... and some, like me, simply want to understand them.',
    ]);
    this.show = 'player';
    await say(g, 'Now, tell me a little about yourself. What is your name?');
    const name = await g.open(new NamingScene(g, 'YOUR NAME?', ['REN', 'SKY', 'JUNO'], 'REN'));
    g.state!.name = name.toUpperCase() === name ? name : name;
    await say(g, `Right! So your name is ${name}!`);
    this.show = 'rival';
    await say(g, 'This is my grandkid. You two have been neighbors and rivals since you could walk. What was their name again?');
    const rival = await g.open(new NamingScene(g, "RIVAL'S NAME?", ['VEX', 'NOVA', 'CORIN'], 'VEX'));
    g.state!.rival = rival;
    await say(g, `That's right! ${rival}! Always one step ahead... or so they claim.`);
    this.show = 'player';
    await say(g, [
      `${name}! Your very own Wildkin adventure is about to begin!`,
      'A world of dreams, discovery and battles awaits. Come visit my lab when you are ready!',
    ]);
    g.sfx('run');
    for (let k = 0; k < 30; k++) {
      this.shrink = k / 30;
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    }
    await g.open(new FadeScene('out'));
    g.reset(new Overworld(g));
    g.hooks.onChange?.();
  }

  update() {
    this.t++;
  }

  draw(c: CanvasRenderingContext2D) {
    rect(c, 0, 0, 160, 144, '#f8f4e8');
    rect(c, 0, 70, 160, 26, '#efe6d0');
    const sc = 1 - this.shrink;
    const drawChar = (look: keyof typeof LOOKS, x: number) => {
      const fr = charFrame(charSprites(LOOKS[look]), 'down', 0);
      const s = Math.max(1, Math.round(4 * sc));
      c.drawImage(fr, 0, 0, 16, 16, x - (16 * s) / 2, 86 - 16 * s, 16 * s, 16 * s);
    };
    if (this.show === 'prof') drawChar('prof', 80);
    if (this.show === 'mon') {
      drawChar('prof', 44);
      c.drawImage(creatureSprite(7), 92, 38);
    }
    if (this.show === 'player') drawChar('player', 80);
    if (this.show === 'rival') drawChar('rival', 80);
  }
}

