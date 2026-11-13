# V6 offline atlas tooling

Run from the repository root in a temporary Python environment. Install the offline-only versions from `requirements.txt` (Pillow and NumPy); they are not application dependencies:

```sh
python -m pip install -r tools/assets/vfx/requirements.txt
python tools/assets/vfx/unpack.py tools/assets-src/kenney-mirror-v6/pack.zip tools/assets-src/kenney-mirror-v6/extracted
python tools/assets/vfx/build_atlas.py
```

Each archive goes into its own new directory under ignored `tools/assets-src/`.
The unpacker accepts bounded PNG/TXT/MD data only, rejects path traversal, and
never executes anything from a pack. The generator lives outside that directory.
Kenney mirror archive URL and SHA-256 are in the shipped pack CREDITS. Verify
that hash before reproduction. The generator checks actual source images,
resamples to 124px inside 128px padded tiles and records all source/output hashes.
The Unity Labs source PNGs are already retained in `public/assets/vfx`.

One output PNG, 2048², 2.76 MB. Do not ship the downloaded ZIP or source tree.
The retained originals serve pre-existing status/weapon systems and are separate
from this compact ability atlas. New original patterns are repository-MIT;
CC0 source derivatives retain their explicit CC0 provenance. No runtime imaging
dependency is added. PNG compression can vary with the Pillow/zlib version;
compare decoded pixels and regenerate the output manifest if upgrading tools.
