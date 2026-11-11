import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {addBroodCell} from './OrganicGrowth';
import {addEnvironmentalStory} from './EnvironmentalStory';
import {environmentObstacle} from '../ShipEnvironments';
import {addRoomPracticals} from '../lighting/RoomPracticals';
import {environmentClock,updateHotFixtureSurfaces} from '../lighting/HotFixtureSurface';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {disposeModel} from '../meshParts';

function transforms(root:T.Object3D){const values:number[][]=[];root.updateWorldMatrix(true,true);root.traverse(object=>{if(object instanceof T.Mesh)values.push(object.matrixWorld.toArray());});return values;}

describe('X2 environmental story rendering',()=>{
  it('reproduces irregular brood lobes from a room seed and stays inside fitted collision rectangles',()=>{
    const a=new T.Group(),b=new T.Group(),c=new T.Group();
    addBroodCell(a,1729,3);addBroodCell(b,1729,3);addBroodCell(c,1730,3);
    expect(transforms(a)).toEqual(transforms(b));expect(transforms(a)).not.toEqual(transforms(c));
    const footprint={x:3,y:4,width:5,height:7},fitted=environmentObstacle('infested',footprint,3,'swarm-junction',1729);
    const bounds=new T.Box3().setFromObject(fitted);
    expect(bounds.min.x).toBeGreaterThanOrEqual(footprint.x);expect(bounds.max.x).toBeLessThanOrEqual(footprint.x+footprint.width);
    expect(bounds.min.z).toBeGreaterThanOrEqual(footprint.y);expect(bounds.max.z).toBeLessThanOrEqual(footprint.y+footprint.height);
    for(const root of [a,b,c,fitted])disposeModel(root);
  });
  it('connects equipment with flush membranes while preserving the authoritative template',()=>{
    const template=ROOM_TEMPLATES['swarm-junction'],before=JSON.stringify(template),world=new T.Group();
    const root=addEnvironmentalStory(world,template,'infested',template.id,1729);
    expect(JSON.stringify(template)).toBe(before);expect(root.children.length).toBeGreaterThan(0);expect(root.children.length).toBeLessThanOrEqual(2);
    root.traverse(object=>{if(object instanceof T.Mesh){const p=object.geometry.getAttribute('position');for(let i=0;i<p.count;i++)expect(p.getY(i)).toBeLessThan(.03);}});
    disposeModel(root);
  });
  it('uses irregular wall nodules instead of a repeated fixture row without increasing batches',()=>{
    const world=new T.Group();addRoomPracticals(world,30,24,'infested');
    expect(world.children).toHaveLength(2);
    const mesh=world.getObjectByName('living-bioluminescent-nodules') as T.InstancedMesh,matrix=new T.Matrix4(),ys=new Set<number>();
    for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);ys.add(Math.round(matrix.elements[13]*100));}
    expect(ys.size).toBeGreaterThan(mesh.count/2);expect((mesh.material as T.MeshStandardMaterial).emissiveIntensity).toBeLessThan(1);
    disposeModel(world);
  });
  it('anchors drip particles at visible leaks and shares the prepared motion clock',()=>{
    const template=ROOM_TEMPLATES['coolant-plant'],world=new T.Group(),dressing=new T.Group();dressing.name='g2-world-dressing';
    dressing.userData.leakOrigins=[{x:2,y:.8,z:3}];world.add(dressing);
    const root=addEnvironmentalStory(world,template,'maintenance',template.id),mesh=root.getObjectByName('source-anchored-story-particles') as T.Mesh<T.InstancedBufferGeometry,T.ShaderMaterial>;
    expect(root.userData.sourceCount).toBe(1);expect(mesh.geometry.instanceCount).toBe(12);expect(mesh.material.uniforms.time).toBe(environmentClock);
    const origin=mesh.geometry.getAttribute('origin');expect([origin.getX(0),origin.getY(0),origin.getZ(0)]).toEqual([2,expect.closeTo(.8),3]);
    const geometry=mesh.geometry,material=mesh.material,goneGeometry=vi.spyOn(geometry,'dispose'),goneMaterial=vi.spyOn(material,'dispose');
    updateHotFixtureSurfaces(2);expect(material.uniforms.time.value).toBe(2);expect(mesh.geometry).toBe(geometry);expect(mesh.material).toBe(material);
    updateHotFixtureSurfaces(0);expect(material.uniforms.time.value).toBe(0);
    disposeModel(root);expect(goneGeometry).toHaveBeenCalledTimes(1);expect(goneMaterial).toHaveBeenCalledTimes(1);
  });
});
