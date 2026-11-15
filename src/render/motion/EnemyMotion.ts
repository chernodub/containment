import * as T from 'three';

/** Maximum extra translation of a living actor's presentation body, in metres. */
export const ACTOR_OFFSET_LIMIT = .055;
export const HEAVY_HOLD_SECONDS = .032;
const UP = new T.Vector3(0, 1, 0);

type Joint = {bone: T.Object3D; rest: T.Quaternion; pitch: number; yaw: number};
type Profile = {rate: number; pitch: number; arm: number; breath: number; weight: number};
const PROFILES: Record<string, Profile> = {
  crawler: {rate: 1.4, pitch: .10, arm: .16, breath: .012, weight: .75},
  spitter: {rate: 1.05, pitch: -.21, arm: .42, breath: .018, weight: 1},
  brute: {rate: .8, pitch: .14, arm: .42, breath: .009, weight: 2},
  stalker: {rate: 1.25, pitch: .08, arm: .34, breath: .014, weight: .85},
  carrier: {rate: .85, pitch: -.08, arm: .20, breath: .012, weight: 1.6},
  queen: {rate: .7, pitch: .07, arm: .25, breath: .008, weight: 3},
};

/** Actor-local clocks and reusable bone offsets. No result is returned to gameplay. */
export class EnemyMotion {
  readonly state = {holdMs: 0, offsetX: 0, offsetZ: 0, anticipation: 0, phase: 0};
  private readonly profile: Profile;
  private readonly joints: Joint[] = [];
  private readonly parent = new T.Quaternion();
  private readonly rotation = new T.Quaternion();
  private readonly delta = new T.Quaternion();
  private readonly side = new T.Vector3();
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

  constructor(private root: T.Group, private body: T.Group, asset: T.Object3D, private family: string) {
    this.profile = PROFILES[family] ?? PROFILES.crawler;
    this.restY = body.position.y;
    const names = family === 'spitter' ? ['head', 'handL', 'handR']
      : family === 'brute' || family === 'queen' ? ['head', 'forearml', 'forearmr']
      : family === 'stalker' ? ['head', 'arm_midL', 'arm_midR']
      : family === 'carrier' ? ['head', 'upper_arm001L', 'upper_arm001R'] : ['chest'];
    for (const name of names) {
      const bone = asset.getObjectByName(name);
      if (bone) this.joints.push({bone, rest: bone.quaternion.clone(), pitch: 0, yaw: 0});
    }
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

  attack() { this.release = .30; }

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
    this.emergence = Math.min(.22, this.emergence + dt);
    this.state.holdMs = this.hold * 1000;
    return this.visualTime;
  }

  get rate() { return this.profile.rate * (.96 + this.seed * .08); }

  apply(time: number, aim: number, moving: number, anticipation: number, winding: boolean,
    frozen: boolean, burning: boolean, shocked: boolean) {
    this.state.anticipation = winding ? anticipation : 0;
    if (frozen) { this.freeze(); return; }
    const p = this.profile, motion = this.strength * (this.reduced ? .3 : 1);
    const contact = this.impact * Math.exp(-Math.max(0, this.impactAge - (this.heavy ? .045 : 0)) * 13);
    const follow = this.impact * Math.exp(-this.impactAge * 10) * Math.sin(this.impactAge * 28);
    const direction = aim - this.hitAngle;
    const distance = Math.min(ACTOR_OFFSET_LIMIT, contact * .05 / Math.sqrt(p.weight)) * motion;
    const release = Math.sin(Math.min(1, (.30 - this.release) / .075) * Math.PI / 2) * this.release / .30;
    // A rapid ease into a held pose; progress remains the exact native warning fraction.
    const brace = winding ? .72 + .28 * Math.min(1, anticipation / .25) : 0;
    const rise = 1 - Math.pow(1 - this.emergence / .22, 3);
    this.body.position.set(Math.sin(direction) * distance,
      this.restY - Math.min(.28, .055 * p.weight) * (1 - rise) - contact * .025 * motion,
      Math.cos(direction) * distance);
    this.state.offsetX = this.body.position.x;
    this.state.offsetZ = this.body.position.z;
    this.body.rotation.x = (brace * p.pitch - release * p.pitch * .55 + follow * .075 / p.weight) * motion;
    this.body.rotation.z = -Math.sin(direction) * contact * .055 * motion;
    this.body.scale.set(1 + contact * .018 * motion, 1 - contact * (this.heavy ? .11 : .045) * motion, 1 + contact * .018 * motion);
    const breath = Math.sin(time * (burning ? 7 : 2.6) + this.seed * 6.28) * p.breath;
    const convulse = shocked && !this.reduced ? Math.sin(time * 43 + this.seed * 6.28) * .055 : 0;
    this.side.set(-Math.sin(aim), 0, Math.cos(aim));
    for (let i = 0; i < this.joints.length; i++) {
      const joint = this.joints[i]; joint.rest.copy(joint.bone.quaternion);
      joint.pitch = (i === 0 ? brace * p.arm - release * .20 + breath * (moving > .3 ? .2 : 1) + convulse : -brace * p.arm + release * .25) * motion;
      joint.pitch += contact * Math.cos(direction) * (this.heavy ? .20 : .07) * motion;
      joint.yaw = i === 0 ? contact * Math.sin(direction) * .16 * motion : (i === 1 ? -1 : 1) * brace * p.arm * .35 * motion;
      joint.bone.parent!.getWorldQuaternion(this.parent);
      this.rotation.setFromAxisAngle(this.side, joint.pitch);
      this.delta.setFromAxisAngle(UP, joint.yaw).multiply(this.rotation);
      this.rotation.copy(this.parent).invert().multiply(this.delta).multiply(this.parent);
      joint.bone.quaternion.premultiply(this.rotation);
    }
    this.restored = false;
  }

  freeze() {
    this.body.position.set(0, this.restY, 0);
    this.body.rotation.set(0, 0, 0);
    this.body.scale.set(1, 1, 1);
    this.hold = 0;
    this.state.holdMs = this.state.offsetX = this.state.offsetZ = 0;
  }

  reset() {
    this.restore(); this.freeze(); this.previous = undefined;
    this.visualTime = this.cooldown = this.impact = this.release = this.emergence = 0;
    this.impactAge = 1; this.state.holdMs = this.state.offsetX = this.state.offsetZ = this.state.anticipation = 0;
  }
}
