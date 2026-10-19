import { useMemo, useState } from 'react';
import type { ErrorReport } from '../game/core/diagnostics';
import { loadGame } from '../game/systems/save';
import { allMaps } from '../game/world/maps';

function ago(ms: number): string {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hour${h === 1 ? '' : 's'} ago`;
  return `${Math.round(h / 24)} days ago`;
}

/**
 * Shown when the game stops on an error it can't recover from. It only ever
 * offers to reload the last real save; it never claims to have kept progress
 * that wasn't saved.
 */
export function CrashScreen({ report }: { report: ErrorReport }) {
  const [copied, setCopied] = useState<null | 'ok' | 'manual'>(null);
  const save = useMemo(() => {
    try {
      const st = loadGame();
      if (!st) return null;
      let place = st.map;
      try {
        place = allMaps()[st.map]?.name ?? st.map;
      } catch {
        /* map data unavailable */
      }
      return { place, when: st.savedAt ? ago(st.savedAt) : null, badges: st.badges.length };
    } catch {
      return null;
    }
  }, []);
  const text = JSON.stringify(report, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied('ok');
    } catch {
      setCopied('manual');
    }
  };

  return (
    <div className="crash" role="alertdialog" aria-labelledby="crash-title" aria-describedby="crash-body">
      <div className="crash-card">
        <h2 id="crash-title">WILDKIN HIT A SNAG</h2>
        <div id="crash-body">
          <p>The game stopped because of an unexpected error.</p>
          {save ? (
            <p>
              Your last save is safe: <b>{save.place}</b>
              {save.when ? `, ${save.when}` : ''}, {save.badges} badge{save.badges === 1 ? '' : 's'}. Anything you did after that save was not saved.
            </p>
          ) : (
            <p>There is no saved game on this device yet, so reloading starts from the title screen.</p>
          )}
        </div>
        <div className="crash-actions">
          <button type="button" className="crash-btn primary" onClick={() => window.location.reload()} autoFocus>
            {save ? 'RELOAD LAST SAVE' : 'RELOAD'}
          </button>
          <button type="button" className="crash-btn" onClick={() => void copy()}>
            {copied === 'ok' ? 'COPIED!' : 'COPY ERROR REPORT'}
          </button>
        </div>
        {copied === 'manual' && <textarea className="crash-report" readOnly value={text} rows={6} onFocus={(e: { target: { select(): void } }) => e.target.select()} />}
        <p className="crash-code">
          Error {report.code} · The report holds the error message and where you were in the game, not your names or save.
        </p>
      </div>
    </div>
  );
}
