import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {ContextResources} from '../src/render/ContextResources';

it('retires shared GPU bindings once per generation and retains CPU geometry/images',()=>{
 const resources=new ContextResources(),root=new T.Group(),geometry=new T.BoxGeometry(),image=new Uint8Array(16),texture=new T.DataTexture(image,2,2),material=new T.MeshStandardMaterial({map:texture});
 root.add(new T.Mesh(geometry,material),new T.Mesh(geometry,material));
 const array=geometry.getAttribute('position').array,geometries=vi.spyOn(geometry,'dispose'),materials=vi.spyOn(material,'dispose'),textures=vi.spyOn(texture,'dispose');
 for(let generation=1;generation<=2;generation++){
  resources.track(root);resources.track(root);resources.invalidate();resources.invalidate();
  expect(geometries).toHaveBeenCalledTimes(generation);expect(materials).toHaveBeenCalledTimes(generation);expect(textures).toHaveBeenCalledTimes(generation);
  expect(geometry.getAttribute('position').array).toBe(array);expect(texture.image.data).toBe(image);expect(root.children).toHaveLength(2);
 }
});

it('retires instance attributes when their room geometry is disposed and forgets retired owners',()=>{
 const resources=new ContextResources(),geometry=new T.BoxGeometry(),mesh=new T.InstancedMesh(geometry,new T.MeshBasicMaterial(),4),dispose=vi.spyOn(mesh,'dispose');
 resources.track(mesh);geometry.dispose();expect(dispose).toHaveBeenCalledOnce();resources.invalidate();expect(dispose).toHaveBeenCalledOnce();
});

it('tracks bone textures created at the first draw without replacing a previous draw hook',()=>{
 const resources=new ContextResources(),mesh=new T.SkinnedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial()),skeleton=new T.Skeleton([new T.Bone()]),previous=vi.fn();
 mesh.bind(skeleton);mesh.onAfterRender=previous;resources.track(mesh);skeleton.computeBoneTexture();
 const texture=skeleton.boneTexture!,dispose=vi.spyOn(texture,'dispose');
 mesh.onAfterRender({} as T.WebGLRenderer,new T.Scene(),new T.PerspectiveCamera(),mesh.geometry,mesh.material as T.Material,null as never);
 expect(previous).toHaveBeenCalledOnce();resources.invalidate();expect(dispose).toHaveBeenCalledOnce();expect(skeleton.boneTexture).toBe(texture);
});
