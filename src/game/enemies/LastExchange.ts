import type { EnemyEvent } from './EnemySystem';
import type { MeleeStrikeShape } from './meleeAttacks';
import type { StandardEnemyId } from './types';

export type AttackFootprint = Readonly<{
  owner: number;
  family: StandardEnemyId;
  x: number;
  y: number;
  angle: number;
  shape: MeleeStrikeShape;
  at: number;
  committed: boolean;
}>;
type Point = {x: number; y: number};
type Blocker = Point & {width: number; height: number};
export type LastExchange = Readonly<{
  marine: Point & {angle: number; radius: number};
  attacks: readonly AttackFootprint[];
  fatal?: AttackFootprint;
  blockers: readonly Blocker[];
}>;

/** Room-local presentation history of the same shapes the enemy system commits. */
export class ExchangeHistory {
  private attacks: AttackFootprint[] = [];

  clear(): void { this.attacks = []; }

  record(events: readonly EnemyEvent[], at: number, projectileWidth: number): void {
    for (const event of events) {
      if (event.type === 'melee-strike' || event.type === 'melee-warning') {
        this.add({owner:event.enemyId, family:event.enemyType, x:event.x, y:event.y,
          angle:event.angle, shape:event.shape, at, committed:event.type === 'melee-strike'});
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

  snapshot(marine: LastExchange['marine'], blockers: readonly Blocker[], at: number, fatalOwner?: number): LastExchange | undefined {
    const recent = this.attacks.filter(attack => at - attack.at <= 1.8);
    const fatal = [...recent].reverse().find(attack => attack.owner === fatalOwner && attack.committed);
    const nearby = recent.filter(attack => Math.hypot(attack.x - marine.x, attack.y - marine.y) <= attack.shape.range + 170);
    const owners = new Set<number>();
    const attacks = nearby.reverse().filter(attack => {
      if (attack === fatal || owners.has(attack.owner)) return false;
      owners.add(attack.owner);
      return true;
    }).slice(0, 3);
    if (!fatal && !attacks.length) return;
    const {x,y,angle,radius} = marine;
    return {marine:{x,y,angle,radius}, attacks, fatal, blockers:blockers.filter(blocker =>
      blocker.x < x+220 && blocker.x+blocker.width > x-220 && blocker.y < y+165 && blocker.y+blocker.height > y-165)};
  }
}
