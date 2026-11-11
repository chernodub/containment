import * as T from 'three';
export type Primitive = 'shard' | 'spark' | 'smoke' | 'flame' | 'solid' | 'ghost' | 'decal';
const vertex = `attribute float abilityAlpha;varying float alpha;varying vec3 ink;varying vec2 p;
void main(){alpha=abilityAlpha;ink=instanceColor;p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`;
/** Fixed GPU inventory; every primitive has its own single instanced draw. */
export class InstanceBatch {
  readonly mesh: T.InstancedMesh;
  private dummy = new T.Object3D();
  private color = new T.Color();
  private alpha: T.InstancedBufferAttribute;
  private view?: T.Vector3;
  setView(camera:T.Camera):void {this.view=camera.position;}
  constructor(root: T.Object3D, readonly kind: Primitive, readonly capacity: number) {
    const geometry = kind === 'shard' ? new T.OctahedronGeometry(1, 0) : kind === 'solid' || kind === 'ghost' ? new T.BoxGeometry(1, 1, 1) : new T.PlaneGeometry(2, 2);
    this.alpha = new T.InstancedBufferAttribute(new Float32Array(capacity), 1).setUsage(T.DynamicDrawUsage);
    geometry.setAttribute('abilityAlpha', this.alpha);
    const soft = kind === 'smoke' || kind === 'flame' || kind === 'spark';
    const fragment = `varying float alpha;varying vec3 ink;varying vec2 p;
void main(){float a=alpha;vec3 c=ink;
${soft ? 'float d=dot(p,p);if(d>1.)discard;a*=pow(1.-d,1.6);' : ''}
${kind === 'flame' ? 'a*=smoothstep(1.,-.8,p.y);c=mix(c,vec3(2.4,1.3,.28),pow(max(0.,1.-length(p+vec2(0.,.3))),3.)*.55);' : ''}
${kind === 'decal' ? 'float d=length(p);if(d>1.)discard;float a0=atan(p.y,p.x);float n=fract(sin(dot(floor(p*31.),vec2(127.1,311.7)))*43758.5);float cracks=pow(1.-abs(sin(a0*11.+floor(d*9.)*.14)),56.)*step(.24,n)*(1.-smoothstep(.7,1.,d));a*=max(cracks*.48,(1.-smoothstep(.65,1.,d))*(.05+n*.08));' : ''}
${kind === 'shard' || kind === 'solid' ? 'c*=.7+gl_FragCoord.y*.00008;' : ''}
if(a<.003)discard;gl_FragColor=vec4(c,a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
    const material = new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,side:T.DoubleSide,
      blending:kind==='smoke'||kind==='decal'||kind==='solid'||kind==='ghost'?T.NormalBlending:T.AdditiveBlending});
    this.mesh = new T.InstancedMesh(geometry,material,capacity);
    this.mesh.name = `ability-${kind}-batch`;this.mesh.frustumCulled=false;this.mesh.setColorAt(0,new T.Color());
    this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.mesh.count=0;root.add(this.mesh);
  }
  begin():void {this.mesh.count=0;}
  draw(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,opacity=1,rotationY=0,rotationZ=0):void {
    const i=this.mesh.count;if(i>=this.capacity||opacity<=0)return;
    if(this.view&&(this.kind==='smoke'||this.kind==='spark'||this.kind==='flame'))rotationY=Math.atan2(this.view.x-x,this.view.z-z);
    this.dummy.position.set(x,y,z);this.dummy.rotation.set(this.kind==='decal'?-Math.PI/2:0,rotationY,rotationZ);
    this.dummy.scale.set(sx,sy,sz);this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix);
    this.color.setHex(color);this.mesh.setColorAt(i,this.color);this.alpha.setX(i,opacity);this.mesh.count++;
  }
  end():void {this.mesh.instanceMatrix.needsUpdate=true;this.mesh.instanceColor!.needsUpdate=true;this.alpha.needsUpdate=true;}
  dispose():void {this.mesh.geometry.dispose();(this.mesh.material as T.Material).dispose();this.mesh.removeFromParent();}
}
