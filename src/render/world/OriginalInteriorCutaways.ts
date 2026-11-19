import type {RoomCutawayTargets} from './RoomCutawayTargets';
import * as T from 'three';

type Body = {x:number; y:number; radius:number};
type Actor = Body & {id:number};
type Model = {height:number; root?:T.Object3D};
export type InteriorCutawayPart = {colors:T.BufferAttribute; start:number; end:number};
export type InteriorCutaway = {bounds:T.Box3; parts:InteriorCutawayPart[]; object?:T.Object3D; indices?:{attribute:T.BufferAttribute;start:number;end:number}; hidden:boolean};
type State = {pieces:InteriorCutaway[]; point:T.Vector3; actors:Float64Array; box:Float64Array};
const states = new WeakMap<T.Object3D,State>();

/** Room-owned vertex ranges share the ordinary opaque material batches. */
export function registerOriginalInteriorCutaways(root:T.Object3D,pieces:InteriorCutaway[]):void {
  if(states.has(root)){states.get(root)!.pieces.push(...pieces);return;}
  if(pieces.length)states.set(root,{pieces,point:new T.Vector3(),actors:new Float64Array(1025*5),box:new Float64Array(4)});
}

function projectBox(minX:number,maxX:number,minY:number,maxY:number,minZ:number,maxZ:number,
  camera:T.Camera,point:T.Vector3,out:Float64Array,offset:number):void {
  out[offset]=out[offset+1]=Infinity;out[offset+2]=out[offset+3]=-Infinity;
  for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
    point.set(x?maxX:minX,y?maxY:minY,z?maxZ:minZ).project(camera);
    out[offset]=Math.min(out[offset],point.x);out[offset+1]=Math.min(out[offset+1],point.y);
    out[offset+2]=Math.max(out[offset+2],point.x);out[offset+3]=Math.max(out[offset+3],point.y);
  }
}

function projectBody(body:Body,height:number,camera:T.Camera,point:T.Vector3,out:Float64Array,offset:number):void {
  projectBox((body.x-body.radius)/32,(body.x+body.radius)/32,0,height,
    (body.y-body.radius)/32,(body.y+body.radius)/32,camera,point,out,offset);
  const m=camera.matrixWorld.elements;
  out[offset+4]=(body.x*m[8]+body.y*m[10]-body.radius*Math.hypot(m[8],m[10]))/32;
}

/** Remove an overhead assembly locally when it crosses a full actor silhouette.
 * Alpha testing cuts solid metal away; it never turns machinery translucent. */
export function updateOriginalInteriorCutaways(root:T.Object3D|undefined,camera:T.Camera,
  marine:Body,marineHeight:number,enemies:readonly Actor[],models:ReadonlyMap<number,Model>,targets?:RoomCutawayTargets):void {
  if(!root)return;
  const state=states.get(root);if(!state)return;
  const {point,actors,box}=state;
  projectBody(marine,marineHeight,camera,point,actors,0);let bodies=1;
  for(const enemy of enemies){
    const model=models.get(enemy.id);if(model?.root?.visible===false)continue;
    if(bodies===1025)break;
    projectBody(enemy,model?.height??4.7,camera,point,actors,bodies++*5);
  }
  for(let i=0;targets&&i<targets.count&&bodies<1025;i++)
    projectBody(targets.bodies[i],.6,camera,point,actors,bodies++*5);
  for(const piece of state.pieces){
    const b=piece.bounds;
    projectBox(b.min.x,b.max.x,b.min.y,b.max.y,b.min.z,b.max.z,camera,point,box,0);
    const m=camera.matrixWorld.elements;
    const front=(m[8]>=0?b.max.x:b.min.x)*m[8]+(m[10]>=0?b.max.z:b.min.z)*m[10];
    let hidden=bodies===1025;
    for(let i=0;!hidden&&i<bodies;i++){
      const n=i*5;
      hidden=actors[n+4]<=front&&actors[n]<=box[2]+.015&&actors[n+2]>=box[0]-.015&&actors[n+1]<=box[3]+.015&&actors[n+3]>=box[1]-.015;
    }
    if(hidden===piece.hidden)continue;
    piece.hidden=hidden;
    if(piece.object)piece.object.visible=!hidden;
    if(piece.indices){
      const {attribute,start,end}=piece.indices;
      for(let i=start;i<end;i++)attribute.setX(i,hidden?start:i);
      attribute.addUpdateRange(start,end-start);attribute.needsUpdate=true;
    }
    for(const part of piece.parts){
      for(let n=part.start;n<part.end;n++)part.colors.setW(n,hidden?0:1);
      part.colors.needsUpdate=true;
    }
  }
}
