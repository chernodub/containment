import * as T from 'three';

/** Broad analytic bounce beneath motivated fixtures, in one bounded draw. */
export class PracticalPools {
  private disposed=false;
  readonly root: T.InstancedMesh<T.PlaneGeometry,T.ShaderMaterial>;
  private readonly dummy = new T.Object3D();
  private readonly color = new T.Color();
  private readonly transforms = new Float64Array(20).fill(NaN);
  private readonly colors = new Float64Array(12).fill(NaN);
  constructor(scene:T.Scene) {
    const geometry=new T.PlaneGeometry(2,2);geometry.rotateX(-Math.PI/2);geometry.setAttribute('apertureStyleNumber',new T.InstancedBufferAttribute(new Float32Array(4),1));geometry.setAttribute('reactorPoolAmount',new T.InstancedBufferAttribute(new Float32Array(4).fill(1),1));
    const material=new T.ShaderMaterial({
      transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{poolIntensity:{value:.22}},
      vertexShader:`attribute float apertureStyleNumber;varying float apertureStyle;attribute float reactorPoolAmount;varying vec2 poolUv;varying vec3 poolColor;varying float reactorPool;void main(){apertureStyle=apertureStyleNumber;poolUv=uv;poolColor=instanceColor;reactorPool=reactorPoolAmount;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
      fragmentShader:`uniform float poolIntensity;varying float apertureStyle;varying vec2 poolUv;varying vec3 poolColor;varying float reactorPool;void main(){vec2 q=poolUv*2.0-1.0;
float reach=1.0-poolUv.y;
float span=mix(.22,.95,reach);
float crossMask=1.0-smoothstep(.78,1.0,abs(q.x)/span);
float bars=mix(.35,1.0,smoothstep(.03,.12,abs(abs(q.x/span)-.36)));
float pool=crossMask*bars*smoothstep(0.0,.06,reach)*(1.0-smoothstep(.52,1.0,reach));
gl_FragColor=vec4(poolColor,pool*poolIntensity);
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
    let count=0,matricesChanged=false,colorsChanged=false,stylesChanged=false;const styles=this.root.geometry.getAttribute('apertureStyleNumber') as T.InstancedBufferAttribute;
    for(const fixture of fixtures){
      if(fixture.userData.worldBounceGain===0||!fixture.visible||fixture.intensity<=0||count>=(high?4:2))continue;
      const reactor=!!fixture.userData.reactorMood;
      const radius=reactor?2.5:Math.min(3.5,Math.max(2.3,fixture.distance*.5));
      const angle=fixture.userData.poolAngle??Math.atan2((fixture.userData.poolCenterX??0)-fixture.position.x,(fixture.userData.poolCenterZ??0)-fixture.position.z);
      const style=fixture.userData.poolStyle??0,width=fixture.userData.poolWidth??(style===1?1.15:style===3?.9:reactor?.72:.85),depth=fixture.userData.poolDepth??(style===3?2.7:radius);
      if(styles.getX(count)!==style){styles.setX(count,style);stylesChanged=true;}
      this.dummy.position.set(fixture.position.x,.035,fixture.position.z);
      this.dummy.position.x+=Math.sin(angle)*depth;
      this.dummy.position.z+=Math.cos(angle)*depth;
      const offset=count*5;
      if(this.transforms[offset]!==this.dummy.position.x||this.transforms[offset+1]!==this.dummy.position.z||this.transforms[offset+2]!==depth||this.transforms[offset+3]!==width||this.transforms[offset+4]!==angle){
        this.transforms[offset]=this.dummy.position.x;this.transforms[offset+1]=this.dummy.position.z;this.transforms[offset+2]=depth;this.transforms[offset+3]=width;this.transforms[offset+4]=angle;
        this.dummy.rotation.y=angle;this.dummy.scale.set(width,1,depth);this.dummy.updateMatrix();this.root.setMatrixAt(count,this.dummy.matrix);matricesChanged=true;
      }
      const colorOffset=count*3;
      this.color.copy(fixture.color).multiplyScalar(fixture.userData.worldBounceGain??1);this.color.multiplyScalar(reactor?Math.min(1.5,.6+fixture.intensity/32):Math.min(2.2,.6+fixture.intensity/160));
      if(this.colors[colorOffset]!==this.color.r||this.colors[colorOffset+1]!==this.color.g||this.colors[colorOffset+2]!==this.color.b){
        this.colors[colorOffset]=this.color.r;this.colors[colorOffset+1]=this.color.g;this.colors[colorOffset+2]=this.color.b;this.root.setColorAt(count,this.color);colorsChanged=true;
      }
      count++;
    }
    this.root.material.uniforms.poolIntensity.value=fixtures[0]?.userData.reactorMood ? .08 : .14;this.root.count=count;if(stylesChanged)styles.needsUpdate=true;if(matricesChanged)this.root.instanceMatrix.needsUpdate=true;if(colorsChanged)this.root.instanceColor!.needsUpdate=true;
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.root.dispose();this.root.geometry.dispose();this.root.material.dispose();this.root.removeFromParent();}
}
