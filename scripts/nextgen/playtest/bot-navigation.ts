import type {DepthGame} from '../../../src/DepthGame';
import {FacilityNavigation} from '../../../src/game/world/FacilityNavigation';
import {canOccupyExpedition, canTraverseExpedition, hasClearExpeditionShot} from '../../../src/game/world/expeditionGeometry';

export {BOT_NAVIGATION_VERSION} from './bot-navigation-version.mjs';

type Point = {x: number; y: number};
type Geometry = DepthGame['geometry'];
type BotGame = Pick<DepthGame, 'geometry' | 'navigation' | 'player' | 'elapsed'>;
const CLEARANCE = 18;
const USEFUL_DISTANCE = 45;
const MAX_GRID_NODES = 80_000;
const observers = new WeakMap<Geometry, {standard: FacilityNavigation; fine: FineGrid[]}>();
const tightCorners = new WeakMap<Geometry, {origin: Point; since: number}>();
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Bounded observer-only refinement for corridors missed by the 32-unit shared grid. */
class FineGrid {
  private readonly columns: number;
  private readonly rows: number;
  private readonly walkable: Uint8Array;
  private readonly distances: Int32Array;
  private readonly queue: Int32Array;
  private goal = -2;

  constructor(private readonly geometry: Geometry, private readonly cell: number) {
    this.columns = Math.ceil(geometry.bounds.width / cell);
    this.rows = Math.ceil(geometry.bounds.height / cell);
    const count = this.columns * this.rows;
    if (count > MAX_GRID_NODES) throw Error('Bot navigation observer exceeded its bounded grid.');
    this.walkable = new Uint8Array(count);
    this.distances = new Int32Array(count);
    this.queue = new Int32Array(count);
    for (let id = 0; id < count; id++) this.walkable[id] = +canOccupyExpedition(geometry, this.point(id), CLEARANCE);
  }

  private point(id: number): Point {
    return {x: this.geometry.bounds.x + (id % this.columns + .5) * this.cell,
      y: this.geometry.bounds.y + (Math.floor(id / this.columns) + .5) * this.cell};
  }

  private neighbors(id: number): number[] {
    const result: number[] = [], column = id % this.columns;
    if (column > 0) result.push(id - 1);
    if (column + 1 < this.columns) result.push(id + 1);
    if (id >= this.columns) result.push(id - this.columns);
    if (id + this.columns < this.walkable.length) result.push(id + this.columns);
    return result;
  }

  private closest(point: Point, reachable: boolean, sightTarget?: Point): number {
    const cx = Math.floor((point.x - this.geometry.bounds.x) / this.cell);
    const cy = Math.floor((point.y - this.geometry.bounds.y) / this.cell);
    const range = Math.ceil(128 / this.cell);
    let best = -1, score = Infinity;
    for (let dy = -range; dy <= range; dy++) for (let dx = -range; dx <= range; dx++) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= this.columns || y >= this.rows) continue;
      const id = y * this.columns + x;
      if (!this.walkable[id] || reachable && this.distances[id] < 0) continue;
      const candidate = this.point(id), separation = distance(candidate, point);
      if (separation >= score) continue;
      if (sightTarget ? !hasClearExpeditionShot(this.geometry, candidate, sightTarget)
        : !canTraverseExpedition(this.geometry, point, candidate, CLEARANCE)) continue;
      best = id; score = separation;
    }
    return best;
  }

  waypoint(origin: Point, target: Point): Point | null {
    const goal = this.closest(target, false, target);
    if (goal < 0) return null;
    if (goal !== this.goal) {
      this.goal = goal; this.distances.fill(-1);
      let head = 0, tail = 1;
      this.queue[0] = goal; this.distances[goal] = 0;
      while (head < tail) {
        const current = this.queue[head++], from = this.point(current);
        for (const next of this.neighbors(current)) {
          if (!this.walkable[next] || this.distances[next] >= 0
            || !canTraverseExpedition(this.geometry, from, this.point(next), CLEARANCE)) continue;
          this.distances[next] = this.distances[current] + 1;
          this.queue[tail++] = next;
        }
      }
    }
    let current = this.closest(origin, true);
    if (current < 0) return null;
    let result = this.point(current);
    for (let step = 0; step < 24; step++) {
      let next = -1, score = this.distances[current];
      for (const id of this.neighbors(current)) if (this.distances[id] >= 0 && this.distances[id] < score) {
        next = id; score = this.distances[id];
      }
      if (next < 0) break;
      const candidate = this.point(next);
      if (!canTraverseExpedition(this.geometry, origin, candidate, CLEARANCE)) break;
      current = next; result = candidate;
    }
    if (distance(origin, result) > USEFUL_DISTANCE) return result;
    // The policy probes 90 units, but one 250 ms input decision travels only 55.
    // A short corner can make every far lookahead worse even though the first
    // ordinary movement step makes progress. Keep the existing probes, and
    // choose one by legal geodesic progress after its real movement distance.
    const cost = (point: Point): number => {
      const id = this.closest(point, true);
      return id < 0 ? Infinity : this.distances[id] * this.cell + distance(point, this.point(id));
    };
    let bestCost = cost(origin), best: Point | null = null;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const probeLength = Math.hypot(dx, dy);
      const probe = {x: origin.x + dx / probeLength * 90, y: origin.y + dy / probeLength * 90};
      let legal = true;
      for (let sample = 1; sample <= 6; sample++) {
        const point = {x: origin.x + (probe.x - origin.x) * sample / 6,
          y: origin.y + (probe.y - origin.y) * sample / 6};
        if (!canOccupyExpedition(this.geometry, point, 19)) {legal = false; break;}
      }
      if (!legal) continue;
      const inputY = dy / .81, inputLength = Math.hypot(dx, inputY);
      const next = {x: origin.x + dx / inputLength * 55, y: origin.y + inputY / inputLength * 55};
      if (!canTraverseExpedition(this.geometry, origin, next, 16)) continue;
      const nextCost = cost(next);
      if (nextCost + .001 < bestCost) {bestCost = nextCost; best = probe;}
    }
    return best ?? (distance(origin, result) > 4 ? result : null);
  }
}

/** Read-only bot routing; no game/enemy navigation, resources or input state is replaced. */
export function botWaypoint(game: BotGame, target: Point): Point | null {
  const origin = {...game.player, radius: 16};
  const ordinary = game.navigation.waypoint(origin, target, 1);
  if (!ordinary || distance(ordinary, origin) > USEFUL_DISTANCE
    && canTraverseExpedition(game.geometry, origin, ordinary, origin.radius)) {
    tightCorners.delete(game.geometry);
    return ordinary;
  }
  let observer = observers.get(game.geometry);
  if (!observer) {
    observer = {standard: new FacilityNavigation(game.geometry, CLEARANCE), fine: []};
    observers.set(game.geometry, observer);
  }
  const recovery = observer.standard.waypoint(origin, target, 1);
  if (recovery && distance(recovery, origin) > USEFUL_DISTANCE
    && canTraverseExpedition(game.geometry, origin, recovery, CLEARANCE)) return recovery;
  for (let index = 0; index < 2; index++) {
    observer.fine[index] ??= new FineGrid(game.geometry, index ? 8 : 16);
    const waypoint = observer.fine[index].waypoint(origin, target);
    if (waypoint) return waypoint;
  }
  const fallback = ordinary && canTraverseExpedition(game.geometry, origin, ordinary, origin.radius) ? ordinary : null;
  // The marine can reach corners tighter than the observer grid's padding.
  // Step back to a reachable padded cell before asking the grid for a route.
  if (!canOccupyExpedition(game.geometry, origin, CLEARANCE)) {
    const corner = tightCorners.get(game.geometry);
    if (!corner || distance(corner.origin, origin) > 2) {
      tightCorners.set(game.geometry, {origin, since: game.elapsed});
      return fallback;
    }
    if (game.elapsed - corner.since < 6) return fallback;
    let exit: Point | null = null, closest = Infinity;
    for (let direction = 0; direction < 8; direction++) {
      const angle = direction * Math.PI / 4;
      const point = {x: origin.x + Math.cos(angle) * 32, y: origin.y + Math.sin(angle) * 32};
      if (!canOccupyExpedition(game.geometry, point, 19)
        || !canTraverseExpedition(game.geometry, origin, point, origin.radius)) continue;
      const separation = distance(point, target);
      if (separation < closest) {exit = point; closest = separation;}
    }
    return exit ?? fallback;
  }
  tightCorners.delete(game.geometry);
  return fallback;
}

/** Shorten only blocked pursuit probes. A legal straight approach retains the normal look-ahead. */
export function botPursuitLookAhead(game: BotGame, waypoint:Point, normal:number, requireProgress=false):number {
  const {player,geometry}=game;
  const distanceToWaypoint=distance(player,waypoint);
  if(!requireProgress&&distanceToWaypoint<normal)return Math.max(8,distanceToWaypoint);
  const initial=Math.max(8,Math.min(normal,distanceToWaypoint));
  const approach=Math.atan2(waypoint.y-player.y,waypoint.x-player.x);
  for(const length of [initial,48,24,12,8]){
    if(length>initial||!requireProgress&&length===8)continue;
    for(const offset of [0,Math.PI/4,-Math.PI/4]){
      const angle=Math.round((approach+offset)/(Math.PI/4))*(Math.PI/4);
      const end={x:player.x+Math.cos(angle)*length,y:player.y+Math.sin(angle)*length};
      if((!requireProgress||distance(end,waypoint)<distanceToWaypoint)
        &&canTraverseExpedition(geometry,player,end,player.radius))return length;
    }
  }
  return 12;
}
