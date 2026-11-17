import * as T from 'three';
import {MAT,box,rod,batch} from '../meshParts';
import type {ShipEnvironment} from '../ShipEnvironments';
import type {RoomTemplate} from '../../game/roguelike/types';
import {environmentClock} from '../lighting/HotFixtureSurface';
import {createAnchoredStoryParticles} from '../atmosphere/Atmosphere';
import {GROWTH_MAT,membraneGeometry} from './OrganicGrowth';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

type Origin={x:number;y:number;z:number;kind:number};
const point=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const roomParticles=new WeakMap<T.Group,T.Mesh>();

/** Bounded story effects originate on physical equipment; only flush roots cross routes. */
export function addEnvironmentalStory(world:T.Group,template:RoomTemplate,environment:ShipEnvironment,templateId:string,seed=1729):T.Group {
  const root=new T.Group();root.name='environmental-story';root.userData.seed=seed;
  const origins:Origin[]=[];
  const ownedRoots:T.BufferGeometry[]=[];
  if(environment==='cargo'&&templateId==='breached-loading-bay'&&template.boundary){
    // Layer the damaged hull outside the authoritative enclosure. Folded plate,
    // exposed rib and hanging loom geometry joins existing room material bins,
    // so this boundary dressing introduces no scene draw or shader family.
    const plates:T.BufferGeometry[]=[],cables:T.BufferGeometry[]=[],boundary=template.boundary;
    const center=point(template.width/64,0,template.height/64);
    for(let edge=0;edge<2;edge++){
      const a=point(boundary[edge].x/32,0,boundary[edge].y/32),b=point(boundary[edge+1].x/32,0,boundary[edge+1].y/32),tangent=b.clone().sub(a).normalize();
      const outward=point(tangent.z,0,-tangent.x);if(outward.dot(center.clone().sub(a))>0)outward.negate();
      const basis=new T.Matrix4().makeBasis(tangent,point(0,1,0),outward);
      for(const [patch,t] of [.32,.68].entries()){
        const anchor=a.clone().lerp(b,t);
        for(let layer=0;layer<2;layer++){
          const width=2.7-layer*.35,height=1.25+layer*.32+(edge+patch)%2*.22;
          const shape=new T.Shape([[-.5,0],[.5,0],[.48,.64],[.29,.92],[.13,.76],[-.06,1],[-.24,.81],[-.48,.95]].map(([x,y])=>new T.Vector2(x*width,y*height)));
          const g=new T.ExtrudeGeometry(shape,{depth:.12,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:.035,bevelThickness:.025});
          g.rotateX(-.19-layer*.16);g.applyMatrix4(basis);g.translate(...anchor.clone().addScaledVector(outward,.46+layer*.62).add(point(0,.1+layer*.14,0)).toArray());plates.push(g);
        }
        for(const side of [-1,1]){
          const foot=anchor.clone().addScaledVector(tangent,side*.94).addScaledVector(outward,.20).setY(-.35),tip=anchor.clone().addScaledVector(tangent,side*.94).addScaledVector(outward,1.54).setY(2.05);
          const delta=tip.clone().sub(foot),g=new T.CylinderGeometry(.075,.105,delta.length(),8);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(point(0,1,0),delta.normalize()));g.translate(...foot.add(tip).multiplyScalar(.5).toArray());plates.push(g);
        }
        const route=[anchor.clone().addScaledVector(tangent,-.96).addScaledVector(outward,1.56).setY(1.83),anchor.clone().addScaledVector(tangent,-.63).addScaledVector(outward,2.05).setY(.53),anchor.clone().addScaledVector(tangent,.34).addScaledVector(outward,2.02).setY(.31),anchor.clone().addScaledVector(tangent,.88).addScaledVector(outward,1.52).setY(1.27)];
        cables.push(new T.TubeGeometry(new T.CatmullRomCurve3(route),18,.045,6,false));
      }
    }
    world.updateWorldMatrix(true,true);
    const join=(name:string,parts:T.BufferGeometry[])=>{
      let target:T.Mesh|undefined;world.traverse(o=>{if(o instanceof T.Mesh&&!Array.isArray(o.material)&&o.material.name===name)target=o;});
      if(!target){for(const g of parts)g.dispose();return;}
      const inverse=new T.Matrix4().copy(target.matrixWorld).invert(),flat=parts.map(g=>{g.applyMatrix4(inverse);const p=g.index?g.toNonIndexed():g;if(p!==g)g.dispose();return p;});
      const source=target.geometry.index?target.geometry.toNonIndexed():target.geometry,merged=mergeGeometries([source,...flat],false);
      for(const g of flat)g.dispose();if(source!==target.geometry)source.dispose();if(!merged)throw Error('hull damage merge failed');target.geometry.dispose();target.geometry=merged;
      root.userData.layeredHull=true;
    };
    join('room8-torn-metal',plates);join('room8-docking-channels',cables);
  }
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
      vein(path,.035+(i%3)*.008,i%3?GROWTH_MAT.tissue:GROWTH_MAT.carapace,Math.min(64,Math.max(24,Math.ceil(span*4))));
      const curve=new T.CatmullRomCurve3(path,false,'centripetal');
      for(let branch=0;branch<3;branch++){
        const t=.22+branch*.23,start=curve.getPoint(t),tangent=curve.getTangent(t),side=point(-tangent.z,0,tangent.x).normalize().multiplyScalar(branch%2?-1:1),reach=.8+Math.sin(phase+branch)*.35;
        const end=start.clone().addScaledVector(side,reach).addScaledVector(tangent,.6),elbow=start.clone().addScaledVector(side,reach*.4).addScaledVector(tangent,-.12);
        vein([start,elbow,end.clone().addScaledVector(tangent,-.22),end],.018+(branch%2)*.006,GROWTH_MAT.tissue,20);
      }
    }
    root.userData.sinuousRoots=rootCount;
  }
  if(environment==='engineering'&&template.obstacles.length){
    const r=template.obstacles[0],x=(r.x+r.width*.3)/32,z=(r.y+r.height*.6)/32;
    // Roof-mounted hardware must query machinery, never the raised story screen
    // added by dressing: otherwise the vent is built directly across its text.
    const machines=world.children.filter(o=>o.name!=='g2-world-dressing');
    world.updateWorldMatrix(true,true);const ray=new T.Raycaster(point(x,20,z),point(0,-1,0)),hit=ray.intersectObjects(machines,true).find(hit=>hit.point.y>.15);
    if(hit){
      const y=hit.point.y+.015;
      box(root,x,y+.035,z,.55,.07,.44,MAT.black,.025);
      for(let slat=0;slat<5;slat++)box(root,x-.2+slat*.1,y+.078,z,.035,.015,.34,MAT.edge,.005);
      rod(root,point(x-.2,y+.08,z-.12),point(x-.12,y+.16,z-.04),.035,.028,MAT.copper);
      rod(root,point(x+.2,y+.08,z-.12),point(x+.1,y+.13,z-.06),.035,.028,MAT.copper);
      origins.push({x,y:y+.1,z,kind:1},{x:x-.1,y:y+.16,z:z-.05,kind:0});
    }
    // Broad overhead runs belong to machine islands, where their shadows
    // explain the service plant without crossing a traversable lane.
    for(const [index,r] of template.obstacles.slice(0,2).entries()){
      const cx=(r.x+r.width*.5)/32,cz=(r.y+r.height*.28)/32,w=r.width/32,d=r.height/32;
      world.updateWorldMatrix(true,true);const probe=new T.Raycaster(point(cx,20,cz),point(0,-1,0)),roof=probe.intersectObjects(machines,true).find(h=>h.point.y>.15);
      if(!roof)continue;const y=roof.point.y+.64,alongX=w>d,span=(alongX?w:d)*.73;
      for(const side of [-1,1]){
        const offset=side*Math.min(.26,(alongX?d:w)*.18);
        const a=point(cx+(alongX?-span/2:offset),y,cz+(alongX?offset:-span/2)),b=point(cx+(alongX?span/2:offset),y,cz+(alongX?offset:span/2));
        rod(root,a,b,.095,.095,MAT.steel);
        for(const t of [.12,.88]){const p=a.clone().lerp(b,t);box(root,p.x,p.y-.10,p.z,.24,.22,.24,MAT.edge,.025);rod(root,point(p.x,roof.point.y,p.z),p,.045,.045,MAT.black);}
      }
      const hood=box(root,cx,y+.08,cz,Math.min(w*.48,1.45),.22,Math.min(d*.50,.82),MAT.black,.055);hood.name='overhead-vent-hood';
      for(let slat=0;slat<4;slat++)box(root,cx+(slat-1.5)*Math.min(w*.07,.20),y+.20,cz,.065,.025,Math.min(d*.36,.61),MAT.edge,.008);
      root.userData.overheadMachines=index+1;
    }
  }
  if(environment==='reactor'&&templateId==='overload-floor'&&template.voids?.length){
    const hole=template.voids[0],x=hole.reduce((sum,p)=>sum+p.x,0)/hole.length/32,z=hole.reduce((sum,p)=>sum+p.y,0)/hole.length/32;
    // Vent from the broken rim, not beneath the opaque crown's centre.
    for(let i=0;i<3;i++)origins.push({x:x+Math.cos(i*2.1)*3.1,y:2.8,z:z+Math.sin(i*2.1)*3.1,kind:3});
  }
  if(templateId==='coolant-plant'){
    // The P11 split return flange is at local (.52, 1.9, .9), on the
    // existing pump island. Reuse the warmed story plume/drip owner.
    origins.push({x:680/32+.52,y:1.9,z:350/32+.9,kind:1},
      {x:680/32+.58,y:1.3,z:350/32+.83,kind:2});
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
