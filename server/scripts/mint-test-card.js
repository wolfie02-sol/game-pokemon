// Devnet only: mints a fake "card" NFT into the prize wallet so you can test the
// whole flow without real cards. Usage: npm run mint-test-card -- "Test Card #1"
import { config } from '../src/config.js';
import { parseSecret } from '../src/chain/solana.js';
import { encode } from '../src/base58.js';

if (config.cluster !== 'devnet') {
  console.error('This script only runs on devnet.');
  process.exit(1);
}
const name = process.argv[2] || 'Test Card';
const { createUmi } = await import('@metaplex-foundation/umi-bundle-defaults');
const { generateSigner, keypairIdentity, percentAmount } = await import('@metaplex-foundation/umi');
const { createNft, mplTokenMetadata } = await import('@metaplex-foundation/mpl-token-metadata');
const umi = createUmi(config.rpcUrl || 'https://api.devnet.solana.com').use(mplTokenMetadata());
umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(parseSecret(config.prizeWalletSecret))));
const mint = generateSigner(umi);
const res = await createNft(umi, { mint, name: name.slice(0, 32), uri: 'https://example.com/test-card.json', sellerFeeBasisPoints: percentAmount(0) }).sendAndConfirm(umi);
console.log('Minted', name);
console.log('  mint:', mint.publicKey.toString());
console.log('  tx:  ', encode(res.signature));
console.log('Add it on the admin page with that mint address.');
