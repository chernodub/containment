import * as T from 'three';
import { EffectAtlas, FIRE_FAN_PHASE, POOL_FLAME_PHASE, EFFECT_ATLAS_GLSL, TEXTURED_FIRE_GLSL } from './EffectAtlas';
import { FRIENDLY_GROUND_ORDER } from './FriendlyBoundary';
import { createArmorSection, createFractureMass, createMarineEcho, GRAPHIC_SOLID_FRAGMENT, GRAPHIC_FRACTURE_FRAGMENT } from './GraphicLanguage';

export type Primitive = 'shard' | 'spark' | 'smoke' | 'flame' | 'solid' | 'ghost' | 'decal' | 'front';
const vertex = `
attribute float abilityAlpha;attribute float abilityPhase;
varying float alpha;varying float phase;varying vec3 ink;varying vec2 uvLocal;varying vec4 screenPosition;varying vec3 facetNormal;varying float worldHeight;varying float viewDepth;
void main(){alpha=abilityAlpha;phase=abilityPhase;ink=instanceColor;uvLocal=uv;facetNormal=normalize(normalMatrix*mat3(instanceMatrix)*normal);
vec3 posedPosition=position;/* ability shape */
viewDepth=-(modelViewMatrix*instanceMatrix*vec4(posedPosition,1.)).z;worldHeight=(modelMatrix*instanceMatrix*vec4(posedPosition,1.)).y;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(posedPosition,1.);screenPosition=gl_Position;}`;

/** Fixed GPU inventory: shared mipmapped authored flipbooks and textured constructs. */
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
  readonly atlas: EffectAtlas;
  private readonly ownsAtlas: boolean;
  private readonly priority: T.InstancedBufferAttribute;
  private readonly priorityRange = { start: 0, count: 0 };
  priorityWeight = 0;
  private view?: T.Vector3;
  private camera?: T.Camera;
  private coverage = 0;
  private softDepthDemand = false;
  /** Only accepted authored volume variants require a detached depth snapshot. */
  get needsSoftDepth():boolean { return this.softDepthDemand; }
  /** Sum of projected card rectangle estimates, including hidden overlap: a bounded fill cap. */
  maxCoverage = .42;


  setView(camera: T.Camera): void {
    this.view = camera.position;
    this.camera = camera;
  }

  constructor(root: T.Object3D, readonly kind: Primitive, readonly capacity: number, atlas?: EffectAtlas) {
    this.atlas = atlas ?? new EffectAtlas();
    this.ownsAtlas = !atlas;
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

    const fragment = `
${kind === 'flame' ? '#define FOOT_FIRE_COVER (phase>=164. && phase<200.)' : kind === 'spark' ? '#define FOOT_FIRE_COVER (phase>=1000.)' : ''}
uniform float abilityTime;uniform float flash;uniform float atlasAvailable;
uniform sampler2D softDepth;uniform vec4 softCamera;
${EFFECT_ATLAS_GLSL}
varying float alpha;varying float phase;varying vec3 ink;varying vec2 uvLocal;varying vec4 screenPosition;varying vec3 facetNormal;varying float worldHeight;varying float viewDepth;
float abilityHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
float abilityNoise(vec2 p){vec2 b=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(abilityHash(b),abilityHash(b+vec2(1.,0.)),f.x),mix(abilityHash(b+vec2(0.,1.)),abilityHash(b+vec2(1.)),f.x),f.y);}
void main(){
 vec2 p=uvLocal*2.-1.;float a=alpha*atlasAvailable;vec3 c=ink;
${kind === 'smoke' ? `
 vec4 s=effectGraphicSequence(64.,64.,18.,phase,uvLocal);
 s.a=graphicCoverage(s.a);
 float vapor=step(ink.r*1.12,ink.b)*smoothstep(.18,.5,ink.b);
 c=mix(vec3(.018,.022,.028),ink*.76,vapor);
 c=graphicSmoke(s,c);
 a*=s.a*mix(.9,.72,vapor)*smoothstep(.015,.22,worldHeight);
 ` : ''}
${kind === 'flame' ? TEXTURED_FIRE_GLSL : ''}
${kind === 'spark' ? 'float tile=phase>=1000.?floor(phase)-1000.:phase>=200.?floor(phase)-200.:154.;vec4 s=tile==176.?effectSequence(176.,8.,24.,fract(phase)*64.,vec2(.5+(uvLocal.x-.5)*.5,uvLocal.y)):effectTile(tile,uvLocal);a*=s.a;c*=3.5;' : ''}
${kind === 'decal' ? `
 if(phase>=200.){
  float tile=floor(phase)-(phase>=1000.?1000.:phase>=600.?600.:200.);
  vec4 stamp;
  if(tile>=168.&&tile<176.)stamp=effectSequence(168.,8.,16.,fract(phase)*64.,uvLocal);
  else if(tile>=176.&&tile<184.)stamp=effectSequence(176.,8.,24.,fract(phase)*64.,uvLocal);
  else if(tile==164.){
   stamp=effectTile(tile,fract(uvLocal+vec2(abilityTime*.31,-abilityTime*.57)));
   stamp.a*=smoothstep(0.,.08,uvLocal.x)*smoothstep(0.,.08,1.-uvLocal.x)*smoothstep(0.,.08,uvLocal.y)*smoothstep(0.,.08,1.-uvLocal.y);
  }else stamp=effectTile(tile,tile==162.?fract(uvLocal*vec2(3.,1.)):uvLocal);
  c=ink*(.55+stamp.r*.65);a*=stamp.a;
  // The time ripple is a broken light field, not a square pasted onto the deck.
  if(tile==161.)a*=1.-smoothstep(.62,1.,length(p));
  if(phase<600.)a*=smoothstep(.015,.20,worldHeight);
  if(tile==162.||tile==163.){
   float scan=.65+.35*sin(uvLocal.y*38.-abilityTime*7.);
   c=ink*(1.1+stamp.r*1.8);a*=scan;
   // Fixed field normals face the aim/danger side; friendly rear face is brighter.
   if(phase>=600.&&phase<1000.){c*=gl_FrontFacing?.52:1.25;a*=gl_FrontFacing?.7:1.;}
  }
 }else{

 float d=length(p);float a0=atan(p.y,p.x);float variant=floor(phase+.01);
 // Soot fans and fracture discs reject empty coverage before the expensive paths.
 if(variant<.5&&d>1.)discard;
 if(variant>2.5&&variant<3.5&&(d>1.||abs(a0)>fract(phase)*6.283185))discard;
 float n=effectTile(161.,uvLocal).a;
 // Ground breakup is authored offline; no seven-split procedural fragment loop.
 float cracks=effectTile(158.,uvLocal).a;
 float lip=effectTile(158.,clamp(uvLocal+vec2(.008,0.),0.,1.)).a*.45;
 if(variant<.5){if(d>1.)discard;a*=max(cracks*.8,lip*.35);c=mix(vec3(.006,.009,.012),vec3(.095,.085,.062),lip*.55);}
 else if(variant<1.5){
  if(d>1.)discard;
  a*=effectTile(156.,uvLocal).a*(1.-smoothstep(.82,1.,d))*.55;c*=.85;

 }
 else if(variant<2.5){float edge=abs(p.y);float slag=pow(max(0.,1.-abs(p.y+sin(p.x*31.)*.12)*4.),3.)*(.4+n*.6);a*=(1.-smoothstep(.7,1.,abs(p.x)))*(1.-smoothstep(.5,1.,edge))*(.5+n*.4);c=mix(ink,vec3(2.8,.5,.015),slag*fract(phase)*10.*flash);}
 else if(variant<3.5){if(d>1.)discard;float cone=step(abs(a0),fract(phase)*6.283185);a*=cone*(1.-smoothstep(.72+sin(a0*23.)*.05,.96,d))*(.14+cracks*.12);}
 else if(variant<4.5){if(d>1.)discard;float star=pow(1.-abs(sin(a0*5.+floor(d*11.)*.18)),22.);a*=(star*.85+(.2+n*.2)*(1.-smoothstep(.1,.5,d)))*(1.-smoothstep(.8,1.,d));}
 else if(variant<5.5){if(d>1.)discard;a*=(.14+n*.16)*(1.-smoothstep(.65,1.,d));}
 else if(variant==15.){
  float along=uvLocal.x;
  float edge=abs(p.y+sin(p.x*6.)*.09);
  a*=smoothstep(.01,.82,along)*(1.-smoothstep(.82,1.,along))
    *(1.-smoothstep(.16,.46+.36*along,edge))*(.48+.5*n);
 }
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
  vec4 cloud=effectSequence(168.,8.,16.,fract(phase)*64.,uvLocal);
  c=ink*(.62+cloud.r*.42);a*=cloud.a;

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
  float flow=.15+effectTile(161.,fract(uvLocal+vec2(abilityTime*.025,-abilityTime*.018))).a*.75;
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
 }
 ` : ''}
${kind === 'front' ? `
 vec4 waveTexture=effectSequence(168.,8.,16.,phase*7.,vec2(fract(uvLocal.x*8.),uvLocal.y));
 a*=.28+waveTexture.a*.72;
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
${kind === 'shard' ? `
 // Manufactured steel owns variants30/31 even when its cool palette is blue.
 float cold=phase>=30.&&phase<32.?0.:step(ink.r*1.1,ink.b);
 vec4 crystal=effectTile(157.,uvLocal);
 c*=mix(1.,.5+crystal.r*1.1,cold);
 c+=ink*pow(crystal.r,4.)*.42*cold;
 ` : ''}
${kind === 'ghost' ? 'c*=1.05; a*=.42+.36*smoothstep(.72,.96,sin(worldHeight*32.-abilityTime*5.));' : ''}
 vec2 screen=screenPosition.xy/max(.001,screenPosition.w)*.5+.5;
 ${kind === 'flame' || kind === 'smoke' ? `
 // All remaining alpha factors are <=1; these texels cannot survive the existing final cutoff.
 if(a<.004)discard;
 if(softCamera.w>.5&&phase>=64.){
  float d=texture2D(softDepth,screen).r;
  float sceneDistance=softCamera.z>.5?softCamera.x*softCamera.y/(softCamera.y-(softCamera.y-softCamera.x)*d):mix(softCamera.x,softCamera.y,d);
  a*=smoothstep(0.,.28,sceneDistance-viewDepth);
 }
 ` : ''}
 float actionBar=(1.-smoothstep(.14,.23,screen.y))*(1.-smoothstep(.27,.36,abs(screen.x-.5)));
 a*=1.-actionBar*.94;
 ${kind === 'flame' ? `#ifdef HAS_ABILITY_PRIORITY_MASK
 a=min(a,1.-.4*prioritySample.r);
 #endif` : ''}

 if(a<.004)discard;gl_FragColor=vec4(c,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 ${kind !== 'spark' ? 'gl_FragColor.rgb*=gl_FragColor.a;' : ''}
}`;
    const material = new T.ShaderMaterial({
      uniforms: { atlasAvailable: { value: typeof document === 'undefined' ? 1 : 0 }, softDepth: { value: this.atlas.texture }, softCamera: { value: new T.Vector4(.1, 100, 1, 0) }, abilityTime: { value: 0 }, map: { value: this.atlas.texture }, flash: { value: 1 } },
      vertexShader: vertex.replace('/* ability shape */', kind === 'shard' ? 'if(abilityPhase>.5){float seed=abilityPhase;if(seed>1.&&seed<10.&&position.y>0.)posedPosition.y*=.84+.16*sin(seed+position.x*2.1+position.z*3.7);if(seed>20.&&seed<30.)posedPosition.xz*=mix(1.,.18,max(0.,position.y));posedPosition.xz*=.91+.08*sin(seed*3.7+position.y*2.1);posedPosition.xz+=max(0.,position.y)*vec2(sin(seed)*.12,cos(seed*1.7)*.1);posedPosition.xz=clamp(posedPosition.xz,vec2(-1.),vec2(1.));}' : kind === 'front' ? 'if(abilityPhase>1.5){float a=atan(position.z,position.x);posedPosition.xz*=.88+.07*sin(a*7.)+.035*sin(a*3.+.4);posedPosition.y*=.74+.24*sin(a*5.+.7);}' : ''),
      fragmentShader: fragment,
      transparent: true,
      premultipliedAlpha: kind !== 'spark',
      depthWrite: false,
      // Flat cards have no back/front sorting benefit; render both faces in one submission.
      forceSinglePass: kind !== 'solid' && kind !== 'shard',
      // Closed graphic constructs show their outer shell; hidden rear faces add only overdraw.
      side: kind === 'solid' || kind === 'shard' ? T.FrontSide : T.DoubleSide,
      blending: kind === 'flame' || kind === 'shard' || kind === 'smoke' || kind === 'decal' || kind === 'solid' || kind === 'ghost' || kind === 'front'
        ? T.NormalBlending : T.AdditiveBlending,
    });
    this.mesh = new T.InstancedMesh(geometry, material, capacity);
    this.mesh.onBeforeRender = () => { material.uniforms.atlasAvailable.value = this.atlas.loaded || typeof document === 'undefined' ? 1 : 0; };
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

  /** Only bind a detached opaque-depth snapshot, never the active render target. */
  setSoftDepth(texture: T.Texture | null, near = .1, far = 100, perspective = true): void {
    const uniforms = (this.mesh.material as T.ShaderMaterial).uniforms;
    uniforms.softDepth.value = texture ?? this.atlas.texture;
    (uniforms.softCamera.value as T.Vector4).set(near, far, perspective ? 1 : 0, texture ? 1 : 0);
  }

  begin(time = 0): void {
    this.mesh.count = 0;
    this.coverage = 0;
    this.softDepthDemand = false;
    this.mesh.visible = false;
    (this.mesh.material as T.ShaderMaterial).uniforms.abilityTime.value = time;
  }

  draw(x: number, y: number, z: number, sx: number, sy: number, sz: number,
    color: number, opacity = 1, rotationY = 0, rotationZ = 0, variant = 0): void {
    const i = this.mesh.count;
    if (i >= this.capacity || opacity <= 0) return;
    const fireFan = this.kind === 'flame' && variant >= FIRE_FAN_PHASE;
    if (this.camera && this.camera.matrixWorld.elements[12] === this.camera.position.x && this.camera.matrixWorld.elements[13] === this.camera.position.y && this.camera.matrixWorld.elements[14] === this.camera.position.z && (this.kind === 'flame' || this.kind === 'smoke' || this.kind === 'decal' && (variant >= 12 && variant < 13 || variant >= 200 && variant < 600))) {
      const view = this.camera.matrixWorldInverse.elements, projection = this.camera.projectionMatrix.elements;
      const depth = Math.max(.1, -(view[2] * x + view[6] * y + view[10] * z + view[14]));
      const perspective = projection[15] === 0;
      // The sector occupies halfArc / (2 sin(halfArc)) of its bounding rectangle.
      const coverageFraction = fireFan ? (variant - FIRE_FAN_PHASE) / (2 * Math.sin(variant - FIRE_FAN_PHASE)) : 1;
      const area = coverageFraction * Math.abs(sx * sy * projection[0] * projection[5]) / (perspective ? depth * depth : 1);
      if (this.coverage + area > this.maxCoverage) return;
      this.coverage += area;
    }
    const groundLight = this.kind === 'spark' && variant >= 1000;
    const billboardDecal = this.kind === 'decal' && (variant >= 11 && variant < 13 || variant >= 200 && variant < 600);
    const uprightDecal = this.kind === 'decal' && variant >= 600 && variant < 1000;
    if (this.view && !fireFan && !groundLight && (billboardDecal || this.kind === 'smoke' || this.kind === 'spark' || this.kind === 'flame')) {
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
    if (fireFan) {
      // Local U is across the jet. Local V travels forward at muzzle height.
      matrix[offset] = -s * sx;
      matrix[offset + 1] = 0;
      matrix[offset + 2] = c * sx;
      matrix[offset + 4] = c * sy;
      matrix[offset + 5] = 0;
      matrix[offset + 6] = s * sy;
      matrix[offset + 8] = 0;
      matrix[offset + 9] = sz;
      matrix[offset + 10] = 0;
    } else if (groundLight || this.kind === 'decal' && !billboardDecal && !uprightDecal) {
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
    // Vapor and light use spherical billboards. Yaw-only cards collapse into
    // floor-like ribbons under the steep gameplay camera; fire remains upright.
    // Keep the foot of a small fuel flame planted as its card faces the camera.
    const poolFlame = this.kind === 'flame' && variant >= POOL_FLAME_PHASE && variant < 200;
    if (this.camera && !groundLight && (poolFlame || billboardDecal || this.kind === 'smoke' || this.kind === 'spark')) {
      const cameraBasis = this.camera.matrixWorld.elements;
      if (poolFlame) {
        x += cameraBasis[4] * sy;
        y += (cameraBasis[5] - 1) * sy;
        z += cameraBasis[6] * sy;
      }
      for (let axis = 0; axis < 3; axis++) {
        matrix[offset + axis] = (cameraBasis[axis] * a + cameraBasis[4 + axis] * b) * sx;
        matrix[offset + 4 + axis] = (-cameraBasis[axis] * b + cameraBasis[4 + axis] * a) * sy;
        matrix[offset + 8 + axis] = cameraBasis[8 + axis] * sz;
      }
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
    this.phase.setX(i, this.kind === 'decal' || this.kind === 'shard' || this.kind === 'front' || ((this.kind === 'flame' || this.kind === 'smoke') && variant >= 64 || this.kind === 'spark' && variant >= 200) ? variant : Math.abs(x * 13.7 + z * 19.3 + y * 7.1) % 64);
    this.mesh.count++;
    if((this.kind==='flame'||this.kind==='smoke')&&variant>=64)this.softDepthDemand=true;
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
    this.softDepthDemand=false;
    this.mesh.geometry.dispose();
    (this.mesh.material as T.Material).dispose();
    if (this.ownsAtlas) this.atlas.dispose();
    this.mesh.removeFromParent();
  }
}
