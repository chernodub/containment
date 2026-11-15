import * as T from 'three';
import type {MarineMotion} from './MarineMotion';
import type {EnemyAttackPhase} from './EnemyMotion';
import type {DeathCue} from '../DeathRagdolls';

const RUNS = Array.from({length:8},(_,i)=>`m10-run-${i*45}`);
const STARTS = Array.from({length:8},(_,i)=>`m10-start-${i*45}`);
const STOPS = Array.from({length:8},(_,i)=>`m10-stop-${i*45}`);
const REVERSALS = Array.from({length:8},(_,i)=>`m10-reversal-${i*45}`);
const DIRECTIONS = ['front','right','back','left'];
const MARINE_HITS = DIRECTIONS.map(side=>`m10-hit-${side}`);
const MARINE_DEATHS = ['m10-death','m10-death-right','m10-death-back','m10-death-left'];
const LIGHT_HITS = DIRECTIONS.map(side=>`m10-hit-light-${side}`);
const HEAVY_HITS = DIRECTIONS.map(side=>`m10-hit-heavy-${side}`);
const CASTS:Record<string,string> = Object.fromEntries(['ram','seismic-slam','bulwark','railbreaker','frost-trail','cryo-nova','glacier','whiteout','afterburn','flashfire','napalm-charge','meltdown','static-step','overload','tesla-pylon','overclock'].map(id=>[id,`m10-cast-${id}`]));
const FIRES:Record<string,string> = {pistol:'m10-fire-pistol',rifle:'m10-fire-rifle',shotgun:'m10-fire-shotgun',plasma:'m10-fire-plasma',rocket:'m10-fire-rocket'};
const DEATHS:Record<DeathCue,string> = {none:'m10-death-none',frost:'m10-death-frost',burn:'m10-death-burn',arc:'m10-death-arc',acid:'m10-death-acid'};
const directionIndex=(direction:number,aim:number)=>((Math.round((direction-aim+Math.PI)/(Math.PI/2))%4)+4)%4;

/** Prepared absolute bone clips, with cached upper layers and an optional reduced-motion base. */
export class AuthoredMotionPlayer {
  private readonly actions = new Map<string,T.AnimationAction>();
  private readonly markers=new Map<string,number>();
  private readonly upper = new Map<string,T.AnimationAction>();
  private upperCurrent:T.AnimationAction|undefined;
  private readonly grips=new Map<string,T.AnimationAction>();
  private gripCurrent:T.AnimationAction|undefined;
  private neutral:T.AnimationAction|undefined;
  private current:T.AnimationAction|undefined;
  private previous:T.AnimationAction|undefined;
  private blend=1;
  private fade=.06;
  readonly available:boolean;

  constructor(private readonly mixer:T.AnimationMixer,clips:readonly T.AnimationClip[],root?:T.Object3D) {
    const upperNames=new Set<string>();root?.getObjectByName('ribs')?.traverse(node=>upperNames.add(node.name));
    const ready=clips.find(clip=>clip.name==='m10-ready-shotgun');
    for(const clip of clips)if(clip.name.startsWith('m10-')){
      const action=mixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.paused=true;
      this.actions.set(clip.name,action);
      const extras=(clip as T.AnimationClip&{userData?:{m10ImpactSeconds?:number}}).userData;if(extras?.m10ImpactSeconds!==undefined)this.markers.set(clip.name,extras.m10ImpactSeconds/clip.duration);
      if(upperNames.size&&(clip.name==='m10-reload'||clip.name==='m10-switch'||clip.name.startsWith('m10-fire-'))){
        const layer=clip.clone();layer.name=clip.name+'-upper';layer.tracks=layer.tracks.filter(track=>upperNames.has(T.PropertyBinding.parseTrackName(track.name).nodeName));
        T.AnimationUtils.makeClipAdditive(layer,0,clip,60);const overlay=mixer.clipAction(layer);overlay.setLoop(T.LoopOnce,1);overlay.clampWhenFinished=true;overlay.paused=true;this.upper.set(clip.name,overlay);
      }
    }
    if(ready)for(const clip of clips)if(clip.name.startsWith('m10-ready-')&&clip!==ready){
      const layer=clip.clone();layer.name=clip.name+'-grip';layer.tracks=layer.tracks.filter(track=>upperNames.has(T.PropertyBinding.parseTrackName(track.name).nodeName));
      T.AnimationUtils.makeClipAdditive(layer,0,ready,60);const action=mixer.clipAction(layer);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.paused=true;this.grips.set(clip.name.slice(10),action);
    }
    const idle=clips.find(clip=>clip.name==='m10-idle');if(idle){const reference=idle.clone();reference.name='m10-neutral-blend';this.neutral=mixer.clipAction(reference);this.neutral.paused=true;}
    this.available=this.actions.size>0;
  }

  has(name:string):boolean{return this.actions.has(name);}
  impact(name:string):number{return this.markers.get(name)??.32/.88;}
  duration(name:string):number{return this.actions.get(name)?.getClip().duration??0;}
  sample(name:string,progress:number,dt:number,fade=.06,amplitude=1):boolean {
    const next=this.actions.get(name);if(!next)return false;
    if(next!==this.current){
      if(!this.current)this.mixer.stopAllAction();
      this.previous?.stop();this.previous=this.current;this.current=next;
      next.reset().play();next.paused=true;this.fade=fade;this.blend=this.previous?0:1;
    }
    this.blend=Math.min(1,this.blend+dt/Math.max(.001,this.fade));
    next.time=T.MathUtils.clamp(progress,0,1)*next.getClip().duration;
    next.setEffectiveWeight(this.blend*amplitude);
    if(this.previous){this.previous.setEffectiveWeight((1-this.blend)*amplitude);if(this.blend===1){this.previous.stop();this.previous=undefined;}}
    if(this.neutral){if(amplitude<1){this.neutral.play();this.neutral.paused=true;this.neutral.time=0;this.neutral.setEffectiveWeight(1-amplitude);}else this.neutral.stop();}
    this.mixer.update(0);return true;
  }
  clearUpper():void{this.upperCurrent?.stop();this.upperCurrent=undefined;this.gripCurrent?.stop();this.gripCurrent=undefined;}
  grip(weapon:string):void{const action=this.grips.get(weapon);if(!action)return;action.play();action.paused=true;action.time=0;action.setEffectiveWeight(1);this.gripCurrent=action;this.mixer.update(0);}
  overlay(name:string,progress:number):void{const action=this.upper.get(name);if(!action)return;action.reset().play();action.paused=true;action.time=T.MathUtils.clamp(progress,0,1)*action.getClip().duration;action.setEffectiveWeight(1);this.upperCurrent=action;this.mixer.update(0);}
  reset():void{this.clearUpper();this.neutral?.stop();this.current?.stop();this.previous?.stop();this.current=this.previous=undefined;this.blend=1;}
}

/** Native clocks select authored marine choreography; roots remain simulation-owned. */
export class AuthoredMarineMotion {
  private previous:number|undefined;
  private gait=0;
  private hitAge=10;
  private hitDirection=0;
  private fireAge=10;
  private recoil=0;
  private switchAge=10;
  private weapon='';
  private transitionAge=10;
  private transition='';
  private lastDirection=0;
  private wasMoving=false;
  private lastVx=0;
  private lastVy=0;
  private aim=0;
  private feedback=1;
  constructor(readonly player:AuthoredMotionPlayer,private readonly motion:MarineMotion){}
  setOptions(strength:number,reduced:boolean):void{this.feedback=T.MathUtils.clamp(strength,0,1)*(reduced?.3:1);if(this.feedback===0)this.hitAge=10;}
  hit(strength:number,direction:number):void{if(strength>0&&this.feedback>0){this.hitAge=0;this.hitDirection=direction;}}
  update(time:number,aim:number,recoil:number,reload:number,vx:number,vy:number,weapon:string):boolean{
    if(!this.player.available)return false;
    this.player.clearUpper();this.aim=aim;
    const dt=this.previous===undefined?0:T.MathUtils.clamp(time-this.previous,0,.05);this.previous=time;
    this.hitAge+=dt;this.fireAge+=dt;this.switchAge+=dt;this.transitionAge+=dt;
    const speed=Math.hypot(vx,vy),moving=speed>3&&speed<700;
    const direction=moving?((Math.round((Math.atan2(vy,vx)-aim)/(Math.PI/4))%8)+8)%8:this.lastDirection;
    this.gait+=dt*(speed/220)/Math.max(.1,this.player.duration(RUNS[direction])||.4);
    if(moving&&!this.wasMoving){this.transition=STARTS[direction];this.transitionAge=0;}
    else if(!moving&&this.wasMoving){this.transition=STOPS[this.lastDirection];this.transitionAge=0;}
    else if(moving&&this.wasMoving&&vx*this.lastVx+vy*this.lastVy<-.45*speed*Math.hypot(this.lastVx,this.lastVy)){this.transition=REVERSALS[direction];this.transitionAge=0;}
    this.wasMoving=moving;this.lastDirection=direction;this.lastVx=vx;this.lastVy=vy;
    if(this.weapon&&this.weapon!==weapon)this.switchAge=0;this.weapon=weapon;
    if(recoil>this.recoil+.08)this.fireAge=0;this.recoil=recoil;
    const cast=CASTS[this.motion.actionName];
    if(cast&&this.player.has(cast)){
      const phase=this.motion.actionNormalized;
      // Cast receipts hold overhead anticipation; only accepted impact opens the downbeat.
      const marker=this.player.impact(cast),p=this.motion.actionHeldCast?(phase<.42?phase/.42*marker:marker+(phase-.42)/.58*(1-marker)):phase;
      return this.player.sample(cast,p,dt,.035);
    }
    const hit=MARINE_HITS[directionIndex(this.hitDirection,aim)],hitName=this.player.has(hit)?hit:'m10-hit-front';
    if(this.hitAge<this.player.duration(hitName))return this.player.sample(hitName,this.hitAge/this.player.duration(hitName),dt,.025,this.feedback);
    if(moving&&this.player.has(RUNS[direction])){
      const fire=FIRES[weapon];
      const layer=reload>0?'m10-reload':this.switchAge<this.player.duration('m10-switch')?'m10-switch':this.fireAge<this.player.duration(fire)?fire:'';
      if(layer){this.travel(direction,moving,speed,time,dt);this.player.grip(weapon);this.player.overlay(layer,reload>0?reload:layer==='m10-switch'?this.switchAge/this.player.duration(layer):this.fireAge/this.player.duration(layer));return true;}
    }
    if(reload>0&&this.player.has('m10-reload'))return this.player.sample('m10-reload',reload,dt);
    if(this.switchAge<this.player.duration('m10-switch'))return this.player.sample('m10-switch',this.switchAge/this.player.duration('m10-switch'),dt);
    const fire=FIRES[weapon];if(!moving&&this.fireAge<this.player.duration(fire))return this.player.sample(fire,this.fireAge/this.player.duration(fire),dt,.02);
    const sampled=this.travel(direction,moving,speed,time,dt);this.player.grip(weapon);return sampled;
  }
  private travel(direction:number,moving:boolean,speed:number,time:number,dt:number):boolean{
    const transitionDuration=this.player.duration(this.transition);
    if(this.transitionAge<transitionDuration)return this.player.sample(this.transition,this.transitionAge/transitionDuration,dt);
    if(transitionDuration>0){
      // Start/reversal end on cycle zero. Preserve only the real frame overshoot.
      if(moving)this.gait=(this.transitionAge-transitionDuration)*(speed/220)/Math.max(.1,this.player.duration(RUNS[direction]));
      this.transition='';
    }
    if(moving&&this.player.has(RUNS[direction]))return this.player.sample(RUNS[direction],this.gait%1,dt);
    const duration=this.player.duration('m10-idle');return this.player.sample('m10-idle',(time%duration)/duration,dt);
  }
  death(cue:DeathCue,progress:number):number{
    this.player.clearUpper();
    const directional=MARINE_DEATHS[directionIndex(this.hitDirection,this.aim)];
    const name=this.player.has(DEATHS[cue])?DEATHS[cue]:this.player.has(directional)?directional:'m10-death';
    if(!this.player.has(name))return 0;this.player.sample(name,progress,1/60,.025);return .62;
  }
  reset():void{this.player.reset();this.previous=undefined;this.gait=0;this.hitAge=this.fireAge=this.switchAge=this.transitionAge=10;this.weapon=this.transition='';this.wasMoving=false;this.lastVx=this.lastVy=this.aim=0;}
}

/** Each hostile phase samples its own baked action at the simulation's progress. */
export class AuthoredEnemyMotion {
  private previous:number|undefined;
  private age=0;
  private hitAge=10;
  private hitDirection=0;
  private heavy=false;
  private attackAge=10;
  private phase:EnemyAttackPhase='approach';
  private progress=0;
  private feedback=1;
  constructor(readonly player:AuthoredMotionPlayer){}
  setOptions(strength:number,reduced:boolean):void{this.feedback=T.MathUtils.clamp(strength,0,1)*(reduced?.3:1);if(this.feedback===0)this.hitAge=10;}
  state(phase:EnemyAttackPhase,progress:number):void{this.phase=phase;this.progress=progress;}
  hit(strength:number,direction:number,heavy:boolean):void{if(strength>0&&this.feedback>0){this.hitAge=0;this.hitDirection=direction;this.heavy=heavy;}}
  attack():void{this.attackAge=0;}
  update(time:number,moving:number,aim:number,winding:boolean,anticipation:number,frozen:boolean,burning:boolean,shocked:boolean,speed:number):boolean{
    if(!this.player.available)return false;
    const dt=this.previous===undefined?0:T.MathUtils.clamp(time-this.previous,0,.05);this.previous=time;
    if(frozen)return true;
    this.age+=dt;this.hitAge+=dt;this.attackAge+=dt;
    const hit=(this.heavy?HEAVY_HITS:LIGHT_HITS)[directionIndex(this.hitDirection,aim)];
    if(this.hitAge<this.player.duration(hit))return this.player.sample(hit,this.hitAge/this.player.duration(hit),dt,.025,this.feedback);
    if(this.phase!=='approach')return this.player.sample(this.phase==='windup'?'m10-windup':this.phase==='strike'?'m10-strike':'m10-recovery',this.progress,dt,this.phase==='strike'?.02:.04);
    if(winding)return this.player.sample('m10-windup',anticipation,dt,.04);
    if(this.attackAge<.16)return this.player.sample('m10-strike',this.attackAge/.16,dt,.02);
    if(this.attackAge<.55)return this.player.sample('m10-recovery',(this.attackAge-.16)/.39,dt);
    const spawnDuration=this.player.duration('m10-spawn');
    if(this.age<spawnDuration)return this.player.sample('m10-spawn',this.age/spawnDuration,dt);
    const name=shocked&&this.feedback>0?'m10-shocked':burning&&this.feedback>0?'m10-burning':moving>.3?'m10-run':'m10-idle';
    const duration=this.player.duration(name);return this.player.sample(name,(time*(moving>.3?speed:1)%duration)/duration,dt,.06,name==='m10-shocked'||name==='m10-burning'?this.feedback:1);
  }
  death(cue:DeathCue,progress:number):number{
    const name=DEATHS[cue];if(!this.player.has(name))return 0;
    this.player.sample(name,progress,1/60,.025);return cue==='frost'?.24:cue==='burn'?.65:cue==='arc'?.48:cue==='acid'?.72:.40;
  }
  reset():void{this.player.reset();this.previous=undefined;this.age=0;this.hitAge=this.attackAge=10;this.phase='approach';this.progress=0;}
}
