import type {ExpeditionGeometry} from '../../game/world/expeditionGeometry';
import type {Point} from '../../game/roguelike/types';

/** A service fitting sits on the closest real solid face, aligned with its tangent. */
export function conditionMount(p:Point,geometry:ExpeditionGeometry,unit:number){
 let best=Infinity,mount={x:p.x/unit,z:p.y/unit,a:0};
 const edge=(ax:number,ay:number,bx:number,by:number)=>{
  const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy;
  if(!length)return;
  const t=Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/length));
  const x=ax+t*dx,y=ay+t*dy,d=(x-p.x)**2+(y-p.y)**2;
  if(d<best){best=d;mount={x:x/unit,z:y/unit,a:Math.atan2(-dy,dx)};}
 };
 for(const wall of [geometry.boundary??[],...geometry.voids??[]]){
  wall.forEach((a,i)=>{const b=wall[(i+1)%wall.length];edge(a.x,a.y,b.x,b.y);});
 }
 for(const b of geometry.blockers){
  const l=b.x,r=l+b.width,t=b.y,bt=t+b.height;
  edge(l,t,r,t);edge(r,t,r,bt);edge(r,bt,l,bt);edge(l,bt,l,t);
 }
 return mount;
}
