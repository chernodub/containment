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
