// All settings come from environment variables (see server/.env.example).
// Defaults are safe for local testing: mock blockchain, devnet, nothing real.

const env = (k, d) => (process.env[k] === undefined || process.env[k] === '' ? d : process.env[k]);
const num = (k, d) => Number(env(k, d));

export const config = {
  port: num('PORT', 8787),

  /** 'mock' (fake chain for testing) or 'solana' (real RPC + real transfers) */
  chain: env('CHAIN', 'mock'),
  /** 'devnet' while testing. Only switch to 'mainnet-beta' when you are ready to send real cards. */
  cluster: env('SOLANA_CLUSTER', 'devnet'),
  rpcUrl: env('SOLANA_RPC_URL', ''),

  /** Mint address of your token. Empty = token gate turned off (testing only). */
  gateMint: env('GATE_MINT', ''),
  /** How many whole tokens a wallet must hold to be eligible. */
  gateMin: num('GATE_MIN', 10000),

  /** Secret key of the prize wallet (base58 string or JSON byte array). Never commit this. */
  prizeWalletSecret: env('PRIZE_WALLET_SECRET', ''),

  /** Long random string used to sign player sessions. */
  sessionSecret: env('SESSION_SECRET', 'dev-only-change-me'),
  /** Password for the admin page. */
  adminPassword: env('ADMIN_PASSWORD', 'dev-admin'),

  /** Websites allowed to call the API (your game's address), comma separated. */
  allowedOrigins: env('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:4173').split(',').map((s) => s.trim()).filter(Boolean),

  dbPath: env('DB_PATH', './data/rewards.db'),

  /** Testing only: multiplies every milestone's waiting time (0 = no wait). Keep at 1 for real use. */
  timeScale: num('MILESTONE_TIME_SCALE', 1),

  /** Safety limits */
  maxWinsPerDay: num('MAX_WINS_PER_DAY', 3),
  maxWinsPerWallet: num('MAX_WINS_PER_WALLET', 1),
};

/**
 * Milestones that can drop a card, in story order. Each wallet gets exactly one
 * roll per milestone, ever. Odds are in percent and grow as the player goes further.
 *
 * `minHours` is anti-cheat: the wallet must have first signed in at least this many
 * hours before it can roll for this milestone, so nobody can fake a full playthrough
 * in five minutes. Tune these to how long the game really takes.
 */
export const MILESTONES = [
  { id: 'badge:BOULDER', label: 'Boulder Badge', odds: 0.5, minHours: 0.5 },
  { id: 'badge:RIPPLE', label: 'Ripple Badge', odds: 0.75, minHours: 1.5 },
  { id: 'badge:SPARK', label: 'Spark Badge', odds: 1, minHours: 3 },
  { id: 'badge:BLOOM', label: 'Bloom Badge', odds: 1.5, minHours: 4.5 },
  { id: 'badge:VENOM', label: 'Venom Badge', odds: 2, minHours: 6 },
  { id: 'badge:MIND', label: 'Mind Badge', odds: 2.5, minHours: 7.5 },
  { id: 'badge:CINDER', label: 'Cinder Badge', odds: 3, minHours: 9 },
  { id: 'badge:FROST', label: 'Frost Badge', odds: 4, minHours: 10.5 },
  { id: 'champion', label: 'Became Champion', odds: 8, minHours: 13 },
];

export function checkConfig() {
  const problems = [];
  if (config.chain === 'solana') {
    if (!config.prizeWalletSecret) problems.push('PRIZE_WALLET_SECRET is required when CHAIN=solana.');
    if (config.sessionSecret === 'dev-only-change-me') problems.push('Set SESSION_SECRET to a long random string.');
    if (config.adminPassword === 'dev-admin') problems.push('Set ADMIN_PASSWORD to something strong.');
    if (!config.gateMint) problems.push('GATE_MINT is empty, so the token gate is OFF. Set it once your token launches.');
    if (config.timeScale !== 1) problems.push('MILESTONE_TIME_SCALE is not 1, so the anti-cheat waiting times are shortened.');
  }
  return problems;
}
