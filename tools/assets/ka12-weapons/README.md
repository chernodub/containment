# KA12 arsenal

Original MIT geometry derived from the repository's K10 profile toolkit. Blender 5.3:

```
blender -b -t 4 -P tools/assets/ka12-weapons/weapons.py -- --round=3 --ship
```

Use `--forms` for material/shape reviews without baking or shipping writes; `--only=rifle` limits one weapon. Rounds 1–3 preserve review treatments. Final assets retain the existing attachment axes, exact muzzle and ejection socket translations, authored color zones, exploded matched-part tangent-normal projection and assembled AO bake. The rifle palm saddle adds support contact geometry without changing the marine.

Default exports stage under `artifacts/nextgen/ka12-final/weapons/models`; `--ship` writes existing `public/assets/models/{pistol,rifle,shotgun,plasma,rocket}.glb`; review images/bakes and manifest under `artifacts/nextgen/ka12-final/weapons/round-3/`.
