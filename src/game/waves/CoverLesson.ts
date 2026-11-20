import type { Point, Rect } from '../roguelike/types';
import { segmentIntersectsRect } from '../input/aimAssist';
import { canOccupyExpedition, hasClearExpeditionShot, type ExpeditionGeometry } from '../world/expeditionGeometry';

export type CoverLesson = { cover: Rect; solids: readonly Rect[]; shooter: Point; pickup: Point; learned: boolean };

/** Find an exposed shoulder even when the rest of the incident overlaps fixed architecture. */
export function stageCoverLesson(geometry: ExpeditionGeometry, covers: readonly Rect[], origin: Point): CoverLesson | undefined {
  let attached: CoverLesson | undefined;
  for (const cover of covers) {
    const solids = geometry.blockers.filter(rect => !geometry.boundaryWalls.includes(rect)
      && rect.x < cover.x+cover.width && rect.x+rect.width > cover.x
      && rect.y < cover.y+cover.height && rect.y+rect.height > cover.y);
    const clear = {...geometry, blockers: geometry.blockers.filter(rect => !solids.includes(rect))};
    for (const [u,v] of [[.5,.5],[.75,.5],[.25,.5],[.5,.75],[.5,.25],[.75,.75],[.75,.25],[.25,.75],[.25,.25]]) {
      const center = {x:cover.x+cover.width*u,y:cover.y+cover.height*v};
      const bearing = Math.atan2(center.y-origin.y,center.x-origin.x);
      for (const offset of [0,1,-1,2,-2,3,-3,4,-4,5,-5,6,-6,7,-7,8]) {
        const ray = bearing+offset*Math.PI/8;
        const dx = Math.cos(ray), dy = Math.sin(ray);
        const front = Math.min(cover.width*(dx>=0?1-u:u)/Math.max(.001,Math.abs(dx)),
          cover.height*(dy>=0?1-v:v)/Math.max(.001,Math.abs(dy)));
        const back = Math.min(cover.width*(dx>=0?u:1-u)/Math.max(.001,Math.abs(dx)),
          cover.height*(dy>=0?v:1-v)/Math.max(.001,Math.abs(dy)));
        for (const [near,far] of [[33,80],[45,70],[54,54],[33,60],[60,80],[76,104],[100,110],[130,125]]) {
          const pickup = {x:center.x-dx*(back+near),y:center.y-dy*(back+near)};
          const shooter = {x:center.x+dx*(front+far),y:center.y+dy*(front+far)};
          if (canOccupyExpedition(geometry,pickup,18)&&canOccupyExpedition(geometry,shooter,22)
              &&segmentIntersectsRect(shooter,pickup,cover)) {
            const lesson={cover,solids,shooter,pickup,learned:false};
            if(hasClearExpeditionShot(clear,shooter,pickup))return lesson;
            attached??=lesson;
          }
        }
      }
    }
  }
  return attached;
}
