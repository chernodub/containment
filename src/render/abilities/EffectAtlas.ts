import * as T from 'three';
import { GRAPHIC_COMBUSTION_GLSL } from './GraphicLanguage';

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
    // An unuploaded Texture binds Three's empty sampler until decode. Uploading a
    // 1x1 placeholder would allocate immutable storage that cannot later grow.
    this.texture = typeof document === 'undefined'
      ? new T.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
      : new T.Texture();
    this.texture.name = 'ability-elements-cc0-v6';
    this.texture.colorSpace = T.NoColorSpace;
    this.texture.minFilter = T.LinearMipmapLinearFilter;
    this.texture.magFilter = T.LinearFilter;
    this.texture.generateMipmaps = true;
    this.texture.flipY = true;
    if (typeof document === 'undefined') this.texture.needsUpdate = true;
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
${GRAPHIC_COMBUSTION_GLSL}
uniform sampler2D map;
vec4 effectTile(float frame,vec2 uv){
 vec2 cell=vec2(mod(frame,16.),15.-floor(frame/16.));
 return texture2D(map,(cell+(vec2(2.5)+clamp(uv,0.,1.)*123.)/128.)/16.);
}
// The original texture/source hashes stay unchanged. Coarse mip sampling removes
// photographic grain only from combustion; crystals, bolts and field detail stay crisp.
vec4 effectGraphicTile(float frame,vec2 uv){
 vec2 cell=vec2(mod(frame,16.),15.-floor(frame/16.));
 return texture2D(map,(cell+(vec2(2.5)+clamp(uv,0.,1.)*123.)/128.)/16.,1.5);
}
vec4 effectGraphicSequence(float first,float count,float fps,float seed,vec2 uv){
 float f=mod(abilityTime*fps+seed,count);
 return mix(effectGraphicTile(first+floor(f),uv),effectGraphicTile(first+mod(floor(f)+1.,count),uv),fract(f));
}
vec4 effectSequence(float first,float count,float fps,float seed,vec2 uv){
 float f=mod(abilityTime*fps+seed,count);
 // Temporal interpolation prevents a stop-motion look without new instances/draws.
 return mix(effectTile(first+floor(f),uv),effectTile(first+mod(floor(f)+1.,count),uv),fract(f));
}
`;

/** Tapered original flame family; retained explosions still use their authored atlas. */
export const TEXTURED_FIRE_GLSL = `
 vec2 fireUv=uvLocal;
 float coverage;
 if(phase>=200.){
  vec4 fire=effectGraphicTile(floor(phase)-200.,fireUv);
  coverage=graphicCoverage(fire.a);
  c=graphicCombustion(fire);
 }else{
  // The same three unequal tongues serve jets, fuel edges and suit exhaust.
  // Source alpha no longer decides the silhouette: broad photo-core islands
  // cannot turn the pressure body into floating yellow leaves.
  float t=fireUv.y;float seed=mod(phase,32.);
  float family=mod(floor(seed),3.);
  float clock=abilityTime*3.1;
  float jet=step(100.,phase);
  float bend=(sin(t*6.4+seed-clock)*.09+sin(t*12.3-seed+clock*.7)*.035)*t;
  float throat=mix(.73,.27,jet);
  float envelope=mix(throat,1.,smoothstep(.015,.30,t))*pow(max(.001,1.-t),.64);
  float lobe=.84+.12*sin(t*(10.+family*2.)-clock+seed)+.055*sin(t*23.+clock*.6+seed);
  float width=max(.008,envelope*lobe);
  float side=abs(p.x-bend)/width;
  float aa=max(.012,min(.12,fwidth(side)));
  coverage=(1.-smoothstep(.84-aa,.84+aa,side))*smoothstep(.0,.035,t)*(1.-smoothstep(.94,1.,t));
  // A narrow heated spine lives at the source. The outer connected lobes are
  // orange, with a dark char edge; only the nozzle earns a near-white value.
  float body=1.-smoothstep(.63,.82,side);
  float inner=(1.-smoothstep(.10,.34,side))*(1.-smoothstep(.12,.63,t));
  float core=inner*smoothstep(.30,.65,ink.g);
  c=mix(vec3(.025,.036,.044),vec3(1.05,.105,.003),body);
  c=mix(c,vec3(2.15,.65,.055),inner*.58);
  c=mix(c,vec3(2.8,1.9,.34),core);
 }
 a*=coverage;
 // Every path hides all four card edges, including the source end of a jet.
 a*=smoothstep(.015,.16,worldHeight);
`;
