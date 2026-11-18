import * as T from 'three';

type Niche = Readonly<{x:number;z:number;angle:number;scale:number;width?:number;depth?:number;bottom?:number;top?:number}>;
type Plane = readonly [axis: 'x' | 'y' | 'z', edge: number, direction: number];
type Vertex = {values:number[];local:T.Vector3};

/** Cut shallow service niches into presentation walls, retaining the native
 * collision polygon. Attributes interpolate at the exact same cut planes. */
export function cutInteriorWallNiches(source:T.BufferGeometry,niches:readonly Niche[]):T.BufferGeometry {
  const flat=source.index?source.toNonIndexed():source;
  const attributes=Object.entries(flat.attributes).sort(([a],[b])=>a==='position'?-1:b==='position'?1:a.localeCompare(b)),stride=attributes.reduce((n,[,a])=>n+a.itemSize,0);
  const output:number[]=[];
  const clip=(input:Vertex[],axis:'x'|'y'|'z',edge:number,direction:number,inside:boolean):Vertex[]=>{
    const result:Vertex[]=[];
    for(let i=0;i<input.length;i++) {
      const p=input[i],q=input[(i+1)%input.length],dp=(p.local[axis]-edge)*direction,dq=(q.local[axis]-edge)*direction;
      const acceptP=inside?dp>=-1e-8:dp<=1e-8,acceptQ=inside?dq>=-1e-8:dq<=1e-8;
      if(acceptP)result.push(p);
      if(acceptP!==acceptQ&&Math.abs(dp-dq)>1e-10){
        const f=dp/(dp-dq);result.push({local:p.local.clone().lerp(q.local,f),values:p.values.map((v,j)=>v+(q.values[j]-v)*f)});
      }
    }
    return result;
  };
  const cutters=niches.map(niche=>{
    const planes:readonly Plane[]=[['x',-(niche.width??4.36*niche.scale)/2,1],['x',(niche.width??4.36*niche.scale)/2,-1],['z',-(niche.depth??1.4*niche.scale)/2,1],['z',(niche.depth??1.4*niche.scale)/2,-1],['y',niche.bottom??.255,1],['y',niche.top??1.74,-1]];
    return {x:niche.x,z:niche.z,c:Math.cos(niche.angle),s:Math.sin(niche.angle),planes};
  });
  const p=flat.getAttribute('position');
  for(let i=0;i<p.count;i+=3) {
    let polygons:Vertex[][]=[Array.from({length:3},(_,n)=>({local:new T.Vector3(),values:attributes.flatMap(([,a])=>Array.from({length:a.itemSize},(_,k)=>a.array[(i+n)*a.itemSize+k]))}))];
    for(const {x:originX,z:originZ,c,s,planes} of cutters){
      const next:Vertex[][]=[];
      for(const polygon of polygons){
        for(const v of polygon){const x=v.values[0]-originX,z=v.values[2]-originZ;v.local.set(x*c-z*s,v.values[1],x*s+z*c);}
        let remainder=polygon;
        for(const [axis,edge,sign]of planes){
          if(remainder.length<3)break;
          // Strict separation preserves the original tolerance at coincident planes.
          let allInside=true,allOutside=true;
          for(const vertex of remainder){
            const distance=(vertex.local[axis]-edge)*sign;
            allInside &&= distance>1e-8;
            allOutside &&= distance< -1e-8;
          }
          if(allInside)continue;
          if(allOutside){next.push(remainder);break;}
          const outside=clip(remainder,axis,edge,sign,false);if(outside.length>=3)next.push(outside);
          remainder=clip(remainder,axis,edge,sign,true);
        }
      }
      polygons=next;
    }
    for(const polygon of polygons)for(let n=1;n<polygon.length-1;n++) {
      const triangle=[polygon[0],polygon[n],polygon[n+1]],a=new T.Vector3().fromArray(triangle[0].values),b=new T.Vector3().fromArray(triangle[1].values),c=new T.Vector3().fromArray(triangle[2].values);
      if(b.sub(a).cross(c.sub(a)).lengthSq()<1e-14)continue;
      for(const v of triangle)output.push(...v.values);
    }
  }
  const geometry=new T.BufferGeometry();let offset=0;
  for(const [name,attribute]of attributes){
    const values=new Float32Array(output.length/stride*attribute.itemSize);
    for(let i=0;i<output.length/stride;i++)for(let j=0;j<attribute.itemSize;j++)values[i*attribute.itemSize+j]=output[i*stride+offset+j];
    geometry.setAttribute(name,new T.BufferAttribute(values,attribute.itemSize,attribute.normalized));offset+=attribute.itemSize;
  }
  geometry.computeBoundingBox();geometry.computeBoundingSphere();if(flat!==source)flat.dispose();return geometry;
}
