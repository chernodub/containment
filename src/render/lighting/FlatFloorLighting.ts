import * as T from 'three';
import type {ShipEnvironment} from '../ShipEnvironments';

type FloorLighting={pattern:{value:T.Vector4};practicals:{value:readonly T.Vector4[]};apertureOnly:{value:number}};
const registered=new WeakMap<T.MeshStandardMaterial,FloorLighting>();

/** Share the authored floor apertures without painting another tile/wear pattern over floor art. */
export function registerFlatFloorLighting(material:T.MeshStandardMaterial,environment:ShipEnvironment,shapes?:readonly T.Vector4[]):void {
 let state=registered.get(material);
 if(!state){
  state={apertureOnly:{value:0},pattern:{value:new T.Vector4()},practicals:{value:Array.from({length:4},()=>new T.Vector4(1,0,.82,3.4))}};
  registered.set(material,state);
  const previous=material.onBeforeCompile,key=material.customProgramCacheKey(),uniforms=state;
  material.onBeforeCompile=(shader,renderer)=>{
   previous.call(material,shader,renderer);
   shader.uniforms.roomFloorApertureOnly=uniforms.apertureOnly;shader.uniforms.roomFloorPattern=uniforms.pattern;shader.uniforms.roomFloorPracticalShapes=uniforms.practicals;
   shader.fragmentShader='uniform float roomFloorApertureOnly;uniform vec4 roomFloorPattern;uniform vec4 roomFloorPracticalShapes[4];\n'+shader.fragmentShader;
  };
  material.customProgramCacheKey=()=>key+':flat-floor-apertures-v1';material.needsUpdate=true;
 }
 state.apertureOnly.value=material.userData.architectureApertureOnly?1:0;
 state.pattern.value.set(1,1,environment==='cryogenics'?0:1,0);
 state.practicals.value=shapes??Array.from({length:4},()=>new T.Vector4(1,0,.82,3.4));
}
