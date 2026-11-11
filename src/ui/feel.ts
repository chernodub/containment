import type {GameEffect} from '../DepthGame';

export const PRESENTATION_STEP_MS = 1000 / 60;
export type FeelContext = Readonly<{dashing: boolean; critical: boolean; remaining: number}>;

/** Wall time changes pacing only. Every simulation callback receives the same fixed step. */
export class GameFeel {
  private stopMs = 0;
  private slowMs = 0;
  private remainder = 0;
  private enabled = true;
  private slowArmed = false;

  setEnabled(value: boolean): void { if (this.enabled !== value) this.reset(); this.enabled = value; }
  get renderScale(): number {return this.enabled && this.slowMs > 0 ? .3 : 1;}
  get snapshot() { return {hitStopMs: this.stopMs, slowMotionMs: this.slowMs, remainderMs: this.remainder}; }
  reset(): void { this.stopMs = this.slowMs = this.remainder = 0; this.slowArmed = false; }

  /** Bounded impact pause. A dash or critical-health escape cancels any pending freeze. */
  effect(event: GameEffect, context: FeelContext): void {
    if (!this.enabled || context.dashing || context.critical) return;
    const heavy = event.type === 'ability' && ['impact', 'burst'].includes(event.ability?.phase ?? '')
      || event.type === 'wall-slam' || event.type === 'corpse' && event.elite
      || !!event.lethal && (event.weapon === 'rocket' || event.source === 'ability');
    if (heavy) this.stopMs = Math.min(90, Math.max(this.stopMs, event.elite ? 65 : 40));
    if ((event.lethal || event.type === 'corpse') && context.remaining <= 1 && !this.slowArmed) {
      this.slowMs = 420; this.slowArmed = true;
    }
  }

  /** Accumulate scaled wall time, preserving step order and input-to-step replay identity. */
  advance(wallMs: number, context: FeelContext, step: (ms: number) => void): number {
    if (!Number.isFinite(wallMs) || wallMs <= 0) return 0;
    let available = Math.min(50, wallMs);
    if (context.dashing || context.critical) this.stopMs = 0;
    if (this.enabled && this.stopMs > 0) {
      const held = Math.min(available, this.stopMs);
      this.stopMs -= held; available -= held;
    }
    let scaled = available;
    if (this.enabled && this.slowMs > 0) {
      const slow = Math.min(available, this.slowMs);
      this.slowMs -= slow; scaled -= slow * .7;
    }
    this.remainder += scaled;
    let steps = 0;
    while (this.remainder + 1e-7 >= PRESENTATION_STEP_MS) {
      this.remainder = Math.max(0, this.remainder - PRESENTATION_STEP_MS);
      step(PRESENTATION_STEP_MS); steps++;
      // An impact emitted during this step must stop the next step in this very frame.
      if (this.enabled && this.stopMs > 0) break;
    }
    return steps;
  }
}
