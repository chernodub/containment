import * as T from 'three';
import {expect,it} from 'vitest';
import {batch,box,disposeModel,MAT} from './meshParts';
import {SceneLighting} from './SceneLighting';

it('preserves exact exit practical origins and selected light energy when merging rigid finishes',()=>{
 const make=()=>{const world=new T.Group(),exit=new T.Group();exit.position.set(34,0,17);world.add(exit);for(const side of [-1,1]){box(exit,0,.7,side*.7,.12,1.4,.18,MAT.steel);box(exit,.08,.7,side*.7,.04,1.05,.05,MAT.cyan,.01);}box(exit,0,1.5,0,.2,.2,1.6,MAT.dark);box(exit,0,.035,0,1.7,.02,1.55,MAT.dark);return{world,exit};};
 const before=make(),after=make(),a=new SceneLighting(),b=new SceneLighting();
 const bounds=new T.Box3().setFromObject(before.exit);batch(after.exit,true);
 try{
  expect(before.exit.children).toHaveLength(6);expect(after.exit.children).toHaveLength(3);
  const mergedBounds=new T.Box3().setFromObject(after.exit);expect(mergedBounds.min.distanceTo(bounds.min)).toBeLessThan(1e-6);expect(mergedBounds.max.distanceTo(bounds.max)).toBeLessThan(1e-6);
  a.loadRoom(before.world,38,28,'cryogenics','awakening-bay');b.loadRoom(after.world,38,28,'cryogenics','awakening-bay');
  const fixtures=(rig:SceneLighting)=>(rig as unknown as {authoredFixtures:unknown[]}).authoredFixtures;
  expect(fixtures(a)).toHaveLength(2);expect(fixtures(b)).toEqual(fixtures(a));
  a.setPlayer(33,17,0);b.setPlayer(33,17,0);
  const lights=(rig:SceneLighting)=>rig.fixtures.map(l=>({position:l.position.toArray(),energy:l.intensity,color:l.color.getHex()}));
  expect(lights(b)).toEqual(lights(a));
 }finally{a.dispose();b.dispose();disposeModel(before.world);disposeModel(after.world);}
});
