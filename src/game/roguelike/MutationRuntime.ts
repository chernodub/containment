import {RIG_BURN_DAMAGE} from '../abilities/catalog';
import {ElementalRuntime,type BoonEffect} from './ElementalRuntime';
import type { CombatSystem } from '../combat/CombatSystem';
import { sweptCircle } from '../combat/enemyContact';
import { BUILD_LIMITS, familyBonuses } from './builds';
import type { BuildCause, BuildCommand, BuildEvent, BuildWeapon } from './builds';

export type MutationTarget = Readonly<{ id: number; x: number; y: number; radius: number; health: number; maxHealth?:number; immovable?:boolean; resistant?:boolean }>;
export type MutationHost = Readonly<{
  targets: () => readonly MutationTarget[];
  player?:()=>{x:number;y:number};
  /** Apply damage and ordinary death rewards; do not report another mutation kill here. */
  damage: (id: number, amount: number, source?:'status'|'boon') => Readonly<{ applied: boolean; died: boolean }>;
  /** Move through the same collision/bounds solver used by ordinary enemies. */
  move: (id: number, dx: number, dy: number) => Readonly<{ blocked: boolean }>;
  /** Same collision solver for a corpse whose live entity was already removed. */
  moveCorpse: (target: MutationTarget, dx: number, dy: number) => Readonly<{ x: number; y: number; blocked: boolean }>;
  /** Persistent speed multiplier, 1 restores normal movement. */
  setSlow: (id: number, multiplier: number) => void;
  canAffect?:(from:Readonly<{x:number;y:number}>,to:Readonly<{x:number;y:number}>)=>boolean;
  boonEffect?:(kind:BoonEffect,x:number,y:number,targetX?:number,targetY?:number,radius?:number,durationMs?:number)=>void;
  effect?: (x: number, y: number, radius: number) => void;
  launchCollision?: (from: MutationTarget, target: MutationTarget, wall: boolean) => void;
  /** One presentation contact for an accepted wall collision, before its damage commands. */
  wallSlam?: (from: MutationTarget, to: Readonly<{x:number;y:number}>, impulse:number) => void;
}>;
type Launch = { x: number; y: number; cause: BuildCause; commandId: string; remainingMs: number; touched: Set<number>; ghost?: MutationTarget };

/** Engine-independent host for all nonterminal build commands. */
export class MutationRuntime {
  readonly #combat: CombatSystem;
  readonly #host: MutationHost;
  readonly #positions = new Map<number, MutationTarget>();
  readonly #chill = new Map<number, { stacks: number; expiresAt: number }>();
  readonly #launches = new Map<number, Launch>();
  readonly #killed = new Set<number>();
  readonly #hits = new Set<string>();
  readonly #commands: BuildCommand[] = [];
  #elements:ElementalRuntime;
  #slow=new Map<number,number>();private secondaryBudget=new Map<string,number>();
  #executing = false;
  #time = 0;
  #hitCount=0;#directKills=0;
  #activeShot:string|undefined;
  #shotWeapons=new Map<string,BuildWeapon>();
  #fireSlowUntil = new Map<number, number>();
  #burns=new Map<number,{expiresAt:number;nextTick:number;tickDamage:number;command:BuildCommand}>();

  constructor(combat: CombatSystem, host: MutationHost) {
    this.#combat = combat;
    this.#host = host;
    this.#elements=new ElementalRuntime({combat,targets:host.targets,player:host.player??(()=>({x:0,y:0})),visible:(a,b)=>host.canAffect?.(a,b)!==false,
      stacks:id=>this.#stacks(id),burning:id=>(this.#burns.get(id)?.expiresAt??0)>this.#time,clearChill:id=>{this.#chill.delete(id);this.#elements.clearFreeze(id);},clearBurn:id=>{this.#burns.delete(id);},
      chill:(t,stacks,duration)=>this.#addChill(t,stacks,duration),effect:(...args)=>host.boonEffect?.(...args),
      damage:(t,n,cause,id,source)=>{try{this.#damage(t,n,{type:'damage',targetId:String(t.id),amount:n,source:'secondary',cause,id},source);}finally{if(source==='status')this.secondaryBudget.delete(cause.chainId);}},
      push:(t,x,y,cause,id)=>{if(t.immovable||t.resistant){this.#elements.stagger(t);this.#refreshSlow(t);return;}const old=this.#launches.get(t.id);if(!old||Math.hypot(x,y)>Math.hypot(old.x,old.y))this.#launches.set(t.id,{x,y,cause,commandId:id,remainingMs:700,touched:new Set([t.id])});},
    });
  }

  /** Ability control shares weapon chill, elemental roots and ordinary burn reactions. */
  applyAbilityStatus(target:MutationTarget,kind:'chill'|'freeze'|'burn'|'shock',amount:number):void {
    if(!Number.isFinite(amount)||amount<=0||!this.#host.targets().some(t=>t.id===target.id&&t.health>0))return;
    const id=this.#combat.nextMutationEventId(`ability-${kind}`),cause={chainId:id,depth:0};
    if(kind==='chill'){
      const before=this.#stacks(target.id),family=familyBonuses(this.#combat.build);
      this.#addChill(target,Math.min(3,before+Math.floor(amount)),(this.#combat.hasMutation('permafrost')?3500:2000)+(family.cryo?500:0));
      this.#elements.reachedChill(target,before,cause,id);
    }else if(kind==='freeze'){
      if(!target.immovable&&!target.resistant)this.#addChill(target,3,amount);
      this.#elements.freeze(target,amount);
    }else if(kind==='shock')this.#elements.shock(target,amount);
    else this.#ignite(target,{type:'damage',targetId:String(target.id),amount:RIG_BURN_DAMAGE,source:'secondary',cause,id},RIG_BURN_DAMAGE);
    this.#refreshSlow(target);
  }

  consumeBurn(id: number): void { this.#burns.delete(id); }

  impedeWithFire(target: MutationTarget): void {
    this.#fireSlowUntil.set(target.id, this.#time + 650);
    this.#refreshSlow(target);
  }

  /** Crowd constraints yield to the existing swept launch/body-chain solver. */
  isLaunched(id:number):boolean { return this.#launches.has(id); }

  /** Launch abilities use the ordinary wall/body collision reaction path. */
  launchAbility(target:MutationTarget,x:number,y:number):void {
    if(!Number.isFinite(x)||!Number.isFinite(y)||!Math.hypot(x,y)||!this.#host.targets().some(t=>t.id===target.id&&t.health>0))return;
    if(target.immovable||target.resistant){this.#elements.stagger(target);this.#refreshSlow(target);return;}
    this.#remember(target);
    const id=this.#combat.nextMutationEventId('ability-launch');
    this.#launches.set(target.id,{x,y,cause:{chainId:id,depth:0},commandId:id,remainingMs:900,touched:new Set([target.id])});
  }

  /** Feed ability arcs into Cryo Conductor and Ball Lightning without Arc Filament. */
  abilityArc(origin:MutationTarget,targets:readonly MutationTarget[]):void {
    const id=this.#combat.nextMutationEventId('ability-arc');
    const active=targets.filter(t=>t.health>0&&this.#host.targets().some(live=>live.id===t.id&&live.health>0)&&this.#host.canAffect?.(origin,t)!==false).slice(0,BUILD_LIMITS.maxAreaTargets);
    this.#elements.arc(origin,active,{chainId:id,depth:0},id);
  }

  /** Call after base projectile damage, with the pre-damage target snapshot. */
  hit(shotId: string, weapon: BuildWeapon, target: MutationTarget, direction: Readonly<{ x: number; y: number }>,primed=false): void {
    const eventId=`${shotId}:hit:${target.id}`;
    if(this.#hits.has(eventId)||this.#hits.size>=BUILD_LIMITS.maxEncounterEvents)return;
    this.#hits.add(eventId);
    this.#shotWeapons.set(shotId,weapon);
    this.#elements.registerShot(shotId,primed);
    this.#activeShot=shotId;
    try {
    this.#remember(target);
    const current = this.#chill.get(target.id);
    const chilledStacks = current && current.expiresAt > this.#time ? current.stacks : 0;
    const before={chill:chilledStacks,burn:(this.#burns.get(target.id)?.expiresAt??0)>this.#time};
    if(!this.#dispatch({ id: eventId, cause: { chainId: shotId, depth: 0 }, type: 'hit',
      weapon, targetId: String(target.id), direction, chilledStacks }))return;
    const reaction=this.#elements.hit(shotId,weapon,target,direction,before,primed);
    this.#hitCount++;
    const has=(id:import('./types').MutationId)=>this.#combat.hasMutation(id);
    const command:BuildCommand={type:'damage',targetId:String(target.id),amount:0,source:'secondary',id:`${eventId}:proc`,cause:{chainId:shotId,depth:1}};
    if(has('pressure-point')&&this.#hitCount%5===0){this.#host.boonEffect?.('impact',target.x,target.y);this.#damage(target,24,command);}
    if(has('arc-filament')&&this.#hitCount%4===0){
      const conductive=has('conductive-shell');
      const nearby=this.#host.targets().filter(t=>t.id!==target.id&&t.health>0&&Math.hypot(t.x-target.x,t.y-target.y)<=180&&this.#host.canAffect?.(target,t)!==false).sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y)||a.id-b.id).slice(0,conductive?2:1);
      this.#elements.arc(target,nearby,command.cause,command.id);
      for(const other of nearby){this.#host.boonEffect?.('arc',target.x,target.y,other.x,other.y);this.#damage(other,conductive?22.4:16,command);}
    }
    if(!reaction.skipBurn&&has('incendiary')&&this.#host.targets().some(t=>t.id===target.id&&t.health>0)){
      this.#ignite(target,command);
    }
    } finally {this.#activeShot=undefined;}
  }

  #ignite(target:MutationTarget,command:BuildCommand,tickDamage=4){
    if(command.cause.depth>BUILD_LIMITS.maxDepth||!this.#host.targets().some(t=>t.id===target.id&&t.health>0))return;
    const old=this.#burns.get(target.id);
    this.#burns.set(target.id,{expiresAt:this.#time+1500,nextTick:old?.nextTick??this.#time+250,tickDamage:Math.max(old&&old.expiresAt>this.#time?old.tickDamage:0,tickDamage),command});
    if(!old)this.#host.boonEffect?.('burn',target.x,target.y);
  }

  /** A direct lethal hit calls hit first, then kill using the same shot cause. */
  kill(target: MutationTarget, source: 'direct' | 'secondary' = 'direct', cause?: BuildCause, eventId?: string): void {
    if (this.#killed.has(target.id)) return;
    this.#killed.add(target.id);
    this.#remember(target);
    const launch = this.#launches.get(target.id);
    if (launch) { launch.ghost = { ...target, health: 0 }; launch.remainingMs = Math.max(500, launch.remainingMs); }
    if(this.#stacks(target.id)>0&&this.#combat.build.mutations.includes('frost-armor')){this.#combat.restoreArmor(3);this.#host.boonEffect?.('shield',target.x,target.y);}
    if(source==='direct'&&++this.#directKills<=24&&this.#directKills%4===0&&this.#combat.build.mutations.includes('leech-rounds')){this.#combat.restoreHealth(4);this.#host.boonEffect?.('leech',target.x,target.y);}
    const killCause=cause??{chainId:eventId??this.#combat.nextMutationEventId('kill-element'),depth:0};
    if((this.#burns.get(target.id)?.expiresAt??-1)>=this.#time&&this.#combat.hasMutation('scavenger')&&killCause.depth<BUILD_LIMITS.maxDepth){
      const nearby=this.#host.targets().filter(t=>t.id!==target.id&&t.health>0&&Math.hypot(t.x-target.x,t.y-target.y)<=100&&this.#host.canAffect?.(target,t)!==false).sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y)||a.id-b.id).slice(0,3);
      for(const t of nearby)this.#ignite(t,{type:'damage',targetId:String(t.id),amount:4,source:'secondary',id:`${killCause.chainId}:kindling:${target.id}:${t.id}`,cause:{chainId:killCause.chainId,depth:killCause.depth+1}});
    }
    this.#elements.kill(target,source,killCause,this.#activeShot===killCause.chainId);
    this.#chill.delete(target.id);this.#burns.delete(target.id);this.#fireSlowUntil.delete(target.id);
    const id = eventId ?? this.#combat.nextMutationEventId('kill');
    this.#dispatch({ id, cause: killCause, type: 'kill', targetId: String(target.id), source, resources: this.#combat.mutationResources(this.#shotWeapons.get(killCause.chainId)) });
  }

  update(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) return;
    this.#time += deltaMs;
    const active = new Set(this.#host.targets().filter((target) => target.health > 0).map((target) => target.id));
    for (const [id, chill] of this.#chill) {
      if (chill.expiresAt <= this.#time || !active.has(id)) {
        this.#chill.delete(id);

      }
    }
    for(const [id,burn]of this.#burns){
      const target=this.#host.targets().find(t=>t.id===id&&t.health>0);
      if(!target){this.#burns.delete(id);continue;}
      let ticks=0;while(burn.nextTick<=this.#time+1e-7&&burn.nextTick<=burn.expiresAt+1e-7&&ticks++<4){if(!this.#host.targets().some(t=>t.id===id&&t.health>0))break;const tickId=this.#combat.nextMutationEventId('burn-tick'),cause={chainId:tickId,depth:burn.command.cause.depth};try{this.#damage(target,burn.tickDamage,{...burn.command,id:tickId,cause},'status');}finally{this.secondaryBudget.delete(tickId);}burn.nextTick+=250;}
      if(this.#time>=burn.expiresAt)this.#burns.delete(id);
    }
    this.#elements.update(deltaMs);
    const cryo=familyBonuses(this.#combat.build).cryo;for(const target of this.#host.targets())this.#refreshSlow(target,cryo);
    for(const id of this.#slow.keys())if(!active.has(id))this.#slow.delete(id);
    // At most 100ms catch-up; body contacts sweep each resolved movement substep.
    let remaining = Math.min(deltaMs, 100);
    while (remaining > 0) {
      const step = Math.min(25, remaining);
      this.#stepLaunches(step);
      remaining -= step;
    }
  }

  reset(): void {
    for (const id of this.#slow.keys()) this.#host.setSlow(id, 1);
    this.#positions.clear();
    this.#chill.clear();
    this.#launches.clear();
    this.#killed.clear();
    this.#hits.clear();
    this.#shotWeapons.clear();this.#activeShot=undefined;
    this.#commands.length = 0;
    this.#elements.reset();this.#slow.clear();this.secondaryBudget.clear();this.#time = 0;this.#hitCount=0;this.#directKills=0;this.#burns.clear();this.#fireSlowUntil.clear();
    this.#combat.resetMutationEncounter();
  }

  statuses(id:number){const alive=this.#host.targets().some(t=>t.id===id&&t.health>0),chillStacks=alive?this.#stacks(id):0;return{chilled:chillStacks>0,chillStacks,controlResisted:alive&&this.#elements.controlResisted(id),burning:alive&&(this.#burns.get(id)?.expiresAt??0)>this.#time,poisoned:alive&&this.#elements.poisoned(id),frozen:alive&&this.#elements.frozen(id),shocked:alive&&this.#elements.shocked(id)};}
  hurt(beforeArmor:number,afterArmor:number,player:{x:number;y:number}){this.#elements.hurt(beforeArmor,afterArmor,player);}
  #stacks(id:number){const c=this.#chill.get(id);return c&&c.expiresAt>this.#time?c.stacks:0;}
  #addChill(t:MutationTarget,stacks:number,duration:number){if(!this.#host.targets().some(x=>x.id===t.id&&x.health>0))return;this.#chill.set(t.id,{stacks:Math.max(stacks,this.#stacks(t.id)),expiresAt:Math.max(this.#time+duration,this.#chill.get(t.id)?.expiresAt??0)});this.#host.boonEffect?.('frost',t.x,t.y);}
  #refreshSlow(t:MutationTarget,cryo=familyBonuses(this.#combat.build).cryo){const stacks=this.#stacks(t.id),slow=Math.min(stacks?1-stacks*.15-(cryo?.05:0):1,this.#elements.slow(t),(this.#fireSlowUntil.get(t.id)??0)>this.#time?.55:1);if((this.#slow.get(t.id)??1)!==slow){this.#slow.set(t.id,slow);this.#host.setSlow(t.id,slow);}}
  completedReload(player:Readonly<{x:number;y:number}>):void{
    this.#elements.reload(player);const build=this.#combat.build,has=(id:import('./types').MutationId)=>build.mutations.includes(id);
    if(has('hot-reload'))this.#host.boonEffect?.('overload',player.x,player.y);
    if(!has('cold-snap'))return;
    const family=familyBonuses(build);
    const targets=this.#host.targets().filter(t=>t.health>0&&Math.hypot(t.x-player.x,t.y-player.y)<=190&&this.#host.canAffect?.(player,t)!==false).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y)||a.id-b.id).slice(0,3);
    for(const t of targets){const before=this.#stacks(t.id);this.#chill.set(t.id,{stacks:Math.min(3,before+2),expiresAt:this.#time+(has('permafrost')?3500:2000)+(family.cryo?500:0)});const id=this.#combat.nextMutationEventId('cold-snap');this.#elements.reachedChill(t,before,{chainId:id,depth:1},id);const slow=Math.min(1-this.#stacks(t.id)*.15-(family.cryo?.05:0),this.#elements.slow(t));this.#host.setSlow(t.id,slow);this.#slow.set(t.id,slow);this.#host.boonEffect?.('frost',t.x,t.y);}
    this.#host.boonEffect?.('frost',player.x,player.y);
  }

  #remember(target: MutationTarget): void {
    this.#positions.set(target.id, { ...target });
  }

  #dispatch(event: BuildEvent, wallVisual?:()=>void): boolean {
    const result = this.#combat.resolveMutationEvent(event);
    if(result.rejected)return false;
    wallVisual?.(); // Native ability launches still make physical contact when no damage boon is owned.
    this.#commands.push(...result.commands);
    if (this.#executing) return true;
    this.#executing = true;
    try {
      while (this.#commands.length) this.#execute(this.#commands.shift()!);
    } finally {
      this.#executing = false;
    }
    return true;
  }

  #execute(command: BuildCommand): void {
    if (command.type === 'resources' || command.type === 'shot-bonus') return;
    const targetId = Number(command.type === 'explosion' ? command.centerTargetId : command.targetId);
    if (!Number.isSafeInteger(targetId)) return;
    const live = this.#host.targets().find((target) => target.id === targetId && target.health > 0);
    if (live) this.#remember(live);
    if (command.type === 'chill') {
      if (command.stacks === 0) {this.#chill.delete(targetId);this.#elements.clearFreeze(targetId);}
      if (!live) return;
      if (command.stacks > 0) this.#chill.set(targetId, { stacks: command.stacks, expiresAt: this.#time + command.durationMs });
      this.#host.setSlow(targetId, 1 - command.slowFraction);this.#slow.set(targetId,1-command.slowFraction);
      if(command.stacks>0)this.#host.boonEffect?.('frost',live.x,live.y);
    } else if (command.type === 'impulse') {
      const target = live ?? this.#positions.get(targetId);
      if (!target) return;
      if(target.immovable||target.resistant){if(live){this.#elements.stagger(target);this.#refreshSlow(target);}return;}
      this.#launches.set(targetId, { x: command.x, y: command.y, cause: command.cause, commandId: command.id, remainingMs: 900, touched: new Set([targetId]), ...(!live ? { ghost: { ...target, health: 0 } } : {}) });
    } else if (command.type === 'damage') {
      if (live){if(!command.visual)this.#host.boonEffect?.('impact',live.x,live.y);this.#damage(live, command.amount, command);}
    } else if (command.type === 'explosion') {
      const center = live ?? this.#positions.get(targetId);
      if (!center) return;
      if(command.visual==='shatter')this.#host.boonEffect?.('shatter',center.x,center.y,undefined,undefined,command.radius);
      else if(command.visual!=='wall-slam')this.#host.effect?.(center.x, center.y, command.radius);
      const targets = this.#host.targets().filter((target) => target.health > 0 && Math.hypot(target.x - center.x, target.y - center.y) <= command.radius && this.#host.canAffect?.(center,target)!==false)
        .sort((a, b) => Math.hypot(a.x - center.x, a.y - center.y) - Math.hypot(b.x - center.x, b.y - center.y) || a.id - b.id)
        .slice(0, command.maxTargets);
      for (const target of targets) this.#damage(target, command.damage, command);
    }
  }

  #damage(target: MutationTarget, amount: number, command: BuildCommand, source:'status'|'boon'='boon'): void {
    const used=this.secondaryBudget.get(command.cause.chainId)??0;
    if((source!=='status'&&this.secondaryBudget.size>=4096&&!this.secondaryBudget.has(command.cause.chainId))||command.cause.depth>BUILD_LIMITS.maxDepth||used>=BUILD_LIMITS.maxEventsPerChain||!this.#host.targets().some(t=>t.id===target.id&&t.health>0))return;
    this.secondaryBudget.set(command.cause.chainId,used+1);this.#remember(target);
    const result = this.#host.damage(target.id, amount,source);
    if (result.applied && result.died) this.kill(target, 'secondary', command.cause, `${command.id}:kill:${target.id}`);
  }

  #stepLaunches(deltaMs: number): void {
    for (const [id, launch] of [...this.#launches]) {
      const before = launch.ghost ?? this.#host.targets().find((target) => target.id === id && target.health > 0);
      if (!before) { this.#launches.delete(id); continue; }
      this.#remember(before);
      const from=this.#positions.get(id)!;
      const speed = Math.hypot(launch.x, launch.y);
      const dx = launch.x * deltaMs / 1000;
      const dy = launch.y * deltaMs / 1000;
      let blocked: boolean;
      if (launch.ghost) {
        const moved = this.#host.moveCorpse(before, dx, dy);
        launch.ghost = { ...before, x: moved.x, y: moved.y };
        blocked = moved.blocked;
      } else blocked = this.#host.move(id, dx, dy).blocked;
      const current = launch.ghost ?? this.#host.targets().find((target) => target.id === id && target.health > 0);
      if (!current) { this.#launches.delete(id); continue; }
      this.#remember(current);
      const contacts:Array<{target:MutationTarget;entry:number}>=[];
      const targets=this.#host.targets();
      for(let i=0;i<Math.min(targets.length,BUILD_LIMITS.maxEncounterEvents);i++){
        const other=targets[i];
        if(other.health<=0||launch.touched.has(other.id))continue;
        const entry=sweptCircle(from,current,other,other.radius+current.radius);
        if(entry===null)continue;
        const contact={x:from.x+(current.x-from.x)*entry,y:from.y+(current.y-from.y)*entry};
        if(this.#host.canAffect?.(from,contact)===false||this.#host.canAffect?.(contact,other)===false)continue;
        contacts.push({target:other,entry});
      }
      contacts.sort((a,b)=>a.entry-b.entry||a.target.id-b.target.id);
      for(const {target:other}of contacts){
        if(!this.#host.targets().some(t=>t.id===other.id&&t.health>0))continue;
        launch.touched.add(other.id);
        this.#host.launchCollision?.(from,other,false);
        this.#remember(other);
        this.#dispatch({ id: `${launch.commandId}:body:${other.id}`, cause: launch.cause, type: 'body-collision', targetId: String(other.id), impulse: speed, direction: { x: launch.x, y: launch.y } });
      }
      if (blocked) {
        this.#launches.delete(id);
        if(!launch.ghost)this.#host.launchCollision?.(from,current,true);
        this.#dispatch({ id: `${launch.commandId}:wall`, cause: launch.cause, type: 'wall-hit', targetId: String(id), impulse: speed },()=>this.#host.wallSlam?.(current,{x:from.x+dx,y:from.y+dy},speed));
        continue;
      }
      launch.remainingMs -= deltaMs;
      const decay = Math.exp(-4 * deltaMs / 1000);
      launch.x *= decay;
      launch.y *= decay;
      if (launch.remainingMs <= 0 || !launch.ghost && speed < 10) this.#launches.delete(id);
    }
  }
}
