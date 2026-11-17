# VFX13 working visual review

Technique: `src/render/abilities/FlagshipFx.ts` — one retained procedural program, pooled meshes, uniform modes.

## Flashfire
Baseline (final6 04): flat salmon tongue cards, no hot source, reads as a cutout.

R1 (`vfx13-ff-r1`): volume slices roll out correctly and the cone now emits light, but the body saturates to cream-white
over the whole cone and hides the struck enemies; edges are too straight (a slab). Scorch fissures read as orange
lightning scribbles, not a cooling burn. Fix: white only at the muzzle, orange body/dark-red edges, much lower body
alpha and emission, stronger lateral tongue erosion; scorch = black soot with sparse ember patches.

R2: enemies readable, but soft blur with no hot structure; scorch still scribbles. → anisotropic flow-space noise (tongues stretch along the jet), inside-depth temperature, scorch = soot + sparse ember specks.
R3–R4: streaky parallel "brush hairs", weak first frame (shader ordering bug fixed). → isotropic billow octave mixed in, faster 120 ms roll-out, hot spine at the muzzle.
R5: native crop showed cream/peach fog: ACES desaturates bright orange. → body emission kept below ~1 (only core HDR), red-biased orange, dark ember-red inked rim on tongue edges, two layers instead of three.
R6–R7: curl sway; erosion raised for gaps. Result: saturated orange cone with broken tongues, rolling front, embers thrown forward, black char with cooling ember specks, struck enemies burning (existing status flames). Honest verdict: a clear step up and reads as fire, not a cutout; still not top-tier — the body is a translucent sheet with no true volumetric billow or rising self-shadowed smoke, and the white muzzle core is small. Accepted at R7.
