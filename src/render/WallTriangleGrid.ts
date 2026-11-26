import * as T from 'three';

type Entry={mesh:T.Mesh;matrix:T.Matrix4;geometry:T.BufferGeometry;order:number;active:boolean};
type Bin={entry:Entry;query:T.Mesh;faces:number[]};
const CELL=2, EDGE=1e-7;
const key=(x:number,z:number)=>`${x},${z}`;
const visible=(object:T.Object3D)=>{for(let o:T.Object3D|null=object;o;o=o.parent)if(!o.visible)return false;return true;};

/** Short horizontal probes over room geometry. Query meshes borrow original
 * attributes and use Three's native side, winding, hit normal and distance rules. */
export class WallTriangleGrid {
 private readonly entries=new Map<T.Object3D,Entry>();
 private readonly cells=new Map<string,Bin[]>();
 private readonly fallback:T.Object3D[]=[];
 private readonly order=new Map<T.Object3D,number>();
 private readonly end=new T.Vector3();
 private world?:T.Object3D;

 prepare(world:T.Object3D){
  this.clear();this.world=world;
  world.updateWorldMatrix(true,true);
  const point=new T.Vector3(),local=new T.Vector3(),bounds=new T.Box3();
  world.traverse(object=>{
   const order=this.order.size;this.order.set(object,order);
   if(object.raycast===T.Object3D.prototype.raycast)return;
   if(Object.getPrototypeOf(object)!==T.Mesh.prototype||object.raycast!==T.Mesh.prototype.raycast){this.fallback.push(object);return;}
   const mesh=object as T.Mesh,geometry=mesh.geometry,position=geometry.getAttribute('position'),index=geometry.index;
   if(!position||'isGLBufferAttribute' in position||Array.isArray(mesh.material)||geometry.morphAttributes.position?.length||
      geometry.drawRange.start!==0||geometry.drawRange.count<(index?.count??position.count)){
    this.fallback.push(object);return;
   }
   const entry={mesh,matrix:mesh.matrixWorld.clone(),geometry,order,active:false};
   const bins=new Map<string,{indices:number[];faces:number[];bounds:T.Box3}>();
   for(let i=0;i+2<(index?.count??position.count);i+=3){
    bounds.makeEmpty();let low=Infinity,high=-Infinity;
    for(let j=0;j<3;j++){
     point.fromBufferAttribute(position,index?.getX(i+j)??i+j).applyMatrix4(entry.matrix);
     bounds.expandByPoint(point);low=Math.min(low,point.y);high=Math.max(high,point.y);
    }
    // All impact origins are at .8 m. The four short support rays remain
    // within this band even on the steepest accepted face.
    if(high<.4||low>1.2)continue;
    for(let x=Math.floor((bounds.min.x-EDGE)/CELL);x<=Math.floor((bounds.max.x+EDGE)/CELL);x++)
     for(let z=Math.floor((bounds.min.z-EDGE)/CELL);z<=Math.floor((bounds.max.z+EDGE)/CELL);z++){
      const cell=key(x,z);
      let b=bins.get(cell);
      if(!b){b={indices:[],faces:[],bounds:new T.Box3()};bins.set(cell,b);}
      for(let j=0;j<3;j++){
       const v=index?.getX(i+j)??i+j;b.indices.push(v);b.bounds.expandByPoint(local.fromBufferAttribute(position,v));
      }
      b.faces.push(i/3);
     }
   }
   this.entries.set(mesh,entry);
   for(const [cell,b] of bins){
    const g=new T.BufferGeometry();
    // Only the query index is owned here. Borrowed attributes never upload.
    g.attributes=geometry.attributes;g.setIndex(b.indices);
    g.boundingBox=b.bounds;g.boundingSphere=b.bounds.getBoundingSphere(new T.Sphere());
    const query=new T.Mesh(g,mesh.material);
    query.matrixWorld.copy(entry.matrix);
    const list=this.cells.get(cell)??[];
    list.push({entry,query,faces:b.faces});this.cells.set(cell,list);
   }
  });
 }

 clear(){
  for(const bins of this.cells.values())for(const bin of bins)bin.query.geometry.dispose();
  this.cells.clear();this.entries.clear();this.order.clear();this.fallback.length=0;this.world=undefined;
 }

 intersect(world:T.Object3D,ray:T.Raycaster,hits:T.Intersection[],only?:T.Object3D){
  ray.ray.at(ray.far,this.end);
  if(this.world!==world||Math.min(ray.ray.origin.y,this.end.y)<.4||Math.max(ray.ray.origin.y,this.end.y)>1.2){
   ray.intersectObject(only??world,!only,hits);
   if(!only)for(let i=hits.length-1;i>=0;i--)if(!visible(hits[i].object))hits.splice(i,1);
   return;
  }
  const active=(entry:Entry)=>entry.mesh.geometry===entry.geometry&&entry.mesh.matrixWorld.equals(entry.matrix)&&!Array.isArray(entry.mesh.material);
  if(only){
   const entry=this.entries.get(only);
   if(!entry||!active(entry)){ray.intersectObject(only,false,hits);return;}
  }else{
   for(const entry of this.entries.values()){
    entry.active=entry.mesh.layers.test(ray.layers)&&visible(entry.mesh);
    if(entry.active&&!active(entry)){entry.active=false;entry.mesh.raycast(ray,hits);}
   }
   for(const object of this.fallback)if(object.layers.test(ray.layers)&&visible(object))object.raycast(ray,hits);
  }
  const origin=ray.ray.origin;
  // The longest probe is shorter than a cell. This covers crossed cells and
  // at most one extra corner cell without boundary-sensitive DDA stepping.
  for(let x=Math.floor((Math.min(origin.x,this.end.x)-EDGE)/CELL);x<=Math.floor((Math.max(origin.x,this.end.x)+EDGE)/CELL);x++)
   for(let z=Math.floor((Math.min(origin.z,this.end.z)-EDGE)/CELL);z<=Math.floor((Math.max(origin.z,this.end.z)+EDGE)/CELL);z++){
    const list=this.cells.get(key(x,z));if(!list)continue;
    for(const {entry,query,faces} of list){
     if(only?entry.mesh!==only:!entry.active)continue;
     query.material=entry.mesh.material;
     const start=hits.length;query.raycast(ray,hits);
     for(let i=start;i<hits.length;i++){const hit=hits[i];hit.object=entry.mesh;hit.faceIndex=faces[hit.faceIndex!];}
    }
   }
  hits.sort((a,b)=>a.distance-b.distance||(this.order.get(a.object)??0)-(this.order.get(b.object)??0)||
   (this.entries.has(a.object)?(a.faceIndex??0)-(b.faceIndex??0):0));
 }
}
