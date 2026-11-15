import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {residentialGalleryBlockout} from './ResidentialGalleryBlockout';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {disposeModel} from './meshParts';

describe('residential manufactured forms',()=>{
  it('keeps broad beveled cabin and packing forms in all four existing reservations',()=>{
    // Source-model manufacture contract, independent of the redesigned live kit.
    for(const [index,r] of [{x:280,y:160,width:240,height:100},{x:280,y:520,width:120,height:200},{x:650,y:270,width:260,height:100},{x:780,y:570,width:140,height:150}].entries()){
      const f={x:r.x/32,y:r.y/32,width:r.width/32,height:r.height/32},root=residentialGalleryBlockout(f,index);
      root.updateWorldMatrix(true,true);const bounds=new T.Box3().setFromObject(root,true);
      expect(bounds.min.x).toBeGreaterThanOrEqual(f.x-.001);expect(bounds.max.x).toBeLessThanOrEqual(f.x+f.width+.001);
      expect(bounds.min.z).toBeGreaterThanOrEqual(f.y-.001);expect(bounds.max.z).toBeLessThanOrEqual(f.y+f.height+.001);
      let bevelNormals=0;
      root.traverse(o=>{if(o instanceof T.Mesh){const n=o.geometry.getAttribute('normal');for(let i=0;i<n.count;i++){
        expect(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))).toBeCloseTo(1,4);
        if(Math.abs(n.getX(i))>.05&&Math.abs(n.getY(i))>.05)bevelNormals++;
      }}});
      expect(bevelNormals).toBeGreaterThan(0);disposeModel(root);
    }
  });
});
