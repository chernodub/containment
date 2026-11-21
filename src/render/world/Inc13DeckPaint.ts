import * as T from 'three';
import {environmentClock} from '../lighting/HotFixtureSurface';

/** Draw the shallow relief from the same alpha mask as the deposited material.
 * A smaller normal texture keeps the slopes broad at gameplay camera distance. */
function relief(canvas: HTMLCanvasElement) {
  const height = document.createElement('canvas');
  height.width = 192;
  height.height = Math.max(2, Math.round(192 * canvas.height / canvas.width));
  const ctx = height.getContext('2d',{willReadFrequently:true})!;
  ctx.drawImage(canvas, 0, 0, height.width, height.height);
  const {data} = ctx.getImageData(0, 0, height.width, height.height);
  const normal = new Uint8Array(data.length);
  const level = (x:number, y:number) => {
    const i = (Math.max(0, Math.min(height.height-1, y))*height.width + Math.max(0, Math.min(height.width-1, x)))*4;
    return data[i+3]/255 * (.45 + data[i+1]/255);
  };
  for(let y=0; y<height.height; y++) for(let x=0; x<height.width; x++) {
    const dx = level(x-1,y)-level(x+1,y), dy = level(x,y+1)-level(x,y-1);
    const inv = 1/Math.hypot(dx,dy,1), i=(y*height.width+x)*4;
    normal[i]=128+127*dx*inv; normal[i+1]=128+127*dy*inv;
    normal[i+2]=128+127*inv; normal[i+3]=255;
  }
  const texture=new T.DataTexture(normal,height.width,height.height);
  texture.flipY=true; texture.magFilter=T.LinearFilter; texture.minFilter=T.LinearFilter;
  texture.needsUpdate=true;
  return {texture,mask:data,width:height.width,height:height.height};
}

/** Skip empty deck between Swarm's three long arms. Sample the same relief
 * mask with a two-texel margin for the filtered fringe. Still one mesh/draw. */
function membraneGeometry(w:number,d:number,reliefMap:ReturnType<typeof relief>):T.PlaneGeometry {
  const cols=16,rows=12;
  const geometry=new T.PlaneGeometry(w,d,cols,rows),indices:number[]=[];
  const {width,height,mask}=reliefMap;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const x0=Math.max(0,Math.floor(col*width/cols)-2),x1=Math.min(width,Math.ceil((col+1)*width/cols)+2);
    const y0=Math.max(0,Math.floor(row*height/rows)-2),y1=Math.min(height,Math.ceil((row+1)*height/rows)+2);
    let ink=false;
    for(let y=y0;y<y1&&!ink;y++)for(let x=x0;x<x1;x++){
      if(mask[(y*width+x)*4+3]){ink=true;break;}
    }
    if(ink){const a=row*(cols+1)+col,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}
  }
  geometry.setIndex(indices);
  return geometry;
}

/** The painter uses room coordinates. Alpha leaves the original floor visible,
 * and all marks share a single prepared, disposable floor mesh. */
export function paintIncidentDeck(root:T.Group,name:string,bounds:[number,number,number,number],
  paint:(c:CanvasRenderingContext2D)=>void,height=.020):void {
  const [left,top,width,depth]=bounds;
  const canvas=document.createElement('canvas');
  canvas.width=1024;canvas.height=Math.round(canvas.width*depth/width);
  // Relief samples the painted bitmap immediately. Keep it on the CPU until upload.
  const c=canvas.getContext('2d',{willReadFrequently:true})!;
  c.scale(canvas.width/width,canvas.height/depth);c.translate(-left,-top);paint(c);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  const reliefMap=relief(canvas),normalMap=reliefMap.texture;
  const wet=/fluid|frozen|resin|diagnostic|swarm/.test(name);
  // These deposits sit over the biased named-space paint and trim.
  const layered=name==='inc13-cryo-fluid'||name==='inc13-frozen-discharge'||name==='inc13-containment-annulus-deck';
  const bias=layered?-5:-1;
  const material=new T.MeshStandardMaterial({map,normalMap,roughness:wet?.22:.94,metalness:wet?.13:.02,
    transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:bias,polygonOffsetUnits:bias});
  if(name.includes('swarm')||name==='inc13-resin-runout'){
    material.emissiveMap=map;material.emissive.setHex(0xfca5ec);material.emissiveIntensity=.66;
  }
  material.addEventListener('dispose',()=>normalMap.dispose());
  material.userData.actorMaterial = true;
  material.addEventListener('dispose',()=>map.dispose());
  const geometry=(name.includes('swarm')||name==='frame16-deck-wear')?membraneGeometry(width/32,depth/32,reliefMap):new T.PlaneGeometry(width/32,depth/32);
  const mesh=new T.Mesh(geometry.rotateX(-Math.PI/2),material);
  mesh.receiveShadow=true;mesh.name=name;mesh.position.set((left+width/2)/32,height,(top+depth/2)/32);root.add(mesh);
}

/** Thin overlapping banks of mist drift a few units over the source. */
export function creepingVapour(root:T.Group,banks:readonly (readonly [number,number,number,number,number])[]):void {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;
  const c=canvas.getContext('2d')!;
  for(let i=0;i<15;i++){
    const x=32+i*13,y=49+7*Math.sin(i*1.24),r=17+8*Math.sin(i*.72);
    const g=c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba(182,205,211,.30)');g.addColorStop(.65,'rgba(152,180,190,.12)');g.addColorStop(1,'rgba(152,180,190,0)');
    c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);
  }
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map,transparent:true,opacity:.48,depthWrite:false});
  material.userData.actorMaterial = true;
  material.addEventListener('dispose',()=>map.dispose());
  for(const [x,z,w,d,angle] of banks){
    const mesh=new T.Mesh(new T.PlaneGeometry(w/32,d/32).rotateX(-Math.PI/2),material);
    mesh.position.set(x/32,.13,z/32);mesh.rotation.y=angle;mesh.name='inc13-ground-vapour';
    mesh.onBeforeRender=()=>{const phase=environmentClock.value*.36+x;
      mesh.position.x=(x+6*Math.sin(phase))/32;mesh.position.z=(z+3*Math.cos(phase))/32;mesh.updateMatrixWorld();};
    root.add(mesh);
  }
}
