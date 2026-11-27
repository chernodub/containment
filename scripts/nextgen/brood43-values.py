"""Measure hand-labelled visible interiors on a capture at 480x270.

Usage: python brood43-values.py frame.png samples.json [frame.zones.json]
Each label maps to inclusive [left, top, right, bottom] pixel rectangles.
Use legs and visor for the two references. For archive images hand-label the
visible interiors. For new images, capture --actor-zones writes eroded actor-ID
masks; supply that sidecar to replace the manual creature samples. Effects
composited over bodies can still appear in these screen-space measurements.
"""
import json
import sys
from pathlib import Path
from PIL import Image

image = Image.open(sys.argv[1]).convert("RGB").resize((480, 270), Image.Resampling.LANCZOS)
regions = json.loads(Path(sys.argv[2]).read_text())
if len(sys.argv) > 3:
    regions = {name: regions[name] for name in ("legs", "visor")}
    regions.update(json.loads(Path(sys.argv[3]).read_text()))
results = {}
for label, rectangles in regions.items():
    pixels = [image.getpixel((x, y)) for left, top, right, bottom in rectangles
              for y in range(top, bottom + 1) for x in range(left, right + 1)]
    luma = max((.2126*r + .7152*g + .0722*b)/255 for r,g,b in pixels)
    saturation = max((max(p)-min(p))/max(1,max(p)) for p in pixels)
    results[label] = (luma, saturation)
for label, (luma, saturation) in results.items():
    print(f"{label:10} Y′ {luma:.3f}  S {saturation:.3f}  "
          f"Δlegs {luma-results['legs'][0]:+.3f}  Δvisor {saturation-results['visor'][1]:+.3f}")
