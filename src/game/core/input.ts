export type Btn = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select';
export type Dir = 'up' | 'down' | 'left' | 'right';

export const DIRS: Dir[] = ['up', 'down', 'left', 'right'];

export const DEFAULT_KEYMAP: Record<string, Btn> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  KeyZ: 'a',
  Enter: 'a',
  NumpadEnter: 'a',
  Space: 'a',
  KeyX: 'b',
  Escape: 'b',
  Backspace: 'b',
  KeyM: 'start',
  ShiftLeft: 'start',
  ShiftRight: 'start',
  KeyN: 'select',
};

/** Keys the player may rebind (START / SELECT). Movement, A and B stay fixed. */
export type Bindings = { start: string[]; select: string[] };
export const DEFAULT_BINDINGS: Bindings = { start: ['KeyM', 'ShiftLeft', 'ShiftRight'], select: ['KeyN'] };

/** Human-readable name for a KeyboardEvent.code. */
export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const map: Record<string, string> = {
    ShiftLeft: 'Shift',
    ShiftRight: 'R-Shift',
    ControlLeft: 'Ctrl',
    Space: 'Space',
    Enter: 'Enter',
    Backspace: 'Backspace',
    Tab: 'Tab',
    Quote: "'",
    Semicolon: ';',
    Comma: ',',
    Period: '.',
    Slash: '/',
    BracketLeft: '[',
    BracketRight: ']',
  };
  return map[code] ?? code;
}

/**
 * Collects keyboard and on-screen button state and exposes per-frame
 * edge-detected presses. Presses shorter than a frame are queued so quick
 * taps are never lost.
 */
export class Input {
  private keys = new Set<Btn>();
  private virt = new Set<Btn>();
  private queued = new Set<Btn>();
  private prev = new Set<Btn>();
  private cur = new Set<Btn>();
  private held: Record<string, number> = {};
  private dirOrder: Dir[] = [];
  private keymap: Record<string, Btn> = { ...DEFAULT_KEYMAP };
  /** When false, keyboard events are ignored (e.g. game scrolled out of view). */
  enabled = true;
  /** Called on the first user gesture, used to unlock audio. */
  onGesture: (() => void) | null = null;

  attach(target: Window): () => void {
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const b = this.keymap[e.code];
      if (!b || !this.enabled) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      this.onGesture?.();
      this.press(b, this.keys);
    };
    const up = (e: KeyboardEvent) => {
      const b = this.keymap[e.code];
      if (!b) return;
      this.release(b, this.keys);
    };
    const blur = () => {
      this.keys.clear();
      this.virt.clear();
      this.dirOrder = [];
    };
    target.addEventListener('keydown', down);
    target.addEventListener('keyup', up);
    target.addEventListener('blur', blur);
    return () => {
      target.removeEventListener('keydown', down);
      target.removeEventListener('keyup', up);
      target.removeEventListener('blur', blur);
    };
  }

  private press(b: Btn, set: Set<Btn>) {
    if (!set.has(b)) {
      set.add(b);
      this.queued.add(b);
      if (isDir(b)) {
        this.dirOrder = this.dirOrder.filter((d) => d !== b);
        this.dirOrder.push(b);
      }
    }
  }

  private release(b: Btn, set: Set<Btn>) {
    set.delete(b);
    if (isDir(b) && !this.keys.has(b) && !this.virt.has(b)) {
      this.dirOrder = this.dirOrder.filter((d) => d !== b);
    }
  }

  /** Rebind START / SELECT. Codes already used by movement, A or B are ignored. */
  setBindings(b: Bindings) {
    const map: Record<string, Btn> = {};
    for (const [code, btn] of Object.entries(DEFAULT_KEYMAP)) if (btn !== 'start' && btn !== 'select') map[code] = btn;
    for (const code of b.start) if (!map[code]) map[code] = 'start';
    for (const code of b.select) if (!map[code]) map[code] = 'select';
    this.keymap = map;
  }

  /** One-frame press, used by mouse clicks and the wheel. */
  tap(b: Btn) {
    this.queued.add(b);
  }

  /** On-screen buttons call this. */
  setVirtual(b: Btn, down: boolean) {
    if (down) {
      this.onGesture?.();
      this.press(b, this.virt);
    } else this.release(b, this.virt);
  }

  /** Call once per fixed update step. */
  update() {
    this.prev = this.cur;
    this.cur = new Set<Btn>([...this.keys, ...this.virt, ...this.queued]);
    this.queued.clear();
    for (const b of ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select'] as Btn[]) {
      if (this.cur.has(b)) this.held[b] = (this.held[b] ?? 0) + 1;
      else this.held[b] = 0;
    }
  }

  down(b: Btn): boolean {
    return this.cur.has(b);
  }

  pressed(b: Btn): boolean {
    return this.cur.has(b) && !this.prev.has(b);
  }

  /** Pressed, or held long enough to auto-repeat (for menus). */
  repeat(b: Btn): boolean {
    const h = this.held[b] ?? 0;
    if (h === 1) return true;
    return h > 18 && (h - 18) % 5 === 0;
  }

  heldFrames(b: Btn): number {
    return this.held[b] ?? 0;
  }

  /** Most recently pressed direction that is still held. */
  dir(): Dir | null {
    for (let i = this.dirOrder.length - 1; i >= 0; i--) {
      const d = this.dirOrder[i];
      if (this.cur.has(d)) return d;
    }
    for (const d of DIRS) if (this.cur.has(d)) return d;
    return null;
  }

  /** Drop all presses so a closing menu doesn't leak input into the next scene. */
  consume() {
    this.prev = new Set(this.cur);
    for (const k of Object.keys(this.held)) if (this.held[k] > 0) this.held[k] = 99;
  }
}

export function isDir(b: Btn): b is Dir {
  return b === 'up' || b === 'down' || b === 'left' || b === 'right';
}

export const DX: Record<Dir, number> = { up: 0, down: 0, left: -1, right: 1 };
export const DY: Record<Dir, number> = { up: -1, down: 1, left: 0, right: 0 };
export const OPP: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };
