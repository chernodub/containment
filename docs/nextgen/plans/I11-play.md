# I11 real campaign fight-flow evidence

The existing native runner accepts the optional `--storyboard-room=awakening-bay`.
It registers the existing entry and actual clear captures and saves one additional
read-only observation after existing steps whenever the room clock crosses another
0.5 simulated seconds. It never releases input, advances a tick, changes policy,
changes camera, injects health/damage or alters a live ability. All normal per-tick
rendering, native inputs, receipts and campaign guards remain. The flag rejects
fast draw decimation and passive realtime mode; ordinary runs without it retain
the previous screenshot cadence.

Example frozen campaign (parent owns browser scheduling):

```sh
npm run playtest -- --rig=arc --seed=1729 --label=i11-arc-1729 --dist-dir=artifacts/nextgen/i11/frozen-dist --storyboard-room=awakening-bay
```

After four campaigns, assemble without a browser:

```sh
node scripts/nextgen/i11-play-storyboards.mjs artifacts/nextgen/final5/play artifacts/nextgen/playtest/i11-breacher-1729 artifacts/nextgen/playtest/i11-cryo-1729 artifacts/nextgen/playtest/i11-pyro-1729 artifacts/nextgen/playtest/i11-arc-1729
```

The assembler requires seed1729, unassisted ordinary fixed-clock rendering,
nonlegacy story rooms, matching application assets/source, a proven room clear,
and at least ten distinct actual fight observations with native firing and a live
population. It selects entry + ten ordered distributed fight frames + clear. It
fails on missing/short/incomplete evidence instead of repeating frames. Partial
rig assemblies are allowed for smoke diagnostics and explicitly list missing rigs;
the full acceptance report must require all four.

Each rig gets twelve unchanged native1920×1080 PNGs and snapshots, exact-area480×270
reductions and a1920×912 storyboard. `manifest.json` preserves source PNG/snapshot
hashes, source report SHA, clocks, remaining population, authoritative stats,
ability state, native input/held controls, framing and outcome/defect receipts.
Campaign source directories remain unchanged. CPU fixed-step timings are never
hardware FPS evidence. PNG generation is preparation, not an actual-open witness.

Focused pure selection tests prove endpoints, order, uniqueness, nonmutation,
short-fight rejection, foreign-clear rejection, duplicate-clock rejection and
native firing coverage. Browser smoke/full campaigns are deferred to the parent,
who controls the single-browser benchmark and at-most-two-browser campaign schedule.

I11 smoke provided13 observations over11.75 simulated seconds. Final capture sampling is every0.5 simulated seconds to retain at least ten distinct fight observations even when a rig clears the room faster; this remains read-only and advances no extra simulation.
