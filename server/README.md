# Wildkin card rewards server

Gives players a rare chance to win a real, graded trading card from [Collector Crypt](https://collectorcrypt.com) when they earn a badge or become Champion.

Collector Crypt cards are tokens on Solana, each backed 1:1 by a real card in their vault. This server holds a few of them in a **prize wallet** and transfers one to a winner's wallet after you approve the win. The winner then redeems the physical card on Collector Crypt themselves (they pay shipping and Collector Crypt's fee).

## How a drop works

1. The player connects a Solana wallet in the game (**Card rewards** in the top bar) and signs a one-time message. That proves they own the wallet; it can't move funds.
2. When they earn a badge or become Champion, the game tells the server.
3. The server checks the wallet holds at least `GATE_MIN` tokens (10,000), then rolls once for that milestone. Odds grow from 0.5% for the first badge to 8% for Champion; edit `MILESTONES` in `src/config.js`.
4. A win reserves a card and appears on the admin page as **Waiting for your approval**. Nothing is sent until you click **Send card**.

### Anti-cheat

The game runs in the browser, so players can edit their saves. The server never trusts the game:

- Each wallet gets **one roll per milestone, ever**, no matter how many saves or replays.
- Milestones must be claimed **in story order**.
- Each milestone unlocks only after **real time has passed** since the wallet first signed in (`minHours`), so nobody can claim a full playthrough in five minutes. Players who connect mid-game just get their rolls as the time passes.
- Caps: `MAX_WINS_PER_WALLET` (default 1) and `MAX_WINS_PER_DAY` (default 3).
- The token gate makes every extra wallet cost money.
- **You approve every win by hand.** Before sending, check things like how old the wallet is and where its tokens came from; many fresh wallets funded from one source is a red flag.

## Run it locally (no blockchain)

Needs Node.js 22.5 or newer.

```bash
cd server
npm test                 # runs the test suite
cp .env.example .env     # CHAIN=mock by default
npm start                # API on http://localhost:8787, admin on /admin
```

Build or run the game with the server's address:

```bash
VITE_REWARDS_API=http://localhost:8787 npm run dev
```

With `CHAIN=mock` every wallet counts as holding 25,000 tokens and transfers are pretend. For quick testing, `MILESTONE_TIME_SCALE=0` removes the waiting times and `MOCK_ROLL=0` makes every roll win. Never use either in real mode.

## Test on Solana devnet (free, fake money)

1. `npm install` (installs the Metaplex libraries used for transfers).
2. `npm run new-wallet` and put the secret in `PRIZE_WALLET_SECRET`. Get free devnet SOL for that address at <https://faucet.solana.com>.
3. Set `CHAIN=solana` and `SOLANA_CLUSTER=devnet`.
4. `npm run mint-test-card -- "Test Card 1"` mints a fake card into the prize wallet. Add it on the admin page with the printed mint address.
5. Leave `GATE_MINT` empty to skip the token check, or create a devnet test token and use its mint.
6. Play, win (temporarily raise an `odds` value to 100 to force it), approve, and confirm the card arrives in the player's wallet on [Solscan (devnet)](https://solscan.io/?cluster=devnet).

## Going live checklist

- [ ] Legal sign-off. Real prizes plus chance plus a purchase requirement (the token) can count as a lottery in many places. Get advice before launch; a free way to qualify is the usual fix.
- [ ] Check Collector Crypt's terms allow using their cards as prizes this way.
- [ ] Use a hosting account you own (not a shared or managed one); the prize wallet key lives there.
- [ ] `SOLANA_CLUSTER=mainnet-beta`, a paid RPC in `SOLANA_RPC_URL`, your token in `GATE_MINT`.
- [ ] Strong random `SESSION_SECRET` and `ADMIN_PASSWORD`; `MILESTONE_TIME_SCALE` unset or 1; no `MOCK_ROLL`.
- [ ] `ALLOWED_ORIGINS` set to your game's real address.
- [ ] Keep only a few cards in the prize wallet at a time. Buy cards on Collector Crypt, send them to the prize wallet, then add them on the admin page (it checks the wallet really holds each one).
- [ ] Test one real transfer to your own second wallet first. The transfer code supports classic NFTs, programmable NFTs and Metaplex Core assets and picks automatically, but it has only been exercised on devnet test cards.
- [ ] Back up `data/rewards.db`; it's the record of who rolled and won.

## Hosting

Any host that runs a Node 22 container with a persistent disk works (Railway, Fly.io, Render, an AWS Lightsail container in your own account). A `Dockerfile` is included:

```bash
docker build -t wildkin-rewards server
docker run -p 8787:8787 --env-file server/.env -v rewards-data:/app/data wildkin-rewards
```

Set the environment variables from `.env.example` in your host's dashboard rather than uploading a `.env` file, and mount a volume at `/app/data`.

## API

| Method | Path | Who | What |
|---|---|---|---|
| GET | `/api/config` | anyone | Odds table and token requirement |
| POST | `/api/auth/challenge` | anyone | `{ wallet }` → message to sign |
| POST | `/api/auth/verify` | anyone | `{ wallet, message, signature }` (base58) → session token |
| GET | `/api/me` | player | Eligibility, rolls, wins |
| POST | `/api/claim` | player | `{ milestones: [...] }` → one roll per new milestone |
| GET | `/admin` | you | Admin page |
| GET | `/api/admin/overview` | you | Everything on the admin page |
| POST | `/api/admin/cards` | you | `{ mint, name, valueUsd }` add a prize card |
| DELETE | `/api/admin/cards/:mint` | you | Remove an unreserved card |
| POST | `/api/admin/wins/:id/approve` | you | Send the card |
| POST | `/api/admin/wins/:id/reject` | you | Reject; card returns to stock |
