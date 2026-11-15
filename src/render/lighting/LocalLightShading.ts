import { MeshStandardMaterial, ShaderChunk } from 'three';

const installed = new WeakSet<MeshStandardMaterial>();
const environmentGains = new WeakMap<MeshStandardMaterial, {value:number}>();
const practicalShadowFills = new WeakMap<MeshStandardMaterial, {value:number}>();
const shadowReadability = new WeakMap<MeshStandardMaterial, {value:number}>();
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
    `// Fixed pool slots with zero source energy need neither attenuation nor BRDF work.
    if ( pointLight.color == vec3( 0.0 ) ) {
      directLight.color = vec3( 0.0 );
      directLight.visible = false;
    } else {
      getPointLightInfo( pointLight, geometryPosition, directLight );\n${practicalOcclusion}
    }`)
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
export function optimizeLocalLights(material: MeshStandardMaterial, diffuseEnvironmentGain?:number, practicalShadowFill?:number, readableBounce?:number): void {
  let environmentGain=environmentGains.get(material);
  if(!environmentGain){environmentGain={value:diffuseEnvironmentGain??1};environmentGains.set(material,environmentGain);}
  if(diffuseEnvironmentGain!==undefined)environmentGain.value=Math.max(0,Math.min(1,diffuseEnvironmentGain));
  let shadowFill=practicalShadowFills.get(material);if(!shadowFill){shadowFill={value:practicalShadowFill??.025};practicalShadowFills.set(material,shadowFill);}if(practicalShadowFill!==undefined)shadowFill.value=Math.max(.025,Math.min(.25,practicalShadowFill));
  let bounce=shadowReadability.get(material);if(!bounce){bounce={value:readableBounce??0};shadowReadability.set(material,bounce);}if(readableBounce!==undefined)bounce.value=Math.max(0,Math.min(.02,readableBounce));
  if (installed.has(material)||material.customProgramCacheKey().includes(':local-light-rejection-v8')) return;
  installed.add(material);
  const previous = material.onBeforeCompile;
  const key = material.customProgramCacheKey();
  const floor=['environment-floor','painted-steel-deck','annulus-deck','annulus-circulation'].includes(material.name)||material.userData.floorDressing===true;
  const floorShape=`
#if UNROLLED_LOOP_INDEX < 4
 vec3 floorDeltaView=pointLight.position-geometryPosition;
 vec2 floorDelta=vec2(dot(floorDeltaView,viewMatrix[0].xyz),dot(floorDeltaView,viewMatrix[2].xyz));
 vec4 aperture=roomFloorPracticalShapes[UNROLLED_LOOP_INDEX];
 if(aperture.z>0.0){
 vec2 chart=vec2(dot(floorDelta,vec2(aperture.y,-aperture.x)),dot(floorDelta,aperture.xy));
 float across=abs(chart.x+chart.y*.10);
 float slit=(1.0-smoothstep(aperture.z*.50,aperture.z*1.35,across))*(1.0-smoothstep(aperture.w*.40,aperture.w,abs(chart.y)));
 // Cryo strip fixtures have no circular point-light pedestal outside the aperture.
 float stripOnly=max(roomFloorApertureOnly,1.0-step(.5,roomFloorPattern.z));
 directLight.color*=mix(.12+slit*.40,slit*.40,stripOnly);
 }
#endif
`;
  const nearField={value:floor||material.name==='shaft-deck'?3.24:9};
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms??={};shader.uniforms.roomDiffuseEnvironmentGain=environmentGain!;shader.uniforms.roomPracticalShadowFill=shadowFill!;shader.uniforms.roomPracticalNearField=nearField;shader.uniforms.roomShadowReadability=bounce!;
    shader.fragmentShader = 'uniform float roomDiffuseEnvironmentGain;uniform float roomPracticalShadowFill;uniform float roomPracticalNearField;uniform float roomShadowReadability;\n'+shader.fragmentShader.replace('#include <lights_fragment_begin>', floor?localLights.replace(practicalOcclusion,practicalOcclusion+floorShape):localLights).replace('#include <lights_fragment_maps>',reflectionLighting).replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
      float roomShadowLuma=dot(reflectedLight.directDiffuse+reflectedLight.indirectDiffuse+reflectedLight.directSpecular,vec3(.2126,.7152,.0722));
      reflectedLight.indirectDiffuse+=vec3(.68,.82,1.0)*roomShadowReadability*(1.0-smoothstep(.008,.04,roomShadowLuma));`);
  };
  material.customProgramCacheKey = () => `${key}:local-light-rejection-v8`;
  material.needsUpdate = true;
}
