# K12 — second-generation hero marine (original MIT)

`sh tools/assets/k12-hero/rebuild.sh` rebuilds everything (Blender 5.3 only).

- `kit.py` hard-surface toolkit: 2D outlines (fillets, edge profiles with rolled lip + panel groove) conformed
  onto anatomy along planar/cylindrical/spherical rays (`plate`), constrained-Delaunay fill, real walls and
  chamfers; sweeps, lathes, ribbons, fasteners, stencil text, weight transfer.
- `materials.py` role shaders: painted ceramic/rig colours with chipped edges to primer and metal, cavity
  grime, streaks, scratches, woven undersuit, smoked visor over a HUD glow; `albedo`/`emission` modes are the
  reduced-wear bake versions for the game atlas.
- `helmet.py` Crown-keel helmet (options 1–3; 1 shipped). `-- --sheet` renders the design sheet.
- `body.py` undersuit, armour, gloves, boots and the four rig variants.
- `marine.py` builds game + close-up LODs from one description; `--review`, `--bake` (2048² atlas, GLB export
  through `tools/assets/k10-marine/contract.py` on the untouched skeleton), `--hero` (close-up GLB).
- `hero.py` stages the close-up: pose (`rifle_delta` over `stand` + brace), glove grip, K10 weapon, light rig.
- `portraits.py` rig portraits, title hero layer, `--hands` grip study, `--preview`.
- `contact.py`, `crop.py` review helpers (Blender numpy; Pillow is not required).

The retained skeleton/clips (`tools/assets/k10-marine/marine-contract.glb`) keep their separate CC BY-SA
attribution. Review output goes to `artifacts/nextgen/k12-work/` (gitignored).
