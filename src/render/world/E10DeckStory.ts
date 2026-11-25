import * as T from 'three';
import {paintFightingDeck,paintDeckWetMask,clipFightingDeck} from './FightingDeck';
import {coolantRunoff} from './LaneAftermath';
import type { RoomTemplate } from '../../game/roguelike/types';
import { SHIP_ARCHITECTURE_PLANS } from '../../game/roguelike/shipArchitectureLayouts';

/** Place the Blender wear atlas against actual exits, breaches and service
 * routes once during readiness. No world overlay draw or combat canvas work. */
export function buildDeckStory(t: RoomTemplate, atlas: T.Texture): { high: T.CanvasTexture; low: T.CanvasTexture } {
  const hull = t.boundary ?? [{x:0,y:0},{x:t.width,y:t.height}], xs = hull.map(p=>p.x/32), zs = hull.map(p=>p.y/32);
  const minX = Math.min(...xs), minZ = Math.min(...zs), width = Math.max(...xs)-minX, depth = Math.max(...zs)-minZ;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
  const context = canvas.getContext('2d')!; context.fillStyle = '#ffffff'; context.fillRect(0,0,1024,1024);
  context.globalCompositeOperation = 'multiply';
  const image = atlas.image as HTMLImageElement, cell = image.width/4;
  const stamp = (column:number,row:number,x:number,z:number,w:number,d:number,angle:number,opacity:number) => {
    context.save(); context.translate((x-minX)/width*1024,(z-minZ)/depth*1024); context.rotate(angle); context.globalAlpha = opacity;
    context.drawImage(image,column*cell+1,row*cell+1,cell-2,cell-2,-w/width*512,-d/depth*512,w/width*1024,d/depth*1024); context.restore();
  };
  const plan = SHIP_ARCHITECTURE_PLANS[t.id as keyof typeof SHIP_ARCHITECTURE_PLANS];
  if(plan){
    context.save();context.scale(1024/(width*32),1024/(depth*32));
    context.translate(-minX*32,-minZ*32);
    paintFightingDeck(context,t,plan.arena);
    context.restore();
  }
  const start = plan?.arena ?? t.spawn, end = t.exit;
  const dx = (end.x-start.x)/32, dz = (end.y-start.y)/32, distance = Math.hypot(dx,dz), angle = Math.atan2(dz,dx)-Math.PI/2;
  const steps = Math.max(2,Math.ceil(distance/1.4));
  for(let i=0;i<steps;i++) {
    const f=(i+.5)/steps,x=start.x/32+dx*f,z=start.y/32+dz*f;
    stamp(i%4,3,x,z,1.3,2.2,angle,.82);
    // Paired narrow trolley tracks accompany the softer boot lane.
    for(const side of [-1,1])stamp((i+1)%4,3,x+Math.cos(angle)*side*.62,z+Math.sin(angle)*side*.62,.32,2.7,angle,.70);
  }
  for(const [i,breach]of t.breaches.entries()) {
    const x=breach.x/32,z=breach.y/32;
    // Row 2 contains opaque spill silhouettes. Offset beside a flush grille,
    // those blobs read as detached cast shadows and make the grille float.
    // Keep wear physically attached to its two fastening rails instead.
    for(const side of [-1,1])stamp(i%4,3,x+side*.60,z,.12,.96,0,.36);
  }
  // A dragged case crosses a side service approach, never a random central stain.
  const service = plan?.spaces.find(s=>/service|return|bypass|console/i.test(s.name)) ?? plan?.spaces.at(-1);
  if(service)for(let n=0;n<3;n++)stamp(n,3,service.anchor.x/32+n*.7,service.anchor.y/32+.35,1.4,3.7,Math.PI*.42,.85);
  for(const opening of plan?.apertures??[]) {
    stamp(1,0,(opening.from.x+opening.to.x)/64,(opening.from.y+opening.to.y)/64,2.8,.5,
      Math.atan2(opening.to.y-opening.from.y,opening.to.x-opening.from.x),.60);
  }
  if(t.id==='overload-floor') {
    // Heat escapes through three split deck seams around the core. Paint into
    // the visible deck's retained wear texture; the west holdout stays quiet.
    const polygon=(points:number[][],color:string)=>{
      context.fillStyle=color;context.beginPath();
      points.forEach(([x,z],i)=>{const u=(x/32-minX)/width*1024,v=(z/32-minZ)/depth*1024;i?context.lineTo(u,v):context.moveTo(u,v);});
      context.closePath();context.fill();
    };
    for(const [cx,cz,turn] of [[700,310,-1.4],[930,480,.12],[740,700,1.2]]) {
      const point=(u:number,v:number)=>[cx+Math.cos(turn)*u-Math.sin(turn)*v,cz+Math.sin(turn)*u+Math.cos(turn)*v];
      polygon([[-25,-10],[10,-25],[47,-20],[85,-38],[110,-14],[89,3],[120,16],[70,26],[20,18],[-18,9]].map(([u,v])=>point(u,v)),'#56616b');
      polygon([[-18,-4],[26,-8],[65,-18],[91,-8],[57,4],[24,7]].map(([u,v])=>point(u,v)),'#26313e');
      for(let n=0;n<9;n++) {
        const u=16+n*10,v=Math.sin(n*3.7)*22;
        polygon([[u-4,v-3],[u+9,v-6],[u+6,v+5],[u-3,v+8]].map(([x,z])=>point(x,z)),n%2?'#7c8088':'#3c4650');
      }
    }
  }
  if(plan){
    context.save();context.scale(1024/(width*32),1024/(depth*32));
    context.translate(-minX*32,-minZ*32);paintDeckWetMask(context,plan.arena);
    if(t.id==='coolant-plant'){
      clipFightingDeck(context,t);context.translate(plan.arena.x,plan.arena.y);
      context.globalCompositeOperation='destination-out';context.fillStyle='rgba(0,0,0,.78)';
      context.fill(new Path2D(coolantRunoff));
    }
    context.restore();
  }
  const make = (image:HTMLCanvasElement) => {
    const texture = new T.CanvasTexture(image); texture.name = 'e10-placed-evacuation-wear'; texture.colorSpace = T.SRGBColorSpace;
    texture.flipY = false; texture.anisotropy = 2; return texture;
  };
  const lowCanvas = document.createElement('canvas'); lowCanvas.width = lowCanvas.height = 512;
  lowCanvas.getContext('2d')!.drawImage(canvas,0,0,512,512);
  return {high:make(canvas),low:make(lowCanvas)};
}
