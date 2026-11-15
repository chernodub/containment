# U9 — combat editing, build vocabulary and rig identity

Branch `t3/combat-hud-rig-ui`. Application freeze `63cfd8c` (full SHA in
`artifacts/nextgen/u9-work/accepted-v2-dist/SOURCE_SHA`); final delivery HEAD is in the
handoff. Local commits only; no push or PR. No simulation, renderer, room layout,
asset, placement-preview call-site or dependency changes. Original SVG artwork
remains MIT. No computer-use tools, phone controls or phone captures were used.

## What changed

- **F10:** the combat column shows sector/name, remaining hostiles, one short
  objective and essential passenger/authorization/fatal warnings. Room entry,
  story milestones, Tab and Alt cannot expand narrative into combat. Changed
  builds reveal their chips for two seconds, then collapse. Credits remain in
  Pause and safe economy screens. Diagnostic Gallery and Safety Interlock say
  “details after clear.” A native clear boundary reveals the exact story as a
  skippable record above reward/route controls; the exact objective and full
  situation remain in its disclosure. Pause retains current and earlier records,
  including skipped dialogue and restored Continue runs. Reading never changes
  native completion, saves, resources, routing or destruction authorization.
- **F11:** shared `effectChip` / `setChip` rendering supplies explicit elemental
  Effect and neutral Set chips in boon/augment drafts, loadout, temporary HUD
  reveals and debrief. Set progress caps at the three-boon threshold and marks an
  active bonus. Set glyph, border, background and text are the same neutral
  treatment across all effects. Duplicate effect identities collapse within a HUD
  set reveal. The first safe cross-family draft explains “Effect tells you what
  a boon does. Set counts toward a three-boon bonus. Fire can belong to the
  Reactor set.” Acknowledgment persists in a separate UI preference, not a save.
- **F12:** the common marine keeps its helmet and inked material language, with
  an asymmetric Breacher ram plate, single raised Cryo coolant vessel/hose/vent,
  Pyro twin fuel tanks/fins/nozzle and Arc open coils/unequal antenna masts.
  Slight stance changes preserve identity. Physical forms mirror K7 equipment;
  the rig ability diagrams and selection behavior remain. The equal-scale
  silhouette sheet removes energy/vapor/ink and uses solid black physical fills.
- **Regression:** safe screens were edited to retain all actions and counters at
  720p. The archive groups earlier entries; the shop record spans both columns;
  the opened debrief keeps its original telemetry hierarchy with compact labelled
  boon rows. No behavioral assertion was removed.

## Before / after evidence

All paths below are absolute. Native captures have exact area-weighted 480×270
PNG companions under the corresponding `review480/` directory; `receipts.json`
rehashes source/reduction bytes. The two final galleries use the same frozen
application assets. Each has 22 guarded states, zero failures and zero browser
errors. Source in `u9-before` / `u9-before-additional` is the unchanged `7ceefa5`
production build. Combat staging uses normal room/grant/fire methods; it is not a
campaign or hardware timing claim.

| Item | Before native PNG | After native PNG |
|---|---|---|
| F10 settled Diagnostic combat | `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-before-additional/u9-combat-settled-diagnostic-gallery.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-final/u9-combat-settled-diagnostic-gallery.png` |
| F10 clear service record | `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-before-additional/u9-before-clear-diagnostic-gallery.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-final-720/u9-clear-diagnostic-gallery.png` |
| F10 Pause archive | `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-before-additional/u9-before-pause-diagnostic-gallery.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-final-720/u9-pause-records-diagnostic-gallery.png` |
| F11 starting boon | `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-before/starting-boon.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-final-720/starting-boon.png` |
| F11 loadout | `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-before/pause-loadout.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-final-720/pause-loadout.png` |
| F12 four black outlines | `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-before-additional/u9-silhouette-sheet.png` | `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-final/u9-silhouette-sheet.png` |

Also inspect these native final frames:

- `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-final-720/augment-draft.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-final-720/u9-results-build.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-final-720/u9-clear-safety-interlock-station.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-final-720/u9-combat-manual-control-chamber.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-final-720/u9-combat-overload-floor.png`

Both `u9-final/review480/contact.png` and
`u9-final-720/review480/contact.png`, the exact 480 silhouette sheets, and the
native high-risk combat/clear/Pause/draft/debrief PNGs were actually opened.
Largest captured combat-column area, including the temporary build reveal:
**2.526% at 1920×1080; 5.683% at 1280×720**, below 10%. The browser contract also
checks all twenty story-room columns at both native sizes and zoomed desktop CSS
viewports, with the original opaque critical-number backing retained.

## Story preservation and test changes

`src/ui/storyPresentation.test.ts` iterates all twenty authored story rooms and
asserts every exact `objective` and optional `story` string in clear records and
Pause. It also checks full status, no record during combat, no future archive
leak, no unfought clear record, retained prior service/safety evidence and the
passenger / NOT-armed / fatal warnings. The catalog and game story strings were
not edited. These decisive strings still appear verbatim after clear and in
Pause:

> PHYSICAL SERVICE DISPLAY: Purge destroys every deck, including occupied cryopods.

> LOCAL RECORD, BEFORE AWAKENING: Rescue impossible. AI acknowledged. Survival promise issued afterward.

`src/ui/boonChips.test.ts` checks every catalog boon/augment at 0, 2, 3 and 8 owned
set members, both chip labels, elemental identity, neutral markup and bounded
progress. It also tests acknowledgment/storage failure. Portrait tests retain
safe SVG/accessibility and common-marine contracts while checking physical
modules and pose differentiation.

Presentation pins rewritten:

1. `tests/HudSystems.test.ts`: held Tab/Alt formerly reopened room narrative;
   now the same inputs retain compact combat objectives while weapon/ability
   inspection and unchanged health/charges/position remain asserted.
2. Its Annulus warning adds “PASSENGERS ALIVE.” to the original NOT-armed warning;
   the former 14% column limit is strengthened to 10%. New coverage checks all
   twenty rooms at desktop and zoom sizes and the two-second changed-set reveal.
3. `tests/UiScreens.test.ts`: the old `family-progress` / “Reactor family” pin
   becomes explicit neutral “Set · Reactor 0/3.” Six added zoom cases exercise
   both chips, matching neutral computed colors, lesson acknowledgment/focus,
   Skip/focus restoration, verbatim Pause records and native Resume.
4. `tests/HudHarness.ts`: inactive build inventory and hidden narrative status
   are omitted from visible-surface placement/pointer checks. The new live test
   explicitly asserts their intended hidden state and timed reveal; essential
   visible controls, critical values, no-overlap and input guarantees remain.
5. The capture's three named augment requirements are scoped to `.pause-panel`;
   its previous global selector could select the intentionally collapsed HUD
   duplicate before the actual visible loadout entry. All three visible-boon
   assertions remain.

Three critique/fix rounds are documented in `plans/U9.md`. Failed raw runs remain
separate and unmodified. Successful intermediate PNG cleanup is recorded in the
local compaction receipt; baseline, accepted final and native bot evidence remain.

## Gates and native play

All requested JavaScript/browser gates passed. `gates.json` and per-command logs
are under `artifacts/nextgen/u9-work/`. The one-worker aggregate repeat keeps its
browser fixtures serialized; the standalone Vitest command uses the requested
worker cap plus `--no-file-parallelism`.

```text
npx vitest run --exclude scripts/cryo-model-preview.test.mjs: 349 passed | 2 skipped files; 3945 passed | 2 skipped tests.
node --test scripts/cryo-model-preview.test.mjs: tests 2 / pass 2 / fail 0.
npm run build: PASS; 265 modules transformed.
npm run test:room-evidence: tests 28 / pass 28 / fail 0; ragdoll {passed:true,cpuOnly:true,checks:33}.
npm run test:smoke: Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.
npm run test:authored-smoke:all: Authored desktop smoke passed: 20 rooms, native move/fire, Continue/route, pause/resume, Low quality, no browser errors.
npm run playtest:smoke: room-limit; 3 rooms cleared; 0 errors (Arc seed 1729).
npm run verify: NOT COMPLETE — repeated 3945 passing Vitest tests and 2 passing Cryo model tests, then FileNotFoundError: 'blender' in unchanged Python asset tests.
```

No asset assertion or prerequisite was weakened. Blender was not installed,
as directed by `01-ENGINEERING.md`. The final copy-only accessibility polish
replaces the stale combat inspection hint with the Pause-record destination and
names the HUD region “Owned boon effects and sets”; focused UI contracts,
production build, final captures and native story continuations are rerun after
that polish. The full-suite and smoke results above precede only those two
nonvisual wording edits. Their actions, hooks, layout and simulation are unchanged.

## Two native combat storyboards

- `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-native-play/breacher-storyboard.png`
- `/Users/chernodub/.t3/worktrees/containment-game/t3-74841aa2/artifacts/nextgen/u9-native-play/arc-storyboard.png`

Each is entry → ten distinct fight observations → real clear, with native
1920×1080 originals, exact 480×270 PNGs, snapshots and source hashes alongside.
Breacher cleared Diagnostic Gallery in 63.25 simulated seconds (128 candidate
observations); Arc cleared Safety Interlock in 30.00 seconds (61 candidates).
Both reports have zero errors and zero detected defects. The board PNGs were
actually opened. Combat has no full service/safety paragraph; the separately
captured safe reward/Pause screens prove the verbatim record presentation after
the native clear transition/clear beat.

These are **two unassisted earned-boundary continuations**, with one newly played
room each. They start at the previously earned R10 Breacher and R11 Arc reward
saves attested by the read-only final5 play manifest. Local boundary copies pass
the existing native validation, retain exact health/build/stats/charge, and have
hash receipts in `u9-work/earned-boundary-receipts.json`. Printed totals of 11/12
rooms include 10/11 historical clears; they are not fresh full campaigns. No
rooms were advanced without prior clear proof and no resources were refilled by
the harness. Both continuations and both final capture sizes use app source
`63cfd8c7caf9f91f97918a5ec1ba5006cb00d0fd` and identical distribution assets.
The post-copy focused check passes 159 tests / 4 files; final 44-state captures
pass with zero errors/failures. Cleanup removes 134 successful intermediate raw
and reduction PNGs, retaining their contacts/hashes, every failed raw run, both
baselines, both final galleries and all native-play observations.

## Limits and integration

No integration hook is required. No hardware performance claim is made from UI
captures or fixed-step bot submission timing. Portraits remain economical SVG
illustrations rather than bespoke sculpted character renders; no blind human
recognition study or human balance playtest was conducted. The desktop zoom
layout keeps native scrolling at small CSS viewports rather than shrinking text
or adding touch controls. The unchanged aggregate Python asset prerequisites
must be reported separately from the JavaScript/browser gates.
