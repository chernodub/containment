import {l8PresentationSource} from '../../../tests/helpers/l8PresentationSource';
import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {addBroodCell,GROWTH_MAT,organicGeometry} from './OrganicGrowth';
import {addEnvironmentalStory,setEnvironmentalStoryOptions} from './EnvironmentalStory';
import {environmentObstacle} from '../ShipEnvironments';
import {addRoomPracticals} from '../lighting/RoomPracticals';
import {addInteriorPracticals} from '../lighting/InteriorPracticals';
import {environmentClock,updateHotFixtureSurfaces} from '../lighting/HotFixtureSurface';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {disposeModel,geometries,MAT} from '../meshParts';
import {authoredRoom} from '../AuthoredRooms';

function transforms(root:T.Object3D){const values:number[][]=[];root.updateWorldMatrix(true,true);root.traverse(object=>{if(object instanceof T.Mesh)values.push(object.matrixWorld.toArray());});return values;}

describe('X2 environmental story rendering',()=>{
  it('layers torn cargo plating, ribs and cable looms outboard without adding material draws',()=>{
    const t=l8PresentationSource('breached-loading-bay'),world=new T.Group(),room=authoredRoom(t.id,t)!;world.add(room);
    const before=new Map<T.Mesh,number>();world.traverse(o=>{if(o instanceof T.Mesh)before.set(o,o.geometry.getAttribute('position').count);});
    const root=addEnvironmentalStory(world,t,'cargo',t.id);expect(root.userData.layeredHull).toBe(true);expect(root.children).toHaveLength(0);
    let changed=0,meshes=0;
    const inside=(x:number,z:number)=>{let value=false;for(let i=0,j=t.boundary!.length-1;i<t.boundary!.length;j=i++){const a=t.boundary![i],b=t.boundary![j];if((a.y>z)!==(b.y>z)&&x<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x)value=!value;}return value;};
    world.traverse(o=>{if(o instanceof T.Mesh){meshes++;const p=o.geometry.getAttribute('position'),old=before.get(o)!;if(p.count>old){changed++;for(let i=old;i<p.count;i++)expect(inside(p.getX(i)*32,p.getZ(i)*32)).toBe(false);}}});
    expect(meshes).toBe(before.size);expect(changed).toBe(2);disposeModel(world);
  });
  it('reproduces irregular brood lobes from a room seed and stays inside fitted collision rectangles',()=>{
    const a=new T.Group(),b=new T.Group(),c=new T.Group();
    addBroodCell(a,1729,3);addBroodCell(b,1729,3);addBroodCell(c,1730,3);
    expect(transforms(a)).toEqual(transforms(b));expect(transforms(a)).not.toEqual(transforms(c));
    // The cell fit must be governed by the brood anatomy, not an oversized base pad.
    const rawSize=new T.Box3().setFromObject(a).getSize(new T.Vector3());expect(rawSize.z).toBeLessThan(3);expect(rawSize.x).toBeLessThan(2.7);
    const footprint={x:3,y:4,width:5,height:7},fitted=environmentObstacle('infested',footprint,3,'swarm-junction',1729);
    const bounds=new T.Box3().setFromObject(fitted);
    expect(bounds.min.x).toBeGreaterThanOrEqual(footprint.x);expect(bounds.max.x).toBeLessThanOrEqual(footprint.x+footprint.width);
    expect(bounds.min.z).toBeGreaterThanOrEqual(footprint.y);expect(bounds.max.z).toBeLessThanOrEqual(footprint.y+footprint.height);
    for(const root of [a,b,c,fitted])disposeModel(root);
  });
  it('connects equipment with flush membranes while preserving the authoritative template',()=>{
    const template=l8PresentationSource('swarm-junction'),before=JSON.stringify(template),world=new T.Group();
    const root=addEnvironmentalStory(world,template,'infested',template.id,1729);
    expect(JSON.stringify(template)).toBe(before);expect(root.children.length).toBeGreaterThan(0);expect(root.children.length).toBeLessThanOrEqual(2);
    const heights=new Set<number>();expect(root.userData.sinuousRoots).toBeGreaterThan(2);
    root.traverse(object=>{if(object instanceof T.Mesh){const p=object.geometry.getAttribute('position');for(let i=0;i<p.count;i++){expect(p.getY(i)).toBeLessThanOrEqual(.025);expect(p.getY(i)).toBeGreaterThanOrEqual(0);heights.add(Math.round(p.getY(i)*100000));}}});
    expect(heights.size).toBeGreaterThan(8); // Tapered elliptical sections, not two flat plank faces.
    disposeModel(root);
  });
  it('keeps the shared primitive inventory bounded across new room seeds',()=>{
    const template=ROOM_TEMPLATES['swarm-junction'];
    const make=(seed:number)=>{const world=new T.Group();addBroodCell(world,seed,2);addEnvironmentalStory(world,template,'infested',template.id,seed);disposeModel(world);};
    make(1);const count=geometries.size;
    for(let seed=2;seed<14;seed++)make(seed);
    expect(geometries.size).toBe(count);
  });
  it('nests organic interior light inside a substantial tissue lobe rather than a flat equipment disc',()=>{
    const world=new T.Group(),platform=new T.Mesh(new T.BoxGeometry(3,1,3),new T.MeshStandardMaterial());platform.position.set(2,.5,2);world.add(platform);
    addInteriorPracticals(world,{obstacles:[{x:16,y:16,width:96,height:96}]},'infested');
    const housing=world.getObjectByName('interior-practical-housings') as T.InstancedMesh,emitter=world.getObjectByName('interior-practical-emitters') as T.InstancedMesh,matrix=new T.Matrix4();
    housing.getMatrixAt(0,matrix);const size=new T.Vector3().setFromMatrixScale(matrix);expect(size.x).toBeLessThan(.2);expect(size.y/size.x).toBeGreaterThan(.5);expect(size.z).toBeLessThan(.25);
    emitter.getMatrixAt(0,matrix);const fissure=emitter.geometry.clone().applyMatrix4(matrix),cut=new T.Box3().setFromBufferAttribute(fissure.getAttribute('position') as T.BufferAttribute).getSize(new T.Vector3());
    expect(cut.y).toBeLessThan(.01);expect(Math.max(cut.x,cut.z)).toBeGreaterThan(.12);expect(Math.max(cut.x,cut.z)/cut.y).toBeGreaterThan(20);fissure.dispose();
    expect(world.children.filter(child=>child instanceof T.InstancedMesh)).toHaveLength(2);disposeModel(world);(platform.material as T.Material).dispose();
  });
  it('uses irregular wall nodules instead of a repeated fixture row without increasing batches',()=>{
    const world=new T.Group();addRoomPracticals(world,30,24,'infested');
    expect(world.children).toHaveLength(2);
    const mesh=world.getObjectByName('living-bioluminescent-nodules') as T.InstancedMesh,matrix=new T.Matrix4(),ys=new Set<number>();
    for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);ys.add(Math.round(matrix.elements[13]*100));}
    expect(ys.size).toBeGreaterThan(mesh.count/2);expect((mesh.material as T.MeshStandardMaterial).emissiveIntensity).toBeLessThan(1);
    const fan=world.getObjectByName('wall-practical-housings') as T.InstancedMesh;fan.geometry.computeBoundingBox();const fanSize=fan.geometry.boundingBox!.getSize(new T.Vector3());
    expect(fanSize.x/Math.max(fanSize.y,fanSize.z)).toBeLessThan(.2); // Attached membrane fan has no central spherical pad.
    disposeModel(world);
  });
  it('bounds slumped topology to three reusable bins and reserves green for internal fissures',()=>{
    const bins=[0,1,2].map(organicGeometry);expect(new Set(bins).size).toBe(3);expect(organicGeometry(5)).toBe(bins[2]);
    for(const material of [GROWTH_MAT.tissue,GROWTH_MAT.carapace]){expect(material.color.g).toBeLessThan(material.color.r);expect(material.color.g).toBeLessThan(material.color.b);expect(material.emissiveIntensity).toBe(1);expect(material.emissive.getHex()).toBe(0);}
    expect(GROWTH_MAT.fissure.emissive.g).toBeGreaterThan(GROWTH_MAT.fissure.emissive.r);
  });
  it('anchors drip particles at visible leaks and shares the prepared motion clock',()=>{
    const template=ROOM_TEMPLATES['coolant-plant'],world=new T.Group(),dressing=new T.Group();dressing.name='g2-world-dressing';
    dressing.userData.leakOrigins=[{x:2,y:.8,z:3}];world.add(dressing);
    const root=addEnvironmentalStory(world,template,'maintenance',template.id),mesh=root.getObjectByName('source-anchored-story-particles') as T.Mesh<T.InstancedBufferGeometry,T.ShaderMaterial>;
    expect(root.userData.sourceCount).toBe(1);expect(mesh.geometry.instanceCount).toBe(12);expect(mesh.material.uniforms.time).toBe(environmentClock);
    const origin=mesh.geometry.getAttribute('origin');expect([origin.getX(0),origin.getY(0),origin.getZ(0)]).toEqual([2,expect.closeTo(.8),3]);
    setEnvironmentalStoryOptions(world,false);expect(mesh.visible).toBe(false);setEnvironmentalStoryOptions(world,true);expect(mesh.visible).toBe(true);
    const geometry=mesh.geometry,material=mesh.material,goneGeometry=vi.spyOn(geometry,'dispose'),goneMaterial=vi.spyOn(material,'dispose');
    updateHotFixtureSurfaces(2);expect(material.uniforms.time.value).toBe(2);expect(mesh.geometry).toBe(geometry);expect(mesh.material).toBe(material);
    updateHotFixtureSurfaces(0);expect(material.uniforms.time.value).toBe(0);
    disposeModel(root);expect(goneGeometry).toHaveBeenCalledTimes(1);expect(goneMaterial).toHaveBeenCalledTimes(1);
  });
  it('casts recognizable overhead plant shadows entirely on existing engineering reservations',()=>{
    const template=l8PresentationSource('diagnostic-gallery'),world=new T.Group();
    for(const r of template.obstacles){const mesh=new T.Mesh(new T.BoxGeometry(r.width/32,1,r.height/32),MAT.steel);mesh.position.set((r.x+r.width/2)/32,.5,(r.y+r.height/2)/32);world.add(mesh);}
    const root=addEnvironmentalStory(world,template,'engineering',template.id);expect(root.userData.overheadMachines).toBe(2);
    let raised=0;root.traverse(o=>{if(o instanceof T.Mesh&&o.name!=='source-anchored-story-particles'){
      expect(o.castShadow).toBe(true);const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++)if(p.getY(i)>1.3){raised++;const x=p.getX(i)*32,z=p.getZ(i)*32;expect(template.obstacles.some(r=>x>=r.x&&x<=r.x+r.width&&z>=r.y&&z<=r.y+r.height)).toBe(true);}
    }});expect(raised).toBeGreaterThan(100);disposeModel(world);
  });
});
