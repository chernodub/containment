import type { Point, Rect } from '../roguelike/types';
import { segmentIntersectsRect } from '../input/aimAssist';
import { canOccupyExpedition, hasClearExpeditionShot, type ExpeditionGeometry } from '../world/expeditionGeometry';

export type CoverLesson = { cover: Rect; shooter: Point; pickup: Point; learned: boolean };

/** Find a walkable lee with direct sight to the wreck from both sides. */
export function stageCoverLesson(geometry: ExpeditionGeometry, covers: readonly Rect[], origin: Point): CoverLesson | undefined {
  const clear = {...geometry, blockers: geometry.blockers.filter(rect => !covers.includes(rect))};
  for (const cover of covers) {
    const center = {x:cover.x+cover.width/2,y:cover.y+cover.height/2};
    const bearing = Math.atan2(center.y-origin.y,center.x-origin.x);
    for (const offset of [0,.35,-.35,.75,-.75,1.2,-1.2,Math.PI]) {
      const ray = bearing+offset;
      const dx = Math.cos(ray), dy = Math.sin(ray);
      const edge = Math.min(cover.width/2/Math.max(.001,Math.abs(dx)),cover.height/2/Math.max(.001,Math.abs(dy)));
      const pickup = {x:center.x-dx*(edge+34),y:center.y-dy*(edge+34)};
      const shooter = {x:center.x+dx*(edge+92),y:center.y+dy*(edge+92)};
      if (canOccupyExpedition(geometry,pickup,18)&&canOccupyExpedition(geometry,shooter,22)
          &&hasClearExpeditionShot(clear,shooter,pickup)&&segmentIntersectsRect(shooter,pickup,cover)) {
        return {cover,shooter,pickup,learned:false};
      }
    }
  }
}
