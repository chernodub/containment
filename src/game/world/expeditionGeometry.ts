import {shipInteriorFurnishings} from '../roguelike/shipInteriorFurnishings';
import type { Point, Rect, RoomTemplate, RunNode } from '../roguelike/types';
import { ROOM_TEMPLATES } from '../roguelike/roomTemplates';
import type { FacilityBreach, QueenArena } from './facilityLayout';
import { segmentIntersectsRect } from '../input/aimAssist';
import {clearPolygonTopology} from './polygonGeometry';
import {paritySafeVoids} from './voidParity';

export type ExpeditionGeometry = Readonly<{
  bounds: Rect;
  boundary?: readonly Point[];
  voids?: readonly (readonly Point[])[];
  blockers: readonly Rect[];
  boundaryWalls: readonly Rect[];
  breaches: readonly FacilityBreach[];
  playerSpawn: Point;
  exitPoint: Point;
  bossSpawn: Point;
  queenArena: QueenArena;
}>;

/** Perimeter solids sit outside authored bounds, preserving authored clearance. */
export function createExpeditionGeometry(node: RunNode): ExpeditionGeometry {
  const template = ROOM_TEMPLATES[node.templateId];
  if (!template) throw new Error('Unknown expedition room template.');
  return createRoomTemplateGeometry(template,node.id);
}

/** Shared pure construction also lets authoring checks inspect an unregistered plan. */
export function createRoomTemplateGeometry(template:RoomTemplate,nodeId:string):ExpeditionGeometry {
  const { width, height } = template;
  const bounds = Object.freeze({ x: 0, y: 0, width, height });
  const boundaryWalls = Object.freeze([
    { x: -32, y: -32, width: width + 64, height: 32 },
    { x: -32, y: height, width: width + 64, height: 32 },
    { x: -32, y: 0, width: 32, height },
    { x: width, y: 0, width: 32, height },
  ].map(rect => Object.freeze(rect)));
  const bossSpawn = Object.freeze({ x: width / 2, y: height / 2 });
  const breaches: readonly FacilityBreach[] = Object.freeze(template.breaches.map((point, index) => Object.freeze({
    ...point, id: `${nodeId}:breach-${index}`, unlockWave: 0,
    // Existing HordeRuntime adds a 56-unit inward offset. All corners face inward.
    facing: point.x < width / 2 ? 'east' as const : 'west' as const,
  })));
  return Object.freeze({
    bounds, boundaryWalls, blockers: Object.freeze([...boundaryWalls, ...template.obstacles,...(template.incidentObstacles??[]),...shipInteriorFurnishings(template).flatMap(f=>f.colliders)]),
    boundary: template.boundary, voids: paritySafeVoids(template.voids),
    breaches, playerSpawn: template.spawn, exitPoint: template.exit, bossSpawn,
    queenArena: Object.freeze({ ...bounds, roomId: nodeId, safeCenter: bossSpawn, safeRadius: 180 }),
  });
}

export function canOccupyExpedition(geometry: ExpeditionGeometry, point: Point, radius: number): boolean {
  if (!Number.isFinite(point.x)||!Number.isFinite(point.y)||!Number.isFinite(radius)||radius < 0) return false;
  if (!fitsBounds(geometry.bounds, point, radius)) return false;
  if (!clearPolygonTopology(geometry,point,point,radius)) return false;
  const radiusSquared = radius * radius;
  return geometry.blockers.every(rect => !overlapsBlocker(point, rect, radius, radiusSquared));
}

function fitsBounds(bounds: Rect, point: Point, radius: number): boolean {
  return point.x - radius >= bounds.x && point.y - radius >= bounds.y
    && point.x + radius <= bounds.x + bounds.width && point.y + radius <= bounds.y + bounds.height;
}

function overlapsBlocker(point: Point, rect: Rect, radius: number, radiusSquared: number): boolean {
  const dx = point.x - Math.max(rect.x, Math.min(rect.x + rect.width, point.x));
  const dy = point.y - Math.max(rect.y, Math.min(rect.y + rect.height, point.y));
  return radius === 0 ? dx === 0 && dy === 0 : dx * dx + dy * dy < radiusSquared;
}

export function hasClearExpeditionShot(geometry: ExpeditionGeometry, from: Point, to: Point): boolean {
  const inBounds = (point: Point): boolean => point.x >= geometry.bounds.x && point.y >= geometry.bounds.y
    && point.x <= geometry.bounds.x + geometry.bounds.width && point.y <= geometry.bounds.y + geometry.bounds.height;
  return [from.x, from.y, to.x, to.y].every(Number.isFinite)
    && inBounds(from) && inBounds(to)
    && clearPolygonTopology(geometry,from,to)
    && geometry.blockers.every(rect => !segmentIntersectsRect(from, to, rect));
}

export function canTraverseExpedition(geometry: ExpeditionGeometry, from: Point, to: Point, radius: number): boolean {
  if (!fitsBounds(geometry.bounds, from, radius) || !fitsBounds(geometry.bounds, to, radius)) return false;
  // The continuous polygon query already checks both endpoints and includes
  // their distances to each nearby edge.
  if (!clearPolygonTopology(geometry, from, to, radius)) return false;
  const minX = Math.min(from.x, to.x) - radius, maxX = Math.max(from.x, to.x) + radius;
  const minY = Math.min(from.y, to.y) - radius, maxY = Math.max(from.y, to.y) + radius;
  const dx = to.x - from.x, dy = to.y - from.y, lengthSquared = dx * dx + dy * dy;
  const radiusSquared = radius * radius;
  for (const rect of geometry.blockers) {
    if (rect.x + rect.width < minX || rect.x > maxX || rect.y + rect.height < minY || rect.y > maxY) continue;
    if (overlapsBlocker(from, rect, radius, radiusSquared) || overlapsBlocker(to, rect, radius, radiusSquared)
      || segmentIntersectsRect(from, to, rect)) return false;
    // With clear endpoints, the remaining closest pair is a rectangle corner
    // projected onto the sweep. This preserves rounded corners and tangency.
    for (let corner = 0; corner < 4; corner++) {
      const x = rect.x + (corner % 2) * rect.width;
      const y = rect.y + Math.floor(corner / 2) * rect.height;
      const t = lengthSquared ? Math.max(0, Math.min(1, ((x - from.x) * dx + (y - from.y) * dy) / lengthSquared)) : 0;
      if ((x - from.x - t * dx) ** 2 + (y - from.y - t * dy) ** 2 < radiusSquared) return false;
    }
  }
  return true;
}

export function expeditionTemplate(node: RunNode): RoomTemplate {
  const template = ROOM_TEMPLATES[node.templateId];
  if (!template) throw new Error('Unknown expedition room template.');
  return template;
}

/** End of the legal portion of a projectile lane through static geometry. */
export function clipExpeditionLane(geometry: ExpeditionGeometry, from: Point, to: Point, radius: number, blocks?: (from: Point, to: Point, radius: number) => boolean) {
  const traverses = (target: Point) => canTraverseExpedition(geometry, from, target, radius) && !blocks?.(from, target, radius);
  if (traverses(to)) return {point: to, blocked: false};
  let clear = 0, blocked = 1;
  const point = {...from};
  for (let step = 0; step < 12; step++) {
    const t = (clear + blocked) / 2;
    point.x = from.x + (to.x - from.x) * t;
    point.y = from.y + (to.y - from.y) * t;
    if (traverses(point)) clear = t;
    else blocked = t;
  }
  return {point: {x: from.x + (to.x - from.x) * clear, y: from.y + (to.y - from.y) * clear}, blocked: true};
}
