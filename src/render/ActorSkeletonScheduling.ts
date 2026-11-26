import * as T from 'three';

type Attribute=T.BufferAttribute|T.InterleavedBufferAttribute;
type WeightedSlots={indices:Attribute;weights:Attribute;indexVersion:number;weightVersion:number;slots:ReadonlySet<number>};
const weightedByGeometry=new WeakMap<T.BufferGeometry,WeightedSlots>();
const version=(attribute:Attribute)=>attribute instanceof T.InterleavedBufferAttribute?attribute.data.version:attribute.version;

function weightedSlots(geometry:T.BufferGeometry):ReadonlySet<number>|undefined {
 const indices=geometry.getAttribute('skinIndex'),weights=geometry.getAttribute('skinWeight');
 if(!indices||!weights)return;
 const indexVersion=version(indices),weightVersion=version(weights),cached=weightedByGeometry.get(geometry);
 if(cached&&cached.indices===indices&&cached.weights===weights&&cached.indexVersion===indexVersion&&cached.weightVersion===weightVersion)return cached.slots;
 const slots=new Set<number>();
 for(let i=0;i<indices.count;i++)for(let c=0;c<4;c++)if(weights.getComponent(i,c)!==0)slots.add(indices.getComponent(i,c));
 weightedByGeometry.set(geometry,{indices,weights,indexVersion,weightVersion,slots});
 return slots;
}

/** PERF13: only weighted palette entries reach the shader. Keep the complete
 * bone hierarchy for clips, sockets and procedural pose owners. Imported
 * actor instances share geometry, so reuse its weighted palette inventory. */
export function scheduleActorSkeletons(root:T.Object3D):void {
 const palettes=new Map<T.Skeleton,Set<number>>();
 root.traverse(object=>{
  if(!(object instanceof T.SkinnedMesh))return;
  const slots=weightedSlots(object.geometry);
  if(!slots)return;
  let used=palettes.get(object.skeleton);
  if(!used){used=new Set();palettes.set(object.skeleton,used);}
  for(const slot of slots)used.add(slot);
 });
 const diagnostics:{bones:number;weighted:number}[]=[];
 for(const [skeleton,used]of palettes){diagnostics.push({bones:skeleton.bones.length,weighted:used.size});if(used.size>=skeleton.bones.length||[...used].some(i=>i<0||i>=skeleton.bones.length))continue;const slots=[...used],offset=new T.Matrix4(),original=skeleton.update.bind(skeleton);skeleton.update=()=>{const matrices=skeleton.boneMatrices;if(!matrices){original();return;}let changed=false;for(const index of slots){offset.multiplyMatrices(skeleton.bones[index].matrixWorld,skeleton.boneInverses[index]);for(let c=0;c<16;c++){const value=Math.fround(offset.elements[c]),at=index*16+c;if(matrices[at]!==value){matrices[at]=value;changed=true;}}}if(changed&&skeleton.boneTexture)skeleton.boneTexture.needsUpdate=true;};}
 root.userData.perf13Skeletons=diagnostics;
}
