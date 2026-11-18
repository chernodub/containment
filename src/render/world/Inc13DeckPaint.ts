import * as T from 'three';
import {environmentClock} from '../lighting/HotFixtureSurface';

/** The painter uses room coordinates. Alpha leaves the original floor visible,
 * and all marks share a single prepared, disposable floor mesh. */
export function paintIncidentDeck(root:T.Group,name:string,bounds:[number,number,number,number],
  paint:(c:CanvasRenderingContext2D)=>void,height=.052):void {
  const [left,top,width,depth]=bounds;
  const canvas=document.createElement('canvas');
  canvas.width=1024;canvas.height=Math.round(1024*depth/width);
  const c=canvas.getContext('2d')!;
  c.scale(canvas.width/width,canvas.height/depth);c.translate(-left,-top);paint(c);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false});
  material.userData.actorMaterial = true;
  material.addEventListener('dispose',()=>map.dispose());
  const mesh=new T.Mesh(new T.PlaneGeometry(width/32,depth/32).rotateX(-Math.PI/2),material);
  mesh.name=name;mesh.position.set((left+width/2)/32,height,(top+depth/2)/32);root.add(mesh);
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
