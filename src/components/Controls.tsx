import { useEffect, useRef } from 'react';
import type { Btn, Game } from '../game';

type Dir = 'up' | 'down' | 'left' | 'right';

/** Short haptic tick on phones that support it. */
function buzz() {
  try {
    navigator.vibrate?.(8);
  } catch {
    /* unsupported */
  }
}

/** On-screen D-pad with slide support: the pressed direction follows the finger. */
export function DPad({ game }: { game: Game | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useRef<Dir | null>(null);
  const pointer = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !game) return;
    const set = (d: Dir | null) => {
      if (active.current === d) return;
      if (active.current) game.input.setVirtual(active.current, false);
      active.current = d;
      if (d) {
        game.input.setVirtual(d, true);
        buzz();
      }
      el.dataset.dir = d ?? '';
    };
    const dirFrom = (e: PointerEvent): Dir | null => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < r.width * 0.1) return active.current;
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    };
    const down = (e: PointerEvent) => {
      e.preventDefault();
      pointer.current = e.pointerId;
      el.setPointerCapture(e.pointerId);
      set(dirFrom(e));
    };
    const move = (e: PointerEvent) => {
      if (pointer.current !== e.pointerId) return;
      set(dirFrom(e));
    };
    const up = (e: PointerEvent) => {
      if (pointer.current !== e.pointerId) return;
      pointer.current = null;
      set(null);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('lostpointercapture', up);
      set(null);
    };
  }, [game]);

  return (
    <div className="dpad" ref={ref} role="group" aria-label="Directional pad">
      <span className="dpad-arm dpad-up" aria-hidden />
      <span className="dpad-arm dpad-down" aria-hidden />
      <span className="dpad-arm dpad-left" aria-hidden />
      <span className="dpad-arm dpad-right" aria-hidden />
      <span className="dpad-center" aria-hidden />
    </div>
  );
}

/** A single hardware-style button wired to a virtual input. */
export function PadButton({ game, btn, label, className }: { game: Game | null; btn: Btn; label: string; className: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !game) return;
    let id: number | null = null;
    const down = (e: PointerEvent) => {
      e.preventDefault();
      id = e.pointerId;
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-down');
      game.input.setVirtual(btn, true);
      if (e.pointerType !== 'mouse') buzz();
    };
    const up = (e: PointerEvent) => {
      if (id !== e.pointerId) return;
      id = null;
      el.classList.remove('is-down');
      game.input.setVirtual(btn, false);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('lostpointercapture', up);
      game.input.setVirtual(btn, false);
    };
  }, [game, btn]);
  return (
    <button ref={ref} type="button" className={className} aria-label={`${label} button`} tabIndex={-1}>
      <span>{label}</span>
    </button>
  );
}
