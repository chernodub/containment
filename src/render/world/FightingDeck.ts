import {paintFixtureShadow} from './ArenaFixtures';
import {paintRoomFunction} from './RoomFunctionMarks';
import type {Point,RoomTemplate} from '../../game/roguelike/types';
import {shipInteriorFurnishings} from '../../game/roguelike/shipInteriorFurnishings';
import {roomValueProfile} from '../lighting/RoomValueStandard';

/** Keep albedo, wet reflections and contact paint on supported deck. */
export function clipFightingDeck(c:CanvasRenderingContext2D,room:RoomTemplate){
  const hull=new Path2D();
  for(const ring of [room.boundary,...room.voids??[]]){
    if(!ring?.length)continue;
    hull.moveTo(ring[0].x,ring[0].y);
    for(const p of ring.slice(1))hull.lineTo(p.x,p.y);
    hull.closePath();
  }
  if(!room.boundary)hull.rect(0,0,room.width,room.height);
  c.clip(hull,'evenodd');
  for(const r of [...room.obstacles,...room.incidentObstacles??[],...shipInteriorFurnishings(room).flatMap(f=>f.colliders)]){
    const solids=new Path2D();solids.rect(0,0,room.width,room.height);
    solids.moveTo(r.x,r.y);solids.lineTo(r.x,r.y+r.height);
    solids.lineTo(r.x+r.width,r.y+r.height);solids.lineTo(r.x+r.width,r.y);solids.closePath();
    c.clip(solids,'evenodd');
  }
}

const wetContour=()=>new Path2D('M-37 0 Q-35 -8 -15 -6 Q-2 -12 7 -7 Q34 -9 38 -1 Q34 4 14 3 Q0 10 -19 5 Q-39 8 -37 0Z');

export function paintDeckWetMask(c:CanvasRenderingContext2D,arena:Point){
  c.save();c.translate(arena.x-64,arena.y+29);
  c.globalCompositeOperation='destination-out';c.fillStyle='rgba(0,0,0,.78)';
  c.fill(wetContour());c.restore();
}

export function paintFightingDeck(c:CanvasRenderingContext2D,room:RoomTemplate,arena:Point){
  const profile=roomValueProfile(room.id);
  if(!profile?.landmark)return;
  c.save();clipFightingDeck(c,room);c.globalCompositeOperation='source-over';
  const rgb=profile.tint, seed=[...room.id].reduce((a,b)=>a+b.charCodeAt(0),0);
  const tint=(gain:number,alpha:number)=>'rgba('+[16,8,0].map(s=>Math.round(((rgb>>s)&255)*gain)).join(',')+','+alpha+')';
  const width=93+seed%68,depth=58+seed%39;
  for(let row=-1;row*depth<room.height;row++)for(let col=-1;col*width<room.width;col++){
    const x=col*width+(row%2)*width*.48,y=row*depth;
    const variation=(Math.abs(row*11+col*7+seed)%5)*.026;
    c.fillStyle=tint(.43+variation,.54);c.fillRect(x+2,y+2,width-3,depth-3);
    c.fillStyle='rgba(13,23,27,.50)';c.fillRect(x,y,width,2);c.fillRect(x,y,2,depth);
    c.fillStyle=tint(.72,.53);c.fillRect(x+3,y+2,width-6,2.5);
  }
  // A trimmed drainage grate interrupts the plate seams along the fighting lane.
  c.save();c.translate(arena.x,arena.y);c.rotate((seed%7-3)*.14);
  c.fillStyle='#556263';c.fillRect(-159,32,318,43);
  c.fillStyle='#202c31';c.fillRect(-156,35,312,37);
  c.fillStyle='#515c5c';
  for(let x=-150;x<154;x+=10)c.fillRect(x,36,3,35);
  c.fillRect(-156,52,312,3);c.restore();
  paintRoomFunction(c,room,arena);
  paintFixtureShadow(c,room,arena,profile.perimeter.inner*32);
  c.restore();
}
