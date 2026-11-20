import * as T from 'three';
import { PINCER_WINDOW_MS } from '../../game/waves/EncounterDirector';
import type { DepthGame } from '../../DepthGame';
import type { EnemySnapshot } from '../../game/enemies/EnemySystem';
import type { ActorModel } from '../models';
import { registerOriginalInteriorCutaways, updateOriginalInteriorCutaways, type InteriorCutaway } from './OriginalInteriorCutaways';

export class PincerPresentation {
  readonly root = new T.Group();
  private readonly block = new T.BoxGeometry();
  private readonly body = new T.ConeGeometry(.26, .7, 5);
  private readonly sac = new T.SphereGeometry(.5,12,8);
  private readonly ring = new T.RingGeometry(.68, .82, 48);
  private readonly metal = new T.MeshBasicMaterial({ color: 0x535e65 });
  private readonly warning = new T.MeshBasicMaterial({ color: 0xffb354, side: T.DoubleSide });
  private readonly shadow = new T.MeshBasicMaterial({ color: 0x301b22 });
  private readonly signal = new T.MeshBasicMaterial({ color: 0x63eee2, side: T.DoubleSide });
  private readonly exit = new T.Group();
  private readonly gates = new Map<string, {
    root: T.Group;
    shutter: T.Group;
    silhouettes: {root:T.Group; arrival:number}[];
    countdown: T.Mesh;
  }>();
  private readonly seams: T.Mesh[] = [];
  private readonly pinned = new WeakMap<ActorModel, number>();
  private readonly crownCutaways = new WeakMap<ActorModel, {
    root: T.Group; piece: InteriorCutaway; head: T.Object3D; scale: T.Vector3; cut: boolean;
  }>();
  private readonly noActors = new Map<number, ActorModel>();
  private readonly crownPosition = new T.Vector3();
  private readonly crownExtent = new T.Vector3(1.45, .9, 1.45);

  /** Gate and guardian meshes are created on demand after room readiness. */
  registerWarmup(register: (root: T.Object3D) => void) {
    const variants = new T.Group();
    variants.add(
      new T.Mesh(this.block, this.metal),
      new T.Mesh(this.ring, this.warning),
      new T.Mesh(this.body, this.shadow),
      new T.Mesh(this.ring, this.signal),
    );
    register(variants);
  }

  bossPose(model: ActorModel, enemy: EnemySnapshot, game: DepthGame, unit: number, camera: T.Camera, marineHeight: number) {
    const original = this.pinned.get(model);
    if (original !== undefined) {
      model.body.rotation.x = original;
      this.pinned.delete(model);
    }
    const previousCutaway = this.crownCutaways.get(model);
    if (previousCutaway?.cut) {
      previousCutaway.head.scale.copy(previousCutaway.scale);
      previousCutaway.cut = false;
    }
    if (enemy.wallStunAngle !== undefined) {
      this.pinned.set(model, model.body.rotation.x);
      model.root.rotation.y = Math.PI / 2 - enemy.wallStunAngle;
      model.body.rotation.x += .10;
      this.cutAwayCrown(model, game, camera, marineHeight);
    }
    if (enemy.podStage !== 'opening') return;
    const parent = game.enemies.snapshot.enemies.find(actor => actor.champion === 'matron');
    const angle = parent ? Math.atan2(parent.y - enemy.y, parent.x - enemy.x) : 0;
    const progress = 1 - (enemy.podRemainingMs ?? 0) / 500;
    model.root.rotation.y = -angle;
    model.root.rotation.z = -.3 * progress;
    let seam = this.seams.find(mesh => !mesh.visible);
    if (!seam) {
      seam = new T.Mesh(this.block, this.shadow);
      this.root.add(seam);
      this.seams.push(seam);
    }
    seam.visible = true;
    seam.position.set(enemy.x / unit, .12, enemy.y / unit);
    seam.rotation.y = -angle;
    seam.scale.set(.20 + .08 * progress, .075, .78);
  }

  releaseActor(model: ActorModel) {
    const cutaway=this.crownCutaways.get(model);
    if(cutaway?.cut){cutaway.head.scale.copy(cutaway.scale);cutaway.cut=false;}
    const tilt=this.pinned.get(model);
    if(tilt!==undefined)model.body.rotation.x=tilt;
    this.pinned.delete(model);
  }

  private cutAwayCrown(model: ActorModel, game: DepthGame, camera: T.Camera, marineHeight: number) {
    let cutaway = this.crownCutaways.get(model);
    if (!cutaway) {
      const head = model.root.getObjectByName('head');
      if (!head) return;
      const root = new T.Group();
      const piece: InteriorCutaway = { bounds: new T.Box3(), parts: [], hidden: false };
      registerOriginalInteriorCutaways(root,[piece]);
      cutaway = { root, piece, head, scale: new T.Vector3(), cut: false };
      this.crownCutaways.set(model,cutaway);
    }
    cutaway.head.getWorldPosition(this.crownPosition);
    cutaway.piece.bounds.min.copy(this.crownPosition).sub(this.crownExtent);
    cutaway.piece.bounds.max.copy(this.crownPosition).add(this.crownExtent);
    updateOriginalInteriorCutaways(cutaway.root,camera,game.player,marineHeight,[],this.noActors);
    if (cutaway.piece.hidden) {
      cutaway.scale.copy(cutaway.head.scale);
      cutaway.head.scale.multiplyScalar(.035);
      cutaway.cut = true;
    }
  }

  private readonly brood = new T.Group();
  private readonly broodSac = new T.Mesh(this.sac, this.warning);
  private readonly broodSplits: T.Mesh[] = [];
  private readonly retreats: T.Mesh[] = [];

  private readonly retreatFlinches = new WeakMap<ActorModel, string>();

  retreatPose(model: ActorModel, game: DepthGame, enemy: EnemySnapshot, unit: number, angle: number, stride: number, velocity: {x:number;y:number}) {
    const retreat = game.getEscortRetreat(enemy.id);
    if (!retreat) return {angle, stride};
    const direction = Math.atan2(retreat.y - enemy.y, retreat.x - enemy.x);
    const key = `${game.roomRevision}:${enemy.id}`;
    if (retreat.flinching && this.retreatFlinches.get(model) !== key) {
      this.retreatFlinches.set(model,key);
      model.hit?.(.3,direction);
    }
    if (!retreat.flinching) {
      velocity.x = Math.cos(direction) * enemy.baseSpeed * 2.4;
      velocity.y = Math.sin(direction) * enemy.baseSpeed * 2.4;
    }
    let marker = this.retreats.find(mesh => !mesh.visible);
    if (!marker) {
      marker = new T.Mesh(this.body, this.signal);
      marker.scale.set(.9, .7, .6);
      this.root.add(marker);
      this.retreats.push(marker);
    }
    marker.visible = true;
    marker.position.set(enemy.x / unit, model.height*.68, enemy.y / unit);
    marker.rotation.set(0, -direction, -Math.PI / 2);
    return {angle: retreat.flinching ? angle : direction, stride: retreat.flinching ? 0 : 1};
  }

  private beat = '';
  private sealedSeconds = 0;

  constructor() {
    this.root.add(this.exit,this.brood);
    this.brood.add(this.broodSac);
    for (let i = 0; i < 3; i++) {
      const light = new T.Mesh(this.ring, this.signal);
      light.rotation.x = -Math.PI / 2;
      light.position.y = .12;
      light.scale.setScalar(1 + i * .37);
      this.exit.add(light);
    }
  }

  update(game: DepthGame, unit: number, delta: number, menu: boolean) {
    for (const seam of this.seams) seam.visible = false;
    this.brood.visible=false;
    if (!menu) this.updateBrood(game,unit);
    for (const retreat of this.retreats) retreat.visible = false;
    const encounter = game.encounter;
    const pincer = menu || game.status !== 'playing' && game.status !== 'paused' ? undefined : encounter.pincer;
    const key = pincer ? `${game.roomRevision}:${encounter.beat}` : '';
    if (key !== this.beat) {
      this.beat = key;
      this.sealedSeconds = 0;
      for (const gate of this.gates.values()) {
        gate.root.removeFromParent();
        gate.countdown.geometry.dispose();
      }
      this.gates.clear();
      if (pincer) for (const flank of pincer.flankers) {
        const breach = game.geometry.breaches.find(point => point.id === flank.breachId);
        if (!breach) continue;
        let gate = this.gates.get(breach.id);
        if (!gate) {
          gate = this.createGate();
          gate.root.position.set(breach.x / unit + (breach.facing === 'east' ? .5 : -.5), 0, breach.y / unit);
          gate.root.rotation.y = breach.facing === 'east' ? 0 : Math.PI;
          this.gates.set(breach.id, gate);
        }
        const silhouette = this.makeSilhouette();
        gate.silhouettes.push({root:silhouette,arrival:flank.atMs});
        gate.root.add(silhouette);
      }
    }
    this.exit.visible = pincer?.state === 'sealed';
    if (!pincer) return;
    if (this.exit.visible) {
      this.sealedSeconds += delta;
      const point = game.geometry.exitPoint;
      this.exit.position.set(point.x / unit, 0, point.y / unit);
    }
    for (const gate of this.gates.values()) {
      gate.shutter.position.y = pincer.state === 'open' ? .6 + Math.min(1.4, (pincer.elapsedMs - PINCER_WINDOW_MS) / 190)
        : pincer.state === 'sealed' ? Math.max(0, .6 - this.sealedSeconds * 9) : .6;
      gate.shutter.visible = pincer.state !== 'open' || pincer.elapsedMs < PINCER_WINDOW_MS + 650;
      gate.countdown.visible = pincer.state === 'staging';
      gate.countdown.geometry.setDrawRange(0, Math.ceil(48 * pincer.remainingMs / PINCER_WINDOW_MS) * 6);
      const age = (PINCER_WINDOW_MS - pincer.remainingMs) / 1000;
      gate.silhouettes.forEach(({root,arrival}, i) => {
        const retreat = this.sealedSeconds * 3;
        const advance = Math.min(1,Math.max(0,(pincer.elapsedMs-arrival)/650));
        root.visible = retreat < 1.6 && advance < 1;
        root.position.set(-.64 - retreat + advance * 2, Math.sin(age * 8 + i) * .05,
          (i - (gate.silhouettes.length - 1) / 2) * .51);
      });
    }
  }

  private updateBrood(game: DepthGame, unit: number) {
    const interruption=game.broodInterruption;
    const matron=game.enemies.snapshot.enemies.find(enemy=>enemy.champion==='matron');
    if(!matron||(!matron.broodRemainingMs&&!interruption)) return;
    this.brood.visible=true;
    const remaining=interruption?.remainingMs??0;
    this.broodSac.position.set(matron.x/unit,2.45,matron.y/unit);
    this.broodSac.rotation.z=Math.PI;
    const collapse=Math.min(1,remaining/1800);
    this.broodSac.scale.set(interruption?.82:1.25,interruption ? .16+collapse**12 : 1.4,interruption?.82:1.25);
    this.broodSac.material=interruption?this.signal:this.warning;
    for(const pod of this.broodSplits)pod.visible=false;
    const wither = Math.min(1, remaining / 1500);
    interruption?.pods.forEach((point,index)=>{
      const pod=this.broodSplits[index]??new T.Mesh(this.sac,this.shadow);
      if(!this.broodSplits[index]){
        this.broodSplits.push(pod);
        this.brood.add(pod);
      }
      pod.visible=true;
      const fold = T.MathUtils.smoothstep(1800-remaining, index===0 ? 0 : 120, 650);
      const dx=matron.x-point.x, dz=matron.y-point.y;
      const pull=fold*Math.min(.72,64/Math.max(1,Math.hypot(dx,dz)));
      pod.position.set((point.x+dx*pull)/unit,.36*wither,(point.y+dz*pull)/unit);
      pod.rotation.y=-Math.atan2(dz,dx);
      pod.scale.set((1.28+.58*fold)*wither,(1.65-1.36*fold)*wither,1.1*wither);
      pod.material=this.metal;
    });
  }

  private makeSilhouette() {
    const root = new T.Group();
    const thorax = new T.Mesh(this.body, this.shadow);
    thorax.position.set(0,.5,0);
    thorax.rotation.z = -Math.PI/2;
    root.add(thorax);
    for (const side of [-1,1]) {
      const foreleg = new T.Mesh(this.block,this.shadow);
      foreleg.position.set(.22,.22,side*.21);
      foreleg.scale.set(.08,.54,.085);
      foreleg.rotation.x = side*.55;
      foreleg.rotation.z = .45;
      root.add(foreleg);
      const eye = new T.Mesh(this.block,this.warning);
      eye.position.set(.36,.49,side*.09);
      eye.scale.set(.075,.055,.05);
      root.add(eye);
    }
    return root;
  }

  private createGate() {
    const root = new T.Group();
    const shutter = new T.Group();
    this.root.add(root);
    root.add(shutter);
    for (let i = -3; i <= 3; i++) {
      const bar = new T.Mesh(this.block, i % 2 ? this.metal : this.warning);
      bar.position.set(0, .62, i * .26);
      bar.scale.set(.14, 1.24, .18);
      shutter.add(bar);
    }
    const countdown = new T.Mesh(this.ring.clone(), this.warning);
    countdown.rotation.x = -Math.PI / 2;
    countdown.position.set(.56, .14, 0);
    root.add(countdown);
    return { root, shutter, countdown, silhouettes: [] as {root:T.Group; arrival:number}[] };
  }

  dispose() {
    this.root.removeFromParent();
    for (const gate of this.gates.values()) gate.countdown.geometry.dispose();
    for (const resource of [this.block, this.body, this.sac, this.ring, this.metal, this.warning, this.shadow, this.signal]) resource.dispose();
  }
}
