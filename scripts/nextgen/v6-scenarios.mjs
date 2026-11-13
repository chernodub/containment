/** Native ultimate inspections on an open legal interior mark; canonical V2 timelines remain unchanged. */
export function registerV6Scenarios(scenarios) {
  for (const [rig, ability] of [['cryo', 'whiteout'], ['arc', 'overclock']]) {
    for (const room of ['containment-annulus', 'infested-workshop']) {
      scenarios.push({
        id: `v6-open-${ability}-${room}`, room, state: 'playing', burst: true,
        setupArgument: { rig, ability, room },
        setup: async ({ rig, ability, room }) => {
          const d = window.__containmentDebug, g = d.game, r = d.renderer;
          await d.gotoRoom(room, { rig }); d.invulnerable(true); g.enemies.reset();
          const bounds = g.geometry.bounds; let score = -1, px = g.player.x, py = g.player.y;
          for (let y = bounds.y + 320; y < bounds.y + bounds.height - 320; y += 48) {
            for (let x = bounds.x + 320; x < bounds.x + bounds.width - 320; x += 48) {
              if (!d.canStand(x, y, 32)) continue;
              const clearance = Math.min(x - bounds.x, y - bounds.y, bounds.x + bounds.width - x, bounds.y + bounds.height - y);
              if (clearance > score) { score = clearance; px = x; py = y; }
            }
          }
          if (score < 0) throw Error('No legal open ultimate mark');
          Object.assign(g.player, { x: px, y: py, angle: -.4, vx: 0, vy: 0 });
          d.setInput({ fire: false, x: 0, y: 0, angle: -.4, autoAim: false });
          d.step(3800); g.enemies.reset();
          await r.interimAbilities.prepare(); d.refresh();
          d.fillOverdrive();
          const gl = r.renderer.getContext();
          gl.createProgram = function () { throw Error('V6 open ultimate combat shader compile'); };
          if (!g.useAbility('overdrive')) throw Error('Native ultimate denied: ' + ability);
          d.step(g.abilities.snapshot.slots.overdrive.castRemainingMs + 650);
          if (!g.abilities.snapshot.overdrive.active) throw Error('Native ultimate did not activate');
          d.g4DangerProof = { presentationOnly: true, nativeAbility: ability, room, mark: { x: px, y: py }, boundaryClearance: score, assetWait: true, shaderGuard: true };
          d.refresh();
        },
      });
    }
  }
}
