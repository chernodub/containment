import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {kitFloorDepthPrimer} from './KitFloorDepthPrimer';
import {disposeModel} from '../meshParts';
import {registerGeometry} from '../post/GeometryBuffer';

describe('infested kit floor depth priming',()=>{
 it('shares exact coverage/transform and preserves the equal-depth color pass',()=>{
  const geometry=new T.PlaneGeometry(5,7).rotateX(-Math.PI/2),material=new T.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
  material.userData.actorMaterial=true;material.userData.floorDressing=true;
  const surface=new T.Mesh(geometry,material);surface.position.set(1,.013,2);surface.rotation.y=.3;surface.scale.set(2,1,3);
  const original=material.toJSON(),primer=kitFloorDepthPrimer(surface);
  expect(primer.geometry).toBe(surface.geometry);expect(primer.geometry.getAttribute('position')).toBe(geometry.getAttribute('position'));
  expect(primer.position.toArray()).toEqual(surface.position.toArray());expect(primer.quaternion.toArray()).toEqual(surface.quaternion.toArray());expect(primer.scale.toArray()).toEqual(surface.scale.toArray());
  expect(material.toJSON()).toEqual(original);expect(material.depthFunc).toBe(T.LessEqualDepth);
  expect(primer.material).toBeInstanceOf(T.MeshDepthMaterial);expect(primer.material.colorWrite).toBe(false);
  expect(primer.material.depthWrite&&primer.material.depthTest).toBe(true);expect(primer.material.depthFunc).toBe(material.depthFunc);
  expect(primer.renderOrder).toBe(-1);expect(surface.renderOrder).toBe(0);expect(primer.castShadow||primer.receiveShadow).toBe(false);
  const root=new T.Group();root.add(surface,primer);registerGeometry(root);
  // The depth-only draw must preserve actor IDs. The main color draw restores
  // MRT output; global colorWrite=false also masks every color attachment.
  expect(primer.material.userData.containmentPreserveGeometry).toBe(true);
  expect(material.userData.containmentPreserveGeometry).toBe(false);
  const gd=vi.spyOn(geometry,'dispose'),md=vi.spyOn(material,'dispose'),pd=vi.spyOn(primer.material,'dispose');
  disposeModel(root);expect(gd).toHaveBeenCalledTimes(1);expect(md).toHaveBeenCalledTimes(1);expect(pd).toHaveBeenCalledTimes(1);expect(root.parent).toBeNull();
 });
 it.each([
  (m:T.MeshStandardMaterial)=>{m.alphaTest=.1;},(m:T.MeshStandardMaterial)=>{m.alphaHash=true;},
  (m:T.MeshStandardMaterial)=>{m.transparent=true;},(m:T.MeshStandardMaterial)=>{m.opacity=.9;},
  (m:T.MeshStandardMaterial)=>{m.alphaMap=new T.Texture();},(m:T.MeshStandardMaterial)=>{m.map=new T.Texture();},
  (m:T.MeshStandardMaterial)=>{m.displacementMap=new T.Texture();},(m:T.MeshStandardMaterial)=>{m.polygonOffset=true;},
  (m:T.MeshStandardMaterial)=>{m.clippingPlanes=[new T.Plane()];},(m:T.MeshStandardMaterial)=>{m.depthFunc=T.LessDepth;},
  (m:T.MeshStandardMaterial)=>{m.depthWrite=false;},(m:T.MeshStandardMaterial)=>{m.depthTest=false;},
  (m:T.MeshStandardMaterial)=>{m.side=T.DoubleSide;},(m:T.MeshStandardMaterial)=>{m.onBeforeCompile=()=>{};},
 ])('rejects a future material whose depth coverage may differ (%#)',change=>{
  const geometry=new T.PlaneGeometry(),material=new T.MeshStandardMaterial();change(material);
  expect(()=>kitFloorDepthPrimer(new T.Mesh(geometry,material))).toThrow('opaque depth coverage');geometry.dispose();material.dispose();
 });
});
