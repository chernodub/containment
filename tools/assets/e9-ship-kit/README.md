# Original E9 ship kit

These Blender5.3 scripts generate the original MIT ship-interior packs. There
are no downloaded meshes or textures in these packs. Each script exports stock
glTF PBR materials, bevelled geometry, panel seams and deterministic baked vertex
AO; glass and visible emissive sources remain separate finish roles. Runtime
instances merge by finish and retain metre scale (32 game units per metre).

Rebuild from the repository root:

```sh
blender -b -P tools/assets/e9-ship-kit/structure.py
blender -b -P tools/assets/e9-ship-kit/security.py -- --preview
blender -b -P tools/assets/e9-ship-kit/clinical.py -- --preview
blender -b -P tools/assets/e9-ship-kit/industrial.py -- --preview
```

Each pack's `manifest.json` under `public/assets/e9-ship-kit/` records its rebuild
command, AO method, dimensions, material roles, triangle counts and GLB hash.
Use the command in the individual manifest if script-specific flags differ.
The saved `.blend` files are editable authoring exports; previews are art review,
not runtime textures. The game fetches only GLBs, lazily after entering gameplay.

- Structure: capped high/low bulkheads, jamb, flush threshold, ceramic/rubber/
  oxide panels and a glass service channel with pipes below it.
- Security: scanner gate with readable roof instrumentation, glazed guard desk,
  roller conveyor with a retained baggage tray, lockers, queue rail, bench,
  console and deck05 signage.
- Clinical: analyser, testbench, diagnostic tower, cryo service console, low/tall
  communication racks, domestic berth/desk/storage, access panels and an8.06m
  clear probe arch, a domestic pendant and a segmented uplink dish.
- Industrial: rooted ventilation plenums, pump skid, pipe manifold, cargo
  restraint bank, shielding/reactor service bays, open cable tray and real
  drainage grating, a motorised cargo hoist, a three-tool workshop bridge and a
  rooted overhead airway exchanger.

The retained native cryo, habitation, garden, armory and reactor landmarks keep
separate owners and their existing provenance. Older/legacy rooms still use the
CC0 kit fallback. Keep those pack credits and licenses; this original kit does
not relicense retained third-party assets.

P11 finishing pass: single-facet manufactured chamfers replace the previous soft
2-segment bevels; sub-centimetre hardware keeps crisp edges. After original AO,
`craft.py` bakes convex edge wear and concave grime into existing corner colours,
preserving emissive, glass and floor finishes. Asset origins/footprints remain
unchanged. New service families are authored by
`tools/assets/p11-set-pieces/kit_families.py` (separate P11 service-kit pack).

Rebuild all four E9 packs serially with four render threads:
`tools/assets/e9-ship-kit/rebuild.sh`. Set `BLENDER` to override the executable.
For the current review stage, run
`blender -b -P tools/assets/e9-ship-kit/review_craft.py -- industrial`
(or `structure`, `security`, `clinical`). Review images remain in
`artifacts/nextgen/p11-final/beauty/`, not the shipped pack.
