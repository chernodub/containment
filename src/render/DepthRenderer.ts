import {RIG_ACCENTS} from './ActorIdentity';
import {FloorChoiceMarkers} from './markers/FloorChoiceMarkers';
import { PincerPresentation } from './world/PincerPresentation';
import {setRoomBlackout,setSurfacePaintDiagnostic} from './lighting/LocalLightShading';
import {ShipConditionVisuals} from './vfx/ShipConditionVisuals';
import {CONDITION_LIGHT_RADIUS} from '../game/roguelike/shipConditions';
import {showIncidentColliders} from './world/IncidentColliderDebug';
import {RoomCutawayTargets} from './world/RoomCutawayTargets';
import {OverdriveReactions} from './motion/OverdriveReactions';
import {combatPresentationHoldSeconds} from '../game/observation/combatPresentationClock';
import {combatPointVisible} from '../game/observation/combatVisibility';
import {SiegeBoundary} from './markers/SiegeBoundary';
import {setActorLOD} from './ActorLOD';
import {DrawnMarineEnvelope} from './camera/DrawnMarineEnvelope';
// E10: actor contact ownership; actor models and motion remain unchanged.
import {useActorContactShadows} from './lighting/ActorContactPolicy';
import {roomValueProfile,setRoomValueField} from './lighting/RoomValueStandard';
import {deckLightSources} from './world/E10DeckSurfaces';
import {setOriginalShipKitQuality} from './world/OriginalShipKitAssets';
import {setCeilingQuality} from './world/E10CeilingServices';
import {attachOriginalRoomInteriors,prefetchOriginalRoomInteriors} from './world/OriginalRoomInteriors';
import {INTERIOR_ROOMS} from './world/RoomInteriors';
import {buildRoomInteriors} from './world/RoomInteriors';
import {PresentationHold} from './motion/PresentationHold'; // M10 bounded presentation clock
import {actorImpact,actorDeathCue,enemyMotionAim} from './motion/MotionEvents'; // M9 presentation-only routing
import {act3ShipPresentation,ACT3_PRESENTATION_ROOMS} from './world/Act3ShipPresentation';
import {act1ShipPresentation} from './world/Act1ShipPresentation';
import {shipArchitectureRoom} from './world/ShipArchitectureRoom';
import {attachRoomKits,KIT_STANDARD_ROOMS,prepareKitAssets} from './world/LazyRoomKits';
import {AREA_ATTACK_DELAY_MS} from '../game/enemies/QueenBossSystem';
import { registerGeometry, GEOMETRY_CLASSES } from './post/GeometryBuffer';
import {freezeStaticRoom} from './StaticRoomTransforms';
import {RoomPreparationCache} from './RoomPreparationCache';
import {generateRun} from '../game/roguelike/run';
import {batchStaticRoom} from './StaticRoomBatching';
import {MaterialWarmup} from './MaterialWarmup';
import {configureCinematicLayers,CINEMATIC_LAYER} from './CinematicLayers';
import {ContextResources} from './ContextResources';
import {addRoomPracticals,updateRoomPracticals} from './lighting/RoomPracticals';
import {addInteriorPracticals} from './lighting/InteriorPracticals';
import {updateHotFixtureSurfaces} from './lighting/HotFixtureSurface';
import {PracticalPools} from './lighting/PracticalPools';
import {optimizeLocalLights} from './lighting/LocalLightShading';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from './camera/CombatFraming';
import {roomFocus} from './roomFraming';
import {CameraRig} from './camera/CameraRig';
import {RoomCombatFraming} from './camera/RoomCombatFraming';
import {HudCombatFraming,FULL_COMBAT_VIEWPORT,ZERO_HUD_INSETS,type HudInsets} from './camera/HudCombatFraming';
import {PostPipeline} from './post/PostPipeline';
import {Atmosphere} from './atmosphere/Atmosphere';
import {ShipBackdrop} from './atmosphere/ShipBackdrop';
import {ArenaStaging} from './vfx/ArenaStaging';
import {addExitSignal,updateExitSignal} from './world/ExitSignal';
import {TitlePresentation,TITLE_STAGE,styleTitleActor} from './world/TitlePresentation';
import {addDeckMarkings} from './world/DeckMarkings';
import {addWorldDressing,updateWorldDressing} from './world/WorldDressing';
import {updateOriginalInteriorCutaways} from './world/OriginalInteriorCutaways';
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
import {GRAPHICS_PRESETS,resolveGraphicsAblation,resolveGraphicsOptions,type GraphicsAblation,type GraphicsOptions} from './graphicsOptions';
import {EnvironmentMaterials} from './EnvironmentMaterials';
import {setFloorLeaks} from './lighting/FloorVariation';
import {addEnvironmentalStory,setEnvironmentalStoryOptions} from './world/EnvironmentalStory';
import {shipEnvironment,environmentObstacle,environmentArchitecture,appendEnvironment,type ShipEnvironment} from './ShipEnvironments';
import {serviceShaftLanding} from './ServiceShaftLanding';
import * as T from 'three';
import {EnemyHealthBars,type HealthBarEntry} from './EnemyHealthBars';
import {AttackEffects} from './AttackEffects';
// V2 ability routing: isolated from world presentation.
import {LazyAbilityVisuals} from './abilities/LazyAbilityVisuals';
import {AcidPoolMaterial} from './acidPool';
import {AfflictionBatches} from './afflictions';
import {WEAPON_APPEARANCE} from './weapons';
import {RoomReflectionCapture} from './lighting/RoomReflectionCapture';
import {getEnvironmentMood} from './lighting/EnvironmentMoods';
import {applyRoomMood} from './lighting/applyRoomMood';

import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {attachPassengerVault} from './PassengerVault';
import {attachResidentialGalleryEquipment} from './ResidentialGalleryEquipment';
import {MAT,box,ball,rod,marine,alien,nest,updateNest,disposeModel,freezeCorpse,type ActorModel} from './models';
const {DeathRagdolls}=await import('../ui/loading/DeferredRagdolls');
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import type {DepthGame,GameEffect} from '../DepthGame';
import type {RunNode,RoomTemplate} from '../game/roguelike/types';
const UNIT=32;
const PREPARATION_CANCELLED=Symbol('graphics-generation-replaced');
export type RoomPreparationTiming={room:string;started:number;total:number;phases:Record<string,number>;compilePasses:number;textureUploads:number;programsBefore:number;programsAfter:number;materialProfiles:number};
type Corpse={podFall?:{x:number;z:number;dx:number;dz:number};pendingEffect?:GameEffect;model:ActorModel;x:number;y:number;vx:number;vy:number;height:number;lift:number;spin:number;age:number;id:number};
// Negative contact indices select soft brood spill. Positive values belong to Blackout warnings.
const BROOD_SPILL: Readonly<Partial<Record<string,number>>> = {stalker:-1,crawler:-2,spitter:-3,carrier:-4};

export class DepthRenderer {
 readonly menuPresentation='cinematic' as const;
 readonly renderer:T.WebGLRenderer;readonly scene=new T.Scene();camera:T.OrthographicCamera|T.PerspectiveCamera=new T.PerspectiveCamera(28);
 private readonly pincerPresentation = new PincerPresentation();
 private contextResources=new ContextResources();private afflictions=new AfflictionBatches(new T.TextureLoader());private healthBars=new EnemyHealthBars();private hudScene=new T.Scene();private world=new T.Group();private actors=new Map<number,ActorModel>();private nests=new Map<number,T.Group>();private queen:ActorModel|null=null;
 private kitDressing:ReturnType<typeof attachRoomKits>|undefined;private kitStartupComplete=false;private gameplayPresentationStarted=false;
 private interimAbilities=new LazyAbilityVisuals(this.scene);private abilityWarmupRoot:T.Object3D|undefined;
 private presentationHold=new PresentationHold();private marineDeathStarted=false; // M10
 private readonly overdriveReactions=new OverdriveReactions();
 private ragdolls=new DeathRagdolls();private staticDirty=false;private corpseIds=new Set<number>();
 private staticLoaded(owner:T.Group){return()=>{if(this.world!==owner)return;this.effects.prepareWallSurfaces();const newProfiles=this.materialWarmup?.register(owner)??0;this.contextResources?.track(owner);this.reflection?.invalidate();this.shadowsDirty=true;this.staticDirty=true;if(this.materialWarmup&&newProfiles)this.queueRoomWarmup();};}
 // M10: conservative pose-only culling; roots, warnings and actor visibility stay native.
 private actorPoseFrustum=new T.Frustum();private actorPoseMatrix=new T.Matrix4();private actorPoseBounds=new T.Sphere();
 private actorPool=new ActorPool();private player=marine();private playerBeacon=new PlayerBeacon(this.player.root,this.hudScene);private corpses:Corpse[]=[];private effects:AttackEffects;
 private initializedTextures=new WeakMap<T.Texture,number>();private introspectedPrograms=new WeakSet<object>();
 private preparationHistory:RoomPreparationTiming[]=[];private preparationTiming:RoomPreparationTiming|null=null;
 /** Bounded room-load evidence; read only by capture/benchmark tooling. */
 get preparationDiagnostics(){return this.preparationHistory.map(row=>({...row,phases:{...row.phases}}));}
 private preparationTargets=new Set<T.WebGLRenderTarget>();private graphicsGeneration=0;private roomWarmPending=false;private roomWarmWork:Promise<void>=Promise.resolve();private roomWarmCompiling=false;private forceRoomWarm=false;private warmAgain=false;private deferredRoom:{node:RunNode;environment?:ShipEnvironment}|null=null;
 private prefetchKey='';private cancelRoomPrefetch?:()=>Promise<void>;
 private aheadKey='';private aheadRooms=new RoomPreparationCache(node=>this.buildAhead(node),root=>disposeModel(root),2);
 private materialWarmup:MaterialWarmup;private surfaces:EnvironmentMaterials;private floorMaterial:T.MeshStandardMaterial;
 private practicalPools=new PracticalPools(this.scene);private arena=new ArenaStaging(this.scene);private backdrop=new ShipBackdrop(this.scene);private atmosphere=new Atmosphere(this.scene);private heatClock=0;private lighting=new SceneLighting();private contacts=new ContactShadows();private muzzle:T.PointLight;private muzzleLife=0;
 private readonly hostileSocket = new T.Vector3();
 private readonly recoveryPosition = new T.Vector3();
 private readonly actorPosition = (id:number) => this.actors.get(id)?.body.getWorldPosition(this.recoveryPosition);
 private readonly shooterSocket = (id:number) =>
  this.actors.get(id)?.root.getObjectByName('jaw')?.getWorldPosition(this.hostileSocket);
 private pendingShots:GameEffect[]=[];private shotSocket=new T.Vector3();
 private reflection:RoomReflectionCapture;private roomWidth=0;private roomHeight=0;private roomEnvironment:ShipEnvironment='cryogenics';private recoveringGraphics=false;private loseGraphics=()=>{this.cancelRoomPrefetch?.();this.cancelRoomPrefetch=undefined;this.graphicsGeneration++;this.initializedTextures=new WeakMap();this.introspectedPrograms=new WeakSet();for(const target of this.preparationTargets)target.dispose();this.preparationTargets.clear();this.recoveringGraphics=true;this.contextResources.track(this.scene);this.contextResources.track(this.hudScene);this.contextResources.invalidate();this.reflection.invalidate(true);this.post.invalidate();this.lighting.invalidateShadows();};private restoreGraphics=()=>{this.shadowsDirty=true;this.recoveringGraphics=true;this.queueRoomWarmup();void this.roomWarmWork.finally(()=>{this.recoveringGraphics=false;}).catch(()=>{});};
 private focus=new T.Vector3(18,0,14);private raycaster=new T.Raycaster();private ground=new T.Plane(new T.Vector3(0,1,0),0);
 private post:PostPipeline;private tier:GraphicsTier='high';private shadowTime=0;private shadowsDirty=true;private pixelRatio=1;
 private options:GraphicsOptions=GRAPHICS_PRESETS.high;
 private marineEnvelope=new DrawnMarineEnvelope();private roomCombatFraming=new RoomCombatFraming();private cameraRig=new CameraRig();private viewHeight=13;private viewWidth=13;private desiredFocus=new T.Vector3();private screenPoint=new T.Vector3();private screenTarget=new T.Vector3();private bulletColor=new T.Color();private playerVelocity={x:0,y:0};private attachedLight={x:0,y:1,z:0,color:0xffffff,intensity:1,distance:3,duration:.1,priority:1};
 hudCoachedTargetId:number|null=null;
 private hudFraming=new HudCombatFraming();
 private actorLODStudy:'auto'|'full'|'low'='auto';
 setActorLODStudy(mode:'auto'|'full'|'low'){this.actorLODStudy=mode;}
 private readonly lodDistances=new Float64Array(4);
 private cameraContactHeight=(id:number)=>this.actors.get(id)?.height??3.2;
 /** Current effective CSS-pixel HUD reservations; invalid or oversized values are bounded. */
 get hudInsets():HudInsets{return this.hudFraming?.insets??ZERO_HUD_INSETS;}
 /** Bounded renderer-only camera proof for the opt-in capture adapter. */
 get combatFramingDiagnostics(){const framing=this.hudFraming?.diagnostics;return framing?{...framing,roomConstraints:this.roomCombatFraming?.diagnostics}:undefined;}
 /** Reserve the actual desktop HUD. Defaults to zero; no DOM query or simulation mutation. */
 setHudInsets(insets:HudInsets){const framing=this.hudFraming??=new HudCombatFraming();framing.resize(this.viewportWidth,this.viewportHeight);framing.setInsets(insets);}
 private viewportSize?:{width:number;height:number};
 /** CSS viewport dimensions sampled on resize, shared with pooled DOM projection. */
 get viewportWidth(){return this.viewportSize?.width??this.canvas.clientWidth;}
 get viewportHeight(){return this.viewportSize?.height??this.canvas.clientHeight;}
 private canvasRect?:DOMRect;private projectedPlayer?:{left:number;top:number;right:number;bottom:number};
 private visiblePoint=new T.Vector3();private activePoolIds=new Set<number>();private frameFocus={x:0,z:0};private activeActorIds=new Set<number>();private activeNestIds=new Set<number>();private healthEntries:HealthBarEntry[]=Array.from({length:128},()=>({x:0,z:0,height:0,health:0,maxHealth:1,elite:false,armor:0,maxArmor:0}));private projectileLightIds=new WeakMap<object,number>();private nextProjectileLight=-1000;
 private motionChanged=()=>this.applyQuality();
 private motionQuery=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
 private disposed=false;private time=0;private recoil=0;private roomKey='';private temporaryMaterials:T.Material[]=[];
 private bulletMesh:T.InstancedMesh;private dummy=new T.Object3D();
 private pickupInstances=new PickupInstances();private exit:T.Group|null=null;
 private colliderDebug=false;
 setColliderDebug(visible:boolean){this.colliderDebug=visible;showIncidentColliders(this.world,visible);}
 private warning=new T.Group();private poolMeshes=new Map<number,T.Mesh<T.CircleGeometry,AcidPoolMaterial>>();private menuActors=new T.Group();private menuMarine=marine();private menuAlien=alien('brute');private lastMenu=false;private menuThreatClock=0;
 private title=new TitlePresentation(this.scene);
 private readonly conditionVisuals=new ShipConditionVisuals(UNIT);
 private readonly floorChoiceMarkers=new FloorChoiceMarkers();
 private readonly siegeBoundary=new SiegeBoundary(UNIT);
 constructor(readonly canvas:HTMLCanvasElement,assetRenderer?:T.WebGLRenderer){
  this.renderer=assetRenderer??new T.WebGLRenderer({canvas,antialias:false,alpha:false,stencil:true,powerPreference:'high-performance'});
  // Scene roots remain identity; only moving descendants compose local matrices.
  this.scene.matrixAutoUpdate=false;this.hudScene.matrixAutoUpdate=false;
  this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.AgXToneMapping;this.renderer.toneMappingExposure=1.22;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;this.renderer.info.autoReset=false;
  this.hudScene.add(this.healthBars.root);this.scene.add(this.afflictions.root);
  this.scene.background=new T.Color(0x081014);this.scene.fog=new T.FogExp2(0x102027,.014);
  this.reflection=new RoomReflectionCapture(this.renderer,this.scene);this.canvas.addEventListener('webglcontextlost',this.loseGraphics);this.canvas.addEventListener('webglcontextrestored',this.restoreGraphics);this.motionQuery?.addEventListener('change',this.motionChanged);
  this.scene.add(this.lighting.root,this.contacts.mesh,this.floorChoiceMarkers.root,this.siegeBoundary.root,this.conditionVisuals.root,this.pincerPresentation.root);
  // Shared pickup/nest finishes can appear after a kill in a different room.
  // Match their future shaders to the retained generic material family before preparation.
  for(const material of Object.values(MAT))optimizeLocalLights(material);
  this.surfaces=new EnvironmentMaterials(this.renderer.capabilities.getMaxAnisotropy());this.floorMaterial=this.surfaces.floor;this.materialWarmup=new MaterialWarmup(this.surfaces);this.scene.add(this.materialWarmup.root);this.materialWarmup.register(this.title.root);this.materialWarmup.register(this.conditionVisuals.root);this.pincerPresentation.registerWarmup(root=>this.materialWarmup.register(root));this.conditionVisuals.update(null,false,false);
  this.scene.add(this.world,this.player.root,this.pickupInstances.root);this.materialWarmup.register(this.pickupInstances.root);
  this.muzzle=new T.PointLight(0xffc679,0,3,2);this.scene.add(this.muzzle);
  this.effects=new AttackEffects(this.scene,undefined,this.world);this.effects.setPriorityScene(this.hudScene);
  this.effects.setFeedback({flash:event=>this.lighting.pool.flash({x:event.position.x,y:event.position.y,z:event.position.z,color:event.color,intensity:event.intensity,distance:event.radius,duration:event.duration,priority:event.priority},true),shockwave:event=>this.post.distortion.shockwave(event.position.x,event.position.z,event.radius,event.strength*.012,event.duration)});


  this.bulletMesh=new T.InstancedMesh(new T.SphereGeometry(1,6,4),new T.MeshBasicMaterial({color:0xffffff}),320);this.bulletMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.bulletMesh.setColorAt(0,this.bulletColor);this.bulletMesh.frustumCulled=false;this.scene.add(this.bulletMesh);
  this.post=new PostPipeline(this.renderer,this.scene,this.camera);this.post.setOptions(this.options,this.tier);
  // V2: public pooled feedback services, constructed before shader preparation.
  this.interimAbilities.setHostilePrioritySource(this.effects);
  this.interimAbilities.bind({statusActor:id=>id===-1?this.queen??undefined:this.actors.get(id)??this.corpses.find(c=>c.id===id)?.model,lights:this.lighting.pool,distortion:this.post.distortion,camera:this.cameraRig,presentation:this.post});
  // Boss telegraphs share the prepared hostile priority batch.
  this.scene.add(this.warning);this.warning.visible=false;
  this.menuActors.add(this.menuMarine.root,this.menuAlien.root);this.menuMarine.root.scale.setScalar(1.9);this.menuMarine.setAimPitch?.(TITLE_STAGE.marine.aimPitch);this.menuAlien.root.scale.set(1.95,1.22,1.95);this.menuAlien.root.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial)m.color.multiplyScalar(.68);});this.menuAlien.setStageLight?.(.55);styleTitleActor(this.menuMarine.root,true);styleTitleActor(this.menuAlien.root,false);this.scene.add(this.menuActors);
  configureCinematicLayers(this.title.root,this.menuActors,this.lighting,this.contacts.mesh,this.muzzle);
  this.contextResources.track(this.scene);this.contextResources.track(this.hudScene);this.resize();
 }
 /** Native Start/Continue crosses the lazy gameplay asset boundary once. */
 beginGameplayPresentation(){this.gameplayPresentationStarted=true;}
 endGameplayPresentation(){this.gameplayPresentationStarted=false;this.kitDressing?.dispose();this.kitDressing=undefined;}
 private graphicsAblation: GraphicsAblation | null = null;
 /** Apply one validated debug-only change before preparing the measured room. */
 setGraphicsAblation(value: unknown){
  const ablation=resolveGraphicsAblation(value);
  if(!ablation)throw Error("Unknown graphics ablation");
  this.graphicsAblation=ablation;
  setSurfacePaintDiagnostic(ablation!=="surfacePaint");
  this.post.diagnosticInkWear=ablation!=="inkWear";
  this.post.diagnosticFinalAA=ablation!=="finalAA";
  this.post.diagnosticSoftDepth=ablation!=="softDepth";
  this.post.adaptive.minimumScale=ablation==="adaptive80"?.8:.9;
  this.applyQuality();
  this.queueRoomWarmup();
 }
 get qualityTier(){return this.tier;}
 /** Current immutable settings; selecting a tier resets its overrides. */
 get graphicsOptions(){return this.options;}
 /** Apply presentation settings without changing deterministic game state. */
 setGraphicsOptions(partial:Partial<GraphicsOptions>){
  const previous=this.options??GRAPHICS_PRESETS[this.tier??'high'];this.options=resolveGraphicsOptions(this.options??GRAPHICS_PRESETS.high,partial);this.applyQuality();if(this.materialWarmup&&(previous.dynamicLights!==this.options.dynamicLights||previous.shadows!==this.options.shadows||previous.atmosphere!==this.options.atmosphere||(this.tier==='low'&&(previous.inkOutlines==='off')!==(this.options.inkOutlines==='off'))))this.queueRoomWarmup();
 }
 setQuality(value:'high'|'low'='high'){
  const previous=this.options,wasLow=this.tier==='low';this.tier=value==='low'?'low':'high';this.options=GRAPHICS_PRESETS[this.tier];this.ragdolls?.setQuality(this.tier);while(this.corpses.length>(this.tier==='low'?6:10)){const c=this.corpses.shift()!;this.ragdolls.remove(c.id);this.actorPool.release(c.model);}this.applyQuality();if(this.materialWarmup&&(wasLow!==(this.tier==='low')||previous?.dynamicLights!==this.options.dynamicLights||previous?.shadows!==this.options.shadows||previous?.atmosphere!==this.options.atmosphere||(this.tier==='low'&&(previous?.inkOutlines==='off')!==(this.options.inkOutlines==='off'))))this.queueRoomWarmup();
 }
 private applyQuality(){this.pickupInstances?.setLow(this.tier==='low');this.renderer.shadowMap.enabled=this.tier!=='low'&&this.options.shadows!=='off';this.shadowsDirty=true;if(this.muzzle)this.muzzle.visible=this.options.dynamicLights;this.lighting?.setQuality(this.tier,this.options.dynamicLights,this.options.atmosphere,this.options.flashIntensity*(this.motionQuery?.matches?.5:1),this.options.shadows,this.graphicsAblation==='halfLightPool');this.post?.setOptions(this.motionQuery?.matches?{...this.options,distortion:false,lensEffects:false}:this.options,this.tier);this.effects?.setOptions({...this.options,tier:this.tier,reducedMotion:!!this.motionQuery?.matches});this.interimAbilities?.setOptions?.(this.options,this.tier,!!this.motionQuery?.matches);this.afflictions?.setOptions({...this.options,tier:this.tier,reducedMotion:!!this.motionQuery?.matches});this.atmosphere?.setOptions(this.graphicsAblation==='atmosphereLayers'?{atmosphere:false}:this.options,this.tier,!!this.motionQuery?.matches);this.backdrop?.setQuality(this.tier);this.player?.setFlashIntensity?.(this.options.flashIntensity);for(const actor of this.actors?.values()??[])actor.setFlashIntensity?.(this.options.flashIntensity);this.queen?.setFlashIntensity?.(this.options.flashIntensity);for(const corpse of this.corpses??[])corpse.model.setFlashIntensity?.(this.options.flashIntensity);setCeilingQuality(this.world,this.tier==='high');setOriginalShipKitQuality(this.world,this.tier==='high');setEnvironmentalStoryOptions(this.world,this.tier==='high'&&this.options.atmosphere);this.resize();}
 resize(){
  this.canvasRect=this.canvas.getBoundingClientRect();
  const w=window.innerWidth,h=window.innerHeight,post=this.tier==='high';this.pixelRatio=Math.min(devicePixelRatio||1,post?1.5:1)*this.options.resolutionScale;
  this.renderer.setPixelRatio(this.pixelRatio);this.renderer.setSize(w,h,false);this.effects?.setPriorityViewport(this.canvas.width,this.canvas.height);this.post.setSize(w,h,Math.min(devicePixelRatio||1,post?1.5:1));
  const viewport=this.viewportSize??={width:0,height:0};viewport.width=this.canvas.clientWidth??Math.round(this.canvasRect.width);viewport.height=this.canvas.clientHeight??Math.round(this.canvasRect.height);this.hudFraming?.resize(viewport.width,viewport.height);
  const view=h>w?18:COMBAT_VIEW_HEIGHT;this.viewHeight=view;this.viewWidth=view*w/h;if(this.camera instanceof T.OrthographicCamera){this.camera.left=-this.viewWidth/2;this.camera.right=this.viewWidth/2;this.camera.top=view/2;this.camera.bottom=-view/2;}else this.camera.aspect=w/h;this.camera.near=.1;this.camera.far=160;this.camera.updateProjectionMatrix();
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
 /** Let fixed-frame capture settle active transfers before discarding its page. */
 async finishRoomPrefetch(){await this.cancelRoomPrefetch?.();}
 /** Speculate at most two known route nodes while rewards/routes leave the GPU idle. */
 prepareAhead(nodes:readonly RunNode[]){if(!this.disposed)this.aheadRooms?.prepareAhead(nodes);}
 private buildRoomArchitecture(node:RunNode,t:RoomTemplate):T.Group|null{
  const root=shipArchitectureRoom(node.templateId,t)??(node.templateId==='service-shaft-landing'?serviceShaftLanding(t):authoredRoom(node.templateId,t));
  if(root&&node.templateId==='service-shaft-landing'){
   root.traverse(object=>{if(object.userData.lightFixtures)object.userData.lightFixtures=object.userData.lightFixtures.map((fixture:Record<string,number>)=>({...fixture,poolStyle:fixture.poolStyle??1,poolAngle:fixture.poolAngle??Math.atan2(t.width/64-fixture.x,t.height/64-fixture.z),poolWidth:fixture.poolWidth??.35,poolDepth:fixture.poolDepth??5}));});
   const presentation=act3ShipPresentation(node.templateId,t);if(presentation)root.add(presentation);
  }
  return root;
 }
 /** Flatten the bespoke shaft without discarding its authored source origins. */
 private appendShaftArchitecture(root:T.Group){
  root.updateWorldMatrix(true,true);this.world.updateWorldMatrix(true,false);
  const inverse=new T.Matrix4().copy(this.world.matrixWorld).invert(),position=new T.Vector3(),fixtures=this.world.userData.lightFixtures??=[];
  root.traverse(object=>{for(const fixture of object.userData.lightFixtures??[]){position.set(fixture.x,fixture.y,fixture.z).applyMatrix4(object.matrixWorld).applyMatrix4(inverse);fixtures.push({...fixture,x:position.x,y:position.y,z:position.z});}});
  appendEnvironment(this.world,root);this.bakeWorld();
 }
 private buildAhead(node:RunNode):T.Group|null{
  const t=ROOM_TEMPLATES[node.templateId],environment=shipEnvironment(node.templateId)??(node.templateId==='reactor-vault'?'reactor':'cryogenics');
  if(KIT_STANDARD_ROOMS.has(node.templateId)&&!INTERIOR_ROOMS.has(node.templateId))prepareKitAssets(environment);
  const root=this.buildRoomArchitecture(node,t);
  if(root){batchStaticRoom(root);applyRoomMood(root,environment,node.templateId,undefined,false);this.materialWarmup.register(root);}
  // Link the retained shared shaders against the future light topology without
  // replacing the active room, capturing reflections, or holding route input.
  if(this.renderer.extensions.has('KHR_parallel_shader_compile')&&!this.roomWarmPending&&!this.recoveringGraphics){
   const lighting=new SceneLighting(),scene=new T.Scene(),target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType});
   lighting.loadRoom(root??new T.Group(),t.width/UNIT,t.height/UNIT,environment,node.templateId);lighting.setQuality(this.tier,this.options.dynamicLights,this.options.atmosphere,this.options.flashIntensity,this.options.shadows);
   const muzzle=new T.PointLight();muzzle.visible=this.options.dynamicLights;scene.add(lighting.root,muzzle);scene.environment=this.scene.environment;scene.fog=this.scene.fog;
   const originalTarget=this.renderer.getRenderTarget(),mapping=this.renderer.toneMapping;
   let work:Promise<void>;
   try{this.renderer.setRenderTarget(this.tier==='high'?target:null);this.renderer.toneMapping=this.tier==='high'?T.NoToneMapping:T.AgXToneMapping;work=this.compilePrepared(this.materialWarmup.root,this.camera,scene);}
   finally{this.renderer.setRenderTarget(originalTarget);this.renderer.toneMapping=mapping;}
   void work.catch(error=>{if(error!==PREPARATION_CANCELLED)console.error('Route shader preparation failed',error);}).finally(()=>{lighting.dispose();target.dispose();});
  }
  return root;
 }
 /** Load shaders, textures, GPU buffers and common animation actions before combat. */
 async prepare(node:RunNode){
  if(this.materialWarmup){while(this.roomWarmPending)await this.roomWarmWork;this.forceRoomWarm=true;try{this.loadRoom(node);}finally{this.forceRoomWarm=false;}await this.roomWarmWork;while(this.roomWarmPending)await this.roomWarmWork;this.kitStartupComplete=true;return;}
  this.loadRoom(node);
  // Settle every room owner before GPU work competes with image decoding.
  // Each optional owner already bounds its load and resolves on fallback.
  await Promise.all([this.surfaces.ready,this.passengerVault?.ready,this.residentialGalleryEquipment?.ready,this.communalGarden?.ready,this.sealedBank?.ready,this.releasedBerth?.ready,this.recoveryKit?.ready,this.kitDressing?.ready]);
  this.captureRoomReflections();await this.prepareScene();this.kitStartupComplete=true;
 }
 /** Serialize room preparation, keeping input blocked until every actual material is ready. */
 private queueRoomWarmup(){
  if(this.roomWarmPending){if(this.roomWarmCompiling)this.warmAgain=true;return;}
  this.roomWarmPending=true;this.roomWarmCompiling=false;const world=this.world,generation=this.graphicsGeneration,timing=this.preparationTiming,waitStarted=performance.now();
  const ready=[this.surfaces.ready,this.passengerVault?.ready,this.residentialGalleryEquipment?.ready,this.communalGarden?.ready,this.sealedBank?.ready,this.releasedBerth?.ready,this.recoveryKit?.ready,this.kitDressing?.ready,this.prepareAbilityAssets()];
  this.roomWarmWork=Promise.all(ready).then(async()=>{if(this.disposed||this.world!==world||generation!==this.graphicsGeneration||this.renderer.getContext().isContextLost())return;this.roomWarmCompiling=true;if(timing)timing.phases.assets=(timing.phases.assets??0)+performance.now()-waitStarted;const captureStarted=performance.now();this.captureRoomReflections();if(timing)timing.phases.reflection=(timing.phases.reflection??0)+performance.now()-captureStarted;const warmStarted=performance.now();await this.prepareScene();if(timing){timing.phases.warm=(timing.phases.warm??0)+performance.now()-warmStarted;timing.total=performance.now()-timing.started;timing.programsAfter=this.renderer.info.programs?.length??0;timing.materialProfiles=this.materialWarmup?.profileCount??0;}}).catch(error=>{if(error!==PREPARATION_CANCELLED&&generation===this.graphicsGeneration&&!this.renderer.getContext().isContextLost())throw error;}).finally(()=>{
   this.roomWarmPending=false;this.roomWarmCompiling=false;const next=this.deferredRoom;this.deferredRoom=null;
   if(next)this.loadRoom(next.node,next.environment);
   if(this.warmAgain){this.warmAgain=false;this.queueRoomWarmup();}
  });
  void this.roomWarmWork.catch(error=>console.error('Room graphics preparation failed',error));
 }
 /** Decode/upload the shared atlas inside the first gameplay hold, never title preparation. */
 private async prepareAbilityAssets(){
  if(!this.kitStartupComplete||!this.gameplayPresentationStarted||!this.interimAbilities)return;
  const generation=this.graphicsGeneration;
  await Promise.all([this.interimAbilities.prepare(),this.pickupInstances.prepare(this.renderer,root=>this.materialWarmup.register(root))]);this.checkGraphicsGeneration(generation);
  const kit=this.interimAbilities.kit;if(!kit)return;
  const root=this.interimAbilities.root;
  if(this.abilityWarmupRoot!==root){
   this.materialWarmup?.register(root);this.contextResources?.track(root);this.abilityWarmupRoot=root;
   this.post.bindSoftParticles([kit.batches.flame.mesh,kit.batches.smoke.mesh],depth=>this.interimAbilities.setSoftDepth(depth,this.camera.near,this.camera.far,this.camera instanceof T.PerspectiveCamera),()=>kit.atlas.loaded,mesh=>mesh===kit.batches.flame.mesh?kit.batches.flame.needsSoftDepth:kit.batches.smoke.needsSoftDepth);
  }
  if(kit.atlas.loaded)this.renderer.initTexture(kit.atlas.texture);
 }
 /** Generation-aware polling avoids Three's uncancellable async callbacks on a lost context. */
 private async compilePrepared(scene:T.Scene|T.Group,camera:T.Camera,targetScene?:T.Scene){
  const generation=this.graphicsGeneration;this.checkGraphicsGeneration(generation);const timing=targetScene?null:this.preparationTiming,submitted=performance.now();if(timing)timing.compilePasses++;this.renderer.compile(scene,camera,targetScene);if(timing)timing.phases.compileSubmission=(timing.phases.compileSubmission??0)+performance.now()-submitted;const waitStarted=performance.now();
  const programs=(this.renderer.info.programs??[]).slice() as unknown as {program?:unknown;isReady?:()=>boolean;getUniforms?:()=>unknown;getAttributes?:()=>unknown}[];
  for(;;){this.checkGraphicsGeneration(generation);if(programs.every(program=>('program' in program&&program.program===undefined)||!program.isReady||program.isReady())){for(const program of programs)if(!('program' in program)||program.program!==undefined){const ready=this.introspectedPrograms??=new WeakSet<object>();if(!ready.has(program)){const started=performance.now();program.getUniforms?.();program.getAttributes?.();ready.add(program);if(timing)timing.phases.introspection=(timing.phases.introspection??0)+performance.now()-started;}}if(timing)timing.phases.compileWait=(timing.phases.compileWait??0)+performance.now()-waitStarted;return;}await new Promise<void>(resolve=>setTimeout(resolve,10));}
 }
 private checkGraphicsGeneration(generation:number){if(this.disposed||generation!==this.graphicsGeneration||this.renderer.getContext().isContextLost())throw PREPARATION_CANCELLED;}
 private freezeRoomTransforms(){freezeStaticRoom(this.world);}
 private async prepareScene(){
  const generation=this.graphicsGeneration;this.freezeRoomTransforms();
  const warm:T.Group=new T.Group(),models:ActorModel[]=[];this.scene.add(warm);
  let sliceStarted=performance.now();
  // Yield by CPU work rather than per texture: timer clamping used to add hundreds
  // of milliseconds of idle delay to every already-cached room entry.
  const yieldTask=async()=>{if(performance.now()-sliceStarted<8)return;await new Promise<void>(resolve=>setTimeout(resolve,0));sliceStarted=performance.now();};
  const shadowEnabled=this.renderer.shadowMap.enabled,mapping=this.renderer.toneMapping,originalTarget=this.renderer.getRenderTarget(),warmTarget=new T.WebGLRenderTarget(64,64,{type:T.HalfFloatType}),restoreMaterials=this.materialWarmup.prepare(),restoreAtmosphere=this.atmosphere.prepare(),restoreBackdrop=this.backdrop.prepare(),restoreArena=this.arena.prepare();
  this.preparationTargets.add(warmTarget);
  const actorsStarted=performance.now();
  this.siegeBoundary.root.visible=true;
  try{
   for(const kind of ['crawler','brute','spitter','stalker','carrier','queen','brood-pod'])for(let i=0;i<(kind==='queen'?1:4);i++){
    const m=this.actorPool.take(kind,i===2);m.prepare?.();if(i===1&&(kind==='brute'||kind==='carrier'))m.setThreat?.(0,null,kind==='brute'?'warden':'matron',1);m.animate(0,1,0);if(i===3)setActorLOD(m.root,true);m.root.position.copy(this.focus);warm.add(m.root);models.push(m);await yieldTask();
   }
   for(const id of ['pistol','rifle','shotgun','plasma','rocket'] as const){this.player.equip?.(id);this.player.animate(0,0,0);await yieldTask();}this.player.equip?.('shotgun');useActorContactShadows(this.player.root,true);
   if(this.preparationTiming)this.preparationTiming.phases.actors=performance.now()-actorsStarted;
   this.scene.traverse(object=>{if(object instanceof T.Mesh)for(const material of Array.isArray(object.material)?object.material:[object.material])if(material instanceof T.MeshStandardMaterial&&!material.userData.retainedRoomWarmup)optimizeLocalLights(material);});
   registerGeometry(this.scene);registerGeometry(this.player.root,GEOMETRY_CLASSES.marine);registerGeometry(this.menuMarine.root,GEOMETRY_CLASSES.marine);registerGeometry(this.menuAlien.root,GEOMETRY_CLASSES.enemy);for(const model of models)registerGeometry(model.root,GEOMETRY_CLASSES.enemy);for(const model of this.actors.values())registerGeometry(model.root,model.root.userData.containmentGeometryClass??GEOMETRY_CLASSES.enemy);if(this.queen)registerGeometry(this.queen.root,GEOMETRY_CLASSES.boss);
   this.contextResources?.track(this.scene);this.contextResources?.track(this.hudScene);
   const textures=new Set<T.Texture>();this.scene.traverse(o=>{if(o instanceof T.Mesh)for(const material of Array.isArray(o.material)?o.material:[o.material])for(const value of Object.values(material))if(value instanceof T.Texture)textures.add(value);});
   const uploadsStarted=performance.now();for(const texture of textures){this.checkGraphicsGeneration(generation);const initialized=this.initializedTextures??=new WeakMap<T.Texture,number>();if(initialized.get(texture)!==texture.version){this.renderer.initTexture(texture);initialized.set(texture,texture.version);if(this.preparationTiming)this.preparationTiming.textureUploads++;}await yieldTask();}
   if(this.preparationTiming)this.preparationTiming.phases.uploads=performance.now()-uploadsStarted;
   this.camera.position.copy(this.focus).add(new T.Vector3(0,26,19));this.camera.lookAt(this.focus);this.scene.updateMatrixWorld(true);
   // Prepare the selected configuration. Graphics-setting changes hold readiness
   // and come through this same queue; warming six unused configurations here
   // multiplied the retained library again at the reactor's different key type.
   this.applyQuality();
   this.renderer.setRenderTarget(this.tier==='high'?warmTarget:null);this.renderer.toneMapping=this.tier==='high'?T.NoToneMapping:T.AgXToneMapping;
   this.renderer.setViewport(0,0,64,64);this.renderer.setScissor(0,0,64,64);this.renderer.setScissorTest(true);
   await this.compilePrepared(this.scene,this.camera);
   const uploadStarted=performance.now();
   this.renderer.shadowMap.needsUpdate=true;this.renderer.render(this.scene,this.camera);
   if(this.preparationTiming)this.preparationTiming.phases.warmRenderWithShadows=performance.now()-uploadStarted;
   // HUD skins and bars draw to the screen after HDR compositing, so they
   // require the screen color-space/tone-mapping program, not the HDR variant.
   this.renderer.setRenderTarget(null);this.renderer.toneMapping=mapping;
   await this.compilePrepared(this.hudScene,this.camera);
   this.renderer.setRenderTarget(this.playerBeacon.target);await this.compilePrepared(this.playerBeacon.maskScene,this.camera);
   this.renderer.setRenderTarget(this.tier==='high'?warmTarget:null);this.renderer.toneMapping=this.tier==='high'?T.NoToneMapping:T.AgXToneMapping;
   await this.post.prepare((scene,camera)=>this.compilePrepared(scene,camera));
  }finally{this.siegeBoundary.root.visible=false;this.lighting.pool.setPrewarmCount(null);this.applyQuality();this.preparationTargets.delete(warmTarget);warmTarget.dispose();restoreMaterials();restoreArena();restoreBackdrop();restoreAtmosphere();this.renderer.setRenderTarget(originalTarget);this.renderer.toneMapping=mapping;this.renderer.shadowMap.enabled=shadowEnabled;this.renderer.setScissorTest(false);this.resize();for(const m of models)this.actorPool.release(m);disposeModel(warm);this.shadowsDirty=true;}
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
 visible(x:number,y:number){const p=this.visiblePoint.set(x/UNIT,.6,y/UNIT).project(this.camera),v=this.hudFraming?.viewport??FULL_COMBAT_VIEWPORT;return combatPointVisible(p,v);}
 /** Fill caller-owned CSS bounds for a live body, including its authored family/rank height. */
 actorScreenBounds(id:number,x:number,y:number,radius:number,out:{left:number;top:number;right:number;bottom:number}):boolean {
  const model=id===-1?this.queen:this.actors.get(id);
  if(!model||!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius<0||!Number.isFinite(model.height))return false;
  const rect=this.canvasRect;if(!rect)return false;
  const point=this.screenPoint,base=model.root.position.y;
  out.left=out.top=Infinity;out.right=out.bottom=-Infinity;
  for(let ix=-1;ix<=1;ix+=2)for(let iz=-1;iz<=1;iz+=2)for(let iy=0;iy<2;iy++){
   point.set((x+ix*radius)/UNIT,base+iy*model.height,(y+iz*radius)/UNIT).project(this.camera);
   const px=rect.left+(point.x+1)*rect.width/2,py=rect.top+(1-point.y)*rect.height/2;
   out.left=Math.min(out.left,px);out.right=Math.max(out.right,px);out.top=Math.min(out.top,py);out.bottom=Math.max(out.bottom,py);
  }
  return Number.isFinite(out.left)&&Number.isFinite(out.right)&&Number.isFinite(out.top)&&Number.isFinite(out.bottom);
 }
 warningObstructs(left:number,top:number,right:number,bottom:number):boolean {
  return this.interimAbilities.priorityMask?.intersectsDanger(left/this.viewportWidth,top/this.viewportHeight,right/this.viewportWidth,bottom/this.viewportHeight) ?? false;
 }
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
  this.floorChoiceMarkers.resetReserve();
  this.cancelRoomPrefetch?.();this.cancelRoomPrefetch=undefined;this.prefetchKey='';
  const timing:RoomPreparationTiming={room:node.templateId,started:performance.now(),total:0,phases:{},compilePasses:0,textureUploads:0,programsBefore:this.renderer?.info?.programs?.length??0,programsAfter:0,materialProfiles:0};this.preparationTiming=timing;(this.preparationHistory??=[]).push(timing);if(this.preparationHistory.length>24)this.preparationHistory.shift();
  const keyChanged=(this.roomEnvironment==='reactor')!==(environment==='reactor');
  this.kitDressing?.dispose();this.kitDressing=undefined;
  this.communalGarden?.dispose();this.communalGarden=undefined;
  this.passengerVault?.dispose();this.passengerVault=undefined;
  this.residentialGalleryEquipment?.dispose();this.residentialGalleryEquipment=undefined;
  this.clearPools();
  this.sealedBank?.dispose();this.sealedBank=undefined;
  this.recoveryKit?.dispose();this.recoveryKit=undefined;
  this.releasedBerth?.dispose();this.releasedBerth=undefined;
  this.reflection?.invalidate();this.roomEnvironment=environment??'cryogenics';this.roomKey=node.id;this.shadowsDirty=true;disposeModel(this.world);this.temporaryMaterials.forEach(m=>m.dispose());this.temporaryMaterials=[];this.world=new T.Group();this.scene.add(this.world);this.effects.setWorld(this.world);
  for(const m of this.actors.values()){this.pincerPresentation.releaseActor(m);this.actorPool.release(m);}this.actors.clear();for(const n of this.nests.values())disposeModel(n);this.nests.clear();if(this.queen)this.actorPool.release(this.queen);this.queen=null;
  this.ragdolls?.dispose();this.marineDeathStarted=false;this.presentationHold?.reset();for(const c of this.corpses)this.actorPool.release(c.model);this.corpses=[];this.pickupInstances?.clear();this.effects.clear();this.interimAbilities.clear();this.afflictions.clear();this.pendingShots=[];this.projectileLightIds=new WeakMap();this.nextProjectileLight=-1000;this.muzzleLife=0;this.recoil=0;
  const t=ROOM_TEMPLATES[node.templateId],w=t.width/UNIT,h=t.height/UNIT;this.roomWidth=w;this.roomHeight=h;
  const atrium=node.templateId==='communal-atrium';
  this.hitPips.clear();this.overdriveReactions.reset();this.corpseIds?.clear();this.staticDirty=false;const staticLoaded=this.staticLoaded(this.world);
  this.muzzle.intensity=0;this.contacts.begin();this.contacts.end();
  this.aheadRooms?.clearPending();const cached=this.aheadRooms?.take(node);const bespoke=cached!==undefined?cached:this.buildRoomArchitecture(node,t);
  const act=Math.min(2,Math.floor(node.depth/4));this.surfaces.theme(act);if(environment)this.surfaces.shipTheme(environment);
  // Room-local habitation finish; theme() resets it on every subsequent room.
  if(node.templateId==='residential-gallery'){this.surfaces.floor.color.setHex(0x747976);this.surfaces.wall.color.setHex(0x788687);}
  if(atrium){this.surfaces.floor.color.setHex(0x77766c);this.surfaces.wall.color.setHex(0x777a6e);this.surfaces.cover.color.setHex(0x64695e);}
  if(bespoke){if(node.templateId==='service-shaft-landing'){this.appendShaftArchitecture(bespoke);}else this.world.add(bespoke);if(bespoke.userData.templateArchitecture&&node.templateId==='residential-gallery'){const fallback=bespoke.getObjectByName('residential-gallery-equipment-fallback');if(fallback)this.world.add(fallback);}
  if(node.templateId==='passenger-vault')this.passengerVault=attachPassengerVault(bespoke,staticLoaded);if(node.templateId==='awakening-bay'){this.sealedBank=attachSealedBank(bespoke,staticLoaded);this.releasedBerth=attachReleasedBerth(bespoke,staticLoaded);this.recoveryKit=attachRecoveryKit(bespoke,staticLoaded);}}else{
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
  if(atrium){this.world.add(communalAtrium(t));const architecture=act1ShipPresentation(node.templateId,t);if(architecture)this.world.add(architecture);}
  for(const [obstacleIndex,r] of (atrium?[]:t.obstacles).entries()){
   const x=(r.x+r.width/2)/UNIT,z=(r.y+r.height/2)/UNIT,rw=r.width/UNIT,rh=r.height/UNIT;
   if(residentialFallback){residentialFallback.add(environmentObstacle('habitation',{x:r.x/UNIT,y:r.y/UNIT,width:rw,height:rh},obstacleIndex,node.templateId,this.roomSeed(node.id)));continue;}
   if(environment){appendEnvironment(this.world,environmentObstacle(environment,{x:r.x/UNIT,y:r.y/UNIT,width:rw,height:rh},obstacleIndex,node.templateId,this.roomSeed(node.id)));continue;}
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
  for(const x of [1.35,w-1.35])for(let z=2;!atrium&&z<h-2;z+=1.2)box(this.world,x,.012,z,.075,.015,.6,MAT.industrialPaint,0);
  // Overhead utility pipes along the back edge, independently lit panels and vents.
  for(const z of [.42,.72]){rod(this.world,new T.Vector3(.4,2.65,z),new T.Vector3(w-.4,2.65,z),.09,.09,MAT.edge);}
  for(let x=3;x<w;x+=6){box(this.world,x,2.65,.58,.12,.28,.8,MAT.dark);}
  for(const b of t.breaches){const x=b.x/UNIT,z=b.y/UNIT;box(this.world,x,.04,z,1.25,.06,1.1,MAT.black);for(let i=-4;i<=4;i++)box(this.world,x+i*.12,.085,z,.05,.04,.9,MAT.edge,.01);}
  if(environment&&!atrium)environmentArchitecture(this.world,environment,w,h,node.templateId,this.roomSeed(node.id));
  if(node.templateId==='reactor-vault'){const hot=MAT.cyan.clone();hot.name='ship-cold-practical';hot.userData.actorMaterial=true;this.world.traverse(object=>{if(object instanceof T.Mesh&&object.material===MAT.cyan)object.material=hot;});}
  this.bakeWorld();
  }
  if(node.templateId==='residential-gallery'&&!bespoke)this.residentialGalleryEquipment=attachResidentialGalleryEquipment(this.world,staticLoaded);
  if(atrium)this.communalGarden=attachCommunalGarden(this.world,t,staticLoaded);
  this.exit=new T.Group();this.exit.position.set(t.exit.x/UNIT,0,t.exit.y/UNIT);this.world.add(this.exit);
  for(const side of [-1,1]){box(this.exit,0,.7,side*.7,.12,1.4,.18,MAT.steel);box(this.exit,.08,.7,side*.7,.04,1.05,.05,MAT.cyan,.01);}
  box(this.exit,0,1.5,0,.2,.2,1.6,MAT.dark);box(this.exit,0,.035,0,1.7,.02,1.55,MAT.dark);
  // Rigid exit parts share finishes and transforms; retain three merged draws.
  batch(this.exit,true);
  // Flat markings and obstacle-supported dressing are registered before room preparation.
  addExitSignal(this.exit);addDeckMarkings(this.world,t,this.roomEnvironment,node.templateId);addWorldDressing(this.world,t,this.roomEnvironment,node.templateId,this.roomSeed(node.id),this.kitStartupComplete&&this.gameplayPresentationStarted&&(node.templateId==='residential-gallery'||node.templateId==='relay-racks'));if(!ACT3_PRESENTATION_ROOMS.has(node.templateId)&&!bespoke?.getObjectByName('l8-ship-seam-growth'))addEnvironmentalStory(this.world,t,this.roomEnvironment,node.templateId,this.roomSeed(node.id));setCeilingQuality(this.world,this.tier==='high');setOriginalShipKitQuality(this.world,this.tier==='high');setEnvironmentalStoryOptions(this.world,this.tier==='high'&&this.options.atmosphere,node.templateId);
  this.world.userData.incidentObstacles=t.incidentObstacles;
  if(this.colliderDebug)showIncidentColliders(this.world,true);
  const interiors=buildRoomInteriors(node.templateId,t,this.world);if(interiors)this.world.add(interiors);
  const initial=roomFocus(t.spawn.x/UNIT,t.spawn.y/UNIT,w,h,this.camera instanceof T.OrthographicCamera?this.camera.right-this.camera.left:this.viewWidth,this.camera instanceof T.OrthographicCamera?this.camera.top-this.camera.bottom:this.viewHeight,node.templateId);
  if(node.templateId==='passenger-vault'){initial.x-=1.4;initial.z+=2.7;}
  this.focus.set(initial.x,0,initial.z);this.cameraRig?.reset(initial.x,initial.z);this.roomCombatFraming?.reset();/* CAM12: retain HUD reservations across rooms; the adapter caches unchanged CSS bounds. */this.world.userData.lightingBoundary=t.boundary?.map(p=>({x:p.x/UNIT,y:p.y/UNIT}));if((!bespoke&&node.templateId!=='armory')||this.roomEnvironment==='containment')addRoomPracticals(this.world,w,h,this.roomEnvironment,this.roomEnvironment==='reactor'?undefined:this.world.userData.lightingBoundary,atrium);addInteriorPracticals(this.world,t,this.roomEnvironment,node.templateId==='residential-gallery');const batchStarted=performance.now();this.world.userData.staticBatching=batchStaticRoom(this.world);timing.phases.staticBatching=performance.now()-batchStarted;const lightingStarted=performance.now();this.lighting.loadRoom(this.world,w,h,environment,node.templateId);{const pools=deckLightSources(t).filter(p=>p.z>=1).map(p=>({x:p.x,z:p.y}));setRoomValueField(pools.length?pools:[{x:w/2,z:h/2}],t.exit.x/UNIT,t.exit.y/UNIT,roomValueProfile(node.templateId));}this.floorMaterial.userData.roomBaseColor=(this.floorMaterial.userData.roomBaseColor??new T.Color()).copy(this.floorMaterial.color);applyRoomMood(this.world,environment,node.templateId,this.lighting.practicalShapes);timing.phases.lightingSetup=performance.now()-lightingStarted;
  const leaks=this.world.getObjectByName('g2-world-dressing')?.userData.leakPositions??[];this.world.traverse(object=>{if(object instanceof T.Mesh)for(const material of Array.isArray(object.material)?object.material:[object.material])if(material instanceof T.MeshStandardMaterial)setFloorLeaks(material,leaks);});
  const mood=getEnvironmentMood(environment);this.scene.fog=new T.FogExp2(mood.fog.color,mood.fog.density*.25);this.scene.background=new T.Color(mood.fog.color).multiplyScalar(.24);this.scene.environmentIntensity=mood.reflectionIntensity;this.post?.setMood(mood);this.atmosphere?.loadRoom(environment,w,h,this.lighting.fixtures);this.backdrop?.loadRoom(this.world,w,h,environment);this.arena?.loadRoom(node.templateId,w,h);this.post?.distortion.clear();this.heatClock=0;
  if(this.kitStartupComplete&&this.gameplayPresentationStarted&&KIT_STANDARD_ROOMS.has(node.templateId)){
   const kitWorld=this.world,changed=()=>{if(this.world!==kitWorld)return;setCeilingQuality(kitWorld,this.tier==='high');setOriginalShipKitQuality(kitWorld,this.tier==='high');const lightingStarted=performance.now();if(INTERIOR_ROOMS.has(node.templateId))this.lighting.loadRoom(kitWorld,w,h,this.roomEnvironment,node.templateId);applyRoomMood(kitWorld,this.roomEnvironment,node.templateId,this.lighting.practicalShapes);timing.phases.lightingSetup+=performance.now()-lightingStarted;staticLoaded();};
   this.kitDressing=INTERIOR_ROOMS.has(node.templateId)?attachOriginalRoomInteriors(kitWorld,t,changed,Promise.all([this.passengerVault?.ready,this.communalGarden?.ready,this.residentialGalleryEquipment?.ready]),()=>this.tier==='high',this.renderer,(phase,ms)=>{timing.phases[phase]=(timing.phases[phase]??0)+ms;}):attachRoomKits(kitWorld,t,this.roomEnvironment,node.templateId,changed,this.residentialGalleryEquipment?.ready);
  }
  this.effects.prepareWallSurfaces();
  const newProfiles=this.materialWarmup?.register(this.world)??0;this.contextResources?.track(this.world);this.ragdolls?.setRoom(t,this.world);this.staticDirty=false;timing.phases.build=performance.now()-timing.started;if(this.materialWarmup&&(newProfiles||this.forceRoomWarm||keyChanged||this.kitStartupComplete&&this.gameplayPresentationStarted&&!this.interimAbilities.kit?.atlas.loaded))this.queueRoomWarmup();
 }
 private roomSeed(id:string){let seed=2166136261;for(let i=0;i<id.length;i++)seed=Math.imul(seed^id.charCodeAt(i),16777619);return seed>>>0;}
 private wallPanel(x:number,z:number,height:number,length:number,rotation:number){
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotation;
  this.surfaces.uv(box(g,0,height/2,0,length,height,.32,this.surfaces.wall),2);box(g,0,height/2,.19,length-.17,height-.15,.12,this.surfaces.cover);box(g,0,height+.015,0,length,.08,.48,MAT.edge);
  for(const side of [-1,1])box(g,side*(length/2-.1),height/2,.22,.11,height,.12,MAT.edge,.015);
  g.updateMatrix();for(const child of [...g.children]){child.applyMatrix4(g.matrix);this.world.add(child);}
 }
 private readonly hitPips = new Map<number,{count:number;until:number}>();
 noteHitPips(id:number,count=1) {
  const previous=this.hitPips.get(id);
  this.hitPips.set(id,{count:Math.min(5,count+(previous&&previous.until>this.time?previous.count:0)),until:this.time+.35});
 }
 private arrivalWoundTimes=new Map<number,number>();
 private arrivalReleases=new Map<number,{effect:GameEffect;at:number}>();
 effect(effect:GameEffect){
  if(effect.reserveCut){
   this.floorChoiceMarkers.closeReserve(effect.x,effect.y,effect.reserveCut.closedEntry);
   return;
  }
  this.overdriveReactions.event(effect,this.actors,this.corpses,this.interimAbilities.kit ?? undefined);
  const hold=combatPresentationHoldSeconds(effect);if(hold)this.presentationHold?.request(hold,this.options.screenShake,!!this.motionQuery?.matches);
  if(effect.type==='ability'){this.player?.motionEvent?.(effect);if(effect.ability){this.interimAbilities.event(effect.ability,effect.x,effect.y);}return;}
  const x=effect.x/UNIT,z=effect.y/UNIT;
  if(effect.type==='hurt'){/* FEEL12: native receipt drives a stable incoming-side marker. */if(effect.sourceX!==undefined&&effect.sourceY!==undefined||effect.angle!==undefined)this.playerBeacon.hit(effect.sourceX!==undefined&&effect.sourceY!==undefined?Math.atan2(effect.sourceY-effect.y,effect.sourceX-effect.x):(effect.angle??0)+Math.PI,(this.options.flashIntensity??1)*(this.motionQuery?.matches?.65:1));this.cameraRig?.addTrauma(.34);this.cameraRig?.punch(.015,180);actorImpact(this.player,effect);if(effect.selfBlast)this.effects.event(effect);return;}if(effect.type==='sync-corpse')return;
  if(effect.type==='explosion'||(effect.type==='boon'&&(effect.boon==='blast'||(effect.boon==='overload'&&effect.radius!==undefined)))){this.lighting.explosion(x,z,(effect.radius??48)/UNIT);this.cameraRig?.addTrauma(.32);this.cameraRig?.punch(.035,240);}
  if(effect.type==='shot'){
   this.recoil=1;this.cameraRig?.kick(effect.angle??0,effect.weapon==='shotgun'?.08:effect.weapon==='rocket'?.12:.025);if(this.pendingShots.length<4)this.pendingShots.push(effect);return;
  }
  if(effect.type==='recovery-stagger'&&effect.id!==undefined)this.actors.get(effect.id)?.recoveryStagger?.();
  if(effect.type==='enemy-attack'){if(effect.id===-1)this.queen?.attack?.();else this.actors.get(effect.id!)?.attack?.();}
  let motionDeathCue:'none'|'frost'|'burn'|'arc'|'acid'='none';
  if(effect.type==='corpse'){
   if(effect.id===undefined)return;
   this.corpseIds??=new Set();if(this.corpseIds.has(effect.id))return;this.corpseIds.add(effect.id);
   let existing=this.actors.get(effect.id!);if(!existing&&effect.family){existing=this.actorPool.take(effect.family,effect.elite);existing.root.position.set(x,0,z);registerGeometry(existing.root,GEOMETRY_CLASSES.enemy);this.scene.add(existing.root);}if(existing){this.pincerPresentation.releaseActor(existing);motionDeathCue=actorDeathCue(existing);existing.root.userData.motionDeathCue=motionDeathCue;existing.root.position.set(x,0,z);freezeCorpse(existing);this.ragdolls.add(effect.id!,existing,effect.family??existing.root.name.replace('alien-',''),{x:(effect.vx??0)/UNIT,z:(effect.vy??0)/UNIT},motionDeathCue,this.motionQuery?.matches?0:.032*Math.min(this.options.screenShake,this.options.flashIntensity));this.actors.delete(effect.id!);this.corpses.push({pendingEffect:effect,model:existing,id:effect.id!,x,y:z,vx:(effect.vx??0)/UNIT,vy:(effect.vy??0)/UNIT,height:.2,lift:3,spin:2.4,age:0});if(this.corpses.length>(this.tier==='low'?6:10)){const oldest=this.corpses.shift()!;this.ragdolls.remove(oldest.id);this.actorPool.release(oldest.model);}}
  }
  // FEEL12: presentation family survives native lethal-event actor retirement.
  let targetModel=effect.targetId===undefined?undefined:effect.targetId===-1?this.queen:this.actors.get(effect.targetId);
  if(!targetModel&&effect.targetId!==undefined)for(const corpse of this.corpses)if(corpse.id===effect.targetId){targetModel=corpse.model;break;}
  // The killing weapon receipt can follow the corpse receipt within one native tick.
  if(effect.planReaction){
   const marine=new T.Vector3().setFromMatrixPosition(this.player.root.matrixWorld);
   const actual=new T.Vector3(x,.1,z);
   if(actual.distanceTo(marine)>7||!this.visible(effect.x,effect.y)){
    const direction=actual.sub(marine).normalize();
    const near=marine.clone().addScaledVector(direction,2.5);
    if(!this.visible(near.x*UNIT,near.z*UNIT))near.copy(marine).addScaledVector(direction,.8);
    this.effects.event({type:'boon',boon:'shield',x:near.x*UNIT,y:near.z*UNIT,radius:20});
   }
  }
  if(effect.type==='arrival-wound'&&effect.targetId!==undefined)this.arrivalWoundTimes.set(effect.targetId,this.time);
  if(effect.type==='arrival-wound'&&targetModel){
   targetModel.root.userData.arrivalWoundGlow=Math.min(.8,(targetModel.root.userData.arrivalWoundGlow??0)+(effect.damage??0)/80);
   targetModel.hit?.(Math.min(1,.2+(effect.damage??0)/65));
  }
  if(effect.type==='arrival-recovery'&&effect.id!==undefined){
   const at=(this.arrivalWoundTimes.get(effect.id)??-Infinity)+.16;
   if(this.time<at){this.arrivalReleases.set(effect.id,{effect,at});return;}
   this.arrivalWoundTimes.delete(effect.id);
   const actor=this.actors.get(effect.id)??this.corpses.find(c=>c.id===effect.id)?.model;
   if(actor){
    actor.root.userData.arrivalWoundGlow=0;
    if(effect.damage)actor.hit?.(Math.min(1,.3+effect.damage/65));
   }
  }
  if(effect.contact==='damage'||effect.contact==='armor')actorImpact(targetModel??undefined,effect);
  if(effect.type==='corpse'&&this.corpses[this.corpses.length-1]?.pendingEffect===effect)return;
  this.effects.event(effect,motionDeathCue,targetModel?.root.name.replace('alien-',''));
 }
 syncCorpse(id:number,x:number,y:number){const corpse=this.corpses.find(c=>c.id===id);if(corpse){corpse.x=x/UNIT;corpse.y=y/UNIT;corpse.vx=corpse.vy=0;if(this.ragdolls.has(id))this.ragdolls.sync(id,x/UNIT,y/UNIT);else{corpse.model.root.position.x=x/UNIT;corpse.model.root.position.z=y/UNIT;}}}
 get roomLoading(){return this.kitDressing?.state==='loading'||this.roomWarmPending||this.recoveringGraphics||this.communalGarden?.state==='loading'||this.residentialGalleryEquipment?.state==='loading'||this.passengerVault?.state==='loading'||this.recoveryKit?.state==='loading'||this.sealedBank?.state==='loading'||this.releasedBerth?.state==='loading';}
 render(game:DepthGame,delta:number,menu=false){
  if(this.roomKey!==game.node.id){this.arrivalWoundTimes.clear();this.arrivalReleases.clear();this.loadRoom(game.node);}
  for(const [id,release] of this.arrivalReleases){
   if(this.time<release.at)continue;
   this.arrivalReleases.delete(id);
   this.effect(release.effect);
  }
  // RUN15 condition presentation consumes the room's deterministic state.
  const condition=menu?null:game.conditionState,blackout=condition?.condition.id==='dark';
  this.conditionVisuals.update(this.graphicsAblation==='conditions'?null:condition,this.tier==='low',!!this.motionQuery?.matches,game,this.lighting.pool,this.interimAbilities.priorityMask?.texture);
  setRoomBlackout(blackout);
  this.lighting.setBlackout(blackout);
  this.scene.environmentIntensity=getEnvironmentMood(this.roomEnvironment).reflectionIntensity*(blackout?.12:1);
  // ImageBitmap completion shares browser/GPU scheduling with WebGL. Do not
  // queue expensive fallback frames ahead of the room's bounded optional decode.
  // Main freezes gameplay/input until a settled room frame has rendered.
  // Both owners retain their independent 8-second fallback deadlines.
  if(this.roomLoading)return;
  if(!menu&&game.status==='playing'&&this.prefetchKey!==game.node.id){
   this.prefetchKey=game.node.id;
   const next=generateRun(game.expedition.run.seed,game.expedition.run.version,game.expedition.run.roomOrder).nodes.find(node=>game.node.next.includes(node.id));
   if(next&&INTERIOR_ROOMS.has(next.templateId))this.cancelRoomPrefetch=prefetchOriginalRoomInteriors(ROOM_TEMPLATES[next.templateId],this.renderer);
  }
  if((game.status==='reward'||game.status==='route')&&this.aheadKey!==game.node.id){this.aheadKey=game.node.id;const nodes=generateRun(game.expedition.run.seed,game.expedition.run.version,game.expedition.run.roomOrder).nodes;this.prepareAhead(nodes.filter(node=>game.node.next.includes(node.id)));}
  this.captureRoomReflections();
  if(game.status!=='playing'){for(const model of this.actors.values())model.hit?.(0);this.queen?.hit?.(0);}
  const realDt=game.status==='paused'||game.status==='reward'||game.status==='route'?0:Math.min(delta,.05);const dt=this.presentationHold?.advance(realDt,this.options.screenShake,!!this.motionQuery?.matches)??realDt;this.time+=dt;const p=game.player;
  const bounds=game.geometry.bounds,enemies=game.enemies.snapshot.enemies;
  this.floorChoiceMarkers.updateReserve(game.geometry.breaches,UNIT,realDt);
  this.floorChoiceMarkers.update(menu?[]:game.floorControls,game.geometry.breaches,UNIT,menu?undefined:game.siege,menu?undefined:game.relayShutterFrame,menu?undefined:game.relayShelter);
  this.siegeBoundary.update(menu?null:game.siege,p,enemies);
  this.pincerPresentation.update(game, UNIT, realDt, menu);
  const bossFrame=game.boss.snapshot,bossWeight=!menu&&bossFrame.active&&!bossFrame.defeated,baseZoom=menu?1.23:bossWeight?.78:1;
  combatFocusTarget(p.x/UNIT,p.y/UNIT,p.angle,bossFrame.x/UNIT,bossFrame.y/UNIT,bossWeight,!!this.motionQuery?.matches||menu,this.desiredFocus);
  const hud=this.hudFraming??=new HudCombatFraming();hud.selectContacts(p.x/UNIT,p.y/UNIT,p.angle,enemies,UNIT,this.cameraContactHeight,this.camera,this.hudCoachedTargetId);if(bossWeight)hud.selectPrimaryContact(-1,bossFrame.x/UNIT,bossFrame.y/UNIT,3.4,this.queen?.height??4.5);/* I13: tall guardian anatomy must stay paired with the marine during brood/charge. */else{const guardian=enemies.find(e=>e.champion&&e.health>0&&Math.hypot(e.x-p.x,e.y-p.y)<12.5*UNIT);if(guardian)hud.selectPrimaryContact(guardian.id,guardian.x/UNIT,guardian.y/UNIT,guardian.radius/UNIT,this.cameraContactHeight(guardian.id));}hud.biasTarget(p.x/UNIT,p.y/UNIT,p.angle,!!this.motionQuery?.matches,bossWeight,this.desiredFocus);
  const framed=roomFocus(this.desiredFocus.x,this.desiredFocus.z,bounds.width/UNIT,bounds.height/UNIT,this.viewWidth/baseZoom,this.viewHeight/baseZoom,game.node.templateId,this.frameFocus);
  if(!hud.hasEngagement||bossWeight)this.desiredFocus.set(framed.x,0,framed.z);if(menu){this.desiredFocus.set(22,0,14);if(!this.lastMenu)this.cameraRig.reset(22,14);}
  if(!menu&&game.node.templateId==='passenger-vault'&&!hud.hasEngagement){
   const spawn=game.geometry.playerSpawn;
   const entry=1-T.MathUtils.smoothstep(Math.hypot(p.x-spawn.x,p.y-spawn.y),0,155);
   this.desiredFocus.x-=1.4*entry;
   this.desiredFocus.z+=2.7*entry;
  }
  // WARN16 look-ahead precedes the existing room AABB and marine-envelope fit.
  if(!menu&&!bossWeight)hud.biasBottomThreat(this.camera,p.x/UNIT,p.y/UNIT,enemies,this.effects,this.desiredFocus,this.screenPoint,this.hudCoachedTargetId);
  const encounterFocus=menu?undefined:game.sealedEntryBearing?.to??game.shutterCameraPoint??game.manualExchange?.bait;
  if(encounterFocus){
   const dx=encounterFocus.x/UNIT-this.desiredFocus.x,dz=encounterFocus.y/UNIT-this.desiredFocus.z;
   const weight=Math.min(.55,4/Math.max(1,Math.hypot(dx,dz)));
   this.desiredFocus.x+=dx*weight;
   this.desiredFocus.z+=dz*weight;
  }
  if(condition?.condition.id==='vent'&&condition.ventLive&&dt>0)this.cameraRig.setRumbleFloor(.19);
  this.cameraRig.update(dt,this.desiredFocus.x,this.desiredFocus.z,this.options.screenShake,!!this.motionQuery?.matches);this.cameraRig.apply(this.camera,baseZoom,this.viewHeight,this.options.screenShake);this.focus.copy(this.cameraRig.focus);
  if(menu)this.title?.apply(this.camera,this.time,!!this.motionQuery?.matches,this.tier==='high'&&this.options.atmosphere);
  if(this.title)this.title.root.visible=menu;this.world.visible=!menu;if(this.backdrop)this.backdrop.root.visible=!menu;
  if(!menu)hud.center(this.camera,this.cameraRig.focus,this.screenPoint,this.screenTarget);

  this.effects.beginPriorityActors(this.camera);if(!menu)this.effects.addPriorityActor(p.x/UNIT,p.y/UNIT,Math.max(p.radius/UNIT,.78),this.player.height);
  // The shadow projection remains anchored to the room, avoiding subpixel shimmer.
  this.player.setColliderDebug?.(this.colliderDebug,p.radius/UNIT);if(!this.ragdolls.has(-2147483648))this.player.root.position.set(p.x/UNIT,0,p.y/UNIT);this.player.root.visible=!menu;this.player.root.rotation.z=0; // M10 death belongs to bones
  const combat=game.combat.snapshot;this.player.equip?.(combat.weaponId);
  this.player.setRig?.(game.abilities?.snapshot.rig??'breacher');this.menuMarine?.setRig?.(game.abilities?.snapshot.rig??'breacher');
  // M9: preferences scale secondary motion; authoritative roots remain snapshot-owned.
  this.player.setMotionOptions?.(Math.min(this.options.screenShake,this.options.flashIntensity),!!this.motionQuery?.matches);this.player.setDead?.(combat.dead);
  if(!combat.dead){this.ragdolls.remove(-2147483648);this.marineDeathStarted=false;}
  this.playerVelocity.x=p.vx;this.playerVelocity.y=p.vy;if(!this.ragdolls.has(-2147483648))this.player.animate(this.time,p.moving?1:0,p.angle,this.recoil,combat.reloading?Math.max(.001,1-combat.reloadRemainingMs/combat.reloadDurationMs):0,this.playerVelocity);this.recoil=Math.max(0,this.recoil-dt*14);
  // M10: one articulated marine death; native killing direction, retained physics owner.
  if(combat.dead&&!this.marineDeathStarted){this.marineDeathStarted=true;const direction=this.player.root.userData.motionHitDirection??p.angle;if(this.corpses.length&&this.ragdolls.snapshot().active>=this.ragdolls.snapshot().budget){const oldest=this.corpses.shift()!;this.ragdolls.remove(oldest.id);this.actorPool.release(oldest.model);}this.ragdolls.add(-2147483648,this.player,'marine',{x:Math.cos(direction)*5,z:Math.sin(direction)*5},'none');}
  this.lighting.setMenu?.(menu);if(this.lighting.setPlayer(menu?TITLE_STAGE.marine.x:p.x/UNIT,menu?TITLE_STAGE.marine.z:p.y/UNIT,menu?TITLE_STAGE.marine.angle:p.angle,this.camera))this.atmosphere?.syncFixtures(this.lighting.fixtures);
  const active=this.activeActorIds;active.clear();
  this.actorPoseFrustum.setFromProjectionMatrix(this.actorPoseMatrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse));
  // M10: borrow this settled frustum for warning GPU instances only.
  this.effects.setWarningFrustum(this.actorPoseFrustum);
  // PERF13: keep the nearest four and all close silhouettes at authored detail.
  this.lodDistances.fill(Infinity);for(const e of enemies){const d=(e.x-p.x)**2+(e.y-p.y)**2;for(let i=0;i<4;i++)if(d<this.lodDistances[i]){for(let j=3;j>i;j--)this.lodDistances[j]=this.lodDistances[j-1];this.lodDistances[i]=d;break;}}
  // E10: contact-only actor pool changes do not invalidate the static architecture atlas.
  let queuedBite=-1;
  if(enemies.some(e=>e.type==='crawler' && (e.meleePhase==='strike'||e.meleePhase==='recovery' && e.meleeProgress<.35))){
   let nearest=Infinity;
   for(const e of enemies){
    if(e.type!=='crawler'||e.meleePhase!=='approach'||e.engagement!=='waiting')continue;
    const distance=(p.x-e.x)**2+(p.y-e.y)**2;
    if(distance<nearest){nearest=distance;queuedBite=e.id;}
   }
  }
  for(const e of enemies){active.add(e.id);let model=this.actors.get(e.id);/* I13: native pod hatch swaps static art to the living caste. */if(model&&!!model.root.userData.broodPod!==!!e.pod){this.actorPool.release(model);this.actors.delete(e.id);model=undefined;}if(!model){model=this.actorPool.take(e.pod?'brood-pod':e.type,e.elite);useActorContactShadows(model.root,true);model.setMotionSeed?.(e.id);model.setFlashIntensity?.(this.options.flashIntensity);this.actors.set(e.id,model);registerGeometry(model.root,e.champion?GEOMETRY_CLASSES.boss:GEOMETRY_CLASSES.enemy);this.scene.add(model.root);this.contextResources?.track(model.root);}if(!menu)this.effects.addPriorityActor(e.x/UNIT,e.y/UNIT,e.radius/UNIT,model.height);model.setColliderDebug?.(this.colliderDebug,e.radius/UNIT);model.root.position.set(e.x/UNIT,0,e.y/UNIT);model.setStageLight?.(blackout&&Math.hypot(e.x-p.x,e.y-p.y)>CONDITION_LIGHT_RADIUS?.12:1);const status=game.boonStatuses(e.id);model.setAffliction?.(status);model.root.userData.visualStatus=status;model.setMotionOptions?.(Math.min(this.options.screenShake,this.options.flashIntensity),!!this.motionQuery?.matches);model.setExposed?.(e.maxArmor>0&&e.armor===0);model.setThreat?.(e.windupMs,e.pendingAttack,e.champion,e.alpha);/* I13: presentation follows authoritative guardian clocks. */model.setBossState?.(e.champion||(e.type==='brute'&&e.maxArmor>0&&e.armor<=0)?e.stunRemainingMs??0:0,e.broodRemainingMs??0,e.chargeMs,e.specialCooldownMs);if(e.pod)model.setPodCountdown?.(e.podRemainingMs??0,e.podStage);const ordinary=!e.champion&&!e.pod;
   const ranged=e.engagement==='ranged';
   const waiting=!!e.readyBehaviour||ordinary&&!e.attackSlot&&!e.pendingAttack&&e.meleePhase==='approach'&&
     (e.engagement==='waiting'||ranged)&&Math.hypot(e.x-p.x,e.y-p.y)<(ranged?440:e.meleeShape.range+110);
   const feintProgress='feintProgress' in e&&typeof e.feintProgress==='number'?e.feintProgress:undefined;
   const laneCut=e.laneCutter&&e.readyBehaviour==='pace';
   const dx=e.targetX-e.x,dy=e.targetY-e.y;
   const paceSide=laneCut?((p.x-e.x)*dy-(p.y-e.y)*dx>=0?1:-1):0;
   model.setWaitingState?.(waiting,ordinary?feintProgress:undefined,ordinary,paceSide,laneCut&&Math.hypot(dx,dy)<e.radius);
   if(e.type==='crawler')model.setQueuedBite?.(e.id===queuedBite);
   model.setAttackState?.(e.meleePhase,e.meleeProgress,e.meleeAngle,e.meleeShape);this.actorPoseBounds.center.set(e.x/UNIT,model.height*.5,e.y/UNIT);this.actorPoseBounds.radius=Math.hypot(model.height*.6,e.radius/UNIT*1.35)+.4+/* C10: footprint-scaled presentation travel culling. */ ((e.type==='stalker'||e.type==='crawler')&&e.meleePhase!=='approach'?e.meleeShape.range/UNIT:0);model.root.userData.perf13CullRadius=this.actorPoseBounds.radius;model.setMotionVisible?.(this.actorPoseFrustum.intersectsSphere(this.actorPoseBounds),e.engagement==='waiting'&&e.meleePhase==='approach'&&!status.chilled&&!status.burning&&!status.poisoned&&!status.frozen&&!status.shocked);this.playerVelocity.x=e.velocityX;this.playerVelocity.y=e.velocityY;const pose=this.pincerPresentation.retreatPose(model,game,e,UNIT,enemyMotionAim(e,p),Math.hypot(e.velocityX,e.velocityY)>2?1:.12,this.playerVelocity);model.animate(this.time+e.id,pose.stride,pose.angle,0,0,this.playerVelocity);this.pincerPresentation.bossPose(model,e,game,UNIT);setActorLOD(model.root,!e.pod&&!e.elite&&!e.champion&&(this.actorLODStudy==='low'||this.actorLODStudy!=='full'&&(e.x-p.x)**2+(e.y-p.y)**2>Math.max((3*UNIT)**2,this.lodDistances[3])));}
  for(const [id,model]of this.actors)if(!active.has(id)){this.pincerPresentation.releaseActor(model);this.actorPool.release(model);this.actors.delete(id);}
  for(const [id,pips] of this.hitPips)if(pips.until<=this.time)this.hitPips.delete(id);
  let healthCount=0;for(const e of enemies){if(healthCount===128)break;if(blackout&&Math.hypot(e.x-p.x,e.y-p.y)>CONDITION_LIGHT_RADIUS)continue;const bar=this.healthEntries[healthCount++];bar.x=e.x/UNIT;bar.z=e.y/UNIT;bar.height=this.actors.get(e.id)?.height??1;bar.health=e.health;bar.maxHealth=e.maxHealth;bar.elite=e.elite||!!e.champion;bar.armor=e.armor;bar.hits=this.hitPips.get(e.id)?.count;this.actors.get(e.id)?.setPlateOpen?.(e.maxArmor>0?Math.floor(3*(1-e.armor/e.maxArmor))/3:0);bar.status=this.actors.get(e.id)?.root.userData.visualStatus;}for(const n of game.boss.snapshot.nests){if(healthCount===128)break;const bar=this.healthEntries[healthCount++];bar.x=n.x/UNIT;bar.z=n.y/UNIT;bar.height=1.35;bar.health=n.health;bar.maxHealth=n.maxHealth;bar.elite=false;bar.armor=0;bar.hits=undefined;bar.status=undefined;}for(let i=healthCount;i<128;i++)this.healthEntries[i].health=0;
  this.menuActors.visible=menu;
  if(menu){this.menuMarine.root.position.set(TITLE_STAGE.marine.x,0,TITLE_STAGE.marine.z);this.menuAlien.root.position.set(TITLE_STAGE.creature.x,0,TITLE_STAGE.creature.z);this.menuMarine.animate(this.time,0,TITLE_STAGE.marine.angle);this.menuThreatClock=this.motionQuery?.matches?0:this.menuThreatClock+dt;if(this.menuThreatClock>5.5){this.menuAlien.attack?.();this.menuThreatClock=0;}this.menuAlien.animate(this.time,.12,TITLE_STAGE.creature.angle);}else this.menuThreatClock=0;
  this.lastMenu=menu;
  const q=game.boss.snapshot;this.lighting.setBossState?.(q.x/UNIT,q.y/UNIT,q.vulnerable,q.defeated);
  this.warning.visible=false;
  // ROOM14 shares pickups and live hazard footprints between scenery cutaways.
  const visiblePickups=game.pickups.snapshot;
  this.roomCutawayTargets.update(visiblePickups,game,this.effects);
  if(!menu)updateOriginalInteriorCutaways(this.world.getObjectByName('e9-original-ship-kit'),this.camera,p,this.player.height,enemies,this.actors,this.roomCutawayTargets);
  const telegraph=q.pendingTelegraph;this.effects.setBossWarning((telegraph?.targetX??0)/UNIT,(telegraph?.targetY??0)/UNIT,(telegraph?.radius??0)/UNIT,1-(telegraph?.delayRemainingMs??0)/AREA_ATTACK_DELAY_MS,!!telegraph&&!menu);
  this.syncPools(game.pools);

  if(q.active&&!this.queen){this.queen=this.actorPool.take('queen');registerGeometry(this.queen.root,GEOMETRY_CLASSES.boss);this.queen.setFlashIntensity?.(this.options.flashIntensity);this.scene.add(this.queen.root);this.contextResources?.track(this.queen.root);}
  if(this.queen){if(!menu&&!q.defeated)this.effects.addPriorityActor(q.x/UNIT,q.y/UNIT,92/UNIT,this.queen.height);this.queen.setColliderDebug?.(this.colliderDebug,92/UNIT);this.queen.setExposed?.(q.vulnerable);this.queen.setAffliction?.(q.defeated?{chilled:false,burning:false,poisoned:false,frozen:false}:game.boonStatuses(-1));this.queen.root.position.set(q.x/UNIT,0,q.y/UNIT);this.queen.animate(this.time,.4,q.rotation);if(q.defeated){this.queen.root.rotation.z=1.25;this.queen.root.position.y=-.35;}}
  const nestIds=this.activeNestIds;nestIds.clear();for(const n of q.nests){if(!menu)this.effects.addPriorityActor(n.x/UNIT,n.y/UNIT,.7,1.35);nestIds.add(n.id);let model=this.nests.get(n.id);if(!model){model=nest();registerGeometry(model,GEOMETRY_CLASSES.enemy);this.nests.set(n.id,model);this.scene.add(model);this.contextResources?.track(model);}model.position.set(n.x/UNIT,0,n.y/UNIT);updateNest(model,this.time+n.id);}
  for(const[id,model]of this.nests)if(!nestIds.has(id)){updateNest(model,this.time,true);if(this.nests.size>10){disposeModel(model);this.nests.delete(id);}}
  if(this.staticDirty){this.freezeRoomTransforms();this.ragdolls.refreshStatic(this.world);this.staticDirty=false;}
  this.ragdolls.update(dt,p.x/UNIT,p.y/UNIT);if(this.ragdolls.has(-2147483648))this.player.syncWeaponPose?.(); // M10 falling hand keeps weapon socket
  for(const c of this.corpses){
   if(c.pendingEffect && (c.model.corpseEffectReady?.(c.age) ?? true)){
    const cue=c.model.root.userData.motionDeathCue??'none';
    const origin=cue==='frost'?c.model.body.getWorldPosition(this.actorPoseBounds.center):undefined;
    if(origin)origin.y=Math.max(origin.y,c.model.root.position.y+c.model.height*.42);
    this.effects.event(c.pendingEffect,cue,undefined,origin);
    c.pendingEffect=undefined;
   }
   if(c.model.root.userData.broodPod && !c.podFall && c.age<.18 && game.broodInterruption){
    const parent=game.enemies.getSnapshot(game.broodInterruption.id);
    if(parent){
     const dx=parent.x/UNIT-c.x,dz=parent.y/UNIT-c.y;
     const reach=Math.min(.72,2/Math.max(.01,Math.hypot(dx,dz)));
     c.podFall={x:c.x,z:c.y,dx:dx*reach,dz:dz*reach};
    }
   }
   if(c.podFall){
    c.age+=dt;
    const fold=T.MathUtils.smoothstep(c.age,0,.65),remnant=1-.84*T.MathUtils.smoothstep(c.age,.35,1.45);
    c.x=c.podFall.x+c.podFall.dx*fold;c.y=c.podFall.z+c.podFall.dz*fold;
    c.model.root.position.set(c.x,0,c.y);
    c.model.root.scale.set(remnant,(1-.80*fold)*remnant,remnant);
    continue;
   }
   // The active Rapier budget can fill during a simultaneous elemental kill.
   // Keep the same drawing and debris clock on the retained fallback corpse.
   if(!this.ragdolls.has(c.id) && c.model.elementalHold?.() && c.age<.64){
    c.model.poseDeath?.(c.model.root.userData.motionDeathCue??'none',c.age/.64);
    c.age+=dt;
    continue;
   }
   setActorLOD(c.model.root,true);c.model.setDeathAge?.(c.age+dt);if(this.ragdolls.has(c.id))c.age+=dt;c.model.dissolve?.(Math.max(0,(c.age-18)/2));if(this.ragdolls.has(c.id)){const position=this.ragdolls.position(c.id)!;c.x=position.x;c.y=position.z;continue;}if(dt<=0)continue;if(c.age>2&&Math.abs(c.vx)+Math.abs(c.vy)<.02&&c.height<=.08){c.age+=dt;continue;}c.age+=dt;const moved=game.moveCorpse({x:c.x*UNIT,y:c.y*UNIT,radius:14},c.vx*dt*UNIT,c.vy*dt*UNIT);c.x=moved.x/UNIT;c.y=moved.y/UNIT;if(moved.blocked){c.vx*=-.22;c.vy*=-.22;}c.vx*=Math.exp(-3.8*dt);c.vy*=Math.exp(-3.8*dt);c.lift-=9.8*dt;c.height=Math.max(.08,c.height+c.lift*dt);if(c.height<=.08)c.lift=0;
   c.model.root.position.set(c.x,c.height,c.y);c.model.body.rotation.z=Math.min(Math.PI*.78,c.age*5);c.model.root.rotation.y+=c.spin*dt*Math.exp(-c.age*3);
  }

  updateRoomPracticals(this.world,this.time,!!this.motionQuery?.matches,this.options.flashIntensity);updateHotFixtureSurfaces(this.motionQuery?.matches?0:this.time);this.lighting.update(dt);this.practicalPools?.update(this.lighting.fixtures,this.tier==='high');
  this.contacts.begin();
  if(!menu)useActorContactShadows(this.player.root);
  if(menu){this.contacts.add(TITLE_STAGE.marine.x,TITLE_STAGE.marine.z,.75);this.contacts.add(TITLE_STAGE.creature.x,TITLE_STAGE.creature.z,1.2);}else{
   this.contacts.add(p.x/UNIT,p.y/UNIT,.45);
   if(this.queen)this.contacts.add(q.x/UNIT,q.y/UNIT,1.95);
   for(const n of q.nests)this.contacts.add(n.x/UNIT,n.y/UNIT,.7);
   for(const e of enemies){
    const attacking=e.windupMs>0||e.meleePhase==='windup'||e.meleePhase==='strike'||e.chargeMs>0;
    const contact=blackout&&e.health>0&&(attacking||Math.hypot(e.x-p.x,e.y-p.y)<=6*UNIT);
    const shooter=e.type==='spitter'&&!e.pod&&e.windupMs>0&&e.pendingAttack==='spit';
    const broodSpill=!blackout && !e.pod && e.health>0 ? BROOD_SPILL[e.type]??0 : 0;
    const contactScale=broodSpill?1.48:contact&&!shooter?1.25:1;
    const contactInk=broodSpill || (contact?(shooter?3:1):0);
    if(!blackout||contact)this.contacts.add(e.x/UNIT,e.y/UNIT,e.radius/UNIT*contactScale,contactInk,contact?enemyMotionAim(e,p):0);
   }
   for(const c of this.corpses)this.contacts.add(c.x,c.y,.45);
  }
  this.contacts.end();
  this.contacts.mesh.visible=this.graphicsAblation!=='contacts';
  this.atmosphere.update(dt,this.camera);this.backdrop?.update(dt,this.focus);this.arena?.update(dt,this.options.flashIntensity,!!this.motionQuery?.matches);updateExitSignal(this.exit,this.time,game.escortExitOpen||game.status==='reward'||game.status==='route',!!this.motionQuery?.matches);if(this.atmosphere?.root)this.atmosphere.root.visible=!menu&&this.tier==='high'&&this.options.atmosphere;
  this.heatClock+=dt;if(this.heatClock>1.5&&this.tier==='high'&&this.options.atmosphere&&this.options.distortion&&!this.motionQuery?.matches){this.heatClock=0;if(this.roomEnvironment==='engineering'||this.roomEnvironment==='reactor'||this.roomEnvironment==='cryogenics'){const fixture=this.lighting.fixtures[0],core=game.node.templateId==='overload-floor'?this.lighting.staging:null;this.post.distortion.heat(core?.coreX??fixture.position.x,core?.coreZ??fixture.position.z,core?2.4:3,core?.0024:this.roomEnvironment==='cryogenics'?-.0006:.0012,2.5);}}
  // Age the shared pool before refreshing every continuously attached source.
  if(this.tier==='high'&&this.options.dynamicLights)for(const e of enemies){const status=this.actors.get(e.id)?.root.userData.visualStatus;if(status&&(status.burning||status.frozen||status.poisoned)){const light=this.attachedLight;light.x=e.x/UNIT;light.z=e.y/UNIT;light.color=status.burning?0xff7a2e:status.poisoned?0x9dff5a:0x7fd6ff;light.intensity=status.burning?2:1.1;light.priority=1;this.lighting.pool.attach(e.id,light);}}
  this.effects.syncEnemyWarnings(enemies,game.geometry,game,this.shooterSocket);
  if(blackout)this.effects.forEachShooterPriority((x,y,z,angle,id)=>{
   this.lighting.pool.attach(`hostile-windup-${id}`,{x:x+Math.cos(angle)*.2,y:y+.22,z:z+Math.sin(angle)*.2,color:0xff2340,intensity:2.4,distance:1.6,duration:.08,priority:4});
  });
  this.interimAbilities.update(game.abilities?.snapshot,dt,!menu,game,this.player.root,this.camera,this.player.body);
  // V2 owns body offsets; solve its sibling weapon/socket from that final pose.
  this.player.syncWeaponPose?.();
  // CAM12: sample the final drawn pose before final room/HUD framing.
  if(!menu){this.marineEnvelope.capture(this.player.root,this.camera);hud.setMarineEnvelope(this.marineEnvelope);this.roomCombatFraming.apply(this.camera,this.cameraRig.focus,p.x/UNIT,p.y/UNIT,p.radius/UNIT,this.player.height,bounds.width/UNIT,bounds.height/UNIT,hud.viewport,this.viewportHeight,dt,!!this.motionQuery?.matches,game.geometry.boundary,hud,this.player.height,p.angle,this.marineEnvelope);hud.refreshFit(this.camera,this.screenPoint);this.focus.copy(this.cameraRig.focus);}
  // PERF13: submit actors only inside the final camera's conservative pose sphere.
  this.actorPoseFrustum.setFromProjectionMatrix(this.actorPoseMatrix.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse));
  for(const model of this.actors.values()){this.actorPoseBounds.center.copy(model.root.position);this.actorPoseBounds.center.y+=model.height*.5;this.actorPoseBounds.radius=model.root.userData.perf13CullRadius??model.height+2;model.root.visible=this.actorPoseFrustum.intersectsSphere(this.actorPoseBounds);}
  for(const corpse of this.corpses){this.actorPoseBounds.center.copy(corpse.model.root.position);this.actorPoseBounds.center.y+=corpse.model.height*.5;this.actorPoseBounds.radius=corpse.model.height+1.5;corpse.model.root.visible=this.actorPoseFrustum.intersectsSphere(this.actorPoseBounds);}
  // CAM12: camera-projected presentation consumers use the final matrix.
  updateWorldDressing(this.world,this.time,!!this.motionQuery?.matches,this.camera,p,this.player.height,enemies,this.actors,this.hudFraming.viewport,this.roomCutawayTargets);
  this.effects.beginPriorityActors(this.camera);
  if(!menu){this.effects.addPriorityActor(p.x/UNIT,p.y/UNIT,Math.max(p.radius/UNIT,.78),this.player.height);for(const e of enemies)this.effects.addPriorityActor(e.x/UNIT,e.y/UNIT,e.radius/UNIT,this.actors.get(e.id)?.height??2.65);if(this.queen&&!q.defeated)this.effects.addPriorityActor(q.x/UNIT,q.y/UNIT,92/UNIT,this.queen.height);for(const n of q.nests)this.effects.addPriorityActor(n.x/UNIT,n.y/UNIT,.7,1.35);}
  this.healthBars.update(this.healthEntries,this.camera,this.viewportHeight,menu);
  // CAM12 final-pose framing end.
  const socket=this.player.muzzleWorld!(this.shotSocket);
  for(const shot of this.pendingShots){const id=shot.weapon??'pistol';this.effects.shot(socket,shot.angle??p.angle,id);this.muzzleLife=id==='shotgun'?.075:.045;this.muzzle.color.setHex(WEAPON_APPEARANCE[id].color);this.muzzle.position.copy(socket);}this.pendingShots.length=0;
  for(const b of game.bullets)if(b.kind==='player'&&!b.visualMuzzle){const distance=Math.max(0,(socket.x-p.x/UNIT)*Math.cos(b.request.angle)+(socket.z-p.y/UNIT)*Math.sin(b.request.angle))*UNIT;b.visualMuzzle={x:socket.x,y:socket.y,z:socket.z,distance};}
  this.muzzleLife-=dt;this.muzzle.intensity=this.muzzleLife>0?6*Math.min(1,this.muzzleLife/.035)*this.options.flashIntensity*(this.motionQuery?.matches?.5:1):0;
  this.interimAbilities.kit?.ribbons.hudViewport.set(hud.viewport.left,hud.viewport.bottom,hud.viewport.right,hud.viewport.top);
  this.interimAbilities.updatePriority(this.camera);
  if(this.graphicsAblation==='prioritySampling')this.interimAbilities.root.traverse(object=>{
   const material=(object as T.Mesh<T.BufferGeometry,T.ShaderMaterial>).material;
   const sampling=material?.uniforms?.diagnosticPrioritySampling;
   if(sampling)sampling.value=false;
  });
  this.effects.setGroundPriorityTexture(this.interimAbilities.priorityMask?.texture,this.graphicsAblation!=='prioritySampling');
  this.effects.update(dt,this.camera,game.bullets,p.x/UNIT,p.y/UNIT,p.radius/UNIT,enemies,this.actorPosition);
  if(this.graphicsAblation==='floorResidues'){
   this.effects.showFloorDecals(false);
   this.interimAbilities.kit?.hideFloorResidues();
  }
  let index=0;for(const b of game.bullets){if(b.kind==='hazard')continue;if(index>=320)break;if(b.kind==='player'&&(2-b.life)*b.request.speed<(b.visualMuzzle?.distance??0))continue;this.dummy.position.set(b.x/UNIT,b.kind==='grenade'?1+Math.sin((1-b.life/1.1)*Math.PI)*1.4:b.visualMuzzle?.y??.95,b.y/UNIT);this.dummy.rotation.set(0,Math.PI/2-b.request.angle,0);this.dummy.scale.set(.025,.025,b.request.weaponId==='rocket'?.35:.24);this.dummy.updateMatrix();this.bulletMesh.setMatrixAt(index,this.dummy.matrix);if(this.tier==='high'&&this.options.dynamicLights&&(b.request.weaponId==='plasma'||b.request.weaponId==='rocket')){let id=this.projectileLightIds.get(b);if(id===undefined){id=this.nextProjectileLight--;this.projectileLightIds.set(b,id);}const light=this.attachedLight;light.x=this.dummy.position.x;light.y=this.dummy.position.y;light.z=this.dummy.position.z;light.color=b.request.weaponId==='plasma'?0x9fe8ff:0xffb454;light.intensity=1.7;light.priority=1;this.lighting.pool.attach(id,light);light.y=1;}this.bulletMesh.setColorAt(index,this.bulletColor.setHex(b.request.weaponId==='plasma'?0x73eced:0xffd58f));index++;}this.bulletMesh.count=index;this.bulletMesh.instanceMatrix.needsUpdate=true;if(this.bulletMesh.instanceColor)this.bulletMesh.instanceColor.needsUpdate=true;

  const revealed=game.savedArmourReveal;
  this.pickupInstances?.update(visiblePickups,this.time,revealed&&{id:revealed.id,age:game.elapsed-revealed.at});
  if(this.pickupInstances)this.pickupInstances.root.visible=!menu;
  this.shadowTime+=dt;this.renderer.shadowMap.needsUpdate=this.shadowsDirty||((menu||!INTERIOR_ROOMS.has(game.node.templateId))&&this.shadowTime>=1/30);
  if(this.renderer.shadowMap.needsUpdate){this.shadowTime=0;this.shadowsDirty=false;}
  this.afflictions.update(this.scene.children,this.camera,this.time,this.interimAbilities.kit?.statusOwners);this.renderer.info.reset();
  this.screenPoint.set(menu?TITLE_STAGE.marine.x:p.x/UNIT,1.4,menu?TITLE_STAGE.marine.z:p.y/UNIT).applyMatrix4(this.camera.matrixWorldInverse);this.post.setFocus?.(-this.screenPoint.z,menu);
  // Keep preparation/picking on the normal layer, including after interrupted frames.
  if(menu)this.lighting.suppressCombatFeedback?.(this.muzzle);
  const cameraLayerMask=this.camera.layers.mask,autoClear=this.renderer.autoClear;this.camera.layers.set(menu?CINEMATIC_LAYER:0);
  // WARN16 uses the existing ink composite and the actor IDs in its opaque buffer.
  this.post.beginCombatOutlines();
  if(!menu&&this.graphicsAblation!=='silhouette')for(const enemy of enemies){
   // The contour marks the attack that lands next (PLAY25 order) and the strike itself; ranged wind-ups and charges always.
   if(enemy.champion==='warden'||enemy.health<=0||!(enemy.windupMs>0||enemy.chargeMs>0||enemy.meleeOrder===1||enemy.meleePhase==='strike'))continue;
   const actor=this.actors.get(enemy.id);if(actor)this.post.markCombatOutline(actor.root);
  }
  this.post.finishCombatOutlines();
  try{
   this.post.render(dt);
   const hidden=menu||combat.dead;
   const reveal=this.graphicsAblation!=='silhouette';
   this.playerBeacon.update(this.player.root,p.angle,hidden,this.effects.warningNear(p.x/UNIT,p.y/UNIT),dt,blackout,reveal);
   if(!hidden&&reveal)this.playerBeacon.renderMask(this.renderer,this.camera,p,this.player.height,this.post.sceneDepthTexture,this.post.sceneGeometryTexture,RIG_ACCENTS[game.abilities.snapshot.rig??'breacher']);
   this.renderer.autoClear=false;this.renderer.render(this.hudScene,this.camera);
  }
  finally{this.renderer.autoClear=autoClear;this.camera.layers.mask=cameraLayerMask;}
 }

 private captureRoomReflections(){
  if(!this.reflection||this.reflection.texture)return;
  const excluded=this.scene.children.filter(object=>object!==this.world&&object!==this.lighting.root&&object!==this.arena?.root);
  excluded.push(this.lighting.lamp.root,this.lighting.pool.root,this.lighting.blast);
  const storyParticles=this.world.getObjectByName('source-anchored-story-particles');if(storyParticles)excluded.push(storyParticles);
  this.reflection.capture(this.roomWidth/2,2,this.roomHeight/2,excluded);
 }

 /** Fit both silhouettes below the boss header and above the desktop action bar. */
 private protectBossFraming(px:number,pz:number,playerRadius:number,qx:number,qz:number){
  // Reserve 18% at the top and 24% below; this envelope is independent of DOM layout.
  const queenHeight=this.queen?.height??4.5,v=this.hudFraming?.viewport??FULL_COMBAT_VIEWPORT;
  for(let pass=0;pass<3;pass++){
   let left=Infinity,right=-Infinity,top=-Infinity,bottom=Infinity;
   for(let actor=0;actor<2;actor++){
    const x=actor?qx:px,z=actor?qz:pz,radius=actor?3.4:playerRadius,height=actor?queenHeight:this.player.height;
    for(let ix=-1;ix<=1;ix+=2)for(let iz=-1;iz<=1;iz+=2)for(let iy=0;iy<2;iy++){
     this.screenPoint.set(x+ix*radius,iy*height,z+iz*radius).project(this.camera);
     left=Math.min(left,this.screenPoint.x);right=Math.max(right,this.screenPoint.x);top=Math.max(top,this.screenPoint.y);bottom=Math.min(bottom,this.screenPoint.y);
    }
   }
   const scale=Math.min(1,1.8*v.halfX/(right-left),1.12*v.halfY/(top-bottom));
   if(scale<1){this.camera.zoom*=scale*.98;this.camera.updateProjectionMatrix();continue;}
   const dx=(left+right)*.5-v.centerX,dy=(top+bottom)*.5-v.centerY-.08*v.halfY;
   this.screenPoint.set((px+qx)*.5,0,(pz+qz)*.5).project(this.camera);this.screenTarget.copy(this.screenPoint);this.screenTarget.x-=dx;this.screenTarget.y-=dy;
   this.screenPoint.unproject(this.camera);this.screenTarget.unproject(this.camera);this.screenPoint.sub(this.screenTarget);
   this.screenPoint.z-=this.screenPoint.y*this.camera.matrixWorld.elements[10]/this.camera.matrixWorld.elements[9];this.screenPoint.y=0;
   this.camera.position.add(this.screenPoint);this.camera.updateMatrixWorld();
  }
 }

 /** Reserve projected body headroom even while aim lead or recoil is settling. */
 private protectPlayerFraming(x:number,z:number,radius:number,angle=0){
  protectPlayerFrame(this.camera,this.cameraRig.focus,x,z,radius,this.player.height,this.screenPoint,this.screenTarget,this.hudFraming?.viewport??FULL_COMBAT_VIEWPORT,angle);this.focus.copy(this.cameraRig.focus);
 }

 private readonly roomCutawayTargets=new RoomCutawayTargets();
 private syncPools(pools:readonly {id:number;x:number;y:number;radius:number;life:number}[]){
  const poolIds=this.activePoolIds;poolIds.clear();
  for(const p of pools){
   poolIds.add(p.id);let mesh=this.poolMeshes.get(p.id);
   if(!mesh){mesh=new T.Mesh(new T.CircleGeometry(1,40),new AcidPoolMaterial(p.id));registerGeometry(mesh);mesh.renderOrder=29;mesh.rotation.x=-Math.PI/2;this.scene.add(mesh);this.contextResources?.track(mesh);this.poolMeshes.set(p.id,mesh);}
   mesh.position.set(p.x/UNIT,.03,p.y/UNIT);mesh.scale.setScalar(p.radius/UNIT);
   if(this.tier==='high'&&this.options.dynamicLights){const light=this.attachedLight;light.x=p.x/UNIT;light.y=.18;light.z=p.y/UNIT;light.color=0x9dff5a;light.intensity=1.8;light.distance=Math.min(5,2+p.radius/UNIT);light.priority=1;this.lighting.pool.attach(2000000+p.id,light);light.y=1;light.distance=3;}
   mesh.material.opacity=Math.min(.3,p.life*.3);mesh.material.surfaceTime.value=this.time;
  }
  for(const[id,mesh]of this.poolMeshes)if(!poolIds.has(id)){mesh.geometry.dispose();mesh.material.dispose();mesh.removeFromParent();this.poolMeshes.delete(id);}
 }
 private clearPools(){for(const mesh of this.poolMeshes.values()){mesh.geometry.dispose();mesh.material.dispose();mesh.removeFromParent();}this.poolMeshes.clear();}
 dispose(){if(this.disposed)return;this.disposed=true;this.pincerPresentation.dispose();this.conditionVisuals.dispose();this.siegeBoundary.dispose();this.floorChoiceMarkers.dispose();this.kitDressing?.dispose();this.aheadRooms?.dispose();this.cancelRoomPrefetch?.();this.ragdolls.dispose();for(const c of this.corpses)this.actorPool.release(c.model);this.corpses=[];this.corpseIds?.clear();for(const model of this.actors.values())this.actorPool.release(model);this.actors.clear();if(this.queen)this.actorPool.release(this.queen);this.queen=null;this.communalGarden?.dispose();this.communalGarden=undefined;this.residentialGalleryEquipment?.dispose();this.residentialGalleryEquipment=undefined;this.passengerVault?.dispose();this.clearPools();this.recoveryKit?.dispose();this.sealedBank?.dispose();this.releasedBerth?.dispose();disposeModel(this.world);this.temporaryMaterials.forEach(m=>m.dispose());this.practicalPools?.dispose();this.arena?.dispose();this.title?.dispose();this.backdrop?.dispose();this.atmosphere.dispose();this.lighting.dispose();this.contacts.dispose();this.afflictions.dispose();this.actorPool.dispose();this.healthBars.dispose();this.pickupInstances?.dispose();this.playerBeacon?.dispose();this.effects.dispose();this.interimAbilities.dispose();for(const model of [this.player,this.menuMarine,this.menuAlien])if(model){model.stop?.();disposeModel(model.root);}if(this.bulletMesh.geometry){this.bulletMesh.geometry.dispose();(this.bulletMesh.material as T.Material).dispose();}for(const object of this.warning.children)if(object instanceof T.Mesh){object.geometry.dispose();(object.material as T.Material).dispose();}this.canvas.removeEventListener('webglcontextlost',this.loseGraphics);this.canvas.removeEventListener('webglcontextrestored',this.restoreGraphics);this.motionQuery?.removeEventListener('change',this.motionChanged);this.reflection.dispose();this.post.dispose();this.materialWarmup?.dispose();this.contextResources?.invalidate();this.renderer.dispose();this.surfaces.dispose();}
}
