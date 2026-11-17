import * as T from 'three';
/** PERF13: only weighted palette entries reach the shader. Keep the complete
 * bone hierarchy for clips, sockets and procedural pose owners; skip only unused
 * inverse-bind products/uploads into the palette. All rank variants contribute. */
export function scheduleActorSkeletons(root:T.Object3D):void {
 const palettes=new Map<T.Skeleton,Set<number>>();
 root.traverse(object=>{if(!(object instanceof T.SkinnedMesh))return;const indices=object.geometry.getAttribute('skinIndex'),weights=object.geometry.getAttribute('skinWeight');if(!indices||!weights)return;let used=palettes.get(object.skeleton);if(!used){used=new Set();palettes.set(object.skeleton,used);}for(let i=0;i<indices.count;i++)for(let c=0;c<4;c++)if(weights.getComponent(i,c)!==0)used.add(indices.getComponent(i,c));});
 const diagnostics:{bones:number;weighted:number}[]=[];
 for(const [skeleton,used]of palettes){diagnostics.push({bones:skeleton.bones.length,weighted:used.size});if(used.size>=skeleton.bones.length||[...used].some(i=>i<0||i>=skeleton.bones.length))continue;const slots=[...used],offset=new T.Matrix4(),original=skeleton.update.bind(skeleton);skeleton.update=()=>{const matrices=skeleton.boneMatrices;if(!matrices){original();return;}let changed=false;for(const index of slots){offset.multiplyMatrices(skeleton.bones[index].matrixWorld,skeleton.boneInverses[index]);for(let c=0;c<16;c++){const value=Math.fround(offset.elements[c]),at=index*16+c;if(matrices[at]!==value){matrices[at]=value;changed=true;}}}if(changed&&skeleton.boneTexture)skeleton.boneTexture.needsUpdate=true;};}
 root.userData.perf13Skeletons=diagnostics;
}
