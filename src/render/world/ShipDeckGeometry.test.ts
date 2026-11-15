import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {shipDeckGeometry,shipDeckPolygons} from './ShipDeckGeometry';
import {clearPolygonTopology} from '../../game/world/polygonGeometry';
const rect=(x:number,y:number,w:number,h:number)=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
describe('exact union of authored sealed deck cutouts',()=>{
 it('subtracts overlapping and hull-attached voids once, retaining exact floor rays and elevation',()=>{
  const t={width:400,height:320,boundary:rect(0,0,400,320),voids:[rect(80,60,160,160),rect(160,140,160,160),rect(0,100,100,40)]};
  const g=shipDeckGeometry(t,.44,-.02),p=g.getAttribute('position'),n=g.getAttribute('normal');let topArea=0;
  for(let i=0;i<p.count;i+=3){
   for(let j=0;j<3;j++)expect(Math.hypot(n.getX(i+j),n.getY(i+j),n.getZ(i+j))).toBeCloseTo(1,5);
   if(![0,1,2].every(j=>Math.abs(p.getY(i+j)+.02)<1e-5))continue;
   const q={x:(p.getX(i)+p.getX(i+1)+p.getX(i+2))*32/3,y:(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))*32/3};
   expect(clearPolygonTopology(t,q,q,0)).toBe(true);
   topArea+=Math.abs((p.getX(i+1)-p.getX(i))*(p.getZ(i+2)-p.getZ(i))-(p.getZ(i+1)-p.getZ(i))*(p.getX(i+2)-p.getX(i)))*32*32/2;
  }
  // 128000 - (25600+25600-6400) - (4000-800) =80000.
  expect(topArea).toBeCloseTo(80000,2);
  const mesh=new T.Mesh(g,new T.MeshBasicMaterial());mesh.updateMatrixWorld(true);
  for(let y=7;y<320;y+=13)for(let x=7;x<400;x+=13){const q={x,y},hits=new T.Raycaster(new T.Vector3(x/32,2,y/32),new T.Vector3(0,-1,0)).intersectObject(mesh);expect(hits.length>0).toBe(clearPolygonTopology(t,q,q,0));if(hits.length)expect(hits[0].point.y).toBeCloseTo(-.02,5);}
  g.computeBoundingBox();expect(g.boundingBox!.min.y).toBeCloseTo(-.46,5);expect(g.boundingBox!.max.y).toBeCloseTo(-.02,5);g.dispose();(mesh.material as T.Material).dispose();
 });
 it('is independent of cutout order and never mutates source polygons',()=>{
  const t={width:300,height:200,boundary:[{x:0,y:0},{x:300,y:0},{x:300,y:200},{x:180,y:200},{x:180,y:140},{x:0,y:140}],voids:[rect(80,20,100,80),rect(140,60,120,100)]};
  const before=JSON.stringify(t),measure=(p:readonly (readonly {x:number;y:number}[])[])=>p.reduce((sum,poly)=>sum+Math.abs(poly.reduce((s,a,i)=>{const b=poly[(i+1)%poly.length];return s+a.x*b.y-b.x*a.y;},0))/2,0);
  expect(measure(shipDeckPolygons(t))).toBeCloseTo(measure(shipDeckPolygons({...t,voids:[...t.voids].reverse()})),5);expect(JSON.stringify(t)).toBe(before);
 });
});
