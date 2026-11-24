#!/usr/bin/env node
/** CREATURE26: luma percentiles inside each actor's silhouette in a heavies lineup folder (marine, Brute, elite, Warden,
 * split by x into the four columns), and the floor around them. node values.mjs <heavies-dir> */
import sharp from 'sharp';
const dir=process.argv[2];
const load=async f=>{const {data,info}=await sharp(`${dir}/${f}`).raw().toBuffer({resolveWithObject:true});return {data,info};};
const g=await load('trio-crew-checkpoint-grey.png'),s=await load('trio-crew-checkpoint-silhouette.png');
const W=g.info.width,H=g.info.height,cg=g.info.channels,cs=s.info.channels;
// columns from silhouette x-runs
const colHas=new Array(W).fill(0);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(s.data[(y*W+x)*cs]<128)colHas[x]++;
const spans=[];let a=-1;for(let x=0;x<W;x++){if(colHas[x]&&a<0)a=x;if((!colHas[x]||x===W-1)&&a>=0){if(x-a>8)spans.push([a,x]);a=-1;}}
const pct=(v,p)=>v[Math.min(v.length-1,Math.floor(p*v.length))];
const out=[];let floor=[];
for(const [x0,x1] of spans){const v=[];for(let y=0;y<H;y++)for(let x=x0;x<x1;x++){const i=y*W+x;const l=g.data[i*cg];if(s.data[i*cs]<128){// erode 3px to drop the ink line
 let inside=true;for(const [dx,dy] of [[3,0],[-3,0],[0,3],[0,-3]]){const j=(y+dy)*W+x+dx;if(s.data[j*cs]>=128)inside=false;}if(inside)v.push(l);}else if(y>300&&y<900)floor.push(l);}
 v.sort((p,q)=>p-q);out.push({x:[x0,x1],px:v.length,p10:pct(v,.1),p25:pct(v,.25),p50:pct(v,.5),p75:pct(v,.75),p90:pct(v,.9),p98:pct(v,.98)});}
floor.sort((p,q)=>p-q);
console.log(JSON.stringify({floor:{p25:pct(floor,.25),p50:pct(floor,.5),p75:pct(floor,.75)},actors:out}));
