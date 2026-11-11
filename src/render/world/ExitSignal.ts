import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Flush segmented threshold and upward guidance; never adds a visual obstruction. */
export function addExitSignal(exit:T.Group){
  const parts:T.BufferGeometry[]=[];
  for(const side of [-1,1])for(const z of [-.8,.8]){
    const g=new T.BoxGeometry(.36,.015,.055);g.translate(side*.72,.055,z);parts.push(g);
    const end=new T.BoxGeometry(.055,.015,.28);end.translate(side*.87,.055,z-Math.sign(z)*.12);parts.push(end);
  }
  for(let n=0;n<3;n++)for(const side of [-1,1]){
    const g=new T.BoxGeometry(.26,.015,.06);g.rotateY(side*.6);g.translate(.35+n*.28,.055,side*.1);parts.push(g);
  }
  const geometry=mergeGeometries(parts,false)!;parts.forEach(g=>g.dispose());
  const material=new T.ShaderMaterial({uniforms:{exitTime:{value:0},exitReady:{value:0}},vertexShader:'varying vec3 exitPosition;void main(){exitPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`uniform float exitTime;uniform float exitReady;varying vec3 exitPosition;void main(){float pulse=.82+.18*sin(exitTime*2.0-exitPosition.x*5.0);vec3 color=mix(vec3(.42,.27,.12),vec3(.38,.82,1.0),exitReady);gl_FragColor=vec4(color*pulse*mix(.65,1.7,exitReady),1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});material.name='exit-guidance';material.userData.actorMaterial=true;
  const mesh=new T.Mesh(geometry,material);mesh.name='exit-guidance';exit.add(mesh);exit.userData.signal=material;
}
export function updateExitSignal(exit:T.Group|null|undefined,time:number,ready:boolean,reducedMotion:boolean){
  const material=exit?.userData.signal as T.ShaderMaterial|undefined;if(!material)return;
  material.uniforms.exitTime.value=reducedMotion?0:time;material.uniforms.exitReady.value=ready?1:0;
}
