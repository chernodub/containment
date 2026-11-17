import {actorLODGeometry} from './ActorLOD';
import * as T from 'three';

/** Retire old-generation GL listeners while the context is lost, retaining CPU assets. */
export class ContextResources {
  private readonly geometries=new Set<T.BufferGeometry>();
  private readonly materials=new Set<T.Material>();
  private readonly textures=new Set<T.Texture>();
  private readonly instances=new Set<T.InstancedMesh>();
  private readonly observed=new WeakSet<object>();

  /** Call when an owned hierarchy is created or an asynchronous model arrives. */
  track(root:T.Object3D):void {
    root.traverse(object=>{
      if(!(object instanceof T.Mesh))return;
      this.geometry(object.geometry);
      const lod=actorLODGeometry(object.geometry);if(lod)this.geometry(lod);
      for(const material of Array.isArray(object.material)?object.material:[object.material])this.material(material);
      if(object instanceof T.InstancedMesh){
        this.instances.add(object);
        if(!this.observed.has(object)){
          this.observed.add(object);
          object.addEventListener('dispose',()=>this.instances.delete(object));
          object.geometry.addEventListener('dispose',()=>{if(this.instances.has(object))object.dispose();});
        }
      }
      if(object instanceof T.SkinnedMesh&&!this.observed.has(object)){
        this.observed.add(object);
        const previous=object.onAfterRender;
        object.onAfterRender=(renderer,scene,camera,geometry,material,group)=>{
          previous.call(object,renderer,scene,camera,geometry,material,group);
          // Three creates this texture at the first actual skinned draw.
          if(object.skeleton.boneTexture)this.texture(object.skeleton.boneTexture);
        };
      }
    });
  }

  /** Dispose GPU bindings only. Geometry arrays, images, materials and rigs remain reusable. */
  invalidate():void {
    for(const geometry of this.geometries)geometry.dispose();
    for(const instance of this.instances)instance.dispose();
    for(const material of this.materials)material.dispose();
    for(const texture of this.textures)texture.dispose();
  }

  private geometry(resource:T.BufferGeometry){
    this.geometries.add(resource);
    if(this.observed.has(resource))return;
    this.observed.add(resource);resource.addEventListener('dispose',()=>this.geometries.delete(resource));
  }
  private material(resource:T.Material){
    this.materials.add(resource);
    if(!this.observed.has(resource)){this.observed.add(resource);resource.addEventListener('dispose',()=>this.materials.delete(resource));}
    for(const value of Object.values(resource))if(value instanceof T.Texture)this.texture(value);
    if(resource instanceof T.ShaderMaterial)for(const uniform of Object.values(resource.uniforms))if(uniform.value instanceof T.Texture)this.texture(uniform.value);
  }
  private texture(resource:T.Texture){
    this.textures.add(resource);
    if(this.observed.has(resource))return;
    this.observed.add(resource);resource.addEventListener('dispose',()=>this.textures.delete(resource));
  }
}
