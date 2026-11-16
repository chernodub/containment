import type {DepthGame} from '../../DepthGame';
import type {DepthRenderer} from '../../render/DepthRenderer';
import {projectWorld, projectActorBounds} from '../gameAdapter';
import type {HudEffect} from './effects';

/** A short teaching outline reads the live authoritative footprint; it never decides a hit. */
export class FirstStrikeHighlight {
  private readonly node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  private readonly path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  private readonly bodyMasks = [document.createElementNS('http://www.w3.org/2000/svg','rect'),document.createElementNS('http://www.w3.org/2000/svg','rect')];
  private readonly actorBox = {left:0,right:0,top:0,bottom:0};
  private enemy: number | null = null;
  private used = false;
  private remaining = 0;
  private readonly projected = {x:0,y:0,visible:false};
  constructor(private readonly game: DepthGame, private readonly renderer: DepthRenderer) {
    this.node.classList.add('first-strike-highlight');
    this.node.setAttribute('aria-hidden','true');
    const defs=document.createElementNS('http://www.w3.org/2000/svg','defs'),mask=document.createElementNS('http://www.w3.org/2000/svg','mask'),background=document.createElementNS('http://www.w3.org/2000/svg','rect');
    mask.id='first-strike-body-mask';mask.setAttribute('maskUnits','userSpaceOnUse');
    background.setAttribute('width','100%');background.setAttribute('height','100%');background.setAttribute('fill','white');mask.append(background);
    for(const rect of this.bodyMasks){rect.setAttribute('fill','black');mask.append(rect);}
    defs.append(mask);this.path.setAttribute('mask','url(#first-strike-body-mask)');
    this.node.append(defs,this.path);document.getElementById('hud')?.append(this.node);
  }
  effect(event: HudEffect, enabled: boolean): void {
    if (this.used || !enabled || event.type !== 'enemy-warning' || event.id === undefined) return;
    const enemy = this.game.enemies.getSnapshot(event.id);
    if (enemy?.meleePhase !== 'windup') return;
    this.used = true; this.enemy = event.id; this.remaining = Math.min(.9,(event.durationMs ?? 650)/1000);
  }
  tick(dt: number, enabled: boolean): void {
    this.remaining -= dt;
    const enemy = this.enemy === null ? undefined : this.game.enemies.getSnapshot(this.enemy);
    if (!enabled || this.remaining <= 0 || !enemy || enemy.health <= 0 || enemy.meleePhase !== 'windup') {this.path.setAttribute('d','');return;}
    this.node.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);
    const player=this.game.player;
    const bodies=[{id:-2,x:player.x,y:player.y,radius:player.radius},enemy];
    for(let i=0;i<bodies.length;i++){const body=bodies[i],rect=this.bodyMasks[i];
      const visible=i===0 ? Object.assign(this.actorBox,this.renderer.playerScreenBounds(player.radius)) : projectActorBounds(this.renderer,body.id,body.x,body.y,body.radius,this.actorBox);
      rect.setAttribute('x',String(visible?this.actorBox.left-3:0));rect.setAttribute('y',String(visible?this.actorBox.top-3:0));rect.setAttribute('width',String(visible?Math.max(0,this.actorBox.right-this.actorBox.left+6):0));rect.setAttribute('height',String(visible?Math.max(0,this.actorBox.bottom-this.actorBox.top+6):0));
    }
    const shape=enemy.meleeShape, points: Array<[number,number]>=[];
    if (shape.kind === 'line') {
      const radius=shape.width/2;
      for(let i=0;i<=12;i++){const a=-Math.PI/2+i*Math.PI/12;points.push([shape.range+Math.cos(a)*radius,Math.sin(a)*radius]);}
      for(let i=0;i<=12;i++){const a=Math.PI/2+i*Math.PI/12;points.push([Math.cos(a)*radius,Math.sin(a)*radius]);}
    } else {
      points.push([0,0]);for(let i=0;i<=24;i++){const a=-shape.halfAngle+i*shape.halfAngle/12;points.push([Math.cos(a)*shape.range,Math.sin(a)*shape.range]);}
    }
    const c=Math.cos(enemy.meleeAngle),s=Math.sin(enemy.meleeAngle);
    const path=points.map(([x,y],index)=>{projectWorld(this.renderer,enemy.meleeOriginX+x*c-y*s,enemy.meleeOriginY+x*s+y*c,this.projected,.055);return `${index?'L':'M'}${this.projected.x.toFixed(1)} ${this.projected.y.toFixed(1)}`;}).join(' ')+' Z';
    this.path.setAttribute('d',path);
  }
  dispose(): void {this.node.remove();}
}
