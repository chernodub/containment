# Stream B10 — Balance for humans, not for the bot

You are the **combat balance lead**. Read `AGENTS.md` (no tests; verify by building and playing), `docs/nextgen/00-VISION.md`,
`docs/nextgen/01-ENGINEERING.md`, `docs/nextgen/streams/M10-attacks-and-amplitude.md` and `docs/nextgen/M10-REPORT.md`
(section "Balance rescue") first.

## The problem

M10 replaced contact damage with telegraphed melee strikes (good). To hit a 45–65% bot completion target it then raised
Crawler/Stalker strike damage to **78/80 of 100 health**, because the bot dodges almost every strike (Brute and Carrier
connect 0% of the time; median hits in the first five rooms are zero). The result is tuned to kill a superhuman bot
with rare one-shot spikes. For a person it is the worst of both worlds: a 180 ms swarmer wind-up nobody can react to,
that removes most of the health bar. That is not shippable.

## What to deliver

1. **A human-limited bot.** Give the playtest policy explicit human limits, as parameters with documented defaults:
   reaction latency to a newly visible telegraph (default 260 ms, ± 70 ms seeded jitter), a per-telegraph miss chance
   that grows with the number of simultaneous threats on screen, aim error and tracking lag, input rate limits, no
   frame-perfect dashes (dash commits ≥ 120 ms before the strike or not at all), imperfect kiting (does not hold the
   exact reach boundary). Three skill profiles: `novice`, `competent` (default for balance), `expert`. Everything
   seeded and deterministic. The bot still reads only what a player can see.
2. **Sane attack values, set by design first** (then tuned within these bounds only):
   | Family | Wind-up ms | Damage (of 100) | Notes |
   |---|---|---|---|
   | Crawler (swarmer) | 280–340 | 8–14 | pressure by numbers, never by spike |
   | Stalker | 400–480 | 18–26 | long pounce line, long recovery |
   | Brute | 600–750 | 30–42 | wide arc, the one big hit to respect |
   | Spitter melee | 350–450 | 8–12 | its ranged shot stays the threat |
   | Carrier | 600–700 | 16–22 | |
   No ordinary attack may remove more than 45% of base health; remove the "scaled cap 90" mechanism. Elites may be
   faster or stronger by a stated factor (≤ 1.35×).
3. **Difficulty from composition and cadence, not damage spikes.** If the competent profile completes too often with
   sane values, tune in this order: enemy attack cadence/rest and simultaneous-wind-up limits → engage aggression and
   flanking (enemies spread around the marine instead of queueing) → wave composition/elite frequency in later rooms →
   healing economy. Player stats and ability numbers stay unless something is plainly broken.
4. **Targets** (competent profile, 20 seeds × 4 rigs): campaign completion 35–55%, every rig ≥ 25%; novice 5–20%;
   expert ≥ 75%. Damage taken should be a steady stream of small hits with occasional big ones: in rooms 1–5 the
   competent bot should take 2–6 hits per room (median), not zero. Median time-to-death after the first hit in a lost
   room ≥ 20 s (no burst deaths from full health). Transmission holdout median 60–75 s.
5. **Feel check in real play**: run native campaigns (`npm run playtest -- --rig=<id> --seed=1729`) with the competent
   profile for all four rigs, save storyboards, and look at them: a crawler pack should read as rhythm (wind-ups
   staggered, visible, dodgeable), a Brute swing as an event.

## Rules

- You own enemy attack tuning under `src/game/**` (attack tables, slot/cadence logic, wave composition) and the bot
  policy and sim tools under `scripts/nextgen/playtest/**`. Do not touch render, UI, world or motion files; if a
  telegraph needs to look different, write it under "Integration requests".
- Iterate with quick cohorts (10 seeds × 4 rigs), confirm once with 20 × 4 per profile. No audit paperwork: one
  iteration table in the report. Deterministic simulation and save compatibility by construction.
- No tests. `npm run build` must pass. Do not use computer-use tools. Commit on your worktree branch, clean tree,
  no push. Converge when the targets hold; if a target cannot be met with sane values, say so plainly and stop.

## Report

`docs/nextgen/B10-REPORT.md`: final attack table, bot profile parameters, iteration table, per-profile results, hit
histograms for rooms 1–5, and what still feels wrong.
