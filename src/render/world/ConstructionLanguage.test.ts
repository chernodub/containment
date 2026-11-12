import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {shipEnvironment} from '../ShipEnvironments';
import {addConstructionLanguage,CONSTRUCTION_STANDARD_ROOMS} from './ConstructionLanguage';

function contains(x:number,z:number,polygon:readonly {x:number;y:number}[]){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>z)!==(b.y>z)&&x<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}

describe('authored construction standard',()=>{
  it.each([...CONSTRUCTION_STANDARD_ROOMS])('%s keeps all raised construction inside solids or outboard of the real hull',id=>{
    const template=ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES],world=new T.Group(),root=new T.Group(),material=new T.MeshStandardMaterial(),parts:T.BufferGeometry[]=[];
    for(const r of template.obstacles){const mesh=new T.Mesh(new T.BoxGeometry(r.width/32,1,r.height/32),material);mesh.position.set((r.x+r.width/2)/32,.5,(r.y+r.height/2)/32);world.add(mesh);}
    const add=(g:T.BufferGeometry,_m:T.Material,x:number,y:number,z:number,sx=1,sy=1,sz=1,a=0)=>{g.scale(sx,sy,sz);g.rotateY(a);g.translate(x,y,z);parts.push(g);};
    const box=(m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,a=0)=>add(new T.BoxGeometry(w,h,d),m,x,y,z,1,1,1,a);
    addConstructionLanguage(world,root,template,shipEnvironment(id)!,id,{add,box},{steel:material,dark:material,paint:material,resin:material,vein:material,signal:material});
    const hull=template.boundary??[{x:0,y:0},{x:template.width,y:0},{x:template.width,y:template.height},{x:0,y:template.height}];
    let raised=0;
    for(const g of parts){const p=g.getAttribute('position');for(let i=0;i<p.count;i++){const x=p.getX(i)*32,z=p.getZ(i)*32;if(p.getY(i)<=.031)continue;raised++;const solid=template.obstacles.some(r=>x>=r.x-.01&&x<=r.x+r.width+.01&&z>=r.y-.01&&z<=r.y+r.height+.01);expect(!contains(x,z,hull)||solid,`${id} raised vertex ${x},${z}`).toBe(true);}g.dispose();}
    expect(raised).toBeGreaterThan(100);expect(root.userData.constructionLanguage).toBe(shipEnvironment(id));material.dispose();
  });
});
