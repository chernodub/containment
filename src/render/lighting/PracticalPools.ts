import * as T from 'three';

/** Broad analytic bounce beneath motivated fixtures, in one bounded draw. */
export class PracticalPools {
  private disposed=false;
  readonly root: T.InstancedMesh<T.PlaneGeometry,T.ShaderMaterial>;
  private readonly dummy = new T.Object3D();
  private readonly color = new T.Color();
  private readonly fillColor = new T.Color(0xdbe4e8);
  constructor(scene:T.Scene) {
    const geometry=new T.PlaneGeometry(2,2);geometry.rotateX(-Math.PI/2);
    const material=new T.ShaderMaterial({
      transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      vertexShader:`varying vec2 poolUv;varying vec3 poolColor;void main(){poolUv=uv;poolColor=instanceColor;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
      fragmentShader:`varying vec2 poolUv;varying vec3 poolColor;void main(){vec2 q=poolUv*2.0-1.0;float r=length(q);float pool=pow(max(0.0,1.0-r*r),2.0);gl_FragColor=vec4(poolColor,pool*.22);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
    });
    this.root=new T.InstancedMesh(geometry,material,4);this.root.name='motivated-practical-bounce';
    this.root.setColorAt(0,this.color);this.root.instanceMatrix.setUsage(T.DynamicDrawUsage);this.root.frustumCulled=false;this.root.renderOrder=1;scene.add(this.root);
  }
  /** Reuses four authored fixture locations; Low keeps two broad inexpensive pools. */
  update(fixtures:readonly T.PointLight[],high:boolean) {
    if(this.disposed)return;
    let count=0;
    for(const fixture of fixtures){
      if(!fixture.visible||fixture.intensity<=0||count>=(high?4:2))continue;
      const radius=Math.min(6.5,Math.max(3,fixture.distance*.72));
      this.dummy.position.set(fixture.position.x,.035,fixture.position.z);this.dummy.scale.set(radius,1,radius);this.dummy.updateMatrix();this.root.setMatrixAt(count,this.dummy.matrix);
      this.color.copy(fixture.color).lerp(this.fillColor,.48).multiplyScalar(Math.min(1.5,.6+fixture.intensity/32));this.root.setColorAt(count++,this.color);
    }
    this.root.count=count;this.root.instanceMatrix.needsUpdate=true;if(this.root.instanceColor)this.root.instanceColor.needsUpdate=true;
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.root.geometry.dispose();this.root.material.dispose();this.root.removeFromParent();}
}
