// Screenshot coordinates occupied entirely by one resting body at review size.
// One reduced pixel of clearance excludes antialiasing and the floor at its edge.
export function restingBodyRegions() {
  const d = window.__containmentDebug;
  const r = d.renderer;
  const target = r.post.resources.scene;
  const {width, height} = target;
  const geometry = new Uint8Array(width * height * 4);
  r.renderer.readRenderTargetPixels(target, 0, 0, width, height, geometry, undefined, 1);
  const families = new Map();
  for (const enemy of d.game.enemies.snapshot.enemies) {
    if (enemy.windupMs || enemy.chargeMs || enemy.meleePhase !== 'approach') continue;
    const model = r.actors.get(enemy.id);
    if (model) families.set(model.root.userData.containmentGeometryId,
      enemy.pod ? 'pod' : enemy.champion ?? enemy.type);
  }
  const regions = {};
  for (let y = 1; y < 269; y++) {
    let last;
    for (let x = 1; x < 479; x++) {
      const left = Math.floor((x-1)*width/480);
      const right = Math.ceil((x+2)*width/480);
      const top = height-Math.ceil((y+2)*height/270);
      const bottom = height-Math.floor((y-1)*height/270);
      const id = geometry[4*(top*width+left)+2];
      const family = families.get(id);
      let inside = Boolean(family);
      for (let row = top; inside && row < bottom; row++)
        for (let col = left; col < right; col++) {
          const i = 4*(row*width+col);
          if (geometry[i+2] !== id || (geometry[i+3]&7)<4 || (geometry[i+3]&7)>6) {
            inside = false;
            break;
          }
        }
      if (!inside) {last=undefined;continue;}
      if (last === family) regions[family].at(-1)[2]=x;
      else (regions[family]??=[]).push([x,y,x,y]);
      last = family;
    }
  }
  return regions;
}
