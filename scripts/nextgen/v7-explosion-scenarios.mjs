/** Shared explosion art inspections, with explicit native-payload replays.
 * These isolate presentation at one legal mark; no kill, damage or action is fabricated.
 */
export const V7_EXPLOSION_ORIGINS = Object.freeze([
  { origin: 'weapon', source: 'ElementalRuntime Combustion weapon-hit boon', event: { type: 'boon', boon: 'combustion', radius: 85 } },
  { origin: 'grenade', source: 'DepthGame grenade blast with a burning target in splash reach', event: { type: 'explosion', radius: 120, elements: ['fire'] } },
  { origin: 'rocket', source: 'DepthGame rocket blast with a burning target in splash reach', event: { type: 'explosion', radius: 132, elements: ['fire'] } },
  { origin: 'nest', source: 'DepthGame nest-destroyed event (native payload has no fire element)', event: { type: 'explosion', radius: 64 } },
  { origin: 'queen', source: 'DepthGame queen-defeated event (native payload has no fire element)', event: { type: 'explosion', radius: 240 } },
]);

/** Self-contained browser setup; safe to replay against a frozen pre-V7 distribution. */
export async function stageV7Explosion({ origin, source, event, room, samples }) {
  const d = window.__containmentDebug, g = d.game, r = d.renderer;
  await d.gotoRoom(room, { rig: 'breacher' }); d.invulnerable(true); g.enemies.reset();
  const b = g.geometry.bounds;
  let best = null, score = -Infinity;
  for (let y = b.y + 170; y < b.y + b.height - 170; y += 48) {
    for (let x = b.x + 170; x < b.x + b.width - 170; x += 48) {
      if (!d.canStand(x, y, 28)) continue;
      for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        const tx = x + Math.cos(angle) * 240, ty = y + Math.sin(angle) * 240;
        if (!d.canStand(tx, ty, 32) || !d.clearShot(tx, ty, { x, y })) continue;
        let open = 0;
        for (let i = 0; i < 8; i++) if (d.canStand(tx + Math.cos(i * Math.PI / 4) * 170, ty + Math.sin(i * Math.PI / 4) * 170, 16)) open++;
        const margin = Math.min(x - b.x, y - b.y, b.x + b.width - x, b.y + b.height - y,
          tx - b.x, ty - b.y, b.x + b.width - tx, b.y + b.height - ty);
        const rank = open * 1000 + margin;
        if (rank > score) { score = rank; best = { x, y, tx, ty, angle, open }; }
      }
    }
  }
  if (!best) throw Error('No legal V7 shared explosion inspection mark');
  Object.assign(g.player, { x: best.x, y: best.y, angle: best.angle, vx: 0, vy: 0 });
  d.setInput({ x: 0, y: 0, fire: false, angle: best.angle, autoAim: false });
  d.step(3800); g.enemies.reset(); d.refresh();
  const warning = { type: 'enemy-warning', x: best.tx - Math.sin(best.angle) * 75,
    y: best.ty + Math.cos(best.angle) * 75, radius: 34, durationMs: 2500 };
  const proof = d.g4DangerProof = {
    presentationOnly: true, nativeAction: false, kind: 'shared-explosion-payload-replay',
    origin, source, room, mark: best, event: { ...event, x: best.tx, y: best.ty },
    warning, samples, sampleMs: 0, shaderGuard: true, programs: 0,
    qualification: 'Native payload replay at a common legal mark; this does not simulate its originating action, kill or damage. Native grenade action remains covered by combat-heavy.',
  };
  const gl = r.renderer.getContext();
  gl.createProgram = function () { proof.programs++; throw Error('V7 shared explosion compiled a combat shader'); };
  r.effect(warning); r.effect(proof.event); d.refresh();
  const original = d.step; let sample = 0, elapsed = 0;
  // Capture's standard 150ms requests map onto explicit impact/body/smoke clocks.
  d.step = ms => {
    if (ms !== 150) return original(ms);
    const target = samples[Math.min(++sample, samples.length - 1)];
    original(Math.max(0, target - elapsed)); elapsed = target;
    proof.sampleMs = target; d.shaderCompilations = proof.programs;
    if (proof.programs) throw Error('V7 shared explosion shader guard failed');
  };
  d.shaderCompilations = 0;
}

/** Add exactly five origin inspections without changing existing capture scenarios. */
export function registerV7ExplosionScenarios(scenarios) {
  for (const entry of V7_EXPLOSION_ORIGINS) {
    const id = `v7-explosion-${entry.origin}`;
    if (scenarios.some(s => s.id === id)) continue;
    const room = 'containment-annulus';
    scenarios.push({ id, room, state: 'playing', burst: true, stepMs: 150,
      setupArgument: { ...entry, room, samples: [0, 30, 90, 180, 340, 600, 1000] },
      setup: stageV7Explosion });
  }
}
