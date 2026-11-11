import * as T from 'three';
import type {EnvironmentMaterials} from './EnvironmentMaterials';
import {applyFloorVariation} from './lighting/FloorVariation';
import {applyHotFixtureSurface} from './lighting/HotFixtureSurface';
import {optimizeLocalLights} from './lighting/LocalLightShading';
import {addRoomPracticals} from './lighting/RoomPracticals';
import {disposeModel} from './meshParts';

/** Keep references to future-room shader variants so Three cannot evict them after preparation. */
export class MaterialWarmup {
  readonly root=new T.Group();
  private disposed=false;
  constructor(surfaces:Pick<EnvironmentMaterials,'floor'|'wall'|'cover'>){
    this.root.name='retained-room-material-library';this.root.position.y=-40;
    for(const material of [surfaces.floor,surfaces.wall,surfaces.cover])this.add(material);
    addRoomPracticals(this.root,2,2,'infested');
    const hot=this.owned({emissive:0xffd69a,emissiveIntensity:3.4});applyHotFixtureSurface(hot);this.add(hot);
    const annulus=this.owned({roughness:.82,metalness:.2});annulus.name='annulus-deck';applyFloorVariation(annulus,'containment');this.add(annulus);
    // Relay relief and emissive signage use texture combinations absent from
    // the first room. Numeric colors/roughness do not change shader topology.
    const relief=this.owned({normalMap:surfaces.floor.normalMap});relief.name='painted-steel-deck';applyFloorVariation(relief,'communications');this.add(relief);
    this.add(this.owned({map:surfaces.floor.map,emissiveMap:surfaces.floor.map,emissive:0xffffff}));
    this.root.traverse(object=>{if(object instanceof T.Mesh){object.frustumCulled=false;object.matrixAutoUpdate=false;for(const material of Array.isArray(object.material)?object.material:[object.material])if(material instanceof T.MeshStandardMaterial)optimizeLocalLights(material);}});
    this.root.updateMatrix();this.root.matrixAutoUpdate=false;this.root.visible=false;
  }
  /** Hidden during ordinary rendering; visible only while compileAsync enumerates variants. */
  prepare(){this.root.visible=!this.disposed;return()=>{this.root.visible=false;};}
  dispose(){if(this.disposed)return;this.disposed=true;disposeModel(this.root);}
  private owned(parameters:T.MeshStandardMaterialParameters){const material=new T.MeshStandardMaterial(parameters);material.userData.actorMaterial=true;return material;}
  private add(material:T.MeshStandardMaterial){this.root.add(new T.Mesh(new T.PlaneGeometry(1,1),material));}
}
