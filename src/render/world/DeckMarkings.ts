import * as T from 'three';
import type { RoomTemplate, Point } from '../../game/roguelike/types';
import type { ShipEnvironment } from '../ShipEnvironments';

const UNIT = 32;

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
  const cream = new T.Color(environment === 'cargo' || environment === 'engineering' ? 0x625f4c : 0x596568);
  const pale = new T.Color(environment === 'containment' ? 0x5d5c68 : environment === 'infested' ? 0x4c5c4e : 0x4e6064);
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
  // Flush service corners and short worn hazard bars describe existing equipment.
  for(const [index,r] of template.obstacles.entries()){
    if(index>=12)break;
    const left=r.x/UNIT-.18,right=(r.x+r.width)/UNIT+.18,top=r.y/UNIT-.2,bottom=(r.y+r.height)/UNIT+.2;
    for(const [x,z,dx,dz] of [[left,top,1,1],[right,top,-1,1],[left,bottom,1,-1],[right,bottom,-1,-1]]){
      if(index%2===0)stroke(x,z,x+dx*.24,z,.025,cream);
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
