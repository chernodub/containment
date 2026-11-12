import * as T from 'three';

const vertexShader=/* glsl */ `
varying vec2 indicatorUV;
void main(){
  indicatorUV=uv;
  vec4 position4=vec4(position,1.0);
  #ifdef USE_INSTANCING
    position4=instanceMatrix*position4;
  #endif
  gl_Position=projectionMatrix*modelViewMatrix*position4;
}`;
const fragmentShader=/* glsl */ `
uniform float indicatorMode;
uniform vec3 indicatorColor;
varying vec2 indicatorUV;
void main(){
  float radius=length(indicatorUV*2.0-1.0);
  float contactAlpha=(1.0-smoothstep(.1,1.0,radius))*.4;
  float beamEdge=1.0-smoothstep(.06,.5,abs(indicatorUV.x-.5));
  float beamFade=pow(clamp(1.0-indicatorUV.y,0.0,1.0),1.8);
  float alpha=mix(contactAlpha,beamEdge*beamFade*.19,indicatorMode);
  gl_FragColor=vec4(indicatorColor,alpha);
}`;

/** Contact pools and supply locators share one program; shape and color are uniform data. */
export function groundIndicatorMaterial(mode:'contact'|'beam',color:T.ColorRepresentation):T.ShaderMaterial {
  return new T.ShaderMaterial({
    vertexShader,fragmentShader,
    uniforms:{indicatorMode:{value:mode==='beam'?1:0},indicatorColor:{value:new T.Color(color)}},
    transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,
    toneMapped:false,vertexColors:false,
  });
}
