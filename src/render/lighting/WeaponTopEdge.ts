import * as T from 'three';

/** A restrained highlight on the upward-facing receiver edge. */
export function weaponTopEdge(root:T.Object3D):void {
  root.traverse(object=>{
    if(!(object instanceof T.Mesh))return;
    object.geometry.computeBoundingBox();
    const bounds=object.geometry.boundingBox;
    if(!bounds)return;
    const threshold=T.MathUtils.lerp(bounds.min.y,bounds.max.y,.84);
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(!(material instanceof T.MeshStandardMaterial)||material.userData.marineWeaponTopEdge)continue;
      material.userData.marineWeaponTopEdge=true;
      const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
      material.onBeforeCompile=(shader,renderer)=>{
        previous.call(material,shader,renderer);
        shader.uniforms.weaponEdgeHeight={value:threshold};
        shader.vertexShader='varying float weaponHeight;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nweaponHeight=position.y;');
        shader.fragmentShader='varying float weaponHeight;uniform float weaponEdgeHeight;\n'+shader.fragmentShader
          .replace('#include <opaque_fragment>', `
const vec3 weaponLuma=vec3(.2126,.7152,.0722);
float topEdge=smoothstep(weaponEdgeHeight-.015,weaponEdgeHeight,weaponHeight)
  *smoothstep(.45,.85,dot(normal,viewMatrix[1].xyz));
float receiver=min(.16,dot(outgoingLight,weaponLuma));
outgoingLight=vec3(receiver*.96,receiver,receiver*1.03)+vec3(.13,.14,.15)*topEdge;
#include <opaque_fragment>`);
      };
      material.customProgramCacheKey=()=>key+':marine-weapon-edge-v2';
      material.needsUpdate=true;
    }
  });
}
