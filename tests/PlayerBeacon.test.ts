import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {PlayerBeacon} from '../src/render/vfx/PlayerBeacon';
it('borrows the marine skin and releases only its own GPU resources',()=>{
 const player=new T.Group(),bone=new T.Bone(),geometry=new T.BoxGeometry(),material=new T.MeshStandardMaterial();
 const skin=new T.SkinnedMesh(geometry,material);player.add(skin);skin.add(bone);skin.bind(new T.Skeleton([bone]));
 const geometryDispose=vi.spyOn(geometry,'dispose'),skeletonDispose=vi.spyOn(skin.skeleton,'dispose');
 const hud=new T.Scene(),beacon=new PlayerBeacon(player,hud);player.position.set(4,0,6);beacon.update(player,0);
 const overlay=beacon.root.children.find(c=>c instanceof T.SkinnedMesh) as T.SkinnedMesh;
 expect(overlay.geometry).toBe(geometry);expect(overlay.skeleton).toBe(skin.skeleton);expect(overlay.matrix.equals(skin.matrixWorld)).toBe(true);
 expect((overlay.material as T.Material).depthTest).toBe(false);expect((overlay.material as T.Material).depthWrite).toBe(false);
 beacon.update(player,0,true);expect(beacon.root.visible).toBe(false);beacon.dispose();beacon.dispose();
 expect(geometryDispose).not.toHaveBeenCalled();expect(skeletonDispose).not.toHaveBeenCalled();expect(hud.children).toHaveLength(0);
 skin.skeleton.dispose();geometry.dispose();material.dispose();
});
