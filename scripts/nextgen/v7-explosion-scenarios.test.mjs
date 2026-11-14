import { afterEach, describe, expect, it } from 'vitest';
import { OrthographicCamera, Raycaster, Plane, Vector2, Vector3 } from 'three';
import { registerV7ExplosionScenarios, stageV7Explosion, V7_EXPLOSION_ORIGINS } from './v7-explosion-scenarios.mjs';

afterEach(() => { delete globalThis.window; delete globalThis.document; });

function harness({ legal = true, viewWidth = 44, panels = [] } = {}) {
  const effects = [], steps = [];
  const gl = { createProgram() {} };
  const g = { player: {}, geometry: { bounds: { x: 0, y: 0, width: 1024, height: 1024 } }, enemies: { reset() {} } };
  const camera = new OrthographicCamera(-viewWidth / 2, viewWidth / 2, viewWidth * 1080 / 1920 / 2, -viewWidth * 1080 / 1920 / 2, .1, 100);
  camera.position.set(16, 32, 32); camera.lookAt(16, 0, 16); camera.updateMatrixWorld(true);
  const ray = new Raycaster(), floorPlane = new Plane(new Vector3(0, 1, 0), 0), point = new Vector3();
  const r = { camera, hudInsets: { top: 0, right: 0, bottom: 0, left: 0 },
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, right: 1920, bottom: 1080, width: 1920, height: 1080 }) },
    pointer(x, y) { ray.setFromCamera(new Vector2(x / 1920 * 2 - 1, 1 - y / 1080 * 2), camera);
      const hit = ray.ray.intersectPlane(floorPlane, point); return hit ? { x: hit.x * 32, y: hit.z * 32 } : null; },
    effect: e => effects.push(structuredClone(e)), renderer: { getContext: () => gl } };
  globalThis.document = { querySelectorAll: () => panels.map(box => ({ hidden: false, getBoundingClientRect: () => box })) };
  const d = { game: g, renderer: r, async gotoRoom() {}, invulnerable() {},
    canStand: (x, y, radius) => legal && x >= radius && y >= radius && x <= 1024 - radius && y <= 1024 - radius,
    clearShot: () => true, setInput() {}, step: ms => steps.push(ms), refresh() {} };
  globalThis.window = { __containmentDebug: d };
  return { d, g, r, gl, effects, steps };
}

describe('V7 explosion capture contracts', () => {
  it('adds five idempotent seven-phase payload inspections while retaining existing scenarios', () => {
    const old = { id: 'old', setup() {} }, scenarios = [old];
    registerV7ExplosionScenarios(scenarios); registerV7ExplosionScenarios(scenarios);
    expect(scenarios).toHaveLength(6); expect(scenarios[0]).toBe(old);
    expect(scenarios.slice(1).map(s => s.setupArgument.origin)).toEqual(['weapon', 'grenade', 'rocket', 'nest', 'queen']);
    for (const s of scenarios.slice(1)) {
      expect(s.burst).toBe(true); expect(s.diagnosticOnly).toBe(true); expect(s.setupArgument.samples).toEqual([0, 30, 90, 180, 340, 600, 1000]);
      expect(s.setup).toBe(stageV7Explosion);
    }
    expect(V7_EXPLOSION_ORIGINS.find(s => s.origin === 'nest').event).toEqual({ type: 'explosion', radius: 64 });
    expect(V7_EXPLOSION_ORIGINS.find(s => s.origin === 'queen').event).toEqual({ type: 'explosion', radius: 240 });
  });

  it('replays each honest payload at the same legal mark with a warning and compile guard', async () => {
    const marks = [];
    for (const entry of V7_EXPLOSION_ORIGINS) {
      const h = harness(), samples = [0, 30, 90, 180, 340, 600, 1000];
      await stageV7Explosion({ ...entry, room: 'containment-annulus', samples });
      const proof = h.d.g4DangerProof; marks.push(proof.mark);
      expect(proof.presentationOnly).toBe(true); expect(proof.nativeAction).toBe(false);
      expect(proof.source).toBe(entry.source); expect(proof.qualification).toContain('does not simulate');
      expect(h.effects).toHaveLength(2); expect(h.effects[0].type).toBe('enemy-warning');
      expect(h.effects[1]).toEqual({ ...entry.event, x: proof.mark.tx, y: proof.mark.ty });
      const distance = Math.hypot(proof.mark.tx - h.g.player.x, proof.mark.ty - h.g.player.y);
      expect(distance).toBeGreaterThanOrEqual(80); expect(distance).toBeLessThanOrEqual(360);
      expect(proof.framing.cameraOverride).toBe(false); expect(proof.framing.coreClearance).toBe(52);
      expect(proof.mark.support.nativeQueenRadius).toBe(240);
      expect(proof.mark.support.points).toBe(200);
      expect(proof.framing.supportTrace).toHaveLength(1);
      for (let i = 1; i < samples.length; i++) h.d.step(150);
      expect(h.steps).toEqual([3800, 30, 60, 90, 160, 260, 400]);
      expect(proof.sampleMs).toBe(1000); expect(h.d.shaderCompilations).toBe(0);
      expect(proof.framing.supportTrace).toHaveLength(7);
      for (const support of proof.framing.supportTrace) {
        expect(support.inside).toBe(true); expect(support.depthValid).toBe(true);
        expect(support.bounds.left).toBeGreaterThanOrEqual(24);
        expect(support.bounds.right).toBeLessThanOrEqual(1896);
        expect(support.bounds.top).toBeGreaterThanOrEqual(24);
        expect(support.bounds.bottom).toBeLessThanOrEqual(1056);
      }
      expect(() => h.gl.createProgram()).toThrow('compiled a combat shader');
    }
    for (const mark of marks) expect(mark).toEqual(marks[0]);
  });

  it('rejects clipped full blast support even when its center is legal and on screen', async () => {
    harness({ viewWidth: 12 });
    await expect(stageV7Explosion({ ...V7_EXPLOSION_ORIGINS[0], room: 'containment-annulus', samples: [0, 30] }))
      .rejects.toThrow('complete projected Queen/fire/smoke support');
  });

  it('revalidates full support after every camera update instead of accepting an initial center proof', async () => {
    const h = harness();
    await stageV7Explosion({ ...V7_EXPLOSION_ORIGINS[0], room: 'containment-annulus', samples: [0, 30] });
    h.r.camera.position.x += 40; h.r.camera.updateMatrixWorld(true);
    expect(() => h.d.step(150)).toThrow('support clipped at 30ms');
  });

  it('reserves measured HUD panels independently of the canvas border', async () => {
    const panels = [{ left: 0, top: 0, right: 270, bottom: 180, width: 270, height: 180 },
      { left: 620, top: 970, right: 1300, bottom: 1060, width: 680, height: 90 }];
    const h = harness({ panels });
    await stageV7Explosion({ ...V7_EXPLOSION_ORIGINS[0], room: 'containment-annulus', samples: [0, 30] });
    expect(h.d.g4DangerProof.framing.measuredHudPanels).toHaveLength(2);
    expect(h.d.g4DangerProof.mark.support.overlapsHud).toBe(false);
  });

  it('rejects unavailable legal floor rather than bypassing room geometry', async () => {
    harness({ legal: false });
    await expect(stageV7Explosion({ ...V7_EXPLOSION_ORIGINS[0], room: 'containment-annulus', samples: [0, 30] }))
      .rejects.toThrow('No legal V7 shared explosion inspection mark');
  });
});


it('keeps the strict full-pulse guard while explicitly recording clipped rings in material-only review',async()=>{
  harness({viewWidth:24});
  await expect(stageV7Explosion({...V7_EXPLOSION_ORIGINS[4],room:'containment-annulus',samples:[0,30]})).rejects.toThrow('complete projected Queen/fire/smoke support');
  const h=harness({viewWidth:24});
  await stageV7Explosion({...V7_EXPLOSION_ORIGINS[4],room:'containment-annulus',samples:[0,30],materialReview:true});
  const p=h.d.g4DangerProof;
  expect(p.mark.support.inside).toBe(true);expect(p.mark.support.materialReview).toBe(true);
  expect(p.mark.support.pulseInside).toBe(false);expect(p.event.radius).toBe(240);
  expect(p.framing.scope).toContain('separate clipping diagnostic');
});
