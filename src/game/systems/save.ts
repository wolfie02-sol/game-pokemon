import { DEFAULT_OPTIONS, type GameState, type Options } from './state';
import { expFor } from './mon';

const SAVE_KEY = 'wildkin-ember-save-v2';
const OPT_KEY = 'wildkin-ember-options-v1';

function storage(): Storage | null {
  try {
    const s = window.localStorage;
    const k = '__wk_test';
    s.setItem(k, '1');
    s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}

export function storageAvailable(): boolean {
  return storage() !== null;
}

export function saveGame(state: GameState): boolean {
  const s = storage();
  if (!s) return false;
  try {
    state.savedAt = Date.now();
    s.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): GameState | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(SAVE_KEY);
    if (!raw) return null;
    const st = JSON.parse(raw) as GameState;
    if (st.version !== 2 || !Array.isArray(st.party) || typeof st.map !== 'string') return null;
    st.flags ??= {};
    st.bag ??= {};
    st.box ??= [];
    st.seen ??= [];
    st.caught ??= [];
    st.badges ??= [];
    // the level curve got steeper: keep every Wildkin's level and start it at the bottom of its level's bar
    for (const m of [...st.party, ...st.box]) if (m && m.exp < expFor(m.lvl)) m.exp = expFor(m.lvl);
    return st;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return loadGame() !== null;
}

export function deleteSave() {
  storage()?.removeItem(SAVE_KEY);
}

export function loadOptions(): Options {
  const s = storage();
  try {
    const raw = s?.getItem(OPT_KEY);
    if (raw) return { ...DEFAULT_OPTIONS, ...(JSON.parse(raw) as Partial<Options>) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_OPTIONS };
}

export function saveOptions(o: Options) {
  try {
    storage()?.setItem(OPT_KEY, JSON.stringify(o));
  } catch {
    /* ignore */
  }
}

/** Save as a portable text code (for moving progress between browsers/devices). */
export function exportSave(state: GameState): string {
  const json = JSON.stringify({ ...state, savedAt: Date.now() });
  return 'WKE2:' + btoa(unescape(encodeURIComponent(json)));
}

/** Validate and store a save code. Returns an error message, or null on success. */
export function importSave(code: string): string | null {
  const t = code.trim();
  if (!t.startsWith('WKE2:')) return 'That is not a Wildkin save code (it should start with WKE2:).';
  let st: GameState;
  try {
    st = JSON.parse(decodeURIComponent(escape(atob(t.slice(5))))) as GameState;
  } catch {
    return 'The save code is damaged or incomplete. Copy the whole code and try again.';
  }
  if (st.version !== 2 || !Array.isArray(st.party) || typeof st.map !== 'string' || typeof st.name !== 'string') {
    return 'The save code is from an incompatible version.';
  }
  return saveGame(st) ? null : 'This browser is blocking storage, so the save could not be written.';
}
