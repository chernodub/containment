# T12 texture memory — incomplete implementation

No shipping assets or runtime code were changed. This delivery does not meet the requested optimization acceptance criteria.

`npm ci` and `npm run build` passed. The baseline breakdown first failed with `listen EPERM 127.0.0.1`; it was retried with elevated permission. The ordinary Pyro seed-1729 campaign failed before entering a room under the restricted invocation. There is no successful campaign, recovery observation, visual comparison, preparation measurement or zero-combat-compilation certification from this delivery.

## Inventory

Run `node tools/assets/t12-textures/inventory.mjs`. The retained table is `artifacts/nextgen/t12-final/inventory.md`, with machine-readable details in `inventory.json`. It enumerates 259 images and 62 GLBs from public/assets. It is a folder inventory, **not** an exhaustive runtime residency table: it includes unused/duplicate resources and needs filtering against runtime owners. GPU estimates assume RGBA8 with full mip chains; driver overhead is excluded. External GLB image URIs and unsupported image formats need follow-up.

The marine contains four 2048×2048 PNG images, each 22,369,620 decoded mipmapped bytes, totaling 85.3333 MiB. Their encoded payloads total 14,441,310 bytes. All model GLBs under public/assets/models total 55,744,684 bytes in this checkout; this differs from the task's historical 37 MB baseline and must not be silently substituted for it.

## Material findings and recommendations

ActorFlatSkin preserves the original marine finish through originalMarineRig; the generic flat-skin replacement does not prove its maps unused. No maps were dropped. Kit and floor files remain untouched. Proposed marine 1024² sizing would reduce the four RGBA8 mip chains to about 21.33 MiB, but this is a projection, not a shipped or visually accepted result. Creature and weapon sizing needs projected coverage and paired gameplay review before choosing limits.

Neither toktx nor ktx is installed on PATH. No encoder, dependency, KTX2 loader, fallback, transcoder hosting or reproducible shipping texture conversion was implemented. Missing local encoders alone do not establish impossibility; the remaining implementation is outstanding.

## Before → after

Marine estimated GPU storage: 85.33 → 85.33 MiB (unchanged).
Model folder download bytes: 55.744684 → 55.744684 MB (unchanged).
Total gameplay GPU storage: unmeasured.
Nothing is claimed visually equivalent from capture evidence; no visual files were opened. Portrait/title source files are unchanged.
