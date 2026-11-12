import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {environmentObstacle} from '../ShipEnvironments';
import {MAT,disposeModel} from '../meshParts';
import {passengerObservationTexture,sleepingPassenger} from './EquipmentDetail';

describe('supported industrial cell details',()=>{
  it.each(['communications','maintenance','cargo','habitation'] as const)('%s retains its reservation and existing finish family',environment=>{
    const reservation={x:2,y:3,width:1.9,height:2.5},root=environmentObstacle(environment,reservation,0,'x2-detail-fixture');
    root.updateWorldMatrix(true,true);const bounds=new T.Box3().setFromObject(root);
    expect(bounds.min.x).toBeGreaterThanOrEqual(reservation.x-1e-5);expect(bounds.max.x).toBeLessThanOrEqual(reservation.x+reservation.width+1e-5);
    expect(bounds.min.z).toBeGreaterThanOrEqual(reservation.y-1e-5);expect(bounds.max.z).toBeLessThanOrEqual(reservation.y+reservation.height+1e-5);
    const materials=new Set<T.Material>();let triangles=0;
    root.traverse(object=>{if(object instanceof T.Mesh){materials.add(object.material as T.Material);triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3;}});
    const allowed=environment==='maintenance'?[MAT.steel,MAT.edge,MAT.copper,MAT.black,MAT.red]:environment==='communications'?[MAT.steel,MAT.edge,MAT.black,MAT.bone,MAT.cyan]:Object.values(MAT);
    for(const material of materials)expect(allowed).toContain(material);
    expect(triangles).toBeLessThan(10000);disposeModel(root);
  });
  it('reveals detailed communications bays from both camera axes and directions',()=>{
    const root=environmentObstacle('communications',{x:2,y:3,width:1.9,height:2.5},0,'transmission-chamber');root.updateWorldMatrix(true,true);
    for(const axis of ['x','z'] as const)for(const side of [-1,1]){
      let manufacturedHits=0;
      for(let row=0;row<18;row++)for(let column=0;column<25;column++){
        const origin=new T.Vector3(2.95,.32+row*.088,4.25),direction=new T.Vector3();
        origin[axis]+=side*5;origin[axis==='x'?'z':'x']+=(axis==='x'?.62:0)+(column-12)*.05;direction[axis]=-side;
        const hit=new T.Raycaster(origin,direction).intersectObject(root,true)[0];
        // The vent inserts and signal ports live in the bays. Outer rails alone cannot pass.
        if(hit&&[MAT.bone,MAT.cyan].includes((hit.object as T.Mesh).material as T.MeshStandardMaterial))manufacturedHits++;
      }
      expect(manufacturedHits,`${axis}/${side}`).toBeGreaterThan(8);
    }
    disposeModel(root);
  });
  it('keeps a naturally asymmetric sleeper beneath opaque, mipmapped, softly shaded glazing',()=>{
    let asymmetry=0;
    for(let y=0;y<80;y++)for(let x=0;x<40;x++)if(sleepingPassenger((x+.5)/40,(y+.5)/80)!==sleepingPassenger(1-(x+.5)/40,(y+.5)/80))asymmetry++;
    expect(asymmetry).toBeGreaterThan(70);
    const texture=passengerObservationTexture(),image=texture.image as {width:number;height:number;data:Uint8Array};
    expect([image.width,image.height]).toEqual([128,256]);expect(texture.generateMipmaps).toBe(true);expect(texture.minFilter).toBe(T.LinearMipmapLinearFilter);
    const shades=new Set<number>();
    for(let y=85;y<160;y++)for(let x=55;x<75;x++){const i=(y*image.width+x)*4;shades.add(image.data[i]);expect(image.data[i+3]).toBe(255);}
    expect(shades.size).toBeGreaterThan(15);texture.dispose();
  });
});
