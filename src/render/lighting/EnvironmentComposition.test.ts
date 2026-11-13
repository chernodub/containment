import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {ENVIRONMENT_COMPOSITION,wallSourceGain} from './EnvironmentComposition';
import {SceneLighting} from '../SceneLighting';
import {addRoomPracticals} from './RoomPracticals';
import {PracticalPools} from './PracticalPools';
import {disposeModel} from '../meshParts';
import type {ShipEnvironment} from '../ShipEnvironments';

describe('environment-specific value composition',()=>{
 it('retains ten distinct bounded source patterns and physically motivated fixed topology',()=>{
  expect(new Set(Object.values(ENVIRONMENT_COMPOSITION).map(x=>JSON.stringify(x))).size).toBe(10);
  for(const env of Object.keys(ENVIRONMENT_COMPOSITION) as ShipEnvironment[]){
   const p=ENVIRONMENT_COMPOSITION[env];expect(p.bounce).toBeGreaterThan(0);expect(p.bounce).toBeLessThanOrEqual(1);expect(p.depth/p.width).toBeGreaterThan(3);
   const world=new T.Group();addRoomPracticals(world,30,24,env);
   for(const [i,f] of world.userData.lightFixtures.entries()){expect(f.gain).toBeGreaterThan(0);expect(f.gain).toBeLessThanOrEqual(wallSourceGain(env,i));}
   const lights=new SceneLighting();lights.loadRoom(world,30,24,env);lights.setPlayer(4,8,0);lights.update(0);expect(lights.fixtures).toHaveLength(4);expect(lights.fixtures.every(f=>f.userData.worldBounceGain===p.bounce)).toBe(true);lights.dispose();disposeModel(world);
  }
 });
 it('dims world bounce without changing hue, actor illumination, draw capacity or idle GPU uploads',()=>{
  const scene=new T.Scene(),pool=new PracticalPools(scene),light=new T.PointLight(0x91d8df,100,6),before=new T.Color(),after=new T.Color();
  light.position.set(1,2,3);pool.update([light],true);pool.root.getColorAt(0,before);light.userData.worldBounceGain=.08;pool.update([light],true);pool.root.getColorAt(0,after);
  expect(after.r/before.r).toBeCloseTo(.08);expect(after.g/before.g).toBeCloseTo(.08);expect(after.b/before.b).toBeCloseTo(.08);expect(light.intensity).toBe(100);expect(pool.root.count).toBe(1);
  const version=pool.root.instanceColor!.version;pool.update([light],true);expect(pool.root.instanceColor!.version).toBe(version);pool.dispose();
 });
});
