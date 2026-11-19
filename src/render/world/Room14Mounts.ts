import * as T from 'three';
import {clearPolygonTopology} from '../../game/world/polygonGeometry';
import type {RoomTemplate} from '../../game/roguelike/types';
import {shipInteriorFurnishings} from '../../game/roguelike/shipInteriorFurnishings';
import type {OriginalKitInstance} from './OriginalShipKitAssets';

// Translate in native ship units. The depth scale seats the frozen header
// and the plenum against the deck without lowering either silhouette.
const shifts:Record<string,readonly [number,number,number?]>={
  'awakening-bay':[0,-26], 'passenger-vault':[62,-20], 'residential-gallery':[-4,0],
  'communal-atrium':[-2,-16], 'breached-loading-bay':[26,-28], 'crew-checkpoint':[78,18], 'freight-hold':[141,144],
  'relay-racks':[50,0], 'transmission-chamber':[36,-24], 'safety-interlock-station':[-48,0],
  'diagnostic-gallery':[109,-7], 'service-shaft-landing':[40,0],
  'coolant-plant':[-72,186,.38], 'infested-workshop':[74,-26],
  'swarm-junction':[0,409,.35], 'shielding-gate':[-18,-96], 'overload-floor':[88,-96],
};

export function incidentTransform(room:string):T.Matrix4 {
  const [x,z,depth=1]=shifts[room]??[0,0,1];
  return new T.Matrix4().makeScale(1,1,depth).setPosition(x/32,0,z/32);
}

export function alignIncidentInstance(room:string,p:OriginalKitInstance):void {
  if(room==='passenger-vault'&&p.pack==='p11-room14'){p.matrix.premultiply(new T.Matrix4().makeTranslation(44/32,0,-44/32));return;}
  if(p.asset==='frozen-pump-jacket')return;
  if(p.pack.startsWith('p11-inc13')||p.pack==='p11-room14'||p.purpose.startsWith('DRESS13 /')){
    p.matrix.premultiply(incidentTransform(room));
    if(p.pack.startsWith('p11-inc13'))p.cutaway=true;
  }
}

// Keep legacy loose props on their supports at room construction time. The
// incident shapes themselves are authored and checked separately by the tool.
export function loosePropSupported(room:RoomTemplate,box:T.Box3):boolean {
  if(box.max.y<=.022)return true;
  const x=box.min.x*32,y=box.min.z*32,X=box.max.x*32,Y=box.max.z*32;
  const rectangles=[...(room.incidentObstacles??[]),...room.obstacles,...shipInteriorFurnishings(room).flatMap(f=>f.colliders)];
  if(rectangles.some(r=>x>=r.x&&y>=r.y&&X<=r.x+r.width&&Y<=r.y+r.height))return true;
  // Checking whole edges catches concave notches that four corner
  // samples would miss. Each room void is a simple polygon without holes.
  const corners=[{x,y},{x:X,y},{x:X,y:Y},{x,y:Y}];
  return (room.voids??[]).some(boundary=>corners.every((p,i)=>
    clearPolygonTopology({boundary},p,corners[(i+1)%4])));
}

export function placeLooseInstance(room:RoomTemplate,piece:OriginalKitInstance,bounds:T.Box3):boolean {
  if(piece.asset==='last-cabin')return true;
  if(!piece.purpose.startsWith('DRESS13 /')&&piece.pack!=='p11-incidents'&&piece.pack!=='p11-service')return true;
  if(loosePropSupported(room,bounds))return true;
  if(piece.purpose.startsWith('P11 captive service hardware')){
    // Seat a bezel that overhangs a narrow wall cabinet back into its lip.
    let best=Infinity,dx=0,dz=0;
    for(const r of [...room.obstacles,...shipInteriorFurnishings(room).flatMap(f=>f.colliders)]){
      const x0=r.x+.1-bounds.min.x*32,x1=r.x+r.width-.1-bounds.max.x*32;
      const z0=r.y+.1-bounds.min.z*32,z1=r.y+r.height-.1-bounds.max.z*32;
      if(x0>x1||z0>z1)continue;
      const x=Math.max(x0,Math.min(0,x1)),z=Math.max(z0,Math.min(0,z1)),distance=Math.hypot(x,z);
      if(distance<best){best=distance;dx=x;dz=z;}
    }
    if(best<=20){piece.matrix.elements[12]+=dx/32;piece.matrix.elements[14]+=dz/32;return true;}
  }
  if(!/^brood-creep-[abc]$/.test(piece.asset))return false;
  // Preserve the wet skin and its normals in a 12 mm layer on walkable deck.
  const scale=.012/Math.max(.001,bounds.max.y-bounds.min.y);
  piece.matrix.premultiply(new T.Matrix4().makeScale(1,scale,1).setPosition(0,.009-bounds.min.y*scale,0));
  return true;
}

export function placeLooseGeometry(room:RoomTemplate,g:T.BufferGeometry):boolean {
  g.computeBoundingBox();
  const bounds=g.boundingBox!;
  if(loosePropSupported(room,bounds))return true;
  if(bounds.max.y>.55)return false;
  const scale=.009/Math.max(.001,bounds.max.y-bounds.min.y);
  const y=.012-bounds.min.y*scale;
  g.scale(1,scale,1).translate(0,y,0);
  return true;
}
