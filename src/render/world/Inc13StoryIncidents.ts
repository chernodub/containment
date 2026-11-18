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
  const pieces=new IncidentPieces();incident.pieces(pieces);pieces.finish(root,id,x,z);
}
