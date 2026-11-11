import type {GameEffect} from '../../DepthGame';

export const PRESENTATION_LIMITS = Object.freeze({windowMs: 250, receipts: 8, statusEffects: 2});
type Receipt = {effect: GameEffect; emitted: boolean};

/** Bounded presentation-only receipts; authoritative damage and run statistics stay upstream. */
export class PresentationBudget {
  private elapsed = 0;
  private statusEffects = 0;
  private receipts = new Map<string, Receipt>();

  constructor(private output: (effect: GameEffect) => void) {}

  /** Forget the previous room without replaying its delayed feedback. */
  reset(): void {
    this.elapsed = this.statusEffects = 0;
    this.receipts.clear();
  }

  /** Advance using normal simulation time; paused time must not be supplied. */
  update(ms: number): void {
    if (!Number.isFinite(ms) || ms <= 0) return;
    const next = this.elapsed + ms % PRESENTATION_LIMITS.windowMs;
    if (ms >= PRESENTATION_LIMITS.windowMs || next >= PRESENTATION_LIMITS.windowMs) {
      this.flush();
      this.receipts.clear();
      this.statusEffects = 0;
    }
    this.elapsed = next % PRESENTATION_LIMITS.windowMs;
  }

  /** Flush selected keys once; an early flush does not replenish this window's budget. */
  flush(): void {
    for (const receipt of this.receipts.values()) {
      if (receipt.emitted) continue;
      receipt.emitted = true;
      this.output(receipt.effect);
    }
  }

  /** Preserve native/lifecycle feedback promptly and coalesce selected repeated damage receipts. */
  push(effect: GameEffect): void {
    if ((effect.type === 'hit' || effect.type === 'acid')
      && (effect.source === 'ability' || effect.source === 'status' || effect.source === 'boon')
      && Number.isSafeInteger(effect.targetId) && Number.isFinite(effect.damage) && effect.damage! > 0) {
      const key = `${effect.targetId}:${effect.source}`, old = this.receipts.get(key);
      if (old) {
        // Already presented keys cannot emit again until the next simulation window.
        if (!old.emitted) {
          old.effect.damage = (old.effect.damage ?? 0) + effect.damage!;
          old.effect.lethal = old.effect.lethal || effect.lethal;
          old.effect.x = effect.x; old.effect.y = effect.y;
        }
      } else if (this.receipts.size < PRESENTATION_LIMITS.receipts) {
        this.receipts.set(key, {effect: {...effect}, emitted: false});
      }
      if (effect.lethal) this.flush();
      return;
    }
    if (effect.type === 'boon' && (effect.boon === 'frost' || effect.boon === 'burn' || effect.boon === 'poison')) {
      if (this.statusEffects >= PRESENTATION_LIMITS.statusEffects) return;
      this.statusEffects++;
    }
    if (effect.type === 'corpse' || effect.type === 'hurt'
      || (effect.type === 'ability' && effect.ability?.phase !== 'tick' && effect.ability?.phase !== 'link')) this.flush();
    this.output(effect);
  }
}
