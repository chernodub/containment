import * as T from 'three';

export type Primitive = 'shard' | 'spark' | 'smoke' | 'flame' | 'solid' | 'ghost' | 'decal';
const vertex = `
attribute float abilityAlpha;attribute float abilityPhase;
varying float alpha;varying float phase;varying vec3 ink;varying vec2 uvLocal;varying vec4 screenPosition;
void main(){alpha=abilityAlpha;phase=abilityPhase;ink=instanceColor;uvLocal=uv;
gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);screenPosition=gl_Position;}`;

/** Fixed GPU inventory. Flame/smoke share the game's licensed flipbook assets. */
export class InstanceBatch {
  readonly mesh: T.InstancedMesh;
  private readonly dummy = new T.Object3D();
  private readonly color = new T.Color();
  private readonly alpha: T.InstancedBufferAttribute;
  private readonly phase: T.InstancedBufferAttribute;
  private readonly texture?: T.Texture;
  private view?: T.Vector3;

  setView(camera: T.Camera): void {
    this.view = camera.position;
  }

  constructor(root: T.Object3D, readonly kind: Primitive, readonly capacity: number) {
    const geometry = kind === 'shard' ? new T.OctahedronGeometry(1, 0)
      : kind === 'solid' || kind === 'ghost' ? new T.BoxGeometry(1, 1, 1)
        : new T.PlaneGeometry(2, 2);
    this.alpha = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    this.phase = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    geometry.setAttribute('abilityAlpha', this.alpha);
    geometry.setAttribute('abilityPhase', this.phase);

    const atlas = kind === 'flame' || kind === 'smoke';
    if (atlas) {
      this.texture = typeof document === 'undefined'
        ? new T.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)
        : new T.TextureLoader().load(`${import.meta.env.BASE_URL}assets/vfx/${kind === 'flame' ? 'Flame02' : 'WispySmoke02'}.png`);
      this.texture.colorSpace = kind === 'flame' ? T.SRGBColorSpace : T.NoColorSpace;
      this.texture.minFilter = this.texture.magFilter = T.LinearFilter;
      this.texture.generateMipmaps = false;
    }

    const fragment = `
uniform float abilityTime;uniform sampler2D map;uniform float flash;
varying float alpha;varying float phase;varying vec3 ink;varying vec2 uvLocal;varying vec4 screenPosition;
void main(){
 vec2 p=uvLocal*2.-1.;float a=alpha;vec3 c=ink;
${atlas ? `
 float frame=mod(floor(abilityTime*${kind === 'flame' ? '30.' : '18.'}+phase),64.);
 vec2 grid=vec2(${kind === 'flame' ? '16.,4.' : '8.,8.'});
 vec2 cell=vec2(mod(frame,grid.x),grid.y-1.-floor(frame/grid.x));
 vec2 inset=vec2(.006,.008);vec2 at=(cell+clamp(uvLocal,inset,1.-inset))/grid;
 vec4 s=texture2D(map,at);
 float edge=smoothstep(0.,.07,uvLocal.x)*smoothstep(0.,.07,1.-uvLocal.x)*smoothstep(0.,.07,uvLocal.y)*smoothstep(0.,.07,1.-uvLocal.y);
 a*=s.a*edge;
 ${kind === 'flame' ? `
 float heat=clamp(dot(s.rgb,vec3(.32,.52,.16)),0.,1.);
 // HDR hot core, orange body and deep-red feather: no opaque pale triangles.
 c=mix(vec3(.9,.025,.001),vec3(3.6,.53,.018),smoothstep(.03,.38,heat));
 c=mix(c,vec3(10.,5.2,.95),pow(smoothstep(.48,.94,heat),2.6));
 a*=.78*(.35+.65*flash);
 ` : `float vapor=step(ink.r*1.12,ink.b)*smoothstep(.18,.5,ink.b);c=mix(vec3(.007,.009,.012),ink*.38,vapor);a*=mix(.65,.2,vapor);`}
 ` : ''}
${kind === 'spark' ? 'float d=dot(p,p);if(d>1.)discard;a*=pow(1.-d,2.);c*=3.5;' : ''}
${kind === 'decal' ? `
 float d=length(p);if(d>1.)discard;float a0=atan(p.y,p.x);
 float n=fract(sin(dot(floor(p*31.),vec2(127.1,311.7)))*43758.5);
 float cracks=pow(1.-abs(sin(a0*11.+floor(d*9.)*.14)),56.)*step(.24,n)*(1.-smoothstep(.7,1.,d));
 a*=max(cracks*.48,(1.-smoothstep(.65,1.,d))*(.05+n*.08));` : ''}
${kind === 'shard' || kind === 'solid' ? 'c*=.7+gl_FragCoord.y*.00008;' : ''}
 vec2 screen=screenPosition.xy/max(.001,screenPosition.w)*.5+.5;
 float actionBar=(1.-smoothstep(.14,.23,screen.y))*(1.-smoothstep(.27,.36,abs(screen.x-.5)));
 a*=1.-actionBar*.94;
 if(a<.004)discard;gl_FragColor=vec4(c,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
    const material = new T.ShaderMaterial({
      uniforms: { abilityTime: { value: 0 }, map: { value: this.texture ?? null }, flash: { value: 1 } },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      blending: kind === 'smoke' || kind === 'decal' || kind === 'solid' || kind === 'ghost'
        ? T.NormalBlending : T.AdditiveBlending,
    });
    this.mesh = new T.InstancedMesh(geometry, material, capacity);
    this.mesh.name = `ability-${kind}-batch`;
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
    color: number, opacity = 1, rotationY = 0, rotationZ = 0): void {
    const i = this.mesh.count;
    if (i >= this.capacity || opacity <= 0) return;
    if (this.view && (this.kind === 'smoke' || this.kind === 'spark' || this.kind === 'flame')) {
      rotationY = Math.atan2(this.view.x - x, this.view.z - z);
      // Flame tongues rise vertically; tumbling the card creates paper-like shards.
      if (this.kind === 'flame' || this.kind === 'smoke') rotationZ = 0;
    }
    this.dummy.position.set(x, y, z);
    this.dummy.rotation.set(this.kind === 'decal' ? -Math.PI / 2 : 0, rotationY, rotationZ);
    this.dummy.scale.set(sx, sy, sz);
    this.dummy.updateMatrix();
    this.mesh.setMatrixAt(i, this.dummy.matrix);
    this.color.setHex(color);
    this.mesh.setColorAt(i, this.color);
    this.alpha.setX(i, opacity);
    this.phase.setX(i, Math.abs(x * 13.7 + z * 19.3 + y * 7.1) % 64);
    this.mesh.count++;
  }

  end(): void {
    this.mesh.visible = this.mesh.count > 0;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor!.needsUpdate = true;
    this.alpha.needsUpdate = this.phase.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as T.Material).dispose();
    this.texture?.dispose();
    this.mesh.removeFromParent();
  }
}
