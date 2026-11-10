import * as T from 'three';
import {optimizeLocalLights} from '../lighting/LocalLightShading';

/** Shared uniforms per actor, never per mesh or frame; adds no draws or resources. */
export function actorSurface(materials: readonly T.MeshStandardMaterial[], friendly = false, elite = false) {
  const flash = { value: 0 }, dissolve = { value: 0 }, flashIntensity = { value: 1 };
  const rimColor = { value: new T.Color(friendly ? 0x9fe8ff : elite ? 0xd8ba91 : 0x94a5a6) };
  const rimStrength = { value: friendly ? .28 : elite ? .17 : .045 };
  for (const material of materials) {
    const previous = material.onBeforeCompile;
    const previousKey = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      Object.assign(shader.uniforms, { actorFlash: flash, actorDissolve: dissolve, actorFlashIntensity: flashIntensity, actorRimColor: rimColor, actorRimStrength: rimStrength });
      shader.vertexShader = 'varying vec3 actorPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nactorPosition=position;');
      shader.fragmentShader = `uniform float actorFlash;uniform float actorDissolve;uniform float actorFlashIntensity;uniform vec3 actorRimColor;uniform float actorRimStrength;varying vec3 actorPosition;\n` + shader.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
float ash=fract(sin(dot(floor(actorPosition*65.0),vec3(12.9898,78.233,37.719)))*43758.5453);
if(ash<actorDissolve)discard;
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.98,1.0),actorFlash*actorFlashIntensity*.62);`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float actorRim=pow(1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),4.0);
float ashEdge=actorDissolve>0.0?1.0-smoothstep(actorDissolve,actorDissolve+.045,ash):0.0;
totalEmissiveRadiance+=actorRimColor*actorRim*actorRimStrength+vec3(1.8,.48,.08)*ashEdge*actorFlashIntensity;`);
    };
    material.customProgramCacheKey = () => `${previousKey}:actor-surface-v1`;
    material.needsUpdate = true;
    optimizeLocalLights(material);
  }
  return {
    hit(value: number) { flash.value = T.MathUtils.clamp(value, 0, 1); },
    dissolve(value: number) { dissolve.value = T.MathUtils.clamp(value, 0, 1); },
    setFlashIntensity(value: number) { flashIntensity.value = T.MathUtils.clamp(value, 0, 1); },
    reset() { flash.value = dissolve.value = 0; },
  };
}
