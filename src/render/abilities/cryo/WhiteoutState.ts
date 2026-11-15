import * as T from 'three';
import type { AbilityZoneSnapshot } from '../../../game/abilities/contract';
import { FRIENDLY_GROUND_ORDER } from '../FriendlyBoundary';
import { UNIT } from '../types';

const vertex = `
uniform vec4 storm;uniform float stormTime;uniform float stormAge;uniform float wallLayer;
varying vec2 local;varying float crest;
void main(){
 local=uv;vec3 p=position;
 float leading=.5+.5*cos(uv.x*6.283185-stormTime*.7);
 crest=leading;
 p.y*=mix(1.,.72+leading*.48,wallLayer);
 p.xz*=storm.z;p.x+=storm.x;p.z+=storm.y;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
const wallFragment = `
uniform float stormTime;uniform float stormAge;uniform vec4 storm;uniform float detail;
varying vec2 local;varying float crest;
void main(){
 // Broken, tapered wind ribbons carry clockwise gusts; no opaque cylinder.
 float u=local.x*6.283185;
 float drift=u-stormTime*.82;
 float lane=local.y+sin(drift*3.)*.12;
 float ribbon=1.-smoothstep(.018,.064,abs(sin(lane*13.+drift*2.)));
 float packet=pow(max(0.,sin(drift*5.+local.y*3.)),3.);
 float vertical=smoothstep(0.,.14,local.y)*(1.-smoothstep(.48,.9,local.y));
 float snow=0.;
 if(detail>.5)snow=pow(max(0.,sin(u*73.-stormTime*21.+floor(local.y*13.)*2.4)),12.)
  *pow(max(0.,sin(local.y*49.+u*4.-stormTime*7.)),5.);
 else snow=step(.95,fract(u*31.-stormTime*8.+floor(local.y*9.)*.17))*step(.65,fract(local.y*13.+u*.8))*.6;
 float a=(ribbon*packet*.48+snow*.65)*vertical*storm.w;
 vec3 cold=mix(vec3(.24,.51,.64),vec3(.83,1.22,1.4),max(ribbon*.6,snow));
 if(a<.004)discard;gl_FragColor=vec4(cold,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 gl_FragColor.rgb*=gl_FragColor.a;
}`;
const groundFragment = `
uniform float stormTime;uniform float stormAge;uniform vec4 storm;uniform float detail;
varying vec2 local;varying float crest;
void main(){
 vec2 p=local*2.-1.;float r=length(p);if(r>1.||r<.245)discard;
 float angle=atan(p.y,p.x);
 // Irregular frost fingers creep over exposed steel, rather than drawing a clock face.
 float creep=min(1.,stormAge/1.9);
 float reach=r+sin(angle*7.+sin(angle*3.)*1.8)*.055+sin(angle*13.)*.026;
 float spread=smoothstep(reach-.05,reach+.025,creep);
 float edge=1.-smoothstep(.92,1.,r);
 // Constant-width veins prevent broad four-point junctions in the frost.
 vec2 q=p*24.;q+=vec2(sin(q.y*.72),sin(q.x*.63))*.55;
 float mainVein=abs(sin(q.x+q.y*.53));
 float branchVein=abs(sin(q.y-q.x*.31));
 float vein=1.-smoothstep(.025,.10,min(mainVein,branchVein));
 vein*=smoothstep(-.4,.2,sin(q.x*.42-q.y*.37));
 float twig=0.;if(detail>.5)twig=(1.-smoothstep(.025,.095,abs(sin(q.x*2.7-q.y*1.3))))*smoothstep(.4,.85,sin(q.x*.6+q.y));
 float deposit=smoothstep(.69,.88,.5+.25*sin(q.x*.37)+.25*sin(q.y*.43));
 float frost=deposit*.055+vein*.16+twig*.08;
 float leading=1.-smoothstep(.012,.04,abs(reach-creep));
 float pulseAge=mod(stormAge,2.);float front=.245+.75*min(1.,pulseAge/.38);
 // Unequal crystalline teeth replace the luminous circular pulse.
 float tooth=pow(max(0.,cos(angle*23.+sin(angle*7.)*1.7)),12.);
 float pulse=(1.-smoothstep(.008,.035,abs(r-front+tooth*.065)))*tooth*(1.-smoothstep(.25,.38,pulseAge));
 float a=((frost+leading*vein*.3)*spread*edge+pulse*.28*edge)*smoothstep(.245,.32,r)*storm.w;
 vec3 c=mix(vec3(.24,.47,.58),vec3(.63,.92,1.02),step(.16,frost));
 c=mix(c,vec3(1.2,1.7,1.9),pulse);
 if(a<.004)discard;gl_FragColor=vec4(c,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 gl_FragColor.rgb*=gl_FragColor.a;
}`;

/** Two prewarmed, fixed meshes: connected perimeter weather and spreading deck frost. */
export class WhiteoutState {
  readonly wall: T.Mesh<T.BufferGeometry, T.ShaderMaterial>;
  readonly ground: T.Mesh<T.PlaneGeometry, T.ShaderMaterial>;
  private readonly data = new T.Vector4();
  private dead = false;
  private readonly meshes: readonly T.Mesh<T.BufferGeometry, T.ShaderMaterial>[];

  constructor(root: T.Object3D) {
    const geometry = new T.CylinderGeometry(.955, .955, 2, 96, 1, true).translate(0, 1.04, 0);
    const material = (fragmentShader: string, wallLayer: number) => new T.ShaderMaterial({
      uniforms: { storm: { value: this.data }, stormTime: { value: 0 }, stormAge: { value: 0 }, detail: { value: 1 }, wallLayer: {value:wallLayer} },
      vertexShader: vertex, fragmentShader, transparent: true, premultipliedAlpha: true,
      depthWrite: false, side: T.DoubleSide, forceSinglePass: true,
    });
    this.wall = new T.Mesh(geometry, material(wallFragment,1));
    this.wall.name = 'whiteout-connected-wind-wall';
    this.ground = new T.Mesh(new T.PlaneGeometry(2, 2).rotateX(-Math.PI / 2).translate(0, .048, 0), material(groundFragment,0));
    this.ground.name = 'whiteout-spreading-floor-frost';
    this.ground.renderOrder = FRIENDLY_GROUND_ORDER;
    this.wall.frustumCulled = this.ground.frustumCulled = false;
    this.meshes = [this.wall, this.ground];
    root.add(this.ground, this.wall);this.clear();
  }

  update(zone: AbilityZoneSnapshot | undefined, low: boolean, reducedMotion: boolean, flash: number): void {
    if (this.dead) return;
    if (!zone || zone.remainingMs <= 0) { this.clear(); return; }
    const age = (zone.durationMs-zone.remainingMs)/1000;
    const fade = Math.min(1, age/.15, zone.remainingMs/600);
    this.data.set(zone.x/UNIT, zone.y/UNIT, zone.radius/UNIT, fade*(.65+.35*flash));
    for (const mesh of this.meshes) {
      const uniforms=mesh.material.uniforms;
      uniforms.stormTime.value=reducedMotion?0:age;
      uniforms.stormAge.value=reducedMotion?3:age;
      uniforms.detail.value=low?.35:1;
      mesh.visible=true;
    }
  }

  clear(): void { this.wall.visible=this.ground.visible=false; }
  dispose(): void {
    if(this.dead)return;this.dead=true;
    this.wall.geometry.dispose();this.wall.material.dispose();this.wall.removeFromParent();
    this.ground.geometry.dispose();this.ground.material.dispose();this.ground.removeFromParent();
  }
}
