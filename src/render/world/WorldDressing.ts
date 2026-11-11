import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {RoomTemplate} from '../../game/roguelike/types';
import type {ShipEnvironment} from '../ShipEnvironments';

const UNIT=32;
const ROOM_IDEAS:Readonly<Record<string,string>>={
 'awakening-bay':'emergency-wake-manifold','passenger-vault':'occupied-life-support-chain',
 'residential-gallery':'packed-arrival-belongings','communal-atrium':'last-living-garden',
 'crew-checkpoint':'spent-defense-line','armory':'secured-issue-inventory',
 'freight-hold':'colony-supply-manifests','breached-loading-bay':'boarding-scar-veins',
 'relay-racks':'live-relay-buses','transmission-chamber':'uplink-reflector',
 'diagnostic-gallery':'independent-warning-wall','safety-interlock-station':'locked-safety-record',
 'coolant-plant':'pressure-instrument-chain','service-shaft-landing':'isolated-local-power',
 'infested-workshop':'living-machine-seams','swarm-junction':'brood-nursery',
 'shielding-gate':'violet-shield-emitters','containment-annulus':'shielding-test-points',
 'manual-control-chamber':'single-manual-console','overload-floor':'terminal-alarm-sequence',
 'reactor-vault':'queen-nest-foundation',
};
const MOOD_ACCENT:Record<ShipEnvironment,number>={cryogenics:0x9fe8ff,habitation:0xe5ad70,security:0xff7354,cargo:0xddad61,communications:0x71dac4,engineering:0xffc260,maintenance:0x7fcdb9,infested:0x9dff5a,containment:0xb79cff,reactor:0xffad61};

function randomSource(seed:number,text:string){
  for(let i=0;i<text.length;i++)seed=Math.imul(seed^text.charCodeAt(i),16777619);
  return()=>{seed=(seed+0x6d2b79f5)>>>0;let t=Math.imul(seed^(seed>>>15),1|seed);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};
}

/** Deterministic, material-merged fittings. Raised detail is supported by existing solids. */
export function addWorldDressing(world:T.Group,template:RoomTemplate,environment:ShipEnvironment,templateId:string,seed=1729):T.Group {
  const root=new T.Group();root.name='g2-world-dressing';
  root.userData.seed=seed;root.userData.signature=templateId;root.userData.visualIdea=ROOM_IDEAS[templateId]??'retained-ship-utility';
  const make=(name:string,color:number,metalness:number,roughness:number,emissive=0,intensity=0)=>{
    const m=new T.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:intensity});
    m.name=`g2-dressing-${name}`;m.userData.actorMaterial=true;return m;
  };
  const steel=make('steel',0x596771,.68,.43),dark=make('graphite',0x15212a,.5,.65),paint=make('enamel',environment==='habitation'?0xa18c70:0x8d9e9d,.15,.78);
  const resin=make('resin',0x364334,.05,.82),signal=make('signal',MOOD_ACCENT[environment],.12,.36,MOOD_ACCENT[environment],.65);
  const vein=make('vein',0x547b3a,.08,.48,environment==='infested'?0x9dff5a:0x6b9a52,environment==='infested'?.62:.18);
  const materials=[steel,dark,paint,resin,signal,vein],buckets=new Map<T.Material,T.BufferGeometry[]>();
  const random=randomSource(seed,templateId),matrix=new T.Matrix4(),quat=new T.Quaternion(),axis=new T.Vector3(0,1,0);
  const add=(geometry:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,sx=1,sy=1,sz=1,rotation=0)=>{
    matrix.compose(new T.Vector3(x,y,z),quat.setFromAxisAngle(axis,rotation),new T.Vector3(sx,sy,sz));
    geometry.applyMatrix4(matrix);const list=buckets.get(m)??[];list.push(geometry.index?geometry.toNonIndexed():geometry);if(geometry.index)geometry.dispose();buckets.set(m,list);
  };
  const box=(m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,rotation=0)=>add(new T.BoxGeometry(w,h,d),m,x,y,z,1,1,1,rotation);
  const sphere=(m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>add(new T.SphereGeometry(1,12,8),m,x,y,z,w,h,d);
  const pipe=(m:T.Material,a:T.Vector3,b:T.Vector3,r:number)=>{
    const g=new T.CylinderGeometry(r,r,a.distanceTo(b),10,1);g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(axis,b.clone().sub(a).normalize())));g.translate((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);const list=buckets.get(m)??[];list.push(g.toNonIndexed());g.dispose();buckets.set(m,list);
  };
  const point=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
  // Query the actual renderer's roof so fittings cannot float over lower kit pieces.
  world.updateMatrixWorld(true,true);const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0);
  let fittings=0;
  for(const [index,r] of template.obstacles.entries()){
    if(index>=12)break;
    const left=r.x/UNIT,right=(r.x+r.width)/UNIT,near=r.y/UNIT,far=(r.y+r.height)/UNIT,w=right-left,d=far-near;
    if(Math.min(w,d)<.8)continue;
    const cx=(left+right)/2,cz=(near+far)/2;
    for(let n=0;n<Math.min(6,Math.ceil(w*d/9));n++){
      const margin=Math.min(.52,w*.35,d*.35),x=left+margin+random()*Math.max(0,w-2*margin),z=near+margin+random()*Math.max(0,d-2*margin);
      ray.set(point(x,20,z),down);const hit=ray.intersectObject(world,true).find(h=>h.point.y>.15);if(!hit)continue;
      const y=hit.point.y+.015,angle=random()*Math.PI,span=Math.min(.34,w*.12,d*.12);
      if(environment==='habitation'){
        box(paint,x,y+.07,z,span*1.5,.14,span,angle);box(dark,x,y+.146,z,span*1.35,.012,span*.84,angle); // packed arrival belongings
      }else if(environment==='security'){
        for(let c=0;c<4;c++)pipe(steel,point(x-span/2+c*.09,y+.035,z),point(x-span/2+c*.09,y+.035,z+.13),.025);
        box(paint,x,y+.02,z-.12,span*1.4,.04,.18,angle);
      }else if(environment==='infested'){
        for(let egg=0;egg<3;egg++)sphere(egg===1?vein:resin,x+(egg-1)*span*.45,y+.17,z+(egg%2)*span*.35,span*.48,.2,span*.45);
        pipe(resin,point(x-span,y,z),point(x+span,y+.02,z),.06);
      }else{
        box(dark,x,y+.028,z,span*1.7,.055,span*1.3,angle);
        box(paint,x,y+.075,z,span*1.45,.045,span,angle);
        for(let bolt=0;bolt<3;bolt++)box(steel,x-span*.5+bolt*span*.5,y+.104,z,span*.08,.018,span*.35,angle);
      }
      fittings++;
    }
    // Fine trim, label pads and cable looms belong to equipment roofs, not routes.
    ray.set(point(cx,20,cz),down);const centerHit=ray.intersectObject(world,true).find(h=>h.point.y>.2);
    if(centerHit&&index<4){
      const top=centerHit.point.y+.018,sw=Math.min(w*.46,1.6),sd=Math.min(d*.22,.48);
      box(dark,cx,top+.025,cz,sw,.05,sd);
      for(let tick=0;tick<7;tick++)box(tick===0?signal:paint,cx-sw*.4+tick*sw*.12,top+.055,cz,sw*.055,.008,sd*(tick%3===0?.6:.3));
      if(environment==='maintenance'||environment==='engineering'){
        const radius=Math.min(.21,w*.1,d*.1);const dial=new T.TorusGeometry(radius,.025,6,24);dial.rotateX(-Math.PI/2);add(dial,steel,cx,top+.12,cz);
        box(signal,cx,top+.09,cz,radius*1.5,.015,radius*1.5);box(dark,cx,top+.13,cz,.026,.01,radius*1.3,.8);
      }
      if(index===0&&(templateId==='diagnostic-gallery'||templateId==='safety-interlock-station'||templateId==='manual-control-chamber'||templateId==='service-shaft-landing')){
        const width=Math.min(w*.72,3.3),depth=Math.min(d*.65,1.25);
        box(dark,cx,top+.08,cz,width,.16,depth);
        box(signal,cx,top+.166,cz,width*.88,.012,depth*.79);
        const rows=templateId==='diagnostic-gallery'?5:3;
        for(let row=0;row<rows;row++){
          const offset=(row-(rows-1)/2)*depth*.13;
          box(dark,cx-width*.08,top+.176,cz+offset,width*(row===0?.63:.38+row*.045),.006,depth*.035);
        }
        // The manual authorization retains one concentrated console light.
        root.userData.lightFixtures=[{x:cx,y:top+.28,z:cz,color:MOOD_ACCENT[environment],nativeColor:true}];
      }
      if(templateId==='transmission-chamber'&&index===0){
        const radius=Math.min(w,d)*.32,profile=[new T.Vector2(0,0),new T.Vector2(radius*.3,.05),new T.Vector2(radius*.65,.18),new T.Vector2(radius,.44)];
        add(new T.LatheGeometry(profile,40),paint,cx,top+.08,cz);
        const rim=new T.TorusGeometry(radius,.035,8,48);rim.rotateX(Math.PI/2);add(rim,signal,cx,top+.52,cz);
        pipe(steel,point(cx,top+.08,cz),point(cx,top+.78,cz),.045);sphere(signal,cx,top+.78,cz,.09,.09,.09);
        root.userData.lightFixtures=[{x:cx,y:top+.8,z:cz,color:0x71dac4,nativeColor:true}];
      }
    }
  }
  // Vent portals are flush gratings: enemies emerge here, but the deck stays traversable.
  const onDeck=(x:number,z:number)=>{
    const px=x*UNIT,pz=z*UNIT;
    if(px<0||pz<0||px>template.width||pz>template.height)return false;
    const inside=(polygon:readonly {x:number;y:number}[])=>{let value=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[i],b=polygon[j];if((a.y>pz)!==(b.y>pz)&&px<(b.x-a.x)*(pz-a.y)/(b.y-a.y)+a.x)value=!value;
    }return value;};
    return(!template.boundary||inside(template.boundary))&&!template.voids?.some(inside);
  };
  const organic=environment==='infested'||templateId==='breached-loading-bay'||templateId==='reactor-vault';
  const growth=environment==='infested'?1:organic?.65:.12;
  for(const [index,b] of template.breaches.entries()){
    const x=b.x/UNIT,z=b.y/UNIT;
    box(dark,x,.009,z,1.28,.018,1.08);
    for(let slat=-4;slat<=4;slat++)box(steel,x+slat*.13,.026,z,.044,.014,.87);
    for(const side of [-1,1]){
      box(paint,x+side*.67,.029,z,.055,.012,1.12);
      box(signal,x+side*.59,.035,z-.42,.07,.012,.12);
    }
    if(organic){
      // Every free-standing growth vertex stays <=3cm: raised eggs only live on solid roofs.
      for(let branch=0;branch<5;branch++){
        const angle=random()*Math.PI*2,reach=(.7+random()*1.6)*growth;
        let a=point(x,.038,z);
        for(let segment=1;segment<=5;segment++){
          const t=segment/5,r=reach*t,wiggle=Math.sin(segment*1.8+branch)*.12;
          const end=point(x+Math.cos(angle)*r-Math.sin(angle)*wiggle,.038,z+Math.sin(angle)*r+Math.cos(angle)*wiggle);
          // Flat underside-supported veins remain below normal actor silhouettes.
          const delta=end.clone().sub(a),length=delta.length();if(!onDeck(a.x,a.z)||!onDeck(end.x,end.z)){a=end;continue;}box(branch%2?resin:vein,(a.x+end.x)/2,.014,(a.z+end.z)/2,length,.024,.025+growth*.018,-Math.atan2(delta.z,delta.x));a=end;
        }
      }
    }
    root.userData.breachCount=index+1;
  }
  root.userData.fittings=fittings;root.userData.growthIntensity=vein.emissiveIntensity;
  root.userData.pulseMaterial=vein;
  for(const [material,list] of buckets){
    // Every primitive contributes the same position/normal/uv layout.
    const g=mergeGeometries(list,false);for(const part of list)part.dispose();if(!g)throw Error('World dressing geometry mismatch');
    const mesh=new T.Mesh(g,material);mesh.name=material.name;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
  }
  for(const material of materials)if(!buckets.has(material))material.dispose();
  world.add(root);return root;
}

/** Uniform-only biological breathing; no geometry, textures or arrays allocated per frame. */
export function updateWorldDressing(world:T.Object3D,time:number,reducedMotion=false):void {
  const root=world.name==='g2-world-dressing'?world:world.getObjectByName('g2-world-dressing');if(!root)return;
  const material=root.userData.pulseMaterial as T.MeshStandardMaterial|undefined;
  if(material)material.emissiveIntensity=(root.userData.growthIntensity as number)*(reducedMotion?1:1+Math.sin(time*1.4)*.1);
}
