# ART19 guardian route illustrations

The first junction previews the two Coolant Plant encounters on the Port pump gallery deck. Plate-breaker shows a Warden and plated escort taking a blue-white plasma hit. Brood shows a Matron with two pods at different stages and an incoming rocket.

Re-render both stills and update their manifest entries with:

```sh
npm run studio -- '--only=^route-(plate-breaker|brood)$'
```

The output directory is `public/assets/ui/studio/`. Both stills are 640×360 WebP files.

| File | Bytes |
| --- | ---: |
| `route-plate-breaker.webp` | 19,504 |
| `route-brood.webp` | 25,448 |

The production build passed. The `art19-after` capture of `run15-junction-1` was reviewed at 1920×1080 and 480×270. At both sizes the Warden’s broad plates and the Matron’s clustered pods distinguish the two cards before reading the titles. The card crop clips the tallest Warden horn tips and the end of the Matron’s raised abdomen. The guardians and both pods remain visible.

## ART21

Baseline `064f0acd`. The desktop baseline has 15 verified screens under `art21-before` and eight individual augment receipts under `art21-before-workshop`. Each augment gets its own screen because the two options for a rig are mutually exclusive.

| Card | Baseline artwork | Baseline review |
| --- | --- | --- |
| Plate-breaker and Brood | `route-plate-breaker.webp`, `route-brood.webp` | 640×360, soft at card scale, with the taller parts of the guardians outside the crop. |
| Standard story destinations | `route-{awakening-bay,passenger-vault,residential-gallery,communal-atrium,crew-checkpoint,armory,freight-hold,breached-loading-bay,relay-racks,transmission-chamber,diagnostic-gallery,safety-interlock-station,coolant-plant,service-shaft-landing,infested-workshop,swarm-junction,shielding-gate,containment-annulus,manual-control-chamber,overload-floor}.webp` | 640×360 room views cropped by the card. The requisition's standard route centers on a nearly empty floor circle. The older Atrium locker shows wreckage. |
| Detours and direct-route rewards | `route-{cache,armor,medicine,upgrade,warden-cache,protected-passage,capacitor,meltdown-capacitor}.webp` | 640×360. Several scenes give more space to the floor and observer than the stake. The locker, infirmary and capacitor treatments rely on small props. |
| Workshop augments | `route-workshop-{siege-plow,fault-line,shard-harvest,ice-road,ember-relay,meltdown-core,pilgrim-pylon,live-wire}.webp` | 640×360. Effects differentiate offers, while broad deck compositions soften the marine and targets at card size. |
| Legacy branches | Inline room-section SVG | Sharp diagram. Armory and medical branches to the same room show essentially the same footprint and omit the reward. |
| Supply stop | `props14/{health,armor,ammo,medkit,grenade,reroll,upgrade,resuscitator}.png` | 300 px square prop cutouts sit over a separate CSS backdrop. Several small, similarly shaped supplies are difficult to identify at gallery scale. The eight old `service-*.webp` shots were dormant. |

The route WebPs were rendered in-engine. Their softness came from the original capture, composition and display crop.
