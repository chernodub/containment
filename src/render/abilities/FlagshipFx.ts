import * as T from 'three';
import { ELEMENT_COLORS } from './types';

/**
 * VFX13/VFX14 surfaces: one retained procedural program for the hero
 * ability moments (fire volume slices, cooling scorch, rail lance and wake,
 * shock rings, frost, Overdrive floor states). Every pooled mesh shares the
 * same geometry and shader source; modes are uniforms, so warm-up compiles a
 * single program and combat never creates one. Shapes are generated in the
 * vertex shader from the exact simulated cone/strip/radius numbers and never
 * exceed them (the muzzle pull-in only moves the narrow apex inward).
 */
export const FxMode = { Fire: 0, Scorch: 1, Lance: 2, Wake: 3, Shock: 4, Frost: 5, Aura: 6, Crack: 7, Fuel: 8, Pressure: 9, Pillar: 10, FuelStrip: 11, FrostStrip: 12, Blizzard: 13, Climax: 14, Tongues: 15 } as const;
export type FxMode = (typeof FxMode)[keyof typeof FxMode];

export interface FxSlot {
  live: boolean;
  mode: FxMode;
  age: number;
  life: number;
  /** World-space origin (apex/start/centre). */
  x: number; y: number; z: number;
  /** Aim angle (fan/strip direction). */
  angle: number;
  /** Fan: full arc. Ring: unused. */
  arc: number;
  /** Fan/ring: outer radius; strip: length. */
  range: number;
  /** Fan: inner radius fraction; ring: inner radius; strip: half width. */
  inner: number;
  /** Heights: near/far for fans, constant for others. */
  h0: number; h1: number;
  /** Optional muzzle used to pull the fan apex. */
  mx: number; my: number; mz: number;
  seed: number;
  color: number;
  intensity: number;
  /** Mode scalar: Fire layer (negative = steady jet), fuel fade, aura strength, Wake lightning selector. */
  param: number;
  readonly mesh: T.Mesh;
  readonly material: T.ShaderMaterial;
}

const vertex = `
uniform float fxMode;uniform vec3 fxOrigin;uniform vec3 fxMuzzle;uniform float fxAngle;uniform float fxArc;
uniform float fxRange;uniform float fxInner;uniform vec2 fxHeight;uniform float fxAge;uniform float fxParam;
varying vec2 fxLocal;varying vec3 fxWorld;varying vec4 fxScreen;varying float fxSeg;
void main(){
 vec2 g=uv;vec3 w;float m=fxMode;fxSeg=0.;
 if(m>14.5){
  // Eight camera-facing standing tongues in one mesh: five grid columns per tongue; the
  // sliver between tongues carries a fractional segment id and is discarded.
  float col=floor(g.x*40.+.5);float seg=min(7.,floor(col/5.));float c=col-seg*5.;
  float s=c/4.*2.-1.;float v=g.y;
  if(col>39.5){s=1.;}
  float h1=fract(sin(seg*12.9898+fxAngle*7.1)*43758.5),h2=fract(sin(seg*78.233+fxAngle*3.3)*12543.1),h3=fract(sin(seg*39.425+fxAngle)*24634.6);
  float ang=seg*2.39996+fxAngle*6.2831853;
  float rr=fxRange*(.63+.31*sqrt(h1));
  vec3 base=vec3(fxOrigin.x+cos(ang)*rr,fxHeight.x,fxOrigin.z+sin(ang)*rr);
  float H=fxHeight.y*(.55+.7*h2)*fxParam;float W=.42+.36*h3;
  vec3 right=normalize(vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]));
  w=base+right*(s*W*(1.-.55*v))+vec3(0.,v*H,0.);
  fxLocal=vec2(s,v);fxSeg=seg+step(39.5,col)*.5;
 }else if(m>13.5){
  // Climax disc (ground): u around, v centre to exact radius.
  float a=g.x*6.2831853;float r=g.y*fxRange;
  w=vec3(fxOrigin.x+cos(a)*r,fxHeight.x,fxOrigin.z+sin(a)*r);fxLocal=vec2(g.x,r);
 }else if(m>12.5){
  float a=g.x*6.2831853,polar=g.y*1.5707963;
  float radius=fxRange*sin(polar);
  w=vec3(fxOrigin.x+cos(a)*radius,fxHeight.x+cos(polar)*fxHeight.y,fxOrigin.z+sin(a)*radius);
  fxLocal=g;
 }else if(m>10.5){
  vec2 d=vec2(cos(fxAngle),sin(fxAngle)),n=vec2(-d.y,d.x);
  float s=g.x*2.-1.,along=mix(-fxInner,fxRange+fxInner,g.y);
  vec2 xz=fxOrigin.xz+d*along+n*s*fxInner;
  w=vec3(xz.x,fxHeight.x,xz.y);fxLocal=vec2(s,along);
 }else if(m>9.5){
  float a=g.x*6.2831853;
  float radius=fxRange*(.7+.3*sin(g.y*3.14159));
  w=vec3(fxOrigin.x+cos(a)*radius,fxHeight.x+g.y*fxHeight.y,fxOrigin.z+sin(a)*radius);
  fxLocal=g;
 }else if(m<1.5||m>8.5){
  // Fan: u across the exact arc, v from inner fraction to the exact range.
  float s=g.x*2.-1.;float r=mix(fxInner,1.,g.y);
  float a=fxAngle+s*fxArc*.5;
  vec2 polar=fxOrigin.xz+vec2(cos(a),sin(a))*r*fxRange;
  float pull=1.-smoothstep(fxInner,fxInner+.32,r);
  vec2 xz=mix(polar,fxMuzzle.xz,pull*step(m,.5));
  float lift=m<.5?fxParam*fxAge*1.1:0.;
  w=vec3(xz.x,mix(fxHeight.x,fxHeight.y,smoothstep(0.,1.,r))+lift,xz.y);
  if(m<.5 && fxArc>6.)w.y+=fxHeight.y*(1.-r*r)*(1.-smoothstep(.06,.38,fxAge));
  fxLocal=vec2(s,r);
 }else if(m<3.5){
  // Strip: u across the half width, v along the exact length.
  vec2 d=vec2(cos(fxAngle),sin(fxAngle));vec2 n=vec2(-d.y,d.x);
  float s=g.x*2.-1.;
  vec2 xz=fxOrigin.xz+d*g.y*fxRange+n*s*fxInner;
  w=vec3(xz.x,fxParam>2.5?mix(fxHeight.x,fxHeight.y,g.y):fxHeight.x,xz.y);fxLocal=vec2(s,g.y);
 }else{
  // Ring/disc: u around, v from inner radius to outer radius.
  float a=g.x*6.2831853;float r=mix(fxInner,fxRange,g.y);
  w=vec3(fxOrigin.x+cos(a)*r,fxHeight.x,fxOrigin.z+sin(a)*r);fxLocal=vec2(g.x,r);
 }
 fxWorld=w;
 gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);fxScreen=gl_Position;
}`;

const COLD_FIELD_LIMIT = 8;
const fragment = `
uniform vec4 coldAxes[${COLD_FIELD_LIMIT}];
uniform float coldRadii[${COLD_FIELD_LIMIT}];
uniform int coldCount;uniform int coldOwner;
uniform float fxMode;uniform float fxAge;uniform float fxLife;uniform float fxTime;uniform float fxSeed;
uniform float fxRange;uniform float fxInner;uniform float fxArc;uniform vec3 fxColor;uniform float fxIntensity;
uniform float fxParam;uniform float fxLow;uniform vec3 fxOrigin;uniform float fxAngle;uniform float fxYield;
varying vec2 fxLocal;varying vec3 fxWorld;varying vec4 fxScreen;varying float fxSeg;
float fxHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float fxNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(fxHash(i),fxHash(i+vec2(1.,0.)),f.x),mix(fxHash(i+vec2(0.,1.)),fxHash(i+vec2(1.)),f.x),f.y);}
float fxFbm(vec2 p){float s=0.,a=.5;mat2 r=mat2(1.6,1.2,-1.2,1.6);
 for(int i=0;i<5;i++){if(fxLow>.5&&i>2)break;s+=a*fxNoise(p);p=r*p;a*=.5;}return fxLow>.5?s*1.14:s;}
// Cell noise: x = nearest, y = second nearest, z = cell id hash. Edges where y-x is small.
vec3 fxCells(vec2 p){vec2 i=floor(p),f=fract(p);float d1=8.,d2=8.;vec2 id=i;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 b=vec2(float(x),float(y));
  vec2 o=vec2(fxHash(i+b),fxHash(i+b+17.31));vec2 r=b+o-f;float d=dot(r,r);
  if(d<d1){d2=d1;d1=d;id=i+b;}else if(d<d2)d2=d;}
 return vec3(sqrt(d1),sqrt(d2),fxHash(id+3.3));}
// Blackbody-like ramp: smoke, dark red, orange, yellow, white (HDR for bloom).
vec3 fxHeat(float t){
 vec3 c=mix(vec3(.035,.022,.018),vec3(.5,.05,.008),smoothstep(.04,.24,t));
 c=mix(c,vec3(1.8,.3,.02),smoothstep(.2,.45,t));
 c=mix(c,vec3(3.,1.35,.12),smoothstep(.45,.72,t));
 return mix(c,vec3(5.,4.2,2.8),smoothstep(.8,1.,t));
}
void main(){
 float m=fxMode;vec3 emit=vec3(0.);float alpha=0.;vec3 base=vec3(0.);
 float t=fxTime;float age=fxAge;float k=age/max(.001,fxLife);
 if(m<.5){
  // Fire volume slice. param 0 = low hot sheet, .5 = body, 1 = smoke crown.
  float s=fxLocal.x,r=fxLocal.y,layer=max(0.,fxParam);
  float front=.65+.35*(1.-pow(1.-clamp(age/.10,0.,1.),3.));
  // Anisotropic flow space: features stretch along the jet into licking tongues.
  vec2 q=vec2(s*(r*1.05+.12)*fxRange*.72,r*fxRange*.42);
  vec2 flow=vec2(0.,t*(3.2-layer*1.4))+fxSeed;
  // Curl: tongues sway and roll sideways as they travel, more toward the edge.
  q.x+=sin(q.y*2.1-t*7.+fxSeed)*.32*r+sin(q.y*4.3+t*5.)*.12*r;
  vec2 warp=vec2(fxFbm(q*.5-flow*.45),fxFbm(q*.5+vec2(5.2,1.3)-flow*.5));
  vec2 qi=vec2(s*(r*1.05+.12)*fxRange*.62,r*fxRange);
  float n=fxFbm(q*1.1+warp*1.9-flow)*.42+fxFbm(qi*.75+warp*1.6-vec2(0.,t*(4.2-layer*2.)))*.62;
  float fine=fxNoise(q*vec2(3.6,1.6)-flow*1.6+warp*2.);
  // Ragged lateral edge: tongues cut deep into the outer half of the arc.
  float edge=.6+(n-.45)*1.4+fine*.12-layer*.06;
  float body=1.-smoothstep(edge-.3,edge,abs(s));
  // Rolling front: thicker billow just behind the advancing edge, nothing past it.
  float tip=1.-smoothstep(front-.24-n*.22,front,r);
  float billow=smoothstep(front-.34,front-.06,r)*(1.-smoothstep(front-.06,front,r));
  float erosion=.3+r*.24+max(0.,age-.14)*(1.9-layer*1.1)+layer*.1;
  float d=(n*.85+fine*.22)*body*tip*(1.+billow*.45);
  float dens=smoothstep(erosion,erosion+.07,d);
  float inside=clamp((d-erosion)/.32,0.,1.);
  float spine=(1.-smoothstep(0.,.2+r*.15,abs(s)))*(1.-smoothstep(.05,.5,r))*(1.-layer)*tip;
  float core=(1.-smoothstep(0.,.17,r-fxInner))*(1.-smoothstep(.0,.58,abs(s)))*(1.-layer*.85);
  float cool=1.-smoothstep(.045,.28,age);
  dens=max(dens,spine*cool*.9);
  float heat=inside*(.98-r*.42)*(.45+.55*cool)+spine*.55*cool+core*(1.-smoothstep(.045,.13,age));
  heat*=1.-layer*.42;
  heat=clamp(heat,0.,1.);
  // Smoke: cold density that outlives the flame, mostly on the crown layer.
  float smoke=smoothstep(erosion-.12,erosion+.2,d)*(1.-smoothstep(.1,.4,heat))*smoothstep(.06,.3,age)*(.2+layer*.8);
  emit=fxHeat(heat)*dens*(.34+core*.5+spine*.25)*fxIntensity*(1.-layer*.4);
  // Inked rim: the tongue edge is opaque dark ember red, the hot interior is light.
  float rim=dens*(1.-smoothstep(.0,.35,inside));
  alpha=max(smoke*.45*(1.-smoothstep(.5,1.,k)),dens*.12+rim*.3*(1.-layer*.6));
  base=mix(vec3(.025,.022,.021),vec3(.2,.035,.008),max(cool,dens*(1.-smoke)));
  emit*=1.-smoothstep(.62,1.,k);
  if(fxArc>6.){
   float belly=(1.-smoothstep(.28+n*.16,.75+n*.17,r))*(1.-smoothstep(.045,.29,age));
   float coal=smoothstep(.23,.67,n+.16*fine);
   float hot=1.-smoothstep(.045,.1,age);
   emit=fxHeat(.37+.48*(1.-r)*(.5+.5*hot))*belly*(.31+.69*coal)*fxIntensity;
   alpha=max(alpha*.45,belly*.6);
  }else if(fxParam>=0.){
   float surge=(1.-smoothstep(.045,.22,age))*tip*body*(1.-layer*.8);
   float roll=surge*smoothstep(.24,.52,n+.13*fine);
   float ignition=1.-smoothstep(.045,.09,age);
   emit*=mix(.55,1.,ignition);
   emit+=fxHeat(.36+.38*(1.-abs(s))*(1.-r*.7))*roll*(.47+.28*ignition)*fxIntensity;
   alpha=max(alpha,roll*.55);
  }
  if(fxParam<-.5){
   float tongueWidth=.65*pow(max(0.,1.-r),.65)+n*.18;
   float tongue=(1.-smoothstep(tongueWidth*.55,tongueWidth,abs(s)))*(1.-smoothstep(.55+n*.25,.9+n*.1,r));
   tongue*=.35+.65*smoothstep(.34,.56,n+fine*.2);
   float hotCore=(1.-smoothstep(.08,.28,abs(s)))*(1.-smoothstep(.15,.55,r));
   alpha=tongue*.46;
   base=vec3(.14,.025,.004);
   emit=(vec3(1.3,.22,.008)*tongue+vec3(2.4,1.3,.16)*hotCore)*fxIntensity;
  }
 }else if(m<1.5){
  // Scorch fan on the deck: glowing fissures cool from orange-white to black soot.
  float s=fxLocal.x,r=fxLocal.y;
  float front=1.-pow(1.-clamp(age/.15,0.,1.),3.);
  vec2 q=vec2(s*(r*1.05+.12)*fxRange*.62,r*fxRange)+fxSeed;
  float n=fxFbm(q*.9);
  float body=1.-smoothstep(.55+n*.5-.28,.55+n*.5,abs(s));
  float soot=smoothstep(.25,.6,n*body*(1.25-r*.55))*step(r,front);
  // Glowing embers in the char: sparse specks and soft underglow, cooling to black.
  float speck=smoothstep(.74,.86,fxNoise(q*5.3+n*2.))*smoothstep(.45,.6,fxFbm(q*.6+3.1));
  float under=smoothstep(.42,.75,fxFbm(q*.7+7.7));
  float heat=exp(-age*1.0);float hot=exp(-age*4.);
  float on=smoothstep(.1,.25,age);
  emit=(vec3(3.2,.75,.08)*speck*heat+vec3(.9,.16,.02)*under*heat*.6+vec3(1.4,.35,.05)*hot*under*.5)*soot*on*fxIntensity;
  alpha=soot*.62*on*(1.-smoothstep(.55,1.,k));
  base=vec3(.014,.012,.011);
  emit*=1.-smoothstep(.55,1.,k);
 }else if(m<2.5){
  // Rail lance: hair-thin white core, sharp leading edge for ~2 frames.
  float s=abs(fxLocal.x),v=fxLocal.y;
  float lead=clamp(age/.018,0.,1.);
  float reach=smoothstep(lead+.002,lead-.02,v);
  float headGlow=exp(-abs(v-lead)*40.)*(1.-step(1.,lead));
  float life=1.-smoothstep(.016,.033,age);
  float coreW=.06+.05*life;
  float core=1.-smoothstep(coreW*.3,coreW,s);
  float halo=exp(-s*s*9.)*.55;
  float flick=.85+.15*fxNoise(vec2(v*40.-t*60.,fxSeed));
  emit=(vec3(9.,8.5,7.5)*core+fxColor*3.*halo*flick)*reach*life*fxIntensity+vec3(10.,9.,8.)*headGlow*core;
  alpha=(core*.6+halo*.15)*reach*life;
 }else if(m<3.5){
  // Rail wake: segmented spiral of charged air that lingers, twists and fades.
  float s=fxLocal.x,v=fxLocal.y;
  float along=v*fxRange;
  float spin=along*2.6-t*9.-age*14.;
  float strand=0.;
  for(int i=0;i<2;i++){float ph=spin+float(i)*3.14159;float c=sin(ph)*(.35+.25*smoothstep(0.,.6,k));
   strand+=(1.-smoothstep(.03,.12,abs(s-c)))*(.55+.45*cos(ph));}
  // Broken into charged segments that drift apart as the wake cools.
  float seg=smoothstep(.42,.62,fxNoise(vec2(along*2.3-t*1.5,fxSeed+float(age>.3))));
  float appear=smoothstep(.03,.14,age);
  float fade=1.-smoothstep(.2,1.,k);
  float breakup=smoothstep(k*.9,k*.9+.2,fxFbm(vec2(along*1.4,s*2.)+fxSeed+t*.6));
  float trail=exp(-s*s*7.)*.3*(1.-smoothstep(0.,.5,k));
  float i0=(strand*seg+trail)*fade*breakup*appear;
  vec3 hot=mix(vec3(2.2,1.9,1.5),fxColor*1.6,smoothstep(0.,.35,k));
  if(fxParam>2.5){
   float jitter=(fxNoise(vec2(along*4.,floor(t*18.)+fxSeed))-.5)*.8;
   float bolt=1.-smoothstep(.065,.19,abs(s-jitter));
   float body=1.-smoothstep(.16,.54,abs(s-jitter));
   float delta=s-jitter;
   float halo=exp(-delta*delta*6.25);
   float fork=1.-smoothstep(.015,.055,abs(s-jitter-sin(along*8.+fxSeed)*.35));
   float gate=(1.-smoothstep(.6,1.,k))*smoothstep(0.,.03,v)*(1.-smoothstep(.96,1.,v));
   emit=(vec3(1.45)*bolt+fxColor*(body*.8+fork*.6+halo*.25))*gate*fxIntensity;
   alpha=(bolt*.22+fork*.08+halo*.06)*gate;
  }else{emit=hot*i0*fxIntensity;alpha=i0*.12;}
 }else if(m<4.5){
  // Shock ring: hard bright leading edge racing to the exact radius.
  float r=fxLocal.y;float R=fxRange;
  float p=.1+.9*(1.-pow(1.-clamp(k*1.25,0.,1.),2.4));
  float front=R*p;
  float dist=r-front;
  float edge=(1.-smoothstep(0.,.05+.07*(1.-p),abs(dist+.03)))*(1.-step(R+.001,r));
  float wake=smoothstep(-.3,0.,dist)*(1.-step(0.,dist))*.35;
  float facets=.65+.35*step(.5,fract(fxLocal.x*48.+fxSeed));
  // Broken into arcs (seam-free angular noise): an impact front, never a clean UI circle.
  float sa=fxLocal.x*6.2831853;
  float brk=smoothstep(.32,.58,fxFbm(vec2(cos(sa),sin(sa))*2.8+fxSeed+k*1.5));
  edge*=brk;wake*=brk;
  float fade=1.-smoothstep(.55,1.,k);
  emit=(fxColor*2.6*facets+vec3(1.6)*edge)*edge*fade*fxIntensity+fxColor*wake*.6*fade*fxIntensity;
  alpha=(edge*.55+wake*.25)*fade;
 }else if(m<5.5||(m>11.5&&m<12.5)){
  // Frost: crystalline growth spreading from the centre, rime veins, slow fade.
  float r=fxLocal.y;float R=fxRange;float a=fxLocal.x*6.2831853;
  vec2 q=(fxWorld.xz-fxOrigin.xz)*1.6+fxSeed;
  float grow=R*(1.-pow(1.-clamp(age/.4,0.,1.),2.));
  float n=fxFbm(q*.8);
  float lim=grow*(.8+n*.32);
  float cover=1.-smoothstep(lim-.4,lim,r);
  cover*=1.-step(R,r);
  float patchy=smoothstep(.46,.62,fxFbm(q*.45+9.1));
  float veins=(1.-smoothstep(0.,.03,abs(fxFbm(q*1.7+n)-.5)))*patchy;
  float band=smoothstep(lim-.7,lim-.12,r)*(1.-smoothstep(lim-.12,lim,r));
  if(m>11.5){
   float cap=length(vec2(fxLocal.x*fxInner,max(max(-r,r-fxRange),0.)))/max(.001,fxInner);
   cover=1.-smoothstep(.88,1.,cap);
   band=smoothstep(.66,.94,cap)*cover;
  }
  float fern=pow(abs(sin(a*31.+n*7.+r*4.)),24.)*band;
  float fade=1.-smoothstep(.5,1.,k);
  float crisp=exp(-age*2.5);
  vec3 ice=vec3(.5,.8,1.);
  emit=(ice*(veins*.14+fern*.5+band*.12)*(.35+1.3*crisp))*cover*fade*fxIntensity;
  alpha=cover*(.015+patchy*.03+veins*.11+band*.14+fern*.2)*fade;
  base=fxParam>.5?vec3(.035,.085,.12):vec3(.66,.82,.9);
  if(fxParam>.5)alpha+=cover*(.18+patchy*.18)*fade;
  if(m>11.5){
   // Ink under rime keeps the native strip readable on the palest deck.
   alpha=max(alpha,cover*(.55+patchy*.12)*fade);
   base=vec3(.002,.008,.012);
   emit=ice*(veins*.16+fern*.22+band*.3)*cover*fade*fxIntensity;
  }
 }else if(m<6.5){
  // Overdrive floor state: element-coloured energy field around the marine.
  float r=fxLocal.y;float R=fxRange;float a=fxLocal.x*6.2831853;
  vec2 q=(fxWorld.xz-fxOrigin.xz);
  float n=fxFbm(q*1.3+vec2(t*.4,-t*.3)+fxSeed);
  // Element signature on the deck (fxArc: 1 cryo, 2 pyro, 3 arc, else kinetic).
  float el=fxArc;
  float rim=(1.-smoothstep(0.,.07,abs(r-R*(.95+.03*sin(a*7.+t*3.)))))*smoothstep(.35,.6,n+.15*sin(a*3.-t*2.));
  float fall=smoothstep(R,R*.15,r);
  float ridge=1.-smoothstep(0.,.045,abs(fxFbm(q*2.2+n*1.3+(el>2.5?vec2(t*1.7,-t*1.3):vec2(0.)))-.5));
  float sig;
  if(el>2.5)sig=ridge*step(.35,fxNoise(vec2(t*24.,fxSeed)))*1.3;          // arc: flickering crackle
  else if(el>1.5)sig=ridge*(.7+.3*sin(t*5.+n*6.))+smoothstep(.5,.8,n)*.25; // pyro: ember fissures + heat
  else if(el>.5)sig=ridge*.8+pow(abs(sin(a*29.+n*5.)),20.)*.6;            // cryo: rime veins + ferns
  else sig=ridge*.6;
  float pulse=.75+.25*sin(t*6.);
  float on=fxParam;
  float mark=rim*.8+sig*fall*.9;
  emit=fxColor*mark*(1.3+pulse*.7)*on*fxIntensity;
  alpha=(mark*.12+fall*.05)*on;
  base=fxColor*.15;
 }else if(m<7.5){
  // Radial deck fractures: sparse branching seams, never outside the native radius.
  float r=fxLocal.y, a=fxLocal.x*6.2831853;
  vec2 q=(fxWorld.xz-fxOrigin.xz);
  float warp=fxFbm(q*2.+fxSeed);
  float seam=1.-smoothstep(.012,.045,abs(sin(a*9.+warp*2.2+r*.7)));
  float branch=1.-smoothstep(.008,.025,abs(sin(a*17.-warp*3.+r*2.)));
  float front=fxRange*(1.-exp(-age*24.));
  float mask=(1.-smoothstep(front-.12,front,r))*smoothstep(.15,.5,r)*(1.-smoothstep(fxRange*.8,fxRange,r));
  float mark=max(seam,branch*.45)*mask;
  float fade=1.-smoothstep(.6,1.,k);
  alpha=mark*.62*fade;
  base=vec3(.008,.011,.014);
  emit=fxColor*mark*exp(-age*7.)*.55*fxIntensity;
 }else if(m<8.5||(m>10.5&&m<11.5)){
  // Opaque soot counter-layer and flowing fuel share the exact native disc.
  float r=fxLocal.y,R=fxRange;
  vec2 q=(fxWorld.xz-fxOrigin.xz)*2.2;
  float n=fxFbm(q+vec2(t*.65,-t*.9)+fxSeed);
  float fine=fxNoise(q*5.+vec2(-t*2.,t*3.));
  float cap=length(vec2(fxLocal.x*fxInner,max(max(-r,r-fxRange),0.)))/max(.001,fxInner);
  float edge=m>10.5?1.-smoothstep(.92,1.,cap):1.-smoothstep(R-.08,R,r);
  float rim=m>10.5?smoothstep(.7,.94,cap)*edge:smoothstep(R-.25,R-.08,r)*edge;
  float channels=smoothstep(m>10.5?.56:.72,m>10.5?.74:.86,n+fine*.12);
  float a=fxLocal.x*6.2831853;
  if(m<10.5)rim*=smoothstep(.35,.70,fxNoise(vec2(cos(a),sin(a))*max(9.,R*4.)+fxSeed));
  float boil=pow(max(0.,sin(fxLocal.x*160.+n*12.-t*11.)),8.)*rim;
  float hot=channels*(.55+.35*fine)+boil*.7;
  float fade=fxParam;
  // Pool (m 8): soft irregular soot underlay rather than an opaque disc; strips keep the dense film.
  float soot=m>10.5?.94:(.42+.3*fxFbm(q*.5+7.))*(1.-smoothstep(R*.55,R,r)*.35);
  float islands=smoothstep(.39,.66,n+.08*fine)*(.58+.42*smoothstep(R*.22,R*.68,r));
  float fireDetail=m>10.5?1.:max(rim,islands);
  if(m<10.5)channels=max(channels,islands*.8);
  alpha=edge*(soot*(m>10.5?1.:.27)+channels*.2*fireDetail+rim*.3)*fade;
  base=vec3(.004,.002,.001);
  // Pool edge stays orange-amber so it never reads as the hostile red warning.
  vec3 flame=m>10.5?mix(vec3(.72,.018,.0004),vec3(1.5,.12,.001),smoothstep(.3,.85,hot)):mix(vec3(1.1,.22,.02),vec3(1.9,.6,.06),smoothstep(.3,.85,hot));
  flame=mix(flame,vec3(2.6,1.5,.12),smoothstep(.94,1.15,hot));
  emit=flame*(channels*(m>10.5?.62:.45)+boil*(m>10.5?.8:1.05)+rim*.12)*edge*fade*fxIntensity*fireDetail;
 }else if(m<9.5){
  float s=fxLocal.x,r=fxLocal.y;
  float front=clamp(age/.09,0.,1.);
  float dust=fxFbm(vec2(s*5.,r*8.-t*2.)+fxSeed);
  float rim=(1.-smoothstep(.02,.08,abs(r-front*.95)))*(1.-smoothstep(.65,1.,abs(s)));
  float haze=smoothstep(.45,.7,dust)*(1.-smoothstep(.55,1.,r))*(1.-smoothstep(.6,1.,abs(s)));
  float fade=1.-smoothstep(.2,1.,k);
  alpha=(haze*.16+rim*.22)*fade; base=vec3(.12,.1,.07);
  emit=fxColor*rim*.9*fade*fxIntensity;
 }else if(m<10.5){
  float u=fxLocal.x,v=fxLocal.y;
  float twist=u*6.2831853+v*2.-t*3.;
  float ribs=pow(max(0.,cos(twist*7.+fxSeed)),18.);
  float fragments=smoothstep(.25,.6,fxNoise(vec2(floor(u*40.),v*14.-t*8.)));
  float taper=smoothstep(0.,.08,v)*(1.-smoothstep(.65,1.,v));
  float fade=1.-smoothstep(.15,1.,k);
  float mark=ribs*fragments*taper*fade;
  alpha=mark*.14;emit=(fxColor*.7+vec3(.9))*mark*fxIntensity;
  if(fxParam>.5){
   float plume=(1.-smoothstep(.045,.26,age))*(1.-smoothstep(.24+fragments*.30,.88,v));
   alpha=max(alpha,plume*.50);
   emit+=fxHeat(.88-.46*v)*plume*fxIntensity;
  }
 }else if(m>14.5){
  // Standing flame tongue: narrowing body, upward-scrolling erosion, lean and flicker, temperature by height.
  if(abs(fxSeg-floor(fxSeg+.5))>.01)discard;
  float sx=fxLocal.x,v=fxLocal.y,seg=floor(fxSeg+.5);
  float n=fxFbm(vec2(sx*1.6+seg*3.1,v*2.2-t*3.4-seg));
  float f=fxNoise(vec2(sx*4.+seg,v*5.-t*6.));
  float lean=(n-.5)*1.3*v+sin(t*5.+seg*2.)*.22*v;
  float width=pow(max(0.,1.-v),.5)*(.7+.3*sin(v*9.-t*8.+seg))*(.75+.5*n);
  float body=1.-smoothstep(width*.45,width,abs(sx-lean));
  // Forked, licking tip: a cavity opens down the centre of the upper half.
  float fork=smoothstep(.45,.85,v)*(1.-smoothstep(.0,.18+.1*f,abs(sx-lean-(f-.5)*.3)));
  float top=1.-smoothstep(.4+n*.35,.95,v);
  float d=max(0.,body*top-fork*.8)*smoothstep(0.,.18,v)+(f-.5)*.25*v;
  float dens=smoothstep(.2,.42,d);
  float heat=clamp(d*(.8-v*.6)+(1.-smoothstep(0.,.18,v))*.12,0.,1.);
  emit=fxHeat(heat)*dens*.5*fxIntensity;
  float rim=dens*(1.-smoothstep(.2,.5,d));
  alpha=dens*.1+rim*.28;base=vec3(.2,.035,.008);
 }else if(m>13.5){
  // VFX15 Overdrive climaxes: three distinct floor events on one disc (fxArc 1 cryo, 2 pyro, 3 arc).
  float r=fxLocal.y,R=fxRange,a=fxLocal.x*6.2831853,el=fxArc,on=fxParam;
  vec2 q=fxWorld.xz-fxOrigin.xz;
  float n=fxFbm(q*.7+fxSeed);
  // Exact native boundary: a thin element line, never a thick ring (arc has no native area).
  float line=(1.-smoothstep(.0,.035,abs(r-R+.03)))*step(el,2.5);
  if(el<1.5){
   // Whiteout: jagged frost wall racing out, ice plates behind it, pulses travel the crack network.
   float spread=R*(1.-pow(1.-clamp(age/.7,0.,1.),2.));
   float teeth=pow(abs(sin(a*23.+n*8.)),5.)*.38+pow(abs(sin(a*61.+n*13.)),9.)*.2;
   // Angular (seam-free) noise splits the front into uneven tongues racing at different speeds.
   float an=fxFbm(vec2(cos(a),sin(a))*2.6+fxSeed);
   float jag=spread*(.62+.5*an)+teeth*smoothstep(R*.3,R,spread)-.2;
   float inside=1.-smoothstep(jag-.04,jag,r);
   float wall=smoothstep(jag-.35-.4*(spread/R),jag-.04,r)*inside;
   vec3 c=fxCells(q*.9+n*.8);
   float crack=(1.-smoothstep(0.,.045,c.y-c.x))*smoothstep(.35,.6,fxFbm(q*.35+4.));
   float pulseR=mod(max(0.,age-.7),2.)*R*.8;
   float pulse=(1.-smoothstep(0.,1.1,abs(r-pulseR)))*step(.7,age)*crack;
   float fern=pow(abs(sin(a*47.+n*7.+r*4.)),22.)*wall;
   float crisp=.18+.82*exp(-max(0.,age-.5)*1.5);
   emit=vec3(.5,.82,1.15)*(wall*crisp*.9+fern*.8+crack*inside*.24)+vec3(1.,1.4,1.9)*pulse*.55;
   alpha=inside*(.01+c.z*.01+crack*.25+wall*(.1+.14*crisp)+fern*.18)+pulse*.2;
   base=vec3(.72,.88,.97);
  }else if(el<2.5){
   // Meltdown: molten cracks spread irregularly; crust blisters glow near the suit; deck chars dark.
   float spread=R*(1.-exp(-age*4.))*(.55+.5*fxFbm(vec2(a*1.6,age*.3)+fxSeed));
   float reveal=1.-smoothstep(spread-.5,spread,r);
   vec3 c=fxCells(q*1.25+vec2(fxFbm(q*1.1+3.)*1.3));
   float crack=1.-smoothstep(0.,.08+.07*n,c.y-c.x);
   float near=1.-smoothstep(.3,R*.7,r);
   float blister=(1.-smoothstep(.06,.24,c.x))*step(.6,c.z)*(.55+.45*sin(t*4.+c.z*31.));
   float flow=.75+.25*sin(t*3.+c.z*20.-r*2.);
   float heat=crack*reveal*(.5+.5*near)*flow;
   emit=fxHeat(.3+heat*.6)*heat*1.15+vec3(1.7,.4,.04)*blister*near*reveal*.9;
   alpha=reveal*(.025*(1.-crack)+crack*.76);
   // The activation flash fills the centre before the moving aura settles.
   float pulse=1.-smoothstep(.05,.18,age);
   float core=1.-smoothstep(R*(.32+.14*n)*pulse,R*(.61+.16*n)*pulse+.01,r);
   emit+=fxHeat(.52+.26*core)*core*pulse*(.23+.77*smoothstep(.27,.73,n));
   alpha+=core*pulse*.64;
   base=vec3(.025,.01,.006);
  }else{
   // Overclock: time fractures — straight glass cracks with a chromatic split; outward snap, then flicker.
   vec3 c=fxCells(q*.75+fxSeed),d=fxCells(q*.75+fxSeed+vec2(.07,.03));
   float e1=1.-smoothstep(0.,.028,c.y-c.x),e2=1.-smoothstep(0.,.028,d.y-d.x);
   float snapR=R*clamp(age/.16,0.,1.);
   float snap=(1.-smoothstep(snapR-1.2,snapR,r))*smoothstep(snapR-2.4,snapR-1.2,r)*(1.-smoothstep(.12,.5,age));
   float flick=step(.55,fxNoise(vec2(floor(t*12.)+c.z*9.,c.z*31.)));
   float fall=1.-smoothstep(R*.45,R,r);
   float live=fall*(.35+flick*.9)+snap*2.2;
   emit=vec3(1.,.35,1.5)*e1*live+vec3(.25,.95,1.5)*e2*live*.8;
   alpha=(e1+e2)*.12*(fall*flick+snap);
  }
  emit+=fxColor*line*1.1;alpha+=line*.32;
  emit*=on*fxIntensity;alpha*=on;
 }else{
  // Sparse tangential weather on an open native-radius dome; the centre stays clear.
  float u=fxLocal.x*6.2831853,v=fxLocal.y;
  float drift=u-t*.82;
  float lane=v+sin(drift*3.)*.12;
  float ribbon=1.-smoothstep(.018,.064,abs(sin(lane*13.+drift*2.)));
  float packet=pow(max(0.,sin(drift*5.+v*3.)),5.);
  float snow;
  if(fxLow>.5)snow=step(.97,fract(u*31.-t*8.+floor(v*9.)*.17))*step(.8,fract(v*13.+u*.8))*.6;
  else snow=pow(max(0.,sin(u*73.-t*21.+floor(v*13.)*2.4)),12.)
   *pow(max(0.,sin(v*49.+u*4.-t*7.)),5.);
  float vertical=smoothstep(.12,.3,v)*(1.-smoothstep(.88,1.,v));
  float clearing=smoothstep(min(.62,age*.48),min(.62,age*.48)+.17,v);
  float mark=(ribbon*packet*.7+snow*.8)*vertical*fxParam*clearing;
  alpha=min(.12,mark*.16);base=vec3(.025,.08,.13);
  emit=(fxColor*.22+vec3(.12))*mark*fxIntensity;
 }
 #ifdef HAS_ABILITY_PRIORITY_MASK
 // Ground sheets keep a flat, quiet tint underneath the warning.
 bool groundSheet=(m>.5&&m<1.5)||(m>3.5&&m<9.)||(m>10.5&&m<13.5)||(m>13.5&&m<14.5);
 if(groundSheet){
  float warning=prioritySample.g;
  float coverage=step(.004,alpha+dot(emit,vec3(.333)));
  alpha=mix(alpha,.18*coverage,warning);
  emit=mix(emit,vec3(0.),warning);
 }
 #endif
 vec2 screen=fxScreen.xy/max(.001,fxScreen.w)*.5+.5;
 float actionBar=(1.-smoothstep(.14,.23,screen.y))*(1.-smoothstep(.27,.36,abs(screen.x-.5)));
 float keep=1.-actionBar*.94;
 #ifdef HAS_ABILITY_PRIORITY_MASK
 float coreCover=max(prioritySample.b,prioritySample.a);
 if(groundSheet || m<.5 || m>14.5 || coldOwner>=0){
   // Keep the marine cap here. Actor coverage attenuates premultiplied output once, after shading.
   keep*=1.-.83*coreCover;
 }
 #endif
 // Shared budget: sustained surfaces thin out together when their summed area exceeds the cap.
 if(coldOwner>=0 && coldCount>1){
  int overlaps=0;
  vec4 own=coldAxes[coldOwner];
  vec2 ownRel=fxWorld.xz-own.xy;
  float ownAlong=clamp(dot(ownRel,own.zw)/max(.0001,dot(own.zw,own.zw)),0.,1.);
  float ownEdge=length(ownRel-ownAlong*own.zw)-coldRadii[coldOwner];
  for(int i=0;i<${COLD_FIELD_LIMIT};i++){
   if(i>=coldCount)break;
   if(i==coldOwner)continue;
   vec4 axis=coldAxes[i];vec2 rel=fxWorld.xz-axis.xy;
   float along=clamp(dot(rel,axis.zw)/max(.0001,dot(axis.zw,axis.zw)),0.,1.);
   float edge=length(rel-along*axis.zw)-coldRadii[i];
   // For coincident contours the earlier field draws the shared edge.
   bool sharedEdge=abs(edge-ownEdge)<.035 && abs(ownEdge)<.18;
   if(sharedEdge ? i<coldOwner : edge<-.035)overlaps++;
  }
  // Retain the exposed perimeter. Intersecting deposits share a faint interior.
  if(overlaps>0){
   // No inner shock rim where another field already owns the deck.
   if((m>3.5 && m<4.5) || abs(ownEdge)<.18)discard;
   keep*=overlaps>1?.06:.18;
   alpha=min(alpha,.18);
  }
 }
 keep*=fxYield;
 alpha=clamp(alpha*keep,0.,1.);emit*=keep;
 if(alpha<.002&&dot(emit,vec3(1.))<.004)discard;
 float fxA0=max(alpha,.005);
 gl_FragColor=vec4(base*alpha+emit,fxA0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 gl_FragColor.rgb*=gl_FragColor.a/fxA0;
}`;

const MODE_ORDER: Record<number, number> = { 0: 2, 1: -3, 2: 4, 3: 3, 4: 2, 5: -3, 6: -3, 7: -3, 8: -2, 14: -3, 15: 2 };

/** Fixed pool; spawn() recycles the oldest slot when full, never allocates. */
export class FlagshipFx {
  readonly root = new T.Group();
  readonly slots: FxSlot[] = [];
  low = false;
  flashIntensity = 1;
  private readonly geometry = new T.PlaneGeometry(1, 1, 40, 24);
  private readonly coldAxes = Array.from({ length: COLD_FIELD_LIMIT }, () => new T.Vector4());
  private readonly coldRadii = new Float32Array(COLD_FIELD_LIMIT);
  private readonly coldSlots: FxSlot[] = [];
  private cursor = 0;
  private time = 0;
  private readonly color = new T.Color();

  constructor(parent: T.Object3D, capacity = 32) {
    this.root.name = 'ability-flagship-fx';
    // PlaneGeometry spans [-.5,.5]; the shader reads only uv, but bounds must be finite.
    for (let i = 0; i < capacity; i++) {
      const material = new T.ShaderMaterial({
        uniforms: {
          coldAxes: { value: this.coldAxes }, coldRadii: { value: this.coldRadii }, coldCount: { value: 0 }, coldOwner: { value: -1 },
          fxMode: { value: 0 }, fxAge: { value: 0 }, fxLife: { value: 1 }, fxTime: { value: 0 }, fxSeed: { value: 0 },
          fxOrigin: { value: new T.Vector3() }, fxMuzzle: { value: new T.Vector3() }, fxAngle: { value: 0 }, fxArc: { value: 1 },
          fxRange: { value: 1 }, fxInner: { value: 0 }, fxHeight: { value: new T.Vector2() }, fxParam: { value: 0 },
          fxColor: { value: new T.Color() }, fxIntensity: { value: 1 }, fxLow: { value: 0 }, fxYield: { value: 1 },
        },
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        side: T.DoubleSide,
        forceSinglePass: true,
        blending: T.NormalBlending,
      });
      const mesh = new T.Mesh(this.geometry, material);
      mesh.name = `ability-flagship-${i}`;
      mesh.frustumCulled = false;
      mesh.matrixAutoUpdate = false;
      // Hidden meshes remain in the tree so MaterialWarmup compiles the shared program.
      mesh.visible = false;
      this.root.add(mesh);
      this.slots.push({
        live: false, mode: FxMode.Fire, age: 0, life: 1, x: 0, y: 0, z: 0, angle: 0, arc: 1, range: 1, inner: 0,
        h0: 0, h1: 0, mx: 0, my: 0, mz: 0, seed: i * 7.31, color: 0xffffff, intensity: 1, param: 0, mesh, material,
      });
    }
    parent.add(this.root);
  }

  spawn(mode: FxMode, x: number, z: number, life: number): FxSlot {
    let slot: FxSlot | undefined;
    for (const candidate of this.slots) if (!candidate.live) { slot = candidate; break; }
    if (!slot) slot = this.slots[this.cursor++ % this.slots.length];
    slot.live = true; slot.mode = mode; slot.age = 0; slot.life = Math.max(.05, life);
    slot.x = x; slot.y = 0; slot.z = z; slot.mx = x; slot.my = 0; slot.mz = z;
    slot.angle = 0; slot.arc = Math.PI * 2; slot.range = 1; slot.inner = 0; slot.h0 = slot.h1 = .03;
    slot.seed = (slot.seed * 1.618 + 3.7) % 97; slot.color = 0xffffff; slot.intensity = 1; slot.param = 0;
    return slot;
  }

  /** Called once per presentation frame; dt is the ability clock. */
  update(dt: number, time: number, reducedMotion: boolean): void {
    this.time = reducedMotion ? 0 : time;
    for (const slot of this.slots) {
      if (!slot.live) { slot.mesh.visible = false; continue; }
      slot.age += dt;
      if (slot.age >= slot.life) { slot.live = false; slot.mesh.visible = false; }
    }
  }

  /** Writes uniforms after owners spawned or moved slots this frame. */
  commit(): void {
    // Sustained (long-lived or settled) surfaces share one area budget; impact beats are exempt.
    let area = 0;
    for (const slot of this.slots) if (slot.live && this.sustained(slot)) area += this.area(slot);
    const fields = this.coldSlots;
    fields.length = 0;
    for (const slot of this.slots) {
      if (!slot.live || fields.length >= COLD_FIELD_LIMIT) continue;
      const strip = slot.mode === FxMode.FrostStrip;
      if (!strip && slot.mode !== FxMode.Frost && !(slot.mode === FxMode.Climax && slot.arc === 1)) continue;
      const i = fields.length;
      fields.push(slot);
      this.coldAxes[i].set(slot.x, slot.z, strip ? slot.range * Math.cos(slot.angle) : 0, strip ? slot.range * Math.sin(slot.angle) : 0);
      this.coldRadii[i] = strip ? slot.inner : slot.range;
    }
    const cap = this.low ? 70 : 110;
    const yieldScale = area > cap ? Math.max(.45, cap / area) : 1;
    for (const slot of this.slots) {
      if (slot.live) slot.material.uniforms.fxYield.value = this.sustained(slot) ? yieldScale : 1;
      if (!slot.live) { slot.mesh.visible = false; continue; }
      const u = slot.material.uniforms;
      let owner = fields.indexOf(slot);
      if (fields.length > 1 && (slot.mode === FxMode.Blizzard || slot.mode === FxMode.Shock && slot.color === ELEMENT_COLORS.cryo)) {
        for (let i = 0; i < fields.length; i++) {
          const f = fields[i];
          if (f.x === slot.x && f.z === slot.z && f.range === slot.range) { owner = i; break; }
        }
      }
      u.coldOwner.value = owner; u.coldCount.value = fields.length;
      u.fxMode.value = slot.mode; u.fxAge.value = slot.age; u.fxLife.value = slot.life; u.fxTime.value = this.time;
      u.fxSeed.value = slot.seed; (u.fxOrigin.value as T.Vector3).set(slot.x, slot.y, slot.z);
      (u.fxMuzzle.value as T.Vector3).set(slot.mx, slot.my, slot.mz);
      u.fxAngle.value = slot.angle; u.fxArc.value = slot.arc; u.fxRange.value = slot.range; u.fxInner.value = slot.inner;
      (u.fxHeight.value as T.Vector2).set(slot.h0, slot.h1); u.fxParam.value = slot.param;
      (u.fxColor.value as T.Color).copy(this.color.setHex(slot.color));
      u.fxIntensity.value = slot.intensity * (.4 + .6 * this.flashIntensity); u.fxLow.value = this.low ? 1 : 0;
      slot.mesh.renderOrder = MODE_ORDER[slot.mode] ?? 2;
      slot.mesh.visible = true;
    }
  }

  private sustained(slot: FxSlot): boolean {
    // Long-lived states keep their activation climax (first .9 s) at full strength.
    if (slot.life >= 1000) return slot.age > .9 || slot.mode === FxMode.Fuel || slot.mode === FxMode.FuelStrip || slot.mode === FxMode.FrostStrip || slot.mode === FxMode.Tongues || slot.mode === FxMode.Fire;
    return slot.age > .35 && slot.mode !== FxMode.Lance && slot.mode !== FxMode.Shock;
  }

  /** Projected ground coverage in m², scaled by intensity: discs, fans and strips. */
  private area(slot: FxSlot): number {
    const m = slot.mode, r = Math.max(0, slot.range);
    let a: number;
    if (m === FxMode.Lance || m === FxMode.Wake || m === FxMode.FuelStrip || m === FxMode.FrostStrip) a = 2 * slot.inner * r;
    else if (m === FxMode.Fire || m === FxMode.Scorch || m === FxMode.Pressure) a = .5 * slot.arc * r * r;
    else if (m === FxMode.Tongues || m === FxMode.Pillar) a = 3;
    else a = Math.PI * r * r * (m === FxMode.Climax ? .45 : m === FxMode.Blizzard ? .25 : 1);
    return a * Math.min(1.5, Math.max(.2, slot.intensity));
  }

  hideFloorResidues(): void {
    for (const slot of this.slots) {
      if (slot.mode === FxMode.Scorch || slot.mode === FxMode.Wake || slot.mode === FxMode.Crack) slot.mesh.visible = false;
    }
  }

  clear(): void { for (const slot of this.slots) { slot.live = false; slot.mesh.visible = false; } }

  dispose(): void {
    this.clear();
    for (const slot of this.slots) slot.material.dispose();
    this.geometry.dispose();
    this.root.removeFromParent();
  }
}
