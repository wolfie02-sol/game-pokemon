// The reward rules. Pure logic: storage and blockchain are passed in, so this
// file is easy to test and to change.
//
// Cards drop only from boss rematches. Each wallet can start a limited number
// of boss battles per day (every attempt counts, win or lose). Winning a
// battle rolls once for a card, with better odds for tougher bosses and
// stronger teams.
import crypto from 'node:crypto';
import { HttpError } from './auth.js';
import { oddsFor } from './config.js';

/** Random number in [0, 100) from the operating system's secure generator. */
export function secureRoll() {
  return crypto.randomInt(0, 1_000_000) / 10_000;
}

/** "2026-10-22" for the given moment in the given time zone. */
export function dayKey(now, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
}

/** Milliseconds until the next midnight in the time zone. */
export function msUntilReset(now, timeZone) {
  const today = dayKey(now, timeZone);
  // step forward in 15-minute increments until the date changes (handles DST)
  let t = now - (now % (15 * 60_000)) + 15 * 60_000;
  while (dayKey(t, timeZone) === today) t += 15 * 60_000;
  // refine to the minute
  let lo = t - 15 * 60_000;
  while (t - lo > 60_000) {
    const mid = lo + Math.floor((t - lo) / 2 / 60_000) * 60_000;
    if (dayKey(mid, timeZone) === today) lo = mid;
    else t = mid;
  }
  return t - now;
}

/** Is this wallet allowed to play for cards? Returns { ok, balance, need }. */
export async function checkGate({ chain, config, wallet }) {
  if (!config.gateMint) return { ok: true, balance: null, need: 0, gateOff: true };
  const balance = await chain.tokenBalance(wallet, config.gateMint);
  return { ok: balance >= config.gateMin, balance, need: config.gateMin };
}

function findBoss(bosses, id) {
  const b = bosses.find((x) => x.id === id);
  if (!b) throw new HttpError(400, 'That trainer is not a card boss.');
  return b;
}

/** Battles left today and when the count resets. */
export function dailyStatus({ db, config, wallet, now = Date.now() }) {
  const used = db.battlesOn(wallet, dayKey(now, config.timeZone));
  return { used, left: Math.max(0, config.battlesPerDay - used), limit: config.battlesPerDay, resetsInSec: Math.ceil(msUntilReset(now, config.timeZone) / 1000) };
}

/** What a battle against `bossId` would look like right now, without starting it. */
export async function previewBattle({ db, chain, config, bosses, wallet, bossId, level, now = Date.now() }) {
  const boss = findBoss(bosses, bossId);
  const gate = await checkGate({ chain, config, wallet });
  return { boss: boss.id, label: boss.label, odds: oddsFor(boss, level), eligible: gate.ok, balance: gate.balance, need: gate.need, ...dailyStatus({ db, config, wallet, now }) };
}

/** Starts a card battle. Uses up one of today's battles immediately. */
export async function startBattle({ db, chain, config, bosses, wallet, bossId, level, now = Date.now() }) {
  const boss = findBoss(bosses, bossId);
  const gate = await checkGate({ chain, config, wallet });
  if (!gate.ok) throw new HttpError(403, `You need at least ${config.gateMin.toLocaleString('en-US')} tokens in your wallet to battle for cards.`);
  const odds = oddsFor(boss, level);
  const day = dayKey(now, config.timeZone);
  return db.tx(() => {
    if (db.battlesOn(wallet, day) >= config.battlesPerDay) {
      throw new HttpError(429, `You've used all ${config.battlesPerDay} card battles for today. They reset at midnight.`);
    }
    const battleId = db.startBattle({ wallet, boss: boss.id, level: Math.floor(Number(level) || 1), odds, day, startedAt: now });
    return { battleId, odds, ...dailyStatus({ db, config, wallet, now }) };
  });
}

/**
 * Finishes a card battle. A win rolls once for a card.
 * Returns { won: boolean, card?: string, winId?: number, note?: string }.
 */
export async function finishBattle({ db, config, wallet, battleId, wonFight, now = Date.now(), roll = secureRoll }) {
  const b = db.getBattle(Number(battleId));
  if (!b || b.wallet !== wallet) throw new HttpError(404, 'No such battle.');
  if (b.finished_at) throw new HttpError(409, 'This battle is already over.');

  const seconds = (now - b.started_at) / 1000;
  let note = null;
  if (!wonFight) note = 'lost';
  else if (seconds < config.minBattleSeconds) note = 'too fast';
  else if (seconds > config.maxBattleMinutes * 60) note = 'too late';
  if (note) {
    db.finishBattle(b.id, { finishedAt: now, wonFight: !!wonFight, wonCard: false, note });
    return { won: false, note };
  }

  const value = roll();
  return db.tx(() => {
    let card = null;
    let why = null;
    if (value < b.odds) {
      if (db.countWinsForWallet(wallet) >= config.maxWinsPerWallet) why = 'wallet cap reached';
      else if (db.winsToday() >= config.maxWinsPerDay) why = 'daily cap reached';
      else if (!(card = db.reserveCard())) why = 'no cards in stock';
    }
    db.finishBattle(b.id, { finishedAt: now, wonFight: true, roll: value, wonCard: !!card, note: why });
    if (!card) return { won: false };
    const winId = db.createWin(wallet, b.boss, b.id, card.mint);
    return { won: true, card: card.name, winId };
  });
}

/** Admin approves a pending win: send the card. */
export async function approveWin({ db, chain, id }) {
  const w = db.getWin(id);
  if (!w) throw new HttpError(404, 'No win with that id.');
  if (w.status !== 'pending' && w.status !== 'failed') throw new HttpError(409, `This win is already ${w.status}.`);
  try {
    const tx = await chain.transferCard(w.mint, w.wallet);
    db.markWin(id, 'sent', { tx });
    db.setCardStatus(w.mint, 'sent');
    return { status: 'sent', tx };
  } catch (e) {
    db.markWin(id, 'failed', { error: String(e?.message ?? e).slice(0, 500) });
    throw new HttpError(502, `The transfer failed: ${e?.message ?? e}`);
  }
}

/** Admin rejects a win (e.g. suspected cheating): the card goes back into stock. */
export function rejectWin({ db, id }) {
  const w = db.getWin(id);
  if (!w) throw new HttpError(404, 'No win with that id.');
  if (w.status === 'sent') throw new HttpError(409, 'This card was already sent.');
  db.markWin(id, 'rejected');
  db.setCardStatus(w.mint, 'available');
  return { status: 'rejected' };
}
