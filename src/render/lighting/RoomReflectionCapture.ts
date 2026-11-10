import * as T from 'three';

/** Owns one room-local PMREM, captured only after all asynchronous room preparation settles. */
export class RoomReflectionCapture {
  private target: T.WebGLRenderTarget | null = null;
  private captured = false;
  constructor(private readonly renderer: T.WebGLRenderer, private readonly scene: T.Scene) {}
  /** Drop the old room's GPU texture; call on every room load and context restore. */
  invalidate() {
    if (this.target) {
      if (this.scene.environment === this.target.texture) this.scene.environment = null;
      this.target.dispose(); this.target = null;
    }
    this.captured = false;
  }
  /** Returns false after the first successful capture. Exclude actors/VFX/atmosphere roots. */
  capture(x: number, y: number, z: number, excluded: readonly T.Object3D[] = []): boolean {
    if (this.captured) return false;
    const cube = new T.WebGLCubeRenderTarget(64, { type: T.HalfFloatType, generateMipmaps: false });
    const camera = new T.CubeCamera(.1, 100, cube);
    const pmrem = new T.PMREMGenerator(this.renderer);
    const environment = this.scene.environment;
    // A room capture precedes the first shadow draw. Sampling an unallocated
    // comparison shadow texture is invalid on WebGL2; the blurred reflection
    // needs room radiance, and does not need six extra shadow renders.
    const shadowEnabled = this.renderer.shadowMap?.enabled;
    const visibility = excluded.map(object => object.visible);
    try {
      this.scene.environment = null;
      if (this.renderer.shadowMap) this.renderer.shadowMap.enabled = false;
      for (const object of excluded) object.visible = false;
      camera.position.set(x, y, z); camera.update(this.renderer, this.scene);
      this.target = pmrem.fromCubemap(cube.texture);
      this.scene.environment = this.target.texture;
      this.captured = true;
      return true;
    } finally {
      if (!this.captured) this.scene.environment = environment;
      if (this.renderer.shadowMap) this.renderer.shadowMap.enabled = shadowEnabled!;
      for (let i = 0; i < excluded.length; i++) excluded[i].visible = visibility[i];
      pmrem.dispose(); cube.dispose();
    }
  }
  get texture() { return this.target?.texture ?? null; }
  dispose() { this.invalidate(); }
}
