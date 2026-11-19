import * as T from 'three';
export type HealthBarStatus={chilled?:boolean;burning?:boolean;poisoned?:boolean;frozen?:boolean;shocked?:boolean};
export type HealthBarEntry={x:number;z:number;height:number;health:number;maxHealth:number;elite?:boolean;armor?:number;maxArmor?:number;status?:HealthBarStatus};
export function healthFraction(health:number,maxHealth:number){return Number.isFinite(health)&&Number.isFinite(maxHealth)&&maxHealth>0?T.MathUtils.clamp(health/maxHealth,0,1):0;}
/** Critical health stays readable; armor and active statuses tint healthier bars. */
export function healthBarColor(entry:HealthBarEntry,fraction=healthFraction(entry.health,entry.maxHealth)){
 if(fraction<=.25)return 0xff8b72;
 if((entry.armor??0)>0)return entry.elite?0xdbe8f1:0xd7e0df;
 if(entry.status?.frozen)return 0xb6e4ef;
 if(entry.status?.shocked)return 0xb5a4d7;
 if(entry.status?.burning)return 0xd7a374;
 if(entry.status?.poisoned)return 0xa3bf7d;
 if(entry.status?.chilled)return 0x8ec9d5;
 if(entry.elite)return 0xdbe8f1;
 return fraction<=.5?0xffa183:0xe8f0ed;
}
/** Two shared draw calls for damaged enemies and elites, at a constant pixel size. */
export class EnemyHealthBars{
 readonly root=new T.Group();private background:T.InstancedMesh;private fill:T.InstancedMesh;private dummy=new T.Object3D();private right=new T.Vector3();private cameraPoint=new T.Vector3();private color=new T.Color();
 constructor(private capacity=128){
  const shape=new T.PlaneGeometry(1,1);this.background=new T.InstancedMesh(shape,new T.MeshBasicMaterial({color:0x071110,depthWrite:false,depthTest:false,toneMapped:false}),capacity);
  this.fill=new T.InstancedMesh(shape,new T.MeshBasicMaterial({depthWrite:false,depthTest:false,toneMapped:false}),capacity);
  this.background.renderOrder=1000;this.fill.renderOrder=1001;this.fill.setColorAt(0,new T.Color(0xbcd5b2));
  for(const mesh of [this.background,this.fill]){mesh.frustumCulled=false;mesh.count=0;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.root.add(mesh);}
 }
 update(entries:HealthBarEntry[],camera:T.OrthographicCamera|T.PerspectiveCamera,viewportHeight:number,hidden=false){
  this.root.visible=!hidden;const perspective=camera instanceof T.PerspectiveCamera,view=perspective?2*Math.tan(T.MathUtils.degToRad(camera.fov/2)):camera.top-camera.bottom,perPixel=view/(Math.max(1,viewportHeight)*camera.zoom);this.right.set(1,0,0).applyQuaternion(camera.quaternion);let count=0;
  for(const e of entries){const fraction=healthFraction(e.health,e.maxHealth);if(hidden||fraction<=0||(!e.elite&&fraction>=1)||count>=this.capacity)continue;
   // Camera-space depth, rather than distance to the camera, preserves pixel
   // size for actors both off-axis and at different positions along the deck.
   const depth=perspective?-this.cameraPoint.set(e.x,e.height+.24,e.z).applyMatrix4(camera.matrixWorldInverse).z:1;if(depth<=0)continue;const pixel=perPixel*depth,width=(e.elite?42:34)*pixel,height=5*pixel;
   this.dummy.quaternion.copy(camera.quaternion);this.dummy.position.set(e.x,e.height+.24,e.z);this.dummy.scale.set(width+6*pixel,9*pixel,1);this.dummy.updateMatrix();this.background.setMatrixAt(count,this.dummy.matrix);
   this.dummy.position.addScaledVector(this.right,-width*(1-fraction)/2);this.dummy.scale.set(width*fraction,height,1);this.dummy.updateMatrix();this.fill.setMatrixAt(count,this.dummy.matrix);this.fill.setColorAt(count,this.color.setHex(healthBarColor(e,fraction)));count++;
  }
  this.background.count=this.fill.count=count;this.background.instanceMatrix.needsUpdate=this.fill.instanceMatrix.needsUpdate=true;if(this.fill.instanceColor)this.fill.instanceColor.needsUpdate=true;
 }
 dispose(){this.background.geometry.dispose();(this.background.material as T.Material).dispose();(this.fill.material as T.Material).dispose();this.root.removeFromParent();}
}
