# RW12 reward and ending art

Blender 5.3, Cycles denoise, four render threads. Source marine/rig/weapon meshes are imported read-only. Original scene geometry is MIT.

- `studies.py -- --family=cryo --id=spreading-nova` renders one equipment study. Seven family fallbacks and twelve current augments are enumerated by `render-rewards.sh`; `encode.py` writes WebP + PNG. Encoding needs Pillow (`RW12_PYTHON=/path/to/venv/bin/python sh tools/assets/rw12-rewards/render-rewards.sh`).
- `portraits.py -- --preview --samples=32` previews four poses. Omit `--preview` for shipping 1024 PNG and 256/640/1024 WebP. Optional `--rig=cryo`.
- `ending.py -- --round=5 --preview` previews at1920×1080. Omit preview for128samples; `u10-keyart/optimize.py --ui-only --ending-only --ending=<composition.png>` encodes existing ending filenames.

Reward inventory is data-driven in `src/ui/rewardArt.ts`: an id-named file wins over the family fallback. Add `<new-id>.webp` (and optional PNG fallback) under `public/assets/ui/rewards/`, then build. No preload or decode promise blocks a draft; browsers choose WebP with PNG fallback. Full catalog rule text stays available via inspection; numeric summaries are presentation only.
