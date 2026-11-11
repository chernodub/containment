# I5 V31 visual evidence, policy v3

This round records the immutable V31 build while its full balance cohort was still under review. It establishes the updated visible Pyro copy and staged HUD/graphics behavior; it does not replace final organic campaigns or imply balance acceptance.

Lead first look:

1. [Title](../../artifacts/nextgen/i5-v3-v31/title.png)
2. [Pyro selection: 7 s / 13 s cooldowns](../../artifacts/nextgen/i5-v3-v31/rig-select-pyro.png)
3. [Full held Overdrive: NEXT ROOM](../../artifacts/nextgen/i5-v3-v31/held-overdrive.png)
4. [Napalm full-size third pose](../../artifacts/nextgen/i5-v3-v31/ability-napalm-charge-awakening-bay-03.png)
5. [Graphics recovery hold](../../artifacts/nextgen/i5-v3-v31/f2-recovery.png)
6. [Dense Afterburn sheet](../../artifacts/nextgen/i5-v3-v31/ability-afterburn-awakening-bay-sprite.png)
7. [Flashfire sheet](../../artifacts/nextgen/i5-v3-v31/ability-flashfire-awakening-bay-sprite.png)
8. [Feel-impact sheet](../../artifacts/nextgen/i5-v3-v31/feel-impact-fixture-awakening-bay-sprite.png)

## Immutable build and capture receipts

Source **`e4381e8c9f6e1d651b87b522c326a17571032a07`**, policy `i5-catalog-ability-aim-v3`. This is V30 plus only Pyro Flashfire cooldown 6→7 s and Napalm cooldown 12→13 s; damage and dash distance are unchanged. V30's Railbreaker cast 600→250 ms remains. Clean tracked build inputs were verified before fingerprinting.

```sh
npm run build -- --outDir artifacts/nextgen/i5-continuation/approved-dist-e4381e8
npm run capture -- --label=i5-v3-v31 --width=1920 --height=1080 --scenarios=title,rig-select,rig-select-pyro,shop,ability:afterburn,ability:flashfire,ability:napalm-charge,f2-recovery,feel-impact-fixture --dist=/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-continuation/approved-dist-e4381e8 --dist-source-sha=e4381e8c9f6e1d651b87b522c326a17571032a07
```

Build **exit 0** (TypeScript and Vite). Registered captures: **21 verified PNGs, four motion sheets, 107.22 s, exit 0**; 1920×1080, DPR 1, hardware `ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)`, no software fallback. Manifest `errors=[]`, `failures=[]`, `fontFallbacks=[]`. No recorded texture-blob error occurred; there was no filter or retry.

Application SHA256: `ce6baa737a3b5dc669f76d9039e8032d1aecbca7100d6a3b9445afd688b42d3f` (sorted paths/raw bytes of index.html and top-level JS/CSS; excludes full static assets). Policy SHA256: `976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502`.

[Build receipt](../../artifacts/nextgen/i5-continuation/v31-e4381e8-build/build-receipt.json), [build log](../../artifacts/nextgen/i5-continuation/v31-e4381e8-build/build.log), [capture log](../../artifacts/nextgen/i5-continuation/v31-e4381e8-build/capture.log), [manifest](../../artifacts/nextgen/i5-v3-v31/manifest.json), [gallery](../../artifacts/nextgen/i5-v3-v31/index.html). Registered `rig-select` is the default [Breacher selection](../../artifacts/nextgen/i5-v3-v31/rig-select.png).

## Opened review and round-two findings

I opened the actual V31 Pyro selection, Flashfire/Napalm/Afterburn sheets, title, recovery, held meter and feel-impact sheet, comparing with the opened V30 and historical `i5-final` evidence. No renderer/UI source changed between V30 and V31.

- **Updated copy passes:** Pyro visibly says Flashfire cooldown 7 s and Napalm cooldown 13 s; damage 25, range 300, Napalm duration 6 s and radius 120 remain. Every one of the eight Flashfire/Napalm manifest burst frames also reports authoritative tactical cooldown 7000 ms and power cooldown 13000 ms. The new text fits without clipping.
- **Pyro burst readability:** the Flashfire wave advances and the Napalm pool has a clear orange boundary; the marine remains distinct in both ranged fixtures. Bright enemy hit flashes still suppress body shading briefly. The screenshots show the same established effect treatment, not an art revision or proof of organic ability targeting.
- **Dense Afterburn concern remains open:** in the close staged pile, large enemy bodies and pale flashes obscure the marine, just as in V30 and historical policy-v1 captures. Trail fire and BURNING labels are readable, but this is still the lead's strongest live-combat readability check. No renderer correction was attempted.
- **Title/recovery continuity:** title hierarchy, focused Wake up, Continue and utility actions remain clear. The marine silhouette reads well; the brute's pale surface and weak ground contact retain the earlier art-review note. Recovery still holds/blurs the background and distinguishes Return to pause from Reload game.
- **Held meter:** the actual cyan full meter and wrapped NEXT / ROOM label are visible. The HUD does not advertise READY after the ordinary-room allowance is consumed. This is independently asserted from real runtime state below.
- **Motion:** the feel-impact sheet records presentation 0/25/50/75 ms and simulation 0/0/0/33 ms, preserving the observed hold/resume behavior. It is timing evidence, not a frame-budget or sound/impact-weight certificate.

## Held-Overdrive fixture

This separate fixture is **debug-staged, not an organic campaign**. It used the same immutable build and application fingerprint, in one new browser after the registered browser closed. The artifact-only [fixture script](../../artifacts/nextgen/i5-continuation/v31-e4381e8-build/held-overdrive.mjs) staged Arc in real Awakening Bay, granted meter through the existing debug helper, activated Overclock with ordinary public `game.useAbility('overdrive')`, stepped 6000 simulated ms until inactive, granted meter again and refreshed the actual HUD. No ability/HUD snapshot was injected.

All assertions passed, **exit 0**, `errors=[]`:

```text
accepted: true
charge: 1
active: false
roomLimited: true
overdrive.ready: false
slots.overdrive.ready: false
actual HUD .ability-value: NEXT ROOM
stats.overdrivesUsed: 1
stats.abilityUses.overdrive: 1
status: playing
room: awakening-bay, depth 0
```

[Held metadata](../../artifacts/nextgen/i5-v3-v31/held-overdrive.metadata.json) retains before/after snapshots, full stats, exact source/build/policy identities, GPU, all errors and cleanup. [Held log](../../artifacts/nextgen/i5-continuation/v31-e4381e8-build/held-overdrive.log) preserves the unfiltered result.

## Shared-host and cleanup limits

Host load at build start: **257.5712890625 / 289.140625 / 325.03857421875**, after both captures **440.4833984375 / 373.24267578125 / 353.51123046875**, on 10 logical cores. The parent concurrently owned its verification work. These overloaded-host diagnostic captures make no CPU/GPU performance claim; registered timings include capture overhead.

Only one capture browser was active at any instant; the held fixture followed the registered run sequentially. Both browser/server pairs closed, both sessions were reaped with exit 0, and process inspection found no matching capture or held-fixture jobs. No unrelated process was signaled. No tracked game, policy, renderer, UI, fixture or test source was edited; no main distribution was rebuilt; no commits, gates or organic campaigns were started.
