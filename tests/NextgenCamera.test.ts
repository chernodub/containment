import {beforeAll, describe, expect, it, vi} from 'vitest';
import * as T from 'three';
import {CameraRig, CAMERA_OFFSET_Y, CAMERA_OFFSET_Z} from '../src/render/camera/CameraRig';
import {COMBAT_VIEW_HEIGHT} from '../src/render/camera/CombatFraming';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {EnemyHealthBars, healthBarColor} from '../src/render/EnemyHealthBars';
import {roomFocus} from '../src/render/roomFraming';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {ROOM_STORY_ROUTE} from '../src/game/roguelike/storyRooms';
import {environmentArchitecture} from '../src/render/ShipEnvironments';
import {marine, disposeModel} from '../src/render/models';
import {loadModels} from './loadModels';

beforeAll(loadModels);

type Projection = 'orthographic' | 'perspective';
type RendererProbe = Pick<DepthRenderer, 'camera' | 'pointer' | 'visible' | 'playerScreenBounds' | 'resize' | 'setCameraProjection'> & {
  cameraRig: CameraRig;
  protectPlayerFraming(x: number, z: number, radius: number): void;
};

const desktopSizes = [[1280, 720], [1280, 900], [1920, 1080], [2560, 1440], [800, 1000]] as const;
const projections: Projection[] = ['orthographic', 'perspective'];

/** Real renderer projection methods, without creating a WebGL context. */
function rendererProbe(projection: Projection, width: number, height: number) {
  const viewHeight = height > width ? 18 : COMBAT_VIEW_HEIGHT;
  const viewWidth = viewHeight * width / height;
  const camera = projection === 'perspective'
    ? new T.PerspectiveCamera(28, width / height, .1, 160)
    : new T.OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewHeight / 2, -viewHeight / 2, .1, 160);
  const rig = new CameraRig();
  const root = new T.Group();
  // A conservative body envelope also retains the existing framing witnesses.
  const player = {root, height: 2.2};
  const rect = {left: 17, top: 23, width, height};
  const renderer = Object.assign(Object.create(DepthRenderer.prototype), {
    camera,
    canvas: {getBoundingClientRect: () => rect},
    player,
    cameraRig: rig,
    focus: new T.Vector3(),
    visiblePoint: new T.Vector3(),
    screenPoint: new T.Vector3(),
    screenTarget: new T.Vector3(),
    raycaster: new T.Raycaster(),
    ground: new T.Plane(new T.Vector3(0, 1, 0), 0),
    actors: new Map(),
    queen: null,
  }) as RendererProbe;
  return {renderer, camera, rig, player, rect, viewWidth, viewHeight};
}

function screenPoint(point: T.Vector3, camera: T.Camera, rect: {left: number; top: number; width: number; height: number}) {
  const ndc = point.clone().project(camera);
  return {x: rect.left + (ndc.x + 1) * rect.width / 2, y: rect.top + (1 - ndc.y) * rect.height / 2};
}

function expectPlayerInFrame(probe: ReturnType<typeof rendererProbe>) {
  const bounds = probe.renderer.playerScreenBounds(16);
  expect(bounds.left).toBeGreaterThanOrEqual(probe.rect.left);
  expect(bounds.right).toBeLessThanOrEqual(probe.rect.left + probe.rect.width);
  expect(bounds.top).toBeGreaterThanOrEqual(probe.rect.top + 8);
  expect(bounds.bottom).toBeLessThanOrEqual(probe.rect.top + probe.rect.height);
}

/** Project the production skinned vertices, rather than the safety envelope. */
function marineSilhouetteHeight(model: ReturnType<typeof marine>, camera: T.Camera, viewportHeight: number) {
  const point = new T.Vector3();
  let top = -Infinity, bottom = Infinity;
  model.root.updateMatrixWorld(true);
  model.body.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    for (let i = 0; i < object.geometry.getAttribute('position').count; i++) {
      object.getVertexPosition(i, point);
      point.applyMatrix4(object.matrixWorld).project(camera);
      top = Math.max(top, point.y); bottom = Math.min(bottom, point.y);
    }
  });
  return (top - bottom) * viewportHeight / 2;
}

describe('CameraRig', () => {
  it('uses an analytic critically damped follow across frame rates without overshoot', () => {
    const fine = new CameraRig(), coarse = new CameraRig();
    fine.reset(0, 0); coarse.reset(0, 0);
    let previous = 0;
    for (let i = 0; i < 60; i++) {
      fine.update(1 / 60, 8, -4, 1, false);
      expect(fine.focus.x).toBeGreaterThanOrEqual(previous);
      expect(fine.focus.x).toBeLessThan(8);
      previous = fine.focus.x;
    }
    for (let i = 0; i < 20; i++) coarse.update(.05, 8, -4, 1, false);
    expect(fine.focus.x).toBeCloseTo(coarse.focus.x, 11);
    expect(fine.focus.z).toBeCloseTo(coarse.focus.z, 11);
    expect(fine.focus.x).toBeCloseTo(8, 3);
    fine.update(0, -20, 30, 1, false);
    expect(fine.focus.x).toBe(previous);
  });

  it.each(projections)('matches the focal-plane framing for %s and bounds directional recoil', projection => {
    const {camera, rig, viewHeight} = rendererProbe(projection, 1280, 720);
    rig.reset(4, 6); rig.apply(camera, 1, viewHeight);
    const before = camera.position.clone();
    rig.kick(0, 100); rig.apply(camera, 1, viewHeight);
    expect(camera.position.x).toBeCloseTo(before.x - .25);
    expect(camera.position.z).toBeCloseTo(before.z);
    for (let i = 0; i < 10; i++) rig.kick(0, 100);
    rig.apply(camera, 1, viewHeight);
    expect(camera.position.x).toBeCloseTo(before.x - .35);
    rig.reset(4, 6); rig.apply(camera, 1, viewHeight);
    const up = new T.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const top = new T.Vector3(4, 0, 6).addScaledVector(up, viewHeight / 2).project(camera);
    expect(top.x).toBeCloseTo(0, 10);
    expect(top.y).toBeCloseTo(1, 10);
  });

  it('honors punch duration, bounds zoom, and resets every response on room changes', () => {
    const {camera, rig, viewHeight} = rendererProbe('orthographic', 1280, 720);
    rig.reset(4, 6); rig.punch(1, 200); rig.apply(camera, 1, viewHeight);
    expect(camera.zoom).toBeCloseTo(.945);
    rig.update(.05, 4, 6, 1, false); rig.apply(camera, 1, viewHeight);
    expect(camera.zoom).toBeCloseTo(1 - .055 * .75 ** 2);
    for (let i = 0; i < 4; i++) rig.update(.05, 4, 6, 1, false);
    rig.apply(camera, 1, viewHeight);
    expect(camera.zoom).toBe(1);
    rig.addTrauma(1); rig.kick(1, .2); rig.punch(.04, 500);
    rig.update(.016, 4, 6, 1, false);
    rig.reset(10, 11); rig.apply(camera, 1, viewHeight);
    expect(camera.position.x).toBe(10);
    expect(camera.position.z).toBe(30);
    expect(camera.zoom).toBe(1);
  });

  it.each([[0, false], [1, true]] as const)('clears disabled motion even during pause (strength %s, reduced %s)', (strength, reduced) => {
    const {camera, rig, viewHeight} = rendererProbe('orthographic', 1280, 720);
    rig.reset(4, 6); rig.addTrauma(1); rig.kick(1, .2); rig.punch(.04, 500);
    rig.update(.016, 4, 6, 1, false); rig.apply(camera, 1, viewHeight);
    expect(camera.zoom).toBeLessThan(1);
    rig.update(0, 99, 99, strength, reduced); rig.apply(camera, 1, viewHeight, strength);
    expect(camera.position.x).toBe(4);
    expect(camera.position.z).toBe(25);
    expect(camera.zoom).toBe(1);
    rig.update(0, 4, 6, 1, false); rig.apply(camera, 1, viewHeight);
    expect(camera.position.x).toBe(4);
    expect(camera.position.z).toBe(25);
    expect(camera.zoom).toBe(1);
  });

  it('suppresses all applied offsets immediately at screenShake zero', () => {
    const {camera, rig, viewHeight} = rendererProbe('orthographic', 1280, 720);
    rig.reset(4, 6); rig.addTrauma(1); rig.kick(1, .2); rig.punch(.04, 500);
    rig.update(.016, 4, 6, 1, false); rig.apply(camera, 1, viewHeight, 0);
    expect(camera.position.x).toBe(4);
    expect(camera.position.z).toBe(25);
    expect(camera.zoom).toBe(1);
  });
});

describe.each(projections)('actual renderer %s desktop camera guarantees', projection => {
  it.each(desktopSizes)('keeps all 20 authored room edges and north headroom at %ix%i', (width, height) => {
    const probe = rendererProbe(projection, width, height);
    expect(ROOM_STORY_ROUTE).toHaveLength(20);
    for (const story of ROOM_STORY_ROUTE) {
      const room = ROOM_TEMPLATES[story.templateId];
      for (const x of [.5, room.width / 64, room.width / 32 - .5]) {
        for (const z of [.5, room.height / 64, room.height / 32 - .5]) {
          const focus = roomFocus(x, z - .6, room.width / 32, room.height / 32, probe.viewWidth, probe.viewHeight, room.id);
          probe.rig.reset(focus.x, focus.z);
          probe.rig.addTrauma(1); probe.rig.kick(Math.PI / 4, .35); probe.rig.punch(.055, 240);
          probe.rig.update(1 / 60, focus.x, focus.z, 1, false);
          probe.rig.apply(probe.camera, 1, probe.viewHeight);
          probe.player.root.position.set(x, 0, z);
          probe.renderer.protectPlayerFraming(x, z, .5);
          expectPlayerInFrame(probe);
          const point = screenPoint(new T.Vector3(x, 0, z), probe.camera, probe.rect);
          const aim = probe.renderer.pointer(point.x, point.y)!;
          expect(aim.x).toBeCloseTo(x * 32, 7);
          expect(aim.y).toBeCloseTo(z * 32, 7);
        }
      }
    }
  });

  it('keeps native northward follow and desktop resize safe while impulses settle', () => {
    for (const story of ROOM_STORY_ROUTE) {
      const room = ROOM_TEMPLATES[story.templateId];
      const probe = rendererProbe(projection, 1280, 900);
      let z = room.height / 64;
      const x = room.width / 64;
      probe.rig.reset(x, z);
      for (let frame = 0; frame < 180; frame++) {
        z = Math.max(.5, z - 220 / 32 / 60);
        const focus = roomFocus(x, z - .6, room.width / 32, room.height / 32, probe.viewWidth, probe.viewHeight, room.id);
        if (frame % 12 === 0) {probe.rig.kick(Math.PI / 2, .12); probe.rig.addTrauma(.34); probe.rig.punch(.035, 240);}
        probe.rig.update(1 / 60, focus.x, focus.z, 1, false);
        probe.rig.apply(probe.camera, 1, probe.viewHeight);
        probe.player.root.position.set(x, 0, z);
        probe.renderer.protectPlayerFraming(x, z, .5);
        expectPlayerInFrame(probe);
      }
      // Preserve the same follow state while switching native desktop sizes.
      for (const [width, height] of desktopSizes) {
        const resized = rendererProbe(projection, width, height);
        resized.rig.reset(probe.rig.focus.x, probe.rig.focus.z);
        resized.rig.apply(resized.camera, 1, resized.viewHeight);
        resized.player.root.position.set(x, 0, z);
        resized.renderer.protectPlayerFraming(x, z, .5);
        expectPlayerInFrame(resized);
      }
    }
  });

  it('uses the rendered projection for pointer torso selection and safe visibility', () => {
    const probe = rendererProbe(projection, 1280, 720);
    probe.rig.reset(15, 12); probe.rig.apply(probe.camera, 1, probe.viewHeight);
    const target = {id: 7, x: 16 * 32, y: 11 * 32, radius: 24};
    (probe.renderer as unknown as {actors: Map<number, {height: number}>}).actors.set(7, {height: 2});
    const point = screenPoint(new T.Vector3(16, 1, 11), probe.camera, probe.rect);
    expect(probe.renderer.pointer(point.x, point.y, [target])).toEqual({x: target.x, y: target.y});
    expect(probe.renderer.visible(15 * 32, 12 * 32)).toBe(true);
    expect(probe.renderer.visible(200 * 32, 12 * 32)).toBe(false);
  });

  it('preserves the authored Room19 recessed opening on its north approach', () => {
    const room = ROOM_TEMPLATES['manual-control-chamber'];
    const world = new T.Group();
    environmentArchitecture(world, 'reactor', room.width / 32, room.height / 32, room.id);
    world.updateMatrixWorld(true);
    const opening = new T.Box3().setFromObject(world.getObjectByName('armored-observation-recess')!, true);
    for (const [width, height] of [[1280, 720], [1280, 900], [960, 540]]) {
      const probe = rendererProbe(projection, width, height);
      const focus = roomFocus(828 / 32, 110 / 32, room.width / 32, room.height / 32, probe.viewWidth, probe.viewHeight, room.id);
      probe.rig.reset(focus.x, focus.z); probe.rig.apply(probe.camera, 1, probe.viewHeight);
      for (const x of [opening.min.x, opening.max.x]) for (const y of [opening.min.y, opening.max.y]) for (const z of [opening.min.z, opening.max.z]) {
        const point = new T.Vector3(x, y, z).project(probe.camera);
        expect(Math.abs(point.x)).toBeLessThan(.97);
        expect(Math.abs(point.y)).toBeLessThan(.97);
      }
    }
    world.traverse(object => {
      if (object instanceof T.Mesh) {
        object.geometry.dispose();
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
      }
    });
  });
});

it('uses actual renderer resize and projection switching across all authored-room desktop edges', () => {
  const probe = rendererProbe('orthographic', 1280, 720);
  const viewport = {innerWidth: 1280, innerHeight: 720};
  const setCamera = vi.fn();
  Object.assign(probe.renderer, {
    renderer: {setPixelRatio: vi.fn(), setSize: vi.fn()},
    post: {setSize: vi.fn(), setCamera},
    options: {resolutionScale: 1, screenShake: 1},
    tier: 'high',
    lastMenu: false,
  });
  vi.stubGlobal('window', viewport); vi.stubGlobal('devicePixelRatio', 2);
  try {
    for (const story of ROOM_STORY_ROUTE) {
      const room = ROOM_TEMPLATES[story.templateId];
      for (const [width, height] of desktopSizes) {
        viewport.innerWidth = probe.rect.width = width;
        viewport.innerHeight = probe.rect.height = height;
        const viewHeight = height > width ? 18 : COMBAT_VIEW_HEIGHT;
        for (const projection of projections) {
          probe.renderer.setCameraProjection(projection);
          probe.renderer.resize();
          if (probe.renderer.camera instanceof T.OrthographicCamera) expect(probe.renderer.camera.top - probe.renderer.camera.bottom).toBe(viewHeight);
          for (const [x, z] of [[.5, .5], [room.width / 32 - .5, room.height / 32 - .5]]) {
            const focus = roomFocus(x, z, room.width / 32, room.height / 32, viewHeight * width / height, viewHeight, room.id);
            probe.rig.reset(focus.x, focus.z); probe.rig.apply(probe.renderer.camera, 1, viewHeight);
            probe.player.root.position.set(x, 0, z);
            probe.renderer.protectPlayerFraming(x, z, .5);
            expectPlayerInFrame(probe);
            const point = screenPoint(new T.Vector3(x, 0, z), probe.renderer.camera, probe.rect);
            const aim = probe.renderer.pointer(point.x, point.y)!;
            expect(aim.x).toBeCloseTo(x * 32, 7);
            expect(aim.y).toBeCloseTo(z * 32, 7);
          }
        }
      }
    }
    expect(setCamera).toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});

describe('perspective enemy health labels', () => {
  it('keeps exact pixel sizes at each actor depth and off-axis, with zoom and resize', () => {
    const bars = new EnemyHealthBars(4);
    const {camera, rig, viewHeight} = rendererProbe('perspective', 1280, 720);
    rig.reset(15, 12); rig.apply(camera, 1, viewHeight);
    const entries = [
      {x: 3, z: 2, height: 1, health: 25, maxHealth: 100},
      {x: 16, z: 24, height: 2, health: 75, maxHealth: 100},
      {x: 24, z: 7, height: 4, health: 50, maxHealth: 100, elite: true},
    ];
    for (const height of [720, 1080]) for (const zoom of [1, 1.23]) {
      camera.zoom = zoom; camera.updateProjectionMatrix();
      bars.update(entries, camera, height);
      const [background, fill] = bars.root.children as T.InstancedMesh[];
      const matrix = new T.Matrix4();
      expect(fill.count).toBe(3);
      for (let i = 0; i < entries.length; i++) {
        const width = entries[i].elite ? 42 : 34;
        for (const [mesh, expectedWidth, expectedHeight] of [[background, width + 6, 9], [fill, width * entries[i].health / 100, 5]] as const) {
          mesh.getMatrixAt(i, matrix);
          const left = new T.Vector3(-.5, 0, 0).applyMatrix4(matrix).project(camera);
          const right = new T.Vector3(.5, 0, 0).applyMatrix4(matrix).project(camera);
          const top = new T.Vector3(0, .5, 0).applyMatrix4(matrix).project(camera);
          const bottom = new T.Vector3(0, -.5, 0).applyMatrix4(matrix).project(camera);
          expect((right.x - left.x) * height * 1280 / 720 / 2).toBeCloseTo(expectedWidth, 3);
          expect((top.y - bottom.y) * height / 2).toBeCloseTo(expectedHeight, 3);
        }
      }
    }
    bars.update(entries, camera, 720, true);
    expect((bars.root.children[0] as T.InstancedMesh).count).toBe(0);
    expect(bars.root.visible).toBe(false);
    bars.dispose();
  });
});

it.each(projections)('puts the production marine in the 105–125px target for ordinary aiming poses with %s', projection => {
  const model = marine();
  const {camera, rig, viewHeight} = rendererProbe(projection, 1920, 1080);
  expect(model.height).toBeCloseTo(2.05, 5);
  expect(CAMERA_OFFSET_Y).toBe(26); expect(CAMERA_OFFSET_Z).toBe(19);
  rig.reset(0, 0); rig.apply(camera, 1, viewHeight);
  try {
    // Aiming away from the camera foreshortens the arms differently; that full
    // silhouette is intentionally taller than the ordinary east/south poses.
    for (const angle of [0, Math.PI / 2]) {
      model.animate(0, 0, angle);
      const height = marineSilhouetteHeight(model, camera, 1080);
      expect(height).toBeGreaterThanOrEqual(105);
      expect(height).toBeLessThanOrEqual(125);
    }
  } finally {
    model.stop?.(); disposeModel(model.root);
  }
});

it('shows backed health bars only for damaged enemies/nests and elites, with health and status colors', () => {
  const bars = new EnemyHealthBars(6);
  const {camera, rig, viewHeight} = rendererProbe('orthographic', 1920, 1080);
  rig.reset(0, 0); rig.apply(camera, 1, viewHeight);
  const enemy = {x: 1, z: 2, height: 1, health: 100, maxHealth: 100};
  bars.update([enemy, {...enemy, elite: true}, {...enemy, health: 50}, {...enemy, height: 1.35}, {...enemy, height: 1.35, health: 90}, {...enemy, health: 0}], camera, 1080);
  const [background, fill] = bars.root.children as T.InstancedMesh[];
  expect(background.count).toBe(3); expect(fill.count).toBe(3);
  const critical=healthBarColor({...enemy,health:20}),criticalColor=new T.Color(critical);
  expect(criticalColor.r).toBeGreaterThan(criticalColor.g*1.5);expect(criticalColor.r).toBeGreaterThan(.8);
  const armored=new T.Color(healthBarColor({...enemy,health:80,armor:10}));
  expect(Math.max(armored.r,armored.g,armored.b)-Math.min(armored.r,armored.g,armored.b)).toBeLessThan(.15);
  expect(armored.getHSL({h:0,s:0,l:0}).l).toBeGreaterThan(.5);
  const elite=new T.Color(healthBarColor({...enemy,elite:true}));
  expect(elite.r).toBeGreaterThan(elite.g);expect(elite.g).toBeGreaterThan(elite.b);
  expect(healthBarColor({...enemy, status: {frozen: true}})).toBe(0xb6e4ef);
  expect(healthBarColor({...enemy, status: {shocked: true}})).toBe(0xb5a4d7);
  expect(healthBarColor({...enemy, status: {burning: true}})).toBe(0xd7a374);
  expect(healthBarColor({...enemy, status: {poisoned: true}})).toBe(0xa3bf7d);
  expect(healthBarColor({...enemy, status: {chilled: true}})).toBe(0x8ec9d5);
  expect(healthBarColor({...enemy, health: 20, armor: 10, status: {frozen: true}})).toBe(critical);
  bars.dispose();
});

describe('integrated Queen framing',()=>{
 it.each([[1280,720],[1920,1080]])('keeps both actors between desktop header and action bar at %ix%i',(width,height)=>{
  const probe=rendererProbe('perspective',width,height),r=probe.renderer as any;
  r.queen={height:4.5};r.player.root.position.set(14,0,23);r.cameraRig.reset(16,20);r.cameraRig.apply(r.camera,.78,13,0);
  r.protectBossFraming(14,23,.5,18,16);
  const points=[[14,23,.5,2.2],[18,16,3.4,4.5]];
  for(const [x,z,radius,h]of points)for(const dx of [-radius,radius])for(const dz of [-radius,radius])for(const y of [0,h]){
   const p=new T.Vector3(x+dx,y,z+dz).project(r.camera);
   expect(p.y).toBeLessThan(.66);expect(p.y).toBeGreaterThan(-.52);expect(Math.abs(p.x)).toBeLessThan(.94);
  }
 });
});
