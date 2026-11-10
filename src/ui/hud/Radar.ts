import type { DepthGame } from '../../DepthGame';
const NS = 'http://www.w3.org/2000/svg';
/** Optional geometry-only scan. Static room paths change once per room revision. */
export class Radar {
    private revision = -1;
    private player: SVGCircleElement;
    private enemies: SVGCircleElement[] = [];
    private sx = 1;
    private sy = 1;
    private ox = 5;
    private oy = 5;
    constructor(private host: HTMLElement, private map: SVGSVGElement) {
        this.player = document.createElementNS(NS, 'circle');
        this.player.setAttribute('class', 'radar-player');
        this.player.setAttribute('r', '2.5');
    }
    update(game: DepthGame, enabled: boolean): void {
        this.host.hidden = !enabled;
        if (!enabled)
            return;
        if (this.revision !== game.roomRevision) {
            this.revision = game.roomRevision;
            this.map.replaceChildren();
            this.enemies.length = 0;
            const g = game.geometry;
            this.sx = this.sy = Math.min(134 / g.bounds.width, 90 / g.bounds.height);
            this.ox = 5 + (134 - g.bounds.width * this.sx) / 2;
            this.oy = 5 + (90 - g.bounds.height * this.sy) / 2;
            const fragment = document.createDocumentFragment();
            if (g.boundary) {
                const polygon = document.createElementNS(NS, 'polygon');
                polygon.setAttribute('points', g.boundary.map(p => `${this.ox + p.x * this.sx},${this.oy + p.y * this.sy}`).join(' '));
                polygon.setAttribute('fill', 'none');
                polygon.setAttribute('stroke', '#9fe8ff66');
                fragment.append(polygon);
            }
            else {
                const rect = document.createElementNS(NS, 'rect');
                rect.setAttribute('x', String(this.ox));
                rect.setAttribute('y', String(this.oy));
                rect.setAttribute('width', String(g.bounds.width * this.sx));
                rect.setAttribute('height', String(g.bounds.height * this.sy));
                rect.setAttribute('fill', 'none');
                rect.setAttribute('stroke', '#9fe8ff66');
                fragment.append(rect);
            }
            for (const wall of g.blockers) {
                const rect = document.createElementNS(NS, 'rect');
                rect.setAttribute('class', 'radar-wall');
                rect.setAttribute('x', String(this.ox + wall.x * this.sx));
                rect.setAttribute('y', String(this.oy + wall.y * this.sy));
                rect.setAttribute('width', String(wall.width * this.sx));
                rect.setAttribute('height', String(wall.height * this.sy));
                fragment.append(rect);
            }
            for (const hole of g.voids ?? []) {
                const polygon = document.createElementNS(NS, 'polygon');
                polygon.setAttribute('points', hole.map(p => `${this.ox + p.x * this.sx},${this.oy + p.y * this.sy}`).join(' '));
                polygon.setAttribute('fill', '#02080b');
                polygon.setAttribute('stroke', '#9fe8ff44');
                fragment.append(polygon);
            }
            for (const breach of g.breaches) {
                const mark = document.createElementNS(NS, 'circle');
                mark.setAttribute('class', 'radar-breach');
                mark.setAttribute('cx', String(this.ox + breach.x * this.sx));
                mark.setAttribute('cy', String(this.oy + breach.y * this.sy));
                mark.setAttribute('r', '2.2');
                fragment.append(mark);
            }
            const exit = document.createElementNS(NS, 'circle');
            exit.setAttribute('class', 'radar-exit');
            exit.setAttribute('cx', String(this.ox + g.exitPoint.x * this.sx));
            exit.setAttribute('cy', String(this.oy + g.exitPoint.y * this.sy));
            exit.setAttribute('r', '3');
            fragment.append(exit);
            for (let i = 0; i < 40; i++) {
                const dot = document.createElementNS(NS, 'circle');
                dot.setAttribute('class', 'radar-enemy');
                dot.setAttribute('r', '1.4');
                dot.setAttribute('visibility', 'hidden');
                fragment.append(dot);
                this.enemies.push(dot);
            }
            fragment.append(this.player);
            this.map.append(fragment);
        }
        this.player.setAttribute('cx', String(this.ox + game.player.x * this.sx));
        this.player.setAttribute('cy', String(this.oy + game.player.y * this.sy));
        let index = 0;
        for (const enemy of game.enemies.snapshot.enemies) {
            if (enemy.health <= 0 || enemy.alpha < .2)
                continue;
            const dot = this.enemies[index++];
            if (!dot)
                break;
            dot.setAttribute('visibility', 'visible');
            dot.setAttribute('cx', String(this.ox + enemy.x * this.sx));
            dot.setAttribute('cy', String(this.oy + enemy.y * this.sy));
        }
        for (; index < this.enemies.length; index++)
            this.enemies[index].setAttribute('visibility', 'hidden');
    }
    dispose(): void { this.map.replaceChildren(); this.enemies.length = 0; this.host.hidden = true; }
}
