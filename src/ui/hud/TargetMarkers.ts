import {icon} from '../icons';
import type {DepthGame} from '../../DepthGame';
import type {DepthRenderer} from '../../render/DepthRenderer';
import {getViewportWidth, getViewportHeight, projectWorld, projectActorBounds} from '../gameAdapter';
import {hudObstructs, presentationObstructs} from './layout';
import {threatEdgePoint} from './ThreatIndicators';

import type {EncounterCues} from './EncounterCues';

const paleCrest = '#dbe8f1';
const violet = '#c3a9ed';

export class TargetMarkers {
    private readonly canvas = document.createElement('canvas');
    private readonly context = this.canvas.getContext('2d');
    private readonly point = {x: 0, y: 0, visible: false};
    private readonly marine = {x: 0, y: 0, visible: false};
    private readonly edge = {x: 0, y: 0};
    private readonly resistance = new Map<number,{started:number;active:boolean}>();
    private room = -1;
    private readonly banked = document.createElement('div');
    private readonly broodIcons = {
        relay: document.createElement('div'),
        supply: document.createElement('div'),
    };
    private painted = false;
    private readonly body = {left: 0, top: 0, right: 0, bottom: 0};

    constructor(host: HTMLElement) {
        this.canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none';
        this.canvas.hidden = true;
        host.prepend(this.canvas);
        this.banked.className='banked-wound-marker';
        this.banked.hidden=true;
        host.append(this.banked);
        for(const [destination,marker] of Object.entries(this.broodIcons)){
            marker.innerHTML=icon(destination==='relay'?'overdrive':'armor');
            marker.style.cssText='position:absolute;width:26px;height:26px;color:#ccf8eb;background:#0d201f;border:1px solid #689e91;pointer-events:none';
            marker.hidden=true;
            host.append(marker);
        }
    }

    update(game: DepthGame, renderer: DepthRenderer, cues: EncounterCues['locations'], hintTargetId: number | null, showDamage=true) {
        const ctx = this.context;
        this.canvas.hidden = game.status !== 'playing';
        this.banked.hidden=true;
        for(const marker of Object.values(this.broodIcons))marker.hidden=true;
        if (!ctx || this.canvas.hidden) return;
        const width = getViewportWidth(renderer), height = getViewportHeight(renderer);
        const enemies = game.enemies.snapshot.enemies;
        if (this.canvas.width !== width) this.canvas.width = width;
        if (this.canvas.height !== height) this.canvas.height = height;
        if (this.painted) ctx.clearRect(0, 0, width, height);
        this.painted = false;
        const preview=game.relayCoverPreview;
        if(preview){
            const start=projectWorld(renderer,preview.from.x,preview.from.y,{x:0,y:0,visible:false},.15);
            const stop=projectWorld(renderer,preview.x,preview.y,this.point,.15);
            if(stop.visible&&Number.isFinite(start.x)&&Number.isFinite(start.y)){
                this.painted=true;
                ctx.strokeStyle='#ff9c77';
                ctx.lineWidth=2;
                ctx.beginPath();
                ctx.moveTo(start.x,start.y);
                ctx.lineTo(stop.x,stop.y);
                const angle=Math.atan2(stop.y-start.y,stop.x-start.x);
                const dx=5*Math.sin(angle),dy=5*Math.cos(angle);
                ctx.moveTo(stop.x-dx,stop.y+dy);
                ctx.lineTo(stop.x+dx,stop.y-dy);
                ctx.stroke();
            }
        }
        for (const cue of cues) {
            if (cue.life <= 0) continue;
            const point = projectWorld(renderer, cue.x, cue.y, this.point, .12);
            if (!point.visible || hudObstructs(point.x - 28, point.y - 20, point.x + 28, point.y + 20)) continue;
            this.painted = true;
            ctx.strokeStyle = cue.kind === 'priority' ? '#81c8b7' : '#fff0ce';
            ctx.globalAlpha = cue.life * .8;
            ctx.lineWidth = 2;
            if(cue.kind==='priority'){this.crest(ctx,point.x,point.y);ctx.globalAlpha=1;continue;}
            ctx.beginPath();
            ctx.ellipse(point.x, point.y, 20 + (1 - cue.life) * 16, 9 + (1 - cue.life) * 8, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        if (this.room !== game.roomRevision) {this.room=game.roomRevision;this.resistance.clear();}
        let tokens: CSSStyleDeclaration | undefined;
        for (const enemy of enemies) {
            if(showDamage&&enemy.arrivalBanked&&projectActorBounds(renderer,enemy.id,enemy.x,enemy.y,enemy.radius,this.body)){
                const x=(this.body.left+this.body.right)/2,y=this.body.top-24;
                if(x>=65&&x<=width-65&&y>=32&&y<height&&!hudObstructs(x-60,y-12,x+60,y+12)){
                    this.banked.textContent=`${Math.round(enemy.arrivalBanked)} banked`;
                    this.banked.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;
                    this.banked.hidden=false;
                }
            }
            if (enemy.podStage) {
                const point = projectWorld(renderer, enemy.x, enemy.y, this.point, .08);
                if(enemy.broodDestination&&Number.isFinite(point.x)&&Number.isFinite(point.y)){
                    let x=point.x,y=point.y+23;
                    if(!point.visible){
                        const p=projectWorld(renderer,game.player.x,game.player.y,this.marine,.08);
                        const bearing=Math.atan2(point.y-p.y,point.x-p.x);
                        ({x,y}=threatEdgePoint(p.x,p.y,bearing,width,height,this.edge));
                    }
                    if(!hudObstructs(x-13,y-13,x+13,y+13)){
                        const marker=this.broodIcons[enemy.broodDestination];
                        marker.style.transform=`translate(${x-13}px,${y-13}px)`;
                        marker.hidden=false;
                    }
                }
                if (point.visible) {
                    tokens ??= getComputedStyle(this.canvas);
                    this.painted=true;
                    ctx.strokeStyle=tokens.getPropertyValue('--danger').trim() || tokens.getPropertyValue('--text').trim();
                    ctx.lineWidth=3;
                    ctx.beginPath();
                    ctx.ellipse(point.x,point.y,25,11,0,0,Math.PI*2*(enemy.podStage==='sealed'?1:Math.max(.05,((enemy.podProgress??0)-.2)/.45)));
                    ctx.stroke();
                }
            }
            if (enemy.id === hintTargetId && !enemy.priority && enemy.health > 0 && enemy.alpha >= .2) {
                const {x, y, visible} = projectWorld(renderer, enemy.x, enemy.y, this.point, 1.6);
                if (visible && !hudObstructs(x - 8, y - 8, x + 8, y + 8) &&
                    !presentationObstructs(x - 8, y - 8, x + 8, y + 8)) {
                    this.painted = true;
                    ctx.strokeStyle = '#08151d';
                    ctx.fillStyle = '#d8f4ff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(x - 6, y - 5);
                    ctx.lineTo(x + 6, y - 5);
                    ctx.lineTo(x, y + 2);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fill();
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
                    tokens ??= getComputedStyle(this.canvas);
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
                this.crest(ctx,x,y);
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

    private crest(ctx:CanvasRenderingContext2D,x:number,y:number){
        ctx.beginPath();
        ctx.moveTo(x-13,y-7);
        ctx.lineTo(x-10,y+4);
        ctx.lineTo(x+10,y+4);
        ctx.lineTo(x+13,y-7);
        ctx.lineTo(x+5,y-2);
        ctx.lineTo(x,y-10);
        ctx.lineTo(x-5,y-2);
        ctx.closePath();
        ctx.stroke();
    }

    dispose() { this.banked.remove(); this.canvas.remove(); for(const marker of Object.values(this.broodIcons))marker.remove(); }
}
