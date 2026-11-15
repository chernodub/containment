import {l8PresentationSource} from '../../../tests/helpers/l8PresentationSource';
import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {shipEnvironment,appendEnvironment,environmentObstacle,environmentArchitecture} from '../ShipEnvironments';
import {addConstructionLanguage,CONSTRUCTION_STANDARD_ROOMS} from './ConstructionLanguage';
import {equipmentReservations,addWorldDressing} from './WorldDressing';
import {disposeModel} from '../meshParts';
import {deckMarkingSupported} from './DeckMarkings';
import {organicGeometry} from './OrganicGrowth';

function contains(x:number,z:number,polygon:readonly {x:number;y:number}[]){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>z)!==(b.y>z)&&x<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
function fixture(id:string){
  const template=ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES],world=new T.Group(),root=new T.Group();
  const finishes={steel:new T.MeshStandardMaterial(),dark:new T.MeshStandardMaterial(),paint:new T.MeshStandardMaterial(),resin:new T.MeshStandardMaterial(),vein:new T.MeshStandardMaterial(),signal:new T.MeshStandardMaterial()};
  const parts:{g:T.BufferGeometry;material:T.Material}[]=[];
  for(const polygon of template.voids??[]){const shape=new T.Shape(polygon.map(p=>new T.Vector2(p.x/32,-p.y/32))),geometry=new T.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false,steps:1});geometry.rotateX(-Math.PI/2);world.add(new T.Mesh(geometry,finishes.steel));}
  for(const r of equipmentReservations(template,id)){const mesh=new T.Mesh(new T.BoxGeometry(r.width/32,1,r.height/32),finishes.steel);mesh.position.set((r.x+r.width/2)/32,.5,(r.y+r.height/2)/32);world.add(mesh);}
  const add=(g:T.BufferGeometry,material:T.Material,x:number,y:number,z:number,sx=1,sy=1,sz=1,a=0)=>{g.scale(sx,sy,sz);g.rotateY(a);g.translate(x,y,z);parts.push({g,material});};
  const box=(m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,a=0)=>add(new T.BoxGeometry(w,h,d),m,x,y,z,1,1,1,a);
  addConstructionLanguage(world,root,template,shipEnvironment(id)!,id,{add,box},finishes,equipmentReservations(template,id));
  return {template,world,root,parts,finishes,dispose(){for(const {g} of parts)g.dispose();world.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});for(const m of Object.values(finishes))m.dispose();}};
}

describe('authored construction propagation',()=>{
  it('covers every story room and the legacy Queen arena',()=>{expect(CONSTRUCTION_STANDARD_ROOMS.size).toBe(21);expect(CONSTRUCTION_STANDARD_ROOMS.has('reactor-vault')).toBe(true);});
  it.each([...CONSTRUCTION_STANDARD_ROOMS])('%s keeps raised construction in original solids/outboard and flat detail on supported deck',id=>{
    const f=fixture(id),{template,root,parts}=f;
    const hull=template.boundary??[{x:0,y:0},{x:template.width,y:0},{x:template.width,y:template.height},{x:0,y:template.height}];
    const solid=(x:number,z:number)=>template.obstacles.some(r=>x>=r.x-.01&&x<=r.x+r.width+.01&&z>=r.y-.01&&z<=r.y+r.height+.01)||(template.voids??[]).some(polygon=>contains(x,z,polygon));
    let raised=0,flat=0,vertices=0;
    const check=(x:number,y:number,z:number)=>{
      if(y>.031){raised++;expect(!contains(x*32,z*32,hull)||solid(x*32,z*32),`${id} raised ${x*32},${z*32}`).toBe(true);}
      else{flat++;expect(deckMarkingSupported(template,x,z),`${id} flat ${x*32},${z*32}`).toBe(true);}
    };
    for(const {g,material} of parts){
      expect(Object.values(f.finishes)).toContain(material);
      const p=g.getAttribute('position'),indices=g.index;vertices+=p.count;
      const flatGeometry=Array.from({length:p.count},(_,i)=>p.getY(i)).every(y=>y<=.031);
      for(let i=0;i<p.count;i++){if(flatGeometry||p.getY(i)>.031)check(p.getX(i),p.getY(i),p.getZ(i));}
      for(let i=0;i<(indices?.count??p.count);i+=3){const a=indices?.getX(i)??i,b=indices?.getX(i+1)??i+1,c=indices?.getX(i+2)??i+2;const y=(p.getY(a)+p.getY(b)+p.getY(c))/3;if(flatGeometry||y>.031)check((p.getX(a)+p.getX(b)+p.getX(c))/3,y,(p.getZ(a)+p.getZ(b)+p.getZ(c))/3);}
    }
    expect(raised).toBeGreaterThan(100);expect(flat).toBeGreaterThan(0);expect(vertices).toBeLessThan(70000);expect(parts.length).toBeLessThan(1600);
    expect(root.userData.constructionLanguage).toBe(shipEnvironment(id));
    expect(root.userData.narrativeVignette.id).toBeTruthy();expect(root.userData.narrativeVignette.parts).toBeGreaterThanOrEqual(2);
    expect(root.userData.narrativeVignette.objective).toBeTruthy();
    if(['infested-workshop','swarm-junction','breached-loading-bay','reactor-vault'].includes(id))expect(root.userData.consumedConstruction).toBeGreaterThan(0);
    f.dispose();
  });
  it('keeps construction deterministic and never deforms shared organic source topology',()=>{
    const shared=organicGeometry(0),positions=Array.from(shared.getAttribute('position').array),a=fixture('swarm-junction'),b=fixture('swarm-junction');
    expect(a.parts.length).toBe(b.parts.length);
    for(let i=0;i<a.parts.length;i++)expect(Array.from(a.parts[i].g.getAttribute('position').array)).toEqual(Array.from(b.parts[i].g.getAttribute('position').array));
    expect(Array.from(shared.getAttribute('position').array)).toEqual(positions);a.dispose();b.dispose();
  });
});

it.each(['swarm-junction','infested-workshop','breached-loading-bay','reactor-vault'] as const)('%s binds three connected consumption forms and their lights to actual room geometry',id=>{
 const template=id==='reactor-vault'?ROOM_TEMPLATES[id]:l8PresentationSource(id),environment=shipEnvironment(id)!,world=new T.Group();
 // Use the same procedural machine kit as the production room, rather than
 // broad test boxes that could hide a missing roof probe between real supports.
 for(const [index,r]of template.obstacles.entries())appendEnvironment(world,environmentObstacle(environment,{x:r.x/32,y:r.y/32,width:r.width/32,height:r.height/32},index,id));
 environmentArchitecture(world,environment,template.width/32,template.height/32,id);
 const root=addWorldDressing(world,template,environment,id),forms=root.userData.consumptionForms as Array<{kind:string;source:number[]}>;
 expect(forms.filter(form=>form.kind==='machine-saddle')).toHaveLength(2);
 expect(forms.filter(form=>form.kind==='climbing-hull-web')).toHaveLength(1);
 expect(forms.find(form=>form.kind==='climbing-hull-web')!.source[0]).toBeLessThan(template.width/32*.40);
 expect(root.userData.coveredBreach).not.toBeNull();
 expect(root.userData.consumptionSkinWinding.every((skin:{upward:number;downward:number})=>skin.upward>0&&skin.downward===0)).toBe(true);
 expect(root.userData.partlyBuriedHumanFixture.span).toBeGreaterThan(.5);
 expect(root.userData.constructionNewFinishes).toEqual([]);
 const fixtures=root.userData.lightFixtures as Array<{x:number;y:number;z:number;color:number;poolStyle:number;nativeColor:boolean;gain:number}>;
 expect(fixtures).toHaveLength(3);
 const colors=fixtures.map(f=>new T.Color(f.color));expect(colors.some(c=>c.g>c.r&&c.g>c.b)).toBe(true);expect(colors.some(c=>c.r>c.g&&c.b>c.g)).toBe(true);
 const triangle=new T.Triangle(),target=new T.Vector3(),closest=new T.Vector3();
 for(const fixture of fixtures){
  expect(fixture.poolStyle).toBe(3);expect(fixture.nativeColor).toBe(true);expect(fixture.gain).toBeGreaterThan(0);expect(fixture.gain).toBeLessThanOrEqual(1);
  expect([fixture.x,fixture.y,fixture.z].every(Number.isFinite)).toBe(true);
  target.set(fixture.x,fixture.y,fixture.z);let nearest=Infinity;
  root.traverse(object=>{
   if(!(object instanceof T.Mesh)||!['g2-dressing-resin','g2-dressing-vein'].includes((object.material as T.Material).name))return;
   const p=object.geometry.getAttribute('position'),index=object.geometry.index;
   for(let i=0;i<(index?.count??p.count);i+=3){triangle.a.fromBufferAttribute(p,index?.getX(i)??i);triangle.b.fromBufferAttribute(p,index?.getX(i+1)??i+1);triangle.c.fromBufferAttribute(p,index?.getX(i+2)??i+2);triangle.closestPointToPoint(target,closest);nearest=Math.min(nearest,closest.distanceTo(target));}
  });
  expect(nearest,`${id} fixture ${target.toArray()} detached from consumption surface`).toBeLessThan(.36);
 }
 disposeModel(world);
});
