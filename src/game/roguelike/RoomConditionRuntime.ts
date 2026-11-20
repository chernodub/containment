import {canOccupyExpedition,hasClearExpeditionShot,type ExpeditionGeometry} from '../world/expeditionGeometry';
import type {Point} from './types';
import {BROOD_HATCH_MS,type ShipCondition} from './shipConditions';

export type ConditionZone = Readonly<Point & {radius:number; end?:Point; angle?:number}>;
export function onConditionZone(point:Point,zone:ConditionZone) {
  const dx=(zone.end?.x??zone.x)-zone.x,dy=(zone.end?.y??zone.y)-zone.y;
  const length=dx*dx+dy*dy;
  const fraction=length?Math.max(0,Math.min(1,((point.x-zone.x)*dx+(point.y-zone.y)*dy)/length)):0;
  return (point.x-zone.x-dx*fraction)**2+(point.y-zone.y-dy*fraction)**2<=zone.radius**2;
}

export class RoomConditionRuntime {
  elapsed=0;
  sealedHold=false;
  broodRemaining=BROOD_HATCH_MS;
  readonly zones:ConditionZone[]=[];
  readonly eggs=new Set<number>();
  readonly struck=new Set<number>();
  readonly ambushed=new Set<number>();
  readonly openedAttacks=new Set<number>();
  readonly closedBreaches:string[]=[];
  broodLost=false;
  marineStagger=0;
  private lastConduit=-1;

  constructor(readonly condition:ShipCondition, geometry:ExpeditionGeometry, seed:number) {
    const id=condition.id, spawn=geometry.playerSpawn;
    const distance=(p:Point,q:Point)=>Math.hypot(p.x-q.x,p.y-q.y);
    const nearby=[...geometry.breaches].sort((a,b)=>distance(a,spawn)-distance(b,spawn));
    if(id==='vent'){
      const breach=nearby[seed%Math.min(2,nearby.length)];
      this.zones.push({...breach,radius:76});
      return;
    }
    if(id==='sealed'){
      const breaches=nearby;
      const shutterAngle=(point:Point)=>Math.atan2(point.x-spawn.x,point.y-spawn.y)+Math.PI/2;
      for(let i=0;i<Math.min(2,breaches.length-1);i++){
        const breach=breaches[i];
        this.closedBreaches.push(breach.id);
        this.zones.push({...breach,radius:42,angle:shutterAngle(breach)});
      }
      this.zones.push({...geometry.exitPoint,radius:38,angle:shutterAngle(geometry.exitPoint)});
      return;
    }
    if(id==='dark')return;
    const {width,height}=geometry.bounds;
    const patches:Point[]=[];
    for(let y=64;y<height-32;y+=48)for(let x=64;x<width-32;x+=48){
      const p={x,y};
      if(distance(p,spawn)>80&&canOccupyExpedition(geometry,p,24))patches.push(p);
    }
    patches.sort((a,b)=>distance(a,spawn)-distance(b,spawn));
    const radius=Math.sqrt(width*height*.23/(Math.PI*3));
    if(id==='coolant'){
      const whole=patches.findIndex(p=>canOccupyExpedition(geometry,p,radius));
      if(whole>0)patches.unshift(patches.splice(whole,1)[0]);
    }
    for(const p of patches){
      if(this.zones.some(zone=>distance(p,zone)<(id==='coolant'?radius*1.6:id==='brood'?65:110)))continue;
      if(id==='coolant')this.zones.push({...p,radius});
      if(id==='brood'&&hasClearExpeditionShot(geometry,spawn,p))this.zones.push({...p,radius:15});
      if(id==='conduit'){
        const end=[{x:p.x+270,y:p.y},{x:p.x-270,y:p.y},{x:p.x,y:p.y+270},{x:p.x,y:p.y-270}].find(q=>canOccupyExpedition(geometry,q,20)&&hasClearExpeditionShot(geometry,p,q));
        if(end)this.zones.push({...p,end,radius:16});
      }
      if(this.zones.length===3)break;
    }
  }

  get ventLive(){const t=this.elapsed%12000;return this.elapsed>=12000&&t<2500;}
  get ventWarning(){return this.elapsed%12000>=10500;}
  get conduitLive(){return this.elapsed%4000>=3000;}
  get countdown(){
    switch(this.condition.id){
      case 'vent':return this.ventLive?2500-this.elapsed%12000:12000-this.elapsed%12000;
      case 'conduit':return (this.conduitLive?4000:3000)-this.elapsed%4000;
      case 'brood':return this.eggs.size?this.broodRemaining:0;
      case 'sealed':return Math.max(0,45000-this.elapsed);
      default:return 0;
    }
  }
  advance(ms:number){
    this.elapsed+=ms;
    this.marineStagger=Math.max(0,this.marineStagger-ms);
    const cycle=Math.floor(this.elapsed/4000);
    if(cycle!==this.lastConduit){this.lastConduit=cycle;this.struck.clear();}
  }
  slick(point:Point){return this.condition.id==='coolant'&&this.zones.some(zone=>onConditionZone(point,zone));}
  line(point:Point){return this.zones.some(zone=>onConditionZone(point,zone));}
}
