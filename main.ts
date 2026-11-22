// main.ts — the entrypoint for "Vesper: The Meridian Job".
//
// Copies the static game (game/) and the screenshots (screenshots/) into the
// output directory and writes /output/dossier.json with buildDossier from
// vendor/makefun-game.ts, exactly as the bounty requires.
//
// Node 22+, standard library only, no network. Run it from the repository
// root: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`. Outside the
// grader, MAKEFUN_OUTPUT_DIR stands in for /output; without it, /output is
// used. Both runs must write the same bytes — this program is deterministic:
// it copies files in a fixed order and the dossier is canonical JSON.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });

// The whole game, as static files: index.html plus every script under src/.
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
// The screenshots: real renders of the game running in a desktop browser.
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

// The dossier: byte for byte what the scorer rebuilds from the same files.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
