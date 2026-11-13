import {expect, it} from 'vitest';
import type {ActorPart} from './ActorIdentity';
import {familyAnatomy, rankAnatomy} from './FamilyAnatomy';

/** Conservative bounds include the supported plate/shield bevel and full cone radius. */
function bounds(parts: readonly ActorPart[]) {
  const min = [Infinity,Infinity,Infinity], max = [-Infinity,-Infinity,-Infinity];
  for (const part of parts) for (let axis=0;axis<3;axis++) {
    const gain = part.shape==='shield' ? axis===1?.5:1.12 : part.shape==='plate' && axis===1 ? 1.1 : 1;
    min[axis]=Math.min(min[axis],part.position[axis]-part.scale[axis]*gain);
    max[axis]=Math.max(max[axis],part.position[axis]+part.scale[axis]*gain);
  }
  return {min,max,width:max[0]-min[0],height:max[1]-min[1],length:max[2]-min[2]};
}

it('gives each small family a solid primary body and a defining anatomical silhouette',()=>{
  const crawler=familyAnatomy('crawler',1,1),stalker=familyAnatomy('stalker',1,1),carrier=familyAnatomy('carrier',1,1);
  const shell=bounds(crawler.filter(p=>p.role===0)),mandibles=crawler.filter(p=>p.role===10);
  expect(shell.width).toBeGreaterThanOrEqual(.65);
  expect(shell.height).toBeGreaterThan(.6);
  expect(shell.max[1]).toBeGreaterThan(.9);
  expect(mandibles).toHaveLength(2);
  expect(mandibles[0].position[0]).toBeLessThan(0);expect(mandibles[1].position[0]).toBeGreaterThan(0);
  expect(bounds(mandibles).max[2]).toBeGreaterThan(shell.max[2]+.1);
  for(const part of mandibles)expect(Math.min(...part.scale)).toBeGreaterThanOrEqual(.06);
  const thorax=stalker.find(p=>p.role===0)!,blades=stalker.filter(p=>p.shape==='shield'),stinger=stalker.filter(p=>p.role===10);
  expect(thorax.scale[0]).toBeGreaterThanOrEqual(.2);expect(thorax.scale[1]).toBeGreaterThanOrEqual(.25);
  expect(blades).toHaveLength(2);expect(blades[0].position[0]).toBeLessThan(-thorax.scale[0]);expect(blades[1].position[0]).toBeGreaterThan(thorax.scale[0]);
  expect(stinger).toHaveLength(1);expect(stinger[0].position[2]).toBeLessThan(0);
  expect(bounds(stinger).max[1]).toBeGreaterThan(bounds([thorax]).max[1]+.3);
  expect(stinger[0].scale[0]).toBeGreaterThanOrEqual(.1);
  const egg=carrier.filter(p=>p.shape==='sac');expect(egg).toHaveLength(1);
  expect(egg[0].position[2]).toBeLessThan(0);expect(bounds(egg).max[1]).toBeGreaterThan(1);
  // These shape measurements remain distinct without reading a family palette.
  const signatures=[crawler,stalker,carrier].map(parts=>{const b=bounds(parts);return [b.width,b.height,b.length,...parts.map(p=>p.position[1])].join('/');});
  expect(new Set(signatures).size).toBe(3);
});

it('keeps new torso anatomy inside the conservative radial envelope at any authored scale',()=>{
  for(const span of [.55,1,2.4])for(const height of [.32,1,2.3])for(const kind of ['crawler','stalker','carrier']){
    const parts=familyAnatomy(kind,span,height);
    expect(parts.length).toBeLessThanOrEqual(5);
    for(const part of parts){
      expect(part.fitted).toBe(false);
      const b=bounds([part]);
      const farX=Math.max(Math.abs(b.min[0]),Math.abs(b.max[0]));
      const farZ=Math.max(Math.abs(b.min[2]),Math.abs(b.max[2]));
      expect(Math.hypot(farX,farZ),`${kind}/${part.shape}`).toBeLessThanOrEqual(span*.50);
      expect(part.position.every(Number.isFinite)&&part.scale.every(n=>Number.isFinite(n)&&n>0)).toBe(true);
    }
  }
  expect(familyAnatomy('brute',1,1)).toEqual([]);
  expect(familyAnatomy('spitter',1,1)).toEqual([]);
  expect(familyAnatomy('queen',1,1)).toEqual([]);
});

it('separates elite crest from a taller, wider champion crown using prebuilt role gates',()=>{
  const parts=rankAnatomy(1,1),elite=parts.filter(p=>p.role===1),champion=parts.filter(p=>p.role===6);
  expect(elite).toHaveLength(1);
  expect(champion.filter(p=>p.shape==='spine')).toHaveLength(3);
  expect(bounds(champion).max[1]).toBeGreaterThan(bounds(elite).max[1]+.35);
  expect(bounds(champion).width).toBeGreaterThan(bounds(elite).width*2.5);
  for(const part of parts){
    const b=bounds([part]);
    expect(Math.hypot(Math.max(Math.abs(b.min[0]),Math.abs(b.max[0])),Math.max(Math.abs(b.min[2]),Math.abs(b.max[2])))).toBeLessThan(.43);
    expect(part.fitted).toBe(false);
  }
});
