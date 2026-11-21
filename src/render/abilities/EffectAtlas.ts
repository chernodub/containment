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
export const POOL_FLAME_PHASE = 164;
export const FIRE_FAN_PHASE = 500;
export const TEXTURED_FIRE_GLSL = `
 vec2 fireUv=uvLocal;
 float coverage;
 if(phase>=${FIRE_FAN_PHASE}.){
  float halfArc=phase-${FIRE_FAN_PHASE}.;
  vec2 ray=vec2(p.x*sin(halfArc),fireUv.y);
  float t=length(ray),theta=atan(ray.x,max(.0001,ray.y))/halfArc;
  if(t>1.||abs(theta)>1.)discard;
  // Map overlapping tongue silhouettes into polar lanes. The edge lanes
  // share the same normalized range and animate independently of cast age.
  float lane=theta*3.3+.13*sin(t*8.+abilityTime*7.);
  float nearest=floor(lane+.5);
  vec2 stamp=vec2(.5+(lane-nearest)*.72,.10+t*.76);
  vec4 fire=effectGraphicSequence(0.,64.,19.,(nearest+4.)*8.7,stamp);
  float edge=1.-smoothstep(.88,1.,abs(theta));
  float tip=1.-smoothstep(.88+.09*fire.r,1.,t);
  coverage=graphicCoverage(fire.a)*edge*tip*smoothstep(.055,.16,t);
  c=mix(vec3(.72,.18,.006),vec3(2.15,.78,.048),fire.g);
 }else if(phase>=200.){
  vec4 fire=effectGraphicTile(floor(phase)-200.,fireUv);
  coverage=graphicCoverage(fire.a);
  c=graphicCombustion(fire);
 }else if(phase>=100. && phase<${POOL_FLAME_PHASE}.){
  // Use the authored fire silhouette for flows aligned along a limb or a jet.
  vec4 fire=effectGraphicSequence(0.,64.,19.,phase-100.,fireUv);
  coverage=graphicCoverage(fire.a);
  float heat=smoothstep(.19,.84,fire.r);
  float core=smoothstep(.35,.72,ink.g)*(1.-smoothstep(.28,.92,fireUv.y));
  c=mix(vec3(.58,.15,.004),vec3(2.4,.88,.045),heat);
  c=mix(c,vec3(3.9,3.4,2.35),core*heat);
 }else{
  // The same three unequal tongues serve jets, fuel edges and suit exhaust.
  // Source alpha no longer decides the silhouette: broad photo-core islands
  // cannot turn the pressure body into floating yellow leaves.
  float t=fireUv.y;float seed=mod(phase,32.);
  float family=mod(floor(seed),3.);
  float clock=abilityTime*3.1;
  float bend=(sin(t*5.7+seed-clock)*.13+sin(t*13.3-seed+clock*.7)*.045)*t;
  float throat=.73;
  float envelope=mix(throat,1.,smoothstep(.015,.30,t))*pow(max(.001,1.-t),.52+family*.13);
  float lobe=.80+.16*sin(t*(11.+family*2.7)-clock+seed)+.075*sin(t*27.+clock*.6+seed);
  float width=max(.008,envelope*lobe);
  float signedSide=(p.x-bend)/width;
  // Unequal side cavities curl with the flow but stop outside the unbroken spine.
  float biteA=(1.-smoothstep(.025,.13,abs(t-(.36+family*.085+.045*sin(seed+clock)))));
  float biteB=(1.-smoothstep(.018,.095,abs(t-(.69-family*.04+.035*cos(seed-clock)))));
  float left=.82-.31*biteA+.045*sin(t*31.+seed-clock);
  float right=.79-.37*biteB+.055*cos(t*24.-seed+clock);
  float side=abs(signedSide)/mix(left,right,step(0.,signedSide));
  float aa=max(.014,min(.12,fwidth(side)));
  coverage=(1.-smoothstep(1.-aa,1.+aa,side))*smoothstep(.0,.035,t)*(1.-smoothstep(.94,1.,t));
  // A narrow heated spine lives at the source. The outer connected lobes are
  // orange, with a dark char edge; only the nozzle earns a near-white value.
  float body=1.-smoothstep(.61,.85,side);
  float rolling=sin(t*21.-clock*1.4+seed+signedSide*4.8);
  float fold=smoothstep(.24,.78,side)*smoothstep(.16,.32,t)*(1.-smoothstep(.76,.95,t));
  body*=1.-smoothstep(.26,.83,rolling)*fold*.56;
  float spine=abs(signedSide-sin(t*10.-clock+seed)*.065);
  float inner=(1.-smoothstep(.10,.31,spine))*(1.-smoothstep(.12,.63,t));
  float core=inner*smoothstep(.30,.65,ink.g);
  c=mix(vec3(.018,.009,.005),vec3(.95,.24,.006),body);
  c=mix(c,vec3(2.15,.65,.055),inner*.64);
  coverage*=mix(.78,1.,smoothstep(.40,.90,side));
  c=mix(c,vec3(2.8,1.9,.34),core);
 }
 a*=coverage;
 // Every path hides all four card edges, including the source end of a jet.
 a*=smoothstep(.015,.16,worldHeight);
`;
