/** Static counterpart of I11 optimise/index-only LOD and T12 UASTC normal packing.
 * Run after kit.py with TOKTX set to the KTX-Software encoder executable. */
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
const directory='public/assets/room14',filename='incidents.glb';
const doc=await io.read(join(directory,filename)),root=doc.getRoot();
await doc.transform(dedup());
const buffer=root.listBuffers()[0];
for(const node of root.listNodes()){
  const mesh=node.getMesh();if(!mesh)continue;
  const low=doc.createMesh(mesh.getName()+'__lod_low');
  for(const prim of mesh.listPrimitives()){
    const indices=Uint32Array.from(prim.getIndices().getArray()),pos=prim.getAttribute('POSITION');
    const keep=prim.getMaterial()?.getEmissiveFactor().some(v=>v>0);
    const target=Math.max(3,Math.floor(indices.length/6)*3);
    const [simplified]=keep?[indices]:MeshoptSimplifier.simplify(indices,pos.getArray(),3,target,.01,['LockBorder']);
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
const temp=await mkdtemp(join(tmpdir(),'room14-normal-'));
try{
  for(const texture of root.listTextures()){
    const input=join(temp,'atlas.png'),output=join(temp,'atlas.ktx2');
    await writeFile(input,texture.getImage());
    execFileSync(process.env.TOKTX??'toktx',['--t2','--genmipmap','--encode','uastc','--assign_oetf','linear','--uastc_quality','4','--zcmp','18','--threads','4',output,input]);
    texture.setImage(await readFile(output)).setMimeType('image/ktx2').setURI('');
  }
  doc.createExtension(KHRTextureBasisu).setRequired(true);
  await io.write(join(directory,filename),doc);
}finally{await rm(temp,{recursive:true,force:true});}
const manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8'));
const bytes=await readFile(join(directory,filename));
manifest.output.bytes=bytes.length;manifest.output.sha256=createHash('sha256').update(bytes).digest('hex');
manifest.rebuild+=' && node tools/assets/room14-incidents/pack.mjs';
manifest.fallback='plain/'+filename;
await writeFile(join(directory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
