import * as T from 'three';
import { shipEnvironment } from '../ShipEnvironments';
import type { RoomTemplate } from '../../game/roguelike/types';

/** Bake stable fixture falloff and construction proximity once at room build.
 * RG stores key-pool coverage and soft enclosure occlusion. No realtime lights,
 * scene queries or combat work; Low uses the identical 256² light field. */
export function bakeDeckLighting(t: RoomTemplate, pools: readonly T.Vector4[], services: readonly {x:number;z:number;width:number;depth:number}[] = []): { texture: T.DataTexture; bounds: T.Vector4 } {
  const hull = t.boundary ?? [{x: 0, y: 0}, {x: t.width, y: 0}, {x: t.width, y: t.height}, {x: 0, y: t.height}];
  const xs = hull.map(p => p.x / 32), zs = hull.map(p => p.y / 32);
  const x0 = Math.min(...xs), z0 = Math.min(...zs), width = Math.max(...xs) - x0, depth = Math.max(...zs) - z0;
  const segments = [hull, ...t.voids ?? []].flatMap(p => p.map((a, i) => {
    const b = p[(i + 1) % p.length];
    return [a.x / 32, a.y / 32, (b.x - a.x) / 32, (b.y - a.y) / 32];
  }));
  const smooth = (lo: number, hi: number, value: number) => {
    const a = Math.max(0, Math.min(1, (value - lo) / (hi - lo))); return a * a * (3 - 2 * a);
  };
  const environment=shipEnvironment(t.id);
  const accentGain=environment==='containment'?.72:environment==='maintenance'||environment==='communications'?.32:.14;
  const size = 256, pixels = new Uint8Array(size * size * 4);
  for (let row = 0; row < size; row++) for (let column = 0; column < size; column++) {
    const x = x0 + (column + .5) / size * width, z = z0 + (row + .5) / size * depth;
    let pool = 0, nearest = Infinity, accent = 0, status = 0;
    for (const source of pools) {
      if (source.z < 1) continue;
      pool = Math.max(pool, (1 - smooth(.22, 1.45, Math.abs(x - source.x) / source.z)) * (1 - smooth(.16, 1.35, Math.abs(z - source.y) / source.w)));
    }
    pool = Math.max(pool, .8 * (1 - smooth(.4, 3.5, Math.hypot(x - t.exit.x / 32, z - t.exit.y / 32))));
    for (const [ax, az, dx, dz] of segments) {
      const f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      nearest = Math.min(nearest, Math.hypot(x - ax - dx * f, z - az - dz * f));
    }
    for(const service of services){
      const dx=Math.max(0,Math.abs(x-service.x/32)-service.width*.5),dz=Math.max(0,Math.abs(z-service.z/32)-service.depth*.5);
      accent=Math.max(accent,(1-smooth(.05,1.15,Math.hypot(dx,dz)))*accentGain);
    }
    if(environment==='containment'){
      const source=pools[0];
      accent=Math.max(accent,(1-smooth(.2,1.6,Math.hypot((x-source.x)/2.5,(z-source.y-2.4)/1.8)))*.88);
    }
    if(['containment','communications','maintenance'].includes(environment??''))for(const source of pools){
      if(source.z<1)continue;
      for(const side of [-1,1])status=Math.max(status,1-smooth(.1,1.05,Math.hypot(x-source.x-side*1.56,z-source.y-2.4)));
    }
    const index = (row * size + column) * 4;
    pixels[index] = Math.round(pool * 255); pixels[index + 1] = Math.round(smooth(.1, 1.7, nearest) * 255);
    pixels[index + 2] = Math.round(accent*255); pixels[index + 3] = Math.round(status*255);
  }
  const texture = new T.DataTexture(pixels, size, size, T.RGBAFormat);
  texture.name = 'e10-static-room-irradiance'; texture.minFilter = texture.magFilter = T.LinearFilter;
  texture.generateMipmaps = false; texture.needsUpdate = true;
  return {texture, bounds: new T.Vector4(x0, z0, width, depth)};
}
