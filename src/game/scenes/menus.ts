import { creatureSprite } from '../art/creatures';
import { drawText, padLeft, wrap } from '../core/font';
import type { Game } from '../core/game';
import { box, cursor, rect, TYPE_COLORS, UI } from '../core/gfx';
import { Modal } from '../core/scene';
import { ALL_SPECIES, SPECIES_COUNT } from '../data/species';
import { BADGE_COLORS, BADGES, flag, type GameState } from '../systems/state';
import { keyLabel } from '../core/input';
import { allMaps } from '../world/maps';

/** Where a species turns up in the wild (map names), for the Wildex. */
let habitatCache: Map<number, string[]> | null = null;
export function habitats(sp: number): string[] {
  if (!habitatCache) {
    habitatCache = new Map();
    for (const m of Object.values(allMaps())) {
      const tables: [string, typeof m.encounters][] = [
        ['', m.encounters],
        [' (surf)', m.surf],
        [' (rod)', m.fish],
      ];
      for (const [tag, t] of tables) {
        if (!t) continue;
        for (const e of t.table) {
          const list = habitatCache.get(e.sp) ?? [];
          const name = m.name + tag;
          if (!list.includes(name)) list.push(name);
          habitatCache.set(e.sp, list);
        }
      }
    }
  }
  return habitatCache.get(sp) ?? [];
}

// ---------------- WILDEX ----------------

export class DexScene extends Modal<void> {
  opaque = true;
  wheelScroll = true;
  idx = 0;
  scroll = 0;
  detail = false;
  constructor(g: Game) {
    super();
    this.g = g;
  }
  update() {
    const i = this.g.input;
    const s = this.g.state!;
    const n = ALL_SPECIES.length;
    if (this.detail) {
      if (i.pressed('a') || i.pressed('b')) this.detail = false;
      if (i.repeat('up') || i.repeat('down')) {
        const d = i.repeat('up') ? -1 : 1;
        let j = this.idx;
        for (let k = 0; k < n; k++) {
          j = (j + d + n) % n;
          if (s.seen.includes(ALL_SPECIES[j].id)) break;
        }
        this.idx = j;
      }
      return;
    }
    if (i.repeat('up')) this.idx = (this.idx + n - 1) % n;
    if (i.repeat('down')) this.idx = (this.idx + 1) % n;
    if (i.repeat('left')) this.idx = Math.max(0, this.idx - 8);
    if (i.repeat('right')) this.idx = Math.min(n - 1, this.idx + 8);
    if (this.idx < this.scroll) this.scroll = this.idx;
    if (this.idx >= this.scroll + 10) this.scroll = this.idx - 9;
    if (i.pressed('b')) {
      this.g.sfx('cancel');
      this.finish();
    }
    if (i.pressed('a') && s.seen.includes(ALL_SPECIES[this.idx].id)) {
      this.g.sfx('confirm');
      this.detail = true;
    }
  }
  draw(c: CanvasRenderingContext2D) {
    const s = this.g.state!;
    const sp = ALL_SPECIES[this.idx];
    rect(c, 0, 0, 160, 144, UI.paper);
    rect(c, 0, 0, 160, 12, '#d04838');
    drawText(c, 'WILDEX', 6, 2, '#ffffff');
    drawText(c, `SEEN ${s.seen.length} OWN ${s.caught.length}`, 64, 2, '#ffffff');
    const seen = s.seen.includes(sp.id);
    if (this.detail && seen) {
      this.g.button(this, 0, 0, 160, 144, 'a');
      c.drawImage(creatureSprite(sp.id), 4, 16);
      drawText(c, `No.${padLeft(sp.id, 3).replace(/ /g, '0')}`, 58, 18);
      drawText(c, sp.name.toUpperCase(), 58, 28);
      drawText(c, `${sp.kind}`, 58, 38, UI.muted);
      sp.types.forEach((t, k) => {
        rect(c, 58 + k * 42, 50, 38, 9, TYPE_COLORS[t]);
        drawText(c, t, 59 + k * 42, 51, '#ffffff');
      });
      box(c, 0, 70, 160, 74);
      if (s.caught.includes(sp.id))
        wrap(sp.dex, 24)
          .slice(0, 5)
          .forEach((l, k) => drawText(c, l, 8, 78 + k * 12));
      else {
        drawText(c, 'Catch it to learn more!', 8, 78, UI.muted);
        const h = habitats(sp.id);
        drawText(c, 'SEEN AROUND:', 8, 94, UI.accent);
        wrap(h.length ? h.slice(0, 3).join(', ') : 'Unknown. Maybe a gift or a legend?', 24)
          .slice(0, 3)
          .forEach((l, k) => drawText(c, l, 8, 106 + k * 11));
      }
      return;
    }
    // list
    box(c, 64, 12, 96, 132);
    ALL_SPECIES.slice(this.scroll, this.scroll + 10).forEach((e, k) => {
      const y = 18 + k * 12;
      const idx = k + this.scroll;
      this.g.pick(this, 66, y - 3, 92, 12, () => this.idx !== idx && ((this.idx = idx), true));
      const isSeen = s.seen.includes(e.id);
      if (s.caught.includes(e.id)) {
        rect(c, 72, y + 1, 5, 5, '#e04848');
        rect(c, 72, y + 4, 5, 2, '#ffffff');
      }
      drawText(c, padLeft(e.id, 3).replace(/ /g, '0'), 80, y, UI.muted);
      drawText(c, isSeen ? e.name.toUpperCase().slice(0, 10) : '----------', 100, y, UI.ink);
      if (k + this.scroll === this.idx) cursor(c, 66, y);
    });
    if (seen) {
      c.drawImage(creatureSprite(sp.id), 8, 30);
      sp.types.forEach((t, k) => {
        rect(c, 4, 84 + k * 11, 56, 9, TYPE_COLORS[t]);
        drawText(c, t, 6, 85 + k * 11, '#ffffff');
      });
    } else {
      drawText(c, '?', 30, 50, UI.muted);
    }
    drawText(c, `${s.caught.length}/${SPECIES_COUNT}`, 8, 120);
  }
}

// ---------------- SAVE SUMMARY ----------------

/** Handheld-style save file card: name, badges, Wildex count and play time. */
export function drawSaveSummary(c: CanvasRenderingContext2D, s: GameState, x = 0, y = 0) {
  box(c, x, y, 112, 58);
  const t = Math.floor(s.playTime);
  const time = `${Math.floor(t / 3600)}:${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}`;
  const rows: [string, string][] = [
    ['PLAYER', s.name],
    ['BADGES', String(s.badges.length)],
    ['WILDEX', String(s.caught.length)],
    ['TIME', time],
  ];
  rows.forEach(([k, v], i) => {
    drawText(c, k, x + 8, y + 7 + i * 11, UI.muted);
    drawText(c, v, x + 104 - v.length * 6, y + 7 + i * 11);
  });
}

/** One-line save card for the title screen. */
export function drawSaveLine(c: CanvasRenderingContext2D, s: GameState, y: number) {
  const t = Math.floor(s.playTime);
  const time = `${Math.floor(t / 3600)}:${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}`;
  const txt = `${s.name}  ★${s.badges.length}  DEX ${s.caught.length}  ${time}`.slice(0, 24);
  box(c, 4, y, 152, 19);
  drawText(c, txt, 80 - txt.length * 3, y + 5);
}

/** Non-blocking overlay that shows the save card while the save prompt is up. */
export class SaveCard extends Modal<void> {
  update() {}
  draw(c: CanvasRenderingContext2D) {
    if (this.g.state) drawSaveSummary(c, this.g.state, 0, 0);
  }
}

// ---------------- JOURNAL ----------------

interface Quest {
  title: string;
  short: string;
  done: boolean;
}

export function quests(s: GameState): Quest[] {
  const b = (n: string) => s.badges.includes(n);
  const f = (k: string) => flag(s, k);
  const list: Quest[] = [
    { title: "Get a partner from PROF. FENN's lab", short: 'Met my partner', done: f('gotStarter') },
    { title: 'Win the BOULDER BADGE in BRINDLE TOWN', short: 'BOULDER BADGE', done: b('BOULDER') },
    { title: 'Cross WHISPER CAVE and stop the HOLLOW ORDER', short: 'Cleared WHISPER CAVE', done: f('caveCleared') },
    { title: 'Win the RIPPLE BADGE in RIVERTON CITY', short: 'RIPPLE BADGE', done: b('RIPPLE') },
    { title: 'Visit LORNE across LANTERN BRIDGE', short: 'Got a FERRY TICKET', done: f('gotTicket') },
    { title: 'Board the STARLIGHT FERRY at VOLTHAVEN PORT', short: 'Got the HEDGE SHEARS', done: f('gotShears') },
    { title: 'Win the SPARK BADGE in VOLTHAVEN PORT', short: 'SPARK BADGE', done: b('SPARK') },
    { title: 'Trim the hedge east of RIVERTON and reach BELLMOOR', short: 'Reached BELLMOOR', done: f('visit:bellmoor') },
    { title: 'Take the UNDERPASS to BLOOMFIELD', short: 'Reached BLOOMFIELD', done: f('visit:bloomfield') },
    { title: 'Win the BLOOM BADGE in BLOOMFIELD', short: 'BLOOM BADGE', done: b('BLOOM') },
    { title: 'Raid the HOLLOW ORDER hideout under the ARCADE', short: 'Got the SPECTRAL LENS', done: f('hideoutCleared') },
    { title: 'Rescue the ELDER at the top of the BELL TOWER', short: 'Saved the BELL TOWER', done: f('towerCleared') },
    { title: 'Drive the HOLLOW ORDER out of the ASTRA OBSERVATORY', short: 'Freed the OBSERVATORY', done: f('observatoryCleared') },
    { title: 'Win the MIND BADGE in ASTRA CITY', short: 'MIND BADGE', done: b('MIND') },
    { title: 'Win the VENOM BADGE in MIRECOAST', short: 'VENOM BADGE', done: b('VENOM') },
    { title: 'Find a way to cross the sea in the WILDLANDS PARK', short: 'Got the DRIFTBOARD', done: f('gotBoard') },
    { title: 'Find the GYM key and win the CINDER BADGE on CINDERMOOR', short: 'CINDER BADGE', done: b('CINDER') },
    { title: 'Win the FROST BADGE in GALEWICK, far north of ASTRA', short: 'FROST BADGE', done: b('FROST') },
    { title: 'Climb VICTORY CAVE and conquer the SUMMIT LEAGUE', short: 'Became CHAMPION', done: f('champion') },
    { title: 'Brave the RIFT beyond DRIFTWOOD CAPE', short: 'Calmed the RIFT', done: f('nullmindDone') },
  ];
  return list;
}

export class JournalScene extends Modal<void> {
  opaque = true;
  constructor(g: Game) {
    super();
    this.g = g;
  }
  update() {
    const i = this.g.input;
    if (i.pressed('a') || i.pressed('b')) {
      this.g.sfx('cancel');
      this.finish();
    }
  }
  draw(c: CanvasRenderingContext2D) {
    const s = this.g.state!;
    this.g.button(this, 0, 0, 160, 144, 'a');
    rect(c, 0, 0, 160, 144, UI.paper);
    rect(c, 0, 0, 160, 12, '#3a3450');
    drawText(c, `${s.name}'S JOURNAL`, 6, 2, '#ffffff');
    const qs = quests(s);
    const cur = qs.find((q) => !q.done);
    box(c, 0, 12, 160, 40);
    drawText(c, 'CURRENT GOAL', 8, 18, UI.accent);
    wrap(cur ? cur.title : `CHAMPION! Complete the WILDEX: ${s.caught.length}/${SPECIES_COUNT}`, 24)
      .slice(0, 2)
      .forEach((l, k) => drawText(c, l, 8, 28 + k * 10));
    // completed list
    let y = 56;
    drawText(c, 'DONE', 8, y, UI.muted);
    y += 10;
    const done = qs.filter((q) => q.done).slice(-3);
    if (!done.length) drawText(c, '-', 8, y, UI.muted);
    done.forEach((q) => {
      drawText(c, '★ ' + q.short, 8, y);
      y += 10;
    });
    box(c, 0, 96, 160, 48);
    drawText(c, 'BADGES', 8, 102);
    BADGES.forEach((bname, k) => {
      const has = s.badges.includes(bname);
      const x = 56 + k * 12;
      rect(c, x, 101, 10, 10, has ? BADGE_COLORS[k] : '#d8d0c0');
      rect(c, x + 2, 103, 6, 6, has ? '#ffffff' : '#c4baa0');
      if (has) rect(c, x + 3, 104, 4, 4, BADGE_COLORS[k]);
    });
    const t = Math.floor(s.playTime);
    drawText(c, `TIME ${Math.floor(t / 3600)}:${padLeft(Math.floor((t % 3600) / 60), 2).replace(' ', '0')}`, 8, 116);
    drawText(c, `$${s.money}`, 96, 116);
    drawText(c, `WILDEX ${s.caught.length}/${SPECIES_COUNT}`, 8, 128);
  }
}

// ---------------- OPTIONS ----------------

export class OptionsScene extends Modal<void> {
  opaque = true;
  wheelScroll = true;
  idx = 0;
  constructor(g: Game) {
    super();
    this.g = g;
  }
  rows(): [string, string][] {
    const o = this.g.options;
    return [
      ['TEXT SPEED', ['SLOW', 'MID', 'FAST'][o.textSpeed]],
      ['MUSIC', o.music ? 'ON' : 'OFF'],
      ['SOUND FX', o.sfx ? 'ON' : 'OFF'],
      ['BATTLE FX', o.battleAnim ? 'ON' : 'OFF'],
      ['CONTROLS', { auto: 'AUTO', touch: 'TOUCH', keys: 'KEYS' }[o.controls]],
      ['AUTOSAVE', o.autosave ? 'ON' : 'OFF'],
      ['DONE', ''],
    ];
  }
  update() {
    const i = this.g.input;
    const o = this.g.options;
    const n = 7;
    if (i.repeat('up')) this.idx = (this.idx + n - 1) % n;
    if (i.repeat('down')) this.idx = (this.idx + 1) % n;
    const change = i.pressed('left') ? -1 : i.pressed('right') || i.pressed('a') ? 1 : 0;
    if (i.pressed('b') || (i.pressed('a') && this.idx === 6)) {
      this.g.sfx('cancel');
      this.finish();
      return;
    }
    if (change) {
      this.g.sfx('select');
      if (this.idx === 0) this.g.setOptions({ textSpeed: ((o.textSpeed + change + 3) % 3) as 0 | 1 | 2 });
      if (this.idx === 1) this.g.setOptions({ music: !o.music });
      if (this.idx === 2) this.g.setOptions({ sfx: !o.sfx });
      if (this.idx === 3) this.g.setOptions({ battleAnim: !o.battleAnim });
      if (this.idx === 4) {
        const modes = ['auto', 'touch', 'keys'] as const;
        this.g.setOptions({ controls: modes[(modes.indexOf(o.controls) + change + 3) % 3] });
      }
      if (this.idx === 5) this.g.setOptions({ autosave: !o.autosave });
    }
  }
  draw(c: CanvasRenderingContext2D) {
    rect(c, 0, 0, 160, 144, UI.paper);
    rect(c, 0, 0, 160, 12, '#3a3450');
    drawText(c, 'OPTIONS', 6, 2, '#ffffff');
    box(c, 0, 14, 160, 96);
    this.rows().forEach(([k, v], j) => {
      const y = 21 + j * 12;
      this.g.pick(this, 3, y - 3, 154, 12, () => this.idx !== j && ((this.idx = j), true), v ? 'right' : 'a');
      drawText(c, k, 16, y);
      if (v) drawText(c, `◀ ${v} ▶`, 94, y, UI.accent);
      if (j === this.idx) cursor(c, 6, y);
    });
    box(c, 0, 110, 160, 34);
    const startK = this.g.options.startKeys.map(keyLabel).slice(0, 2).join('/');
    drawText(c, 'A: Z/Enter  B: X/Esc', 8, 115);
    drawText(c, `START: ${startK}`.slice(0, 24), 8, 124);
    drawText(c, 'Hold B to run', 8, 133, UI.muted);
  }
}
