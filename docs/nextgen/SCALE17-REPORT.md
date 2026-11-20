# SCALE17 · Creature size and attack readability

## Actor measurements

The Crew Checkpoint rank fixtures project visible skinned vertices through the gameplay camera at 1920×1080. Heights are pose- and camera-dependent. Regular and elite values appear in that order. Speed is the catalog speed in simulation units per second before room and difficulty multipliers. Strike dimensions are native units, measured from the strike origin.

| Family | Height before → after (px) | Marine before → after (px) | Radius before → after | Strike shape | Reach before → after | Speed |
| --- | ---: | ---: | ---: | --- | ---: | ---: |
| Crawler | 71 / 92 → 89 / 135 | 147 → 147 | 14 / 14 → 17.50 / 22.75 | Arc, 50° half-angle | 78 / 78 → 97.50 / 126.75 | 150 |
| Stalker | 90 / 110 → 108 / 154 | 145 → 145 | 17 / 17 → 20.40 / 26.52 | Line, width 24 / 24 → 28.80 / 37.44 | 130 / 130 → 156 / 202.80 | 125 |
| Spitter | 106 / 146 → 134 / 215 | 146 → 146 | 18 / 18 → 22.50 / 29.25 | Cone, 45° half-angle | 46 / 46 → 57.50 / 74.75 | 78 |
| Carrier | 153 / 183 → 169 / 237 | 145 → 145 | 24 / 24 → 26.40 / 34.32 | Cone, 50° half-angle | 70 / 70 → 77 / 100.10 | 70 |
| Brute | 224 / 240 → 217 / 295 | 142 → 138 | 33 / 33 → 33 / 42.90 | Arc, 65° half-angle | 92 / 92 → 92 / 119.60 | 60 |

The ordinary Brute retains its RIG16 scale. Its different projected height comes from the settled fixture camera. Spitter and Carrier rows give their close strikes. The pooled rank shapes keep their authored geometry. Each elite draws a pulsing pale-gold ring at deck level. The existing creature shader dims pale-atlas regions in calm poses and restores eligible strike surfaces using native phase progress.

Radius feeds body separation, navigation clearance, spawn clearance and contact. Enlarged bodies advance the shared melee-warning and strike origin by their added radius. Regular Brutes retain the existing five-unit advance. Checkpoint serialization is unchanged.

[Baseline measurements](../../artifacts/nextgen/scale17-measure-before/manifest.json) · [SCALE17 measurements](../../artifacts/nextgen/scale17-after/manifest.json)

## Encounter counts and placement

Groups of at least four scale their scheduled count by inverse squared family scale, rounded to whole contacts. Each surviving slot receives the ratio of original count to revised count as a health multiplier. This preserves nominal group health before elite and Veteran replacement variation. Paired firing lanes and isolated lessons retain their slots. The table counts planned contacts on the seed-1729 route without optional branch reinforcements.

| Room | Standard before → after | Story before → after |
| --- | ---: | ---: |
| awakening-bay | 4 → 4 | 4 → 4 |
| passenger-vault | 6 → 6 | 6 → 6 |
| residential-gallery | 7 → 7 | 7 → 7 |
| communal-atrium | 9 → 9 | 9 → 9 |
| crew-checkpoint | 23 → 19 | 19 → 15 |
| armory | 26 → 19 | 22 → 16 |
| freight-hold | 31 → 22 | 25 → 18 |
| breached-loading-bay | 30 → 22 | 25 → 19 |
| relay-racks | 27 → 20 | 21 → 16 |
| transmission-chamber | 51 → 39 | 41 → 31 |
| diagnostic-gallery | 56 → 39 | 33 → 23 |
| safety-interlock-station | 56 → 39 | 40 → 28 |
| coolant-plant | 71 → 47 | 42 → 28 |
| service-shaft-landing | 67 → 46 | 44 → 30 |
| infested-workshop | 64 → 44 | 58 → 40 |
| swarm-junction | 74 → 50 | 65 → 44 |
| shielding-gate | 62 → 43 | 43 → 31 |
| containment-annulus | 65 → 43 | 57 → 38 |
| manual-control-chamber | 59 → 41 | 50 → 35 |
| overload-floor | 63 → 43 | 55 → 37 |

The Diagnostic Gallery gurney, supporting solid, meal and worklight move together. The affected opening rose from 96 to 140 simulation units. The wider-radius ROOM14 sweep checks authored openings and native role-specific destinations, including legal offsets inward of breach markers.

[Placement audit](../../artifacts/nextgen/scale17/placements-final.log)
