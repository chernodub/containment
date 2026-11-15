/** Global presentation clock only. Simulation, snapshots and input keep advancing. */
export class PresentationHold {
  private remaining = 0;
  private cooldown = 0;

  request(seconds: number, strength: number, reduced: boolean): void {
    if (reduced || strength <= 0 || this.cooldown > 0) return;
    this.remaining = Math.min(.045, Math.max(0, seconds)) * Math.min(1, strength);
    this.cooldown = .65;
  }

  advance(delta: number, strength: number, reduced: boolean): number {
    const dt = Math.max(0, delta);
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (strength <= 0 || reduced) { this.remaining = 0; return dt; }
    const held = Math.min(dt, this.remaining);
    this.remaining -= held;
    return dt - held;
  }

  reset(): void { this.remaining = this.cooldown = 0; }
}
