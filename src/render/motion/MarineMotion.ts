import * as T from 'three';
import type {WeaponId} from '../../game/combat/types';
import {WEAPON_FIT, WEAPON_MOTION} from '../weapons';

/** Feet may correct authored stance error, but never pull the actor off its native root. */
export const MARINE_FOOT_CORRECTION = .12;
export const MARINE_HIT_PAUSE = .035;
const UNIT = 32;
const DEPLOY_ACTIONS = new Set(['bulwark', 'glacier', 'napalm-charge', 'tesla-pylon']);
const HEAVY_ACTIONS = new Set(['seismic-slam', 'railbreaker', 'whiteout', 'meltdown']);
const wrap = (value: number) => Math.atan2(Math.sin(value), Math.cos(value));

type SavedBone = {bone: T.Object3D; q: T.Quaternion; p: T.Vector3; s: T.Vector3};
type Leg = {
  thigh: T.Object3D;
  shin: T.Object3D;
  foot: T.Object3D;
  ankle: T.Object3D;
  anchor: T.Vector2;
  contactHeight: number;
  planted: boolean;
  weight: number;
};

/** Existing source clips supply gait; this layer supplies contact and upper-body response.
 * Call begin before the mixer and finish after it. All working storage is actor-local.
 */
export class MarineMotion {
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
    const hips = assetRoot.getObjectByName('hips');
    const affected = [this.spine, this.ribs, this.leftArm, this.leftForearm, this.leftHand, hips];
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
      this.legs.push({thigh, shin, foot, ankle, anchor: new T.Vector2(), contactHeight: this.foot.y - root.position.y + .008, planted: false, weight: 0});
    }
    this.bones = affected.filter((bone): bone is T.Object3D => !!bone).map(bone => ({bone, q: bone.quaternion.clone(), p: bone.position.clone(), s: bone.scale.clone()}));
  }

  /** Preference changes clear latent impulses, including while paused. */
  setOptions(strength: number, reducedMotion: boolean) {
    this.strength = T.MathUtils.clamp(strength, 0, 1);
    this.reduced = reducedMotion;
    if (reducedMotion || this.strength === 0) this.hold = this.hitLife = this.recoilLife = 0;
  }

  /** A local pose hold never stops camera, input, root travel or the simulation. */
  hit(strength = 1, direction = this.aim, heavy = false) {
    this.hitAmount = T.MathUtils.clamp(strength, 0, 1);
    this.hitAngle = direction;
    this.hitLife = this.hitAmount > 0 ? .18 : 0;
    if (this.hitAmount === 0) this.hold = 0;
    if (heavy && !this.reduced && this.strength > 0 && this.holdCooldown <= 0) {
      this.hold = MARINE_HIT_PAUSE * this.hitAmount * this.strength;
      this.holdCooldown = .18;
    }
  }

  /** Snapshot/event callers own this normalized cast clock. */
  setAction(id: string, progress: number) {
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
    this.stoppedFor = this.travel > 3 ? 0 : this.stoppedFor + dt;
    this.stride.x += vx * dt / UNIT;
    this.stride.y += vy * dt / UNIT;
    const direction = Math.atan2(vy, vx), forward = Math.cos(direction - aim);
    if (this.travel > 3) {
      if (forward < -.22) this.backwards = true;
      else if (forward > .02) this.backwards = false;
    }
    const desired = this.travel > 3 ? T.MathUtils.clamp(wrap(aim - direction - (this.backwards ? Math.PI : 0)), -Math.PI / 2, Math.PI / 2) : this.gaitYaw;
    this.gaitYaw += wrap(desired - this.gaitYaw) * (1 - Math.exp(-dt * 22));
    // Measured source planted-foot travel, rather than the old 220-unit guess.
    this.speed = T.MathUtils.clamp(this.travel / (this.backwards ? 125 : 130), 0, 4);
    this.moving = this.travel > 3 && this.travel < 700 && !this.dead ? 1 : 0;
    this.leanX = T.MathUtils.damp(this.leanX, T.MathUtils.clamp((vx - this.lastVx) / 220, -.9, .9) * .055, 18, dt);
    this.leanZ = T.MathUtils.damp(this.leanZ, T.MathUtils.clamp((vy - this.lastVy) / 220, -.9, .9) * .055, 18, dt);
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
    const stop = T.MathUtils.smoothstep(this.stoppedFor, 0, .14);
    if (!this.moving && !this.dead) for (const rest of this.neutral) {
      rest.bone.quaternion.slerp(rest.q, stop);
      rest.bone.position.lerp(rest.p, stop);
      rest.bone.scale.lerp(rest.s, stop);
    }
    const death = T.MathUtils.smoothstep(this.deadAge, 0, this.reduced ? .18 : .30);
    this.root.rotation.z = this.dead ? 1.4 * death : 0;
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
    const flinch = this.hitAmount * Math.sin(Math.PI * this.hitLife / .18);
    const breathing = this.travel <= 3 && !this.dead ? Math.sin(this.visualTime * 2.4) * .009 : 0;
    const pose = this.action ? Math.sin(Math.PI * this.actionProgress) : 0;
    const deploy = DEPLOY_ACTIONS.has(this.action);
    const heavyCast = HEAVY_ACTIONS.has(this.action);
    const pitch = aimPitch + motion * (reloading * .21 + switching * .27 - this.recoilLife * feedback.pitch + breathing - pose * (heavyCast ? .20 : .09) + (this.dead ? .32 * death : 0));
    this.rotate(this.ribs, this.axis, pitch, this.yawQ);
    if (this.recoilLife > 1e-5 && motion > 0) {
      this.ribs.getWorldPosition(this.target);
      this.target.x -= Math.cos(this.aim) * feedback.kick * this.recoilLife * motion;
      this.target.z -= Math.sin(this.aim) * feedback.kick * this.recoilLife * motion;
      this.ribs.parent!.worldToLocal(this.target);
      this.ribs.position.copy(this.target);
    }
    if (motion > 0) {
      this.axis.set(-this.leanZ, 0, this.leanX);
      const lean = this.axis.length();
      if (lean > 1e-8) this.rotate(this.spine, this.axis.multiplyScalar(1 / lean), lean * motion, this.yawQ);
      this.axis.set(-Math.sin(this.hitAngle), 0, Math.cos(this.hitAngle));
      if (flinch) this.rotate(this.ribs, this.axis, -flinch * .09 * motion, this.yawQ);
      if (this.leftArm) {
        this.rotate(this.leftArm, this.up, -pose * (deploy ? .68 : heavyCast ? .10 : .32) * motion, this.yawQ);
        this.rotate(this.leftArm, this.axis.set(Math.cos(this.aim), 0, Math.sin(this.aim)), (-pose * (deploy ? .30 : .08)) * motion, this.yawQ);
      }
      if (this.leftForearm) this.rotate(this.leftForearm, this.axis.set(-Math.sin(this.aim), 0, Math.cos(this.aim)), (switching * .14 - pose * (deploy ? .42 : heavyCast ? -.40 : .18)) * motion, this.yawQ);
    }
    if (reloading > 1e-5 && motion > 0) this.reloadReach(reloading * motion, reload);
    if (this.dead) {
      for (const leg of this.legs) {
        this.rotate(leg.thigh, this.axis.set(-Math.sin(this.aim), 0, Math.cos(this.aim)), .23 * death, this.yawQ);
        this.rotate(leg.shin, this.axis, -.52 * death, this.yawQ);
      }
    } else for (const leg of this.legs) this.plant(leg);
  }

  private rotate(bone: T.Object3D, axis: T.Vector3, angle: number, rotation: T.Quaternion) {
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
    const outward = .13 + Math.sin(progress * Math.PI * 2) * .035;
    this.target.x -= Math.cos(this.aim) * .12 + Math.sin(this.aim) * outward;
    this.target.y -= .25;
    this.target.z += Math.cos(this.aim) * outward - Math.sin(this.aim) * .12;
    this.target.lerp(this.foot, 1 - weight);
    this.solveChain(this.leftArm, this.leftForearm, this.leftHand);
  }

  private solveChain(upperBone: T.Object3D, lowerBone: T.Object3D, endBone: T.Object3D) {
    upperBone.getWorldPosition(this.hip);
    lowerBone.getWorldPosition(this.knee);
    endBone.getWorldPosition(this.foot);
    endBone.getWorldQuaternion(this.footQ);
    const upper = this.hip.distanceTo(this.knee), lower = this.knee.distanceTo(this.foot);
    this.direction.copy(this.target).sub(this.hip);
    const distance = T.MathUtils.clamp(this.direction.length(), Math.abs(upper - lower) + .001, upper + lower - .001);
    this.direction.normalize();
    this.pole.copy(this.knee).sub(this.hip);
    this.pole.addScaledVector(this.direction, -this.pole.dot(this.direction));
    if (this.pole.lengthSq() < 1e-10) this.pole.set(Math.cos(this.aim), 0, Math.sin(this.aim)).addScaledVector(this.direction, -this.pole.dot(this.direction));
    this.pole.normalize();
    const along = (upper * upper + distance * distance - lower * lower) / (2 * distance);
    this.desiredKnee.copy(this.hip).addScaledVector(this.direction, along).addScaledVector(this.pole, Math.sqrt(Math.max(0, upper * upper - along * along)));
    this.rotateToward(upperBone, this.from.copy(this.knee).sub(this.hip), this.to.copy(this.desiredKnee).sub(this.hip));
    lowerBone.getWorldPosition(this.knee);
    endBone.getWorldPosition(this.foot);
    this.rotateToward(lowerBone, this.from.copy(this.foot).sub(this.knee), this.to.copy(this.target).sub(this.knee));
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
    this.hold = this.holdCooldown = this.hitLife = this.hitAmount = this.recoilLife = this.previousRecoil = 0;
    this.stoppedFor = this.switchedFor = 1;
    this.weapon = undefined;
    this.action = '';
    this.dead = false;
    this.deadAge = 0;
    this.root.rotation.z = 0;
    for (const leg of this.legs) {leg.planted = false;leg.weight = 0;}
  }
}
