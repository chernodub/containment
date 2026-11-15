import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {generateRun} from '../src/game/roguelike/run';
import {addWorldDressing,updateWorldDressing} from '../src/render/world/WorldDressing';
import {disposeModel} from '../src/render/meshParts';
import {MaterialWarmup} from '../src/render/MaterialWarmup';
import {SceneLighting} from '../src/render/SceneLighting';
import {WARNING_FRAME_LOWEST} from '../src/render/world/WarningRepeaters';
it.each(['diagnostic-gallery','safety-interlock-station','manual-control-chamber'] as const)('%s preserves native bodies through a solid opaque gantry with actor cutouts with stable prepared resources',id=>{
 const t=ROOM_TEMPLATES[id],world=new T.Group(),node=generateRun(1729,3).nodes.find(n=>n.templateId===id)!;
 world.add(DepthRenderer.prototype['buildRoomArchitecture'].call(Object.create(DepthRenderer.prototype),node,t)!);
 const root=addWorldDressing(world,t,id==='manual-control-chamber'?'reactor':'engineering',id),state=root.userData.warningVisibility,display=root.userData.storyDisplays[0];world.updateMatrixWorld(true);
 expect(root.userData.warningSupports).toHaveLength(2);
 for(const foot of root.userData.warningSupports)expect(t.obstacles.some(r=>foot.x>=r.x&&foot.x<=r.x+r.width&&foot.y>=r.y&&foot.y<=r.y+r.height)).toBe(true);
 expect(root.userData.warningClearance).toBe(WARNING_FRAME_LOWEST);
 const screen=state.material as T.MeshStandardMaterial,structure=(root.getObjectByName('g2-dressing-resin') as T.Mesh).material as T.MeshStandardMaterial;
 expect(screen.transparent).toBe(true);expect(screen.depthWrite).toBe(false);expect(structure.transparent).toBe(false);expect(structure.depthWrite).toBe(true);expect(structure.alphaTest).toBe(.3);expect(structure.opacity).toBe(1);expect(structure.vertexColors).toBe(true);
 const center=new T.Vector3().fromArray(display.center),camera=new T.PerspectiveCamera(28,16/9,.1,160);camera.position.copy(center).add(new T.Vector3(0,20,26));camera.lookAt(center);camera.updateMatrixWorld(true);
 // Place a native body in the exact viewing cone, between the camera and text.
 const at=camera.position.clone().lerp(center,(camera.position.y-1)/(camera.position.y-center.y)),body={x:at.x*32,y:at.z*32,radius:28},far={x:-32000,y:-32000,radius:16};
 const scratch=state.point,bounds=state.screenBounds,actorBounds=state.actorBounds,version=screen.version,key=screen.customProgramCacheKey(),geometry=(root.getObjectByName('g2-dressing-display') as T.Mesh).geometry,positions=geometry.attributes.position.array;
 updateWorldDressing(root,1,false,camera,body,2.05);expect(state.faded).toBe(true);expect(screen.opacity).toBeLessThanOrEqual(.04);expect(state.structureFaded).toBe(true);expect(state.fadedParts).toBeGreaterThan(0);expect(state.fadedParts).toBeLessThan(state.totalParts);
 const native={...body,id:7},nativeRoot=new T.Group(),models=new Map([[7,{height:4.61,root:nativeRoot}]]);
 updateWorldDressing(root,2,true,camera,far,2.05,[native],models);expect(state.faded).toBe(true);expect(screen.opacity).toBeLessThanOrEqual(.04);
 nativeRoot.visible=false;updateWorldDressing(root,3,false,camera,far,2.05,[native],models);expect(state.faded).toBe(false);expect(screen.opacity).toBe(.96);expect(state.fadedParts).toBe(0);expect(structure.opacity).toBe(1);
 for(let i=0;i<100;i++)updateWorldDressing(root,i/60,false,camera,body,2.05);
 expect(state.point).toBe(scratch);expect(state.screenBounds).toBe(bounds);expect(state.actorBounds).toBe(actorBounds);expect(geometry.attributes.position.array).toBe(positions);expect(screen.version).toBe(version);expect(screen.customProgramCacheKey()).toBe(key);expect(root.userData.warningStructure.length).toBeGreaterThan(15);expect(root.userData.warningWorkBays.length).toBeGreaterThanOrEqual(3);
 for(const bay of root.userData.warningWorkBays)expect(bay.maxHeight).toBeLessThanOrEqual(.91);
 const gantry=root.getObjectByName('g2-dressing-resin') as T.Mesh,colors=gantry.geometry.getAttribute('color') as T.BufferAttribute;
 expect(colors.itemSize).toBe(4);expect(colors.normalized).toBe(true);expect(colors.array).toBeInstanceOf(Uint8Array);expect(colors.usage).toBe(T.DynamicDrawUsage);
 for(const part of root.userData.warningStructure){const alpha=part.faded?14:part.alpha;expect((alpha/255)>=structure.alphaTest).toBe(!part.faded);for(let i=part.start;i<part.end;i++)expect(part.colors.array[i*4+3]).toBe(alpha);}
 const surfaces={floor:new T.MeshStandardMaterial(),wall:new T.MeshStandardMaterial(),cover:new T.MeshStandardMaterial()},warmup=new MaterialWarmup(surfaces);
 expect(warmup.register(gantry)).toBe(1);const proxy=warmup.root.children.at(-1) as T.Mesh,prepared=proxy.geometry.getAttribute('color');
 expect(prepared.itemSize).toBe(4);expect(prepared.normalized).toBe(true);expect(prepared.array).toBeInstanceOf(Uint8Array);expect(prepared.array).not.toBe(colors.array);
 const colorArray=colors.array,materialVersion=structure.version,cacheKey=structure.customProgramCacheKey(),lighting=new SceneLighting();
 for(const tier of ['low','high','low','high'] as const){lighting.setQuality(tier);lighting.loadRoom(world,t.width/32,t.height/32,id==='manual-control-chamber'?'reactor':'engineering',id);updateWorldDressing(root,0,false,camera,far,2.05);updateWorldDressing(root,0,false,camera,body,2.05);expect(warmup.register(gantry)).toBe(0);}
 expect(colors.array).toBe(colorArray);expect(structure.version).toBe(materialVersion);expect(structure.customProgramCacheKey()).toBe(cacheKey);lighting.dispose();warmup.dispose();Object.values(surfaces).forEach(m=>m.dispose());
 const resources=new Set<T.Material|T.BufferGeometry>();root.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);resources.add(o.material as T.Material);}});const spies=[...resources].map(r=>vi.spyOn(r,'dispose')),texture=vi.spyOn(screen.map!,'dispose');disposeModel(root);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);expect(texture).toHaveBeenCalledTimes(1);disposeModel(world);
});
