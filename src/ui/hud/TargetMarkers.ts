import type {DepthGame} from '../../DepthGame';
import type {DepthRenderer} from '../../render/DepthRenderer';
import {getViewportWidth, getViewportHeight, projectWorld, projectActorBounds} from '../gameAdapter';
import {hudObstructs, presentationObstructs} from './layout';

import type {EncounterCues} from './EncounterCues';

const paleCrest = '#dbe8f1';
const violet = '#c3a9ed';

export class TargetMarkers {
    private readonly canvas = document.createElement('canvas');
    private readonly context = this.canvas.getContext('2d');
    private readonly point = {x: 0, y: 0, visible: false};
    private readonly resistance = new Map<number,{started:number;active:boolean}>();
    private room = -1;
    private painted = false;
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
        const enemies = game.enemies.snapshot.enemies;
        if (this.canvas.width !== width) this.canvas.width = width;
        if (this.canvas.height !== height) this.canvas.height = height;
        if (this.painted) ctx.clearRect(0, 0, width, height);
        this.painted = false;
        for (const cue of cues) {
            if (cue.life <= 0) continue;
            const point = projectWorld(renderer, cue.x, cue.y, this.point, .12);
            if (!point.visible || hudObstructs(point.x - 28, point.y - 20, point.x + 28, point.y + 20)) continue;
            this.painted = true;
            ctx.strokeStyle = cue.kind === 'priority' ? '#81c8b7' : '#fff0ce';
            ctx.globalAlpha = cue.life * .8;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(point.x, point.y, 20 + (1 - cue.life) * 16, 9 + (1 - cue.life) * 8, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        if (this.room !== game.roomRevision) {this.room=game.roomRevision;this.resistance.clear();}
        const tokens = getComputedStyle(this.canvas);
        for (const enemy of enemies) {
            if (enemy.podStage) {
                const point = projectWorld(renderer, enemy.x, enemy.y, this.point, .08);
                if (point.visible) {
                    this.painted=true;
                    ctx.strokeStyle=tokens.getPropertyValue('--danger').trim() || tokens.getPropertyValue('--text').trim();
                    ctx.lineWidth=3;
                    ctx.beginPath();
                    ctx.ellipse(point.x,point.y,25,11,0,0,Math.PI*2*(enemy.podStage==='sealed'?1:Math.max(.05,((enemy.podProgress??0)-.2)/.45)));
                    ctx.stroke();
                }
            }
            if (enemy.health <= 0 || enemy.alpha < .2 || (!enemy.priority && !enemy.controlResistant)) continue;
            const body = this.body;
            if (!projectActorBounds(renderer, enemy.id, enemy.x, enemy.y, enemy.radius, body)) continue;
            const x = (body.left + body.right) / 2, y = body.top - 10;
            let resisted = false;
            if(enemy.controlResistant){
                const active = game.boonStatuses(enemy.id).controlResisted;
                const state = this.resistance.get(enemy.id) ?? {started:-Infinity,active:false};
                if(active&&!state.active&&game.elapsed-state.started>=1.1)state.started=game.elapsed;
                state.active=active;
                this.resistance.set(enemy.id,state);
                const age = game.elapsed-state.started;
                resisted = age<.42;
                if (resisted && !hudObstructs(body.left,body.top,body.right,body.bottom)) {
                    this.painted=true;
                    ctx.save();
                    ctx.globalAlpha=1-age/.5;
                    ctx.strokeStyle=tokens.getPropertyValue('--arc').trim();
                    ctx.lineWidth=3;
                    const cy=(body.top+body.bottom)/2;
                    const radius=Math.max(12,(body.right-body.left)/2)+age*42;
                    for(const side of [-1,1]){
                        ctx.beginPath();
                        ctx.moveTo(x+side*radius*.4,cy-radius*.65);
                        ctx.lineTo(x+side*radius,cy-radius*.4);
                        ctx.lineTo(x+side*radius*.85,cy+radius*.3);
                        ctx.lineTo(x+side*radius*.35,cy+radius*.65);
                        ctx.stroke();
                    }
                    ctx.font = '700 20px Barlow, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = tokens.getPropertyValue('--text').trim();
                    ctx.fillText('RESISTED', x, cy);
                    ctx.restore();
                }
            }
            if (x < 20 || x > width - 20 || y < 34 || y > height - 20 ||
                hudObstructs(x - 28, y - 24, x + 28, y + 12) ||
                presentationObstructs(x - 28, y - 24, x + 28, y + 12)) continue;
            this.painted = true;
            ctx.lineJoin = 'round';
            if (enemy.priority) {
                ctx.strokeStyle = paleCrest;
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
            }
            if (enemy.controlResistant) {
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
            }
        }
    }

    dispose() { this.canvas.remove(); }
}
