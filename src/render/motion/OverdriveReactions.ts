import {ABILITY_CATALOG} from '../../game/abilities/catalog';
import {UNIT} from '../abilities/types';
import type {GameEffect} from '../../DepthGame';
import type {ElementKit} from '../abilities/ElementKit';
import type {ActorModel} from '../models';

export type TargetElement = 'kinetic' | 'ice' | 'fire' | 'arc';

/** Native damage can retire an actor just before its ability target receipt. */
export class OverdriveReactions {
  private overclock = false;

  reset() { this.overclock = false; }

  event(effect: GameEffect, actors: ReadonlyMap<number,ActorModel>, corpses: readonly {id:number;model:ActorModel}[], kit?: ElementKit) {
    const ability = effect.ability;
    if (ability?.phase === 'impact' && (ability.element === 'pyro' || ability.ability === 'whiteout')) {
      if (ability.ability !== 'flashfire') for (const id of ability.targetIds ?? []) this.target(id, actors, corpses)?.shadeCastPeak?.();
      const shape = ABILITY_CATALOG[ability.ability].shape;
      if (shape.kind === 'circle') {
        const placed = ability.ability === 'napalm-charge';
        const x = (placed ? ability.targetX ?? effect.x : effect.x) / UNIT;
        const z = (placed ? ability.targetY ?? effect.y : effect.y) / UNIT;
        for (const actor of actors.values()) {
          if (Math.hypot(actor.root.position.x-x,actor.root.position.z-z) <= (ability.radius ?? shape.radius)/UNIT) actor.shadeCastPeak?.();
        }
      }
    }
    if (ability?.ability === 'overclock') {
      if (ability.phase === 'impact') this.overclock = true;
      if (ability.phase === 'end') this.overclock = false;
      return;
    }
    if (ability && (ability.slot === 'overdrive' || ability.ability === 'overload') && ability.targetIds) {
      const element = ability.ability === 'railbreaker' && ability.phase === 'link' ? 'kinetic'
        : ability.ability === 'overload' ? 'arc' : ability.ability === 'whiteout' ? 'ice' : ability.ability === 'meltdown' ? 'fire' : undefined;
      if (element) for (const id of ability.targetIds) {
        this.target(id, actors, corpses)?.reactToElement?.(element, ability.angle ?? 0);
      }
    } else if (this.overclock && effect.weapon && (effect.contact === 'damage' || effect.contact === 'armor') && effect.targetId !== undefined) {
      const actor = this.target(effect.targetId, actors, corpses);
      const angle = effect.angle ?? 0;
      actor?.reactToElement?.('arc',angle);
      if (actor && kit) {
        const {x,y,z}=actor.root.position;
        kit.overclockContact(x,y,z,actor.height,angle);
      }
    }
  }

  private target(id:number, actors:ReadonlyMap<number,ActorModel>, corpses:readonly {id:number;model:ActorModel}[]) {
    const live = actors.get(id);
    if (live) return live;
    for (const corpse of corpses) if (corpse.id === id) return corpse.model;
  }
}
