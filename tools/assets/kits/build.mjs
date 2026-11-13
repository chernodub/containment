#!/usr/bin/env node
/** Offline CC0 selection. Reads only inspected GLBs; all output is textureless glTF 2.0. */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,relative} from 'node:path';
import {Document,NodeIO} from '@gltf-transform/core';
import {dedup,prune,weld,simplify} from '@gltf-transform/functions';
import sharp from 'sharp';
import {MeshoptSimplifier} from 'meshoptimizer';
await MeshoptSimplifier.ready;
import {Matrix4,Matrix3,Vector3} from 'three';

export const PACKS=[
 {id:'quaternius-scifi-essentials',name:'Sci-Fi Essentials Kit (Standard)',author:'Quaternius',page:'https://quaternius.com/packs/scifiessentialskit.html',upload:'https://opengameart.org/content/sci-fi-essentials-kit',folder:'glTF',extension:'gltf',files:['Prop_Ammo','Prop_Ammo_Closed','Prop_Barrel1','Prop_Barrel2_Closed','Prop_Barrel2_Open','Prop_Chair','Prop_Crate','Prop_Crate_Large','Prop_Crate_Tarp','Prop_Crate_Tarp_Large','Prop_Desk_Small','Prop_Desk_Medium','Prop_Locker','Prop_HealthPack_Tube','Prop_Mug','Prop_SatelliteDish','Prop_Shelves_ThinShort','Prop_Shelves_ThinTall','Prop_Shelves_WideShort','Prop_Shelves_WideTall']},
 {id:'kenney-space-station',name:'Space Station Kit',page:'https://kenney.nl/assets/space-station-kit',folder:'Models/GLB format',files:['bed-single','bed-single-cover','chair-cushion','computer','computer-screen','computer-wide','computer-system','display-wall-wide','container-flat-open','container-wide','container-tall','pipe','pipe-bend','pipe-ring','rocks','skip-rocks','table','structure','wall-pillar','rail','wall-detail','wall-switch','wall','wall-window','table-display-small']},
 {id:'kenney-furniture',name:'Furniture Kit',page:'https://kenney.nl/assets/furniture-kit',folder:'Models/GLTF format',files:['bedSingle','pillow','desk','chairDesk','loungeSofa','cardboardBoxOpen','cardboardBoxClosed','books','radio','coatRack','kitchenCoffeeMachine','tableCoffee','pottedPlant','cabinetBedDrawer','lampRoundTable']},
 {id:'kenney-nature',name:'Nature Kit',page:'https://kenney.nl/assets/nature-kit',folder:'Models/GLTF format',files:['rock_largeA','rock_largeB','rock_largeD','rock_tallA','rock_tallB','rock_smallFlatA','rock_smallTopA','rock_smallC']},
];
const sha=b=>createHash('sha256').update(b).digest('hex');
const root=resolve('.'),io=new NodeIO().setLogger({debug(){},info(){},warn(){},error:console.error});
const roles=['body','dark','trim','accent','cloth'];
// The source's flat palette becomes five broad roles. No source texture enters runtime.
function role(rgb,name,pack){
 if(pack==='kenney-nature')return 'body';
 const [r,g,b]=rgb,max=Math.max(r,g,b),min=Math.min(r,g,b),l=r*.2126+g*.7152+b*.0722;
 if(/computer|display/.test(name)&&l>.74)return 'accent';
 if(l<.22)return 'dark';
 if(g>r*1.18&&b>r*1.15 || b>r*1.4)return 'accent';
 if(max-min>.16&&r>g*1.1)return /bed|sofa|pillow|chair/i.test(name)?'cloth':'trim';
 return l>.74?'trim':'body';
}
let total=0;
for(const pack of PACKS){
 const source=resolve('tools/assets-src',pack.id),out=resolve('public/assets/kits',pack.id);await mkdir(out,{recursive:true});
 const doc=new Document(),buffer=doc.createBuffer(),scene=doc.createScene(pack.id);
 const mats=Object.fromEntries(roles.map((r,i)=>[r,doc.createMaterial(r).setExtras({kitRole:r}).setBaseColorFactor([.16+i*.09,.18+i*.08,.2+i*.07,1]).setMetallicFactor(.15).setRoughnessFactor(.85)]));
 const records=[];
 for(const name of pack.files){
  const path=resolve(source,'inspected',pack.folder,name+'.'+(pack.extension??'glb')),bytes=await readFile(path);
  if(bytes.length>2_000_000)throw Error('source model byte budget');
  const json=JSON.parse(pack.extension==='gltf'?bytes.toString():bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  const dependencies=[];
  for(const entry of [...(json.images??[]),...(json.buffers??[])])if(entry.uri){
   const uri=entry.uri;if(/^[a-z]+:/i.test(uri))throw Error('external URL rejected');
   const target=resolve(path,'..',uri);if(!target.startsWith(resolve(source,'inspected')+'/')||!/[.](png|bin)$/i.test(target))throw Error('source URI rejected');
   const linked=await readFile(target);dependencies.push({file:relative(root,target),bytes:linked.length,sha256:sha(linked)});
  }
  const input=await io.read(path),buckets=new Map(),bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
  if(input.getRoot().listSkins().length)throw Error('skinned models rejected');
  for(const animation of input.getRoot().listAnimations())animation.dispose();
  for(const node of input.getRoot().listNodes()){
   const mesh=node.getMesh();if(!mesh)continue;
   const matrix=new Matrix4().fromArray(node.getWorldMatrix()),normalMatrix=new Matrix3().getNormalMatrix(matrix);
   for(const prim of mesh.listPrimitives()){
    if(prim.getMode()!==4)throw Error('triangles only');
    const p=prim.getAttribute('POSITION'),n=prim.getAttribute('NORMAL'),uv=prim.getAttribute('TEXCOORD_0'),idx=prim.getIndices(),mat=prim.getMaterial(),tex=mat?.getBaseColorTexture();
    if(!p||!n||p.getCount()>100000)throw Error('source geometry budget');
    let pixels;
    if(tex){const data=tex.getImage();if(data.length>16_000_000)throw Error('texture budget');const info=await sharp(data).metadata();if(info.width>4096||info.height>4096)throw Error('source texture dimensions');pixels=await sharp(data).resize({width:1024,height:1024,fit:'inside',withoutEnlargement:true}).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
    const count=idx?.getCount()??p.getCount();
    for(let i=0;i<count;i+=3){
     const indexes=[0,1,2].map(k=>idx?idx.getScalar(i+k):i+k);let rgb=mat?.getBaseColorFactor().slice(0,3)??[.5,.5,.5];
     if(pixels&&uv){const xy=uv.getElement(indexes[0],[]),x=Math.max(0,Math.min(pixels.info.width-1,Math.floor(xy[0]*pixels.info.width))),y=Math.max(0,Math.min(pixels.info.height-1,Math.floor(xy[1]*pixels.info.height))),offset=(y*pixels.info.width+x)*4;rgb=[0,1,2].map(k=>pixels.data[offset+k]/255);}
     const r=role(rgb,name,pack.id),bucket=buckets.get(r)??{position:[],normal:[]};buckets.set(r,bucket);
     for(const index of indexes){
      const v=new Vector3().fromArray(p.getElement(index,[])).applyMatrix4(matrix),normal=new Vector3().fromArray(n.getElement(index,[])).applyMatrix3(normalMatrix).normalize();
      if(![...v.toArray(),...normal.toArray()].every(Number.isFinite))throw Error('nonfinite geometry');
      bucket.position.push(...v.toArray());bucket.normal.push(...normal.toArray());
      v.toArray().forEach((value,k)=>{bounds.min[k]=Math.min(bounds.min[k],value);bounds.max[k]=Math.max(bounds.max[k],value);});
     }
    }
   }
  }
  const center=[(bounds.min[0]+bounds.max[0])/2,bounds.min[1],(bounds.min[2]+bounds.max[2])/2],mesh=doc.createMesh(name);
  let triangles=0;
  for(const [r,bucket] of buckets){
   for(let i=0;i<bucket.position.length;i++)bucket.position[i]-=center[i%3];triangles+=bucket.position.length/9;
   const prim=doc.createPrimitive().setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(new Float32Array(bucket.position)).setBuffer(buffer)).setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(new Float32Array(bucket.normal)).setBuffer(buffer)).setMaterial(mats[r]);mesh.addPrimitive(prim);
  }
  scene.addChild(doc.createNode(name).setMesh(mesh));
  records.push({name,sourceFile:relative(root,path),sourceSHA256:sha(bytes),sourceBytes:bytes.length,dependencies,triangles,size:bounds.max.map((v,k)=>v-bounds.min[k])});
 }
 await doc.transform(weld());
 if(pack.author)await doc.transform(simplify({simplifier:MeshoptSimplifier,ratio:.25,error:.01,lockBorder:false}));
 await doc.transform(dedup(),prune());
 for(const record of records){const mesh=doc.getRoot().listMeshes().find(m=>m.getName()===record.name);record.outputTriangles=mesh.listPrimitives().reduce((n,p)=>n+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0);}
 const output=await io.writeBinary(doc);total+=output.length;await writeFile(resolve(out,'kit.glb'),output);
 const license=await readFile(pack.author?resolve(out,'LICENSE.txt'):resolve(source,'inspected/License.txt'));if(!license.toString().includes('CC0'))throw Error('missing author dedication');await writeFile(resolve(out,'LICENSE.txt'),license);
 const manifest={pack:pack.name,author:pack.author??'Kenney',sourceURL:pack.page,license:'CC0-1.0',licenseEvidence:pack.upload?[pack.page,pack.upload]:[pack.page,'original archive License.txt'],downloadDate:'2026-11-13',archiveSHA256:sha(await readFile(resolve(source,'pack.zip'))),archiveFileListSHA256:sha(await readFile(resolve(source,'archive-files.json'))),output:{file:'kit.glb',bytes:output.length,sha256:sha(output)},models:records,pipeline:'Author static glTF/GLB geometry, world transforms baked, origin centered at footprint/base, source palette sampled into body/dark/trim/accent/cloth roles, textures/UVs removed, weld/dedup/prune; Quaternius only: meshoptimizer simplify target25%, relative error<=1%; no decoder extension.'};
 await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 await copyFile(resolve(source,'archive-files.json'),resolve(out,'source-files.json'));
 if(pack.author){const evidence={authorPageSHA256:sha(await readFile(resolve(source,'license-page.html'))),authorUploadPageSHA256:sha(await readFile(resolve(source,'author-upload-page.html'))),textureArchiveSHA256:sha(await readFile(resolve(source,'textures-download/pack.zip'))),textureArchiveUsed:false,note:'The model archive already contains the selected glTF texture dependencies; the separately downloaded matching texture archive was assessed but is not required.'};await writeFile(resolve(out,'license-evidence.json'),JSON.stringify(evidence,null,2)+'\n');}
 await writeFile(resolve(out,'CREDITS.md'),`# ${pack.name}\n\nAuthor: ${pack.author??'Kenney'}. Source: ${pack.page}\nLicense: CC0 1.0 Universal. ${pack.author?'Canonical CC0 legal text':'Original author dedication'}: [LICENSE.txt](LICENSE.txt).\nDownloaded: 2026-11-13. Archive SHA-256: \`${manifest.archiveSHA256}\`.\n\n${pack.author?'Author pack page and author-uploaded OpenGameArt entry both explicitly identify CC0. The archive has no license file; LICENSE.txt contains the canonical CC0 1.0 legal text. Author upload: '+pack.upload+'.':'Author page and original archive license both explicitly identify CC0. The original author license is preserved verbatim.'} Full archive inventory: [source-files.json](source-files.json); selected source/output sizes and SHA-256: [manifest.json](manifest.json). Sources remain excluded from git.\n\nConversion: ${manifest.pipeline}\n\nShipped file: kit.glb, ${output.length} bytes, SHA-256 \`${sha(output)}\`.\n\n## Selected original models\n\n${records.map(r=>`- ${r.name}.${pack.extension??'glb'} — ${r.sourceSHA256}`).join('\n')}\n`);
 console.log(pack.id,output.length,'bytes',records.length,'models',records.reduce((s,r)=>s+r.triangles,0),'triangles');
}
if(total>12_000_000)throw Error('12 MB shipped budget exceeded');console.log('TOTAL',total);
