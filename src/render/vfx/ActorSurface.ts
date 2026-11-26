import * as T from 'three';
import {patchActorRegions} from '../ActorRegions';
import {optimizeLocalLights} from '../lighting/LocalLightShading';

// Rest-space waves form shallow pores, parallel limb flutes and small sac dimples.
const creatureHide = `
#if defined(BROOD_PLANES) || defined(BRUTE_PLANES)
#ifdef BRUTE_PLANES
varying vec3 vPlateEdge;
float plateEdgeRim(){
  vec3 dx=dFdx(vPlateEdge),dy=dFdy(vPlateEdge);
  vec3 gradient=max(sqrt(dx*dx+dy*dy),vec3(.00001));
  vec3 onKey=step(vec3(.20),(.89*dx-.46*dy)/gradient);
  vec3 rim=onKey*step(vPlateEdge,1.5*gradient);
  return max(rim.x,max(rim.y,rim.z));
}
#endif
uniform float actorHideFrequency;
float hideFinish(vec3 position, bool limb, bool sac) {
  vec3 p = position * actorHideFrequency * (sac ? 1.45 : 1.);
  vec3 phase = vec3(dot(p,vec3(.84,.22,.50)), dot(p,vec3(-.32,.90,.31)), dot(p,vec3(.23,-.55,.80)));
  vec3 footprint = fwidth(phase);
  vec3 wave = cos(phase + .42*sin(phase.yzx*.51));
  vec3 filtered = 1.-smoothstep(vec3(.85),vec3(2.75),footprint);
  float pore = smoothstep(-.22,.77,(wave.x+wave.y+wave.z)/3.);
  float contrast = limb ? wave.y*filtered.y : ((sac ? 2.*pore-1. : 1.-2.*pore))*min(filtered.x,min(filtered.y,filtered.z));
  return .92+.08*contrast;
}
#endif
`;

/** Shared uniforms per actor, never per mesh or frame; adds no draws or resources. */
export function actorSurface(materials: readonly T.MeshStandardMaterial[], friendly = false, elite = false, hideFrequency = 18) {
  const contact={value:new T.Vector3()};
  const form={value:new T.Vector4()};
  const warden={value:0};
  const castShade={value:0},shedShoulder={value:0};
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
  // CREATURE26: lit albedo per atlas zone (armour, plate, flesh, bone); families keep the SHADER25b levels unless set.
  const zoneLevel = { value: new T.Vector4(.040, .056, .15, .165) }, wetPick = { value: 0 };
  for (const material of materials) {
    material.userData.containmentMarineSurface=friendly;
    const previous = material.onBeforeCompile;
    const previousKey = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      Object.assign(shader.uniforms, { actorShedShoulder:shedShoulder,actorStageLight:stageLight,actorPlateTorso:plateTorso,actorPlateOpening:plateOpening,actorPlateBounds:plateBounds,actorFlash: flash, actorDissolve: dissolve, actorFlashIntensity: flashIntensity, actorRimColor: rimColor, actorRimStrength: rimStrength, actorCamouflage: camouflage, actorDeathStyle: deathStyle, actorHierarchy: hierarchy, actorReveal: reveal, actorRigColor: rigColor });
      if (!friendly) Object.assign(shader.uniforms, {actorContact:contact,actorHideFrequency:{value:hideFrequency},actorBroodForm:form,actorWarden:warden,actorCastShade:castShade, actorLanternColor: lanternColor, actorAttackLoad: attackLoad, actorBodyHue: bodyHue, actorEliteBody: eliteBody, actorZoneLevel: zoneLevel, actorWet: wetPick});
      shader.vertexShader = (friendly ? 'attribute float marinePaint; varying float vRigPaint;\n' : '') + 'uniform float actorPlateOpening;uniform vec4 actorPlateBounds;varying vec3 actorPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nactorPosition=position;' + (friendly ? 'vRigPaint=marinePaint;' : '')).replace('#include <skinning_vertex>', `#include <skinning_vertex>
float plateTop=smoothstep(.48,.72,(position.y-actorPlateBounds.x)/actorPlateBounds.y);
transformed.z+=sign(position.z-actorPlateBounds.z)*actorPlateOpening*actorPlateBounds.w*.055*plateTop;
transformed.y+=actorPlateOpening*actorPlateBounds.y*.025*plateTop;`);
      if(material.defines?.BROOD_PLANES){
        shader.vertexShader='varying float broodRestUp;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nbroodRestUp=normal.z;');
        shader.fragmentShader='varying float broodRestUp;\n'+shader.fragmentShader;
      }
      if(material.defines?.BRUTE_PLANES){
        shader.vertexShader='attribute vec3 plateEdge; varying vec3 vPlateEdge;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPlateEdge=plateEdge;');
      }
      shader.fragmentShader = `${friendly ? 'varying float vRigPaint;' : 'uniform vec3 actorContact;uniform vec4 actorBroodForm;uniform float actorWarden;uniform float actorCastShade;uniform vec3 actorLanternColor;uniform float actorAttackLoad;uniform vec3 actorBodyHue;uniform float actorEliteBody;uniform vec4 actorZoneLevel;uniform float actorWet;'}uniform vec3 actorHierarchy;uniform float actorReveal;uniform vec3 actorRigColor;uniform float actorStageLight;uniform float actorShedShoulder;uniform vec2 actorPlateTorso;uniform float actorPlateOpening;uniform vec4 actorPlateBounds;uniform float actorFlash;uniform float actorDissolve;uniform float actorFlashIntensity;uniform vec3 actorRimColor;uniform float actorRimStrength;uniform float actorCamouflage;uniform float actorDeathStyle;varying vec3 actorPosition;\n` + creatureHide + shader.fragmentShader
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
vec3 zoneAlbedo=sampledDiffuseColor.rgb*diffuse;
#else
vec3 zoneAlbedo=diffuseColor.rgb;
#endif
float zoneValue=dot(zoneAlbedo,vec3(.2126,.7152,.0722));
float zoneMid=smoothstep(.075,.095,zoneValue),zoneFlesh=smoothstep(.19,.23,zoneValue),zoneBone=smoothstep(.40,.46,zoneValue);
// Armour and plate lit (.040/.056) sit at or below the flesh shadow plane (.15 x .30).
float zoneLevel=mix(mix(mix(actorZoneLevel.x,actorZoneLevel.y,zoneMid),actorZoneLevel.z,zoneFlesh),actorZoneLevel.w,zoneBone);
// Family hue unifies the creature; zones keep most of their own hue, armour less chroma.
vec3 familyHue=actorBodyHue/max(.005,dot(actorBodyHue,vec3(.2126,.7152,.0722)));
vec3 zoneHue=mix(familyHue,zoneAlbedo/max(zoneValue,.001),.7);
zoneHue=mix(vec3(1.),zoneHue,mix(.45,1.0,zoneFlesh));
zoneHue=min(zoneHue/max(.05,dot(zoneHue,vec3(.2126,.7152,.0722))),vec3(2.4));
// Elites and champions wear a darker body so gold and bone stand out by value.
zoneLevel*=mix(1.0,.80,actorEliteBody*(1.0-zoneBone));
diffuseColor.rgb=zoneHue*zoneLevel;
#ifdef BROOD_PLANES
// K11 flat atlas cells. Keep eyes, muzzle, blade edge, sac lobes and rank
// trim on the existing finish. Carrier adds brood skin, fold and sac skin.
ivec2 broodCell=ivec2(floor(vMapUv*4.0));
int broodBand=broodCell.x+4*(3-broodCell.y);
bool broodBody=broodBand<=1 || broodBand==6 || (actorBroodForm.w==1. && broodBand>=8 && broodBand<=10);
bool broodFinish=actorBroodForm.x>=-1.;
// The Matron's distal sac follows the tip joint (torso region). Select
// its raised hind volume in the skin's Z-up bind pose, clear of the legs.
bool sacTip=vActorRegion==1. && actorPosition.x < -1. && actorPosition.z > 9.5;
bool broodSac=actorBroodForm.w==1. && (broodBand==9 || broodBand==10 || vActorRegion==7. || sacTip);
// The fourth form component identifies the shared atlas layout.
bool carrierSkin=actorBroodForm.w==1., crawlerSkin=actorBroodForm.w==2.;
bool spitterSkin=actorBroodForm.w==3., stalkerSkin=actorBroodForm.w==4.;
bool broodMark=broodBand==3 || broodBand==4 ||
  ((stalkerSkin || spitterSkin) && broodBand==7) || (carrierSkin && broodBand==11);
// The longitudinal ridge widens toward the tail; the hooks form a separate pair.
float ridgeWidth=crawlerSkin?mix(.145,.095,smoothstep(-.8,.65,actorPosition.x)):.50;
float ridgeDistance=abs(actorPosition.y)/ridgeWidth;
bool ridgeSkin=(crawlerSkin || spitterSkin) && broodBody && broodRestUp>.12;
bool dorsal=ridgeSkin && ridgeDistance<1.;
bool crawlerHook=crawlerSkin && (broodBand==2 || broodBand==5) &&
                 actorPosition.x>.52 && abs(actorPosition.y)>.09;
broodMark=broodMark || crawlerHook || (crawlerSkin && dorsal) || (broodBody && (
  (spitterSkin && dorsal && vActorRegion<=2.) ||
  (stalkerSkin && ((vActorRegion==2. && broodRestUp>.68) ||
                   (vActorRegion==1. && abs(actorPosition.y)<.27 && broodRestUp>.25) ||
                   (vActorRegion>=3. && vActorRegion<=4. && broodRestUp>.55))) ||
  (carrierSkin && !broodSac && (vActorRegion==4. || vActorRegion==5.) && broodRestUp>.78) ||
  (broodSac && actorBroodForm.z>.42 && broodRestUp>.12 &&
   abs(sin(actorPosition.x*.85+abs(actorPosition.y)*.42))<.65)));
vec3 broodInk=carrierSkin?vec3(2.8,.12,1.8):crawlerSkin?vec3(3.9,.22,.85):
              spitterSkin?vec3(.60,2.65,.025):vec3(.22,1.45,3.2);
float ridgeGlow=ridgeSkin?.16*(1.-smoothstep(1.,1.6,ridgeDistance)):0.;
if(broodFinish && broodBody){
  float value=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
  diffuseColor.rgb=broodSac ? .76*mix(vec3(value),diffuseColor.rgb,.72)
                            : vec3(.84,.73,1.08)*clamp(value*.68,.032,.105);
}
#endif
#ifdef BRUTE_PLANES
// Flat atlas cells in GLTF's top-down UV order. Bone, lead and gilt carry
// the face, weapon edge and elite trim. The legacy elite mantle uses gold.
ivec2 cell=ivec2(floor(vMapUv*4.0));
int band=cell.x+4*(3-cell.y);
bool eliteTrim=band==7 || (band==8 && (vActorRegion==2.0 || vActorRegion==4.0));
bool wardenMaw=actorWarden>.5 && band==3;
if(wardenMaw)diffuseColor.rgb=vec3(.025,.012,.005);
bool bruteFace=band==5;
if(bruteFace)diffuseColor.rgb=vec3(.68,.605,.48);
bool bruteBody=actorWarden>.5 ? !bruteFace && !wardenMaw : band!=2 && band!=5 && !eliteTrim;
if(bruteBody) {
  diffuseColor.rgb=mix(vec3(.027,.073,.044),vec3(.027,.073,.044)*.79,actorWarden);
  creatureStrike=1.0;
}
// Plate pigment follows the stepped lighting. Eye slits and status finishes retain their dark ink.
if(bruteBody && actorWarden>.5 && band==6)diffuseColor.rgb*=actorBroodForm.x< -1. ? .30 : .96;
if(bruteBody && actorWarden<.5){
  // Wrap armor around the fists in bind space. Its edge follows the skin
  // continuously between vertices, even on the low-detail mesh.
  vec3 sculpt=actorPosition*vec3(1.,1.,1.8);
  float side=abs(sculpt.y);
  bool forelimb=side>1.90 && sculpt.x>.58 && sculpt.z<6.4;
  bool knuckle=sculpt.x-.22*(sculpt.z-4.6)>1.62;
  bool darkArmor=forelimb?knuckle:band==6;
  bool eyeSlit=band==6 && vActorRegion==2. && sculpt.x>2.28;
  if(darkArmor)diffuseColor.rgb*=actorBroodForm.x< -1. || eyeSlit ? .30 : .96;
}
#endif`}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
${friendly ? `// Keep the paint chromatic through the shared light bands.
vec3 paintLuma=vec3(.2126,.7152,.0722);
vec3 paintedCeramic=vec3(.74,.78,.82)*actorRigColor;
float darkestPaint=min(paintedCeramic.r,min(paintedCeramic.g,paintedCeramic.b));
paintedCeramic=max(vec3(0.),paintedCeramic-darkestPaint);
paintedCeramic*=max(1.0,.38/max(.01,dot(paintedCeramic,paintLuma)));
// The ram face and dorsal modules reuse the shoulder paint mask. Keep
// their rig pigment on a narrow transverse band over graphite enamel.
float equipmentPaint=step(1.5,vRigPaint);
vec3 equipmentColour=mix(vec3(.09,.105,.115),paintedCeramic,.09+.55*step(abs(actorPosition.z-9.7),.12));
paintedCeramic=mix(paintedCeramic,equipmentColour,equipmentPaint);
diffuseColor.rgb=mix(diffuseColor.rgb,paintedCeramic,step(.5,vRigPaint));
// Forward is -X in the Z-up bind pose. The luminous brow bends across
// the front of the crown so its closed end points along the gaze.
float helmet=step(vRigPaint,-.5);
float browDistance=abs(actorPosition.x+.74-.72*abs(actorPosition.y));
float browSpan=step(abs(actorPosition.y),.90)*step(12.90,actorPosition.z)*helmet;
float visorBand=(1.-smoothstep(.19,.25,browDistance))*browSpan;
float cowl=helmet*smoothstep(12.9,13.3,actorPosition.z);
diffuseColor.rgb*=mix(1.,.33,cowl);
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.012,.044,.06),(1.-smoothstep(.35,.41,browDistance))*browSpan);` : ''}
${friendly?'':'diffuseColor.rgb*=creatureStrike;'}
float plateHeight=(actorPosition.y-actorPlateBounds.x)/actorPlateBounds.y;
if(actorShedShoulder>.5 && plateHeight>.66 && actorPosition.z-actorPlateBounds.z>actorPlateBounds.w*.46 && abs(actorPosition.x-actorPlateTorso.x)<actorPlateTorso.y*.87)discard;
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
float ceiling=.25;
#ifdef BRUTE_PLANES
if(bruteFace)ceiling=.355;
#endif
float bounded=min(bodyValue,ceiling);
float contactShade=actorCastShade*(1.-smoothstep(.0,.25,actorContact.y));
outgoingLight=creatureBody*(bounded/max(bodyValue,.0001))*(1.-.84*contactShade)+lanternEmission;
// Break the light along the actual posed silhouette. Keep identity paint and
// the loaded head/striking limbs free of elemental emission.
if(actorContact.y>0. && lanternPeak<.015 && vActorRegion<6.5){
 float safe=1.-step(.02,actorAttackLoad)*step(1.5,vActorRegion)*step(vActorRegion,5.5);
 float edge=smoothstep(.025,.34,actorRim);
 vec3 p=actorPosition;
 float vein=sin(dot(p,vec3(1.67,.86,1.22))+.65*sin(p.z*2.1));
 float energy;
 vec3 accent;
 if(actorContact.x<1.5){
  energy=edge*(.38+.62*smoothstep(-.45,.48,vein))*(.58+.42*limb);
  accent=vec3(.59,1.44,1.68);
 }else if(actorContact.x<2.5){
  float flicker=sin(vein*3.+p.z*1.7-actorContact.z*6.);
  energy=edge*(.34+.66*smoothstep(-.62,.40,flicker));
  accent=mix(vec3(.85,.16,.012),vec3(1.9,.96,.16),smoothstep(.35,.88,flicker));
 }else if(actorContact.x<3.5){
  energy=edge*(.24+.76*smoothstep(.05,.62,sin(vein*5.+actorContact.z*8.)));
  accent=vec3(1.14,.66,1.92);
 }else{
  energy=edge*(.26+.74*smoothstep(-.45,.58,vein));
  accent=vec3(1.29,.90,.47);
 }
 // Faceted armour can face the camera squarely. Leave a broken contact
 // patch on those planes too, particularly on the outer joints.
 float deposit=smoothstep(.48,.94,vein)*(.25+.52*limb);
 outgoingLight+=accent*max(energy,deposit)*safe*actorContact.y*(1.55+.45*actorFlashIntensity);
 if(actorContact.x>1.5 && actorContact.x<2.5){
  // The pale centre of a live coal follows the skin even as a limb turns
  // its edge away from the camera. Its narrow footprint keeps the ink clear.
  float coal=(1.-smoothstep(.09,.39,abs(vein-.30)))*max(.42,edge);
  outgoingLight+=vec3(4.2,2.9,1.2)*coal*safe*actorContact.y;
 }
}`}
#include <opaque_fragment>`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float actorRim=pow(1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),${friendly?'4.2':'3.0'});
${friendly ? `// SHADE15: one even self-light over the whole suit.
// The shipped marine stores its bind pose in Z-up authoring units.
float browLight=smoothstep(.04,.30,min(totalEmissiveRadiance.g,totalEmissiveRadiance.b)-totalEmissiveRadiance.r)*smoothstep(11.4,12.2,actorPosition.z);
float domePaint=step(.5,vRigPaint)*(1.-equipmentPaint)*smoothstep(9.0,10.2,actorPosition.z);
float signatureEdge=smoothstep(.08,.55,actorRim)*max(browLight,domePaint);
totalEmissiveRadiance=mix(totalEmissiveRadiance*.48,vec3(.035,1.05,1.20),max(visorBand,browLight*helmet))*actorHierarchy.z+diffuseColor.rgb*actorHierarchy.x*.30*actorStageLight;
totalEmissiveRadiance+=vec3(.72,.77,.80)*signatureEdge*(1.0-actorDissolve);` : `float limb=step(2.5,vActorRegion)*step(vActorRegion,5.5);
// SHADER25: a thin cool rim on the key-light side of the silhouette only.
vec3 creatureKey=vec3(-.52,.42,.74); // the shared screen key of the two light planes
vec3 creatureFacing=normalize(normal);
float keyRim=smoothstep(.80,.88,1.0-clamp(dot(creatureFacing,normalize(vViewPosition)),0.0,1.0))*smoothstep(-.05,.25,dot(normalize(creatureFacing.xy+vec2(1e-4)),normalize(creatureKey.xy+vec2(1e-4))));
#define HAS_CREATURE_LANTERN
float lanternPeak=max(totalEmissiveRadiance.r,max(totalEmissiveRadiance.g,totalEmissiveRadiance.b));
// SHADE15: no white dorsal/crest highlight (read as a headlamp); a dim cool shell lift keeps form, lantern stays the only emissive.
vec3 lanternEmission=actorLanternColor*lanternPeak*smoothstep(.015,.045,lanternPeak)*actorHierarchy.z*(1.0+actorReveal);
totalEmissiveRadiance=lanternEmission;
// CREATURE26: a small wet specular pick from the fixed key, on flesh zones only (0 = off for families not rebuilt).
float wetPick=pow(max(dot(normalize(vNormal),normalize(creatureKey+normalize(vViewPosition))),0.0),48.0);
totalEmissiveRadiance+=vec3(.62,.66,.62)*actorWet*zoneFlesh*(1.0-zoneBone)*smoothstep(.35,.75,wetPick)*actorStageLight*actorCamouflage;`}
#ifdef BROOD_PLANES
if(broodFinish && (broodMark || ridgeGlow>0.)){
  // Keep the identification mark visible through the resting Stalker's camouflage.
  float markVisibility=stalkerSkin ? mix(.83,1.,actorCamouflage) : actorCamouflage;
  lanternEmission=broodInk*(broodMark?1.:ridgeGlow)*mix(.92,1.,actorStageLight)*markVisibility;
  totalEmissiveRadiance=lanternEmission;
}
#endif
#ifdef BRUTE_PLANES
if(wardenMaw){
  float core=smoothstep(.64,.80,max(dot(normalize(normal),normalize(vViewPosition)),0.));
  lanternEmission=mix(vec3(1.30,.41,.045),vec3(5.6,4.8,3.35),core)*(1.+.18*actorAttackLoad)*mix(.88,1.,actorStageLight)*actorCamouflage*(1.-actorDissolve);
  totalEmissiveRadiance=lanternEmission;
}
if(bruteBody || (bruteFace && actorWarden>.5)){
  lanternEmission=vec3(0.);
  totalEmissiveRadiance=lanternEmission;
  keyRim*=actorReveal;
}
#endif
float ashEdge=actorDissolve>0.0?1.0-smoothstep(${friendly?'actorDissolve,actorDissolve+.045,ash':'0.0,.03,ash'}):0.0;
vec3 deathColor=actorDeathStyle>3.5?vec3(.22,.12,.39):actorDeathStyle>.5&&actorDeathStyle<1.5?vec3(.14,.34,.43):actorDeathStyle>2.5?vec3(.08,.14,.025):vec3(.22,.035,.006);
float deathContact=actorDeathStyle>.5?deathFracture*.16*actorRim*(1.0-actorDissolve):0.0;
totalEmissiveRadiance+=${friendly?'actorRimColor':'mix(actorRimColor,vec3(.55,.78,1.0),.85)'}*${friendly?'actorRim':'keyRim'}*(actorRimStrength+actorReveal*.28${friendly?'':'+.12+.06*limb'})${friendly?'':'*(1.0-.6*creatureBone)'}*actorStageLight*mix(.35,1.0,actorCamouflage)+mix(vec3(1.8,.48,.08),deathColor*5.0,step(.5,actorDeathStyle))*ashEdge*actorFlashIntensity${friendly?'':'*.35'}+deathColor*deathContact;${friendly?'':'\ntotalEmissiveRadiance+=vec3(.16,.19,.23)*smoothstep(.67,.93,actorRim)*actorHit;'}`);
    };
    material.customProgramCacheKey = () => `${previousKey}:${friendly ? 'actor-surface-marine28:marine' : 'actor-surface-fx31:alien'}`;
    material.needsUpdate = true;
    optimizeLocalLights(material);
    patchActorRegions(material,friendly);
  }
  return {
    contact(kind:number,strength:number,time:number){contact.value.set(kind,strength,time);},
    form(shadow:number,edge:number,shadowGain:number,carrier:number){form.value.set(shadow,edge,shadowGain,carrier);},
    formShadow(threshold:number){form.value.x=threshold;},
    warden(active:boolean) { warden.value=active?1:0; },
    castShade(value:number) { castShade.value=value; },
    load(value:number) { attackLoad.value = T.MathUtils.clamp(value, 0, 1); },
    lantern(color:number) { lanternColor.value.setHex(color); },
    rig(color:number) { rigColor.value.setHex(color); },
    body(color:number) { bodyHue.value.setHex(color); },
    zones(armour:number,plate:number,flesh:number,bone:number,wet=0) { zoneLevel.value.set(armour,plate,flesh,bone);wetPick.value=wet; },
    stage(value:number) { stageLight.value=T.MathUtils.clamp(value,0,1); },
    plateBounds(minY:number,height:number,centerZ:number,spanZ:number,centerX=0,torsoHalfWidth=1) { plateBounds.value.set(minY,height,centerZ,spanZ);plateTorso.value.set(centerX,torsoHalfWidth); },
    shedShoulder(value:number) { shedShoulder.value=value; },
    expose(value:number) { plateOpening.value=T.MathUtils.clamp(value,0,1); },
    identity(color:number,champion=false,strength?:number) { rimColor.value.setHex(color);eliteBody.value=champion||elite?1:0;rimStrength.value=strength??(champion?.28:elite?.24:.19); },
    reveal(value: number) { reveal.value = value; },
    hit(value: number) { flash.value = T.MathUtils.clamp(value, 0, 1); },
    dissolve(value: number) { dissolve.value = T.MathUtils.clamp(value, 0, 1); },
    setFlashIntensity(value: number) { flashIntensity.value = T.MathUtils.clamp(value, 0, 1); },
    death(style: 'none'|'frost'|'burn'|'acid'|'arc') { deathStyle.value = style==='frost'?1:style==='burn'?2:style==='acid'?3:style==='arc'?4:0; },
    camouflage(value: number) { camouflage.value = T.MathUtils.clamp(value, .15, 1); },
    reset() { contact.value.set(0,0,0);shedShoulder.value=0;castShade.value=0;attackLoad.value=0;reveal.value=0;stageLight.value=1;plateOpening.value=0;flash.value = dissolve.value = 0; camouflage.value = 1; deathStyle.value = 0; },
  };
}
