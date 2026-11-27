import * as T from 'three';

/** Sculpt the oral surfaces in the template's existing skin buffer. Each tooth
 * belongs to one jaw. Only the throat lining stretches across the hinge. */
export function shapeWardenMouth(mesh: T.SkinnedMesh) {
  const g = mesh.geometry, index = g.index!;
  const p = g.getAttribute('position'), n = g.getAttribute('normal'), zone = g.getAttribute('_heavyzone');
  const joints = g.getAttribute('skinIndex'), weights = g.getAttribute('skinWeight');
  const head = mesh.skeleton.bones.findIndex(b => b.name === 'head');
  const jaw = mesh.skeleton.bones.findIndex(b => b.name === 'jaw');
  const used = new Uint8Array(p.count), triangles: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i), b = index.getX(i+1), c = index.getX(i+2);
    const part = zone.getX(a) >> 4;
    if ([70,71,74].includes(part) || (part === 0 && [a,b,c].some(v => joints.getX(v) === jaw && p.getX(v)>3.1))) continue;
    triangles.push(a,b,c);
    used[a]=used[b]=used[c]=1;
  }
  const slots: number[] = [];
  used.forEach((present,i) => { if (!present) slots.push(i); });
  type Surface = {x:number;y:number;z:number;length:number;width:number;height:number;paint:number;attachment:number;tooth?:number};
  const surfaces: Surface[] = [
    {x:4.56,y:0,z:3.33,length:.73,width:1.14,height:.18,paint:0,attachment:1},
    {x:4.63,y:0,z:3.42,length:.65,width:1.01,height:.12,paint:12,attachment:1},
    {x:5.08,y:0,z:3.51,length:.19,width:1.19,height:.21,paint:13,attachment:.5},
    {x:5.02,y:0,z:3.42,length:.22,width:.57,height:.075,paint:9,attachment:1},
    {x:4.67,y:0,z:3.64,length:.81,width:1.13,height:.13,paint:0,attachment:0}
  ];
  // Anterior arcade: both tooth rows curve around the lining, so the front
  // view sees four teeth instead of seeing a side row end-on.
  for (const side of [-1,1]) for (const fraction of [.33,.82]) {
    for (const lower of [false,true]) {
      const y=side*(fraction+(lower?.045:0));
      surfaces.push({x:5.32-.47*fraction*fraction,y,z:lower?3.37:3.68,
        length:.15,width:.13,height:lower?.30:.35,paint:14,
        attachment:lower?1:0,tooth:lower?1:-1});
    }
  }
  // Spend the available rings on the broad lips and throat. Short tapered teeth need fewer facets.
  const sectors=surfaces.map(s=>s.tooth?6:12);
  const ringCost=sectors.reduce((a,b)=>a+b,0);
  const rings=Math.min(6,Math.floor((slots.length-2*surfaces.length)/ringCost));
  if (rings < 1) return;
  let extra=slots.length-surfaces.length*2-rings*ringCost;
  while(extra>=rings){for(let j=0;j<5 && extra>=rings;j++){sectors[j]++;extra-=rings;}}
  let cursor=0;
  const v=new T.Vector3(), a=new T.Vector3(), b=new T.Vector3(), c=new T.Vector3(), normal=new T.Vector3();
  function face(i:number,j:number,k:number) {
    a.fromBufferAttribute(p,i); b.fromBufferAttribute(p,j).sub(a); c.fromBufferAttribute(p,k).sub(a);
    normal.fromBufferAttribute(n,i);
    if(b.cross(c).dot(normal)<0)triangles.push(i,k,j);else triangles.push(i,j,k);
  }
  surfaces.forEach((s,part)=>{
    function point(t:number,theta:number){
      const i=slots[cursor++], angle=Math.PI*t, ct=Math.cos(theta), st=Math.sin(theta);
      const radius=Math.sin(angle), u=-Math.cos(angle);
      let x=s.x+s.length*u,y=s.y+s.width*radius*ct,z=s.z+s.height*radius*st;
      v.set(u/s.length,radius*ct/s.width,radius*st/s.height);
      if(s.tooth){
        const taper=(1-t)*Math.min(1,t*18);
        x=s.x+s.length*taper*ct+.18*t;y=s.y+s.width*taper*st;z=s.z+s.tooth*s.height*t;
        v.set(ct,st,s.tooth*(t===0?-3:.45));
      }else if(part===0 || part===1){y=s.y+(y-s.y)*(1-.24*u);}
      // The lining spans both lips. Its corners tuck towards the hinge.
      if (s.paint===13) x-=.43*(y/s.width)**2;
      const w=s.attachment===.5?T.MathUtils.clamp((3.72-z)/.42,0,1):s.attachment;
      v.normalize();p.setXYZ(i,x,y,z);n.setXYZ(i,v.x,v.y,v.z);
      joints.setXYZW(i,head,jaw,0,0);weights.setXYZW(i,1-w,w,0,0);
      zone.setX(i,16*(80+part)+s.paint);g.getAttribute('actorRegion').setX(i,2);
      g.getAttribute('plateEdge').setXYZ(i,1,1,1);
      g.getAttribute('_k11region')?.setXY(i,s.paint===9?1:0,0);
      g.getAttribute('uv').setXY(i,.125,.125);
      return i;
    }
    let last=[point(0,0)];
    for(let r=1;r<=rings+1;r++){
      const count=r>rings?1:sectors[part]+(extra>0?1:0);
      if(r<=rings && extra>0)extra--;
      const next=Array.from({length:count},(_,j)=>point(r/(rings+1),2*Math.PI*j/count));
      let i=0,j=0;
      while(i<last.length || j<next.length){
        const l=last[i%last.length],q=next[j%next.length];
        if((i+1)/last.length<=(j+1)/next.length){if(last.length>1)face(l,last[(i+1)%last.length],q);i++;}
        else{if(next.length>1)face(l,next[(j+1)%next.length],q);j++;}
      }
      last=next;
    }
  });
  g.setIndex(triangles);
}
