import * as T from 'three';
import {optimizeLocalLights} from '../lighting/LocalLightShading';

/** Shared uniforms per actor, never per mesh or frame; adds no draws or resources. */
export function actorSurface(materials: readonly T.MeshStandardMaterial[], friendly = false, elite = false) {
  const flash = { value: 0 }, dissolve = { value: 0 }, flashIntensity = { value: 1 };
  const rimColor = { value: new T.Color(friendly ? 0x9fe8ff : elite ? 0xc1d8e5 : 0x91b9d1) };
  const camouflage = { value: 1 };
  const rimStrength = { value: friendly ? .20 : elite ? .27 : .18 };
  for (const material of materials) {
    const previous = material.onBeforeCompile;
    const previousKey = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      Object.assign(shader.uniforms, { actorFlash: flash, actorDissolve: dissolve, actorFlashIntensity: flashIntensity, actorRimColor: rimColor, actorRimStrength: rimStrength, actorCamouflage: camouflage });
      shader.vertexShader = 'varying vec3 actorPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nactorPosition=position;');
      shader.fragmentShader = `uniform float actorFlash;uniform float actorDissolve;uniform float actorFlashIntensity;uniform vec3 actorRimColor;uniform float actorRimStrength;uniform float actorCamouflage;varying vec3 actorPosition;\n` + shader.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
float ash=fract(sin(dot(floor(actorPosition*65.0),vec3(12.9898,78.233,37.719)))*43758.5453);
if(ash<actorDissolve)discard;
${friendly ? '' : 'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))),.32)*1.12+vec3(.006,.009,.012);diffuseColor.rgb*=mix(.55,1.0,actorCamouflage);'}
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.98,1.0),actorFlash*actorFlashIntensity*.62);`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
${friendly ? '' : 'float actorLitLuma=dot(reflectedLight.directDiffuse+reflectedLight.indirectDiffuse+reflectedLight.directSpecular,vec3(.2126,.7152,.0722));reflectedLight.indirectDiffuse+=vec3(.009,.014,.019)*(1.0-smoothstep(.005,.04,actorLitLuma));'}`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float actorRim=pow(1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),3.2);
float ashEdge=actorDissolve>0.0?1.0-smoothstep(actorDissolve,actorDissolve+.045,ash):0.0;
totalEmissiveRadiance+=actorRimColor*actorRim*actorRimStrength*mix(.35,1.0,actorCamouflage)+vec3(1.8,.48,.08)*ashEdge*actorFlashIntensity;`);
    };
    material.customProgramCacheKey = () => `${previousKey}:actor-surface-v3:${friendly ? 'marine' : 'alien'}`;
    material.needsUpdate = true;
    optimizeLocalLights(material);
  }
  return {
    hit(value: number) { flash.value = T.MathUtils.clamp(value, 0, 1); },
    dissolve(value: number) { dissolve.value = T.MathUtils.clamp(value, 0, 1); },
    setFlashIntensity(value: number) { flashIntensity.value = T.MathUtils.clamp(value, 0, 1); },
    camouflage(value: number) { camouflage.value = T.MathUtils.clamp(value, .15, 1); },
    reset() { flash.value = dissolve.value = 0; camouflage.value = 1; },
  };
}
