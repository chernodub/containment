/** Convert data only. No downloaded script, plugin or executable is evaluated. */
import {NodeIO} from '@gltf-transform/core';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const source=resolve('tools/assets-src/k7-quaternius-monsters/Alien-mirror.glb');
const out=resolve(process.argv[2]??'artifacts/nextgen/k7-standard/route-a-dist');
const io=new NodeIO(),doc=await io.read(source);
const names={Idle:'stand',Run:'run',Walk:'walk',Punch:'attack',HitReact:'hit',Death:'death'};
for(const a of doc.getRoot().listAnimations()){if(names[a.getName()])a.setName(names[a.getName()]);}
// Engine forward is +Z after its retained source -90-degree rotation.
for(const scene of doc.getRoot().listScenes())for(const node of scene.listChildren()){
 const wrapper=doc.createNode('k7-candidate-axis').setRotation([0,Math.sin(Math.PI/4),0,Math.cos(Math.PI/4)]).setScale([1,.62,1]);
 scene.removeChild(node);wrapper.addChild(node);scene.addChild(wrapper);
}
for(const node of doc.getRoot().listNodes())if(node.getName()==='Torso')node.setName('chest');
for(const mat of doc.getRoot().listMaterials()){
 mat.setBaseColorTexture(null).setNormalTexture(null).setEmissiveTexture(null).setMetallicFactor(0).setRoughnessFactor(.85);
}
for(const texture of doc.getRoot().listTextures())texture.dispose();
await mkdir(resolve(out,'assets/models'),{recursive:true});
const bytes=await io.writeBinary(doc);await writeFile(resolve(out,'assets/models/tyrant.glb'),bytes);
const hash=b=>createHash('sha256').update(b).digest('hex');
await writeFile(resolve(out,'k7-candidate-receipt.json'),JSON.stringify({source,sourceSHA256:hash(await readFile(source)),sourceURL:'https://raw.githubusercontent.com/Hakhyun-Kim/constellation-defense/main/assets/models/quaternius-alien.glb',licenseURL:'https://quaternius.com/packs/ultimatemonsters.html',license:'CC0-1.0',author:'Quaternius',reviewOnly:true,outputBytes:bytes.length,outputSHA256:hash(bytes),changes:['axis +90Y','height .62 for low siege posture','matte untextured region pipeline','native animation state names'],death:'frozen-pose corpse; native candidate Death clip retained, no Unvanquished ragdoll mapping'},null,2));
console.log('Candidate bytes',bytes.length);
