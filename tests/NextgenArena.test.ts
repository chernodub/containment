import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {ArenaStaging} from '../src/render/vfx/ArenaStaging';

it('stages only the legacy Queen room without a central body occluder or new resource per load',()=>{
 const scene=new T.Scene(),arena=new ArenaStaging(scene),children=[...arena.root.children];
 arena.loadRoom('awakening-bay',40,30);expect(arena.root.visible).toBe(false);
 arena.loadRoom('reactor-vault',40,30);expect(arena.root.visible).toBe(true);expect(arena.root.position.toArray()).toEqual([20,0,15]);
 for(let i=0;i<20;i++)arena.loadRoom('reactor-vault',40,30);
 expect(arena.root.children).toEqual(children);expect((children[2] as T.InstancedMesh).count).toBe(32);
 const deck=children[0] as T.Mesh;deck.geometry.computeBoundingBox();expect(deck.geometry.boundingBox!.max.y+deck.position.y).toBeLessThan(.04);
 const disposals=children.map(child=>vi.spyOn((child as T.Mesh).geometry,'dispose'));
 arena.dispose();arena.dispose();for(const dispose of disposals)expect(dispose).toHaveBeenCalledOnce();expect(scene.children).toHaveLength(0);
});
it('prewarms hidden staging and holds its power cycle for reduced motion',()=>{
 const arena=new ArenaStaging();arena.loadRoom('awakening-bay',40,30);const restore=arena.prepare();expect(arena.root.visible).toBe(true);restore();expect(arena.root.visible).toBe(false);
 arena.loadRoom('reactor-vault',40,30);const rim=arena.root.children[1] as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
 arena.update(.05,1,true);const held=rim.material.emissiveIntensity;arena.update(.05,1,true);expect(rim.material.emissiveIntensity).toBe(held);
 arena.update(.05,1,false);expect(rim.material.emissiveIntensity).toBeGreaterThan(held);arena.dispose();
});
