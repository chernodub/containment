import * as T from 'three';
import { describe, expect, it, vi } from 'vitest';
import { InstanceBatch, type Primitive } from './InstanceBatch';

const kinds: Primitive[] = ['shard', 'spark', 'smoke', 'flame', 'solid', 'ghost', 'decal', 'front'];

describe('ability instance streaming', () => {
  it.each(kinds)('preserves %s transforms, colors and billboard orientation', kind => {
    const batch = new InstanceBatch(new T.Group(), kind, 8);
    const camera = new T.PerspectiveCamera(); camera.position.set(-5, 9, 8);
    batch.setView(camera); batch.begin();
    const expected = new T.Object3D(), matrix = new T.Matrix4(), color = new T.Color(0xff7a2e);
    for (let i = 0; i < 8; i++) {
      const x = i * .3, y = i * .1, z = -i * .2, yaw = i * .71, tilt = i * -.37;
      batch.draw(x, y, z, .2, .7, .4, 0xff7a2e, .6, yaw, tilt);
      const billboard = kind === 'spark' || kind === 'smoke' || kind === 'flame';
      expected.position.set(x, y, z);
      expected.scale.set(.2, .7, .4);
      expected.rotation.set(kind === 'decal' ? -Math.PI / 2 : 0,
        billboard ? Math.atan2(camera.position.x - x, camera.position.z - z) : yaw,
        kind === 'smoke' ? 0 : tilt);
      expected.updateMatrix(); batch.mesh.getMatrixAt(i, matrix);
      for (let j = 0; j < 16; j++) expect(matrix.elements[j]).toBeCloseTo(expected.matrix.elements[j], 6);
      expect(batch.mesh.instanceColor!.getX(i)).toBeCloseTo(color.r, 6);
      expect(batch.mesh.instanceColor!.getY(i)).toBeCloseTo(color.g, 6);
      expect(batch.mesh.instanceColor!.getZ(i)).toBeCloseTo(color.b, 6);
    }
    batch.end(); expect(batch.mesh.count).toBe(8); batch.dispose();
  });

  it('streams grounded ice variants without changing default shards or adding a batch', () => {
    const root = new T.Group(), batch = new InstanceBatch(root, 'shard', 8);
    const phase = batch.mesh.geometry.getAttribute('abilityPhase');
    const geometry = batch.mesh.geometry, material = batch.mesh.material;
    batch.begin(); batch.draw(1, 2, 3, .2, 1, .3, 0x7fd6ff, .8, 0, 0, 1);
    batch.draw(3, 4, 5, .1, .2, .3, 0x7fd6ff); batch.end();
    expect(phase.getX(0)).toBe(1); expect(phase.getX(1)).toBe(0);
    expect(root.children).toEqual([batch.mesh]);
    batch.begin(); batch.draw(0, 0, 0, .3, 1, .4, 0x7fd6ff, .8, 0, 0, 1); batch.end();
    expect(batch.mesh.geometry).toBe(geometry); expect(batch.mesh.material).toBe(material); batch.dispose();
  });


  it('billboards rounded fuel lobes while keeping ground fuel flat in the same retained batch', () => {
    const b=new InstanceBatch(new T.Group(),'decal',4),c=new T.PerspectiveCamera();c.position.set(0,8,8);b.setView(c);b.begin();
    b.draw(0,1,0,.2,.3,1,0x963914,.8,0,.2,11);b.draw(0,.04,0,2,2,1,0xff7a2e,.8,0,0,8);b.end();
    const m=new T.Matrix4();b.mesh.getMatrixAt(0,m);expect(m.elements[5]).toBeGreaterThan(.2);
    b.mesh.getMatrixAt(1,m);expect(m.elements[5]).toBe(0);expect(b.mesh.count).toBe(2);b.dispose();
  });

  it('reuses storage and upload records, transfers the live prefix and skips empty uploads', () => {
    const batch = new InstanceBatch(new T.Group(), 'solid', 512);
    const attributes = [batch.mesh.instanceMatrix, batch.mesh.instanceColor!,
      batch.mesh.geometry.getAttribute('abilityAlpha'), batch.mesh.geometry.getAttribute('abilityPhase')] as T.BufferAttribute[];
    const arrays = attributes.map(attribute => attribute.array);
    const compose = vi.spyOn(T.Matrix4.prototype, 'compose');
    const convert = vi.spyOn(T.Color.prototype, 'setHex');
    batch.begin(); batch.draw(1, 2, 3, .1, .2, .3, 0x7fd6ff); batch.end();
    const ranges = attributes.map(attribute => attribute.updateRanges[0]);
    expect(ranges.map(range => range.count)).toEqual([16, 3, 1, 1]);
    for (let frame = 0; frame < 60; frame++) {
      attributes.forEach(attribute => attribute.clearUpdateRanges());
      batch.begin();
      for (let i = 0; i < 3; i++) batch.draw(i, 2, 3, .1, .2, .3, i % 2 ? 0x7fd6ff : 0xff7a2e);
      batch.end();
      attributes.forEach((attribute, i) => {
        expect(attribute.array).toBe(arrays[i]);
        expect(attribute.updateRanges[0]).toBe(ranges[i]);
      });
    }
    expect(compose).not.toHaveBeenCalled(); compose.mockRestore();
    expect(convert).toHaveBeenCalledTimes(2); convert.mockRestore();
    expect(ranges.map(range => range.count)).toEqual([48, 9, 3, 3]);
    const versions = attributes.map(attribute => attribute.version);
    batch.begin(); batch.end();
    expect(batch.mesh.visible).toBe(false);
    expect(attributes.map(attribute => attribute.version)).toEqual(versions);
    batch.dispose();
  });
});
