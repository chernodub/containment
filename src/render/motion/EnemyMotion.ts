import * as T from 'three';
import {isAnatomicalBone} from './AnatomicalFrost';

/** Living body motion is presentation-only; the simulation root never moves. */
export const ACTOR_OFFSET_FRACTION = .35;
export const ACTOR_IMPULSE_SECONDS = .25;
export const HEAVY_HOLD_SECONDS = .032;
const UP = new T.Vector3(0, 1, 0);
const IDENTITY = new T.Quaternion();

type Joint = {bone: T.Object3D; rest: T.Quaternion; role: number; side: number};
type Profile = {rate: number; pitch: number; arm: number; breath: number; weight: number; rear: number; squashX: number; squashY: number; squashZ: number; strike: number; entrance: number};
const PROFILES: Record<string, Profile> = {
  crawler: {rate: 1.4, pitch: .10, arm: .16, breath: .012, weight: .75, rear: -0.26, squashX: 0.2, squashY: -0.22, squashZ: -0.34, strike: 0.72, entrance: 1},
  spitter: {rate: 1.05, pitch: -.21, arm: .42, breath: .018, weight: 1, rear: -0.24, squashX: 0.16, squashY: 0.18, squashZ: -0.22, strike: 0.48, entrance: 0.9},
  brute: {rate: .8, pitch: .14, arm: .42, breath: .009, weight: 2, rear: -0.2, squashX: 0.1, squashY: 0.24, squashZ: -0.2, strike: 0.72, entrance: 1.2},
  stalker: {rate: 1.25, pitch: .08, arm: .34, breath: .014, weight: .85, rear: 0.3, squashX: 0.2, squashY: -0.26, squashZ: -0.15, strike: -0.35, entrance: 1.4},
  carrier: {rate: .85, pitch: -.08, arm: .20, breath: .012, weight: 1.6, rear: -0.18, squashX: 0.14, squashY: -0.12, squashZ: -0.12, strike: 0.4, entrance: 0.7},
  queen: {rate: .7, pitch: .07, arm: .25, breath: .008, weight: 3, rear: 0.07, squashX: 0, squashY: 0, squashZ: 0, strike: -0.1, entrance: 0.6},
};
export type EnemyAttackPhase = 'approach' | 'windup' | 'strike' | 'recovery';
export type EnemyStrikeShape = {kind: 'arc' | 'cone' | 'line'; range: number; halfAngle: number; width: number};

/** Actor-local clocks and reusable bone offsets. No result is returned to gameplay. */
export class EnemyMotion {
  authored=false;
  readonly state = {holdMs: 0, offsetX: 0, offsetZ: 0, anticipation: 0, phase: 0,
    offsetLimit: 0, impulseAge: 1, attackPhase: 'approach' as EnemyAttackPhase, strikeRange: 0};
  private readonly profile: Profile;
  private readonly joints: Joint[] = [];
  private readonly parent = new T.Quaternion();
  private readonly rotation = new T.Quaternion();
  private readonly delta = new T.Quaternion();
  private readonly side = new T.Vector3();
  private readonly hammerArms: Array<{upper:T.Object3D;lower:T.Object3D;tip:T.Object3D;side:number}> = [];
  private readonly shoulderPoint = new T.Vector3();
  private readonly elbowPoint = new T.Vector3();
  private readonly handPoint = new T.Vector3();
  private readonly handTarget = new T.Vector3();
  private readonly elbowTarget = new T.Vector3();
  private readonly chainDirection = new T.Vector3();
  private readonly bendDirection = new T.Vector3();
  private readonly fromDirection = new T.Vector3();
  private readonly toDirection = new T.Vector3();
  private readonly headPoint = new T.Vector3();
  private readonly head: T.Object3D | undefined;
  private previous: number | undefined;
  private visualTime = 0;
  private hold = 0;
  private cooldown = 0;
  private impact = 0;
  private impactAge = 1;
  private heavy = false;
  private hitAngle = 0;
  private release = 0;
  private emergence = 0;
  private strength = 1;
  private reduced = false;
  private restored = true;
  private readonly restY: number;
  private seed = 0;
  private nativePhase: EnemyAttackPhase | undefined;
  private nativeProgress = 0;
  private nativeAngle = 0;
  private strikeRange = 0;

  constructor(private root: T.Group, private body: T.Group, asset: T.Object3D, private family: string) {
    this.profile = PROFILES[family] ?? PROFILES.crawler;
    this.restY = body.position.y;
    this.head = asset.getObjectByName('head');
    if (family === 'brute') for (const side of [-1,1]) {
      const suffix=side<0?'l':'r',upper=asset.getObjectByName(`shoulder${suffix}`),lower=asset.getObjectByName(`forearm${suffix}`),tip=asset.getObjectByName(`claw${suffix}`);
      if(upper&&lower&&tip)this.hammerArms.push({upper,lower,tip,side});
    }
    this.state.offsetLimit = ACTOR_OFFSET_FRACTION * (root.userData.colliderRadius ?? .5);
    asset.traverse(bone => {
      if (!(bone instanceof T.Bone) || !isAnatomicalBone(bone.name, family)) return;
      const name=bone.name.replaceAll('.', '').toLowerCase();
      let role=/^(chest|torso|neck_lo|neck|head|tail|bum|body\d*|spine\d*)$/.test(name)?0
        : /^(shoulder|upper_arm|arm_up|hand)[lr]$/.test(name)?4
        : /^(forearm|claw|upper_arm001|arm_mid|hand1)[lr]$/.test(name)?1
        : /^(leg\d_upper|leg(back|front)[lr]|leg_(back|front)_up[lr]|leg_[bm][lr]|leg_(front|middle|back)[lr])$/.test(name)?2:3;
      const side=/l$/.test(name)||/^leg[012]_/.test(name)?-1:1;
      this.joints.push({bone,rest:bone.quaternion.clone(),role,side});
    });
    root.userData.motion = this.state;
  }

  setOptions(strength: number, reduced: boolean) {
    this.strength = T.MathUtils.clamp(strength, 0, 1);
    this.reduced = reduced;
    if (reduced || strength <= 0) this.hold = this.impact = 0;
  }

  setSeed(seed: number) {
    this.seed = ((seed * .61803398875) % 1 + 1) % 1;
    this.state.phase = this.seed;
  }

  setAttackState(phase: EnemyAttackPhase, progress: number, angle: number, shape?: EnemyStrikeShape | null) {
    if (phase === 'strike' && this.nativePhase !== 'strike') this.attack();
    if (phase === 'approach' && this.nativePhase === 'windup') this.release = 0;
    this.nativePhase = phase;
    this.nativeProgress = T.MathUtils.clamp(progress, 0, 1);
    this.nativeAngle = angle;
    this.strikeRange = shape ? shape.range / 32 : 0;
    this.state.attackPhase = phase;
    this.state.strikeRange = this.strikeRange;
  }

  attack() { this.release = .42; }

  hit(strength = 1, direction = 0, heavy = false) {
    if (strength <= 0) { this.impact = this.hold = 0; return; }
    this.impact = Math.max(this.impact, Math.min(1, strength));
    this.impactAge = 0;
    this.hitAngle = direction;
    this.heavy = heavy;
    if (heavy && this.cooldown <= 0 && !this.reduced && this.strength > 0) {
      this.hold = HEAVY_HOLD_SECONDS * Math.min(1, .75 + this.profile.weight * .08) * this.strength * Math.min(1, strength);
      this.cooldown = .18;
    }
  }

  /** Remove last frame's offsets before the source mixer samples any tracks. */
  restore() {
    if (this.restored) return;
    for (const joint of this.joints) joint.bone.quaternion.copy(joint.rest);
    this.restored = true;
  }

  /** Advance only the source animation clock; snapshot/warning clocks stay native. */
  begin(time: number, frozen: boolean) {
    this.restore();
    const dt = this.previous === undefined ? 0 : Math.max(0, Math.min(.05, time - this.previous));
    this.previous = time;
    this.cooldown = Math.max(0, this.cooldown - dt);
    const stopped = frozen ? dt : Math.min(dt, this.hold);
    this.hold = Math.max(0, this.hold - dt);
    this.visualTime += dt - stopped;
    this.impactAge += dt;
    this.release = Math.max(0, this.release - dt);
    this.emergence = Math.min(.34, this.emergence + dt);
    this.state.holdMs = this.hold * 1000;
    this.state.impulseAge = this.impactAge;
    return this.visualTime;
  }

  get rate() { return this.profile.rate * (.96 + this.seed * .08); }

  apply(time: number, aim: number, moving: number, anticipation: number, winding: boolean,
    frozen: boolean, burning: boolean, shocked: boolean) {
    if (this.nativePhase !== undefined && (this.nativePhase !== 'approach' || !winding)) {
      winding = this.nativePhase === 'windup';
      anticipation = this.nativeProgress;
    }
    this.state.anticipation = winding ? anticipation : 0;
    if (frozen) { this.freeze(); return; }
    const p = this.profile, motion = this.strength * (this.reduced ? .3 : 1);
    if(this.authored){
      const contact=this.impact*Math.max(0,1-this.impactAge/ACTOR_IMPULSE_SECONDS)**2*motion;
      // Authored center travel uses at most .301 radius; reserve .049 for this layer.
      const direction=aim-this.hitAngle,offset=this.state.offsetLimit*contact*.14;
      // Clips supply the limbs; the presentation parent carries the entire mass.
      // Hold a readable silhouette from the first native warning frame, rather
      // than waiting for the sampled clip to reach its anticipation extreme.
      const brace=winding?.72+.28*T.MathUtils.smoothstep(anticipation,0,.25):0;
      const recovery=this.nativePhase==='recovery'?.18+.82*(1-this.nativeProgress):0;
      const strike=this.nativePhase==='strike'?1-this.nativeProgress*.55:0;
      const mass=1/Math.sqrt(p.weight);
      const bend=contact*(this.heavy?.48:.30)*mass;
      // Hit is accepted at strike entry, so extension is already at contact.
      // The off-balance return follows the full native recovery, including elites.
      const extension=this.nativePhase==='strike'?1-.35*this.nativeProgress
        :this.nativePhase==='recovery'?.65*(1-T.MathUtils.smoothstep(this.nativeProgress,0,1)):0;
      const lunging=this.family==='stalker'||this.family==='crawler';
      const limit=lunging&&this.strikeRange>0?Math.max(0,this.strikeRange-(this.root.userData.colliderRadius??.5)):this.state.offsetLimit;
      const strikeDirection=this.nativePhase&&this.nativePhase!=='approach'?aim-this.nativeAngle:0;
      this.body.position.set(Math.sin(direction)*offset+Math.sin(strikeDirection)*limit*extension,this.restY,Math.cos(direction)*offset+Math.cos(strikeDirection)*limit*extension);
      const length=Math.hypot(this.body.position.x,this.body.position.z),bound=extension>0?limit:this.state.offsetLimit;
      if(length>bound){this.body.position.x*=bound/length;this.body.position.z*=bound/length;}
      this.body.rotation.set(
        Math.cos(direction)*bend+(brace*p.rear*.90+strike*p.strike*.44+recovery*.22)*motion,
        recovery*.12*motion,-Math.sin(direction)*bend-recovery*.13*motion);
      // Compression and release stay deliberately smaller than the authored
      // poses; this layer must survive replacement meshes on the same rig.
      this.body.scale.set(1+(brace*(this.family==='brute'?.18:p.squashX*.90)+strike*.10)*motion,
        1+(brace*(this.family==='brute'?-.10:p.squashY*.90)-strike*.10-contact*.06)*motion,
        1+(brace*p.squashZ*.90+strike*.16)*motion);
      this.body.position.y-=contact*.045/p.weight;
      this.body.position.y-=recovery*.025*motion;
      this.state.offsetX=this.body.position.x;this.state.offsetZ=this.body.position.z;return;
    }

    const bold = this.family !== 'queen';
    const impactWindow = Math.max(0, 1 - this.impactAge / ACTOR_IMPULSE_SECONDS);
    const contact = this.impact * impactWindow * impactWindow;
    const follow = this.impact * Math.exp(-this.impactAge * 10) * Math.sin(this.impactAge * 28);
    const direction = aim - this.hitAngle;
    const distance = this.state.offsetLimit * contact * motion;
    const releaseAge = .42 - this.release;
    const strike = this.release > 0 ? Math.sin(Math.min(1, releaseAge / .045) * Math.PI / 2) * Math.max(0, 1 - releaseAge / .15) : 0;
    const rebound = this.impact * Math.sin(Math.min(1, Math.max(0, this.impactAge - .09) / .31) * Math.PI);
    const recovery = this.nativePhase === 'recovery' ? .20 + .80 * Math.sin((1 - this.nativeProgress) * Math.PI / 2)
      : this.release > 0 ? Math.sin(Math.min(1, Math.max(0, releaseAge - .08) / .34) * Math.PI) : 0;
    // Deliberate held anticipation, followed by a 2–3-frame extension and an
    // asymmetric off-balance recovery. The native snapshot owns all timing.
    const brace = winding ? .78 + .22 * Math.min(1, anticipation / .24) : 0;
    const rise = T.MathUtils.smoothstep(this.emergence, 0, .34);
    const entrance = 1 - rise;
    const recoilPitch = Math.cos(direction) * contact * (this.heavy ? .68 : .55);
    const recoilRoll = -Math.sin(direction) * (contact * (this.heavy ? .58 : .45) - rebound * .16);
    const lungeLimit=this.family==='stalker'&&this.strikeRange>0?Math.min(this.strikeRange,2.2):this.state.offsetLimit;
    const lunge = bold ? lungeLimit * strike : 0;
    // Strike follows the exact simulation-facing vector. The body remains a
    // child of the unchanged root, ring, health bar and collider.
    const strikeDirection = this.nativePhase&&this.nativePhase!=='approach'?aim-this.nativeAngle:0;
    this.body.position.set(Math.sin(direction) * distance + Math.sin(strikeDirection) * lunge,
      this.restY - Math.min(.28, .055 * p.weight) * entrance + (bold && this.heavy && p.weight < 1 ? contact * .24 : -contact * .025) * motion,
      Math.cos(direction) * distance + Math.cos(strikeDirection) * lunge);
    const horizontal = Math.hypot(this.body.position.x, this.body.position.z);
    const translationLimit=strike>0?Math.max(this.state.offsetLimit,lungeLimit):this.state.offsetLimit;
    if (horizontal > translationLimit) {
      this.body.position.x *= translationLimit / horizontal;
      this.body.position.z *= translationLimit / horizontal;
    }
    this.state.offsetX = this.body.position.x;
    this.state.offsetZ = this.body.position.z;
    const anticipationPitch = bold ? p.rear : p.pitch;
    this.body.rotation.x = (brace * anticipationPitch + strike * (bold ? p.strike : -p.pitch * .55) + recovery * (bold ? .25 : 0) + recoilPitch + follow * .12 / p.weight - rebound * .14) * motion;
    this.body.rotation.y = (bold ? recovery * .24 + contact * Math.sin(direction) * (p.weight < 1 && this.heavy ? .7 : .16) : 0) * motion;
    this.body.rotation.z = (recoilRoll + (bold ? recovery * -.22 : 0)) * motion;
    this.body.scale.set(1 + (contact * .045 + (bold ? brace * p.squashX + strike * .18 - (bold ? entrance * .28 : 0) : 0)) * motion,
      1 + ((bold ? brace * p.squashY - strike * .23 - entrance * .30 : 0) - contact * (this.heavy ? .18 : .07)) * motion,
      1 + (contact * .035 + (bold ? brace * p.squashZ + strike * .30 - entrance * .10 : 0)) * motion);
    this.body.scale.x = Math.max(.65, this.body.scale.x);
    this.body.scale.y = Math.max(.64, this.body.scale.y);
    this.body.scale.z = Math.max(.55, this.body.scale.z);
    const breath = Math.sin(time * (burning ? 7 : 2.6) + this.seed * 6.28) * p.breath;
    const gait=moving>.3?Math.sin(time*p.rate*7+this.seed*6.28)*.12:0;
    const distress=burning?Math.sin(time*9+this.seed*6.28)*.14:0;
    this.body.position.y+=Math.max(0,breath)*motion*(moving>.3?.25:.55);
    this.body.rotation.z+=(distress*.6+convulseBody(shocked,time,this.seed,this.reduced)) * motion;
    const convulse = shocked && !this.reduced ? Math.sin(time * 43 + this.seed * 6.28) * (bold ? .22 : .055) : 0;
    this.side.set(-Math.sin(aim), 0, Math.cos(aim));
    for (const joint of this.joints) {
      joint.rest.copy(joint.bone.quaternion);
      let pitch: number, yaw: number;
      if (bold) {
        const r = joint.role, s = joint.side;
        pitch = r === 0 ? brace * -.12 + strike * .22 + recoilPitch * .5 + breath + convulse + distress * .6
          : r === 1 || r === 4 ? (r === 4 ? brace * -.45 + strike * .50 : brace * -.10 + strike * .12) + recovery * .16 + contact * -.24 + entrance * p.entrance * (r === 4 ? -.82 : .20)
          : r === 2 ? brace * .20 + strike * -.28 + contact * (this.heavy ? .9 : .48) + rebound * s * .30 + entrance * s * .82 * p.entrance + gait*s
          : brace * -.28 + strike * .30 + contact * -.7 - rebound * s * .25 + entrance * -s * .60 * p.entrance - gait*s;
        pitch+=r===0?0:distress*joint.side;
        yaw = r === 0 ? contact * Math.sin(direction) * .38
          : s * (brace * (r === 1 || r === 4 ? .18 : .20) - strike * .20 + recovery * .18 + contact * .30);
      } else {
        pitch = joint.role === 0 ? brace * p.arm - strike * .20 + breath * (moving > .3 ? .2 : 1) + convulse : -brace * p.arm + strike * .25;
        pitch += contact * Math.cos(direction) * (this.heavy ? .20 : .07);
        yaw = joint.role === 0 ? contact * Math.sin(direction) * .16 : joint.side * brace * p.arm * .35;
      }
      joint.bone.parent!.getWorldQuaternion(this.parent);
      this.rotation.setFromAxisAngle(this.side, pitch * motion);
      this.delta.setFromAxisAngle(UP, yaw * motion).multiply(this.rotation);
      this.rotation.copy(this.parent).invert().multiply(this.delta).multiply(this.parent);
      joint.bone.quaternion.premultiply(this.rotation);
    }
    if (this.family === 'brute' && (brace > 0 || strike > 0)) this.poseHammer(aim, brace, strike, motion);
    this.restored = false;
  }

  /** Two-bone world targets keep both shield fists attached above the thorax. */
  private poseHammer(aim: number, brace: number, strike: number, strength: number) {
    if (!this.head) return;
    this.head.getWorldPosition(this.headPoint);
    for (const arm of this.hammerArms) {
      arm.upper.getWorldPosition(this.shoulderPoint);
      arm.lower.getWorldPosition(this.elbowPoint);
      arm.tip.getWorldPosition(this.handPoint);
      const upperLength=this.shoulderPoint.distanceTo(this.elbowPoint),lowerLength=this.elbowPoint.distanceTo(this.handPoint);
      const forward=strike>.01?.48:-.08;
      this.handTarget.copy(this.headPoint);
      this.handTarget.x+=Math.cos(aim)*forward-Math.sin(aim)*arm.side*.43;
      this.handTarget.z+=Math.sin(aim)*forward+Math.cos(aim)*arm.side*.43;
      this.handTarget.y+=strike>.01?-.72:.34;
      this.chainDirection.copy(this.handTarget).sub(this.shoulderPoint);
      const distance=Math.min(upperLength+lowerLength-.001,Math.max(.01,this.chainDirection.length()));
      this.chainDirection.normalize();
      this.handTarget.copy(this.shoulderPoint).addScaledVector(this.chainDirection,distance);
      const along=(upperLength*upperLength+distance*distance-lowerLength*lowerLength)/(2*distance);
      const bend=Math.sqrt(Math.max(0,upperLength*upperLength-along*along));
      this.bendDirection.set(Math.cos(aim)-Math.sin(aim)*arm.side*.3,0,Math.sin(aim)+Math.cos(aim)*arm.side*.3);
      this.bendDirection.addScaledVector(this.chainDirection,-this.bendDirection.dot(this.chainDirection)).normalize();
      this.elbowTarget.copy(this.shoulderPoint).addScaledVector(this.chainDirection,along).addScaledVector(this.bendDirection,bend);
      this.fromDirection.copy(this.elbowPoint).sub(this.shoulderPoint);
      this.toDirection.copy(this.elbowTarget).sub(this.shoulderPoint);
      this.rotateToward(arm.upper,Math.max(brace,strike)*strength);
      arm.lower.getWorldPosition(this.elbowPoint);arm.tip.getWorldPosition(this.handPoint);
      this.fromDirection.copy(this.handPoint).sub(this.elbowPoint);
      this.toDirection.copy(this.handTarget).sub(this.elbowPoint);
      this.rotateToward(arm.lower,Math.max(brace,strike)*strength);
    }
  }

  private rotateToward(bone: T.Object3D, weight: number) {
    this.fromDirection.normalize();this.toDirection.normalize();
    this.delta.setFromUnitVectors(this.fromDirection,this.toDirection).slerp(IDENTITY,1-T.MathUtils.clamp(weight,0,1));
    bone.parent!.getWorldQuaternion(this.parent);
    this.rotation.copy(this.parent).invert().multiply(this.delta).multiply(this.parent);
    bone.quaternion.premultiply(this.rotation);bone.updateWorldMatrix(false,true);
  }

  freeze(preserveBody = false) {
    if (!preserveBody) {
      this.body.position.set(0, this.restY, 0);
      this.body.rotation.set(0, 0, 0);
      this.body.scale.set(1, 1, 1);
    }
    this.hold = 0;
    this.state.holdMs = this.state.offsetX = this.state.offsetZ = 0;
  }

  reset() {
    this.restore(); this.freeze(); this.previous = undefined;
    this.visualTime = this.cooldown = this.impact = this.release = this.emergence = 0;
    this.impactAge = 1; this.nativePhase = undefined; this.nativeProgress = this.nativeAngle = this.strikeRange = 0;
    this.state.holdMs = this.state.offsetX = this.state.offsetZ = this.state.anticipation = 0;
    this.state.attackPhase = 'approach'; this.state.strikeRange = 0;
  }
}

function convulseBody(shocked: boolean, time: number, seed: number, reduced: boolean) {
  return shocked && !reduced ? Math.sin(time*43+seed*6.28)*.11 : 0;
}
