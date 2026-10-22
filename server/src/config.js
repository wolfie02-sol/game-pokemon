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

  /** Card battles each wallet may start per day (every attempt counts, win or lose). */
  battlesPerDay: num('BATTLES_PER_DAY', 5),
  /** The day resets at midnight in this time zone. */
  timeZone: env('DAY_TIME_ZONE', 'America/Toronto'),
  /** A won battle only counts if it lasted at least this long (anti-cheat). Testing can set 0. */
  minBattleSeconds: num('MIN_BATTLE_SECONDS', 45),
  /** A battle must be finished within this many minutes of starting. */
  maxBattleMinutes: num('MAX_BATTLE_MINUTES', 60),

  /** Safety limits */
  maxWinsPerDay: num('MAX_WINS_PER_DAY', 3),
  maxWinsPerWallet: num('MAX_WINS_PER_WALLET', 1),
};

/**
 * The card bosses: rematches of the gym leaders, Elite Four and Champion.
 * `odds` is the base chance (in percent) of a card for winning the rematch.
 * Later bosses have better odds; the player's level adds a bonus on top (see ODDS).
 */
export const BOSSES = [
  { id: 'g1', label: 'Garrick (Brindle Gym)', odds: 0.1 },
  { id: 'g2', label: 'Nerissa (Ripple Gym)', odds: 0.15 },
  { id: 'g3', label: 'Cass (Spark Gym)', odds: 0.2 },
  { id: 'g4', label: 'Mossa (Bloom Gym)', odds: 0.3 },
  { id: 'g5', label: 'Silas (Venom Gym)', odds: 0.4 },
  { id: 'g6', label: 'Orin (Mind Gym)', odds: 0.5 },
  { id: 'g7', label: 'Vulk (Cinder Gym)', odds: 0.6 },
  { id: 'g8', label: 'Isolde (Frost Gym)', odds: 0.75 },
  { id: 'e4_1', label: 'Thorne (Elite Four)', odds: 1 },
  { id: 'e4_2', label: 'Wren (Elite Four)', odds: 1.1 },
  { id: 'e4_3', label: 'Morrigan (Elite Four)', odds: 1.2 },
  { id: 'e4_4', label: 'Vesper (Elite Four)', odds: 1.3 },
  { id: 'champ', label: 'Elowen (Champion)', odds: 1.5 },
];

export const ODDS = {
  /** Extra chance (percent) per level of the player's strongest Wildkin. Level 50 adds 1%. */
  perLevel: 0.02,
  /** Highest level the game allows; reported levels above this are ignored. */
  maxLevel: 100,
  /** No battle ever has a better chance than this (percent). */
  cap: 3,
};

/** Chance (percent) of a card for beating `boss` with a team whose best Wildkin is `level`. */
export function oddsFor(boss, level) {
  const lv = Math.max(1, Math.min(ODDS.maxLevel, Math.floor(Number(level) || 1)));
  return Math.round(Math.min(ODDS.cap, boss.odds + lv * ODDS.perLevel) * 100) / 100;
}

export function checkConfig() {
  const problems = [];
  if (config.chain === 'solana') {
    if (!config.prizeWalletSecret) problems.push('PRIZE_WALLET_SECRET is required when CHAIN=solana.');
    if (config.sessionSecret === 'dev-only-change-me') problems.push('Set SESSION_SECRET to a long random string.');
    if (config.adminPassword === 'dev-admin') problems.push('Set ADMIN_PASSWORD to something strong.');
    if (!config.gateMint) problems.push('GATE_MINT is empty, so the token gate is OFF. Set it once your token launches.');
    if (config.minBattleSeconds < 30) problems.push('MIN_BATTLE_SECONDS is very low, so faked battles are easier.');
  }
  return problems;
}
