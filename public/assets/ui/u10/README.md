# U10 — Last operator

Original rendered title / ending artwork, repository MIT. The composition was staged in Blender using the original K10 Crown–keel marine/shotgun and E9 ship kit, imported read-only. The native K10 pose retains its separately attributed animation source; see `/asset-credits.html`. No external image, model or texture was added.

Rebuild from the repository root:

```
blender -b -P tools/assets/u10-keyart/stage.py -- --round=5 --layers
blender -b -P tools/assets/u10-keyart/stage.py -- --round=5 --ending
python tools/assets/u10-keyart/optimize.py
```

The optimizer needs Pillow. Raw 2560×1440 RGBA renders belong in the retained local U10 gallery, not the runtime bundle. `background`, `midground`, `hero`, `foreground` and `fog` are aligned camera plates; the composite is the immediate static fallback. The small WebP variants serve 720p; the full title composite has 1280/1920/2560 widths. Transparent layers keep palette-PNG fallbacks; composites keep JPEG fallbacks. Reduced motion disables all plate motion/light breathing. No image decode is part of gameplay readiness or Start acceptance.

Delivery fog is blurred by 12 source pixels and capped at 1280px, because stochastic volume alpha contains no useful high-frequency UI detail. The foreground receives a 35% brightness grade. The immediate composite is assembled from those same delivery plates at the neutral light/fog state, so revealing decoded layers preserves exposure.
