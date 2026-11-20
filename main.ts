// Round 2 of the gta6-trophy-guide-01 entry (Node 22, standard library only):
// the guide is this directory's app/ folder, plain static files a browser opens
// at app/index.html (ES modules, CSS, no build step), offline: it loads nothing
// over the network, and its trophy list and guides are app/data/trophies.json.
// The program hands it in: it copies app/ and screenshots/ from beside this
// file to /output and writes /output/dossier.json, the summary the judge reads
// (your screenshots, the first load's files and bytes, and your source), with
// the vendored make.fun library. Leave vendor/makefun-frontend.ts as it is:
// the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// What round 2 adds over round 1: every trophy's guide is now a short
// multi-step guide, and each step names the outlet it comes from (PowerPyx,
// Exophase, Push Square, GTABase), so the app can count cited steps live and
// show how many are backed by two or more sources — 170 cited steps, 56 backed
// by 2+ sources, 4 outlets. Countable trophies carry a tracker (target, label,
// unit) the tracker tab turns into X/Y counters saved in localStorage: 24 of
// them. There is a Sources tab with a source matrix and a missable tab that
// groups timing warnings by chapter and stage. Still fully offline, still no
// build step, still the same 55 trophies and 7-stage roadmap.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
