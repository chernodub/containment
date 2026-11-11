import type * as T from 'three';
import type { AbilitiesSnapshot, AbilityEvent, RigId } from '../../game/abilities/contract';
import type { DepthGame } from '../../DepthGame';
import type { GraphicsOptions } from '../graphicsOptions';
import type { GraphicsTier } from '../FrameBudget';
import { AbilityGeometry } from './AbilityGeometry';
import { ElementKit, type AbilityServices } from './ElementKit';
import type { AbilityFrame, AbilityPresentation, PresentationFactory } from './types';

/** One owner for ability routing, quality, fixed pools and the immutable snapshot clock. */
export class AbilityVisuals extends AbilityGeometry {
  readonly kit = new ElementKit(this.root);
  private registry = new Map<RigId, AbilityPresentation>();
  private system?:AbilityPresentation;
  private frame:AbilityFrame={snapshot:undefined,dt:0,visible:true};
  private dead=false;
  register(rig:RigId,factory:PresentationFactory):void {this.registry.get(rig)?.dispose();this.registry.set(rig,factory(this.kit));}
  registerSystem(factory:PresentationFactory):void {this.system?.dispose();this.system=factory(this.kit);}
  bind(services:AbilityServices):void {this.kit.bind(services);}
  setOptions(options:GraphicsOptions,tier:GraphicsTier,reducedMotion:boolean):void {this.kit.setOptions(options,tier,reducedMotion);this.setReducedMotion(reducedMotion);}
  override event(event:AbilityEvent,x:number,y:number):void {
    if(this.dead)return;super.event(event,x,y);this.registry.get(event.rig)?.event(event,x,y);this.system?.event(event,x,y);
  }
  override update(snapshot:AbilitiesSnapshot|undefined,dt:number,visible=true,game?:DepthGame,marine?:T.Object3D):void {
    if(this.dead)return;
    dt=Number.isFinite(dt)?Math.max(0,dt):0;
    super.update(snapshot,dt,visible);this.kit.begin(dt);
    const f=this.frame;f.snapshot=snapshot;f.dt=dt;f.visible=visible;f.game=game;f.marine=marine;
    if(visible){if(snapshot?.rig)this.registry.get(snapshot.rig)?.update(f);this.system?.update(f);}
    this.kit.end();
  }
  override clear():void {super.clear();this.kit?.clear();if(this.registry)for(const p of this.registry.values())p.clear();this.system?.clear();}
  override dispose():void {if(this.dead)return;this.dead=true;for(const p of this.registry.values())p.dispose();this.system?.dispose();this.kit.dispose();super.dispose();}
}
