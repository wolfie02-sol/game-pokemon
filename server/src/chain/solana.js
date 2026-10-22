// Real Solana access.
//  - Token balances are read straight from the RPC (no extra packages).
//  - Card transfers use Metaplex's official libraries, which handle every card
//    format Collector Crypt might use: classic NFTs, programmable NFTs (pNFTs)
//    and Metaplex Core assets. Install them with `npm install` in server/.
import { decode, encode } from '../base58.js';

const DEFAULT_RPC = {
  devnet: 'https://api.devnet.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
};
const MPL_CORE_PROGRAM = 'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d';
const BALANCE_CACHE_MS = 60_000;

export function parseSecret(secret) {
  const s = secret.trim();
  const bytes = s.startsWith('[') ? Uint8Array.from(JSON.parse(s)) : decode(s);
  if (bytes.length !== 64) throw new Error('PRIZE_WALLET_SECRET must be a 64-byte Solana secret key.');
  return bytes;
}

export function createSolanaChain(config) {
  const rpcUrl = config.rpcUrl || DEFAULT_RPC[config.cluster];
  if (!rpcUrl) throw new Error(`Unknown SOLANA_CLUSTER "${config.cluster}". Use devnet or mainnet-beta, or set SOLANA_RPC_URL.`);
  const secret = parseSecret(config.prizeWalletSecret);
  const prizeWallet = encode(secret.slice(32));
  const cache = new Map();

  async function rpc(method, params) {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    if (!res.ok) throw new Error(`Solana RPC ${method} failed: HTTP ${res.status}`);
    const body = await res.json();
    if (body.error) throw new Error(`Solana RPC ${method} failed: ${body.error.message}`);
    return body.result;
  }

  /** Sum of a wallet's balance of one token, across all its token accounts (works for Token and Token-2022). */
  async function tokenBalance(wallet, mint) {
    const key = `${wallet}:${mint}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < BALANCE_CACHE_MS) return hit.value;
    const result = await rpc('getTokenAccountsByOwner', [wallet, { mint }, { encoding: 'jsonParsed', commitment: 'confirmed' }]);
    let total = 0;
    for (const acc of result.value) total += Number(acc.account.data.parsed.info.tokenAmount.uiAmountString ?? 0);
    cache.set(key, { at: Date.now(), value: total });
    return total;
  }

  let umiPromise = null;
  async function getUmi() {
    if (!umiPromise) {
      umiPromise = (async () => {
        const { createUmi } = await import('@metaplex-foundation/umi-bundle-defaults');
        const { keypairIdentity } = await import('@metaplex-foundation/umi');
        const { mplTokenMetadata } = await import('@metaplex-foundation/mpl-token-metadata');
        const { mplCore } = await import('@metaplex-foundation/mpl-core');
        const umi = createUmi(rpcUrl, 'confirmed').use(mplTokenMetadata()).use(mplCore());
        umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(secret)));
        return umi;
      })();
    }
    return umiPromise;
  }

  async function isCoreAsset(mint) {
    const info = await rpc('getAccountInfo', [mint, { encoding: 'base64' }]);
    return info.value?.owner === MPL_CORE_PROGRAM;
  }

  /** Does the prize wallet currently own this card? */
  async function holdsCard(mint) {
    if (await isCoreAsset(mint)) {
      const umi = await getUmi();
      const { fetchAsset } = await import('@metaplex-foundation/mpl-core');
      const { publicKey } = await import('@metaplex-foundation/umi');
      const asset = await fetchAsset(umi, publicKey(mint));
      return asset.owner.toString() === prizeWallet;
    }
    const result = await rpc('getTokenAccountsByOwner', [prizeWallet, { mint }, { encoding: 'jsonParsed' }]);
    return result.value.some((a) => Number(a.account.data.parsed.info.tokenAmount.amount) >= 1);
  }

  /** Sends one card from the prize wallet to a player. Returns the transaction signature. */
  async function transferCard(mint, to) {
    const umi = await getUmi();
    const { publicKey, unwrapOption } = await import('@metaplex-foundation/umi');
    if (await isCoreAsset(mint)) {
      const core = await import('@metaplex-foundation/mpl-core');
      const asset = await core.fetchAsset(umi, publicKey(mint));
      const collection = asset.updateAuthority.type === 'Collection' ? asset.updateAuthority.address : undefined;
      const res = await core.transferV1(umi, { asset: publicKey(mint), newOwner: publicKey(to), collection }).sendAndConfirm(umi);
      return encode(res.signature);
    }
    const tm = await import('@metaplex-foundation/mpl-token-metadata');
    const da = await tm.fetchDigitalAsset(umi, publicKey(mint));
    const tokenStandard = unwrapOption(da.metadata.tokenStandard) ?? tm.TokenStandard.NonFungible;
    const res = await tm
      .transferV1(umi, {
        mint: publicKey(mint),
        authority: umi.identity,
        tokenOwner: umi.identity.publicKey,
        destinationOwner: publicKey(to),
        tokenStandard,
      })
      .sendAndConfirm(umi);
    return encode(res.signature);
  }

  return { name: `solana:${config.cluster}`, prizeWallet, tokenBalance, holdsCard, transferCard };
}
