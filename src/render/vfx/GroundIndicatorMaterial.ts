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
  vec3 color=indicatorColor;
  if(indicatorMode>1.5){
    color*=1.0-smoothstep(.15,.66,radius);
    alpha=(1.0-smoothstep(.28,1.0,radius))*.48;
  }
  if(indicatorMode>2.5){
    vec2 p=indicatorUV*2.0-1.0;
    float edge=radius+.035*sin(p.x*35.0+p.y*22.0)+.024*sin(p.x*61.0-p.y*39.0);
    float ice=1.0-smoothstep(.87,.99,edge);
    float crust=smoothstep(.68,.87,edge)*ice;
    float grain=.5+.5*sin((p.y+.37*p.x)*93.0+sin(p.x*22.0)*2.0);
    color=mix(indicatorColor,vec3(.67,.91,1.0),.45*crust+.09*grain);
    alpha=ice*(.12+.05*grain)+crust*.21;
  }
  gl_FragColor=vec4(color,alpha);
}`;

/** Contact pools and supply locators share one program; shape and color are uniform data. */
export function groundIndicatorMaterial(mode:'contact'|'beam'|'supply',color:T.ColorRepresentation):T.ShaderMaterial {
  return new T.ShaderMaterial({
    vertexShader,fragmentShader,
    uniforms:{indicatorMode:{value:mode==='supply'?2:mode==='beam'?1:0},indicatorColor:{value:new T.Color(color)}},
    transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,
    toneMapped:false,vertexColors:false,
  });
}
