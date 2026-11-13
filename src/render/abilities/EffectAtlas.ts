import * as T from 'three';

/** Immutable tile addresses emitted by tools/assets/vfx/build_atlas.py. */
export const EFFECT_TILES = Object.freeze({
  fire: 0, smoke: 64, explosion: 128, glow: 153, ember: 154, star: 155,
  frost: 156, crystal: 157, crack: 158, scorch: 159, ring: 160, caustic: 161,
  hex: 162, scan: 163, snow: 164, shard: 165, mist: 168, bolt: 176,
  spark: 184, impact: 185, dust: 186, shockwave: 187,
});

/** One image/GPU texture per kit. No request on title; preparation is idempotent. */
export class EffectAtlas {
  readonly texture: T.Texture;
  private work?: Promise<void>;
  private disposed = false;
  loaded = false;

  constructor() {
    if (typeof document === 'undefined') this.texture = new T.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    else {
      const placeholder = document.createElement('canvas');
      placeholder.width = placeholder.height = 1;
      const context = placeholder.getContext('2d');
      if (context) { context.fillStyle = 'white'; context.fillRect(0, 0, 1, 1); }
      this.texture = new T.Texture(placeholder);
    }
    this.texture.name = 'ability-elements-cc0-v6';
    this.texture.colorSpace = T.NoColorSpace;
    this.texture.minFilter = T.LinearMipmapLinearFilter;
    this.texture.magFilter = T.LinearFilter;
    this.texture.generateMipmaps = true;
    this.texture.flipY = true;
    this.texture.needsUpdate = true;
  }

  /** Await before first-room material warmup; safe to call again after room changes. */
  prepare(): Promise<void> {
    if (this.work) return this.work;
    if (this.disposed || typeof document === 'undefined') return Promise.resolve();
    this.work = new Promise<void>((resolve, reject) => {
      new T.ImageLoader().load(`${import.meta.env.BASE_URL}assets/vfx/containment-v6/elements.png`, image => {
        if (this.disposed) { resolve(); return; }
        // Keep the same uniform/Texture identity and program key through decode.
        this.texture.image = image;
        this.texture.needsUpdate = true;
        this.loaded = true;
        resolve();
      }, undefined, reject);
    });
    return this.work;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.texture.dispose();
  }
}

/** Padded tile sampling; frame clocks never depend on wall time or source motion. */
export const EFFECT_ATLAS_GLSL = `
uniform sampler2D map;
vec4 effectTile(float frame,vec2 uv){
 vec2 cell=vec2(mod(frame,16.),15.-floor(frame/16.));
 return texture2D(map,(cell+(vec2(2.5)+clamp(uv,0.,1.)*123.)/128.)/16.);
}
vec4 effectSequence(float first,float count,float fps,float seed,vec2 uv){
 float f=mod(abilityTime*fps+seed,count);
 // Temporal interpolation prevents a stop-motion look without new instances/draws.
 return mix(effectTile(first+floor(f),uv),effectTile(first+mod(floor(f)+1.,count),uv),fract(f));
}
`;

/** Texture radiance is banded gently; silhouettes retain their authored alpha. */
export const TEXTURED_FIRE_GLSL = `
 vec2 fireUv=uvLocal;
 vec4 fire=phase>=200.?effectTile(floor(phase)-200.,fireUv):effectSequence(0.,64.,24.,phase,fireUv);
 float coverage=fire.a;
 float heat=clamp(fire.g/max(.05,fire.r)*.82+fire.r*.18,0.,1.);
 float body=smoothstep(.08,.55,heat),core=smoothstep(.59,.93,heat);
 c=mix(vec3(.17,.007,.001),vec3(1.05,.105,.003),body);
 c=mix(c,vec3(2.8,1.9,.34),core);
 a*=coverage;
 // No opaque card edge against the deck; real alpha silhouettes are continuous.
 a*=smoothstep(.015,.16,worldHeight);
`;
