# Original E10 floor library (MIT)

Rebuild with Blender 5.3 and Pillow:

```
blender -b -P tools/assets/e10-floors/bake.py
python3 tools/assets/e10-floors/pack.py
```

Cycles selected-to-active diffuse, tangent-space normal and ambient-occlusion bakes project actual bevelled plate modules, hex fasteners, raised tread, drains and captive service hatches onto a 5.6m four-variant atlas. Ten environment families alter fabrication. Shared trim contains rolled kickplate lips and bolt courses. The modelled decal atlas contains boot/tyre scuffs, spills/scorches, chipped service markings and bay numerals. No downloaded imagery or third-party assets.

Runtime files are lossless WebP, 1024² per environment map (three maps; AO R, roughness G), with half-size derivatives. All normal/ORM data is linear; base colour/decal/trim albedo is sRGB. The manifest records file sizes and SHA256. The existing E9 deck mesh and kit readiness owner consume the maps; they do not change collision, floor heights, ink geometry or saved state.

If Cycles/Embree crashes during a long batch, rebuild remaining environments separately, then `-- shared`; the deterministic seeds and map dimensions are identical. PNG bake intermediates are removed by packing. Original overhaul assets ship under the repository MIT license.
