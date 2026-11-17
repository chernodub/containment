import * as T from 'three';
const lowIndices=new WeakMap<T.BufferGeometry,T.BufferAttribute>();
/** Extract index-only variants before ordinary kit ownership/bounds processing. */
export function extractStaticLODs(root:T.Object3D):void {
 const groups:T.Object3D[]=[];root.traverse(o=>{if(o.userData.perf13LOD==='low')groups.push(o);});
 for(const group of groups){const full=root.getObjectByName(group.userData.perf13SourceNode);if(!full)continue;const high:T.Mesh[]=[],low:T.Mesh[]=[];full.traverse(o=>{if(o instanceof T.Mesh)high.push(o);});group.traverse(o=>{if(o instanceof T.Mesh)low.push(o);});if(high.length===low.length)for(let i=0;i<high.length;i++){const index=low[i].geometry.index;if(index&&high[i].geometry.attributes.position.count===low[i].geometry.attributes.position.count)lowIndices.set(high[i].geometry,index);}group.removeFromParent();}
}
/** Map original vertex indices into an already baked, unindexed primitive. */
export function tagStaticLOD(source:T.BufferGeometry,baked:T.BufferGeometry):void {
 const low=lowIndices.get(source);if(!low)return;const first=new Map<number,number>(),index=source.index;
 for(let i=0;i<(index?.count??source.attributes.position.count);i++){const vertex=index?index.getX(i):i;if(!first.has(vertex))first.set(vertex,i);}
 const indices=new Uint32Array(low.count);for(let i=0;i<low.count;i++){const target=first.get(low.getX(i));if(target===undefined)return;indices[i]=target;}
 baked.userData.perf13LowIndices=indices;
}
/** Same merged attributes/material pass, alternate index buffers on tier switch. */
export function mergeStaticLOD(parts:readonly T.BufferGeometry[],lowVertices:number):{highIndex:T.BufferAttribute;lowIndex:T.BufferAttribute}|undefined {
 if(!parts.some(p=>p.userData.perf13LowIndices))return;const count=parts.reduce((n,p)=>n+p.attributes.position.count,0),high=new Uint32Array(count),low:number[]=[];let offset=0;
 for(const part of parts){const size=part.attributes.position.count;for(let i=0;i<size;i++)high[offset+i]=offset+i;if(offset<lowVertices){const indices=part.userData.perf13LowIndices as Uint32Array|undefined;if(indices)for(const i of indices)low.push(offset+i);else for(let i=0;i<Math.min(size,lowVertices-offset);i++)low.push(offset+i);}offset+=size;}
 return{highIndex:new T.BufferAttribute(high,1),lowIndex:new T.BufferAttribute(new Uint32Array(low),1)};
}
