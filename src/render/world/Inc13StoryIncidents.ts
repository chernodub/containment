import {environmentClock} from '../lighting/HotFixtureSurface';
import * as T from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {paintVeinedMembrane} from './Inc13ResinFloor';
import {paintIncidentDeck} from './Inc13DeckPaint';

type Brush=CanvasRenderingContext2D;
type Point3=[number,number,number];

function fill(c:Brush,path:string,color:string|CanvasGradient):void {
  c.fillStyle=color;c.fill(new Path2D(path));
}
function stroke(c:Brush,path:string,color:string,width:number):void {
  c.strokeStyle=color;c.lineWidth=width;c.stroke(new Path2D(path));
}

/** Original props use room units throughout, including height. One matte
 * vertex-colour batch per incident keeps individual rods and folds cheap. */
export class IncidentPieces {
  parts:T.BufferGeometry[]=[];
  add(g:T.BufferGeometry,color:number):void {
    const geo=g.index?g.toNonIndexed():g;
    if(g!==geo)g.dispose();
    const p=geo.getAttribute('position'),rgb=new T.Color(color),colors=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++)rgb.toArray(colors,i*3);
    geo.setAttribute('color',new T.BufferAttribute(colors,3));geo.deleteAttribute('uv');
    this.parts.push(geo);
  }
  box(x:number,y:number,z:number,w:number,h:number,d:number,color:number,yaw=0,roll=0):void {
    const g=new T.BoxGeometry(w,h,d);
    g.rotateZ(roll);g.rotateY(yaw);g.translate(x,y,z);this.add(g,color);
  }
  rod(a:Point3,b:Point3,r:number,color:number):void {
    const from=new T.Vector3(...a),to=new T.Vector3(...b),v=to.clone().sub(from);
    const g=new T.CylinderGeometry(r,r,v.length(),8);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));
    g.translate(...from.lerp(to,.5).toArray());this.add(g,color);
  }
  face(points:Point3[],color:number):void {
    const vertices:number[]=[];
    for(let i=1;i+1<points.length;i++)vertices.push(...points[0],...points[i],...points[i+1]);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
    g.computeVertexNormals();this.add(g,color);
  }
  finish(root:T.Group,id:string,x:number,z:number,finish?:T.Material,cutParts=false):T.Mesh {
    const geometry=mergeGeometries(this.parts,false)!;
    // Cut individual parts so a low trailing strip cannot hide a distant raised hinge.
    if(cutParts||['passenger-vault','ejected-leaf','folded-rib','torn-pallet'].includes(id)){
      let start=0;
      geometry.userData.cutawayRanges=this.parts.map(part=>{
        part.computeBoundingBox();
        const bounds=part.boundingBox!.clone();
        bounds.min.multiplyScalar(1/32);bounds.max.multiplyScalar(1/32);
        const end=start+part.attributes.position.count,range={start,end,bounds};
        start=end;return range;
      });
      geometry.setIndex(Array.from({length:start},(_,i)=>i));
      geometry.index!.setUsage(T.DynamicDrawUsage);
    }
    if(id.startsWith('lane-machine-')){
      const normals=geometry.attributes.normal,colors=geometry.attributes.color;
      for(let i=0;i<colors.count;i++){
        const gain=1+.38*Math.max(0,normals.getY(i));
        colors.setXYZ(i,Math.min(1,colors.getX(i)*gain),Math.min(1,colors.getY(i)*gain),Math.min(1,colors.getZ(i)*gain));
      }
    }
    const laneContactBounds=id.startsWith('lane-machine-')?this.parts.flatMap(part=>{
      part.computeBoundingBox();const box=part.boundingBox!;
      if(box.max.y<3||box.min.y>29||(box.max.x-box.min.x)*(box.max.z-box.min.z)<145)return [];
      const bounds=box.clone();bounds.min.multiplyScalar(1/32);bounds.max.multiplyScalar(1/32);return [bounds];
    }):undefined;
    this.parts.forEach(g=>g.dispose());geometry.scale(1/32,1/32,1/32);
    const material=finish??new T.MeshStandardMaterial({vertexColors:true,roughness:.86,metalness:.18,side:T.DoubleSide});
    material.userData.actorMaterial=true;
    const mesh=new T.Mesh(geometry,material);mesh.name='inc13-'+id;mesh.position.set(x/32,0,z/32);
    if(laneContactBounds)mesh.userData.laneContactBounds=laneContactBounds;
    mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
  }
}
interface Incident {
  source:[number,number];
  bounds:[number,number,number,number];
  paint:(c:Brush)=>void;
  pieces:(p:IncidentPieces)=>void;
}
const incidents:Record<string,Incident>={
  'passenger-vault':{
    source:[308,562],bounds:[-195,-28,286,174],
    paint(c){
      for(const x of [-12,12])stroke(c,'M'+x+' 14l-4 12','rgba(48,53,54,.5)',2);
    },
    pieces(p){
      // The open suitcase has fallen lid-first; its striped sleeve is caught
      // on the lip. The seated rabbit's long ears survive reduction to 480px.
      p.box(-32,6,49,43,10,31,0x9a6a44,-.18);
      p.box(-33,11,49,36,1,24,0x4b5049,-.18);
      p.box(-36,17,32,42,26,4,0xa68b6b,-.18,-.08);
      p.face([[-49,12,39],[-27,14,43],[-21,12,58],[-34,14,63],[-49,12,59]],0x92afab);
      p.face([[-49,12,59],[-34,14,63],[-31,2,75],[-52,2,72]],0x678c90);
      p.face([[-50,6,66],[-32,7,69],[-32,5,71],[-50,4,68]],0xdfcaa7);
      const plush=(x:number,h:number,z:number,w:number,y:number,d:number,color:number,tilt=0)=>{
        const g=new T.SphereGeometry(1,10,7);g.scale(w,y,d);g.rotateZ(tilt);p.add(g.translate(x,h,z),color);
      };
      plush(9,10,65,9,11,7,0xd8ae80);plush(9,22,65,9,8,7,0xd0aa76);
      plush(5,33,65,3.4,9,3,0xead4ad,.22);plush(14,32,65,3.5,8,3,0xdbc399,-.32);
      plush(9,20,71,5,4,3,0xe3cea1);plush(9,23,73,2,1.5,1.3,0x423a39);
      for(const x of [3,16])plush(x,4,71,5,4,6,0xba9574);
      // Drawer runners, an adult shoe, a child's shoe and a keepsake frame.
      for(const x of [-24,24])p.rod([x,9,-24],[x,8,23],1.3,0x78898b);
      p.face([[-21,9,-4],[12,9,-4],[17,9,9],[-19,9,11]],0x9eaaa0);
      p.face([[-19,9,11],[17,9,9],[16,2,22],[-23,2,27]],0x76867b);
      for(const [x,z,s] of [[-58,37,1],[-67,42,.62]]){
        p.box(x,2*s,z,8*s,4*s,14*s,0x555647,-.4);
        p.box(x+.7,4*s,z-2*s,6*s,3*s,7*s,0x73736a,-.4);
      }
      p.box(17,3,26,12,2,15,0x9a8c75,.18);
      p.box(17,4.2,26,9,.5,12,0x566f74,.18);
    },
  },
  'communal-atrium':{
    source:[565,425],bounds:[-206,-52,330,178],
    paint(c){
      for(const [x,z,r] of [[-13,7,7],[4,14,4],[11,12,2]]){c.fillStyle='rgba(42,41,32,.58)';c.beginPath();c.ellipse(x,z,r,r*.45,-.34,0,Math.PI*2);c.fill();}
    },
    pieces(p){
      for(const [x,z,s] of [[-72,64,1],[-90,50,.78],[-56,55,.60]]){
        for(let i=0;i<9;i++){const a=i*Math.PI/5,b=(i+1)*Math.PI/5;
          p.face([[x,1,z],[x+10*s*Math.cos(a),2,z+10*s*Math.sin(a)],[x+10*s*Math.cos(b),2,z+10*s*Math.sin(b)]],0xb1ad95);}
      }
      p.rod([-112,1.2,74],[-96,1.2,79],1.2,0x929b91);
    },
  },
  'crew-checkpoint':{
    source:[606,338],bounds:[-331,-87,406,228],
    paint(c){
      const soot=c.createRadialGradient(-62,44,6,-62,44,79);
      soot.addColorStop(0,'rgba(23,24,25,.91)');
      soot.addColorStop(1,'rgba(47,38,32,0)');
      c.save();c.translate(-62,44);c.rotate(-.23);c.scale(1,.56);c.translate(62,-44);
      c.fillStyle=soot;c.fillRect(-141,-35,158,158);c.restore();
      fill(c,'M-102 38l22 -12 7 6 18 -10 12 9 32 5 -21 11 -18 -1 -13 11 -17 -6 -22 3Z','rgba(29,26,26,.82)');
      for(const d of ['M-80 41l-20 -8 -13 3 -15 -6','M-53 45l-6 15 -19 5 -4 10','M-36 34l14 -12 17 -3']){
        stroke(c,d,'rgba(21,25,26,.74)',2.5);
      }
    },
    pieces(p){
      // Telescoping checkpoint leaves have folded toward the baggage conveyor.
      for(let i=0;i<4;i++){
        const x=-78+i*23,z=10-i*3,h=10+i*4;
        p.rod([x,2,z],[x+21,h,z-3],2.1,0x7e8c8b);
        p.rod([x,h,z],[x+21,2,z-3],2.1,0x656e70);
        p.box(x,2,z,12,4,9,0x454e50,.13);
      }
      p.box(15,21,-2,7,39,8,0x67797b,.14,.17);
      // The broken conveyor shoe spans the existing eastern incident blocker.
      p.box(11.5,5,2.5,49,10,15,0x536367);
      p.box(18,12,2.5,33,4,11,0x718182);
    },
  },
  'armory':{
    source:[379,609],bounds:[-140,-25,268,217],
    paint(c){
      fill(c,'M-28 -9l39 1 -1 21 -40 -3Z','rgba(43,47,48,.48)');
    },
    pieces(p){
      for(let i=0;i<3;i++){
        const x=-20+i*15;
        p.rod([x,18,3],[x+17,21,-23],2.2,0x343e42);
        p.box(x+4,18,-5,5,6,16,0x768989,-.52);
        p.box(x-3,15,8,5,6,9,0x424742,-.52);
      }
      p.face([[-38,0,9],[-22,32,-14],[17,32,-8],[5,0,18]],0x434b49);
      p.rod([-38,2,9],[-22,33,-14],1.5,0x83918b);
    },
  },
  'freight-hold':{
    source:[306,292],bounds:[-152,-32,363,216],
    paint(c){
      stroke(c,'M5 5l18 4 7 13 -8 5','rgba(42,37,33,.72)',4);stroke(c,'M26 19l14 4 4 9','rgba(63,59,51,.7)',2);
    },
    pieces(p){
      // High back stack retains its corner posts; the sling has slipped off
      // one corner and hangs down across the forward fallen load.
      for(const x of [-23,22]){
        p.rod([x,1,-16],[x,71,-16],2.6,0x626a64);
        p.rod([x,62,-16],[x,69,12],2,0x8a8873);
      }
      p.box(0,41,-3,42,27,30,0x5f6358,.035);
      p.box(-7,65,-7,40,21,29,0x777359,-.10,.12);
      for(const x of [-21,8])p.face([[x,74,-16],[x+4,74,-16],[x+10,68,10],[x+7,68,12]],0xbbb193);
      p.rod([10,66,11],[26,25,26],1.9,0x9b947a);p.rod([26,25,26],[54,1,45],1.9,0x928c79);
    },
  },
  'breached-loading-bay':{
    source:[511,490],bounds:[-236,-63,366,234],
    paint(c){
      // A stripped rectangular plate seat remains flush on the loading apron.
      fill(c,'M-9 15l53 11 -14 39 -24 -6 -6 5 -22 -7Z','#414c51');
      stroke(c,'M-9 15l53 11 -14 39 -24 -6','rgba(167,178,174,.63)',2.4);
      for(const [x,z] of [[-5,20],[37,29],[24,57],[-14,49]]){
        c.fillStyle='#29363b';c.fillRect(x,z,4,3);
      }
      for(const x of [-14,2,17])stroke(c,'M'+x+' 9l-17 14','rgba(81,87,88,.55)',2);
    },
    pieces(p){
      // Paired faces fold over real transverse ribs; the jagged inner edges
      // point into the tear while their roots stay under intact deck seams.
      for(let i=0;i<5;i++){
        const x=-32+i*20,z=27-i*11,h=17+21*Math.sin((i+1)*.56);
        p.face([[x-19,1,z+14],[x+1,1,z+18],[x+16,h*.66,z-3],[x+3,h,z-11],[x-9,h*.62,z-2]],0x677980);
        p.face([[x+3,h,z-11],[x+16,h*.66,z-3],[x+24,h+6,z-15],[x+11,h+10,z-23]],0x89989a);
        p.rod([x-21,2,z+12],[x+8,h*.58,z-15],2.9,0x46585e);
        p.rod([x+8,h*.58,z-15],[x+26,h*.36,z-28],2.9,0x46585e);
      }
    },
  },
  'relay-racks':{
    source:[584,421],bounds:[-276,-91,318,225],
    paint(c){
      for(const x of [-15,14])stroke(c,'M'+x+' -6l-14 24','rgba(47,54,55,.62)',2.3);
    },
    pieces(p){
      p.box(4,20,-2,24,27,40,0x3e4d50,-.15,.12);
      for(let i=0;i<8;i++){
        p.box(1,28,-18+i*4.4,22,2.4,2.2,0x657b79,-.15);
        p.rod([-6,27,-18+i*4.4],[-18,11,-19+i*3],1.1,0x526768);
        p.rod([-18,11,-19+i*3],[-30,1,-24+i*2],1.2,0x485c5c);
      }
    },
  },
  'transmission-chamber':{
    source:[865,482],bounds:[-279,-69,352,224],
    paint(c){
      for(let i=0;i<4;i++)fill(c,'M'+(-16+i*4)+' 17l7 2 -2 6 -7 -1Z','#6a706b');
    },
    pieces(p){
      p.box(-16,24,10,49,3,25,0x737f7d,-.11);for(const x of [-36,4])p.rod([x,1,9],[x,24,9],2.2,0x455354);
      p.box(-20,28,9,15,5,12,0x414c51,-.11);
      p.rod([-33,24,15],[-30,32,13],1.1,0x8e9384);p.box(-29,32,12,7,3,3,0x48595d,.18);
      // Open reel transport. The take-up flange broke loose and landed beside
      // the chair, leaving the recording threaded over the edge of the desk.
      p.box(-18,36,8,38,13,19,0x414f57,-.11);
      for(const [x,y,z,lean] of [[-26,45,8,.18],[-45,4,32,.09]]){
        const g=new T.CylinderGeometry(9,9,3.8,16);g.rotateX(lean);
        p.add(g.translate(x,y,z),0x9ca9a0);
        p.box(x,y+2.2,z,4,1,4,0x46525a);
        for(const a of [0,2.1,4.2])p.box(x+5*Math.cos(a),y+2,z+5*Math.sin(a),3.8,1,2,0x414c53,-a);
      }
      p.rod([-19,44,10],[-38,26,22],.9,0xa3a292);
      p.rod([-38,26,22],[-45,5,32],.9,0x939585);
      // Empty operator's chair lies behind the unspooling recorder.
      p.box(-55,6,29,16,5,15,0x536369,.55,.64);
      p.box(-61,9,22,4,15,15,0x667778,.55,.64);
    },
  },
  'diagnostic-gallery':{
    source:[362,338],bounds:[-184,-40,311,187],
    paint(c){
      // Splinters and the two caster stops mark where the pressure pane fell.
      for(const [x,z,turn,size] of [[-9,56,.3,1],[18,43,1.2,.85],[-28,67,2,.64],[31,58,.8,.45],[-6,79,-.4,.52],[9,65,2.1,.36]]){
        c.save();c.translate(x,z);c.rotate(turn);c.scale(size,size);
        fill(c,'M-12 -5l24 2 -14 15Z','rgba(96,136,143,.72)');
        stroke(c,'M-12 -5l24 2 -14 15','rgba(152,179,178,.76)',1.7);c.restore();
      }
      for(const x of [-16,14])stroke(c,'M'+x+' 20l-8 18','rgba(36,50,54,.8)',4);
      const wet=c.createRadialGradient(0,12,2,0,12,23);wet.addColorStop(0,'rgba(59,82,80,.8)');wet.addColorStop(1,'rgba(59,82,80,0)');c.fillStyle=wet;c.fillRect(-24,-12,48,48);
    },
    pieces(p){
      // The torn restraint leaves define the missing volume of the specimen.
      for(const s of [-1,1]){
        p.face([[s*25,7,-26],[s*26,9,17],[s*39,23,20],[s*42,35,-19]],0x8faba9);
        p.rod([s*25,7,15],[s*39,24,20],2.1,0x536867);
        p.rod([s*42,35,-19],[s*39,23,20],1.8,0xb1c2b8);
      }
      for(let i=0;i<3;i++){
        const x=-18+i*16;p.rod([x,18,-10],[x-6,26,8],1.5,0x52666b);
        p.rod([x-6,26,8],[x-13,19,20],1.25,0x939e97);
      }
    },
  },
  'safety-interlock-station':{
    source:[550,351],bounds:[-242,-44,303,205],
    paint(c){
      for(const x of [-9,3,12])stroke(c,'M'+x+' 4l-4 13','rgba(33,33,32,.66)',6);
    },
    pieces(p){
      // Massive dog bolts cross the welded split, two bent out of their seats.
      for(let i=0;i<3;i++){
        const y=18+i*14;
        p.box(1,y,0,47,4,5,0x77817a,.04,i===2?.14:0);
        for(const x of [-19,21])p.box(x,y,2,6,7,5,0x585e58);
      }
      p.rod([-8,7,5],[-28,28,11],2.4,0x9a977b);
      p.rod([-28,28,11],[-35,29,13],2.4,0x697477);
    },
  },
  'service-shaft-landing':{
    source:[325,560],bounds:[-214,-132,252,240],
    paint(c){
      stroke(c,'M-8 0q-9 7 -12 18','rgba(47,56,55,.59)',4);
    },
    pieces(p){
      p.rod([-26,0,7],[-23,38,3],3.2,0x798e87);
      p.rod([-23,38,3],[7,46,-4],3.2,0x9caa95);
      p.rod([7,46,-4],[18,27,-2],2.5,0x75857c);
      // The hoist cable is still tied into the northern lip. Its returned
      // end hangs free where the southern lifting eye pulled out.
      p.rod([4,11,-5],[12,35,-65],1.8,0x849a93);
      p.rod([12,35,-65],[9,49,-156],1.8,0x788b83);
      p.rod([9,49,-156],[4,39,-209],1.8,0x849a93);
      p.box(4,21,-209,15,40,19,0x50695f);
      p.box(4,41,-209,21,6,25,0x91a29a);
      // The return tackle reaches the lower balcony in the incident-facing view.
      p.rod([-13,16,4],[-38,8,144],3.6,0xa29b7f);
      p.rod([-38,8,144],[-72,5,173],3.6,0x879783);
      // A mostly upright sheave presents its open spokes to the incident camera.
      const wheel=(a:number):Point3=>[-40+34*Math.cos(a),25+23*Math.sin(a),145-23*Math.sin(a)];
      for(let i=0;i<24;i++){
        const a=i*Math.PI/12;
        p.rod(wheel(a),wheel(a+Math.PI/12),3.4,0xb8ae8c);
        if(i%4===0)p.rod([-40,25,145],wheel(a),2.8,0xb6b3a0);
      }
      p.box(-40,7,145,48,9,24,0x50675e,-.62);
      p.rod([-40,12,145],[-40,18,145],12,0xab9d75);
      p.box(-40,20,145,37,4,7,0xb9ad89,-.62);
      for(const z of [-24,24])p.rod([22,0,z],[22,-88,z],3.6,0x536663);
      for(const depth of [12,32,52,72])p.rod([22,-depth,-24],[22,-depth,24],2.8,0x82938a);
      // Torn landing comb and bent brackets fold down into the open shaft.
      for(let i=0;i<7;i++){
        const z=-25+i*9,h=5+5*Math.sin(i);
        p.face([[-7,1,z],[-7,1,z+7],[8,-h,z+8],[12,-h-5,z+3]],0x788780);
        p.rod([8,-h,z+4],[19,-h-12,z+6],1.5,0x586965);
      }
      p.rod([-22,3,-33],[-7,26,-31],2.4,0x849486);p.rod([-7,26,-31],[3,14,-3],2.4,0x849486);
    },
  },
  'swarm-junction':{
    source:[361,493],bounds:[-156,-120,422,285],
    paint(c){
      // Three lobes share the workshop membrane, with open fenestrae between veins.
      for(const [angle,length,width] of [[-.44,.46,.34],[.09,.49,.32],[.68,.38,.31]]){
        c.save();c.rotate(angle);c.scale(-length,width);c.translate(-669,-315);
        paintVeinedMembrane(c);c.restore();
      }
      const ends=c.createLinearGradient(35,0,215,74);
      ends.addColorStop(0,'#fff');ends.addColorStop(.64,'rgba(255,255,255,.76)');
      ends.addColorStop(1,'rgba(255,255,255,.22)');
      c.globalCompositeOperation='destination-in';c.fillStyle=ends;c.fillRect(-156,-120,422,285);
      c.globalCompositeOperation='source-over';
    },
    pieces(p){
      const wall:Point3=[-70,59,-39];
      for(const [dx,dy] of [[-7,0],[0,6],[6,-2]]){
        const torn:Point3=[-36+dx,26+dy,29];
        const crown:Point3=[-29+dx,61+dy,15];
        const bend:Point3=[-54+dx,69+dy,-20];
        p.rod(torn,crown,3.6,0x758b93);
        p.rod(crown,bend,3.2,0xb0b7ad);
        p.rod(bend,wall,2.6,0x708089);
        p.face([torn,crown,bend,[-39+dx,51+dy,-5]],0x655766);
      }
      for(let i=0;i<6;i++){
        const x=-31+i*12;
        p.face([[x,2,-10],[x+7,2,-10],[x+13,21+i%3*5,4],[x+8,25+i%3*5,6]],0x9aa7a6);
        p.rod([x+4,7,-7],[x+13,15,12],2.1,0x62435d);
      }
    },
  },
  'shielding-gate':{
    source:[496,422],bounds:[-190,-46,342,181],
    paint(c){
      fill(c,'M-95 65l28 -5 32 -24 -9 20 -29 25 -29 -4Z','rgba(95,106,117,.82)');
      stroke(c,'M-95 65l28 -5 32 -24','rgba(147,162,168,.72)',2);
      // Scraped arcs are the real swept paths of the failed shield leaves.
      // Polished ends stop where the broken carriages jammed.
      for(const side of [-1,1]){
        c.save();c.scale(side,1);
        for(let i=0;i<5;i++)stroke(c,'M'+(24+i*5)+' 3Q'+(47+i*8)+' '+(65+i*4)+' '+(123+i*3)+' '+(91+i*4),i%2?'rgba(131,142,141,.68)':'rgba(53,61,66,.77)',i%2?2:4);
        for(let i=0;i<9;i++){const x=83+i*5,z=67+i*3;c.fillStyle='#70797b';c.fillRect(x,z,4+i%3,1.4);}
        c.restore();
      }
    },
    pieces(p){
      // One leaf tore free and lies across its own carriage marks. An open
      // inspection slot separates the folded face from the sheared rail.
      const slab:Point3[]=[[-92,2,71],[-66,2,66],[-39,10,37],[-45,15,27],[-70,12,40],[-98,3,65]];
      p.face(slab,0x747e87);
      p.face([slab[0],slab[1],[-65,1,69],[-91,1,74]],0x3f4750);
      p.face([[-93,4,64],[-71,13,40],[-46,16,28],[-51,16,34],[-68,11,44]],0x9aa5aa);
      p.rod([-81,5,62],[-57,13,39],2,0x424c56);
      p.rod([-78,6,63],[-54,13,42],1.1,0x929998);
      for(const [x,z] of [[-98,78],[-86,82],[-68,74]])p.box(x,1.5,z,6,2,4,0x606e75,.41);
      // Lapped plates spread from the shield hinge like a partially closed iris.
      for(const s of [-1,1])for(let i=0;i<4;i++){
        const x=s*(10+i*15),h=45-i*5,z=i*4;
        p.face([[x,3,z],[x+s*19,2,z+4],[x+s*23,h*.67,z+4],[x+s*7,h,z]],i%2?0x697984:0x849499);
        p.rod([x+s*6,4,z+1],[x+s*10,h-2,z+2],1.8,0x46555f);
      }
    },
  },
  'containment-annulus':{
    source:[552,510],bounds:[-256,-165,303,327],
    paint(c){
      // The failed clamp lifted a crescent of poured deck. A jagged inside
      // fracture, dust and separated flakes interrupt the machined circles.
      const damage='M-12 -85 L-38 -62 -44 -66 -57 -43 -68 -41 -73 -30 -89 -24 -94 -10 -110 -4 -116 13 -109 27 -117 42 -106 48 -99 62 -84 65 -76 80 -54 83 -42 92 -21 91 L-35 79 -51 76 -61 62 -75 58 -77 46 -88 41 -84 29 -94 20 -88 8 -77 4 -74 -9 -59 -14 -54 -26 -43 -29 -37 -45 -24 -49 Z';
      const dust=c.createRadialGradient(-75,12,8,-75,12,116);
      dust.addColorStop(0,'rgba(121,133,130,.55)');dust.addColorStop(1,'rgba(109,123,119,0)');
      c.fillStyle=dust;c.fillRect(-191,-104,232,232);
      fill(c,damage,'rgba(41,54,56,.88)');
      for(const [x,z,w] of [[-51,-43,15],[-75,-23,10],[-88,-12,13],[-99,3,11],[-104,21,12],[-103,44,11],[-85,60,13],[-66,76,9]]){
        c.save();c.translate(x,z);c.rotate(z*.021);c.scale(w/12,w/12);
        fill(c,'M-9 -4 L-3 -8 9 -5 12 2 3 7 -6 6Z','#74807d');
        stroke(c,'M-9 -4l6 -4 12 3','rgba(169,176,164,.68)',1.4);c.restore();
      }
      for(const d of ['M-91 -23l-16 -6 -9 -18 -15 -4','M-112 15l-21 3 -11 -11 -27 7 -20 -8','M-107 42l-16 12 -3 13 -21 8','M-62 77l-7 16 4 9 -9 10']){
        stroke(c,d,'rgba(38,50,51,.83)',2.8);
      }
    },
    pieces(p){
      // Retaining bands peeled off the pressure housing expose their bolts.
      for(let i=0;i<4;i++){
        const z=-43+i*24;
        p.rod([9,22,z],[0,30,z+4],2.7,0x809493);
        p.rod([0,30,z+4],[-10,23,z+9],2.7,0x809493);
        p.rod([-10,23,z+9],[-13,5,z+12],2.7,0x697b79);
        p.box(-13,4,z+14,11,6,9,0x4c6261,-.15);
      }
    },
  },
  'overload-floor':{
    source:[485,477],bounds:[-295,-158,365,279],
    paint(c){
      const ash=c.createLinearGradient(6,0,-250,44);ash.addColorStop(0,'rgba(21,23,24,.93)');ash.addColorStop(1,'rgba(38,37,35,.43)');
      fill(c,'M31 -104 Q2 -68 -30 -60 L-49 -43 -86 -46 -112 -26 -156 -27 -180 -5 -246 4 -266 23 -228 19 -249 37 -194 34 -198 48 -157 41 -129 53 -108 40 -73 55 -49 41 -20 51 22 28Z',ash);
      const crack='M17 -73 L-24 -48 -29 -29 -65 -32 -84 -12 -125 -9 -142 8 -188 6 -210 20 -257 23';
      stroke(c,crack,'rgba(93,113,119,.57)',14);stroke(c,crack,'rgba(170,191,192,.72)',3.5);
      for(const d of ['M-28 -29l-15 31 -37 8 -4 27 -36 21','M-84 -12l-24 -21 -42 3 -22 -12','M-143 8l-4 24 -31 12 -9 18']){
        stroke(c,d,'rgba(23,30,32,.86)',5);stroke(c,d,'rgba(127,145,147,.56)',1.4);
      }
    },
    pieces(p){
      // Several buckled leaves share one diagonal seam. Their free corners
      // rise out of the perimeter, diminishing to flush skin toward the lane.
      for(let i=0;i<6;i++){
        const x=21-i*29,z=-56+i*11,h=16-i*2.3;
        p.face([[x-14,1,z-18],[x+15,1,z-22],[x+24,h,z-3],[x+8,h+3,z+7],[x-8,h*.72,z+5]],i%2?0x5d6260:0x707571);
        p.face([[x-8,h*.72,z+5],[x+8,h+3,z+7],[x+8,1,z+8],[x-8,1,z+6]],0x383d3d);
        p.rod([x-6,3,z+7],[x+11,4,z+5],1.8,0x9aadae);
      }
    },
  },
};

export function addStoryIncident(root:T.Group,room:RoomTemplate):void {
  const id=room.id,incident=incidents[id];if(!incident)return;
  const [x,z]=incident.source,[left,top,width,depth]=incident.bounds;
  paintIncidentDeck(root,'inc13-'+id+'-deck',[x+left,z+top,width,depth],c=>{
    // Clip deck paint to the authored hull. In particular the freight tear and
    // service shaft retain empty space beneath their structural dressing.
    const deck=new Path2D();
    const ring=(points:readonly {x:number;y:number}[])=>{
      points.forEach((p,i)=>{if(i===0)deck.moveTo(p.x,p.y);else deck.lineTo(p.x,p.y);});deck.closePath();
    };
    if(room.boundary)ring(room.boundary);else deck.rect(0,0,room.width,room.height);
    for(const hole of room.voids??[])ring(hole);
    c.clip(deck,'evenodd');
    c.translate(x,z);c.lineJoin='round';c.lineCap='round';incident.paint(c);
  },id==='containment-annulus'||id==='crew-checkpoint'?.022:.021);
  if(id==='swarm-junction') addLivingPlenum(root,x,z);
  if(id==='overload-floor')addOverloadVents(root,x,z);
  const pieces=new IncidentPieces();incident.pieces(pieces);const hero=pieces.finish(root,id,x,z,undefined,id==='service-shaft-landing');
  if(id==='communal-atrium')hero.scale.y=.22; // plate shards lie flat beyond the bench
}

/** Short plasma vents stay within the torn perimeter plates. Share one
 * emissive mesh for the fissure and one for the two emergency repeaters. */
function addOverloadVents(root:T.Group,x:number,z:number):void {
  const vents=new IncidentPieces(),strobes=new IncidentPieces();
  for(let i=0;i<6;i++){
    const px=21-i*29,pz=-56+i*11;
    vents.face([[px-8,2,pz+6],[px+7,2,pz+7],[px+11,5+i%2*4,pz+5],[px,4,pz+4]],0xadc8cf);
  }
  for(const [px,pz] of [[-61,-22],[18,-64]]){
    strobes.box(px,6,pz,6,1.6,2,0xbac9c8);
  }
  for(const [parts,flash] of [[vents,false],[strobes,true]] as const){
    const geo=mergeGeometries(parts.parts,false)!;parts.parts.forEach(g=>g.dispose());geo.scale(1/32,1/32,1/32);
    const material=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,depthWrite:false});
    material.userData.actorMaterial = true;
    const mesh=new T.Mesh(geo,material);mesh.position.set(x/32,0,z/32);
    mesh.name=flash?'inc13-overload-repeaters':'inc13-plasma-vents';
    mesh.onBeforeRender=()=>{
      const t=environmentClock.value,phase=t%2.2;
      material.opacity=flash?(phase<.10||(phase>.32&&phase<.42)?.9:.22):.51+.15*Math.sin(t*9)+.08*Math.sin(t*27);
    };root.add(mesh);
  }
}

function addLivingPlenum(root:T.Group,x:number,z:number):void {
  const flesh=new IncidentPieces(),veins=new IncidentPieces();
  // One continuous knot climbs from under the displaced plates to the duct bank.
  for(const offset of [-13,0,12]){
    const path=new T.CatmullRomCurve3([
      new T.Vector3(35+offset,1,20+offset*.8),new T.Vector3(offset,7,0),
      new T.Vector3(-22+offset,28,-16),new T.Vector3(-16+offset,48,-37),
      new T.Vector3(-37+offset,58,-64),new T.Vector3(-79+offset,46,-146)]);
    flesh.add(new T.TubeGeometry(path,18,8,7,false),0x49223f);
    // Swollen muscle under the casing tapers into the first deck plate.
    const bulb=new T.SphereGeometry(1,12,9).scale(8,8,24);
    bulb.rotateX(.62);bulb.rotateY(offset*.035);
    flesh.add(bulb.translate(offset+4,15,5+offset*.65),0x752752);
    const ridge=path.points.map(p=>new T.Vector3(p.x+1,p.y+6,p.z+3));
    veins.add(new T.TubeGeometry(new T.CatmullRomCurve3(ridge),18,2.4,6,false),0xde69b6);
    const node=new T.SphereGeometry(1,10,7).scale(4,8,4);
    const at=path.getPoint(.40+offset*.011);
    veins.add(node.translate(at.x,at.y+6,at.z+5),0xffb9e3);
  }
  const runout=new T.CatmullRomCurve3([new T.Vector3(-34,36,-29),new T.Vector3(-17,31,-19),
    new T.Vector3(-3,17,0),new T.Vector3(17,9,11),new T.Vector3(33,6,18)]);
  veins.add(new T.TubeGeometry(runout,20,2.6,7,false),0xf1b6ce);
  for(const [batch,glow] of [[flesh,false],[veins,true]] as const){
    const mesh=batch.finish(root,glow?'plenum-veins':'plenum-mantle',x,z) as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
    mesh.material.roughness=.24;mesh.material.emissive.setHex(glow?0xcc409d:0x701040);
    mesh.material.emissiveIntensity=glow?.43:.45;
    mesh.castShadow=!glow;
    if(glow)mesh.onBeforeRender=()=>{mesh.material.emissiveIntensity=.46+.13*Math.sin(environmentClock.value*1.45);};
  }
}
