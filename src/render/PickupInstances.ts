import * as T from 'three';
import {MAX_ACTIVE_PICKUPS, PICKUP_KINDS, type PickupKind, type PickupSnapshot} from '../game/pickups/PickupSystem';
import {loadPickupModels,pickupModel} from './PickupModels';

type Draw = {
  mesh: T.InstancedMesh;
  onDeck:boolean;
  high:T.BufferGeometry;
  low:T.BufferGeometry;
  local: T.Matrix4;
  range: {start: number; count: number};
};

/** Retained native pickup silhouettes, with one draw per occupied kind/material. */
export class PickupInstances {
  readonly root = new T.Group();
  private readonly kinds: Record<PickupKind, Draw[]> = {credits: [], health: [], armor: [], ammo: [], grenade: []};
  private readonly draws: Draw[] = [];
  private readonly pose = new T.Matrix4();
  private readonly matrix = new T.Matrix4();
  private disposed = false;

  private ready?:Promise<void>;
  private templates?:T.Group;
  private low=false;

  constructor() {
    this.root.name = 'pickup-instances';
    this.root.matrixAutoUpdate = false;
  }

  prepare(renderer:T.WebGLRenderer, register:(root:T.Group)=>void) {
    return this.ready??=loadPickupModels(renderer).then(templates=>{
      this.templates=templates;
      if(this.disposed){this.releaseTemplates();return;}
      this.populate(templates);
      this.setLow(this.low);
      register(this.root);
    }).catch(error=>{this.ready=undefined;throw error;});
  }

  private populate(templates:T.Group) {
    for (const kind of PICKUP_KINDS) {
      const source = pickupModel(templates,kind);
      source.updateMatrixWorld(true);
      source.traverse(object => {
        if (!(object instanceof T.Mesh)) return;
        const mesh = new T.InstancedMesh(object.geometry, object.material, MAX_ACTIVE_PICKUPS);
        mesh.name = `${source.name}-${this.kinds[kind].length}`;
        mesh.castShadow = object.castShadow;
        mesh.receiveShadow = object.receiveShadow;
        mesh.renderOrder = object.renderOrder;
        mesh.frustumCulled = false;
        mesh.matrixAutoUpdate = false;
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
        mesh.count = 0;
        mesh.visible = false;
        const draw = {mesh, high:object.geometry, low:object.userData.lowGeometry??object.geometry, onDeck:object.name==='deck-contact', local: object.matrixWorld.clone(), range: {start: 0, count: 0}};
        this.kinds[kind].push(draw);
        this.draws.push(draw);
        this.root.add(mesh);
      });
      source.clear();
    }
  }

  /** Match ordinary pickup placement exactly; snapshot alpha remains presentation-neutral. */
  update(snapshot: readonly PickupSnapshot[], time: number, reveal?:{id:number;age:number}): void {
    if (this.disposed) return;
    for (const draw of this.draws) draw.mesh.count = 0;
    this.pose.makeRotationY(time * .6);
    const limit = Math.min(snapshot.length, MAX_ACTIVE_PICKUPS);
    for (let i = 0; i < limit; i++) {
      const item = snapshot[i];
      const rise=reveal?.id===item.id?Math.sin(Math.PI*Math.max(0,Math.min(1,reveal.age/1.15)))*.6:0;
      const height=.18 + Math.sin(time * 2 + item.id) * .07+rise;
      for (const draw of this.kinds[item.kind]) {
        this.pose.setPosition(item.x / 32, draw.onDeck?0:height, item.y / 32);
        this.matrix.multiplyMatrices(this.pose, draw.local);
        draw.mesh.setMatrixAt(draw.mesh.count++, this.matrix);
      }
    }
    for (const {mesh, range} of this.draws) {
      mesh.visible = mesh.count > 0;
      if (!mesh.count) continue;
      range.count = mesh.count * 16;
      // Three clears ranges on upload. Keep our record instead of allocating one per frame.
      mesh.instanceMatrix.updateRanges[0] = range;
      mesh.instanceMatrix.updateRanges.length = 1;
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  setLow(low:boolean){
    this.low=low;
    if(!this.templates)return;
    for(const draw of this.draws){
      draw.mesh.geometry=low?draw.low:draw.high;
    }
  }

  private releaseTemplates(){
    const materials=new Set<T.MeshStandardMaterial>();
    this.templates?.traverse(node=>{
      if(node instanceof T.Mesh){node.geometry.dispose();materials.add(node.material);}
    });
    for(const material of materials){
      material.map?.dispose();material.emissiveMap?.dispose();material.dispose();
    }
    this.templates=undefined;
  }

  /** Hide every pickup while retaining the prepared GPU inventory. */
  clear(): void {
    for (const {mesh} of this.draws) { mesh.count = 0; mesh.visible = false; }
  }

  /** Release owned geometry and instance buffers, preserving shared finishes and primitives. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clear();
    for (const {mesh,high,low} of this.draws) {
      (mesh.material as T.Material).dispose();
      high.dispose();
      if(low!==high)low.dispose();
      mesh.dispose();
    }
    this.releaseTemplates();
    this.root.removeFromParent();
    this.root.clear();
  }
}
