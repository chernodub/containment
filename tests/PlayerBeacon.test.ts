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

it('borrows adaptive scene depth so only actually occluded skin receives cyan',()=>{
 const beacon=new PlayerBeacon(new T.Group()),depth=new T.DepthTexture(960,540),dispose=vi.spyOn(depth,'dispose');
 try{
  // A skinless fixture still exposes the retained material through the service.
  beacon.setDepthSource(depth,1920,1080);
  const material=(beacon as unknown as {material:T.ShaderMaterial}).material;
  expect(material.uniforms.sceneDepth.value).toBe(depth);
  expect(material.uniforms.inverseViewport.value.toArray()).toEqual([1/1920,1/1080]);
  expect(material.uniforms.hasSceneDepth.value).toBe(1);expect(material.depthTest).toBe(false);
  expect(material.fragmentShader).toContain('if(gl_FragCoord.z<=surface+.00008)discard;');
  beacon.setDepthSource(null,1280,720);expect(material.uniforms.sceneDepth.value).toBeNull();
  expect(material.depthTest).toBe(true);expect(material.depthFunc).toBe(T.GreaterDepth);
  beacon.dispose();expect(dispose).not.toHaveBeenCalled();
 }finally{beacon.dispose();depth.dispose();}
});
