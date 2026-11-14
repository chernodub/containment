import {expect,it} from 'vitest';
import {queenDesign} from './QueenDesign';

it('defines a directional boss head, two segmented opening wings and six substantial contact supports',()=>{
  const parts=queenDesign(1,1),shell=parts.filter(p=>p.role===5),head=parts.filter(p=>p.joint==='head');
  expect(shell).toHaveLength(6);
  expect(new Set(shell.map(p=>p.anchor?.join('/'))).size).toBe(2);
  expect(shell.every(p=>p.anchor&&p.fitted===false)).toBe(true);
  expect(head.some(p=>p.role===12&&p.position[2]>.3)).toBe(true);
  expect(head.filter(p=>p.role===10)).toHaveLength(2);
  expect(parts.filter(p=>p.end&&p.joint&&p.scale[0]>=.05)).toHaveLength(12);
  expect(new Set(parts.filter(p=>p.end&&p.joint).map(p=>p.joint)).size).toBe(8);
  expect(parts.some(p=>p.role===7&&p.position[2]<-.2)).toBe(true);
});

it('frames an exposed contractile target with an open sternum instead of a continuous circular cup',()=>{
  const parts=queenDesign(1,1),core=parts.filter(p=>p.role===3),collar=parts.filter(p=>p.role===8),walls=parts.filter(p=>p.role===9);
  expect(core).toHaveLength(2);
  expect(new Set(parts.filter(p=>p.role===3||p.role===17||p.role===18).map(p=>p.anchor?.join('/'))).size).toBe(1);
  expect(parts.filter(p=>p.role===17)).toHaveLength(1);
  expect(parts.filter(p=>p.role===18)).toHaveLength(1);
  expect(core[0].shape).toBe('sac');
  expect(core[0].scale[1]).toBeGreaterThan(.1);
  expect(collar).toHaveLength(4);expect(walls).toHaveLength(2);
  expect(parts.every(p=>p.shape!=='rim'&&p.shape!=='cavity')).toBe(true);
  expect(collar.every(p=>p.end&&p.position[0]*p.end[0]>0)).toBe(true);
  expect(collar.every(p=>Math.abs(p.position[0])>Math.abs(p.end![0]))).toBe(true);
  expect(collar.every(p=>p.end![1]>p.position[1])).toBe(true);
});

it('keeps normalized authored masses and limb endpoints within a bounded radial envelope',()=>{
  for(const span of [.6,1,4.5])for(const height of [.3,1,5.8]) {
    const parts=queenDesign(span,height);
    expect(parts.length).toBeLessThan(45);
    for(const p of parts) {
      expect(p.position.every(Number.isFinite)&&p.scale.every(v=>Number.isFinite(v)&&v>0)).toBe(true);
      for(const point of p.end?[p.position,p.end]:[p.position]) {
        const x=Math.abs(point[0])+p.scale[0],z=Math.abs(point[2])+p.scale[2];
        expect(Math.hypot(x,z)).toBeLessThan(span*.58);
      }
    }
  }
});
