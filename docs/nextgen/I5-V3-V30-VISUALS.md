# I5 policy-v3 / V30 visual review round

This is the **V30 review round**, preserved separately from historical policy-v1 `i5-final` captures. It does not certify final balance numbers or organic campaign outcomes. V31 cooldown tuning was proposed after capture; if selected, its Pyro copy and ability poses require their own updated round. No campaign or smoke gate was launched in this task.

Lead first look:

1. [Title](../../artifacts/nextgen/i5-v3-final/title.png)
2. [Breacher selection](../../artifacts/nextgen/i5-v3-final/rig-select.png)
3. [Pyro selection](../../artifacts/nextgen/i5-v3-final/rig-select-pyro.png)
4. [Dense Afterburn sheet](../../artifacts/nextgen/i5-v3-final/ability-afterburn-awakening-bay-sprite.png)
5. [Flashfire sheet](../../artifacts/nextgen/i5-v3-final/ability-flashfire-awakening-bay-sprite.png)
6. [Napalm full-size pose](../../artifacts/nextgen/i5-v3-final/ability-napalm-charge-awakening-bay-03.png)
7. [Graphics recovery](../../artifacts/nextgen/i5-v3-final/f2-recovery.png)
8. [Feel-impact sheet](../../artifacts/nextgen/i5-v3-final/feel-impact-fixture-awakening-bay-sprite.png)

## Source and receipts

Production source: `1cac390797678b9dfe8c716e39d61c730e979dfd`. The build ran the requested TypeScript check and Vite production build into a fresh `artifacts/nextgen/i5-continuation/approved-dist-1cac390`, leaving main `dist` and all historical distributions untouched. Tracked build inputs had no uncommitted changes. Build exit **0**.

```sh
npm run build -- --outDir artifacts/nextgen/i5-continuation/approved-dist-1cac390
npm run capture -- --label=i5-v3-final --width=1920 --height=1080 --scenarios=title,rig-select,rig-select-pyro,shop,ability:afterburn,ability:flashfire,ability:napalm-charge,f2-recovery,feel-impact-fixture --dist=/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-continuation/approved-dist-1cac390 --dist-source-sha=1cac390797678b9dfe8c716e39d61c730e979dfd
```

`rig-select` is the registered default Breacher selection scenario; no separate `rig-select-breacher` scenario exists. Afterburn was included to recheck the prior dense-pack concern. The fixtures were unchanged.

- Application SHA256: `f59043d8eda6b628d4e74740c5c9a59cdd01adfd50b5dc142184932c7a86aa87` (sorted relative paths and bytes of index.html and top-level JS/CSS; excludes complete static assets).
- Policy: `i5-catalog-ability-aim-v3`; SHA256 `976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502`.
- Capture: **21 verified PNGs, four motion sheets, 111.14 s, exit 0**, 1920×1080, DPR 1.
- Renderer: hardware `ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)`; no software fallback.
- Manifest: `errors=[]`, `failures=[]`, `fontFallbacks=[]`. No recorded texture-blob error occurred in this round; no error filtering or retry was applied.

[Build receipt](../../artifacts/nextgen/i5-continuation/v30-1cac390-build/build-receipt.json), [build log](../../artifacts/nextgen/i5-continuation/v30-1cac390-build/build.log), [capture log](../../artifacts/nextgen/i5-continuation/v30-1cac390-build/capture.log), [manifest](../../artifacts/nextgen/i5-v3-final/manifest.json), [gallery](../../artifacts/nextgen/i5-v3-final/index.html).

## Opened review against the historical round

I opened both actual title PNGs, the historical and current Afterburn sheets, current Breacher/Pyro selection, shop, all three Pyro sheets, the full Napalm third pose, recovery and feel-impact sheet. The old and new source refs have no `src/ui/**` or `src/render/**` changes, so this round makes no claim of a new graphics correction.

- **Title:** the Wake up focus border, Continue action, utility buttons and large type remain clear at desktop size. The marine silhouette reads well. The pale brute and its subtle ground contact retain the previous art-review concern; differences in idle animation pose are not evidence of a fix.
- **Rig selection and copy:** selected cards, keyboard hints and equip buttons remain readable without clipping. Breacher visibly shows Seismic Slam 90 / radius 230 / cooldown 6 s and Ram 2 charges / 2.6 s recharge / 18 damage. Railbreaker remains 420 damage; V30 changed its charge time 600→250 ms, not its damage. This selected overview does not expose that charge-time detail, so these PNGs do not validate the shorter cast timing. Pyro correctly shows Flashfire 25 / range 300 / cooldown 6 s and Napalm 6 s duration / radius 120 / cooldown 12 s for this V30 source. No stale-copy finding was observed in those visible values.
- **Afterburn, round-two check:** the orange trail and BURNING text remain visible, but overlapping enemy bodies and pale hit flashes still hide the marine in the staged close pack. That prior concern is **still open**; this review did not edit renderer code or claim a correction. The lead should evaluate marine identification during a real close-range swarm.
- **Flashfire and Napalm:** the Flashfire sheet shows the wave spreading ahead of an identifiable marine; the Napalm perimeter remains distinct from the floor and its four frames show ongoing pool damage/burn. The ranged fixtures leave the marine clear, unlike the dense Afterburn stack. These staged poses do not establish organic targeting or encounter balance.
- **Recovery and shop:** recovery keeps the world blurred/held and separates Return to pause from Reload game. The shop highlights free Collect supplies and visibly disables unaffordable paid services with reasons. These match the earlier layout review.
- **Motion:** feel-impact presentation times 0/25/50/75 ms correspond to simulation times 0/0/0/33 ms, preserving the observed hold and resume. The fourth pose visibly advances. This supports timing behavior; it does not prove impact weight, audio quality or frame-budget headroom.

No game, policy, fixture, UI, renderer or test source was edited. No commits were made. All captures are staged diagnostic fixtures, not organic balance measurements. The historical held-Overdrive fixture was not repeated in this task.

## Host and cleanup

Host load at build start: **335.375 / 274.05859375 / 336.0390625** on 10 logical cores. At capture end: **469.6455078125 / 343.58740234375 / 352.517578125**. The parent concurrently owned its verification work; only one capture browser was used here. Capture timings include instrumentation and an overloaded shared host, so there is no performance certification.

The capture session was reaped with exit 0 and its browser/server closed. Process inspection found no capture runner or `i5-v3-final` job; a separately owned transient test Chromium was left untouched. No additional GPU job, gate or campaign followed.
