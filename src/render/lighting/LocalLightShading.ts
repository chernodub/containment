import { MeshStandardMaterial, ShaderChunk } from 'three';

const installed = new WeakSet<MeshStandardMaterial>();
// Three computes the full specular BRDF even when range attenuation is exactly
// zero. Coherent local-light rejection preserves its result outside each pool.
const localLights = ShaderChunk.lights_fragment_begin.replaceAll(
  'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
  'if ( directLight.visible ) { RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight ); }',
);

/** Skip zero-contribution local BRDFs without changing light range or energy. */
export function optimizeLocalLights(material: MeshStandardMaterial): void {
  if (installed.has(material)) return;
  installed.add(material);
  const previous = material.onBeforeCompile;
  const key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', localLights);
  };
  material.customProgramCacheKey = () => `${key}:local-light-rejection-v1`;
  material.needsUpdate = true;
}
