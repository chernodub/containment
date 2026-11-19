import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {OriginalKitInstance, OriginalKitPack} from './OriginalShipKitAssets';

/** Interrupted packing spills into the passage outside the first cabin. */
export function dress13ResidentialPlacements(): OriginalKitInstance[] {
  const out: OriginalKitInstance[] = [];
  const add=(asset:string,x:number,z:number,yaw:number,sx:number,sy:number,sz:number,y=0,pack:OriginalKitPack='p11-service',roll=0)=>out.push({pack,asset,purpose:'DRESS13 / residential evacuation / '+asset,cutaway:false,castShadow:false,
    matrix:new T.Matrix4().compose(new T.Vector3(x/32,y,z/32),new T.Quaternion().setFromEuler(new T.Euler(0,yaw,roll,'YXZ')),new T.Vector3(sx,sy,sz))});
  // Three opened suitcases and two dropped carry cases trail out of the cabin.
  add('service-transit-case',246,303,-.25,1.1,.5,.85);
  add('service-transit-case',284,326,.45,.9,.5,.8);
  add('service-transit-case',328,300,-.3,.8,.45,.75);
  add('service-transit-case',365,294,.7,.65,.7,.65);
  add('service-transit-case',390,270,-.6,.55,.6,.55);
  // Detached lids, an opened drawer and one desk pushed against a cabin door.
  add('service-access-hatch',238,290,-.25,.7,.5,.7,.16);
  out[out.length-1].matrix.multiply(new T.Matrix4().makeRotationX(-Math.PI/2));
  add('service-access-hatch',323,285,-.3,.55,.4,.55,.12);
  out[out.length-1].matrix.multiply(new T.Matrix4().makeRotationX(-Math.PI/2));
  add('service-transit-case',202,252,.05,.9,.35,1,.025);
  add('last-cabin',407,290,.08,1,1,1,0,'p11-inc13-residential');
  add('deck-rubber-panel',275,322,.3,.45,.5,.4,.025,'clinical');
  return out;
}

export function addDress13ResidentialDetails(root:T.Group):void {
  const parts:T.BufferGeometry[]=[];
  const put=(g:T.BufferGeometry,color:number)=>{const n=g.getAttribute('position').count,c=new T.Color(color),v=new Float32Array(n*3);for(let i=0;i<n;i++)c.toArray(v,i*3);g.setAttribute('color',new T.BufferAttribute(v,3));parts.push(g.index?g.toNonIndexed():g);if(g.index)g.dispose();};
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,color:number,yaw=0)=>{const g=new T.BoxGeometry(w,h,d);g.rotateY(yaw);g.translate(x/32,y,z/32);put(g,color);};
  // Folded clothes inside the open cases, restrained cream/grey personal effects.
  for(const [x,z,a] of [[246,303,-.25],[284,326,.45],[328,300,-.3]]){
    box(x,.27,z,.7,.018,.4,0x29363c,a);box(x+3,.29,z,.36,.04,.28,0x8b8a7f,a+.2);
    box(x-5,.32,z-3,.2,.06,.18,0x586c71,a);
  }
  const pillow=new T.SphereGeometry(1,12,8);pillow.scale(.225,.065,.17);pillow.translate(213/32,.085,275/32);put(pillow,0xa0a79c);
  const shirtShape=new T.Shape([[-.22,.3],[-.1,.4],[-.06,.26],[.06,.26],[.1,.4],[.22,.3],[.18,.15],[.11,.2],[.1,-.25],[-.1,-.25],[-.11,.2],[-.18,.15]].map(p=>new T.Vector2(p[0],p[1])));
  const shirt=new T.ShapeGeometry(shirtShape);shirt.rotateX(-Math.PI/2);shirt.translate(246/32,.34,303/32);put(shirt,0x86988f);
  // The pulled-out drawer has a visibly open tray, rims and a front handle.
  box(202,.218,252,.68,.012,.56,0x26343a,.05);
  box(190,.27,252,.035,.12,.7,0x8c968d,.05);box(214,.27,252,.035,.12,.7,0x8c968d,.05);
  box(202,.27,241,.8,.12,.035,0x8c968d,.05);box(202,.24,264,.25,.035,.06,0x69777a,.05);
  for(let i=0;i<5;i++)box(265+i*18,.027,341+(i%2)*5,.12,.008,.3,0x8d958c,i*.6);
  for(let i=0;i<4;i++)box(248+i*8,.026,345,.018,.004,1.2,0x3d4444,.4);
  // A proper four-legged chair lies on its side beside the packing trail.
  const chair:T.BufferGeometry[]=[];
  for(const [x,y,z,w,h,d] of [[0,.45,0,.48,.09,.48],[0,.83,-.22,.48,.68,.07],[-.19,.22,-.19,.055,.44,.055],[.19,.22,-.19,.055,.44,.055],[-.19,.22,.19,.055,.44,.055],[.19,.22,.19,.055,.44,.055]]){const g=new T.BoxGeometry(w,h,d);g.translate(x,y,z);chair.push(g);}
  const fallen=mergeGeometries(chair,false)!;chair.forEach(g=>g.dispose());fallen.rotateZ(1.5);fallen.rotateY(.4);fallen.translate(350/32,.24,278/32);put(fallen,0x68797b);
  const geometry=mergeGeometries(parts,false)!;parts.forEach(g=>g.dispose());
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.95,side:T.DoubleSide});material.userData.actorMaterial=true;
  const mesh=new T.Mesh(geometry,material);mesh.name='dress13-residential-evacuation-evidence';mesh.receiveShadow=true;root.add(mesh);
  const paper=document.createElement('canvas');paper.width=512;paper.height=256;const c=paper.getContext('2d')!;
  c.fillStyle='#9b9e8b';c.fillRect(0,0,512,256);c.strokeStyle='#4a6d73';c.lineWidth=7;
  c.beginPath();c.moveTo(40,180);c.lineTo(100,90);c.lineTo(160,180);c.closePath();c.stroke();c.strokeRect(65,180,70,45);
  c.strokeStyle='#89754d';c.beginPath();c.arc(230,60,28,0,Math.PI*2);c.stroke();
  for(const x of [300,390]){c.strokeStyle='#5c7374';c.beginPath();c.arc(x,100,20,0,Math.PI*2);c.moveTo(x,120);c.lineTo(x,180);c.lineTo(x-25,220);c.moveTo(x,180);c.lineTo(x+25,220);c.moveTo(x-30,145);c.lineTo(x+30,145);c.stroke();}
  const texture=new T.CanvasTexture(paper);texture.colorSpace=T.SRGBColorSpace;
  const drawingMaterial=new T.MeshStandardMaterial({map:texture,roughness:1,side:T.DoubleSide});drawingMaterial.userData.actorMaterial=true;drawingMaterial.addEventListener('dispose',()=>texture.dispose());
  // Mount the children's paper at the front of the torn left leaf, below its lamp.
  const pictures=new T.Group();
  pictures.position.set(407/32,0,290/32);pictures.rotation.y=.08;
  for(const [x,y,tilt,w,h,left,top,right,bottom] of [
    [-1.03,1.88,.08,.57,.49,18,65,178,244],
    [-1.12,1.39,-.1,.54,.37,265,63,431,244],
    [-.7,2.24,-.12,.28,.28,189,19,272,102],
  ]){
    const geometry=new T.PlaneGeometry(w,h);
    const uv=geometry.getAttribute('uv');
    for(let i=0;i<uv.count;i++){
      uv.setXY(i,(left+(right-left)*uv.getX(i))/512,1-(bottom-(bottom-top)*uv.getY(i))/256);
    }
    const sheet=new T.Mesh(geometry,drawingMaterial);
    sheet.position.set(x,y,-.365);sheet.rotation.z=tilt;pictures.add(sheet);
  }
  pictures.name='residential-cabin-drawings';root.add(pictures);
}
