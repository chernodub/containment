import * as T from 'three';
import type { RoomTemplate, Point } from '../../game/roguelike/types';
import type { ShipEnvironment } from '../ShipEnvironments';

const UNIT = 32;
const glyphs: Record<string, readonly string[]> = {
  '0':['111','101','101','101','111'],'1':['010','110','010','010','111'],
  '2':['111','001','111','100','111'],'3':['111','001','111','001','111'],
  '4':['101','101','111','001','001'],'5':['111','100','111','001','111'],
  '6':['111','100','111','101','111'],'7':['111','001','010','010','010'],
  '8':['111','101','111','101','111'],'9':['111','101','111','001','111'],
  A:['010','101','111','101','101'],B:['110','101','110','101','110'],
  C:['111','100','100','100','111'],D:['110','101','101','101','110'],
  E:['111','100','110','100','111'],F:['111','100','110','100','100'],
  G:['111','100','101','101','111'],H:['101','101','111','101','101'],
  I:['111','010','010','010','111'],J:['011','001','001','101','111'],
  K:['101','101','110','101','101'],L:['100','100','100','100','111'],
  M:['101','111','111','101','101'],N:['101','111','111','111','101'],
  O:['111','101','101','101','111'],P:['111','101','111','100','100'],
  Q:['111','101','101','111','001'],R:['110','101','110','101','101'],
  S:['111','100','111','001','111'],T:['111','010','010','010','010'],
  U:['101','101','101','101','111'],V:['101','101','101','101','010'],
  W:['101','101','111','111','101'],X:['101','101','010','101','101'],
  Y:['101','101','010','010','010'],Z:['111','001','010','100','111'],
  '-':['000','000','111','000','000'],
};
const environmentCode: Readonly<Record<ShipEnvironment, string>> = {
  cryogenics:'CRYO',habitation:'HAB',security:'SEC',cargo:'CARGO',communications:'RELAY',
  engineering:'SERVICE',maintenance:'COOLANT',infested:'BIO',containment:'SHIELD',reactor:'CORE',
};
const routeIds = ['awakening-bay','passenger-vault','residential-gallery','communal-atrium','crew-checkpoint','armory','freight-hold','breached-loading-bay','relay-racks','transmission-chamber','diagnostic-gallery','safety-interlock-station','coolant-plant','service-shaft-landing','infested-workshop','swarm-junction','shielding-gate','containment-annulus','manual-control-chamber','overload-floor'];

function inside(x: number, y: number, polygon: readonly Point[]) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > y) !== (b.y > y) && x < (b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x) result = !result;
  }
  return result;
}

/** A presentation-only paint support query. Never changes navigation or collision. */
export function deckMarkingSupported(template: RoomTemplate, x: number, z: number) {
  x *= UNIT; z *= UNIT;
  if (x < 8 || z < 8 || x > template.width-8 || z > template.height-8) return false;
  if (template.boundary && !inside(x,z,template.boundary)) return false;
  if (template.voids?.some(p => inside(x,z,p))) return false;
  return !template.obstacles.some(r => x >= r.x-4 && x <= r.x+r.width+4 && z >= r.y-4 && z <= r.y+r.height+4);
}

/** One merged, matte, worn stencil draw. Every stroke is supported by the real deck. */
export function addDeckMarkings(world: T.Object3D, template: RoomTemplate, environment: ShipEnvironment, templateId: string) {
  const root = new T.Group(); root.name = 'world-deck-markings';
  const positions: number[] = [], colors: number[] = [];
  const cream = new T.Color(environment === 'cargo' || environment === 'engineering' ? 0xa99d72 : 0xa1b1b4);
  const pale = new T.Color(environment === 'containment' ? 0xa3a1b5 : environment === 'infested' ? 0x7c927e : 0x839a9f);
  const hash = (x:number,z:number) => {
    const value = Math.imul(Math.round(x*4096)+51,374761393)^Math.imul(Math.round(z*4096)+137,668265263);
    return (value >>> 0)/4294967296;
  };
  const quad = (x:number,z:number,w:number,d:number,color:T.Color,angle=0) => {
    if (positions.length > 90000) return;
    const c=Math.cos(angle),s=Math.sin(angle);
    const corners=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([a,b])=>({x:x+a*c-b*s,z:z+a*s+b*c}));
    if (!deckMarkingSupported(template,x,z) || corners.some(p=>!deckMarkingSupported(template,p.x,p.z))) return;
    for(const i of [0,2,1,0,3,2]){
      const p=corners[i]; positions.push(p.x,.016,p.z);
      const wear=.72+hash(p.x,p.z)*.28; colors.push(color.r*wear,color.g*wear,color.b*wear);
    }
  };
  const stroke = (x1:number,z1:number,x2:number,z2:number,width:number,color:T.Color,worn=true) => {
    const length=Math.hypot(x2-x1,z2-z1),steps=Math.max(1,Math.ceil(length/.22)),angle=Math.atan2(z2-z1,x2-x1);
    for(let i=0;i<steps;i++){
      const t=(i+.5)/steps,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;
      if(worn&&hash(x,z)<.055)continue;
      quad(x,z,length/steps*.98,width,color,angle);
    }
  };
  const stencil = (text:string,x:number,z:number,height:number,color:T.Color) => {
    const pixel=height/5;
    for(let j=0;j<text.length;j++){
      const glyph=glyphs[text[j]];if(!glyph)continue;
      for(let row=0;row<5;row++)for(let col=0;col<3;col++)if(glyph[row][col]==='1'){
        const start=col;while(col+1<3&&glyph[row][col+1]==='1')col++;
        const length=(col-start+1)*pixel,steps=Math.max(1,Math.ceil(length/.075));
        // Continuous bars and a single mid-glyph bridge read as a real stencil.
        // Sparse chipped paint interrupts the edge instead of a square LED grid.
        for(let k=0;k<steps;k++){
          const px=x+(j*4+start-.5)*pixel+(k+.5)*length/steps,pz=z+row*pixel;
          const age=hash(px+17.3,pz-9.1);if(age<.025&&steps>2)continue;
          const bridge=row===2?.94:1.015;
          quad(px,pz,length/steps*.995,pixel*bridge*(.94+age*.06),color);
        }
      }
    }
  };
  const w=template.width/UNIT,h=template.height/UNIT;
  // A broken guide rail hugs the safe hull margin; never spans an opening/void.
  for(const x of [1.15,w-1.15])for(let z=2.0;z<h-1.5;z+=1.85){
    stroke(x,z,x,z+.63,.055,pale);
    if(environment==='cargo'||environment==='security'||environment==='engineering')stroke(x+.16,z,x+.16,z+.63,.022,cream);
  }
  // Small bay identifiers sit beside the starting lane, visible at the hero camera.
  const number=String(Math.max(1,routeIds.indexOf(templateId)+1)).padStart(2,'0');
  const sx=template.spawn.x/UNIT,sz=template.spawn.y/UNIT;
  let labelX=sx+1.2,labelZ=sz+1.65;
  if(!deckMarkingSupported(template,labelX,labelZ)) {labelX=sx+.8;labelZ=sz-1.65;}
  stencil(number,labelX,labelZ,.92,cream);
  stencil(environmentCode[environment],labelX,labelZ+1.18,.30,pale);
  stroke(labelX-.08,labelZ-.28,labelX+2.0,labelZ-.28,.045,cream);
  // Flush service corners and short worn hazard bars describe existing equipment.
  for(const [index,r] of template.obstacles.entries()){
    if(index>=12)break;
    const left=r.x/UNIT-.18,right=(r.x+r.width)/UNIT+.18,top=r.y/UNIT-.2,bottom=(r.y+r.height)/UNIT+.2;
    for(const [x,z,dx,dz] of [[left,top,1,1],[right,top,-1,1],[left,bottom,1,-1],[right,bottom,-1,-1]]){
      stroke(x,z,x+dx*.45,z,.045,cream);stroke(x,z,x,z+dz*.45,.045,cream);
    }
    if(environment==='cargo'||environment==='engineering'||environment==='maintenance'){
      for(let i=0;i<Math.min(10,r.width/UNIT*1.2);i++){
        const x=left+.35+i*.46;stroke(x,bottom+.14,x+.24,bottom+.38,.065,cream);
      }
    }
  }
  // Three chevrons refer only to the real exit, close enough to avoid routing lies.
  const ex=template.exit.x/UNIT,ez=template.exit.y/UNIT;
  const towardX=ex<w/2?-1:1;
  for(let i=0;i<3;i++){
    const x=ex-towardX*(.9+i*.48);
    stroke(x-towardX*.18,ez-.22,x,ez,.055,pale,false);
    stroke(x,ez,x-towardX*.18,ez+.22,.055,pale,false);
  }
  if(positions.length){
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();
    const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:.03,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
    material.name='worn-deck-stencil';material.userData.actorMaterial=true;
    const mesh=new T.Mesh(geometry,material);mesh.name='supported-deck-stencils';mesh.receiveShadow=true;root.add(mesh);
  }
  // Recessed seams and vent blades sit on the outboard face of the existing
  // enclosure. They never create a new silhouette in traversable space.
  const wallPositions:number[]=[],wallColors:number[]=[];
  const boundary=template.boundary??[{x:0,y:0},{x:template.width,y:0},{x:template.width,y:template.height},{x:0,y:template.height}];
  const wallColor=new T.Color(0x44545b),edgeColor=new T.Color(0x718088);
  const wallQuad=(a:T.Vector3,b:T.Vector3,c:T.Vector3,d:T.Vector3,color:T.Color)=>{
    for(const p of [a,c,b,a,d,c]){wallPositions.push(p.x,p.y,p.z);wallColors.push(color.r,color.g,color.b);}
  };
  if(templateId!=='service-shaft-landing')for(let j=0;j<boundary.length;j++){
    const a=boundary[j],b=boundary[(j+1)%boundary.length],dx=(b.x-a.x)/UNIT,dz=(b.y-a.y)/UNIT,length=Math.hypot(dx,dz);
    if(length<1)continue;
    const tx=dx/length,tz=dz/length,mx=(a.x+b.x)/2/UNIT,mz=(a.y+b.y)/2/UNIT;
    let nx=-tz,nz=tx;
    if(inside(mx*UNIT+nx*8,mz*UNIT+nz*8,boundary)){nx=-nx;nz=-nz;}
    const x0=a.x/UNIT+nx*.035,z0=a.y/UNIT+nz*.035;
    const point=(t:number,y:number)=>new T.Vector3(x0+tx*t,y,z0+tz*t);
    const rear=mz<h*.3;
    const trim=rear?.31:.23;
    wallQuad(point(.06,trim),point(length-.06,trim),point(length-.06,trim+.038),point(.06,trim+.038),edgeColor);
    for(let t=.35;t<length-.3;t+=2.7){
      wallQuad(point(t,.10),point(t+.026,.10),point(t+.026,rear?1.38:.46),point(t,rear?1.38:.46),wallColor);
      if(rear&&t+1.0<length)for(let v=0;v<5;v++){
        const y=.61+v*.085;wallQuad(point(t+.18,y),point(t+.92,y),point(t+.92,y+.026),point(t+.18,y+.026),wallColor);
      }
    }
  }
  if(wallPositions.length){
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(wallPositions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(wallColors,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();
    const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.69,metalness:.48,side:T.DoubleSide});material.name='bulkhead-service-relief';material.userData.actorMaterial=true;
    const mesh=new T.Mesh(geometry,material);mesh.name='outboard-bulkhead-seams';mesh.receiveShadow=true;root.add(mesh);
  }
  root.userData.vertexCount=positions.length/3;root.userData.wallVertexCount=wallPositions.length/3;root.userData.templateId=templateId;
  world.add(root);return root;
}
