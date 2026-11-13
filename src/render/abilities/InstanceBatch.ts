import * as T from 'three';
import { FRIENDLY_GROUND_ORDER } from './FriendlyBoundary';
import { createArmorSection, createFractureMass, createMarineEcho, GRAPHIC_FLAME_FRAGMENT, GRAPHIC_SOLID_FRAGMENT, GRAPHIC_FRACTURE_FRAGMENT } from './GraphicLanguage';

export type Primitive = 'shard' | 'spark' | 'smoke' | 'flame' | 'solid' | 'ghost' | 'decal' | 'front';
const vertex = `
attribute float abilityAlpha;attribute float abilityPhase;
varying float alpha;varying float phase;varying vec3 ink;varying vec2 uvLocal;varying vec4 screenPosition;varying vec3 facetNormal;
void main(){alpha=abilityAlpha;phase=abilityPhase;ink=instanceColor;uvLocal=uv;facetNormal=normalize(normalMatrix*mat3(instanceMatrix)*normal);
vec3 posedPosition=position;/* ability shape */
gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(posedPosition,1.);screenPosition=gl_Position;}`;

/** Fixed GPU inventory: analytic flames and the retained licensed smoke atlas. */
export class InstanceBatch {
  readonly mesh: T.InstancedMesh;
  private readonly color = new T.Color();
  private readonly colorKeys = new Float64Array(64).fill(NaN);
  private readonly colorValues = new Float64Array(64 * 3);
  private readonly matrixRange = { start: 0, count: 0 };
  private readonly colorRange = { start: 0, count: 0 };
  private readonly alphaRange = { start: 0, count: 0 };
  private readonly phaseRange = { start: 0, count: 0 };
  private readonly alpha: T.InstancedBufferAttribute;
  private readonly phase: T.InstancedBufferAttribute;
  private readonly texture?: T.Texture;
  private readonly priority: T.InstancedBufferAttribute;
  private readonly priorityRange = { start: 0, count: 0 };
  priorityWeight = 0;
  private view?: T.Vector3;

  setView(camera: T.Camera): void {
    this.view = camera.position;
  }

  constructor(root: T.Object3D, readonly kind: Primitive, readonly capacity: number) {
    const geometry = kind === 'front' ? new T.TorusGeometry(.88, .12, 6, 64).rotateX(-Math.PI / 2)
      : kind === 'shard' ? createFractureMass()
      : kind === 'ghost' ? createMarineEcho() : kind === 'solid' ? createArmorSection()
        : new T.PlaneGeometry(2, 2);
    this.alpha = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    this.phase = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    this.priority = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    geometry.setAttribute('abilityPriority', this.priority);
    geometry.setAttribute('abilityAlpha', this.alpha);
    geometry.setAttribute('abilityPhase', this.phase);

    const atlas = kind === 'smoke';
    if (atlas) {
      this.texture = typeof document === 'undefined'
        ? new T.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
        : new T.TextureLoader().load(`${import.meta.env.BASE_URL}assets/vfx/WispySmoke02.png`);
      this.texture.colorSpace = T.NoColorSpace;
      this.texture.minFilter = this.texture.magFilter = T.LinearFilter;
      this.texture.generateMipmaps = false;
    }

    const fragment = `
uniform float abilityTime;uniform sampler2D map;uniform float flash;
varying float alpha;varying float phase;varying vec3 ink;varying vec2 uvLocal;varying vec4 screenPosition;varying vec3 facetNormal;
float abilityHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
float abilityNoise(vec2 p){vec2 b=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(abilityHash(b),abilityHash(b+vec2(1.,0.)),f.x),mix(abilityHash(b+vec2(0.,1.)),abilityHash(b+vec2(1.)),f.x),f.y);}
void main(){
 vec2 p=uvLocal*2.-1.;float a=alpha;vec3 c=ink;
${atlas ? `
 float frame=mod(floor(abilityTime*18.+phase),64.);
 vec2 grid=vec2(8.,8.);
 vec2 cell=vec2(mod(frame,grid.x),grid.y-1.-floor(frame/grid.x));
 vec2 inset=vec2(.006,.008);vec2 at=(cell+clamp(uvLocal,inset,1.-inset))/grid;
 vec4 s=texture2D(map,at);
 float edge=smoothstep(0.,.07,uvLocal.x)*smoothstep(0.,.07,1.-uvLocal.x)*smoothstep(0.,.07,uvLocal.y)*smoothstep(0.,.07,1.-uvLocal.y);
 a*=s.a*edge;
 float vapor=step(ink.r*1.12,ink.b)*smoothstep(.18,.5,ink.b);float dust=step(.08,ink.r+ink.g+ink.b)*(1.-vapor);c=mix(vec3(.007,.009,.012),ink*.65,dust);c=mix(c,ink*.85,vapor);a*=mix(.65,.52,vapor);
 ` : ''}
${kind === 'flame' ? GRAPHIC_FLAME_FRAGMENT : ''}
${kind === 'spark' ? 'float d=dot(p,p);if(d>1.)discard;a*=pow(1.-d,2.);c*=3.5;' : ''}
${kind === 'decal' ? `
 float d=length(p);float a0=atan(p.y,p.x);float variant=floor(phase+.01);
 // Soot fans and fracture discs reject empty coverage before the expensive paths.
 if(variant<.5&&d>1.)discard;
 if(variant>2.5&&variant<3.5&&(d>1.||abs(a0)>fract(phase)*6.283185))discard;
 float n=abilityNoise(p*19.);
 float cracks=0.;float lip=0.;
 // Fuel, frost and wind never pay for the fracture paths. Instance-coherent branch.
 if(variant<.5||(variant>2.5&&variant<3.5)){
 // Seven unequal structural splits, each with a bent primary and one shorter branch.
 for(int split=0;split<7;split++){
  float seed=float(split)*2.39996323+.37;
  vec2 axis=vec2(cos(seed),sin(seed));vec2 crossAxis=vec2(-axis.y,axis.x);
  float along=dot(p,axis);float across=dot(p,crossAxis);
  float bend=sin(seed*3.7)*max(0.,along-.18)*.38-sin(seed*3.7)*max(0.,along-.36)*.68+sin(seed*7.1)*max(0.,along-.62)*.55;
  float reach=.63+.32*fract(sin(seed*37.1)*437.13);
  float splitCoverage=smoothstep(.06,.15,along)*(1.-smoothstep(reach-.07,reach,along));
  float width=(.007+.008*fract(seed*1.7))*(1.-along*.65);
  float groove=1.-smoothstep(width*.4,width,abs(across-bend));
  float branch=1.-smoothstep(.004,.012,abs(across-bend-(along-.4)*(.35+sin(seed)*.15)));
  float breaks=1.-smoothstep(.018,.036,abs(along-(.3+fract(seed)*.2)));
  float intact=1.-breaks*.8;
  cracks=max(cracks,max(groove*intact,branch*smoothstep(.38,.46,along)*.65)*splitCoverage);
  lip=max(lip,(1.-smoothstep(.003,.009,abs(across-bend-.016)))*splitCoverage);
 }
 }
 if(variant<.5){if(d>1.)discard;a*=max(cracks*.8,lip*.35);c=mix(vec3(.006,.009,.012),vec3(.095,.085,.062),lip*.55);}
 else if(variant<1.5){
  if(d>1.)discard;
  float powder=abilityNoise(p*31.);
  float fern=pow(1.-abs(sin(a0*17.+sin(d*39.)*.4)),24.)*smoothstep(.5,.8,powder);
  a*=(powder*.018+fern*.045)*(1.-smoothstep(.82,1.,d))*smoothstep(.18,.42,d);c*=.85;
 }
 else if(variant<2.5){float edge=abs(p.y);float slag=pow(max(0.,1.-abs(p.y+sin(p.x*31.)*.12)*4.),3.)*(.4+n*.6);a*=(1.-smoothstep(.7,1.,abs(p.x)))*(1.-smoothstep(.5,1.,edge))*(.5+n*.4);c=mix(ink,vec3(2.8,.5,.015),slag*fract(phase)*10.*flash);}
 else if(variant<3.5){if(d>1.)discard;float cone=step(abs(a0),fract(phase)*6.283185);a*=cone*(1.-smoothstep(.72+sin(a0*23.)*.05,.96,d))*(.14+cracks*.12);}
 else if(variant<4.5){if(d>1.)discard;float star=pow(1.-abs(sin(a0*5.+floor(d*11.)*.18)),22.);a*=(star*.85+(.2+n*.2)*(1.-smoothstep(.1,.5,d)))*(1.-smoothstep(.8,1.,d));}
 else if(variant<5.5){if(d>1.)discard;a*=(.14+n*.16)*(1.-smoothstep(.65,1.,d));}
 else if(variant>13.5){
  float ratio=max(.001,fract(phase)/.8);
  float cap=max(0.,(abs(p.x)-1.+ratio)/ratio);
  float distance=length(vec2(cap,p.y));
  float edge=.91+sin(p.x*17.+p.y*5.)*.035+sin(p.x*31.-p.y*11.)*.025;
  float film=1.-smoothstep(edge-.09,edge,distance);
  float fern=pow(max(0.,1.-abs(sin(p.x*29.+p.y*17.))),10.)*smoothstep(.25,.7,abs(p.y));
  c=ink*.85+vec3(.05);
  // Frost is a broken edge deposit, not a continuous pale capsule fill.
  a*=film*(.025+fern*.24+smoothstep(.55,.85,abs(p.y))*.14);
 }
 else if(variant>11.5){
  float seed=fract(phase)*31.;
  vec2 cloud=vec2(p.x,p.y*1.15);
  cloud.x+=sin(p.y*4.+seed+abilityTime*.8)*.09;
  float edge=.78+sin(p.x*6.+seed)*.085+sin(p.y*9.-seed)*.045;
  float vapor=(1.-smoothstep(.24,edge,length(cloud)));
  // Rounded, broken vapor masses, never opaque slices of a torus.
  c=mix(ink*.38,ink*.82+vec3(.08),smoothstep(.24,.42,vapor));
  a*=vapor*.52;
 }
 else if(variant>10.5){
  float drop=length(vec2(p.x/max(.1,.66-p.y*.22),p.y));
  if(drop>1.)discard;
  float body=1.-smoothstep(.15,1.,drop);
  float gloss=pow(max(0.,1.-length(p-vec2(-.19,.14))/.3),3.);
  c=mix(vec3(.1,.022,.004),vec3(.65,.18,.035),body)+vec3(.5,.25,.06)*gloss;
  a*=1.-smoothstep(.82,1.,drop);
 }
 else if(variant>9.5){
  float seed=fract(phase)*15.7;
  float curve=p.x*p.x*(.18+sin(seed)*.07)+sin(p.x*3.+seed+abilityTime*.3)*.055;
  float cold=step(ink.r*1.1,ink.g);
  float coverage;
  if(cold>.5){
   vec2 cloud=vec2(p.x*.86,(p.y-curve)*1.08);
   float edge=.86+sin(p.x*4.2+seed)*.065+sin(p.y*6.3-seed)*.045;
   coverage=(1.-smoothstep(.2,edge,length(cloud)))*smoothstep(-1.,-.65,p.x)*(1.-smoothstep(.65,1.,p.x));
   c=ink*.8+vec3(.1)*coverage;
  }else{
   float taper=pow(max(0.,1.-p.x*p.x),.6);
   float stroke=abs(p.y-curve)/max(.04,.38*taper);
   coverage=(1.-smoothstep(.32,1.,stroke))*taper;
   c=mix(ink*.55,ink*1.45+vec3(.1),smoothstep(.45,.95,coverage));
  }
  a*=coverage*mix(.85,.58,cold);
 }
 else if(variant>7.5){
  float liquid=variant<8.5?d:length(vec2(p.x*.18,p.y));
  float edge=.9+sin(a0*5.+.7)*.035+sin(a0*9.-.4)*.025;
  if(liquid>edge||abs(p.x)>.995)discard;
  float flow=abilityNoise(p*3.+vec2(abilityTime*.12,-abilityTime*.08));
  float glossy=pow(max(0.,1.-abs(p.y+p.x*.22+sin(p.x*5.+abilityTime*.4)*.08)*7.),5.);
  float meniscus=1.-smoothstep(.015,.045,abs(liquid-edge+.025));
  c=mix(vec3(.075,.013,.002),vec3(.32,.055,.004),flow*.65);
  c+=vec3(.46,.16,.025)*glossy*.48+vec3(.35,.075,.005)*meniscus*.45;
  a*=.72*(1.-smoothstep(edge-.045,edge,liquid))*(1.-smoothstep(.96,1.,abs(p.x)));
  if(variant<8.5){
   // Fuel gathers in unequal hot pockets with open floor between them. Keep
   // the analytic outer footprint, but avoid a uniformly tinted combat disc.
   float pocket=smoothstep(.32,.68,flow);
   c=mix(vec3(.035,.008,.002),c*1.35,pocket);
   c+=vec3(.58,.16,.018)*smoothstep(.64,.78,flow)*.45;
   a*=mix(.14,.88,pocket);
  }
 }
 else {if(d>1.)discard;if(variant>6.5&&abs(a0)>fract(phase)*6.283185)discard;a*=.035*(1.-smoothstep(.6,1.,d));c=vec3(.014,.009,.006);}
 ` : ''}
${kind === 'front' ? `
 if(phase>2.5){
  float roll=.5+.5*cos(uvLocal.y*6.283185);
  float curl=.5+.5*sin(uvLocal.x*43.9823+sin(uvLocal.x*18.8496)*1.4-abilityTime*.9);
  float wind=smoothstep(.12,.62,curl)*pow(roll,1.5);
  c=mix(vec3(.14,.29,.37),vec3(.42,.68,.78),smoothstep(.55,.72,roll));
  c=mix(c,vec3(.7,1.,1.1),step(.97,roll)*step(.84,curl));
  a*=wind*.45;
 }else if(phase>1.5){
  float roll=.5+.5*cos(uvLocal.y*6.283185);
  float curl=.5+.5*sin(uvLocal.x*31.4159+sin(uvLocal.x*18.8496)*1.7-abilityTime*1.3+sin(uvLocal.y*6.283185)*1.3);
  // Keep the leading vapor rim; the torus interior must reveal the deck.
  a*=(.035+pow(roll,3.)*.65)*(.06+smoothstep(.15,.8,curl)*.94);
  c=mix(vec3(.24,.6,.85),vec3(1.4,2.4,2.8),pow(roll,10.)*.6);
 }else if(phase>.5){
  float crossSection=cos(uvLocal.y*6.283185);
  if(crossSection<-.4)discard;
  float leading=smoothstep(.3,.98,crossSection);
  float torn=.7+.3*sin(uvLocal.x*81.+sin(uvLocal.x*23.)*2.);
  a*= (.15+leading*.85)*torn;
  c=mix(vec3(.24,.15,.065),ink*1.6+vec3(.3,.16,.025),leading);
 }else{
 float roll=(.5+.5*sin(uvLocal.x*127.+sin(uvLocal.y*19.+abilityTime*5.)*2.))*(.55+.45*sin(uvLocal.x*43.-uvLocal.y*11.+abilityTime*3.));
 float vapor=smoothstep(.08,.55,roll);float ridge=pow(.5+.5*cos(uvLocal.y*6.283),9.);
 float dusty=(1.-smoothstep(.1,.3,max(ink.r-ink.g,ink.b-ink.r)))*(1.-smoothstep(.35,.7,max(ink.r,max(ink.g,ink.b))));
 a*=vapor*mix(.2+ridge*.65,.6,dusty);c*=mix(1.2+ridge*4.*flash,.65+roll*.4,dusty);
 }
 ` : ''}
${kind === 'shard' ? GRAPHIC_FRACTURE_FRAGMENT : kind === 'solid' ? GRAPHIC_SOLID_FRAGMENT : ''}
${kind === 'ghost' ? 'c*=1.15; a*=.78;' : ''}
 vec2 screen=screenPosition.xy/max(.001,screenPosition.w)*.5+.5;
 float actionBar=(1.-smoothstep(.14,.23,screen.y))*(1.-smoothstep(.27,.36,abs(screen.x-.5)));
 a*=1.-actionBar*.94;
 if(a<.004)discard;gl_FragColor=vec4(c,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
    const material = new T.ShaderMaterial({
      uniforms: { abilityTime: { value: 0 }, map: { value: this.texture ?? null }, flash: { value: 1 } },
      vertexShader: vertex.replace('/* ability shape */', kind === 'shard' ? 'if(abilityPhase>.5){float seed=abilityPhase;if(seed>1.&&seed<10.&&position.y>0.)posedPosition.y*=.84+.16*sin(seed+position.x*2.1+position.z*3.7);if(seed>20.&&seed<30.)posedPosition.xz*=mix(1.,.18,max(0.,position.y));posedPosition.xz*=.91+.08*sin(seed*3.7+position.y*2.1);posedPosition.xz+=max(0.,position.y)*vec2(sin(seed)*.12,cos(seed*1.7)*.1);posedPosition.xz=clamp(posedPosition.xz,vec2(-1.),vec2(1.));}' : kind === 'front' ? 'if(abilityPhase>1.5){float a=atan(position.z,position.x);posedPosition.xz*=.88+.07*sin(a*7.)+.035*sin(a*3.+.4);posedPosition.y*=.74+.24*sin(a*5.+.7);}' : ''),
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      // Flat cards have no back/front sorting benefit; render both faces in one submission.
      forceSinglePass: kind === 'flame' || kind === 'spark' || kind === 'smoke' || kind === 'decal',
      // Closed graphic constructs show their outer shell; hidden rear faces add only overdraw.
      side: kind === 'solid' || kind === 'shard' ? T.FrontSide : T.DoubleSide,
      blending: kind === 'flame' || kind === 'shard' || kind === 'smoke' || kind === 'decal' || kind === 'solid' || kind === 'ghost' || kind === 'front'
        ? T.NormalBlending : T.AdditiveBlending,
    });
    this.mesh = new T.InstancedMesh(geometry, material, capacity);
    this.mesh.name = `ability-${kind}-batch`;
    if (kind === 'decal') this.mesh.renderOrder = FRIENDLY_GROUND_ORDER;
    // Soot silhouettes the hot volume, below friendly boundaries and hostile timing fills.
    if (kind === 'smoke') this.mesh.renderOrder = 1;
    this.mesh.frustumCulled = false;
    this.mesh.setColorAt(0, new T.Color());
    this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.mesh.count = 0;
    root.add(this.mesh);
  }

  begin(time = 0): void {
    this.mesh.count = 0;
    this.mesh.visible = false;
    (this.mesh.material as T.ShaderMaterial).uniforms.abilityTime.value = time;
  }

  draw(x: number, y: number, z: number, sx: number, sy: number, sz: number,
    color: number, opacity = 1, rotationY = 0, rotationZ = 0, variant = 0): void {
    const i = this.mesh.count;
    if (i >= this.capacity || opacity <= 0) return;
    const billboardDecal = this.kind === 'decal' && variant >= 11 && variant < 13;
    if (this.view && (billboardDecal || this.kind === 'smoke' || this.kind === 'spark' || this.kind === 'flame')) {
      rotationY = Math.atan2(this.view.x - x, this.view.z - z);
      // Flame tongues rise vertically; tumbling the card creates paper-like shards.
      if (this.kind === 'smoke') rotationZ = 0;
    }
    // These primitives only use XYZ Euler rotations with X = 0 (or -PI/2
    // for deck decals). Write the same transform without Object3D's quaternion
    // callbacks and an intermediate Matrix4 copy for every particle.
    const c = Math.cos(rotationY), s = Math.sin(rotationY), a = Math.cos(rotationZ), b = Math.sin(rotationZ);
    const matrix = this.mesh.instanceMatrix.array, offset = i * 16;
    matrix[offset] = c * a * sx;
    matrix[offset + 4] = -c * b * sy;
    matrix[offset + 8] = s * sz;
    if (this.kind === 'decal' && !billboardDecal) {
      matrix[offset + 1] = -s * a * sx;
      matrix[offset + 2] = -b * sx;
      matrix[offset + 5] = s * b * sy;
      matrix[offset + 6] = -a * sy;
      matrix[offset + 9] = c * sz;
      matrix[offset + 10] = 0;
    } else {
      matrix[offset + 1] = b * sx;
      matrix[offset + 2] = -s * a * sx;
      matrix[offset + 5] = a * sy;
      matrix[offset + 6] = s * b * sy;
      matrix[offset + 9] = 0;
      matrix[offset + 10] = c * sz;
    }
    matrix[offset + 3] = matrix[offset + 7] = matrix[offset + 11] = 0;
    matrix[offset + 12] = x; matrix[offset + 13] = y; matrix[offset + 14] = z; matrix[offset + 15] = 1;
    // A fixed cache keeps repeated element colors from repeating sRGB conversion.
    const key = (color ^ (color >>> 8) ^ (color >>> 16)) & 63, rgb = key * 3;
    if (this.colorKeys[key] !== color) {
      this.color.setHex(color);
      this.colorKeys[key] = color;
      this.colorValues[rgb] = this.color.r; this.colorValues[rgb + 1] = this.color.g; this.colorValues[rgb + 2] = this.color.b;
    }
    this.mesh.instanceColor!.setXYZ(i, this.colorValues[rgb], this.colorValues[rgb + 1], this.colorValues[rgb + 2]);
    this.alpha.setX(i, opacity);
    this.priority.setX(i, this.priorityWeight);
    this.phase.setX(i, this.kind === 'decal' || this.kind === 'shard' || this.kind === 'front' || this.kind === 'flame' && variant >= 64 ? variant : Math.abs(x * 13.7 + z * 19.3 + y * 7.1) % 64);
    this.mesh.count++;
  }

  end(): void {
    this.mesh.visible = this.mesh.count > 0;
    if (!this.mesh.count) return;
    this.upload(this.mesh.instanceMatrix, this.matrixRange, this.mesh.count * 16);
    this.upload(this.mesh.instanceColor!, this.colorRange, this.mesh.count * 3);
    this.upload(this.alpha, this.alphaRange, this.mesh.count);
    this.upload(this.phase, this.phaseRange, this.mesh.count);
    this.upload(this.priority, this.priorityRange, this.mesh.count);
  }

  private upload(attribute: T.InstancedBufferAttribute, range: { start: number; count: number }, count: number): void {
    // Three clears updateRanges after upload; reuse the records when reattaching
    // them next frame, and transfer only the live prefix of each fixed pool.
    range.count = count;
    attribute.updateRanges[0] = range;
    attribute.updateRanges.length = 1;
    attribute.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as T.Material).dispose();
    this.texture?.dispose();
    this.mesh.removeFromParent();
  }
}
