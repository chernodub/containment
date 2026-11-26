// Optical footprint in ship units, measured along and across the fixture axis.
type Shape='strip'|'broken ring'|'split fan'|'under-glow'|'spill';
type Aperture=readonly [Shape,number,number];
export const incidentApertures:Record<string,Aperture>={
 'awakening-bay':['strip',76,15], 'passenger-vault':['under-glow',58,38],
 'residential-gallery':['spill',64,42], 'communal-atrium':['broken ring',49,32],
 'crew-checkpoint':['strip',53,10], armory:['split fan',62,29],
 'freight-hold':['under-glow',82,27], 'breached-loading-bay':['split fan',71,46],
 'relay-racks':['strip',92,15], 'transmission-chamber':['split fan',86,27],
 'diagnostic-gallery':['under-glow',65,34], 'safety-interlock-station':['broken ring',38,27],
 'coolant-plant':['spill',69,24], 'service-shaft-landing':['broken ring',47,39],
 'infested-workshop':['split fan',52,42], 'swarm-junction':['spill',57,41],
 'shielding-gate':['strip',87,17], 'containment-annulus':['broken ring',72,42],
 'manual-control-chamber':['under-glow',41,23], 'overload-floor':['spill',85,41],
};
export function incidentTransmission(profile:Aperture,along:number,across:number){
 const [shape,length,width]=profile;
 const u=along/length,v=across/width;
 if(Math.abs(u)>1.2||Math.abs(v)>1.2)return 0;
 let field:number;
 switch(shape){
  case 'strip':field=1-Math.max(Math.abs(u),Math.abs(v))**2;break;
  case 'broken ring':field=(1-Math.abs(Math.hypot(u,v)-.66)*3.7)*(v<-.22&&u>.08?.09:1);break;
  case 'split fan':field=(1-Math.hypot(u-.30,v/(.47+.43*u)))*Math.min(1,Math.abs(v-.12*u)*7);break;
  case 'under-glow':field=1-Math.hypot(u,Math.abs(v+.35)*1.3);break;
  case 'spill':field=1-Math.hypot(u,v+.22*Math.sin(4*u))*(1+.13*Math.sin(6*u+2*v));break;
 }
 const shadow=along>6&&Math.abs(across-along*.16)<2+along*.055?.36:1;
 return Math.min(1,Math.max(0,field)*1.65)**.76*shadow;
}

export function paintIncidentAperture(c:CanvasRenderingContext2D,id:string,color:number){
 const profile=incidentApertures[id];if(!profile)return;
 const [,length,width]=profile;
 const stamp=document.createElement('canvas');stamp.width=64;stamp.height=96;
 const ctx=stamp.getContext('2d')!,image=ctx.createImageData(64,96);
 for(let y=0;y<96;y++)for(let x=0;x<64;x++){
  const offset=4*(y*64+x);
  image.data[offset]=color>>16;image.data[offset+1]=(color>>8)&255;image.data[offset+2]=color&255;
  image.data[offset+3]=192*incidentTransmission(profile,(y/96-.5)*length*2.4,(x/64-.5)*width*2.4);
 }
 ctx.putImageData(image,0,0);
 c.drawImage(stamp,-1.2*width,-1.2*length,2.4*width,2.4*length);
}
