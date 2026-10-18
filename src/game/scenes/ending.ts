import { creatureSprite } from '../art/creatures';
import { drawText, drawTextScaled, textWidth } from '../core/font';
import { rect } from '../core/gfx';
import { Modal } from '../core/scene';

export function drawSky(c: CanvasRenderingContext2D, t: number) {
  const bands = ['#1a1632', '#241c42', '#32244e', '#46305a', '#643a5e', '#8a4a5c', '#b8605a'];
  bands.forEach((col, k) => rect(c, 0, k * 14, 160, 14, col));
  for (let k = 0; k < 24; k++) {
    const x = (k * 53) % 160;
    const y = (k * 29) % 60;
    if ((t / 20 + k) % 7 > 1) rect(c, x, y, 1, 1, k % 3 ? '#f8f4e8' : '#f8d040');
  }
  c.fillStyle = '#2a2040';
  for (let x = 0; x < 160; x++) {
    const h = 30 + Math.sin(x / 13) * 8 + Math.sin(x / 5 + 1) * 3;
    c.fillRect(x, 144 - h - 26, 1, h + 26);
  }
  c.fillStyle = '#3c6a3a';
  for (let x = 0; x < 160; x++) {
    const h = 22 + Math.sin(x / 20 + 2) * 4;
    c.fillRect(x, 144 - h, 1, h);
  }
  rect(c, 0, 128, 160, 16, '#2e5430');
}

const CREDITS = [
  'WILDKIN',
  'EMBER EDITION',
  '',
  'A fan-made tribute to',
  'classic handheld',
  'monster-catching RPGs.',
  '',
  'STARRING',
  '',
  '{PLAYER}',
  '{RIVAL}',
  'PROF. MARISOL FENN',
  'MOSSA  VULK  ISOLDE',
  'CHAMPION ELOWEN',
  'and SOLMARA',
  '',
  'WORLD, ART AND MUSIC',
  'drawn pixel by pixel',
  'in code.',
  '',
  'Thank you for playing!',
];

export class EndingScene extends Modal<void> {
  opaque = true;
  t = 0;
  enter() {
    this.g.music('ending');
  }
  update() {
    this.t++;
    const end = CREDITS.length * 14 + 200;
    const fast = this.g.input.down('a') ? 3 : 1;
    this.t += fast - 1;
    if (this.t / 2 > end && (this.g.input.pressed('a') || this.g.input.pressed('start'))) this.finish();
  }
  draw(c: CanvasRenderingContext2D) {
    this.g.button(this, 0, 0, 160, 144, 'a');
    drawSky(c, this.t);
    c.globalAlpha = 0.55;
    rect(c, 0, 0, 160, 144, '#0d0c16');
    c.globalAlpha = 1;
    const y0 = 150 - this.t / 2;
    const s = this.g.state!;
    CREDITS.forEach((line, k) => {
      const txt = line.replace('{PLAYER}', s.name).replace('{RIVAL}', s.rival);
      const y = y0 + k * 14;
      if (y > -10 && y < 150) drawText(c, txt, 80 - textWidth(txt) / 2, y, k < 2 ? '#f8d040' : '#f8f4e8');
    });
    const endY = y0 + CREDITS.length * 14 + 40;
    const ty = Math.max(40, endY);
    if (ty < 150) {
      drawTextScaled(c, 'THE END', 80 - textWidth('THE END'), ty, 2, '#f8d040');
      const lead = s.party[0];
      if (lead) c.drawImage(creatureSprite(lead.sp), 56, ty + 24);
      if (endY <= 40 && Math.floor(this.t / 30) % 2) drawText(c, 'Press A', 59, 134, '#f8f4e8');
    }
  }
}
