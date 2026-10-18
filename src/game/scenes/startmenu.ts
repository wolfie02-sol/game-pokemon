import { drawText } from '../core/font';
import type { Game } from '../core/game';
import { box, cursor } from '../core/gfx';
import { Modal } from '../core/scene';
import { saveGame } from '../systems/save';
import { BagScene } from './bag';
import { ask, say, yesNo } from './dialog';
import { DexScene, JournalScene, OptionsScene, SaveCard } from './menus';
import type { Overworld } from './overworld';
import { PartyScene } from './party';

export class StartMenu extends Modal<void> {
  idx = 0;
  wheelScroll = true;
  busy = false;
  saving = false;

  constructor(
    g: Game,
    private ow: Overworld,
  ) {
    super();
    this.g = g;
  }

  items(): string[] {
    const s = this.g.state!;
    const out: string[] = [];
    if (s.flags.gotDex) out.push('WILDEX');
    if (s.party.length) out.push('PARTY');
    out.push('BAG', 'JOURNAL', 'SAVE', 'OPTIONS', 'EXIT');
    return out;
  }

  update() {
    if (this.busy) return;
    const i = this.g.input;
    const items = this.items();
    if (i.repeat('up')) {
      this.idx = (this.idx + items.length - 1) % items.length;
      this.g.sfx('select');
    }
    if (i.repeat('down')) {
      this.idx = (this.idx + 1) % items.length;
      this.g.sfx('select');
    }
    if (i.pressed('b') || i.pressed('start')) {
      this.g.sfx('cancel');
      this.finish();
      return;
    }
    if (i.pressed('a')) {
      this.g.sfx('confirm');
      void this.choose(items[this.idx]);
    }
  }

  private async choose(it: string) {
    const g = this.g;
    if (it === 'EXIT') {
      this.finish();
      return;
    }
    this.busy = true;
    try {
      if (it === 'WILDEX') await g.open(new DexScene(g));
      else if (it === 'PARTY') await g.open(new PartyScene(g, 'field'));
      else if (it === 'BAG') {
        const ow = this.ow;
        const canEscape = !!ow.map.escape;
        await g.open(
          new BagScene(g, 'field', {
            escape: canEscape
              ? async () => {
                  this.finish();
                  const s = g.state!;
                  await say(g, '{PLAYER} used the ESCAPE ROPE!');
                  s.surfing = false;
                  await ow.doWarp(s.heal.map, s.heal.x, s.heal.y, 'up');
                }
              : undefined,
            fish: async () => {
              this.finish();
              await ow.fish();
            },
            fly: async () => {
              if (!ow.map.outdoor) {
                await say(g, "You can't fly from indoors! Head outside first.");
                return;
              }
              const targets = ow.flyTargets();
              const pick = await ask(g, 'Where do you want to fly?', [...targets.map((t) => t.name.slice(0, 16)), 'CANCEL'], targets.length);
              if (pick >= targets.length) return;
              this.finish();
              await say(g, '{PLAYER} blew the SKY WHISTLE! A great bird swooped down!');
              await ow.flyTo(targets[pick].id);
            },
          }),
        );
      } else if (it === 'JOURNAL') await g.open(new JournalScene(g));
      else if (it === 'OPTIONS') await g.open(new OptionsScene(g));
      else if (it === 'SAVE') {
        this.saving = true;
        const card = new SaveCard();
        void g.open(card);
        const yes = await yesNo(g, 'Would you like to save the game?');
        if (yes) {
          if (saveGame(g.state!)) {
            g.sfx('save');
            await say(g, '{PLAYER} saved the game!');
          } else await say(g, "Saving isn't available in this browser (storage is blocked).");
        }
        card.finish();
        this.saving = false;
      }
    } finally {
      this.busy = false;
    }
  }

  draw(c: CanvasRenderingContext2D) {
    if ((this.busy && this.closed) || this.saving) return;
    const items = this.items();
    const w = 76;
    const h = items.length * 13 + 10;
    box(c, 160 - w, 0, w, h);
    // clicking outside the menu closes it
    this.g.button(this, 0, 0, 160, 144, 'b');
    items.forEach((t, k) => {
      this.g.pick(this, 160 - w + 3, 4 + k * 13, w - 6, 13, () => this.idx !== k && ((this.idx = k), true));
      drawText(c, t, 160 - w + 16, 7 + k * 13);
      if (k === this.idx) cursor(c, 160 - w + 6, 7 + k * 13);
    });
  }
}
