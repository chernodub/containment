import type {GameEffect} from '../../DepthGame';
import type {ActorModel} from '../models';

export type TargetElement = 'kinetic' | 'ice' | 'fire' | 'arc';

/** Native damage can retire an actor just before its ability target receipt. */
export class OverdriveReactions {
  private overclock = false;

  reset() { this.overclock = false; }

  event(effect: GameEffect, actors: ReadonlyMap<number,ActorModel>, corpses: readonly {id:number;model:ActorModel}[]) {
    const ability = effect.ability;
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
    } else if (this.overclock && effect.weapon && effect.contact === 'damage' && effect.targetId !== undefined) {
      this.target(effect.targetId, actors, corpses)?.reactToElement?.('arc',effect.angle ?? 0);
    }
  }

  private target(id:number, actors:ReadonlyMap<number,ActorModel>, corpses:readonly {id:number;model:ActorModel}[]) {
    const live = actors.get(id);
    if (live) return live;
    for (const corpse of corpses) if (corpse.id === id) return corpse.model;
  }
}
