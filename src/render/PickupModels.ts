import * as T from 'three';
import {MAT,box,rod,ring,batch} from './meshParts';
import {groundIndicatorMaterial} from './vfx/GroundIndicatorMaterial';

const point=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const locatorMaterials=new Map<string,T.ShaderMaterial>();
function supplyLocatorMaterial(kind:string):T.ShaderMaterial {
  let material=locatorMaterials.get(kind);
  if(!material){
    material=groundIndicatorMaterial('beam',kind==='credits'?0xffd27a:kind==='grenade'?0xffb454:0xb5edff);
    material.name='supply-locator';locatorMaterials.set(kind,material);
  }
  return material;
}

/** Large semantic pictograms on shallow supply cases; all finishes are shared/prewarmed. */
export function pickupModel(kind:string):T.Group {
  const root=new T.Group();root.name=`pickup-${kind}`;
  if(kind==='credits') {
    box(root,0,-.04,0,.49,.055,.4,MAT.dark,.02);
    for(let stack=0;stack<3;stack++)for(let coin=0;coin<=stack;coin++) {
      const x=(stack-1)*.15,z=stack%2?.06:-.05,y=coin*.035;
      rod(root,point(x,y,z),point(x,y+.03,z),.12,.12,MAT.reward);
    }
    box(root,0,.14,.04,.035,.014,.17,MAT.supplyWhite,.004);
  }else if(kind==='health') {
    box(root,0,-.035,0,.45,.09,.39,MAT.dark,.045);
    box(root,0,.018,0,.43,.025,.36,MAT.cyan,.025);
    box(root,0,.045,0,.13,.045,.39,MAT.supplyWhite,.014);
    box(root,0,.045,0,.39,.045,.13,MAT.supplyWhite,.014);
  }else if(kind==='armor') {
    const shield=new T.Shape();shield.moveTo(-.27,-.21);shield.lineTo(.27,-.21);shield.lineTo(.27,.06);shield.lineTo(0,.33);shield.lineTo(-.27,.06);shield.closePath();
    const geometry=new T.ExtrudeGeometry(shield,{depth:.045,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.015,bevelThickness:.01});geometry.rotateX(Math.PI/2);
    root.add(new T.Mesh(geometry,MAT.dark));
    for(let i=0;i<3;i++)box(root,0,.045,i*.12-.12,.43-i*.09,.045,.075,MAT.supplyWhite,.01);
  }else if(kind==='grenade') {
    rod(root,point(0,-.09,0),point(0,.24,0),.17,.19,MAT.dark);
    rod(root,point(0,.04,0),point(0,.1,0),.195,.195,MAT.reward);
    box(root,.15,.22,0,.065,.2,.095,MAT.supplyWhite,.012);
    ring(root,.025,.35,.01,.085,.018,MAT.supplyWhite);
  }else {
    box(root,0,-.04,0,.48,.07,.42,MAT.dark,.025);
    for(let i=-1;i<=1;i++) {
      rod(root,point(i*.15,.03,-.18),point(i*.15,.03,.13),.052,.052,MAT.reward);
      rod(root,point(i*.15,.03,.13),point(i*.15,.03,.22),.008,.052,MAT.supplyWhite);
    }
  }
  const locatorMaterial=supplyLocatorMaterial(kind);
  for(const angle of [0,Math.PI/2]) {
    const geometry=new T.PlaneGeometry(.16,1.25);geometry.translate(0,.73,0);geometry.rotateY(angle);
    root.add(new T.Mesh(geometry,locatorMaterial));
  }
  batch(root);
  for(const child of root.children)if(child instanceof T.Mesh&&child.material===locatorMaterial)child.castShadow=child.receiveShadow=false;
  return root;
}
