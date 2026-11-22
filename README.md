[![best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/Azet17/makefun-best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/Azet17/makefun-best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# Vesper — The Meridian Job

An original 2D canvas heist game, built for the make.fun bounty
**best-heist-game-20261122-0559** ("Make the best heist game").

You are Vesper, a thief crossing one room at a time. Guards patrol with
sweeping vision cones, wall cameras watch the gaps, and one glittering piece
sits on a pedestal in the middle of each room. Lift it, then reach the
getaway door — which only opens once the piece is in hand. Every tool costs
heat, and heat feeds the alarm meter: at 100%, the job is blown.

## How to play

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome, for example:

```sh
cd game
python3 -m http.server 8080
# open http://localhost:8080/
```

No build step, no network requests, no assets to download — every script is
a file under `game/`, and every sound is synthesized with WebAudio.

- **WASD / arrows** — move
- **E (hold)** — lift the loot off its pedestal
- **1 / 2 / 3** — pick a tool (noise-maker / EMP / smoke)
- **Click** — throw the selected noise-maker at that spot
- **Space** — use the selected tool (EMP / smoke)
- **M** — mute · **Esc** — pause · **R** — retry a blown room

## The rooms

1. **The Meridian Gallery** — the Star of Meridian. One partition wall with
   three gaps: a tight vent (left), the patrolled main gap (centre), and a
   service gap under a camera (right). Two guards, two cameras.
2. **The Vault Floor** — the Duchess Tear. A cross-shaped partition, three
   guards, three cameras.
3. **The Crown Chamber** — the Meridian Crown. Four guards, four cameras,
   no dead ground.

## Systems

- **Vision cones** (`src/vision.js`, `src/guards.js`, `src/cameras.js`) —
  cone + line-of-sight checks against walls and pillars; suspicion fills
  faster up close, decays when the thief is hidden.
- **Alarm meter** (`src/alarm.js`) — 0–100 with calm / wary / hunt stages;
  cameras and certain guards push it up, it drains slowly while nobody sees
  you, every tool adds heat.
- **Tools at a cost** (`src/tools.js`) — noise-maker (lures guards to a ping),
  EMP (cameras dark 10 s), smoke (unseen 4 s). Limited uses, plus heat each.
- **Loot & getaway** (`src/loot.js`) — hold E to lift the piece (loud: the
  nearest guard investigates), then the door opens and the run pays off.
- **Rendering** (`src/render.js`) — a night-museum look: marble floor,
  crimson runner, gold-trimmed cases; amber patrol cones, red alert cones,
  gold loot, teal thief. The HUD (alarm meter, loot, tools, timer) is drawn
  on the canvas so every screenshot carries it.
- **Sound** (`src/audio.js`) — synthesized WebAudio blips, chimes and stings;
  no audio files.

## Layout

```
main.ts                 entrypoint: copies game/ + screenshots/ to /output
                        and writes dossier.json (buildDossier)
vendor/makefun-game.ts  the kit's dossier library, unchanged
game/index.html         the page
game/src/main.js        boot, screen state machine, per-frame update
game/src/levels.js      the three rooms (walls, guards, cameras, loot, exit)
game/src/vision.js      cones, line of sight, segment geometry
game/src/guards.js      patrol / investigate / chase
game/src/cameras.js     sweeping wall cameras, EMP offline state
game/src/alarm.js       the 0–100 alarm meter and its stages
game/src/loot.js        the pedestal grab and the getaway door
game/src/tools.js       noise-maker, EMP, smoke
game/src/input.js       keyboard + mouse
game/src/audio.js       synthesized WebAudio effects
game/src/state.js       the thief (movement + collision) and shared state
game/src/render.js      all canvas drawing, HUD and screens
screenshots/            real renders of the game in a desktop browser
```

## Screenshot scenes

`?shot=cover`, `?shot=play`, `?shot=caught`, `?shot=win` stage real game
states for screenshots (the same code renders them during play): the cover
shows the whole room — thief, guards and cones, cameras, loot, alarm meter —
in one frame.

## License

MIT — see LICENSE. Copyright (c) 2026 Azet17.
