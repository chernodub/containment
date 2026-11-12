import { Mesh, MeshStandardMaterial, Object3D, Vector2 } from 'three';

export const GEOMETRY_CLASSES = Object.freeze({ floor: 1, architecture: 2, marine: 3, enemy: 4, elite: 5, boss: 6 });
export type GeometryClass = typeof GEOMETRY_CLASSES[keyof typeof GEOMETRY_CLASSES];
const identities = new WeakMap<MeshStandardMaterial, { value: Vector2 }>();
let nextActorId = 16;

/** Geometry is emitted alongside HDR color: no extra traversal, draw or texture samples. */
export function patchGeometryMaterial(material: MeshStandardMaterial): void {
  if (identities.has(material) || material.transparent) return;
  const identity = { value: new Vector2(2, GEOMETRY_CLASSES.architecture) };
  identities.set(material, identity);
  const previous = material.onBeforeCompile;
  const key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.containmentIdentity = identity;
    shader.fragmentShader = `layout(location = 1) out highp vec4 containmentGeometry;
uniform vec2 containmentIdentity;
vec2 containmentOctNormal(vec3 n) {
 n /= abs(n.x) + abs(n.y) + abs(n.z);
 return n.z >= 0.0 ? n.xy : (1.0 - abs(n.yx)) * sign(n.xy);
}
` + shader.fragmentShader.replace('#include <opaque_fragment>', `#include <opaque_fragment>
// Geometric normals intentionally omit photographic normal-map detail.
#ifdef FLAT_SHADED
 vec3 containmentNormal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
#else
 vec3 containmentNormal = normalize(vNormal);
#endif
containmentGeometry = vec4(containmentOctNormal(containmentNormal) * .5 + .5, containmentIdentity);
`);
  };
  material.customProgramCacheKey = () => `${key}:geometry-mrt-v1`;
  material.needsUpdate = true;
}

/** Register prepared world surfaces or a single actor, never the HUD/effect scene. */
export function registerGeometry(root: Object3D, kind?: GeometryClass): void {
  let id = root.userData.containmentGeometryId as number | undefined;
  if (kind && !id) root.userData.containmentGeometryId = id = nextActorId++;
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!(material instanceof MeshStandardMaterial) || material.transparent) continue;
      patchGeometryMaterial(material);
      const identity = identities.get(material)!;
      const floor = /floor|deck/.test(material.name);
      identity.value.set(id ?? (floor ? 1 : 2), kind ?? (floor ? GEOMETRY_CLASSES.floor : GEOMETRY_CLASSES.architecture));
    }
  });
}
