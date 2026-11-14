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
