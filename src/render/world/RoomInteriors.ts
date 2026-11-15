import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Point,RoomTemplate} from '../../game/roguelike/types';
import type {ShipPlan} from '../../game/roguelike/shipArchitecturePlan';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {shipEnvironment} from '../ShipEnvironments';
import {kitBoundsSupported,kitHull,kitInside} from './KitSafety';
import {InteriorDeckChart} from './InteriorDeckGeometry';
import {cutInteriorWallNiches} from './InteriorWallNiches';
import {INTERIOR_PROFILES} from './RoomInteriorProfiles';

/** The standard is reviewed before the same construction is enabled elsewhere. */
export const INTERIOR_ROOMS:ReadonlySet<string>=new Set(['diagnostic-gallery','crew-checkpoint','swarm-junction']);
type Cluster={space:string;purpose:string;backing:string;position:number[];angle:number;scale:number;kind:string;pieces:number;bounds:number[][][]};
type Fixture={x:number;y:number;z:number;color:number;nativeColor:true;poolStyle:1;poolAngle:number;poolWidth:number;poolDepth:number;gain:number};
export type InteriorProof={room:string;landmark:string;floor:{name:string;triangles:number;area:number}[];clusters:Cluster[];fixtures:Fixture[];wallCaps:number;thresholds:number;triangles:number};
const rect=(x:number,y:number,w:number,h:number):Point[]=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];

/** Construction-only original geometry. Every raised piece is backed by a frozen
 * solid/hull footprint. Floor graphics are exact deck intersections below .022m.
 * Four merged stock finishes survive Low; no new per-room shader family. */
export function buildRoomInteriors(id:string,t:RoomTemplate,world?:T.Group):T.Group|null {
  if(!INTERIOR_ROOMS.has(id))return null;
  const plan=SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS] as ShipPlan|undefined;
  if(!plan)return null;
  const profile=INTERIOR_PROFILES[id],root=new T.Group();root.name='e9-room-interiors';root.userData.visualOnly=true;
  const bins=new Map<T.Material,T.BufferGeometry[]>();
  const material=(name:string,color:number,vertexColors=true)=>{
    const m=new T.MeshStandardMaterial({name,color,vertexColors,roughness:.86,metalness:.18});
    m.userData.actorMaterial=true;return m;
  };
  const hardware=material('e9-interior-hardware',0xffffff),lamp=material('e9-interior-diffuser',profile.key,false);
  lamp.emissive.setHex(profile.key);lamp.emissiveIntensity=.65;lamp.userData.motivatedEmitter=true;
  const furnishing=material('e9-furnishing-fallback',0xffffff);
  const floorMaterial=material('e9-interior-floor',0xffffff);floorMaterial.metalness=0;floorMaterial.userData.floorDressing=true;
  const push=(g:T.BufferGeometry,color:number,m=hardware,wall=false)=>{
    const flat=g.index?g.toNonIndexed():g; if(flat!==g)g.dispose();
    for(const key of Object.keys(flat.attributes))if(key!=='position'&&key!=='normal')flat.deleteAttribute(key);
    if(m.vertexColors){
      const c=new T.Color(color),normal=flat.getAttribute('normal'),values=new Float32Array(flat.getAttribute('position').count*3);
      for(let i=0;i<normal.count;i++){
        const gain=normal.getY(i)>.5?1.30:normal.getZ(i)>.35?.43:.76;
        values.set([c.r*gain,c.g*gain,c.b*gain],i*3);
      }
      flat.setAttribute('color',new T.BufferAttribute(values,3));
    }
    flat.userData.interiorWall=wall;const parts=bins.get(m)??[];parts.push(flat);bins.set(m,parts);
  };
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,color:number,angle=0,m=hardware,wall=false)=>
    push(new T.BoxGeometry(w,h,d).rotateY(angle).translate(x,y,z),color,m,wall);
  const proof:InteriorProof={room:id,landmark:profile.landmark,floor:[],clusters:[],fixtures:[],wallCaps:0,thresholds:0,triangles:0};
  const chart=new InteriorDeckChart(t),base=new T.Color(profile.deck),zone=new T.Color(profile.zone),trim=new T.Color(profile.trim);
  // Calm continuous surfaces replace the close-camera tile grid. Each named
  // space is an actual chart, with broad panel seams oriented to its function.
  for(const [i,space]of plan.spaces.entries()) {
    const tone=base.clone().lerp(zone,i%2?.82:.12).multiplyScalar(1+(i%3-1)*.10);
    chart.polygon(space.outline,tone,.006,space.name);
    for(let j=0;j<space.outline.length;j++)chart.strip(space.outline[j],space.outline[(j+1)%space.outline.length],3.2,tone.clone().lerp(trim,.30),.012);
    const xs=space.outline.map(p=>p.x),ys=space.outline.map(p=>p.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    const horizontal=(i%2===0);
    // Broad service deck seams, with a quiet inset access plate near each anchor.
    const plate=rect(space.anchor.x-38,space.anchor.y-52,76,104);
    if(plate.every(p=>kitInside(p.x,p.y,space.outline))){
      chart.polygon(plate,tone.clone().multiplyScalar(.84),.014);
      chart.polygon(rect(space.anchor.x-34,space.anchor.y-48,68,96),tone.clone().multiplyScalar(.96),.015);
      for(const side of [-1,1])chart.polygon(rect(space.anchor.x+side*24-4,space.anchor.y+34,8,3),trim.clone().multiplyScalar(.76),.018);
    }
    for(let n=(horizontal?y0:x0)+82;n<(horizontal?y1:x1);n+=112) {
      // Clip this seam to its named zone before it reaches the global deck.
      const width=1.1,poly=horizontal?rect(x0,n-width/2,x1-x0,width):rect(n-width/2,y0,width,y1-y0);
      // Space outlines are convex except Freight (handled by the chart itself).
      if(poly.every(p=>kitInside(p.x,p.y,space.outline)))chart.polygon(poly,tone.clone().multiplyScalar(.89),.010);
    }
  }
  // Function inlays stay quiet and flat under actors and telegraphs.
  const a=plan.arena,ink=base.clone().lerp(trim,.25),recess=base.clone().multiplyScalar(.80);
  if(profile.kind==='diagnostics') {
    for(const side of [-1,1]) {
      chart.strip({x:a.x-240,y:a.y+side*104},{x:a.x+240,y:a.y+side*104},13,recess,.017);
      chart.strip({x:a.x-240,y:a.y+side*96},{x:a.x+240,y:a.y+side*96},2,ink,.018);
      for(let n=-3;n<=3;n++)chart.strip({x:a.x+n*62,y:a.y+side*87},{x:a.x+n*62,y:a.y+side*101},3,ink,.018);
    }
    for(const side of [-1,1])chart.polygon(rect(a.x+side*176-16,a.y-42,32,84),base.clone().multiplyScalar(.94),.017);
    // A diagnostic trace is part of the inspection deck, not a combat signal.
    const trace=[[-182,4],[-124,4],[-110,-12],[-90,19],[-67,-40],[-42,34],[-20,4],[66,4],[83,-14],[102,4],[182,4]];
    for(let n=1;n<trace.length;n++)chart.strip({x:a.x+trace[n-1][0],y:a.y+trace[n-1][1]},{x:a.x+trace[n][0],y:a.y+trace[n][1]},2.6,ink.clone().lerp(base,.35),.019);
  } else if(profile.kind==='checkpoint') {
    for(const dy of [-88,88]) {
      chart.strip({x:a.x-180,y:a.y+dy},{x:a.x+190,y:a.y+dy},4,ink,.017);
      for(let n=-2;n<=2;n++)chart.polygon(rect(a.x+n*66-21,a.y+dy-9,42,18),recess,.016);
    }
    // Large, restrained scanner electrode plates, not danger chevrons.
    for(const dx of [-110,110])chart.polygon(rect(a.x+dx-19,a.y-55,38,110),base.clone().multiplyScalar(.91),.016);
  } else {
    // The original ventilation trunk is still legible under infestation.
    for(const dy of [-100,100]) {
      chart.strip({x:a.x-230,y:a.y+dy},{x:a.x+230,y:a.y+dy},18,recess,.016);
      for(let n=-7;n<=7;n++)chart.strip({x:a.x+n*30,y:a.y+dy-7},{x:a.x+n*30+9,y:a.y+dy+7},2,ink,.018);
    }
    const circle:Point[]=Array.from({length:48},(_,i)=>({x:a.x+138*Math.cos(i*Math.PI/24),y:a.y+138*Math.sin(i*Math.PI/24)}));
    for(let i=0;i<circle.length;i++)if(i%6<4)chart.strip(circle[i],circle[(i+1)%circle.length],3,recess,.018);
    for(let n=0;n<8;n++){
      const angle=n*Math.PI/4,cx=a.x+124*Math.cos(angle),cy=a.y+124*Math.sin(angle);
      chart.polygon(rect(cx-5,cy-5,10,10),ink,.018);
      chart.strip({x:a.x+110*Math.cos(angle),y:a.y+110*Math.sin(angle)},{x:a.x+78*Math.cos(angle),y:a.y+78*Math.sin(angle)},5,recess,.017);
    }
    for(const side of [-1,1])chart.polygon(rect(a.x+side*48-14,a.y-5,28,10),recess,.018);
  }
  for(const opening of plan.openings) {
    chart.strip(opening.from,opening.to,7,base.clone().multiplyScalar(.70),.019);
    chart.strip(opening.from,opening.to,2,trim.clone().multiplyScalar(.74),.020);proof.thresholds++;
  }
  // Broad caps expose the actual polygon width. The existing .90m near face
  // remains visible beneath this lighter lip; no added wall enters a lane.
  for(const polygon of t.voids??[]) {
    const xs=polygon.map(p=>p.x),ys=polygon.map(p=>p.y);
    if((Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys))>180000)continue;
    const shape=new T.Shape(polygon.map(p=>new T.Vector2(p.x/32,-p.y/32)));
    push(new T.ShapeGeometry(shape).rotateX(-Math.PI/2).translate(0,.916,0),profile.trim,hardware,true);proof.wallCaps++;
    for(let i=0;i<polygon.length;i++) {
      const p=polygon[i],q=polygon[(i+1)%polygon.length];
      chart.strip(p,q,10,new T.Color(0x26343a),.021);
    }
  }
  if(profile.kind==='ventilation')for(const polygon of t.voids??[]) {
    const xs=polygon.map(p=>p.x/32),zs=polygon.map(p=>p.y/32),cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2;
    // The former air plenums are recognisable even when only one cropped
    // corner is visible: captive duct mouths, thick ribs and seam-bound cysts.
    const facing=cz<t.height/64?1:-1;
    for(const offset of [-2.1,0,2.1]){
      const plate=new T.BoxGeometry(1.75,.018,1.25).translate(cx+offset,.931,cz);
      plate.computeBoundingBox();if(kitBoundsSupported(t,plate.boundingBox!))push(plate,0x526559);else plate.dispose();
      for(const side of [-1,1])box(cx+offset+side*.66,.944,cz+.38,.12,.018,.07,0x839183);
    }
    for(const offset of [-1.9,0,1.9]) {
      const g=new T.CylinderGeometry(.57,.57,.24,12).rotateX(Math.PI/2).translate(cx+offset,.57,cz+facing*1.6);
      g.computeBoundingBox();if(kitBoundsSupported(t,g.boundingBox!))push(g,0x263a36);else g.dispose();
      box(cx+offset,.58,cz+facing*1.4,.92,.72,.055,0x768278);
      for(let n=-2;n<=2;n++)box(cx+offset+n*.15,.58,cz+facing*1.44,.045,.62,.10,0x32483d);
    }
    const path=new T.CatmullRomCurve3([new T.Vector3(cx-2.6,.91,cz-.6),new T.Vector3(cx-1.4,.96,cz+.3),new T.Vector3(cx+.2,.93,cz+.55),new T.Vector3(cx+2.7,.89,cz+.8)]);
    const rootTube=new T.TubeGeometry(path,15,.12,6,false);rootTube.computeBoundingBox();
    if(kitBoundsSupported(t,rootTube.boundingBox!))push(rootTube,0x645360);else rootTube.dispose();
  }
  const hull=kitHull(t);
  // Clipped base shadows and a wider exterior cap give hull walls weight too.
  for(let i=0;i<hull.length;i++) {
    const p=hull[i],q=hull[(i+1)%hull.length],dx=(q.x-p.x)/32,dz=(q.y-p.y)/32,length=Math.hypot(dx,dz);
    if(length<.3)continue;
    const nx=dz/length,nz=-dx/length,h=dx>0?1.65:dx<0?.48:.85;
    box((p.x+q.x)/64+nx*.24,h+.035,(p.y+q.y)/64+nz*.24,length,.07,.48,profile.trim,-Math.atan2(dz,dx),hardware,true);
    chart.strip(p,q,14,new T.Color(0x26343a),.021);
  }
  proof.floor=chart.zones;
  const floor=new T.Mesh(chart.geometry(),floorMaterial);floor.name='e9-named-space-decks';floor.receiveShadow=true;root.add(floor);

  // Candidate backing faces include hull, partition and native equipment. A
  // cluster is only accepted when its whole raised footprint is solid-backed.
  const surfaces=[{name:'hull',polygon:hull},...(t.voids??[]).map((p,i)=>({name:'partition '+i,polygon:p})),...t.obstacles.map((r,i)=>({name:'equipment '+i,polygon:rect(r.x,r.y,r.width,r.height)}))];
  const used:{x:number;z:number;scale:number}[]=[];
  for(const [index,space]of plan.spaces.entries()) {
    const candidates:{x:number;z:number;angle:number;score:number;backing:string;scale:number}[]=[];
    for(const surface of surfaces)for(let i=0;i<surface.polygon.length;i++) {
      const p=surface.polygon[i],q=surface.polygon[(i+1)%surface.polygon.length],dx=(q.x-p.x)/32,dz=(q.y-p.y)/32,length=Math.hypot(dx,dz);
      if(length<.95)continue;
      const scale=Math.min(1,(length-.10)/5.2);
      const ux=dx/length,uz=dz/length,px=p.x/32,pz=p.y/32,projection=(space.anchor.x/32-px)*ux+(space.anchor.y/32-pz)*uz;
      for(const shift of [0,-5.6,5.6])for(const sign of [-1,1]) {
        const along=T.MathUtils.clamp(projection+shift,2.6*scale,length-2.6*scale),x=px+ux*along-uz*.42*scale*sign,z=pz+uz*along+ux*.42*scale*sign;
        // Bounds of rotated equipment are checked as well; conservative for corners.
        const angle=-Math.atan2(dz,dx),g=new T.BoxGeometry(5.2*scale,.85,.68*scale).rotateY(angle).translate(x,.475,z);g.computeBoundingBox();const safe=kitBoundsSupported(t,g.boundingBox!);g.dispose();
        if(!safe||used.some(p=>Math.hypot(p.x-x,p.z-z)<2.6*(p.scale+scale)))continue;
        candidates.push({x,z,angle,scale,backing:surface.name,score:Math.hypot(space.anchor.x/32-x,space.anchor.y/32-z)+(Math.abs(dz)>Math.abs(dx)?2.0:0)+1/scale});
      }
    }
    const mount=candidates.sort((a,b)=>a.score-b.score)[0];
    if(!mount)continue;
    used.push(mount);
    const {x,z,angle,scale}=mount,ca=Math.cos(angle),sa=Math.sin(angle),bounds:number[][][]=[];
    const piece=(lx:number,y:number,lz:number,w:number,h:number,d:number,color:number,m=furnishing)=>{
      const g=new T.BoxGeometry(w*scale*2.2,h,d*scale).rotateY(angle).translate(x+(lx*2.2*ca+lz*sa)*scale,y,z+(-lx*2.2*sa+lz*ca)*scale);g.computeBoundingBox();
      if(!kitBoundsSupported(t,g.boundingBox!)){g.dispose();return;}
      bounds.push([g.boundingBox!.min.toArray(),g.boundingBox!.max.toArray()]);push(g,color,m);
    };
    // Low manufactured silhouettes: drawers, recessed instrument faces, sensor
    // poles and service fixtures stay below the actor-hiding cutaway datum.
    piece(0,.12,0,2.32,.24,.66,0x26343a,hardware);
    piece(-.57,.48,0,1.10,.52,.60,profile.kind==='ventilation'?0x59665b:0x5c6d70);
    piece(.60,.40,0,1.04,.36,.60,0x43565d);
    piece(-.57,.76,0,1.14,.045,.64,profile.trim);
    if(profile.kind==='diagnostics') {
      piece(-.70,.795,-.11,.64,.045,.30,0x24353b);
      piece(.76,.65,-.16,.055,.40,.055,profile.trim);
      piece(.54,.83,-.16,.48,.055,.055,profile.trim);
      piece(.31,.76,-.16,.055,.15,.055,0x26343a);
    }else if(profile.kind==='checkpoint') {
      piece(-.64,.68,-.18,.65,.24,.10,0x27363d);
      piece(.65,.78,-.18,.13,.22,.20,profile.trim);
      piece(.65,.82,-.04,.09,.065,.035,profile.key,lamp);
    }else {
      for(let n=-3;n<=3;n++)piece(n*.27,.69,.015,.11,.025,.48,0x263a35);
      // Rooted, thick growth lies on the existing vent casing, not on walkable deck.
      for(let n=0;n<3;n++) {
        const g=new T.SphereGeometry(.16+n*.025,7,4).scale(1.8*scale,.65,scale).translate(x+(.3+n*.21)*ca*scale,.77,z-(.3+n*.21)*sa*scale);
        g.computeBoundingBox();if(kitBoundsSupported(t,g.boundingBox!)){bounds.push([g.boundingBox!.min.toArray(),g.boundingBox!.max.toArray()]);push(g,0x655360);}else g.dispose();
      }
    }
    piece(0,.875,-.19,1.70,.10,.14,0x26343a,hardware);
    piece(0,.888,-.16,1.43,.035,.055,profile.key,lamp);
    const fx=x-.16*sa,fz=z-.16*ca;
    proof.fixtures.push({x:fx,y:.89,z:fz,color:index%3===1?0xbeb5a2:profile.key,nativeColor:true,poolStyle:1,poolAngle:angle,poolWidth:.48,poolDepth:5.5,gain:index%3===2?.22:.44});
    proof.clusters.push({space:space.name,purpose:profile.kind+' '+space.name,backing:mount.backing,position:[x,z],angle,scale,kind:profile.kind,pieces:bounds.length,bounds});
  }
  const niches=proof.clusters.filter(c=>!c.backing.startsWith('equipment')).map(c=>({x:c.position[0],z:c.position[1],angle:c.angle,scale:c.scale}));
  for(const [m,parts]of bins) {
    for(let i=0;i<parts.length;i++)if(parts[i].userData.interiorWall){const old=parts[i];parts[i]=cutInteriorWallNiches(old,niches);old.dispose();}
    const g=mergeGeometries(parts,false)!;parts.forEach(p=>p.dispose());
    const mesh=new T.Mesh(g,m);mesh.name=m.name;mesh.castShadow=mesh.receiveShadow=true;mesh.userData.bakedEnvironment=true;root.add(mesh);
  }
  if(!bins.has(furnishing))furnishing.dispose();if(!bins.has(lamp))lamp.dispose();if(!bins.has(hardware))hardware.dispose();
  root.traverse(o=>{if(o instanceof T.Mesh)proof.triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;});
  // Native wall volumes remain the authoritative support footprint. Only their
  // presentation skin opens around the captive equipment, never a new route.
  if(world&&niches.length)world.traverse(o=>{
    if(!(o instanceof T.Mesh)||Array.isArray(o.material)||!['ship-interior-cutaway','ship-bulkhead','ship-bulkhead-ribs'].includes(o.material.name))return;
    const old=o.geometry;o.geometry=cutInteriorWallNiches(old,niches);old.dispose();
  });
  root.userData.lightFixtures=proof.fixtures;root.userData.interior=proof;root.userData.environment=shipEnvironment(id);return root;
}
