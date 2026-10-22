// Wallet sign-in: the server hands out a one-time message, the player signs it
// with their wallet, and the server checks the signature. No passwords, and the
// player never shares anything secret.
import crypto from 'node:crypto';
import { decode, isAddress } from './base58.js';

const NONCE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function makeChallenge(db, wallet) {
  if (!isAddress(wallet)) throw new HttpError(400, 'That is not a valid Solana wallet address.');
  const nonce = crypto.randomBytes(16).toString('hex');
  const issued = new Date().toISOString();
  const message = `Sign in to Wildkin card rewards\nWallet: ${wallet}\nNonce: ${nonce}\nIssued: ${issued}\n\nThis only proves you own the wallet. It costs nothing and cannot move funds.`;
  db.saveNonce(wallet, nonce, Date.now() + NONCE_TTL_MS);
  return { message };
}

/** Checks a signed challenge. `signature` is base58. */
export function verifyChallenge(db, wallet, message, signature) {
  if (!isAddress(wallet)) throw new HttpError(400, 'That is not a valid Solana wallet address.');
  const m = /Wallet: (\S+)\nNonce: ([0-9a-f]{32})\n/.exec(message ?? '');
  if (!m || m[1] !== wallet) throw new HttpError(400, 'The signed message does not match this wallet.');
  if (!db.takeNonce(wallet, m[2])) throw new HttpError(401, 'This sign-in request expired. Please try again.');
  let sig;
  try {
    sig = Buffer.from(decode(signature));
  } catch {
    throw new HttpError(400, 'The signature could not be read.');
  }
  if (sig.length !== 64) throw new HttpError(400, 'The signature could not be read.');
  if (!verifyEd25519(decode(wallet), Buffer.from(message, 'utf8'), sig)) {
    throw new HttpError(401, 'The signature did not match this wallet.');
  }
  return true;
}

export function verifyEd25519(publicKey, message, signature) {
  const key = crypto.createPublicKey({
    key: { kty: 'OKP', crv: 'Ed25519', x: Buffer.from(publicKey).toString('base64url') },
    format: 'jwk',
  });
  return crypto.verify(null, message, key, signature);
}

export function issueSession(secret, wallet) {
  const exp = Date.now() + SESSION_TTL_MS;
  const body = `${wallet}.${exp}`;
  const mac = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

/** Returns the wallet for a valid session token, or null. */
export function readSession(secret, token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [wallet, exp, mac] = parts;
  const want = crypto.createHmac('sha256', secret).update(`${wallet}.${exp}`).digest('base64url');
  if (mac.length !== want.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(want))) return null;
  if (Number(exp) < Date.now()) return null;
  return wallet;
}

export function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
