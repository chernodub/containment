import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {serviceShaftLanding} from './ServiceShaftLanding';
import {containmentAnnulusBlockout} from './ContainmentAnnulusBlockout';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {createExpeditionGeometry,canOccupyExpedition} from '../game/world/expeditionGeometry';
import {disposeModel} from './meshParts';

describe('G2 manufactured service and shielding finishes',()=>{
 it('bevels supported lift fittings without moving them onto the connected balcony',()=>{
  const template=ROOM_TEMPLATES['service-shaft-landing'],root=serviceShaftLanding(template),geometry=createExpeditionGeometry({id:'g2-shaft',templateId:template.id} as never);
  root.updateMatrixWorld(true);let bevels=0,fasteners=0;const violations:string[]=[],point=new T.Vector3();
  root.traverse(object=>{
   if(!(object instanceof T.Mesh))return;
   if(object.name==='guide-captive-fastener')fasteners++;
   if(object.geometry.type!=='RoundedBoxGeometry'&&object.name!=='guide-captive-fastener')return;
   if(object.geometry.type==='RoundedBoxGeometry')bevels++;
   const positions=object.geometry.attributes.position;
   for(let i=0;i<positions.count;i++){
    point.fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld);
    if(canOccupyExpedition(geometry,{x:point.x*32,y:point.z*32},0))violations.push(object.parent!.name);
   }
  });
  expect(bevels).toBeGreaterThan(20);expect(fasteners).toBe(8);expect(violations).toEqual([]);
  const materials=new Set<T.Material>();root.traverse(object=>{if(object instanceof T.Mesh)materials.add(object.material as T.Material);});
  const floorPanel=[...materials].find(material=>material.name==='shaft-floor-panel'),steel=[...materials].find(material=>material.name==='shaft-steel');
  // The eighth owner calibrates floor cassettes without recoloring structural steel.
  expect(materials.size).toBe(8);expect(floorPanel).toBeDefined();expect(steel).toBeDefined();expect(floorPanel).not.toBe(steel);
  expect(floorPanel!.onBeforeCompile).toBe(steel!.onBeforeCompile);expect(floorPanel!.customProgramCacheKey).toBe(steel!.customProgramCacheKey);
  let floorOwners=0;root.traverse(object=>{if(object instanceof T.Mesh&&object.material===floorPanel){floorOwners++;expect(object.parent?.name).toBe('deck-finish');}});
  expect(floorOwners).toBeGreaterThan(0);disposeModel(root);
 });
 it('retains the shielding material budget and a dry nonemissive ceramic finish',()=>{
  const root=containmentAnnulusBlockout(ROOM_TEMPLATES['containment-annulus']);let triangles=0;
  const materials=new Set<T.MeshStandardMaterial>();root.traverse(object=>{if(object instanceof T.Mesh){materials.add(object.material as T.MeshStandardMaterial);triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3;}});
  expect(materials.size).toBe(8);expect(root.children.length).toBe(8);expect(triangles).toBeLessThan(30000);
  for(const material of materials)if(material.name.startsWith('annulus-ceramic')){
   expect(material.emissive.getHex()).toBe(0);expect(material.metalness).toBeLessThan(.1);expect(material.roughness).toBeGreaterThan(.8);
  }
  disposeModel(root);
 });
});
