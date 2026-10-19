/**
 * Small, local error log for bug reports. It keeps the last few errors in this
 * browser only. It records where the game was (map, position, open screens)
 * and the technical message, but never the player's or rival's names, the
 * save itself, or anything typed into the page.
 */
export const GAME_VERSION = 'ember-1.2';
const KEY = 'wildkin-error-log';
const MAX = 10;

export interface ErrorReport {
  code: string;
  time: string;
  where: string;
  message: string;
  stack: string[];
  scenes: string[];
  map: string | null;
  pos: [number, number] | null;
  version: string;
  browser: string;
}

interface GameLike {
  scenes: { constructor: { name: string } }[];
  state: { map: string; x: number; y: number; name?: string; rival?: string } | null;
}

function shortHash(t: string): string {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (Math.imul(h, 31) + t.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(-6);
}

function scrub(text: string, g: GameLike): string {
  let t = text;
  // file URLs reduce to file name and line; player-chosen names are removed
  t = t.replace(/(https?:\/\/[^\s)]+\/)([^\s/)]*)/g, '$2');
  for (const n of [g.state?.name, g.state?.rival]) if (n && n.length >= 2) t = t.split(n).join('[name]');
  return t;
}

export function makeReport(g: GameLike, err: unknown, where: string): ErrorReport {
  const e = err instanceof Error ? err : new Error(typeof err === 'string' ? err : JSON.stringify(err ?? 'unknown error'));
  const message = scrub(String(e.message).slice(0, 300), g);
  const stack = scrub(String(e.stack ?? ''), g)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8);
  const s = g.state;
  return {
    code: 'WK-' + shortHash(message + (stack[1] ?? '')),
    time: new Date().toISOString(),
    where,
    message,
    stack,
    scenes: g.scenes.map((x) => x.constructor.name),
    map: s?.map ?? null,
    pos: s ? [s.x, s.y] : null,
    version: GAME_VERSION,
    browser: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 160) : '',
  };
}

export function recordError(g: GameLike, err: unknown, where: string): ErrorReport {
  const r = makeReport(g, err, where);
  try {
    const log = errorLog();
    log.push(r);
    localStorage.setItem(KEY, JSON.stringify(log.slice(-MAX)));
  } catch {
    /* storage unavailable: the report still reaches the crash screen */
  }
  try {
    console.error('[wildkin]', r.code, where, err);
  } catch {
    /* ignore */
  }
  return r;
}

export function errorLog(): ErrorReport[] {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(v) ? (v as ErrorReport[]) : [];
  } catch {
    return [];
  }
}
