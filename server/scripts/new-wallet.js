// Creates a fresh prize wallet. Prints its public address and the secret key to
// put in PRIZE_WALLET_SECRET. Store the secret somewhere safe; anyone who has it
// controls every card in the wallet.
import crypto from 'node:crypto';
import { encode } from '../src/base58.js';

const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
const seed = Buffer.from(privateKey.export({ format: 'jwk' }).d, 'base64url');
const pub = Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url');
console.log('Prize wallet address (send cards here):');
console.log('  ' + encode(pub));
console.log('\nPRIZE_WALLET_SECRET (keep private!):');
console.log('  ' + encode(Buffer.concat([seed, pub])));
console.log('\nFor devnet testing, get free test SOL at https://faucet.solana.com');
