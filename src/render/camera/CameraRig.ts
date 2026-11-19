import * as T from 'three';

/** Shared deck framing tilt. Keep room clamping and safety correction in sync. */
export const CAMERA_OFFSET_Y = 26;
export const CAMERA_OFFSET_Z = 19;
const CAMERA_DISTANCE = Math.hypot(CAMERA_OFFSET_Y, CAMERA_OFFSET_Z);

/** Render-only camera response. No clock reads, randomness or gameplay decisions. */
export class CameraRig {
  readonly focus = new T.Vector3();
  private velocity = new T.Vector2();
  private shake = new T.Vector2();
  private recoil = new T.Vector2();
  private trauma = 0;
  private zoomImpulse = 0;
  private zoomLife = 0;
  private zoomDuration = 0;
  private time = 0;
  private ready = false;

  /** Snap on room transitions so a previous room never drags the camera. */
  reset(x: number, z: number) {
    this.focus.set(x, 0, z);
    this.velocity.set(0, 0);
    this.shake.set(0, 0);
    this.recoil.set(0, 0);
    this.trauma = this.zoomImpulse = this.zoomLife = this.zoomDuration = this.time = 0;
    this.ready = true;
  }

  /** Add bounded trauma; squared amplitude keeps small shots quiet. */
  addTrauma(amount: number) {
    this.trauma = T.MathUtils.clamp(this.trauma + Math.max(0, amount), 0, 1);
  }

  setRumbleFloor(amount:number){this.trauma=Math.max(this.trauma,T.MathUtils.clamp(amount,0,1));}

  /** Recoil follows the shot direction in world space. */
  kick(angle: number, amount: number) {
    this.recoil.x -= Math.cos(angle) * Math.min(.25, Math.max(0, amount));
    this.recoil.y -= Math.sin(angle) * Math.min(.25, Math.max(0, amount));
    this.recoil.clampLength(0, .35);
  }

  /** A short zoom-out impulse retains space around an explosion. */
  punch(amount: number, ms: number) {
    const duration = T.MathUtils.clamp(ms / 1000, 0, 1);
    if (duration === 0) return;
    this.zoomImpulse = Math.max(this.currentPunch(), T.MathUtils.clamp(amount, 0, .055));
    this.zoomLife = this.zoomDuration = Math.max(this.zoomLife, duration);
  }

  /** Critically damped, analytic spring: stable across frame rates and pause. */
  update(dt: number, x: number, z: number, strength: number, reducedMotion: boolean) {
    if (!this.ready) this.reset(x, z);
    // Settings can change while paused. Clear all residual impulses before the
    // zero-delta return so enabling motion later cannot replay a hidden hit.
    if (reducedMotion || strength <= 0) {
      this.trauma = this.zoomImpulse = this.zoomLife = this.zoomDuration = 0;
      this.shake.set(0, 0);
      this.recoil.set(0, 0);
    }
    dt = Math.min(.05, Math.max(0, dt));
    if (dt === 0) return;
    this.time += dt;
    const omega = 14, decay = Math.exp(-omega * dt);
    const dx = this.focus.x - x, dz = this.focus.z - z;
    const tx = (this.velocity.x + omega * dx) * dt;
    const tz = (this.velocity.y + omega * dz) * dt;
    this.focus.x = x + (dx + tx) * decay;
    this.focus.z = z + (dz + tz) * decay;
    this.velocity.set((this.velocity.x - omega * tx) * decay, (this.velocity.y - omega * tz) * decay);
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    this.recoil.multiplyScalar(Math.exp(-dt * 18));
    this.zoomLife = Math.max(0, this.zoomLife - dt);
    const amplitude = this.trauma ** 2 * .18;
    this.shake.set(Math.sin(this.time * 79) * amplitude, Math.sin(this.time * 103 + .7) * amplitude * .7);
  }

  private currentPunch() {
    return this.zoomDuration > 0 ? this.zoomImpulse * (this.zoomLife / this.zoomDuration) ** 2 : 0;
  }

  /** Apply motion without roll; mouse projection uses the same rendered camera. */
  apply(camera: T.OrthographicCamera | T.PerspectiveCamera, baseZoom: number, viewHeight: number, strength = 1) {
    const scale = T.MathUtils.clamp(strength, 0, 1);
    const x = this.focus.x + (this.shake.x + this.recoil.x) * scale;
    const z = this.focus.z + (this.shake.y + this.recoil.y) * scale;
    const distance = camera instanceof T.PerspectiveCamera
      ? viewHeight / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2))) : CAMERA_DISTANCE;
    camera.position.set(x, CAMERA_OFFSET_Y / CAMERA_DISTANCE * distance, z + CAMERA_OFFSET_Z / CAMERA_DISTANCE * distance);
    camera.lookAt(x, 0, z);
    const zoom = baseZoom * (1 - this.currentPunch() * scale);
    if (camera.zoom !== zoom) { camera.zoom = zoom; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();
  }
}
