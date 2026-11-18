export const COMM13_SCENARIOS = [
  {
    id: 'comm13-siege', rooms: true, state: 'playing', burst: true, stepMs: 200,
    setup: async room => {
      const d = window.__containmentDebug, g = d.game;
      await d.gotoRoom(room);
      d.invulnerable(true);
      const hold = g.siege;
      if (!hold) throw Error('Room did not start on a siege beat');
      Object.assign(g.player, {x: hold.x, y: hold.y, angle: 0});
      d.setInput({x: 0, y: 0, angle: 0, fire: false, autoAim: false});
      d.settlePresentation(120);
      d.step(4600);
    },
  },
  {
    id: 'comm13-priority', room: 'armory', state: 'playing', burst: true, stepMs: 50,
    setup: async () => {
      const d = window.__containmentDebug, g = d.game;
      await d.gotoRoom('armory', {rig: 'cryo'});
      d.invulnerable(true);
      d.step(1450);
      const leader = g.enemies.snapshot.enemies.find(enemy => enemy.priority);
      if (!leader) throw Error('Native leader has not arrived');
      for (let i = 0; i < 16; i++) {
        const angle = i * Math.PI / 8;
        const x = leader.x - Math.cos(angle) * 82, y = leader.y - Math.sin(angle) * 82;
        if (!d.canStand(x, y, 32) || !d.clearShot(x, y, leader)) continue;
        Object.assign(g.player, {x, y, angle});
        d.setInput({x: 0, y: 0, angle, fire: false, autoAim: false});
        break;
      }
      d.settlePresentation(120);
      // Pre-chill through the existing status API, then let Cryo Nova attempt the native freeze.
      g.mutations.applyAbilityStatus(g.targets().find(target => target.id === leader.id), 'chill', 1);
      g.useAbility('tactical');
      d.refresh();
    },
  },
  {
    id: 'comm13-crossfire', room: 'crew-checkpoint', state: 'playing', burst: true, stepMs: 70,
    setup: async () => {
      const d = window.__containmentDebug;
      await d.gotoRoom('crew-checkpoint');
      d.invulnerable(true);
      d.step(650);
    },
  },
  {
    id: 'comm13-flank', room: 'residential-gallery', state: 'playing', burst: true, stepMs: 70,
    setup: async () => {
      const d = window.__containmentDebug;
      await d.gotoRoom('residential-gallery');
      d.invulnerable(true);
      d.step(1100);
    },
  },
  {
    id: 'comm13-ranged', room: 'crew-checkpoint', state: 'playing', burst: true, stepMs: 60,
    setup: async () => {
      const d = window.__containmentDebug, g = d.game, r = d.renderer;
      await d.gotoRoom('crew-checkpoint');
      d.invulnerable(true);
      d.step(1300);
      g.enemies.reset();
      const b = g.geometry.bounds, near = [];
      for (let y = b.y + 120; y < b.y + b.height - 120; y += 48) {
        for (let x = b.x + 120; x < b.x + b.width - 120; x += 48) {
          if (d.canStand(x, y, 60) && d.canStand(x, y + 375, 32) && d.clearShot(x, y + 375, {x, y})) near.push({x, y});
        }
      }
      for (const p of near) {
        Object.assign(g.player, {x: p.x, y: p.y, angle: -Math.PI / 2});
        d.setInput({x: 0, y: 0, fire: false, angle: -Math.PI / 2, autoAim: false});
        d.settlePresentation(120);
        if (r.visible(p.x, p.y + 375)) continue;
        const id = d.spawn('spitter', p.x, p.y + 375, false);
        if (!id) continue;
        for (let i = 0; i < 45; i++) {
          d.step(1000 / 60);
          if (document.querySelector('.threat-marker[data-ranged-shot=true]:not([hidden])')) return;
        }
        g.enemies.reset();
      }
      d.refresh();
    },
  },
];

COMM13_SCENARIOS.push(
  {
    id: 'comm13-exit-hold', room: 'transmission-chamber', state: 'playing', burst: true, stepMs: 150,
    setup: async () => {
      const d = window.__containmentDebug, g = d.game;
      await d.gotoRoom('transmission-chamber');
      d.invulnerable(true);
      const hold = g.siege;
      for (let i = 0; i < 24; i++) {
        const angle = i * Math.PI / 12, dx = Math.cos(angle), dy = Math.sin(angle);
        const nearX = hold.x + dx * 170, nearY = hold.y + dy * 170;
        const farX = hold.x + dx * 290, farY = hold.y + dy * 290;
        if (!d.canStand(nearX, nearY, 36) || !d.canStand(farX, farY, 36) ||
            !d.canStand(hold.x + dx * 230, hold.y + dy * 230, 36) ||
            !d.clearShot(nearX, nearY, {x: farX, y: farY})) continue;
        Object.assign(g.player, {x: nearX, y: nearY, angle: angle + Math.PI});
        d.setInput({x: 0, y: 0, angle: angle + Math.PI, fire: false, autoAim: false});
        d.settlePresentation(72);
        d.step(3300);
        d.setInput({x: dx, y: dy, angle: angle + Math.PI, fire: false, autoAim: false});
        return;
      }
      throw Error('No legal crossing of the native hold perimeter');
    },
  },
  {
    id: 'comm13-cleanup', room: 'armory', state: 'playing', burst: true, stepMs: 120,
    setup: async () => {
      const d = window.__containmentDebug, g = d.game;
      await d.gotoRoom('armory');
      d.invulnerable(true);
      d.step(1850);
      const leader = g.enemies.snapshot.enemies.find(enemy => enemy.priority);
      if (!leader) throw Error('Native leader has not arrived');
      // Remove the leader while the next group is still queued.
      g.damage(leader.id, leader.health + leader.armor + 100);
      d.step(100);
    },
  },
);
