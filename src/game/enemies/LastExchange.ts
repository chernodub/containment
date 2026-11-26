import {ENEMY_ATTACK_SHAPES} from './attackShapes';
import type { EnemyEvent } from './EnemySystem';
import type { MeleeStrikeShape } from './meleeAttacks';
import type { EnemyId } from './types';
import type { IncomingDamageOrigin } from '../abilities/RunStats';

export type AttackFootprint = Readonly<{
  owner: number;
  family: EnemyId;
  x: number;
  y: number;
  angle: number;
  shape: MeleeStrikeShape | {kind: 'circle'; range: number};
  at: number;
  committed: boolean;
}>;
type Point = {x: number; y: number};
type Marine = Point & {angle: number; radius: number};
type Blocker = Point & {width: number; height: number};
export type LastExchange = Readonly<{
  marine: Marine;
  earlier?: Marine;
  attacks: readonly AttackFootprint[];
  fatal?: AttackFootprint;
  blockers: readonly Blocker[];
}>;

/** Room-local presentation history of the same shapes the enemy system commits. */
export class ExchangeHistory {
  private attacks: AttackFootprint[] = [];

  private positions: {marine: Marine; at: number}[] = [];

  clear(): void { this.attacks = []; this.positions = []; }

  sample(marine: Marine, at: number): void {
    if (at - (this.positions.at(-1)?.at ?? -Infinity) < .05) return;
    const {x,y,angle,radius} = marine;
    this.positions.push({marine:{x,y,angle,radius},at});
    if (this.positions.length > 40) this.positions.shift();
  }

  record(events: readonly EnemyEvent[], at: number, projectileWidth: number): void {
    for (const event of events) {
      if (event.type === 'melee-strike' || event.type === 'melee-warning') {
        this.add({owner:event.enemyId, family:event.enemyType, x:event.x, y:event.y,
          angle:event.angle, shape:event.shape, at, committed:event.type === 'melee-strike'});
      } else if (event.type === 'attack-warning' && event.enemyType === 'brute') {
        this.add({owner:event.enemyId,family:event.enemyType,x:event.x,y:event.y,
          angle:Math.atan2(event.targetY-event.y,event.targetX-event.x),
          shape:{kind:'line',range:0,width:0,halfAngle:0},at,committed:false});
      } else if (event.type === 'contact-attack' && event.chargeFootprint) {
        const impact = event.chargeFootprint;
        const start = [...this.attacks].reverse().find(attack => attack.owner === event.enemyId
          && !attack.committed && attack.shape.kind === 'line' && attack.shape.range === 0 && at-attack.at <= 3);
        const range = impact.shape.range+(start ? Math.hypot(impact.x-start.x,impact.y-start.y) : 0);
        this.add({owner:event.enemyId,family:event.enemyType,x:start?.x??impact.x,y:start?.y??impact.y,
          angle:impact.angle,shape:{...impact.shape,range},at,committed:true});
      } else if (event.type === 'hazard-attack') {
        const dx = event.targetX - event.sourceX, dy = event.targetY - event.sourceY;
        this.add({owner:event.enemyId, family:event.enemyType, x:event.sourceX, y:event.sourceY,
          angle:Math.atan2(dy, dx), shape:{kind:'line', range:Math.hypot(dx, dy), width:projectileWidth, halfAngle:0},
          at, committed:true});
      }
    }
  }

  private add(attack: AttackFootprint): void {
    const latest = this.attacks.at(-1);
    if (latest?.owner === attack.owner && !latest.committed) this.attacks.pop();
    this.attacks.push(attack);
    if (this.attacks.length > 32) this.attacks.shift();
  }

  snapshot(marine: Marine, blockers: readonly Blocker[], at: number, fatalOwner: number | undefined,
    source: IncomingDamageOrigin, origin?: Point & {radius?: number}): LastExchange | undefined {
    const recent = this.attacks.filter(attack => attack.committed && at - attack.at <= 2);
    let recordedFatal = [...recent].reverse().find(attack => attack.owner === fatalOwner);
    let fatal = recordedFatal;
    if (source.source === 'enemy-projectile' && origin) {
      const dx = marine.x-origin.x, dy = marine.y-origin.y;
      const shot = [...recent].reverse().find(attack => attack.owner === fatalOwner
        && attack.shape.kind === 'line' && attack.x === origin.x && attack.y === origin.y);
      recordedFatal = shot;
      const angle = shot?.angle ?? Math.atan2(dy,dx);
      const width = shot?.shape.kind === 'line' ? shot.shape.width : 2*ENEMY_ATTACK_SHAPES.spitterProjectileRadius;
      fatal = {owner:fatalOwner ?? -1,family:source.enemyFamily ?? 'spitter',...origin,at,committed:true,
        angle,shape:{kind:'line',range:Math.max(0,dx*Math.cos(angle)+dy*Math.sin(angle)),width,halfAngle:0}};
    } else if (origin?.radius && ['acid-pool','boss-attack','self-blast'].includes(source.source)) {
      fatal = {owner:-1,family:source.enemyFamily ?? 'queen',...origin,at,committed:true,
        angle:0,shape:{kind:'circle',range:origin.radius}};
    }
    // An unrelated attack cannot stand in for the fatal footprint.
    if (!fatal) return;
    const attacks = recent.filter(attack => attack !== recordedFatal
      && Math.hypot(attack.x-marine.x,attack.y-marine.y) <= attack.shape.range+220).reverse();
    const earlier = this.positions.reduce<typeof this.positions[number] | undefined>((best, sample) =>
      at-sample.at >= .8 && at-sample.at <= 1.2 && (!best || Math.abs(at-sample.at-1)<Math.abs(at-best.at-1)) ? sample : best, undefined)?.marine;
    const {x,y,angle,radius} = marine;
    const left = Math.min(x,earlier?.x??x,fatal.x)-300, right = Math.max(x,earlier?.x??x,fatal.x)+300;
    const top = Math.min(y,earlier?.y??y,fatal.y)-240, bottom = Math.max(y,earlier?.y??y,fatal.y)+240;
    return {marine:{x,y,angle,radius}, earlier, attacks, fatal, blockers:blockers.filter(b =>
      b.x<right && b.x+b.width>left && b.y<bottom && b.y+b.height>top)};
  }
}
