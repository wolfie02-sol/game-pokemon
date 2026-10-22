import { Audio } from './audio';
import { H, UI, W } from './gfx';
import { Input, type Btn } from './input';
import { Rng } from './rng';
import type { Modal, Scene } from './scene';
import type { GameState, Options } from '../systems/state';
import { loadOptions, saveOptions } from '../systems/save';
import { Autosave } from '../systems/autosave';
import { recordError, type ErrorReport } from './diagnostics';
import { drawText } from './font';
import { box } from './gfx';

/** A clickable / hoverable rectangle in game-pixel coordinates, registered each frame. */
export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
  hover?: () => void;
  click?: () => void;
}

type PointerEv = { kind: 'move' | 'down' | 'back' | 'wheel'; x: number; y: number; dy?: number };

import type { CardHooks } from '../systems/cardbosses';

export interface GameHooks {
  /** Called whenever something the surrounding UI shows may have changed. */
  onChange?: () => void;
  /** The game stopped on an error it could not recover from. */
  onCrash?: (r: ErrorReport) => void;
  /** Card rewards: set by the page when the rewards server is configured. */
  cards?: CardHooks;
}

/**
 * Owns the canvas, the fixed-timestep loop, the scene stack and the
 * persistent game state. Scenes never touch React; React only talks to Game.
 */
export class Game {
  readonly ctx: CanvasRenderingContext2D;
  readonly input = new Input();
  readonly audio = new Audio();
  rng = new Rng((Date.now() ^ 0x5eed) | 0);
  state: GameState | null = null;
  options: Options;
  scenes: Scene[] = [];
  frame = 0;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private detach: (() => void) | null = null;
  hooks: GameHooks = {};
  readonly autosave = new Autosave();
  /** Set by the game setup: try to get back to a playable state after an error. Returns false if it can't. */
  recover: ((err: unknown) => boolean) | null = null;
  crashed = false;
  private errorFrames: number[] = [];
  /** test hook: throw inside the next update ('once') or every update ('always') */
  testThrow: 'once' | 'always' | null = null;
  /** Regions registered by the top scene during the last render. */
  private regions: Region[] = [];
  private nextRegions: Region[] = [];
  private hovered: Region | null = null;
  private pointerQueue: PointerEv[] = [];
  private lastPointer: { x: number; y: number } | null = null;

  constructor(readonly canvas: HTMLCanvasElement) {
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D not supported');
    this.ctx = ctx;
    ctx.imageSmoothingEnabled = false;
    this.options = loadOptions();
    this.audio.musicOn = this.options.music;
    this.audio.sfxOn = this.options.sfx;
    this.input.setBindings({ start: this.options.startKeys, select: this.options.selectKeys });
    this.input.onGesture = () => this.audio.unlock();
    this.audio.onChange = () => this.hooks.onChange?.();
  }

  /** Scenes call this from draw() to make part of the screen clickable. Only the top scene counts. */
  region(scene: Scene, r: Region) {
    if (scene === this.top()) this.nextRegions.push(r);
  }

  /**
   * A menu row: hovering selects it (via `select`, which returns true if the
   * selection changed) and clicking presses `tap` (A by default).
   */
  pick(scene: Scene, x: number, y: number, w: number, h: number, select: () => boolean, tap: Btn = 'a') {
    this.region(scene, {
      x,
      y,
      w,
      h,
      hover: () => {
        if (select()) this.sfx('select');
      },
      click: () => this.input.tap(tap),
    });
  }

  /** Clickable area that just presses a button. */
  button(scene: Scene, x: number, y: number, w: number, h: number, tap: Btn) {
    this.region(scene, { x, y, w, h, click: () => this.input.tap(tap) });
  }

  private toGame(e: { clientX: number; clientY: number }) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }

  private attachPointer(): () => void {
    const c = this.canvas;
    const move = (e: PointerEvent) => this.pointerQueue.push({ kind: 'move', ...this.toGame(e) });
    const down = (e: PointerEvent) => {
      this.audio.unlock();
      const p = this.toGame(e);
      if (e.button === 2) this.pointerQueue.push({ kind: 'back', ...p });
      else if (e.button === 0) this.pointerQueue.push({ kind: 'down', ...p });
    };
    const ctx = (e: MouseEvent) => e.preventDefault();
    const wheel = (e: WheelEvent) => {
      const top = this.top();
      if (!top?.wheelScroll) return;
      e.preventDefault();
      this.pointerQueue.push({ kind: 'wheel', ...this.toGame(e), dy: e.deltaY });
    };
    const leave = () => {
      this.hovered = null;
      this.lastPointer = null;
      c.style.cursor = '';
    };
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerdown', down);
    c.addEventListener('contextmenu', ctx);
    c.addEventListener('wheel', wheel, { passive: false });
    c.addEventListener('pointerleave', leave);
    return () => {
      c.removeEventListener('pointermove', move);
      c.removeEventListener('pointerdown', down);
      c.removeEventListener('contextmenu', ctx);
      c.removeEventListener('wheel', wheel);
      c.removeEventListener('pointerleave', leave);
    };
  }

  private hit(x: number, y: number): Region | null {
    for (let i = this.regions.length - 1; i >= 0; i--) {
      const r = this.regions[i];
      if (x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h) return r;
    }
    return null;
  }

  /** Apply queued pointer events before input is sampled, so clicks act like button taps. */
  private processPointer() {
    // hover only reacts to real pointer movement, so a resting mouse never fights the keyboard
    const q = this.pointerQueue;
    this.pointerQueue = [];
    for (const ev of q) {
      if (ev.kind === 'back') {
        this.input.tap('b');
        continue;
      }
      if (ev.kind === 'wheel') {
        this.input.tap((ev.dy ?? 0) > 0 ? 'down' : 'up');
        continue;
      }
      this.lastPointer = { x: ev.x, y: ev.y };
      const r = this.hit(ev.x, ev.y);
      if (ev.kind === 'move') {
        if (r !== this.hovered) {
          this.hovered = r;
          r?.hover?.();
        }
      } else if (r) {
        r.hover?.();
        r.click?.();
      }
    }
    const want = this.hovered?.click ? 'pointer' : '';
    if (this.canvas.style.cursor !== want) this.canvas.style.cursor = want;
  }

  push(s: Scene) {
    s.g = this;
    this.scenes.push(s);
    s.enter?.();
  }

  remove(s: Scene) {
    const i = this.scenes.indexOf(s);
    if (i >= 0) this.scenes.splice(i, 1);
  }

  /** Replace the whole stack. */
  reset(s: Scene) {
    this.scenes = [];
    this.push(s);
  }

  open<T>(m: Modal<T>): Promise<T> {
    return new Promise<T>((res) => {
      m.bind(res);
      this.push(m);
    });
  }

  top(): Scene | undefined {
    return this.scenes[this.scenes.length - 1];
  }

  setOptions(o: Partial<Options>) {
    this.options = { ...this.options, ...o };
    saveOptions(this.options);
    this.input.setBindings({ start: this.options.startKeys, select: this.options.selectKeys });
    this.audio.setMusic(this.options.music);
    this.audio.setSfx(this.options.sfx);
    this.hooks.onChange?.();
  }

  sfx(name: string) {
    this.audio.sfx(name);
  }

  music(name: string) {
    this.audio.play(name);
  }

  start() {
    const detachKeys = this.input.attach(window);
    const detachPointer = this.attachPointer();
    this.detach = () => {
      detachKeys();
      detachPointer();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      e.preventDefault();
      this.reportError(e.reason, 'async');
    };
    window.addEventListener('unhandledrejection', onRejection);
    const prevDetach = this.detach;
    this.detach = () => {
      prevDetach?.();
      window.removeEventListener('unhandledrejection', onRejection);
    };
    this.last = performance.now();
    const loop = (t: number) => {
      if (this.crashed) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(100, t - this.last);
      this.last = t;
      this.acc += dt;
      const stepMs = 1000 / 60;
      let steps = 0;
      while (this.acc >= stepMs && steps < 4 && !this.crashed) {
        try {
          this.step();
        } catch (e) {
          this.reportError(e, 'update');
        }
        this.acc -= stepMs;
        steps++;
      }
      if (steps === 4) this.acc = 0;
      if (this.crashed) return;
      try {
        this.render();
      } catch (e) {
        this.reportError(e, 'draw');
      }
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.detach?.();
    this.audio.stop();
  }

  /**
   * Every error ends up here. The first couple are recovered from where
   * possible (the event or battle is dropped and the player is put back in the
   * overworld); repeated errors, or errors outside the overworld, stop the game
   * and show the crash screen.
   */
  reportError(err: unknown, where: string) {
    if (this.crashed) return;
    const report = recordError(this, err, where);
    this.errorFrames = this.errorFrames.filter((f) => this.frame - f < 600);
    this.errorFrames.push(this.frame);
    if (this.errorFrames.length <= 2 && this.recover) {
      let ok = false;
      try {
        ok = this.recover(err);
      } catch (e2) {
        recordError(this, e2, 'recover');
      }
      if (ok) return;
    }
    this.crash(report);
  }

  private crash(report: ErrorReport) {
    this.crashed = true;
    cancelAnimationFrame(this.raf);
    try {
      this.audio.stop();
    } catch {
      /* ignore */
    }
    this.hooks.onCrash?.(report);
  }

  /** The page is being hidden or closed: save if it is a safe moment. */
  flushAutosave(): boolean {
    if (this.crashed) return false;
    return this.autosave.flush(this.state, this.options.autosave, this.frame);
  }

  /** Advance the simulation by exactly one frame (also used by tests). */
  step() {
    this.processPointer();
    this.input.update();
    this.frame++;
    if (this.state) this.state.playTime += 1 / 60;
    const top = this.top();
    this.autosave.safeNow = false;
    if (this.testThrow) {
      const t = this.testThrow;
      if (t === 'once') this.testThrow = null;
      throw new Error('Test error (' + t + ')');
    }
    top?.update();
    this.autosave.tick(this.state, this.options.autosave, this.frame);
  }

  render() {
    const ctx = this.ctx;
    let i = this.scenes.length - 1;
    while (i > 0 && !this.scenes[i].opaque) i--;
    ctx.fillStyle = UI.bg;
    ctx.fillRect(0, 0, W, H);
    this.nextRegions = [];
    for (let j = Math.max(0, i); j < this.scenes.length; j++) this.scenes[j].draw(ctx);
    this.drawSaveNotice(ctx);
    this.regions = this.nextRegions;
    if (this.hovered && !this.regions.includes(this.hovered)) {
      // keep hover identity stable across frames (regions are rebuilt every draw)
      const h = this.hovered;
      this.hovered = this.regions.find((r) => r.x === h.x && r.y === h.y && r.w === h.w && r.h === h.h) ?? null;
    }
  }

  /** Small corner badge after an autosave (or a failed one). */
  private drawSaveNotice(ctx: CanvasRenderingContext2D) {
    const n = this.autosave.notice;
    if (!n) return;
    const age = this.frame - n.frame;
    const life = n.kind === 'failed' ? 240 : 90;
    if (age > life) {
      this.autosave.notice = null;
      return;
    }
    const text = n.kind === 'failed' ? 'SAVE FAILED' : 'SAVED';
    const w = text.length * 6 + 12;
    box(ctx, W - w - 2, 2, w, 14);
    drawText(ctx, text, W - w + 4, 6, n.kind === 'failed' ? '#d04838' : UI.ink);
  }

  /** Characters revealed per frame for the current text speed. */
  textRate(): number {
    return [0.5, 1, 3][this.options.textSpeed];
  }
}
