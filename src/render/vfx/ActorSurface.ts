import * as T from 'three';
import {patchActorRegions} from '../ActorRegions';
import {optimizeLocalLights} from '../lighting/LocalLightShading';

/** Shared uniforms per actor, never per mesh or frame; adds no draws or resources. */
export function actorSurface(materials: readonly T.MeshStandardMaterial[], friendly = false, elite = false) {
  const plateOpening={value:0},plateBounds={value:new T.Vector4(0,1,0,1)};
  const plateTorso={value:new T.Vector2(0,1)},stageLight={value:1};
  const flash = { value: 0 }, dissolve = { value: 0 }, flashIntensity = { value: 1 };
  const rimColor = { value: new T.Color(friendly ? 0x8fd2ff : elite ? 0xc1d8e5 : 0x91b9d1) };
  const camouflage = { value: 1 }, deathStyle = { value: 0 };
  const rimStrength = { value: friendly ? .28 : elite ? .20 : .12 };
  // LIGHT13 hierarchy: marine = brightest, most saturated figure (self-lit plates,
  // rig colour on top-facing armour, hot visor); creatures = dark masses with a
  // cool rim and hot lanterns. x: body value / plate lift, y: rig crown, z: emissive gain.
  const hierarchy = { value: new T.Vector3(friendly ? .42 : .42, friendly ? .55 : 0, friendly ? 2.6 : elite ? 2.3 : 1.8) };
  const reveal = { value: 0 };
  const rigColor = { value: new T.Color(0xffb454) };
  for (const material of materials) {
    material.userData.containmentMarineSurface=friendly;
    const previous = material.onBeforeCompile;
    const previousKey = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      Object.assign(shader.uniforms, { actorStageLight:stageLight,actorPlateTorso:plateTorso,actorPlateOpening:plateOpening,actorPlateBounds:plateBounds,actorFlash: flash, actorDissolve: dissolve, actorFlashIntensity: flashIntensity, actorRimColor: rimColor, actorRimStrength: rimStrength, actorCamouflage: camouflage, actorDeathStyle: deathStyle, actorHierarchy: hierarchy, actorReveal: reveal, actorRigColor: rigColor });
      shader.vertexShader = 'uniform float actorPlateOpening;uniform vec4 actorPlateBounds;varying vec3 actorPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nactorPosition=position;').replace('#include <skinning_vertex>', `#include <skinning_vertex>
float plateTop=smoothstep(.48,.72,(position.y-actorPlateBounds.x)/actorPlateBounds.y);
transformed.z+=sign(position.z-actorPlateBounds.z)*actorPlateOpening*actorPlateBounds.w*.055*plateTop;
transformed.y+=actorPlateOpening*actorPlateBounds.y*.025*plateTop;`);
      shader.fragmentShader = `uniform vec3 actorHierarchy;uniform float actorReveal;uniform vec3 actorRigColor;uniform float actorStageLight;uniform vec2 actorPlateTorso;uniform float actorPlateOpening;uniform vec4 actorPlateBounds;uniform float actorFlash;uniform float actorDissolve;uniform float actorFlashIntensity;uniform vec3 actorRimColor;uniform float actorRimStrength;uniform float actorCamouflage;uniform float actorDeathStyle;varying vec3 actorPosition;\n` + shader.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
float plateHeight=(actorPosition.y-actorPlateBounds.x)/actorPlateBounds.y;
if(actorPlateOpening>.05&&plateHeight>.72&&abs(actorPosition.x-actorPlateTorso.x)<actorPlateTorso.y&&abs(actorPosition.z-actorPlateBounds.z)<actorPlateBounds.w*.15*actorPlateOpening)discard;
float ash=fract(sin(dot(floor(actorPosition*65.0),vec3(12.9898,78.233,37.719)))*43758.5453);
if(ash<actorDissolve)discard;
// Death finish stays inside authored regions; no stochastic fracture lines.
float deathFracture=step(1.5,vActorRegion)*step(vActorRegion,2.5);
if(actorDeathStyle>.5&&actorDeathStyle<1.5)diffuseColor.rgb=diffuseColor.rgb*vec3(.76,1.06,1.18)+vec3(.012,.028,.038);
if(actorDeathStyle>1.5&&actorDeathStyle<2.5)diffuseColor.rgb*=.54;
if(actorDeathStyle>3.5)diffuseColor.rgb=diffuseColor.rgb*vec3(.80,.72,1.12)+vec3(.018,.008,.035);
if(actorDeathStyle>2.5&&actorDeathStyle<3.5)diffuseColor.rgb=diffuseColor.rgb*vec3(.62,.78,.50)+vec3(.006,.014,.003);
${friendly ? '' : 'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))),.12)*1.12+vec3(.006,.009,.012);diffuseColor.rgb*=mix(.55,1.0,actorCamouflage)*actorHierarchy.x;'}
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.98,1.0),actorFlash*actorFlashIntensity*.35);`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
${friendly ? '// HERO14: room light keeps only a slight colour cast on the marine.\nreflectedLight.directDiffuse=mix(vec3(dot(reflectedLight.directDiffuse,vec3(.2126,.7152,.0722))),reflectedLight.directDiffuse,.35);reflectedLight.indirectDiffuse=mix(vec3(dot(reflectedLight.indirectDiffuse,vec3(.2126,.7152,.0722))),reflectedLight.indirectDiffuse,.35);' : 'float actorLitLuma=dot(reflectedLight.directDiffuse+reflectedLight.indirectDiffuse+reflectedLight.directSpecular,vec3(.2126,.7152,.0722));reflectedLight.indirectDiffuse+=vec3(.009,.014,.019)*actorStageLight*(1.0-smoothstep(.005,.04,actorLitLuma));'}`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float actorRim=pow(1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),4.2);
${friendly ? `// HERO14 marine: authored three-value palette (cool plates, dark undersuit, rig panels).
// Self-light only genuine plates so the undersuit stays near-black; rig identity comes
// from authored panels and glows, never from tinting top-facing armour.
float marinePlate=smoothstep(.40,.65,dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)));
float marineRig=smoothstep(.10,.30,max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b))-min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b)));
totalEmissiveRadiance=totalEmissiveRadiance*actorHierarchy.z+diffuseColor.rgb*actorHierarchy.x*.55*max(marinePlate,marineRig*.8)*actorStageLight;` : `float lanternLuma=dot(totalEmissiveRadiance,vec3(.2126,.7152,.0722));
totalEmissiveRadiance=max(vec3(0.0),mix(vec3(lanternLuma),totalEmissiveRadiance,1.35))*actorHierarchy.z*(1.0+actorReveal);`}
float ashEdge=actorDissolve>0.0?1.0-smoothstep(actorDissolve,actorDissolve+.045,ash):0.0;
vec3 deathColor=actorDeathStyle>3.5?vec3(.22,.12,.39):actorDeathStyle>.5&&actorDeathStyle<1.5?vec3(.14,.34,.43):actorDeathStyle>2.5?vec3(.08,.14,.025):vec3(.22,.035,.006);
float deathContact=actorDeathStyle>.5?deathFracture*.26*(1.0-actorDissolve):0.0;
totalEmissiveRadiance+=${friendly?'actorRimColor':'mix(actorRimColor,vec3(.50,.72,1.0),.6)'}*actorRim*(actorRimStrength+actorReveal*.28)*actorStageLight*mix(.35,1.0,actorCamouflage)+mix(vec3(1.8,.48,.08),deathColor*5.0,step(.5,actorDeathStyle))*ashEdge*actorFlashIntensity+deathColor*deathContact;`);
    };
    material.customProgramCacheKey = () => `${previousKey}:actor-surface-v9-hero14:${friendly ? 'marine' : 'alien'}`;
    material.needsUpdate = true;
    optimizeLocalLights(material);
    patchActorRegions(material,friendly);
  }
  return {
    rig(color:number) { rigColor.value.setHex(color).offsetHSL(0,.18,-.025); },
    stage(value:number) { stageLight.value=T.MathUtils.clamp(value,0,1); },
    plateBounds(minY:number,height:number,centerZ:number,spanZ:number,centerX=0,torsoHalfWidth=1) { plateBounds.value.set(minY,height,centerZ,spanZ);plateTorso.value.set(centerX,torsoHalfWidth); },
    expose(value:number) { plateOpening.value=T.MathUtils.clamp(value,0,1); },
    identity(color:number,champion=false,strength?:number) { rimColor.value.setHex(color);rimStrength.value=strength??(champion?.28:elite?.20:.12); },
    reveal(value: number) { reveal.value = value; },
    hit(value: number) { flash.value = T.MathUtils.clamp(value, 0, 1); },
    dissolve(value: number) { dissolve.value = T.MathUtils.clamp(value, 0, 1); },
    setFlashIntensity(value: number) { flashIntensity.value = T.MathUtils.clamp(value, 0, 1); },
    death(style: 'none'|'frost'|'burn'|'acid'|'arc') { deathStyle.value = style==='frost'?1:style==='burn'?2:style==='acid'?3:style==='arc'?4:0; },
    camouflage(value: number) { camouflage.value = T.MathUtils.clamp(value, .15, 1); },
    reset() { reveal.value=0;stageLight.value=1;plateOpening.value=0;flash.value = dissolve.value = 0; camouflage.value = 1; deathStyle.value = 0; },
  };
}
