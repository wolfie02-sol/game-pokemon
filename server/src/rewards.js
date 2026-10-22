// The reward rules. Pure logic: storage and blockchain are passed in, so this
// file is easy to test and to change.
import crypto from 'node:crypto';
import { HttpError } from './auth.js';

/** Random number in [0, 100) from the operating system's secure generator. */
export function secureRoll() {
  return crypto.randomInt(0, 1_000_000) / 10_000;
}

/** Is this wallet allowed to roll? Returns { ok, balance, need }. */
export async function checkGate({ chain, config, wallet }) {
  if (!config.gateMint) return { ok: true, balance: null, need: 0, gateOff: true };
  const balance = await chain.tokenBalance(wallet, config.gateMint);
  return { ok: balance >= config.gateMin, balance, need: config.gateMin };
}

/**
 * Rolls for one milestone. Each wallet gets one roll per milestone, ever, and
 * milestones must be claimed in story order.
 *
 * Returns { status: 'rolled' | 'already' | 'wait' | 'ineligible', won, winId?, retryAfterSec? }
 */
export async function claimMilestone({ db, chain, config, milestones, wallet, milestoneId, now = Date.now(), roll = secureRoll }) {
  const idx = milestones.findIndex((m) => m.id === milestoneId);
  if (idx < 0) throw new HttpError(400, 'Unknown milestone.');
  const m = milestones[idx];

  if (db.hasRolled(wallet, m.id)) {
    const prev = db.rollsFor(wallet).find((r) => r.milestone === m.id);
    return { status: 'already', won: !!prev?.won };
  }

  // story order: every earlier milestone must have been claimed first
  const rolled = new Set(db.rollsFor(wallet).map((r) => r.milestone));
  const missing = milestones.slice(0, idx).find((x) => !rolled.has(x.id));
  if (missing) throw new HttpError(409, `Claim ${missing.label} first.`);

  // real time must have passed since this wallet first signed in
  const firstSeen = db.firstSeen(wallet) ?? now;
  const readyAt = firstSeen + m.minHours * 3600_000 * (config.timeScale ?? 1);
  if (now < readyAt) return { status: 'wait', won: false, retryAfterSec: Math.ceil((readyAt - now) / 1000) };

  const gate = await checkGate({ chain, config, wallet });
  if (!gate.ok) return { status: 'ineligible', won: false, balance: gate.balance, need: gate.need };

  const value = roll();
  const hit = value < m.odds;

  return db.tx(() => {
    // re-check inside the transaction so two requests can't both roll
    if (db.hasRolled(wallet, m.id)) return { status: 'already', won: false };
    let note = null;
    let card = null;
    if (hit) {
      if (db.countWinsForWallet(wallet) >= config.maxWinsPerWallet) note = 'wallet cap reached';
      else if (db.winsToday() >= config.maxWinsPerDay) note = 'daily cap reached';
      else if (!(card = db.reserveCard())) note = 'no cards in stock';
    }
    const won = !!card;
    db.insertRoll({ wallet, milestone: m.id, rolledAt: now, roll: value, odds: m.odds, won, note });
    if (!won) return { status: 'rolled', won: false };
    const winId = db.createWin(wallet, m.id, card.mint);
    return { status: 'rolled', won: true, winId, card: card.name };
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
