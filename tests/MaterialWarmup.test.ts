import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {MaterialWarmup} from '../src/render/MaterialWarmup';

it('retains future-room materials between prepares and releases owned resources without disposing borrowed surfaces',()=>{
 const surfaces={floor:new T.MeshStandardMaterial(),wall:new T.MeshStandardMaterial(),cover:new T.MeshStandardMaterial()},borrowed=Object.values(surfaces).map(m=>vi.spyOn(m,'dispose'));
 const library=new MaterialWarmup(surfaces),meshes=library.root.children as T.Mesh[],identities=meshes.map(m=>m.material);
 expect(library.root.visible).toBe(false);expect(meshes.length).toBeGreaterThan(6);
 for(let i=0;i<2;i++){const restore=library.prepare();expect(library.root.visible).toBe(true);restore();expect(library.root.visible).toBe(false);expect(meshes.map(m=>m.material)).toEqual(identities);for(const spy of borrowed)expect(spy).not.toHaveBeenCalled();}
 const owned=meshes.flatMap(m=>Array.isArray(m.material)?m.material:[m.material]).filter(m=>m.userData.actorMaterial).map(m=>vi.spyOn(m,'dispose'));
 library.dispose();library.dispose();for(const spy of owned)expect(spy).toHaveBeenCalledOnce();for(const spy of borrowed)expect(spy).not.toHaveBeenCalled();
 Object.values(surfaces).forEach(m=>m.dispose());
});
