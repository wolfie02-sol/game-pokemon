import { creatureIcon } from '../art/creatures';
import { charFrame, charSprites, exclaimSprite, itemBallSprite, LOOKS } from '../art/people';
import { silhouette } from '../art/pixel';
import { edgeFamily, edgeOverlay, joins, tileIdx, TILES, TS } from '../art/tiles';
import { drawText } from '../core/font';
import type { Game } from '../core/game';
import { box, fadeOverlay, rect, UI } from '../core/gfx';
import { DX, DY, OPP, type Dir } from '../core/input';
import { Scene } from '../core/scene';
import { item as itemDef } from '../data/items';
import { speciesByName } from '../data/species';
import { TRAINERS, trainerTeam } from '../data/trainers';
import { bossMoveset } from '../data/bossmoves';
import { move as moveDef } from '../data/moves';
import { healMon, isAlive, maxHp, monName } from '../systems/mon';
import { addItem, anyAlive, markCaught, newMon, receiveMon, type GameState } from '../systems/state';
import { allMaps, getMap } from '../world/maps';
import type { MapDef, NpcRuntime, Script, ScriptCtx } from '../world/types';
import { BattleScene, type BattleResult } from './battle';
import { ask, say, yesNo } from './dialog';
import { NamingScene } from './naming';
import { ShopScene } from './shop';
import { StartMenu } from './startmenu';
import { StorageScene } from './storage';
import { battleTransition } from './transition';
import { isCardBoss } from '../systems/cardbosses';
import { cardChallenge } from '../world/cardchallenge';

/** NPC looks drawn as a creature instead of a person. */
const MON_LOOKS: Record<string, string> = {
  sleeper: 'Slumbear',
  bird_volt: 'Voltwing',
  bird_frost: 'Galecrest',
  bird_flame: 'Solmara',
  nullmind: 'Nullmind',
  spirit: 'Duskwraith',
};

interface Waiter {
  t: number;
  res: () => void;
}

export class Overworld extends Scene {
  opaque = true;
  map!: MapDef;
  npcs: NpcRuntime[] = [];
  // player
  px = 0;
  py = 0;
  dir: Dir = 'down';
  moving: Dir | null = null;
  off = 0;
  stepParity = 0;
  jump = 0;
  turnGrace = 0;
  bumpCd = 0;
  crossing: { map: string; x: number; y: number } | null = null;
  playerPath: Dir[] = [];
  playerPathRes: (() => void) | null = null;
  playerEmote = 0;
  // runtime
  busy = 0;
  fade = 0;
  private fadeTarget = 0;
  private fadeRes: (() => void) | null = null;
  private waiters: Waiter[] = [];
  private npcPaths = new Map<NpcRuntime, { path: Dir[]; speed: number; res: () => void }>();
  banner: { text: string; t: number } | null = null;
  flashT = 0;

  constructor(g: Game) {
    super();
    this.g = g;
    const s = g.state!;
    this.load(s.map, s.x, s.y, s.dir);
  }

  get s(): GameState {
    return this.g.state!;
  }

  enter() {
    this.g.music(this.map.music);
    this.showBanner();
    if (this.map.onEnter) void this.run(this.map.onEnter);
  }

  // ---------- map loading ----------

  load(id: string, x: number, y: number, dir: Dir) {
    this.map = getMap(id);
    this.px = x;
    this.py = y;
    this.dir = dir;
    this.moving = null;
    this.off = 0;
    this.jump = 0;
    this.crossing = null;
    this.turnGrace = 0;
    this.bumpCd = 0;
    const s = this.s;
    s.map = id;
    s.x = x;
    s.y = y;
    s.dir = dir;
    this.loadCuts();
    if (this.map.fly) s.flags['visit:' + id] = true;
    if (s.surfing && !TILES[this.tileAt(x, y)].water) s.surfing = false;
    this.npcs = this.map.npcs.map((d) => ({
      def: d,
      x: d.x,
      y: d.y,
      dir: d.dir,
      ox: 0,
      oy: 0,
      moving: null,
      timer: 60 + this.g.rng.int(120),
      hidden: (d.cond ? !d.cond(s) : false) || !!s.flags['gone:' + id + ':' + d.id],
      homeX: d.x,
      homeY: d.y,
      emote: 0,
    }));
  }

  /** cells trimmed or smashed on this map (remembered in the save) */
  private cuts = new Map<number, number>();

  private loadCuts() {
    this.cuts.clear();
    const pre = 'cut:' + this.map.id + ':';
    for (const k of Object.keys(this.s.flags)) {
      if (!k.startsWith(pre)) continue;
      const [x, y] = k.slice(pre.length).split(',').map(Number);
      this.cuts.set(y * this.map.w + x, this.clearedTile(x, y));
    }
  }

  /** What a trimmed hedge or broken boulder leaves behind. */
  private clearedTile(x: number, y: number): number {
    const t = TILES[this.map.tiles[y * this.map.w + x]];
    if (t.name === 'cavecrack') return tileIdx('cavefloor');
    // copy the ground of a walkable neighbour so the cleared cell blends in
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= this.map.w || ny >= this.map.h) continue;
      const n = TILES[this.map.tiles[ny * this.map.w + nx]];
      if (!n.solid && !n.ledge && !n.grass && !n.water && n.name !== 'door' && n.name !== 'glassdoor' && !n.name.startsWith('cave')) return n.idx;
    }
    return tileIdx('grass');
  }

  private clearCell(x: number, y: number) {
    this.s.flags['cut:' + this.map.id + ':' + x + ',' + y] = true;
    this.cuts.set(y * this.map.w + x, this.clearedTile(x, y));
  }

  /** Re-evaluate NPC visibility conditions. */
  refresh() {
    for (const n of this.npcs) if (n.def.cond) n.hidden = !n.def.cond(this.s) || !!this.s.flags['gone:' + this.map.id + ':' + n.def.id];
  }

  showBanner() {
    if (this.map.outdoor) this.banner = { text: this.map.name, t: 110 };
  }

  // ---------- tile queries ----------

  tileAt(x: number, y: number): number {
    const m = this.map;
    if (x >= 0 && y >= 0 && x < m.w && y < m.h) {
      const i = y * m.w + x;
      return this.cuts.get(i) ?? m.tiles[i];
    }
    const c = m.connections;
    if (c) {
      if (y < 0 && c.up && x >= 0 && x < m.w) {
        const n = getMap(c.up.map);
        const nx = x + c.up.offset;
        const ny = n.h + y;
        if (nx >= 0 && nx < n.w && ny >= 0) return n.tiles[ny * n.w + nx];
      }
      if (y >= m.h && c.down && x >= 0 && x < m.w) {
        const n = getMap(c.down.map);
        const nx = x + c.down.offset;
        const ny = y - m.h;
        if (nx >= 0 && nx < n.w && ny < n.h) return n.tiles[ny * n.w + nx];
      }
      if (x < 0 && c.left && y >= 0 && y < m.h) {
        const n = getMap(c.left.map);
        const ny = y + c.left.offset;
        const nx = n.w + x;
        if (ny >= 0 && ny < n.h && nx >= 0) return n.tiles[ny * n.w + nx];
      }
      if (x >= m.w && c.right && y >= 0 && y < m.h) {
        const n = getMap(c.right.map);
        const ny = y + c.right.offset;
        const nx = x - m.w;
        if (ny >= 0 && ny < n.h && nx < n.w) return n.tiles[ny * n.w + nx];
      }
    }
    return m.border;
  }

  inBounds(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.map.w && y < this.map.h;
  }

  npcAt(x: number, y: number): NpcRuntime | undefined {
    return this.npcs.find((n) => {
      if (n.hidden) return false;
      if (n.x === x && n.y === y) return true;
      if (n.moving && n.x + DX[n.moving] === x && n.y + DY[n.moving] === y) return true;
      return false;
    });
  }

  itemAt(x: number, y: number) {
    return this.map.items.find((it) => it.x === x && it.y === y && !this.s.flags['item:' + it.id] && (!it.cond || it.cond(this.s)));
  }

  /** Can the player (or an NPC) stand on this tile type? */
  private walkable(t: (typeof TILES)[number], forNpc = false): boolean {
    if (t.water) return !forNpc && !!this.s.surfing;
    return !t.solid;
  }

  blocked(x: number, y: number, forNpc = false): boolean {
    if (!this.inBounds(x, y)) return true;
    const t = TILES[this.tileAt(x, y)];
    if (!this.walkable(t, forNpc) || t.ledge) return true;
    if (this.npcAt(x, y)) return true;
    if (this.itemAt(x, y)) return true;
    if (forNpc && this.px === x && this.py === y) return true;
    if (forNpc && this.moving && this.px + DX[this.moving] === x && this.py + DY[this.moving] === y) return true;
    if (forNpc && this.map.warps.some((w) => w.x === x && w.y === y)) return true;
    return false;
  }

  // ---------- update ----------

  update() {
    const g = this.g;
    if (this.banner && --this.banner.t <= 0) this.banner = null;
    if (this.flashT > 0) this.flashT--;
    if (this.playerEmote > 0) this.playerEmote--;
    for (const w of [...this.waiters]) {
      if (--w.t <= 0) {
        this.waiters.splice(this.waiters.indexOf(w), 1);
        w.res();
      }
    }
    this.updateNpcs();
    if (this.fade !== this.fadeTarget) {
      this.fade += this.fadeTarget > this.fade ? 1 / 10 : -1 / 10;
      if (Math.abs(this.fade - this.fadeTarget) < 0.05) {
        this.fade = this.fadeTarget;
        const r = this.fadeRes;
        this.fadeRes = null;
        r?.();
      }
      return;
    }
    if (this.moving) {
      this.advanceMove();
      return;
    }
    if (this.playerPath.length) {
      const d = this.playerPath.shift()!;
      this.dir = d;
      this.beginMove(d, true);
      return;
    }
    if (this.playerPathRes) {
      const r = this.playerPathRes;
      this.playerPathRes = null;
      r();
    }
    if (this.busy > 0) {
      this.walkQueue = [];
      this.walkGoal = null;
      return;
    }
    if (this.bumpCd > 0) this.bumpCd--;

    // standing still with nothing running: a consistent moment to autosave
    if (!this.walkQueue.length && !this.walkGoal && this.fade === 0 && g.scenes.length === 1) g.autosave.safeNow = true;
    if (g.autosave.pendingMessage && g.scenes.length === 1) {
      const msg = g.autosave.pendingMessage;
      g.autosave.pendingMessage = null;
      void this.run(async (c) => c.say(msg));
      return;
    }

    const i = g.input;
    if (i.pressed('start')) {
      g.sfx('menu');
      void this.run(async () => {
        await g.open(new StartMenu(g, this));
      });
      return;
    }
    if (this.clickTalk || this.clickSpot) {
      const n = this.clickTalk;
      const spot = this.clickSpot;
      this.clickTalk = null;
      this.clickSpot = null;
      const target = n ?? spot!;
      if (!n || (!n.moving && !n.hidden)) {
        const d = this.reachDir(target);
        if (d) {
          this.faceAndAct(d, n);
          return;
        }
        const path = this.pathTo(target);
        if (path) {
          this.walkQueue = path;
          this.walkGoal = { npc: n, spot };
        }
      }
    }
    if (this.walkQueue.length || this.walkGoal) {
      if (i.dir() || i.pressed('a') || i.pressed('b')) {
        this.walkQueue = [];
        this.walkGoal = null;
      } else if (this.walkQueue.length) {
        const d = this.walkQueue.shift()!;
        this.dir = d;
        this.s.dir = d;
        const bx = this.px;
        const by = this.py;
        this.tryMove(d);
        if (!this.moving && this.px === bx && this.py === by) {
          this.walkQueue = [];
          this.walkGoal = null;
        }
        return;
      } else {
        const goal = this.walkGoal!;
        this.walkGoal = null;
        const target = goal.npc ?? goal.spot!;
        const d = this.reachDir(target);
        if (d && (!goal.npc || !goal.npc.hidden)) {
          this.faceAndAct(d, goal.npc);
          return;
        }
      }
    }
    if (i.pressed('a')) {
      this.interact();
      return;
    }
    const d = i.dir();
    if (!d) {
      this.turnGrace = 0;
      return;
    }
    if (d !== this.dir) {
      this.dir = d;
      this.s.dir = d;
      this.turnGrace = i.heldFrames(d) <= 2 ? 5 : 0;
      if (this.turnGrace) return;
    }
    if (this.turnGrace > 0) {
      this.turnGrace--;
      return;
    }
    this.tryMove(d);
  }

  private tryMove(d: Dir) {
    const s = this.s;
    // edge warp (standing on a mat and pushing out)
    const ew = this.map.warps.find((w) => w.x === this.px && w.y === this.py && w.edge === d);
    if (ew) {
      this.g.sfx('door');
      void this.run(async (c) => c.warp(ew.to, ew.tx, ew.ty, ew.dir ?? d));
      return;
    }
    const tx = this.px + DX[d];
    const ty = this.py + DY[d];
    if (!this.inBounds(tx, ty)) {
      const conn = this.map.connections?.[d];
      if (conn) {
        const n = getMap(conn.map);
        let nx: number, ny: number;
        if (d === 'up') [nx, ny] = [tx + conn.offset, n.h - 1];
        else if (d === 'down') [nx, ny] = [tx + conn.offset, 0];
        else if (d === 'left') [nx, ny] = [n.w - 1, ty + conn.offset];
        else [nx, ny] = [0, ty + conn.offset];
        const t = TILES[n.tiles[ny * n.w + nx]];
        if (nx >= 0 && ny >= 0 && nx < n.w && ny < n.h && this.walkable(t)) {
          this.crossing = { map: conn.map, x: nx, y: ny };
          this.beginMove(d, true);
          return;
        }
      }
      this.bump();
      return;
    }
    const t = TILES[this.tileAt(tx, ty)];
    if (t.ledge && d === 'down') {
      if (!this.blocked(tx, ty + 1)) {
        this.jump = 1;
        this.g.sfx('ledge');
        this.beginMove(d, true);
        return;
      }
    }
    if (this.blocked(tx, ty)) {
      this.bump();
      return;
    }
    s.dir = d;
    if (s.surfing && !t.water) s.surfing = false;
    this.beginMove(d, true);
  }

  private bump() {
    if (this.bumpCd <= 0) {
      this.g.sfx('bump');
      this.bumpCd = 22;
    }
  }

  private beginMove(d: Dir, force: boolean) {
    if (!force) return;
    this.moving = d;
    this.off = 0;
  }

  private advanceMove() {
    const running = this.busy === 0 && !this.jump && this.g.input.down('b');
    const speed = running ? 2 : 1;
    const dist = this.jump ? 32 : 16;
    this.off += speed;
    if (this.off >= dist) {
      const d = this.moving!;
      this.px += DX[d] * (this.jump ? 2 : 1);
      this.py += DY[d] * (this.jump ? 2 : 1);
      this.moving = null;
      this.off = 0;
      this.jump = 0;
      this.stepParity ^= 1;
      if (this.crossing) {
        const cr = this.crossing;
        this.crossing = null;
        const prevMusic = this.map.music;
        this.load(cr.map, cr.x, cr.y, d);
        if (this.map.music !== prevMusic) this.g.music(this.map.music);
        this.showBanner();
        if (this.map.onEnter) void this.run(this.map.onEnter);
      }
      this.s.x = this.px;
      this.s.y = this.py;
      if (this.busy === 0 || this.playerPath.length === 0) this.onStep();
      // keep walking without an idle frame between tiles while a direction is held
      if (this.busy === 0 && !this.moving && this.fade === 0 && this.fadeTarget === 0) {
        const held = this.g.input.dir();
        if (held) {
          this.dir = held;
          this.s.dir = held;
          this.turnGrace = 0;
          this.tryMove(held);
        }
      }
    }
  }

  private onStep() {
    if (this.busy > 0 && this.playerPathRes) return;
    const s = this.s;
    s.steps++;
    // step warps
    const w = this.map.warps.find((w) => w.x === this.px && w.y === this.py && !w.edge);
    if (w) {
      if (w.cond && !w.cond(s)) {
        const back = OPP[this.dir];
        void this.run(async (c) => {
          await c.say(w.locked ?? 'It is locked.');
          await c.walkPlayer([back]);
        });
        return;
      }
      this.g.sfx('door');
      void this.run(async (c) => c.warp(w.to, w.tx, w.ty, w.dir ?? this.dir));
      return;
    }
    // triggers
    const tr = this.map.triggers.find(
      (t) => this.px >= t.x && this.px < t.x + (t.w ?? 1) && this.py >= t.y && this.py < t.y + (t.h ?? 1) && (!t.cond || t.cond(s)),
    );
    if (tr) {
      void this.run(tr.run);
      return;
    }
    // poison
    if (s.steps % 4 === 0) {
      let hurt = false;
      for (const m of s.party) {
        if ((m.status === 'PSN' || m.status === 'TOX') && m.hp > 1) {
          m.hp--;
          hurt = true;
        }
      }
      if (hurt) this.flashT = 4;
    }
    if (s.repel > 0) {
      s.repel--;
      if (s.repel === 0) {
        void this.run(async (c) => c.say('The REPEL SPRAY wore off.'));
        return;
      }
    }
    if (this.checkTrainers()) return;
    this.checkEncounter();
  }

  private checkTrainers(): boolean {
    for (const n of this.npcs) {
      if (n.hidden || !n.def.trainer || this.s.flags['tr:' + n.def.trainer]) continue;
      const range = n.def.sight ?? 4;
      for (let k = 1; k <= range; k++) {
        const cx = n.x + DX[n.dir] * k;
        const cy = n.y + DY[n.dir] * k;
        if (cx === this.px && cy === this.py) {
          void this.run((c) => this.trainerApproach(c, n, k - 1));
          return true;
        }
        const st = TILES[this.tileAt(cx, cy)];
        if (!this.inBounds(cx, cy) || (st.solid && !st.water) || this.npcAt(cx, cy) || this.itemAt(cx, cy)) break;
      }
    }
    return false;
  }

  private async trainerApproach(c: ScriptCtx, n: NpcRuntime, dist: number) {
    c.g.sfx('exclaim');
    await c.emote(n.def.id);
    if (dist > 0) await c.walkNpc(n.def.id, new Array(dist).fill(n.dir));
    this.dir = OPP[n.dir];
    await this.trainerTalk(c, n);
  }

  private async trainerTalk(c: ScriptCtx, n: NpcRuntime) {
    const t = TRAINERS[n.def.trainer!];
    await c.say(t.intro);
    const won = await c.battle(t.id);
    if ((won || t.id === 'rival1') && n.def.afterWin) await n.def.afterWin(c);
  }

  private checkEncounter() {
    const s = this.s;
    const t = TILES[this.tileAt(this.px, this.py)];
    const enc = t.water && s.surfing ? this.map.surf : t.grass || t.cave ? this.map.encounters : undefined;
    if (!enc) return;
    const rng = this.g.rng;
    if (!rng.chance(enc.rate)) return;
    const e = rng.weighted(enc.table);
    const lvl = rng.range(e.min, e.max);
    const lead = s.party.find(isAlive);
    if (s.repel > 0 && lead && lvl < lead.lvl) return;
    void this.run(async (c) => {
      await c.wild(e.sp, lvl);
    });
  }

  private interact() {
    const s = this.s;
    const fx = this.px + DX[this.dir];
    const fy = this.py + DY[this.dir];
    let n = this.npcAt(fx, fy);
    if (!n && this.inBounds(fx, fy) && TILES[this.tileAt(fx, fy)].counter) n = this.npcAt(fx + DX[this.dir], fy + DY[this.dir]);
    if (n && !n.moving) {
      this.talkTo(n);
      return;
    }
    const sign = this.map.signs.find((sg) => sg.x === fx && sg.y === fy);
    if (sign) {
      const txt = sign.text;
      void this.run(async (c) => {
        if (typeof txt === 'function') await txt(c);
        else await c.say(txt);
      });
      return;
    }
    const it = this.itemAt(fx, fy);
    if (it && it.script) {
      const sc = it.script;
      void this.run(async (c) => sc(c));
      return;
    }
    if (it) {
      void this.run(async (c) => {
        c.set('item:' + it.id);
        const def = itemDef(it.item);
        addItem(this.s, it.item, it.n ?? 1);
        c.g.sfx('item');
        await c.say(`{PLAYER} found ${it.n && it.n > 1 ? it.n + 'x ' : ''}${def.name.toUpperCase()}!`);
      });
      return;
    }
    if (!this.inBounds(fx, fy)) return;
    const ft = TILES[this.tileAt(fx, fy)];
    if (ft.cut) {
      void this.run(async (c) => {
        if (!s.bag.shears) return c.say('A thick hedge blocks the way. It looks like it could be trimmed.');
        if (!(await c.yesNo('This hedge could be trimmed. Use the HEDGE SHEARS?'))) return;
        this.g.sfx('item');
        this.clearCell(fx, fy);
        await c.say('{PLAYER} trimmed the hedge!');
      });
      return;
    }
    if (ft.smash) {
      void this.run(async (c) => {
        if (!s.bag.pick) return c.say('A cracked boulder. A good tool could break it apart.');
        if (!(await c.yesNo('This boulder is cracked. Use the ROCK PICK?'))) return;
        this.g.sfx('hit');
        this.shakeT = 10;
        this.clearCell(fx, fy);
        await c.say('{PLAYER} smashed the boulder!');
      });
      return;
    }
    if (ft.water && !s.surfing && !this.npcAt(fx, fy)) {
      void this.run(async (c) => {
        if (!s.bag.driftboard) return c.say('The water is deep and clear. Wildkin ripple beneath the surface.');
        if (!(await c.yesNo('The water is calm. Ride the DRIFTBOARD?'))) return;
        s.surfing = true;
        await c.walkPlayer([this.dir]);
      });
    }
  }

  /** Cast the fishing rod at the water in front of the player. */
  async fish(): Promise<void> {
    const s = this.s;
    const fx = this.px + DX[this.dir];
    const fy = this.py + DY[this.dir];
    await this.run(async (c) => {
      if (!this.inBounds(fx, fy) || !TILES[this.tileAt(fx, fy)].water) {
        await c.say('There is no water to fish in here. Face the water and try again.');
        return;
      }
      await c.say('{PLAYER} cast the FISHING ROD...');
      await c.wait(50);
      const rng = this.g.rng;
      const table = this.map.fish ?? { rate: 1, table: [{ sp: speciesByName('Mudgill'), min: 5, max: 15, w: 1 }] };
      if (!rng.chance(0.7)) {
        await c.say('Not even a nibble...');
        return;
      }
      c.g.sfx('exclaim');
      await c.emote('player');
      await c.say('Oh! A bite!');
      const e = rng.weighted(table.table);
      await c.wild(e.sp, rng.range(e.min, e.max));
    });
    void s;
  }

  /** Towns the player can fly to. */
  flyTargets(): { id: string; name: string; x: number; y: number }[] {
    const maps = allMaps();
    return Object.values(maps)
      .filter((m) => m.fly && this.s.flags['visit:' + m.id])
      .map((m) => ({ id: m.id, name: m.name, x: m.fly!.x, y: m.fly!.y }));
  }

  async flyTo(id: string) {
    const m = getMap(id);
    this.s.surfing = false;
    await this.run(async (c) => {
      c.g.sfx('run');
      await c.warp(id, m.fly!.x, m.fly!.y, 'down');
    });
  }

  private clickTalk: NpcRuntime | null = null;
  private walkQueue: Dir[] = [];
  private walkGoal: { npc: NpcRuntime | null; spot: { x: number; y: number } | null } | null = null;

  private faceAndAct(d: Dir, n: NpcRuntime | null) {
    this.dir = d;
    this.s.dir = d;
    if (n) this.talkTo(n);
    else this.interact();
  }

  /** Shortest walk to a tile from which `t` can be reached (tap-to-walk). */
  private pathTo(t: { x: number; y: number }): Dir[] | null {
    const W = this.map.w;
    const prev = new Map<number, [number, Dir]>();
    const start = this.py * W + this.px;
    const q = [start];
    prev.set(start, [-1, 'down']);
    const at = (k: number) => ({ x: k % W, y: Math.floor(k / W) });
    while (q.length) {
      const k = q.shift()!;
      const p = at(k);
      if (k !== start) {
        const sx = this.px, sy = this.py;
        this.px = p.x;
        this.py = p.y;
        const ok = this.reachDir(t);
        this.px = sx;
        this.py = sy;
        if (ok) {
          const out: Dir[] = [];
          let c = k;
          while (c !== start) {
            const [pk, d] = prev.get(c)!;
            out.unshift(d);
            c = pk;
          }
          return out;
        }
      }
      if (prev.size > 4000) break;
      for (const d of ['up', 'down', 'left', 'right'] as Dir[]) {
        const nx = p.x + DX[d];
        const ny = p.y + DY[d];
        const nk = ny * W + nx;
        if (prev.has(nk) || this.blocked(nx, ny)) continue;
        if (this.map.warps.some((w) => w.x === nx && w.y === ny)) continue;
        if (!!this.s.surfing !== !!TILES[this.tileAt(nx, ny)].water) continue;
        prev.set(nk, [k, d]);
        q.push(nk);
      }
    }
    return null;
  }
  /** A sign or item the player tapped; handled like pressing A while facing it. */
  private clickSpot: { x: number; y: number } | null = null;

  /** Direction the player must face to reach `n` (adjacent, or across a counter). */
  private reachDir(n: { x: number; y: number }): Dir | null {
    for (const d of ['up', 'down', 'left', 'right'] as Dir[]) {
      const fx = this.px + DX[d];
      const fy = this.py + DY[d];
      if (n.x === fx && n.y === fy) return d;
      if (n.x === fx + DX[d] && n.y === fy + DY[d] && this.inBounds(fx, fy) && TILES[this.tileAt(fx, fy)].counter) return d;
    }
    return null;
  }

  shakeT = 0;

  private talkTo(n: NpcRuntime) {
    const d = n.def;
    void this.run(async (c) => {
      n.dir = OPP[this.dir];
      if (d.trainer) {
        const t = TRAINERS[d.trainer];
        if (!this.s.flags['tr:' + d.trainer]) {
          await this.trainerTalk(c, n);
          return;
        }
        // beaten leaders offer a CARD CHALLENGE when card rewards are on
        const cards = this.g.hooks.cards;
        if (cards && isCardBoss(d.trainer) && (await cardChallenge(c, d.trainer, cards))) return;
        if (!d.talk) {
          await c.say(t.after);
          return;
        }
      }
      const talk = d.talk;
      if (!talk) return;
      if (typeof talk === 'function') await talk(c);
      else await c.say(talk);
    }, n);
  }

  // ---------- NPC movement ----------

  private updateNpcs() {
    for (const n of this.npcs) {
      if (n.emote > 0) n.emote--;
      if (n.hidden) continue;
      const scripted = this.npcPaths.get(n);
      if (n.moving) {
        const sp = scripted?.speed ?? 1;
        const step = Math.min(sp, 16 - Math.max(Math.abs(n.ox), Math.abs(n.oy)));
        n.ox += DX[n.moving] * step;
        n.oy += DY[n.moving] * step;
        if (Math.abs(n.ox) >= 16 || Math.abs(n.oy) >= 16) {
          n.x += DX[n.moving];
          n.y += DY[n.moving];
          n.ox = n.oy = 0;
          n.moving = null;
        }
        continue;
      }
      if (scripted) {
        if (!scripted.path.length) {
          this.npcPaths.delete(n);
          scripted.res();
          continue;
        }
        const d = scripted.path.shift()!;
        n.dir = d;
        n.moving = d;
        continue;
      }
      if (this.busy > 0) continue;
      if (--n.timer > 0) continue;
      n.timer = 90 + this.g.rng.int(140);
      const mv = n.def.move ?? 'still';
      if (mv === 'look') {
        n.dir = this.g.rng.pick(['up', 'down', 'left', 'right'] as Dir[]);
      } else if (mv === 'wander') {
        const d = this.g.rng.pick(['up', 'down', 'left', 'right'] as Dir[]);
        n.dir = d;
        const tx = n.x + DX[d];
        const ty = n.y + DY[d];
        const r = n.def.radius ?? 2;
        if (Math.abs(tx - n.homeX) <= r && Math.abs(ty - n.homeY) <= r && !this.blocked(tx, ty, true)) n.moving = d;
      }
    }
  }

  // ---------- scripting ----------

  run(fn: Script, self: NpcRuntime | null = null): Promise<void> {
    this.busy++;
    const c = this.ctx(self);
    return fn(c)
      .catch((e) => this.g.reportError(e, 'script'))
      .finally(() => {
        this.busy = Math.max(0, this.busy - 1);
        this.refresh();
        this.g.input.consume();
      });
  }

  /**
   * Drop whatever event was running after an error and hand control back to
   * the player where they stand. Pending event promises are abandoned.
   */
  recoverFromError() {
    this.busy = 0;
    this.waiters = [];
    this.npcPaths.clear();
    this.playerPath = [];
    this.playerPathRes = null;
    this.moving = null;
    this.off = 0;
    this.jump = 0;
    this.crossing = null;
    this.fade = 0;
    this.fadeTarget = 0;
    this.fadeRes = null;
    this.walkQueue = [];
    this.walkGoal = null;
    for (const n of this.npcs) {
      n.moving = null;
      n.ox = 0;
      n.oy = 0;
    }
    this.s.x = this.px;
    this.s.y = this.py;
    this.g.music(this.map.music);
  }

  wait(frames: number): Promise<void> {
    return new Promise((res) => this.waiters.push({ t: frames, res }));
  }

  fadeTo(v: number): Promise<void> {
    if (this.fade === v) return Promise.resolve();
    return new Promise((res) => {
      this.fadeTarget = v;
      this.fadeRes = res;
    });
  }

  async doWarp(map: string, x: number, y: number, dir: Dir) {
    await this.fadeTo(1);
    const prevMusic = this.map.music;
    this.load(map, x, y, dir);
    if (this.map.music !== prevMusic) this.g.music(this.map.music);
    await this.wait(4);
    await this.fadeTo(0);
    this.showBanner();
    if (this.map.onEnter) await this.map.onEnter(this.ctx(null));
  }

  async whiteout() {
    const g = this.g;
    const s = this.s;
    await say(g, '{PLAYER} has no more usable Wildkin!');
    const lost = Math.floor(s.money / 2);
    s.money -= lost;
    await say(g, `{PLAYER} panicked and dropped $${lost}... {PLAYER} blacked out!`);
    for (const m of s.party) healMon(m);
    s.surfing = false;
    this.fade = 1;
    this.fadeTarget = 1;
    this.load(s.heal.map, s.heal.x, s.heal.y, 'up');
    g.music(this.map.music);
    await this.wait(20);
    await this.fadeTo(0);
    await say(g, s.heal.map === 'home' ? 'MOM: Oh, honey, you look exhausted! Rest up. Your Wildkin are all better now.' : 'Your Wildkin were brought back to the HAVEN and fully restored.');
  }

  ctx(self: NpcRuntime | null): ScriptCtx {
    const g = this.g;
    const ow = this;
    const s = this.s;
    const c: ScriptCtx = {
      g,
      s,
      self,
      say: (t) => say(g, t),
      ask: (t, o, cancel = null) => ask(g, t, o, cancel),
      yesNo: (t) => yesNo(g, t),
      flag: (k) => !!s.flags[k],
      set: (k, v = true) => {
        if (v) s.flags[k] = true;
        else delete s.flags[k];
      },
      async give(id, n = 1) {
        addItem(s, id, n);
        g.sfx('item');
        await say(g, `{PLAYER} received ${n > 1 ? n + 'x ' : ''}${itemDef(id).name.toUpperCase()}!`);
      },
      async heal() {
        const yes = await yesNo(g, 'Welcome to the HAVEN! Shall I restore your Wildkin to full health?');
        if (!yes) {
          await say(g, 'Take care out there!');
          return;
        }
        await say(g, "Okay, I'll take your Wildkin for a moment.");
        g.audio.stop();
        g.sfx('heal');
        await ow.wait(100);
        for (const m of s.party) healMon(m);
        if (ow.map.havenSpot) s.heal = { map: ow.map.id, x: ow.map.havenSpot.x, y: ow.map.havenSpot.y };
        g.music(ow.map.music);
        await say(g, 'Your Wildkin are fully rested. Come back anytime!');
      },
      async battle(id) {
        const t = TRAINERS[id];
        const team = trainerTeam(t, s).map(([sp, lvl]) => {
          const m = newMon(s, sp, lvl, g.rng, t.name);
          // bosses bring considered, legal move sets (league members also know TM moves)
          if (t.smart) {
            // the champion, and league rematches in card challenges, also know TM moves
            const set = bossMoveset(sp, lvl, /^champ$/.test(t.id) || /^card:(champ|e4_\d)$/.test(t.id));
            if (set) m.moves = set.map((mid) => ({ id: mid, pp: moveDef(mid).pp }));
          }
          return m;
        });
        await battleTransition(g, true);
        const res: BattleResult = await g.open(new BattleScene(g, { kind: 'trainer', trainer: t, party: team, canLose: id === 'rival1' }));
        if (res === 'lose') {
          if (id === 'rival1') {
            for (const m of s.party) healMon(m);
            g.music(ow.map.music);
            s.flags['tr:' + id] = true;
            return false;
          }
          await ow.whiteout();
          return false;
        }
        s.flags['tr:' + id] = true;
        g.music(ow.map.music);
        return true;
      },
      async wild(sp, lvl, opts = {}) {
        const mon = newMon(s, sp, lvl, g.rng, '');
        await battleTransition(g, false);
        const res: BattleResult = await g.open(new BattleScene(g, { kind: 'wild', party: [mon], noRun: opts.noRun, music: opts.music }));
        if (res === 'lose') {
          await ow.whiteout();
          return 'lose';
        }
        g.music(ow.map.music);
        return res;
      },
      npc: (id) => ow.npcs.find((n) => n.def.id === id),
      walkNpc(id, path, speed = 1) {
        const n = ow.npcs.find((x) => x.def.id === id);
        if (!n || !path.length) return Promise.resolve();
        return new Promise((res) => ow.npcPaths.set(n, { path: [...path], speed, res }));
      },
      walkPlayer(path) {
        if (!path.length) return Promise.resolve();
        return new Promise((res) => {
          ow.playerPath = [...path];
          ow.playerPathRes = res;
        });
      },
      face(id, dir) {
        const n = ow.npcs.find((x) => x.def.id === id);
        if (n) n.dir = dir;
      },
      facePlayer(dir) {
        ow.dir = dir;
        s.dir = dir;
      },
      faceToward(id) {
        const n = ow.npcs.find((x) => x.def.id === id);
        if (!n) return;
        const dx = n.x - ow.px;
        const dy = n.y - ow.py;
        ow.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        n.dir = OPP[ow.dir];
      },
      show(id, x, y, dir) {
        const n = ow.npcs.find((v) => v.def.id === id);
        if (!n) return;
        n.hidden = false;
        if (x !== undefined) n.x = x;
        if (y !== undefined) n.y = y;
        if (dir) n.dir = dir;
      },
      hide(id) {
        const n = ow.npcs.find((v) => v.def.id === id);
        if (n) n.hidden = true;
      },
      async emote(id) {
        if (id === 'player') ow.playerEmote = 40;
        else {
          const n = ow.npcs.find((v) => v.def.id === id);
          if (n) n.emote = 40;
        }
        await ow.wait(40);
      },
      warp: (map, x, y, dir = 'down') => ow.doWarp(map, x, y, dir),
      wait: (f) => ow.wait(f),
      music: (name) => (name ? g.music(name) : g.audio.stop()),
      shop: (stock) => g.open(new ShopScene(g, stock)),
      storage: () => g.open(new StorageScene(g)),
      async receiveMon(sp, lvl) {
        const m = newMon(s, sp, lvl, g.rng);
        const where = receiveMon(s, m);
        markCaught(s, sp);
        g.sfx('catch');
        await say(g, `{PLAYER} received ${monName(m)}!`);
        if (await yesNo(g, `Give a nickname to ${monName(m)}?`)) {
          const nick = await g.open(new NamingScene(g, `${monName(m)}'s nickname?`, [], monName(m)));
          if (nick && nick !== monName(m)) m.nick = nick;
        }
        if (where === 'box') await say(g, `${monName(m)} was sent to the LINK TERMINAL storage.`);
      },
      async badge(name) {
        if (!s.badges.includes(name)) s.badges.push(name);
        g.sfx('levelup');
        await say(g, `{PLAYER} received the ${name} BADGE!`);
      },
      async flash() {
        ow.flashT = 12;
        await ow.wait(12);
      },
      gone(id) {
        const n = ow.npcs.find((v) => v.def.id === id);
        if (n) n.hidden = true;
        s.flags['gone:' + ow.map.id + ':' + id] = true;
      },
      money(n) {
        s.money = Math.max(0, s.money + n);
      },
    };
    return c;
  }

  // ---------- drawing ----------

  playerPixel(): [number, number] {
    let x = this.px * TS;
    let y = this.py * TS;
    if (this.moving) {
      x += DX[this.moving] * this.off;
      y += DY[this.moving] * this.off;
    }
    return [x, y];
  }

  draw(c: CanvasRenderingContext2D) {
    const g = this.g;
    if (this.shakeT > 0) this.shakeT--;
    const [ppx, ppy] = this.playerPixel();
    let camX = ppx - 64;
    let camY = ppy - 64;
    const mw = this.map.w * TS;
    const mh = this.map.h * TS;
    if (!this.map.outdoor) {
      if (mw <= 160) camX = (mw - 160) / 2;
      if (mh <= 144) camY = (mh - 144) / 2;
    }
    camX = Math.round(camX) + (this.shakeT > 0 ? (this.shakeT % 4 < 2 ? 1 : -1) : 0);
    camY = Math.round(camY);
    const tx0 = Math.floor(camX / TS);
    const ty0 = Math.floor(camY / TS);
    for (let ty = ty0; ty <= ty0 + 10; ty++)
      for (let tx = tx0; tx <= tx0 + 11; tx++) {
        const def = TILES[this.tileAt(tx, ty)];
        let fr = def.frames[Math.floor(g.frame / 20) % def.frames.length];
        if (def.variants) {
          // stable per-cell hash so variants never move as the camera scrolls
          const h = (Math.imul(tx * 374761393 + ty * 668265263, 1274126177) >>> 0) % def.variants.length;
          fr = def.variants[h];
        }
        const sx = tx * TS - camX;
        const sy = ty * TS - camY;
        c.drawImage(fr, sx, sy);
        const fam = edgeFamily(def);
        if (fam) {
          if (!joins(fam, TILES[this.tileAt(tx, ty - 1)])) c.drawImage(edgeOverlay(fam, 'up', this.map.ground), sx, sy);
          if (!joins(fam, TILES[this.tileAt(tx, ty + 1)])) c.drawImage(edgeOverlay(fam, 'down', this.map.ground), sx, sy);
          if (!joins(fam, TILES[this.tileAt(tx - 1, ty)])) c.drawImage(edgeOverlay(fam, 'left', this.map.ground), sx, sy);
          if (!joins(fam, TILES[this.tileAt(tx + 1, ty)])) c.drawImage(edgeOverlay(fam, 'right', this.map.ground), sx, sy);
        }
      }

    // sprites sorted by y
    type Drawable = { y: number; draw: () => void };
    const list: Drawable[] = [];
    for (const it of this.map.items) {
      if (this.s.flags['item:' + it.id]) continue;
      list.push({ y: it.y * TS, draw: () => c.drawImage(itemBallSprite(), it.x * TS - camX, it.y * TS - camY) });
    }
    if (!this.moving && this.busy === 0 && this.fade === 0) {
      const spots: { x: number; y: number }[] = [...this.map.signs];
      for (const it of this.map.items) if (!this.s.flags['item:' + it.id]) spots.push(it);
      for (const sp of spots) {
        this.g.region(this, { x: sp.x * TS - camX, y: sp.y * TS - camY, w: TS, h: TS, click: () => (this.clickSpot = { x: sp.x, y: sp.y }) });
      }
    }
    for (const n of this.npcs) {
      if (n.hidden) continue;
      const sx = n.x * TS + n.ox - camX;
      const sy = n.y * TS + n.oy - camY;
      const look = LOOKS[n.def.look] ?? LOOKS.boy;
      const prog = Math.max(Math.abs(n.ox), Math.abs(n.oy));
      const phase = n.moving && prog >= 4 && prog < 12 ? 1 + ((n.x + n.y) % 2) : 0;
      if (!n.moving && !this.moving && this.busy === 0 && this.fade === 0) {
        this.g.region(this, { x: sx, y: sy - 4, w: TS, h: TS + 4, click: () => (this.clickTalk = n) });
      }
      const monLook = MON_LOOKS[n.def.look];
      list.push({
        y: n.y * TS + n.oy,
        draw: () => {
          if (monLook) {
            let icon = creatureIcon(speciesByName(monLook));
            if (n.def.look === 'spirit') icon = silhouette(icon, '#5a4a88');
            const bob = Math.floor(g.frame / 24) % 2;
            if (n.def.look === 'spirit') c.globalAlpha = 0.65 + 0.2 * Math.sin(g.frame / 15);
            c.drawImage(icon, sx, sy - 2 - (n.def.look === 'sleeper' ? 0 : bob));
            c.globalAlpha = 1;
            if (n.emote > 0) c.drawImage(exclaimSprite(), sx, sy - 20);
            return;
          }
          c.drawImage(charFrame(charSprites(look), n.dir, phase), sx, sy - 4);
          this.grassOver(c, n.x + (n.moving && prog >= 8 ? DX[n.moving] : 0), n.y + (n.moving && prog >= 8 ? DY[n.moving] : 0), camX, camY);
          if (n.emote > 0) c.drawImage(exclaimSprite(), sx, sy - 20);
        },
      });
    }
    const jumpY = this.jump ? -Math.round(Math.sin((this.off / 32) * Math.PI) * 10) : 0;
    list.push({
      y: ppy,
      draw: () => {
        const phase = this.moving && this.off % 16 >= 4 && this.off % 16 < 12 ? 1 + this.stepParity : 0;
        const sx = ppx - camX;
        const sy = ppy - camY - 4 + jumpY;
        if (this.jump) {
          c.globalAlpha = 0.35;
          rect(c, sx + 3, ppy - camY + 12, 10, 3, '#000');
          c.globalAlpha = 1;
        }
        if (this.s.surfing) {
          const bob = Math.floor(g.frame / 16) % 2;
          rect(c, sx + 1, ppy - camY + 9 + bob, 14, 5, '#201a2e');
          rect(c, sx + 2, ppy - camY + 10 + bob, 12, 3, '#f0b040');
          rect(c, sx + 3, ppy - camY + 10 + bob, 10, 1, '#fff0b0');
          c.drawImage(charFrame(charSprites(LOOKS.player), this.dir, 0), 0, 0, 16, 12, sx, sy + bob - 2, 16, 12);
        } else c.drawImage(charFrame(charSprites(LOOKS.player), this.dir, phase), sx, sy);
        if (!this.jump) {
          const gx = this.moving && this.off >= 8 ? this.px + DX[this.moving] : this.px;
          const gy = this.moving && this.off >= 8 ? this.py + DY[this.moving] : this.py;
          this.grassOver(c, gx, gy, camX, camY);
        }
        if (this.playerEmote > 0) c.drawImage(exclaimSprite(), sx, sy - 16);
      },
    });
    list.sort((a, b) => a.y - b.y);
    for (const d of list) d.draw();

    if (this.banner) {
      const t = this.banner.t;
      const slide = t > 100 ? (110 - t) * 2.4 : t < 12 ? t * 2 : 24;
      const w = this.banner.text.length * 6 + 16;
      box(c, 4, slide - 24, w, 20);
      drawText(c, this.banner.text, 12, slide - 18, UI.ink);
    }
    if (this.flashT > 0) fadeOverlay(c, 0.5, '#f8f0ff');
    fadeOverlay(c, this.fade);
  }

  private grassOver(c: CanvasRenderingContext2D, tx: number, ty: number, camX: number, camY: number) {
    if (!this.inBounds(tx, ty)) return;
    const def = TILES[this.tileAt(tx, ty)];
    if (!def.grass) return;
    const fr = def.frames[Math.floor(this.g.frame / 20) % def.frames.length];
    c.drawImage(fr, 0, 9, 16, 7, tx * TS - camX, ty * TS - camY + 9, 16, 7);
  }
}

export function partyHpSummary(s: GameState): string {
  return s.party.map((m) => `${monName(m)} ${m.hp}/${maxHp(m)}`).join(', ');
}

export function hasUsable(s: GameState) {
  return anyAlive(s);
}
