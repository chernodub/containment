# MARINE28 · Marine at game scale

Baseline `783c5f48`, High, seed 1729, 1920×1080. The four calm rigs use Awakening Bay. Combat rows are Swarm Junction crowd, heavy Pyro, Pyro overlap (frame four), Crew Checkpoint Warden wall stun, Breacher ram, and critical health. The dash starts at the native room entry. The older KIT13 setup requested an illegal target at (374, 424).

**Plane study.** A narrow normal interval (.94–.985 against the upper-left key) added a hard pick to pale ceramic in the existing marine shader. The dense crowd looked effectively identical at 480×270. The final build leaves it off. The off/on comparison is in `artifacts/nextgen/marine28/plane-study-{480,1920}.png`.

**Visor and shoulders.** A cyan chevron on the darker helmet crown follows the head bone. Its point shows facing at native scale, including through the orange Pyro effect. At 480 the cue is a few pixels wide. The existing rig dome and the opposite cap and lame carry the same pigment. The near dome identifies the rig more reliably than the far shoulder, which the gun or helmet often covers. Pyro wears amber.

**Equipment.** The slotted Breacher silhouette is the forearm ram. Painted ram and dorsal equipment now use graphite with a narrow rig stripe. Cryo and Pyro show the largest reduction in equipment colour. The Breacher silhouette still spans the forearm. Its shoe, face, cleats and pistons share a skinned mesh and forearm bone with the guard. A physical reduction would scale those ram parts together around their mount in the Blender generator before joining the mesh, then re-export both LODs.

**Combat read.** The cyan head is easier to locate in the crowd. Fire still draws the eye first in the overlap frame. The Warden reveal keeps its cyan optics and suit outline. In the dash the lowered head is largely covered, while the weapon and extended pose read clearly. The critical-health HUD and weapon silhouette remain readable.

The production build passed. Pyro seed 1729 cleared five rooms with zero errors. The Warden observation recorded 90 Low draws and zero program compilations during the held Low wall stun on both builds. The changes use the existing marine draw and warmed shader family.

Matched sheets in `artifacts/nextgen/marine28/`, each at 480 and 1920 pixels per frame: `rigs`, `plane-study`, and `do-no-harm`.
