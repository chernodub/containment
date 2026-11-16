import * as T from 'three';
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
    const vx=start.x-breach.x,vz=start.y-breach.y,length=Math.hypot(vx,vz)||1;
    const x=breach.x/32+vx/length*1.0,z=breach.y/32+vz/length*1.0;
    stamp(i%4,2,x,z,3.8,1.7,Math.atan2(vz,vx),.68);
    stamp((i+2)%4,2,x+vx/length*.9,z+vz/length*.9,2.4,1.4,Math.atan2(vz,vx)+.6,.38);
    stamp(i%4,0,x-vx/length*.55,z-vz/length*.55,2.4,.65,Math.atan2(vz,vx)+Math.PI/2,.65);
  }
  // A dragged case crosses a side service approach, never a random central stain.
  const service = plan?.spaces.find(s=>/service|return|bypass|console/i.test(s.name)) ?? plan?.spaces.at(-1);
  if(service)for(let n=0;n<3;n++)stamp(n,3,service.anchor.x/32+n*.7,service.anchor.y/32+.35,1.4,3.7,Math.PI*.42,.85);
  for(const opening of plan?.apertures??[]) {
    stamp(1,0,(opening.from.x+opening.to.x)/64,(opening.from.y+opening.to.y)/64,2.8,.5,
      Math.atan2(opening.to.y-opening.from.y,opening.to.x-opening.from.x),.60);
  }
  const make = (image:HTMLCanvasElement) => {
    const texture = new T.CanvasTexture(image); texture.name = 'e10-placed-evacuation-wear'; texture.colorSpace = T.SRGBColorSpace;
    texture.flipY = false; texture.anisotropy = 2; return texture;
  };
  const lowCanvas = document.createElement('canvas'); lowCanvas.width = lowCanvas.height = 512;
  lowCanvas.getContext('2d')!.drawImage(canvas,0,0,512,512);
  return {high:make(canvas),low:make(lowCanvas)};
}
