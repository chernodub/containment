import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const source=readFileSync(new URL('../src/render/DepthRenderer.ts',import.meta.url),'utf8');
const frame=source.slice(source.indexOf(' render(game:DepthGame'),source.indexOf(' private captureRoomReflections'));
describe('integrated world, actor and ability frame ownership',()=>{
 it('samples the shot socket from the final posed body and emits before updating particles',()=>{
  const stages=['this.player.animate(', 'model.animate(', 'this.interimAbilities.update(', 'this.player.syncWeaponPose?.()', 'const socket=this.player.muzzleWorld!', 'this.effects.shot(', 'this.effects.update(', 'this.post.render('];
  const offsets=stages.map(stage=>frame.indexOf(stage));
  expect(offsets.every(n=>n>=0)).toBe(true);
  expect(offsets).toEqual([...offsets].sort((a,b)=>a-b));
 });
 it('ages shared lights before refreshing status, ability and projectile sources',()=>{
  const age=frame.indexOf('this.lighting.update(dt)');
  expect(age).toBeGreaterThan(0);
  for(const stage of ['this.lighting.pool.attach(e.id,light)','this.interimAbilities.update(', 'this.lighting.pool.attach(id,light)'])expect(frame.indexOf(stage)).toBeGreaterThan(age);
 });
});
