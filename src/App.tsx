import { useCallback, useEffect, useRef, useState } from 'react';
import { DPad, PadButton } from './components/Controls';
import { Roster } from './components/Roster';
import { SettingsDialog } from './components/Settings';
import { RewardsDialog, WinDialog } from './components/Rewards';
import { earnedMilestones, Rewards, rewardsEnabled } from './rewards/client';
import { CrashScreen } from './components/CrashScreen';
import type { ErrorReport } from './game/core/diagnostics';
import { recordError } from './game/core/diagnostics';
import { createGame, type Game } from './game';
import { keyLabel } from './game/core/input';

declare global {
  interface Window {
    __wildkin?: Game;
  }
}

export type Layout = 'keys' | 'touch-portrait' | 'touch-landscape';

const coarseQuery = '(hover: none) and (pointer: coarse)';

function detectTouch(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(coarseQuery).matches;
}

function layoutFor(mode: 'auto' | 'touch' | 'keys'): Layout {
  const touch = mode === 'touch' || (mode === 'auto' && detectTouch());
  if (!touch) return 'keys';
  return window.innerWidth > window.innerHeight ? 'touch-landscape' : 'touch-portrait';
}

/**
 * Pick the largest scale that keeps every game pixel an exact number of device
 * pixels (integer on 1x screens, half steps on 2x, thirds on 3x), so the art
 * never blurs or shimmers.
 */
function fitScale(availW: number, availH: number): number {
  const dpr = Math.max(1, Math.round((window.devicePixelRatio || 1) * 4) / 4);
  const raw = Math.min(availW / 160, availH / 144);
  const s = Math.floor(raw * dpr) / dpr;
  return Math.max(1 / dpr, Math.min(s, 8));
}

/** Phones in portrait shorter than this hide the top bar so the screen can be drawn larger. */
export const COMPACT_PORTRAIT = 720;

function computeScale(layout: Layout): number {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (layout === 'keys') return fitScale(w - 64, h - 48 - 104);
  if (layout === 'touch-portrait') {
    const bar = h < COMPACT_PORTRAIT ? 0 : 48;
    const controls = Math.min(270, Math.max(200, h * 0.32));
    return fitScale(w - 40, h - bar - controls - 24);
  }
  // landscape: START and SELECT sit in the side columns, so the screen gets the full height
  const side = Math.min(200, Math.max(140, w * 0.22));
  return fitScale(w - side * 2 - 24, h - 16);
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [rev, setRev] = useState(0);
  const [layout, setLayout] = useState<Layout>(() => layoutFor('auto'));
  const [scale, setScale] = useState(() => computeScale(layoutFor('auto')));
  const [muted, setMuted] = useState(false);
  const [dialog, setDialog] = useState<null | 'how' | 'settings' | 'rewards' | 'win'>(null);
  const [rewards] = useState(() => new Rewards());
  const [wonCard, setWonCard] = useState('');
  const claimRef = useRef<(force?: boolean) => void>(() => {});
  const [crash, setCrash] = useState<ErrorReport | null>(null);

  // boot the shared engine once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let g: Game;
    try {
      g = createGame(canvas);
    } catch (e) {
      setCrash(recordError({ scenes: [], state: null }, e, 'boot'));
      return;
    }
    g.hooks.onChange = () => setRev((n) => n + 1);
    g.hooks.onCrash = (r) => setCrash(r);
    g.hooks.onMilestone = () => claimRef.current?.(true);
    window.__wildkin = g;
    setGame(g);
    // save at a safe moment when the tab is hidden, switched away from or closed
    const flush = () => {
      g.flushAutosave();
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    // iOS only lets audio start from a finished tap, and pauses it after app switches
    const unlockAudio = () => g.audio.unlock();
    document.addEventListener('touchend', unlockAudio, { passive: true });
    document.addEventListener('click', unlockAudio);
    const onVisAudio = () => {
      if (document.visibilityState === 'visible' && g.audio.started) g.audio.unlock();
    };
    document.addEventListener('visibilitychange', onVisAudio);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('visibilitychange', onVisAudio);
      document.removeEventListener('touchend', unlockAudio);
      document.removeEventListener('click', unlockAudio);
      window.removeEventListener('pagehide', flush);
      g.stop();
      delete window.__wildkin;
    };
  }, []);

  // Card rewards: send reached milestones to the server, which rolls each one once per wallet.
  const lastClaim = useRef({ key: '', at: 0 });
  claimRef.current = (force = false) => {
    if (!rewardsEnabled || !game || !rewards.connected) return;
    const ids = earnedMilestones(game.state);
    const key = ids.join(',');
    const prev = lastClaim.current;
    if (!ids.length || (!force && prev && key === prev.key && Date.now() - prev.at < 10 * 60_000)) return;
    lastClaim.current = { key, at: Date.now() };
    rewards
      .claim(ids)
      .then((results) => {
        const win = results.find((r) => r.won && r.status === 'rolled');
        if (win) {
          setWonCard(win.card ?? 'a real card');
          setDialog('win');
        }
      })
      .catch(() => {
        // offline or not eligible right now: the next milestone or check tries again
      });
  };
  useEffect(() => {
    claimRef.current?.();
  }, [game, rev]);
  useEffect(() => {
    const t = window.setInterval(() => claimRef.current?.(), 10 * 60_000);
    return () => window.clearInterval(t);
  }, []);

  const mode = game?.options.controls ?? 'auto';

  // recompute layout on resize, rotation, control-mode changes and input-type changes
  useEffect(() => {
    const update = () => {
      const l = layoutFor(mode);
      setLayout(l);
      setScale(computeScale(l));
    };
    update();
    const mq = window.matchMedia(coarseQuery);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    mq.addEventListener?.('change', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      mq.removeEventListener?.('change', update);
    };
  }, [mode, rev]);

  // the touch layout is a virtual handheld: stop rubber-band scrolling and double-tap zoom
  useEffect(() => {
    document.documentElement.classList.toggle('handheld', layout !== 'keys');
    return () => document.documentElement.classList.remove('handheld');
  }, [layout]);

  // only capture game keys while the screen is visible and no page dialog is open
  useEffect(() => {
    const el = screenRef.current;
    if (!el || !game) return;
    let visible = true;
    const apply = () => {
      game.input.enabled = visible && dialog === null;
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.intersectionRatio > 0.35;
        apply();
      },
      { threshold: [0, 0.35, 0.6, 1] },
    );
    io.observe(el);
    apply();
    return () => io.disconnect();
  }, [game, dialog]);

  // Escape closes page dialogs
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDialog(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog]);

  const toggleMute = useCallback(() => {
    if (!game) return;
    game.audio.unlock();
    game.audio.setMuted(!game.audio.muted);
    setMuted(game.audio.muted);
  }, [game]);

  const fullscreen = useCallback(() => {
    const el = document.documentElement;
    if (!document.fullscreenElement) void el.requestFullscreen?.().catch(() => {});
    else void document.exitFullscreen();
  }, []);

  const focusGame = () => {
    game?.audio.unlock();
    screenRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const size = 160 * scale;
  const touch = layout !== 'keys';
  const startKey = keyLabel(game?.options.startKeys[0] ?? 'KeyM');
  const selectKey = keyLabel(game?.options.selectKeys[0] ?? 'KeyN');

  return (
    <div className={`page layout-${layout}${layout === 'touch-portrait' && typeof window !== 'undefined' && window.innerHeight < COMPACT_PORTRAIT ? ' compact' : ''}`}>
      {crash && <CrashScreen report={crash} />}
      <header className="topbar">
        <a className="brand" href="#top" onClick={focusGame}>
          <span className="brand-mark" aria-hidden>
            ✦
          </span>
          WILDKIN <span className="brand-sub">Ember Edition</span>
        </a>
        <nav className="topnav" aria-label="Site">
          <button type="button" className="link hide-xs" onClick={() => setDialog('how')}>
            How to play
          </button>
          <a href="#wildex" className="hide-xs">
            Wildex
          </a>
          {rewardsEnabled && (
            <button type="button" className="link rw-nav" onClick={() => setDialog('rewards')}>
              Card rewards
            </button>
          )}
          <button type="button" className="icon" onClick={() => setDialog('settings')} aria-label="Controls and saves" title="Controls and saves">
            <svg viewBox="0 0 16 16" aria-hidden>
              <path
                d="M8 5.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM6.9 1h2.2l.4 1.9 1.3.6 1.7-1 1.5 1.5-1 1.7.6 1.3L15 6.9v2.2l-1.9.4-.6 1.3 1 1.7-1.5 1.5-1.7-1-1.3.6L9.1 15H6.9l-.4-1.9-1.3-.6-1.7 1-1.5-1.5 1-1.7-.6-1.3L1 9.1V6.9l1.9-.4.6-1.3-1-1.7L4 2l1.7 1 1.3-.6z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
          </button>
          <button type="button" className="icon" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Unmute sound' : 'Mute sound'} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? (
              <svg viewBox="0 0 16 16" aria-hidden>
                <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" />
                <path d="M11 5l4 6M15 5l-4 6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden>
                <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" />
                <path d="M11 5.5c1 1.4 1 3.6 0 5M13 4c2 2.4 2 5.6 0 8" stroke="currentColor" strokeWidth="1.4" fill="none" />
              </svg>
            )}
          </button>
          <button type="button" className="icon" onClick={fullscreen} aria-label="Fullscreen" title="Fullscreen">
            <svg viewBox="0 0 16 16" aria-hidden>
              <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.6" fill="none" />
            </svg>
          </button>
        </nav>
      </header>

      <main id="top" className="stage">
        <div className="console" onContextMenu={(e: { preventDefault(): void }) => touch && e.preventDefault()}>
          {touch && (
            <div className="side side-left">
              <DPad game={game} />
              {layout === 'touch-landscape' && (
                <div className="meta-buttons">
                  <PadButton game={game} btn="select" label="SELECT" className="pill" />
                </div>
              )}
            </div>
          )}
          <div className="center">
            <div className="screen" ref={screenRef}>
              <canvas ref={canvasRef} width={160} height={144} style={{ width: size, height: size * 0.9 }} aria-label="Wildkin game screen" />
            </div>
            {layout === 'touch-portrait' && (
              <div className="meta-buttons">
                <PadButton game={game} btn="select" label="SELECT" className="pill" />
                <PadButton game={game} btn="start" label="START" className="pill" />
              </div>
            )}
          </div>
          {touch && (
            <div className="side side-right">
              <div className="ab">
                <PadButton game={game} btn="b" label="B" className="round b" />
                <PadButton game={game} btn="a" label="A" className="round a" />
              </div>
              {layout === 'touch-landscape' && (
                <div className="meta-buttons">
                  <PadButton game={game} btn="start" label="START" className="pill" />
                </div>
              )}
            </div>
          )}
        </div>
        {!touch && (
          <div className="deskbar">
            <p className="hint">
              <kbd>Arrows</kbd>/<kbd>WASD</kbd> move · <kbd>Z</kbd>/<kbd>Enter</kbd> A · <kbd>X</kbd>/<kbd>Esc</kbd> B · <kbd>{startKey}</kbd> start ·{' '}
              <kbd>{selectKey}</kbd> select · hold B to run · click menus, right-click to go back, wheel scrolls lists
            </p>
            <div className="deskbuttons">
              <PadButton game={game} btn="start" label={`Menu (${startKey})`} className="chip" />
              <button type="button" className="chip" onClick={() => setDialog('settings')}>
                <span>Controls &amp; saves</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <section className="info" aria-labelledby="intro-title">
        <h1 id="intro-title">Wildkin: Ember Edition, a handheld-style monster-catching RPG in your browser</h1>
        <p>
          Wildkin is a free, original fan tribute to the classic pocket monster-catching adventures. It runs in any browser on a computer,
          tablet or phone with no download. Explore the region of Varrow across eleven towns and twenty-five routes, catch 151 original creatures, earn
          eight gym badges, stop the Hollow Order and climb to the Summit League. Every sprite, tile and chiptune is generated in code.
        </p>
        <nav className="linkrow" aria-label="Guide">
          <button type="button" className="link" onClick={() => setDialog('how')}>
            How to play
          </button>
          <span>·</span>
          <a href="#wildex">Wildex</a>
          <span>·</span>
          <a href="#about">About &amp; FAQ</a>
          <span>·</span>
          <button type="button" className="link" onClick={() => setDialog('settings')}>
            Controls &amp; saves
          </button>
          <span>·</span>
          <a href="#top" onClick={focusGame}>
            Back to the game
          </a>
        </nav>
      </section>

      <section id="wildex" className="info">
        <h2>Wildex: field guide</h2>
        <p>All 151 Wildkin of Varrow. Some only appear in caves, at sea, at the end of a fishing line or after a special shard. A few are legends.</p>
        <Roster />
      </section>

      <section id="about" className="info faq">
        <h2>About &amp; FAQ</h2>
        <details>
          <summary>Does my progress save?</summary>
          <p>
            Yes. The game autosaves when you reach a new area, after story events and every couple of minutes (a small SAVED sign appears), and you can
            also choose SAVE in the START menu. Your game is stored in this browser, and CONTINUE appears on the title screen. To move a save
            to another browser or device, open Controls &amp; saves and copy the save code.
          </p>
        </details>
        <details>
          <summary>Can I play on my phone and my computer?</summary>
          <p>
            Yes. Phones and tablets get a virtual handheld with a D-pad and A/B/START/SELECT buttons. Computers get a large screen with keyboard
            controls and clickable menus. Switch any time in Controls &amp; saves or in the in-game OPTIONS.
          </p>
        </details>
        <details>
          <summary>How do I catch Wildkin?</summary>
          <p>Walk through tall grass or caves to meet wild Wildkin. Weaken them, then choose BAG and throw a Capture Pod. Sleep, paralysis and low HP make catching easier.</p>
        </details>
        <details>
          <summary>How do I cross water, trim hedges or fly?</summary>
          <p>
            Key items do the job. The Hedge Shears trim hedges, the Driftboard lets you ride across water (face it and press A), the Rock Pick breaks
            cracked boulders, the Fishing Rod hooks Wildkin from any water, and the Sky Whistle flies you to towns you have visited. Use the rod and
            whistle from the Bag.
          </p>
        </details>
        <details>
          <summary>How do types work?</summary>
          <p>There are 15 types. Flame beats Leaf, Frost and Swarm. Tide beats Flame, Earth and Stone. Volt beats Tide and Gale but cannot touch Earth. Brawl smashes Beast, Stone and Frost. Swarm and Shade are the only answers to Mind, and only Wyrm or Frost truly hurt a Wyrm. Gym guides drop hints.</p>
        </details>
        <p className="disclaimer">Wildkin: Ember Edition is a free, non-commercial fan project with entirely original characters, creatures, art, music and story.</p>
      </section>

      {dialog === 'how' && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="how-title" onClick={() => setDialog(null)}>
          <div className="modal-card" onClick={(e: { stopPropagation(): void }) => e.stopPropagation()}>
            <h2 id="how-title">How to play</h2>
            <ul>
              <li>
                <b>Move</b> with the arrow keys, WASD or the D-pad. Hold <b>B</b> to run.
              </li>
              <li>
                <b>A</b> (Z / Enter) talks, reads signs, picks up items and confirms.
              </li>
              <li>
                <b>B</b> (X / Esc) cancels and goes back.
              </li>
              <li>
                <b>START</b> ({startKey}) opens the menu: Wildex, Party, Bag, Journal, Save and Options.
              </li>
              <li>On a computer you can also click menu items, right-click to go back and use the mouse wheel to scroll lists.</li>
              <li>Heal for free at any HAVEN (red roof, H sign). Buy pods and potions at the MARKET.</li>
              <li>Stuck? Your JOURNAL always shows the current goal.</li>
            </ul>
            <button type="button" className="pill-btn" onClick={() => setDialog(null)} autoFocus>
              Got it
            </button>
          </div>
        </div>
      )}
      {dialog === 'settings' && game && <SettingsDialog game={game} layout={layout} onClose={() => setDialog(null)} />}
      {dialog === 'rewards' && game && <RewardsDialog game={game} rewards={rewards} onClose={() => setDialog(null)} onClaimed={() => claimRef.current?.(true)} />}
      {dialog === 'win' && <WinDialog card={wonCard} onClose={() => setDialog(null)} />}
    </div>
  );
}
