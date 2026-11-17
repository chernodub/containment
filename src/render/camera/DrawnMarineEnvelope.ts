import * as T from 'three';

const BANDS=160,STEP=.05,STRIDE=6;

type SkinCache={
  geometry:T.BufferGeometry;position:T.BufferAttribute;
  joints:T.BufferAttribute;weights:T.BufferAttribute;
  positionVersion:number;jointsVersion:number;weightsVersion:number;bindMatrix:T.Matrix4;
  bound:Float64Array;indices:Uint16Array;influences:Float64Array;weightSums:Float64Array;
};

/** Current deformed pose, sampled after ability/socket posing. Presentation only.
 * Fine camera-depth slices bound the projected silhouette without the unused
 * diagonals of a world-height box. Their convex hull contains every triangle. */
export class DrawnMarineEnvelope {
  private readonly bins=new Float64Array(BANDS*STRIDE);
  private readonly points=new Float64Array(BANDS*8*3);
  private readonly vertex=new T.Vector3();
  private readonly origin=new T.Vector3();
  private readonly rotation=new T.Quaternion();
  private readonly inverse=new T.Quaternion();
  private readonly cameraFromWorld=new T.Matrix4();
  private readonly skinPost=new T.Matrix4();
  private readonly boneTransform=new T.Matrix4();
  private readonly projectedBone=new T.Matrix4();
  private readonly skinCaches=new WeakMap<T.SkinnedMesh,SkinCache>();
  private projectedBones=new Float64Array(0);
  count=0;
  private readonly visit=(object:T.Object3D)=>{
    if(!(object instanceof T.Mesh)||!object.geometry.attributes.position)return;
    if(object instanceof T.SkinnedMesh){if(this.captureSkin(object))return;object.skeleton.update();}
    for(let i=0;i<object.geometry.attributes.position.count;i++){
      object.getVertexPosition(i,this.vertex);this.vertex.applyMatrix4(object.matrixWorld);
      this.addPoint();
    }
  };
  /** The ordinary Three skin path multiplies four bone matrices for every vertex.
   * Cache immutable bind positions and compose each bone into camera space once
   * per pose; every authored vertex still contributes to the same depth bins. */
  private captureSkin(mesh:T.SkinnedMesh):boolean {
    if(mesh.getVertexPosition!==T.SkinnedMesh.prototype.getVertexPosition||mesh.morphTargetInfluences?.length)return false;
    const geometry=mesh.geometry,position=geometry.getAttribute('position'),joints=geometry.getAttribute('skinIndex'),weights=geometry.getAttribute('skinWeight');
    if(!(position instanceof T.BufferAttribute)||!(joints instanceof T.BufferAttribute)||!(weights instanceof T.BufferAttribute)||
      position.itemSize!==3||joints.itemSize!==4||weights.itemSize!==4||position.count!==joints.count||position.count!==weights.count)return false;
    let cache=this.skinCaches.get(mesh);
    if(!cache||cache.geometry!==geometry||cache.position!==position||cache.joints!==joints||cache.weights!==weights||
      cache.positionVersion!==position.version||cache.jointsVersion!==joints.version||cache.weightsVersion!==weights.version||!cache.bindMatrix.equals(mesh.bindMatrix)){
      const bound=new Float64Array(position.count*3),indices=new Uint16Array(position.count*4),influences=new Float64Array(position.count*4),weightSums=new Float64Array(position.count);
      for(let i=0;i<position.count;i++){
        this.vertex.fromBufferAttribute(position,i).applyMatrix4(mesh.bindMatrix);
        const p=i*3,w=i*4;bound[p]=this.vertex.x;bound[p+1]=this.vertex.y;bound[p+2]=this.vertex.z;
        let total=0;
        for(let j=0;j<4;j++){
          const bone=joints.getComponent(i,j),weight=weights.getComponent(i,j);
          if(bone<0||bone>=mesh.skeleton.bones.length||bone>65535)return false;
          indices[w+j]=bone;influences[w+j]=weight;total+=weight;
        }
        weightSums[i]=total;
      }
      cache={geometry,position,joints,weights,positionVersion:position.version,jointsVersion:joints.version,weightsVersion:weights.version,bindMatrix:mesh.bindMatrix.clone(),bound,indices,influences,weightSums};
      this.skinCaches.set(mesh,cache);
    }
    const bones=mesh.skeleton.bones,inverses=mesh.skeleton.boneInverses;
    if(this.projectedBones.length<bones.length*12)this.projectedBones=new Float64Array(bones.length*12);
    this.skinPost.multiplyMatrices(this.cameraFromWorld,mesh.matrixWorld).multiply(mesh.bindMatrixInverse);
    const post=this.skinPost.elements;
    for(let i=0;i<bones.length;i++){
      this.boneTransform.multiplyMatrices(bones[i].matrixWorld,inverses[i]);
      this.projectedBone.multiplyMatrices(this.skinPost,this.boneTransform);
      const source=this.projectedBone.elements,offset=i*12;
      this.projectedBones[offset]=source[0];this.projectedBones[offset+1]=source[4];this.projectedBones[offset+2]=source[8];this.projectedBones[offset+3]=source[12];
      this.projectedBones[offset+4]=source[1];this.projectedBones[offset+5]=source[5];this.projectedBones[offset+6]=source[9];this.projectedBones[offset+7]=source[13];
      this.projectedBones[offset+8]=source[2];this.projectedBones[offset+9]=source[6];this.projectedBones[offset+10]=source[10];this.projectedBones[offset+11]=source[14];
    }
    const {bound,indices,influences,weightSums}=cache,transforms=this.projectedBones;
    for(let i=0;i<position.count;i++){
      const p=i*3,w=i*4,x=bound[p],y=bound[p+1],z=bound[p+2];
      // Three applies bindMatrixInverse/world/camera after the weighted sum.
      // Retain its fixed translation even when source weights do not sum to one.
      let px=(1-weightSums[i])*post[12],py=(1-weightSums[i])*post[13],pz=(1-weightSums[i])*post[14];
      for(let j=0;j<4;j++){
        const weight=influences[w+j];if(weight===0)continue;
        const m=indices[w+j]*12;
        px+=weight*(transforms[m]*x+transforms[m+1]*y+transforms[m+2]*z+transforms[m+3]);
        py+=weight*(transforms[m+4]*x+transforms[m+5]*y+transforms[m+6]*z+transforms[m+7]);
        pz+=weight*(transforms[m+8]*x+transforms[m+9]*y+transforms[m+10]*z+transforms[m+11]);
      }
      this.addCoordinates(px,py,pz);
    }
    return true;
  }
  private addPoint():void {
    this.vertex.sub(this.origin).applyQuaternion(this.inverse);
    this.addCoordinates(this.vertex.x,this.vertex.y,this.vertex.z);
  }
  private addCoordinates(x:number,y:number,z:number):void {
    const n=Math.max(0,Math.min(BANDS-1,Math.floor((z+4)/STEP)))*STRIDE;
    this.bins[n]=Math.min(this.bins[n],x);this.bins[n+1]=Math.max(this.bins[n+1],x);
    this.bins[n+2]=Math.min(this.bins[n+2],y);this.bins[n+3]=Math.max(this.bins[n+3],y);
    this.bins[n+4]=Math.min(this.bins[n+4],z);this.bins[n+5]=Math.max(this.bins[n+5],z);
  }
  capture(root:T.Object3D,camera:T.Camera):void {
    for(let n=0;n<this.bins.length;n+=2){this.bins[n]=Infinity;this.bins[n+1]=-Infinity;}
    // Attached skinning updates its bind inverse only through this override.
    root.updateWorldMatrix(true,false);root.updateMatrixWorld(true);
    this.origin.setFromMatrixPosition(root.matrixWorld);camera.getWorldQuaternion(this.rotation);this.inverse.copy(this.rotation).invert();
    this.cameraFromWorld.makeRotationFromQuaternion(this.inverse);
    const e=this.cameraFromWorld.elements,x=this.origin.x,y=this.origin.y,z=this.origin.z;
    e[12]=-e[0]*x-e[4]*y-e[8]*z;e[13]=-e[1]*x-e[5]*y-e[9]*z;e[14]=-e[2]*x-e[6]*y-e[10]*z;
    root.traverseVisible(this.visit);
    // The native locator/feet anchor remains safe even when casts lift the boots.
    for(let n=0;n<32;n++){const angle=n*Math.PI/16,radius=.66/Math.cos(Math.PI/32);this.vertex.set(this.origin.x+Math.cos(angle)*radius,.028,this.origin.z+Math.sin(angle)*radius);this.addPoint();}
    this.count=0;
    for(let n=0;n<this.bins.length;n+=STRIDE){if(!Number.isFinite(this.bins[n]))continue;
      for(let corner=0;corner<8;corner++){
        this.vertex.set(this.bins[n+(corner&1?1:0)],this.bins[n+(corner&2?3:2)],this.bins[n+(corner&4?5:4)]).applyQuaternion(this.rotation).add(this.origin);
        const p=this.count++*3;this.points[p]=this.vertex.x;this.points[p+1]=this.vertex.y;this.points[p+2]=this.vertex.z;
      }
    }
  }
  point(out:T.Vector3,index:number):void {const n=index*3;out.set(this.points[n],this.points[n+1],this.points[n+2]);}
}
