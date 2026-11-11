import * as T from 'three';
import {MAT,box,rod,batch,geometry} from '../meshParts';
import type {ShipEnvironment} from '../ShipEnvironments';
import type {RoomTemplate} from '../../game/roguelike/types';
import {environmentClock} from '../lighting/HotFixtureSurface';
import {createAnchoredStoryParticles} from '../atmosphere/Atmosphere';
import {GROWTH_MAT} from './OrganicGrowth';

type Origin={x:number;y:number;z:number;kind:number};
const point=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const roomParticles=new WeakMap<T.Group,T.Mesh>();

/** Bounded story effects originate on physical equipment; only flush roots cross routes. */
export function addEnvironmentalStory(world:T.Group,template:RoomTemplate,environment:ShipEnvironment,templateId:string,seed=1729):T.Group {
  const root=new T.Group();root.name='environmental-story';root.userData.seed=seed;
  const origins:Origin[]=[];
  if(environment==='infested'){
    const inside=(x:number,z:number,polygon:readonly {x:number;y:number}[])=>{let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[i],b=polygon[j];if((a.y>z*32)!==(b.y>z*32)&&x*32<(b.x-a.x)*(z*32-a.y)/(b.y-a.y)+a.x)hit=!hit;
    }return hit;};
    const onDeck=(p:T.Vector3)=>p.x>=.1&&p.z>=.1&&p.x<template.width/32-.1&&p.z<template.height/32-.1&&(!template.boundary||inside(p.x,p.z,template.boundary))&&!template.voids?.some(h=>inside(p.x,p.z,h));
    for(let i=0;i<template.obstacles.length-1;i++){
      const a=template.obstacles[i],b=template.obstacles[i+1],from=point((a.x+a.width*.5)/32,.015,(a.y+a.height*.5)/32),to=point((b.x+b.width*.5)/32,.015,(b.y+b.height*.5)/32);
      const span=from.distanceTo(to),segments=Math.ceil(span/.45);let previous=from;
      for(let j=1;j<=segments;j++){
        const t=j/segments,p=from.clone().lerp(to,t);p.x+=Math.sin(t*8+seed*.013+i)*.19*Math.sin(t*Math.PI);p.z+=Math.sin(t*11+i)*.12*Math.sin(t*Math.PI);
        if(onDeck(previous)&&onDeck(p)){
          const delta=p.clone().sub(previous),mesh=new T.Mesh(geometry('x2-flush-root',()=>new T.BoxGeometry(1,1,1)),i%3?GROWTH_MAT.tissue:GROWTH_MAT.carapace);mesh.position.set((p.x+previous.x)/2,.012,(p.z+previous.z)/2);mesh.scale.set(delta.length()+.025,.018,.12+(i%3)*.055);mesh.rotation.y=-Math.atan2(delta.z,delta.x);mesh.castShadow=false;root.add(mesh);
        }
        previous=p;
      }
    }
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
  batch(root);
  if(origins.length){const mesh=createAnchoredStoryParticles(origins,environmentClock);root.add(mesh);roomParticles.set(world,mesh);}else roomParticles.delete(world);
  root.userData.sourceCount=origins.length;root.userData.templateId=templateId;
  world.add(root);return root;
}

/** Respect the existing atmosphere option without traversing static room hierarchies. */
export function setEnvironmentalStoryOptions(world:T.Group,enabled:boolean):void {
  const mesh=roomParticles.get(world);if(mesh)mesh.visible=enabled;
}
