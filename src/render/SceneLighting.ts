import * as T from 'three';
import type {ShipEnvironment} from './ShipEnvironments';
import type {GraphicsTier} from './FrameBudget';
import {getEnvironmentMood,type EnvironmentMood} from './lighting/EnvironmentMoods';
import {LightPool} from './lighting/LightPool';
import {MarineLamp} from './lighting/MarineLamp';

type Fixture={x:number;y:number;z:number;color:number};
/** Stable room lights, motivated practicals and a bounded combat-light pool. */
export class SceneLighting {
 readonly root=new T.Group();
 readonly ambient=new T.HemisphereLight();
 readonly key=new T.DirectionalLight();
 readonly fill=new T.DirectionalLight();
 readonly rim=new T.DirectionalLight();
 readonly fixtures=Array.from({length:4},()=>new T.PointLight(0x9edcec,0,5.8,2));
 readonly blast=new T.PointLight(0xffc18a,0,7,2);
 readonly pool=new LightPool('high',9);
 readonly lamp=new MarineLamp();
 mood:EnvironmentMood=getEnvironmentMood();
 private blastLife=0;private time=0;private tier:GraphicsTier='high';private fixtureCount=0;private dynamicLights=true;private flashIntensity=1;private disposed=false;
 constructor(){
  this.key.castShadow=true;
  const shadow=this.key.shadow;shadow.mapSize.set(1024,1024);
  Object.assign(shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:.5,far:70});
  shadow.normalBias=.015;shadow.bias=-.0002;shadow.radius=2;
  this.root.name='scene-lighting';
  this.root.add(this.ambient,this.key,this.key.target,this.fill,this.fill.target,this.rim,this.rim.target,...this.fixtures,this.blast,this.pool.root,this.lamp.root);
  this.applyMood(0,0);
 }
 /** Settings changes may alter shader topology; updates and combat effects never do. */
 setQuality(tier:GraphicsTier,dynamicLights=true,atmosphere=true,flashIntensity=1){
  this.tier=tier;this.dynamicLights=dynamicLights;this.flashIntensity=Math.max(0,Math.min(1,flashIntensity));
  this.pool.setIntensityScale(this.flashIntensity);
  this.key.castShadow=tier==='high';this.pool.setQuality(tier,tier==='high'&&dynamicLights);
  this.blast.visible=dynamicLights;this.lamp.setQuality(tier==='high',atmosphere);
  if(!dynamicLights){this.blastLife=0;this.blast.intensity=0;}
  for(let i=0;i<this.fixtures.length;i++){this.fixtures[i].visible=tier==='high'||i<2;if(!this.fixtures[i].visible)this.fixtures[i].intensity=0;}
 }
 loadRoom(world:T.Group,width:number,height:number,environment?:ShipEnvironment){
  this.blastLife=0;this.blast.intensity=0;this.pool.reset();this.time=0;
  this.mood=getEnvironmentMood(environment);this.applyMood(width,height);
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
  const selected:Fixture[]=[];
  candidates.sort((a,b)=>Math.hypot(a.x-width/2,a.z-height/2)-Math.hypot(b.x-width/2,b.z-height/2));
  while(candidates.length&&selected.length<this.fixtures.length){
   if(selected.length)candidates.sort((a,b)=>Math.min(...selected.map(s=>Math.hypot(b.x-s.x,b.z-s.z)))-Math.min(...selected.map(s=>Math.hypot(a.x-s.x,a.z-s.z))));
   const next=candidates.shift()!;if(selected.every(s=>Math.hypot(next.x-s.x,next.z-s.z)>2))selected.push(next);
  }
  this.fixtureCount=selected.length;
  this.fixtures.forEach((light,i)=>{const fixture=selected[i];light.intensity=fixture&&light.visible?this.mood.practical.intensity:0;if(fixture){light.position.set(fixture.x,fixture.y,fixture.z);light.color.setHex(fixture.color).lerp(new T.Color(this.mood.practical.color),.32);light.distance=this.mood.practical.distance;}});
 }
 setPlayer(x:number,z:number,aimRadians:number){this.lamp.update(x,z,aimRadians);}
 explosion(x:number,z:number,radius:number){if(!this.dynamicLights)return;this.blast.position.set(x,.9,z);this.blast.distance=Math.min(7,Math.max(3,radius*1.5));this.blastLife=.18;this.blast.intensity=12*this.flashIntensity;}
 update(dt:number){
  const delta=Number.isFinite(dt)?Math.max(0,dt):0;this.time+=delta;this.pool.update(delta);
  this.blastLife=Math.max(0,this.blastLife-delta);this.blast.intensity=12*this.flashIntensity*(this.blastLife/.18)**2;
  const behavior=this.mood.practical.behavior;
  for(let i=0;i<this.fixtureCount;i++){
   const light=this.fixtures[i];if(!light.visible)continue;
   const phase=this.time+i*1.73;
   const animated=behavior==='alarm'?.8+.2*Math.sin(phase*3):behavior==='pulse'?.8+.2*Math.sin(phase*1.4):behavior==='reactor'?.84+.16*Math.sin(phase*2.1):behavior==='flicker'?.93+.045*Math.sin(phase*13)+.025*Math.sin(phase*29):1;
   light.intensity=this.mood.practical.intensity*(1+(animated-1)*this.flashIntensity);
  }
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.key.shadow.dispose();this.pool.dispose();this.lamp.dispose();this.root.removeFromParent();}
 private applyMood(width:number,height:number){
  const mood=this.mood;this.ambient.color.setHex(mood.ambient.sky);this.ambient.groundColor.setHex(mood.ambient.ground);this.ambient.intensity=mood.ambient.intensity;
  for(const [light,data] of [[this.key,mood.key],[this.fill,mood.fill],[this.rim,mood.rim]] as const){light.color.setHex(data.color);light.intensity=data.intensity;light.target.position.set(width/2,0,height/2);light.position.set(width/2+data.offset[0],data.offset[1],height/2+data.offset[2]);}
 }
}

/** Soft grounding survives the performance tier without another shadow render. */
export class ContactShadows {
 readonly mesh:T.InstancedMesh;
 private dummy=new T.Object3D();private count=0;
 constructor(){
  const geometry=new T.PlaneGeometry(2,2);geometry.rotateX(-Math.PI/2);
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{},
   vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}',
   fragmentShader:'varying vec2 vUv; void main(){float d=length(vUv*2.0-1.0);float a=(1.0-smoothstep(0.1,1.0,d))*0.24;gl_FragColor=vec4(0.025,0.035,0.045,a);}',
  });
  this.mesh=new T.InstancedMesh(geometry,material,64);this.mesh.name='actor-contact-shadows';this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.mesh.frustumCulled=false;this.mesh.count=0;
 }
 begin(){this.count=0;}
 add(x:number,z:number,radius:number){if(this.count===64)return;this.dummy.position.set(x,.025,z);this.dummy.scale.set(radius*1.3,1,radius);this.dummy.updateMatrix();this.mesh.setMatrixAt(this.count++,this.dummy.matrix);}
 end(){this.mesh.count=this.count;this.mesh.instanceMatrix.needsUpdate=true;}
 dispose(){this.mesh.geometry.dispose();(this.mesh.material as T.Material).dispose();this.mesh.removeFromParent();}
}
