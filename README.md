# Exorcise Routine

Your house is haunted. You are extremely buff.

A silly first-person 3D brawler with real physics. Zombies, ghosts, demons and poltergeists break into your house, and you fight back with super strength, thrown furniture and protein shakes. Everything is a weapon, almost everything breaks, and the property-damage receipt keeps a running total.

## Play

Open `index.html` in a desktop browser (Chrome, Edge or Firefox). It needs a keyboard and mouse and an internet connection, because three.js, cannon-es and the fonts load from CDNs.

If your browser blocks the page when opened as a file, serve the folder instead:

```bash
python -m http.server 8000
```

Then open http://localhost:8000. The page also works as-is on GitHub Pages.

## Controls

| Input | Action |
| --- | --- |
| W A S D | Move |
| Mouse | Look around (click to lock the mouse) |
| Left click | Punch (hold for a flurry), or swing / eat what you're holding |
| Right click | Uppercut, or throw what you're holding |
| E | Grab or drop almost anything, including enemies |
| Q | Super Stomp when the meter is full |
| Shift | Sprint |
| Space | Jump |
| M | Mute |
| Esc / P | Pause |

## What's in it

- **Physics everywhere** ([cannon-es](https://github.com/pmndrs/cannon-es)). Punched enemies ragdoll into furniture, bowl over other enemies and splat against walls.
- **Around 90 breakable props**: windows, doors, a piano that plays notes when hit, a fish tank (the fish flop), a toilet geyser, propane tanks and a station wagon that explode, and more.
- **Grab anything**: lift the fridge or the car overhead, or pick up a zombie and use it as a club.
- **Enemies**: zombies climb through windows, ghosts float through walls, demons pounce, and poltergeists throw your furniture at you. Big Gary arrives on wave 5 and Lord Brimstone on wave 10. Waves keep going after that.
- **Stats and upgrades**: HP, STR, SPD, ARM (throw power), DEF and levels. Snacks around the house and enemy drops boost them: Protein Shake, Triple Espresso, Cold Pizza, Ghost Pepper Sauce (fire fists), Canned Spinach (giant fists), Garlic Bread, Pre-Workout, Whole Milk and a Rubber Duck (quack mode).
- **Comic presentation**: POW/BONK/YEET text, freeze-frames and slow motion on big hits, screen shake, enemy speech bubbles, combo ranks, and synthesized sound effects and music (Web Audio, no audio files).
- Between waves, "insurance" replaces the furniture you broke so you can break it again.

## Project layout

The game is plain JavaScript split into parts that are concatenated into one page. All `.js` parts share a single module scope.

| File | Contents |
| --- | --- |
| `src/00_head.html` | Title, styles, HUD and screen markup, import map |
| `src/01_core.js` | Renderer, scene, physics world, shared helpers |
| `src/02_audio.js` | Synthesized sound effects and music |
| `src/03_fx.js` | Particles, impact stars, comic pops, speech bubbles, toasts |
| `src/04a_propdefs.js` | Furniture and item definitions built from simple shapes |
| `src/04b_props.js` | Spawning, damage, breaking, debris, loot |
| `src/05_house.js` | Walls, rooms, windows, navigation, yard, furniture layout |
| `src/06_enemies.js` | Enemy models, AI, ragdoll launches, grabbing |
| `src/07_player.js` | Controls, fists, punching, grab/throw, stats and upgrades |
| `src/08_main.js` | Explosions, waves, HUD, screens, main loop |
| `src/99_tail.html` | Closes the script, load-failure fallback |

## Building

After editing anything in `src/`, rebuild `index.html`:

```bash
sh build.sh
```

The script also runs a syntax check if Node.js is installed.

## Debugging

The game exposes `window.__game` in the browser console. For example, `__game.spawnEnemy('gary', 0, 5)` spawns a boss, and `__game.player.stomp = 100` fills the stomp meter.

## Built with

- [three.js](https://threejs.org/) 0.160.0
- [cannon-es](https://github.com/pmndrs/cannon-es) 0.20.0
- Google Fonts: Creepster, Bangers, Barlow Condensed
