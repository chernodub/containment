import * as T from 'three';
import { FRIENDLY_GROUND_ORDER } from './FriendlyBoundary';

export type Primitive = 'shard' | 'spark' | 'smoke' | 'flame' | 'solid' | 'ghost' | 'decal' | 'front';
const vertex = `
attribute float abilityAlpha;attribute float abilityPhase;attribute float abilityStyle;varying float style;
varying float alpha;varying float phase;varying vec3 ink;varying vec2 uvLocal;varying vec4 screenPosition;varying vec3 facetNormal;
void main(){style=abilityStyle;alpha=abilityAlpha;phase=abilityPhase;ink=instanceColor;uvLocal=uv;facetNormal=normalize(normalMatrix*mat3(instanceMatrix)*normal);
vec3 posedPosition=position;/* ability shape */
gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(posedPosition,1.);screenPosition=gl_Position;}`;

/** Fixed GPU inventory. Flame/smoke share the game's licensed flipbook assets. */
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
  private readonly style: T.InstancedBufferAttribute;
  priorityWeight = 0;
  private view?: T.Vector3;

  setView(camera: T.Camera): void {
    this.view = camera.position;
  }

  constructor(root: T.Object3D, readonly kind: Primitive, readonly capacity: number) {
    const geometry = kind === 'front' ? new T.TorusGeometry(.88, .12, 6, 64).rotateX(-Math.PI / 2)
      : kind === 'shard' ? new T.OctahedronGeometry(1, 0)
      : kind === 'solid' || kind === 'ghost' ? new T.BoxGeometry(1, 1, 1)
        : new T.PlaneGeometry(2, 2);
    this.alpha = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    this.phase = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    this.priority = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    this.style = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    geometry.setAttribute('abilityPriority', this.priority);
    geometry.setAttribute('abilityStyle', this.style);
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
uniform float abilityTime;uniform sampler2D map;uniform float flash;varying float style;
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
${kind === 'flame' ? `
 float t=uvLocal.y;float clock=abilityTime*(1.4+fract(phase)*.6);
 float bend=sin(t*4.8-clock*3.+phase)*(.06+t*.2)+sin(t*9.+phase*2.-clock*2.)*.035*t;
 float taper=pow(max(.001,1.-t),.68);
 float width=(.42+.11*sin(t*7.+phase))*taper;
 float axis=p.x-bend;float distance=abs(axis)/max(.015,width);
 float tongue=(1.-smoothstep(.72,1.,distance))*smoothstep(0.,.09,t)*(1.-smoothstep(.84,1.,t));
 float fork=abs(p.x+sin(t*5.+phase)*.28)/max(.015,taper*.18);
 tongue=max(tongue,(1.-smoothstep(.65,1.,fork))*smoothstep(.32,.45,t)*(1.-smoothstep(.65,.9,t))*.55);
 float core=(1.-smoothstep(.08,.52,distance))*(1.-smoothstep(.15,.72,t));
 c=mix(vec3(1.6,.085,.006),vec3(3.8,.52,.015),smoothstep(.03,.2,tongue));
 c=mix(c,vec3(8.,4.2,.65),core*clamp(.45+ink.g*1.8,.45,1.));
 a*=tongue*.85*(.35+.65*flash);
 ` : ''}
${kind === 'spark' ? 'float d=dot(p,p);if(d>1.)discard;a*=pow(1.-d,2.);c*=3.5;' : ''}
${kind === 'decal' ? `
 float d=length(p);float a0=atan(p.y,p.x);float variant=floor(phase+.01);
 float n=abilityNoise(p*19.);
 float spoke=floor((a0+3.141593)/6.283185*13.);
 float jag=sin(d*39.+spoke*17.)*.025+sin(d*93.+spoke*3.)*.009;
 float ray=abs(sin(a0*6.5+jag/max(.08,d)))*d;
 float fork=abs(sin(a0*6.5+(d-.4)*1.3+jag/max(.08,d)))*d;
 float seam=step(.025,abs(fract((p.x+p.y*.13)*4.)-.5));
 float cracks=max(1.-smoothstep(.002,.006,ray),(1.-smoothstep(.0015,.0045,fork))*smoothstep(.32,.5,d)*.6)*seam*(1.-smoothstep(.82,1.,d));
 if(variant<.5){if(d>1.)discard;a*=cracks*.62;c=mix(vec3(.012,.009,.006),ink,.14);}
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
 else {if(d>1.)discard;if(variant>6.5&&abs(a0)>fract(phase)*6.283185)discard;a*=.035*(1.-smoothstep(.6,1.,d));c=vec3(.014,.009,.006);}
 ` : ''}
${kind === 'front' ? `
 float roll=(.5+.5*sin(uvLocal.x*127.+sin(uvLocal.y*19.+abilityTime*5.)*2.))*(.55+.45*sin(uvLocal.x*43.-uvLocal.y*11.+abilityTime*3.));
 float vapor=smoothstep(.08,.55,roll);float ridge=pow(.5+.5*cos(uvLocal.y*6.283),9.);
 float dusty=(1.-smoothstep(.1,.3,max(ink.r-ink.g,ink.b-ink.r)))*(1.-smoothstep(.35,.7,max(ink.r,max(ink.g,ink.b))));
 a*=vapor*mix(.2+ridge*.65,.6,dusty);c*=mix(1.2+ridge*4.*flash,.65+roll*.4,dusty);
 ` : ''}
${kind === 'shard' || kind === 'solid' ? 'c*=.32+.68*max(0.,dot(normalize(facetNormal),normalize(vec3(-.3,.7,.6))));' : ''}
 vec2 screen=screenPosition.xy/max(.001,screenPosition.w)*.5+.5;
 float actionBar=(1.-smoothstep(.14,.23,screen.y))*(1.-smoothstep(.27,.36,abs(screen.x-.5)));
 a*=1.-actionBar*.94;
 if(a<.004)discard;gl_FragColor=vec4(c,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
    const material = new T.ShaderMaterial({
      uniforms: { abilityTime: { value: 0 }, map: { value: this.texture ?? null }, flash: { value: 1 } },
      vertexShader: vertex.replace('/* ability shape */', kind === 'shard' ? 'if(abilityPhase>.5){posedPosition.y=position.y>.5?1.:-1.;if(position.y>.5)posedPosition.xz+=vec2(.23,-.16);}' : ''),
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      blending: kind === 'shard' || kind === 'smoke' || kind === 'decal' || kind === 'solid' || kind === 'ghost' || kind === 'front'
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
    if (this.view && (this.kind === 'smoke' || this.kind === 'spark' || this.kind === 'flame')) {
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
    if (this.kind === 'decal') {
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
    this.style.setX(i, variant);
    this.phase.setX(i, this.kind === 'decal' || this.kind === 'shard' ? variant : Math.abs(x * 13.7 + z * 19.3 + y * 7.1) % 64);
    this.mesh.count++;
  }

  end(): void {
    this.mesh.visible = this.mesh.count > 0;
    if (!this.mesh.count) return;
    this.upload(this.mesh.instanceMatrix, this.matrixRange, this.mesh.count * 16);
    this.upload(this.mesh.instanceColor!, this.colorRange, this.mesh.count * 3);
    this.upload(this.alpha, this.alphaRange, this.mesh.count);
    this.upload(this.phase, this.phaseRange, this.mesh.count);
    this.priority.needsUpdate = this.style.needsUpdate = true;
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
