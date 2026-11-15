import {describe, expect, it} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {generateRun} from '../src/game/roguelike/run';
import {createRoomTemplateGeometry, canOccupyExpedition, canTraverseExpedition, hasClearExpeditionShot} from '../src/game/world/expeditionGeometry';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {AUTHORED_ROOM_TOPOLOGIES} from '../src/game/roguelike/authoredRoomTopologies';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';

describe('A3 carrier liveness at a marine-sized recess', () => {
  it('reaches a visible holding position from the retained Loading Bay censor without moving the marine', () => {
    const game = new DepthGame();
    const node = generateRun(926231573, 3).nodes[7];
    game.node = node;
    // Exact historical Loading geometry keeps the censor a marine-only recess.
    // Current all20 native tests independently exercise the redesigned room.
    game.geometry = createRoomTemplateGeometry({...ROOM_TEMPLATES[node.templateId],width:1200,height:880,...AUTHORED_ROOM_TOPOLOGIES['breached-loading-bay']!},node.id+':historical-recess');
    game.navigation = new FacilityNavigation(game.geometry);
    game.enemies = game['makeEnemies']();
    Object.assign(game.player, {x: 688.9851166694637, y: 808.8160300889032});
    expect(node.templateId).toBe('breached-loading-bay');
    expect(canOccupyExpedition(game.geometry, game.player, 16)).toBe(true);
    expect(canOccupyExpedition(game.geometry, game.player, 19)).toBe(false); // Frozen observer's conservative probe; not an illegal marine.
    const spawned = game.enemies.spawn('carrier', 742.204342234131, 627.8873944405403);
    if (!spawned.spawned) throw new Error('retained carrier fixture must spawn');
    const marine = {...game.player};
    let visible = false;
    for (let ms = 0; ms < 15000 && !visible; ms += 50) {
      const before = game.enemies.getSnapshot(spawned.enemy.id)!;
      game.enemies.update(50, game.player);
      const after = game.enemies.getSnapshot(spawned.enemy.id)!;
      expect(canTraverseExpedition(game.geometry, before, after, after.radius)).toBe(true);
      visible = hasClearExpeditionShot(game.geometry, game.player, after);
    }
    expect(visible, JSON.stringify(game.enemies.getSnapshot(spawned.enemy.id))).toBe(true);
    expect(game.player).toEqual(marine);
  });
});
