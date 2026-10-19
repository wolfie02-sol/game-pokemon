# Browser tests

End-to-end checks that drive the real game in headless Chromium through `window.__wildkinDebug`.

1. `node scripts/build-local.mjs`
2. `cd dist-local && python3 -m http.server 4173`
3. `node tests/e2e/story.mjs` (or any other file here)

Each script prints PASS/FAIL lines and any page errors. Screenshots go to `tests/e2e/shots/` (git-ignored).
`lib.mjs` loads Playwright from `/opt/npm-tools`; change the import there if Playwright lives elsewhere.
Note: build without --min first; tests read scene class names, which minification renames.

`./runall.sh` runs every suite and prints a pass/fail line per suite. New in this round:
- `p1.mjs`: autosave (idle save, milestones, tab hidden, reload, reopen, storage failure, off switch, old saves) and crash recovery.
- `mobile.mjs`: iPhone-sized portrait/landscape layouts and real touch input.
- `systems.mjs`: selling, PC withdraw, repel, escape rope, TMs.

# Playthrough bot

`tests/bot/bot.js` plays a save using only the on-screen buttons (it reads the game state to decide, never writes it).
`node tests/bot/run.mjs [--starter SPLASHEL] [--continue] [--out dir]` runs it against :4173 and logs progress,
screenshots at each badge, and a JSON dump of events, dialogue prompts and issues. `tests/bot/notes/phase1.md` lists what it found.

## Difficulty checks

- `node tools/run.mjs tests/unit/balance.ts` (no browser): the exp formula, catch-up share tiers, legal boss move sets,
  and boss ace levels staying in their bands and in story order.
- `node tests/e2e/exp.mjs`: exp sharing in real battles (fighters split, lagging bench catches up, level-matched bench gets nothing).
- Bot play styles: `--policy normal|minimal|typesmart|carry|rotate|underlevel|all` and `--stop champion` or `--stop badgesN`.
  Each boss fight prints a `BOSS` line (boss levels, team levels, result, wild and grind battles since the last boss).
  Results from the rebalance runs are kept in `tests/bot/balance/`.
- `node tools/run.mjs tools/bosssim.ts [offset] [trials]`: rough simulated win rates per boss. A guide only; real runs decide.
