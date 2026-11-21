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

### Rendering and payload

The renders use the creature, marine, prop and room assets at `064f0acd`. The studio uses the production toon materials and full ink outlines at native pixel size, with adaptive resolution and lens blur disabled. Route art is 1120×476. Supply art is 560×224. Story cards select a first-dispatch subject from the native encounter plan when a run changes the opening. Older branches show their actual supply or medical reward, and the legacy reactor-vault route has its own Queen still.

Re-render the route and supply catalog with the current shipped assets.

```sh
npm run studio -- '--only=^(route-|service-)'
```

The 55 WebPs total 706,328 bytes. The largest increase among the previously displayed route WebPs is 1.32×. Supply WebPs are smaller than their former PNGs. The studio updates the shot descriptions and encoded byte counts in `public/assets/ui/studio/manifest.json`.

| File | Bytes |
| --- | ---: |
| `route-armor.webp` | 14,360 |
| `route-armory.webp` | 13,250 |
| `route-awakening-bay.webp` | 10,840 |
| `route-breached-loading-bay.webp` | 15,238 |
| `route-brood.webp` | 27,192 |
| `route-cache.webp` | 10,170 |
| `route-capacitor.webp` | 9,196 |
| `route-communal-atrium.webp` | 10,242 |
| `route-containment-annulus.webp` | 9,638 |
| `route-coolant-plant.webp` | 14,442 |
| `route-crew-checkpoint.webp` | 14,234 |
| `route-diagnostic-gallery.webp` | 13,106 |
| `route-freight-hold.webp` | 11,132 |
| `route-infested-workshop.webp` | 8,502 |
| `route-legacy-queen.webp` | 10,630 |
| `route-locker.webp` | 13,176 |
| `route-manual-control-chamber.webp` | 12,192 |
| `route-medicine.webp` | 8,930 |
| `route-meltdown-capacitor.webp` | 9,156 |
| `route-overload-floor.webp` | 9,174 |
| `route-passenger-vault.webp` | 11,106 |
| `route-plate-breaker.webp` | 19,996 |
| `route-protected-passage.webp` | 10,028 |
| `route-relay-racks.webp` | 13,722 |
| `route-residential-gallery.webp` | 14,906 |
| `route-safety-interlock-station.webp` | 8,966 |
| `route-service-shaft-landing.webp` | 15,704 |
| `route-shielding-gate.webp` | 11,788 |
| `route-swarm-junction.webp` | 14,546 |
| `route-threat-brute.webp` | 10,032 |
| `route-threat-carrier.webp` | 10,076 |
| `route-threat-crawler.webp` | 8,654 |
| `route-threat-matron.webp` | 10,480 |
| `route-threat-spitter.webp` | 11,374 |
| `route-threat-stalker.webp` | 12,854 |
| `route-threat-warden.webp` | 11,488 |
| `route-transmission-chamber.webp` | 11,834 |
| `route-upgrade.webp` | 9,394 |
| `route-warden-cache.webp` | 18,030 |
| `route-workshop-ember-relay.webp` | 18,948 |
| `route-workshop-fault-line.webp` | 26,382 |
| `route-workshop-ice-road.webp` | 27,838 |
| `route-workshop-live-wire.webp` | 18,780 |
| `route-workshop-meltdown-core.webp` | 23,560 |
| `route-workshop-pilgrim-pylon.webp` | 23,458 |
| `route-workshop-shard-harvest.webp` | 20,404 |
| `route-workshop-siege-plow.webp` | 19,216 |
| `service-ammo.webp` | 6,262 |
| `service-armor.webp` | 6,742 |
| `service-grenade.webp` | 6,722 |
| `service-heal.webp` | 4,694 |
| `service-medkit.webp` | 5,792 |
| `service-reroll.webp` | 5,184 |
| `service-revive.webp` | 7,724 |
| `service-upgrade.webp` | 4,844 |

### Desktop review

The 23 final views are collected under `artifacts/nextgen/art21-after/review-native/` at 1920×1080 and `review-480/` at 480×270. The capture runner stalled between screens in the first session. Fresh late-route and workshop batches completed the gallery, and a separate junction receipt records the final Ice Road framing.

The native review caught two overlapping supply arrangements and two workshop poses that reached the frame edge. The final images separate the supplies and keep the Ice Road and Live Wire marines in frame. At 480×270 the requisition's standard approach reads as an enemy encounter, and the guardian and supply silhouettes are distinguishable before reading the titles.
