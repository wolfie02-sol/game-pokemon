# Wildkin: Ember Edition

An original, handheld-style monster-catching RPG that runs in the browser. The presentation (dark full-viewport page, a large pixel-perfect game screen, an on-screen D-pad with A/B/START/SELECT, unobtrusive guide links below) follows the structure of claudered.dev, while every creature, map, sprite, tune, name and line of dialogue is original.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Two interfaces, one game

The page detects the device and shows the right interface. Both share the same engine, world, battles and save data.

- **Phones and tablets (touch):** a virtual handheld. The screen sits on top with a D-pad on the left, A/B on the right and START/SELECT below the screen. Holding a direction keeps walking, sliding your thumb changes direction without lifting, and buttons give a small haptic tick where supported. Page scrolling, zooming and text selection are blocked over the controls. In landscape the controls flank the screen and the top bar hides on short screens. Safe areas (notches, home indicator) are respected. You can also tap menu items directly on the screen.
- **Computers (keyboard and mouse):** a large centered screen with keyboard controls. Menus, dialogue choices, the bag, party, shop, storage, Wildex and options can be clicked, the wheel scrolls lists, and right-click goes back. A Menu button and a key-hint line sit under the screen.

Switch interface at any time in **Controls & saves** (gear icon) or in the in-game **OPTIONS > CONTROLS**.

The canvas is scaled so each game pixel covers a whole number of device pixels (integer steps on 1x screens, half steps on 2x, thirds on 3x), so the art stays sharp on every screen.

## Controls

| Action | Keyboard | Touch | Mouse |
| --- | --- | --- | --- |
| Move | Arrow keys / WASD | D-pad | |
| A: talk, confirm | Z / Enter / Space | A | Click a menu item or dialogue |
| B: cancel, hold to run | X / Esc / Backspace | B | Right-click |
| START: menu | M / Shift (rebindable) | START | Menu button |
| SELECT | N (rebindable) | SELECT | |
| Scroll lists | Up / Down | D-pad | Mouse wheel |

START and SELECT can be rebound in **Controls & saves**. Game keys are only captured while the game screen is in view, so the page scrolls normally when you read the guide below it.

## Saves

Progress is saved in the browser's local storage from the START menu. **Controls & saves** can copy your save as a text code and import one, so you can move an adventure between a phone and a computer.

## Dialogue

All text boxes use one sentence-aware paginator (`src/game/core/paginate.ts`): a page holds whole sentences only, sentences share a page while they fit in the standard 3-line box, and a sentence longer than that gets a taller box instead of being split. A new speaker starts a new page. `npm test` checks those rules against every dialogue string in the game.

## What's in the game

- Title screen, professor intro, player and rival naming.
- The region of Varrow: 11 settlements, 25 routes and 121 maps in all, including Thicket Woods, Whisper Cave, Burrow Tunnel, Gloom Tunnel, the Stormworks power plant, the Bell Tower, the Astra Observatory, the arcade hideout, the Wildlands Park, the Frostdeep Isles, a burnt manor, the Ember Caldera, Victory Cave and the post-game Rift.
- 151 original Wildkin across 15 types (Beast, Flame, Tide, Leaf, Volt, Frost, Brawl, Toxin, Earth, Gale, Mind, Swarm, Stone, Shade, Wyrm) with a full matchup chart, level and shard evolutions (one Wildkin branches three ways), and every species obtainable in a single save.
- 165 moves: physical or special by type, STAB, crits, accuracy and evasion, priority, stat stages, burn, poison, bad poison, paralysis, sleep and freeze, confusion, flinching, multi-hit moves, fixed damage, draining seeds, binding, screens, haze, rest, recoil, recharge and self-destructing moves.
- 8 gyms (Stone, Tide, Volt, Leaf, Toxin, Mind, Flame, Frost), the Elite Four and the Champion, seven rival battles and the Hollow Order story arc, plus about 175 trainers in total.
- Field items that open the world: Hedge Shears (trim hedges), Driftboard (ride across water), Rock Pick (break cracked boulders), Fishing Rod, Sky Whistle (fly to visited towns), Spectral Lens and Dawn Chime.
- 30 TMs, evolution shards, fossil revival, gift Wildkin and three legendary birds.
- Catching with four pod grades and a shake-based catch formula, nicknames, a 6-member party plus LINK TERMINAL storage.
- START menu: Wildex (seen/caught, dex entries and where to find unseen Wildkin), Party, Bag, Journal (current goal, all eight badges), Save, Options.
- Save/continue via localStorage, save codes for moving between devices.
- WebAudio chiptune soundtrack (16 tracks) and synthesized sound effects, with a mute button.

## Card rewards (optional)

The game can give players a rare chance to win a real Collector Crypt trading card by beating CARD CHALLENGES: rematches against gym leaders, the Elite Four and the Champion, with teams that scale to the player's level, up to 5 a day. It's off unless you build with the reward server's address:

```bash
VITE_REWARDS_API=https://your-rewards-server.example npm run build
```

With it set, a **Card rewards** button appears in the top bar where players connect a Solana wallet. The server, admin page, anti-cheat rules and setup steps are in [`server/README.md`](server/README.md).

## Project layout

```
src/
  App.tsx, main.tsx, styles.css     React shell: page layout, scaling, on-screen controls, guide sections
  components/                       D-pad, buttons, Wildex roster
  game/
    core/      game loop, scene stack, input, bitmap font, drawing helpers, audio synth, RNG
    art/       procedural tiles, character sprites, creature sprite generator
    data/      types chart, moves, species, items, trainers
    systems/   creature stats/exp, battle math, game state, save/load
    scenes/    title, overworld, dialog, battle, menus, shop, storage, evolution, ending
    world/     map builder helpers, every map and story script
```

The engine is plain TypeScript drawing to a 160x144 canvas (scaled with `image-rendering: pixelated`). React only owns the surrounding page and talks to the game through the `Game` object.
