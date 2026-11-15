# I11 file-only gallery assembly

`i11-gallery.mjs` is the I10 assembler adapted for the wave-7 evidence, retaining its byte-identical APFS-copy assembly, source capture/assets/SHA checks, native dimensions, duplicate-clock checks, original receipts and exact pixel-area reductions. It does not launch a browser, open an image for review, change exposure, or infer hardware performance.

Differences from I10:

- The requested 22 comparison rows are ORIGINAL / FINAL4 / FINAL5: six screens and calm/combat in eight specified rooms. Historical missing views remain explicit; no substitute is silently relabeled.
- Every Queen / reactor-vault gallery card, phase-sheet card, native review crop entry and exact480 review-sheet entry says `legacy saves only`. Original PNG bytes stay unchanged. The index explains that new runs end at Overload Floor.
- The default showcase uses ordinary calm/kiting scenes in place of Queen and full-kit stress fixtures. Explicit twelve-image selections remain supported and reject legacy bosses or known 25-enemy stress scenario families. Final visual selection still belongs to the acceptance engineer.
- `i11-sheets.mjs` creates ten-up color/grayscale boards from native calm frames (prefer x2 calm phase02, otherwise canonical calm). The ten environments follow E7's reference list. Exact480 pixel-area averaging supports both1080 and720 source sizes. Rec.709 grayscale uses PNG sRGB code values, without exposure normalization. Full legal-floor percentile measurement remains the existing I10 audit, not a sheet-derived substitute.

Usage (after capture batches pass):

```sh
node scripts/nextgen/i11-gallery.mjs artifacts/nextgen/final5 <clean-batch> ... --skip-showcase
node scripts/nextgen/i11-sheets.mjs artifacts/nextgen/final5
node scripts/nextgen/i11-gallery.mjs artifacts/nextgen/final5 --showcase-only --showcase-selection=<twelve-reviewed-selections.json>
# Repeat assembly at final5-720 with matching720p captures.
```

The comparison defaults to read-only `/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/{baseline,final4}`. `--history` overrides their parent. `--review-only`, `--compare-only`, `--showcase-only`, and skip flags retain I10 semantics.

Checks: both modules pass `node --check`; a tiny synthetic16×9 file-only smoke confirms unchanged native bytes, legacy index labeling, ten-source color/grayscale board dimensions and rejection of failed capture manifests. These checks do not represent actual game art review. No presentation/gameplay tests or application source changed.

## Hardware and campaign summaries

`i11-summary.mjs` reuses I10's full five-repeat performance and campaign audit. Defaults:

- Hardware: `artifacts/nextgen/i11-bench-five/benchmark.json` (two ranked rooms × four rigs × High/Low × five repeats).
- Preparation: `artifacts/nextgen/i11-rooms-five-1..5/rooms.json` (fresh/sequential across twenty story rooms and the legacy Queen arena).
- Campaigns: `artifacts/nextgen/playtest/i11-{breacher,cryo,pyro,arc}-1729/{report.json,trace.ndjson}`.
- Output summaries/chart: `artifacts/nextgen/i11/performance.{json,md,png}` and `campaign-summary.{json,md}`. Unmodified native mid-fight PNG/JSON evidence, hashes, framing audit and exact480 sheets go to `artifacts/nextgen/final5/organic/`.

```sh
node scripts/nextgen/i11-summary.mjs --performance-only
node scripts/nextgen/i11-summary.mjs --campaigns-only
```

`--base`, `--cohort` and `--benchmark-label` remain explicit alternatives; no missing input is replaced by a historical cohort. Every trial/miss remains in the table, with no best-of-N selection. Frame comparisons use the existing0.1ms reporting precision, paired adaptive scale and actual host load. Intrusive diagnostics remain ineligible. The complete hardware matrix additionally verifies both distinct ranked rooms contain all four rigs and both tiers.

Every distinct preparation history remains in JSON. Zero/non-finite/missing totals are incomplete observations; completed-history quantiles exclude those sentinels and a separate raw-recorded summary retains them. Complete preparation acceptance requires no incomplete history. Campaign histories preserve all source variants and select the greatest recorded total, never the fastest variant. UI-sampled holds are reported separately. Campaign outcome, deaths, Overdrive cadence, CPU submission statistics, source/app hashes, actual eight-corner marine/HUD bounds, hero/AABB/exact-hull results, active selected-contact bounds and missing receipts retain I10's explicit distinctions.

Validation for this additional module is syntax/help only while the parent's isolated benchmark runs. No browser or image processing was launched by this tooling task.

An explicit showcase selection may also use `organic/<native-file>.png`. Such images must exist in `organic/source-receipts.json`, match its native SHA256 and match the assembled gallery's frozen source/application assets. Their original organic receipt is preserved in `showcase.json`; unknown paths, modified files, mixed applications and legacy boss images are rejected.

The I11 gallery/lighting boards use a local exact integer1:1 pixel blit. The inherited g2 helper computes `floor(dx / width * source.width)` even at equal dimensions; floating-point roundoff maps a few columns to their predecessor (for example123→122). That does not alter native PNGs or standalone exact480 reductions, but prevents claiming their former contact cells are byte-identical. Prior opened sheets remain historical visual witnesses. Corrected pages use versioned `*-exact` directories and require fresh actual opens before strict coverage bridges.

A nonuniform480×270 six-cell fixture checked2,332,800 channel values across all offsets (including columns123/245) and proves every corrected page cell equals its standalone exact480 file. No application, shared g2 helper, I10 tool, capture assertion or native image changed.

The legacy predicate also covers `beat-boss-intro-fixture` and `beat-boss-defeated-fixture`: their UI explicitly names the Queen even though their fixture room is Awakening Bay. Final card, phase-sheet, review and showcase handling therefore treats them as legacy saves only. Default showcase candidates now use calm construction/UI images, and explicit showcase selection rejects kiting/body-only crowd fixtures as well as heavy/stress fixtures. The final twelve-image selection remains an explicit acceptance-engineer choice, normally including verified organic campaign images.

Final assembly and assigned visual review completed on 2026-11-15 from frozen application `a112e70154be57c77430d0ad5c61bd9e87ef90e1`. Both `final5` and `final5-720` contain1,042 native originals from29 clean matched-source captures (962 base plus80 duration frames),174 exact480 pages and170 marine-crop pages. Native source bytes and source receipts remain unchanged. The720 selection uses base00–18, lawful19–20 and compact21–27; failedbase19/lawful21 are excluded and their raw failure parents remain separate.

File-only `i11-sheets`, `i10-art-audit` and `k7-review` completed for both galleries. Each audit reports20rooms,1,042raw frames,1,019playing frames,zero hard luminance failures,zero marine framing failures andzero artifact failures. Conservative selected-body fit flags remain118 at1080 and209 at720; Queen bounds flags77 each; exact-hull excursions1 and4 respectively. These diagnostics are retained, not relabeled as successes. Nominal E7 value bands remain stricter than the historical hard gate: calm+canonical combat02 deck medians miss2/40 at1080 (Relay49.3,Infested49.6) and4/40 at720 (Relay44.3,Coolant47.5,Swarm47.0,Manual48.5); nominal shadow p5 misses20/40 and19/40. All100 calm/four-kiting-phase rows remain in `luminance.json`.

The22 requested three-generation comparison rows are present. Four ORIGINAL slots have no historical image (Breacher rig selection, ending, Residential calm and combat) and remain explicit missing cells. FINAL4 and FINAL5 have every requested slot. Historical source PNGs are copied unchanged with hashes and any staging substitute identified.

Actual-open scope for `/root/gallery_tooling` is598 full-native originals plus their598 corrected exact480 cells:1080 batches02/04/08/10/14/16/18/20/22/24/26 (378frames),720 duration80frames and720 compact24/26 (140frames). Every numbered source PNG and every corresponding corrected page was opened; `artifacts/nextgen/i11/gallery-review-opens.json` records actual opens, native hashes, page hashes, cell bounds and pixel-equality checks. Earlier nonexact contact opens remain visual-only historical witnesses. Native1:1 crops never substitute for full-native composition. Other reviewers own remaining scopes; prepared final lighting/K7/comparison boards are not asserted visually reviewed by this agent. The lead's convergence instruction ends additional review work; final witness bridging preserves completed opens and states any remaining gaps honestly.

Visual findings from this scope: family anatomy/palettes survive ice, fire and electricity at480; no giant white pennants observed, although small pale ice fragments remain. Railbreaker is an instant beam with tapering aftermath; Whiteout, Meltdown and Overclock retain their timed states through their captured countdown and expire. Meltdown suit emphasis can be obscured in melee. Hostile filled hatching and toothed acid boundaries remain distinct from thin unfilled dashed friendly placement. Same-family poses repeat, peripheral enemies can clip and some large foundations/empty floors still dominate. Legacy Queen plates, exposed core and nests remain functional but some opening poses extend behind the boss HUD or viewport; all such gallery entries are labeled legacy saves only and excluded from showcase.
