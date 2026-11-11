import { MeshStandardMaterial, ShaderChunk } from 'three';

const installed = new WeakSet<MeshStandardMaterial>();
const environmentGains = new WeakMap<MeshStandardMaterial, {value:number}>();
const practicalShadowFills = new WeakMap<MeshStandardMaterial, {value:number}>();
const reflectionLighting = ShaderChunk.lights_fragment_maps
  .replace('iblIrradiance += getIBLIrradiance( geometryNormal );', 'iblIrradiance += roomDiffuseEnvironmentGain * getIBLIrradiance( geometryNormal );')
  .replace('radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );', 'radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness ) * mix(1.0,mix(1.0,.02,smoothstep(.15,.5,material.roughness)),1.0-roomDiffuseEnvironmentGain);');
const sharedKeyOcclusion = /* glsl */ `
// Artistic shared-key occlusion for the four fixed practical slots. This is
// deliberately not a per-fixture visibility test or another shadow atlas.
float roomKeyOcclusion = 1.0;
#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0 && defined( RE_Direct )
  if ( receiveShadow ) {
    DirectionalLightShadow roomKeyShadow = directionalLightShadows[ 0 ];
    roomKeyOcclusion = getShadow( directionalShadowMap[ 0 ], roomKeyShadow.shadowMapSize,
      roomKeyShadow.shadowIntensity, roomKeyShadow.shadowBias, roomKeyShadow.shadowRadius,
      vDirectionalShadowCoord[ 0 ] );
    if ( !( roomKeyOcclusion >= 0.0 && roomKeyOcclusion <= 1.0 ) ) roomKeyOcclusion = 1.0;
  }
#endif
`;
const practicalOcclusion = /* glsl */ `
  // Practical fixtures represent broad diffusers, not mathematical pin lights.
  // Bound near-field irradiance so nearby machine roofs retain their finish.
  #if UNROLLED_LOOP_INDEX < 4
    directLight.color *= min( 1.0, dot( pointLight.position - geometryPosition, pointLight.position - geometryPosition ) / roomPracticalNearField );
  #endif
  #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0 && UNROLLED_LOOP_INDEX < 4
    directLight.color *= mix( roomPracticalShadowFill, 1.0, roomKeyOcclusion );
  #endif
`;
const directionalShadowExpression = 'directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;';
// Three computes the full specular BRDF even when range attenuation is exactly
// zero. Coherent local-light rejection preserves its result outside each pool.
const localLights = ShaderChunk.lights_fragment_begin
  .replace('IncidentLight directLight;', `IncidentLight directLight;\n${sharedKeyOcclusion}`)
  .replace('getPointLightInfo( pointLight, geometryPosition, directLight );',
    `getPointLightInfo( pointLight, geometryPosition, directLight );\n${practicalOcclusion}`)
  .replace(directionalShadowExpression, `
    #if UNROLLED_LOOP_INDEX == 0
      directLight.color *= ( directLight.visible && receiveShadow ) ? roomKeyOcclusion : 1.0;
    #else
      ${directionalShadowExpression}
    #endif`)
  .replaceAll(
    'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
    'if ( directLight.visible ) { RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight ); }',
  );

/**
 * Reject zero local BRDFs and share key shadow visibility with four fixed practicals.
 * Three's stable light sort preserves their unshadowed traversal order. Dynamic
 * slots follow those practicals; reactor spot keys and Low have no directional
 * shadow and retain their original response. This approximation is artistic:
 * all four practicals share the key's visibility rather than their own rays.
 * Optional probe gain keeps rough room surfaces from becoming a second ambient
 * light, while sharp reflections remain available on polished and wet surfaces.
 */
export function optimizeLocalLights(material: MeshStandardMaterial, diffuseEnvironmentGain?:number, practicalShadowFill?:number): void {
  let environmentGain=environmentGains.get(material);
  if(!environmentGain){environmentGain={value:diffuseEnvironmentGain??1};environmentGains.set(material,environmentGain);}
  if(diffuseEnvironmentGain!==undefined)environmentGain.value=Math.max(0,Math.min(1,diffuseEnvironmentGain));
  let shadowFill=practicalShadowFills.get(material);if(!shadowFill){shadowFill={value:practicalShadowFill??.025};practicalShadowFills.set(material,shadowFill);}if(practicalShadowFill!==undefined)shadowFill.value=Math.max(.025,Math.min(.25,practicalShadowFill));
  if (installed.has(material)) return;
  installed.add(material);
  const previous = material.onBeforeCompile;
  const key = material.customProgramCacheKey();
  const nearField={value:['environment-floor','painted-steel-deck','annulus-deck','shaft-deck'].includes(material.name)?3.24:9};
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms??={};shader.uniforms.roomDiffuseEnvironmentGain=environmentGain!;shader.uniforms.roomPracticalShadowFill=shadowFill!;shader.uniforms.roomPracticalNearField=nearField;
    shader.fragmentShader = 'uniform float roomDiffuseEnvironmentGain;uniform float roomPracticalShadowFill;uniform float roomPracticalNearField;\n'+shader.fragmentShader.replace('#include <lights_fragment_begin>', localLights).replace('#include <lights_fragment_maps>',reflectionLighting);
  };
  material.customProgramCacheKey = () => `${key}:local-light-rejection-v4`;
  material.needsUpdate = true;
}
