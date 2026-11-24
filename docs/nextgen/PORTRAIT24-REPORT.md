# PORTRAIT24 — Rig selection

## Shipped selector at f4212bf2

- Breacher’s near-white knees and flat yellow dome carry more contrast than the short ram gauntlet tucked under the shotgun.
- Cryo repeats Breacher’s side stance almost exactly, with only the end of a dewar visible behind the near shoulder and little space to trace the hose.
- Pyro has the clearest stance, but the broad grey launcher crosses both thighs and the pack barely breaks the orange dome’s outline.
- Arc’s plasma prongs clear the torso, but the conductor gear sits below the helmet and overlaps the purple dome, so the pose reads as another rifle carrier.

## PORTRAIT24 portraits

The selector uses the close-up version of the K12 marine that supplied the title hero. The four weapon holds come from the contract rig, with a wider foot placement and the original boot rotation restored after the hips turn. Breacher lowers the shotgun and brace together. A warm upper key describes the white plates, a softer cool light opens the joints, and a rig-coloured light catches the far edge. The close-up materials retain shoulder wear, the unit marking and the cyan face behind the visor rim.

The portrait equipment mounts on the existing rig bones. Breacher carries a broad clipped-corner strike plate over the ram gauntlet. Cryo carries two tall dewars with insulated return loops, Pyro carries flared exhausts and a wide launcher nozzle, and Arc carries a high fork on a stack of conductor insulators. The equipment variants are built only for the close-up GLB.

### Re-render and capture

From the repository root with Blender on PATH, the studio command builds the close-up source, renders the four plates and records their byte counts in the studio manifest.

```sh
npm run studio -- --only='^portrait-'
npm run build
npm run capture -- --label=portrait24-after --scenarios=rig-select,rig-select-cryo,rig-select-pyro,rig-select-arc,rig-inspect-open,play22-death
```

For lighting or pose iteration on one rig using the same source and camera:

```sh
blender -b --python-exit-code 1 -P tools/assets/k12-hero/marine.py -- --hero --portrait-kit
blender -b --python-exit-code 1 -P tools/assets/k12-hero/selection24.py -- --rig cryo --preview --out artifacts/nextgen/portrait24-work
```

### Delivery

The four transparent RGBA PNGs remain 640×640 and use their existing names in `public/assets/ui/studio/`.

| Rig | Shipped bytes | PORTRAIT24 bytes |
| --- | ---: | ---: |
| Breacher | 194,907 | 239,529 |
| Cryo | 192,113 | 228,303 |
| Pyro | 261,705 | 235,051 |
| Arc | 201,140 | 219,444 |
| **Total** | **849,865** | **922,327 (+8.5%)** |

The comparison sheet pairs the shipped and revised rigs in outline, greyscale and colour. Run `python3 tools/assets/k12-hero/selection24_sheet.py` with Pillow installed after the capture. It reads the original PNGs from Git at `f4212bf2` and writes `artifacts/nextgen/portrait24-after/rig-comparison.png` alongside the six screen reductions.

At 480×270 the easiest silhouettes to name are Pyro, with the two flared stacks and broad nozzle, and Arc, with the single tall fork. Cryo's tanks form a sloping mass behind the head with the hose loop above it. The Breacher ram sits lower and farther forward. The underside of the visor and the return of each white plate keep some shadow at native size. The selector shows the shoulder number, but the small portrait beside the death-card heading loses the number and most of the hose detail.

The black cutouts prompted one last change to Breacher. Turning the elbow outward showed the shield edge-on. The delivered pose keeps the close guard and widens the ram plate until its lower corner clears the waist. Three impact bars sit across its striking face. Breacher and Cryo still share the closest boot stance of the four.

The final production build passed. The desktop capture completed all six scenes at 1920×1080, including expanded Inspect and the Cryo Stalker-contact death card. The 480×270 reductions retain the visor, dome and equipment silhouette on the four selector views.
