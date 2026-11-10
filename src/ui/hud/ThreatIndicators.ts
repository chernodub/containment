import { hudObstructs } from './layout';
import type { DepthRenderer } from '../../render/DepthRenderer';
import type { EnemySnapshot } from '../../game/enemies/EnemySystem';
import { projectWorld, type ScreenPoint } from '../gameAdapter';
import type { HudEffect } from './effects';
export const THREAT_CAPACITY = 8;
type Marker = {
    node: HTMLDivElement;
    label: HTMLSpanElement;
    distance: HTMLSpanElement;
    x: number;
    y: number;
    active: boolean;
};
type Candidate = {
    enemy: EnemySnapshot | null;
    point: ScreenPoint;
    score: number;
    distance: number;
};
type Direction = {
    node: HTMLDivElement;
    life: number;
};
/** Nearest attacking threats get priority. The pool never grows with a swarm. */
export class ThreatIndicators {
    private markers: Marker[] = [];
    private candidates: Candidate[] = [];
    private directions: Direction[] = [];
    private point: ScreenPoint = { x: 0, y: 0, visible: false };
    private source: ScreenPoint = { x: 0, y: 0, visible: false };
    private recentAttack: {
        x: number;
        y: number;
        life: number;
    } | null = null;
    constructor(private host: HTMLElement, directions: HTMLElement, private renderer: DepthRenderer) {
        for (let i = 0; i < THREAT_CAPACITY; i++) {
            const node = document.createElement('div');
            node.className = 'threat-marker';
            node.hidden = true;
            const arrow = document.createElement('i');
            arrow.className = 'threat-arrow';
            const label = document.createElement('span');
            label.className = 'threat-label';
            const distance = document.createElement('span');
            distance.className = 'threat-distance';
            node.append(arrow, label, distance);
            host.append(node);
            this.markers.push({ node, label, distance, x: 0, y: 0, active: false });
            this.candidates.push({ enemy: null, point: { x: 0, y: 0, visible: false }, score: -Infinity, distance: 0 });
        }
        for (let i = 0; i < 4; i++) {
            const node = document.createElement('div');
            node.className = 'damage-direction';
            node.hidden = true;
            directions.append(node);
            this.directions.push({ node, life: 0 });
        }
    }
    effect(e: HudEffect, player: {
        x: number;
        y: number;
    }): void {
        if (e.type === 'enemy-attack')
            this.recentAttack = { x: e.x, y: e.y, life: .25 };
        if (e.type !== 'hurt')
            return;
        const source = e.source && typeof e.source === 'object' ? e.source as {
            x?: number;
            y?: number;
        } : undefined;
        const origin = typeof source?.x === 'number' && typeof source.y === 'number' ? source as {
            x: number;
            y: number;
        } : this.recentAttack;
        if (!origin)
            return; // Old hurt events contain the marine position, not an attack direction.
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
    update(enemies: readonly EnemySnapshot[], player: {
        x: number;
        y: number;
    }, bounds: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }): void {
        const width = this.renderer.canvas.clientWidth, height = this.renderer.canvas.clientHeight;
        for (const c of this.candidates) {
            c.enemy = null;
            c.score = -Infinity;
        }
        for (const enemy of enemies) {
            if (enemy.health <= 0 || enemy.alpha < .2)
                continue;
            const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            const attacking = enemy.windupMs > 0 || enemy.chargeMs > 0 || enemy.pendingAttack !== null;
            if (!attacking && distance > 850)
                continue;
            projectWorld(this.renderer, enemy.x, enemy.y, this.point);
            if (this.point.visible || !Number.isFinite(this.point.x) || !Number.isFinite(this.point.y))
                continue;
            const score = (attacking ? 10000 : 0) + (enemy.elite ? 1000 : 0) - distance;
            let index = 0;
            for (let i = 1; i < THREAT_CAPACITY; i++)
                if (this.candidates[i].score < this.candidates[index].score)
                    index = i;
            if (score <= this.candidates[index].score)
                continue;
            const c = this.candidates[index];
            c.enemy = enemy;
            c.distance = distance;
            c.score = score;
            c.point.x = this.point.x;
            c.point.y = this.point.y;
        }
        // Markers occupy side rails, leaving the action bar and center clear.
        let leftCount = 0, rightCount = 0;
        for (const marker of this.markers)
            marker.active = false;
        const maxPerSide = height < 600 ? 2 : 4;
        for (let i = 0; i < THREAT_CAPACITY; i++) {
            const c = this.candidates[i], marker = this.markers[i];
            marker.node.hidden = true;
            if (!c.enemy)
                continue;
            const right = c.point.x >= width / 2;
            const index = right ? rightCount++ : leftCount++;
            if (index >= maxPerSide)
                continue;
            const x = right ? width - 162 : 12;
            const top = height < 600 ? height * .44 : height * .36;
            let y = Math.min(height - 150, top + index * 44), found = false;
            for (let attempt = 0; attempt < Math.floor((height - 120) / 44) + 1; attempt++) {
                const candidate = attempt === 0 ? y : 8 + (attempt - 1) * 44;
                if (candidate < 8 || candidate + 40 > height - 110)
                    continue;
                if (x < bounds.right + 10 && x + 150 > bounds.left - 10 && candidate < bounds.bottom + 10 && candidate + 40 > bounds.top - 10)
                    continue;
                if (hudObstructs(x, candidate, x + 150, candidate + 40))
                    continue;
                let occupied = false;
                for (let j = 0; j < i; j++) {
                    const other = this.markers[j];
                    if (other.active && other.x === x && Math.abs(other.y - candidate) < 44) {
                        occupied = true;
                        break;
                    }
                }
                if (occupied)
                    continue;
                y = candidate;
                found = true;
                break;
            }
            if (!found)
                continue;
            marker.x = x;
            marker.y = y;
            marker.active = true;
            marker.node.hidden = false;
            marker.node.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
            marker.node.style.setProperty('--angle', `${Math.atan2(c.point.y - (bounds.top + bounds.bottom) / 2, c.point.x - (bounds.left + bounds.right) / 2) + Math.PI}rad`);
            const enemy = c.enemy, attacking = enemy.windupMs > 0 || enemy.chargeMs > 0 || enemy.pendingAttack !== null;
            marker.node.dataset.elite = String(enemy.elite);
            marker.node.dataset.attacking = String(attacking);
            const label = `${enemy.elite ? 'ELITE ' : ''}${enemy.type.toUpperCase()}${attacking ? ' · ATTACK' : ''}`;
            if (marker.label.textContent !== label)
                marker.label.textContent = label;
            const distance = `${Math.round(c.distance / 32)}m`;
            if (marker.distance.textContent !== distance)
                marker.distance.textContent = distance;
        }
    }
    tick(dt: number): void {
        if (this.recentAttack) {
            this.recentAttack.life -= dt;
            if (this.recentAttack.life <= 0)
                this.recentAttack = null;
        }
        for (const d of this.directions) {
            if (!d.life)
                continue;
            d.life = Math.max(0, d.life - dt);
            d.node.hidden = !d.life;
            d.node.style.opacity = String(d.life / .65);
        }
    }
    clear(): void {
        for (const m of this.markers)
            m.node.hidden = true;
        for (const d of this.directions) {
            d.node.hidden = true;
            d.life = 0;
        }
        this.recentAttack = null;
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
    }
}
