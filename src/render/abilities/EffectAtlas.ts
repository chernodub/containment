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
  bool peak=phase>=${FIRE_FAN_PHASE + 4}.;
  float halfArc=mod(phase-${FIRE_FAN_PHASE}.,4.);
  vec2 ray=vec2(p.x*sin(halfArc),fireUv.y);
  float t=length(ray),theta=atan(ray.x,max(.0001,ray.y))/halfArc;
  if(t>1.||abs(theta)>1.)discard;
  // Map overlapping tongue silhouettes into polar lanes. The edge lanes
  // share the same normalized range and animate independently of cast age.
  float lane=theta*3.8+t*.24*sin(t*10.-abilityTime*8.);
  float tooth=1.-abs(fract(lane+.5)*2.-1.);
  float roll=sin(floor(lane+.5)*2.7+abilityTime*5.+t*7.);
  float strand=floor(lane+.5);
  float reach=.48+.19*fract(sin(strand*41.7+1.)*734.31)+.27*pow(tooth,.8)+.055*roll;
  float split=smoothstep(.48,.74,t)*smoothstep(.34,.70,abs(sin(t*21.-abilityTime*9.+strand)));
  reach-=.14*split;
  float edge=reach-t;
  coverage=smoothstep(.0,.018,edge)*smoothstep(.015,.13,t)*(1.-smoothstep(.94,1.,abs(theta)));
  coverage*=1.-smoothstep(.4,.68,t)*(1.-smoothstep(.06,.33,tooth));
  #ifdef HAS_ABILITY_PRIORITY_MASK
  coverage*=1.-.78*prioritySample.r;
  #endif
  float orange=smoothstep(.035,.18,tooth+.18*roll)*smoothstep(.04,.24,t);
  float flare=smoothstep(.64,.78,t/reach)*smoothstep(.18,.64,tooth);
  c=mix(vec3(.42,.077,.002),vec3(1.55,.41,.009),orange*(1.-smoothstep(.72,1.,abs(theta))));
  c=mix(c,vec3(2.1,1.42,.30),flare*(1.-smoothstep(.72,1.,abs(theta))));
  c=mix(c,vec3(2.1,1.1,.08),smoothstep(.79,.98,tooth)*(1.-smoothstep(.34,.82,t)));
  float core=(1.-smoothstep(.06,.24,abs(theta)))*(1.-smoothstep(.20,.42,t));
  c=mix(c,vec3(2.2,1.65,.31),core);
  if(peak){
   float inner=1.-smoothstep(.48,.63,t);
   float axis=(1.-smoothstep(.22,.48,abs(theta)))*(1.-smoothstep(.30,.39,t));
   coverage=mix(coverage,1.-smoothstep(.94,1.,abs(theta)),inner);
   c=mix(c,mix(vec3(2.3,.65,.025),vec3(3.7,3.05,1.42),axis),inner);
   #ifdef HAS_ABILITY_PRIORITY_MASK
   // The exact actor stencil protects the suit and victims at impact.
   prioritySample.rb*=1.-inner;
   #endif
  }
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
  c=mix(c,vec3(2.2,1.65,.31),core*heat);
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
  float body=smoothstep(.08,.23,t)*(1.-smoothstep(.82,1.,side));
  float tip=smoothstep(.6,.72,t+.08*sin(signedSide*3.+seed));
  c=mix(vec3(.38,.068,.002),vec3(1.65,.40,.009),body);
  c=mix(c,vec3(2.4,1.72,.38),tip*body);
 }
 a*=coverage;
 // Every path hides all four card edges, including the source end of a jet.
 a*=smoothstep(.015,.16,worldHeight);
`;
