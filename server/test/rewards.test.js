import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { test } from 'node:test';
import { encode } from '../src/base58.js';
import { openDb } from '../src/db.js';
import { createMockChain } from '../src/chain/mock.js';
import { BOSSES, oddsFor } from '../src/config.js';
import { approveWin, dayKey, finishBattle, msUntilReset, rejectWin, startBattle } from '../src/rewards.js';
import { createApp } from '../src/server.js';
import { makeChallenge, verifyChallenge } from '../src/auth.js';

function newWallet() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const address = encode(Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url'));
  return { address, sign: (msg) => encode(crypto.sign(null, Buffer.from(msg, 'utf8'), privateKey)) };
}
const mint = () => encode(crypto.randomBytes(32));

const baseConfig = {
  gateMint: 'Gate1111111111111111111111111111111111111111', gateMin: 10000, maxWinsPerDay: 3, maxWinsPerWallet: 1,
  battlesPerDay: 5, timeZone: 'America/Toronto', minBattleSeconds: 45, maxBattleMinutes: 60,
  sessionSecret: 'test-secret', adminPassword: 'pw', allowedOrigins: [], cluster: 'devnet', chain: 'mock',
};
const ctx = (over = {}) => ({ db: openDb(':memory:'), chain: createMockChain(), config: { ...baseConfig, ...over }, bosses: BOSSES });
const T0 = Date.UTC(2026, 9, 22, 16, 0); // noon in Toronto
const MIN = 60_000;

test('wallet sign-in accepts a real signature once, and rejects forgeries', () => {
  const db = openDb(':memory:');
  const w = newWallet();
  const { message } = makeChallenge(db, w.address);
  assert.throws(() => verifyChallenge(db, w.address, message, newWallet().sign(message)), /did not match|expired/);
  const { message: m2 } = makeChallenge(db, w.address);
  assert.equal(verifyChallenge(db, w.address, m2, w.sign(m2)), true);
  assert.throws(() => verifyChallenge(db, w.address, m2, w.sign(m2)), /expired/, 'a challenge cannot be reused');
});

test('odds grow with tougher bosses and higher levels, and are capped', () => {
  const g1 = BOSSES.find((b) => b.id === 'g1');
  const champ = BOSSES.find((b) => b.id === 'champ');
  assert.ok(oddsFor(champ, 50) > oddsFor(g1, 50));
  assert.ok(oddsFor(g1, 60) > oddsFor(g1, 20));
  assert.equal(oddsFor(champ, 9999), oddsFor(champ, 100), 'levels above 100 are ignored');
  assert.ok(oddsFor(champ, 100) <= 3);
});

test('5 battles a day, every attempt counts, resets at midnight Toronto time', async () => {
  const c = ctx();
  const w = newWallet().address;
  for (let i = 0; i < 5; i++) {
    const b = await startBattle({ ...c, wallet: w, bossId: 'g1', level: 20, now: T0 + i * MIN });
    await finishBattle({ ...c, wallet: w, battleId: b.battleId, wonFight: false, now: T0 + i * MIN + MIN });
    assert.equal(b.left, 4 - i);
  }
  await assert.rejects(startBattle({ ...c, wallet: w, bossId: 'g1', level: 20, now: T0 + 10 * MIN }), /used all 5/);
  const tomorrow = T0 + 13 * 60 * MIN; // 1am next day in Toronto
  assert.notEqual(dayKey(tomorrow, 'America/Toronto'), dayKey(T0, 'America/Toronto'));
  const b = await startBattle({ ...c, wallet: w, bossId: 'g1', level: 20, now: tomorrow });
  assert.equal(b.left, 4);
  const reset = msUntilReset(T0, 'America/Toronto');
  assert.ok(Math.abs(reset - 12 * 60 * MIN) <= MIN, `noon to midnight should be ~12h, got ${reset / 3600000}h`);
});

test('only real-length won battles roll; a battle finishes once', async () => {
  const c = ctx({ maxWinsPerWallet: 5, maxWinsPerDay: 5 });
  for (let i = 0; i < 3; i++) c.db.addCard(mint(), `Card ${i}`, 10);
  const w = newWallet().address;
  const other = newWallet().address;
  const fast = await startBattle({ ...c, wallet: w, bossId: 'champ', level: 60, now: T0 });
  assert.deepEqual(await finishBattle({ ...c, wallet: w, battleId: fast.battleId, wonFight: true, now: T0 + 10_000, roll: () => 0 }), { won: false, note: 'too fast' });
  const real = await startBattle({ ...c, wallet: w, bossId: 'champ', level: 60, now: T0 });
  await assert.rejects(finishBattle({ ...c, wallet: other, battleId: real.battleId, wonFight: true, now: T0 + 2 * MIN }), /No such battle/);
  const res = await finishBattle({ ...c, wallet: w, battleId: real.battleId, wonFight: true, now: T0 + 2 * MIN, roll: () => 0 });
  assert.equal(res.won, true);
  await assert.rejects(finishBattle({ ...c, wallet: w, battleId: real.battleId, wonFight: true, now: T0 + 3 * MIN }), /already over/);
  const miss = await startBattle({ ...c, wallet: w, bossId: 'champ', level: 60, now: T0 });
  assert.equal((await finishBattle({ ...c, wallet: w, battleId: miss.battleId, wonFight: true, now: T0 + 2 * MIN, roll: () => 99.9 })).won, false);
});

test('token gate blocks starting a battle', async () => {
  const c = ctx();
  const w = newWallet().address;
  c.chain.setBalance(w, 9999);
  await assert.rejects(startBattle({ ...c, wallet: w, bossId: 'g1', level: 20 }), /need at least 10,000 tokens/);
});

test('caps: one card per wallet, daily total, empty stock', async () => {
  const c = ctx({ maxWinsPerDay: 1 });
  const play = async (w) => {
    const b = await startBattle({ ...c, wallet: w, bossId: 'g8', level: 50, now: T0 });
    return finishBattle({ ...c, wallet: w, battleId: b.battleId, wonFight: true, now: T0 + 2 * MIN, roll: () => 0 });
  };
  const [w1, w2, w3] = [newWallet().address, newWallet().address, newWallet().address];
  assert.equal((await play(w1)).won, false, 'no stock, no win');
  c.db.addCard(mint(), 'A', 1);
  c.db.addCard(mint(), 'B', 1);
  assert.equal((await play(w2)).won, true);
  assert.equal((await play(w2)).won, false, 'one card per wallet');
  assert.equal((await play(w3)).won, false, 'daily cap');
});

test('approve sends the card; reject returns it to stock', async () => {
  const c = ctx({ maxWinsPerDay: 10, maxWinsPerWallet: 5 });
  c.db.addCard(mint(), 'A', 1);
  const w = newWallet().address;
  const b = await startBattle({ ...c, wallet: w, bossId: 'g1', level: 10, now: T0 });
  const r = await finishBattle({ ...c, wallet: w, battleId: b.battleId, wonFight: true, now: T0 + MIN, roll: () => 0 });
  assert.equal((await approveWin({ db: c.db, chain: c.chain, id: r.winId })).status, 'sent');
  assert.equal(c.chain.sent[0].to, w);
  await assert.rejects(approveWin({ db: c.db, chain: c.chain, id: r.winId }), /already sent/);

  c.db.addCard(mint(), 'B', 1);
  const w2 = newWallet().address;
  const b2 = await startBattle({ ...c, wallet: w2, bossId: 'g1', level: 10, now: T0 });
  const r2 = await finishBattle({ ...c, wallet: w2, battleId: b2.battleId, wonFight: true, now: T0 + MIN, roll: () => 0 });
  rejectWin({ db: c.db, id: r2.winId });
  assert.equal(c.db.listCards().find((x) => x.name === 'B').status, 'available');
});

test('HTTP: sign in, preview, battle, win, admin approval', async () => {
  const c = ctx({ minBattleSeconds: 0 });
  const server = http.createServer(createApp({ ...c, roll: () => 0 }));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, body, token) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, data: await res.json() };
  };
  try {
    const w = newWallet();
    const ch = await call('POST', '/api/auth/challenge', { wallet: w.address });
    const token = (await call('POST', '/api/auth/verify', { wallet: w.address, message: ch.data.message, signature: w.sign(ch.data.message) })).data.token;
    assert.equal((await call('GET', '/api/me', null, 'bad')).status, 401);
    assert.equal((await call('POST', '/api/admin/cards', { mint: mint(), name: 'Test' }, 'pw')).status, 200);
    const pv = await call('GET', '/api/battle/preview?boss=champ&level=55', null, token);
    assert.equal(pv.data.left, 5);
    assert.ok(pv.data.odds > 1);
    assert.equal((await call('POST', '/api/battle/start', { boss: 'nobody', level: 5 }, token)).status, 400);
    const st = await call('POST', '/api/battle/start', { boss: 'champ', level: 55 }, token);
    assert.equal(st.data.left, 4);
    const fin = await call('POST', '/api/battle/finish', { battleId: st.data.battleId, won: true }, token);
    assert.equal(fin.data.won, true);
    const me = await call('GET', '/api/me', null, token);
    assert.equal(me.data.wins[0].status, 'pending');
    assert.equal(me.data.left, 4);
    const ov = await call('GET', '/api/admin/overview', null, 'pw');
    assert.equal((await call('POST', `/api/admin/wins/${ov.data.wins[0].id}/approve`, {}, 'pw')).data.status, 'sent');
    assert.match(await (await fetch(base + '/admin')).text(), /Card rewards admin/);
  } finally {
    server.close();
  }
});
