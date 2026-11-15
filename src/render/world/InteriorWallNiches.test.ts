import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {cutInteriorWallNiches} from './InteriorWallNiches';

describe('presentation service niches',()=>{
  it('opens only the declared upper recess and preserves outer wall, foot and attributes',()=>{
    const source=new T.BoxGeometry(5,.9,.7).translate(0,.45,0),dispose=vi.spyOn(source,'dispose');
    const niche={x:0,z:0,angle:0,scale:1},out=cutInteriorWallNiches(source,[niche]);
    expect(dispose).not.toHaveBeenCalled();
    expect(Object.keys(out.attributes).sort()).toEqual(Object.keys(source.attributes).sort());
    const ray=new T.Raycaster(new T.Vector3(0,2,0),new T.Vector3(0,-1,0));
    const m=new T.MeshBasicMaterial({side:T.DoubleSide}),mesh=new T.Mesh(out,m);
    expect(ray.intersectObject(mesh)[0].point.y).toBeCloseTo(0,5);
    ray.set(new T.Vector3(2.4,2,0),new T.Vector3(0,-1,0));
    expect(ray.intersectObject(mesh)[0].point.y).toBeCloseTo(.9,5);
    const p=out.getAttribute('position');
    for(let i=0;i<p.count;i++)expect([p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite)).toBe(true);
    source.dispose();out.dispose();m.dispose();
  });
  it('supports rotated niches without moving the original wall footprint',()=>{
    const source=new T.BoxGeometry(.7,.9,5).translate(3,.45,7),out=cutInteriorWallNiches(source,[{x:3,z:7,angle:Math.PI/2,scale:1}]);
    source.computeBoundingBox();expect(out.boundingBox!.min.distanceTo(source.boundingBox!.min)).toBeLessThan(1e-5);expect(out.boundingBox!.max.distanceTo(source.boundingBox!.max)).toBeLessThan(1e-5);
    source.dispose();out.dispose();
  });
});
