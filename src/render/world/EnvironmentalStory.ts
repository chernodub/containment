import * as T from 'three';
import {MAT,box,rod,batch} from '../meshParts';
import type {ShipEnvironment} from '../ShipEnvironments';
import type {RoomTemplate} from '../../game/roguelike/types';
import {environmentClock} from '../lighting/HotFixtureSurface';
import {createAnchoredStoryParticles} from '../atmosphere/Atmosphere';
import {GROWTH_MAT,membraneGeometry} from './OrganicGrowth';

type Origin={x:number;y:number;z:number;kind:number};
const point=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const roomParticles=new WeakMap<T.Group,T.Mesh>();

/** Bounded story effects originate on physical equipment; only flush roots cross routes. */
export function addEnvironmentalStory(world:T.Group,template:RoomTemplate,environment:ShipEnvironment,templateId:string,seed=1729):T.Group {
  const root=new T.Group();root.name='environmental-story';root.userData.seed=seed;
  const origins:Origin[]=[];
  const ownedRoots:T.BufferGeometry[]=[];
  if(environment==='infested'){
    const inside=(x:number,z:number,polygon:readonly {x:number;y:number}[])=>{let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[i],b=polygon[j];if((a.y>z*32)!==(b.y>z*32)&&x*32<(b.x-a.x)*(z*32-a.y)/(b.y-a.y)+a.x)hit=!hit;
    }return hit;};
    const onDeck=(x:number,z:number)=>x>=.05&&z>=.05&&x<template.width/32-.05&&z<template.height/32-.05&&(!template.boundary||inside(x,z,template.boundary))&&!template.voids?.some(h=>inside(x,z,h));
    let rootCount=0;
    const vein=(points:T.Vector3[],radius:number,material:T.Material,steps=30)=>{
      const g=membraneGeometry(points,radius,.011,undefined,steps),p=g.getAttribute('position');
      for(let i=0;i<p.count;i++)if(!onDeck(p.getX(i),p.getZ(i))){g.dispose();return;}
      const mesh=new T.Mesh(g,material);mesh.name='sinuous-deck-root';mesh.castShadow=false;mesh.receiveShadow=true;root.add(mesh);ownedRoots.push(g);rootCount++;
    };
    for(let i=0;i<template.obstacles.length-1;i++){
      const a=template.obstacles[i],b=template.obstacles[i+1],from=point((a.x+a.width*.5)/32,.012,(a.y+a.height*.5)/32),to=point((b.x+b.width*.5)/32,.012,(b.y+b.height*.5)/32);
      const delta=to.clone().sub(from),normal=point(-delta.z,0,delta.x).normalize(),phase=seed*.0017+i*1.9,span=delta.length(),bend=Math.min(1.3,span*.13);
      const path=[from,from.clone().lerp(to,.27).addScaledVector(normal,bend*Math.sin(phase+1)),from.clone().lerp(to,.64).addScaledVector(normal,bend*Math.sin(phase+3.5)),to];
      vein(path,.13+(i%3)*.035,i%3?GROWTH_MAT.tissue:GROWTH_MAT.carapace,Math.min(64,Math.max(24,Math.ceil(span*4))));
      const curve=new T.CatmullRomCurve3(path,false,'centripetal');
      for(let branch=0;branch<3;branch++){
        const t=.22+branch*.23,start=curve.getPoint(t),tangent=curve.getTangent(t),side=point(-tangent.z,0,tangent.x).normalize().multiplyScalar(branch%2?-1:1),reach=.8+Math.sin(phase+branch)*.35;
        const end=start.clone().addScaledVector(side,reach).addScaledVector(tangent,.6),elbow=start.clone().addScaledVector(side,reach*.4).addScaledVector(tangent,-.12);
        vein([start,elbow,end.clone().addScaledVector(tangent,-.22),end],.07+(branch%2)*.025,GROWTH_MAT.tissue,20);
      }
    }
    root.userData.sinuousRoots=rootCount;
  }
  if(environment==='engineering'&&template.obstacles.length){
    const r=template.obstacles[0],x=(r.x+r.width*.3)/32,z=(r.y+r.height*.6)/32;
    world.updateWorldMatrix(true,true);const ray=new T.Raycaster(point(x,20,z),point(0,-1,0)),hit=ray.intersectObject(world,true).find(hit=>hit.point.y>.15);
    if(hit){
      const y=hit.point.y+.015;
      box(root,x,y+.035,z,.55,.07,.44,MAT.black,.025);
      for(let slat=0;slat<5;slat++)box(root,x-.2+slat*.1,y+.078,z,.035,.015,.34,MAT.edge,.005);
      rod(root,point(x-.2,y+.08,z-.12),point(x-.12,y+.16,z-.04),.035,.028,MAT.copper);
      rod(root,point(x+.2,y+.08,z-.12),point(x+.1,y+.13,z-.06),.035,.028,MAT.copper);
      origins.push({x,y:y+.1,z,kind:1},{x:x-.1,y:y+.16,z:z-.05,kind:0});
    }
  }
  if(environment==='reactor'&&templateId==='overload-floor'&&template.voids?.length){
    const hole=template.voids[0],x=hole.reduce((sum,p)=>sum+p.x,0)/hole.length/32,z=hole.reduce((sum,p)=>sum+p.y,0)/hole.length/32;
    for(let i=0;i<3;i++)origins.push({x:x+Math.cos(i*2.1)*.24,y:.85,z:z+Math.sin(i*2.1)*.24,kind:3});
  }
  if(environment==='maintenance'){
    const leaks=world.getObjectByName('g2-world-dressing')?.userData.leakOrigins as Array<{x:number;y:number;z:number}>|undefined;
    for(const leak of leaks??[])origins.push({...leak,kind:2});
  }
  batch(root);for(const g of ownedRoots)g.dispose();
  if(origins.length){const mesh=createAnchoredStoryParticles(origins,environmentClock);root.add(mesh);roomParticles.set(world,mesh);}else roomParticles.delete(world);
  root.userData.sourceCount=origins.length;root.userData.templateId=templateId;
  world.add(root);return root;
}

/** Respect the existing atmosphere option without traversing static room hierarchies. */
export function setEnvironmentalStoryOptions(world:T.Group,enabled:boolean):void {
  const mesh=roomParticles.get(world);if(mesh)mesh.visible=enabled;
}
