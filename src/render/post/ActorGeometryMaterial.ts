import { ShaderMaterial, Vector2 } from 'three';

const identities = new WeakMap<ShaderMaterial, { value: Vector2 }>();
const cacheTag = ':actor-geometry-v1';
const exclusion = /containmentGeometry\s*=\s*vec4\(\s*0\.0\s*,\s*0\.0\s*,\s*0\.0\s*,\s*1\.0\s*\)\s*;/;

/** Only the two authored opaque physical-ornament shaders can join actor ink. */
function physicalNormal(material: ShaderMaterial): 'identityNormal' | 'n' | undefined {
  if (material.transparent || !/attribute\s+float\s+identityRole\s*;/.test(material.vertexShader)) return;
  const varying = (name: string, type: string) => new RegExp(`varying\\s+${type}\\s+${name}\\s*;`);
  if (varying('identityNormal', 'vec3').test(material.vertexShader)
    && varying('identityNormal', 'vec3').test(material.fragmentShader)
    && material.uniforms.identityColor && material.uniforms.identityOpening) return 'identityNormal';
  if (varying('n', 'vec3').test(material.vertexShader) && varying('n', 'vec3').test(material.fragmentShader)
    && varying('role', 'float').test(material.vertexShader) && varying('role', 'float').test(material.fragmentShader)
    && material.uniforms.rigColor) return 'n';
}

const declarations = /* glsl */ `
uniform vec2 containmentActorGeometryIdentity;
vec2 actorGeometryOctNormal(vec3 n) {
  n = normalize(n);
  n /= abs(n.x) + abs(n.y) + abs(n.z);
  vec2 hemisphereSign = vec2(n.x >= 0.0 ? 1.0 : -1.0, n.y >= 0.0 ? 1.0 : -1.0);
  return n.z >= 0.0 ? n.xy : (1.0 - abs(n.yx)) * hemisphereSign;
}
`;

/**
 * Upgrade an already-excluded authored ornament to the same actor geometry ID.
 * Its existing vertex deformation, color, role masks and discards remain exact.
 * Invoke after the pipeline's excluded-material patch; effects remain excluded.
 */
export function setActorGeometryIdentity(material: ShaderMaterial, id: number, kind: number): boolean {
  const normal = physicalNormal(material);
  if (!normal) return false;
  const current = identities.get(material);
  if (current) { current.value.set(id, kind); return true; }
  const identity = { value: new Vector2(id, kind) };
  identities.set(material, identity);
  const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    // A copied preparation hook may have already emitted the same declaration.
    // Override its uniform reference so each registered owner retains its own ID.
    shader.uniforms.containmentActorGeometryIdentity = identity;
    if (shader.fragmentShader.includes('vec2 actorGeometryOctNormal')) return;
    if (!exclusion.test(shader.fragmentShader)) return;
    shader.fragmentShader = declarations + shader.fragmentShader.replace(exclusion,
      `containmentGeometry=vec4(actorGeometryOctNormal(${normal})*.5+.5,containmentActorGeometryIdentity/255.0);`);
  };
  material.customProgramCacheKey = () => key.includes(cacheTag) ? key : `${key}${cacheTag}`;
  material.needsUpdate = true;
  return true;
}
