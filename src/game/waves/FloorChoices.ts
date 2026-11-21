import type {Point} from '../roguelike/types';
import {canOccupyExpedition,type ExpeditionGeometry} from '../world/expeditionGeometry';

export function floorChoicePair(geometry:ExpeditionGeometry,from:Point,reachable:(point:Point)=>boolean,min:number,max:number,heading?:number):Point[] {
 const choices:Point[]=[];
 for(let distance=min;distance<=max;distance+=32){
  for(let i=0;i<24;i++){
   const angle=heading===undefined?i*Math.PI/12:heading+(i%2?-1:1)*(Math.PI/6+Math.floor(i/2)*Math.PI/12);
   if(heading!==undefined&&Math.cos(angle-heading)<0)continue;
   const point={x:from.x+Math.cos(angle)*distance,y:from.y+Math.sin(angle)*distance};
   if(!canOccupyExpedition(geometry,point,24)||!reachable(point))continue;
   if(choices.length&&Math.hypot(point.x-choices[0].x,point.y-choices[0].y)<min*1.35)continue;
   choices.push(point);
   if(choices.length===2)return choices;
  }
 }
 return choices;
}
