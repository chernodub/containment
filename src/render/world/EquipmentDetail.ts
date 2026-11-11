import * as T from 'three';

export type EquipmentDetailWriter = {
  box: (material:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,angle?:number)=>void;
  pipe: (material:T.Material,a:T.Vector3,b:T.Vector3,radius:number)=>void;
  housing?: (material:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,angle:number)=>void;
};
export type EquipmentFinishes = {steel:T.Material;dark:T.Material;paint:T.Material;signal:T.Material};

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

/** Frosted observation glazing with an original, restrained sleeping human silhouette. */
export function passengerObservationTexture():T.DataTexture {
  const width=128,height=256,pixels=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=(x+.5)/width,v=(y+.5)/height,dx=u-.5;
    const head=(dx/.115)**2+((v-.23)/.074)**2<1;
    const torso=Math.abs(dx)<.14-(v-.32)*.035&&v>.305&&v<.65;
    const legs=v>=.65&&v<.87&&(Math.abs(dx-.065)<.046||Math.abs(dx+.065)<.046);
    const arms=v>.35&&v<.67&&Math.abs(dx)>.14&&Math.abs(dx)<.19;
    const person=head||torso||legs||arms;
    const edge=Math.pow(Math.max(Math.abs(dx)*2,Math.abs(v-.5)*2),6);
    const grain=((Math.imul(x+17,374761393)^Math.imul(y+31,668265263))>>>5)%23/23;
    const frost=edge*(.35+grain*.65),streak=Math.sin(x*.59+y*.032)> .97?.08:0;
    const i=(y*width+x)*4,value=person?-.025:.045;
    pixels[i]=Math.round(15+value*255+frost*46+streak*255);
    pixels[i+1]=Math.round(36+value*255+frost*63+streak*255);
    pixels[i+2]=Math.round(46+value*255+frost*68+streak*255);
    pixels[i+3]=255;
  }
  const texture=new T.DataTexture(pixels,width,height);texture.colorSpace=T.SRGBColorSpace;
  texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.needsUpdate=true;return texture;
}
