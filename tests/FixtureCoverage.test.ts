import {expect,it} from 'vitest';
import * as T from 'three';
import {SceneLighting} from '../src/render/SceneLighting';

it('spends the practical budget on the real deck rather than its rectangular camera envelope',()=>{
 const room=new T.Group();room.position.set(40,0,20);
 room.userData.lightingBoundary=[{x:6,y:6},{x:12,y:6},{x:12,y:14},{x:6,y:14}];
 room.userData.lightFixtures=[{x:.32,y:1.5,z:10,color:0xffb65f},{x:8,y:2.3,z:10,color:0xffb65f},{x:10,y:2.3,z:12,color:0xffb65f}];
 const lighting=new SceneLighting();lighting.loadRoom(room,24,18,'habitation');lighting.setPlayer(48,30,0);
 const active=lighting.fixtures.filter(light=>light.intensity>0);expect(active).toHaveLength(2);
 expect(active.map(light=>light.position.x).sort()).toEqual([48,50]);lighting.dispose();
});

it('prefers light pools in the actual camera over distant fixtures behind the view',()=>{
 const room=new T.Group();room.userData.lightFixtures=[{x:0,z:0},{x:3,z:0},{x:-3,z:0},{x:0,z:3},{x:0,z:12}].map(p=>({...p,y:2,color:0xe8f1ff}));
 const camera=new T.OrthographicCamera(-5,5,4,-4,.1,100);camera.position.set(0,10,0);camera.up.set(0,0,-1);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const lighting=new SceneLighting();lighting.loadRoom(room,20,20,'security');lighting.setPlayer(0,0,0,camera);
 expect(lighting.fixtures.filter(light=>light.intensity>0)).toHaveLength(4);
 expect(lighting.fixtures.every(light=>Math.abs(light.position.z)<=3)).toBe(true);lighting.dispose();
});
