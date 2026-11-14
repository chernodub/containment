import { describe, expect, it, vi } from 'vitest';
import { Group, Matrix4, ShaderMaterial, Vector3 } from 'three';
import { PlacementPreview, type PlacementPreviewState } from './PlacementPreview';

const state = (patch: Partial<PlacementPreviewState> = {}): PlacementPreviewState => ({
  ability: 'glacier', x: 320, y: 640, angle: Math.PI / 4, valid: true, ...patch,
});
function dimensions(preview: PlacementPreview, slot = 0) {
  const matrix = new Matrix4(), position = new Vector3(), scale = new Vector3();
  preview.mesh.getMatrixAt(slot, matrix); position.setFromMatrixPosition(matrix); scale.setFromMatrixScale(matrix);
  return { matrix, position, scale };
}

describe('native placement footprint', () => {
  it('centers the exact wall length/thickness perpendicular to the native angle', () => {
    const root = new Group(), preview = new PlacementPreview(root);
    const storage = preview.mesh.instanceMatrix.array;
    preview.set(state());
    const d = dimensions(preview);
    expect(d.position.toArray()).toEqual([10, expect.closeTo(.042), 20]);
    expect(d.scale.toArray()).toEqual([expect.closeTo(200 / 32 / 2), expect.closeTo(26 / 32 / 2), 1]);
    const along = new Vector3(1, 0, 0).transformDirection(d.matrix);
    expect(along.x).toBeCloseTo(-Math.SQRT1_2); expect(along.z).toBeCloseTo(Math.SQRT1_2);
    for (let i = 0; i < 100; i++) preview.set(state({ angle: i * .1 }));
    expect(preview.mesh.instanceMatrix.array).toBe(storage);
    preview.dispose();
  });

  it.each([
    ['napalm-charge', 120], ['tesla-pylon', 18],
  ] as const)('uses %s physical footprint rather than inventing an expanded support shape', (ability, radius) => {
    const preview = new PlacementPreview(new Group());
    preview.set(state({ ability }));
    expect(dimensions(preview).scale.x).toBeCloseTo(radius / 32);
    expect(dimensions(preview).scale.y).toBeCloseTo(radius / 32);
    preview.dispose();
  });

  it('preserves independent blocked marks and native reduced-radius augmented placements in one draw', () => {
    const preview = new PlacementPreview(new Group());
    preview.set(state({ ability: 'napalm-charge', points: [
      { x: 200, y: 300, valid: true, radius: 80 },
      { x: 300, y: 400, valid: false, radius: 80 },
      { x: 400, y: 500, valid: true, radius: 80 },
    ], pointCount: 3 }));
    expect(preview.mesh.count).toBe(3);
    expect(dimensions(preview, 1).scale.x).toBeCloseTo(80 / 32);
    const data = preview.mesh.geometry.getAttribute('preview');
    expect([data.getY(0), data.getY(1), data.getY(2)]).toEqual([1, 0, 1]);
    expect((preview.mesh.material as ShaderMaterial).fragmentShader).toContain('cross*invalid');
    expect(preview.mesh.renderOrder).toBeLessThan(20);
    expect((preview.mesh.material as ShaderMaterial).depthWrite).toBe(false);
    preview.dispose();
  });

  it('clears nonfinite, hidden and stale states and disposes exactly once', () => {
    const root = new Group(), preview = new PlacementPreview(root);
    const disposeGeometry = vi.spyOn(preview.mesh.geometry, 'dispose');
    const disposeMaterial = vi.spyOn(preview.mesh.material as ShaderMaterial, 'dispose');
    preview.set(state()); preview.update(100, true, false); expect(preview.mesh.count).toBe(0);
    preview.update(200, true); expect(preview.mesh.count).toBe(1);
    preview.set(state({ x: NaN })); expect(preview.mesh.count).toBe(0);
    preview.set(state()); preview.clear(); preview.update(200, false); expect(preview.mesh.count).toBe(0);
    preview.dispose(); preview.dispose(); preview.set(state()); expect(preview.mesh.count).toBe(0);
    expect(disposeGeometry).toHaveBeenCalledOnce(); expect(disposeMaterial).toHaveBeenCalledOnce();
    expect(root.children).toHaveLength(0);
  });
});
