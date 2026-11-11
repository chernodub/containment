import * as T from 'three';

const vertex = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>
varying vec3 vBeaconNormal;
varying vec3 vBeaconView;
void main(){
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  vec4 view=modelViewMatrix*vec4(transformed,1.0);
  vBeaconNormal=transformedNormal;
  vBeaconView=-view.xyz;
  gl_Position=projectionMatrix*view;
}`;
const fragment = /* glsl */ `
varying vec3 vBeaconNormal;
varying vec3 vBeaconView;
uniform float strength;
void main(){
  float rim=pow(max(0.0,1.0-abs(dot(normalize(vBeaconNormal),normalize(vBeaconView)))),2.5);
  if(rim<.28)discard;
  gl_FragColor=vec4(.45,.86,1.0,rim*strength);
  #include <colorspace_fragment>
}`;

/** A quiet suit locator and borrowed-skin silhouette keep the marine findable in a crowd. */
export class PlayerBeacon {
  readonly root = new T.Group();
  private readonly material = new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{strength:{value:.06}},transparent:true,depthTest:false,depthWrite:false,toneMapped:false,blending:T.AdditiveBlending});
  private readonly skins: Array<{source:T.SkinnedMesh;overlay:T.SkinnedMesh}> = [];
  private readonly ring = new T.Mesh(new T.RingGeometry(.52,.545,48),new T.MeshBasicMaterial({color:0x9fe8ff,transparent:true,opacity:.28,depthTest:false,depthWrite:false,toneMapped:false,side:T.DoubleSide}));
  private readonly direction = new T.Mesh(new T.ConeGeometry(.10,.23,3),new T.MeshBasicMaterial({color:0xe8fbff,transparent:true,opacity:.75,depthTest:false,depthWrite:false,toneMapped:false}));
  private disposed = false;

  constructor(player:T.Object3D,scene?:T.Scene){
    this.root.name='marine-readability-beacon';this.root.renderOrder=1200;
    player.traverse(object=>{
      if(!(object instanceof T.SkinnedMesh))return;
      const overlay=new T.SkinnedMesh(object.geometry,this.material);
      overlay.bind(object.skeleton,object.bindMatrix);
      overlay.bindMatrixInverse.copy(object.bindMatrixInverse);
      overlay.matrixAutoUpdate=false;overlay.frustumCulled=false;overlay.renderOrder=1200;
      this.skins.push({source:object,overlay});this.root.add(overlay);
    });
    this.ring.rotation.x=-Math.PI/2;this.ring.renderOrder=1199;
    this.direction.renderOrder=1201;
    this.root.add(this.ring,this.direction);scene?.add(this.root);
  }

  /** Existing geometry/skeletons are borrowed; no extra actor animation or buffers are created. */
  update(player:T.Object3D,angle:number,hidden=false,crowding=0){
    this.root.visible=!hidden&&!this.disposed;if(!this.root.visible)return;
    this.material.uniforms.strength.value=.06+.30*Math.min(1,Math.max(0,crowding));
    player.updateWorldMatrix(true,true);
    for(const pair of this.skins){pair.overlay.matrix.copy(pair.source.matrixWorld);pair.overlay.visible=pair.source.visible;}
    this.ring.position.set(player.position.x,.055,player.position.z);
    this.direction.position.set(player.position.x+Math.cos(angle)*.78,.08,player.position.z+Math.sin(angle)*.78);
    this.direction.rotation.set(Math.PI/2,0,angle-Math.PI/2);
  }

  dispose(){
    if(this.disposed)return;this.disposed=true;
    // The actor pool owns the borrowed skin geometry and skeletons.
    this.material.dispose();this.ring.geometry.dispose();this.ring.material.dispose();this.direction.geometry.dispose();this.direction.material.dispose();
    this.root.clear();this.root.removeFromParent();this.skins.length=0;
  }
}
