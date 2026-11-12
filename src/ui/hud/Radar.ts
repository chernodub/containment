import type { DepthGame } from '../../DepthGame';
import type { DepthRenderer } from '../../render/DepthRenderer';
import { getCameraFootprint, projectWorld } from '../gameAdapter';
import {hudLayoutRevision} from './layout';

const NS = 'http://www.w3.org/2000/svg';
const MAP_WIDTH = 144;
const MAP_HEIGHT = 100;
const INSET = 8;
const ENEMY_CAPACITY = 40;
let nextRadarId = 0;

type Point = { x: number; y: number };

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  className: string,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  node.setAttribute('class', className);
  return node;
}

/** Calm north-up deck geometry. Dynamic marks reuse a fixed SVG pool. */
export class Radar {
  private revision = -1;
  private scale = 1;
  private ox = INSET;
  private oy = INSET;
  private readonly player = svg('path', 'radar-player');
  private readonly enemies: SVGCircleElement[] = [];
  private readonly geometry = svg('g', 'radar-geometry');
  private readonly footprint = svg('polygon', 'radar-camera');
  private readonly objective = svg('path', 'radar-objective');
  private readonly floorClip = svg('path', 'radar-floor-clip');
  private readonly corners: Point[] = Array.from({ length: 4 }, () => ({ x: 0, y: 0 }));
  private readonly clipId = `radar-floor-${++nextRadarId}`;
  private disposed = false;
  private readonly screenPoint = {x:0,y:0,visible:false};
  private boundsRevision = -1;
  private readonly screenBounds = {left:0,right:0,top:0,bottom:0};

  constructor(
    private readonly host: HTMLElement,
    private readonly map: SVGSVGElement,
    private readonly renderer?: DepthRenderer,
  ) {
    this.map.setAttribute('viewBox', `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
    this.map.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const label = this.host.querySelector('.radar-label span');
    if (label) label.textContent = 'DECK RADAR';

    const defs = document.createElementNS(NS, 'defs');
    const clip = document.createElementNS(NS, 'clipPath');
    clip.id = this.clipId;
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    this.floorClip.setAttribute('clip-rule', 'evenodd');
    clip.append(this.floorClip);
    defs.append(clip);

    this.footprint.setAttribute('clip-path', `url(#${this.clipId})`);
    this.footprint.setAttribute('visibility', 'hidden');
    const enemyLayer = svg('g', 'radar-contacts');
    for (let index = 0; index < ENEMY_CAPACITY; index++) {
      const dot = svg('circle', 'radar-enemy');
      dot.setAttribute('r', '1.2');
      dot.setAttribute('visibility', 'hidden');
      enemyLayer.append(dot);
      this.enemies.push(dot);
    }
    this.objective.setAttribute('d', 'M0-5 5 0 0 5-5 0ZM-2 0H2M0-2V2');
    this.objective.setAttribute('visibility', 'hidden');
    // The simulation angle is measured clockwise from +X, as on this north-up map.
    this.player.setAttribute('d', 'M5 0-3.5-3.2-1.8 0-3.5 3.2Z');
    this.map.replaceChildren(defs, this.geometry, this.footprint, enemyLayer, this.objective, this.player);
  }

  update(game: DepthGame, enabled: boolean): void {
    this.host.hidden = !enabled || this.disposed;
    if (!enabled || this.disposed) return;
    if (this.revision !== game.roomRevision) this.rebuildGeometry(game);

    const x = this.x(game.player.x);
    const y = this.y(game.player.y);
    const angle = Number.isFinite(game.player.angle) ? game.player.angle * 180 / Math.PI : 0;
    this.player.setAttribute('transform', `translate(${x} ${y}) rotate(${angle})`);
    this.player.setAttribute('data-angle', String(angle));

    // Placement is cached by the HUD; this read occurs once after a layout change.
    const layout = hudLayoutRevision();
    if (layout !== this.boundsRevision) {
      this.boundsRevision=layout;
      const box=this.host.getBoundingClientRect();this.screenBounds.left=box.left;this.screenBounds.right=box.right;this.screenBounds.top=box.top;this.screenBounds.bottom=box.bottom;
    }
    const underRadar = (x:number,y:number) => {
      if (!this.renderer) return false;
      const point=projectWorld(this.renderer,x,y,this.screenPoint);
      const b=this.screenBounds;
      return point.visible && point.x>b.left-24 && point.x<b.right+24 && point.y>b.top-40 && point.y<b.bottom+24;
    };
    let obscuresThreat=false;
    let index = 0;
    let objective: Point | null = null;
    for (const enemy of game.enemies.snapshot.enemies) {
      if (enemy.health <= 0 || enemy.alpha < .2) continue;
      if (underRadar(enemy.x,enemy.y)) obscuresThreat=true;
      if (enemy.champion && !objective) objective = enemy;
      if (index >= ENEMY_CAPACITY) continue;
      const dot = this.enemies[index++];
      const kind = enemy.champion ? 'champion' : enemy.elite ? 'elite' : 'standard';
      dot.setAttribute('data-kind', kind);
      dot.setAttribute('r', kind === 'champion' ? '2.8' : kind === 'elite' ? '2' : '1.2');
      dot.setAttribute('visibility', 'visible');
      dot.setAttribute('cx', String(this.x(enemy.x)));
      dot.setAttribute('cy', String(this.y(enemy.y)));
    }
    for (; index < ENEMY_CAPACITY; index++) this.enemies[index].setAttribute('visibility', 'hidden');

    this.host.dataset.obscuresThreat=String(obscuresThreat);
    const boss = game.boss?.snapshot;
    if (boss?.active) objective = boss;
    this.objective.setAttribute('visibility', objective ? 'visible' : 'hidden');
    if (objective) {
      this.objective.setAttribute('transform', `translate(${this.x(objective.x)} ${this.y(objective.y)})`);
    }

    const hasFootprint = !!this.renderer && getCameraFootprint(this.renderer, this.corners);
    this.footprint.setAttribute('visibility', hasFootprint ? 'visible' : 'hidden');
    if (hasFootprint) {
      let points = '';
      for (let corner = 0; corner < 4; corner++) {
        const point = this.corners[corner];
        points += `${corner ? ' ' : ''}${this.x(point.x)},${this.y(point.y)}`;
      }
      this.footprint.setAttribute('points', points);
    }
  }

  private x(value: number): number { return this.ox + value * this.scale; }
  private y(value: number): number { return this.oy + value * this.scale; }

  private polygonPath(points: readonly Point[]): string {
    return points.map((point, index) => `${index ? 'L' : 'M'}${this.x(point.x)} ${this.y(point.y)}`).join('') + 'Z';
  }

  private rebuildGeometry(game: DepthGame): void {
    this.revision = game.roomRevision;
    const room = game.geometry;
    const bounds = room.bounds;
    this.scale = Math.min((MAP_WIDTH - INSET * 2) / bounds.width, (MAP_HEIGHT - INSET * 2) / bounds.height);
    this.ox = (MAP_WIDTH - bounds.width * this.scale) / 2 - bounds.x * this.scale;
    this.oy = (MAP_HEIGHT - bounds.height * this.scale) / 2 - bounds.y * this.scale;
    const boundary = room.boundary ?? [
      { x: bounds.x, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { x: bounds.x, y: bounds.y + bounds.height },
    ];
    const path = this.polygonPath(boundary) + (room.voids ?? []).map(hole => this.polygonPath(hole)).join('');
    this.floorClip.setAttribute('d', path);
    const floor = svg('path', 'radar-floor');
    floor.setAttribute('d', path);
    floor.setAttribute('fill-rule', 'evenodd');
    const fragment = document.createDocumentFragment();
    fragment.append(floor);
    const walls = svg('g', 'radar-walls');
    walls.setAttribute('clip-path', `url(#${this.clipId})`);
    for (const wall of room.blockers) {
      const rect = svg('rect', 'radar-wall');
      rect.setAttribute('x', String(this.x(wall.x)));
      rect.setAttribute('y', String(this.y(wall.y)));
      rect.setAttribute('width', String(wall.width * this.scale));
      rect.setAttribute('height', String(wall.height * this.scale));
      walls.append(rect);
    }
    fragment.append(walls);
    for (const breach of room.breaches) {
      const mark = svg('path', 'radar-breach');
      mark.setAttribute('d', 'M-1.8-1.8 1.8 1.8M-1.8 1.8 1.8-1.8');
      mark.setAttribute('transform', `translate(${this.x(breach.x)} ${this.y(breach.y)})`);
      fragment.append(mark);
    }
    const exit = svg('path', 'radar-exit');
    exit.setAttribute('d', 'M-3-3H2V3H-3ZM0 0H6M4-2 6 0 4 2');
    exit.setAttribute('transform', `translate(${this.x(room.exitPoint.x)} ${this.y(room.exitPoint.y)})`);
    fragment.append(exit);
    this.geometry.replaceChildren(fragment);
  }

  /** Remove every owned SVG node; a disposed radar remains safely inert. */
  dispose(): void {
    this.disposed = true;
    this.map.replaceChildren();
    this.enemies.length = 0;
    this.host.hidden = true;
  }
}
