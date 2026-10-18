import { drawText, padLeft, wrap } from '../core/font';
import type { Game } from '../core/game';
import { box, cursor, rect, UI } from '../core/gfx';
import { Modal } from '../core/scene';
import { item, ITEMS } from '../data/items';
import { addExp, evolutionFor, expFor, isAlive, maxHp, monName } from '../systems/mon';
import { removeItem } from '../systems/state';
import { say, yesNo } from './dialog';
import { EvolutionScene, learnMoveDialog } from './evolution';
import { PartyScene } from './party';

export interface BagChoice {
  id: string;
  target?: number;
}

const ORDER = Object.keys(ITEMS);

/**
 * Bag. In battle it returns the chosen item (and target); in the field it
 * applies items itself and returns null when closed.
 */
export class BagScene extends Modal<BagChoice | null> {
  opaque = true;
  idx = 0;
  scroll = 0;
  sub: { idx: number } | null = null;
  busy = false;
  wheelScroll = true;

  constructor(
    g: Game,
    private mode: 'field' | 'battle',
    private onEscape?: () => Promise<void>,
  ) {
    super();
    this.g = g;
  }

  entries(): [string, number][] {
    const bag = this.g.state!.bag;
    return ORDER.filter((id) => (bag[id] ?? 0) > 0).map((id) => [id, bag[id]]);
  }

  update() {
    if (this.busy) return;
    const i = this.g.input;
    const list = this.entries();
    const n = list.length + 1; // + CLOSE
    if (this.sub) {
      if (i.repeat('up') || i.repeat('down')) this.sub.idx = 1 - this.sub.idx;
      if (i.pressed('b')) this.sub = null;
      else if (i.pressed('a')) {
        const choice = this.sub.idx;
        this.sub = null;
        if (choice === 0) void this.use(list[this.idx][0]);
        else void this.toss(list[this.idx][0]);
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
    if (this.idx < this.scroll) this.scroll = this.idx;
    if (this.idx >= this.scroll + 7) this.scroll = this.idx - 6;
    if (i.pressed('b') || (i.pressed('a') && this.idx === list.length)) {
      this.g.sfx('cancel');
      this.finish(null);
      return;
    }
    if (i.pressed('a')) {
      this.g.sfx('confirm');
      const [id] = list[this.idx];
      if (this.mode === 'battle') void this.battlePick(id);
      else this.sub = { idx: 0 };
    }
  }

  private async battlePick(id: string) {
    const def = item(id);
    this.busy = true;
    if (!def.battle) {
      await say(this.g, "That can't be used in battle.");
      this.busy = false;
      return;
    }
    if (def.kind === 'pod') {
      this.finish({ id });
      return;
    }
    const target = await this.g.open(new PartyScene(this.g, 'item'));
    if (target < 0) {
      this.busy = false;
      return;
    }
    const m = this.g.state!.party[target];
    if (!this.applicable(id, target)) {
      await say(this.g, `It won't have any effect on ${monName(m)}.`);
      this.busy = false;
      return;
    }
    this.finish({ id, target });
  }

  private applicable(id: string, target: number): boolean {
    const def = item(id);
    const m = this.g.state!.party[target];
    if (def.kind === 'heal') return isAlive(m) && m.hp < maxHp(m);
    if (def.kind === 'cure') return isAlive(m) && !!m.status;
    if (def.kind === 'revive') return !isAlive(m);
    if (def.kind === 'candy') return m.lvl < 60;
    return false;
  }

  private async toss(id: string) {
    const def = item(id);
    this.busy = true;
    if (def.kind === 'key') await say(this.g, "That's too important to throw away!");
    else if (await yesNo(this.g, `Throw away one ${def.name.toUpperCase()}?`)) {
      removeItem(this.g.state!, id);
      await say(this.g, `Threw away one ${def.name.toUpperCase()}.`);
    }
    this.clamp();
    this.busy = false;
  }

  private clamp() {
    const n = this.entries().length;
    if (this.idx > n) this.idx = n;
  }

  private async use(id: string) {
    const g = this.g;
    const s = g.state!;
    const def = item(id);
    this.busy = true;
    try {
      if (def.kind === 'key') {
        await say(g, id === 'embercore' ? 'The EMBER CORE glows warmly in your hands.' : "There's a time and place for everything.");
        return;
      }
      if (def.kind === 'pod') {
        await say(g, 'Pods are thrown in battle at wild Wildkin.');
        return;
      }
      if (id === 'repel') {
        s.repel = def.value;
        removeItem(s, id);
        g.sfx('item');
        await say(g, '{PLAYER} used the REPEL SPRAY. Weak wild Wildkin will stay away.');
        return;
      }
      if (id === 'escaperope') {
        if (!this.onEscape) {
          await say(g, "Can't use that here.");
          return;
        }
        removeItem(s, id);
        this.finish(null);
        await this.onEscape();
        return;
      }
      if (!s.party.length) return;
      const target = await g.open(new PartyScene(g, 'item'));
      if (target < 0) return;
      const m = s.party[target];
      if (!this.applicable(id, target)) {
        await say(g, `It won't have any effect on ${monName(m)}.`);
        return;
      }
      removeItem(s, id);
      if (def.kind === 'heal') {
        const before = m.hp;
        m.hp = Math.min(maxHp(m), m.hp + def.value);
        g.sfx('heal');
        await say(g, `${monName(m)} recovered ${m.hp - before} HP!`);
      } else if (def.kind === 'cure') {
        m.status = null;
        m.sleep = 0;
        g.sfx('heal');
        await say(g, `${monName(m)} is cured!`);
      } else if (def.kind === 'revive') {
        m.hp = Math.floor(maxHp(m) * def.value);
        g.sfx('heal');
        await say(g, `${monName(m)} was revived!`);
      } else if (def.kind === 'candy') {
        const evs = addExp(m, expFor(m.lvl + 1) - m.exp);
        g.sfx('levelup');
        for (const ev of evs) {
          await say(g, `${monName(m)} grew to Lv. ${ev.lvl}!`);
          for (const mv of ev.learn) await learnMoveDialog(g, m, mv);
        }
        const to = evolutionFor(m);
        if (to) await g.open(new EvolutionScene(g, m, to));
      }
    } finally {
      this.clamp();
      this.busy = false;
    }
  }

  draw(c: CanvasRenderingContext2D) {
    rect(c, 0, 0, 160, 144, UI.paper);
    rect(c, 0, 0, 160, 12, '#3a3450');
    drawText(c, 'BAG', 6, 2, '#ffffff');
    drawText(c, `$${this.g.state!.money}`, 154 - String(this.g.state!.money).length * 6 - 6, 2, '#f8d040');
    const list = this.entries();
    box(c, 0, 12, 160, 94);
    const rows = [...list.map(([id, n]) => [item(id).name.toUpperCase(), item(id).kind === 'key' ? '' : `x${padLeft(n, 2)}`]), ['CLOSE', '']];
    rows.slice(this.scroll, this.scroll + 7).forEach(([nm, cnt], k) => {
      const y = 19 + k * 12;
      const idx = k + this.scroll;
      if (!this.sub && !this.busy) this.g.pick(this, 3, y - 3, 140, 12, () => this.idx !== idx && ((this.idx = idx), true));
      drawText(c, nm, 14, y);
      drawText(c, cnt, 130, y);
      if (k + this.scroll === this.idx) cursor(c, 5, y);
    });
    if (this.scroll > 0) {
      drawText(c, '▲', 148, 14);
      this.g.button(this, 144, 12, 16, 20, 'up');
    }
    if (this.scroll + 7 < rows.length) {
      drawText(c, '▼', 148, 96);
      this.g.button(this, 144, 88, 16, 18, 'down');
    }
    box(c, 0, 106, 160, 38);
    const sel = list[this.idx];
    const desc = sel ? item(sel[0]).desc : 'Close the bag.';
    wrap(desc, 24)
      .slice(0, 2)
      .forEach((l, k) => drawText(c, l, 8, 114 + k * 12));
    if (this.sub) {
      box(c, 96, 68, 64, 34);
      drawText(c, 'USE', 112, 74);
      drawText(c, 'TOSS', 112, 86);
      cursor(c, 104, 74 + this.sub.idx * 12);
      const sub = this.sub;
      [0, 1].forEach((k) => this.g.pick(this, 99, 71 + k * 12, 58, 12, () => sub.idx !== k && ((sub.idx = k), true)));
    }
  }
}
