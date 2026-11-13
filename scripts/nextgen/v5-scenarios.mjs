/** Native diagonal cover inspections; supplements the unchanged seven-phase V2 fixtures. */
export function registerV5Scenarios(scenarios) {
  for (const [rig, ability] of [['cryo', 'glacier'], ['breacher', 'bulwark']]) {
    scenarios.push({ id: `v5-oblique-${ability}`, room: 'containment-annulus', state: 'playing', burst: true,
      setupArgument: { rig, ability }, setup: async ({ rig, ability }) => {
        const d = window.__containmentDebug, g = d.game;
        await d.gotoRoom('containment-annulus', { rig }); d.invulnerable(true); g.enemies.reset();
        const angle = -.65, bounds = g.geometry.bounds; let found = false;
        for (let y = 220; y < bounds.height - 220 && !found; y += 50) for (let x = 220; x < bounds.width - 220 && !found; x += 50) {
          if (!d.canStand(x, y, 28)) continue;
          Object.assign(g.player, { x, y, angle, vx: 0, vy: 0 });
          g.setAimPoint({ x: x + Math.cos(angle) * 150, y: y + Math.sin(angle) * 150 });
          if (!g.abilities.snapshot.slots.power.ready) continue;
          d.setInput({ x: 0, y: 0, fire: false, angle, autoAim: false }); found = true;
        }
        if (!found) throw Error('No legal V5 diagonal cover placement');
        d.step(3800); g.enemies.reset(); d.refresh();
        const gl = d.renderer.renderer.getContext();
        gl.createProgram = function () { throw Error('V5 construct combat shader compile'); };
        if (!g.useAbility('power')) throw Error('V5 native cover denied ' + ability);
        d.step(g.abilities.snapshot.slots.power.castRemainingMs + 30);
        d.v5Proof = { nativeAbility: ability, angle, presentationOnly: true, shaderGuard: true };
        d.refresh();
      },
    });
  }
}
