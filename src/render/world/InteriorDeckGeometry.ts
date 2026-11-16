import * as T from 'three';
import type {Point, RoomTemplate} from '../../game/roguelike/types';
import {shipDeckPolygons} from './ShipDeckGeometry';

const cross = (a: Point, b: Point, p: Point) =>
  (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
const area = (p: readonly Point[]) => p.reduce((n,a,i) => {
  const b=p[(i+1)%p.length]; return n+a.x*b.y-b.x*a.y;
},0)/2;

/** Intersect a convex piece with a convex polygon, at construction time only. */
function clip(subject: readonly Point[], boundary: readonly Point[]): Point[] {
  let result=[...subject]; const sign=area(boundary)>=0?1:-1;
  for(let i=0;i<boundary.length&&result.length;i++) {
    const a=boundary[i],b=boundary[(i+1)%boundary.length],input=result; result=[];
    for(let j=0;j<input.length;j++) {
      const p=input[j],q=input[(j+1)%input.length],dp=cross(a,b,p)*sign,dq=cross(a,b,q)*sign;
      if(dp>=-1e-7)result.push(p);
      if((dp>=-1e-7)!==(dq>=-1e-7)) {
        const f=dp/(dp-dq);result.push({x:p.x+(q.x-p.x)*f,y:p.y+(q.y-p.y)*f});
      }
    }
  }
  return result.length>=3&&Math.abs(area(result))>1e-7?result:[];
}

/** Exact floor chart. Voids AND equipment reservations are removed before zoning. */
export class InteriorDeckChart {
  private readonly deck: readonly (readonly Point[])[];
  readonly positions: number[]=[];
  readonly colors: number[]=[];
  readonly zones: {name:string;triangles:number;area:number}[]=[];
  constructor(template:RoomTemplate) {
    this.deck=shipDeckPolygons({...template,voids:[...template.voids??[],...template.obstacles.map(r=>[
      {x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height},
    ])]});
  }
  polygon(outline:readonly Point[],color:T.Color,y:number,name?:string,exclude:readonly (readonly Point[])[]=[],within?:readonly Point[]):number {
    const domain=within??outline;
    const fields=exclude.length?shipDeckPolygons({width:1,height:1,boundary:domain,voids:exclude}):[domain];
    let count=0,totalArea=0;
    for(const field of fields){
    const tris=T.ShapeUtils.triangulateShape(field.map(p=>new T.Vector2(p.x,p.y)),[]);
    for(const row of tris)for(const deck of this.deck) {
      const piece=clip(deck,row.map(i=>field[i]));
      const cut=within?clip(piece,outline):piece;
      if(!cut.length)continue;
      totalArea+=Math.abs(area(cut));
      // XZ winding faces upward.
      if(area(cut)>0)cut.reverse();
      for(let i=1;i<cut.length-1;i++) {
        if(Math.abs(cross(cut[0],cut[i],cut[i+1]))<1e-5)continue;
        for(const p of [cut[0],cut[i],cut[i+1]]) {
          this.positions.push(p.x/32,y,p.y/32);this.colors.push(color.r,color.g,color.b);count++;
        }
      }
    }
    }
    if(name)this.zones.push({name,triangles:count/3,area:totalArea});
    return count/3;
  }
  strip(a:Point,b:Point,width:number,color:T.Color,y=.018,exclude:readonly (readonly Point[])[]=[],within?:readonly Point[]):void {
    const length=Math.hypot(b.x-a.x,b.y-a.y);if(length<.001)return;
    const nx=-(b.y-a.y)/length*width/2,ny=(b.x-a.x)/length*width/2;
    this.polygon([{x:a.x+nx,y:a.y+ny},{x:b.x+nx,y:b.y+ny},{x:b.x-nx,y:b.y-ny},{x:a.x-nx,y:a.y-ny}],color,y,undefined,exclude,within);
  }
  geometry():T.BufferGeometry {
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(this.positions,3));
    g.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));
    const normals=new Float32Array(this.positions.length);for(let i=1;i<normals.length;i+=3)normals[i]=1;
    g.setAttribute('normal',new T.BufferAttribute(normals,3));
    g.computeBoundingBox();g.computeBoundingSphere();return g;
  }
}
