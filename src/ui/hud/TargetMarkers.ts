import type {DepthGame} from '../../DepthGame';
import type {DepthRenderer} from '../../render/DepthRenderer';
import {getViewportWidth, getViewportHeight, projectWorld, projectActorBounds} from '../gameAdapter';
import {hudObstructs, presentationObstructs} from './layout';

import type {EncounterCues} from './EncounterCues';

const gold = '#eac786';
const violet = '#c3a9ed';

export class TargetMarkers {
    private readonly canvas = document.createElement('canvas');
    private readonly context = this.canvas.getContext('2d');
    private readonly point = {x: 0, y: 0, visible: false};
    private readonly body = {left: 0, top: 0, right: 0, bottom: 0};

    constructor(host: HTMLElement) {
        this.canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none';
        this.canvas.hidden = true;
        host.prepend(this.canvas);
    }

    update(game: DepthGame, renderer: DepthRenderer, cues: EncounterCues['locations']) {
        const ctx = this.context;
        this.canvas.hidden = game.status !== 'playing';
        if (!ctx || this.canvas.hidden) return;
        const width = getViewportWidth(renderer), height = getViewportHeight(renderer);
        if (this.canvas.width !== width) this.canvas.width = width;
        if (this.canvas.height !== height) this.canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        for (const cue of cues) {
            if (cue.life <= 0) continue;
            const point = projectWorld(renderer, cue.x, cue.y, this.point, .12);
            if (!point.visible || hudObstructs(point.x - 28, point.y - 20, point.x + 28, point.y + 20)) continue;
            ctx.strokeStyle = cue.kind === 'priority' ? '#81c8b7' : '#eac786';
            ctx.globalAlpha = cue.life * .8;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(point.x, point.y, 20 + (1 - cue.life) * 16, 9 + (1 - cue.life) * 8, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        const enemies = game.enemies.snapshot.enemies;
        for (const enemy of enemies) {
            if (enemy.health <= 0 || enemy.alpha < .2 || (!enemy.priority && !enemy.controlResistant)) continue;
            const body = this.body;
            if (!projectActorBounds(renderer, enemy.id, enemy.x, enemy.y, enemy.radius, body)) continue;
            const x = (body.left + body.right) / 2, y = body.top - 10;
            if (x < 20 || x > width - 20 || y < 34 || y > height - 20 ||
                hudObstructs(x - 28, y - 24, x + 28, y + 12) ||
                presentationObstructs(x - 28, y - 24, x + 28, y + 12)) continue;
            ctx.lineJoin = 'round';
            if (enemy.priority) {
                ctx.strokeStyle = gold;
                ctx.lineWidth = 2.8;
                ctx.beginPath();
                ctx.moveTo(x - 13, y - 7);
                ctx.lineTo(x - 10, y + 4);
                ctx.lineTo(x + 10, y + 4);
                ctx.lineTo(x + 13, y - 7);
                ctx.lineTo(x + 5, y - 2);
                ctx.lineTo(x, y - 10);
                ctx.lineTo(x - 5, y - 2);
                ctx.closePath();
                ctx.stroke();

                ctx.strokeStyle = '#eac78655';
                ctx.lineWidth = 1;
                let links = 0;
                for (const escort of enemies) {
                    if (escort.health <= 0 || escort.priority || escort.beat !== enemy.beat ||
                        (escort.role !== 'screen' && escort.role !== 'anchor')) continue;
                    projectWorld(renderer, escort.x, escort.y, this.point, .22);
                    if (!this.point.visible || hudObstructs(this.point.x, this.point.y, this.point.x, this.point.y)) continue;
                    ctx.beginPath();
                    ctx.moveTo(x, body.bottom);
                    ctx.lineTo(this.point.x, this.point.y);
                    ctx.stroke();
                    if (++links === 3) break;
                }
            }
            if (enemy.controlResistant) {
                const resisted = game.boonStatuses(enemy.id).controlResisted;
                const iconX = x + (enemy.priority ? 23 : 0);
                ctx.strokeStyle = resisted ? '#f2dfff' : violet;
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(iconX - 6, y - 6);
                ctx.lineTo(iconX + 6, y - 6);
                ctx.lineTo(iconX + 5, y + 2);
                ctx.lineTo(iconX, y + 7);
                ctx.lineTo(iconX - 5, y + 2);
                ctx.closePath();
                ctx.stroke();
                ctx.strokeStyle = resisted ? '#e2bcffcc' : '#c3a9ed72';
                ctx.beginPath();
                ctx.ellipse(x, (body.top + body.bottom) / 2, Math.max(5, (body.right - body.left) / 2),
                    Math.max(5, (body.bottom - body.top) / 2), 0, Math.PI * .78, Math.PI * 1.25);
                ctx.stroke();
                if (resisted) {
                    ctx.font = '700 18px Barlow, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#f2dfff';
                    ctx.fillText('RESISTED', x, y - 15);
                }
            }
        }
    }

    dispose() { this.canvas.remove(); }
}
