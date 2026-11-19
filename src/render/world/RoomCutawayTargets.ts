import type {DepthGame} from '../../DepthGame';
import type {HostilePrioritySource} from '../abilities/PriorityMask';
import type {Telegraph} from '../vfx/TelegraphBatch';

/** Reuse native-room coordinates for both projection-based cutaway owners. */
export class RoomCutawayTargets {
  readonly bodies:{x:number;y:number;radius:number}[]=[];
  count=0;

  private add(x:number,y:number,radius:number):void {
    const body=this.bodies[this.count]??(this.bodies[this.count]={x,y,radius});
    body.x=x;body.y=y;body.radius=radius;this.count++;
  }
  private readonly warning=(shape:Readonly<Telegraph>)=>{
    if(shape.shape!=='line'&&shape.shape!=='wall'){
      this.add(shape.x*32,shape.z*32,(shape.radius??1)*32);
      return;
    }
    const length=shape.length??1,radius=Math.max(.25,(shape.width??1)*.5),angle=shape.angle??0;
    const steps=Math.max(1,Math.ceil(length/(2*radius)));
    for(let i=0;i<=steps;i++){
      const t=i/steps*length;
      this.add((shape.x+t*Math.cos(angle))*32,(shape.z+t*Math.sin(angle))*32,radius*40);
    }
  };
  update(pickups:ReturnType<DepthGame['pickups']['getSnapshot']>,game:DepthGame,effects:HostilePrioritySource):void {
    this.count=0;
    for(const p of pickups)this.add(p.x,p.y,14);
    for(const p of game.pools)this.add(p.x,p.y,p.radius);
    effects.forEachHostilePriority?.(this.warning);
  }
}
