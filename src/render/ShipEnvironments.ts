import * as T from 'three';
import {MAT,box,ball,rod,ring,shell,geometry} from './meshParts';
import {residentialGalleryBlockout} from './ResidentialGalleryBlockout';
import {armoryCarousel} from './ArmoryCarousel';
import {safetyInterlockBlockout} from './SafetyInterlockBlockout';
import {safetyInterlockArchitecture} from './SafetyInterlockArchitecture';
import {armoryBlockout} from './ArmoryBlockout';
import {manualControlBlockout,manualControlArchitecture} from './ManualControlBlockout';
import {shieldingGateBlockout} from './ShieldingGateBlockout';
import {infestedWorkshop} from './InfestedWorkshop';
import {infestedWorkshopArchitecture} from './InfestedWorkshopArchitecture';
import {crewCheckpointBlockout} from './CrewCheckpointBlockout';
import {cabinetFace,pressureCylinderDetail,serviceCartridge} from './world/EquipmentDetail';
import {addBroodCell,addWallRoots,GROWTH_MAT} from './world/OrganicGrowth';

export const SHIP_ENVIRONMENTS=['cryogenics','habitation','security','cargo','communications','engineering','maintenance','infested','containment','reactor'] as const;
export type ShipEnvironment=typeof SHIP_ENVIRONMENTS[number];
const roomPairs=[['awakening-bay','passenger-vault'],['residential-gallery','communal-atrium'],['crew-checkpoint','armory'],['freight-hold','breached-loading-bay'],['relay-racks','transmission-chamber'],['diagnostic-gallery','safety-interlock-station'],['coolant-plant','service-shaft-landing'],['infested-workshop','swarm-junction'],['shielding-gate','containment-annulus'],['manual-control-chamber','overload-floor']];
/** Stable integration contract: domain keeps its own route; renderer accepts these IDs or an explicit environment. */
const legacyMoods:Readonly<Record<string,ShipEnvironment>>=Object.freeze({
 'receiving':'cargo','forklift-loop':'cargo','cold-aisle':'cryogenics','freight-crossing':'cargo',
 'pump-ring':'maintenance','specimen-bay':'containment','security-lock':'security','reactor-vault':'reactor',
 'rail-depot':'cargo','quarantine-cross':'containment','cryo-gallery':'cryogenics','filtration':'maintenance',
 'turbine-hall':'engineering','waste-processing':'infested','power-conduits':'engineering','hive-approach':'infested',
});
export function shipEnvironment(templateId:string):ShipEnvironment|undefined{return SHIP_ENVIRONMENTS[roomPairs.findIndex(pair=>pair.includes(templateId))]??(Object.hasOwn(legacyMoods,templateId)?legacyMoods[templateId]:undefined);}
export type Footprint={x:number;y:number;width:number;height:number};
const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
/** Session-owned field finish, shared by every containment room and emitter. */
export const fieldMaterial=new T.MeshStandardMaterial({color:0x84719f,emissive:0x9870df,emissiveIntensity:.65,roughness:.8,metalness:.1});fieldMaterial.userData.motivatedEmitter=true;

/** All models are authored in a local cell, then fitted inside the authoritative collision rectangle. */
export function environmentObstacle(environment:ShipEnvironment,footprint:Footprint,index=0,templateId='',seed=1729):T.Group{
 if(environment==='engineering'&&templateId==='safety-interlock-station')return safetyInterlockBlockout(footprint,index);
 if(environment==='security'&&templateId==='armory')return armoryBlockout(footprint,index);
 if(environment==='reactor'&&templateId==='manual-control-chamber')return manualControlBlockout(footprint,index);
 if(environment==='containment'&&templateId==='shielding-gate')return shieldingGateBlockout(footprint,index);
 if(environment==='infested'&&templateId==='infested-workshop')return infestedWorkshop(footprint,index);
 if(environment==='security'&&templateId==='crew-checkpoint')return crewCheckpointBlockout(footprint,index);
 if(environment==='habitation'&&templateId==='residential-gallery')return residentialGalleryBlockout(footprint,index);
 const root=new T.Group();root.name=`${environment}-obstacle-${index}`;
 const long=Math.max(footprint.width,footprint.height),short=Math.min(footprint.width,footprint.height);
 const columns=environment==='reactor'?1:Math.min(4,Math.max(1,Math.floor(short/2)));
 const rows=environment==='reactor'?1:Math.min(8,Math.max(1,Math.floor(long/2.7)));
 const count=columns*rows;
 for(let i=0;i<count;i++){
  const cell=new T.Group();cell.name=environment;root.add(cell);
  const b=(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,r=.04)=>box(cell,x,y,z,w,h,d,m,r);
  const pipe=(a:T.Vector3,c:T.Vector3,r:number,m:T.Material)=>{
   const length=a.distanceTo(c),g=geometry(`g2-machined-pipe:${r}/${length.toFixed(3)}`,()=>new T.CylinderGeometry(r,r,length,18));
   const mesh=new T.Mesh(g,m);mesh.position.copy(a).add(c).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),c.clone().sub(a).normalize());mesh.castShadow=mesh.receiveShadow=true;cell.add(mesh);return mesh;
  };
  const detailWriter={box:(m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>{b(x,y,z,w,h,d,m,0);},pipe:(m:T.Material,a:T.Vector3,c:T.Vector3,r:number)=>{pipe(a,c,r,m);}};
  const detailFinishes={steel:MAT.edge,dark:MAT.black,paint:MAT.bone,signal:MAT.cyan};
  switch(environment){
   case 'cryogenics':{
    b(0,.14,0,1.7,.28,2.5,MAT.steel,.12);
    // Rounded pressure shell, recessed dark window, separate sleeping person and protective ribs.
    b(0,.63,0,1.62,.9,2.42,MAT.armor,.3);
    b(0,1.04,0,1.2,.17,1.97,MAT.shellDark,.24);
    ball(cell,0,1.18,-.55,.19,.12,.2,MAT.bone);
    shell(cell,0,1.17,.03,.25,.09,.8,MAT.rubber);
    for(const side of [-1,1]){
     pipe(v(side*.13,1.16,.28),v(side*.15,1.16,.76),.08,MAT.rubber);
     pipe(v(side*.3,1.16,-.19),v(side*.31,1.16,.3),.065,MAT.rubber);
     b(side*.67,1.01,0,.055,.05,1.7,MAT.cyan,.02);
    }
    b(0,1.22,.38,1.45,.11,.1,MAT.armor);
    b(0,1.12,1.02,.65,.06,.15,MAT.cyan);
    b(.57,1.13,-.91,.12,.05,.16,MAT.acid);
    break;
   }
   case 'habitation':{
    // Padded banquette with a back, armrests, paired seat cushions and a low domestic table.
    b(0,.23,-.4,1.75,.4,1.2,MAT.orange,.1);
    b(0,.95,-.89,1.76,1.05,.22,MAT.bone,.1);
    for(const x of [-.43,.43]){b(x,.57,-.36,.78,.26,.9,MAT.red,.12);b(x,.93,-.72,.75,.57,.23,MAT.orange,.1);}
    for(const x of [-.83,.83])b(x,.66,-.35,.14,.56,1.1,MAT.bone);
    b(0,.54,.64,1.36,.12,.66,MAT.bone,.12);b(0,.25,.64,.48,.5,.38,MAT.steel);
    b(-.38,.64,.64,.3,.06,.36,MAT.purple);
    rod(cell,v(.37,.61,.62),v(.37,.8,.62),.08,.07,MAT.armor);
    b(.63,.15,1.1,.48,.3,.24,MAT.orange);
    for(const x of [.48,.78])b(x,.306,1.1,.025,.012,.22,MAT.steel,0);
    pipe(v(.56,.31,1.1),v(.56,.38,1.1),.018,MAT.steel);pipe(v(.56,.38,1.1),v(.7,.38,1.1),.018,MAT.steel);pipe(v(.7,.38,1.1),v(.7,.31,1.1),.018,MAT.steel);
    b(-.43,.704,-.34,.34,.008,.09,MAT.steel,0);
    for(let stitch=0;stitch<4;stitch++)b(-.55+stitch*.08,.711,-.34,.015,.006,.11,MAT.bone,0);
    b(.04,.614,.64,.28,.018,.24,MAT.purple,.012);b(.04,.625,.64,.20,.004,.16,MAT.bone,0);
    break;
   }
   case 'security':{
    b(0,.15,0,1.9,.3,2.5,MAT.black);
    if(templateId==='armory'){
     b(0,1,-.55,1.72,1.8,1.1,MAT.steel);
     for(const x of [-.55,0,.55]){pipe(v(x,.65,-.05),v(x,1.7,-.05),.06,MAT.black);b(x,1.05,.01,.25,.18,.15,MAT.rubber);}
     for(let x=-.77;x<.8;x+=.25)b(x,1.1,.16,.035,1.6,.035,MAT.edge,0);
    }else{
     for(const z of [-.64,.64]){const panel=b(0,.9,z,1.8,1.35,.4,MAT.steel);panel.rotation.x=z>0?-.14:.14;b(0,1.6,z,1.7,.12,.5,MAT.armor);}
    }
    for(const x of [-.7,.7]){b(x,.6,0,.2,1,2.35,MAT.edge);b(x,1.17,0,.15,.08,.65,MAT.amber);}
    break;
   }
   case 'cargo':{
    const levels= index%3===0?3:2;
    for(let level=0;level<levels;level++){
     const z=level%2?.12:0,m=level%2?MAT.orange:MAT.steel;
     b(0,.5+level*.88,z,1.8,.84,2.23,m,.045);
     for(let rib=-.92;rib<1;rib+=.3)b(0,.93+level*.88,z+rib,1.64,.055,.055,MAT.edge,0);
     for(const x of [-.84,.84])for(const dz of [-.96,.96])b(x,.5+level*.88,z+dz,.1,.88,.13,MAT.bone);
     b(0,.5+level*.88,z+1.13,.95,.045,.02,MAT.trim,0);
     for(const x of [-.74,.74]){b(x,.93+level*.88,z,.09,.055,1.94,MAT.black,.02);for(const dz of [-.94,.94])b(x,.95+level*.88,z+dz,.17,.045,.16,MAT.trim,.025);}
     b(-.48,.65+level*.88,z+1.13,.38,.19,.025,MAT.bone,.015);
     for(let serial=0;serial<6;serial++)b(-.62+serial*.052,.65+level*.88,z+1.146,.018,.13-.04*(serial%2),.006,MAT.black,0);
     for(const x of [-.34,.34])b(x,.5+level*.88,z+1.14,.04,.7,.04,MAT.edge,0);
     // Fitted service hatches and paired cam locks replace loose roof ornaments.
     b(.26,.95+level*.88,z-.52,.66,.035,.40,MAT.black,.025);
     b(.26,.974+level*.88,z-.52,.54,.012,.28,MAT.edge,.012);
     for(const x of [.04,.48])b(x,.987+level*.88,z-.52,.025,.014,.18,MAT.black,0);
     b(.34,.53+level*.88,z+1.148,.58,.36,.018,MAT.black,.015);
     for(const x of [.12,.56])b(x,.53+level*.88,z+1.163,.07,.25,.025,MAT.trim,.01);
     for(let serial=0;serial<4;serial++)b(.21+serial*.08,.57+level*.88,z+1.16,.045,.04,.008,MAT.bone,0);
    }break;
   }
   case 'communications':{
    b(0,.12,0,1.8,.24,2.5,MAT.steel);
    for(const z of [-.64,.64]){
     b(0,1.05,z,1.66,1.95,1.03,MAT.black);
     // Cells rotate to fit their room reservation. Detail every vertical face so
     // the camera never sees an untouched cabinet side after that rotation.
     for(const side of [-1,1])for(const axis of ['x','z'] as const){
      const surface=axis==='x'?.837:.525;
      const project=(p:T.Vector3)=>axis==='x'?new T.Vector3(side*(surface+p.z),p.y,z+p.x):new T.Vector3(p.x,p.y,z+side*(surface+p.z));
      const faceWriter={
       box:(m:T.Material,x:number,y:number,depth:number,w:number,h:number,d:number)=>{
        const p=project(v(x,y,depth));b(p.x,p.y,p.z,axis==='x'?d:w,h,axis==='x'?w:d,m,0);
       },
       pipe:(m:T.Material,a:T.Vector3,c:T.Vector3,r:number)=>{const cable=rod(cell,project(a),project(c),r,r,m);cable.receiveShadow=true;},
      };
      cabinetFace(faceWriter,detailFinishes,0,1.08,0,axis==='x'?.86:1.45,1.65);
     }
     b(0,2.04,z,1.3,.06,.7,MAT.steel);
     serviceCartridge(detailWriter,detailFinishes,0,2.073,z,.45,0,i);
     for(const x of [-.6,.6])pipe(v(x,1.7,z+.57),v(x,2.1,z+.22),.025,MAT.black);
    }break;
   }
   case 'engineering':{
    b(0,.46,0,1.8,.88,2.3,MAT.steel);
    for(const z of [-.66,.66]){
     const screen=b(0,1.14,z,1.55,.15,.8,MAT.black);screen.rotation.x=.32;
     const display=b(0,1.24,z-.01,1.25,.025,.55,MAT.cyan);display.rotation.x=.32;
     for(let n=0;n<4;n++)b(-.44+n*.29,1.29,z+.28,.13,.05,.1,n===0?MAT.amber:MAT.bone);
     for(let n=0;n<3;n++)b(-.31+n*.3,1.27,z-.1,.025,.025,.3,MAT.black,0);
     for(const x of [-.67,.67])b(x,1.25,z,.04,.02,.57,MAT.edge,.01);
    }
    b(-.84,.83,0,.12,1.45,2.25,MAT.trim);b(.84,.83,0,.12,1.45,2.25,MAT.trim);break;
   }
   case 'maintenance':{
    b(0,.12,0,1.9,.24,2.5,MAT.steel);
    for(const x of [-.48,.48]){
     pipe(v(x,.72,-.98),v(x,.72,.98),.3,MAT.copper);
     pressureCylinderDetail(detailWriter,{steel:MAT.edge,dark:MAT.black,paint:MAT.copper,signal:MAT.steel},x,.72,0,.3,1.96);
     for(const z of [-.78,.78]){const flange=ring(cell,x,.72,z,.35,.085,MAT.edge);flange.geometry=geometry('g2-coolant-flange',()=>new T.TorusGeometry(.35,.085,10,32));}
     b(x,.29,0,.72,.35,.7,MAT.black);
    }
    pipe(v(0,.4,0),v(0,1.3,0),.29,MAT.steel);
    const wheel=ring(cell,0,1.36,0,.4,.06,MAT.red);wheel.geometry=geometry('g2-valve-wheel',()=>new T.TorusGeometry(.4,.06,10,32));wheel.rotation.x=Math.PI/2;
    for(const a of [0,Math.PI/2]){const spoke=b(0,1.36,0,.78,.05,.06,MAT.red);spoke.rotation.y=a;}
    break;
   }
   case 'infested':{
    addBroodCell(cell,seed,index*count+i);break;
   }
   case 'containment':{
    b(0,.16,0,1.9,.32,2.5,MAT.black);
    for(let n=0;n<4;n++){
     const z=-.87+n*.58,height=1.55+Math.sin(n*Math.PI/3)*.55;
     b(0,height/2,z,1.8,height,.45,MAT.armor,.08);
     b(0,height+.05,z,1.5,.1,.39,MAT.edge);
     b(0,.5,z+.24,.25,.72,.025,MAT.black);
     b(0,1.1,z+.24,.4,.12,.025,MAT.amber);
     for(const x of [-.78,.78])b(x,height/2,z,.12,height-.1,.48,MAT.steel);
    }break;
   }
   case 'reactor':{
    b(0,.14,0,1.9,.28,2.5,MAT.black);
    rod(cell,v(0,.24,0),v(0,2.32,0),.48,.65,MAT.steel);
    shell(cell,0,1.3,0,.32,.95,.75,MAT.cyan);
    for(const y of [.44,1.16,1.88,2.48]){const collar=ring(cell,0,y,0,.76,.1,y===1.16?MAT.cyan:MAT.trim);collar.geometry=geometry('g2-reactor-collar',()=>new T.TorusGeometry(.76,.1,10,48));collar.rotation.x=Math.PI/2;}
    for(const x of [-.75,.75]){b(x,1.25,0,.16,2.5,.25,MAT.armor);pipe(v(x,.3,0),v(x*.56,2.6,0),.065,MAT.copper);}
    for(const z of [-1,1])b(0,.35,z,1.65,.5,.22,MAT.steel);
    break;
   }
  }
  // Fit actual vertex bounds, including bevels, rods and rotations. No new navigation obstacles.
  cell.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(cell),size=bounds.getSize(v(0,0,0)),center=bounds.getCenter(v(0,0,0));
  const cw=short/columns*.97,cd=long/rows*.97;
  cell.scale.set(cw/size.x,Math.min(environment==='reactor'?1.6:1,cw/1.5),cd/size.z);
  cell.position.set((i%columns-(columns-1)/2)*short/columns-center.x*cell.scale.x,-bounds.min.y*cell.scale.y,(Math.floor(i/columns)-(rows-1)/2)*long/rows-center.z*cell.scale.z);
 }
 if(footprint.width>footprint.height)root.rotation.y=Math.PI/2;
 root.position.set(footprint.x+footprint.width/2,0,footprint.y+footprint.height/2);
 root.userData.footprint={...footprint};return root;
}

/** Flatten nested models for the renderer's material batching, preserving transforms. */
export function appendEnvironment(parent:T.Group,model:T.Group){
 model.updateWorldMatrix(true,true);parent.updateWorldMatrix(true,false);
 const inverseParent=parent.matrixWorld.clone().invert(),meshes:T.Mesh[]=[];model.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});
 // Nonuniform fitted cells plus rotated rods create shear. TRS decomposition
 // loses it, so retain the full static matrix for vertex-accurate batching.
 for(const mesh of meshes){mesh.matrix.copy(inverseParent).multiply(mesh.matrixWorld);mesh.matrixAutoUpdate=false;parent.add(mesh);}
}

/** Flush deck inlays and outboard rear architecture never occupy a walkable tile. */
export function environmentArchitecture(parent:T.Group,env:ShipEnvironment,w:number,h:number,templateId='',seed=1729){
 if(env==='security'&&templateId==='armory'){appendEnvironment(parent,armoryCarousel());return;}
 if(env==='engineering'&&templateId==='safety-interlock-station'){const shell=new T.Group();safetyInterlockArchitecture(shell,w,h);appendEnvironment(parent,shell);return;}
 if(env==='reactor'&&templateId==='manual-control-chamber'){manualControlArchitecture(parent,w);return;}
 if(env==='infested'&&templateId==='infested-workshop')return infestedWorkshopArchitecture(parent,w,h);
 const residential=env==='habitation'&&templateId==='residential-gallery';
 const accent=env==='habitation'?MAT.bone:env==='infested'?MAT.acid:env==='containment'?fieldMaterial:['security','engineering','maintenance'].includes(env)?MAT.amber:MAT.cyan;
 const inlay=(x:number,z:number,width:number,depth:number,mat:T.Material)=>{const m=box(parent,x,-.007,z,width,.018,depth,mat,0);m.castShadow=false;return m;};
 // Deck language stays readable even when the nearest prop is off camera.
 if(env==='cryogenics'){
  for(let x=.3;x<w-.3;x+=3)for(let z=.3;z<h-.3;z+=3){const tw=Math.min(2.94,w-.3-x),td=Math.min(2.94,h-.3-z);inlay(x+tw/2,z+td/2,tw,td,MAT.armor);}
 }else if(residential){
  // Quiet flush route cue; the cabin thresholds, not a cafeteria cross, lead the room.
  inlay(w/2,h/2,w-1,.06,MAT.edge);
 }else if(env==='habitation'){
  inlay(w/2,h/2,w-1,2.3,MAT.orange);inlay(w/2,h/2,2.3,h-1,MAT.orange);
  for(const side of [-1,1]){inlay(w/2,h/2+side*1.2,w-1,.045,MAT.bone);inlay(w/2+side*1.2,h/2,.045,h-1,MAT.bone);}
 }else if(env==='communications'){
  for(let lane=0;lane<4;lane++){const x=w*.3+lane*.15;inlay(x,h/2,.055,h-1,lane===0?MAT.cyan:MAT.black);inlay(w*.55,h*.3+lane*.15,w*.5,.045,MAT.edge);}
 }else if(env==='engineering'){
  for(const z of [h*.3,h*.7]){inlay(w/2,z,w-2,.09,MAT.trim);for(let x=3;x<w-2;x+=3)inlay(x,z+.3,.65,.06,MAT.bone);}
 }else if(env==='cargo'||env==='security'){
  for(const x of [w*.25,w*.75])for(const z of [h*.25,h*.75]){
   for(const side of [-1,1]){inlay(x+side*1.5,z,.065,3,MAT.trim);inlay(x,z+side*1.5,3,.065,MAT.trim);}
  }
 }else if(env==='maintenance'){
  // One upward-facing layer: dark gaps abut the bars rather than sharing
  // the old slab's top face. The cached unit plane has no hidden box faces.
  const grate=(x:number,z:number,width:number,depth:number,mat:T.Material)=>{
   const mesh=new T.Mesh(geometry('maintenance-grate-plane',()=>new T.PlaneGeometry(1,1)),mat);
   mesh.rotation.x=-Math.PI/2;mesh.scale.set(width,depth,1);mesh.position.set(x,.002,z);
   mesh.receiveShadow=true;parent.add(mesh);
  };
  for(const z of [h*.25,h*.75]){
   for(const side of [-1,1])grate(w/2,z+side*.975,w-1,.05,MAT.black);
   let left=.5;
   for(let x=1;x<w-1;x+=.28){
    const edge=x-.065/2;
    grate((left+edge)/2,z,edge-left,1.9,MAT.black);
    grate(x,z,.065,1.9,MAT.edge);left=x+.065/2;
   }
   grate((left+w-.5)/2,z,w-.5-left,1.9,MAT.black);
  }
 }else if(env==='infested'){
  // Connected, flush roots come from EnvironmentalStory, without isolated ellipse pads.
 }
 for(let x=2;x<w;x+=4){
  const height=env==='cargo'?3.4:env==='containment'?3:2.65;
  box(parent,x,height/2,-.4,Math.min(3.96,w-x+2),height,.35,env==='cryogenics'?MAT.armor:env==='habitation'?MAT.bone:MAT.steel,env==='cryogenics'?.18:.04);
  box(parent,x,height/2,-.13,.3,height,.22,env==='cryogenics'?MAT.armor:MAT.edge);
  if(env==='cargo'){
   box(parent,x,3.5,-.35,3.95,.2,.5,MAT.trim);
   rod(parent,v(x-1.8,2.7,-.1),v(x+1.8,3.35,-.1),.065,.065,MAT.edge);
  }else if(env==='maintenance'){
   rod(parent,v(x-2,1.45,-.21),v(Math.min(w,x+2),1.45,-.21),.2,.2,MAT.copper);
  }else if(env==='containment'||env==='security'){
   for(const side of [-1,1]){const rib=box(parent,x+side*1.25,height/2,-.12,.25,height,.24,MAT.armor);rib.rotation.z=side*.16;}
  }
  if(env==='habitation'&&!residential){
   box(parent,x,1.25,-.045,1.6,2.4,.06,MAT.orange);
   box(parent,x,1.4,-.003,1.22,1.8,.015,MAT.black,0);
   box(parent,x+.48,1.1,.01,.05,.22,.012,MAT.bone,0);
  }else if(residential){
   // Retain the rear envelope without a competing row of false cabin doors.
  }else if(env==='infested'){
   addWallRoots(parent,x,seed,Math.round(x));
  }else{
   box(parent,x,2.1,-.04,env==='communications'?1.8:1,.12,.06,accent);
   if(env==='engineering')box(parent,x,1.3,-.035,2,1.1,.05,MAT.black);
  }
 }
 if(env==='reactor'||env==='containment'){
  if(templateId!=='reactor-vault')for(const radius of [.22,.33,.44]){const r=ring(parent,w/2,.012,h/2,Math.min(w,h)*radius,.026,accent);r.rotation.x=-Math.PI/2;r.scale.z=.1;r.castShadow=false;}
  if(env==='containment')for(let i=0;i<6;i++){const a=i*Math.PI/3,r=Math.min(w,h)*.33,x=w/2+Math.cos(a)*r,z=h/2+Math.sin(a)*r;box(parent,x,.027,z,.28,.05,.28,MAT.steel,.025);box(parent,x,.056,z,.12,.008,.12,fieldMaterial,.01);}
 }else if(env==='maintenance'){
  for(let z=1;z<h-1;z+=.35)for(const x of [1,w-1])box(parent,x,-.005,z,1.2,.018,.06,MAT.black,0);
 }else{
  for(const x of [1,w-1])for(let z=1;z<h;z+=env==='cargo'?.7:2){
   if(env==='cargo'){
    // Thin, chipped industrial paint lies 3mm above the actual generic deck.
    const stripe=new T.Mesh(geometry('x2-worn-hazard-plane',()=>new T.PlaneGeometry(1,1)),MAT.industrialPaint);
    stripe.name='flush-worn-cargo-paint';stripe.position.set(x,-.017,z);stripe.rotation.set(-Math.PI/2,0,-.6);
    stripe.scale.set(.31,.22,1);stripe.receiveShadow=true;parent.add(stripe);
    if(Math.round(z*10)%3!==0){const chip=stripe.clone();chip.position.z+=.16;chip.scale.set(.11,.065,1);parent.add(chip);}
   }else{const stripe=box(parent,x,-.003,z,.07,.02,.35,accent,0);stripe.castShadow=false;}
  }
 }
}
