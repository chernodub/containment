import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {environmentObstacle} from '../ShipEnvironments';
import {MAT,disposeModel} from '../meshParts';

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
});
