import assert from 'node:assert/strict';
import {test} from 'vitest';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../../src/game/roguelike/roomTemplates.ts';
import {generateRun} from '../../src/game/roguelike/run.ts';
import {DepthRenderer} from '../../src/render/DepthRenderer.ts';
import {addWorldDressing, updateWorldDressing} from '../../src/render/world/WorldDressing.ts';
import {disposeModel} from '../../src/render/meshParts.ts';
import {CameraRig} from '../../src/render/camera/CameraRig.ts';
import {COMBAT_VIEW_HEIGHT, combatFocusTarget, protectPlayerFrame} from '../../src/render/camera/CombatFraming.ts';
import {HudCombatFraming} from '../../src/render/camera/HudCombatFraming.ts';
import {RoomCombatFraming} from '../../src/render/camera/RoomCombatFraming.ts';
import {roomFocus} from '../../src/render/roomFraming.ts';
import {E9_ROOM_TOURS} from './e9-room-tour.mjs';

for (const id of ['diagnostic-gallery', 'safety-interlock-station', 'manual-control-chamber']) {
  test(id + ' keeps a complete unfaded physical warning in all five native tour views', () => {
    const t = ROOM_TEMPLATES[id], node = generateRun(1729, 3).nodes.find(n => n.templateId === id), world = new T.Group();
    world.add(DepthRenderer.prototype.buildRoomArchitecture.call(Object.create(DepthRenderer.prototype), node, t));
    const root = addWorldDressing(world, t, id === 'manual-control-chamber' ? 'reactor' : 'engineering', id);
    world.updateMatrixWorld(true);
    const failures = [];
    for (const mark of E9_ROOM_TOURS[id]) {
      const camera = new T.PerspectiveCamera(28, 16 / 9, .1, 160), rig = new CameraRig(), hud = new HudCombatFraming(), final = new RoomCombatFraming();
      const p = new T.Vector3(), target = new T.Vector3(), x = mark.x / 32, z = mark.y / 32;
      hud.resize(1920, 1080); hud.setInsets({top: 182, right: 292, bottom: 120, left: 0});
      const initial = roomFocus(x, z, t.width / 32, t.height / 32, COMBAT_VIEW_HEIGHT * 16 / 9, COMBAT_VIEW_HEIGHT, id);
      rig.reset(initial.x, initial.z);
      for (let frame = 0; frame < 180; frame++) {
        hud.selectContacts(x, z, 0, [], 32, () => 3.2);
        combatFocusTarget(x, z, 0, 0, 0, false, false, p); hud.biasTarget(x, z, 0, false, false, p);
        const framed = roomFocus(p.x, p.z, t.width / 32, t.height / 32, COMBAT_VIEW_HEIGHT * 16 / 9, COMBAT_VIEW_HEIGHT, id);
        p.set(framed.x, 0, framed.z); rig.update(1 / 60, p.x, p.z, 0, false); rig.apply(camera, 1, COMBAT_VIEW_HEIGHT, 0);
        hud.center(camera, rig.focus, p, target); hud.protectEngagement(camera, rig.focus, x, z, .5, 2.05, p, target);
        protectPlayerFrame(camera, rig.focus, x, z, .5, 2.05, p, target, hud.viewport);
        final.apply(camera, rig.focus, x, z, .5, 2.05, t.width / 32, t.height / 32, hud.viewport, 1080, 1 / 60, false, t.boundary, hud);
      }
      updateWorldDressing(root, 0, false, camera, {x: mark.x, y: mark.y, radius: 16}, 2.05);
      const displays = root.userData.storyDisplays;
      const panels = displays.map(display => display.corners.map(c => new T.Vector3().fromArray(c).project(camera)));
      const visible = panels.map((panel, index) => ({panel, index})).filter(({panel}) => panel.every(c => c.z < 1 && c.x >= hud.viewport.left && c.x <= hud.viewport.right && c.y >= hud.viewport.bottom && c.y <= hud.viewport.top));
      const ray = new T.Raycaster();
      const valid = visible.some(({index}) => {
        const corners = displays[index].corners.map(c => new T.Vector3().fromArray(c));
        for (let column = 0; column < 17; column++) for (let row = 0; row < 7; row++) {
          const u = .005 + column * .99 / 16, v = .005 + row * .99 / 6;
          const target = corners[0].clone().lerp(corners[1], u).lerp(corners[3].clone().lerp(corners[2], u), v);
          ray.set(camera.position, target.sub(camera.position).normalize());
          if (ray.intersectObject(world, true)[0]?.object.material?.name !== 'g2-dressing-display') return false;
        }
        return true;
      });
      if (!valid || root.userData.warningVisibility.faded) failures.push({mark, valid, faded: root.userData.warningVisibility.faded, panels: panels.map(p => p.map(c => c.toArray())), viewport: hud.viewport});
      assert(final.diagnostics.heroPixels >= 100 - .01); assert(final.diagnostics.outside <= .18001);
    }
    disposeModel(world);
    assert.deepEqual(failures, []);
  });
}
