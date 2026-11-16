# U10 — At the breach

Original rendered title / ending artwork, repository MIT. The low-camera composition stages the original K10 Crown–keel marine/rifle against a torn E9 pressure bulkhead, original creature silhouettes and a near-field claw. Ship/marine/weapon GLBs are imported read-only. The native grip/animation source retains its separate attribution in `/asset-credits.html`.

The authoring scene uses a forward torso brace and head turn, a subdivided frozen helmet, luminous visor, and clean render-only amber shoulder paint with a small hazard chevron. Those staging changes do not modify the game meshes, textures or animations.

Rebuild from the repository root (Blender 5.3, Pillow for conversion):

```
blender -b -P tools/assets/u10-keyart/stage.py -- --round=10 --layers
blender -b -P tools/assets/u10-keyart/stage.py -- --round=10 --ending
blender -b -P tools/assets/u10-keyart/portraits.py
python tools/assets/u10-keyart/optimize.py
```

Final renders use Cycles at 128 samples with denoise. Raw 2560×1440 RGBA plates are retained in the local U10 gallery. `background`, `midground`, `hero`, `foreground` and `fog` share one camera; the immediate composite is assembled from those delivery plates at the neutral light/fog state. Responsive WebP has JPEG composite and transparent PNG fallbacks. Fog is a low-frequency 640/1280px delivery layer with 12-source-pixel blur. The foreground keeps 85% of its rendered brightness.

The title uses only CSS image compositing, small mouse transforms and slow light/fog drift. Reduced motion disables movement. Image requests have independent retained owners, and no image load/decode gates Start or gameplay readiness.
