# U10 cinematic rig portraits

Original K10 Crown–keel marine, rendered from read-only shipping GLBs with a forward brace, subdivided helmet, cool-white rim and rig-colored key against darkness. Breacher's render-only clean amber dome carries a small hazard chevron. The luminous visor is the focal point. No game model, texture or animation is changed.

`blender -b -P tools/assets/u10-keyart/portraits.py` renders four transparent 1024² PNGs at 128 samples with denoise. `tools/assets/u10-keyart/optimize.py` creates 256/640/1024px WebP delivery files. All four 640px images preload for instant mouse/focus inspection; PNG is the alpha fallback. Original artwork is repository MIT; the retained native pose/animation attribution remains in `/asset-credits.html`.
