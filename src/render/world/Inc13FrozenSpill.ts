import * as T from 'three';

/** A thin translucent sheet. Branches share the same source, with finer
 * lateral needles at their tips. The port fight circle lies to the south. */
export function addFrozenSpill(root:T.Group):void {
  const canvas=document.createElement('canvas');
  canvas.width=1024;canvas.height=512;
  const c=canvas.getContext('2d')!;
  let seed=38571;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const origin=[425,145];
  const branch=(x:number,y:number,a:number,len:number,depth:number)=>{
    const endX=x+Math.cos(a)*len,endY=y+Math.sin(a)*len*.65;
    const span=len*(depth===3?.12:.065);
    c.fillStyle=depth===3?'rgba(113,158,171,.23)':'rgba(164,202,211,.32)';
    c.beginPath();c.moveTo(x,y);c.lineTo(x+len*.42*Math.cos(a)-Math.sin(a)*span,y+len*.27*Math.sin(a)+Math.cos(a)*span);
    c.lineTo(endX,endY);c.closePath();c.fill();
    c.strokeStyle='rgba(178,216,222,.43)';c.lineWidth=depth*1.1;
    c.beginPath();c.moveTo(x,y);c.lineTo(endX,endY);c.stroke();
    if(depth>0)for(let i=1;i<7;i++){
      const t=.19+i*.104;
      branch(x+(endX-x)*t,y+(endY-y)*t,a+(i%2?1:-1)*(.51+random()*.28),len*(.13+.17*random()),depth-1);
    }
  };
  const mist=c.createRadialGradient(430,146,12,454,212,280);
  mist.addColorStop(0,'rgba(166,209,220,.66)');mist.addColorStop(.55,'rgba(126,170,178,.24)');mist.addColorStop(1,'rgba(109,145,152,0)');
  c.fillStyle=mist;c.fillRect(0,0,1024,512);
  for(let i=0;i<21;i++)branch(origin[0]+random()*28,origin[1]+random()*24-12,
    -.58+i*.14+random()*.08,180+220*Math.cos(i*.15-1.5)+random()*95,3);
  // Feather the edge of the frost where the sheet gives way to dry deck.
  c.globalCompositeOperation='destination-in';
  const edge=c.createLinearGradient(0,0,0,512);
  edge.addColorStop(0,'transparent');edge.addColorStop(.12,'white');
  edge.addColorStop(.82,'white');edge.addColorStop(1,'transparent');
  c.fillStyle=edge;c.fillRect(0,0,1024,512);
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map:tex,transparent:true,opacity:.56,depthWrite:false});
  material.addEventListener('dispose',()=>tex.dispose());
  const floor=new T.Mesh(new T.PlaneGeometry(10,5.3).rotateX(-Math.PI/2),material);
  floor.name='inc13-frozen-discharge';floor.position.set(429/32,.042,333/32);root.add(floor);
}
