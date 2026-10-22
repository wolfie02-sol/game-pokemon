// HTTP API for card rewards. Run with: node src/server.js
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError, issueSession, makeChallenge, readSession, safeEqual, verifyChallenge } from './auth.js';
import { isAddress } from './base58.js';
import { checkConfig, config as defaultConfig, MILESTONES } from './config.js';
import { openDb } from './db.js';
import { approveWin, checkGate, claimMilestone, rejectWin } from './rewards.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export async function createChain(config) {
  if (config.chain === 'solana') {
    const { createSolanaChain } = await import('./chain/solana.js');
    return createSolanaChain(config);
  }
  const { createMockChain } = await import('./chain/mock.js');
  return createMockChain();
}

/** Tiny fixed-window rate limiter, per IP and bucket. */
function limiter() {
  const hits = new Map();
  return (key, max, windowMs = 60_000) => {
    const now = Date.now();
    const h = hits.get(key);
    if (!h || now - h.start > windowMs) {
      hits.set(key, { start: now, n: 1 });
      return true;
    }
    h.n += 1;
    return h.n <= max;
  };
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > 16_384) throw new HttpError(413, 'Request too large.');
    chunks.push(c);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Request body must be JSON.');
  }
}

export function createApp({ config, db, chain, milestones = MILESTONES, roll }) {
  const allow = limiter();
  const adminHtml = fs.readFileSync(path.join(here, '..', 'admin.html'), 'utf8');

  const routes = [
    ['GET', /^\/api\/health$/, async () => ({ ok: true, chain: chain.name })],

    ['GET', /^\/api\/config$/, async () => ({
      cluster: config.cluster,
      gate: config.gateMint ? { mint: config.gateMint, min: config.gateMin } : null,
      milestones: milestones.map(({ id, label, odds }) => ({ id, label, odds })),
    })],

    ['POST', /^\/api\/auth\/challenge$/, async ({ body }) => makeChallenge(db, body.wallet)],

    ['POST', /^\/api\/auth\/verify$/, async ({ body }) => {
      verifyChallenge(db, body.wallet, body.message, body.signature);
      db.touchWallet(body.wallet);
      return { token: issueSession(config.sessionSecret, body.wallet) };
    }],

    ['GET', /^\/api\/me$/, async ({ wallet }) => {
      const gate = await checkGate({ chain, config, wallet });
      const rolls = db.rollsFor(wallet);
      const first = db.firstSeen(wallet);
      return {
        wallet,
        eligible: gate.ok,
        balance: gate.balance,
        need: gate.need,
        claimed: rolls.map((r) => r.milestone),
        wins: db.winsForWallet(wallet).map((w) => ({ id: w.id, milestone: w.milestone, card: w.card, status: w.status, tx: w.tx })),
        next: milestones
          .filter((m) => !rolls.some((r) => r.milestone === m.id))
          .map((m) => ({ id: m.id, label: m.label, odds: m.odds, readyAt: first ? first + m.minHours * 3600_000 * (config.timeScale ?? 1) : null })),
      };
    }, { auth: true }],

    ['POST', /^\/api\/claim$/, async ({ wallet, body }) => {
      const ids = Array.isArray(body.milestones) ? body.milestones.filter((x) => typeof x === 'string').slice(0, milestones.length) : [];
      // claim in story order, stopping at the first milestone that can't be claimed yet
      const ordered = milestones.filter((m) => ids.includes(m.id));
      const results = [];
      for (const m of ordered) {
        const r = await claimMilestone({ db, chain, config, milestones, wallet, milestoneId: m.id, ...(roll ? { roll } : {}) });
        results.push({ milestone: m.id, label: m.label, ...r });
        if (r.status === 'wait' || r.status === 'ineligible') break;
      }
      return { results };
    }, { auth: true, limit: 10 }],

    // ── admin ──
    ['GET', /^\/admin\/?$/, async () => ({ __html: adminHtml })],

    ['GET', /^\/api\/admin\/overview$/, async () => ({
      chain: chain.name,
      prizeWallet: chain.prizeWallet,
      gate: config.gateMint ? { mint: config.gateMint, min: config.gateMin } : null,
      limits: { maxWinsPerDay: config.maxWinsPerDay, maxWinsPerWallet: config.maxWinsPerWallet },
      warnings: checkConfig(),
      stats: db.stats(),
      wins: db.listWins(),
      cards: db.listCards(),
      milestones,
    }), { admin: true }],

    ['POST', /^\/api\/admin\/cards$/, async ({ body }) => {
      const mint = String(body.mint ?? '').trim();
      const name = String(body.name ?? '').trim().slice(0, 120);
      if (!isAddress(mint)) throw new HttpError(400, 'That is not a valid card address (mint).');
      if (!name) throw new HttpError(400, 'Give the card a name so you can recognise it.');
      if (!(await chain.holdsCard(mint))) throw new HttpError(400, `The prize wallet (${chain.prizeWallet}) does not hold this card. Send it there first.`);
      try {
        db.addCard(mint, name, body.valueUsd === '' || body.valueUsd == null ? null : Number(body.valueUsd));
      } catch {
        throw new HttpError(409, 'That card is already in the list.');
      }
      return { ok: true };
    }, { admin: true }],

    ['DELETE', /^\/api\/admin\/cards\/([^/]+)$/, async ({ params }) => {
      try {
        if (!db.removeCard(params[0])) throw new HttpError(404, 'No such card.');
      } catch (e) {
        if (e instanceof HttpError) throw e;
        throw new HttpError(409, e.message);
      }
      return { ok: true };
    }, { admin: true }],

    ['POST', /^\/api\/admin\/wins\/(\d+)\/approve$/, async ({ params }) => approveWin({ db, chain, id: Number(params[0]) }), { admin: true }],
    ['POST', /^\/api\/admin\/wins\/(\d+)\/reject$/, async ({ params }) => rejectWin({ db, id: Number(params[0]) }), { admin: true }],
  ];

  return async function handle(req, res) {
    const origin = req.headers.origin;
    if (origin && config.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    const send = (status, data) => {
      if (data && data.__html) {
        res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }).end(data.__html);
        return;
      }
      res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify(data));
    };
    try {
      const url = new URL(req.url, 'http://x');
      const ip = (req.headers['x-forwarded-for']?.split(',')[0] ?? req.socket.remoteAddress ?? '').trim();
      if (!allow(`all:${ip}`, 120)) throw new HttpError(429, 'Too many requests. Slow down a little.');
      const route = routes.find(([m, re]) => m === req.method && re.test(url.pathname));
      if (!route) throw new HttpError(404, 'Not found.');
      const [, re, fn, opts = {}] = route;
      const params = re.exec(url.pathname).slice(1).map(decodeURIComponent);
      const auth = req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? '';
      let wallet = null;
      if (opts.auth) {
        wallet = readSession(config.sessionSecret, auth);
        if (!wallet) throw new HttpError(401, 'Please connect your wallet again.');
      }
      if (opts.admin) {
        if (!allow(`admin:${ip}`, 30)) throw new HttpError(429, 'Too many admin requests.');
        if (!safeEqual(auth, config.adminPassword)) throw new HttpError(401, 'Wrong admin password.');
      }
      if (opts.limit && !allow(`${url.pathname}:${wallet ?? ip}`, opts.limit)) throw new HttpError(429, 'Too many requests. Try again in a minute.');
      const body = req.method === 'POST' ? await readJson(req) : {};
      send(200, await fn({ body, params, wallet, url }));
    } catch (e) {
      if (e instanceof HttpError) send(e.status, { error: e.message });
      else {
        console.error(e);
        send(500, { error: 'Something went wrong on the server.' });
      }
    }
  };
}

async function main() {
  const config = defaultConfig;
  for (const w of checkConfig()) console.warn('WARNING:', w);
  if (config.chain === 'solana' && config.cluster === 'mainnet-beta') console.warn('LIVE MODE: real cards will be sent on Solana mainnet.');
  const db = openDb(config.dbPath);
  const chain = await createChain(config);
  // Testing only: MOCK_ROLL fixes every roll (0 = always win). Ignored unless CHAIN=mock.
  const roll = config.chain === 'mock' && process.env.MOCK_ROLL ? () => Number(process.env.MOCK_ROLL) : undefined;
  const server = http.createServer(createApp({ config, db, chain, roll }));
  server.listen(config.port, () => {
    console.log(`Card rewards API on http://localhost:${config.port}  (chain: ${chain.name}, prize wallet: ${chain.prizeWallet})`);
    console.log(`Admin page: http://localhost:${config.port}/admin`);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
