# GROW13 — Brood growth kit handoff (for the room-dressing agent)

The Lantern Brood's anatomy grown as architecture: wine flesh, dusky shell slabs and bone-mauve ribs, sinew straps,
violet lantern organs. Built with the K11 SDF sculpting pipeline.

- Rebuild: `sh tools/assets/k11-creatures/growth/rebuild.sh` (≈2 min; `--no-render` skips review renders; `--only=a,b` is a scratch build that does not export).
- Ships: `public/assets/brood-growth/brood-growth.glb`, `brood-growth-normal.png` (1024 shared tangent normal atlas), `manifest.json`
  (per-piece triangles, measured glTF bounds, anchor and placement notes).
- Format = the P11 set-piece contract: static meshes, named stock-PBR finishes, `COLOR_0` (albedo × baked AO), normal map only.
  It is already registered as pack **`p11-brood`** in `src/render/world/OriginalShipKitAssets.ts` (cache cap raised to 4 MB for this pack; GLB is 2.8 MB).
  Place it like any P11 piece: `{pack:'p11-brood', asset:'brood-nest-large', matrix, purpose}` in the room's `P11*Placements.ts`.
- Review images: `artifacts/nextgen/growth-final/` (`review-swarm-junction.png` is the composed test below, in game; `kit-beauty.png`, `kit-gameplay.png`).

## Finishes (emissive names the game can pulse)

| Finish | Role | Pulse |
|---|---|---|
| `brood-growth` | everything opaque (flesh, shell, ribs, creep) — white base × COLOR_0 + normal atlas | none |
| `brood-lantern` | violet lantern organs (hive heart core, nest lantern clusters, consumed-shell lantern, duct) | slow heartbeat, 0.6–1.4 × |
| `brood-pod-glow` | pods and the depths of brood openings / hatching vents | very slow, dim, out of phase with the lantern |

The loader turns emissive triangles into practical lamps; the hive heart therefore lights its own ribs. No piece uses the hostile red-orange.

## Pieces (metres; origin bottom-centre; front = glTF +Z toward the camera)

| Piece | Tris | Size (w × h × d) | Anchor / use |
|---|---:|---|---|
| `brood-hive-heart` | 12000 | 5.5 × 4.6 × 6.2 (incl. floor spill) | free-standing landmark; rib cage around a suspended lantern organ, webs, lantern clusters at the roots |
| `brood-nest-large` | 6000 | 4.6 × 3.3 × 2.6 | wall-backed: back plane at glTF −Z = −1.3 m; flesh climbs the wall to 3.3 m; brood openings low-front, lantern cluster in the crown split, outflow spills ≈2 m toward the room |
| `brood-nest-medium` | 2000 | 2.1 × 1.8 × 1.3 | wall-backed at −Z = −0.65 m; wall climb to 1.8 m |
| `brood-creep-a/b/c` | 1200 each | 2.6×1.6 / 1.8×1.8 / 3.2×1.0, ≤8 cm relief | floor crust, walkable, low contrast; rotate/mirror/scale freely, overlap each other and wall feet |
| `brood-creep-wall` | 1200 | 1.8 × 1.4 | same crust for walls/equipment sides: rotate −90° about X so the underside lies on the wall plane |
| `brood-web-short/medium/long` | 1500 each | span 1.5 / 3 / 5 m | anchor A at origin, anchor B at +X = span; **no floor cut** (membrane sags below the A→B line). Scale X to the real gap, rotate about the A→B axis to tilt the sheet |
| `brood-pods-small/large` | 2000 each | 1.3 / 2.5 m clutch | egg pods in flesh cups with veins on an irregular flesh spill |
| `brood-pods-hatched` | 2000 | 1.5 m | clutch with one torn-open egg (post-hatch) |
| `brood-burst-duct` | 2000 | 2.4 × 0.7 × 2.4 | over a 1.6 m deck panel or vent: torn frame plates, brood opening glowing deep, growth pouring toward glTF +Z |
| `brood-consumed-shell` | 2000 | 1.45 × 1.3 × 1.05 (+ spill) | drape over a 1.2 × 0.8 × 1.0 m box: place at the prop origin, non-uniform scale to the prop's bounds; two tears show the machine inside |

## How to make it read as masses consuming architecture

1. **Anchor every mass on architecture** — wall, corner, duct bank, equipment — never free-floating in the deck. The nests and burst ducts carry their own spill; extend it with 2–4 creep pieces fanning *away* from the source and *under* nearby props.
2. **Overlap, don't scatter**: creep pieces overlap each other by 20–40 % and run up wall feet (pair floor creep with `brood-creep-wall` at the same x). Swallow at least one existing prop per room with `brood-consumed-shell`.
3. **Connect masses with webs** (wall-to-wall across corners, floor-to-wall from a nest to a duct bank, across doorway tops at 2.4–2.8 m). A web's anchors should land on a mass or architecture, never on bare deck.
4. **Keep the fight lane readable**: only creep under where actors fight (low contrast by design). Nests, pods, ducts and the heart go on edges, corners and behind cover lines. Hatched pods and burst ducts mark where enemies come from — put them at spawn/ingress edges.

### Composed examples (positions in metres relative to a wall/corner; x along the wall, z out into the room, y up; glTF frame)

A. **Consumed duct corner** (corner at (0,0,0), walls along +x and +z):
- `brood-nest-large` at (2.6, 0, 1.3), yaw 0 (back against the +x wall).
- `brood-nest-medium` at (1.0, 0, 3.0), yaw +90° (back against the +z wall).
- `brood-web-medium` from (0.4, 2.6, 0.4) to (3.2, 2.2, 0.4) (corner top, wall-to-wall: yaw so +X points along the wall, scale X to the measured gap).
- `brood-creep-a` at (3.0, 0, 3.2) yaw 20°; `brood-creep-c` at (5.2, 0, 2.0) yaw −10°; `brood-creep-wall` on the +x wall at (5.0, 0.6, 0.02).
- `brood-pods-large` at (1.8, 0, 3.4).

B. **Swallowed console row** (wall along +x at z=0, consoles 1.2 m wide at z=0.6):
- `brood-consumed-shell` on two of three consoles (scaled to their bounds), the third left half-clean.
- `brood-creep-b` at (1.6, 0, 1.4) linking the two shells; `brood-web-short` between the shell tops (y≈1.1).
- `brood-pods-small` at (4.2, 0, 1.0) in front of the clean console (the next one being eaten).

C. **Swarm Junction landmark** (as captured in `review-swarm-junction.png`; room units ÷ 32 = metres, z down-screen):
- `brood-hive-heart` (470, 600); `brood-nest-large` (300, 395) against the north generator bank; `brood-burst-duct` (560, 450);
  `brood-consumed-shell` (240, 470) yaw .3 over the console; `brood-pods-large` (210, 650); `brood-pods-hatched` (420, 480);
  `brood-creep-a` (330, 560) yaw .6; `brood-creep-b` (380, 680) yaw 2.1; `brood-web-long` (300, 330) yaw −1.2, y 0.
  These were review positions near the marine's calm-camera start; move the heart to the room's centre-back outside the fight circle for the final dressing.

## Escalation, room 15 → 20

| Room | Density | Pieces |
|---|---|---|
| 15 Infested Workshop | first takeover: creep along wall feet, 1 consumed prop, 1 medium nest, 1 small pod clutch, 1 short web | no lantern masses yet; `brood-pod-glow` only |
| 16 Swarm Junction | stronghold: **hive heart** landmark, 1–2 large nests on duct banks, burst duct at the ingress, 2 consumed props, pods large + hatched, 2–3 webs | lantern pulse visible from the whole room |
| 17 Shielding Gate | growth fighting the shields: nests pressed against the gate frame, webs across the top of the gate, creep stopping in a hard line at the field | medium nests, webs long |
| 18 Containment Annulus | ring corridor consumed: creep continuous along the outer wall, wall creep up to 2 m, burst ducts in the floor ring, hatched pods | many creep pieces, 2 burst ducts |
| 19 Manual Control | consoles swallowed: `brood-consumed-shell` on most control desks, webs between desks, one large nest in a corner | the "machine eaten" room |
| 20 Overload Floor | climax: largest masses against the reactor architecture, multiple lantern clusters, webs high across the room; keep the boss/fight floor to creep only | everything but the heart (the heart stays Swarm Junction's identity) |

## Notes for integration

- Triangles: heart 12k, large nest 6k, all others ≤ 2k. One opaque material + two emissive finishes, one 1024 normal atlas (KTX2-ready).
- Pieces are static (no skin); P11 `cutaway` is not needed for floor creep, consider it for nests near the camera side.
- `brood-creep-*` and webs have no gameplay collision intent; nests/heart are visual only (place them where geometry already blocks).
- Temporary review placement used during modelling was removed; only the pack registration remains in code.
