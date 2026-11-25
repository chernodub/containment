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
  const solids=new Path2D();
  solids.rect(0,0,room.width,room.height);
  for(const r of [...room.obstacles,...room.incidentObstacles??[],...shipInteriorFurnishings(room).flatMap(f=>f.colliders)]){
    solids.moveTo(r.x,r.y);solids.lineTo(r.x,r.y+r.height);
    solids.lineTo(r.x+r.width,r.y+r.height);solids.lineTo(r.x+r.width,r.y);solids.closePath();
  }
  c.clip(solids,'evenodd');
}

export function paintFightingDeck(c:CanvasRenderingContext2D,room:RoomTemplate,arena:Point){
  const profile=roomValueProfile(room.id);
  if(!profile?.landmark)return;
  c.save();clipFightingDeck(c,room);
  const rgb=profile.tint, seed=[...room.id].reduce((a,b)=>a+b.charCodeAt(0),0);
  const tint=(gain:number,alpha:number)=>'rgba('+[16,8,0].map(s=>Math.round(((rgb>>s)&255)*gain)).join(',')+','+alpha+')';
  const width=105+seed%37,depth=64+seed%23;
  for(let row=-1;row*depth<room.height;row++)for(let col=-1;col*width<room.width;col++){
    const x=col*width+(row%2)*width*.48,y=row*depth;
    const variation=(Math.abs(row*11+col*7+seed)%5)*.026;
    c.fillStyle=tint(.43+variation,.54);c.fillRect(x+2,y+2,width-3,depth-3);
    c.fillStyle='rgba(13,23,27,.50)';c.fillRect(x,y,width,2);c.fillRect(x,y,2,depth);
    c.fillStyle=tint(.68,.38);c.fillRect(x+3,y+2,width-6,1.5);
  }
  // Lapped pedestrian finish follows the route through the room. The scuffed
  // centre feathers into neighbouring plates instead of a painted lane stripe.
  c.save();c.translate(arena.x,arena.y);
  c.rotate(Math.atan2(room.exit.y-room.spawn.y,room.exit.x-room.spawn.x));
  const worn=c.createLinearGradient(0,-49,0,49);
  worn.addColorStop(0,tint(.7,0));worn.addColorStop(.38,tint(.72,.27));
  worn.addColorStop(.68,tint(.71,.24));worn.addColorStop(1,tint(.7,0));
  c.fillStyle=worn;c.fillRect(-room.width,-49,2*room.width,98);
  for(const x of [-122,85]){
    c.fillStyle=tint(.18,.72);c.fillRect(x,-67,59,20);
    c.fillStyle=tint(.61,.66);
    for(let u=3;u<57;u+=8)c.fillRect(x+u,-65,3,16);
    c.fillRect(x,-47,59,2);
  }
  c.fillStyle=tint(.2,.65);c.fillRect(-122,-54,201,4);
  c.fillStyle=tint(.55,.62);c.fillRect(-63,-51,145,1.5);
  c.strokeStyle=tint(.19,.64);c.lineWidth=3;c.strokeRect(-42,46,66,45);
  c.fillStyle=tint(.62,.55);
  for(const x of [-37,19])for(const y of [51,86])c.fillRect(x,y,3,3);
  c.restore();
  const light=profile.landmark.color;
  const wet=c.createLinearGradient(arena.x-92,arena.y+11,arena.x-23,arena.y+38);
  wet.addColorStop(0,'rgba(17,26,28,.49)');wet.addColorStop(.54,'#'+light.toString(16).padStart(6,'0')+'49');wet.addColorStop(1,'rgba(23,31,34,.4)');
  c.translate(arena.x-64,arena.y+29);c.fillStyle=wet;
  c.fill(new Path2D('M-37 0 Q-35 -8 -15 -6 Q-2 -12 7 -7 Q34 -9 38 -1 Q34 4 14 3 Q0 10 -19 5 Q-39 8 -37 0Z'));
  c.restore();
}
