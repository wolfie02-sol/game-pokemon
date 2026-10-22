// Talks to the card-rewards server and the player's Solana wallet (Phantom,
// Solflare, Backpack or any wallet that injects `window.solana`).
//
// The feature is off unless the game is built with VITE_REWARDS_API set to the
// server's address, e.g. VITE_REWARDS_API=https://rewards.example.com npm run build

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
export const REWARDS_API = (env.VITE_REWARDS_API ?? '').replace(/\/$/, '');
export const rewardsEnabled = REWARDS_API !== '';

export interface Boss { id: string; label: string; odds: number }
export interface RewardsConfig {
  cluster: string;
  gate: { mint: string; min: number } | null;
  battlesPerDay: number;
  odds: { perLevel: number; cap: number };
  bosses: Boss[];
}
export interface Win { id: number; boss: string; card: string | null; status: 'pending' | 'sent' | 'rejected' | 'failed'; tx: string | null }
export interface Me {
  wallet: string;
  eligible: boolean;
  balance: number | null;
  need: number;
  used: number;
  left: number;
  limit: number;
  resetsInSec: number;
  wins: Win[];
}
export interface Preview { odds: number; left: number; limit: number; eligible: boolean; need: number; resetsInSec: number }

/** Same formula as the server: the boss's base chance plus a bonus per level, capped. */
export function oddsFor(cfg: RewardsConfig, boss: Boss, level: number): number {
  const lv = Math.max(1, Math.min(100, Math.floor(level)));
  return Math.round(Math.min(cfg.odds.cap, boss.odds + lv * cfg.odds.perLevel) * 100) / 100;
}

interface WalletProvider {
  isPhantom?: boolean;
  publicKey?: { toString(): string } | null;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  disconnect?(): Promise<void>;
  signMessage(msg: Uint8Array, display?: 'utf8'): Promise<{ signature: Uint8Array } | Uint8Array>;
}

export function findWallet(): WalletProvider | null {
  const w = window as unknown as {
    phantom?: { solana?: WalletProvider };
    solflare?: WalletProvider;
    backpack?: WalletProvider;
    solana?: WalletProvider;
  };
  return w.phantom?.solana ?? w.solflare ?? w.backpack ?? w.solana ?? null;
}

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function base58(bytes: Uint8Array): string {
  const digits: number[] = [];
  for (const b of bytes) {
    let carry = b;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = '';
  for (const b of bytes) {
    if (b !== 0) break;
    out += '1';
  }
  for (let i = digits.length - 1; i >= 0; i--) out += ALPHABET[digits[i]];
  return out;
}

const SESSION_KEY = 'wildkin-rewards-session';

function loadSession(): { wallet: string; token: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(s: { wallet: string; token: string } | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage blocked: the player just signs in again next time */
  }
}

export class RewardsError extends Error {
  constructor(message: string, readonly status = 0) {
    super(message);
  }
}

async function call<T>(path: string, init: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(REWARDS_API + path, {
      method: init.method ?? 'GET',
      headers: { 'content-type': 'application/json', ...(init.token ? { authorization: 'Bearer ' + init.token } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new RewardsError('The rewards server could not be reached. Check your connection and try again.');
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new RewardsError(data.error ?? `Request failed (${res.status}).`, res.status);
  return data as T;
}

/** Connection state for the page. */
export class Rewards {
  session = loadSession();

  get connected(): boolean {
    return !!this.session;
  }

  get wallet(): string | null {
    return this.session?.wallet ?? null;
  }

  config(): Promise<RewardsConfig> {
    return call('/api/config');
  }

  /** Opens the wallet, signs the server's one-time message and starts a session. */
  async connect(): Promise<string> {
    const provider = findWallet();
    if (!provider) throw new RewardsError('No Solana wallet found. Install Phantom (phantom.app) or another Solana wallet, then reload the page.');
    let wallet: string;
    try {
      wallet = (await provider.connect()).publicKey.toString();
    } catch {
      throw new RewardsError('The wallet connection was cancelled.');
    }
    const { message } = await call<{ message: string }>('/api/auth/challenge', { method: 'POST', body: { wallet } });
    let signed: { signature: Uint8Array } | Uint8Array;
    try {
      signed = await provider.signMessage(new TextEncoder().encode(message), 'utf8');
    } catch {
      throw new RewardsError('Signing was cancelled, so you are not connected.');
    }
    const sig = signed instanceof Uint8Array ? signed : signed.signature;
    const { token } = await call<{ token: string }>('/api/auth/verify', { method: 'POST', body: { wallet, message, signature: base58(sig) } });
    this.session = { wallet, token };
    saveSession(this.session);
    return wallet;
  }

  disconnect() {
    this.session = null;
    saveSession(null);
    void findWallet()?.disconnect?.().catch(() => undefined);
  }

  private async authed<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
    if (!this.session) throw new RewardsError('Connect your wallet first.', 401);
    try {
      return await call<T>(path, { ...init, token: this.session.token });
    } catch (e) {
      if (e instanceof RewardsError && e.status === 401) {
        this.session = null;
        saveSession(null);
      }
      throw e;
    }
  }

  me(): Promise<Me> {
    return this.authed('/api/me');
  }

  preview(boss: string, level: number): Promise<Preview> {
    return this.authed(`/api/battle/preview?boss=${encodeURIComponent(boss)}&level=${Math.floor(level)}`);
  }

  /** Starts a card battle; uses one of today's battles. */
  start(boss: string, level: number): Promise<{ battleId: number; left: number; limit: number }> {
    return this.authed('/api/battle/start', { method: 'POST', body: { boss, level } });
  }

  finish(battleId: number, won: boolean): Promise<{ won: boolean; card?: string; note?: string }> {
    return this.authed('/api/battle/finish', { method: 'POST', body: { battleId, won } });
  }
}

export function explorerTx(tx: string, cluster: string): string {
  return `https://solscan.io/tx/${encodeURIComponent(tx)}${cluster === 'mainnet-beta' ? '' : `?cluster=${encodeURIComponent(cluster)}`}`;
}
