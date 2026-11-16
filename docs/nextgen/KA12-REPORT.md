# KA12 — title, ending and arsenal

Branch: `t3/title-key-art-weapons`. No push or PR. Original asset work is MIT; retained skeleton/animation and ship-kit notices remain unchanged.

The title now uses the read-only K12 close-up marine, KA12 rifle and four K11 Lantern Brood castes in the E9 pressure passage. Added conduit runs, grating, debris, torn sheets, physical DECK 07 signage, sparks and an emergency lamp. Five actual native/480 review rounds are recorded in `plans/KA12-review.md`, followed by full-resolution delivery checks and an additional visor correction. Other solid geometry acts as a holdout when rendering isolated middle/hero/foreground plates, preventing creatures from appearing through the near bulkhead.

Final source plates are 2560×1440 Cycles renders, 128 samples with denoising. Existing background/midground/hero/foreground/fog filenames and responsive sizes remain intact. WebP retains JPEG/PNG fallbacks. The optimizer accepts explicit source directories. One CSS gradient adjustment reduces excess left/bottom darkening so the Brood remains readable beneath the menu. No title/ending JavaScript or DOM hooks changed; image readiness still does not gate Start.

The ending was re-rendered through three native/480 review rounds: a deeper abandoned nave, wet grating, debris and disconnected cable. The native screen supplies the new K12 chosen-rig portrait as a terminated suit archive. The passenger/marine loss and successful warning text remain unchanged; the image does not imply survival.

Five replacement weapon GLBs ship at the existing model paths, with 512² baked base/AO and tangent normals, plus plasma/rocket emission. All three beauty-review rounds are retained. The K10 rebuild entry now invokes KA12, preventing an old arsenal rebuild from overwriting these assets.

| Weapon | Triangles | GLB bytes |
| --- | ---: | ---: |
| Pistol | 2,640 | 436,204 |
| Rifle | 4,336 | 561,132 |
| Shotgun | 4,084 | 508,016 |
| Plasma | 4,672 | 593,980 |
| Rocket | 4,236 | 535,704 |

Muzzle/ejection translations and attachment axes preserve the existing contract. No runtime dependency, simulation, bot, room, postprocessing, marine or creature source/model was changed. The missing gitignored close-up marine source was rebuilt with `marine.py --hero`, without exporting over the game marine.

## Verification

`npm ci` and baseline build passed. The final image/weapon build also passed TypeScript and Vite, with the existing large-chunk advisory. No automated tests, test runners or acceptance gates were added.

Native Arc campaign, seed 1729: `ka12-final-arc` ended with a natural death in Diagnostic Gallery after 10 room clears, zero errors and zero defects; wall time 2394.25 seconds. This is not a full campaign clear. It used the final weapons and unchanged gameplay; later edits were offline title/ending images. Earlier attempts are retained: localhost sandbox EPERM and a startup timeout before gameplay.

Twenty native weapon frames cover calm/firing for all five weapons at 1920×1080 and 1280×720. Every firing receipt identifies the requested weapon and records one native shot; zero browser errors. All frames were opened through native-pixel and 480 contact sheets, with full PNGs retained. Keyboard Enter → Digit4 → Enter → Digit1 reaches gameplay through rig selection and starting boon. Fixtures clear enemies/prior projectiles and use invulnerability; these are staged art observations, not campaign or hardware performance evidence. See `KA12-WEAPONS.md`.

Final title/settings/ending captures passed 3/3 at each desktop size, with zero capture errors/failures. All six native screenshots and six 480 reductions were opened. The one-line grading adjustment improves lower creature limbs without compromising menu contrast. A delayed-art check held all six title image requests for 30 seconds; Start reached `rig-select` with four visible cards in 5.971 seconds while all six requests were still pending, with zero errors. This demonstrates nonblocking image readiness in that run, not network speed. See `KA12-UI-CAPTURE.md` and `delayed-title/report.json` in the gallery.

## Delivery weights

Encoded file bodies, not network timing measurements:

| Desktop view | Immediate title WebP | Five optional plates | Ending WebP |
| --- | ---: | ---: | ---: |
| 1280×720 | 48,186 B | 120,368 B | 35,006 B |
| 1920×1080 | 76,004 B | 259,526 B | 58,326 B |

All title/ending delivery formats together: 1,157,436 bytes. Exact inventory: `artifacts/nextgen/ka12-final/image-weights.json`. No hardware performance improvement is claimed.

Gallery: `/Users/chernodub/.t3/worktrees/containment-game/t3-6be7fff5/artifacts/nextgen/ka12-final/index.html`. It retains the supplied reference screenshot, before images, five title rounds, three ending rounds, three weapon rounds, final plates and native captures. Temporary scene blends and duplicate render intermediates were removed after retaining the review PNGs.

## Unresolved work and honest weaknesses

**Exact five-weapon hand fitting is not delivered.** The rifle support glove remains below the receiver despite the added palm saddle. The native angle-zero fixture also shows all five weapons/body facing opposite the projectile streaks. `src/render/models.ts` derives the carrier from animated `tag_weapon`; the socket-preserving replacements and unchanged `WEAPON_FIT` retain that frame. Rotating a weapon alone would leave the body wrong and break its relationship to both hands. Repair needs the marine/animation owner; those sources are explicitly outside this stream. Other hands overlap lower grip regions at gameplay scale, but these views do not establish precise finger contact. No offset workaround hides the issue.

The set is still restrained rather than a richly dressed industrial vista. The low title camera crops most wet-floor/grating detail. Foreground claw reads as black talons; amber/violet lanterns are weaker than acid/ember. Hero support fingers remain imperfect in the offline pose. Weapon surfaces are clean, optics simple, and pistol/shotgun upper edges angular with small bake seams at close inspection. The ending is a quiet archive backdrop rather than a destruction spectacle.
