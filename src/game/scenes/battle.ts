import { creatureSprite } from '../art/creatures';
import { charFrame, charSprites, LOOKS } from '../art/people';
import { silhouette } from '../art/pixel';
import { drawText, padLeft } from '../core/font';
import { paginate } from '../core/paginate';
import type { Game } from '../core/game';
import { box, expBar, hpBar, rect, TYPE_COLORS, UI } from '../core/gfx';
import { Modal } from '../core/scene';
import type { Element } from '../data/elements';
import { item as itemDef } from '../data/items';
import { move as moveDef, STRUGGLE, type MoveDef, type StatKey, type Status } from '../data/moves';
import { species } from '../data/species';
import type { TrainerDef } from '../data/trainers';
import {
  catchAttempt,
  calcDamage,
  chooseAiMove,
  emptyStages,
  goesFirst,
  hits,
  runChance,
  usableMoves,
  type Fighter,
} from '../systems/battlecalc';
import { addExp, evolutionFor, expFor, expReward, isAlive, maxHp, monName, stats, type Mon } from '../systems/mon';
import { markCaught, markSeen, receiveMon, removeItem } from '../systems/state';
import { drawMoreArrow, drawTextBox, fmt, TB_Y } from './dialog';
import { EvolutionScene } from './evolution';
import { BagScene, type BagChoice } from './bag';
import { NamingScene } from './naming';
import { PartyScene } from './party';
import { ForgetMoveScene } from './summary';

export type BattleResult = 'win' | 'lose' | 'run' | 'caught';

export interface BattleOpts {
  kind: 'wild' | 'trainer';
  trainer?: TrainerDef;
  party: Mon[];
  canLose?: boolean;
  noRun?: boolean;
  music?: string;
}

type UiWait =
  | { kind: 'none' }
  | { kind: 'text'; pages: string[][]; page: number; shown: number; auto: number | null; res: () => void }
  | { kind: 'cmd'; res: (v: number) => void }
  | { kind: 'move'; res: (v: number) => void }
  | { kind: 'yesno'; res: (v: boolean) => void; idx: number; prompt: string[] }
  | { kind: 'stats'; res: () => void; before: number[]; after: number[] };

interface Task {
  t: number;
  total: number;
  fn: (p: number) => void;
  res: () => void;
}

interface Fx {
  type: Element;
  t: number;
  total: number;
  side: 0 | 1;
}

const STAT_NAME: Record<StatKey, string> = { atk: 'ATTACK', def: 'DEFENSE', spd: 'SPEED', spc: 'SPECIAL', acc: 'ACCURACY' };

export class BattleScene extends Modal<BattleResult> {
  opaque = true;
  me!: Fighter;
  foe!: Fighter;
  meIdx = 0;
  foeIdx = 0;
  // visuals
  foeX = -60;
  meX = 170;
  foeVis = false;
  meVis = false;
  trainerVis = false;
  playerTrainerVis = true;
  foeDy = 0;
  meDy = 0;
  foeScale = 1;
  meScale = 1;
  foeWhite = false;
  blink: [number, number] = [0, 0];
  lunge: [number, number] = [0, 0];
  shake = 0;
  hudFoe = false;
  hudMe = false;
  disp: [number, number] = [0, 0];
  dispExp = 0;
  fx: Fx | null = null;
  pod: { x: number; y: number; tilt: number; vis: boolean; open: boolean } = { x: 0, y: 0, tilt: 0, vis: false, open: false };
  flashT = 0;
  tint: { side: 0 | 1; color: string; t: number } | null = null;
  ui: UiWait = { kind: 'none' };
  cmdIdx = 0;
  moveIdx = 0;
  tasks: Task[] = [];
  participants = new Set<number>();
  leveled = new Set<number>();
  runAttempts = 0;
  foePotions = 0;
  t = 0;

  constructor(
    g: Game,
    private o: BattleOpts,
  ) {
    super();
    this.g = g;
    if (o.trainer?.smart) this.foePotions = o.trainer.cls === 'CHAMPION' ? 2 : 1;
  }

  get s() {
    return this.g.state!;
  }

  enter() {
    const s = this.s;
    this.meIdx = s.party.findIndex(isAlive);
    this.me = { mon: s.party[this.meIdx], stages: emptyStages(), flinch: false };
    this.foe = { mon: this.o.party[0], stages: emptyStages(), flinch: false };
    this.disp = [this.foe.mon.hp, this.me.mon.hp];
    this.dispExp = this.me.mon.exp;
    this.g.music(this.o.music ?? (this.o.trainer?.music === 'boss' ? 'boss' : 'battle'));
    void this.main()
      .then((r) => this.finish(r))
      .catch((e) => {
        console.error('Battle error', e);
        this.finish('run');
      });
  }

  // ---------- async helpers ----------

  private anim(frames: number, fn: (p: number) => void = () => {}): Promise<void> {
    return new Promise((res) => this.tasks.push({ t: 0, total: frames, fn, res }));
  }

  private wait(frames: number) {
    return this.anim(frames);
  }

  private msg(text: string, auto: number | null = null): Promise<void> {
    return new Promise((res) => {
      this.ui = { kind: 'text', pages: paginate(fmt(this.g, text)), page: 0, shown: 0, auto, res };
    });
  }

  /** Short auto-advancing message for flow text. */
  private info(text: string) {
    return this.msg(text, 40);
  }

  private yesNo(text: string): Promise<boolean> {
    const pages = paginate(fmt(this.g, text));
    return this.msg(text, 0).then(
      () =>
        new Promise<boolean>((res) => {
          this.ui = { kind: 'yesno', res, idx: 0, prompt: pages[pages.length - 1] };
        }),
    );
  }

  private name(f: Fighter): string {
    const n = monName(f.mon);
    if (f === this.foe) return this.o.kind === 'wild' ? `Wild ${n}` : `Foe ${n}`;
    return n;
  }

  private side(f: Fighter): 0 | 1 {
    return f === this.foe ? 0 : 1;
  }

  private trainerName(): string {
    const t = this.o.trainer!;
    return fmt(this.g, `${t.cls} ${t.name}`);
  }

  // ---------- main flow ----------

  private async main(): Promise<BattleResult> {
    const s = this.s;
    const tr = this.o.trainer;
    // intro slide
    this.foeVis = !tr;
    this.trainerVis = !!tr;
    markSeen(s, this.foe.mon.sp);
    await this.anim(40, (p) => {
      this.foeX = -60 + (104 + 60) * p;
      this.meX = 170 - (170 - 12) * p;
    });
    if (tr) {
      await this.msg(`${this.trainerName()} wants to battle!`);
      await this.anim(16, (p) => (this.foeX = 104 + p * 60));
      this.trainerVis = false;
      this.foeX = 104;
      await this.sendOutFoe();
    } else {
      this.hudFoe = true;
      await this.msg(`A wild ${monName(this.foe.mon)} appeared!`);
    }
    await this.anim(14, (p) => (this.meX = 12 - p * 70));
    this.playerTrainerVis = false;
    await this.sendOutMe(true);

    for (;;) {
      const r = await this.turn();
      if (r) return r;
    }
  }

  private async sendOutFoe() {
    const f = this.foe.mon;
    markSeen(this.s, f.sp);
    this.disp[0] = f.hp;
    await this.info(`${this.trainerName()} sent out ${monName(f)}!`);
    this.foeVis = true;
    this.foeDy = 0;
    this.g.sfx('throw');
    await this.anim(14, (p) => (this.foeScale = p));
    this.foeScale = 1;
    this.hudFoe = true;
    await this.wait(8);
  }

  private async sendOutMe(first = false) {
    const m = this.me.mon;
    this.participants.add(m.uid);
    this.disp[1] = m.hp;
    this.dispExp = m.exp;
    this.me.stages = emptyStages();
    await this.info(first ? `Go! ${monName(m)}!` : `Your turn, ${monName(m)}!`);
    this.meX = 12;
    this.meVis = true;
    this.meDy = 0;
    this.g.sfx('throw');
    await this.anim(14, (p) => (this.meScale = p));
    this.meScale = 1;
    this.hudMe = true;
    await this.wait(6);
  }

  private async turn(): Promise<BattleResult | null> {
    const s = this.s;
    // choose action
    let action: { kind: 'move'; slot: number } | { kind: 'item'; c: BagChoice } | { kind: 'switch'; idx: number } | { kind: 'run' } | null =
      null;
    while (!action) {
      const cmd = await this.chooseCmd();
      if (cmd === 0) {
        if (!usableMoves(this.me.mon).length) {
          await this.msg(`${monName(this.me.mon)} has no moves left!`);
          action = { kind: 'move', slot: -1 };
          break;
        }
        const slot = await this.chooseMove();
        if (slot >= 0) action = { kind: 'move', slot };
      } else if (cmd === 1) {
        const c = await this.g.open(new BagScene(this.g, 'battle'));
        if (c) action = { kind: 'item', c };
      } else if (cmd === 2) {
        const idx = await this.g.open(new PartyScene(this.g, 'battle', this.meIdx));
        if (idx >= 0) {
          if (idx === this.meIdx) await this.msg(`${monName(this.me.mon)} is already out!`);
          else if (!isAlive(s.party[idx])) await this.msg('There is no energy left to battle!');
          else action = { kind: 'switch', idx };
        }
      } else {
        action = { kind: 'run' };
      }
    }

    let foeActs = true;
    // non-move actions resolve first
    if (action.kind === 'run') {
      if (this.o.kind === 'trainer') {
        await this.msg("No! There's no running from a trainer battle!");
        return null;
      }
      if (this.o.noRun) {
        await this.msg("Can't escape! Something is holding you back!");
        return null;
      }
      this.runAttempts++;
      if (this.g.rng.chance(runChance(this.me, this.foe, this.runAttempts - 1))) {
        this.g.sfx('run');
        await this.msg('Got away safely!');
        return 'run';
      }
      await this.msg("Can't escape!");
    } else if (action.kind === 'switch') {
      await this.info(`${monName(this.me.mon)}, come back!`);
      await this.anim(10, (p) => (this.meScale = 1 - p));
      this.meVis = false;
      this.hudMe = false;
      this.meIdx = action.idx;
      this.me = { mon: s.party[action.idx], stages: emptyStages(), flinch: false };
      await this.sendOutMe();
    } else if (action.kind === 'item') {
      const r = await this.useItem(action.c);
      if (r) return r;
    }

    // moves
    const foeMove = this.pickFoeAction();
    if (action.kind === 'move') {
      const myMove = action.slot >= 0 ? moveDef(this.me.mon.moves[action.slot].id) : STRUGGLE;
      const fm = foeMove ?? STRUGGLE;
      const meFirst = foeMove === null || goesFirst(this.g.rng, this.me, myMove, this.foe, fm);
      const order: [Fighter, Fighter, MoveDef, number][] = [
        [this.me, this.foe, myMove, action.slot],
        [this.foe, this.me, fm, (foeMove as (MoveDef & { slot: number }) | null)?.slot ?? -1],
      ];
      if (!meFirst) order.reverse();
      for (let k = 0; k < 2; k++) {
        const [a, d, mv, slot] = order[k];
        if (a === this.foe && foeMove === null) {
          await this.foePotion();
          continue;
        }
        await this.execute(a, d, mv, slot, k === 0);
        const r = await this.checkFaints();
        if (r !== undefined) {
          if (r) return r;
          foeActs = false;
          break;
        }
      }
    } else if (foeActs) {
      if (foeMove === null) await this.foePotion();
      else {
        await this.execute(this.foe, this.me, foeMove, foeMove.slot, false);
        const r = await this.checkFaints();
        if (r) return r;
        if (r !== undefined) foeActs = false;
      }
    }
    this.me.flinch = false;
    this.foe.flinch = false;
    // residual damage
    for (const f of [this.me, this.foe]) {
      if (!isAlive(f.mon) || (f.mon.status !== 'BRN' && f.mon.status !== 'PSN')) continue;
      const dmg = Math.max(1, Math.floor(maxHp(f.mon) / 8));
      f.mon.hp = Math.max(0, f.mon.hp - dmg);
      this.tint = { side: this.side(f), color: f.mon.status === 'BRN' ? '#f07830' : '#a858c0', t: 16 };
      await this.animHp(this.side(f));
      await this.info(`${this.name(f)} is hurt by ${f.mon.status === 'BRN' ? 'its burn' : 'poison'}!`);
      const r = await this.checkFaints();
      if (r) return r;
    }
    return null;
  }

  private pickFoeAction(): (MoveDef & { slot: number }) | null {
    const f = this.foe;
    if (this.foePotions > 0 && f.mon.hp > 0 && f.mon.hp / maxHp(f.mon) < 0.25 && this.g.rng.chance(0.6)) return null;
    return chooseAiMove(this.g.rng, f, this.me, !!this.o.trainer?.smart);
  }

  private async foePotion() {
    this.foePotions--;
    const f = this.foe.mon;
    f.hp = Math.min(maxHp(f), f.hp + 60);
    this.g.sfx('heal');
    await this.info(`${this.trainerName()} used a SUPER POTION!`);
    await this.animHp(0);
  }

  /** Returns undefined if nobody fainted, null if battle continues after a faint, or a result. */
  private async checkFaints(): Promise<BattleResult | null | undefined> {
    let fainted = false;
    if (!isAlive(this.foe.mon)) {
      fainted = true;
      const r = await this.foeFainted();
      if (r) return r;
    }
    if (!isAlive(this.me.mon)) {
      fainted = true;
      const r = await this.meFainted();
      if (r) return r;
    }
    return fainted ? null : undefined;
  }

  private async foeFainted(): Promise<BattleResult | null> {
    this.g.sfx('faint');
    await this.anim(20, (p) => (this.foeDy = p * 48));
    this.foeVis = false;
    this.hudFoe = false;
    await this.msg(`${this.name(this.foe)} fainted!`);
    await this.giveExp();
    if (this.o.kind === 'trainer') {
      const next = this.o.party.findIndex(isAlive);
      if (next >= 0) {
        this.foeIdx = next;
        this.foe = { mon: this.o.party[next], stages: emptyStages(), flinch: false };
        this.participants = new Set(isAlive(this.me.mon) ? [this.me.mon.uid] : []);
        this.foeDy = 0;
        await this.sendOutFoe();
        return null;
      }
      return this.victory();
    }
    return this.victory();
  }

  private async meFainted(): Promise<BattleResult | null> {
    const s = this.s;
    this.g.sfx('faint');
    await this.anim(20, (p) => (this.meDy = p * 48));
    this.meVis = false;
    this.hudMe = false;
    await this.msg(`${monName(this.me.mon)} fainted!`);
    this.participants.delete(this.me.mon.uid);
    if (!s.party.some(isAlive)) {
      return 'lose';
    }
    const idx = await this.g.open(new PartyScene(this.g, 'forced', this.meIdx));
    this.meIdx = idx;
    this.me = { mon: s.party[idx], stages: emptyStages(), flinch: false };
    this.meDy = 0;
    await this.sendOutMe();
    return null;
  }

  private async victory(): Promise<BattleResult> {
    const s = this.s;
    this.g.music('victory');
    if (this.o.kind === 'trainer' && this.o.trainer) {
      const t = this.o.trainer;
      this.trainerVis = true;
      await this.anim(20, (p) => (this.foeX = 164 - p * 60));
      await this.msg(`{PLAYER} defeated ${this.trainerName()}!`);
      if (t.lose) await this.msg(t.lose);
      const last = this.o.party[this.o.party.length - 1];
      const prize = t.money * last.lvl;
      s.money += prize;
      await this.msg(`{PLAYER} got $${prize} for winning!`);
    }
    await this.evolutions();
    return 'win';
  }

  private async evolutions() {
    for (const m of this.s.party) {
      if (!this.leveled.has(m.uid) || !isAlive(m)) continue;
      const to = evolutionFor(m);
      if (to) {
        await this.g.open(new EvolutionScene(this.g, m, to));
      }
    }
  }

  // ---------- experience ----------

  private async giveExp() {
    const s = this.s;
    const base = expReward(this.foe.mon, this.o.kind === 'trainer');
    const part = s.party.filter((m) => isAlive(m) && this.participants.has(m.uid));
    const rest = s.party.filter((m) => isAlive(m) && !this.participants.has(m.uid));
    for (const m of part) {
      await this.msg(`${monName(m)} gained ${base} EXP. Points!`);
      await this.applyExp(m, base);
    }
    if (rest.length) {
      const half = Math.max(1, Math.floor(base / 2));
      await this.info(`The rest of the team gained ${half} EXP. Points!`);
      for (const m of rest) await this.applyExp(m, half);
    }
  }

  private async applyExp(m: Mon, amount: number) {
    const active = m === this.me.mon;
    const evs = addExp(m, amount);
    if (active && !evs.length) {
      const from = this.dispExp;
      await this.anim(20, (p) => (this.dispExp = from + (m.exp - from) * p));
    }
    for (const ev of evs) {
      if (active) {
        const from = this.dispExp;
        const target = expFor(ev.lvl);
        await this.anim(16, (p) => (this.dispExp = from + (target - from) * p));
        this.dispExp = target;
        this.disp[1] = m.hp;
      }
      this.leveled.add(m.uid);
      this.g.sfx('levelup');
      await this.msg(`${monName(m)} grew to Lv. ${ev.lvl}!`);
      if (active) await this.showStats(ev.before, ev.after);
      for (const id of ev.learn) await this.learnMove(m, id);
    }
    if (active) this.dispExp = m.exp;
  }

  private showStats(b: ReturnType<typeof stats>, a: ReturnType<typeof stats>): Promise<void> {
    return new Promise((res) => {
      this.ui = {
        kind: 'stats',
        res,
        before: [b.hp, b.atk, b.def, b.spd, b.spc],
        after: [a.hp, a.atk, a.def, a.spd, a.spc],
      };
    });
  }

  async learnMove(m: Mon, id: string) {
    const mv = moveDef(id);
    if (m.moves.some((x) => x.id === id)) return;
    if (m.moves.length < 4) {
      m.moves.push({ id, pp: mv.pp });
      this.g.sfx('item');
      await this.msg(`${monName(m)} learned ${mv.name.toUpperCase()}!`);
      return;
    }
    for (;;) {
      await this.msg(`${monName(m)} wants to learn ${mv.name.toUpperCase()}. But it already knows 4 moves.`);
      const yes = await this.yesNo('Forget a move to make room?');
      if (yes) {
        const slot = await this.g.open(new ForgetMoveScene(this.g, m, id));
        if (slot >= 0) {
          const old = moveDef(m.moves[slot].id);
          m.moves[slot] = { id, pp: mv.pp };
          await this.msg(`1, 2, and... Poof! ${monName(m)} forgot ${old.name.toUpperCase()}...`);
          this.g.sfx('item');
          await this.msg(`...and learned ${mv.name.toUpperCase()}!`);
          return;
        }
      }
      const stop = await this.yesNo(`Stop learning ${mv.name.toUpperCase()}?`);
      if (stop) {
        await this.msg(`${monName(m)} did not learn ${mv.name.toUpperCase()}.`);
        return;
      }
    }
  }

  // ---------- items ----------

  private async useItem(c: BagChoice): Promise<BattleResult | null> {
    const s = this.s;
    const def = itemDef(c.id);
    if (def.kind === 'pod') {
      if (this.o.kind === 'trainer') {
        await this.msg("The trainer blocked the pod! You can't catch another trainer's Wildkin!");
        return null;
      }
      removeItem(s, c.id);
      return this.throwPod(def.value, def.name);
    }
    const target = s.party[c.target ?? 0];
    removeItem(s, c.id);
    await this.info(`{PLAYER} used ${def.name.toUpperCase()}.`);
    if (def.kind === 'heal') {
      const before = target.hp;
      target.hp = Math.min(maxHp(target), target.hp + def.value);
      this.g.sfx('heal');
      if (target === this.me.mon) await this.animHp(1);
      await this.msg(`${monName(target)} recovered ${target.hp - before} HP!`);
    } else if (def.kind === 'cure') {
      target.status = null;
      target.sleep = 0;
      this.g.sfx('heal');
      await this.msg(`${monName(target)} is cured of its status problem!`);
    } else if (def.kind === 'revive') {
      target.hp = Math.floor(maxHp(target) * def.value);
      this.g.sfx('heal');
      await this.msg(`${monName(target)} was revived!`);
    }
    return null;
  }

  private async throwPod(mul: number, name: string): Promise<BattleResult | null> {
    const s = this.s;
    await this.info(`{PLAYER} threw a ${name.toUpperCase()}!`);
    this.g.sfx('throw');
    this.pod = { x: 30, y: 90, tilt: 0, vis: true, open: false };
    await this.anim(24, (p) => {
      this.pod.x = 30 + (124 - 30) * p;
      this.pod.y = 90 - Math.sin(p * Math.PI) * 70 - p * 60;
    });
    this.pod.open = true;
    this.foeWhite = true;
    await this.anim(16, (p) => (this.foeScale = 1 - p));
    this.foeVis = false;
    this.foeWhite = false;
    this.pod.open = false;
    await this.anim(12, (p) => (this.pod.y = 30 + p * 14));
    const r = catchAttempt(this.g.rng, this.foe.mon, mul);
    for (let i = 0; i < r.shakes; i++) {
      await this.wait(20);
      this.g.sfx('shake');
      await this.anim(16, (p) => (this.pod.tilt = Math.sin(p * Math.PI * 2) * 2));
      this.pod.tilt = 0;
    }
    await this.wait(16);
    if (r.caught) {
      this.g.sfx('catch');
      await this.msg(`Gotcha! ${monName(this.foe.mon)} was caught!`);
      const m = this.foe.mon;
      m.ot = s.name;
      const newEntry = !s.caught.includes(m.sp);
      markCaught(s, m.sp);
      if (newEntry) await this.msg(`${monName(m)}'s data was added to the WILDEX.`);
      const nick = await this.yesNo(`Give a nickname to ${monName(m)}?`);
      if (nick) {
        const n = await this.g.open(new NamingScene(this.g, `${monName(m)}'s nickname?`, [], monName(m)));
        if (n && n !== monName(m)) m.nick = n;
      }
      const where = receiveMon(s, m);
      if (where === 'box') await this.msg(`${monName(m)} was sent to LINK TERMINAL storage.`);
      this.pod.vis = false;
      await this.evolutions();
      return 'caught';
    }
    this.pod.vis = false;
    this.foeVis = true;
    await this.anim(10, (p) => (this.foeScale = p));
    this.foeScale = 1;
    await this.msg(['Oh no! It broke free!', 'Aww! It appeared to be caught!', 'Argh! So close!'][Math.min(2, r.shakes)]);
    return null;
  }

  // ---------- move execution ----------

  private async execute(a: Fighter, d: Fighter, mv: MoveDef, slot: number, first: boolean) {
    const rng = this.g.rng;
    const an = this.name(a);
    const am = a.mon;
    if (am.status === 'SLP') {
      am.sleep--;
      if (am.sleep <= 0) {
        am.status = null;
        await this.info(`${an} woke up!`);
      } else {
        await this.info(`${an} is fast asleep.`);
        return;
      }
    }
    if (am.status === 'FRZ') {
      if (rng.chance(0.2)) {
        am.status = null;
        await this.info(`${an} thawed out!`);
      } else {
        await this.info(`${an} is frozen solid!`);
        return;
      }
    }
    if (am.status === 'PAR' && rng.chance(0.25)) {
      await this.info(`${an} is fully paralyzed!`);
      return;
    }
    if (a.flinch) {
      a.flinch = false;
      await this.info(`${an} flinched!`);
      return;
    }
    if (slot >= 0) am.moves[slot].pp = Math.max(0, am.moves[slot].pp - 1);
    await this.msg(`${an} used ${mv.name.toUpperCase()}!`, 30);

    const selfTarget = mv.cat === 'status' && (mv.heal || mv.stat?.who === 'self');
    if (!selfTarget && !hits(rng, a, d, mv)) {
      await this.info(`${an}'s attack missed!`);
      return;
    }
    const dn = this.name(d);
    if (mv.cat !== 'status') {
      const r = calcDamage(rng, a, d, mv);
      if (r.eff === 0) {
        await this.info(`It doesn't affect ${dn}...`);
        return;
      }
      await this.attackAnim(a, d, mv, r.eff);
      const dmg = Math.min(r.damage, d.mon.hp);
      d.mon.hp -= dmg;
      await this.animHp(this.side(d));
      if (r.crit) await this.info('A critical hit!');
      if (r.eff > 1) await this.info("It's super effective!");
      else if (r.eff < 1) await this.info("It's not very effective...");
      if (mv.drain && isAlive(am)) {
        const h = Math.max(1, Math.floor(dmg * mv.drain));
        am.hp = Math.min(maxHp(am), am.hp + h);
        await this.animHp(this.side(a));
        await this.info(`${dn} had its energy drained!`);
      }
      if (mv.recoil) {
        am.hp = Math.max(0, am.hp - Math.max(1, Math.floor(dmg * mv.recoil)));
        await this.animHp(this.side(a));
        await this.info(`${an} is hit with recoil!`);
      }
      if (isAlive(d.mon)) {
        if (mv.status && rng.chance(mv.status.chance)) await this.inflict(d, mv.status.s, true);
        if (mv.stat && rng.chance(mv.stat.chance)) await this.applyStat(mv.stat.who === 'self' ? a : d, mv.stat.key, mv.stat.delta);
        if (mv.flinch && first && rng.chance(mv.flinch)) d.flinch = true;
      }
      return;
    }
    // status moves
    await this.statusAnim(mv.stat?.who === 'self' || mv.heal ? a : d, mv.type);
    if (mv.heal) {
      if (am.hp >= maxHp(am)) {
        await this.info('But it failed!');
        return;
      }
      am.hp = Math.min(maxHp(am), am.hp + Math.floor(maxHp(am) * mv.heal));
      this.g.sfx('heal');
      await this.animHp(this.side(a));
      await this.info(`${an} regained health!`);
    }
    if (mv.status) {
      const ok = await this.inflict(d, mv.status.s, false);
      if (!ok) await this.info('But it failed!');
    }
    if (mv.stat) await this.applyStat(mv.stat.who === 'self' ? a : d, mv.stat.key, mv.stat.delta);
  }

  private async inflict(f: Fighter, st: Status, silent: boolean): Promise<boolean> {
    const types = species(f.mon.sp).types;
    const immune =
      (st === 'BRN' && types.includes('FLAME')) ||
      (st === 'PSN' && types.includes('TOXIN')) ||
      (st === 'FRZ' && types.includes('FROST')) ||
      (st === 'PAR' && types.includes('VOLT'));
    if (f.mon.status || immune || !isAlive(f.mon)) {
      if (!silent && f.mon.status) {
        await this.info(`${this.name(f)} is already affected!`);
        return true;
      }
      return false;
    }
    f.mon.status = st;
    if (st === 'SLP') f.mon.sleep = this.g.rng.range(1, 3) + 1;
    const col: Record<Status, string> = { PSN: '#a858c0', BRN: '#f07830', PAR: '#f0c828', SLP: '#8888a8', FRZ: '#78d0e8' };
    this.tint = { side: this.side(f), color: col[st], t: 20 };
    const txt: Record<Status, string> = {
      PSN: 'was poisoned!',
      BRN: 'was burned!',
      PAR: 'is paralyzed! It may be unable to move!',
      SLP: 'fell asleep!',
      FRZ: 'was frozen solid!',
    };
    await this.msg(`${this.name(f)} ${txt[st]}`);
    return true;
  }

  private async applyStat(f: Fighter, key: StatKey, delta: number) {
    const cur = f.stages[key];
    const nx = Math.max(-6, Math.min(6, cur + delta));
    const n = this.name(f);
    if (nx === cur) {
      await this.info(`${n}'s ${STAT_NAME[key]} won't go any ${delta > 0 ? 'higher' : 'lower'}!`);
      return;
    }
    f.stages[key] = nx;
    this.g.sfx(delta > 0 ? 'statup' : 'statdown');
    this.tint = { side: this.side(f), color: delta > 0 ? '#f8a040' : '#5878d0', t: 24 };
    await this.wait(16);
    const word = delta >= 2 ? 'sharply rose!' : delta > 0 ? 'rose!' : delta <= -2 ? 'harshly fell!' : 'fell!';
    await this.info(`${n}'s ${STAT_NAME[key]} ${word}`);
  }

  // ---------- animations ----------

  private async attackAnim(a: Fighter, d: Fighter, mv: MoveDef, eff: number) {
    const as = this.side(a);
    const ds = this.side(d);
    const dir = as === 1 ? 1 : -1;
    await this.anim(8, (p) => (this.lunge[as] = Math.sin(p * Math.PI) * 6 * dir));
    this.lunge[as] = 0;
    if (this.g.options.battleAnim) {
      this.fx = { type: mv.type, t: 0, total: 22, side: ds };
      await this.anim(22, (p) => this.fx && (this.fx.t = Math.floor(p * 22)));
      this.fx = null;
    }
    this.g.sfx(eff > 1 ? 'super' : eff < 1 ? 'weak' : 'hit');
    if (mv.cat === 'phys' || eff > 1) this.shake = 10;
    await this.anim(16, (p) => (this.blink[ds] = Math.floor(p * 16)));
    this.blink[ds] = 0;
  }

  private async statusAnim(target: Fighter, type: Element) {
    if (!this.g.options.battleAnim) return;
    this.fx = { type, t: 0, total: 18, side: this.side(target) };
    await this.anim(18, (p) => this.fx && (this.fx.t = Math.floor(p * 18)));
    this.fx = null;
  }

  private animHp(side: 0 | 1): Promise<void> {
    const f = side === 0 ? this.foe : this.me;
    const from = this.disp[side];
    const to = f.mon.hp;
    if (from === to) return Promise.resolve();
    const frames = Math.min(40, Math.max(10, Math.abs(to - from) * 2));
    return this.anim(frames, (p) => (this.disp[side] = Math.round(from + (to - from) * p))).then(() => {
      this.disp[side] = to;
    });
  }

  // ---------- menus ----------

  private chooseCmd(): Promise<number> {
    return new Promise((res) => (this.ui = { kind: 'cmd', res }));
  }

  private chooseMove(): Promise<number> {
    if (this.moveIdx >= this.me.mon.moves.length) this.moveIdx = 0;
    return new Promise((res) => (this.ui = { kind: 'move', res }));
  }

  // ---------- update ----------

  update() {
    this.t++;
    if (this.shake > 0) this.shake--;
    if (this.flashT > 0) this.flashT--;
    if (this.tint && --this.tint.t <= 0) this.tint = null;
    if (this.tasks.length) {
      const tk = this.tasks[0];
      tk.t++;
      tk.fn(Math.min(1, tk.t / tk.total));
      if (tk.t >= tk.total) {
        this.tasks.shift();
        tk.res();
      }
      return;
    }
    const i = this.g.input;
    const ui = this.ui;
    switch (ui.kind) {
      case 'text': {
        const total = ui.pages[ui.page].join('').length;
        const last = ui.page >= ui.pages.length - 1;
        if (ui.shown < total) {
          ui.shown += this.g.textRate() * (i.down('a') || i.down('b') ? 4 : 1) + 0.5;
          if (i.pressed('a') || i.pressed('b')) ui.shown = total;
          return;
        }
        if (last && ui.auto !== null) {
          if (ui.auto <= 0) {
            this.ui = { kind: 'none' };
            ui.res();
            return;
          }
          ui.auto--;
          if (i.pressed('a') || i.pressed('b')) ui.auto = 0;
          return;
        }
        if (i.pressed('a') || i.pressed('b')) {
          this.g.sfx('select');
          if (!last) {
            ui.page++;
            ui.shown = 0;
            return;
          }
          this.ui = { kind: 'none' };
          ui.res();
        }
        return;
      }
      case 'cmd': {
        const col = this.cmdIdx % 2;
        const row = Math.floor(this.cmdIdx / 2);
        if (i.pressed('left') || i.pressed('right')) {
          this.cmdIdx = row * 2 + (1 - col);
          this.g.sfx('select');
        }
        if (i.pressed('up') || i.pressed('down')) {
          this.cmdIdx = (1 - row) * 2 + col;
          this.g.sfx('select');
        }
        if (i.pressed('a')) {
          this.g.sfx('confirm');
          this.ui = { kind: 'none' };
          ui.res(this.cmdIdx);
        }
        return;
      }
      case 'move': {
        const n = this.me.mon.moves.length;
        if (i.repeat('up')) {
          this.moveIdx = (this.moveIdx + n - 1) % n;
          this.g.sfx('select');
        }
        if (i.repeat('down')) {
          this.moveIdx = (this.moveIdx + 1) % n;
          this.g.sfx('select');
        }
        if (i.pressed('b')) {
          this.g.sfx('cancel');
          this.ui = { kind: 'none' };
          ui.res(-1);
        } else if (i.pressed('a')) {
          if (this.me.mon.moves[this.moveIdx].pp <= 0) {
            this.g.sfx('error');
            return;
          }
          this.g.sfx('confirm');
          this.ui = { kind: 'none' };
          ui.res(this.moveIdx);
        }
        return;
      }
      case 'yesno': {
        if (i.pressed('up') || i.pressed('down')) {
          ui.idx = 1 - ui.idx;
          this.g.sfx('select');
        }
        if (i.pressed('a') || i.pressed('b')) {
          const v = i.pressed('a') ? ui.idx === 0 : false;
          this.g.sfx(v ? 'confirm' : 'cancel');
          this.ui = { kind: 'none' };
          ui.res(v);
        }
        return;
      }
      case 'stats': {
        if (i.pressed('a') || i.pressed('b')) {
          this.ui = { kind: 'none' };
          ui.res();
        }
        return;
      }
    }
  }

  // ---------- drawing ----------

  draw(c: CanvasRenderingContext2D) {
    const sx = this.shake > 0 ? (this.shake % 4 < 2 ? 2 : -2) : 0;
    // background: soft gradient bands
    rect(c, 0, 0, 160, 144, '#f8f4e8');
    rect(c, 0, 0, 160, 48, '#eef4f8');
    rect(c, 0, 48, 160, 48, '#f4f0e0');
    c.save();
    c.translate(sx, 0);
    // platforms
    this.platform(c, 128, 46, 30, 6);
    this.platform(c, 38, 92, 36, 6);

    // foe
    if (this.trainerVis && this.o.trainer) {
      const look = LOOKS[this.o.trainer.look] ?? LOOKS.boy;
      const fr = charFrame(charSprites(look), 'down', 0);
      c.drawImage(fr, 0, 0, 16, 16, Math.round(this.foeX), 0, 48, 48);
    } else if (this.foeVis && this.blink[0] % 8 < 5) {
      this.drawMon(c, this.foe.mon.sp, false, this.foeX + this.lunge[0], 2 + this.foeDy, this.foeScale, 50, this.foeWhite, 0);
    }
    // player side
    if (this.playerTrainerVis) {
      const fr = charFrame(charSprites(LOOKS.player), 'up', 0);
      c.drawImage(fr, 0, 0, 16, 16, Math.round(this.meX), 48, 48, 48);
    } else if (this.meVis && this.blink[1] % 8 < 5) {
      this.drawMon(c, this.me.mon.sp, true, this.meX + this.lunge[1], 46 + this.meDy, this.meScale, 96, false, 1);
    }
    if (this.fx) this.drawFx(c, this.fx);
    if (this.pod.vis) this.drawPod(c);
    c.restore();

    if (this.hudFoe) this.drawFoeHud(c);
    if (this.hudMe) this.drawMeHud(c);

    // bottom UI
    const ui = this.ui;
    const g = this.g;
    const tapA = () => g.input.tap('a');
    const pick = (set: () => boolean) => () => {
      if (set()) g.sfx('select');
    };
    if (ui.kind === 'text') {
      const lines = ui.pages[ui.page];
      drawTextBox(c, lines, Math.floor(ui.shown));
      const last = ui.page >= ui.pages.length - 1;
      if ((ui.auto === null || !last) && ui.shown >= lines.join('').length) drawMoreArrow(c, this.t);
      g.region(this, { x: 0, y: 0, w: 160, h: 144, click: tapA });
    } else if (ui.kind === 'cmd') {
      drawTextBox(c, ['What will', `${monName(this.me.mon)} do?`]);
      box(c, 80, TB_Y, 80, 48);
      const items = ['FIGHT', 'BAG', 'PARTY', 'RUN'];
      items.forEach((it, k) => {
        const x = 92 + (k % 2) * 36;
        const y = TB_Y + 12 + Math.floor(k / 2) * 16;
        drawText(c, it, x, y);
        if (k === this.cmdIdx) drawText(c, '▶', x - 8, y);
        g.region(this, {
          x: x - 9,
          y: y - 4,
          w: 36,
          h: 16,
          hover: pick(() => this.cmdIdx !== k && ((this.cmdIdx = k), true)),
          click: tapA,
        });
      });
    } else if (ui.kind === 'move') {
      this.drawMoveMenu(c);
      this.me.mon.moves.forEach((_, k) =>
        g.region(this, {
          x: 3,
          y: TB_Y + 4 + k * 10,
          w: 100,
          h: 10,
          hover: pick(() => this.moveIdx !== k && ((this.moveIdx = k), true)),
          click: tapA,
        }),
      );
      // clicking outside the move list backs out, like B
      g.region(this, { x: 106, y: TB_Y, w: 54, h: 48, click: () => g.input.tap('b') });
    } else if (ui.kind === 'yesno') {
      const top = drawTextBox(c, ui.prompt);
      box(c, 112, top - 34, 48, 34);
      drawText(c, 'YES', 128, top - 27);
      drawText(c, 'NO', 128, top - 15);
      drawText(c, '▶', 120, top - 27 + ui.idx * 12);
      [0, 1].forEach((k) =>
        g.region(this, {
          x: 115,
          y: top - 30 + k * 12,
          w: 42,
          h: 12,
          hover: pick(() => ui.idx !== k && ((ui.idx = k), true)),
          click: tapA,
        }),
      );
    } else drawTextBox(c, []);
    if (ui.kind === 'stats') {
      this.drawStatBox(c, ui.before, ui.after);
      g.region(this, { x: 0, y: 0, w: 160, h: 144, click: tapA });
    }
  }

  private platform(c: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
    c.fillStyle = '#d8d0b8';
    c.beginPath();
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry)));
      c.rect(cx - w, cy + y, w * 2, 1);
    }
    c.fill();
    c.fillStyle = '#c4baa0';
    for (let y = 1; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry)));
      c.fillRect(cx - w, cy + y, w * 2, 1);
    }
  }

  private drawMon(
    c: CanvasRenderingContext2D,
    sp: number,
    back: boolean,
    x: number,
    y: number,
    scale: number,
    clipBottom: number,
    white: boolean,
    side: 0 | 1,
  ) {
    let spr = creatureSprite(sp, back);
    if (white) spr = silhouette(spr, '#ffffff');
    const bob = Math.floor(this.t / 30) % 2 === 0 || this.tasks.length ? 0 : side === 1 ? 1 : 0;
    const w = Math.round(48 * scale);
    if (w <= 0) return;
    c.save();
    c.beginPath();
    c.rect(x - 4, 0, 60, clipBottom);
    c.clip();
    c.drawImage(spr, Math.round(x + (48 - w) / 2), Math.round(y + 48 - w + bob), w, w);
    if (this.tint && this.tint.side === side && this.tint.t % 6 < 3) {
      c.globalAlpha = 0.55;
      c.drawImage(silhouette(spr, this.tint.color), Math.round(x + (48 - w) / 2), Math.round(y + 48 - w + bob), w, w);
      c.globalAlpha = 1;
    }
    c.restore();
  }

  private drawFoeHud(c: CanvasRenderingContext2D) {
    const m = this.foe.mon;
    drawText(c, monName(m), 8, 6);
    drawText(c, `Lv${m.lvl}`, 8, 15);
    if (m.status) this.statusTag(c, 40, 15, m.status);
    hpBar(c, 14, 25, 48, this.disp[0] / maxHp(m));
    // L-shaped frame
    rect(c, 6, 31, 70, 1, UI.ink);
    rect(c, 76, 16, 1, 16, UI.ink);
    rect(c, 6, 32, 70, 1, '#c4baa0');
  }

  private drawMeHud(c: CanvasRenderingContext2D) {
    const m = this.me.mon;
    const x = 82;
    drawText(c, monName(m), x, 52);
    drawText(c, `Lv${m.lvl}`, x, 61);
    if (m.status) this.statusTag(c, x + 32, 61, m.status);
    hpBar(c, x, 71, 48, this.disp[1] / maxHp(m));
    drawText(c, `${padLeft(this.disp[1], 3)}/${padLeft(maxHp(m), 3)}`, x + 20, 78);
    const lo = expFor(m.lvl);
    const hi = expFor(m.lvl + 1);
    expBar(c, x + 12, 89, 62, (this.dispExp - lo) / Math.max(1, hi - lo));
    rect(c, x - 4, 92, 80, 1, UI.ink);
    rect(c, x - 4, 50, 1, 42, UI.ink);
  }

  private statusTag(c: CanvasRenderingContext2D, x: number, y: number, st: Status) {
    const col: Record<Status, string> = { PSN: '#a858c0', BRN: '#e86030', PAR: '#d0a018', SLP: '#7878a0', FRZ: '#48a8d0' };
    rect(c, x - 1, y - 1, 20, 9, col[st]);
    drawText(c, st, x, y, '#ffffff');
  }

  private drawMoveMenu(c: CanvasRenderingContext2D) {
    const m = this.me.mon;
    box(c, 0, TB_Y, 106, 48);
    m.moves.forEach((mv, k) => {
      const def = moveDef(mv.id);
      drawText(c, def.name.toUpperCase().slice(0, 14), 12, TB_Y + 6 + k * 10, mv.pp > 0 ? UI.ink : UI.muted);
      if (k === this.moveIdx) drawText(c, '▶', 5, TB_Y + 6 + k * 10);
    });
    box(c, 104, TB_Y, 56, 48);
    const sel = m.moves[this.moveIdx];
    if (sel) {
      const def = moveDef(sel.id);
      rect(c, 108, TB_Y + 5, 48, 10, TYPE_COLORS[def.type]);
      drawText(c, def.type, 110, TB_Y + 6, '#ffffff');
      drawText(c, `PP${padLeft(sel.pp, 2)}/${padLeft(def.pp, 2)}`, 108, TB_Y + 19, sel.pp > 0 ? UI.ink : UI.hpRed);
      drawText(c, def.cat === 'status' ? 'STATUS' : `POW${padLeft(def.pow, 3)}`, 108, TB_Y + 31, UI.muted);
    }
  }

  private drawStatBox(c: CanvasRenderingContext2D, b: number[], a: number[]) {
    box(c, 72, 4, 88, 66);
    const names = ['MAX HP', 'ATTACK', 'DEFENSE', 'SPEED', 'SPECIAL'];
    names.forEach((n, k) => {
      drawText(c, n, 78, 10 + k * 11);
      drawText(c, `+${a[k] - b[k]}`, 136, 10 + k * 11, '#d04838');
    });
  }

  private drawPod(c: CanvasRenderingContext2D) {
    const { x, y, tilt, open } = this.pod;
    const px = Math.round(x + tilt);
    const py = Math.round(y);
    rect(c, px - 3, py - 4, 7, 8, UI.ink);
    rect(c, px - 4, py - 3, 9, 6, UI.ink);
    rect(c, px - 3, py - 3, 7, 3, open ? '#ffffff' : '#e04848');
    rect(c, px - 3, py + 1, 7, 2, '#f8f4e8');
    rect(c, px - 1, py - 1, 3, 2, '#f8f4e8');
    if (open) {
      c.globalAlpha = 0.6;
      rect(c, px - 8, py - 8, 17, 17, '#ffffff');
      c.globalAlpha = 1;
    }
  }

  private drawFx(c: CanvasRenderingContext2D, fx: Fx) {
    const cx = fx.side === 0 ? 128 : 38;
    const cy = fx.side === 0 ? 28 : 72;
    const t = fx.t;
    const p = t / fx.total;
    const col = TYPE_COLORS[fx.type];
    const dot = (x: number, y: number, s: number, color: string) => rect(c, Math.round(x - s / 2), Math.round(y - s / 2), s, s, color);
    switch (fx.type) {
      case 'FLAME':
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2;
          const r = 6 + p * 14;
          dot(cx + Math.cos(a) * r * 0.8, cy + 8 - p * 18 + Math.sin(a) * 4, 4 - (k % 2), k % 2 ? '#ffd040' : '#f07830');
        }
        break;
      case 'TIDE':
      case 'TOXIN':
        for (let k = 0; k < 6; k++) {
          const ox = ((k * 37) % 30) - 15;
          const oy = 12 - ((t * 2 + k * 9) % 30);
          dot(cx + ox, cy + oy, 4, fx.type === 'TIDE' ? '#58a8f0' : '#a858c0');
          dot(cx + ox - 1, cy + oy - 1, 1, '#ffffff');
        }
        break;
      case 'LEAF':
        for (let k = 0; k < 6; k++) {
          const sx = cx - 30 + ((t * 4 + k * 13) % 50);
          dot(sx, cy - 16 + k * 6, 3, k % 2 ? '#58b848' : '#88d058');
        }
        break;
      case 'VOLT':
        if (t % 4 < 2) {
          c.globalAlpha = 0.25;
          rect(c, 0, 0, 160, 96, '#fff8a0');
          c.globalAlpha = 1;
        }
        for (let k = 0; k < 5; k++) dot(cx - 8 + (k % 2) * 16 - (k % 2 ? 4 : 0), cy - 20 + k * 8, 3, '#f0c828');
        break;
      case 'FROST':
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + p;
          const r = 20 - p * 14;
          dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, k % 2 ? '#c8f0ff' : '#78d0e8');
        }
        break;
      case 'STONE':
        for (let k = 0; k < 4; k++) dot(cx - 12 + k * 8, cy - 30 + p * 40 + (k % 2) * 6, 5, '#b09058');
        break;
      case 'GALE':
        for (let k = 0; k < 10; k++) {
          const a = p * 8 + k * 0.6;
          dot(cx + Math.cos(a) * (6 + k * 1.6), cy + Math.sin(a) * (4 + k), 2, '#ffffff');
        }
        break;
      case 'MIND':
      case 'SPIRIT': {
        const r = 4 + p * 22;
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2;
          dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, 2, fx.type === 'MIND' ? '#f060a0' : k % 2 ? '#ffffff' : '#f0a0d0');
        }
        break;
      }
      case 'SHADE':
        c.globalAlpha = 0.3;
        rect(c, 0, 0, 160, 96, '#302048');
        c.globalAlpha = 1;
        for (let k = 0; k < 6; k++) dot(cx - 14 + k * 6, cy + Math.sin(t / 2 + k) * 8, 4, '#6858a0');
        break;
      default: {
        const s = 6 + (t % 6);
        rect(c, cx - s, cy - 1, s * 2, 3, '#ffffff');
        rect(c, cx - 1, cy - s, 3, s * 2, '#ffffff');
        dot(cx, cy, 5, col);
      }
    }
  }
}
