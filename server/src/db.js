// Storage using Node's built-in SQLite (Node 22.5+). One file, no database server.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS nonces (wallet TEXT NOT NULL, nonce TEXT NOT NULL, exp INTEGER NOT NULL, PRIMARY KEY (wallet, nonce));
CREATE TABLE IF NOT EXISTS wallets (wallet TEXT PRIMARY KEY, first_seen INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rolls (
  wallet TEXT NOT NULL, milestone TEXT NOT NULL, rolled_at INTEGER NOT NULL,
  roll REAL NOT NULL, odds REAL NOT NULL, won INTEGER NOT NULL, note TEXT,
  PRIMARY KEY (wallet, milestone)
);
CREATE TABLE IF NOT EXISTS cards (
  mint TEXT PRIMARY KEY, name TEXT NOT NULL, value_usd REAL, status TEXT NOT NULL DEFAULT 'available', added_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS wins (
  id INTEGER PRIMARY KEY AUTOINCREMENT, wallet TEXT NOT NULL, milestone TEXT NOT NULL, mint TEXT NOT NULL,
  status TEXT NOT NULL, created_at INTEGER NOT NULL, decided_at INTEGER, tx TEXT, error TEXT
);
`;

export function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  const q = (sql) => db.prepare(sql);

  const tx = (fn) => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const r = fn();
      db.exec('COMMIT');
      return r;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  };

  return {
    raw: db,
    tx,

    // ── sign-in ──
    saveNonce(wallet, nonce, exp) {
      q('DELETE FROM nonces WHERE exp < ?').run(Date.now());
      q('INSERT INTO nonces (wallet, nonce, exp) VALUES (?, ?, ?)').run(wallet, nonce, exp);
    },
    takeNonce(wallet, nonce) {
      const row = q('SELECT exp FROM nonces WHERE wallet = ? AND nonce = ?').get(wallet, nonce);
      q('DELETE FROM nonces WHERE wallet = ? AND nonce = ?').run(wallet, nonce);
      return !!row && row.exp >= Date.now();
    },
    touchWallet(wallet) {
      q('INSERT OR IGNORE INTO wallets (wallet, first_seen) VALUES (?, ?)').run(wallet, Date.now());
      return q('SELECT first_seen FROM wallets WHERE wallet = ?').get(wallet).first_seen;
    },
    firstSeen(wallet) {
      return q('SELECT first_seen FROM wallets WHERE wallet = ?').get(wallet)?.first_seen ?? null;
    },

    // ── rolls and wins ──
    rollsFor(wallet) {
      return q('SELECT milestone, rolled_at, won FROM rolls WHERE wallet = ?').all(wallet);
    },
    hasRolled(wallet, milestone) {
      return !!q('SELECT 1 FROM rolls WHERE wallet = ? AND milestone = ?').get(wallet, milestone);
    },
    insertRoll(r) {
      q('INSERT INTO rolls (wallet, milestone, rolled_at, roll, odds, won, note) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        r.wallet, r.milestone, r.rolledAt, r.roll, r.odds, r.won ? 1 : 0, r.note ?? null,
      );
    },
    winsToday() {
      return q("SELECT COUNT(*) AS n FROM wins WHERE created_at >= ? AND status != 'rejected'").get(Date.now() - 86400000).n;
    },
    winsForWallet(wallet) {
      return q("SELECT w.id, w.milestone, w.status, w.created_at, w.tx, c.name AS card FROM wins w LEFT JOIN cards c ON c.mint = w.mint WHERE w.wallet = ? ORDER BY w.id DESC").all(wallet);
    },
    countWinsForWallet(wallet) {
      return q("SELECT COUNT(*) AS n FROM wins WHERE wallet = ? AND status != 'rejected'").get(wallet).n;
    },
    reserveCard() {
      const card = q("SELECT mint, name FROM cards WHERE status = 'available' ORDER BY added_at LIMIT 1").get();
      if (!card) return null;
      q("UPDATE cards SET status = 'reserved' WHERE mint = ?").run(card.mint);
      return card;
    },
    createWin(wallet, milestone, mint) {
      const r = q("INSERT INTO wins (wallet, milestone, mint, status, created_at) VALUES (?, ?, ?, 'pending', ?)").run(wallet, milestone, mint, Date.now());
      return Number(r.lastInsertRowid);
    },

    // ── admin ──
    listWins(status) {
      const base = 'SELECT w.*, c.name AS card, c.value_usd FROM wins w LEFT JOIN cards c ON c.mint = w.mint';
      return status ? q(`${base} WHERE w.status = ? ORDER BY w.id DESC`).all(status) : q(`${base} ORDER BY w.id DESC LIMIT 200`).all();
    },
    getWin(id) {
      return q('SELECT * FROM wins WHERE id = ?').get(id);
    },
    markWin(id, status, fields = {}) {
      q('UPDATE wins SET status = ?, decided_at = ?, tx = COALESCE(?, tx), error = ? WHERE id = ?').run(status, Date.now(), fields.tx ?? null, fields.error ?? null, id);
    },
    setCardStatus(mint, status) {
      q('UPDATE cards SET status = ? WHERE mint = ?').run(status, mint);
    },
    addCard(mint, name, valueUsd) {
      q("INSERT INTO cards (mint, name, value_usd, status, added_at) VALUES (?, ?, ?, 'available', ?)").run(mint, name, valueUsd ?? null, Date.now());
    },
    removeCard(mint) {
      const c = q('SELECT status FROM cards WHERE mint = ?').get(mint);
      if (!c) return false;
      if (c.status !== 'available') throw new Error('Only cards that are not reserved or sent can be removed.');
      q('DELETE FROM cards WHERE mint = ?').run(mint);
      return true;
    },
    listCards() {
      return q('SELECT * FROM cards ORDER BY added_at DESC').all();
    },
    stats() {
      return {
        players: q('SELECT COUNT(*) AS n FROM wallets').get().n,
        rolls: q('SELECT COUNT(*) AS n FROM rolls').get().n,
        pending: q("SELECT COUNT(*) AS n FROM wins WHERE status = 'pending'").get().n,
        sent: q("SELECT COUNT(*) AS n FROM wins WHERE status = 'sent'").get().n,
        cardsAvailable: q("SELECT COUNT(*) AS n FROM cards WHERE status = 'available'").get().n,
      };
    },
  };
}
