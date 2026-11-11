import * as T from 'three';

export type AbilityZoneKind = 'fire' | 'frost' | 'electric' | 'aura';
const vertex = `varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

/** Textured, open ground states. The interior never becomes a solid colored disc. */
export function createAbilityZoneMaterial(kind: AbilityZoneKind): T.ShaderMaterial {
  return new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    blending: T.NormalBlending,
    uniforms: {
      time: { value: 0 }, motion: { value: 1 }, strength: { value: 1 },
      low: { value: 0 }, flash: { value: 1 },
      kind: { value: kind === 'fire' ? 0 : kind === 'frost' ? 1 : kind === 'electric' ? 2 : 3 },
    },
    vertexShader: vertex,
    fragmentShader: `
uniform float time;uniform float motion;uniform float strength;uniform float kind;uniform float low;uniform float flash;varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
void main(){
 vec2 p=vUv*2.-1.;float d=length(p);if(d>1.)discard;float t=time*motion;
 float rim=(1.-smoothstep(.001,.006,abs(d-.975)))*(1.-smoothstep(.985,1.,d));
 float fade=1.-smoothstep(.93,1.,d);float energy=0.;float alpha=0.;vec3 color;
 if(kind>2.5){
  float shimmer=.75+.25*sin(atan(p.y,p.x)*19.-t*3.);alpha=0.; color=vec3(.02);
 }else if(kind<.5){
  vec2 flow=p*5.+vec2(t*.28,-t*.75);float n=low>.5?noise(p*5.):noise(flow+vec2(noise(flow*1.8-t*.3),noise(flow*1.4+t*.2)));
  float vein=pow(max(0.,1.-abs(n-.51)*7.),5.);
  float hot=pow(smoothstep(.56,.82,n),3.);float edge=smoothstep(.65,.93,d);
  energy=vein*(.25+edge*.65)+hot*.22;
  alpha=(.035+energy*.06)*fade;
  color=mix(vec3(.014,.009,.006),vec3(.065,.018,.004),vein);
  color=mix(color,vec3(.18,.04,.005),hot*.15);
 }else if(kind<1.5){
  float grain=low>.5?noise(p*16.):noise(p*24.+vec2(t*.025,0.));
  float crystal=pow(max(0.,1.-abs(sin(atan(p.y,p.x)*9.+d*37.))),30.)*step(.56,grain);
  float fringe=smoothstep(.68,.95,d);
  alpha=(grain*.014+crystal*(.012+fringe*.025))*fade*smoothstep(.25,.52,d);
  color=vec3(.32,.8,1.5);
 }else{
  float wire=pow(max(0.,1.-abs(sin(p.x*15.+sin(p.y*21.+t*3.)))),35.);
  alpha=wire*.008*smoothstep(.7,.96,d)*fade;color=vec3(.65,.36,1.6);
 }
 alpha*=strength*(.4+.6*flash);if(alpha<.002)discard;
 gl_FragColor=vec4(color,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`,
  });
}
