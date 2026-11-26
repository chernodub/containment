import * as T from 'three';
import type { Rect } from '../../game/roguelike/types';
import { ELEMENT_COLORS, UNIT } from './types';

/**
 * Pooled procedural ability surfaces. Most modes share the general program.
 * Fuel and Meltdown use fixed-mode programs prepared with the general pool,
 * and Fuel shares a simpler mesh with the same perimeter.
 * Shapes follow native footprints in the vertex shader. Meltdown reserves a
 * narrow cosmetic apron beyond its hard detonation front.
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
  // Meltdown alone reserves a narrow apron for cosmetic cracks beyond its front.
  float a=g.x*6.2831853;float r=g.y*fxRange*(fxArc==2.?1.18:1.);
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
const BURN_FIELD_LIMIT = 32; // Maximum retained FlagshipFx slots.
const fragment = `
uniform vec4 coldAxes[${COLD_FIELD_LIMIT}];
uniform float coldRadii[${COLD_FIELD_LIMIT}];
uniform vec3 burnDiscs[${BURN_FIELD_LIMIT}];
uniform int burnCount;uniform int burnOwner;
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
// Blackbody-like ramp: smoke, coal, amber, yellow, white (HDR for bloom).
vec3 fxHeat(float t){
 vec3 c=mix(vec3(.035,.022,.018),vec3(.5,.14,.008),smoothstep(.04,.24,t));
 c=mix(c,vec3(1.8,.57,.02),smoothstep(.2,.45,t));
 c=mix(c,vec3(3.,1.35,.12),smoothstep(.45,.72,t));
 return mix(c,vec3(5.,4.2,2.8),smoothstep(.8,1.,t));
}
// The deepest disc owns each point. Coincident boundaries have one stable owner.
float burnDistance(vec2 p){
 float nearest=1e6;int owner=-1;
 for(int i=0;i<${BURN_FIELD_LIMIT};i++){
  if(i>=burnCount)break;
  float distanceToDisc=length(p-burnDiscs[i].xy)-burnDiscs[i].z;
  if(distanceToDisc<nearest){nearest=distanceToDisc;owner=i;}
 }
 if(owner!=burnOwner)discard;
 return nearest;
}
// Nearby wall and machinery skirts contribute actual accumulation edges.
uniform vec4 deckBlockers[12];
uniform int deckBlockerCount;
float deckClearance(vec2 p){
 float nearest=20.;
 for(int i=0;i<12;i++){
  if(i>=deckBlockerCount)break;
  vec2 q=abs(p-deckBlockers[i].xy)-deckBlockers[i].zw;
  nearest=min(nearest,length(max(q,0.))+min(max(q.x,q.y),0.));
 }
 return nearest;
}
void frostBed(vec2 p,float r,float front,float age,bool storm,out vec3 base,out vec3 emit,out float alpha){
 float clear=deckClearance(p);
 float bank=1.-smoothstep(.04,1.05,abs(clear));
 vec2 wind=vec2(.19,-.08)*(storm?fxTime:0.);
 float grain=fxFbm(p*vec2(.72,1.25)+wind+fxSeed);
 vec3 cells=fxCells(p*(storm?.95:1.35)+.45*grain);
 float crust=smoothstep(.25,.68,grain+.22*(cells.z-.5)+bank*.23);
 float facet=smoothstep(.012,.13,cells.y-cells.x);
 float back=front-r-(1.-crust)*.56-bank*(.18+.5*grain);
 float bed=smoothstep(-.015,.17,back);
 float ridge=(1.-smoothstep(.06,.36+.35*bank,back))*bed*crust;
 float peak=1.-smoothstep(storm?.40:.12,storm?1.1:.54,age);
 alpha=bed*mix(.16,.42,peak)*(.82+.28*crust);
 base=mix(vec3(.010,.029,.045),vec3(.115,.228,.245),crust*facet);
 emit=vec3(.027,.063,.075)*crust*(1.-facet)*bed+vec3(.045,.112,.134)*ridge;
 if(storm){
  vec2 lee=vec2(.76,-.34);
  float shelter=smoothstep(.08,.68,clear-deckClearance(p-lee));
  float drift=fxFbm(vec2(p.x*.42+p.y*.28,p.y*1.24)+wind*.28);
  float deposit=smoothstep(.58,.72,drift+shelter*.30);
  alpha*=mix(.045,1.,deposit);
  emit*=deposit;
 }else{
  float band=(1.-smoothstep(.18,1.0,back))*bed;
  float glint=pow(max(0.,sin(p.x*3.7+p.y*6.8+fxTime*9.)),20.)*smoothstep(.55,.63,grain);
  alpha*=mix(.48,1.,band);
  emit=emit*.35+band*crust*(vec3(.09,.24,.31)+vec3(.36,.48,.55)*glint);
 }
}
void burnSurface(float distanceToEdge,vec2 p,out vec3 base,out vec3 emit,out float alpha){
 // All pools sample the same deck coordinates, including at ownership seams.
 float ripple=fxNoise(p*2.3);
 float broad=fxNoise(p*.84);
 float grain=fxNoise(p*7.8);
 float d=distanceToEdge+.32+.64*(broad-.5)+.14*(ripple-.5)+.105*(grain-.5);
 // Hot fissures open through the black crust in short, uneven stretches.
 float pockets=smoothstep(.32,.66,fxNoise(p*3.9+5.3)+.34*(grain-.5));
 float hot=smoothstep(.28,.72,broad+.24*(ripple-.5));
 float lip=(1.-smoothstep(.006,.025+.075*grain,abs(d)))*pockets*hot;
 float cinders=(1.-smoothstep(.03,.17,abs(d+.12*grain)))*smoothstep(.60,.83,grain)*hot;
 float coal=1.-smoothstep(-.12,.02,d);
 // Isolated sections of an undulating coal seam, with broad stretches of dark char.
 float vein=abs(fxNoise(p*.78+13.7)+.14*ripple-.53);
 float fissure=(1.-smoothstep(.008,.032,vein))*smoothstep(.28,.64,fxNoise(p*.57-8.2))
              *smoothstep(.25,.65,-d);
 base=vec3(.018,.013,.009);
 alpha=(.22+.48*broad)*coal+.24*lip+.17*cinders+.14*fissure;
 emit=mix(vec3(.48,.105,.003),vec3(1.7,.56,.028),grain)*lip+vec3(1.55,.67,.07)*cinders+vec3(1.35,.39,.018)*fissure;

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
  emit=(vec3(3.2,1.2,.08)*speck*heat+vec3(.9,.3,.02)*under*heat*.6+vec3(1.4,.35,.05)*hot*under*.5)*soot*on*fxIntensity;
  alpha=soot*.62*on*(1.-smoothstep(.55,1.,k));
  base=vec3(.014,.012,.011);
  emit*=1.-smoothstep(.55,1.,k);
 }else if(m<2.5){
  // Rail lance: white-hot spine with a brief leading flash.
  float s=abs(fxLocal.x),v=fxLocal.y;
  float lead=clamp(age/.018,0.,1.);
  float reach=smoothstep(lead+.002,lead-.02,v);
  float headGlow=exp(-abs(v-lead)*40.)*(1.-step(1.,lead));
  float life=1.-smoothstep(.045,.16,age);
  float coreW=.18+.15*life;
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
   float jitter=(fxNoise(vec2(along*3.,floor(t*18.)+fxSeed))-.5)*.48;
   float bolt=1.-smoothstep(.23,.38,abs(s-jitter));
   float body=1.-smoothstep(.16,.54,abs(s-jitter));
   float delta=s-jitter;
   float halo=exp(-delta*delta*6.25);
   float fork=1.-smoothstep(.015,.055,abs(s-jitter-sin(along*8.+fxSeed)*.35));
   if(fxParam>3.5){
    float split=sin(clamp((v-.30)/.65,0.,1.)*3.14159)*.68;
    fork=(1.-smoothstep(.08,.15,abs(s-jitter-split)))*smoothstep(.29,.34,v);
   }
   float gate=(1.-smoothstep(fxParam>3.5?.23:.6,1.,k))*smoothstep(0.,.03,v)*(1.-smoothstep(.96,1.,v));
   emit=(mix(fxColor*.48,vec3(2.4,1.98,2.72),smoothstep(.65,1.4,along))*bolt+fxColor*(body*.8+halo*.25)+(fxParam>3.5?vec3(1.5,.95,2.):fxColor*.6)*fork)*gate*fxIntensity;
   alpha=(bolt*.82+fork*.25+halo*.07)*gate;
  }else{
   float core=(1.-smoothstep(.07,.19,abs(s)))*(1.-smoothstep(.045,.21,age));
   emit=(hot*i0+vec3(3.,2.85,2.6)*core)*fxIntensity;
   alpha=i0*.12+core*.62;
  }
 }else if(m<4.5 && fxParam>.5){
  float r=fxLocal.y,front=fxRange*smoothstep(0.,.055,age);
  if(fxParam<1.5){
   frostBed(fxWorld.xz,r,front,age,false,base,emit,alpha);
  }else{
   vec2 p=fxWorld.xz-fxOrigin.xz;
   float grit=fxFbm(p*1.3+fxSeed);
   vec3 tile=fxCells(vec2(p.x*.45+p.y*.28,p.y*.87)+vec2(grit,fxNoise(p*.63))*.89);
   float face=smoothstep(.012,.11,tile.y-tile.x);
   float bank=1.-smoothstep(0.,.65,abs(deckClearance(fxWorld.xz)));
   float back=front-r-(1.-tile.z)*(.42+.72*bank);
   float material=smoothstep(-.015,.13,back);
   float dust=smoothstep(.33,.70,grit+tile.x*.12);
   base=mix(vec3(.006,.010,.015),vec3(.041,.054,.060),face*tile.z);
   base+=vec3(.013)*dust;
   emit=vec3(.17,.085,.023)*(1.-face)*smoothstep(.29,.65,grit)*material;
   alpha=material*(.08+.31*smoothstep(.28,.84,r/max(.001,front))*smoothstep(.27,.7,grit));
  }
  float core=(1.-smoothstep(.12,.75,r))*(1.-smoothstep(.033,.051,age));
  float settle=fxParam<1.5?1.-smoothstep(.17,.46,age)
    :(1.-.59*smoothstep(.16,.49,age))*(1.-smoothstep(.60,2.2,age));
  alpha*=settle;emit=(emit*settle+vec3(core))*fxIntensity;
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
 }else if(m<8.5){
  float edge=burnDistance(fxWorld.xz);
  vec2 local=(fxWorld.xz-fxOrigin.xz)/fxRange;
  float radius=length(local), bend=.50*radius+.16*sin(8.*radius);
  float angle=atan(local.y,local.x);
  bool napalm=fxArc>6.;
  // Sections of the native lip remain exposed between scallops of burnt fuel.
  if(napalm)edge+=fxRange*.14*smoothstep(.0,.85,sin(angle*5.+.65)+.45*sin(angle*13.));
  burnSurface(edge,fxWorld.xz,base,emit,alpha);
  float heading=angle-fxAngle-bend;
  float river=1.-smoothstep(.004,.047,min(1.-cos(heading-.95),1.-cos(heading+1.85)));
  float grain=fxNoise(fxWorld.xz*3.);
  if(napalm)emit+=vec3(.58,.15,.008)*river*(.12+.65*grain)*smoothstep(.05,.21,radius)*(1.-smoothstep(.72,.92,radius));
  alpha*=fxParam;emit*=fxParam*fxIntensity;
 }else if(m>10.5&&m<11.5){
  // A continuous coal bed and one broad hot lip leave the deck readable.
  float r=fxLocal.y,R=fxRange;
  float strip=length(vec2(fxLocal.x*fxInner,max(max(-r,r-R),0.)))/max(.001,fxInner);
  float radial=strip;
  vec2 q=(fxWorld.xz-fxOrigin.xz)*.65;
  float curl=fxNoise(q+fxSeed);
  float edge=1.-smoothstep(.91,.995,radial);
  float lip=1.-smoothstep(.018,.082,abs(radial-(.86+.06*curl)));
  float heat=lip*(.48+.40*curl);
  base=vec3(.016,.013,.009);
  alpha=(.39*edge+.27*lip)*fxParam;
  emit=vec3(1.54,.63,.058)*heat*fxParam*fxIntensity;
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
  float n=fxNoise(q*.7+fxSeed);
  // Exact native boundary: a thin element line, never a thick ring (arc has no native area).
  float line=(1.-smoothstep(.0,.035,abs(r-R+.03)))*step(el,2.5);
  if(el<1.5){
   float front=R*(1.-pow(1.-clamp(age/.15,0.,1.),2.));
   frostBed(fxWorld.xz,r,front,age,true,base,emit,alpha);
   emit+=vec3(1.-smoothstep(.12,.75,r))*(1.-smoothstep(.033,.051,age));
   line=0.;
  }else if(el<2.5){
   vec3 cell=fxCells(q*1.25+.32*n);
   float fissure=1.-smoothstep(.018,.095,cell.y-cell.x);
   #ifdef HAS_ABILITY_PRIORITY_MASK
   float warningDistance=texture2D(abilityPriorityMap,priorityClip.xy/priorityClip.w*.5+.5).g;
   fissure*=mix(.5,1.,smoothstep(.08,.29,abs(warningDistance-.5)));
   #endif
   float heat=.5+.5*sin(t*3.-r*1.4+cell.z*4.);
   float peak=1.-smoothstep(.16,.25,age);
   float normalized=r/R;
   float bank=1.-smoothstep(0.,.75,abs(deckClearance(fxWorld.xz)));
   float bed=.74+.13*sin(a*3.+.8)+.08*sin(a*8.+n)-bank*.065;
   float crust=1.-smoothstep(bed-.09,bed+.02,normalized);
   float radial=abs(sin(a*5.+.60*n+.26*sin(r*2.)));
   float finger=(1.-smoothstep(.018,.10,radial))*(1.-smoothstep(.91+n*.10,1.14,normalized));
   float cracks=fissure*crust+finger*smoothstep(.42,.83,normalized);
   float rays=pow(abs(cos(a*5.+.28*n)),12.);
   float star=(1.-smoothstep(.07+.19*rays,.14+.27*rays,normalized))*peak;
   float core=(1.-smoothstep(.14,.55,r))*peak;
   float lava=fxFbm(q*1.35+vec2(t*.16,-t*.10));
   float skin=smoothstep(.30,.68,lava+cell.z*.16);
   float ember=(1.-smoothstep(.015,.12,abs(normalized-bed)*R))*smoothstep(.30,.65,lava);
   base=mix(vec3(.25,.081,.012),vec3(.033,.017,.012),skin);
   emit=vec3(.42,.093,.006)*crust*(1.-skin)+vec3(.67,.21,.018)*(cracks*.75+ember*.48);
   emit+=vec3(1.1,.56,.12)*star*.45+vec3(1.-smoothstep(.033,.051,age))*core;
   alpha=mix(.24,.42,1.-smoothstep(.10,.65,age))*crust+.20*cracks+.12*ember;
   line=0.;
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
 // These depth-tested deck decals are sorted below the hostile warnings.
 // The exact actor depth silhouettes supply coverage, including at the feet.
 if(m>13.5 && m<14.5 && fxArc<1.5){
  float margin=1.-smoothstep(.02,.9,max(prioritySample.r,prioritySample.b));
  alpha*=margin;emit*=margin;
 }
 if((m>3.5 && m<4.5 && fxParam>.5)||(m>13.5 && m<14.5 && fxArc<2.5))prioritySample=vec4(0.);
 bool groundSheet=(m>.5&&m<1.5)||(m>3.5&&m<9.)||(m>10.5&&m<13.5)||(m>13.5&&m<14.5);
 if(groundSheet){
  float warning=prioritySample.g;
  float coverage=step(.004,alpha+dot(emit,vec3(.333)));
  alpha=mix(alpha,(m>13.5 && fxArc<1.5 ? 0. : .18)*coverage,warning);
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

const MODE_ORDER: Record<number, number> = { 0: 2, 1: -3, 2: 4, 3: 3, 4: 2, 5: -3, 6: -3, 7: -3, 8: 1, 14: 1, 15: 2 };

/** Fixed pool; spawn() recycles the oldest slot when full, never allocates. */
export class FlagshipFx {
  readonly root = new T.Group();
  readonly slots: FxSlot[] = [];
  low = false;
  flashIntensity = 1;
  private readonly geometry = new T.PlaneGeometry(1, 1, 40, 24);
  // Fuel shades from world position. Its straight radial edges only need the
  // original outer ring, with the same forty perimeter segments.
  private readonly fuelGeometry = new T.PlaneGeometry(1, 1, 40, 1);
  private readonly coldAxes = Array.from({ length: COLD_FIELD_LIMIT }, () => new T.Vector4());
  private readonly coldRadii = new Float32Array(COLD_FIELD_LIMIT);
  private readonly burnDiscs = Array.from({length: BURN_FIELD_LIMIT}, () => new T.Vector3());
  private readonly burnSlots: FxSlot[] = [];
  private readonly pyroMaterials: Array<{ fuel: T.ShaderMaterial; meltdown: T.ShaderMaterial }> = [];
  private readonly coldSlots: FxSlot[] = [];
  private cursor = 0;
  private time = 0;
  private readonly color = new T.Color();

  blockers: readonly Rect[] = [];
  constructor(parent: T.Object3D, capacity = 32) {
    this.root.name = 'ability-flagship-fx';
    const fuelMaterials: T.ShaderMaterial[] = [], meltdownMaterials: T.ShaderMaterial[] = [];
    // PlaneGeometry spans [-.5,.5]; the shader reads only uv, but bounds must be finite.
    for (let i = 0; i < capacity; i++) {
      const material = new T.ShaderMaterial({
        uniforms: {
          deckBlockers: { value: Array.from({length:12},()=>new T.Vector4()) }, deckBlockerCount: {value:0},
          burnDiscs: { value: this.burnDiscs }, burnCount: { value: 0 }, burnOwner: { value: -1 },
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
      // The compiler can prune the rest of the large procedural shader from
      // these sustained Pyro fields. The slot still owns the same uniform state.
      const fuel = this.fieldMaterial(material, FxMode.Fuel);
      const meltdown = this.fieldMaterial(material, FxMode.Climax);
      this.pyroMaterials.push({ fuel, meltdown });
      fuelMaterials.push(fuel); meltdownMaterials.push(meltdown);
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
    const fuelPreparation = new T.Mesh(this.fuelGeometry, fuelMaterials);
    const meltdownPreparation = new T.Mesh(this.geometry, meltdownMaterials);
    fuelPreparation.name = 'ability-fuel-materials';
    meltdownPreparation.name = 'ability-meltdown-materials';
    fuelPreparation.visible = meltdownPreparation.visible = false;
    this.root.add(fuelPreparation, meltdownPreparation);
    parent.add(this.root);
  }

  private fieldMaterial(base: T.ShaderMaterial, mode: typeof FxMode.Fuel | typeof FxMode.Climax): T.ShaderMaterial {
    const material = base.clone();
    material.uniforms = { ...base.uniforms };
    const fixedMode = `const float m=${mode}.;`;
    material.vertexShader = vertex.replace('float m=fxMode;', fixedMode);
    material.fragmentShader = fragment.replace('float m=fxMode;', fixedMode);
    if (mode === FxMode.Climax) material.fragmentShader = material.fragmentShader.replace('el=fxArc', 'el=2.');
    return material;
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
    this.burnSlots.length = 0;
    for (const slot of this.slots) {
      if (!slot.live) continue;
      if (slot.mode === FxMode.Fuel) {
        this.burnDiscs[this.burnSlots.length].set(slot.x, slot.z, slot.range);
        this.burnSlots.push(slot);
      }
      if (fields.length >= COLD_FIELD_LIMIT) continue;
      const strip = slot.mode === FxMode.FrostStrip;
      if (!strip && slot.mode !== FxMode.Frost && !(slot.mode === FxMode.Climax && slot.arc === 1)) continue;
      const i = fields.length;
      fields.push(slot);
      this.coldAxes[i].set(slot.x, slot.z, strip ? slot.range * Math.cos(slot.angle) : 0, strip ? slot.range * Math.sin(slot.angle) : 0);
      this.coldRadii[i] = strip ? slot.inner : slot.range;
    }
    const cap = this.low ? 70 : 110;
    const yieldScale = area > cap ? Math.max(.45, cap / area) : 1;
    for (let index = 0; index < this.slots.length; index++) {
      const slot = this.slots[index];
      if (slot.live) slot.material.uniforms.fxYield.value = this.sustained(slot) ? yieldScale : 1;
      if (!slot.live) { slot.mesh.visible = false; continue; }
      const u = slot.material.uniforms as Record<string, T.IUniform & { needsUpdate?: boolean }>;
      let owner = fields.indexOf(slot);
      if (fields.length > 1 && (slot.mode === FxMode.Blizzard || slot.mode === FxMode.Shock && slot.color === ELEMENT_COLORS.cryo)) {
        for (let i = 0; i < fields.length; i++) {
          const f = fields[i];
          if (f.x === slot.x && f.z === slot.z && f.range === slot.range) { owner = i; break; }
        }
      }
      const usesDeckBlockers = (slot.mode === FxMode.Shock && slot.param > .5) ||
        (slot.mode === FxMode.Climax && slot.arc < 2.5);
      if (usesDeckBlockers) {
        const boxes: T.Vector4[] = u.deckBlockers.value;
        let count = 0;
        for (const rect of this.blockers) {
          const hw = rect.width / (2*UNIT), hd = rect.height / (2*UNIT);
          const cx = rect.x / UNIT + hw, cz = rect.y / UNIT + hd;
          if (Math.abs(cx-slot.x)>hw+slot.range+1 || Math.abs(cz-slot.z)>hd+slot.range+1) continue;
          boxes[count++].set(cx,cz,hw,hd);
          if (count===boxes.length) break;
        }
        u.deckBlockerCount.value=count;
      }
      // Three uploads arrays at material switches. Leave unused bindings alone.
      const fuel = slot.mode === FxMode.Fuel;
      u.deckBlockers.needsUpdate = usesDeckBlockers && u.deckBlockerCount.value > 0;
      u.burnDiscs.needsUpdate = fuel;
      u.coldAxes.needsUpdate = u.coldRadii.needsUpdate = owner >= 0 && fields.length > 1;
      u.burnOwner.value = fuel ? this.burnSlots.indexOf(slot) : -1;
      u.burnCount.value = fuel ? this.burnSlots.length : 0;
      u.coldOwner.value = owner; u.coldCount.value = fields.length;
      u.fxMode.value = slot.mode; u.fxAge.value = slot.age; u.fxLife.value = slot.life; u.fxTime.value = this.time;
      u.fxSeed.value = slot.seed; (u.fxOrigin.value as T.Vector3).set(slot.x, slot.y, slot.z);
      (u.fxMuzzle.value as T.Vector3).set(slot.mx, slot.my, slot.mz);
      u.fxAngle.value = slot.angle; u.fxArc.value = slot.arc; u.fxRange.value = slot.range; u.fxInner.value = slot.inner;
      (u.fxHeight.value as T.Vector2).set(slot.h0, slot.h1); u.fxParam.value = slot.param;
      (u.fxColor.value as T.Color).copy(this.color.setHex(slot.color));
      u.fxIntensity.value = slot.intensity * (.4 + .6 * this.flashIntensity); u.fxLow.value = this.low ? 1 : 0;
      slot.mesh.renderOrder = MODE_ORDER[slot.mode] ?? 2;
      const { fuel: fuelMaterial, meltdown: meltdownMaterial } = this.pyroMaterials[index];
      slot.mesh.geometry = fuel ? this.fuelGeometry : this.geometry;
      slot.mesh.material = fuel ? fuelMaterial :
        slot.mode === FxMode.Climax && slot.arc === 2 ? meltdownMaterial : slot.material;
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
    for (const { fuel, meltdown } of this.pyroMaterials) { fuel.dispose(); meltdown.dispose(); }
    this.fuelGeometry.dispose();
    this.geometry.dispose();
    this.root.removeFromParent();
  }
}
