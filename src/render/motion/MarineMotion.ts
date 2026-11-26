import * as T from 'three';
import type {WeaponId} from '../../game/combat/types';
import {WEAPON_FIT, WEAPON_MOTION} from '../weapons';

/** Feet may correct authored stance error, but never pull the actor off its native root. */
export const MARINE_FOOT_CORRECTION = .12;
export const MARINE_HIT_PAUSE = .035;
const UNIT = 32;
export const MARINE_BODY_RADIUS = .5;
export const MARINE_BODY_OFFSET = MARINE_BODY_RADIUS * .35;
export const MARINE_REACTION_SECONDS = .24;
/** Forward, sideways, height offsets from shoulder, then torso pitch/yaw, stance and crouch.
 * Each ability owns its body gesture; these are presentation coordinates only. */
const CAST_POSES: Record<string, readonly number[]> = {
 'ram': [.10,-.35,-.10, -.25,.25,.15, .62,-.20,.18,.16],
 'seismic-slam': [.05,.20,.82, .05,-.20,.82, -.32,0,.12,.28],
 'bulwark': [.85,-.18,.12, -.08,.30,-.12, .48,-.52,.30,.18],
 'railbreaker': [.65,-.08,-.20, .70,.16,-.16, .58,.12,.44,.28],
 'frost-trail': [-.30,-.65,.10, .25,.50,-.25, .42,-.35,.20,.23],
 'cryo-nova': [-.08,-1.0,.12, -.08,1.0,.12, -.28,0,.35,.08],
 'glacier': [.55,-.22,-.48, .42,.12,-.10, .72,-.25,.26,.38],
 'whiteout': [-.08,-.12,.95, -.08,.12,.95, -.40,0,.28,.20],
 'afterburn': [.75,-.10,-.22, -.50,.20,.20, .68,.16,.10,.22],
 'flashfire': [.12,-.85,-.15, .88,.08,.08, .12,-.45,.28,.08],
 'napalm-charge': [.65,-.30,.12, -.40,.38,.65, -.28,.48,.12,.14],
 'meltdown': [-.30,-.75,-.38, -.30,.75,-.38, -.46,0,.38,.22],
 'static-step': [-.40,.32,.38, .65,-.25,-.20, .22,.72,.14,.21],
 'overload': [.75,-.30,.50, .12,.55,-.28, -.12,-.38,.26,.12],
 'tesla-pylon': [.60,.18,-1.05, -.08,.78,.12, .88,.42,.34,.42],
 'overclock': [.35,-.80,.56, -.20,.80,-.20, -.20,-.66,.32,.11],
};

type SavedBone = {bone: T.Object3D; q: T.Quaternion; p: T.Vector3; s: T.Vector3};
type Leg = {
  thigh: T.Object3D;
  shin: T.Object3D;
  foot: T.Object3D;
  ankle: T.Object3D;
  anchor: T.Vector2;
  contactHeight: number;
  restFoot: T.Vector3;
  restAnkle: T.Vector3;
  restAnkleRotation: T.Quaternion;
  side: number;
  planted: boolean;
  weight: number;
};

/** Source clips retain the authored rig and weapon pose; this layer supplies
 * independent directional steps and articulated actions. Call begin before the
 * mixer and finish after it. All working storage is actor-local.
 */
export class MarineMotion {
  authored=false;
  rifleLoad = 0;
  rig = '';
  shotgunShoulder = 0;
  get actionName(){return this.action;}
  get actionNormalized(){return this.actionProgress;}
  private heldCast=false;
  get actionHeldCast(){return this.heldCast;}
  gaitYaw = 0;
  backwards = false;
  moving = 0;
  speed = 0;
  visualTime = 0;
  dt = 0;
  private previous: number | undefined;
  private aim = 0;
  private travel = 0;
  private vx = 0;
  private vy = 0;
  private lastVx = 0;
  private lastVy = 0;
  private leanX = 0;
  private leanZ = 0;
  private stoppedFor = 1;
  private strength = 1;
  private reduced = false;
  private hitLife = 0;
  private hitRecover = 0;
  private hitAmount = 0;
  private hitAngle = 0;
  private hold = 0;
  private holdCooldown = 0;
  private recoilLife = 0;
  private previousRecoil = 0;
  private switchedFor = 1;
  private weapon: WeaponId | undefined;
  private action = '';
  private actionProgress = 0;
  private dead = false;
  private deadAge = 0;
  private gaitPhase = 0;
  private reversal = 0;
  private reversalX = 0;
  private reversalZ = 0;
  private readonly hips: T.Object3D | undefined;
  private readonly coolantGrip = new T.Vector3();
  private hasCoolantGrip = false;
  private readonly openFingers: {bone:T.Bone; bind:T.Quaternion}[]=[];
  private readonly rightArm: T.Object3D | undefined;
  private readonly rightForearm: T.Object3D | undefined;
  private readonly rightHand: T.Object3D | undefined;
  private readonly leftShoulder: T.Object3D | undefined;
  private readonly rightShoulder: T.Object3D | undefined;
  private readonly head: T.Object3D | undefined;
  private readonly neck: T.Object3D | undefined;
  private saved = false;
  private readonly bones: SavedBone[];
  private readonly spine: T.Object3D;
  private readonly ribs: T.Object3D;
  private readonly leftArm: T.Object3D | undefined;
  private readonly leftForearm: T.Object3D | undefined;
  private readonly leftHand: T.Object3D | undefined;
  private readonly weaponSocket: T.Object3D | undefined;
  private readonly legs: Leg[] = [];
  private readonly neutral: SavedBone[] = [];
  private readonly stride = new T.Vector2();
  private readonly up = new T.Vector3(0, 1, 0);
  private readonly axis = new T.Vector3();
  private readonly parentQ = new T.Quaternion();
  private readonly yawQ = new T.Quaternion();
  private readonly localQ = new T.Quaternion();
  private readonly turnQ = new T.Quaternion();
  private readonly footQ = new T.Quaternion();
  private readonly hip = new T.Vector3();
  private readonly hipsBase = new T.Vector3();
  private readonly knee = new T.Vector3();
  private readonly foot = new T.Vector3();
  private readonly target = new T.Vector3();
  private readonly direction = new T.Vector3();
  private readonly pole = new T.Vector3();
  private readonly desiredKnee = new T.Vector3();
  private readonly from = new T.Vector3();
  private readonly to = new T.Vector3();
  private readonly offset = new T.Vector3();

  constructor(private readonly root: T.Group, private readonly assetRoot: T.Object3D) {
    this.spine = assetRoot.getObjectByName('spine')!;
    this.ribs = assetRoot.getObjectByName('ribs')!;
    this.leftArm = assetRoot.getObjectByName('upper_armL');
    this.leftForearm = assetRoot.getObjectByName('forearmL');
    this.leftHand = assetRoot.getObjectByName('handL');
    this.weaponSocket = assetRoot.getObjectByName('tag_weapon');
    const hips = this.hips = assetRoot.getObjectByName('hips');
    this.rightArm = assetRoot.getObjectByName('upper_armR');
    this.rightForearm = assetRoot.getObjectByName('forearmR');
    this.rightHand = assetRoot.getObjectByName('handR');
    this.leftShoulder = assetRoot.getObjectByName('shoulderL');
    this.rightShoulder = assetRoot.getObjectByName('shoulderR');
    this.head = assetRoot.getObjectByName('head');
    this.neck = assetRoot.getObjectByName('neck');
    const affected = [this.spine, this.ribs, this.leftArm, this.leftForearm, this.leftHand, this.rightArm, this.rightForearm, this.rightHand, this.leftShoulder, this.rightShoulder, this.head, this.neck, hips];
    const skin=assetRoot.getObjectByName('k10-body');
    if(skin instanceof T.SkinnedMesh){
      const {bones,boneInverses}=skin.skeleton;
      bones.forEach((bone,i)=>{
        if(!/^(finger_|thumb).*L$/.test(bone.name))return;
        const parent=bones.indexOf(bone.parent as T.Bone);
        if(parent<0)return;
        const local=boneInverses[parent].clone().multiply(boneInverses[i].clone().invert());
        const bind=new T.Quaternion();
        local.decompose(new T.Vector3(),bind,new T.Vector3());
        this.openFingers.push({bone,bind});affected.push(bone);
      });
    }
    // Only the supply hose is weighted wholly to handR in the Cryo rig skin.
    // Its cuff follows the firing wrist through every weapon's ready pose.
    const cryo=assetRoot.getObjectByName('k10-rig-cryo');
    if(cryo instanceof T.SkinnedMesh && this.rightHand){
      const joint=cryo.skeleton.bones.indexOf(this.rightHand as T.Bone);
      const {skinIndex,skinWeight,position}=cryo.geometry.attributes;
      let count=0;
      for(let i=0;i<position.count;i++){
        if(skinIndex.getX(i)!==joint || skinWeight.getX(i)<.99)continue;
        this.coolantGrip.add(this.target.fromBufferAttribute(position,i));
        count++;
      }
      if(count){
        this.coolantGrip.divideScalar(count).applyMatrix4(cryo.bindMatrix).applyMatrix4(cryo.skeleton.boneInverses[joint]);
        this.hasCoolantGrip=true;
      }
    }
    if (hips) this.neutral.push({bone: hips, q: hips.quaternion.clone(), p: hips.position.clone(), s: hips.scale.clone()});
    root.updateWorldMatrix(true, true);
    for (const side of ['R', 'L']) {
      const thigh = assetRoot.getObjectByName(`thigh${side}`);
      const shin = assetRoot.getObjectByName(`shin${side}`);
      const foot = assetRoot.getObjectByName(`foot${side}`);
      const ankle = assetRoot.getObjectByName(`ankle${side}`);
      if (!thigh || !shin || !foot || !ankle) continue;
      affected.push(thigh, shin, foot, ankle);
      for (const bone of [thigh, shin, foot, ankle]) this.neutral.push({bone, q: bone.quaternion.clone(), p: bone.position.clone(), s: bone.scale.clone()});
      foot.getWorldPosition(this.foot);
      const restFoot = root.worldToLocal(this.foot.clone());
      const restAnkle = root.worldToLocal(ankle.getWorldPosition(new T.Vector3()));
      this.legs.push({thigh, shin, foot, ankle, restFoot, restAnkle, restAnkleRotation: ankle.quaternion.clone(), side: side === 'R' ? 1 : -1, anchor: new T.Vector2(), contactHeight: this.foot.y - root.position.y + .008, planted: false, weight: 0});
    }
    this.bones = affected.filter((bone): bone is T.Object3D => !!bone).map(bone => ({bone, q: bone.quaternion.clone(), p: bone.position.clone(), s: bone.scale.clone()}));
  }

  /** Preference changes clear latent impulses, including while paused. */
  setOptions(strength: number, reducedMotion: boolean) {
    this.strength = T.MathUtils.clamp(strength, 0, 1);
    this.reduced = reducedMotion;
    if (reducedMotion || this.strength === 0) this.hold = this.hitLife = this.hitRecover = this.recoilLife = 0;
  }

  /** A local pose hold never stops camera, input, root travel or the simulation. */
  hit(strength = 1, direction = this.aim, heavy = false) {
    this.hitAmount = T.MathUtils.clamp(strength, 0, 1);
    this.hitAngle = direction;
    this.root.userData.motionHitDirection = direction;
    this.hitLife = this.hitAmount > 0 ? MARINE_REACTION_SECONDS : 0;
    this.hitRecover = this.hitAmount > 0 ? MARINE_REACTION_SECONDS + .20 : 0;
    if (this.hitAmount === 0) this.hold = 0;
    if (heavy && !this.reduced && this.strength > 0 && this.holdCooldown <= 0) {
      this.hold = MARINE_HIT_PAUSE * this.hitAmount * this.strength;
      this.holdCooldown = .18;
    }
  }

  /** Snapshot/event callers own this normalized cast clock. */
  setAction(id: string, progress: number, heldCast=false) {
    this.heldCast=heldCast;
    this.action = id;
    this.actionProgress = T.MathUtils.clamp(progress, 0, 1);
  }

  setDead(dead: boolean) {
    if (dead !== this.dead) this.deadAge = 0;
    this.dead = dead;
  }

  /** Restore the last additive pose before sampling another source-clip frame. */
  begin(time: number, _moving: number, aim: number, vx: number, vy: number) {
    if (this.saved) for (const state of this.bones) {
      state.bone.quaternion.copy(state.q);
      state.bone.position.copy(state.p);
      state.bone.scale.copy(state.s);
    }
    this.saved = false;
    this.dt = this.previous === undefined ? 0 : T.MathUtils.clamp(time - this.previous, 0, .05);
    if (this.previous === undefined || time < this.previous) this.visualTime = time;
    this.previous = time;
    this.aim = aim;
    this.vx = vx;
    this.vy = vy;
    this.travel = Math.hypot(vx, vy);
    const dt = this.dt;
    this.holdCooldown = Math.max(0, this.holdCooldown - dt);
    const held = Math.min(this.hold, dt);
    this.hold = Math.max(0, this.hold - dt);
    this.visualTime += dt - held;
    this.hitLife = Math.max(0, this.hitLife - dt);
    this.hitRecover = Math.max(0, this.hitRecover - dt);
    this.stoppedFor = this.travel > 3 ? 0 : this.stoppedFor + dt;
    this.stride.x += vx * dt / UNIT;
    this.stride.y += vy * dt / UNIT;
    const direction = Math.atan2(vy, vx), forward = Math.cos(direction - aim);
    if (this.travel > 3) {
      if (forward < -.22) this.backwards = true;
      else if (forward > .02) this.backwards = false;
    }
    // Pelvis stays facing the aim: sideways and reverse travel get their own
    // procedural foot paths rather than rotating a forward clip.
    this.gaitYaw = 0;
    this.gaitPhase += (dt - held) * this.travel / UNIT / (this.backwards ? 1.5 : 1.8);
    const previousSpeed = Math.hypot(this.lastVx, this.lastVy);
    if (this.travel > 3 && previousSpeed > 3 && (vx * this.lastVx + vy * this.lastVy) / (this.travel * previousSpeed) < -.45) {
      this.reversal = .16;this.reversalX = this.lastVx / previousSpeed;this.reversalZ = this.lastVy / previousSpeed;
    }
    this.reversal = Math.max(0, this.reversal - dt);
    // Measured source planted-foot travel, rather than the old 220-unit guess.
    this.speed = T.MathUtils.clamp(this.travel / (this.backwards ? 125 : 130), 0, 4);
    this.moving = this.travel > 3 && this.travel < 700 && !this.dead ? 1 : 0;
    this.leanX = T.MathUtils.damp(this.leanX, T.MathUtils.clamp((vx - this.lastVx) / 220, -.9, .9) * .20, 18, dt);
    this.leanZ = T.MathUtils.damp(this.leanZ, T.MathUtils.clamp((vy - this.lastVy) / 220, -.9, .9) * .20, 18, dt);
    this.lastVx = vx;
    this.lastVy = vy;
    this.switchedFor += dt;
    if (this.dead) this.deadAge += dt;
  }

  /** Add bounded upper-body motion, then solve the two existing leg chains. */
  finish(weapon: WeaponId, recoil = 0, reload = 0, aimPitch = 0) {
    for (const state of this.bones) {
      state.q.copy(state.bone.quaternion);
      state.p.copy(state.bone.position);
      state.s.copy(state.bone.scale);
    }
    this.saved = true;
    this.hips?.getWorldPosition(this.hipsBase);
    if(this.authored){this.finishAuthored(weapon,recoil,reload,aimPitch);return;}
    const stop = T.MathUtils.smoothstep(this.stoppedFor, 0, .14);
    if (!this.moving && !this.dead) for (const rest of this.neutral) {
      rest.bone.quaternion.slerp(rest.q, stop);
      rest.bone.position.lerp(rest.p, stop);
      rest.bone.scale.lerp(rest.s, stop);
    }
    const death = T.MathUtils.smoothstep(this.deadAge, 0, this.reduced ? .18 : .30);
    // The simulated root is never rolled or translated by presentation. The
    // renderer hands the skeleton to the articulated corpse owner on death.
    this.root.rotation.z = 0;
    const dt = this.dt, motion = this.strength * (this.reduced ? .25 : 1);
    if (this.weapon !== weapon) {
      if (this.weapon !== undefined) this.switchedFor = 0;
      this.weapon = weapon;
    }
    const feedback = WEAPON_MOTION[weapon];
    if (recoil > this.previousRecoil + .08) this.recoilLife = Math.max(this.recoilLife, recoil);
    this.previousRecoil = recoil;
    this.recoilLife *= Math.exp(-feedback.returnRate * dt);
    // 70° maximum at the spine, with the remaining 20° at the ribs. The sum
    // cancels gait yaw exactly; aim is independent of leg travel in all 8 lanes.
    const spineYaw = T.MathUtils.clamp(-this.gaitYaw, -1.22, 1.22);
    this.rotate(this.spine, this.up, spineYaw, this.yawQ);
    this.rotate(this.ribs, this.up, -this.gaitYaw - spineYaw - T.MathUtils.degToRad(WEAPON_FIT[weapon].aimYaw), this.yawQ);
    this.axis.set(-Math.sin(this.aim), 0, Math.cos(this.aim));
    const reloading = reload > 0 ? Math.sin(Math.PI * reload) : 0;
    const switching = this.switchedFor < .22 ? Math.sin(Math.PI * this.switchedFor / .22) : 0;
    const flinch = this.hitAmount * Math.sin(Math.PI * this.hitLife / MARINE_REACTION_SECONDS);
    const recovery = this.hitLife === 0 ? this.hitAmount * Math.sin(Math.PI * Math.min(1,this.hitRecover / .20)) : 0;
    const breathing = this.travel <= 3 && !this.dead ? Math.sin(this.visualTime * 2.4) * .026 : 0;
    const pose = this.action ? Math.sin(Math.PI * this.actionProgress) : 0;
    const cast = CAST_POSES[this.action];
    const pitch = aimPitch + motion * (reloading * (this.moving ? .21 : .65) + switching * (this.moving ? .27 : -.82) - this.recoilLife * feedback.pitch * 1.9 + breathing + (this.dead ? .32 * death : 0));
    this.rotate(this.ribs, this.axis, pitch, this.yawQ);
    if (this.recoilLife > 1e-5 && motion > 0) {
      this.ribs.getWorldPosition(this.target);
      this.target.x -= Math.cos(this.aim) * feedback.kick * 1.65 * this.recoilLife * motion;
      this.target.z -= Math.sin(this.aim) * feedback.kick * 1.65 * this.recoilLife * motion;
      this.ribs.parent!.worldToLocal(this.target);
      this.ribs.position.copy(this.target);
    }
    if (motion > 0) {
      if (!this.moving && !this.dead && !this.action && !flinch && !recovery) {
        const breath = Math.sin(this.visualTime*2.4), shift = Math.sin(this.visualTime*1.65);
        this.rotate(this.head,this.up,shift*.12*motion,this.yawQ);
        this.rotate(this.neck,this.axis.set(-Math.sin(this.aim),0,Math.cos(this.aim)),breath*.075*motion,this.yawQ);
        this.rotate(this.leftShoulder,this.axis.set(Math.cos(this.aim),0,Math.sin(this.aim)),breath*.08*motion,this.yawQ);
        this.rotate(this.rightShoulder,this.axis,-breath*.08*motion,this.yawQ);
        this.rotate(this.spine,this.axis,shift*.025*motion,this.yawQ);
      }
      if (!this.moving && this.recoilLife > 0) {
        this.rotate(this.spine,this.axis.set(-Math.sin(this.aim),0,Math.cos(this.aim)),-this.recoilLife*feedback.pitch*1.4*motion,this.yawQ);
        if(this.hips)this.moveWorld(this.hips,-Math.cos(this.aim)*.1*feedback.kick/.038*this.recoilLife*motion,-.035*this.recoilLife*motion,-Math.sin(this.aim)*.1*feedback.kick/.038*this.recoilLife*motion);
      }
      this.axis.set(-this.leanZ, 0, this.leanX);
      const lean = this.axis.length();
      if (lean > 1e-8) this.rotate(this.spine, this.axis.multiplyScalar(1 / lean), lean * motion, this.yawQ);
      this.axis.set(-Math.sin(this.hitAngle), 0, Math.cos(this.hitAngle));
      if (flinch || recovery) {
        this.rotate(this.spine, this.axis, (-flinch * .48 + recovery * .22) * motion, this.yawQ);
        this.rotate(this.ribs, this.axis, (-flinch * .32 + recovery * .10) * motion, this.yawQ);
        if (this.hips) this.moveWorld(this.hips, Math.cos(this.hitAngle) * MARINE_BODY_OFFSET * flinch * motion, -.11 * flinch * motion, Math.sin(this.hitAngle) * MARINE_BODY_OFFSET * flinch * motion);
        this.rotate(this.leftArm!, this.up, -.65 * (flinch+recovery*.75) * motion, this.yawQ);
        this.rotate(this.rightArm!, this.up, .45 * (flinch+recovery*.75) * motion, this.yawQ);
      }
      if (cast && pose > 0) this.castPose(cast, pose * motion);
      else if (!flinch && !recovery && this.reversal > 0 && this.hips) {
        const slide = MARINE_BODY_OFFSET * (this.reversal / .16) * motion;
        this.moveWorld(this.hips, this.reversalX * slide, -.08 * slide / MARINE_BODY_OFFSET, this.reversalZ * slide);
      }
      if (this.moving && !cast && !flinch && !recovery) {
        const side = (-Math.sin(this.aim) * this.vx + Math.cos(this.aim) * this.vy) / Math.max(1, this.travel);
        this.rotate(this.hips!, this.up, Math.sin(this.gaitPhase * Math.PI * 2) * (.16 + Math.abs(side) * .18) * motion, this.yawQ);
        this.rotate(this.spine, this.up, -Math.sin(this.gaitPhase * Math.PI * 2) * (.16 + Math.abs(side) * .18) * motion, this.yawQ);
        if (this.backwards) this.rotate(this.spine, this.axis.set(-Math.sin(this.aim),0,Math.cos(this.aim)), -.18 * motion, this.yawQ);
      }
    }
    this.clampHips();
    if (reloading > 1e-5 && motion > 0) this.reloadReach(reloading * motion, reload);
    if (this.dead) {
      for (const leg of this.legs) {
        this.rotate(leg.thigh, this.axis.set(-Math.sin(this.aim), 0, Math.cos(this.aim)), .23 * death, this.yawQ);
        this.rotate(leg.shin, this.axis, -.52 * death, this.yawQ);
      }
      this.rotate(this.spine, this.axis.set(-Math.sin(this.hitAngle),0,Math.cos(this.hitAngle)), -.85 * death, this.yawQ);
      this.rotate(this.ribs, this.axis, .48 * death, this.yawQ);
      this.rotate(this.leftArm!, this.up, -.9 * death, this.yawQ);
      this.rotate(this.rightArm!, this.up, .6 * death, this.yawQ);
    } else if (this.moving && !cast && !flinch && !recovery) {
      for (const leg of this.legs) this.proceduralStep(leg);
    } else if (recovery) {
      for (const leg of this.legs) {
        const step = recovery * (leg.side > 0 ? .32 : -.08) * motion;
        leg.foot.getWorldPosition(this.target);
        this.target.x += Math.cos(this.hitAngle) * step;this.target.z += Math.sin(this.hitAngle) * step;
        this.target.y += Math.max(0,step) * .35;
        this.solveChain(leg.thigh,leg.shin,leg.foot);
        this.moveWorld(leg.ankle,Math.cos(this.hitAngle)*step,Math.max(0,step)*.35,Math.sin(this.hitAngle)*step);
      }
    } else if (!cast) for (const leg of this.legs) this.plant(leg);
  }

  /** Authored base poses retain only responsive aim, acceleration and bounded contact correction. */
  private finishAuthored(weapon:WeaponId,recoil:number,reload:number,aimPitch:number){
    if(this.weapon!==weapon){if(this.weapon!==undefined)this.switchedFor=0;this.weapon=weapon;}
    this.root.rotation.z=0;
    const strength=this.strength*(this.reduced?.25:1);
    this.rotate(this.ribs,this.up,-T.MathUtils.degToRad(WEAPON_FIT[weapon].aimYaw),this.yawQ);
    this.axis.set(-Math.sin(this.aim),0,Math.cos(this.aim));
    this.rotate(this.ribs,this.axis,aimPitch-recoil*WEAPON_MOTION[weapon].pitch*.3*strength,this.yawQ);
    this.rotate(this.spine,this.axis,(this.leanX*Math.cos(this.aim)+this.leanZ*Math.sin(this.aim))*.35*strength,this.yawQ);
    if (this.rifleLoad > .001 && !reload && !this.action) {
      const load = this.rifleLoad * strength;
      this.rotate(this.spine, this.axis, .22 * load, this.yawQ);
      this.rotate(this.ribs, this.up, -.15 * load, this.yawQ);
    }
    if (!this.dead && (!this.action || this.action==='ram' || this.action==='afterburn') && !reload) {
      // Lift around the sight line's transverse axis, keeping both hands on the weapon.
      this.rotate(this.head, this.axis, T.MathUtils.degToRad(16), this.yawQ);
      this.rotate(this.head, this.up, T.MathUtils.degToRad(4), this.yawQ);
    }
    // Counter the crouched neck in the two horizontal dash clips. Keep the
    // helmet above the collar without changing the ribs or weapon chain.
    if(!this.dead && this.neck && this.head && (this.action==='ram' || this.action==='afterburn')){
      this.neck.getWorldPosition(this.foot);
      this.head.getWorldPosition(this.from).sub(this.foot).normalize();
      if(this.from.y<.78){
        this.to.set(.48*Math.cos(this.aim),.88,.48*Math.sin(this.aim));
        const extension=this.action==='afterburn' ? (.78-this.from.y)*.17 : 0;
        this.rotateToward(this.neck,this.from,this.to);
        if(extension>0)this.moveWorld(this.neck,extension*Math.cos(this.aim),extension*.7,extension*Math.sin(this.aim));
      }
    }
    const flinch=this.hitAmount*Math.sin(Math.PI*this.hitLife/MARINE_REACTION_SECONDS)*strength;
    if(flinch){this.axis.set(-Math.sin(this.hitAngle),0,Math.cos(this.hitAngle));this.rotate(this.ribs,this.axis,-flinch*.10,this.yawQ);}
    if((this.moving||this.stoppedFor<.14)&&!this.action&&!flinch)for(const leg of this.legs)this.plant(leg);
    this.clampHips();
    // Cast silhouettes live in the torso and free arm. Keep the receiver hand
    // in a reachable firing pocket rather than twisting an overhead wrist to
    // bring its barrel back onto the native aim vector.
    if(this.action&&!this.dead){
      this.castArm(this.rightArm,this.rightForearm,this.rightHand,.48,-.08,-.13,1);
      // Retain free-hand height/spread, but never signal a cast backwards while
      // the marker, receiver and native ability are committed forwards.
      if(this.leftArm&&this.leftForearm&&this.leftHand){
        this.leftArm.getWorldPosition(this.foot);this.leftHand.getWorldPosition(this.target);
        const forward=(this.target.x-this.foot.x)*Math.cos(this.aim)+(this.target.z-this.foot.z)*Math.sin(this.aim);
        if(forward<.18){this.target.x+=Math.cos(this.aim)*(.18-forward);this.target.z+=Math.sin(this.aim)*(.18-forward);this.solveChain(this.leftArm,this.leftForearm,this.leftHand);}
      }
    }
    if(!this.dead){
      // This shared rib turn belongs to the original ram socket trajectory.
      if(this.rig==='breacher' && this.action==='ram')this.rotate(this.ribs,this.up,.43*Math.sin(Math.PI*this.actionProgress),this.yawQ);
      if(this.shotgunShoulder>0)this.carryTorso(.31*this.shotgunShoulder,-.16*this.shotgunShoulder,this.rightHand);
      if(this.rig==='pyro'){this.carryTorso(-.27,-.16);this.stanceFeet(.18,.12);}
      if(this.rig==='cryo'){this.carryTorso(.19,.07);this.stanceFeet(-.065,.03);}
      if(this.rig==='arc'){this.carryTorso(.06,-.24);this.stanceFeet(.04,-.14);}
      if(this.rig==='breacher')this.carryTorso(-.11,.19);
      if(!reload && (this.rig==='breacher'||this.rig==='pyro'))this.lowerGunElbow();
    }
    if(this.rig==='breacher' && !this.dead){
      this.shieldCarry();
      this.stanceFeet(.10,.20);
    }else if(!this.dead && !this.action && !reload && weapon!=='rifle'){
      if(this.rig==='arc'){
        this.castArm(this.leftArm,this.leftForearm,this.leftHand,-.09,-.43,.25,1);
        for(const finger of this.openFingers)finger.bone.quaternion.slerp(finger.bind,.88);
      }
      if(this.rig==='pyro') this.castArm(this.leftArm,this.leftForearm,this.leftHand,.48,-.24,-.36,.96);
      if(this.rig==='cryo' && this.hasCoolantGrip && this.rightHand && this.leftArm && this.leftForearm && this.leftHand){
        this.target.copy(this.coolantGrip);
        this.rightHand.localToWorld(this.target);
        this.solveChain(this.leftArm,this.leftForearm,this.leftHand);
      }
    }else if(weapon==='rifle' &&!this.dead&&!this.action&&reload===0&&this.hitRecover===0&&this.switchedFor>.18)this.supportGrip(T.MathUtils.smoothstep(this.switchedFor,.18,.35));
  }

  private readonly socketAnchor = new T.Vector3();
  private readonly socketBasis = new T.Quaternion();

  /** Keep the authored receiver chain fixed at the clavicle for a carry,
   * or at the wrist so the firing shoulder can travel back on the kick. */
  private carryTorso(pitch:number,yaw:number,anchor=this.rightShoulder){
    if(!this.ribs||!anchor)return;
    anchor.getWorldPosition(this.socketAnchor);
    anchor.getWorldQuaternion(this.socketBasis);
    this.rotate(this.ribs,this.axis.set(-Math.sin(this.aim),0,Math.cos(this.aim)),pitch,this.yawQ);
    this.rotate(this.ribs,this.up,yaw,this.yawQ);
    anchor.getWorldPosition(this.offset);
    this.offset.subVectors(this.socketAnchor,this.offset);
    this.moveWorld(this.ribs,this.offset.x,this.offset.y,this.offset.z);
    anchor.parent!.getWorldQuaternion(this.parentQ);
    anchor.quaternion.copy(this.parentQ).invert().multiply(this.socketBasis);
  }

  /** Lower the firing elbow around the fixed shoulder-to-wrist line.
   * Counter-rotate the wrist so the receiver retains its authored roll. */
  private lowerGunElbow(){
    if(!this.rightArm||!this.rightForearm||!this.rightHand)return;
    this.rightArm.getWorldPosition(this.hip);
    this.rightHand.getWorldPosition(this.axis).sub(this.hip).normalize();
    this.rightForearm.getWorldPosition(this.from).sub(this.hip).projectOnPlane(this.axis).normalize();
    this.to.set(0,-1,0).projectOnPlane(this.axis).normalize();
    const roll=Math.atan2(this.axis.dot(this.direction.crossVectors(this.from,this.to)),this.from.dot(this.to));
    this.rightHand.getWorldQuaternion(this.footQ);
    this.rotate(this.rightArm,this.axis,T.MathUtils.clamp(roll,-.65,.65),this.yawQ);
    this.rightHand.parent!.getWorldQuaternion(this.parentQ);
    this.rightHand.quaternion.copy(this.parentQ).invert().multiply(this.footQ);
  }

  private readonly shinEndpoint = new T.Vector3();

  private stanceFeet(width:number, stride:number){
    const weight=1-.75*this.moving;
    const c=Math.cos(this.aim), s=Math.sin(this.aim);
    for(const leg of this.legs){
      const x=(-c*stride-s*width)*leg.side*weight;
      const z=(-s*stride+c*width)*leg.side*weight;
      leg.ankle.getWorldPosition(this.target);
      this.target.x+=x;this.target.z+=z;
      this.solveChain(leg.thigh,leg.shin,leg.ankle,false,true);
    }
  }

  private shieldCarry(){
    if(!this.leftArm||!this.leftForearm||!this.leftHand)return;
    const charging = this.action==='ram' || this.action==='dash';
    // Keep the elbow under the shield and reach farther on the charge.
    const c=Math.cos(this.aim), s=Math.sin(this.aim);
    if(this.leftShoulder){
      // Drive the left clavicle into the ram while the receiver stays on aim.
      this.leftShoulder.getWorldPosition(this.hip);
      this.leftArm.getWorldPosition(this.from).sub(this.hip);
      const drive=this.action==='railbreaker' ? -.48*Math.sin(Math.PI*this.actionProgress) : charging ? .96 : .52;
      this.to.set(c*drive+.65*s,.10,s*drive-.65*c);
      this.rotateToward(this.leftShoulder,this.from,this.to);
    }
    this.leftArm.getWorldPosition(this.target);
    const reach=charging ? .82 : .43, side=charging ? -.29 : -.22;
    this.target.x+=c*reach-s*side;
    this.target.z+=s*reach+c*side;
    this.target.y+=charging ? -.14 : -.32;
    this.solveChain(this.leftArm,this.leftForearm,this.leftHand,true);
    // Roll the striking face toward world up, with a small outward rake.
    this.leftForearm.getWorldPosition(this.from);
    this.leftHand.getWorldPosition(this.axis).sub(this.from).normalize();
    this.leftForearm.getWorldQuaternion(this.parentQ);
    this.from.set(.39,0,.92).applyQuaternion(this.parentQ).projectOnPlane(this.axis).normalize();
    this.to.set(.12*c+.10*s,1,.12*s-.10*c).projectOnPlane(this.axis).normalize();
    const roll=Math.atan2(this.axis.dot(this.direction.crossVectors(this.from,this.to)),this.from.dot(this.to));
    this.rotate(this.leftForearm,this.axis,roll,this.yawQ);
  }

  /** The original rifle is shorter than the retained animation's handguard.
   * Solve the support arm to its underside without changing the receiver hand,
   * skeleton, or authored cast/reload/death choreography. Weapon presentation
   * deliberately drops the source skeleton scale, so this target does too. */
  private supportGrip(weight:number){
    if(!this.leftArm||!this.leftForearm||!this.leftHand||!this.weaponSocket)return;
    this.weaponSocket.getWorldQuaternion(this.parentQ);
    this.offset.set(.10,-.14,.35).multiplyScalar(WEAPON_FIT.rifle.scale).applyQuaternion(this.parentQ);
    this.weaponSocket.getWorldPosition(this.target).add(this.offset);
    this.leftHand.getWorldPosition(this.foot);this.target.lerp(this.foot,1-weight);
    // The retained rifle pose leaves its clavicle retracted: the short guard
    // target is beyond the two arm segments. Protract the existing shoulder
    // toward it before solving, rather than stretching the arm or moving the
    // wrist independently of its skin.
    if(this.leftShoulder){
      this.leftArm.getWorldPosition(this.hip);this.leftForearm.getWorldPosition(this.knee);
      const reach=this.hip.distanceTo(this.knee)+this.knee.distanceTo(this.foot)-.015;
      if(this.hip.distanceTo(this.target)>reach){
        this.leftShoulder.getWorldPosition(this.from);
        this.direction.copy(this.hip).sub(this.from).normalize();
        this.to.copy(this.target).sub(this.from).normalize();
        this.axis.copy(this.direction).cross(this.to);
        if(this.axis.lengthSq()>1e-10){
          const angle=Math.acos(T.MathUtils.clamp(this.direction.dot(this.to),-1,1));
          this.rotate(this.leftShoulder,this.axis.normalize(),Math.min(angle,.85)*weight,this.yawQ);
          this.leftShoulder.updateWorldMatrix(true,true);
        }
      }
    }
    this.solveChain(this.leftArm,this.leftForearm,this.leftHand);
    // Swivel the support elbow around the shoulder-to-grip line. The rifle
    // keeps its two contact points while each rig carries its weight differently.
    const swivel=this.rig==='arc' ? .42 : this.rig==='pyro' ? -.34 : .16;
    this.leftArm.getWorldPosition(this.hip);
    this.leftHand.getWorldPosition(this.axis).sub(this.hip).normalize();
    this.leftHand.getWorldQuaternion(this.footQ);
    this.rotate(this.leftArm,this.axis,swivel*weight,this.yawQ);
    this.leftHand.parent!.getWorldQuaternion(this.parentQ);
    this.leftHand.quaternion.copy(this.parentQ).invert().multiply(this.footQ);
  }

  private moveWorld(bone: T.Object3D, x: number, y: number, z: number) {
    bone.getWorldPosition(this.target);this.target.x += x;this.target.y += y;this.target.z += z;
    bone.parent!.worldToLocal(this.target);bone.position.copy(this.target);
  }

  /** Compose simultaneous cast/hit impulses inside the same radius budget. */
  private clampHips() {
    if (!this.hips) return;
    this.hips.getWorldPosition(this.target);
    const dx=this.target.x-this.hipsBase.x,dz=this.target.z-this.hipsBase.z,length=Math.hypot(dx,dz);
    if(length<=MARINE_BODY_OFFSET)return;
    this.target.x=this.hipsBase.x+dx*MARINE_BODY_OFFSET/length;this.target.z=this.hipsBase.z+dz*MARINE_BODY_OFFSET/length;
    this.hips.parent!.worldToLocal(this.target);this.hips.position.copy(this.target);
  }

  private castPose(cast: readonly number[], weight: number) {
    this.axis.set(-Math.sin(this.aim), 0, Math.cos(this.aim));
    // Native slam casts last220ms: this .20 normalized window blends the
    // overhead hand/receiver into the knee drop over44ms without a pose pop.
    const slamDrop = this.action === 'seismic-slam' ? T.MathUtils.smoothstep(this.actionProgress,.42,.52) : 0;
    this.rotate(this.spine, this.axis, T.MathUtils.lerp(cast[6],1.12,slamDrop) * weight, this.yawQ);
    this.rotate(this.ribs, this.up, cast[7] * weight, this.yawQ);
    if (this.hips) this.moveWorld(this.hips, 0, -T.MathUtils.lerp(cast[9],.48,slamDrop) * weight, 0);
    this.castArm(this.leftArm, this.leftForearm, this.leftHand, T.MathUtils.lerp(cast[0],.55,slamDrop), cast[1], T.MathUtils.lerp(cast[2],-.75,slamDrop), weight);
    this.castArm(this.rightArm, this.rightForearm, this.rightHand, T.MathUtils.lerp(cast[3],.55,slamDrop), cast[4], T.MathUtils.lerp(cast[5],-.75,slamDrop), weight);
    if (this.action === 'seismic-slam') {
      this.rotate(this.rightHand, this.axis.set(-Math.sin(this.aim),0,Math.cos(this.aim)), T.MathUtils.lerp(1.18,-1.12,slamDrop) * weight, this.yawQ);
      this.rotate(this.leftHand, this.axis, T.MathUtils.lerp(1.18,-1.12,slamDrop) * weight, this.yawQ);
    }
    if (this.action === 'whiteout') {
      this.rotate(this.rightHand,this.axis.set(-Math.sin(this.aim),0,Math.cos(this.aim)),1.30*weight,this.yawQ);
    }
    if (this.action === 'tesla-pylon') {
      this.rotate(this.rightHand,this.axis.set(-Math.sin(this.aim),0,Math.cos(this.aim)),-1.10*weight,this.yawQ);
    }
    if (this.action === 'glacier') {
      const lift=T.MathUtils.smoothstep(this.actionProgress,.30,.78);
      this.rotate(this.rightHand,this.axis.set(-Math.sin(this.aim),0,Math.cos(this.aim)),(-.9+lift*1.4)*weight,this.yawQ);
    }
    if (this.action === 'cryo-nova') {
      // The receiver hand turns the retained gun out along the opened arm, so
      // both arms read in silhouette instead of one hiding behind a level gun.
      this.rotate(this.rightHand, this.up, -Math.PI / 2 * weight, this.yawQ);
    }
    if (this.action === 'railbreaker' && this.hips) this.moveWorld(this.hips, -Math.cos(this.aim) * MARINE_BODY_OFFSET * weight, 0, -Math.sin(this.aim) * MARINE_BODY_OFFSET * weight);
    this.clampHips();
    for (const leg of this.legs) {
      const side = leg.side * cast[8] * weight;
      const forward = this.action === 'tesla-pylon' ? (leg.side > 0 ? -.35 : .20)*weight : this.action === 'glacier' ? (leg.side > 0 ? -.25 : .15)*weight : this.action === 'seismic-slam' ? (leg.side > 0 ? -.48 : .22) * slamDrop * weight : this.action === 'railbreaker' ? leg.side * .18 * weight : 0;
      this.target.copy(leg.restFoot);this.root.localToWorld(this.target);
      const dx = Math.cos(this.aim)*forward - Math.sin(this.aim)*side;
      const dz = Math.sin(this.aim)*forward + Math.cos(this.aim)*side;
      this.target.x += dx;this.target.z += dz;
      this.solveChain(leg.thigh,leg.shin,leg.foot);
      this.offset.copy(leg.restAnkle);this.root.localToWorld(this.offset);this.offset.x += dx;this.offset.z += dz;
      leg.ankle.parent!.worldToLocal(this.offset);leg.ankle.position.copy(this.offset);leg.ankle.quaternion.copy(leg.restAnkleRotation);
    }
  }

  private castArm(upper: T.Object3D | undefined, lower: T.Object3D | undefined, hand: T.Object3D | undefined, forward: number, side: number, height: number, weight: number) {
    if (!upper || !lower || !hand) return;
    upper.getWorldPosition(this.target);
    this.target.x += Math.cos(this.aim) * forward - Math.sin(this.aim) * side;
    this.target.y += height;
    this.target.z += Math.sin(this.aim) * forward + Math.cos(this.aim) * side;
    hand.getWorldPosition(this.foot);this.target.lerp(this.foot, 1 - weight);
    this.solveChain(upper, lower, hand);
  }

  /** Separate lateral crossover and reverse steps. Stance remains in world
   * space while the virtual stride advances; swing lifts the existing shoe. */
  private proceduralStep(leg: Leg) {
    leg.ankle.quaternion.copy(leg.restAnkleRotation);
    const side = (-Math.sin(this.aim) * this.vx + Math.cos(this.aim) * this.vy) / Math.max(1, this.travel);
    const phase = ((this.gaitPhase + (leg.side > 0 ? .5 : 0)) % 1 + 1) % 1;
    const stance = .60;
    const cycle = this.backwards ? 1.5 : 1.8;
    const along = phase < stance ? (.5 - phase / stance) * cycle * stance : (-.5 + (phase-stance)/(1-stance)) * cycle * stance;
    const lift = phase < stance ? 0 : Math.sin(Math.PI * (phase-stance)/(1-stance)) * (this.backwards ? .13 : .23);
    const swing = phase < stance ? 0 : Math.sin(Math.PI * (phase-stance)/(1-stance));
    leg.foot.getWorldPosition(this.from);leg.ankle.getWorldPosition(this.offset);
    this.target.copy(leg.restFoot);this.root.localToWorld(this.target);
    this.target.x += this.vx / this.travel * along - Math.sin(this.aim) * side * swing * leg.side * .17;
    this.target.z += this.vy / this.travel * along + Math.cos(this.aim) * side * swing * leg.side * .17;
    this.target.y += lift;
    this.offset.add(this.target).sub(this.from);
    this.solveChain(leg.thigh, leg.shin, leg.foot);
    leg.ankle.parent!.worldToLocal(this.offset);leg.ankle.position.copy(this.offset);
    leg.planted = phase < stance;leg.weight = 0;
  }

  private rotate(bone: T.Object3D | undefined, axis: T.Vector3, angle: number, rotation: T.Quaternion) {
    if (!bone) return;
    bone.parent!.getWorldQuaternion(this.parentQ);
    rotation.setFromAxisAngle(axis, angle);
    this.localQ.copy(this.parentQ).invert().multiply(rotation).multiply(this.parentQ);
    bone.quaternion.premultiply(this.localQ);
  }

  private rotateToward(bone: T.Object3D, from: T.Vector3, to: T.Vector3) {
    if (from.lengthSq() < 1e-12 || to.lengthSq() < 1e-12) return;
    this.turnQ.setFromUnitVectors(from.normalize(), to.normalize());
    bone.parent!.getWorldQuaternion(this.parentQ);
    this.localQ.copy(this.parentQ).invert().multiply(this.turnQ).multiply(this.parentQ);
    bone.quaternion.premultiply(this.localQ);
    bone.updateWorldMatrix(false, true);
  }

  private plant(leg: Leg) {
    const dt = this.dt;
    leg.foot.getWorldPosition(this.foot);
    const px = this.foot.x - this.root.position.x + this.stride.x;
    const pz = this.foot.z - this.root.position.z + this.stride.y;
    const low = this.foot.y - this.root.position.y <= leg.contactHeight;
    const contact = low && (this.moving > 0 || this.stoppedFor < .16);
    if (contact && !leg.planted) leg.anchor.set(px, pz);
    leg.planted = contact;
    leg.weight = contact ? 1 : Math.max(0, leg.weight - dt * 22);
    if (!this.moving) leg.weight = Math.min(leg.weight, 1 - T.MathUtils.smoothstep(this.stoppedFor, 0, .14));
    if (leg.weight <= 0) return;
    this.offset.set(leg.anchor.x - px, 0, leg.anchor.y - pz).clampLength(0, MARINE_FOOT_CORRECTION).multiplyScalar(leg.weight);
    if (this.offset.lengthSq() < 1e-10) return;
    this.target.copy(this.foot).add(this.offset);
    this.solveChain(leg.thigh, leg.shin, leg.foot);
    // This source rig binds shoes to detached ankle controls under origin,
    // rather than below the shin. Move that existing control by the same
    // bounded world correction; source buffers and skeleton topology stay intact.
    leg.foot.getWorldPosition(this.foot);
    leg.ankle.getWorldPosition(this.offset);
    this.offset.add(this.target).sub(this.foot);
    leg.ankle.parent!.worldToLocal(this.offset);
    leg.ankle.position.copy(this.offset);
  }

  /** Magazine-hand target lives below the real receiver; the gun remains on its
   * untouched right-hand socket throughout the reload. */
  private reloadReach(weight: number, progress: number) {
    if (!this.leftArm || !this.leftForearm || !this.leftHand || !this.weaponSocket) return;
    this.leftHand.getWorldPosition(this.foot);
    this.weaponSocket.getWorldPosition(this.target);
    const outward = .18 + Math.sin(progress * Math.PI) * .25;
    this.target.x -= Math.cos(this.aim) * .12 + Math.sin(this.aim) * outward;
    this.target.y -= .24 + Math.sin(progress * Math.PI) * .36;
    this.target.z += Math.cos(this.aim) * outward - Math.sin(this.aim) * .12;
    this.target.lerp(this.foot, 1 - weight);
    this.solveChain(this.leftArm, this.leftForearm, this.leftHand);
  }

  private solveChain(upperBone: T.Object3D, lowerBone: T.Object3D, endBone: T.Object3D, brace = false, detachedAnkle = false) {
    upperBone.getWorldPosition(this.hip);
    lowerBone.getWorldPosition(this.knee);
    endBone.getWorldPosition(this.foot);
    endBone.getWorldQuaternion(this.footQ);
    // The ankle control belongs to origin. Carry its virtual shin endpoint
    // through both rotations and put the boot at the reachable solution.
    if(detachedAnkle)lowerBone.worldToLocal(this.shinEndpoint.copy(this.foot));
    const upper = this.hip.distanceTo(this.knee), lower = this.knee.distanceTo(this.foot);
    this.direction.copy(this.target).sub(this.hip);
    const distance = T.MathUtils.clamp(this.direction.length(), Math.abs(upper - lower) + .001, upper + lower - .001);
    this.direction.normalize();
    if(brace)this.pole.set(0,-1,0);
    else this.pole.copy(this.knee).sub(this.hip);
    this.pole.addScaledVector(this.direction, -this.pole.dot(this.direction));
    if (this.pole.lengthSq() < 1e-10) this.pole.set(Math.cos(this.aim), 0, Math.sin(this.aim)).addScaledVector(this.direction, -this.pole.dot(this.direction));
    this.pole.normalize();
    const along = (upper * upper + distance * distance - lower * lower) / (2 * distance);
    this.desiredKnee.copy(this.hip).addScaledVector(this.direction, along).addScaledVector(this.pole, Math.sqrt(Math.max(0, upper * upper - along * along)));
    this.rotateToward(upperBone, this.from.copy(this.knee).sub(this.hip), this.to.copy(this.desiredKnee).sub(this.hip));
    lowerBone.getWorldPosition(this.knee);
    if(detachedAnkle)lowerBone.localToWorld(this.foot.copy(this.shinEndpoint));
    else endBone.getWorldPosition(this.foot);
    this.rotateToward(lowerBone, this.from.copy(this.foot).sub(this.knee), this.to.copy(this.target).sub(this.knee));
    if(detachedAnkle){
      lowerBone.localToWorld(this.foot.copy(this.shinEndpoint));
      endBone.position.copy(endBone.parent!.worldToLocal(this.foot));
    }
    endBone.parent!.getWorldQuaternion(this.parentQ);
    endBone.quaternion.copy(this.parentQ).invert().multiply(this.footQ);
  }

  /** Clear all presentation state without discarding pooled rig resources. */
  reset() {
    if (this.saved) for (const state of this.bones) {
      state.bone.quaternion.copy(state.q);state.bone.position.copy(state.p);state.bone.scale.copy(state.s);
    }
    this.saved = false;
    this.previous = undefined;
    this.visualTime = this.dt = this.gaitYaw = this.speed = this.moving = 0;
    this.backwards = false;
    this.stride.set(0, 0);
    this.vx = this.vy = this.lastVx = this.lastVy = this.leanX = this.leanZ = 0;
    this.hold = this.holdCooldown = this.hitLife = this.hitRecover = this.hitAmount = this.recoilLife = this.previousRecoil = 0;
    this.stoppedFor = this.switchedFor = 1;
    this.shotgunShoulder = 0;
    this.weapon = undefined;
    this.action = '';
    this.dead = false;
    this.deadAge = 0;
    this.gaitPhase = this.reversal = 0;
    this.root.rotation.z = 0;
    for (const leg of this.legs) {leg.planted = false;leg.weight = 0;}
  }
}
