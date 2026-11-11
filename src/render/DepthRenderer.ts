import {MaterialWarmup} from './MaterialWarmup';
import {ContextResources} from './ContextResources';
import {addRoomPracticals} from './lighting/RoomPracticals';
import {addInteriorPracticals} from './lighting/InteriorPracticals';
import {updateHotFixtureSurfaces} from './lighting/HotFixtureSurface';
import {PracticalPools} from './lighting/PracticalPools';
import {optimizeLocalLights} from './lighting/LocalLightShading';
import {roomFocus} from './roomFraming';
import {CameraRig} from './camera/CameraRig';
import {PostPipeline} from './post/PostPipeline';
import {Atmosphere} from './atmosphere/Atmosphere';
import {ShipBackdrop} from './atmosphere/ShipBackdrop';
import {ArenaStaging} from './vfx/ArenaStaging';
import {addExitSignal,updateExitSignal} from './world/ExitSignal';
import {TitlePresentation} from './world/TitlePresentation';
import {addDeckMarkings} from './world/DeckMarkings';
import {addWorldDressing,updateWorldDressing} from './world/WorldDressing';
import {PlayerBeacon} from './vfx/PlayerBeacon';
import {communalAtrium} from './CommunalAtrium';
import {attachCommunalGarden} from './CommunalGarden';
import {attachSealedBank} from './SealedChamberBank';
import {attachRecoveryKit} from './RecoveryKit';
import {attachReleasedBerth} from './ReleasedBerth';
import {SceneLighting,ContactShadows} from './SceneLighting';
import {authoredRoom} from './AuthoredRooms';
import {ActorPool} from './ActorPool';
import {PickupInstances} from './PickupInstances';
import {batch} from './meshParts';
import type {GraphicsTier} from './FrameBudget';
import {GRAPHICS_PRESETS,resolveGraphicsOptions,type GraphicsOptions} from './graphicsOptions';
import {EnvironmentMaterials} from './EnvironmentMaterials';
import {shipEnvironment,environmentObstacle,environmentArchitecture,appendEnvironment,type ShipEnvironment} from './ShipEnvironments';
import {serviceShaftLanding} from './ServiceShaftLanding';
import * as T from 'three';
import {EnemyHealthBars,type HealthBarEntry} from './EnemyHealthBars';
import {AttackEffects} from './AttackEffects';
// V2 ability routing: isolated from world presentation.
import {AbilityVisuals} from './abilities/AbilityVisuals';
import {AcidPoolMaterial} from './acidPool';
import {AfflictionBatches} from './afflictions';
import {WEAPON_APPEARANCE} from './weapons';
import {RoomReflectionCapture} from './lighting/RoomReflectionCapture';
import {getEnvironmentMood} from './lighting/EnvironmentMoods';
import {applyRoomMood} from './lighting/applyRoomMood';

import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {attachPassengerVault} from './PassengerVault';
import {attachResidentialGalleryEquipment} from './ResidentialGalleryEquipment';
import {MAT,box,ball,rod,marine,alien,nest,disposeModel,freezeCorpse,type ActorModel} from './models';
import {DeathRagdolls} from './DeathRagdolls';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import type {DepthGame,GameEffect} from '../DepthGame';
import type {RunNode} from '../game/roguelike/types';
const UNIT=32;
const PREPARATION_CANCELLED=Symbol('graphics-generation-replaced');
type Corpse={model:ActorModel;x:number;y:number;vx:number;vy:number;height:number;lift:number;spin:number;age:number;id:number};
export class DepthRenderer {
 readonly menuPresentation='cinematic' as const;
 readonly renderer:T.WebGLRenderer;readonly scene=new T.Scene();camera:T.OrthographicCamera|T.PerspectiveCamera=new T.PerspectiveCamera(28);
 private contextResources=new ContextResources();private afflictions=new AfflictionBatches(new T.TextureLoader());private healthBars=new EnemyHealthBars();private hudScene=new T.Scene();private world=new T.Group();private actors=new Map<number,ActorModel>();private nests=new Map<number,T.Group>();private queen:ActorModel|null=null;
 private interimAbilities=new AbilityVisuals(this.scene);
 private ragdolls=new DeathRagdolls();private staticDirty=false;private corpseIds=new Set<number>();
 private staticLoaded(owner:T.Group){return()=>{if(this.world!==owner)return;const newProfiles=this.materialWarmup?.register(owner)??0;this.contextResources?.track(owner);this.reflection?.invalidate();this.shadowsDirty=true;this.staticDirty=true;if(this.materialWarmup&&newProfiles)this.queueRoomWarmup();};}
 private actorPool=new ActorPool();private player=marine();private playerBeacon=new PlayerBeacon(this.player.root,this.hudScene);private corpses:Corpse[]=[];private effects:AttackEffects;
 private preparationTargets=new Set<T.WebGLRenderTarget>();private graphicsGeneration=0;private roomWarmPending=false;private roomWarmWork:Promise<void>=Promise.resolve();private forceRoomWarm=false;private warmAgain=false;private deferredRoom:{node:RunNode;environment?:ShipEnvironment}|null=null;
 private materialWarmup:MaterialWarmup;private surfaces:EnvironmentMaterials;private floorMaterial:T.MeshStandardMaterial;
 private practicalPools=new PracticalPools(this.scene);private arena=new ArenaStaging(this.scene);private backdrop=new ShipBackdrop(this.scene);private atmosphere=new Atmosphere(this.scene);private heatClock=0;private lighting=new SceneLighting();private contacts=new ContactShadows();private muzzle:T.PointLight;private muzzleLife=0;
 private pendingShots:GameEffect[]=[];private shotSocket=new T.Vector3();
 private reflection:RoomReflectionCapture;private roomWidth=0;private roomHeight=0;private roomEnvironment:ShipEnvironment='cryogenics';private recoveringGraphics=false;private loseGraphics=()=>{this.graphicsGeneration++;for(const target of this.preparationTargets)target.dispose();this.preparationTargets.clear();this.recoveringGraphics=true;this.contextResources.track(this.scene);this.contextResources.track(this.hudScene);this.contextResources.invalidate();this.reflection.invalidate();this.post.invalidate();this.lighting.invalidateShadows();};private restoreGraphics=()=>{this.shadowsDirty=true;this.recoveringGraphics=true;this.queueRoomWarmup();void this.roomWarmWork.finally(()=>{this.recoveringGraphics=false;}).catch(()=>{});};
 private focus=new T.Vector3(18,0,14);private raycaster=new T.Raycaster();private ground=new T.Plane(new T.Vector3(0,1,0),0);
 private post:PostPipeline;private tier:GraphicsTier='high';private shadowTime=0;private shadowsDirty=true;private pixelRatio=1;
 private options:GraphicsOptions=GRAPHICS_PRESETS.high;
 private cameraRig=new CameraRig();private viewHeight=13;private viewWidth=13;private desiredFocus=new T.Vector3();private screenPoint=new T.Vector3();private screenTarget=new T.Vector3();private bulletColor=new T.Color();private playerVelocity={x:0,y:0};private attachedLight={x:0,y:1,z:0,color:0xffffff,intensity:1,distance:3,duration:.1,priority:1};
 private canvasRect?:DOMRect;private projectedPlayer?:{left:number;top:number;right:number;bottom:number};
 private visiblePoint=new T.Vector3();private activePoolIds=new Set<number>();private frameFocus={x:0,z:0};private activeActorIds=new Set<number>();private activeNestIds=new Set<number>();private healthEntries:HealthBarEntry[]=Array.from({length:128},()=>({x:0,z:0,height:0,health:0,maxHealth:1,elite:false,armor:0,maxArmor:0}));private projectileLightIds=new WeakMap<object,number>();private nextProjectileLight=-1000;
 private motionChanged=()=>this.applyQuality();
 private motionQuery=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
 private disposed=false;private time=0;private recoil=0;private roomKey='';private temporaryMaterials:T.Material[]=[];
 private bulletMesh:T.InstancedMesh;private dummy=new T.Object3D();
 private pickupInstances=new PickupInstances();private exit:T.Group|null=null;
 private warning=new T.Group();private poolMeshes=new Map<number,T.Mesh<T.CircleGeometry,AcidPoolMaterial>>();private menuActors=new T.Group();private menuMarine=marine();private menuAlien=alien('brute',true);private lastMenu=false;
 private title=new TitlePresentation(this.scene);
 constructor(readonly canvas:HTMLCanvasElement){
  this.renderer=new T.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
  // Scene roots remain identity; only moving descendants compose local matrices.
  this.scene.matrixAutoUpdate=false;this.hudScene.matrixAutoUpdate=false;
  this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.AgXToneMapping;this.renderer.toneMappingExposure=1.22;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;this.renderer.info.autoReset=false;
  this.hudScene.add(this.healthBars.root);this.scene.add(this.afflictions.root);
  this.scene.background=new T.Color(0x081014);this.scene.fog=new T.FogExp2(0x102027,.014);
  this.reflection=new RoomReflectionCapture(this.renderer,this.scene);this.canvas.addEventListener('webglcontextlost',this.loseGraphics);this.canvas.addEventListener('webglcontextrestored',this.restoreGraphics);this.motionQuery?.addEventListener('change',this.motionChanged);
  this.scene.add(this.lighting.root,this.contacts.mesh);
  // Shared pickup/nest finishes can appear after a kill in a different room.
  // Match their future shaders to the retained generic material family before preparation.
  for(const material of Object.values(MAT))optimizeLocalLights(material);
  this.surfaces=new EnvironmentMaterials(this.renderer.capabilities.getMaxAnisotropy());this.floorMaterial=this.surfaces.floor;this.materialWarmup=new MaterialWarmup(this.surfaces);this.scene.add(this.materialWarmup.root);this.materialWarmup.register(this.interimAbilities.root);this.materialWarmup.register(this.title.root);
  this.scene.add(this.world,this.player.root,this.pickupInstances.root);this.materialWarmup.register(this.pickupInstances.root);
  this.muzzle=new T.PointLight(0xffc679,0,3,2);this.scene.add(this.muzzle);
  this.effects=new AttackEffects(this.scene,undefined,this.world);
  this.effects.setFeedback({flash:event=>this.lighting.pool.flash({x:event.position.x,y:event.position.y,z:event.position.z,color:event.color,intensity:event.intensity,distance:event.radius,duration:event.duration,priority:event.priority},true),shockwave:event=>this.post.distortion.shockwave(event.position.x,event.position.z,event.radius,event.strength*.012,event.duration)});


  this.bulletMesh=new T.InstancedMesh(new T.SphereGeometry(1,6,4),new T.MeshBasicMaterial({color:0xffffff}),320);this.bulletMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.bulletMesh.setColorAt(0,this.bulletColor);this.bulletMesh.frustumCulled=false;this.scene.add(this.bulletMesh);
  this.post=new PostPipeline(this.renderer,this.scene,this.camera);this.post.setOptions(this.options,this.tier);
  // V2: public pooled feedback services, constructed before shader preparation.
  this.interimAbilities.bind({lights:this.lighting.pool,distortion:this.post.distortion,camera:this.cameraRig});
  const ringMat=new T.MeshBasicMaterial({color:0xff7850,transparent:true,opacity:.9,depthWrite:false,side:T.DoubleSide});
  const outer=new T.Mesh(new T.RingGeometry(.965,1,64),ringMat);outer.rotation.x=-Math.PI/2;this.warning.add(outer);
  const disk=new T.Mesh(new T.CircleGeometry(.95,64),new T.MeshBasicMaterial({color:0xf86839,transparent:true,opacity:.12,depthWrite:false,side:T.DoubleSide}));disk.rotation.x=-Math.PI/2;this.warning.add(disk);this.scene.add(this.warning);this.warning.visible=false;
  this.menuActors.add(this.menuMarine.root,this.menuAlien.root);this.menuMarine.root.scale.setScalar(1.8);this.menuAlien.root.scale.multiplyScalar(.95);this.menuAlien.root.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial)m.color.multiplyScalar(.4);});this.scene.add(this.menuActors);
  this.contextResources.track(this.scene);this.contextResources.track(this.hudScene);this.resize();
 }
 get qualityTier(){return this.tier;}
 /** Current immutable settings; selecting a tier resets its overrides. */
 get graphicsOptions(){return this.options;}
 /** Apply presentation settings without changing deterministic game state. */
 setGraphicsOptions(partial:Partial<GraphicsOptions>){
  this.options=resolveGraphicsOptions(this.options??GRAPHICS_PRESETS.high,partial);this.applyQuality();
 }
 setQuality(value:'high'|'low'='high'){
  const wasLow=this.tier==='low';this.tier=value==='low'?'low':'high';this.options=GRAPHICS_PRESETS[this.tier];this.ragdolls?.setQuality(this.tier);while(this.corpses.length>(this.tier==='low'?6:12)){const c=this.corpses.shift()!;this.ragdolls.remove(c.id);this.actorPool.release(c.model);}this.applyQuality();if(wasLow&&this.tier==='high'&&this.materialWarmup)this.queueRoomWarmup();
 }
 private applyQuality(){this.renderer.shadowMap.enabled=this.tier!=='low'&&this.options.shadows!=='off';this.shadowsDirty=true;if(this.muzzle)this.muzzle.visible=this.options.dynamicLights;this.lighting?.setQuality(this.tier,this.options.dynamicLights,this.options.atmosphere,this.options.flashIntensity*(this.motionQuery?.matches?.5:1),this.options.shadows);this.post?.setOptions(this.motionQuery?.matches?{...this.options,distortion:false,lensEffects:false}:this.options,this.tier);this.effects?.setOptions({...this.options,tier:this.tier,reducedMotion:!!this.motionQuery?.matches});this.interimAbilities?.setOptions?.(this.options,this.tier,!!this.motionQuery?.matches);this.afflictions?.setOptions({...this.options,tier:this.tier,reducedMotion:!!this.motionQuery?.matches});this.atmosphere?.setOptions(this.options,this.tier,!!this.motionQuery?.matches);this.backdrop?.setQuality(this.tier);this.player?.setFlashIntensity?.(this.options.flashIntensity);for(const actor of this.actors?.values()??[])actor.setFlashIntensity?.(this.options.flashIntensity);this.queen?.setFlashIntensity?.(this.options.flashIntensity);for(const corpse of this.corpses??[])corpse.model.setFlashIntensity?.(this.options.flashIntensity);this.resize();}
 resize(){
  this.canvasRect=this.canvas.getBoundingClientRect();
  const w=window.innerWidth,h=window.innerHeight,post=this.tier==='high';this.pixelRatio=Math.min(devicePixelRatio||1,post?1.5:1)*this.options.resolutionScale;
  this.renderer.setPixelRatio(this.pixelRatio);this.renderer.setSize(w,h,false);this.post.setSize(w,h,Math.min(devicePixelRatio||1,post?1.5:1));
  const view=h>w?18:13;this.viewHeight=view;this.viewWidth=view*w/h;if(this.camera instanceof T.OrthographicCamera){this.camera.left=-this.viewWidth/2;this.camera.right=this.viewWidth/2;this.camera.top=view/2;this.camera.bottom=-view/2;}else this.camera.aspect=w/h;this.camera.near=.1;this.camera.far=160;this.camera.updateProjectionMatrix();
 }
 /** Switch projection for matched-framing art review; perspective is the shipping default. */
 setCameraProjection(projection:'orthographic'|'perspective'){
  if((projection==='perspective')===(this.camera instanceof T.PerspectiveCamera))return;
  this.camera=projection==='perspective'?new T.PerspectiveCamera(28):new T.OrthographicCamera();
  this.post.setCamera(this.camera);this.resize();this.cameraRig.apply(this.camera,this.lastMenu?1.23:1,this.viewHeight,this.options.screenShake);
 }
 /** Choose the filmic operator for matching-scene art review. */
 setToneMapping(operator:'aces'|'agx'){this.post.setToneMapping(operator);}
 /** Select the AO implementation for measured matching-scene review. */
 setAmbientOcclusionAlgorithm(algorithm:'contact'|'gtao'){this.post.setAmbientOcclusionAlgorithm(algorithm);}
 /** Renderer-only camera feedback for future combat ability integrations. */
 addTrauma(amount:number){this.cameraRig.addTrauma(amount);}
 kick(angle:number,amount:number){this.cameraRig.kick(angle,amount);}
 punch(amount:number,ms:number){this.cameraRig.punch(amount,ms);}
 /** Load shaders, textures, GPU buffers and common animation actions before combat. */
 async prepare(node:RunNode){
  if(this.materialWarmup){while(this.roomWarmPending)await this.roomWarmWork;this.forceRoomWarm=true;try{this.loadRoom(node);}finally{this.forceRoomWarm=false;}await this.roomWarmWork;while(this.roomWarmPending)await this.roomWarmWork;return;}
  this.loadRoom(node);
  // Settle every room owner before GPU work competes with image decoding.
  // Each optional owner already bounds its load and resolves on fallback.
  await Promise.all([this.surfaces.ready,this.passengerVault?.ready,this.residentialGalleryEquipment?.ready,this.communalGarden?.ready,this.sealedBank?.ready,this.releasedBerth?.ready,this.recoveryKit?.ready]);
  this.captureRoomReflections();await this.prepareScene();
 }
 /** Serialize room preparation, keeping input blocked until every actual material is ready. */
 private queueRoomWarmup(){
  if(this.roomWarmPending){this.warmAgain=true;return;}
  this.roomWarmPending=true;const world=this.world,generation=this.graphicsGeneration;
  const ready=[this.surfaces.ready,this.passengerVault?.ready,this.residentialGalleryEquipment?.ready,this.communalGarden?.ready,this.sealedBank?.ready,this.releasedBerth?.ready,this.recoveryKit?.ready];
  this.roomWarmWork=Promise.all(ready).then(async()=>{if(this.disposed||this.world!==world||generation!==this.graphicsGeneration||this.renderer.getContext().isContextLost())return;this.captureRoomReflections();await this.prepareScene();}).catch(error=>{if(error!==PREPARATION_CANCELLED&&generation===this.graphicsGeneration&&!this.renderer.getContext().isContextLost())throw error;}).finally(()=>{
   this.roomWarmPending=false;const next=this.deferredRoom;this.deferredRoom=null;
   if(next)this.loadRoom(next.node,next.environment);
   if(this.warmAgain){this.warmAgain=false;this.queueRoomWarmup();}
  });
  void this.roomWarmWork.catch(error=>console.error('Room graphics preparation failed',error));
 }
 /** Generation-aware polling avoids Three's uncancellable async callbacks on a lost context. */
 private async compilePrepared(scene:T.Scene,camera:T.Camera){
  const generation=this.graphicsGeneration;this.checkGraphicsGeneration(generation);this.renderer.compile(scene,camera);
  const programs=(this.renderer.info.programs??[]).slice() as unknown as {program?:unknown;isReady?:()=>boolean;getUniforms?:()=>unknown;getAttributes?:()=>unknown}[];
  for(;;){this.checkGraphicsGeneration(generation);if(programs.every(program=>('program' in program&&program.program===undefined)||!program.isReady||program.isReady())){for(const program of programs)if(!('program' in program)||program.program!==undefined){program.getUniforms?.();program.getAttributes?.();}return;}await new Promise<void>(resolve=>setTimeout(resolve,10));}
 }
 private checkGraphicsGeneration(generation:number){if(this.disposed||generation!==this.graphicsGeneration||this.renderer.getContext().isContextLost())throw PREPARATION_CANCELLED;}
 private freezeRoomTransforms(){this.world.updateMatrixWorld(true);this.world.traverse(object=>{object.matrixAutoUpdate=false;});}
 private async prepareScene(){
  const generation=this.graphicsGeneration;this.freezeRoomTransforms();
  const warm:T.Group=new T.Group(),models:ActorModel[]=[];this.scene.add(warm);
  const yieldTask=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
  const shadowEnabled=this.renderer.shadowMap.enabled,mapping=this.renderer.toneMapping,originalTarget=this.renderer.getRenderTarget(),warmTarget=new T.WebGLRenderTarget(64,64,{type:T.HalfFloatType}),restoreMaterials=this.materialWarmup.prepare(),restoreAtmosphere=this.atmosphere.prepare(),restoreBackdrop=this.backdrop.prepare(),restoreArena=this.arena.prepare();
  this.preparationTargets.add(warmTarget);
  try{
   for(const kind of ['crawler','brute','spitter','stalker','carrier','queen'])for(let i=0;i<(kind==='queen'?1:3);i++){
    const m=this.actorPool.take(kind,i===2);m.prepare?.();m.animate(0,1,0);m.root.position.copy(this.focus);warm.add(m.root);models.push(m);await yieldTask();
   }
   for(const id of ['pistol','rifle','shotgun','plasma','rocket'] as const){this.player.equip?.(id);this.player.animate(0,0,0);await yieldTask();}this.player.equip?.('shotgun');
   this.scene.traverse(object=>{if(object instanceof T.Mesh)for(const material of Array.isArray(object.material)?object.material:[object.material])if(material instanceof T.MeshStandardMaterial&&!material.userData.retainedRoomWarmup)optimizeLocalLights(material);});
   this.contextResources?.track(this.scene);this.contextResources?.track(this.hudScene);
   const textures=new Set<T.Texture>();this.scene.traverse(o=>{if(o instanceof T.Mesh)for(const material of Array.isArray(o.material)?o.material:[o.material])for(const value of Object.values(material))if(value instanceof T.Texture)textures.add(value);});
   for(const texture of textures){this.checkGraphicsGeneration(generation);this.renderer.initTexture(texture);await yieldTask();}
   this.camera.position.copy(this.focus).add(new T.Vector3(0,26,19));this.camera.lookAt(this.focus);this.scene.updateMatrixWorld(true);
   // Point counts change only among these prepared buckets. Warm the actual HDR
   // target/tone-mapping variants, with both shadow settings, before combat.
   this.lighting.setQuality('high',true,true,this.options.flashIntensity,'high');this.muzzle.visible=true;
   this.renderer.setRenderTarget(warmTarget);this.renderer.toneMapping=T.NoToneMapping;
   this.renderer.setViewport(0,0,64,64);this.renderer.setScissor(0,0,64,64);this.renderer.setScissorTest(true);
   for(const shadows of [true,false]){
    this.renderer.shadowMap.enabled=shadows;
    for(const count of this.lighting.pool.prewarmCounts){this.lighting.pool.setPrewarmCount(count);await this.compilePrepared(this.scene,this.camera);if(shadows){this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.scene,this.camera);}await yieldTask();}
   }
   // Dynamic-light toggles have a distinct fixed-light count as well.
   this.lighting.setQuality('high',false,true,this.options.flashIntensity,'high');this.muzzle.visible=false;
   for(const shadows of [true,false]){this.renderer.shadowMap.enabled=shadows;await this.compilePrepared(this.scene,this.camera);if(shadows){this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.scene,this.camera);}}
   this.lighting.setQuality('high',true,true,this.options.flashIntensity,'high');this.muzzle.visible=true;
   this.lighting.pool.setPrewarmCount(null);this.renderer.shadowMap.enabled=shadowEnabled;
   this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.scene,this.camera);
   // Low can opt into its two dedicated flashes without enabling the pool.
   this.renderer.setRenderTarget(null);this.renderer.toneMapping=T.AgXToneMapping;this.renderer.shadowMap.enabled=false;
   for(const dynamic of [false,true]){this.lighting.setQuality('low',dynamic,false,this.options.flashIntensity,'off');this.muzzle.visible=dynamic;await this.compilePrepared(this.scene,this.camera);}
   this.renderer.render(this.scene,this.camera);
   this.applyQuality();this.renderer.toneMapping=mapping;this.renderer.setScissorTest(false);
   // Applying a saved Low-shadow override retires the High warmup map.
   // The post warm frame must redraw that replacement before sampling its comparison texture.
   this.renderer.shadowMap.needsUpdate=true;
   await this.compilePrepared(this.hudScene,this.camera);await this.post.prepare((scene,camera)=>this.compilePrepared(scene,camera));
  }finally{this.lighting.pool.setPrewarmCount(null);this.applyQuality();this.preparationTargets.delete(warmTarget);warmTarget.dispose();restoreMaterials();restoreArena();restoreBackdrop();restoreAtmosphere();this.renderer.setRenderTarget(originalTarget);this.renderer.toneMapping=mapping;this.renderer.shadowMap.enabled=shadowEnabled;this.renderer.setScissorTest(false);this.resize();for(const m of models)this.actorPool.release(m);disposeModel(warm);this.shadowsDirty=true;}
 }
 pointer(clientX:number,clientY:number,targets:readonly {id:number;x:number;y:number;radius:number}[]=[]){
  const rect=this.canvas.getBoundingClientRect();
  this.raycaster.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2),this.camera);
  // Only a pointer over the torso corrects the floor projection. No cone magnetism.
  let nearest=Infinity,selected:{x:number;y:number}|null=null;
  for(const t of targets){const model=t.id===-1?this.queen:this.actors.get(t.id);if(!model)continue;
   const radius=t.radius/UNIT,height=model.height,center=new T.Vector3(t.x/UNIT,height*.5,t.y/UNIT);
   const scale=new T.Vector3(radius,Math.max(.15,height*.48),radius);
   const ray=this.raycaster.ray.clone();ray.origin.sub(center).divide(scale);ray.direction.divide(scale).normalize();
   const contact=ray.intersectSphere(new T.Sphere(new T.Vector3(),1),new T.Vector3());if(!contact)continue;
   const distance=contact.multiply(scale).add(center).distanceToSquared(this.raycaster.ray.origin);
   if(distance<nearest){nearest=distance;selected={x:t.x,y:t.y};}
  }
  if(selected)return selected;
  const result=new T.Vector3();return this.raycaster.ray.intersectPlane(this.ground,result)?{x:result.x*UNIT,y:result.z*UNIT}:null;
 }
 visible(x:number,y:number){const p=this.visiblePoint.set(x/UNIT,.6,y/UNIT).project(this.camera);return p.z>=-1&&p.z<=1&&Math.abs(p.x)<.9&&Math.abs(p.y)<.8;}
 playerScreenBounds(radius:number){
  const rect=this.canvasRect??this.canvas.getBoundingClientRect(),position=this.player.root.position,point=this.screenPoint??=new T.Vector3();
  const result=this.projectedPlayer??={left:0,top:0,right:0,bottom:0};
  result.left=result.top=Infinity;result.right=result.bottom=-Infinity;
  for(let ix=-1;ix<=1;ix+=2)for(let iz=-1;iz<=1;iz+=2)for(let iy=0;iy<2;iy++){
   point.set(position.x+ix*radius/UNIT,position.y+iy*this.player.height,position.z+iz*radius/UNIT).project(this.camera);
   const x=rect.left+(point.x+1)*rect.width/2,y=rect.top+(1-point.y)*rect.height/2;
   result.left=Math.min(result.left,x);result.right=Math.max(result.right,x);result.top=Math.min(result.top,y);result.bottom=Math.max(result.bottom,y);
  }
  return result;
 }
 private bakeWorld(){
  this.world.updateMatrixWorld(true);const buckets=new Map<T.Material,T.BufferGeometry[]>();
  for(const child of [...this.world.children])if(child instanceof T.Mesh&&child.material!==this.floorMaterial){
   const material=child.material;
   // Flattened environments retain fitted transforms in matrix, not position.
   const {x,y,z}=new T.Vector3().setFromMatrixPosition(child.matrix);
   if(material instanceof T.MeshStandardMaterial&&material.emissiveIntensity>=.5&&material.emissive.getHex()!==0&&y>=-.05){
    const fixtures=this.world.userData.lightFixtures??=[];
    if(fixtures.length<256)fixtures.push({x,y:Math.max(.32,y),z,color:material.emissive.getHex()});
   }
   const g=(child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone()).applyMatrix4(child.matrix);const mat=child.material as T.Material;const list=buckets.get(mat)??[];list.push(g);buckets.set(mat,list);if(child.geometry.userData.environmentUV)child.geometry.dispose();this.world.remove(child);
  }
  for(const [mat,list]of buckets){const merged=mergeGeometries(list);list.forEach(g=>g.dispose());if(merged){const mesh=new T.Mesh(merged,mat);mesh.userData.bakedEnvironment=true;mesh.castShadow=true;mesh.receiveShadow=true;this.world.add(mesh);}}
 }
 private passengerVault:ReturnType<typeof attachPassengerVault>|undefined;
 private communalGarden:ReturnType<typeof attachCommunalGarden>|undefined;
 private residentialGalleryEquipment:ReturnType<typeof attachResidentialGalleryEquipment>|undefined;
 private sealedBank:ReturnType<typeof attachSealedBank>|undefined;
 private recoveryKit:ReturnType<typeof attachRecoveryKit>|undefined;
 private releasedBerth:ReturnType<typeof attachReleasedBerth>|undefined;
 loadRoom(node:RunNode,environment:ShipEnvironment|undefined=shipEnvironment(node.templateId)??(node.templateId==='reactor-vault'?'reactor':undefined)){
  if(this.roomWarmPending){this.deferredRoom={node,environment};return;}
  const keyChanged=(this.roomEnvironment==='reactor')!==(environment==='reactor');
  this.communalGarden?.dispose();this.communalGarden=undefined;
  this.passengerVault?.dispose();this.passengerVault=undefined;
  this.residentialGalleryEquipment?.dispose();this.residentialGalleryEquipment=undefined;
  this.clearPools();
  this.sealedBank?.dispose();this.sealedBank=undefined;
  this.recoveryKit?.dispose();this.recoveryKit=undefined;
  this.releasedBerth?.dispose();this.releasedBerth=undefined;
  this.reflection?.invalidate();this.roomEnvironment=environment??'cryogenics';this.roomKey=node.id;this.shadowsDirty=true;disposeModel(this.world);this.temporaryMaterials.forEach(m=>m.dispose());this.temporaryMaterials=[];this.world=new T.Group();this.scene.add(this.world);this.effects.setWorld(this.world);
  for(const m of this.actors.values())this.actorPool.release(m);this.actors.clear();for(const n of this.nests.values())disposeModel(n);this.nests.clear();if(this.queen)this.actorPool.release(this.queen);this.queen=null;
  this.ragdolls?.dispose();for(const c of this.corpses)this.actorPool.release(c.model);this.corpses=[];this.pickupInstances?.clear();this.effects.clear();this.interimAbilities.clear();this.afflictions.clear();this.pendingShots=[];this.projectileLightIds=new WeakMap();this.nextProjectileLight=-1000;this.muzzleLife=0;this.recoil=0;
  const t=ROOM_TEMPLATES[node.templateId],w=t.width/UNIT,h=t.height/UNIT;this.roomWidth=w;this.roomHeight=h;
  const atrium=node.templateId==='communal-atrium';
  this.corpseIds?.clear();this.staticDirty=false;const staticLoaded=this.staticLoaded(this.world);
  this.muzzle.intensity=0;this.contacts.begin();this.contacts.end();
  const bespoke=node.templateId==='service-shaft-landing'?serviceShaftLanding(t):authoredRoom(node.templateId,t);
  const act=Math.min(2,Math.floor(node.depth/4));this.surfaces.theme(act);if(environment)this.surfaces.shipTheme(environment);
  // Room-local habitation finish; theme() resets it on every subsequent room.
  if(node.templateId==='residential-gallery'){this.surfaces.floor.color.setHex(0x747976);this.surfaces.wall.color.setHex(0x788687);}
  if(atrium){this.surfaces.floor.color.setHex(0x77766c);this.surfaces.wall.color.setHex(0x777a6e);this.surfaces.cover.color.setHex(0x64695e);}
  if(bespoke){if(node.templateId==='service-shaft-landing'){appendEnvironment(this.world,bespoke);this.bakeWorld();}else this.world.add(bespoke);if(node.templateId==='passenger-vault')this.passengerVault=attachPassengerVault(bespoke,staticLoaded);if(node.templateId==='awakening-bay'){this.sealedBank=attachSealedBank(bespoke,staticLoaded);this.releasedBerth=attachReleasedBerth(bespoke,staticLoaded);this.recoveryKit=attachRecoveryKit(bespoke,staticLoaded);}}else{
  // Atrium's straight physical enclosure follows its shared boundary; the
  // template dimensions below remain the unchanged camera/lighting envelope.
  const shellH=atrium?Math.max(...t.boundary!.map(p=>p.y))/UNIT:h;
  if(atrium){
   // Physical polygon only. w/h still own the shipping camera and lighting.
   const shape=new T.Shape(t.boundary!.map(p=>new T.Vector2(p.x/UNIT,-p.y/UNIT)));
   const slab=(bottom:number,depth:number,material:T.Material)=>{
    const geometry=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1,curveSegments:1});
    geometry.rotateX(-Math.PI/2);geometry.translate(0,bottom,0);
    // Extrusion charts are not six box faces. Author physical per-triangle UVs
    // without cloning the newly allocated slab; retire the underside after bake.
    geometry.userData.environmentUV=true;
    const positions=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
    for(let i=0;i<positions.count;i+=3){
     const points=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(positions,i+k));
     const normal=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize();
     const tangent=new T.Vector3(normal.z,0,-normal.x).normalize();
     for(let k=0;k<3;k++){const v=points[k];uv.setXY(i+k,(Math.abs(normal.y)>.5?v.x:v.dot(tangent))/3.2,(Math.abs(normal.y)>.5?v.z:v.y)/3.2);}
    }
    uv.needsUpdate=true;
    const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;this.world.add(mesh);return mesh;
   };
   slab(-.34,.32,this.floorMaterial);slab(-.82,.5,MAT.black);
   // Room4 utility header rests on the retained north bulkhead. Its short
   // cantilevers retain the frozen emitter origins without adding floor area.
   box(this.world,w/2,2.45,-.10,w-.8,.65,.20,MAT.dark,0);
   // Tie the existing pipe clamps back into that header, not empty space.
   for(let x=3;x<w;x+=6)box(this.world,x,2.65,.29,.12,.28,.78,MAT.dark,0);

   // Rear support/ceramic panels remain owned by communalAtrium. Other edges
   // keep wall/cover/edge roles, with their interior face on the boundary.
   for(let i=1;i<t.boundary!.length;i++){
    const p=t.boundary![i],q=t.boundary![(i+1)%t.boundary!.length],dx=(q.x-p.x)/UNIT,dz=(q.y-p.y)/UNIT,length=Math.hypot(dx,dz);
    const height=dx<0&&dz>=0?.65:1.1;
    const g=new T.Group();g.position.set((p.x+q.x)/2/UNIT,0,(p.y+q.y)/2/UNIT);g.rotation.y=-Math.atan2(dz,dx);
    this.surfaces.uv(box(g,0,height/2,-.28,length,height,.32,this.surfaces.wall,0),2);
    box(g,0,height/2,-.06,length,height,.12,this.surfaces.cover,0);
    box(g,0,height+.015,-.22,length,.08,.44,MAT.edge,0);
    g.updateMatrix();for(const child of [...g.children]){child.applyMatrix4(g.matrix);this.world.add(child);}
   }
  }else{
  const floor=box(this.world,w/2,-.18,shellH/2,w,.32,shellH,this.floorMaterial,0);floor.receiveShadow=true;this.surfaces.uv(floor,3.2);
  box(this.world,w/2,-.57,shellH/2,w+.6,.5,shellH+.6,MAT.black);
  // Low foreground parapets and tall rear bulkheads keep combat readable.
  for(let x=1;x<w;x+=2){if(!environment)this.wallPanel(x,0,2.6,2,0);this.wallPanel(x,shellH,.65,2,0);}
  for(let z=1;z<shellH;z+=2){this.wallPanel(0,z,1.1,2,Math.PI/2);this.wallPanel(w,z,1.1,2,Math.PI/2);}
  }
  for(let x=2;x<w-1;x+=5){
   // Keep the existing rear emitters and their light-fixture origins unchanged.
   box(this.world,x,2.2,.21,1.05,.075,.09,MAT.cyan);
   if(!atrium){box(this.world,x,.07,1,.9,.02,.06,MAT.amber,.01);box(this.world,x,.075,h-1,.9,.02,.06,MAT.amber,.01);}
  }
  // Nested ownership prevents appendEnvironment/bakeWorld from flattening fallback.
  const residentialFallback=node.templateId==='residential-gallery'?new T.Group():undefined;
  if(residentialFallback){residentialFallback.name='residential-gallery-equipment-fallback';this.world.add(residentialFallback);}
  if(atrium)this.world.add(communalAtrium(t));
  for(const [obstacleIndex,r] of (atrium?[]:t.obstacles).entries()){
   const x=(r.x+r.width/2)/UNIT,z=(r.y+r.height/2)/UNIT,rw=r.width/UNIT,rh=r.height/UNIT;
   if(residentialFallback){residentialFallback.add(environmentObstacle('habitation',{x:r.x/UNIT,y:r.y/UNIT,width:rw,height:rh},obstacleIndex,node.templateId));continue;}
   if(environment){appendEnvironment(this.world,environmentObstacle(environment,{x:r.x/UNIT,y:r.y/UNIT,width:rw,height:rh},obstacleIndex,node.templateId));continue;}
   const tall=act===1;const height=tall?1.45:1.05;
   this.surfaces.uv(box(this.world,x,height/2,z,rw,height,rh,this.surfaces.cover,.055),2);this.surfaces.uv(box(this.world,x,height-.08,z,rw-.07,.16,rh-.07,this.surfaces.cover),2);
   for(let a=-rw/2+.25;a<rw/2;a+=.8){box(this.world,x+a,height+.02,z,.045,.02,rh-.25,MAT.edge,.01);}
   box(this.world,x,height+.06,z,rw-.35,.08,.1,MAT.trim,.015);
   for(const side of [-1,1])box(this.world,x+side*(rw/2-.11),height*.5,z,.12,height*.83,rh-.16,MAT.edge,.02);
   if(act===2){
    for(let dz=-rh/2+.4;dz<rh/2-.2;dz+=1.2){rod(this.world,new T.Vector3(x-rw*.3,height+.10,z+dz),new T.Vector3(x+rw*.3,height+.10,z+dz),.13,.13,MAT.copper);ball(this.world,x,height+.20,z+dz,.24,.22,.22,MAT.shellDark);}
   }
   if(tall){
    for(let dz=-rh/2+.7;dz<rh/2-.2;dz+=1.3){
     rod(this.world,new T.Vector3(x,.3,z+dz),new T.Vector3(x,1.95,z+dz),.38,.38,MAT.shellDark);
     box(this.world,x,1.7,z+dz,.68,.13,.68,node.templateId==='specimen-bay'?MAT.acid:MAT.cyan);
    }
   }else{
    for(let dz=-rh/2+.6;dz<rh/2-.1;dz+=1.1){box(this.world,x,height+.19,z+dz,Math.max(.3,rw-.5),.25,.8,MAT.dark);box(this.world,x-.22,height+.34,z+dz,.28,.02,.4,MAT.cyan,.01);}
   }
  }
  for(let z=2;!atrium&&z<h-1;z+=3.2)box(this.world,w/2,.001,z,w-1,.012,.022,MAT.black,0);
  for(const x of [1.35,w-1.35])for(let z=2;!atrium&&z<h-2;z+=1.2)box(this.world,x,.012,z,.075,.015,.6,act===1?MAT.cyan:MAT.trim,0);
  // Overhead utility pipes along the back edge, independently lit panels and vents.
  for(const z of [.42,.72]){rod(this.world,new T.Vector3(.4,2.65,z),new T.Vector3(w-.4,2.65,z),.09,.09,MAT.edge);}
  for(let x=3;x<w;x+=6){box(this.world,x,2.65,.58,.12,.28,.8,MAT.dark);}
  for(const b of t.breaches){const x=b.x/UNIT,z=b.y/UNIT;box(this.world,x,.04,z,1.25,.06,1.1,MAT.black);for(let i=-4;i<=4;i++)box(this.world,x+i*.12,.085,z,.05,.04,.9,MAT.edge,.01);}
  if(environment&&!atrium)environmentArchitecture(this.world,environment,w,h,node.templateId);
  if(node.templateId==='reactor-vault'){const hot=MAT.cyan.clone();hot.name='ship-cold-practical';hot.userData.actorMaterial=true;this.world.traverse(object=>{if(object instanceof T.Mesh&&object.material===MAT.cyan)object.material=hot;});}
  this.bakeWorld();
  }
  if(node.templateId==='residential-gallery')this.residentialGalleryEquipment=attachResidentialGalleryEquipment(this.world,staticLoaded);
  if(atrium)this.communalGarden=attachCommunalGarden(this.world,t,staticLoaded);
  this.exit=new T.Group();this.exit.position.set(t.exit.x/UNIT,0,t.exit.y/UNIT);this.world.add(this.exit);
  for(const side of [-1,1]){box(this.exit,0,.7,side*.7,.12,1.4,.18,MAT.steel);box(this.exit,.08,.7,side*.7,.04,1.05,.05,MAT.cyan,.01);}
  box(this.exit,0,1.5,0,.2,.2,1.6,MAT.dark);box(this.exit,0,.035,0,1.7,.02,1.55,MAT.dark);
  // Rigid exit parts share finishes and transforms; retain three merged draws.
  batch(this.exit,true);
  // Flat markings and obstacle-supported dressing are registered before room preparation.
  addExitSignal(this.exit);addDeckMarkings(this.world,t,this.roomEnvironment,node.templateId);addWorldDressing(this.world,t,this.roomEnvironment,node.templateId,this.roomSeed(node.id));
  const initial=roomFocus(t.spawn.x/UNIT,t.spawn.y/UNIT,w,h,this.camera instanceof T.OrthographicCamera?this.camera.right-this.camera.left:this.viewWidth,this.camera instanceof T.OrthographicCamera?this.camera.top-this.camera.bottom:this.viewHeight,node.templateId);
  this.focus.set(initial.x,0,initial.z);this.cameraRig?.reset(initial.x,initial.z);this.world.userData.lightingBoundary=t.boundary?.map(p=>({x:p.x/UNIT,y:p.y/UNIT}));if((!bespoke&&node.templateId!=='armory')||this.roomEnvironment==='containment')addRoomPracticals(this.world,w,h,this.roomEnvironment,this.roomEnvironment==='reactor'?undefined:this.world.userData.lightingBoundary);addInteriorPracticals(this.world,t,this.roomEnvironment,node.templateId==='residential-gallery');this.lighting.loadRoom(this.world,w,h,environment,node.templateId);this.floorMaterial.userData.roomBaseColor=(this.floorMaterial.userData.roomBaseColor??new T.Color()).copy(this.floorMaterial.color);applyRoomMood(this.world,environment,node.templateId);
  const mood=getEnvironmentMood(environment);this.scene.fog=new T.FogExp2(mood.fog.color,mood.fog.density*.25);this.scene.background=new T.Color(mood.fog.color).multiplyScalar(.24);this.scene.environmentIntensity=mood.reflectionIntensity;this.post?.setMood(mood);this.atmosphere?.loadRoom(environment,w,h,this.lighting.fixtures);this.backdrop?.loadRoom(this.world,w,h,environment);this.arena?.loadRoom(node.templateId,w,h);this.post?.distortion.clear();this.heatClock=0;
  const newProfiles=this.materialWarmup?.register(this.world)??0;this.contextResources?.track(this.world);this.ragdolls?.setRoom(t,this.world);this.staticDirty=false;if(this.materialWarmup&&(newProfiles||this.forceRoomWarm||keyChanged))this.queueRoomWarmup();
 }
 private roomSeed(id:string){let seed=2166136261;for(let i=0;i<id.length;i++)seed=Math.imul(seed^id.charCodeAt(i),16777619);return seed>>>0;}
 private wallPanel(x:number,z:number,height:number,length:number,rotation:number){
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotation;
  this.surfaces.uv(box(g,0,height/2,0,length,height,.32,this.surfaces.wall),2);box(g,0,height/2,.19,length-.17,height-.15,.12,this.surfaces.cover);box(g,0,height+.015,0,length,.08,.48,MAT.edge);
  for(const side of [-1,1])box(g,side*(length/2-.1),height/2,.22,.11,height,.12,MAT.edge,.015);
  g.updateMatrix();for(const child of [...g.children]){child.applyMatrix4(g.matrix);this.world.add(child);}
 }
 effect(effect:GameEffect){
  if(effect.type==='ability'){if(effect.ability){this.interimAbilities.event(effect.ability,effect.x,effect.y);}return;}
  const x=effect.x/UNIT,z=effect.y/UNIT;
  if(effect.type==='hurt'){this.cameraRig?.addTrauma(.34);this.cameraRig?.punch(.015,180);this.player?.hit?.(.65);return;}if(effect.type==='sync-corpse')return;
  if(effect.type==='explosion'||(effect.type==='boon'&&(effect.boon==='blast'||(effect.boon==='overload'&&effect.radius!==undefined)))){this.lighting.explosion(x,z,(effect.radius??48)/UNIT);this.cameraRig?.addTrauma(.32);this.cameraRig?.punch(.035,240);}
  if(effect.type==='shot'){
   this.recoil=1;this.cameraRig?.kick(effect.angle??0,effect.weapon==='shotgun'?.08:effect.weapon==='rocket'?.12:.025);if(this.pendingShots.length<4)this.pendingShots.push(effect);return;
  }
  if(effect.type==='enemy-attack'){if(effect.id===-1)this.queen?.attack?.();else this.actors.get(effect.id!)?.attack?.();}
  if((effect.contact==='damage'||effect.contact==='armor')&&effect.targetId!==undefined){if(effect.targetId===-1)this.queen?.hit?.();else this.actors.get(effect.targetId)?.hit?.();}
  if(effect.type==='corpse'){
   if(effect.id===undefined)return;
   this.corpseIds??=new Set();if(this.corpseIds.has(effect.id))return;this.corpseIds.add(effect.id);
   let existing=this.actors.get(effect.id!);if(!existing&&effect.family){existing=this.actorPool.take(effect.family,effect.elite);existing.root.position.set(x,0,z);this.scene.add(existing.root);}if(existing){existing.root.position.set(x,0,z);freezeCorpse(existing);this.ragdolls.add(effect.id!,existing,effect.family??existing.root.name.replace('alien-',''),{x:(effect.vx??0)/UNIT,z:(effect.vy??0)/UNIT});this.actors.delete(effect.id!);this.corpses.push({model:existing,id:effect.id!,x,y:z,vx:(effect.vx??0)/UNIT,vy:(effect.vy??0)/UNIT,height:.2,lift:3,spin:2.4,age:0});if(this.corpses.length>(this.tier==='low'?6:12)){const oldest=this.corpses.shift()!;this.ragdolls.remove(oldest.id);this.actorPool.release(oldest.model);}}
  }
  this.effects.event(effect);
 }
 syncCorpse(id:number,x:number,y:number){const corpse=this.corpses.find(c=>c.id===id);if(corpse){corpse.x=x/UNIT;corpse.y=y/UNIT;corpse.vx=corpse.vy=0;if(this.ragdolls.has(id))this.ragdolls.sync(id,x/UNIT,y/UNIT);else{corpse.model.root.position.x=x/UNIT;corpse.model.root.position.z=y/UNIT;}}}
 get roomLoading(){return this.roomWarmPending||this.recoveringGraphics||this.communalGarden?.state==='loading'||this.residentialGalleryEquipment?.state==='loading'||this.passengerVault?.state==='loading'||this.recoveryKit?.state==='loading'||this.sealedBank?.state==='loading'||this.releasedBerth?.state==='loading';}
 render(game:DepthGame,delta:number,menu=false){
  if(this.roomKey!==game.node.id)this.loadRoom(game.node);
  // ImageBitmap completion shares browser/GPU scheduling with WebGL. Do not
  // queue expensive fallback frames ahead of the room's bounded optional decode.
  // Main freezes gameplay/input until a settled room frame has rendered.
  // Both owners retain their independent 8-second fallback deadlines.
  if(this.roomLoading)return;this.captureRoomReflections();
  if(game.status!=='playing'){for(const model of this.actors.values())model.hit?.(0);this.queen?.hit?.(0);}
  const dt=game.status==='paused'||game.status==='reward'||game.status==='route'?0:Math.min(delta,.05);this.time+=dt;const p=game.player;
  const bounds=game.geometry.bounds;
  const lead=this.motionQuery?.matches||menu?0:.6,bossFrame=game.boss.snapshot,bossWeight=!menu&&bossFrame.active&&!bossFrame.defeated?.62:0,baseZoom=menu?1.23:bossWeight?.78:1;
  const targetX=p.x/UNIT*(1-bossWeight)+bossFrame.x/UNIT*bossWeight+Math.cos(p.angle)*lead,targetZ=p.y/UNIT*(1-bossWeight)+bossFrame.y/UNIT*bossWeight+Math.sin(p.angle)*lead;
  const framed=roomFocus(targetX,targetZ,bounds.width/UNIT,bounds.height/UNIT,this.viewWidth/baseZoom,this.viewHeight/baseZoom,game.node.templateId,this.frameFocus);
  this.desiredFocus.set(framed.x,0,framed.z);if(menu){this.desiredFocus.set(22,0,14);if(!this.lastMenu)this.cameraRig.reset(22,14);}
  this.cameraRig.update(dt,this.desiredFocus.x,this.desiredFocus.z,this.options.screenShake,!!this.motionQuery?.matches);this.cameraRig.apply(this.camera,baseZoom,this.viewHeight,this.options.screenShake);this.focus.copy(this.cameraRig.focus);
  if(menu)this.title?.apply(this.camera,this.time,!!this.motionQuery?.matches);
  if(this.title)this.title.root.visible=menu;this.world.visible=!menu;if(this.backdrop)this.backdrop.root.visible=!menu;
  if(!menu)this.protectPlayerFraming(p.x/UNIT,p.y/UNIT,p.radius/UNIT);
  if(bossWeight)this.protectBossFraming(p.x/UNIT,p.y/UNIT,p.radius/UNIT,bossFrame.x/UNIT,bossFrame.y/UNIT);
  // The shadow projection remains anchored to the room, avoiding subpixel shimmer.
  this.player.root.position.set(p.x/UNIT,0,p.y/UNIT);this.player.root.visible=!menu;this.player.root.rotation.z=game.combat.snapshot.dead?1.4:0;
  const combat=game.combat.snapshot;this.player.equip?.(combat.weaponId);
  this.player.setRig?.(game.abilities?.snapshot.rig??'breacher');this.menuMarine?.setRig?.(game.abilities?.snapshot.rig??'breacher');
  this.playerVelocity.x=p.vx;this.playerVelocity.y=p.vy;this.player.animate(this.time,p.moving?1:0,p.angle,this.recoil,combat.reloading?Math.max(.001,1-combat.reloadRemainingMs/combat.reloadDurationMs):0,this.playerVelocity);this.recoil=Math.max(0,this.recoil-dt*14);
  this.lighting.setMenu?.(menu);if(this.lighting.setPlayer(menu?23:p.x/UNIT,menu?13:p.y/UNIT,menu?.42:p.angle,this.camera))this.atmosphere?.syncFixtures(this.lighting.fixtures);
  const active=this.activeActorIds;active.clear();let crowding=0;const enemies=game.enemies.snapshot.enemies;
  for(const e of enemies){if(Math.hypot(e.x-p.x,e.y-p.y)<80)crowding+=.25;active.add(e.id);let model=this.actors.get(e.id);if(!model){model=this.actorPool.take(e.type,e.elite);model.setFlashIntensity?.(this.options.flashIntensity);this.shadowsDirty=true;this.actors.set(e.id,model);this.scene.add(model.root);this.contextResources?.track(model.root);}model.root.position.set(e.x/UNIT,0,e.y/UNIT);const status=game.boonStatuses(e.id);model.setAffliction?.(status);model.root.userData.visualStatus=status;model.setThreat?.(e.windupMs,e.pendingAttack,e.champion,e.alpha);model.animate(this.time+e.id,Math.hypot(e.velocityX,e.velocityY)>2?1:.12,Math.atan2((e.type==='spitter'?game.player.y:e.targetY)-e.y,(e.type==='spitter'?game.player.x:e.targetX)-e.x));}
  for(const [id,model]of this.actors)if(!active.has(id)){this.actorPool.release(model);this.actors.delete(id);this.shadowsDirty=true;}
  let healthCount=0;for(const e of enemies){if(healthCount===128)break;const bar=this.healthEntries[healthCount++];bar.x=e.x/UNIT;bar.z=e.y/UNIT;bar.height=this.actors.get(e.id)?.height??1;bar.health=e.health;bar.maxHealth=e.maxHealth;bar.elite=e.elite||!!e.champion;bar.armor=e.armor;bar.status=this.actors.get(e.id)?.root.userData.visualStatus;}for(const n of game.boss.snapshot.nests){if(healthCount===128)break;const bar=this.healthEntries[healthCount++];bar.x=n.x/UNIT;bar.z=n.y/UNIT;bar.height=1.35;bar.health=n.health;bar.maxHealth=n.maxHealth;bar.elite=false;bar.armor=0;bar.status=undefined;}for(let i=healthCount;i<128;i++)this.healthEntries[i].health=0;
  this.healthBars.update(this.healthEntries,this.camera,this.canvas.clientHeight,menu);
  this.menuActors.visible=menu;
  if(menu){this.menuMarine.root.position.set(23,0,13);this.menuAlien.root.position.set(27.2,0,10);this.menuMarine.animate(this.time,0,.42);this.menuAlien.animate(this.time,.12,Math.PI+.5);}
  this.lastMenu=menu;
  const q=game.boss.snapshot;this.lighting.setBossState?.(q.x/UNIT,q.y/UNIT,q.vulnerable,q.defeated);
  this.warning.visible=!!q.pendingTelegraph&&!menu;
  if(q.pendingTelegraph){const t=q.pendingTelegraph;this.warning.position.set(t.targetX/UNIT,.045,t.targetY/UNIT);this.warning.scale.setScalar(t.radius/UNIT);const material=(this.warning.children[0] as T.Mesh).material as T.MeshBasicMaterial;material.opacity=.8;}
  this.syncPools(game.pools);

  if(q.active&&!this.queen){this.queen=this.actorPool.take('queen');this.queen.setFlashIntensity?.(this.options.flashIntensity);this.scene.add(this.queen.root);this.contextResources?.track(this.queen.root);}
  if(this.queen){this.queen.setExposed?.(q.vulnerable);this.queen.setAffliction?.(q.defeated?{chilled:false,burning:false,poisoned:false,frozen:false}:game.boonStatuses(-1));this.queen.root.position.set(q.x/UNIT,0,q.y/UNIT);this.queen.animate(this.time,.4,q.rotation);if(q.defeated){this.queen.root.rotation.z=1.25;this.queen.root.position.y=-.35;}}
  const nestIds=this.activeNestIds;nestIds.clear();for(const n of q.nests){nestIds.add(n.id);let model=this.nests.get(n.id);if(!model){model=nest();this.nests.set(n.id,model);this.scene.add(model);this.contextResources?.track(model);}model.position.set(n.x/UNIT,0,n.y/UNIT);model.scale.y=1+Math.sin(this.time*3+n.id)*.035;}
  for(const[id,model]of this.nests)if(!nestIds.has(id)){disposeModel(model);this.nests.delete(id);}
  if(this.staticDirty){this.ragdolls.refreshStatic(this.world);this.staticDirty=false;}
  this.ragdolls.update(dt);
  for(const c of this.corpses){if(this.ragdolls.has(c.id))c.age+=dt;c.model.dissolve?.(Math.max(0,(c.age-18)/2));if(this.ragdolls.has(c.id)){const position=this.ragdolls.position(c.id)!;c.x=position.x;c.y=position.z;continue;}if(dt<=0)continue;if(c.age>2&&Math.abs(c.vx)+Math.abs(c.vy)<.02&&c.height<=.08){c.age+=dt;continue;}c.age+=dt;const moved=game.moveCorpse({x:c.x*UNIT,y:c.y*UNIT,radius:14},c.vx*dt*UNIT,c.vy*dt*UNIT);c.x=moved.x/UNIT;c.y=moved.y/UNIT;if(moved.blocked){c.vx*=-.22;c.vy*=-.22;}c.vx*=Math.exp(-3.8*dt);c.vy*=Math.exp(-3.8*dt);c.lift-=9.8*dt;c.height=Math.max(.08,c.height+c.lift*dt);if(c.height<=.08)c.lift=0;
   c.model.root.position.set(c.x,c.height,c.y);c.model.body.rotation.z=Math.min(Math.PI*.78,c.age*5);c.model.root.rotation.y+=c.spin*dt*Math.exp(-c.age*3);
  }

  updateHotFixtureSurfaces(this.motionQuery?.matches?0:this.time);this.lighting.update(dt);this.practicalPools?.update(this.lighting.fixtures,this.tier==='high');
  this.contacts.begin();
  if(menu){this.contacts.add(23,13,.75);this.contacts.add(28,15,1.1);}else{
   this.contacts.add(p.x/UNIT,p.y/UNIT,.45);
   if(this.queen)this.contacts.add(q.x/UNIT,q.y/UNIT,1.3);
   for(const n of q.nests)this.contacts.add(n.x/UNIT,n.y/UNIT,.7);
   for(const e of enemies)this.contacts.add(e.x/UNIT,e.y/UNIT,e.radius/UNIT);
   for(const c of this.corpses)this.contacts.add(c.x,c.y,.45);
  }
  this.contacts.end();
  this.atmosphere.update(dt,this.camera);this.backdrop?.update(dt,this.focus);this.arena?.update(dt,this.options.flashIntensity,!!this.motionQuery?.matches);updateWorldDressing(this.world,this.time,!!this.motionQuery?.matches);updateExitSignal(this.exit,this.time,game.status==='reward'||game.status==='route',!!this.motionQuery?.matches);if(this.atmosphere?.root)this.atmosphere.root.visible=!menu&&this.tier==='high'&&this.options.atmosphere;
  this.heatClock+=dt;if(this.heatClock>1.5&&this.tier==='high'&&this.options.atmosphere&&this.options.distortion&&!this.motionQuery?.matches){this.heatClock=0;if(this.roomEnvironment==='engineering'||this.roomEnvironment==='reactor'||this.roomEnvironment==='cryogenics'){const fixture=this.lighting.fixtures[0];this.post.distortion.heat(fixture.position.x,fixture.position.z,3,this.roomEnvironment==='cryogenics'?-.0006:.0012,2.5);}}
  // Age the shared pool before refreshing every continuously attached source.
  if(this.tier==='high'&&this.options.dynamicLights)for(const e of enemies){const status=this.actors.get(e.id)?.root.userData.visualStatus;if(status&&(status.burning||status.frozen||status.poisoned)){const light=this.attachedLight;light.x=e.x/UNIT;light.z=e.y/UNIT;light.color=status.burning?0xff7a2e:status.poisoned?0x9dff5a:0x7fd6ff;light.intensity=status.burning?2:1.1;light.priority=1;this.lighting.pool.attach(e.id,light);}}
  this.interimAbilities.update(game.abilities?.snapshot,dt,!menu,game,this.player.root,this.camera,this.player.body);
  // V2 owns body offsets; solve its sibling weapon/socket from that final pose.
  this.player.syncWeaponPose?.();
  const socket=this.player.muzzleWorld!(this.shotSocket);
  for(const shot of this.pendingShots){const id=shot.weapon??'pistol';this.effects.shot(socket,shot.angle??p.angle,id);this.muzzleLife=id==='shotgun'?.075:.045;this.muzzle.color.setHex(WEAPON_APPEARANCE[id].color);this.muzzle.position.copy(socket);}this.pendingShots.length=0;
  for(const b of game.bullets)if(b.kind==='player'&&!b.visualMuzzle){const distance=Math.max(0,(socket.x-p.x/UNIT)*Math.cos(b.request.angle)+(socket.z-p.y/UNIT)*Math.sin(b.request.angle))*UNIT;b.visualMuzzle={x:socket.x,y:socket.y,z:socket.z,distance};}
  this.muzzleLife-=dt;this.muzzle.intensity=this.muzzleLife>0?6*Math.min(1,this.muzzleLife/.035)*this.options.flashIntensity*(this.motionQuery?.matches?.5:1):0;
  this.effects.update(dt,this.camera,game.bullets);
  let index=0;for(const b of game.bullets){if(index>=320)break;if(b.kind==='player'&&(2-b.life)*b.request.speed<(b.visualMuzzle?.distance??0))continue;this.dummy.position.set(b.x/UNIT,b.kind==='grenade'?1+Math.sin((1-b.life/1.1)*Math.PI)*1.4:b.visualMuzzle?.y??.95,b.y/UNIT);this.dummy.rotation.set(0,Math.PI/2-b.request.angle,0);this.dummy.scale.set(b.kind==='hazard'?.09:.025,.025,b.request.weaponId==='rocket'?.35:.24);this.dummy.updateMatrix();this.bulletMesh.setMatrixAt(index,this.dummy.matrix);if(this.tier==='high'&&this.options.dynamicLights&&(b.request.weaponId==='plasma'||b.request.weaponId==='rocket')){let id=this.projectileLightIds.get(b);if(id===undefined){id=this.nextProjectileLight--;this.projectileLightIds.set(b,id);}const light=this.attachedLight;light.x=this.dummy.position.x;light.y=this.dummy.position.y;light.z=this.dummy.position.z;light.color=b.request.weaponId==='plasma'?0x9fe8ff:0xffb454;light.intensity=1.7;light.priority=1;this.lighting.pool.attach(id,light);light.y=1;}this.bulletMesh.setColorAt(index,this.bulletColor.setHex(b.kind==='hazard'?0xa4e875:b.request.weaponId==='plasma'?0x73eced:0xffd58f));index++;}this.bulletMesh.count=index;this.bulletMesh.instanceMatrix.needsUpdate=true;if(this.bulletMesh.instanceColor)this.bulletMesh.instanceColor.needsUpdate=true;

  this.pickupInstances?.update(game.pickups.snapshot,this.time);
  if(this.pickupInstances)this.pickupInstances.root.visible=!menu;
  this.shadowTime+=dt;this.renderer.shadowMap.needsUpdate=this.shadowsDirty||this.shadowTime>=1/30;
  if(this.renderer.shadowMap.needsUpdate){this.shadowTime=0;this.shadowsDirty=false;}
  this.afflictions.update(this.scene.children,this.camera,this.time);this.renderer.info.reset();
  this.screenPoint.set(menu?23:p.x/UNIT,1.4,menu?13:p.y/UNIT).applyMatrix4(this.camera.matrixWorldInverse);this.post.setFocus?.(-this.screenPoint.z,menu);this.post.render(dt);this.playerBeacon?.update(this.player.root,p.angle,menu||combat.dead,crowding);
  const autoClear=this.renderer.autoClear;this.renderer.autoClear=false;this.renderer.render(this.hudScene,this.camera);this.renderer.autoClear=autoClear;
 }

 private captureRoomReflections(){
  if(!this.reflection||this.reflection.texture)return;
  const excluded=this.scene.children.filter(object=>object!==this.world&&object!==this.lighting.root&&object!==this.arena?.root);
  excluded.push(this.lighting.lamp.root,this.lighting.pool.root,this.lighting.blast);
  this.reflection.capture(this.roomWidth/2,2,this.roomHeight/2,excluded);
 }

 /** Fit both silhouettes below the boss header and above the desktop action bar. */
 private protectBossFraming(px:number,pz:number,playerRadius:number,qx:number,qz:number){
  // Reserve 18% at the top and 24% below; this envelope is independent of DOM layout.
  const queenHeight=this.queen?.height??4.5;
  for(let pass=0;pass<3;pass++){
   let left=Infinity,right=-Infinity,top=-Infinity,bottom=Infinity;
   for(let actor=0;actor<2;actor++){
    const x=actor?qx:px,z=actor?qz:pz,radius=actor?3.4:playerRadius,height=actor?queenHeight:this.player.height;
    for(let ix=-1;ix<=1;ix+=2)for(let iz=-1;iz<=1;iz+=2)for(let iy=0;iy<2;iy++){
     this.screenPoint.set(x+ix*radius,iy*height,z+iz*radius).project(this.camera);
     left=Math.min(left,this.screenPoint.x);right=Math.max(right,this.screenPoint.x);top=Math.max(top,this.screenPoint.y);bottom=Math.min(bottom,this.screenPoint.y);
    }
   }
   const scale=Math.min(1,1.8/(right-left),1.12/(top-bottom));
   if(scale<1){this.camera.zoom*=scale*.98;this.camera.updateProjectionMatrix();continue;}
   const dx=(left+right)*.5,dy=(top+bottom)*.5-.08;
   this.screenPoint.set((px+qx)*.5,0,(pz+qz)*.5).project(this.camera);this.screenTarget.copy(this.screenPoint);this.screenTarget.x-=dx;this.screenTarget.y-=dy;
   this.screenPoint.unproject(this.camera);this.screenTarget.unproject(this.camera);this.screenPoint.sub(this.screenTarget);
   this.screenPoint.z-=this.screenPoint.y*this.camera.matrixWorld.elements[10]/this.camera.matrixWorld.elements[9];this.screenPoint.y=0;
   this.camera.position.add(this.screenPoint);this.camera.updateMatrixWorld();
  }
 }

 /** Reserve projected body headroom even while aim lead or recoil is settling. */
 private protectPlayerFraming(x:number,z:number,radius:number){
  let left=1,right=-1,top=-1,bottom=1;
  for(let ix=-1;ix<=1;ix+=2)for(let iz=-1;iz<=1;iz+=2)for(let iy=0;iy<2;iy++){
   this.screenPoint.set(x+ix*radius,iy*this.player.height,z+iz*radius).project(this.camera);left=Math.min(left,this.screenPoint.x);right=Math.max(right,this.screenPoint.x);top=Math.max(top,this.screenPoint.y);bottom=Math.min(bottom,this.screenPoint.y);
  }
  const correctionX=left<-.94?left+.94:right>.94?right-.94:0;
  const correctionY=top>.88?top-.88:bottom<-.92?bottom+.92:0;
  if(!correctionX&&!correctionY)return;
  this.screenPoint.set(x,1,z).project(this.camera);this.screenTarget.copy(this.screenPoint);this.screenTarget.x-=correctionX;this.screenTarget.y-=correctionY;
  this.screenPoint.unproject(this.camera);this.screenTarget.unproject(this.camera);this.screenPoint.sub(this.screenTarget);
  // Move on the deck plane; camera tilt projects z into the same screen axis.
  this.screenPoint.z-=this.screenPoint.y*this.camera.matrixWorld.elements[10]/this.camera.matrixWorld.elements[9];this.screenPoint.y=0;
  this.camera.position.add(this.screenPoint);this.cameraRig.focus.add(this.screenPoint);this.focus.copy(this.cameraRig.focus);this.camera.updateMatrixWorld();
 }

 private syncPools(pools:readonly {id:number;x:number;y:number;radius:number;life:number}[]){
  const poolIds=this.activePoolIds;poolIds.clear();
  for(const p of pools){
   poolIds.add(p.id);let mesh=this.poolMeshes.get(p.id);
   if(!mesh){mesh=new T.Mesh(new T.CircleGeometry(1,40),new AcidPoolMaterial(p.id));mesh.rotation.x=-Math.PI/2;this.scene.add(mesh);this.contextResources?.track(mesh);this.poolMeshes.set(p.id,mesh);}
   mesh.position.set(p.x/UNIT,.03,p.y/UNIT);mesh.scale.setScalar(p.radius/UNIT);
   if(this.tier==='high'&&this.options.dynamicLights){const light=this.attachedLight;light.x=p.x/UNIT;light.y=.18;light.z=p.y/UNIT;light.color=0x9dff5a;light.intensity=1.8;light.distance=Math.min(5,2+p.radius/UNIT);light.priority=1;this.lighting.pool.attach(2000000+p.id,light);light.y=1;light.distance=3;}
   mesh.material.opacity=Math.min(.3,p.life*.3);mesh.material.surfaceTime.value=this.time;
  }
  for(const[id,mesh]of this.poolMeshes)if(!poolIds.has(id)){mesh.geometry.dispose();mesh.material.dispose();mesh.removeFromParent();this.poolMeshes.delete(id);}
 }
 private clearPools(){for(const mesh of this.poolMeshes.values()){mesh.geometry.dispose();mesh.material.dispose();mesh.removeFromParent();}this.poolMeshes.clear();}
 dispose(){if(this.disposed)return;this.disposed=true;this.ragdolls.dispose();for(const c of this.corpses)this.actorPool.release(c.model);this.corpses=[];this.corpseIds?.clear();for(const model of this.actors.values())this.actorPool.release(model);this.actors.clear();if(this.queen)this.actorPool.release(this.queen);this.queen=null;this.communalGarden?.dispose();this.communalGarden=undefined;this.residentialGalleryEquipment?.dispose();this.residentialGalleryEquipment=undefined;this.passengerVault?.dispose();this.clearPools();this.recoveryKit?.dispose();this.sealedBank?.dispose();this.releasedBerth?.dispose();disposeModel(this.world);this.temporaryMaterials.forEach(m=>m.dispose());this.practicalPools?.dispose();this.arena?.dispose();this.title?.dispose();this.backdrop?.dispose();this.atmosphere.dispose();this.lighting.dispose();this.contacts.dispose();this.afflictions.dispose();this.actorPool.dispose();this.healthBars.dispose();this.pickupInstances?.dispose();this.playerBeacon?.dispose();this.effects.dispose();this.interimAbilities.dispose();for(const model of [this.player,this.menuMarine,this.menuAlien])if(model){model.stop?.();disposeModel(model.root);}if(this.bulletMesh.geometry){this.bulletMesh.geometry.dispose();(this.bulletMesh.material as T.Material).dispose();}for(const object of this.warning.children)if(object instanceof T.Mesh){object.geometry.dispose();(object.material as T.Material).dispose();}this.canvas.removeEventListener('webglcontextlost',this.loseGraphics);this.canvas.removeEventListener('webglcontextrestored',this.restoreGraphics);this.motionQuery?.removeEventListener('change',this.motionChanged);this.reflection.dispose();this.post.dispose();this.materialWarmup?.dispose();this.contextResources?.invalidate();this.renderer.dispose();this.surfaces.dispose();}
}
