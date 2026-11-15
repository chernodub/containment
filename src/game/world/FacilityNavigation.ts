import { circleBlocked, facilityBlockers, clearRectSweep } from './facilityGeometry';
import type { FacilityPoint, FacilityRect } from './facilityLayout';
import {clearPolygonTopology,type PolygonTopology} from './polygonGeometry';
const CELL=32,COLS=80,ROWS=45,COUNT=COLS*ROWS;
export type NavigationGeometry = Readonly<{bounds:FacilityRect;blockers:readonly FacilityRect[]}> & PolygonTopology;
// Grid centers are private immutable inputs to clearance probes. Public waypoint
// results are copied below so callers never receive the shared coordinate table.
const points:readonly FacilityPoint[]=Object.freeze(Array.from({length:COUNT},(_,id)=>Object.freeze({x:(id%COLS+.5)*CELL,y:(Math.floor(id/COLS)+.5)*CELL})));
const point=(id:number):FacilityPoint=>points[id];
const index=(p:FacilityPoint)=>Math.max(0,Math.min(ROWS-1,Math.floor(p.y/CELL)))*COLS+Math.max(0,Math.min(COLS-1,Math.floor(p.x/CELL)));
const adjacency=Array.from({length:COUNT},(_,id)=>[id%COLS>0?id-1:-1,id%COLS<COLS-1?id+1:-1,id>=COLS?id-COLS:-1,id<COUNT-COLS?id+COLS:-1].filter(i=>i>=0));
const neighbors=(id:number)=>adjacency[id];
/** A shared reverse BFS amortizes route finding across the horde. Local steering
 * still handles other enemies. Clearance covers the largest standard enemy. */
export class FacilityNavigation {
  constructor(private readonly geometry?:NavigationGeometry,private readonly clearance=30) {}
  private wider=new Map<number,FacilityNavigation>();
  private commitments=new WeakMap<object,{wave:number;goal:FacilityPoint;point:FacilityPoint;sample:FacilityPoint;decision?:number;bestRemaining:number;stalled:number}>();
  private wave=-1;private goal=-1;private playerCell=-1;private walls:readonly FacilityRect[]=[];
  private walkable=new Uint8Array(COUNT);private distance=new Int32Array(COUNT);private queue=new Int32Array(COUNT);private expanded=new Map<number,readonly FacilityRect[]>();
  private clear(a:FacilityPoint,b:FacilityPoint,radius:number):boolean {
    if(this.geometry&&!clearPolygonTopology(this.geometry,a,b,radius))return false;
    let walls=this.expanded.get(radius);if(!walls){walls=this.walls.map(r=>({x:r.x-radius,y:r.y-radius,width:r.width+radius*2,height:r.height+radius*2}));this.expanded.set(radius,walls);}
    for(let i=0;i<walls.length;i++){const r=walls[i];if(Math.max(a.x,b.x)<r.x||Math.min(a.x,b.x)>r.x+r.width||Math.max(a.y,b.y)<r.y||Math.min(a.y,b.y)>r.y+r.height)continue;if(!clearRectSweep(a,b,radius,this.walls[i]))return false;}return true;
  }
  private closest(p:FacilityPoint,reachable=false,radius=12):number {
    const center=index(p);let best=-1,score=Infinity;
    for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++){
      const col=center%COLS+x,row=Math.floor(center/COLS)+y;if(col<0||col>=COLS||row<0||row>=ROWS)continue;
      const id=row*COLS+col;if(!this.walkable[id]||(reachable&&this.distance[id]<0))continue;
      const q=point(id),d=(p.x-q.x)**2+(p.y-q.y)**2;
      if(d<score&&this.clear(p,q,radius)){score=d;best=id;}
    }return best;
  }
  prepare(player:FacilityPoint,wave:number):void {
    const cell=index(player);if(wave===this.wave&&cell===this.playerCell)return;this.playerCell=cell;
    if(wave!==this.wave){this.expanded.clear();this.wave=wave;this.goal=-1;this.walls=this.geometry?.blockers ?? facilityBlockers(wave);for(let i=0;i<COUNT;i++){const p=point(i),b=this.geometry?.bounds;const inside=b?p.x>=b.x+this.clearance&&p.y>=b.y+this.clearance&&p.x<=b.x+b.width-this.clearance&&p.y<=b.y+b.height-this.clearance:!circleBlocked(p,this.clearance,[]);this.walkable[i]=inside&&this.clear(p,p,this.clearance)?1:0;}}
    const goal=this.closest(player);if(goal===this.goal)return;this.goal=goal;this.distance.fill(-1);if(goal<0)return;
    const queue=this.queue;let head=0,tail=1;queue[0]=goal;this.distance[goal]=0;
    while(head<tail){const current=queue[head++]!;for(const next of neighbors(current)){if(!this.walkable[next]||this.distance[next]>=0)continue;this.distance[next]=this.distance[current]!+1;queue[tail++]=next;}}
  }
  waypoint(enemy:FacilityPoint & {radius:number;decisionVersion?:number},player:FacilityPoint,wave:number):FacilityPoint|null {
    // Preserve the shared standard-enemy grid; wider probes need cells that
    // their own body can reach. Bound the cache when callers vary radii.
    if(enemy.radius+2>this.clearance){
      const clearance=Math.ceil(enemy.radius+2);let nav=this.wider.get(clearance);
      if(!nav){if(this.wider.size>=4)this.wider.delete(this.wider.keys().next().value!);nav=new FacilityNavigation(this.geometry,clearance);this.wider.set(clearance,nav);}
      return nav.waypoint(enemy,player,wave);
    }
    this.prepare(player,wave);
    if(this.clear(enemy,player,enemy.radius+2)){this.commitments.delete(enemy);return null;}
    // Commit to a visible, swept-clear leg while a nearby moving goal jitters
    // across BFS cells. Otherwise optional flanks can alternate homotopy every
    // decision and never round a perfectly passable bulkhead corner.
    const committed=this.commitments.get(enemy);
    if(committed&&committed.wave===wave&&Math.hypot(player.x-committed.goal.x,player.y-committed.goal.y)<64
      &&Math.hypot(enemy.x-committed.point.x,enemy.y-committed.point.y)>8&&this.clear(enemy,committed.point,enemy.radius+2)){
      // Native decisionVersion advances once per actor decision, including a
      // stationary body. Optional firing probes in that decision count once.
      // Plain geometry callers without versions use distinct body positions.
      const decision=Number.isFinite(enemy.decisionVersion)?enemy.decisionVersion:undefined;
      const observed=decision!==undefined?decision!==committed.decision:enemy.x!==committed.sample.x||enemy.y!==committed.sample.y;
      if(observed){
        const remaining=Math.hypot(enemy.x-committed.point.x,enemy.y-committed.point.y);
        if(remaining<=committed.bestRemaining-1){committed.bestRemaining=remaining;committed.stalled=0;}else committed.stalled++;
        committed.sample={x:enemy.x,y:enemy.y};committed.decision=decision;
      }
      // Eight distinct decisions without one unit of net improvement are
      // deterministic evidence that this cached leg is no longer useful.
      if(committed.stalled<8)return {...committed.point};
    }
    this.commitments.delete(enemy);
    let current=this.closest(enemy,true,this.clearance>30?enemy.radius+2:enemy.radius);if(current<0)return enemy;
    let target=point(current);
    for(let n=0;n<7;n++){
      let next:number|undefined,best=this.distance[current];for(const candidate of neighbors(current)){const d=this.distance[candidate];if(d>=0&&d<best){next=candidate;best=d;}}
      if(next===undefined)break;
      const candidate=point(next);if(!this.clear(enemy,candidate,enemy.radius+2))break;
      current=next;target=candidate;
    }
    const remaining=Math.hypot(target.x-enemy.x,target.y-enemy.y);
    if(remaining>8)this.commitments.set(enemy,{wave,goal:{x:player.x,y:player.y},point:{x:target.x,y:target.y},sample:{x:enemy.x,y:enemy.y},decision:Number.isFinite(enemy.decisionVersion)?enemy.decisionVersion:undefined,bestRemaining:remaining,stalled:0});
    return {x:target.x,y:target.y};
  }
  reachable(p:FacilityPoint):boolean {return this.closest(p,true)>=0;}
}
