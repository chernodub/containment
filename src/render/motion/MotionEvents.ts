import type {GameEffect} from '../../DepthGame';
import type {ActorModel} from '../models';
import type {MarineMotion} from './MarineMotion';

/** Body-only ability punctuation consumes the same accepted native event as VFX. */
export class MarineActionMotion {
  private id = '';
  private age = 0;
  private duration = .24;
  private previous: number | undefined;
  private anticipating = false;
  private phaseStart = 0;

  constructor(private motion: MarineMotion) {}

  event(effect: GameEffect) {
    const event = effect.ability;
    if (!event || !['cast', 'impact', 'dash-start'].includes(event.phase)) return;
    const continuation=this.anticipating&&this.id===event.ability&&event.phase==='impact';
    this.anticipating=event.phase==='cast';
    this.phaseStart=continuation?.42:0;
    this.id = event.ability;
    this.age = 0;
    this.duration = event.phase === 'cast' ? Math.max(.12, (event.durationMs ?? 160) / 1000) : .24;
  }

  update(time: number) {
    const dt = this.previous === undefined ? 0 : Math.max(0, Math.min(.05, time - this.previous));
    this.previous = time;
    if (!this.id) return;
    this.age += dt;
    const progress=Math.min(1,this.age/this.duration);
    this.motion.setAction(this.id,this.anticipating?progress*.42:this.phaseStart+(1-this.phaseStart)*progress,this.anticipating||this.phaseStart>0);
    if (!this.anticipating && this.age >= this.duration) { this.id = ''; this.motion.setAction('', 0); }
  }

  reset() { this.id = ''; this.age = 0; this.previous = undefined;this.anticipating=false;this.phaseStart=0; }
}

/** Direction is taken from the existing damage receipt; never from visual overlap. */
export function actorImpact(model: ActorModel | undefined, effect: GameEffect) {
  if (!model) return;
  const direction = effect.sourceX !== undefined && effect.sourceY !== undefined
    ? Math.atan2(effect.y - effect.sourceY, effect.x - effect.sourceX)
    : effect.angle ?? Math.PI / 2 - (model.root?.rotation.y ?? Math.PI / 2);
  // Per-pellet receipts still deserve a shotgun body stagger. These floors
  // change presentation amplitude only; damage and native shove stay untouched.
  const base = effect.weapon === 'pistol' ? .43 : effect.weapon === 'rifle' ? .40
    : effect.weapon === 'shotgun' ? .72 : effect.weapon === 'plasma' ? .55
    : effect.weapon === 'rocket' ? 1 : Math.min(1, (effect.damage ?? 24) / 42);
  const strength = effect.lethal ? Math.max(.68, base) : base;
  model.hit?.(strength, direction, effect.weapon==='shotgun'||effect.weapon==='rocket'||!!effect.lethal || (!effect.weapon && (effect.damage ?? 0) >= 36) || (effect.impulse ?? 0) > 200);
}

/** Read the last living status: the native dead-target query has already cleared it. */
export function actorDeathCue(model: ActorModel): 'none' | 'frost' | 'burn' | 'arc' | 'acid' {
  const status = model.root.userData.visualStatus;
  const cue = status?.frozen ? 'frost' : status?.burning ? 'burn' : status?.shocked ? 'arc' : status?.poisoned ? 'acid' : 'none';
  return model.terminalCue?.(cue) ?? cue;
}

/** Locked warnings keep the body's facing on the same native attack vector. */
export function enemyMotionAim(enemy: {
  type: string; x: number; y: number; targetX: number; targetY: number;
  meleePhase?:string;meleeAngle?:number;
  lockX: number; lockY: number; pendingAttack: 'spit' | 'charge' | null; chargeMs: number;
}, player: {x: number; y: number}) {
  if(enemy.meleePhase&&enemy.meleePhase!=='approach')return enemy.meleeAngle??0;
  if (enemy.pendingAttack === 'charge' || enemy.chargeMs > 0) return Math.atan2(enemy.lockY, enemy.lockX);
  if (enemy.pendingAttack === 'spit') return Math.atan2(enemy.lockY - enemy.y, enemy.lockX - enemy.x);
  return Math.atan2((enemy.type === 'spitter' ? player.y : enemy.targetY) - enemy.y,
    (enemy.type === 'spitter' ? player.x : enemy.targetX) - enemy.x);
}
