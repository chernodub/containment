import * as T from 'three';

/** Broad analytic bounce beneath motivated fixtures, in one bounded draw. */
export class PracticalPools {
  private disposed=false;
  readonly root: T.InstancedMesh<T.PlaneGeometry,T.ShaderMaterial>;
  private readonly dummy = new T.Object3D();
  private readonly color = new T.Color();
  private readonly transforms = new Float64Array(12).fill(NaN);
  private readonly colors = new Float64Array(12).fill(NaN);
  constructor(scene:T.Scene) {
    const geometry=new T.PlaneGeometry(2,2);geometry.rotateX(-Math.PI/2);geometry.setAttribute('reactorPoolAmount',new T.InstancedBufferAttribute(new Float32Array(4).fill(1),1));
    const material=new T.ShaderMaterial({
      transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{poolIntensity:{value:.22}},
      vertexShader:`attribute float reactorPoolAmount;varying vec2 poolUv;varying vec3 poolColor;varying float reactorPool;void main(){poolUv=uv;poolColor=instanceColor;reactorPool=reactorPoolAmount;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
      fragmentShader:`uniform float poolIntensity;varying vec2 poolUv;varying vec3 poolColor;varying float reactorPool;void main(){vec2 q=poolUv*2.0-1.0;float r=length(q);float pool=pow(max(0.0,1.0-r*r),mix(2.0,3.0,reactorPool));gl_FragColor=vec4(poolColor,pool*poolIntensity);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
    });
    this.root=new T.InstancedMesh(geometry,material,4);this.root.name='motivated-practical-bounce';
    this.root.setColorAt(0,this.color);this.root.instanceColor!.setUsage(T.DynamicDrawUsage);this.root.instanceMatrix.setUsage(T.DynamicDrawUsage);this.root.frustumCulled=false;this.root.renderOrder=1;scene.add(this.root);
  }
  /** Reuses four authored fixture locations; Low keeps two broad inexpensive pools. */
  update(fixtures:readonly T.PointLight[],high:boolean) {
    if(this.disposed)return;
    let count=0,matricesChanged=false,colorsChanged=false;
    for(const fixture of fixtures){
      if(!fixture.visible||fixture.intensity<=0||count>=(high?4:2))continue;
      const reactor=!!fixture.userData.reactorMood;
      const radius=reactor?Math.min(5.2,Math.max(2.8,fixture.distance*.48)):Math.min(3.6,Math.max(2.3,fixture.distance*.5));
      this.dummy.position.set(fixture.position.x,.035,fixture.position.z);
      if(!reactor&&fixture.position.y<1.8){const dx=(fixture.userData.poolCenterX??fixture.position.x)-fixture.position.x,dz=(fixture.userData.poolCenterZ??fixture.position.z)-fixture.position.z,distance=Math.hypot(dx,dz);if(distance>.01){const offset=Math.min(1.6,distance*.25);this.dummy.position.x+=dx/distance*offset;this.dummy.position.z+=dz/distance*offset;}}
      const offset=count*3;
      if(this.transforms[offset]!==this.dummy.position.x||this.transforms[offset+1]!==this.dummy.position.z||this.transforms[offset+2]!==radius){
        this.transforms[offset]=this.dummy.position.x;this.transforms[offset+1]=this.dummy.position.z;this.transforms[offset+2]=radius;
        this.dummy.scale.set(radius,1,radius);this.dummy.updateMatrix();this.root.setMatrixAt(count,this.dummy.matrix);matricesChanged=true;
      }
      this.color.copy(fixture.color);this.color.multiplyScalar(reactor?Math.min(1.5,.6+fixture.intensity/32):Math.min(2.2,.6+fixture.intensity/160));
      if(this.colors[offset]!==this.color.r||this.colors[offset+1]!==this.color.g||this.colors[offset+2]!==this.color.b){
        this.colors[offset]=this.color.r;this.colors[offset+1]=this.color.g;this.colors[offset+2]=this.color.b;this.root.setColorAt(count,this.color);colorsChanged=true;
      }
      count++;
    }
    this.root.material.uniforms.poolIntensity.value=fixtures[0]?.userData.reactorMood ? .22 : .45;this.root.count=count;if(matricesChanged)this.root.instanceMatrix.needsUpdate=true;if(colorsChanged)this.root.instanceColor!.needsUpdate=true;
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.root.dispose();this.root.geometry.dispose();this.root.material.dispose();this.root.removeFromParent();}
}
