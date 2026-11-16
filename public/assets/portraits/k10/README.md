# K10 UI render handoff

Four original rig busts (1024×1024 RGBA, transparent):

- `breacher-bust.png`
- `cryo-bust.png`
- `pyro-bust.png`
- `arc-bust.png`

Four full-figure hero renders (1024×1280 RGBA, transparent):

- `breacher-hero.png`
- `cryo-hero.png`
- `pyro-hero.png`
- `arc-hero.png`

Generated from the shipping marine and weapons by `tools/assets/k10-marine/portraits.py`, under the shared rebuild command. Busts deliberately crop the lower weapon; hero renders retain both boots and the complete weapon/rig silhouette. UI adoption is an integration request: this stream does not edit UI code. New geometry, material artwork and renders are original repository-MIT work; the retained Unvanquished skeleton/animation used to pose the figure keeps its separate attribution in `public/asset-credits.html`.

U10 adopts these renders throughout the interface. Responsive `*-bust-{256,640,1024}.webp` delivery files preserve the original transparent PNG fallback and are rebuilt by `tools/assets/u10-keyart/optimize.py`. All four 640px portraits are warmed on menu interaction/idle; no image request gates Start or rig selection. The original K10 PNGs and authoring scripts remain unchanged.
