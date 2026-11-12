import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {residentialGalleryBlockout} from './ResidentialGalleryBlockout';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {disposeModel} from './meshParts';

describe('residential manufactured forms',()=>{
  it('keeps broad beveled cabin and packing forms in all four existing reservations',()=>{
    for(const [index,r] of ROOM_TEMPLATES['residential-gallery'].obstacles.entries()){
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
