import type { Game } from './game';

export abstract class Scene {
  /** Opaque scenes hide everything beneath them, so lower scenes are not drawn. */
  opaque = false;
  /** Mouse wheel scrolls this scene's list (taps up/down). */
  wheelScroll = false;
  g!: Game;
  enter?(): void;
  abstract update(): void;
  abstract draw(c: CanvasRenderingContext2D): void;
}

/** A scene that resolves a promise when it closes. */
export abstract class Modal<T> extends Scene {
  private resolver: ((v: T) => void) | null = null;
  closed = false;

  bind(res: (v: T) => void) {
    this.resolver = res;
  }

  finish(v: T) {
    if (this.closed) return;
    this.closed = true;
    this.g.remove(this);
    this.g.input.consume();
    const r = this.resolver;
    this.resolver = null;
    r?.(v);
  }
}
