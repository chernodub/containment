import {Group,type Object3D,type Camera,type Texture} from 'three';
import type {DepthGame} from '../../DepthGame';
import type {AbilitiesSnapshot,AbilityEvent} from '../../game/abilities/contract';
import type {GraphicsOptions} from '../graphicsOptions';
import type {GraphicsTier} from '../FrameBudget';
import type {AbilityVisuals} from './AbilityVisuals';
import type {AbilityServices} from './ElementKit';
import type {PlacementPreviewState} from './PlacementPreview';

type Module=Pick<typeof import('./AbilityVisuals'),'AbilityVisuals'>;
const loadVisuals=()=>import('./AbilityVisuals');

/** Defer every ability mesh, shader and atlas request until a gameplay room hold. */
export class LazyAbilityVisuals {
  private readonly placeholder=new Group();
  private owner?:AbilityVisuals;
  private work?:Promise<void>;
  private dead=false;
  private services?:AbilityServices;
  private hostileSource?:unknown;
  private preferences?:{options:GraphicsOptions;tier:GraphicsTier;reducedMotion:boolean};
  private reducedMotion?:boolean;
  private placement:PlacementPreviewState|null=null;
  private readonly placementBridge=(value:PlacementPreviewState|null)=>this.setPlacementPreview(value);
  private softDepth?:{texture:Texture|null;near:number;far:number;perspective:boolean};
  private cancel!:()=>void;
  private readonly cancelled=new Promise<void>(resolve=>{this.cancel=resolve;});

  constructor(private readonly scene:Object3D,private readonly load:()=>Promise<Module>=loadVisuals){
    this.placeholder.name='interim-ability-visuals';scene.add(this.placeholder);
    scene.userData.setPlacementPreview=this.placementBridge;
  }

  /** The placeholder is replaced at preparation, before material registration. */
  get root(){return this.owner?.root??this.placeholder;}
  get kit(){return this.owner?.kit;}
  get priorityMask(){return this.owner?.priorityMask;}

  /** Coalesce module creation and atlas readiness inside the existing room hold. */
  prepare():Promise<void>{
    if(this.dead)return Promise.resolve();
    if(this.work)return this.work;
    const create=async()=>{
      const module=await this.load();if(this.dead)return;
      const owner=new module.AbilityVisuals(this.scene);this.owner=owner;this.placeholder.removeFromParent();
      if(this.services)owner.bind(this.services);
      if(this.hostileSource!==undefined)owner.setHostilePrioritySource(this.hostileSource);
      if(this.preferences)owner.setOptions(this.preferences.options,this.preferences.tier,this.preferences.reducedMotion);
      if(this.reducedMotion!==undefined)owner.setReducedMotion(this.reducedMotion);
      if(this.softDepth){const d=this.softDepth;owner.setSoftDepth(d.texture,d.near,d.far,d.perspective);}
      owner.setPlacementPreview(this.placement);
      await owner.prepare();
    };
    this.work=Promise.race([create(),this.cancelled]).catch(error=>{if(!this.dead&&!this.owner)this.work=undefined;throw error;});
    return this.work;
  }

  bind(services:AbilityServices):void{if(this.dead)return;this.services=services;this.owner?.bind(services);}
  setHostilePrioritySource(source:unknown):void{if(this.dead)return;this.hostileSource=source;this.owner?.setHostilePrioritySource(source);}
  setOptions(options:GraphicsOptions,tier:GraphicsTier,reducedMotion:boolean):void{
    if(this.dead)return;this.preferences={options:{...options},tier,reducedMotion};this.reducedMotion=undefined;
    this.owner?.setOptions(options,tier,reducedMotion);
  }
  setReducedMotion(value:boolean):void{if(this.dead)return;this.reducedMotion=value;this.owner?.setReducedMotion(value);}
  setSoftDepth(texture:Texture|null,near=.1,far=100,perspective=true):void{
    if(this.dead)return;
    if(this.owner){this.owner.setSoftDepth(texture,near,far,perspective);return;}
    this.softDepth={texture,near,far,perspective};
  }
  /** Stable presentation bridge: does not load the lazy owner or request its atlas. */
  setPlacementPreview(value:PlacementPreviewState|null):void{if(this.dead)return;this.placement=value;this.owner?.setPlacementPreview(value);}
  event(event:AbilityEvent,x:number,y:number):void{if(!this.dead)this.owner?.event(event,x,y);}
  update(snapshot:AbilitiesSnapshot|undefined,dt:number,visible=true,game?:DepthGame,marine?:Object3D,camera?:Camera,marineBody?:Object3D):void{
    if(!this.dead)this.owner?.update(snapshot,dt,visible,game,marine,camera,marineBody);
  }
  clear():void{this.placement=null;this.owner?.clear();}
  dispose():void{
    if(this.dead)return;this.dead=true;this.cancel();this.owner?.dispose();this.owner=undefined;
    if(this.scene.userData.setPlacementPreview===this.placementBridge)delete this.scene.userData.setPlacementPreview;
    this.placement=null;this.placeholder.removeFromParent();this.services=undefined;this.hostileSource=undefined;this.softDepth=undefined;
  }
}
