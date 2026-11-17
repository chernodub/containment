import * as T from 'three';

/** Small painted receiver band; shares the marine rig uniform, no extra mesh/pass. */
export function weaponRigAccent(root:T.Object3D,color:{value:T.Color}):void {
  root.traverse(object=>{
    if(!(object instanceof T.Mesh))return;
    object.geometry.computeBoundingBox();
    const bounds=object.geometry.boundingBox;
    if(!bounds)return;
    const center=(bounds.min.z+bounds.max.z)*.5,span=Math.max(.001,bounds.max.z-bounds.min.z);
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(!(material instanceof T.MeshStandardMaterial)||material.userData.light14WeaponAccent)continue;
      material.userData.light14WeaponAccent=true;
      const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
      material.onBeforeCompile=(shader,renderer)=>{
        previous.call(material,shader,renderer);
        shader.uniforms.weaponRigColor=color;
        shader.uniforms.weaponRigBand={value:new T.Vector2(center,span*.09)};
        shader.vertexShader='varying float weaponAccentZ;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nweaponAccentZ=position.z;');
        shader.fragmentShader='varying float weaponAccentZ;uniform vec3 weaponRigColor;uniform vec2 weaponRigBand;\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
float rigBand=1.0-smoothstep(weaponRigBand.y*.7,weaponRigBand.y,abs(weaponAccentZ-weaponRigBand.x));
totalEmissiveRadiance+=weaponRigColor*rigBand*.48;`);
      };
      material.customProgramCacheKey=()=>key+':weapon-rig-band-v1';
      material.needsUpdate=true;
    }
  });
}
