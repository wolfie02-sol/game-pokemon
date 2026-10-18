import { useEffect, useState } from 'react';
import type { Layout } from '../App';
import type { Game } from '../game';
import { DEFAULT_KEYMAP, keyLabel } from '../game/core/input';
import { exportSave, importSave, loadGame } from '../game/systems/save';
import { DEFAULT_OPTIONS, type ControlMode } from '../game/systems/state';

type Rebind = 'start' | 'select' | null;

/** Page-level settings: interface mode, START/SELECT keys, and save transfer. */
export function SettingsDialog({ game, layout, onClose }: { game: Game; layout: Layout; onClose: () => void }) {
  const [, force] = useState(0);
  const [listening, setListening] = useState<Rebind>(null);
  const [keyMsg, setKeyMsg] = useState('');
  const [code, setCode] = useState('');
  const [importText, setImportText] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [imported, setImported] = useState(false);
  const o = game.options;

  // capture the next key press for rebinding
  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') {
        setListening(null);
        setKeyMsg('');
        return;
      }
      const fixed = DEFAULT_KEYMAP[e.code];
      if (fixed && fixed !== 'start' && fixed !== 'select') {
        setKeyMsg(`${keyLabel(e.code)} is already used for ${fixed === 'a' || fixed === 'b' ? fixed.toUpperCase() : 'movement'}. Pick another key.`);
        return;
      }
      const other = listening === 'start' ? o.selectKeys : o.startKeys;
      if (other.includes(e.code)) {
        setKeyMsg(`${keyLabel(e.code)} is already ${listening === 'start' ? 'SELECT' : 'START'}. Pick another key.`);
        return;
      }
      game.setOptions(listening === 'start' ? { startKeys: [e.code] } : { selectKeys: [e.code] });
      setKeyMsg(`${listening.toUpperCase()} is now ${keyLabel(e.code)}.`);
      setListening(null);
      force((n) => n + 1);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [listening, game, o.startKeys, o.selectKeys]);

  const setMode = (m: ControlMode) => {
    game.setOptions({ controls: m });
    force((n) => n + 1);
  };

  const doExport = async () => {
    const st = loadGame();
    if (!st) {
      setSaveMsg('There is no saved game yet. Save from the START menu first.');
      setCode('');
      return;
    }
    const c = exportSave(st);
    setCode(c);
    try {
      await navigator.clipboard.writeText(c);
      setSaveMsg('Save code copied. Paste it into Import on your other device.');
    } catch {
      setSaveMsg('Select the code below and copy it.');
    }
  };

  const doImport = () => {
    const err = importSave(importText);
    if (err) {
      setSaveMsg(err);
      return;
    }
    setImported(true);
    setSaveMsg('Save imported. Restart the game to continue from it.');
  };

  const autoLabel = window.matchMedia('(hover: none) and (pointer: coarse)').matches ? 'touch' : 'keyboard';
  void layout;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={onClose}>
      <div className="modal-card settings" onClick={(e: { stopPropagation(): void }) => e.stopPropagation()}>
        <h2 id="settings-title">Controls &amp; saves</h2>

        <fieldset className="seg">
          <legend>Interface</legend>
          {(['auto', 'touch', 'keys'] as ControlMode[]).map((m) => (
            <label key={m} className={o.controls === m ? 'on' : ''}>
              <input id={`mode-${m}`} type="radio" name="mode" checked={o.controls === m} onChange={() => setMode(m)} />
              {m === 'auto' ? `Auto (${autoLabel})` : m === 'touch' ? 'Touch handheld' : 'Keyboard & mouse'}
            </label>
          ))}
        </fieldset>
        <p className="small">Touch shows the D-pad and A/B/START/SELECT buttons. Keyboard &amp; mouse gives a bigger screen and clickable menus.</p>

        <div className="binds">
          <h3>Keyboard</h3>
          <dl>
            <dt>Move</dt>
            <dd>Arrows / WASD</dd>
            <dt>A</dt>
            <dd>Z / Enter / Space</dd>
            <dt>B</dt>
            <dd>X / Esc / Backspace</dd>
            <dt>START</dt>
            <dd>
              {o.startKeys.map(keyLabel).join(' / ')}{' '}
              <button type="button" className="mini" onClick={() => setListening('start')}>
                {listening === 'start' ? 'Press a key…' : 'Change'}
              </button>
            </dd>
            <dt>SELECT</dt>
            <dd>
              {o.selectKeys.map(keyLabel).join(' / ')}{' '}
              <button type="button" className="mini" onClick={() => setListening('select')}>
                {listening === 'select' ? 'Press a key…' : 'Change'}
              </button>
            </dd>
          </dl>
          <p className="small" role="status">
            {keyMsg}{' '}
            <button
              type="button"
              className="mini"
              onClick={() => {
                game.setOptions({ startKeys: DEFAULT_OPTIONS.startKeys, selectKeys: DEFAULT_OPTIONS.selectKeys });
                setKeyMsg('Keys reset to defaults.');
                force((n) => n + 1);
              }}
            >
              Reset keys
            </button>
          </p>
        </div>

        <div className="saves">
          <h3>Move a save between devices</h3>
          <div className="row">
            <button type="button" className="pill-btn" onClick={doExport}>
              Copy save code
            </button>
          </div>
          {code && <textarea id="export-code" readOnly value={code} rows={3} onFocus={(e: { target: { select(): void } }) => e.target.select()} />}
          <label htmlFor="import-code" className="small">
            Paste a save code to import it (replaces this browser's save):
          </label>
          <textarea id="import-code" rows={3} value={importText} onChange={(e: { target: { value: string } }) => setImportText(e.target.value)} placeholder="WKE2:…" />
          <div className="row">
            <button type="button" className="pill-btn ghost" onClick={doImport} disabled={!importText.trim()}>
              Import save
            </button>
            {imported && (
              <button type="button" className="pill-btn" onClick={() => window.location.reload()}>
                Restart game
              </button>
            )}
          </div>
          {saveMsg && (
            <p className="small" role="status">
              {saveMsg}
            </p>
          )}
        </div>

        <button type="button" className="pill-btn close" onClick={onClose} autoFocus>
          Done
        </button>
      </div>
    </div>
  );
}
