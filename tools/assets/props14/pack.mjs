/** Static counterpart of I11 optimise/index-only LOD and T12 UASTC palette packing.
 * Run after props.py with TOKTX set to the KTX-Software encoder executable. */
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,EXTMeshoptCompression,KHRTextureBasisu} from '@gltf-transform/extensions';
import {dedup} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptSimplifier} from 'meshoptimizer';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';

await Promise.all([MeshoptEncoder.ready,MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});
const directory='public/assets/props14',filename='props.glb';
const doc=await io.read(join(directory,filename)),root=doc.getRoot();
await doc.transform(dedup());
const buffer=root.listBuffers()[0];
for(const node of root.listNodes()){
  const mesh=node.getMesh();if(!mesh)continue;
  const low=doc.createMesh(mesh.getName()+'__lod_low');
  for(const prim of mesh.listPrimitives()){
    const indices=Uint32Array.from(prim.getIndices().getArray()),pos=prim.getAttribute('POSITION');

    const target=Math.max(3,Math.floor(indices.length/6)*3);
    const [simplified]=MeshoptSimplifier.simplify(indices,pos.getArray(),3,target,.018,['Permissive']);
    const index=doc.createAccessor().setType('SCALAR').setArray(Uint32Array.from(simplified)).setBuffer(buffer);
    low.addPrimitive(prim.clone().setIndices(index));
  }
  const sibling=doc.createNode(node.getName()+'__lod_low').setMesh(low).setMatrix(node.getMatrix())
    .setExtras({perf13LOD:'low',perf13SourceNode:node.getName()});
  (node.getParentNode()??root.listScenes()[0]).addChild(sibling);
}
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.FILTER});
await mkdir(join(directory,'plain'),{recursive:true});
await io.write(join(directory,'plain',filename),doc);
const temp=await mkdtemp(join(tmpdir(),'props14-atlas-'));
try{
  for(const texture of root.listTextures()){
    const input=join(temp,'atlas.png'),output=join(temp,'atlas.ktx2');
    await writeFile(input,texture.getImage());
    execFileSync(process.env.TOKTX??'toktx',['--t2','--genmipmap','--encode','uastc','--assign_oetf','srgb','--uastc_quality','4','--zcmp','18','--threads','4',output,input]);
    texture.setImage(await readFile(output)).setMimeType('image/ktx2').setURI('');
  }
  doc.createExtension(KHRTextureBasisu).setRequired(true);
  await io.write(join(directory,filename),doc);
}finally{await rm(temp,{recursive:true,force:true});}

const meshes=root.listMeshes();
function triangles(mesh){
  return mesh.listPrimitives().reduce((sum,prim)=>sum+prim.getIndices().getCount()/3,0);
}
const models=meshes.filter(mesh=>!mesh.getName().endsWith('__lod_low')).map(mesh=>({
  name:mesh.getName(),
  high:triangles(mesh),
  low:triangles(meshes.find(low=>low.getName()===mesh.getName()+'__lod_low')),
}));
const outputs=[];
for(const path of [filename,'plain/'+filename]){
  const bytes=await readFile(join(directory,path));
  outputs.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const manifest={
  license:'MIT',source:'tools/assets/props14/props.py',
  rebuild:'sh tools/assets/props14/rebuild.sh',
  atlases:['64x64 base color','64x64 emission'],models,outputs,
};
await writeFile(join(directory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
