import * as T from 'three';

export type EquipmentDetailWriter = {
  box: (material:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,angle?:number)=>void;
  pipe: (material:T.Material,a:T.Vector3,b:T.Vector3,radius:number)=>void;
  housing?: (material:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,angle:number)=>void;
};
export type EquipmentFinishes = {steel:T.Material;dark:T.Material;paint:T.Material;signal:T.Material};

/** Recessed rack face and connected jacketed tails, using the host's existing finishes. */
export function cabinetFace(writer:EquipmentDetailWriter,m:EquipmentFinishes,x:number,y:number,z:number,width:number,height:number):void {
  const {box,pipe}=writer;
  box(m.dark,x,y,z,width,height,.026);
  for(const side of [-1,1]){
    box(m.steel,x+side*width*.48,y,z+.025,width*.035,height,.045);
    box(m.steel,x,y+side*height*.48,z+.025,width,.035,.045);
  }
  for(let row=0;row<5;row++){
    const ry=y+(row-2)*height*.18;
    box(m.steel,x,ry,z+.025,width*.86,height*.13,.045);
    box(m.dark,x-width*.12,ry,z+.051,width*.55,height*.095,.012);
    for(let slot=0;slot<5;slot++)box(m.paint,x-width*.33+slot*width*.095,ry,z+.06,width*.027,height*.058,.009);
    box(m.signal,x+width*.29,ry+.025,z+.055,width*.03,height*.018,.016);
    box(m.paint,x+width*.37,ry,z+.06,width*.055,height*.07,.021);
  }
  for(const side of [-1,1])for(let cable=0;cable<2;cable++){
    const px=x+side*(width*.39-cable*.055);
    pipe(m.dark,new T.Vector3(px,y+height*.43,z+.065),new T.Vector3(px,y-height*.40,z+.065),.018);
    pipe(m.dark,new T.Vector3(px,y-height*.40,z+.065),new T.Vector3(px-side*.08,y-height*.48,z-.08),.018);
  }
}

/** A pressure barrel gains bolted end plates, machined bands and a plumbed instrument union. */
export function pressureCylinderDetail(writer:EquipmentDetailWriter,m:EquipmentFinishes,x:number,y:number,z:number,radius:number,length:number):void {
  const {box,pipe}=writer,p=(dx:number,dy:number,dz:number)=>new T.Vector3(x+dx,y+dy,z+dz);
  for(const band of [-.34,.34])pipe(m.steel,p(0,0,length*band-.025),p(0,0,length*band+.025),radius*1.07);
  for(const side of [-1,1]){
    const end=side*(length*.5+.014);
    pipe(m.steel,p(0,0,end-.018),p(0,0,end+.018),radius*.96);
    pipe(m.dark,p(0,0,end+side*.019),p(0,0,end+side*.027),radius*.73);
    for(let bolt=0;bolt<6;bolt++){
      const angle=bolt*Math.PI/3,dx=Math.cos(angle)*radius*.81,dy=Math.sin(angle)*radius*.81;
      box(m.paint,x+dx,y+dy,z+end+side*.031,.045,.045,.028);
    }
  }
  for(const dx of [-radius*.38,radius*.38])box(m.dark,x+dx,y+radius*.94,z,.024,.022,length*.62);
  pipe(m.steel,p(radius*.45,radius*.65,0),p(radius*.45,radius*1.32,0),.04);
  pipe(m.paint,p(radius*.45,radius*1.29,0),p(radius*.45,radius*1.36,0),.12);
  pipe(m.dark,p(radius*.45,radius*1.36,0),p(radius*.45,radius*1.39,0),.095);
  box(m.signal,x+radius*.45,y+radius*1.41,z,.024,.007,.10);
}

/** A single supported service cartridge, emitted into the caller's material batches. */
export function serviceCartridge(writer:EquipmentDetailWriter,materials:EquipmentFinishes,x:number,y:number,z:number,span:number,angle:number,variant:number):void {
  const {box,pipe}=writer,{steel,dark,paint,signal}=materials;
  const c=Math.cos(angle),s=Math.sin(angle);
  const at=(dx:number,h:number,dz:number)=>new T.Vector3(x+c*dx+s*dz,y+h,z-s*dx+c*dz);
  const part=(m:T.Material,dx:number,h:number,dz:number,w:number,height:number,d:number)=>{const p=at(dx,h,dz);box(m,p.x,p.y,p.z,w,height,d,angle);};
  // A recessed face sits below rolled perimeter edges; surfaces never become another cuboid lid.
  if(writer.housing)writer.housing(dark,x,y+.026,z,span*1.8,.052,span*1.4,angle);
  else part(dark,0,.026,0,span*1.8,.052,span*1.4);
  part(paint,0,.065,-span*.26,span*1.53,.026,span*.62);
  for(const side of [-1,1]){
    part(steel,side*span*.83,.066,0,span*.09,.08,span*1.43);
    part(steel,0,.066,side*span*.65,span*1.64,.08,span*.08);
    part(dark,side*span*.62,.087,-span*.3,span*.15,.018,span*.24);
    part(steel,side*span*.69,.108,side*span*.5,span*.065,.014,span*.065);
  }
  // Deep grille slots, broad enough to survive mip reduction at a gameplay camera distance.
  for(let vent=0;vent<6;vent++)part(dark,(vent-2.5)*span*.2,.081,-span*.26,span*.085,.011,span*.46);
  part(dark,-span*.28,.06,span*.36,span*.66,.035,span*.27);
  for(let led=0;led<3;led++)part(led===(variant%3)?signal:steel,(-.49+led*.2)*span,.082,span*.37,span*.07,.012,span*.09);
  part(steel,span*.38,.083,span*.24,span*.4,.025,span*.17);
  for(let cable=0;cable<2;cable++){
    const a=at(span*(.24+cable*.13),.094,span*.31),b=at(span*(.28+cable*.13),.14,span*.5);
    pipe(dark,a,b,span*.035);pipe(dark,b,at(span*(.54+cable*.11),.093,span*.52),span*.035);
  }
}

/** Eight-corner milled shell: real chamfer faces, just 28 triangles. */
export function serviceHousingGeometry(width:number,height:number,depth:number):T.BufferGeometry {
  const x=width*.5,z=depth*.5,c=Math.min(width,depth)*.12;
  const shape=new T.Shape([[-x+c,-z],[x-c,-z],[x,-z+c],[x,z-c],[x-c,z],[-x+c,z],[-x,z-c],[-x,-z+c]].map(([a,b])=>new T.Vector2(a,b)));
  const geometry=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1,curveSegments:1});
  geometry.rotateX(-Math.PI/2);geometry.translate(0,-height*.5,0);return geometry;
}

const passengerOvals=[[-.027,.226,.087,.071,-.26],[0,.306,.039,.052,0],[.008,.435,.132,.132,.06],[.02,.567,.096,.12,.08],[.016,.648,.103,.064,0],[-.025,.881,.045,.025,-.15],[.128,.875,.045,.025,.15]].map(([cx,cy,rx,ry,angle])=>({cx,cy,rx,ry,c:Math.cos(angle),s:Math.sin(angle),scale:Math.min(rx,ry)}));
const passengerLimbs:readonly (readonly number[])[]=[[-.11,.35,-.184,.498,.032],[-.184,.498,-.053,.548,.029],[.12,.353,.157,.526,.031],[.157,.526,.091,.632,.027],[-.045,.655,-.085,.779,.039],[-.085,.779,-.045,.859,.035],[.061,.655,.13,.757,.039],[.13,.757,.11,.852,.035]];

function passengerDistance(u:number,v:number):number {
  const x=u-.5;let distance=1;
  for(const {cx,cy,rx,ry,c,s,scale}of passengerOvals){
    const dx=x-cx,dy=v-cy,px=dx*c-dy*s,py=dx*s+dy*c;
    distance=Math.min(distance,(Math.hypot(px/rx,py/ry)-1)*scale);
  }
  for(const [ax,ay,bx,by,radius]of passengerLimbs){
    const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(v-ay)*dy)/(dx*dx+dy*dy)));
    distance=Math.min(distance,Math.hypot(x-ax-dx*t,v-ay-dy*t)-radius);
  }
  return distance;
}

/** A tilted head, arm resting across the abdomen and one bent knee give the sleeper a natural pose. */
export function sleepingPassenger(u:number,v:number):boolean {return passengerDistance(u,v)<0;}

/** Frosted observation glazing with an original, restrained sleeping human silhouette. */
export function passengerObservationTexture():T.DataTexture {
  const width=128,height=256,pixels=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=(x+.5)/width,v=(y+.5)/height,dx=u-.5;
    const distance=passengerDistance(u,v),person=T.MathUtils.clamp(.5-distance/.024,0,1);
    const edge=Math.pow(Math.max(Math.abs(dx)*2,Math.abs(v-.5)*2),6);
    const grain=((Math.imul(x+17,374761393)^Math.imul(y+31,668265263))>>>5)%23/23;
    const frost=edge*(.35+grain*.65),streak=Math.sin(x*.59+y*.032)> .97?.08:0;
    const volume=Math.exp(-(((u-.478)/.12)**2)-((v-.43)/.27)**2),head=Math.exp(-(((u-.458)/.055)**2)-((v-.213)/.055)**2);
    const pillow=Math.exp(-(((u-.5)/.28)**4)-((v-.235)/.102)**4)*8;
    const reflection=Math.exp(-(((u-.29-v*.045)/.065)**2))*6;
    const i=(y*width+x)*4,bodyLight=volume*12+head*12;
    // Rounded, softly diffused tissue sits beneath condensation and glass glare.
    pixels[i]=Math.round(T.MathUtils.lerp(65+pillow,29+bodyLight,person)+frost*30+streak*100+reflection);
    pixels[i+1]=Math.round(T.MathUtils.lerp(110+pillow,54+bodyLight,person)+frost*30+streak*100+reflection);
    pixels[i+2]=Math.round(T.MathUtils.lerp(125+pillow,67+bodyLight,person)+frost*30+streak*100+reflection);
    pixels[i+3]=255;
  }
  const texture=new T.DataTexture(pixels,width,height);texture.colorSpace=T.SRGBColorSpace;
  texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.needsUpdate=true;return texture;
}
