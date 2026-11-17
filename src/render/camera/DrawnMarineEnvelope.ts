import * as T from 'three';

const BANDS=160,STEP=.05,STRIDE=6;

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
  count=0;
  private readonly visit=(object:T.Object3D)=>{
    if(!(object instanceof T.Mesh)||!object.geometry.attributes.position)return;
    if(object instanceof T.SkinnedMesh)object.skeleton.update();
    for(let i=0;i<object.geometry.attributes.position.count;i++){
      object.getVertexPosition(i,this.vertex);this.vertex.applyMatrix4(object.matrixWorld);
      this.addPoint();
    }
  };
  private addPoint():void {
    this.vertex.sub(this.origin).applyQuaternion(this.inverse);
    const p=this.vertex,n=Math.max(0,Math.min(BANDS-1,Math.floor((p.z+4)/STEP)))*STRIDE;
    this.bins[n]=Math.min(this.bins[n],p.x);this.bins[n+1]=Math.max(this.bins[n+1],p.x);
    this.bins[n+2]=Math.min(this.bins[n+2],p.y);this.bins[n+3]=Math.max(this.bins[n+3],p.y);
    this.bins[n+4]=Math.min(this.bins[n+4],p.z);this.bins[n+5]=Math.max(this.bins[n+5],p.z);
  }
  capture(root:T.Object3D,camera:T.Camera):void {
    for(let n=0;n<this.bins.length;n+=2){this.bins[n]=Infinity;this.bins[n+1]=-Infinity;}
    // Attached skinning updates its bind inverse only through this override.
    root.updateWorldMatrix(true,false);root.updateMatrixWorld(true);
    this.origin.setFromMatrixPosition(root.matrixWorld);camera.getWorldQuaternion(this.rotation);this.inverse.copy(this.rotation).invert();
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
