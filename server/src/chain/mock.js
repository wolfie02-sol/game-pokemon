// A pretend blockchain for local testing. Nothing real is checked or sent.
//
// MOCK_BALANCES can hold JSON like {"<wallet>": 500} to give a wallet too few tokens;
// every other wallet is treated as holding 25,000.
import crypto from 'node:crypto';

export function createMockChain() {
  let overrides = {};
  try {
    overrides = JSON.parse(process.env.MOCK_BALANCES || '{}');
  } catch {
    overrides = {};
  }
  const sent = [];
  return {
    name: 'mock',
    prizeWallet: 'MockPrizeWa11et1111111111111111111111111111',
    async tokenBalance(wallet) {
      return overrides[wallet] ?? 25_000;
    },
    async holdsCard() {
      return true;
    },
    async transferCard(mint, to) {
      if (process.env.MOCK_TRANSFER_FAIL === '1') throw new Error('mock transfer failure');
      const tx = 'MOCK' + crypto.randomBytes(20).toString('hex');
      sent.push({ mint, to, tx });
      return tx;
    },
    setBalance(wallet, amount) {
      overrides[wallet] = amount;
    },
    sent,
  };
}
