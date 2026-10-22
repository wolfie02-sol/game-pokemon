import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { test } from 'node:test';
import { encode } from '../src/base58.js';
import { openDb } from '../src/db.js';
import { createMockChain } from '../src/chain/mock.js';
import { approveWin, claimMilestone, rejectWin } from '../src/rewards.js';
import { createApp } from '../src/server.js';
import { makeChallenge, verifyChallenge } from '../src/auth.js';

function newWallet() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const address = encode(Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url'));
  return { address, sign: (msg) => encode(crypto.sign(null, Buffer.from(msg, 'utf8'), privateKey)) };
}

const baseConfig = { gateMint: 'Gate1111111111111111111111111111111111111111', gateMin: 10000, maxWinsPerDay: 3, maxWinsPerWallet: 1, sessionSecret: 'test-secret', adminPassword: 'pw', allowedOrigins: [], cluster: 'devnet', chain: 'mock' };
const M = [
  { id: 'a', label: 'A', odds: 100, minHours: 0 },
  { id: 'b', label: 'B', odds: 100, minHours: 2 },
  { id: 'c', label: 'C', odds: 0, minHours: 0 },
];
const ctx = (over = {}) => {
  const db = openDb(':memory:');
  const chain = createMockChain();
  const config = { ...baseConfig, ...over };
  return { db, chain, config, milestones: M };
};

test('wallet sign-in accepts a real signature once, and rejects forgeries', () => {
  const db = openDb(':memory:');
  const w = newWallet();
  const { message } = makeChallenge(db, w.address);
  assert.throws(() => verifyChallenge(db, w.address, message, newWallet().sign(message)), /did not match|expired/);
  const { message: m2 } = makeChallenge(db, w.address);
  assert.equal(verifyChallenge(db, w.address, m2, w.sign(m2)), true);
  assert.throws(() => verifyChallenge(db, w.address, m2, w.sign(m2)), /expired/, 'a challenge cannot be reused');
});

test('one roll per milestone, in story order, with a real-time wait', async () => {
  const c = ctx();
  c.db.addCard('Card111111111111111111111111111111111111111', 'Card One', 50);
  const w = newWallet().address;
  c.db.touchWallet(w);
  await assert.rejects(claimMilestone({ ...c, wallet: w, milestoneId: 'b' }), /Claim A first/);
  const first = await claimMilestone({ ...c, wallet: w, milestoneId: 'a', roll: () => 0 });
  assert.equal(first.won, true);
  const again = await claimMilestone({ ...c, wallet: w, milestoneId: 'a', roll: () => 0 });
  assert.equal(again.status, 'already');
  const early = await claimMilestone({ ...c, wallet: w, milestoneId: 'b', roll: () => 0 });
  assert.equal(early.status, 'wait');
  assert.ok(early.retryAfterSec > 7000);
});

test('token gate blocks wallets under the minimum', async () => {
  const c = ctx();
  const w = newWallet().address;
  c.db.touchWallet(w);
  c.chain.setBalance(w, 9999);
  const r = await claimMilestone({ ...c, wallet: w, milestoneId: 'a' });
  assert.equal(r.status, 'ineligible');
  assert.equal(c.db.hasRolled(w, 'a'), false, 'an ineligible wallet keeps its roll for later');
});

test('caps: per wallet, per day, and empty stock', async () => {
  const c = ctx({ maxWinsPerDay: 1 });
  const later = Date.now() + 10 * 3600_000;
  const w1 = newWallet().address, w2 = newWallet().address, w3 = newWallet().address;
  for (const w of [w1, w2, w3]) c.db.touchWallet(w);
  // no stock -> no win
  const none = await claimMilestone({ ...c, wallet: w1, milestoneId: 'a', roll: () => 0 });
  assert.equal(none.won, false);
  c.db.addCard('CardA11111111111111111111111111111111111111', 'A', 1);
  c.db.addCard('CardB11111111111111111111111111111111111111', 'B', 1);
  const win = await claimMilestone({ ...c, wallet: w2, milestoneId: 'a', roll: () => 0 });
  assert.equal(win.won, true);
  const capWallet = await claimMilestone({ ...c, wallet: w2, milestoneId: 'b', roll: () => 0, now: later });
  assert.equal(capWallet.won, false, 'one card per wallet');
  const capDay = await claimMilestone({ ...c, wallet: w3, milestoneId: 'a', roll: () => 0 });
  assert.equal(capDay.won, false, 'daily cap');
});

test('approve sends the card; reject returns it to stock', async () => {
  const c = ctx({ maxWinsPerDay: 10, maxWinsPerWallet: 5 });
  c.db.addCard('CardA11111111111111111111111111111111111111', 'A', 1);
  const w = newWallet().address;
  c.db.touchWallet(w);
  const r = await claimMilestone({ ...c, wallet: w, milestoneId: 'a', roll: () => 0 });
  const sent = await approveWin({ db: c.db, chain: c.chain, id: r.winId });
  assert.equal(sent.status, 'sent');
  assert.equal(c.chain.sent[0].to, w);
  await assert.rejects(approveWin({ db: c.db, chain: c.chain, id: r.winId }), /already sent/);
  assert.throws(() => rejectWin({ db: c.db, id: r.winId }), /already sent/);

  c.db.addCard('CardB11111111111111111111111111111111111111', 'B', 1);
  const w2 = newWallet().address;
  c.db.touchWallet(w2);
  const r2 = await claimMilestone({ ...c, wallet: w2, milestoneId: 'a', roll: () => 0 });
  rejectWin({ db: c.db, id: r2.winId });
  assert.equal(c.db.listCards().find((x) => x.name === 'B').status, 'available');
});

test('HTTP: sign in, check status, claim, and admin approval', async () => {
  const c = ctx();
  const server = http.createServer(createApp({ ...c, milestones: [{ id: 'badge:BOULDER', label: 'Boulder', odds: 100, minHours: 0 }] }));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, body, token) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, data: await res.json() };
  };
  try {
    const w = newWallet();
    const ch = await call('POST', '/api/auth/challenge', { wallet: w.address });
    const v = await call('POST', '/api/auth/verify', { wallet: w.address, message: ch.data.message, signature: w.sign(ch.data.message) });
    assert.equal(v.status, 200);
    const token = v.data.token;
    assert.equal((await call('GET', '/api/me', null, 'bad')).status, 401);
    // admin adds a card
    assert.equal((await call('POST', '/api/admin/cards', { mint: 'CardA11111111111111111111111111111111111111', name: 'Test' }, 'wrong')).status, 401);
    assert.equal((await call('POST', '/api/admin/cards', { mint: 'CardA11111111111111111111111111111111111111', name: 'Test' }, 'pw')).status, 200);
    const claim = await call('POST', '/api/claim', { milestones: ['badge:BOULDER'] }, token);
    assert.equal(claim.data.results[0].won, true);
    const me = await call('GET', '/api/me', null, token);
    assert.equal(me.data.wins[0].status, 'pending');
    const ov = await call('GET', '/api/admin/overview', null, 'pw');
    const id = ov.data.wins[0].id;
    const ap = await call('POST', `/api/admin/wins/${id}/approve`, {}, 'pw');
    assert.equal(ap.data.status, 'sent');
    const me2 = await call('GET', '/api/me', null, token);
    assert.equal(me2.data.wins[0].status, 'sent');
    const page = await fetch(base + '/admin');
    assert.match(await page.text(), /Card rewards admin/);
  } finally {
    server.close();
  }
});
