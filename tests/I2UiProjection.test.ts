import {afterEach, describe, expect, it, vi} from 'vitest';
import * as T from 'three';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {CameraRig} from '../src/render/camera/CameraRig';
import {getCameraFootprint, projectWorld, type ScreenPoint} from '../src/ui/gameAdapter';
import {threatEdgePoint} from '../src/ui/hud/ThreatIndicators';

const point = (): ScreenPoint => ({x: 0, y: 0, visible: false});
const corners = [[-1, 1], [1, 1], [1, -1], [-1, -1]] as const;
afterEach(() => vi.unstubAllGlobals());

/** Exercise production camera switching, resizing and mouse rays without a GPU. */
function rendererProbe(width = 1280, height = 720) {
  const rect = {left: 17, top: 23, width, height};
  const viewport = {innerWidth: width, innerHeight: height};
  vi.stubGlobal('window', viewport);
  vi.stubGlobal('devicePixelRatio', 2);
  const rig = new CameraRig();
  rig.reset(10, 12);
  const renderer = Object.assign(Object.create(DepthRenderer.prototype), {
    camera: new T.PerspectiveCamera(28),
    cameraRig: rig,
    canvas: {
      get clientWidth() {return rect.width;},
      get clientHeight() {return rect.height;},
      getBoundingClientRect: () => rect,
    },
    renderer: {setPixelRatio: vi.fn(), setSize: vi.fn()},
    post: {setSize: vi.fn(), setCamera: vi.fn()},
    options: {resolutionScale: .5, screenShake: 1},
    tier: 'high', lastMenu: false,
    raycaster: new T.Raycaster(),
    ground: new T.Plane(new T.Vector3(0, 1, 0), 0),
    actors: new Map(),
  }) as DepthRenderer;
  return {renderer, rig, rect, viewport};
}

describe('I2 live camera / UI projection seam', () => {
  it('projects pooled HUD points without layout reads after each desktop resize', () => {
    const {renderer, rig, rect, viewport} = rendererProbe();
    const widthRead = vi.spyOn(renderer.canvas, 'clientWidth', 'get');
    const heightRead = vi.spyOn(renderer.canvas, 'clientHeight', 'get');
    const boundsRead = vi.spyOn(renderer.canvas, 'getBoundingClientRect');
    const output = point();
    for (const [width, height] of [[640, 360], [960, 540], [1280, 720], [1920, 1080], [2560, 1440], [3440, 1440], [800, 1000]]) {
      viewport.innerWidth = rect.width = width;
      viewport.innerHeight = rect.height = height;
      renderer.resize();
      rig.apply(renderer.camera, 1, height > width ? 18 : 13);
      widthRead.mockClear(); heightRead.mockClear(); boundsRead.mockClear();
      expect(renderer.viewportWidth).toBe(width);
      expect(renderer.viewportHeight).toBe(height);
      for (let i = 0; i < 28; i++) {
        projectWorld(renderer, (8 + i / 10) * 32, 12 * 32, output, 1.2);
        const expected = new T.Vector3(8 + i / 10, 1.2, 12).project(renderer.camera);
        expect(output.x).toBeCloseTo((expected.x + 1) * width / 2, 8);
        expect(output.y).toBeCloseTo((1 - expected.y) * height / 2, 8);
      }
      expect(widthRead).not.toHaveBeenCalled();
      expect(heightRead).not.toHaveBeenCalled();
      expect(boundsRead).not.toHaveBeenCalled();
    }
  });

  it('keeps aim assist inside the real near/far frustum', () => {
    const {renderer} = rendererProbe();
    Object.assign(renderer, {visiblePoint: new T.Vector3()});
    renderer.resize();
    renderer.camera.position.set(0, .6, 0);
    renderer.camera.lookAt(0, .6, -1);
    renderer.camera.updateMatrixWorld();
    expect(renderer.visible(0, -320)).toBe(true);
    expect(renderer.visible(0, 320)).toBe(false);
    expect(renderer.visible(0, -6400)).toBe(false);
    expect(renderer.visible(10000, -320)).toBe(false);
  });

  it('matches native mouse floor rays and radar corners after desktop resizing, projection changes and recoil', () => {
    const {renderer, rig, rect, viewport} = rendererProbe();
    const output = point();
    const footprint = Array.from({length: 4}, () => ({x: 0, y: 0}));
    for (const [width, height] of [[1280, 720], [1920, 1080], [800, 1000]]) {
      viewport.innerWidth = rect.width = width;
      viewport.innerHeight = rect.height = height;
      for (const projection of ['orthographic', 'perspective'] as const) {
        renderer.setCameraProjection(projection);
        renderer.resize();
        rig.addTrauma(.5); rig.kick(.4, .1); rig.punch(.04, 200);
        rig.update(1 / 60, 10, 12, 1, false);
        rig.apply(renderer.camera, 1.23, height > width ? 18 : 13);
        for (const [x, z] of [[10, 12], [8, 10], [12, 14]]) {
          expect(projectWorld(renderer, x * 32, z * 32, output, 0)).toBe(output);
          const ndc = new T.Vector3(x, 0, z).project(renderer.camera);
          expect(output.x).toBeCloseTo((ndc.x + 1) * width / 2, 8);
          expect(output.y).toBeCloseTo((1 - ndc.y) * height / 2, 8);
          expect(output.visible).toBe(true);
          const aim = renderer.pointer(output.x + rect.left, output.y + rect.top)!;
          expect(aim.x).toBeCloseTo(x * 32, 7);
          expect(aim.y).toBeCloseTo(z * 32, 7);
        }
        const layoutRead = vi.spyOn(renderer.canvas, 'getBoundingClientRect');
        layoutRead.mockClear();
        expect(getCameraFootprint(renderer, footprint)).toBe(true);
        expect(layoutRead).not.toHaveBeenCalled();
        for (let i = 0; i < 4; i++) {
          const [nx, ny] = corners[i];
          const floor = renderer.pointer(rect.left + (nx + 1) * width / 2, rect.top + (1 - ny) * height / 2)!;
          expect(footprint[i].x).toBeCloseTo(floor.x, 7);
          expect(footprint[i].y).toBeCloseTo(floor.y, 7);
        }
      }
    }
  });

  it.each(['perspective', 'orthographic'] as const)('rejects depth-clipped %s points inside the screen rectangle', projection => {
    const camera = projection === 'perspective'
      ? new T.PerspectiveCamera(45, 16 / 9, .1, 100)
      : new T.OrthographicCamera(-8, 8, 4.5, -4.5, .1, 100);
    camera.position.y = .8;
    camera.updateMatrixWorld();
    const renderer = {camera, canvas: {clientWidth: 1280, clientHeight: 720}} as DepthRenderer;
    expect(projectWorld(renderer, 0, -5 * 32, point()).visible).toBe(true);
    for (const z of [-.05, -101, 5]) {
      const projected = projectWorld(renderer, 0, z * 32, point());
      expect(projected.x).toBeCloseTo(640);
      expect(projected.y).toBeCloseTo(360);
      expect(projected.visible).toBe(false);
    }
  });

  it('preserves off-screen threat bearing behind and on the perspective eye plane', () => {
    const {renderer} = rendererProbe();
    renderer.camera = new T.PerspectiveCamera(45, 16 / 9, .1, 100);
    renderer.camera.position.y = .8;
    renderer.camera.updateMatrixWorld();
    for (const z of [5, 0]) {
      const projected = projectWorld(renderer, 32, z * 32, point());
      expect(projected.visible).toBe(false);
      expect(Number.isFinite(projected.x)).toBe(true);
      expect(Number.isFinite(projected.y)).toBe(true);
      expect(projected.x).toBeGreaterThan(640);
      const angle = Math.atan2(projected.y - 360, projected.x - 640);
      const edge = threatEdgePoint(640, 360, angle, 1280, 720, {x: 0, y: 0});
      expect(edge.x).toBeCloseTo(1238);
      expect(edge.y).toBeCloseTo(360);
    }
  });

  it('uses live camera depth even when a facade exposes an XY-only helper', () => {
    const {renderer, rig} = rendererProbe();
    renderer.resize(); rig.apply(renderer.camera, 1, 13);
    const helper = vi.fn(() => ({x: 640, y: 360}));
    Object.assign(renderer, {worldToScreen: helper});
    expect(projectWorld(renderer, 10000, 10000, point()).visible).toBe(false);
    expect(helper).not.toHaveBeenCalled();
  });

  it('hides the radar footprint when floor corners miss the frustum or matrices are nonfinite', () => {
    const {renderer, rig} = rendererProbe();
    renderer.resize(); rig.apply(renderer.camera, 1, 13);
    const out = Array.from({length: 4}, () => ({x: 0, y: 0}));
    expect(getCameraFootprint(renderer, out)).toBe(true);
    renderer.camera.projectionMatrixInverse.elements[0] = NaN;
    expect(getCameraFootprint(renderer, out)).toBe(false);
    renderer.camera.updateProjectionMatrix();
    renderer.camera.position.set(0, 5, 0);
    renderer.camera.lookAt(0, 5, -1);
    renderer.camera.updateMatrixWorld();
    expect(getCameraFootprint(renderer, out)).toBe(false);
    expect(getCameraFootprint(renderer, out.slice(0, 3))).toBe(false);
  });
});

it('aligns all offscreen bearings to one inset rectangle rather than a floating ellipse',()=>{
  for(const [width,height] of [[1280,720],[1920,1080]]){
    for(let i=0;i<32;i++){
      const angle=i/32*Math.PI*2;
      const edge=threatEdgePoint(width/2,height/2,angle,width,height,{x:0,y:0});
      expect(Math.min(Math.abs(edge.x-42),Math.abs(edge.x-(width-42)),Math.abs(edge.y-42),Math.abs(edge.y-(height-42)))).toBeLessThan(.001);
      expect(edge.x).toBeGreaterThanOrEqual(42-.001);expect(edge.x).toBeLessThanOrEqual(width-42+.001);
      expect(edge.y).toBeGreaterThanOrEqual(42-.001);expect(edge.y).toBeLessThanOrEqual(height-42+.001);
      expect(Math.atan2(edge.y-height/2,edge.x-width/2)).toBeCloseTo(Math.atan2(Math.sin(angle),Math.cos(angle)));
    }
  }
});
