import {describe, expect, it} from 'vitest';
import {DepthGame, type GameInput, type GameEffect} from '../src/DepthGame';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {GameFeel, PRESENTATION_STEP_MS} from '../src/ui/feel';

const normal = {dashing: false, critical: false, remaining: 10};
const impact: GameEffect = {type: 'wall-slam', x: 0, y: 0};

describe('presentation pacing preserves fixed-step simulation', () => {
  it.each(['breacher', 'cryo', 'pyro', 'arc'] as const)('replays the same seeded %s combat and ability sequence identically through stop/slow and plain clocks', rig => {
    const run = (enabled: boolean) => {
      const game = new DepthGame(); game.newRun(1729, {rigSelect:true}); game.chooseRig(rig);
      game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
      const feel = new GameFeel(); feel.setEnabled(enabled);
      let index = 0, wallFrames = 0;
      while (index < 180 && wallFrames++ < 1000) {
        feel.advance([8, 16, 33, 12][wallFrames % 4], normal, ms => {
          if (index >= 180) return;
          const input: GameInput = {x: index < 30 ? 1 : index < 60 ? -1 : 0, y: index % 90 < 45 ? .2 : -.2, fire: true, angle: .4, autoAim: false};
          if (index === 30) game.useAbility('dash');
          if (index === 60) game.useAbility('tactical');
          if (index === 90) {game.setAimPoint({x:game.player.x + 100, y:game.player.y}); game.useAbility('power');}
          game.update(ms, input);
          if (index === 20 || index === 70) feel.effect(impact, normal);
          if (index === 110) feel.effect({type: 'corpse', x: 0, y: 0}, {...normal, remaining: 0});
          index++;
        });
      }
      expect(index).toBe(180);
      return {wallFrames, result: JSON.stringify({player: game.player, enemies: game.enemies.snapshot, combat: game.combat.snapshot, abilities: game.abilities.snapshot, stats: game.stats, elapsed: game.elapsed, run: game.expedition})};
    };
    const plain = run(false), directed = run(true);
    expect(directed.wallFrames).toBeGreaterThan(plain.wallFrames);
    expect(directed.result).toBe(plain.result);
  });
  it('bounds impact time, never stacks, and releases immediately for dash and critical escape', () => {
    const feel = new GameFeel();
    for (let i = 0; i < 100; i++) feel.effect(impact, normal);
    expect(feel.snapshot.hitStopMs).toBe(40);
    let count = 0; feel.advance(30, normal, () => count++);
    expect(count).toBe(0);
    feel.advance(20, {...normal, dashing: true}, () => count++);
    expect(count).toBe(1); expect(feel.snapshot.hitStopMs).toBe(0);
    feel.effect(impact, {...normal, critical: true});
    expect(feel.snapshot.hitStopMs).toBe(0);
  });
  it('uses 420 ms of .3× finale pacing once per room, and resets across rooms', () => {
    const feel = new GameFeel(), final = {...normal, remaining: 0};
    feel.effect({type: 'corpse', x: 0, y: 0}, final);
    expect(feel.renderScale).toBe(.3);
    let simulated = 0;
    for (let i = 0; i < 9; i++) feel.advance(50, normal, ms => simulated += ms);
    expect(simulated).toBeCloseTo(150);
    expect(feel.renderScale).toBe(1);
    feel.effect({type: 'corpse', x: 0, y: 0}, final);
    expect(feel.renderScale).toBe(1);
    feel.reset(); feel.effect({type: 'corpse', x: 0, y: 0}, final);
    expect(feel.renderScale).toBe(.3);
  });
  it('disables effects without changing fixed simulation delta or accepting invalid time', () => {
    const feel = new GameFeel(); feel.setEnabled(false); feel.effect(impact, normal);
    const deltas: number[] = [];
    feel.advance(NaN, normal, ms => deltas.push(ms));
    feel.advance(50, normal, ms => deltas.push(ms));
    expect(deltas).toEqual([PRESENTATION_STEP_MS, PRESENTATION_STEP_MS, PRESENTATION_STEP_MS]);
  });
});
