import {SHIP_ARCHITECTURE_LAYOUTS} from '../game/roguelike/shipArchitectureLayouts';
import {ENVIRONMENT_COMPOSITION} from './lighting/EnvironmentComposition';
import * as T from 'three';
import {groundIndicatorMaterial} from './vfx/GroundIndicatorMaterial';
import type {ShipEnvironment} from './ShipEnvironments';
import type {GraphicsTier} from './FrameBudget';
import type {ShadowQuality} from './graphicsOptions';
import {getEnvironmentMood,type EnvironmentMood} from './lighting/EnvironmentMoods';
import {LightPool} from './lighting/LightPool';
import {MarineLamp} from './lighting/MarineLamp';
import {roomComposition,type RoomComposition} from './lighting/RoomCompositions';

type Fixture={x:number;y:number;z:number;color:number;nativeColor?:boolean;poolAngle?:number;poolStyle?:number;gain?:number;poolWidth?:number;poolDepth?:number;distance?:number;growthSource?:boolean};
const APERTURE_STYLE:Readonly<Record<ShipEnvironment,number>>={cryogenics:0,habitation:1,security:1,cargo:2,communications:2,engineering:2,maintenance:0,infested:3,containment:1,reactor:4};
export type ReactorStaging=Readonly<{coreX:number;coreY:number;coreZ:number;coreColor:number;coreRadius:number}>;
/** Stable room lights, motivated practicals and a bounded combat-light pool. */
export class SceneLighting {
 readonly root=new T.Group();
 readonly ambient=new T.HemisphereLight();
 private readonly directionalKey=new T.DirectionalLight();
 readonly coreKey=new T.SpotLight(0xffdfad,352,60,Math.PI*.4,.65,2);
 get key():T.DirectionalLight|T.SpotLight{return this.mood.environment==='reactor'?this.coreKey:this.directionalKey;}
 readonly fill=new T.DirectionalLight();
 readonly rim=new T.DirectionalLight();
 readonly practicalShapes=Array.from({length:4},()=>new T.Vector4(1,0,1,3));
 readonly fixtures=Array.from({length:4},()=>new T.PointLight(0x9edcec,0,5.8,2));
 readonly blast=new T.PointLight(0xffc18a,0,7,2);
 readonly pool=new LightPool('high',9);
 readonly lamp=new MarineLamp();
 mood:EnvironmentMood=getEnvironmentMood();
 staging:ReactorStaging|null=null;
 private composition:RoomComposition=roomComposition();private width=0;private height=0;private bossArena=false;private manualConsole=false;private overloadFloor=false;private menuPresentation=false;
 private templateArchitecture=false;private interiorPresentation=false;
 private coveragePoint=new T.Vector3();private authoredFixtures:Fixture[]=[];private nearbyFixtures:Fixture[]=[];private playerX=NaN;private playerZ=NaN;private fixtureTint=new T.Color();
 private blastLife=0;private time=0;private tier:GraphicsTier='high';private fixtureCount=0;private dynamicLights=true;private flashIntensity=1;private disposed=false;private shadowQuality:ShadowQuality='high';
 constructor(){
  this.directionalKey.castShadow=true;this.coreKey.visible=false;this.coreKey.castShadow=true;
  this.coreKey.shadow.mapSize.set(1024,1024);this.coreKey.shadow.camera.near=.3;this.coreKey.shadow.camera.far=75;this.coreKey.shadow.normalBias=.025;this.coreKey.shadow.bias=-.0002;this.coreKey.shadow.radius=3.5;this.coreKey.shadow.intensity=.38;
  const shadow=this.directionalKey.shadow;shadow.mapSize.set(1024,1024);
  Object.assign(shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:.5,far:70});
  shadow.normalBias=.015;shadow.bias=-.0002;shadow.radius=3.5;shadow.intensity=.38;
  this.root.name='scene-lighting';
  this.root.add(this.ambient,this.directionalKey,this.directionalKey.target,this.coreKey,this.coreKey.target,this.fill,this.fill.target,this.rim,this.rim.target,...this.fixtures,this.blast,this.pool.root,this.lamp.root);
  this.applyMood(0,0);
 }
 /** Settings changes may alter shader topology; updates and combat effects never do. */
 setQuality(tier:GraphicsTier,dynamicLights=true,atmosphere=true,flashIntensity=1,shadows:ShadowQuality='high'){
  this.tier=tier;this.shadowQuality=shadows;this.dynamicLights=dynamicLights;this.flashIntensity=Math.max(0,Math.min(1,flashIntensity));
  this.pool.setIntensityScale(this.flashIntensity);
  this.key.castShadow=tier==='high'&&shadows!=='off';const size=shadows==='low'?512:1024;if(this.key.shadow.mapSize.x!==size){this.key.shadow.map?.dispose();this.key.shadow.map=null;this.key.shadow.mapSize.set(size,size);this.key.shadow.needsUpdate=true;}this.pool.setQuality(tier,tier==='high'&&dynamicLights);
  this.blast.visible=dynamicLights;this.lamp.setQuality(tier==='high',atmosphere);
  if(!dynamicLights){this.blastLife=0;this.blast.intensity=0;}
  for(let i=0;i<this.fixtures.length;i++){this.fixtures[i].visible=tier==='high'||i<2;if(!this.fixtures[i].visible){this.fixtures[i].intensity=0;this.practicalShapes[i].z=0;}}this.playerX=NaN;
 }
 loadRoom(world:T.Group,width:number,height:number,environment?:ShipEnvironment,templateId?:string){
  this.interiorPresentation=!!world.getObjectByName('e9-room-interiors');
  this.templateArchitecture=Object.hasOwn(SHIP_ARCHITECTURE_LAYOUTS,templateId??'');
  this.width=width;this.height=height;this.bossArena=templateId==='reactor-vault';this.manualConsole=templateId==='manual-control-chamber';this.overloadFloor=templateId==='overload-floor';this.composition=roomComposition(templateId);this.menuPresentation=false;
  this.blastLife=0;this.blast.intensity=0;this.pool.reset();this.time=0;
  this.mood=getEnvironmentMood(environment??(templateId==='reactor-vault'?'reactor':undefined));
  this.staging=templateId==='reactor-vault'?{coreX:width/2,coreY:2.6,coreZ:height/2,coreColor:0xffdfab,coreRadius:4.9}:null;
  world.updateWorldMatrix(true,true);
  if(templateId==='overload-floor')this.staging=this.authoredCore(world,width,height);
  if(templateId==='manual-control-chamber'){
   const consoleFixture=world.getObjectByName('g2-world-dressing')?.userData.lightFixtures?.[0] as Fixture|undefined;
   if(consoleFixture)this.staging={coreX:consoleFixture.x,coreY:consoleFixture.y+1.6,coreZ:consoleFixture.z,coreColor:0xffdfad,coreRadius:3};
  }
  this.applyMood(width,height);
  world.updateWorldMatrix(true,true);const candidates:Fixture[]=[],position=new T.Vector3();
  world.traverse(object=>{
   const authored=object.userData.lightFixtures as Fixture[]|undefined;
   if(authored)for(const fixture of authored){position.set(fixture.x,fixture.y,fixture.z).applyMatrix4(object.matrixWorld);candidates.push({...fixture,x:position.x,y:position.y,z:position.z});}
   // Authored meshes are merged by material: their centers are never fixture origins.
   if(object.userData.bakedEnvironment||!(object instanceof T.Mesh)||Array.isArray(object.material))return;
   const material=object.material;
   if(!(material instanceof T.MeshStandardMaterial)||material.emissiveIntensity<.5||material.emissive.getHex()===0)return;
   object.getWorldPosition(position);if(position.y<.65)return;
   candidates.push({x:position.x,y:position.y,z:position.z,color:material.emissive.getHex()});
  });
  const boundary=world.userData.lightingBoundary as readonly {x:number;y:number}[]|undefined;
  if(this.mood.environment!=='reactor'&&boundary?.length){
   const inverse=world.matrixWorld.clone().invert();let write=0;
   for(const fixture of candidates){
    position.set(fixture.x,fixture.y,fixture.z).applyMatrix4(inverse);let inside=false,edgeDistance=Infinity;
    for(let i=0,j=boundary.length-1;i<boundary.length;j=i++){
     const a=boundary[i],b=boundary[j];
     if((a.y>position.z)!==(b.y>position.z)&&position.x<(b.x-a.x)*(position.z-a.y)/(b.y-a.y)+a.x)inside=!inside;
     const dx=b.x-a.x,dz=b.y-a.y,t=Math.max(0,Math.min(1,((position.x-a.x)*dx+(position.z-a.y)*dz)/(dx*dx+dz*dz||1)));
     edgeDistance=Math.min(edgeDistance,Math.hypot(position.x-a.x-dx*t,position.z-a.y-dz*t));
    }
    if(inside||edgeDistance<=1.1)candidates[write++]=fixture;
   }
   candidates.length=write;
  }
  this.authoredFixtures=candidates.slice();this.playerX=this.playerZ=NaN;
  const selected:Fixture[]=[];
  candidates.sort((a,b)=>Math.hypot(a.x-width/2,a.z-height/2)-Math.hypot(b.x-width/2,b.z-height/2));
  while(candidates.length&&selected.length<this.fixtures.length){
   if(selected.length)candidates.sort((a,b)=>Math.min(...selected.map(s=>Math.hypot(b.x-s.x,b.z-s.z)))-Math.min(...selected.map(s=>Math.hypot(a.x-s.x,a.z-s.z))));
   const next=candidates.shift()!;if(selected.every(s=>Math.hypot(next.x-s.x,next.z-s.z)>2))selected.push(next);
  }
  if(this.staging){selected.unshift({x:this.staging.coreX,y:this.staging.coreY,z:this.staging.coreZ,color:this.staging.coreColor});selected.length=Math.min(selected.length,this.fixtures.length);}
  this.fixtureCount=selected.length;
  this.fixtures.forEach((light,i)=>{
   const fixture=selected[i],core=!!this.staging&&i===0;
   light.userData.reactorCore=core;light.userData.reactorMood=this.mood.environment==='reactor';light.userData.poolCenterX=width/2;light.userData.poolCenterZ=height/2;light.intensity=fixture&&light.visible?(core?14:this.mood.practical.intensity):0;
   if(fixture){
    light.position.set(fixture.x,fixture.y,fixture.z);light.color.setHex(fixture.color);this.setFixtureShape(light,fixture,i);
    if(!core&&!fixture.nativeColor){
     const accent=this.mood.environment==='infested'&&i%3===2?0xdc5bcb:this.mood.environment==='security'&&i%2?0xf1f4ff:this.mood.practical.color;
     light.color.lerp(new T.Color(accent),this.mood.environment==='reactor'?.92:.9);
    }
    light.distance=fixture.distance??(core?10:this.mood.environment==='reactor'?7.5:this.mood.practical.distance);
   }
  });
 }
 private setFixtureShape(light:T.PointLight,fixture:Fixture,index:number){
  const angle=fixture.poolAngle??Math.atan2(this.width/2-fixture.x,this.height/2-fixture.z);
  light.userData.poolAngle=angle;light.userData.worldBounceGain=this.interiorPresentation?0:ENVIRONMENT_COMPOSITION[this.mood.environment].bounce;
  const profile=ENVIRONMENT_COMPOSITION[this.mood.environment],style=fixture.poolStyle??(this.templateArchitecture?1:APERTURE_STYLE[this.mood.environment]);light.userData.poolStyle=style;light.userData.fixtureGain=fixture.gain??1;light.userData.humanFailed=this.mood.environment==='infested'&&fixture.poolStyle===0;light.userData.poolWidth=fixture.poolWidth??(this.templateArchitecture?.55:profile.width);light.userData.poolDepth=fixture.poolDepth??(this.templateArchitecture?7:profile.depth);
  // Long axis follows the visible emitter toward the room; cross-axis stays narrow.
  this.practicalShapes[index].set(Math.sin(angle),Math.cos(angle),light.visible?(fixture.poolWidth??(this.templateArchitecture?.55:profile.width)):0,fixture.poolDepth??(this.templateArchitecture?7:profile.depth));
 }
 setPlayer(x:number,z:number,aimRadians:number,camera?:T.Camera){
  this.lamp.update(x,z,aimRadians);
  if(this.menuPresentation)return false;
  if(Number.isFinite(this.playerX)&&Math.hypot(x-this.playerX,z-this.playerZ)<1.25)return false;
  this.playerX=x;this.playerZ=z;
  const selected=this.nearbyFixtures;selected.length=0;
  if(this.staging)selected.push({x:this.staging.coreX,y:this.staging.coreY,z:this.staging.coreZ,color:this.staging.coreColor});
  if(this.mood.environment==='reactor'){
   this.authoredFixtures.sort((a,b)=>(a.x-x)**2+(a.z-z)**2-((b.x-x)**2+(b.z-z)**2));
   for(const fixture of this.authoredFixtures){
    let separate=true;for(const other of selected)if(Math.hypot(fixture.x-other.x,fixture.z-other.z)<2){separate=false;break;}
    if(separate)selected.push(fixture);if(selected.length===4)break;
   }
  }else{
   let nearest:Fixture|undefined,nearestDistance=Infinity;
   for(const fixture of this.authoredFixtures){const d=((fixture.x-x)**2+(fixture.z-z)**2)/(fixture.growthSource?4:1);if(d<nearestDistance){nearest=fixture;nearestDistance=d;}}
   if(nearest)selected.push(nearest);
   while(selected.length<4){
    let best:Fixture|undefined,bestScore=-1;
    for(const fixture of this.authoredFixtures){
     const distance=(fixture.x-x)**2+(fixture.z-z)**2;if(distance>225)continue;
     let spacing=Infinity;for(const other of selected){const d=(fixture.x-other.x)**2+(fixture.z-other.z)**2;if(d<spacing)spacing=d;}
     if(spacing<4)continue;
     let weight=1;if(camera){this.coveragePoint.set(fixture.x,.04,fixture.z).project(camera);const sx=Math.abs(this.coveragePoint.x),sy=Math.abs(this.coveragePoint.y);weight=sx>1.15||sy>1.15?.015:sx>.7||sy>.6?.4:1;}
     if(this.mood.environment==='infested'&&selected.length===2){const r=fixture.color>>16&255,g=fixture.color>>8&255,b=fixture.color&255;if(r>g*1.3&&b>g*1.1)weight*=3;}
     const score=spacing/(1+distance/50)*weight*(fixture.growthSource?4:1);if(score>bestScore){best=fixture;bestScore=score;}
    }
    if(!best)break;selected.push(best);
   }
  }
  this.fixtureCount=selected.length;
  for(let i=0;i<4;i++){
   const light=this.fixtures[i],fixture=selected[i],core=!!this.staging&&i===0;
   light.userData.reactorCore=core;light.userData.reactorMood=this.mood.environment==='reactor';
   if(!fixture){light.intensity=0;continue;}
   light.position.set(fixture.x,fixture.y,fixture.z);light.color.setHex(fixture.color);this.setFixtureShape(light,fixture,i);
   if(!core&&!fixture.nativeColor){const accent=this.mood.environment==='infested'&&i%3===2?0xdc5bcb:this.mood.environment==='security'&&i%2?0xf1f4ff:this.mood.practical.color;this.fixtureTint.setHex(accent);light.color.lerp(this.fixtureTint,this.mood.environment==='reactor'?.92:.9);}
   light.distance=fixture.distance??(core?10:this.mood.environment==='reactor'?7.5:this.mood.practical.distance);
   light.intensity=light.visible?(core?14:this.mood.practical.intensity):0;
  }
  return true;
 }
 explosion(x:number,z:number,radius:number){if(!this.dynamicLights)return;this.blast.position.set(x,.9,z);this.blast.distance=Math.min(7,Math.max(3,radius*1.5));this.blastLife=.18;this.blast.intensity=12*this.flashIntensity;}
 update(dt:number){
  const delta=Number.isFinite(dt)?Math.max(0,dt):0;this.time+=delta;this.pool.update(delta);
  this.blastLife=Math.max(0,this.blastLife-delta);this.blast.intensity=12*this.flashIntensity*(this.blastLife/.18)**2;
  if(this.menuPresentation)return;
  const behavior=this.mood.practical.behavior;
  for(let i=0;i<this.fixtureCount;i++){
   const light=this.fixtures[i];if(!light.visible)continue;
   const phase=this.time+i*1.73;
   const animated=behavior==='alarm'?.8+.2*Math.sin(phase*3):behavior==='pulse'?.72+.28*Math.sin(phase*1.4):behavior==='reactor'?(light.userData.reactorCore?.9+.1*Math.sin(this.time*2.1):.65+.35*Math.pow(Math.max(0,Math.cos(this.time*1.2-i*Math.PI/2)),4)):behavior==='flicker'?.93+.045*Math.sin(phase*13)+.025*Math.sin(phase*29):1;
   const climax=this.mood.environment==='reactor'&&!!this.staging&&!this.bossArena;if(climax&&i>0){light.color.setHex(0xff3018);light.distance=4.2;}
   const failed=((this.mood.environment==='habitation'&&i===1)||light.userData.humanFailed)?.35+.65*Math.pow(Math.min(1,Math.max(0,Math.sin(this.time*5.3)+.35*Math.sin(this.time*17.1))),2):1;
   light.intensity=(light.userData.reactorCore?this.bossArena?25:14:climax?65:this.mood.practical.intensity*this.composition.practicalGain)*(light.userData.fixtureGain??1)*(1+(animated*failed-1)*this.flashIntensity);
  }
 }
 /** Reuses the prepared fixed lights; menu transitions create no shader topology. */
 setMenu(enabled:boolean){
  if(this.menuPresentation===enabled)return;this.menuPresentation=enabled;
  if(!enabled){this.applyMood(this.width,this.height);this.playerX=this.playerZ=NaN;return;}
  this.suppressCombatFeedback();
  this.ambient.intensity=.078;this.ambient.color.setHex(0x8098b0);
  this.key.position.set(25.9,4.55,11.2);this.key.target.position.set(23.4,2,14.7);this.key.color.setHex(0xc9eafa);this.key.intensity=this.key instanceof T.SpotLight?1320:2.16;
  this.fill.position.set(28,4,19);this.fill.target.position.set(24,1,13);this.fill.color.setHex(0x98b5c4);this.fill.intensity=1.35;
  this.rim.position.set(26.2,4.9,11.7);this.rim.target.position.set(23.4,1.8,14.7);this.rim.color.setHex(0xc5f2ff);this.rim.intensity=2.4;
  // Existing practical slots light only the cast's half of the set. The fixture
  // keeps its warm source, with a restrained cool return from the occupied berth.
  for(let i=0;i<4;i++){const light=this.fixtures[i];light.position.set(i===1?24.5:25.9,i===1?2.8:4.55,i===1?10.5:11.2);light.color.setHex(i===1?0x9fe8ff:0xff9a70);light.intensity=i===0?110:i===1?38:0;light.distance=i===1?5.5:7;}
  this.lamp.setRoom(0);this.lamp.light.intensity=12;
 }
 /** Keep fixed slots visible for shader reuse, with no combat radiance in the title. */
 suppressCombatFeedback(muzzle?:T.PointLight){this.pool.reset();this.blastLife=0;this.blast.intensity=0;if(muzzle)muzzle.intensity=0;}
 /** The Queen's face remains keyed in armored, exposed and defeated states. */
 setBossState(x:number,z:number,vulnerable:boolean,defeated:boolean){
  if(!this.bossArena||this.menuPresentation)return;
  this.coreKey.position.set(x,9,z+7);this.coreKey.target.position.set(x,1.2,z);
  this.coreKey.color.setHex(vulnerable?0xffd9f4:0xffe6c6);this.coreKey.intensity=defeated?480:720;
  this.fill.intensity=defeated?3.5:5.5;this.rim.intensity=.55;
  this.fixtures[0].position.set(x,4.5,z+1.8);this.fixtures[0].color.setHex(vulnerable?0xff83ce:0xc0dcff);this.fixtures[0].distance=14;
 }
 invalidateShadows(){for(const light of [this.directionalKey,this.coreKey]){light.shadow.map?.dispose();light.shadow.map=null;light.shadow.mapPass?.dispose();light.shadow.mapPass=null;light.shadow.needsUpdate=true;}}
 dispose(){if(this.disposed)return;this.disposed=true;this.directionalKey.shadow.dispose();this.coreKey.shadow.dispose();this.pool.dispose();this.lamp.dispose();this.root.removeFromParent();}
 /** Baked cold-emitter vertices below the deck identify the real authored well, never a merged mesh center. */
 private authoredCore(world:T.Group,width:number,height:number):ReactorStaging {
  const bounds=new T.Box3(),point=new T.Vector3();
  world.traverse(object=>{
   if(!(object instanceof T.Mesh)||Array.isArray(object.material)||object.material.name!=='ship-cold-practical')return;
   const vertices=object.geometry.getAttribute('position');if(!vertices)return;
   for(let i=0;i<vertices.count;i++){
    point.fromBufferAttribute(vertices,i);if(point.y>-.75)continue;
    point.applyMatrix4(object.matrixWorld);bounds.expandByPoint(point);
   }
  });
  if(bounds.isEmpty())return{coreX:width/2,coreY:3.2,coreZ:height/2,coreColor:0xffdfad,coreRadius:4.9};
  return{coreX:(bounds.min.x+bounds.max.x)/2,coreY:3.2,coreZ:(bounds.min.z+bounds.max.z)/2,coreColor:0xffdfad,coreRadius:Math.max(bounds.max.x-bounds.min.x,bounds.max.z-bounds.min.z)/2};
 }
 private applyMood(width:number,height:number){
  const mood=this.mood;const reactor=mood.environment==='reactor';this.key.castShadow=this.tier==='high'&&this.shadowQuality!=='off';this.directionalKey.visible=!reactor;this.coreKey.visible=reactor;this.lamp.setRoom(this.templateArchitecture?0:mood.environment==='cargo'?40:this.manualConsole?36:this.overloadFloor?48:24);this.ambient.color.setHex(mood.ambient.sky);this.ambient.groundColor.setHex(mood.ambient.ground);this.ambient.intensity=mood.ambient.intensity;
  this.lamp.light.intensity=mood.environment==='infested'?8:12;
  for(const [light,data] of [[this.key,mood.key],[this.fill,mood.fill],[this.rim,mood.rim]] as const){light.color.setHex(data.color);light.intensity=data.intensity*(data.irradianceScale??1);light.target.position.set(width/2,0,height/2);light.position.set(width/2+data.offset[0],data.offset[1],height/2+data.offset[2]);}
  if(!reactor){const offset=this.composition===roomComposition()?mood.key.offset:this.composition.keyOffset;this.key.position.set(width/2+offset[0],offset[1],height/2+offset[2]);this.key.intensity*=this.composition.keyGain;this.fill.intensity*=this.composition.fillGain;if(this.interiorPresentation)this.key.position.set(width/2-4,25,height/2-3);}
  if(reactor){
   this.coreKey.angle=this.bossArena?.58:this.manualConsole?Math.PI*.28:Math.PI*.4;this.coreKey.penumbra=.72;const shadowSize=this.shadowQuality==='low'?512:1024;this.coreKey.shadow.mapSize.set(shadowSize,shadowSize);
   const core=this.staging;this.coreKey.position.set(core?.coreX??width/2,core?.coreY??3.2,core?.coreZ??height/2);
   this.coreKey.target.position.set(width*.12,0,core?.coreZ??height/2);this.coreKey.intensity=mood.key.intensity*980*this.composition.keyGain;this.coreKey.distance=Math.max(30,Math.hypot(width,height)*1.1);this.fill.intensity*=this.composition.fillGain;
   if(this.manualConsole&&this.staging){this.coreKey.target.position.set(width*.28,0,this.staging.coreZ);}
   if(this.bossArena){this.coreKey.position.set(width/2,9,height/2+7);this.coreKey.target.position.set(width/2,1.2,height/2);this.coreKey.intensity=720;this.coreKey.color.setHex(0xffe6c6);this.fill.intensity=5.5;this.rim.color.setHex(0x9ecfe6);this.rim.intensity=.65;this.ambient.intensity=.18;}
  }
 }
}

/** Soft grounding survives the performance tier without another shadow render. */
export class ContactShadows {
 readonly mesh:T.InstancedMesh;
 private dummy=new T.Object3D();private count=0;
 constructor(){
  const geometry=new T.PlaneGeometry(2,2);geometry.rotateX(-Math.PI/2);
  const material=groundIndicatorMaterial('contact',new T.Color(.12,.15,.15));
  material.fragmentShader=material.fragmentShader.replace(')*.4;',')*.22;');
  this.mesh=new T.InstancedMesh(geometry,material,64);this.mesh.name='actor-contact-shadows';this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.mesh.frustumCulled=false;this.mesh.count=0;
 }
 begin(){this.count=0;}
 add(x:number,z:number,radius:number){if(this.count===64)return;this.dummy.position.set(x,.025,z);this.dummy.scale.set(radius*.98,1,radius*.82);this.dummy.updateMatrix();this.mesh.setMatrixAt(this.count++,this.dummy.matrix);}
 end(){this.mesh.count=this.count;this.mesh.instanceMatrix.needsUpdate=true;}
 dispose(){this.mesh.dispose();this.mesh.geometry.dispose();(this.mesh.material as T.Material).dispose();this.mesh.removeFromParent();}
}
