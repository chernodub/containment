import type {DeathRagdolls as PhysicsRagdolls} from '../../render/DeathRagdolls';
type PhysicsModule = typeof import('../../render/DeathRagdolls');
let physics: PhysicsModule | undefined;
let loading: Promise<void> | undefined;
const waiting = new Set<WeakRef<DeathRagdolls>>();

/** Optional presentation starts after the first rendered frame. Failure leaves
 * the renderer's existing frozen-pose toss/slide/dissolve path in charge. */
export function warmDeathPhysics(): Promise<void> {
  return loading ??= import('../../render/DeathRagdolls').then(async module => {
    await module.initDeathPhysics();physics=module;
    for(const reference of waiting) reference.deref()?.attach();
    waiting.clear();
  }).catch(() => {waiting.clear();});
}

/** Synchronous renderer contract while optional WASM downloads in the background.
 * Never backfill an old corpse: it already belongs to the non-physics path. */
export class DeathRagdolls {
  private delegate: PhysicsRagdolls | undefined;
  private room: Parameters<PhysicsRagdolls['setRoom']> | undefined;
  private tier: 'high'|'low' = 'high';
  constructor() {if(physics)this.attach();else waiting.add(new WeakRef(this));}
  attach(): void {
    if(!physics||this.delegate)return;
    this.delegate=new physics.DeathRagdolls();this.delegate.setQuality(this.tier);
    if(this.room)this.delegate.setRoom(...this.room);
  }
  setQuality(tier:'high'|'low'): void {this.tier=tier;this.delegate?.setQuality(tier);}
  setRoom(...args:Parameters<PhysicsRagdolls['setRoom']>): void {this.room=args;this.delegate?.setRoom(...args);}
  refreshStatic(...args:Parameters<PhysicsRagdolls['refreshStatic']>): void {this.delegate?.refreshStatic(...args);}
  add(...args:Parameters<PhysicsRagdolls['add']>): void {this.delegate?.add(...args);}
  update(...args:Parameters<PhysicsRagdolls['update']>): void {this.delegate?.update(...args);}
  has(id:number): boolean {return this.delegate?.has(id)??false;}
  position(id:number) {return this.delegate?.position(id);}
  sync(id:number,x:number,z:number): void {this.delegate?.sync(id,x,z);}
  remove(id:number): void {this.delegate?.remove(id);}
  inspect(id:number) {return this.delegate?.inspect(id);}
  maxJointError(id:number): number {return this.delegate?.maxJointError(id)??0;}
  snapshot(contacts=false) {return this.delegate?.snapshot(contacts)??{active:0,falling:0,bodies:0,joints:0,settled:0,budget:this.tier==='high'?6:3,collisionGroups:0x00020001,staticColliders:0,stepMs:0,physicsMs:0,starts:0,contacts:0,steps:0,overflow:0};}
  dispose(): void {this.room=undefined;this.delegate?.dispose();}
}
