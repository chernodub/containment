import { hudObstructs, presentationObstructs } from './layout';
import type { DepthRenderer } from '../../render/DepthRenderer';
import type { EnemySnapshot } from '../../game/enemies/EnemySystem';
import { projectWorld, projectActorBounds, getViewportWidth, getViewportHeight, type ScreenPoint } from '../gameAdapter';
import type { HudEffect } from './effects';
import { formatDistance } from '../units';
export const THREAT_CAPACITY = 8;
export type ThreatKind = 'standard' | 'ranged' | 'elite' | 'champion' | 'boss';
export type ThreatBullet = Readonly<{
    x: number;
    y: number;
    kind: string;
    request: Readonly<{
        angle: number;
        speed: number;
    }>;
}>;
export type ThreatBoss = Readonly<{
    active: boolean;
    health: number;
    x: number;
    y: number;
    pendingTelegraph?: unknown;
}>;
type Point = {
    x: number;
    y: number;
};
type Marker = {
    node: HTMLDivElement;
    glyph: SVGPathElement;
    count: HTMLSpanElement;
    x: number;
    y: number;
    radius: number;
    active: boolean;
};
type Candidate = {
    id: number;
    kind: ThreatKind;
    score: number;
    distance: number;
    angle: number;
    edgeAngle: number;
    count: number;
    attacking: boolean;
    inFlight: boolean;
    approaching: boolean;
    point: ScreenPoint;
};
type Direction = {
    node: HTMLDivElement;
    life: number;
};
type Attack = {
    id: number;
    x: number;
    y: number;
    angle: number;
    life: number;
    ranged: boolean;
};
const NS = 'http://www.w3.org/2000/svg';
const shapePaths: Record<ThreatKind, string> = {
    standard: 'M16 12a4 4 0 1 1 0 8a4 4 0 1 1 0-8',
    ranged: 'M9 16l7-7 7 7-7 7zM12 16h8M16 12v8',
    elite: 'M16 7l9 9-9 9-9-9zM12 16h8',
    champion: 'M16 5l11 11-11 11L5 16zM16 11l5 5-5 5-5-5z',
    boss: 'M7 10l5 5 4-9 4 9 5-5-3 15H10zM12 21h8',
};
const rank: Record<ThreatKind, number> = { standard: 0, ranged: 1, elite: 2, champion: 3, boss: 4 };
const angularDistance = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
const clamp = (n: number) => Math.max(0, Math.min(1, n));
/** Bearing-preserving intersection with one consistent inset desktop edge. */
export function threatEdgePoint(ox: number, oy: number, angle: number, width: number, height: number, out: Point): Point {
    const inset = 42, dx = Math.cos(angle), dy = Math.sin(angle);
    const x = Math.max(inset, Math.min(width - inset, ox));
    const y = Math.max(inset, Math.min(height - inset, oy));
    const tx = Math.abs(dx) < 1e-8 ? Infinity : ((dx > 0 ? width - inset : inset) - x) / dx;
    const ty = Math.abs(dy) < 1e-8 ? Infinity : ((dy > 0 ? height - inset : inset) - y) / dy;
    const distance = Math.max(0, Math.min(tx, ty));
    out.x = x + dx * distance;
    out.y = y + dy * distance;
    return out;
}
/** A hostile projectile threatens the marine only while its real trajectory approaches. */
export function projectileThreatens(bullet: ThreatBullet, player: Point): boolean {
    if (bullet.kind !== 'hazard' || bullet.request.speed <= 0)
        return false;
    const vx = Math.cos(bullet.request.angle) * bullet.request.speed, vy = Math.sin(bullet.request.angle) * bullet.request.speed;
    const dx = player.x - bullet.x, dy = player.y - bullet.y;
    const time = (dx * vx + dy * vy) / (vx * vx + vy * vy);
    return time >= 0 && time <= 2.5 && Math.hypot(dx - vx * time, dy - vy * time) < 70;
}
/** Spatial chevrons preserve bearing, aggregate nearby threats and never grow the DOM. */
export class ThreatIndicators {
    private readonly markers: Marker[] = [];
    private readonly candidates: Candidate[] = [];
    private readonly directions: Direction[] = [];
    private readonly attacks: Attack[] = [];
    private readonly point: ScreenPoint = { x: 0, y: 0, visible: false };
    private readonly source: ScreenPoint = { x: 0, y: 0, visible: false };
    private readonly edge: Point = { x: 0, y: 0 };
    private readonly bodyBounds = {left:0,top:0,right:0,bottom:0};
    private recentAttack = -1;
    private originX = 0;
    private originY = 0;
    private width = 0;
    private height = 0;
    constructor(host: HTMLElement, directions: HTMLElement, private renderer: DepthRenderer) {
        for (let i = 0; i < THREAT_CAPACITY; i++) {
            const node = document.createElement('div');
            node.className = 'threat-marker';
            node.hidden = true;
            const chevron = document.createElementNS(NS, 'svg');
            chevron.setAttribute('viewBox', '0 0 32 32');
            chevron.setAttribute('class', 'threat-chevron');
            const arrow = document.createElementNS(NS, 'path');
            arrow.setAttribute('d', 'M6 5l20 11L6 27l6-11z');
            const backing = document.createElementNS(NS, 'path');
            backing.setAttribute('d', 'M6 5l20 11L6 27l6-11z');
            backing.setAttribute('class','threat-chevron-backing');
            chevron.append(backing);
            chevron.append(arrow);
            const type = document.createElementNS(NS, 'svg');
            type.setAttribute('viewBox', '0 0 32 32');
            type.setAttribute('class', 'threat-type');
            const glyph = document.createElementNS(NS, 'path');
            type.append(glyph);
            const count = document.createElement('span');
            count.className = 'threat-count';
            count.hidden = true;
            node.append(chevron, type, count);
            host.append(node);
            this.markers.push({ node, glyph, count, x: 0, y: 0, radius: 18, active: false });
            this.candidates.push({ id: 0, kind: 'standard', score: -Infinity, distance: 0, angle: 0, edgeAngle: 0, count: 0, attacking: false, inFlight: false, approaching: false, point: { x: 0, y: 0, visible: false } });
        }
        for (let i = 0; i < 4; i++) {
            const node = document.createElement('div');
            node.className = 'damage-direction';
            node.hidden = true;
            directions.append(node);
            this.directions.push({ node, life: 0 });
        }
        for (let i = 0; i < 16; i++)
            this.attacks.push({ id: 0, x: 0, y: 0, angle: 0, life: 0, ranged: false });
    }
    effect(e: HudEffect, player: Point): void {
        if (e.type === 'enemy-attack') {
            let index = this.attacks.findIndex(a => a.life > 0 && a.id === e.id);
            if (index < 0)
                index = this.attacks.findIndex(a => a.life <= 0);
            if (index < 0) {
                index = 0;
                for (let i = 1; i < this.attacks.length; i++)
                    if (this.attacks[i].life < this.attacks[index].life)
                        index = i;
            }
            const attack = this.attacks[index];
            attack.id = e.id ?? 0;
            attack.x = e.x;
            attack.y = e.y;
            attack.angle = e.angle ?? Math.atan2(player.y - e.y, player.x - e.x);
            attack.life = e.family === 'spitter' ? 3 : .3;
            attack.ranged = e.family === 'spitter';
            this.recentAttack = index;
        }
        if (e.type !== 'hurt')
            return;
        // Attack telegraphs remain useful for threat markers, but cannot identify
        // the source of a later pool/contact hit. Only this event owns its bearing.
        const origin = Number.isFinite(e.sourceX) && Number.isFinite(e.sourceY) ? {x:e.sourceX!,y:e.sourceY!} : undefined;
        if (!origin)
            return;
        projectWorld(this.renderer, origin.x, origin.y, this.source);
        projectWorld(this.renderer, player.x, player.y, this.point);
        let slot = this.directions.find(d => d.life <= 0);
        if (!slot)
            slot = this.directions.reduce((a, b) => a.life < b.life ? a : b);
        slot.life = .65;
        slot.node.hidden = false;
        slot.node.style.left = `${this.point.x}px`;
        slot.node.style.top = `${this.point.y}px`;
        slot.node.style.setProperty('--angle', `${Math.atan2(this.source.y - this.point.y, this.source.x - this.point.x) + Math.PI / 2}rad`);
    }
    private inFlight(enemy: EnemySnapshot, player: Point, bullets?: readonly ThreatBullet[]): boolean {
        if (enemy.type !== 'spitter')
            return false;
        if (!bullets) {
            for (const attack of this.attacks)
                if (attack.life > 0 && attack.ranged && attack.id === enemy.id)
                    return true;
            return false;
        }
        for (const bullet of bullets) {
            if (!projectileThreatens(bullet, player))
                continue;
            let originX = enemy.x, originY = enemy.y;
            for (const attack of this.attacks)
                if (attack.life > 0 && attack.id === enemy.id) {
                    originX = attack.x;
                    originY = attack.y;
                    break;
                }
            const dx = bullet.x - originX, dy = bullet.y - originY, c = Math.cos(bullet.request.angle), s = Math.sin(bullet.request.angle);
            if (dx * c + dy * s >= -25 && dx * c + dy * s < 1400 && Math.abs(dx * s - dy * c) < 65)
                return true;
        }
        return false;
    }
    private consider(id: number, kind: ThreatKind, x: number, y: number, distance: number, attacking: boolean, inFlight: boolean, radius = 16, approaching = true): void {
        if (kind !== 'boss' && !attacking && distance > 1000)
            return;
        projectWorld(this.renderer, x, y, this.point);
        if (!Number.isFinite(this.point.x) || !Number.isFinite(this.point.y))
            return;
        if(this.point.visible){
            const b=this.bodyBounds;
            // A center crossing the frame is not a visible body. Keep the native
            // danger bearing until the complete actor also clears screen/HUD.
            if(!projectActorBounds(this.renderer,id,x,y,radius,b)||b.left>32&&b.top>32&&b.right<this.width-32&&b.bottom<this.height-32&&!hudObstructs(b.left,b.top,b.right,b.bottom)&&!presentationObstructs(b.left,b.top,b.right,b.bottom))return;
        }
        const angle = Math.atan2(this.point.y - this.originY, this.point.x - this.originX);
        threatEdgePoint(this.originX, this.originY, angle, this.width, this.height, this.edge);
        const score = (attacking ? 1000000 : 0) - distance + rank[kind] * 5;
        let candidate: Candidate | undefined;
        for (const existing of this.candidates)
            if (existing.count > 0 && angularDistance(existing.angle, angle) < Math.PI / 8) {
                candidate = existing;
                break;
            }
        if (candidate) {
            candidate.count++;
            candidate.attacking ||= attacking;
            candidate.inFlight ||= inFlight;
            candidate.approaching ||= approaching;
            if (rank[kind] > rank[candidate.kind])
                candidate.kind = kind;
            if (score <= candidate.score)
                return;
        }
        else {
            candidate = this.candidates[0];
            for (const slot of this.candidates)
                if (slot.score < candidate.score)
                    candidate = slot;
            if (score <= candidate.score)
                return;
            candidate.count = 1;
            candidate.kind = kind;
            candidate.attacking = attacking;
            candidate.inFlight = inFlight;
            candidate.approaching = approaching;
        }
        candidate.id = id;
        candidate.score = score;
        candidate.distance = distance;
        candidate.angle = angle;
        candidate.point.x = this.edge.x;
        candidate.point.y = this.edge.y;
        candidate.edgeAngle = Math.atan2(this.edge.y - this.height / 2, this.edge.x - this.width / 2);
    }
    update(enemies: readonly EnemySnapshot[], player: Point, bounds: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }, bullets?: readonly ThreatBullet[], boss?: ThreatBoss): void {
        this.width = getViewportWidth(this.renderer);
        this.height = getViewportHeight(this.renderer);
        this.originX = (bounds.left + bounds.right) / 2;
        this.originY = (bounds.top + bounds.bottom) / 2;
        for (const c of this.candidates) {
            c.count = 0;
            c.score = -Infinity;
        }
        for (const enemy of enemies) {
            if (enemy.health <= 0 || enemy.alpha < .2)
                continue;
            const flight = this.inFlight(enemy, player, bullets), attacking = enemy.windupMs > 0 || enemy.chargeMs > 0 || enemy.meleePhase === 'windup' || enemy.meleePhase === 'strike' || !!enemy.pendingAttack || flight;
            const kind: ThreatKind = enemy.champion ? 'champion' : enemy.elite ? 'elite' : enemy.type === 'spitter' ? 'ranged' : 'standard';
            this.consider(enemy.id, kind, enemy.x, enemy.y, Math.hypot(enemy.x - player.x, enemy.y - player.y), attacking, flight, enemy.radius, (player.x - enemy.x) * enemy.velocityX + (player.y - enemy.y) * enemy.velocityY > 0);
        }
        if (boss?.active && boss.health > 0)
            this.consider(-1, 'boss', boss.x, boss.y, Math.hypot(boss.x - player.x, boss.y - player.y), !!boss.pendingTelegraph, false, 92);
        for (const marker of this.markers) {
            marker.active = false;
            marker.node.hidden = true;
        }
        // Place high-priority groups first, so lower-priority groups yield their edge space.
        for (let order = 0; order < THREAT_CAPACITY; order++) {
            let index = -1;
            for (let i = 0; i < THREAT_CAPACITY; i++)
                if (this.candidates[i].count > 0 && (index < 0 || this.candidates[i].score > this.candidates[index].score))
                    index = i;
            if (index < 0)
                break;
            const candidate = this.candidates[index], marker = this.markers[order];
            candidate.count = -candidate.count;
            const near = clamp(1 - candidate.distance / 1000), scale = 1 + near * .18, radius = 25 * scale;
            let x = candidate.point.x, y = candidate.point.y, found = false;
            for (let attempt = 0; attempt < 41; attempt++) {
                const offset = attempt === 0 ? 0 : Math.ceil(attempt / 2) * .055 * (attempt % 2 ? 1 : -1), theta = candidate.edgeAngle + offset;
                threatEdgePoint(this.width / 2, this.height / 2, theta, this.width, this.height, this.edge);
                const px = this.edge.x, py = this.edge.y;
                if (px - radius < 8 || py - radius < 8 || px + radius > this.width - 8 || py + radius > this.height - 8)
                    continue;
                if (px + radius > bounds.left - 12 && px - radius < bounds.right + 12 && py + radius > bounds.top - 12 && py - radius < bounds.bottom + 12)
                    continue;
                if (hudObstructs(px - radius, py - radius, px + radius, py + radius) || presentationObstructs(px - radius, py - radius, px + radius, py + radius))
                    continue;
                let occupied = false;
                for (let i = 0; i < order; i++) {
                    const other = this.markers[i];
                    if (other.active && Math.hypot(other.x - px, other.y - py) < other.radius + radius + 8) {
                        occupied = true;
                        break;
                    }
                }
                if (occupied)
                    continue;
                x = px;
                y = py;
                found = true;
                break;
            }
            if (!found)
                continue;
            marker.x = x;
            marker.y = y;
            marker.radius = radius;
            marker.active = true;
            marker.node.hidden = false;
            marker.node.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) scale(${scale})`;
            marker.node.style.setProperty('--bearing', `${candidate.angle}rad`);
            marker.node.style.setProperty('--threat-opacity', String(candidate.attacking || candidate.approaching ? .88 + near * .12 : .32 + near * .12));
            marker.node.dataset.kind = candidate.kind;
            marker.node.dataset.elite = String(rank[candidate.kind] >= 2);
            marker.node.dataset.attacking = String(candidate.attacking);
            marker.node.dataset.approaching = String(candidate.approaching);
            marker.node.dataset.inFlight = String(candidate.inFlight);
            marker.node.dataset.enemyId = String(candidate.id);
            marker.node.dataset.bearing = String(candidate.angle);
            marker.node.dataset.distance = String(candidate.distance);
            marker.node.dataset.near = String(near);
            marker.glyph.setAttribute('d', shapePaths[candidate.kind]);
            const count = -candidate.count;
            marker.count.hidden = count <= 1;
            marker.count.textContent = count > 1 ? String(count) : '';
            marker.node.dataset.count = String(count);
            marker.node.setAttribute('aria-label', `${count > 1 ? `${count} threats, ` : ''}${candidate.kind}, ${formatDistance(candidate.distance)}${candidate.attacking ? ', attacking' : ''}`);
        }
    }
    tick(dt: number): void {
        for (const attack of this.attacks)
            attack.life = Math.max(0, attack.life - dt);
        for (const d of this.directions) {
            if (!d.life)
                continue;
            d.life = Math.max(0, d.life - dt);
            d.node.hidden = !d.life;
            d.node.style.opacity = String(d.life / .65);
        }
    }
    clear(): void {
        for (const m of this.markers) {
            m.node.hidden = true;
            m.active = false;
        }
        for (const d of this.directions) {
            d.node.hidden = true;
            d.life = 0;
        }
        for (const a of this.attacks)
            a.life = 0;
        this.recentAttack = -1;
    }
    dispose(): void {
        this.clear();
        for (const m of this.markers)
            m.node.remove();
        for (const d of this.directions)
            d.node.remove();
        this.markers.length = 0;
        this.directions.length = 0;
        this.candidates.length = 0;
        this.attacks.length = 0;
    }
}
