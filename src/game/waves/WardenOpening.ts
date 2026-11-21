import {BOSS_BODIES} from '../enemies/bossDefinitions';
import {ENEMY_ATTACK_SHAPES} from '../enemies/attackShapes';
import {canOccupyExpedition,canTraverseExpedition,type ExpeditionGeometry} from '../world/expeditionGeometry';
import type {Point} from '../roguelike/types';

const radius=BOSS_BODIES.warden.radius;
const reach=ENEMY_ATTACK_SHAPES.chargeSpeed*ENEMY_ATTACK_SHAPES.chargeDurationMs/1000;
const angles=[0,.22,-.22,.44,-.44];

export function wardenOpeningAim(geometry:ExpeditionGeometry,warden:Point,marine:Point):Point|undefined {
 const base=Math.atan2(marine.y-warden.y,marine.x-warden.x);
 const distance=Math.min(160,Math.hypot(marine.x-warden.x,marine.y-warden.y));
 for(const offset of angles){
  const angle=base+offset,dx=Math.cos(angle),dy=Math.sin(angle);
  const aim={x:warden.x+dx*distance,y:warden.y+dy*distance};
  const end={x:warden.x+dx*(reach-8),y:warden.y+dy*(reach-8)};
  if(Math.hypot(end.x-marine.x,end.y-marine.y)>320||!canTraverseExpedition(geometry,warden,aim,radius))continue;
  if(!canTraverseExpedition(geometry,aim,end,radius))return aim;
 }
}

export function wardenOpeningSpawn(geometry:ExpeditionGeometry,marine:Point,heading:number,occupied:readonly (Point&{radius:number})[]):Point|undefined {
 for(const offset of [0,1,-1,2,-2,3,-3,4,-4,5,-5,6,-6,7,-7,8]){
  const angle=heading+offset*Math.PI/8;
  const point={x:marine.x+Math.cos(angle)*142,y:marine.y+Math.sin(angle)*142};
  if(canOccupyExpedition(geometry,point,radius)&&occupied.every(e=>Math.hypot(e.x-point.x,e.y-point.y)>e.radius+radius)
    &&wardenOpeningAim(geometry,point,marine))return point;
 }
}
