import * as T from 'three';

/** Exact opaque floor coverage, submitted ahead of the underlying deck's PBR work.
 * The color pass keeps LessEqualDepth, so its equal-depth pixels still shade.
 * No cloned geometry/buffers: disposeModel deduplicates the shared allocation.
 */
export function kitFloorDepthPrimer(surface:T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>):T.Mesh<T.BufferGeometry,T.MeshDepthMaterial> {
 const m=surface.material;
 // Fail visibly during preparation if future surface art changes invalidate the
 // no-discard/no-displacement precondition; never prime an alpha-cutout hole.
 if(m.transparent||m.opacity!==1||m.alphaTest!==0||m.alphaHash||m.alphaToCoverage||m.alphaMap||m.map||m.displacementMap||m.polygonOffset||m.clippingPlanes?.length||!m.depthTest||!m.depthWrite||m.depthFunc!==T.LessEqualDepth||m.side!==T.FrontSide||m.onBeforeCompile!==T.Material.prototype.onBeforeCompile)
  throw Error('Kit floor depth primer requires unmodified opaque depth coverage');
 const material=new T.MeshDepthMaterial({colorWrite:false,depthWrite:true,depthTest:true,depthFunc:T.LessEqualDepth,side:m.side});
 material.name='e6-kit-conduit-depth-primer';material.userData.actorMaterial=true;
 const mesh=new T.Mesh(surface.geometry,material);mesh.name=material.name;
 mesh.position.copy(surface.position);mesh.quaternion.copy(surface.quaternion);mesh.scale.copy(surface.scale);
 mesh.renderOrder=-1;mesh.castShadow=false;mesh.receiveShadow=false;
 mesh.userData.visualOnly=true;mesh.userData.kitFloorDepthPrimer=true;
 return mesh;
}
