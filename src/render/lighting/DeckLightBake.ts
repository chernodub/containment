import * as T from 'three';
import {roomValueProfile} from './RoomValueStandard';
import type { RoomTemplate } from '../../game/roguelike/types';

type Bake = { key:string; pixels:Uint8Array; bounds:T.Vector4 };
const bakes = new WeakMap<RoomTemplate,Bake>();

/** Bake stable fixture falloff and construction proximity once at room build.
 * RG stores key-pool coverage and soft enclosure occlusion. No realtime lights,
 * scene queries or combat work; Low uses the identical 256² light field. */
export function bakeDeckLighting(t: RoomTemplate, pools: readonly T.Vector4[], exitGain = .8): { texture: T.DataTexture; bounds: T.Vector4 } {
  const key=JSON.stringify([pools.map(pool=>pool.toArray()),exitGain]);
  let bake=bakes.get(t);
  if(bake?.key!==key){
    bake={key,...buildDeckLighting(t,pools,exitGain)};
    bakes.set(t,bake);
  }
  const texture = new T.DataTexture(bake.pixels, 256, 256, T.RGBAFormat);
  texture.name = 'e10-static-room-irradiance'; texture.minFilter = texture.magFilter = T.LinearFilter;
  texture.generateMipmaps = false; texture.needsUpdate = true;
  return {texture, bounds:bake.bounds.clone()};
}

function buildDeckLighting(t:RoomTemplate,pools:readonly T.Vector4[],exitGain:number) {
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
  const lamp = roomValueProfile(t.id)?.landmark;
  const sourceX = (lamp?.at[0] ?? 0)/32, sourceZ = (lamp?.at[1] ?? 0)/32;
  const arena=pools[0];
  const aim = arena ? Math.atan2(arena.x-sourceX,arena.y-sourceZ) : 0;
  const sin = Math.sin(aim), cos = Math.cos(aim);
  const size = 256, pixels = new Uint8Array(size * size * 4);
  for (let row = 0; row < size; row++) for (let column = 0; column < size; column++) {
    const x = x0 + (column + .5) / size * width, z = z0 + (row + .5) / size * depth;
    let pool = 0, nearest = Infinity;
    for (const source of pools) {
      if (source.z < 1) continue;
      pool = Math.max(pool, (1 - smooth(.22, 1.45, Math.abs(x - source.x) / source.z)) * (1 - smooth(.16, 1.35, Math.abs(z - source.y) / source.w)));
    }
    pool = Math.max(pool, exitGain * (1 - smooth(.4, 3.5, Math.hypot(x - t.exit.x / 32, z - t.exit.y / 32))));
    for (const [ax, az, dx, dz] of segments) {
      const f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      nearest = Math.min(nearest, Math.hypot(x - ax - dx * f, z - az - dz * f));
    }
    // A fixed cut-off hood casts three panes of light from the visible
    // landmark post. The same room-space field is filtered on both tiers.
    const along=(x-sourceX)*sin+(z-sourceZ)*cos;
    const across=(x-sourceX)*cos-(z-sourceZ)*sin;
    const spread=.34+Math.max(0,along)*.22;
    const u=across/spread;
    const aperture=lamp && arena ? smooth(0,.20,along)*(1-smooth(2.7,5.8,along))*
      (1-smooth(.82,1.05,Math.abs(u)))*(.22+.78*smooth(.035,.13,Math.abs(Math.abs(u)-.34))) : 0;
    const index = (row * size + column) * 4;
    pixels[index] = Math.round(pool * 255); pixels[index + 1] = Math.round(smooth(.1, 1.7, nearest) * 255);
    pixels[index + 2] = Math.round(aperture*255); pixels[index + 3] = 255;
  }
  return {pixels, bounds: new T.Vector4(x0, z0, width, depth)};
}
