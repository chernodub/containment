import * as T from 'three';

/**
 * VFX13/VFX14 surfaces: one retained procedural program for the hero
 * ability moments (fire volume slices, cooling scorch, rail lance and wake,
 * shock rings, frost, Overdrive floor states). Every pooled mesh shares the
 * same geometry and shader source; modes are uniforms, so warm-up compiles a
 * single program and combat never creates one. Shapes are generated in the
 * vertex shader from the exact simulated cone/strip/radius numbers and never
 * exceed them (the muzzle pull-in only moves the narrow apex inward).
 */
export const FxMode = { Fire: 0, Scorch: 1, Lance: 2, Wake: 3, Shock: 4, Frost: 5, Aura: 6, Crack: 7, Fuel: 8, Pressure: 9, Pillar: 10, FuelStrip: 11, FrostStrip: 12, Blizzard: 13 } as const;
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
varying vec2 fxLocal;varying vec3 fxWorld;varying vec4 fxScreen;
void main(){
 vec2 g=uv;vec3 w;float m=fxMode;
 if(m>12.5){
  float a=g.x*6.2831853,polar=g.y*1.5707963;
  float radius=fxRange*sin(polar);
  w=vec3(fxOrigin.x+cos(a)*radius,fxHeight.x+cos(polar)*fxHeight.y,fxOrigin.z+sin(a)*radius);
  fxLocal=g;
 }else if(m>10.5){
  vec2 d=vec2(cos(fxAngle),sin(fxAngle)),n=vec2(-d.y,d.x);
  float s=g.x*2.-1.;vec2 xz=fxOrigin.xz+d*g.y*fxRange+n*s*fxInner;
  w=vec3(xz.x,fxHeight.x,xz.y);fxLocal=vec2(s,g.y);
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

const fragment = `
uniform float fxMode;uniform float fxAge;uniform float fxLife;uniform float fxTime;uniform float fxSeed;
uniform float fxRange;uniform float fxInner;uniform float fxArc;uniform vec3 fxColor;uniform float fxIntensity;
uniform float fxParam;uniform float fxLow;uniform vec3 fxOrigin;uniform float fxAngle;
varying vec2 fxLocal;varying vec3 fxWorld;varying vec4 fxScreen;
float fxHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float fxNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(fxHash(i),fxHash(i+vec2(1.,0.)),f.x),mix(fxHash(i+vec2(0.,1.)),fxHash(i+vec2(1.)),f.x),f.y);}
float fxFbm(vec2 p){float s=0.,a=.5;mat2 r=mat2(1.6,1.2,-1.2,1.6);
 for(int i=0;i<5;i++){if(fxLow>.5&&i>2)break;s+=a*fxNoise(p);p=r*p;a*=.5;}return fxLow>.5?s*1.14:s;}
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
  float front=1.-pow(1.-clamp(age/.12,0.,1.),3.);
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
  float cool=1.-smoothstep(.1,.45,age);
  dens=max(dens,spine*cool*.9);
  float heat=inside*(.98-r*.42)*(.45+.55*cool)+spine*.55*cool+core*(1.-smoothstep(.06,.24,age));
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
  if(fxParam<-.5){
   float tongue=(1.-smoothstep(.35+n*.4,.65+n*.35,abs(s)))*(1.-smoothstep(.55+n*.25,.9+n*.1,r));
   float hotCore=(1.-smoothstep(.08,.28,abs(s)))*(1.-smoothstep(.15,.55,r));
   alpha=tongue*.22;
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
  float lead=clamp(age/.05,0.,1.);
  float reach=smoothstep(lead+.002,lead-.02,v);
  float headGlow=exp(-abs(v-lead)*40.)*(1.-step(1.,lead));
  float life=1.-smoothstep(.03,.16,age);
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
   float bolt=1.-smoothstep(.025,.09,abs(s-jitter));
   float body=1.-smoothstep(.08,.3,abs(s-jitter));
   float halo=exp(-pow((s-jitter)*2.5,2.));
   float fork=1.-smoothstep(.015,.055,abs(s-jitter-sin(along*8.+fxSeed)*.35));
   float gate=(1.-smoothstep(.6,1.,k))*smoothstep(0.,.03,v)*(1.-smoothstep(.96,1.,v));
   emit=(vec3(2.4)*bolt+fxColor*(body*.8+fork*.6+halo*.25))*gate*fxIntensity;
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
   cover=(1.-smoothstep(.88,1.,abs(fxLocal.x)))*(1.-smoothstep(.98,1.,r));
   band=smoothstep(.66,.94,abs(fxLocal.x))*cover;
  }
  float fern=pow(abs(sin(a*31.+n*7.+r*4.)),24.)*band;
  float fade=1.-smoothstep(.5,1.,k);
  float crisp=exp(-age*2.5);
  vec3 ice=vec3(.5,.8,1.);
  emit=(ice*(veins*.32+fern*.5+band*.12)*(.35+1.3*crisp))*cover*fade*fxIntensity;
  alpha=cover*(.015+patchy*.03+veins*.22+band*.14+fern*.2)*fade;
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
  float edge=m>10.5?(1.-smoothstep(.92,1.,abs(fxLocal.x)))*(1.-smoothstep(.98,1.,r)):1.-smoothstep(R-.08,R,r);
  float rim=m>10.5?smoothstep(.7,.94,abs(fxLocal.x))*edge:smoothstep(R-.25,R-.08,r)*edge;
  float channels=smoothstep(.56,.74,n+fine*.12);
  float boil=pow(max(0.,sin(fxLocal.x*160.+n*12.-t*11.)),8.)*rim;
  float hot=channels*(.55+.35*fine)+boil*.7;
  float fade=fxParam;
  alpha=edge*(.94+channels*.04)*fade;
  base=vec3(.004,.002,.001);
  vec3 flame=mix(vec3(.72,.018,.0004),vec3(1.5,.12,.001),smoothstep(.3,.85,hot));
  flame=mix(flame,vec3(2.6,1.5,.12),smoothstep(.94,1.15,hot));
  emit=flame*(channels*.62+boil*.8+rim*.12)*edge*fade*fxIntensity;
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
  float mark=(ribbon*packet*.7+snow*.8)*vertical*fxParam;
  alpha=min(.12,mark*.16);base=vec3(.025,.08,.13);
  emit=(fxColor*.22+vec3(.12))*mark*fxIntensity;
 }
 vec2 screen=fxScreen.xy/max(.001,fxScreen.w)*.5+.5;
 float actionBar=(1.-smoothstep(.14,.23,screen.y))*(1.-smoothstep(.27,.36,abs(screen.x-.5)));
 float keep=1.-actionBar*.94;
 alpha=clamp(alpha*keep,0.,1.);emit*=keep;
 if(alpha<.002&&dot(emit,vec3(1.))<.004)discard;
 float fxA0=max(alpha,.005);
 gl_FragColor=vec4(base*alpha+emit,fxA0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 gl_FragColor.rgb*=gl_FragColor.a/fxA0;
}`;

const MODE_ORDER: Record<number, number> = { 0: 2, 1: -3, 2: 4, 3: 3, 4: 2, 5: -3, 6: -3, 7: -3, 8: -2 };

/** Fixed pool; spawn() recycles the oldest slot when full, never allocates. */
export class FlagshipFx {
  readonly root = new T.Group();
  readonly slots: FxSlot[] = [];
  low = false;
  flashIntensity = 1;
  private readonly geometry = new T.PlaneGeometry(1, 1, 40, 24);
  private cursor = 0;
  private time = 0;
  private readonly color = new T.Color();

  constructor(parent: T.Object3D, capacity = 24) {
    this.root.name = 'ability-flagship-fx';
    // PlaneGeometry spans [-.5,.5]; the shader reads only uv, but bounds must be finite.
    for (let i = 0; i < capacity; i++) {
      const material = new T.ShaderMaterial({
        uniforms: {
          fxMode: { value: 0 }, fxAge: { value: 0 }, fxLife: { value: 1 }, fxTime: { value: 0 }, fxSeed: { value: 0 },
          fxOrigin: { value: new T.Vector3() }, fxMuzzle: { value: new T.Vector3() }, fxAngle: { value: 0 }, fxArc: { value: 1 },
          fxRange: { value: 1 }, fxInner: { value: 0 }, fxHeight: { value: new T.Vector2() }, fxParam: { value: 0 },
          fxColor: { value: new T.Color() }, fxIntensity: { value: 1 }, fxLow: { value: 0 },
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
    for (const slot of this.slots) {
      if (!slot.live) { slot.mesh.visible = false; continue; }
      const u = slot.material.uniforms;
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

  clear(): void { for (const slot of this.slots) { slot.live = false; slot.mesh.visible = false; } }

  dispose(): void {
    this.clear();
    for (const slot of this.slots) slot.material.dispose();
    this.geometry.dispose();
    this.root.removeFromParent();
  }
}
