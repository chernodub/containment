import { Color, MeshStandardMaterial, ShaderChunk, Vector4 } from 'three';
import { MARINE_FLOOR_GLOW, MARINE_FLOOR_GLOW_COLOR, ROOM_VALUE_EXIT, ROOM_VALUE_FIELD, ROOM_LANDMARK, ROOM_LANDMARK_COLOR, ROOM_LANDMARK_GAINS } from './RoomValueStandard';

const blackout={value:0};
export function setRoomBlackout(enabled:boolean){blackout.value=enabled?1:0;}

export const LOCAL_LIGHT_CACHE_SUFFIX = ':local-light-rejection-v14-room-blackout';
const installed = new WeakSet<MeshStandardMaterial>();
const environmentGains = new WeakMap<MeshStandardMaterial, {value:number}>();
const practicalShadowFills = new WeakMap<MeshStandardMaterial, {value:number}>();
const shadowReadability = new WeakMap<MeshStandardMaterial, {value:number}>();
const roomValues = new WeakMap<MeshStandardMaterial, {value:Vector4}>();
const roomTints = new WeakMap<MeshStandardMaterial, {value:Color}>();
function valueUniforms(material: MeshStandardMaterial){
  let value=roomValues.get(material),tint=roomTints.get(material);
  if(!value){value={value:new Vector4(1,1,0,1)};roomValues.set(material,value);}
  if(!tint){tint={value:new Color(1,1,1)};roomTints.set(material,tint);}
  return {value,tint};
}
/** LIGHT13: final value, saturation, colour-identity tint and marine-glow gain of a lit
 * room surface. Uniform-only; (1,1,white,0) is exactly the previous response. */
export function setRoomValue(material: MeshStandardMaterial, value=1, saturation=1, tint=0xffffff, marineGlow=0, perimeter=1): void {
  const u=valueUniforms(material);u.value.value.set(value,saturation,marineGlow,perimeter);u.tint.value.setHex(tint);
}
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
  if (installed.has(material)||material.customProgramCacheKey().includes(LOCAL_LIGHT_CACHE_SUFFIX)) return;
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
 float slit=(1.0-smoothstep(aperture.z*.20,aperture.z*1.65,across))*(1.0-smoothstep(aperture.w*.15,aperture.w*1.2,abs(chart.y)));
 // Cryo strip fixtures have no circular point-light pedestal outside the aperture.
 float stripOnly=max(roomFloorApertureOnly,1.0-step(.5,roomFloorPattern.z));
 directLight.color*=mix(.12+slit*.40,slit*.40,stripOnly);
 }
#endif
`;
  const nearField={value:floor||material.name==='shaft-deck'?3.24:9};
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms??={};const rv=valueUniforms(material);shader.uniforms.roomBlackout=blackout;shader.uniforms.roomValue=rv.value;shader.uniforms.roomValueTint=rv.tint;shader.uniforms.roomMarineGlow=MARINE_FLOOR_GLOW;shader.uniforms.roomMarineGlowColor=MARINE_FLOOR_GLOW_COLOR;ROOM_VALUE_FIELD.forEach((pool,index)=>{shader.uniforms[`roomValuePool${index}`]=pool;});shader.uniforms.roomLandmark=ROOM_LANDMARK;shader.uniforms.roomLandmarkColor=ROOM_LANDMARK_COLOR;shader.uniforms.roomLandmarkGains=ROOM_LANDMARK_GAINS;shader.uniforms.roomValueExit=ROOM_VALUE_EXIT;shader.uniforms.roomDiffuseEnvironmentGain=environmentGain!;shader.uniforms.roomPracticalShadowFill=shadowFill!;shader.uniforms.roomPracticalNearField=nearField;shader.uniforms.roomShadowReadability=bounce!;
    shader.fragmentShader = 'uniform float roomBlackout;uniform vec4 roomLandmark;uniform vec3 roomLandmarkColor;uniform vec2 roomLandmarkGains;uniform vec4 roomValue;uniform vec3 roomValueTint;uniform vec4 roomMarineGlow;uniform vec3 roomMarineGlowColor;uniform vec4 roomValuePool0;uniform vec4 roomValuePool1;uniform vec4 roomValuePool2;uniform vec4 roomValuePool3;uniform vec4 roomValueExit;\nfloat roomPoolWeight(vec2 worldXZ, vec4 pool){return pool.w>0.0?1.0-smoothstep(pool.z,pool.w,distance(worldXZ,pool.xy)):0.0;}\nvec3 roomValueGrade(vec3 c){return mix(vec3(dot(c,vec3(.2126,.7152,.0722))),c,roomValue.y)*roomValueTint*roomValue.x;}\nuniform float roomDiffuseEnvironmentGain;uniform float roomPracticalShadowFill;uniform float roomPracticalNearField;uniform float roomShadowReadability;\n'+shader.fragmentShader.replace('#include <lights_fragment_begin>', floor?localLights.replace(practicalOcclusion,practicalOcclusion+floorShape):localLights).replace('#include <lights_fragment_maps>',reflectionLighting).replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
      float roomShadowLuma=dot(reflectedLight.directDiffuse+reflectedLight.indirectDiffuse+reflectedLight.directSpecular,vec3(.2126,.7152,.0722));
      reflectedLight.indirectDiffuse+=vec3(.68,.82,1.0)*roomShadowReadability*(1.0-smoothstep(.008,.04,roomShadowLuma));
      vec3 roomWorld=transpose(mat3(viewMatrix))*geometryPosition+cameraPosition;
      // LIGHT13 field: fight circle and exit in light, perimeter falling to roomValue.w.
      float roomField=1.0;
      if(roomValue.w!=1.0){
        float roomPool=max(max(roomPoolWeight(roomWorld.xz,roomValuePool0),roomPoolWeight(roomWorld.xz,roomValuePool1)),
          max(roomPoolWeight(roomWorld.xz,roomValuePool2),roomPoolWeight(roomWorld.xz,roomValuePool3)));
        roomField=mix(roomValue.w,1.0,roomPool);
        roomField=max(roomField,mix(roomValue.w,1.0,roomValueExit.w*(1.0-smoothstep(0.0,roomValueExit.z,distance(roomWorld.xz,roomValueExit.xy)))));
      }
      reflectedLight.directDiffuse=roomValueGrade(reflectedLight.directDiffuse)*roomField;reflectedLight.indirectDiffuse=roomValueGrade(reflectedLight.indirectDiffuse)*roomField;
      reflectedLight.directSpecular=roomValueGrade(reflectedLight.directSpecular)*roomField;reflectedLight.indirectSpecular=roomValueGrade(reflectedLight.indirectSpecular)*roomField;
      if(roomValue.z>0.0){
        // A landmark owns a bounded luminous body and a softer coloured floor spill.
        float landmarkDistance=distance(roomWorld.xz,roomLandmark.xy);
        float landmarkBody=roomLandmark.w*(1.0-smoothstep(roomLandmark.z*.25,roomLandmark.z,landmarkDistance))*smoothstep(.08,.35,roomWorld.y);
        float landmarkSpill=roomLandmark.w*(1.0-smoothstep(0.0,roomLandmark.z*2.0,landmarkDistance))*(1.0-smoothstep(.05,.25,roomWorld.y));
        if(landmarkBody>0.0){
        float landmarkAlbedo=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
        float landmarkEmitter=clamp(dot(totalEmissiveRadiance,vec3(.2126,.7152,.0722))*2.0,0.0,1.0);
        float signalHue=step(totalEmissiveRadiance.b*1.2,max(totalEmissiveRadiance.r,totalEmissiveRadiance.g));
        vec3 signalLife=max(totalEmissiveRadiance,totalEmissiveRadiance/max(.0001,max(totalEmissiveRadiance.r,max(totalEmissiveRadiance.g,totalEmissiveRadiance.b)))*.8);
        totalEmissiveRadiance=mix(totalEmissiveRadiance,mix(mix(roomLandmarkColor,vec3(1.0),.18)*.8,signalLife,signalHue),landmarkBody*landmarkEmitter);
        totalEmissiveRadiance+=roomLandmarkColor*landmarkBody*roomLandmarkGains.x*(.045+.55*sqrt(max(0.0,landmarkAlbedo)))+diffuseColor.rgb*landmarkBody*roomLandmarkGains.x*.35;
        }
        reflectedLight.indirectDiffuse+=roomLandmarkColor*landmarkSpill*roomLandmarkGains.y;
        // Low wall-foot wash outlines navigable boundaries without lifting the floor or far corners.
        float wallFoot=smoothstep(.025,.10,roomWorld.y)*(1.0-smoothstep(.22,.65,roomWorld.y));
        totalEmissiveRadiance+=roomValueTint*wallFoot*.012;
        // LIGHT13 rig lamp: analytic soft pool around the marine, no light or pass.
        float roomLamp=1.0-smoothstep(0.0,1.0,distance(roomWorld.xz,roomMarineGlow.xy)/roomMarineGlow.z);
        roomLamp=roomLamp*roomLamp*(3.0-2.0*roomLamp)*(1.0-smoothstep(.6,2.2,roomWorld.y));
        reflectedLight.indirectDiffuse+=diffuseColor.rgb*roomMarineGlowColor*roomMarineGlow.w*roomValue.z*roomLamp;
      }
      if(roomBlackout>0.0&&roomValue.z>0.0){
        float suitCircle=1.0-smoothstep(1.2,6.56,distance(roomWorld.xz,roomMarineGlow.xy));
        float deckLight=mix(.10,.95,suitCircle);
        reflectedLight.directDiffuse*=deckLight;
        reflectedLight.indirectDiffuse*=deckLight;
        reflectedLight.directSpecular*=deckLight;
        reflectedLight.indirectSpecular*=deckLight;
        totalEmissiveRadiance*=.08;
      }`);
  };
  material.customProgramCacheKey = () => key + LOCAL_LIGHT_CACHE_SUFFIX;
  material.needsUpdate = true;
}
