# M10 authored motion

Blender5.3 scripts import the retained actor GLBs, build temporary limb targets
and poles, author anticipation/contact/overshoot/settle keys, and bake original
bones. They leave source meshes, bone names and edit-bone rest transforms intact.
Marine meshes and weapon meshes belong to K10 and are never exported here.

`common.py` rebases sampled rigid bone displacement onto the original GLB node
hierarchy and local rest transforms, then writes animation-only GLBs. These
contain no mesh, skin, material, texture or authoring control object. Marine action
and travel components are intermediate files in ignored `.build/`; the merge step
ships one `marine-motion.glb`. The runtime
loads their clips by existing bone name before actor preparation.

```sh
blender -b -P tools/assets/m10-motion/marine_actions.py
blender -b -P tools/assets/m10-motion/marine_locomotion.py
node tools/assets/m10-motion/merge_marine.mjs
blender -b -P tools/assets/m10-motion/enemy_actions.py -- --families=crawler,brute,spitter,stalker,carrier
```

The native phase clock samples enemy wind-up/strike/recovery; the marine holds
anticipation until its accepted impact receipt. Moving reload/fire/switch layer
upper-body action deltas over the authored travel cycle. Aim twist, bounded
additive flinch and foot correction remain in the runtime. Authored death begins
the collapse, then the existing articulated physics owner takes the current pose
and killing direction without a second upward launch.

Generating code uses the repository MIT license. Animation-only GLBs retain the
existing skeletons and use the adapted models’ CC BY-SA 4.0 terms; see the shipped
`public/assets/models/motion/CREDITS.md`. Retained model and rig notices apply. Review and refinement use production motion
strips and native play; this folder contains no automated test suite or gates.

MOTION14 also supports rebuilding selected takes directly into an existing motion pack. The installer preserves unrelated animations and addresses joints by the shipped node names.

```sh
blender -b -P tools/assets/m10-motion/marine_locomotion.py -- --install
blender -b -P tools/assets/m10-motion/marine_actions.py -- --clips=m10-fire-rifle,m10-fire-shotgun --install
blender -b -P tools/assets/m10-motion/enemy_actions.py -- --families=stalker --clips=m10-windup,m10-strike,m10-recovery
```
