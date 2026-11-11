import * as T from 'three';
import {optimizeLocalLights} from '../lighting/LocalLightShading';

/** Shared uniforms per actor, never per mesh or frame; adds no draws or resources. */
export function actorSurface(materials: readonly T.MeshStandardMaterial[], friendly = false, elite = false) {
  const plateOpening={value:0},plateBounds={value:new T.Vector4(0,1,0,1)};
  const flash = { value: 0 }, dissolve = { value: 0 }, flashIntensity = { value: 1 };
  const rimColor = { value: new T.Color(friendly ? 0x9fe8ff : elite ? 0xc1d8e5 : 0x91b9d1) };
  const camouflage = { value: 1 }, deathStyle = { value: 0 };
  const rimStrength = { value: friendly ? .20 : elite ? .46 : .26 };
  for (const material of materials) {
    const previous = material.onBeforeCompile;
    const previousKey = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      Object.assign(shader.uniforms, { actorPlateOpening:plateOpening,actorPlateBounds:plateBounds,actorFlash: flash, actorDissolve: dissolve, actorFlashIntensity: flashIntensity, actorRimColor: rimColor, actorRimStrength: rimStrength, actorCamouflage: camouflage, actorDeathStyle: deathStyle });
      shader.vertexShader = 'uniform float actorPlateOpening;uniform vec4 actorPlateBounds;varying vec3 actorPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nactorPosition=position;').replace('#include <skinning_vertex>', `#include <skinning_vertex>
float plateTop=smoothstep(.48,.72,(position.y-actorPlateBounds.x)/actorPlateBounds.y);
transformed.z+=sign(position.z-actorPlateBounds.z)*actorPlateOpening*actorPlateBounds.w*.055*plateTop;
transformed.y+=actorPlateOpening*actorPlateBounds.y*.025*plateTop;`);
      shader.fragmentShader = `uniform float actorPlateOpening;uniform vec4 actorPlateBounds;uniform float actorFlash;uniform float actorDissolve;uniform float actorFlashIntensity;uniform vec3 actorRimColor;uniform float actorRimStrength;uniform float actorCamouflage;uniform float actorDeathStyle;varying vec3 actorPosition;\n` + shader.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
float plateHeight=(actorPosition.y-actorPlateBounds.x)/actorPlateBounds.y;
if(actorPlateOpening>.05&&plateHeight>.60&&abs(actorPosition.z-actorPlateBounds.z)<actorPlateBounds.w*.08*actorPlateOpening)discard;
float ash=fract(sin(dot(floor(actorPosition*65.0),vec3(12.9898,78.233,37.719)))*43758.5453);
if(ash<actorDissolve)discard;
float deathFracture=smoothstep(.965,.995,fract(sin(dot(floor(actorPosition*18.0),vec3(31.1,17.7,48.3)))*18643.31));
if(actorDeathStyle>.5&&actorDeathStyle<1.5)diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.28,.46,.54),.4);
if(actorDeathStyle>1.5&&actorDeathStyle<2.5)diffuseColor.rgb*=.38;
if(actorDeathStyle>2.5)diffuseColor.rgb=mix(diffuseColor.rgb*.6,vec3(.10,.16,.055),.35);
${friendly ? '' : 'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))),.12)*1.12+vec3(.006,.009,.012);diffuseColor.rgb*=mix(.55,1.0,actorCamouflage);'}
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.98,1.0),actorFlash*actorFlashIntensity*.35);`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
${friendly ? '' : 'float actorLitLuma=dot(reflectedLight.directDiffuse+reflectedLight.indirectDiffuse+reflectedLight.directSpecular,vec3(.2126,.7152,.0722));reflectedLight.indirectDiffuse+=vec3(.009,.014,.019)*(1.0-smoothstep(.005,.04,actorLitLuma));'}`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float actorRim=pow(1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),2.6);
float ashEdge=actorDissolve>0.0?1.0-smoothstep(actorDissolve,actorDissolve+.045,ash):0.0;
vec3 deathColor=actorDeathStyle>.5&&actorDeathStyle<1.5?vec3(.14,.34,.43):actorDeathStyle>2.5?vec3(.08,.14,.025):vec3(.22,.035,.006);
float deathContact=actorDeathStyle>.5?deathFracture*.26*(1.0-actorDissolve):0.0;
totalEmissiveRadiance+=actorRimColor*actorRim*actorRimStrength*mix(.35,1.0,actorCamouflage)+mix(vec3(1.8,.48,.08),deathColor*5.0,step(.5,actorDeathStyle))*ashEdge*actorFlashIntensity+deathColor*deathContact;`);
    };
    material.customProgramCacheKey = () => `${previousKey}:actor-surface-v5:${friendly ? 'marine' : 'alien'}`;
    material.needsUpdate = true;
    optimizeLocalLights(material);
  }
  return {
    plateBounds(minY:number,height:number,centerZ:number,spanZ:number) { plateBounds.value.set(minY,height,centerZ,spanZ); },
    expose(value:number) { plateOpening.value=T.MathUtils.clamp(value,0,1); },
    identity(color:number,champion=false) { rimColor.value.setHex(color);rimStrength.value=champion?.66:elite?.46:.26; },
    hit(value: number) { flash.value = T.MathUtils.clamp(value, 0, 1); },
    dissolve(value: number) { dissolve.value = T.MathUtils.clamp(value, 0, 1); },
    setFlashIntensity(value: number) { flashIntensity.value = T.MathUtils.clamp(value, 0, 1); },
    death(style: 'none'|'frost'|'burn'|'acid') { deathStyle.value = style==='frost'?1:style==='burn'?2:style==='acid'?3:0; },
    camouflage(value: number) { camouflage.value = T.MathUtils.clamp(value, .15, 1); },
    reset() { plateOpening.value=0;flash.value = dissolve.value = 0; camouflage.value = 1; deathStyle.value = 0; },
  };
}
