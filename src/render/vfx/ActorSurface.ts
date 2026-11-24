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
  const rimStrength = { value: friendly ? .085 : elite ? .24 : .19 };   // CREATURE23: a faint cool back-rim on the marine in crowds
  // LIGHT13 hierarchy: marine = brightest, most saturated figure (self-lit plates,
  // rig colour on top-facing armour, hot visor); creatures = dark masses with a
  // cool rim and hot lanterns. x: body value / plate lift, y: rig crown, z: emissive gain.
  const hierarchy = { value: new T.Vector3(friendly ? .42 : .42, friendly ? .55 : 0, friendly ? 1.35 : elite ? 2.3 : 1.8) };
  const lanternColor = { value: new T.Color(0xffffff) };
  const reveal = { value: 0 }, attackLoad = { value: 0 };
  const rigColor = { value: new T.Color(0xffd063) }, bodyHue = { value: new T.Color(0x43312b) }, eliteBody = { value: elite ? 1 : 0 };
  for (const material of materials) {
    material.userData.containmentMarineSurface=friendly;
    const previous = material.onBeforeCompile;
    const previousKey = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      Object.assign(shader.uniforms, { actorStageLight:stageLight,actorPlateTorso:plateTorso,actorPlateOpening:plateOpening,actorPlateBounds:plateBounds,actorFlash: flash, actorDissolve: dissolve, actorFlashIntensity: flashIntensity, actorRimColor: rimColor, actorRimStrength: rimStrength, actorCamouflage: camouflage, actorDeathStyle: deathStyle, actorHierarchy: hierarchy, actorReveal: reveal, actorRigColor: rigColor });
      if (!friendly) Object.assign(shader.uniforms, {actorLanternColor: lanternColor, actorAttackLoad: attackLoad, actorBodyHue: bodyHue, actorEliteBody: eliteBody});
      shader.vertexShader = (friendly ? 'attribute float _rig_paint; varying float vRigPaint;\n' : '') + 'uniform float actorPlateOpening;uniform vec4 actorPlateBounds;varying vec3 actorPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nactorPosition=position;' + (friendly ? 'vRigPaint=_rig_paint;' : '')).replace('#include <skinning_vertex>', `#include <skinning_vertex>
float plateTop=smoothstep(.48,.72,(position.y-actorPlateBounds.x)/actorPlateBounds.y);
transformed.z+=sign(position.z-actorPlateBounds.z)*actorPlateOpening*actorPlateBounds.w*.055*plateTop;
transformed.y+=actorPlateOpening*actorPlateBounds.y*.025*plateTop;`);
      shader.fragmentShader = `${friendly ? 'varying float vRigPaint;' : 'uniform vec3 actorLanternColor;uniform float actorAttackLoad;uniform vec3 actorBodyHue;uniform float actorEliteBody;'}uniform vec3 actorHierarchy;uniform float actorReveal;uniform vec3 actorRigColor;uniform float actorStageLight;uniform vec2 actorPlateTorso;uniform float actorPlateOpening;uniform vec4 actorPlateBounds;uniform float actorFlash;uniform float actorDissolve;uniform float actorFlashIntensity;uniform vec3 actorRimColor;uniform float actorRimStrength;uniform float actorCamouflage;uniform float actorDeathStyle;varying vec3 actorPosition;\n` + shader.fragmentShader
        .replace('#include <map_fragment>', `#include <map_fragment>
${friendly?'':'float creatureBone=0.0;'}
${!friendly && material.userData.k11Original ? `
// CREATURE18: the atlas paints the blades at rest value (matte cool grey, low chroma);
// a loaded strike lifts only that plane, still below the marine's plates.
vec3 boneAlbedo=diffuseColor.rgb;
float boneChroma=max(boneAlbedo.r,max(boneAlbedo.g,boneAlbedo.b))-min(boneAlbedo.r,min(boneAlbedo.g,boneAlbedo.b));
float bonePlane=smoothstep(.09,.15,dot(boneAlbedo,vec3(.2126,.7152,.0722)))*(1.0-smoothstep(.07,.12,boneChroma));
creatureBone=bonePlane;
float strikingRegion=step(1.5,vActorRegion)*step(vActorRegion,5.5);
float creatureStrike=mix(1.0,1.55,actorAttackLoad*strikingRegion*bonePlane);` : 'float creatureStrike=1.0;'}
${friendly?'':`// SHADER25: one flat albedo per material zone, set straight after the atlas sample so
// status casts (frost) and death tints still colour it, as the marine's plates.
// SHADER25b: material zones come from a clean, unposterised atlas sample at the automatic
// mip (painted strokes averaged, no posterise steps). Natural gaps in
// the bakes' value distribution split dark armour, mid plate, warm flesh and bone;
// each zone has one flat albedo, so the light alone makes its second value.
#ifdef USE_MAP
vec3 zoneAlbedo=texture2D(map,vMapUv,0.0).rgb*diffuse;
#else
vec3 zoneAlbedo=diffuseColor.rgb;
#endif
float zoneValue=dot(zoneAlbedo,vec3(.2126,.7152,.0722));
float zoneMid=smoothstep(.075,.095,zoneValue),zoneFlesh=smoothstep(.19,.23,zoneValue),zoneBone=smoothstep(.40,.46,zoneValue);
// Armour and plate lit (.040/.056) sit at or below the flesh shadow plane (.15 x .30).
float zoneLevel=mix(mix(mix(.040,.056,zoneMid),.15,zoneFlesh),.165,zoneBone);
// Family hue unifies the creature; zones keep most of their own hue, armour less chroma.
vec3 familyHue=actorBodyHue/max(.005,dot(actorBodyHue,vec3(.2126,.7152,.0722)));
vec3 zoneHue=mix(familyHue,zoneAlbedo/max(zoneValue,.001),.7);
zoneHue=mix(vec3(1.),zoneHue,mix(.45,1.0,zoneFlesh));
zoneHue=min(zoneHue/max(.05,dot(zoneHue,vec3(.2126,.7152,.0722))),vec3(2.4));
// Elites and champions wear a darker body so gold and bone stand out by value.
zoneLevel*=mix(1.0,.80,actorEliteBody*(1.0-zoneBone));
diffuseColor.rgb=zoneHue*zoneLevel;`}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
${friendly ? `// Keep the paint chromatic through the shared light bands.
vec3 paintLuma=vec3(.2126,.7152,.0722);
vec3 paintedCeramic=vec3(.74,.78,.82)*actorRigColor;
float darkestPaint=min(paintedCeramic.r,min(paintedCeramic.g,paintedCeramic.b));
paintedCeramic=max(vec3(0.),paintedCeramic-darkestPaint);
paintedCeramic*=max(1.0,.38/max(.01,dot(paintedCeramic,paintLuma)));
diffuseColor.rgb=mix(diffuseColor.rgb,paintedCeramic,step(.5,vRigPaint));` : ''}
${friendly?'':'diffuseColor.rgb*=creatureStrike;'}
float plateHeight=(actorPosition.y-actorPlateBounds.x)/actorPlateBounds.y;
if(actorPlateOpening>.05&&plateHeight>.72&&abs(actorPosition.x-actorPlateTorso.x)<actorPlateTorso.y&&abs(actorPosition.z-actorPlateBounds.z)<actorPlateBounds.w*.15*actorPlateOpening)discard;
${friendly?`float ash=fract(sin(dot(floor(actorPosition*65.0),vec3(12.9898,78.233,37.719)))*43758.5453);
if(ash<actorDissolve)discard;`:`// CREATURE18: crisp rest-pose top-down wipe instead of per-voxel noise holes.
float ash=(1.0-actorDissolve*1.08)-plateHeight;
if(actorDissolve>0.0&&ash<0.0)discard;`}
// Death finish stays inside authored regions; no stochastic fracture lines.
float deathFracture=step(1.5,vActorRegion)*step(vActorRegion,2.5);
if(actorDeathStyle>.5&&actorDeathStyle<1.5)diffuseColor.rgb*=vec3(.64,1.06,1.24);
if(actorDeathStyle>1.5&&actorDeathStyle<2.5)diffuseColor.rgb*=.54;
if(actorDeathStyle>3.5)diffuseColor.rgb=diffuseColor.rgb*vec3(.80,.72,1.12)+vec3(.018,.008,.035);
if(actorDeathStyle>2.5&&actorDeathStyle<3.5)diffuseColor.rgb=diffuseColor.rgb*vec3(.62,.78,.50)+vec3(.006,.014,.003);
${friendly ? '' : 'diffuseColor.rgb*=mix(.55,1.0,actorCamouflage);'}
${friendly?'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.98,1.0),actorFlash*actorFlashIntensity*.35);':'float actorHit=step(.25,actorFlash)*actorFlashIntensity;diffuseColor.rgb*=1.0-.48*actorHit;'}`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
${friendly ? '// SHADE15: room light keeps only a slight colour cast on the marine (no per-panel light cuts; soft bands live in GraphicSurface).\nfloat marineChroma=smoothstep(.15,.35,max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b))-min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b)));reflectedLight.directDiffuse*=mix(1.0,.72,marineChroma);float marineAlbedoLuma=max(.01,dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)));reflectedLight.directDiffuse=mix(diffuseColor.rgb*dot(reflectedLight.directDiffuse,vec3(.2126,.7152,.0722))/marineAlbedoLuma,reflectedLight.directDiffuse,.025);reflectedLight.indirectDiffuse=mix(diffuseColor.rgb*dot(reflectedLight.indirectDiffuse,vec3(.2126,.7152,.0722))/marineAlbedoLuma,reflectedLight.indirectDiffuse,.025);reflectedLight.directSpecular=vec3(dot(reflectedLight.directSpecular,vec3(.2126,.7152,.0722)))*.35;reflectedLight.indirectSpecular=vec3(dot(reflectedLight.indirectSpecular,vec3(.2126,.7152,.0722)))*.35;' : ''}`)
        .replace('#include <opaque_fragment>', `${friendly?'':`// SHADER25: the body keeps its two light bands; only a flat value ceiling applies.
// Organ emission is exempt; rim, status colour and the hit rim share the budget.
vec3 creatureBody=max(outgoingLight-lanternEmission,vec3(0.));
float bodyValue=dot(creatureBody,vec3(.2126,.7152,.0722));
float bounded=min(bodyValue,.25);
outgoingLight=creatureBody*(bounded/max(bodyValue,.0001))+lanternEmission;`}
#include <opaque_fragment>`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float actorRim=pow(1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),${friendly?'4.2':'3.0'});
${friendly ? `// SHADE15: one even self-light over the whole suit.
// The shipped marine stores its bind pose in Z-up authoring units.
float browLight=smoothstep(.04,.30,min(totalEmissiveRadiance.g,totalEmissiveRadiance.b)-totalEmissiveRadiance.r)*smoothstep(11.4,12.2,actorPosition.z);
float domePaint=step(.5,vRigPaint)*smoothstep(9.0,10.2,actorPosition.z);
float signatureEdge=smoothstep(.08,.55,actorRim)*max(browLight,domePaint);
totalEmissiveRadiance=totalEmissiveRadiance*actorHierarchy.z+diffuseColor.rgb*actorHierarchy.x*.30*actorStageLight;
totalEmissiveRadiance+=vec3(.72,.77,.80)*signatureEdge*(1.0-actorDissolve);` : `float limb=step(2.5,vActorRegion)*step(vActorRegion,5.5);
// SHADER25: a thin cool rim on the key-light side of the silhouette only.
vec3 creatureKey=vec3(-.52,.42,.74); // the shared screen key of the two light planes
vec3 creatureFacing=normalize(normal);
float keyRim=smoothstep(.80,.88,1.0-clamp(dot(creatureFacing,normalize(vViewPosition)),0.0,1.0))*smoothstep(-.05,.25,dot(normalize(creatureFacing.xy+vec2(1e-4)),normalize(creatureKey.xy+vec2(1e-4))));
#define HAS_CREATURE_LANTERN
float lanternPeak=max(totalEmissiveRadiance.r,max(totalEmissiveRadiance.g,totalEmissiveRadiance.b));
// SHADE15: no white dorsal/crest highlight (read as a headlamp); a dim cool shell lift keeps form, lantern stays the only emissive.
vec3 lanternEmission=actorLanternColor*lanternPeak*smoothstep(.015,.045,lanternPeak)*actorHierarchy.z*(1.0+actorReveal);
totalEmissiveRadiance=lanternEmission;`}
float ashEdge=actorDissolve>0.0?1.0-smoothstep(${friendly?'actorDissolve,actorDissolve+.045,ash':'0.0,.03,ash'}):0.0;
vec3 deathColor=actorDeathStyle>3.5?vec3(.22,.12,.39):actorDeathStyle>.5&&actorDeathStyle<1.5?vec3(.14,.34,.43):actorDeathStyle>2.5?vec3(.08,.14,.025):vec3(.22,.035,.006);
float deathContact=actorDeathStyle>.5?deathFracture*.16*actorRim*(1.0-actorDissolve):0.0;
totalEmissiveRadiance+=${friendly?'actorRimColor':'mix(actorRimColor,vec3(.55,.78,1.0),.85)'}*${friendly?'actorRim':'keyRim'}*(actorRimStrength+actorReveal*.28${friendly?'':'+.12+.06*limb'})${friendly?'':'*(1.0-.6*creatureBone)'}*actorStageLight*mix(.35,1.0,actorCamouflage)+mix(vec3(1.8,.48,.08),deathColor*5.0,step(.5,actorDeathStyle))*ashEdge*actorFlashIntensity${friendly?'':'*.35'}+deathColor*deathContact;${friendly?'':'\ntotalEmissiveRadiance+=vec3(.16,.19,.23)*smoothstep(.67,.93,actorRim)*actorHit;'}`);
    };
    material.customProgramCacheKey = () => `${previousKey}:${friendly ? 'actor-surface-v15-motion22:marine' : 'actor-surface-v25-shader25b:alien'}`;
    material.needsUpdate = true;
    optimizeLocalLights(material);
    patchActorRegions(material,friendly);
  }
  return {
    load(value:number) { attackLoad.value = T.MathUtils.clamp(value, 0, 1); },
    lantern(color:number) { lanternColor.value.setHex(color); },
    rig(color:number) { rigColor.value.setHex(color); },
    body(color:number) { bodyHue.value.setHex(color); },
    stage(value:number) { stageLight.value=T.MathUtils.clamp(value,0,1); },
    plateBounds(minY:number,height:number,centerZ:number,spanZ:number,centerX=0,torsoHalfWidth=1) { plateBounds.value.set(minY,height,centerZ,spanZ);plateTorso.value.set(centerX,torsoHalfWidth); },
    expose(value:number) { plateOpening.value=T.MathUtils.clamp(value,0,1); },
    identity(color:number,champion=false,strength?:number) { rimColor.value.setHex(color);eliteBody.value=champion||elite?1:0;rimStrength.value=strength??(champion?.28:elite?.24:.19); },
    reveal(value: number) { reveal.value = value; },
    hit(value: number) { flash.value = T.MathUtils.clamp(value, 0, 1); },
    dissolve(value: number) { dissolve.value = T.MathUtils.clamp(value, 0, 1); },
    setFlashIntensity(value: number) { flashIntensity.value = T.MathUtils.clamp(value, 0, 1); },
    death(style: 'none'|'frost'|'burn'|'acid'|'arc') { deathStyle.value = style==='frost'?1:style==='burn'?2:style==='acid'?3:style==='arc'?4:0; },
    camouflage(value: number) { camouflage.value = T.MathUtils.clamp(value, .15, 1); },
    reset() { attackLoad.value=0;reveal.value=0;stageLight.value=1;plateOpening.value=0;flash.value = dissolve.value = 0; camouflage.value = 1; deathStyle.value = 0; },
  };
}
