// Test the projected shipping triangles of a concave or multi-leg fixture when
// its enclosing rectangle spans open deck. Instance transforms replace the root.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {Matrix4,Vector3} from 'three';
import {readdirSync} from 'node:fs';

const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),packs=new Map();
export async function fixtureTriangles(dir,instance,accept){
  if(!packs.has(dir)){
    const name=readdirSync(dir).find(name=>name.endsWith('.glb'));
    packs.set(dir,await io.read(dir+'/'+name));
  }
  const group=packs.get(dir).getRoot().listNodes().find(n=>n.getName()===instance.asset);
  if(!group)throw Error('Missing shipping model '+instance.asset);
  const world=instance.matrix.clone().multiply(new Matrix4().fromArray(group.getWorldMatrix()).invert());
  let valid=true;
  group.traverse(node=>{
    const matrix=world.clone().multiply(new Matrix4().fromArray(node.getWorldMatrix()));
    for(const primitive of node.getMesh()?.listPrimitives()??[]){
      const pos=primitive.getAttribute('POSITION'),indices=primitive.getIndices(),v=[];
      for(let i=0;i<pos.getCount();i++)v.push(new Vector3().fromArray(pos.getElement(i,[])).applyMatrix4(matrix));
      for(let i=0;valid&&i<(indices?.getCount()??pos.getCount());i+=3){
        const points=[0,1,2].map(j=>v[indices?indices.getScalar(i+j):i+j]);
        if(!accept(points))valid=false;
      }
    }
  });
  return valid;
}
