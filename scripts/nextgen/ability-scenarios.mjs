// Production ability fixtures. Setup runs in the page through the supported debug hook.
const kits = [
  ['breacher', ['ram', 'seismic-slam', 'bulwark', 'railbreaker']],
  ['cryo', ['frost-trail', 'cryo-nova', 'glacier', 'whiteout']],
  ['pyro', ['afterburn', 'flashfire', 'napalm-charge', 'meltdown']],
  ['arc', ['static-step', 'overload', 'tesla-pylon', 'overclock']],
];
const slots = ['dash', 'tactical', 'power', 'overdrive'];

/** Exercise real opt-in rig selection and a single native ability in legal authored space. */
async function stageAbility({ rig, slot, id, nativeInput = false }) {
  const d = window.__containmentDebug, g = d.game;
  await d.startRun(1729, { rigSelect: true });
  if (g.expedition.run.phase !== 'rig-select' || !g.chooseRig(rig)) throw Error('Rig selection failed');
  d.refresh();
  const boon = document.querySelector('[data-mutation]');
  if (!boon) throw Error('Starting boon missing after rig selection');
  boon.click();
  await d.prepare();
  const build = Object.freeze({ mutations: Object.freeze([]), rig });
  g.expedition = Object.freeze({ ...g.expedition, build });
  g.combat.setBuild(build);
  g.skipStory(); d.invulnerable(true); g.enemies.reset();
  Object.assign(g.player, { x: 320, y: 440, angle: -Math.PI / 2, vx: 0, vy: 0 });
  d.setInput({ x: 0, y: 0, fire: false, angle: -Math.PI / 2, autoAim: false });
  d.step(3800); // Settle the native camera and expire draft/checkpoint toasts before staging targets.
  g.enemies.reset(); d.refresh(); // Retire rendered actors before reset IDs are reused.
  for (const [x, y] of [[320, 280], [350, 260], [290, 230]]) {
    if (!d.canStand(x, y, 28) || !d.clearShot(x, y) || !d.spawn('brute', x, y)) throw Error(`Illegal ability target ${x},${y}`);
  }
  g.setAimPoint({ x: 320, y: 220 });
  if (nativeInput) { d.fillOverdrive(); d.refresh(); return; }
  if (slot === 'overdrive') d.fillOverdrive();
  if (!g.useAbility(slot)) throw Error(`Ability denied: ${id}`);
  const windup = g.abilities.snapshot.slots[slot].castRemainingMs;
  const aftermath = id === 'whiteout' ? 2100 : slot === 'dash' ? 440 : id === 'meltdown' ? 1000 : id === 'tesla-pylon' ? 520 : 30;
  d.step(windup + aftermath);
  const s = g.abilities.snapshot;
  if (s.rig !== rig || s.slots[slot].id !== id || g.stats.abilityUses[slot] !== 1) throw Error('Ability receipt mismatch');
  if (!Number.isFinite(g.player.x) || !d.canStand(g.player.x, g.player.y)) throw Error('Ability left the navigable floor');
  if (['bulwark', 'glacier', 'tesla-pylon'].includes(id) && !s.deployables.some(entity => entity.ability === id)) throw Error('Deployable missing');
  if (['frost-trail', 'afterburn', 'napalm-charge', 'whiteout', 'meltdown'].includes(id) && !s.zones.some(zone => zone.ability === id)) throw Error('Lingering zone missing');
  if (id === 'overclock' && (s.hostileTimeScale !== .3 || !s.overdrive.active)) throw Error('Hostile time dilation missing');
  if (s.zones.length > 24 || s.deployables.length > 8) throw Error('Ability entity limit exceeded');
  d.refresh();
}

export const ABILITY_SCENARIOS = kits.flatMap(([rig, abilities]) => abilities.map((id, index) => ({
  id: `ability:${id}`, state: 'playing', room: 'awakening-bay', burst: true, required: ['#ability-bar', `[data-ability="${slots[index]}"] .ability-title`],
  ability: { id, rig, slot: slots[index] }, setupArgument: { id, rig, slot: slots[index] }, setup: stageAbility,
})));

/** Native Playwright keyboard events use the production InputController, then explicit debug simulation steps. */
export const DESKTOP_ABILITY_SCENARIO = {
  id:'ability:desktop-input',state:'playing',room:'awakening-bay',burst:true,nativeInput:true,
  setupArgument:{rig:'breacher',slot:'dash',id:'ram',nativeInput:true},setup:stageAbility,
  nativeKeys:[['Shift',160],['q',240],['f',20],['v',650]],
};
