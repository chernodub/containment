import {describe,it,expect} from 'vitest';
import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
const hash=b=>createHash('sha256').update(b).digest('hex');

describe('shipped CC0 kit contract',()=>{
 it('retains author licenses, file hashes, bounded textureless static geometry and meaningful role boundaries',async()=>{
  let total=0;
  for(const pack of await readdir('public/assets/kits')){
   const folder='public/assets/kits/'+pack,manifest=JSON.parse(await readFile(folder+'/manifest.json','utf8')),bytes=await readFile(folder+'/kit.glb'),doc=await new NodeIO().readBinary(bytes);
   expect(manifest.license).toBe('CC0-1.0');expect((await readFile(folder+'/LICENSE.txt','utf8'))).toMatch(/CC0|Creative Commons Zero/);expect(hash(bytes)).toBe(manifest.output.sha256);
   expect(doc.getRoot().listTextures()).toHaveLength(0);expect(doc.getRoot().listAnimations()).toHaveLength(0);expect(doc.getRoot().listSkins()).toHaveLength(0);expect(doc.getRoot().listExtensionsUsed()).toHaveLength(0);
   expect(doc.getRoot().listNodes().map(n=>n.getName()).sort()).toEqual(manifest.models.map(m=>m.name).sort());
   for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){expect(['body','dark','trim','accent','cloth']).toContain(p.getMaterial().getName());expect(p.getAttribute('POSITION').getArray().every(Number.isFinite)).toBe(true);}
   if(pack.includes('station'))expect(new Set(doc.getRoot().listMaterials().map(m=>m.getName())).size).toBeGreaterThan(1);
   for(const name of await readdir(folder))total+=(await stat(folder+'/'+name)).size;
  }
  expect(total).toBeLessThanOrEqual(12_000_000);
 });
});
