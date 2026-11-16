# Original E10 floor library (MIT)

Rebuild with Blender 5.3 and Pillow:

```
blender -b -P tools/assets/e10-floors/bake.py
python3 tools/assets/e10-floors/pack.py
```

Cycles selected-to-active diffuse, tangent-space normal and ambient-occlusion bakes project actual bevelled plate modules, hex fasteners, raised tread, drains and captive service hatches onto a 5.6m four-variant atlas. Ten environment families alter fabrication. Shared trim contains rolled kickplate lips and bolt courses. The modelled decal atlas contains boot/tyre scuffs, spills/scorches, chipped service markings and bay numerals. No downloaded imagery or third-party assets.

Runtime files are lossless WebP, 1024² per environment map (three maps; AO R, roughness G), with half-size derivatives. All normal/ORM data is linear; base colour/decal/trim albedo is sRGB. The manifest records file sizes and SHA256. The existing E9 deck mesh and kit readiness owner consume the maps; they do not change collision, floor heights, ink geometry or saved state.

If Cycles/Embree crashes during a long batch, rebuild remaining environments separately, then `-- shared`; the deterministic seeds and map dimensions are identical. PNG bake intermediates are removed by packing. Original overhaul assets ship under the repository MIT license.

`E10DeckTiles` splits the existing hull-clipped triangles at 2.8m tile boundaries, retaining continuous UV derivatives and weighted variant selection. Service lanes use a separate material, sharing the primary family unless communications, maintenance or containment calls for cargo/security tread. No floor skin or walking cover adds a collider.

During room readiness, `E10DeckStory` places atlas scuffs along the arena-to-exit route and stamps breach scorch/acid, chipped thresholds and a dragged-case mark. `DeckLightBake` builds a 256² RGBA static field for ceiling falloff, enclosure, captive under-light/violet spill and amber status spill. Both use native material sampler slots so existing preparation proxies can substitute synthetic images. Low retains the story and static light with 512² deck maps, and hides the extra ceiling assemblies.

The 66 shipped WebP images total 921,956 bytes. Active floor image storage, estimated as RGBA8 plus mipmaps, is 24.25MiB on High or 6.25MiB on Low for one family; a distinct service family adds 16MiB or 4MiB. These estimates exclude renderer attachments, retained GPU images after a tier switch, decoded source images and all other room assets. Both resolutions decode before readiness; the room owner disposes every texture exactly once, including after a graphics recovery.

File-only review helpers:

```
python3 tools/assets/e10-floors/review.py <capture-directory> <review-directory> <room-csv>
python3 tools/assets/e10-floors/gallery.py artifacts/nextgen/e10-final
```

The first produces exact 480×270 reductions and E9/E10 matched five-view sheets. The second labels and links the existing gallery assembler's preserved native images and receipts. Neither runs the game or measures performance.
