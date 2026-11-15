import type {Point,Rect,RoomTemplate} from './types';

/** Transient room topology; no checkpoint schema or encounter values. */
export type ShipRoomTopology=Pick<RoomTemplate,'boundary'|'voids'|'spawn'|'exit'|'breaches'|'obstacles'> & Partial<Pick<RoomTemplate,'width'|'height'>>;
export const point=(x:number,y:number):Point=>Object.freeze({x,y});
export const polygon=(pairs:readonly (readonly [number,number])[]):readonly Point[]=>Object.freeze(pairs.map(([x,y])=>point(x,y)));
export const rectangles=(rows:readonly (readonly [number,number,number,number])[]):readonly Rect[]=>Object.freeze(rows.map(([x,y,width,height])=>Object.freeze({x,y,width,height})));
export const partition=(x:number,y:number,w:number,h:number)=>polygon([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
/** Freeze every nested coordinate so construction cannot mutate simulation inputs. */
export function defineShipRoom(t:ShipRoomTopology):ShipRoomTopology {
 return Object.freeze({...t,spawn:point(t.spawn.x,t.spawn.y),exit:point(t.exit.x,t.exit.y),
  breaches:Object.freeze(t.breaches.map(p=>point(p.x,p.y))),
  obstacles:Object.freeze(t.obstacles.map(r=>Object.freeze({...r}))),
  ...t.boundary?{boundary:Object.freeze(t.boundary.map(p=>point(p.x,p.y)))}:{},
  ...t.voids?{voids:Object.freeze(t.voids.map(p=>Object.freeze(p.map(v=>point(v.x,v.y)))))}:{},
 });
}
