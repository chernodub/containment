import * as T from 'three';
import {clipDeckRect,shipDeckPolygons} from '../world/ShipDeckGeometry';
import type {ExpeditionGeometry} from '../../game/world/expeditionGeometry';
import type {ConditionZone} from '../../game/roguelike/RoomConditionRuntime';

/** x is across the fitting; y follows its long axis. Both are in metres. */
export function conditionDeck(){
 return new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{
  size:{value:new T.Vector2()},lamp:{value:new T.Vector2()},kind:{value:0},charge:{value:0},clock:{value:0}
 },vertexShader:`
 varying vec2 coord,world;
 void main(){
   coord=uv*2.-1.;
   vec4 p=modelMatrix*vec4(position,1.);
   world=p.xz;
   gl_Position=projectionMatrix*viewMatrix*p;
 }`,fragmentShader:`
 uniform vec2 size,lamp;
 uniform float kind,charge,clock;
 varying vec2 coord,world;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 void main(){
 vec2 p=coord*size;
 float d=length(vec2(p.x,max(0.,abs(p.y)-(size.y-size.x))))-size.x;
 float aa=max(.002,fwidth(d)),mask=1.-smoothstep(-aa,aa,d);
 if(mask<=0.)discard;
 float grain=noise(world*3.7),cloud=noise(world*.85);
 vec3 c;float a;
 if(kind<.5){
   float rim=1.-smoothstep(.02,.08+.32*cloud,-d);
   vec2 cell=world*1.55,base=floor(cell),offset=fract(cell);
   float first=9.,second=9.;
   for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
    vec2 n=vec2(float(i),float(j)),key=base+n;
    vec2 v=n+.16+.68*vec2(hash(key),hash(key+18.7))-offset;
    float ds=dot(v,v);second=min(second,max(first,ds));first=min(first,ds);
   }
   float seam=(second-first)*1.6;
   float frost=(1.-smoothstep(.012,.05,seam))*(.25+.75*grain);
   float shine=exp(-abs(length((world-lamp)*vec2(.77,1.4))-1.65-cloud*.5)*3.);
   c=mix(vec3(.035,.105,.13),vec3(.40,.68,.74),clamp(rim*.70+frost*.29*cloud+shine*.58,0.,1.));
   a=.18+.26*cloud+.11*rim;
 }else if(kind<1.5){
   float rail=1.-smoothstep(.055,.13,abs(abs(coord.x)-.53));
   float clampBand=step(.85,fract(p.y*1.5));
   float wave=charge<1.?exp(-abs(coord.y-(charge*2.-1.))*7.)*charge:1.;
   float arc=(1.-smoothstep(.015,.085,abs(coord.x-.28*(noise(vec2(p.y*3.8,floor(clock*13.)))*2.-1.))))*step(1.,charge);
   c=mix(vec3(.048,.049,.061),vec3(.28,.26,.32),max(rail,clampBand*.5));
   c+=vec3(.59,.55,.72)*(rail*(.12+wave*.52)+arc);
   a=.80;
 }else{
   mask*=1.-smoothstep(.55,1.,length(coord)+cloud*.18);
   c=mix(vec3(.10,.056,.043),vec3(.35,.22,.125),grain*cloud);
   a=.64;
 }
 gl_FragColor=vec4(c,a*mask);
 #include <tonemapping_fragment>
 }`});
}

export function clippedConditions(geometry:ExpeditionGeometry,zones:readonly ConditionZone[],brood:boolean){
 const obstacles=geometry.blockers.map(b=>[{x:b.x,y:b.y},{x:b.x+b.width,y:b.y},{x:b.x+b.width,y:b.y+b.height},{x:b.x,y:b.y+b.height}]);
 const deck=shipDeckPolygons({...geometry.bounds,boundary:geometry.boundary,voids:[...geometry.voids??[],...obstacles]});
 return zones.map(zone=>{
  const end=zone.end??zone,r=zone.radius*(brood?2.8:1),dx=end.x-zone.x,dy=end.y-zone.y;
  const cx=zone.x+dx/2,cy=zone.y+dy/2,a=Math.atan2(dx,dy),halfLength=r+Math.hypot(dx,dy)/2;
  const positions:number[]=[],uv:number[]=[];
  for(const poly of deck){
   const clipped=clipDeckRect(poly,Math.min(zone.x,end.x)-r,Math.min(zone.y,end.y)-r,Math.max(zone.x,end.x)+r,Math.max(zone.y,end.y)+r);
   for(let j=1;j+1<clipped.length;j++){
    const tri=[clipped[0],clipped[j],clipped[j+1]];
    const [p,q,h]=tri;
    if((q.x-p.x)*(h.y-p.y)>(q.y-p.y)*(h.x-p.x))tri.reverse();
    for(const v of tri){
     const x=((v.x-cx)*Math.cos(a)-(v.y-cy)*Math.sin(a))/r;
     const z=((v.x-cx)*Math.sin(a)+(v.y-cy)*Math.cos(a))/halfLength;
     positions.push(x,0,z);uv.push(.5+x*.5,.5+z*.5);
    }
   }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  return g;
 });
}
