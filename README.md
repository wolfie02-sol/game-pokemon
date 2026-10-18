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
- 29 maps: 4 towns, 5 routes, a cave, a two-floor villain tower, 3 gyms, HAVENs (healing), MARKETs (shops), houses, a museum, a lab and Summit Hall.
- Seamless edge connections between outdoor maps, door and mat warps, ledges, tall grass with sway overlay, running, NPC wandering, signs, item pickups.
- 37 original Wildkin across 12 types, with evolutions, level-up learnsets and a legendary encounter.
- Turn-based battles: physical/special/status moves, STAB, type chart, crits, accuracy, priority, stat stages, burn/poison/paralysis/sleep/freeze, flinch, drain, recoil, switching, items, running, trainer AI (smart trainers also use potions), experience sharing, level-up stat screen, move learning, post-battle evolution with cancel.
- Catching with three pod grades and a shake-based catch formula, nicknames, 6-member party plus LINK TERMINAL storage (withdraw, deposit, release).
- 30+ trainers with line-of-sight challenges, 3 gym leaders, the Hollow Order story arc, three rival battles, the Champion, credits and post-game.
- START menu: Wildex (seen/caught with dex entries), Party (summary, reorder), Bag (use/toss), Journal (current goal, badges, time), Save, Options (text speed, music, sound, battle animations).
- Save/continue via localStorage; whiteout returns you to the last HAVEN.
- WebAudio chiptune soundtrack (11 tracks) and synthesized sound effects, with a mute button.

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
