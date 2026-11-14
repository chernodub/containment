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

it('gives every family a segmented armored back, front mask and substantial jointed limbs',()=>{
  const signatures=new Set<string>();
  for(const kind of ['crawler','brute','spitter','stalker','carrier']){
    const parts=familyAnatomy(kind,1,1),front=parts.filter(p=>p.role===12),armor=parts.filter(p=>p.role===4||p.role===11);
    expect(front.length).toBeGreaterThan(0);
    expect(front.every(p=>p.position[2]>.2&&p.scale[0]>=.07)).toBe(true);
    expect(armor.length).toBeGreaterThanOrEqual(3);
    expect(parts.some(p=>p.role===2&&p.scale[0]>=.17)).toBe(true);
    expect(parts.filter(p=>p.end).length).toBeGreaterThanOrEqual(6);
    expect(parts.filter(p=>p.end).every(p=>p.joint&&p.scale[0]>=.04)).toBe(true);
    signatures.add(parts.map(p=>p.shape+'/'+p.role+'/'+p.position.join('/')).join('|'));
  }
  expect(signatures.size).toBe(5);
  const crawler=familyAnatomy('crawler',1,1),brute=familyAnatomy('brute',1,1);
  expect(crawler.filter(p=>p.shape==='carapace')).toHaveLength(3);
  expect(brute.filter(p=>p.shape==='carapace')).toHaveLength(3);
  expect(familyAnatomy('spitter',1,1).some(p=>p.shape==='sac'&&p.position[1]>1)).toBe(true);
  expect(familyAnatomy('stalker',1,1).some(p=>p.shape==='spine'&&p.position[2]<0)).toBe(true);
  expect(familyAnatomy('carrier',1,1).filter(p=>p.shape==='sac')).toHaveLength(1);
});

it('keeps all authored segment endpoints and torso masses within the same radial design envelope',()=>{
  for(const span of [.55,1,2.4])for(const height of [.32,1,2.3])for(const kind of ['crawler','stalker','carrier','brute','spitter']){
    const parts=familyAnatomy(kind,span,height);
    expect(parts.length).toBeLessThan(40);
    for(const part of parts){
      expect(part.fitted).toBe(false);
      const points=part.end?[part.position,part.end]:[part.position];
      for(const p of points){
        const rx=part.end?part.scale[0]:part.scale[0]*1.01;
        const rz=part.end?part.scale[2]:part.scale[2]*1.01;
        expect(Math.hypot(Math.abs(p[0])+rx,Math.abs(p[2])+rz),`${kind}/${part.shape}`).toBeLessThanOrEqual(span*.50);
      }
      expect(part.position.every(Number.isFinite)&&part.scale.every(n=>Number.isFinite(n)&&n>0)).toBe(true);
    }
  }
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
