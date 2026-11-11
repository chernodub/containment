import * as T from 'three';

export type GroundZoneKind = 'fire' | 'frost' | 'electric';
const vertex = `varying vec2 vUv;varying vec3 vView;varying vec3 vNormal;
void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.0);vView=-p.xyz;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*p;}`;
const colors: Record<GroundZoneKind, number> = { fire: 0xff7a2e, frost: 0x7fd6ff, electric: 0xb79cff };

/** Circular ground footprint. Advance uniforms.time externally; no timers or gameplay ownership. */
export function createGroundZoneMaterial(kind: GroundZoneKind): T.ShaderMaterial {
  return new T.ShaderMaterial({ vertexShader: vertex, uniforms: {
    time: { value: 0 }, strength: { value: 1 }, color: { value: new T.Color(colors[kind]) },
    motion: { value: 1 }, kind: { value: kind === 'fire' ? 0 : kind === 'frost' ? 1 : 2 },
  }, fragmentShader: `uniform float time;uniform float motion;uniform float strength;uniform float kind;uniform vec3 color;varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 cell=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(cell),hash(cell+vec2(1.0,0.0)),f.x),mix(hash(cell+vec2(0.0,1.0)),hash(cell+vec2(1.0)),f.x),f.y);}
void main(){vec2 p=vUv*2.0-1.0;float d=length(p);if(d>1.0)discard;float t=time*motion;
float boundary=1.0-smoothstep(.91,1.0,d);float pattern;
if(kind<.5){vec2 q=p*4.0+vec2(0.0,-t*.65);float turbulent=noise(q+noise(q*2.0+t*.2))*.6+noise(q*2.3-t*.3)*.28+noise(q*5.1)*.12;pattern=smoothstep(.38,.8,turbulent)*.65;}
else if(kind<1.5){vec2 q=p*3.5,cell=floor(q),f=fract(q)-.5;float a=atan(f.y,f.x)+hash(cell)*6.28,r=length(f);float crystal=pow(1.0-abs(sin(a*3.0)),18.0)*(1.0-smoothstep(.18,.57,r));float twig=pow(1.0-abs(sin(r*41.0+a*3.0)),28.0)*crystal;pattern=crystal*.35+twig*.25+pow(noise(p*35.0),12.0)*.2;}
else{float arc=pow(1.0-abs(sin(p.x*12.0+sin(p.y*23.0+t*5.0)*1.5)),28.0);pattern=arc*.5;}
float edge=smoothstep(.86,.94,d);float alpha=(.04+pattern+edge*.34)*boundary*strength;
gl_FragColor=vec4(color*(.75+pattern*2.0),alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending });
}

/** Shield silhouette stays visible with motion=0; impact is an optional short local pulse. */
export function createDeployableShieldMaterial(color: T.ColorRepresentation = 0x9fe8ff): T.ShaderMaterial {
  return new T.ShaderMaterial({ vertexShader: vertex, uniforms: {
    time: { value: 0 }, motion: { value: 1 }, strength: { value: 1 }, impact: { value: 0 }, color: { value: new T.Color(color) },
  }, fragmentShader: `uniform float time;uniform float motion;uniform float strength;uniform float impact;uniform vec3 color;
varying vec2 vUv;varying vec3 vView;varying vec3 vNormal;
void main(){float facing=abs(dot(normalize(vView),normalize(vNormal)));float rim=pow(1.0-facing,2.0);
float border=1.0-smoothstep(.01,.05,min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y)));
vec2 cell=vUv*vec2(18.0,8.0);cell.x+=mod(floor(cell.y),2.0)*.5;vec2 hex=abs(fract(cell)-.5);
float grid=1.0-smoothstep(.42,.49,max(hex.x,hex.y));grid=1.0-grid;
float scan=pow(max(0.0,sin(vUv.y*30.0-time*motion*2.0)),16.0);
float a=(.045+border*.45+rim*.23+grid*.065+scan*.04+impact*.2)*strength;
gl_FragColor=vec4(color*(1.0+border*.8+impact),a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending });
}
