# T12 texture memory and download weight

T12 converts the marine, five Lantern Brood castes and five weapons to right-sized KTX2 textures. The 31 actor/weapon maps fall from **233.333 MiB to 8.292 MiB** on the measured ASTC/ETC2 device (96.45% less payload). The marine alone falls from **85.333 MiB to 2.000 MiB**. Actor/weapon model files, including their unchanged animation-only GLBs, fall from **55.745 MB to 28.661 MB** (48.58% less). The self-hosted decoder adds 584,862 bytes once. MB is decimal file bytes; MiB is binary texture payload, not driver allocation telemetry.

`nextgen` was merged first (`1c73bd03` at capture time; merge-message-only amendment `ec242458` has the identical tree), including difficulty, title and review changes. `npm ci` and the production build passed. No automated tests, test runner, simulation changes, mesh/skeleton/clip changes, material shader changes, world placement, kit/floor changes or postprocessing changes were added. The completed native campaign attempt is recorded below.

## Shipping pipeline

After modelling and existing meshopt packing, run:

```
node tools/assets/i11-models/optimize.mjs
TOKTX=/path/to/toktx node tools/assets/t12-textures/pack.mjs
npm run build
```

The texture conversion itself is one command. It accepts an optional complete source-model directory. Reapply the same command after the creature stream regenerates its PNG-image GLBs; unchanged shipping assets resolve their offline source cache. A fresh checkout can recover unchanged originals from the pinned pre-T12 source revision; revised creatures must be regenerated or supplied as source files. Exact source/cache behavior is documented in `tools/assets/t12-textures/README.md`. The in-place command was run again and reproduced all 22 compressed/fallback GLBs byte-for-byte (`rebuild-comparison.json`). Offline source caches, including the original 2k marine maps, never enter `public` or `dist`.

The converter rewrites embedded image payloads and buffer offsets, including meshopt stream offsets. Only offsets into physical buffer 0 are relocated; meshopt's virtual decoded fallback-buffer offsets stay verbatim. Source nodes, accessors, meshes, skins and animations compare identically; every non-image buffer stream hashes identically (`geometry-preservation.json`). It preserves material factors, texture assignments, UVs, sampling settings and names. The six separate animation-only GLBs are unchanged.

Resolution policy follows projected gameplay coverage, with headroom for elites and champions: marine colour 1024², normal/AO/emission 512²; Crawler/Stalker at most 512²; Brute/Carrier/Spitter colour 1024² and normal/glow at most 512². Weapons use 512² colour/emission (Pistol colour 256²), with 256² normals. Existing smaller maps are never upsampled. These are gameplay assets; pre-rendered title/portrait files and offline close-up inputs are untouched.

Normal maps and marine colour use UASTC quality 4 with lossless Zstd supercompression. Other maps use ETC1S quality 255/effort 5. Colour/emission retain sRGB transfer; normals/AO remain linear. All levels are encoded offline. No sampled map was dropped: the original marine and creatures preserve their authored PBR finish through `ActorFlatSkin`, and `ActorSurface` retains the standard map sampling chunks. These assets use scalar roughness/metalness rather than separate roughness/metalness images; AO and coloured RGB emission cannot share their existing standard glTF slots without changing shader sampling. Consequently there was no useful additional ORM/emission-mask packing within the unchanged shader path. Existing kit ARM packing remains intact.

KTX2Loader comes from Three r185, with two worker slots and verbatim self-hosted `basis_transcoder.js`/`.wasm` under `public/assets/basis/`. There is no CDN or new runtime npm dependency. A WebGLRenderer is created before GLTF loading to detect actual context capabilities, then passed into DepthRenderer after asset loading. GLTFLoader awaits texture transcoding and authored motion before registering templates or creating actors; workers are disposed after the preload queue. Existing room preparation still uploads textures and prepares shaders, and context recovery retains their decoded mip buffers. Unsupported contexts select separately generated resized PNG GLBs under `models/plain/`. Four unconditional HTML model preloads were removed so they cannot download the compressed set on that fallback path.

Third-party notices cover Three/MIT, Basis/Apache-2.0, its Zstd/BSD decoder, the bundled ktx-parse/zstddec MIT helpers and the offline Khronos KTX tool. macOS sips is used for offline resizing and is not redistributed. Original art and retained third-party notices are unchanged.

## Per-asset results

The download columns include each actor's unchanged animation-only file. Those motion files total 15,692,632 bytes and are a substantial remaining download cost. The eleven body/weapon GLBs alone are 40,052,052 → 12,968,720 bytes. The task's historical 37 MB figure is not substituted for the measured checkout.

| Asset | GPU MiB before | GPU MiB after | Model download MB before | Model download MB after | PNG fallback model MB |
|---|---:|---:|---:|---:|---:|
| marine | 85.333 | 2.000 | 23.287 | 10.438 | 11.475 |
| dretch | 12.000 | 0.667 | 3.624 | 2.097 | 2.496 |
| basilisk | 12.000 | 0.667 | 3.671 | 2.190 | 2.590 |
| marauder | 12.000 | 1.167 | 4.700 | 3.338 | 4.144 |
| dragoon | 48.000 | 1.167 | 9.775 | 5.363 | 6.294 |
| tyrant | 48.000 | 1.167 | 8.053 | 3.551 | 4.426 |
| pistol | 2.667 | 0.125 | 0.436 | 0.240 | 0.294 |
| rifle | 2.667 | 0.250 | 0.561 | 0.373 | 0.469 |
| shotgun | 2.667 | 0.250 | 0.508 | 0.342 | 0.422 |
| plasma | 4.000 | 0.417 | 0.594 | 0.383 | 0.492 |
| rocket | 4.000 | 0.417 | 0.536 | 0.346 | 0.444 |
| TOTAL | 233.333 | 8.292 | 55.745 | 28.661 | 33.545 |


The PNG fallback actor/weapon textures total 51.333 MiB, versus 233.333 MiB originally. It is an alternate download path, not an additional normal-path transfer. Both representations are deployed; disk footprint should not be confused with bytes fetched by one client. Other rooms' kit/floor files are unchanged and are excluded from the model-only download totals.

## Preparation, first spawn and recovery

The existing breakdown benchmark ran one matched 1920×1080 High/Pyro/Awakening Bay cohort per version, seed 1729, fixed resolution and deterministic 720-tick combat. Referenced scene texture payload was **372.172 → 147.131 MiB**. Both runs recorded **zero combat program creations, zero GL errors and no context loss**; peak draw count was 153 in both. The audit now counts compressed textures from the actual transcoded mip byte arrays instead of treating them as uncompressed one-channel images.

| Room preparation observation | Before ms | After ms |
|---|---:|---:|
| First cold preparation total | 2035.3 | 2256.0 |
| Its texture upload phase | 278.6 | 2.1 |
| Subsequent preparation total | 850.3 | 915.4 |
| Gameplay asset/preparation total | 1442.8 | 1675.5 |
| Subsequent warm preparation total | 1232.7 | 1359.7 |

These are single instrumented observations on a highly contended ten-core host, not a startup-speed claim or hardware FPS certification. Raw cohorts retain all preparation phases and host load. No frame-time improvement is claimed.

Native first-spawn observation and forced unsupported-extension fallback results are retained in `startup-*-final.json`. The initial DOM playing state can precede a later native loading hold; startup program creation must be classified by the loading/native-step gate, not simply by DOM state. In the traced compressed run all 49 subsequent startup program creations occurred with loading held, native stepping disabled and zero live enemies. None occurred with native stepping enabled. Two transcoder workers closed before the menu appeared, and there were no actor/motion model or transcoder requests or new workers after gameplay readiness. The separate audio synthesis worker is identified in the trace and is not a transcoder. Final no-eager-preload measurements follow.

Final no-eager-preload observations (elapsed milliseconds include browser launch; not a controlled speed comparison):

| Path | Menu ready ms | Gameplay ready ms | First enemy ms | Compiles with native stepping enabled | Late actor/motion/transcoder requests | Late workers |
|---|---:|---:|---:|---:|---:|---:|
| compressed | 30958.8 | 36664.9 | 47008.5 | 0 | 0 | 0 |
| plain | 5718.8 | 7995.9 | 12692.7 | 0 | 0 | 0 |

Both paths completed without page/console errors. The compressed run requested eleven compressed body/weapon GLBs and the two self-hosted transcoder files. With compression extensions masked, the final plain run requested zero compressed body/weapon files and zero transcoder files. Its only worker was audio synthesis. The 31-second compressed menu observation confirms that a busy-host startup can exceed the old 30-second wait; it is not a first-enemy transcode stall. The final recovery capture also passed with unchanged resource counts and restored textures.


The ordinary `g1-recovery` fixture cycled rooms and restored the context successfully. Its resource counts were 244 geometries/114 textures before, 321/117 after room cycling, and 291/91 after restoration; `contextLost=false`. The restored world PNG was opened at native size and 480×270. Existing graphics disposal/recovery ownership is unchanged.

## Visual review

All captures use the production desktop camera at 1920×1080, seed 1729, with matching native clocks per pair. Four rigs have calm and real heavy-combat pairs. All five weapons have calm and heavy firing pairs; each heavy frame waits for a real shot by the selected weapon after ordinary heavy staging. Five castes have calm, dense-crowd and actual firing/grenade-progression pairs (450ms of native simulation). These staged art fixtures do not establish campaign balance or hardware FPS.

Native-pixel paired crops and mathematically area-reduced 480×270 frames were opened for every rig, weapon and caste. The source frames remain alongside manifests; crop receipts retain exact bounds and preserve native pixels without resampling, alignment or colour changes. Marine armour zones/normal detail, weapon barrels and light strips, green Spitter lanterns and pink Carrier lobes remain consistent. No visible banding, blur or colour shift required backing off these settings at gameplay size. The captures are not claimed pixel-identical. Title and rig selection were also opened at native size and 480×270; all 50 checked portrait/title source files have unchanged hashes.

Accepted captures are under `artifacts/nextgen/t12-final/captures/`; `pairs-rigs`, `pairs-weapons`, `pairs-creatures` and `pairs-family-fights` contain direct before/after reviews. Failed weapon timing evidence is retained under `failed/weapon-pulse`: the first post-switch 100ms frame missed the pistol pulse, so the fixture was corrected to wait for a native shot, preserving the firing checks. Superseded successful wrong-weapon intermediates were removed. An interrupted benchmark and the original restricted-server failure are retained separately and are not acceptance cohorts.

## Campaign

The unassisted native Pyro campaign at seed 1729 / Standard finished by natural death in Swarm Junction after **15 rooms cleared, 16 entered, zero runner errors and zero recorded defects**. Wall duration was 2990.699 seconds. Every simulation tick was rendered; no fast mode, forced progression or assistance was used. This is a complete campaign attempt, not a twenty-room victory. Raw native inputs, room records and screenshots are retained under `artifacts/nextgen/t12-final/campaign/pyro-1729/`.

The command was `npm run playtest -- --rig=pyro --seed=1729 --label=t12-pyro-1729 --startup-timeout-ms=180000 --max-wall-seconds=7200 --dist-dir=/private/tmp/t12-final-runtime/dist`. The original pre-room failure was `listen EPERM 127.0.0.1`, resolved by allowing the runner's local server. The opt-in startup timeout preserves the ordinary default and does not alter simulation or room-loading diagnostic thresholds.

The campaign used the frozen application/renderer bundles and encoded texture/geometry payloads also used by the final release. The final HTML additionally removes eager compressed-only model hints, and final GLB metadata restores virtual fallback offsets. `provenance.json` and `geometry-preservation.json` retain these distinctions and identical draw-input payloads; the native fallback and recovery checks run on the final files.

## Kit/floor inventory and recommendations

Kit, floor, P11 and E9 files were not rewritten. `inventory.json`/`inventory.md` retain the complete PNG/JPEG folder scan, and `runtime-texture-table.md` records the measured room's material texture references. The file table below is deliberately a superset: it includes review previews, unreferenced export images and source duplicates as well as runtime images; it must not be summed and called runtime residency. Embedded images count separately per GLB, since separate parsers can own separate textures. UI/portrait files are excluded from this table. File bytes describe encoded images, not their containing GLB's geometry bytes. GPU estimates for these unchanged files assume decoded RGBA8 with a complete mip chain; the live benchmark inventory is authoritative for the measured room's references. Procedural/bone textures appear only in the runtime table and have no source image download.

Passenger Vault runtime panels repeatedly contain 2048×512 images (5.33 MiB per decoded mipmapped map); a future owner should first hash/deduplicate shared atlases across GLBs, then evaluate KTX2 and smaller normal/ARM maps at the actual panel projection. Floor maps tile over large surfaces, so choose base resolution from projected tile size and preserve their roughness/grain hooks; evaluate 1024 colour and 512 normal/ARM before lowering colour further. Existing ARM textures already pack AO/roughness/metalness. The 2048² V6 effect atlas alone is 21.33 MiB; compressing it is a separate visual/alpha/gutter review and was not mixed into this change. Review preview PNGs in asset folders are not GPU textures merely because they are present on disk.

## Actor texture inventory

Before images are decoded RGBA8. After GPU format 37808 is Three's ASTC 4×4 format; 37492 is RGB ETC2. GPU byte counts include every actual transcoded mip level and block padding on the observed context. Other devices may choose BC/ETC/ASTC or decode to RGBA; the raw fallback estimate above bounds the right-sized uncompressed texture set, not driver overhead.

| Asset / map | Before size | Before mips | Before GPU bytes | Before image bytes | After size | Encoding / GPU format | After mips | After GPU bytes | After KTX2 bytes |
|---|---|---:|---:|---:|---|---|---:|---:|---:|
| marine / marine-basecolor.png | 2048×2048 RGBA8 | 12 | 22369620 | 5649078 | 1024×1024 | UASTC / 37808 | 11 | 1398128 | 1174802 |
| marine / marine-normal.png | 2048×2048 RGBA8 | 12 | 22369620 | 5197712 | 512×512 | UASTC / 37808 | 10 | 349552 | 315774 |
| marine / marine-ao.png | 2048×2048 RGBA8 | 12 | 22369620 | 3473172 | 512×512 | ETC1S / 37492 | 10 | 174776 | 91585 |
| marine / marine-emissive.png | 2048×2048 RGBA8 | 12 | 22369620 | 121348 | 512×512 | ETC1S / 37492 | 10 | 174776 | 9986 |
| dretch / crawler-base.png | 1024×1024 RGBA8 | 11 | 5592404 | 874454 | 512×512 | ETC1S / 37492 | 10 | 174776 | 71911 |
| dretch / crawler-normal.png | 1024×1024 RGBA8 | 11 | 5592404 | 963906 | 512×512 | UASTC / 37808 | 10 | 349552 | 254125 |
| dretch / crawler-glow.png | 512×512 RGBA8 | 10 | 1398100 | 25225 | 512×512 | ETC1S / 37492 | 10 | 174776 | 11039 |
| basilisk / stalker-base.png | 1024×1024 RGBA8 | 11 | 5592404 | 893303 | 512×512 | ETC1S / 37492 | 10 | 174776 | 74350 |
| basilisk / stalker-normal.png | 1024×1024 RGBA8 | 11 | 5592404 | 901265 | 512×512 | UASTC / 37808 | 10 | 349552 | 249120 |
| basilisk / stalker-glow.png | 512×512 RGBA8 | 10 | 1398100 | 17664 | 512×512 | ETC1S / 37492 | 10 | 174776 | 7744 |
| marauder / spitter-base.png | 1024×1024 RGBA8 | 11 | 5592404 | 897524 | 1024×1024 | ETC1S / 37492 | 11 | 699064 | 194510 |
| marauder / spitter-normal.png | 1024×1024 RGBA8 | 11 | 5592404 | 893007 | 512×512 | UASTC / 37808 | 10 | 349552 | 249129 |
| marauder / spitter-glow.png | 512×512 RGBA8 | 10 | 1398100 | 27060 | 512×512 | ETC1S / 37492 | 10 | 174776 | 11847 |
| dragoon / carrier-base.png | 2048×2048 RGBA8 | 12 | 22369620 | 2390998 | 1024×1024 | ETC1S / 37492 | 11 | 699064 | 189703 |
| dragoon / carrier-normal.png | 2048×2048 RGBA8 | 12 | 22369620 | 2390831 | 512×512 | UASTC / 37808 | 10 | 349552 | 244834 |
| dragoon / carrier-glow.png | 1024×1024 RGBA8 | 11 | 5592404 | 79256 | 512×512 | ETC1S / 37492 | 10 | 174776 | 14360 |
| tyrant / brute-base.png | 2048×2048 RGBA8 | 12 | 22369620 | 2494207 | 1024×1024 | ETC1S / 37492 | 11 | 699064 | 180076 |
| tyrant / brute-normal.png | 2048×2048 RGBA8 | 12 | 22369620 | 2386210 | 512×512 | UASTC / 37808 | 10 | 349552 | 227004 |
| tyrant / brute-glow.png | 1024×1024 RGBA8 | 11 | 5592404 | 35568 | 512×512 | ETC1S / 37492 | 10 | 174776 | 6358 |
| pistol / pistol-normal | 512×512 RGBA8 | 10 | 1398100 | 163218 | 256×256 | UASTC / 37808 | 9 | 87408 | 59902 |
| pistol / pistol-base | 512×512 RGBA8 | 10 | 1398100 | 109309 | 256×256 | ETC1S / 37492 | 9 | 43704 | 16491 |
| rifle / rifle-normal | 512×512 RGBA8 | 10 | 1398100 | 174557 | 256×256 | UASTC / 37808 | 9 | 87408 | 63932 |
| rifle / rifle-base | 512×512 RGBA8 | 10 | 1398100 | 119153 | 512×512 | ETC1S / 37492 | 10 | 174776 | 41599 |
| shotgun / shotgun-normal | 512×512 RGBA8 | 10 | 1398100 | 162373 | 256×256 | UASTC / 37808 | 9 | 87408 | 60737 |
| shotgun / shotgun-base | 512×512 RGBA8 | 10 | 1398100 | 103356 | 512×512 | ETC1S / 37492 | 10 | 174776 | 39092 |
| plasma / plasma-emission | 512×512 RGBA8 | 10 | 1398100 | 9855 | 512×512 | ETC1S / 37492 | 10 | 174776 | 6788 |
| plasma / plasma-normal | 512×512 RGBA8 | 10 | 1398100 | 187936 | 256×256 | UASTC / 37808 | 9 | 87408 | 64469 |
| plasma / plasma-base | 512×512 RGBA8 | 10 | 1398100 | 127482 | 512×512 | ETC1S / 37492 | 10 | 174776 | 43072 |
| rocket / rocket-emission | 512×512 RGBA8 | 10 | 1398100 | 11612 | 512×512 | ETC1S / 37492 | 10 | 174776 | 5660 |
| rocket / rocket-normal | 512×512 RGBA8 | 10 | 1398100 | 167367 | 256×256 | UASTC / 37808 | 9 | 87408 | 59318 |
| rocket / rocket-base | 512×512 RGBA8 | 10 | 1398100 | 116220 | 512×512 | ETC1S / 37492 | 10 | 174776 | 39914 |


## Static image-file inventory (UI excluded; supersets labelled above)

| File / embedded image | Size | Encoding | Mips | Decoded RGBA8 GPU bytes | Encoded image bytes |
|---|---|---|---:|---:|---:|
| public/assets/awakening/recovery-kit/kit-display.png | 512×256 | PNG | 10 | 699052 | 6906 |
| public/assets/awakening/recovery-kit/recovery-kit.glb#0 | 512×512 | PNG | 10 | 1398100 | 16001 |
| public/assets/awakening/recovery-kit/recovery-kit.glb#1 | 512×512 | PNG | 10 | 1398100 | 11398 |
| public/assets/awakening/recovery-kit/recovery-kit.glb#2 | 512×512 | PNG | 10 | 1398100 | 8912 |
| public/assets/awakening/recovery-kit/recovery-kit.glb#3 | 1024×1024 | PNG | 11 | 5592404 | 35429 |
| public/assets/awakening/recovery-kit/recovery-kit.glb#4 | 1024×1024 | PNG | 11 | 5592404 | 29875 |
| public/assets/awakening/recovery-kit/recovery-kit.glb#5 | 512×512 | PNG | 10 | 1398100 | 24111 |
| public/assets/awakening/recovery-kit/recovery-kit.glb#6 | 512×512 | PNG | 10 | 1398100 | 23715 |
| public/assets/awakening/recovery-kit/recovery-kit.glb#7 | 512×256 | PNG | 10 | 699052 | 6906 |
| public/assets/awakening/recovery-kit/room-kit.glb#0 | 512×512 | PNG | 10 | 1398100 | 16001 |
| public/assets/awakening/recovery-kit/room-kit.glb#1 | 512×512 | PNG | 10 | 1398100 | 11398 |
| public/assets/awakening/recovery-kit/room-kit.glb#2 | 512×512 | PNG | 10 | 1398100 | 8912 |
| public/assets/awakening/recovery-kit/room-kit.glb#3 | 1024×1024 | PNG | 11 | 5592404 | 35429 |
| public/assets/awakening/recovery-kit/room-kit.glb#4 | 1024×1024 | PNG | 11 | 5592404 | 29875 |
| public/assets/awakening/recovery-kit/room-kit.glb#5 | 512×512 | PNG | 10 | 1398100 | 24111 |
| public/assets/awakening/recovery-kit/room-kit.glb#6 | 512×512 | PNG | 10 | 1398100 | 23715 |
| public/assets/awakening/recovery-kit/room-kit.glb#7 | 512×256 | PNG | 10 | 699052 | 6906 |
| public/assets/awakening/recovery-kit/room-kit.glb#8 | 256×128 | PNG | 9 | 174764 | 1963 |
| public/assets/awakening/recovery-storage/locker-label.png | 256×128 | PNG | 9 | 174764 | 1963 |
| public/assets/awakening/recovery-storage/locker.glb#0 | 512×512 | PNG | 10 | 1398100 | 16001 |
| public/assets/awakening/recovery-storage/locker.glb#1 | 512×512 | PNG | 10 | 1398100 | 24111 |
| public/assets/awakening/recovery-storage/locker.glb#2 | 512×512 | PNG | 10 | 1398100 | 23715 |
| public/assets/awakening/recovery-storage/locker.glb#3 | 1024×1024 | PNG | 11 | 5592404 | 35429 |
| public/assets/awakening/recovery-storage/locker.glb#4 | 1024×1024 | PNG | 11 | 5592404 | 29875 |
| public/assets/awakening/recovery-storage/locker.glb#5 | 512×512 | PNG | 10 | 1398100 | 11398 |
| public/assets/awakening/recovery-storage/locker.glb#6 | 512×512 | PNG | 10 | 1398100 | 8912 |
| public/assets/awakening/recovery-storage/locker.glb#7 | 256×128 | PNG | 9 | 174764 | 1963 |
| public/assets/awakening/recovery-storage/satellite-cabinet.glb#0 | 512×512 | PNG | 10 | 1398100 | 16001 |
| public/assets/awakening/recovery-storage/satellite-cabinet.glb#1 | 512×512 | PNG | 10 | 1398100 | 11398 |
| public/assets/awakening/recovery-storage/satellite-cabinet.glb#2 | 512×512 | PNG | 10 | 1398100 | 8912 |
| public/assets/awakening/recovery-storage/satellite-cabinet.glb#3 | 1024×1024 | PNG | 11 | 5592404 | 35429 |
| public/assets/awakening/recovery-storage/satellite-cabinet.glb#4 | 1024×1024 | PNG | 11 | 5592404 | 29875 |
| public/assets/awakening/recovery-storage/satellite-cabinet.glb#5 | 512×512 | PNG | 10 | 1398100 | 24111 |
| public/assets/awakening/recovery-storage/satellite-cabinet.glb#6 | 512×512 | PNG | 10 | 1398100 | 23715 |
| public/assets/awakening/recovery-storage/trolley.glb#0 | 512×512 | PNG | 10 | 1398100 | 16001 |
| public/assets/awakening/recovery-storage/trolley.glb#1 | 512×512 | PNG | 10 | 1398100 | 24111 |
| public/assets/awakening/recovery-storage/trolley.glb#2 | 512×512 | PNG | 10 | 1398100 | 23715 |
| public/assets/awakening/recovery-storage/trolley.glb#3 | 512×512 | PNG | 10 | 1398100 | 11398 |
| public/assets/awakening/recovery-storage/trolley.glb#4 | 512×512 | PNG | 10 | 1398100 | 8912 |
| public/assets/awakening/recovery-storage/trolley.glb#5 | 1024×1024 | PNG | 11 | 5592404 | 35429 |
| public/assets/awakening/recovery-storage/trolley.glb#6 | 1024×1024 | PNG | 11 | 5592404 | 29875 |
| public/assets/awakening/released-berth/released-berth-atlas.png | 512×512 | PNG | 10 | 1398100 | 16735 |
| public/assets/awakening/released-berth/released-berth-roughness.png | 512×512 | PNG | 10 | 1398100 | 1885 |
| public/assets/awakening/released-berth/released-berth.glb#0 | 512×512 | PNG | 10 | 1398100 | 11398 |
| public/assets/awakening/released-berth/released-berth.glb#1 | 512×512 | PNG | 10 | 1398100 | 8912 |
| public/assets/awakening/released-berth/released-berth.glb#2 | 1024×1024 | PNG | 11 | 5592404 | 35429 |
| public/assets/awakening/released-berth/released-berth.glb#3 | 1024×1024 | PNG | 11 | 5592404 | 29875 |
| public/assets/awakening/released-berth/released-berth.glb#4 | 512×512 | PNG | 10 | 1398100 | 16001 |
| public/assets/awakening/released-berth/released-berth.glb#5 | 512×512 | PNG | 10 | 1398100 | 24111 |
| public/assets/awakening/released-berth/released-berth.glb#6 | 512×512 | PNG | 10 | 1398100 | 23715 |
| public/assets/awakening/released-berth/released-berth.glb#7 | 512×512 | PNG | 10 | 1398100 | 16735 |
| public/assets/awakening/released-berth/released-berth.glb#8 | 512×512 | PNG | 10 | 1398100 | 4519 |
| public/assets/benchmark/cryo-enamel-roughness.png | 512×512 | PNG | 10 | 1398100 | 253094 |
| public/assets/benchmark/cryo-graphics-atlas.png | 1024×1024 | PNG | 11 | 5592404 | 45580 |
| public/assets/benchmark/cryo-surface-01-color.png | 1024×1024 | PNG | 11 | 5592404 | 35429 |
| public/assets/benchmark/cryo-surface-01-metallic.png | 1024×1024 | PNG | 11 | 5592404 | 34708 |
| public/assets/benchmark/cryo-surface-01-roughness.png | 1024×1024 | PNG | 11 | 5592404 | 29762 |
| public/assets/benchmark/cryo-surface-02-color.png | 512×512 | PNG | 10 | 1398100 | 11398 |
| public/assets/benchmark/cryo-surface-02-metallic.png | 512×512 | PNG | 10 | 1398100 | 10503 |
| public/assets/benchmark/cryo-surface-02-roughness.png | 512×512 | PNG | 10 | 1398100 | 10521 |
| public/assets/benchmark/cryo-surface-03-color.png | 512×512 | PNG | 10 | 1398100 | 24111 |
| public/assets/benchmark/cryo-surface-03-metallic.png | 512×512 | PNG | 10 | 1398100 | 5733 |
| public/assets/benchmark/cryo-surface-03-roughness.png | 512×512 | PNG | 10 | 1398100 | 26859 |
| public/assets/benchmark/cryo-surface-04-color.png | 512×512 | PNG | 10 | 1398100 | 16001 |
| public/assets/benchmark/sealed-cryo.glb#0 | 512×512 | PNG | 10 | 1398100 | 24111 |
| public/assets/benchmark/sealed-cryo.glb#1 | 512×512 | PNG | 10 | 1398100 | 23715 |
| public/assets/benchmark/sealed-cryo.glb#2 | 512×512 | PNG | 10 | 1398100 | 11398 |
| public/assets/benchmark/sealed-cryo.glb#3 | 512×512 | PNG | 10 | 1398100 | 8912 |
| public/assets/benchmark/sealed-cryo.glb#4 | 512×512 | PNG | 10 | 1398100 | 16001 |
| public/assets/benchmark/sealed-cryo.glb#5 | 1024×1024 | PNG | 11 | 5592404 | 35429 |
| public/assets/benchmark/sealed-cryo.glb#6 | 1024×1024 | PNG | 11 | 5592404 | 29875 |
| public/assets/benchmark/sealed-cryo.glb#7 | 1024×1024 | PNG | 11 | 5592404 | 45580 |
| public/assets/e9-ship-kit/clinical/comms-uplink-dish-preview-480.png | 480×270 | PNG | 9 | 690620 | 152945 |
| public/assets/e9-ship-kit/clinical/comms-uplink-dish-preview.png | 1920×1080 | PNG | 11 | 11058620 | 2013685 |
| public/assets/e9-ship-kit/clinical/habitation-gallery-pendant-preview-480.png | 480×270 | PNG | 9 | 690620 | 139529 |
| public/assets/e9-ship-kit/clinical/habitation-gallery-pendant-preview.png | 1920×1080 | PNG | 11 | 11058620 | 1776419 |
| public/assets/e9-ship-kit/clinical/hero-preview-480.png | 480×270 | PNG | 9 | 690620 | 164989 |
| public/assets/e9-ship-kit/clinical/hero-preview.png | 1920×1080 | PNG | 11 | 11058620 | 2204335 |
| public/assets/e9-ship-kit/clinical/scanner-arch-preview-480.png | 480×270 | PNG | 9 | 690620 | 131925 |
| public/assets/e9-ship-kit/clinical/scanner-arch-preview.png | 1920×1080 | PNG | 11 | 11058620 | 1832650 |
| public/assets/e9-ship-kit/industrial/airway-exchanger-preview-480.png | 480×270 | PNG | 9 | 690620 | 181629 |
| public/assets/e9-ship-kit/industrial/airway-exchanger-preview.png | 1920×1080 | PNG | 11 | 11058620 | 2270105 |
| public/assets/e9-ship-kit/industrial/cargo-hoist-header-preview-480.png | 480×270 | PNG | 9 | 690620 | 159635 |
| public/assets/e9-ship-kit/industrial/cargo-hoist-header-preview.png | 1920×1080 | PNG | 11 | 11058620 | 2141039 |
| public/assets/e9-ship-kit/industrial/hero-preview-480.png | 480×270 | PNG | 9 | 690620 | 109108 |
| public/assets/e9-ship-kit/industrial/hero-preview.png | 1280×720 | PNG | 11 | 4915052 | 921489 |
| public/assets/e9-ship-kit/industrial/kit-preview-480.png | 480×270 | PNG | 9 | 690620 | 84489 |
| public/assets/e9-ship-kit/industrial/kit-preview.png | 1920×1080 | PNG | 11 | 11058620 | 1821476 |
| public/assets/e9-ship-kit/industrial/workshop-tool-bridge-preview-480.png | 480×270 | PNG | 9 | 690620 | 171401 |
| public/assets/e9-ship-kit/industrial/workshop-tool-bridge-preview.png | 1920×1080 | PNG | 11 | 11058620 | 2229216 |
| public/assets/e9-ship-kit/security/hero-preview-480.png | 480×270 | PNG | 9 | 690620 | 74705 |
| public/assets/e9-ship-kit/security/hero-preview.png | 1200×900 | PNG | 11 | 5759464 | 1057184 |
| public/assets/e9-ship-kit/security/kit-preview-480.png | 480×270 | PNG | 9 | 690620 | 72416 |
| public/assets/e9-ship-kit/security/kit-preview.png | 1920×1080 | PNG | 11 | 11058620 | 1729420 |
| public/assets/e9-ship-kit/security/roof-preview-480.png | 480×270 | PNG | 9 | 690620 | 103426 |
| public/assets/e9-ship-kit/security/roof-preview.png | 1280×720 | PNG | 11 | 4915052 | 961214 |
| public/assets/e9-ship-kit/structure/kit-preview.png | 1500×1200 | PNG | 11 | 9599060 | 1579771 |
| public/assets/environment/concrete_arm.jpg | 512×512 | JPEG | 10 | 1398100 | 47712 |
| public/assets/environment/concrete_diff.jpg | 1024×1024 | JPEG | 11 | 5592404 | 274948 |
| public/assets/environment/concrete_nor_gl.jpg | 1024×1024 | JPEG | 11 | 5592404 | 161124 |
| public/assets/environment/g2_deck_albedo.png | 128×128 | PNG | 8 | 87380 | 10125 |
| public/assets/environment/g2_deck_arm.png | 128×128 | PNG | 8 | 87380 | 10210 |
| public/assets/environment/g2_deck_normal.png | 128×128 | PNG | 8 | 87380 | 7125 |
| public/assets/environment/metal_plate_02_arm.jpg | 512×512 | JPEG | 10 | 1398100 | 114700 |
| public/assets/environment/metal_plate_02_diff.jpg | 1024×1024 | JPEG | 11 | 5592404 | 167635 |
| public/assets/environment/metal_plate_02_nor_gl.jpg | 1024×1024 | JPEG | 11 | 5592404 | 84865 |
| public/assets/environment/metal_plate_arm.jpg | 512×512 | JPEG | 10 | 1398100 | 117241 |
| public/assets/environment/metal_plate_diff.jpg | 1024×1024 | JPEG | 11 | 5592404 | 184245 |
| public/assets/environment/metal_plate_nor_gl.jpg | 1024×1024 | JPEG | 11 | 5592404 | 366065 |
| public/assets/materials/steel-floor-albedo.png | 1254×1254 | PNG | 11 | 8384072 | 2778781 |
| public/assets/models/basilisk.glb#0 | 1024×1024 | PNG | 11 | 5592404 | 893303 |
| public/assets/models/basilisk.glb#1 | 1024×1024 | PNG | 11 | 5592404 | 901265 |
| public/assets/models/basilisk.glb#2 | 512×512 | PNG | 10 | 1398100 | 17664 |
| public/assets/models/dragoon.glb#0 | 2048×2048 | PNG | 12 | 22369620 | 2390998 |
| public/assets/models/dragoon.glb#1 | 2048×2048 | PNG | 12 | 22369620 | 2390831 |
| public/assets/models/dragoon.glb#2 | 1024×1024 | PNG | 11 | 5592404 | 79256 |
| public/assets/models/dretch.glb#0 | 1024×1024 | PNG | 11 | 5592404 | 874454 |
| public/assets/models/dretch.glb#1 | 1024×1024 | PNG | 11 | 5592404 | 963906 |
| public/assets/models/dretch.glb#2 | 512×512 | PNG | 10 | 1398100 | 25225 |
| public/assets/models/marauder.glb#0 | 1024×1024 | PNG | 11 | 5592404 | 897524 |
| public/assets/models/marauder.glb#1 | 1024×1024 | PNG | 11 | 5592404 | 893007 |
| public/assets/models/marauder.glb#2 | 512×512 | PNG | 10 | 1398100 | 27060 |
| public/assets/models/marine.glb#0 | 2048×2048 | PNG | 12 | 22369620 | 5649078 |
| public/assets/models/marine.glb#1 | 2048×2048 | PNG | 12 | 22369620 | 5197712 |
| public/assets/models/marine.glb#2 | 2048×2048 | PNG | 12 | 22369620 | 3473172 |
| public/assets/models/marine.glb#3 | 2048×2048 | PNG | 12 | 22369620 | 121348 |
| public/assets/models/pistol.glb#0 | 512×512 | PNG | 10 | 1398100 | 163218 |
| public/assets/models/pistol.glb#1 | 512×512 | PNG | 10 | 1398100 | 109309 |
| public/assets/models/plasma.glb#0 | 512×512 | PNG | 10 | 1398100 | 9855 |
| public/assets/models/plasma.glb#1 | 512×512 | PNG | 10 | 1398100 | 187936 |
| public/assets/models/plasma.glb#2 | 512×512 | PNG | 10 | 1398100 | 127482 |
| public/assets/models/rifle.glb#0 | 512×512 | PNG | 10 | 1398100 | 174557 |
| public/assets/models/rifle.glb#1 | 512×512 | PNG | 10 | 1398100 | 119153 |
| public/assets/models/rocket.glb#0 | 512×512 | PNG | 10 | 1398100 | 11612 |
| public/assets/models/rocket.glb#1 | 512×512 | PNG | 10 | 1398100 | 167367 |
| public/assets/models/rocket.glb#2 | 512×512 | PNG | 10 | 1398100 | 116220 |
| public/assets/models/shotgun.glb#0 | 512×512 | PNG | 10 | 1398100 | 162373 |
| public/assets/models/shotgun.glb#1 | 512×512 | PNG | 10 | 1398100 | 103356 |
| public/assets/models/tyrant.glb#0 | 2048×2048 | PNG | 12 | 22369620 | 2494207 |
| public/assets/models/tyrant.glb#1 | 2048×2048 | PNG | 12 | 22369620 | 2386210 |
| public/assets/models/tyrant.glb#2 | 1024×1024 | PNG | 11 | 5592404 | 35568 |
| public/assets/passenger-vault/material-budget/chamber.glb#0 | 256×256 | PNG | 9 | 349524 | 13489 |
| public/assets/passenger-vault/material-budget/chamber.glb#1 | 256×256 | PNG | 9 | 349524 | 35528 |
| public/assets/passenger-vault/material-budget/chamber.glb#2 | 256×256 | PNG | 9 | 349524 | 22879 |
| public/assets/passenger-vault/material-budget/chamber.glb#3 | 256×256 | PNG | 9 | 349524 | 36757 |
| public/assets/passenger-vault/material-budget/chamber.glb#4 | 256×256 | PNG | 9 | 349524 | 23779 |
| public/assets/passenger-vault/material-budget/chamber.glb#5 | 256×256 | PNG | 9 | 349524 | 43693 |
| public/assets/passenger-vault/material-budget/row-carrier.glb#0 | 256×256 | PNG | 9 | 349524 | 13489 |
| public/assets/passenger-vault/material-budget/row-carrier.glb#1 | 256×256 | PNG | 9 | 349524 | 35528 |
| public/assets/passenger-vault/material-budget/row-carrier.glb#2 | 256×256 | PNG | 9 | 349524 | 22879 |
| public/assets/passenger-vault/material-budget/row-carrier.glb#3 | 256×256 | PNG | 9 | 349524 | 36757 |
| public/assets/passenger-vault/material-budget/row-carrier.glb#4 | 256×256 | PNG | 9 | 349524 | 23779 |
| public/assets/passenger-vault/material-budget/row-carrier.glb#5 | 256×256 | PNG | 9 | 349524 | 43693 |
| public/assets/passenger-vault/materials/material-carrier-basecolor.png | 256×256 | PNG | 9 | 349524 | 21543 |
| public/assets/passenger-vault/materials/material-carrier-orm.png | 256×256 | PNG | 9 | 349524 | 32885 |
| public/assets/passenger-vault/materials/material-chamber.glb#0 | 256×256 | PNG | 9 | 349524 | 12326 |
| public/assets/passenger-vault/materials/material-chamber.glb#1 | 256×256 | PNG | 9 | 349524 | 27358 |
| public/assets/passenger-vault/materials/material-chamber.glb#2 | 256×256 | PNG | 9 | 349524 | 21543 |
| public/assets/passenger-vault/materials/material-chamber.glb#3 | 256×256 | PNG | 9 | 349524 | 32885 |
| public/assets/passenger-vault/materials/material-chamber.glb#4 | 256×256 | PNG | 9 | 349524 | 21347 |
| public/assets/passenger-vault/materials/material-chamber.glb#5 | 256×256 | PNG | 9 | 349524 | 33870 |
| public/assets/passenger-vault/materials/material-metal-basecolor.png | 256×256 | PNG | 9 | 349524 | 21347 |
| public/assets/passenger-vault/materials/material-metal-orm.png | 256×256 | PNG | 9 | 349524 | 33870 |
| public/assets/passenger-vault/materials/material-row-carrier.glb#0 | 256×256 | PNG | 9 | 349524 | 12326 |
| public/assets/passenger-vault/materials/material-row-carrier.glb#1 | 256×256 | PNG | 9 | 349524 | 27358 |
| public/assets/passenger-vault/materials/material-row-carrier.glb#2 | 256×256 | PNG | 9 | 349524 | 21543 |
| public/assets/passenger-vault/materials/material-row-carrier.glb#3 | 256×256 | PNG | 9 | 349524 | 32885 |
| public/assets/passenger-vault/materials/material-row-carrier.glb#4 | 256×256 | PNG | 9 | 349524 | 21347 |
| public/assets/passenger-vault/materials/material-row-carrier.glb#5 | 256×256 | PNG | 9 | 349524 | 33870 |
| public/assets/passenger-vault/materials/material-shell-basecolor.png | 256×256 | PNG | 9 | 349524 | 12326 |
| public/assets/passenger-vault/materials/material-shell-orm.png | 256×256 | PNG | 9 | 349524 | 27358 |
| public/assets/passenger-vault/materials/wear-carrier-basecolor.png | 256×256 | PNG | 9 | 349524 | 22879 |
| public/assets/passenger-vault/materials/wear-carrier-orm.png | 256×256 | PNG | 9 | 349524 | 36757 |
| public/assets/passenger-vault/materials/wear-chamber.glb#0 | 256×256 | PNG | 9 | 349524 | 13489 |
| public/assets/passenger-vault/materials/wear-chamber.glb#1 | 256×256 | PNG | 9 | 349524 | 35528 |
| public/assets/passenger-vault/materials/wear-chamber.glb#2 | 256×256 | PNG | 9 | 349524 | 22879 |
| public/assets/passenger-vault/materials/wear-chamber.glb#3 | 256×256 | PNG | 9 | 349524 | 36757 |
| public/assets/passenger-vault/materials/wear-chamber.glb#4 | 256×256 | PNG | 9 | 349524 | 23779 |
| public/assets/passenger-vault/materials/wear-chamber.glb#5 | 256×256 | PNG | 9 | 349524 | 43693 |
| public/assets/passenger-vault/materials/wear-metal-basecolor.png | 256×256 | PNG | 9 | 349524 | 23779 |
| public/assets/passenger-vault/materials/wear-metal-orm.png | 256×256 | PNG | 9 | 349524 | 43693 |
| public/assets/passenger-vault/materials/wear-row-carrier.glb#0 | 256×256 | PNG | 9 | 349524 | 13489 |
| public/assets/passenger-vault/materials/wear-row-carrier.glb#1 | 256×256 | PNG | 9 | 349524 | 35528 |
| public/assets/passenger-vault/materials/wear-row-carrier.glb#2 | 256×256 | PNG | 9 | 349524 | 22879 |
| public/assets/passenger-vault/materials/wear-row-carrier.glb#3 | 256×256 | PNG | 9 | 349524 | 36757 |
| public/assets/passenger-vault/materials/wear-row-carrier.glb#4 | 256×256 | PNG | 9 | 349524 | 23779 |
| public/assets/passenger-vault/materials/wear-row-carrier.glb#5 | 256×256 | PNG | 9 | 349524 | 43693 |
| public/assets/passenger-vault/materials/wear-shell-basecolor.png | 256×256 | PNG | 9 | 349524 | 13489 |
| public/assets/passenger-vault/materials/wear-shell-orm.png | 256×256 | PNG | 9 | 349524 | 35528 |
| public/assets/passenger-vault/runtime/chamber.glb#0 | 256×256 | PNG | 9 | 349524 | 13489 |
| public/assets/passenger-vault/runtime/chamber.glb#1 | 256×256 | PNG | 9 | 349524 | 35528 |
| public/assets/passenger-vault/runtime/chamber.glb#2 | 256×256 | PNG | 9 | 349524 | 22879 |
| public/assets/passenger-vault/runtime/chamber.glb#3 | 256×256 | PNG | 9 | 349524 | 36757 |
| public/assets/passenger-vault/runtime/chamber.glb#4 | 256×256 | PNG | 9 | 349524 | 23779 |
| public/assets/passenger-vault/runtime/chamber.glb#5 | 256×256 | PNG | 9 | 349524 | 566 |
| public/assets/passenger-vault/runtime/chamber.glb#6 | 256×256 | PNG | 9 | 349524 | 43693 |
| public/assets/passenger-vault/runtime/distribution-north.glb#0 | 2048×512 | PNG | 12 | 5592412 | 23777 |
| public/assets/passenger-vault/runtime/distribution-north.glb#1 | 2048×512 | PNG | 12 | 5592412 | 14428 |
| public/assets/passenger-vault/runtime/distribution-north.glb#2 | 2048×512 | PNG | 12 | 5592412 | 3690 |
| public/assets/passenger-vault/runtime/distribution-north.glb#3 | 256×256 | PNG | 9 | 349524 | 23779 |
| public/assets/passenger-vault/runtime/distribution-north.glb#4 | 256×256 | PNG | 9 | 349524 | 43693 |
| public/assets/passenger-vault/runtime/distribution-south.glb#0 | 2048×512 | PNG | 12 | 5592412 | 23777 |
| public/assets/passenger-vault/runtime/distribution-south.glb#1 | 2048×512 | PNG | 12 | 5592412 | 14428 |
| public/assets/passenger-vault/runtime/distribution-south.glb#2 | 2048×512 | PNG | 12 | 5592412 | 3690 |
| public/assets/passenger-vault/runtime/distribution-south.glb#3 | 256×256 | PNG | 9 | 349524 | 23779 |
| public/assets/passenger-vault/runtime/distribution-south.glb#4 | 256×256 | PNG | 9 | 349524 | 43693 |
| public/assets/passenger-vault/runtime/equipment.glb#0 | 256×256 | PNG | 9 | 349524 | 13489 |
| public/assets/passenger-vault/runtime/equipment.glb#1 | 256×256 | PNG | 9 | 349524 | 35528 |
| public/assets/passenger-vault/runtime/equipment.glb#2 | 256×256 | PNG | 9 | 349524 | 22879 |
| public/assets/passenger-vault/runtime/equipment.glb#3 | 256×256 | PNG | 9 | 349524 | 36757 |
| public/assets/passenger-vault/runtime/equipment.glb#4 | 256×256 | PNG | 9 | 349524 | 23779 |
| public/assets/passenger-vault/runtime/equipment.glb#5 | 256×256 | PNG | 9 | 349524 | 566 |
| public/assets/passenger-vault/runtime/equipment.glb#6 | 256×256 | PNG | 9 | 349524 | 43693 |
| public/assets/passenger-vault/runtime/equipment.glb#7 | 2048×512 | PNG | 12 | 5592412 | 23777 |
| public/assets/passenger-vault/runtime/equipment.glb#8 | 2048×512 | PNG | 12 | 5592412 | 14428 |
| public/assets/passenger-vault/runtime/equipment.glb#9 | 2048×512 | PNG | 12 | 5592412 | 3690 |
| public/assets/passenger-vault/runtime/equipment.glb#10 | 1024×512 | PNG | 11 | 2796204 | 5122 |
| public/assets/passenger-vault/runtime/equipment.glb#11 | 1024×512 | PNG | 11 | 2796204 | 4323 |
| public/assets/passenger-vault/runtime/monitor-north.glb#0 | 2048×512 | PNG | 12 | 5592412 | 23777 |
| public/assets/passenger-vault/runtime/monitor-north.glb#1 | 2048×512 | PNG | 12 | 5592412 | 14428 |
| public/assets/passenger-vault/runtime/monitor-north.glb#2 | 2048×512 | PNG | 12 | 5592412 | 3690 |
| public/assets/passenger-vault/runtime/monitor-south.glb#0 | 1024×512 | PNG | 11 | 2796204 | 5122 |
| public/assets/passenger-vault/runtime/monitor-south.glb#1 | 1024×512 | PNG | 11 | 2796204 | 4323 |
| public/assets/passenger-vault/runtime/monitor-south.glb#2 | 2048×512 | PNG | 12 | 5592412 | 3690 |
| public/assets/passenger-vault/runtime/monitor-south.glb#3 | 2048×512 | PNG | 12 | 5592412 | 3690 |
| public/assets/passenger-vault/runtime/monitor-south.glb#4 | 2048×512 | PNG | 12 | 5592412 | 23777 |
| public/assets/passenger-vault/runtime/monitor-south.glb#5 | 2048×512 | PNG | 12 | 5592412 | 14428 |
| public/assets/passenger-vault/runtime/row-carrier.glb#0 | 256×256 | PNG | 9 | 349524 | 13489 |
| public/assets/passenger-vault/runtime/row-carrier.glb#1 | 256×256 | PNG | 9 | 349524 | 35528 |
| public/assets/passenger-vault/runtime/row-carrier.glb#2 | 256×256 | PNG | 9 | 349524 | 22879 |
| public/assets/passenger-vault/runtime/row-carrier.glb#3 | 256×256 | PNG | 9 | 349524 | 36757 |
| public/assets/passenger-vault/runtime/row-carrier.glb#4 | 256×256 | PNG | 9 | 349524 | 23779 |
| public/assets/passenger-vault/runtime/row-carrier.glb#5 | 256×256 | PNG | 9 | 349524 | 43693 |
| public/assets/passenger-vault/runtime/service-finish.glb#0 | 2048×512 | PNG | 12 | 5592412 | 23777 |
| public/assets/passenger-vault/runtime/service-finish.glb#1 | 2048×512 | PNG | 12 | 5592412 | 14428 |
| public/assets/passenger-vault/runtime/service-finish.glb#2 | 2048×512 | PNG | 12 | 5592412 | 3690 |
| public/assets/vfx/Explosion01.png | 1280×1280 | PNG | 11 | 8738120 | 1062981 |
| public/assets/vfx/Flame02.png | 2048×1024 | PNG | 12 | 11184812 | 1685834 |
| public/assets/vfx/WispySmoke02.png | 1024×1024 | PNG | 11 | 5592404 | 1282603 |
| public/assets/vfx/containment-v6/elements.png | 2048×2048 | PNG | 12 | 22369620 | 2759007 |
