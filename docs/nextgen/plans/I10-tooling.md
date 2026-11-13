# I10 file-only acceptance tooling

## Delivered

- `scripts/nextgen/i10-summary.mjs` adapts I9's retained-receipt method. Defaults: `i10-bench-five/benchmark.json`, five `i10-rooms-five-N/rooms.json` reports, and original `playtest/i10-{breacher,cryo,pyro,arc}-1729` campaigns. Partial modes `--performance-only` / `--campaigns-only`; optional `--base`, `--cohort`, `--benchmark-label`.
- Performance outputs are `artifacts/nextgen/i10/performance.{json,md,png}`. All80 sustained trials (16 cases × five repeats) remain in JSON and per-trial Markdown with before/after host load. Rounded0.1ms frame targets follow I9: p50≤16.7ms, High p95≤20ms, High median scale≥.9, draws≤330, zero combat compiles, native population and four-slot kit activity. Raw harness flags stay visible. No best-of selection. Missing files, incomplete/duplicate repeats, inconsistent application provenance, missing all21 fresh/sequential room cases or timing failures cannot become acceptance.
- All210 public room-readiness rows and deduplicated inclusive preparation histories remain, including fresh startup and sequential visits after18 rooms. ≤3s worst/≤1.5s median are evaluated separately for public readiness and all preparation receipts.
- Campaign summary preserves natural deaths, clears, full native rendering/assistance provenance, source/report/trace hashes, Overdrive native cast cadence, preparation holds, per-room CPU submission quantiles and actual host load. It excludes campaign CPU timings from hardware FPS acceptance.
- `final4/organic/` contains every original report-listed mid-fight PNG/JSON, copied unchanged with SHA-256 receipts, native index and every exact480×270 reduction/six-frame review page. Stale disk files absent from a report are excluded. Minimum six frames and early depth≤5 / late depth≥10 coverage are explicit per rig.
- Organic C6 conservative hero pixels, AABB outside fraction and exact hull diagnostic are separate. Missing C6 receipts fail hero/AABB acceptance. Exact-hull exceedances remain an explicit distinct result; an AABB pass never implies exact-hull acceptance. Native viewport mismatch and eight-corner/HUD overlap are preserved separately from peripheral contact qualifications.
- `scripts/nextgen/i10-gallery.mjs` keeps I9's strict identical-bundle capture assembly and per-PNG source hashes. Comparison now has25 rows: six requested screens plus results, calm/combat for eight named rooms plus boss. Historical ORIGINAL/final3 are copied under `comparison-sources`; only final4 resolves directly to current originals. Missing historical captures/substitute staging remain labeled.
- Optional `--showcase-selection=/path/to/selection.json` takes twelve distinct `{title,file}` rows selected by the acceptance engineer; every filename must belong to the current capture manifest. Default twelve slots remain candidates until visual review.

## Validation

File-only syntax/help checks passed. Synthetic fixtures are isolated beneath ignored `artifacts/nextgen/i10/tooling-validation/` and identify their source/GPU as `SYNTHETIC`; they are not product acceptance evidence.

- Missing-input fixture: performance accepted=false with six missing reports; campaigns accepted=false with four missing reports.
- Positive fixture:80 trials/16 cases,210 readiness rows,4 campaigns/24 native and exact480 frames accepted by the expected tool predicates.
- Failure fixture: one High p95=21ms remains among all80 trials; performance accepted=false.
- Comparison fixture: all25 required comparison IDs present; FINAL3 links/hashes remain distinct from current FINAL4 originals; missing historical cells remain explicit.

No browser, computer-use, capture, benchmark, simulation change, full test suite, commit or other-worktree write was performed by the tooling agent.

## I10 art-audit extension

`node scripts/nextgen/i10-art-audit.mjs artifacts/nextgen/final4` (and the720 gallery) preserves I9's all20 canonical room floor method, raw accepted/rejected sampling counts, source PNG SHA-256 and independent saved eight-corner body checks. It adds:

- Literal deck median50–80 / nominal shadow-p5 12–28 excursion counts across every canonical calm/four-phase combat frame; no normalization and no favorable phase selection.
- Per-playing-frame C6 conservative hero threshold100×CSSheight/1080, with .05CSSpx numerical tolerance. The exact C6 small-axis rule is separate: each non-small axis stays≤18%; a genuinely small axis must center. Full-AABB literal area and exact playable-hull area remain reported independently, with a per-room table and every raw diagnostic.
- Saved actual Queen bounds as contactid-1, independent inside-usable checks, explicit selected-pair failures, missing selected IDs, bound-receipt disagreements, actual Queen bounds failures and raw fit=false receipts. A remote contact made infeasible by hero/room constraints stays a review finding; it is not deleted or silently promoted to a fit.
- The prior twelve G5 family/Queen mask phases remain required; four C6 normal and four C6 frozen phases are additive. Every mask must match the actual PNG dimensions. Both full-native and exact480 black masks retain actual visible identity spans; normal/Queen and frozen-family native comparison sheets preserve1:1 pixels.
- Every selected native original is independently hashed and listed in `art-audit/native-originals.txt`; all-shot exact480 contact pages and per-cell/source/frame/hash receipts live in `art-audit/review480/` and `art-audit/review-ledger.json`. Generation is explicitly not a human-open witness.

`art-audit/result.json` calls its `passed` value conversion/evidence-integrity plus qualified C6-rule acceptance, not human art acceptance. Selected-body/Queen/hull/value-band findings have separate raw arrays/counts/booleans so root can judge feasibility and the vision honestly. Missing required masks/samples/receipts, invalid hashes/native dimensions, marine failures, invalid C6 data, hero-scale failures and qualified AABB-rule failures still produce a nonzero exit.

The campaign summary uses the same qualified small-axis rule; literalAABB and exact-hull exceedances remain separate.

Presentation pins reported by root: old G5/I8 packing now uses C6's legal native all-body pack, preserving76-unit spacing/minimum12/five families; V6 ability-side frozen ice is capped at22%height to agree with C6 actor frost. These are root implementation changes; the audit does not create or weaken simulation, desktop input, persistence or accessibility assertions.

File-only validation: the synthetic complete art fixture has120 frames, all20 room groups,20 mask phases and20 exact480 pages. Separate fixtures retain remote selected failure/actual-hull excursion while recognizing genuine centered small-axis qualification; incorrect hero scale/source hash/native-mask dimensions are rejected. All synthetic fixtures are beneath ignored tooling-validation, explicitly marked synthetic, and excluded from real acceptance.

Final-source reporting hardening: campaign selectedIDs (including Queenid-1) must resolve to actual saved body bounds; missing selected-contact frames/IDs are exported explicitly and prevent organic framing-bound acceptance. Both saved and independently recomputed inside-usable values remain. Per-pass GPU query cohorts are explicitly timing-ineligible, because that diagnostic mode replaces runtime adaptive GPU feedback with frame fallback; raw trial measurements and the reason remain in JSON. Synthetic checks cover retained80 diagnostic trials and a missing Queen contact. No product or native-input behavior changes.
