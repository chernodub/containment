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
 // A single continuous rotating wind wall, with broad layered currents. The
 // streaks follow its circumference rather than revealing billboard edges.
 float u=local.x*6.283185;
 float lane=local.y+sin(u*3.-stormTime*1.4)*.13;
 float body=(1.-smoothstep(.48,.96,local.y))*smoothstep(0.,.1,local.y);
 float current=1.-smoothstep(.025,.10,abs(sin(lane*11.+u*2.-stormTime*4.)));
 float snow=0.;
 if(detail>.5)snow=pow(max(0.,sin(u*73.-stormTime*21.+floor(local.y*13.)*2.4)),12.)
  *pow(max(0.,sin(local.y*49.+u*4.-stormTime*7.)),5.);
 float leading=pow(crest,5.);
 float edge=(1.-smoothstep(.018,.055,abs(local.y-(.56+sin(u*3.-stormTime*1.4)*.13))))*leading;
 float a=(body*(.25+current*.24)+snow*.82*detail+edge*.53)*storm.w;
 vec3 cold=mix(vec3(.12,.31,.41),vec3(.39,.71,.87),step(.34,current));
 cold=mix(cold,vec3(1.05,1.55,1.7),max(step(.3,snow),edge));
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
 float spread=smoothstep(r-.07,r+.04,min(1.,stormAge/1.9));
 float edge=1.-smoothstep(.92,1.,r);
 // Large branching deposits and three value groups, with exposed steel between.
 float branch=pow(max(0.,1.-abs(sin(angle*19.+sin(r*27.)*.32))),18.);
 float twig=0.;if(detail>.5)twig=pow(max(0.,1.-abs(sin(angle*41.-r*35.))),24.)*branch;
 float deposit=.5+.25*sin(p.x*13.+sin(p.y*9.))+.25*sin(p.y*11.-p.x*5.);
 float field=.07+smoothstep(.28,.36,deposit)*.06+smoothstep(.70,.78,deposit)*.05;
 float frost=field+branch*.09+twig*.12;
 float pulseAge=mod(stormAge,2.);float front=.245+.75*min(1.,pulseAge/.38);
 float pulse=(1.-smoothstep(.004,.014,abs(r-front)))*(1.-smoothstep(.25,.38,pulseAge));
 float a=(frost*spread*edge+pulse*.18*edge)*smoothstep(.245,.32,r)*storm.w;
 vec3 c=mix(vec3(.24,.47,.58),vec3(.63,.92,1.02),step(.17,frost));
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
