import {environmentClock} from '../lighting/HotFixtureSurface';
import * as T from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
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
class IncidentPieces {
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
  finish(root:T.Group,id:string,x:number,z:number):void {
    if(!this.parts.length)return;
    const geometry=mergeGeometries(this.parts,false)!;
    this.parts.forEach(g=>g.dispose());geometry.scale(1/32,1/32,1/32);
    const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.86,metalness:.18,side:T.DoubleSide});
    material.userData.actorMaterial=true;
    const mesh=new T.Mesh(geometry,material);mesh.name='inc13-'+id;mesh.position.set(x/32,0,z/32);
    mesh.receiveShadow=true;root.add(mesh);
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
    source:[366,368],bounds:[-195,-28,286,174],
    paint(c){
      // The woven wrap hangs out of Voss's drawer and was pulled in a broad
      // turn down the aisle. A family of embroidered birds marks its hem.
      const blanket=new Path2D('M-20 -3 Q-27 23 -57 27 L-72 30 Q-78 46 -106 45 Q-141 43 -168 72 L-177 83 -168 81 -164 87 -156 86 -147 92 Q-127 69 -98 74 Q-59 80 -42 56 Q-29 45 0 49 Q20 47 23 21 L16 0 Z');
      c.fillStyle='rgba(105,127,123,.85)';c.fill(blanket);c.save();c.clip(blanket);
      for(let i=0;i<7;i++)stroke(c,'M-181 '+(70+i*5)+'Q-142 '+(43+i*4)+' -99 '+(47+i*4)+' T-44 '+(30+i*4)+' Q-8 '+(39+i*3)+' 21 '+(-2+i*4),i%3?'#616f6d':'#a2a591',i%3?1.4:2.7);
      for(let i=0;i<8;i++){const x=-153+i*15,z=68-i*3+3*Math.cos(i);stroke(c,'M'+x+' '+z+'q3 -4 6 0q2 -5 5 -4','#b2ac94',1.4);}
      c.restore();
      for(let i=0;i<11;i++)for(const [offset,size] of [[0,1],[16,.63]]){
        c.save();c.translate(-29-i*11,58+i*5+offset+(i%2)*4);c.rotate(-.35);c.scale(size,size);
        c.fillStyle='rgba(20,37,42,.56)';c.beginPath();c.ellipse(0,0,4,2.1,0,0,Math.PI*2);c.fill();c.restore();
      }
    },
    pieces(p){
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
      // An overturned dining table has pulled its long striped cloth around
      // the planter. Soil and knocked cups interrupt the original pattern.
      const cloth=new Path2D('M26 -12 Q7 17 -32 20 L-57 31 Q-88 18 -118 35 L-179 60 -166 73 -172 88 -153 87 -145 100 Q-105 77 -80 85 Q-47 89 -22 63 Q15 44 55 55 L67 29 52 25 58 6Z');
      c.save();c.clip(cloth);c.fillStyle='#797562';c.fillRect(-206,-52,330,178);
      for(let i=0;i<15;i++)stroke(c,'M'+(-186+i*17)+' 123q22 -22 6 -55t12 -60','#616c63',3.5);
      for(let i=0;i<4;i++)stroke(c,'M-181 '+(75+i*5)+'Q-104 '+(40+i*5)+' -79 '+(54+i*5)+'T-6 '+(36+i*5)+'Q30 '+(21+i*4)+' 79 '+(29+i*4),'#a39a7c',1.7);
      c.restore();for(let i=0;i<115;i++){
        const x=22-i*.88+19*Math.sin(i*4),z=5+i*.38+13*Math.cos(i*7.18);
        c.fillStyle='rgba(47,50,35,.67)';c.fillRect(x,z,1+i%5,1+i%3);
      }
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
      // Skid rubber bunches at the foot of the jam, then diverges along the
      // inspection lane. Short crosswise scuffs record the wheels turning.
      const grime=c.createLinearGradient(-295,70,-20,5);
      grime.addColorStop(0,'rgba(41,48,49,.13)');grime.addColorStop(1,'rgba(37,43,44,.66)');
      fill(c,'M33 -28 Q-48 -7 -82 12 Q-124 36 -183 32 L-260 62 -289 79 -263 75 -275 94 Q-215 78 -177 71 Q-99 82 -48 45 L20 22Z',grime);
      for(let i=0;i<4;i++)stroke(c,'M'+(18-i*3)+' '+(4+i*8)+'C-88 '+(23+i*6)+' -86 '+(69+i*6)+' -175 '+(58+i*6)+'S-240 '+(85+i*5)+' -299 '+(92+i*4),'rgba(42,47,45,.69)',2.6);
      for(let i=0;i<12;i++){c.fillStyle='rgba(106,110,99,.63)';c.fillRect(-63-i*12,35+i*2,3,i%3+3);}
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
    },
  },
  'armory':{
    source:[273,336],bounds:[-140,-25,268,217],
    paint(c){
      const foam=new Path2D('M-32 -2 L48 14 45 32 31 33 Q13 65 -2 102 L-55 142 -91 132 -67 111 -68 91 -34 66 -36 46 -49 37Z');
      c.fillStyle='rgba(68,76,76,.88)';c.fill(foam);
      // The extracted issue tray shows three human-scale weapon-shaped recesses.
      for(let i=0;i<3;i++){
        c.save();c.translate(-15-i*18,15+i*33);c.rotate(.32+i*.12);
        fill(c,'M-20 -5 -9 -5 -6 -8 7 -8 8 -5 27 -5 27 -2 12 -2 10 2 3 2 3 7 -2 6 -4 2 -14 1 -18 5 -22 4Z','#232c30');
        stroke(c,'M-20 -6l12 0 3 -3 13 0','#7c8988',1);c.restore();
      }
      stroke(c,'M-7 22 Q-73 83 -97 148 T-128 175','rgba(86,89,82,.62)',3);
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
      const dirt=c.createLinearGradient(0,0,168,145);dirt.addColorStop(0,'rgba(116,99,69,.64)');dirt.addColorStop(1,'rgba(107,92,68,.14)');
      fill(c,'M-43 -18 Q19 -6 53 18 L102 63 165 74 191 110 155 103 179 132 133 121 129 141 76 97 45 86 -5 38Z',dirt);
      for(const offset of [-13,12])stroke(c,'M-23 '+offset+' C24 '+(12+offset)+' 65 '+(61+offset)+' 109 '+(68+offset)+' S158 '+(84+offset)+' 181 '+(115+offset),'rgba(49,49,41,.76)',5);
      stroke(c,'M27 11Q-30 60 -54 89T-128 139','#615b4a',3);
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
    source:[485,427],bounds:[-236,-63,366,234],
    paint(c){
      // Oil and paint follow the peel direction toward the torn plating lip.
      fill(c,'M68 -46 Q21 9 -7 31 Q-42 51 -85 75 L-171 118 -138 109 -167 138 -109 118 -148 155 -84 127 Q-40 84 32 54 L88 5Z','rgba(48,58,59,.73)');
      for(let i=0;i<10;i++)stroke(c,'M'+(57+i*5)+' '+(-30+i*2)+' Q'+(-10+i*4)+' '+(50+i*2)+' '+(-62+i*3)+' '+(69+i*3)+' T'+(-196+i*6)+' '+(137+i*2),'rgba(118,126,123,.40)',i%3?1.3:2.8);
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
      // A whole patch loom has been pulled out as one folded bight. Several
      // strands are still bound together before their connectors spread apart.
      for(let i=0;i<11;i++){
        const k=i-5;
        const d='M10 '+(-22+k*2)+'C-38 '+(-41+k*2)+' -51 '+(44+k*2)+' -113 '+(48+k*2)+' S-220 '+(21+k*2.2)+' -234 '+(52+k*2)+' C-250 '+(91+k*2)+' -156 '+(108+k*2.4)+' -127 '+(81+k*3)+' Q-89 '+(48+k*4)+' -54 '+(72+k*6);
        stroke(c,d,'rgba(14,30,32,.85)',4.4);stroke(c,d,i%4===0?'#657c79':'#475c5b',2.2);
        c.fillStyle='#829087';c.fillRect(-55,69+k*6,5,3.5);
      }
      for(const [x,z] of [[-71,33],[-145,49],[-216,40]]){c.save();c.translate(x,z);c.rotate(-.18);c.fillStyle='#8e9584';c.fillRect(-2,-12,4,25);c.restore();}
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
    source:[903,397],bounds:[-279,-69,352,224],
    paint(c){
      // The last message has run off a strip printer. The long accordion fold
      // sits in slack loops of the uplink lead, still plugged into the desk.
      stroke(c,'M0 -10 C-49 36 -48 2 -81 15 S-151 45 -128 69 C-106 94 -58 61 -91 53 S-188 102 -242 87','#323f49',4.8);
      for(let i=0;i<16;i++){
        const x=-i*12,z=16+41*Math.sin(i*.20)+i*2,zz=16+41*Math.sin((i+1)*.20)+(i+1)*2;
        fill(c,'M'+x+' '+z+'l-1 13 -12 '+(zz-z)+' 1 -13Z',i%2?'#92948a':'#777f7b');
        c.fillStyle='rgba(45,62,66,.72)';c.fillRect(x-10,z+4,7-i%3,1.4);c.fillRect(x-9,z+7,5,1);
      }
    },
    pieces(p){
      p.box(-16,24,10,49,3,25,0x737f7d,-.11);for(const x of [-36,4])p.rod([x,1,9],[x,24,9],2.2,0x455354);
      p.box(-20,28,9,15,5,12,0x414c51,-.11);
      p.rod([-33,24,15],[-30,32,13],1.1,0x8e9384);p.box(-29,32,12,7,3,3,0x48595d,.18);
      // Empty operator's chair lies behind the unspooling recorder.
      p.box(-55,6,29,16,5,15,0x536369,.55,.64);
      p.box(-61,9,22,4,15,15,0x667778,.55,.64);
    },
  },
  'diagnostic-gallery':{
    source:[362,338],bounds:[-184,-40,311,187],
    paint(c){
      const albumen=c.createLinearGradient(0,9,-138,95);
      albumen.addColorStop(0,'rgba(111,142,138,.76)');albumen.addColorStop(1,'rgba(70,103,101,.42)');
      fill(c,'M-23 4 Q1 1 21 12 Q50 30 18 43 Q-4 48 -23 46 Q-52 55 -48 72 Q-54 89 -84 86 Q-99 79 -113 98 Q-145 117 -158 101 Q-178 87 -148 76 Q-125 67 -106 72 Q-85 73 -83 50 Q-79 30 -51 31 Q-28 31 -23 4Z',albumen);
      for(let i=0;i<8;i++)stroke(c,'M'+(-4-i*9)+' '+(28+i*5)+'q-8 8 -23 9','rgba(171,195,185,.43)',1.5);
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
      // A portable welding blanket was dragged out from under the fused door.
      // Steel grit fans from the seam and burns small islands through the cloth.
      const cloth=new Path2D('M-39 -1 7 7 -5 36 -45 49 Q-83 63 -97 95 L-151 123 -182 100 -165 86 -176 78 -132 54 -109 35 -79 27Z');
      c.save();c.clip(cloth);c.fillStyle='#6c7163';c.fillRect(-242,-44,303,205);
      for(let i=0;i<38;i++){
        const x=-20-i*3.7,z=14+i*2.25+14*Math.sin(i*2.15),r=2+i%4;
        c.fillStyle='rgba(44,42,39,.7)';c.beginPath();c.ellipse(x,z,r,1+r*.55,-.36,0,Math.PI*2);c.fill();
      }c.restore();
      for(let i=0;i<5;i++)stroke(c,'M12 '+(-4+i*2)+'Q-53 '+(14+i*3)+' -77 '+(53+i*5)+'T-158 '+(93+i*6),'rgba(89,80,62,.56)',1.4);
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
    source:[332,456],bounds:[-214,-132,252,240],
    paint(c){
      // One torn lift rope has run back over the landing. A second, still
      // captive on the drum, ends in a tight loaded loop at the shaft edge.
      for(let i=0;i<3;i++){
        const d='M3 '+(-69+i*3)+'C-30 -51 -20 -24 -49 -12 S-142 -33 -158 9 C-173 55 -91 69 -68 45 S-33 11 -16 14';
        stroke(c,d,'#354444',5);stroke(c,d,i===0?'#8d9282':'#667774',2);
      }
      for(let i=0;i<7;i++)stroke(c,'M-157 10 Q-171 '+(20+i*3)+' '+(-185+i*2)+' '+(14+i*6),'rgba(129,138,126,.78)',1.4);
      for(const off of [-8,5])stroke(c,'M-3 '+(23+off)+'Q-64 '+(25+off)+' -97 '+(51+off)+'T-171 '+(76+off),'rgba(94,100,89,.60)',3.3);
    },
    pieces(p){
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
    source:[310,377],bounds:[-166,-52,320,233],
    paint(c){
      const web=new Path2D('M-118 -25 Q-68 -2 -48 -13 Q-26 -7 -16 -35 Q3 2 28 -13 L58 -28 Q40 13 73 12 Q109 10 127 -1 Q97 27 67 46 Q38 48 29 79 Q20 92 -7 95 Q-39 106 -39 138 Q-55 158 -96 173 Q-61 137 -72 119 Q-71 93 -113 102 Q-92 83 -76 62 Q-62 40 -96 42 L-139 55 Q-94 28 -101 14Z');
      c.save();c.clip(web);const g=c.createLinearGradient(0,-25,-57,155);g.addColorStop(0,'#614964');g.addColorStop(1,'rgba(61,46,61,.66)');c.fillStyle=g;c.fillRect(-166,-52,320,233);
      for(let i=0;i<15;i++){
        const x=-105+(i*47)%210,z=3+(i*29)%125;
        c.globalCompositeOperation='destination-out';fill(c,'M'+x+' '+z+'q14 -8 25 -7 -10 7 -18 17 -11 7 -7 -10Z','rgba(0,0,0,.86)');
        c.globalCompositeOperation='source-over';
      }c.restore();
      for(let i=0;i<4;i++)stroke(c,'M'+(-64+i*25)+' 0 Q'+(-74+i*27)+' 54 '+(-53+i*8)+' 80 T'+(-96+i*7)+' '+(164-i*8),'rgba(112,85,112,.68)',3.2-i*.45);
    },
    pieces(p){
      // Split vent louvers remain embedded in the same membrane as the nest.
      for(let i=0;i<6;i++){
        const x=-31+i*12;
        p.face([[x,2,-10],[x+7,2,-10],[x+13,21+i%3*5,4],[x+8,25+i%3*5,6]],0x64686b);
        p.rod([x+4,7,-7],[x+13,15,12],2.1,0x62435d);
      }
    },
  },
  'shielding-gate':{
    source:[455,332],bounds:[-190,-46,342,181],
    paint(c){
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
  },.049);
  if(id==='overload-floor')addOverloadVents(root,x,z);
  const pieces=new IncidentPieces();incident.pieces(pieces);pieces.finish(root,id,x,z);
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
