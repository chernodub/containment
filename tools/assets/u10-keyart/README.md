# Title and ending rebuilds

The focused KA12 title revision lives in `title.py`. It imports K12 and K11 actors read-only, overrides scene materials only, and builds a fractured pressure wall around a real corridor. Blender 5.3 / Cycles / denoise:

```sh
blender -b -t 4 -P tools/assets/u10-keyart/title.py -- --round=25 --layers
python tools/assets/u10-keyart/optimize.py --title-only --raw=artifacts/nextgen/ka12-title-review/round-25
```

Python encoding requires Pillow. `--preview` renders 1920×1080 at 24 samples; finals render 2560×1440 at 128 samples. `--layers-only --layers` resumes plate export. All five existing layer names and responsive sizes are preserved. Background includes corridor volume; actor plates use holdouts so depth occlusion survives DOM compositing.

The accepted ending remains in `stage.py`; this title command never renders or encodes it. `optimize.py --ending-only --ending=<path>` remains available for an explicitly requested ending rebuild.
