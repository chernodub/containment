import type {Point} from '../roguelike/types';

type Polygon=readonly Point[];
type Voids=readonly Polygon[];
const cache=new WeakMap<Voids,Voids>();
const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const area=(p:Polygon)=>p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a.x*b.y-b.x*a.y;},0)/2;
const same=(a:Point,b:Point)=>a.x===b.x&&a.y===b.y;

function clean(input:Polygon):Point[]{
 const p=input.filter((v,i)=>!same(v,input[(i+input.length-1)%input.length]));
 let changed=true;
 while(changed&&p.length>=3){changed=false;for(let i=0;i<p.length;i++){
  const a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length];
  // Remove straight continuation only, never a retraced bridge between lobes.
  if(cross(a,b,c)===0&&(b.x-a.x)*(c.x-b.x)+(b.y-a.y)*(c.y-b.y)>=0){p.splice(i,1);changed=true;break;}
 }}
 return p.length>=3&&area(p)!==0?p:[];
}
function convex(p:Polygon):boolean{
 let sign=0;for(let i=0;i<p.length;i++){const c=cross(p[i],p[(i+1)%p.length],p[(i+2)%p.length]);if(c){if(sign&&Math.sign(c)!==sign)return false;sign=Math.sign(c);}}
 return !!sign;
}
const on=(p:Point,a:Point,b:Point)=>cross(a,b,p)===0&&p.x>=Math.min(a.x,b.x)&&p.x<=Math.max(a.x,b.x)&&p.y>=Math.min(a.y,b.y)&&p.y<=Math.max(a.y,b.y);
function intersects(a:Point,b:Point,c:Point,d:Point):boolean{
 const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);
 return x*y<0&&z*w<0||on(c,a,b)||on(d,a,b)||on(a,c,d)||on(b,c,d);
}
function simple(p:Polygon):boolean{
 for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){
  if(j===i+1||i===0&&j===p.length-1)continue;
  if(intersects(p[i],p[(i+1)%p.length],p[j],p[(j+1)%p.length]))return false;
 }return true;
}
function bounds(p:Polygon){return {left:Math.min(...p.map(v=>v.x)),right:Math.max(...p.map(v=>v.x)),top:Math.min(...p.map(v=>v.y)),bottom:Math.max(...p.map(v=>v.y))};}
/** Analytic Sutherland–Hodgman clipping, never a raster or AABB intersection. */
function clip(subject:Polygon,cutter:Polygon):Point[]{
 const sign=Math.sign(area(cutter));let result=[...subject];
 for(let i=0;i<cutter.length&&result.length;i++){
  const a=cutter[i],b=cutter[(i+1)%cutter.length],next:Point[]=[];
  for(let j=0;j<result.length;j++){
   const p=result[j],q=result[(j+1)%result.length],dp=cross(a,b,p)*sign,dq=cross(a,b,q)*sign,ip=dp>=0,iq=dq>=0;
   if(ip)next.push(p);
   if(ip!==iq){const t=dp/(dp-dq),r={x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t};
    // Axis-aligned native edges retain their exact authored coordinate.
    if(a.x===b.x)r.x=a.x;if(a.y===b.y)r.y=a.y;next.push(r);
   }
  }result=clean(next);
 }return clean(result);
}
function triangles(input:Polygon):Polygon[]{
 const p=clean(input);if(area(p)<0)p.reverse();if(!simple(p))throw Error('Cannot project a nonsimple void silhouette.');
 const output:Polygon[]=[];
 while(p.length>3){let ear=false;for(let i=0;i<p.length;i++){
  const ai=(i+p.length-1)%p.length,ci=(i+1)%p.length,a=p[ai],b=p[i],c=p[ci];if(cross(a,b,c)<=0)continue;
  if(p.some((v,j)=>j!==ai&&j!==i&&j!==ci&&cross(a,b,v)>=0&&cross(b,c,v)>=0&&cross(c,a,v)>=0))continue;
  output.push([a,b,c]);p.splice(i,1);ear=true;break;
 }if(!ear)throw Error('Cannot triangulate void silhouette without changing its boundary.');}
 if(p.length===3)output.push(p);return output;
}
function intersection(a:Polygon,b:Polygon,parts:Map<Polygon,Polygon[]>):Polygon[]{
 const aa=bounds(a),bb=bounds(b);
 // Bounds are rejection only. Every retained area is a polygon intersection.
 if(aa.right<=bb.left||bb.right<=aa.left||aa.bottom<=bb.top||bb.bottom<=aa.top)return [];
 const ac=convex(a),bc=convex(b);
 if(ac||bc){const result=bc?clip(a,b):clip(b,a);
  // A clipped concave subject may have disconnected lobes joined by retraced
  // clip-edge bridges. Only a simple convex result may take this fast path.
  if(!result.length)return [];
  if(convex(result)&&simple(result))return [result];
 }
 const split=(p:Polygon)=>{let value=parts.get(p);if(!value){value=convex(p)?[p]:triangles(p);parts.set(p,value);}return value;};
 const result:Polygon[]=[];for(const x of split(a))for(const y of split(b)){const p=clip(x,y);if(p.length)result.push(p);}return result;
}

/** Keep native voids first and append exact intersection parity compensation.
 * SVG evenodd then represents their UNION: for k overlapping originals, the
 * 2^k−1 nonempty subset intersections have odd parity. Convex pieces partition
 * disconnected intersections; no convex hull or artificial bridge is inserted.
 * Every new polygon is a subset of originals, so native collision stays exact.
 * Disjoint inputs retain their original array and polygon references. */
export function paritySafeVoids(voids:Voids|undefined):Voids|undefined{
 if(!voids||voids.length<2)return voids;
 const immutable=Object.isFrozen(voids)&&voids.every(p=>Object.isFrozen(p)&&p.every(Object.isFrozen));
 const saved=immutable?cache.get(voids):undefined;if(saved)return saved;
 const extra:Polygon[]=[],parts=new Map<Polygon,Polygon[]>();
 const visit=(pieces:Voids,start:number)=>{for(let j=start;j<voids.length;j++){
  const next=pieces.flatMap(p=>intersection(p,voids[j],parts));if(!next.length)continue;
  extra.push(...next);visit(next,j+1);
 }};
 for(let i=0;i<voids.length-1;i++)visit([voids[i]],i+1);
 const result=extra.length?Object.freeze([...voids,...extra.map(p=>Object.freeze(p.map(v=>Object.freeze({...v}))))]):voids;
 if(immutable)cache.set(voids,result);return result;
}
