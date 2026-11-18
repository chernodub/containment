import {ABILITY_CATALOG, RIG_CATALOG} from '../../../src/game/abilities/catalog';
import type {AbilityDefinition, AbilitySlot} from '../../../src/game/abilities/contract';
import type {DepthGame} from '../../../src/DepthGame';
import {canTraverseExpedition, hasClearExpeditionShot} from '../../../src/game/world/expeditionGeometry';

type Point = {x: number; y: number};
export type AimEnemy = Point & {id: number; health: number; clear: boolean; visible: boolean; vulnerable?: boolean};
export type AbilityAim = Point & {angle: number; targets: number[]};
export type AimQueries = {
  visible: (from: Point, to: Point) => boolean;
  traverse: (from: Point, to: Point, radius: number) => boolean;
  has?: (augment: string) => boolean;
  /** Native pointer projection/picking; returns the actual aim seen by InputController. */
  isBurning?: (id: number) => boolean;
  resolveAim?: (cursor: Point) => Point | null;
};
const epsilon = 1e-7;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const pointAt = (p: Point, angle: number, radius: number) => ({x: p.x + Math.cos(angle) * radius, y: p.y + Math.sin(angle) * radius});
const angleTo = (a: Point, b: Point) => Math.atan2(b.y - a.y, b.x - a.x);
const delta = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/** Centers of two equal circles: include the boundary solutions, not just enemy midpoints. */
function circleIntersections(a: Point, b: Point, ra: number, rb = ra): Point[] {
  const d = distance(a, b);
  if (!d || d > ra + rb + epsilon || d < Math.abs(ra - rb) - epsilon) return [];
  const along = (ra * ra - rb * rb + d * d) / (2 * d);
  const height = Math.sqrt(Math.max(0, ra * ra - along * along));
  const dx = (b.x - a.x) / d, dy = (b.y - a.y) / d;
  return [
    {x: a.x + along * dx - height * dy, y: a.y + along * dy + height * dx},
    {x: a.x + along * dx + height * dy, y: a.y + along * dy - height * dx},
  ];
}

/** Read-only, deterministic current-observation aiming; no future positions or enemy AI are inspected. */
export function chooseAbilityAim(definition: AbilityDefinition, player: Point, observed: readonly AimEnemy[], queries: AimQueries): AbilityAim | null {
  const enemies = observed.filter(e => e.health > 0 && e.visible && e.clear && e.vulnerable !== false && queries.visible(player, e)).sort((a, b) => a.id - b.id);
  if (!enemies.length) return null;
  const road=definition.id==='glacier'&&queries.has?.('ice-road');
  const shape = road?{kind:'wall' as const,length:280,thickness:100}:definition.shape;
  const candidates: Point[] = [];
  const range = definition.range || (shape.kind === 'cone' || shape.kind === 'chain' ? shape.range : shape.kind === 'line' ? shape.length : shape.kind === 'dash' ? shape.distance : 0);
  if (definition.targeting === 'self') return null;
  if (definition.targeting === 'direction') {
    for (const enemy of enemies) {
      const angle = angleTo(player, enemy), d = distance(player, enemy);
      const offsets = [0];
      if (shape.kind === 'cone') {
        offsets.push(-shape.arcRadians / 2, shape.arcRadians / 2);
        if (definition.id==='flashfire' && queries.has?.('scorched-fan')) {
          const cosine=(d*d+180*180-120*120)/(2*(d||1)*180);
          if(cosine>=-1&&cosine<=1)offsets.push(-Math.acos(cosine),Math.acos(cosine));
        }
      }
      if (shape.kind === 'line' || shape.kind === 'dash') {
        const half = shape.width / 2;
        offsets.push(-Math.asin(Math.min(1, half / (d || 1))), Math.asin(Math.min(1, half / (d || 1))));
        const length=shape.kind==='line'?shape.length:shape.distance;
        if(d>length)offsets.push(-Math.acos(length/d),Math.acos(length/d));
      }
      if (shape.kind === 'wall' && d >= range - shape.thickness / 2 && d <= Math.hypot(range + shape.thickness / 2, shape.length / 2)) {
        offsets.push(-Math.acos(Math.min(1, range / d)), Math.acos(Math.min(1, range / d)));
      }
      if (shape.kind === 'chain') candidates.push({...enemy});
      else for (const offset of offsets) candidates.push(pointAt(player, angle + offset, range));
    }
  } else {
    const radius = shape.kind === 'circle' ? shape.radius : shape.kind === 'wall' ? shape.thickness / 2 : 0;
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i], d = distance(player, enemy);
      candidates.push(pointAt(player, angleTo(player, enemy), Math.min(range, d)));
      if (shape.kind === 'wall') {
        // Native walls lie perpendicular to the player-to-cursor direction.
        const a = angleTo(player, enemy);
        for (const sign of [-1, 1]) candidates.push({x: enemy.x + Math.sin(a) * shape.length / 2 * sign, y: enemy.y - Math.cos(a) * shape.length / 2 * sign});
      }
      candidates.push(...circleIntersections(enemy, player, radius, range));
      for (let j = 0; j < i; j++) {
        candidates.push({x: (enemy.x + enemies[j].x) / 2, y: (enemy.y + enemies[j].y) / 2});
        candidates.push(...circleIntersections(enemy, enemies[j], radius));
      }
    }
  }
  if(definition.targeting==='direction' && shape.kind!=='chain') {
    const angles=candidates.map(p=>angleTo(player,p)).sort((a,b)=>a-b);
    for(let i=0;i<angles.length;i++) {
      const end=i+1<angles.length?angles[i+1]:angles[0]+Math.PI*2;
      candidates.push(pointAt(player,(angles[i]+end)/2,range));
    }
  }
  if(road)candidates.push({...player});
  let best: AbilityAim | null = null,bestScore=0;
  for (const cursor of candidates) {
    if (distance(player, cursor) > range + epsilon) continue;
    let point = queries.resolveAim ? queries.resolveAim(cursor) : cursor;
    if (!point) continue;
    if (definition.targeting === 'point' && distance(player, point) > range) point = pointAt(player, angleTo(player,point),range);
    if (definition.targeting === 'point' && distance(player, point) > range + epsilon) continue;
    const angle = angleTo(player, point);
    let placements = [point];
    if (definition.slot === 'power') {
      // Directional deployment uses the catalog offset, even when pointer picking snaps to an actor.
      const center=definition.targeting==='direction'?pointAt(player,angle,definition.range):point;
      const glacier = definition.id === 'glacier', pylon = definition.id === 'tesla-pylon';
      const triplet = definition.id === 'napalm-charge' && queries.has?.('napalm-triplet');
      const offsets = glacier && queries.has?.('twin-glacier') ? road?[-60,60]:[-40, 40] : pylon && queries.has?.('twin-pylon') ? [-50, 50] : triplet ? [-100, 0, 100] : [0];
      placements = offsets.map(offset => ({x: center.x + (glacier&&!road ? Math.cos(angle) : -Math.sin(angle)) * offset, y: center.y + (glacier&&!road ? Math.sin(angle) : Math.cos(angle)) * offset})).filter(p => {
        if (!queries.traverse(player, p, pylon ? 18 : 4)) return false;
        if (shape.kind !== 'wall') return true;
        if(road)return queries.traverse({x:p.x-Math.cos(angle)*140,y:p.y-Math.sin(angle)*140},{x:p.x+Math.cos(angle)*140,y:p.y+Math.sin(angle)*140},50);
        const start = {x: p.x + Math.sin(angle) * shape.length / 2, y: p.y - Math.cos(angle) * shape.length / 2};
        const end = {x: p.x - Math.sin(angle) * shape.length / 2, y: p.y + Math.cos(angle) * shape.length / 2};
        return queries.traverse(start, end, shape.thickness / 2);
      });
      if (!placements.length) continue;
    }
    let hits: AimEnemy[];
    if (shape.kind === 'chain') {
      const initial = enemies.filter(e => distance(player, e) <= shape.range + epsilon).sort((a, b) => distance(a, point) - distance(b, point) || a.id - b.id);
      hits = [];
      let next: AimEnemy | undefined = initial[0];
      const cap = shape.maxTargets + (queries.has?.('forked-overload') ? 2 : 0);
      while (next && hits.length < cap) {
        hits.push(next);
        const origin: AimEnemy = next;
        next = enemies.filter(e => !hits.includes(e) && distance(origin, e) <= shape.hopRange + epsilon && queries.visible(origin, e)).sort((a, b) => distance(origin, a) - distance(origin, b) || a.id - b.id)[0];
      }
    } else hits = enemies.filter(enemy => placements.some(p => {
      if (shape.kind === 'circle') return distance(p, enemy) <= (definition.id === 'napalm-charge' && queries.has?.('napalm-triplet') ? 80 : shape.radius) && queries.visible(p, enemy);
      const dx = enemy.x - player.x, dy = enemy.y - player.y;
      if (shape.kind === 'cone') {
        if(Math.hypot(dx,dy)<=shape.range && Math.abs(delta(angleTo(player,enemy),angle))<=shape.arcRadians/2)return true;
        if(definition.id==='flashfire'&&queries.has?.('scorched-fan')) {
          const ground=pointAt(player,angle,180);
          return queries.visible(player,ground)&&distance(ground,enemy)<=120&&queries.visible(ground,enemy);
        }
        return false;
      }
      const along = dx * Math.cos(angle) + dy * Math.sin(angle), across = -dx * Math.sin(angle) + dy * Math.cos(angle);
      if (shape.kind === 'line' || shape.kind === 'dash') return along >= 0 && along <= (shape.kind === 'line' ? shape.length : shape.distance) && Math.abs(across) <= shape.width / 2;
      if (shape.kind === 'wall') {
        const wx = enemy.x - p.x, wy = enemy.y - p.y;
        if(road)return Math.abs(wx*Math.cos(angle)+wy*Math.sin(angle))<=140&&Math.abs(-wx*Math.sin(angle)+wy*Math.cos(angle))<=50&&queries.visible(p,enemy);
        return Math.abs(wx * Math.cos(angle) + wy * Math.sin(angle)) <= shape.thickness / 2 && Math.abs(-wx * Math.sin(angle) + wy * Math.cos(angle)) <= shape.length / 2 && queries.visible(p, enemy);
      }
      return false;
    }));
    const riding=road&&placements.some(p=>Math.abs((player.x-p.x)*Math.cos(angle)+(player.y-p.y)*Math.sin(angle))<=140&&Math.abs(-(player.x-p.x)*Math.sin(angle)+(player.y-p.y)*Math.cos(angle))<=50);
    const burning = definition.id === 'flashfire' ? hits.filter(enemy =>
      queries.isBurning?.(enemy.id) && distance(player, enemy) <= range &&
      shape.kind === 'cone' && Math.abs(delta(angleTo(player, enemy), angle)) <= shape.arcRadians / 2
    ).length : 0;
    const score=hits.length+burning*4+(riding?2:0);
    if(score>bestScore){bestScore=score;best={...cursor,angle,targets:hits.map(e=>e.id)};}
  }
  return best;
}

/** The same catalog and legal-placement adapter feeds native and render-free snapshots. */
export function observeAbilityAims(game: DepthGame, enemies: readonly AimEnemy[], resolveAim?: AimQueries['resolveAim']) {
  const rig = game.abilities.snapshot.rig;
  const plans: Partial<Record<AbilitySlot, AbilityAim | null>> = {};
  if (!rig) return plans;
  const queries: AimQueries = {
    visible: (from, to) => hasClearExpeditionShot(game.geometry, from, to),
    traverse: (from, to, radius) => canTraverseExpedition(game.geometry, from, to, radius),
    has: id => game.expedition.build.mutations.includes(id as never),
    resolveAim,
    isBurning: id => game.boonStatuses(id).burning,
  };
  for (const slot of ['tactical', 'power', 'overdrive'] as const) {
    const definition = ABILITY_CATALOG[RIG_CATALOG[rig].abilities[slot]];
    if (definition.targeting === 'self') continue;
    plans[slot] = game.abilities.snapshot.slots?.[slot].charges ? chooseAbilityAim(definition, game.player, enemies, queries) : null;
  }
  return plans;
}
