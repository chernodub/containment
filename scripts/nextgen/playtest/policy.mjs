/** Deterministic decision helpers; these never call game actions. */
export {BOT_POLICY_VERSION} from './bot-navigation-version.mjs';
export const COVERED_RELAY_HEALTH_FRACTION = .6;
export const RIGS = ['breacher', 'cryo', 'pyro', 'arc'];
const PATHS = {
  breacher: ['breacher', 'heavy-pellets', 'chain-reaction', 'seismic-impact', 'afterquake', 'reinforced-bulwark'],
  cryo: ['cryogenic', 'cold-snap', 'absolute-zero', 'shattershot', 'ice-lance', 'permafrost', 'frostbite', 'frost-armor', 'glacial-wake', 'spreading-nova', 'twin-glacier'],
  pyro: ['incendiary', 'scavenger', 'combustion', 'thermal-shock', 'scorched-fan', 'napalm-triplet'],
  arc: ['hot-reload', 'magnetic-feed', 'reactor-cascade', 'last-shell', 'rapid-cycle', 'crossfire', 'forked-overload', 'twin-pylon'],
};
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const WALK_SPEED = 220;
const DECISION_MS = 250;
const INPUT_MS = 1000 / 60;
const EXIT_MARGIN = 6;

function segmentDistanceSquared(px, py, ax, ay, bx, by) {
  const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/length)):0;
  return (px-ax-dx*t)**2+(py-ay-dy*t)**2;
}

function warningContains(enemy, point, radius=point.radius??16) {
  const shape=enemy.meleeShape,angle=enemy.meleeAngle??0;
  const dx=point.x-(enemy.meleeOriginX??enemy.x),dy=point.y-(enemy.meleeOriginY??enemy.y);
  const x=dx*Math.cos(angle)+dy*Math.sin(angle),y=-dx*Math.sin(angle)+dy*Math.cos(angle);
  if(shape.kind==='line')return segmentDistanceSquared(x,y,0,0,shape.range,0)<=(shape.width*.5+radius)**2;
  if(Math.abs(Math.atan2(y,x))<=shape.halfAngle&&Math.hypot(x,y)<=shape.range+radius)return true;
  const bx=Math.cos(shape.halfAngle)*shape.range,by=Math.sin(shape.halfAngle)*shape.range;
  return Math.min(segmentDistanceSquared(x,y,0,0,bx,by),segmentDistanceSquared(x,y,0,0,bx,-by))<=radius**2;
}

/** Read only an active native warning; stepping/dashing never predicts a future hit. */
export function insideMeleeWarning(enemy, point) {
  if (enemy.meleePhase !== 'windup' || !enemy.meleeShape) return false;
  return warningContains(enemy,point);
}

function visibleEnemies(s) {
  return s.enemies.filter(enemy=>enemy.visible&&enemy.health>0);
}

function walkingSpeed(s) {
  // A stopped or blocked marine still knows the ordinary walking speed. Faster
  // movement is learned from the marine's own observed velocity, not rig rules.
  return Math.max(WALK_SPEED,s.abilities.dashing?0:Math.hypot(s.player.vx??0,s.player.vy??0));
}

function warningTime(enemy,s) {
  const remaining=Number.isFinite(enemy.meleeRemainingMs)?enemy.meleeRemainingMs:
    Number.isFinite(enemy.meleeDurationMs)?enemy.meleeDurationMs*(1-(enemy.meleeProgress??0)):Infinity;
  const scale=Math.max(.01,s.abilities.hostileTimeScale??1);
  const active=s.abilities.overdrive?.activeRemainingMs;
  // A visible dilation timer can expire before the strike; do not assume the
  // current slow lasts longer than the marine's own displayed active duration.
  if(scale<1&&Number.isFinite(active)&&active>0){
    const slowed=active*scale;
    return remaining<=slowed?remaining/scale:active+remaining-slowed;
  }
  return remaining/scale;
}

/** Distance along a proposed input ray until the currently drawn footprint clears. */
function exitDistance(enemy,player,ux,uy) {
  const radius=(player.radius??16)+EXIT_MARGIN;
  let low=0,high=distance(player,{x:enemy.meleeOriginX??enemy.x,y:enemy.meleeOriginY??enemy.y})
    +enemy.meleeShape.range+(enemy.meleeShape.width??0)+radius*2+1;
  for(let step=0;step<12;step++){
    const middle=(low+high)/2;
    if(warningContains(enemy,{x:player.x+ux*middle,y:player.y+uy*middle},radius))low=middle;
    else high=middle;
  }
  return high;
}

function candidateVelocity(s,candidate) {
  // Match the public native WASD transform used by both players. Probe points
  // remain the ordinary 90-unit navigation lookahead; melee exits use actual input.
  const x=candidate.dx,y=candidate.dy/.81,length=Math.hypot(x,y)||1,speed=walkingSpeed(s);
  return {x:x/length*speed,y:y/length*speed};
}

/** Escape the visible shape itself, before ordinary fire-lane/spacing preferences. */
function meleeEscapePlan(s) {
  const warnings=visibleEnemies(s).filter(enemy=>enemy.meleePhase==='windup'&&enemy.meleeShape);
  const inside=warnings.filter(enemy=>insideMeleeWarning(enemy,s.player));
  if(!inside.length)return null;
  inside.sort((a,b)=>warningTime(a,s)-warningTime(b,s)||a.id-b.id);
  const primary=inside[0],angle=primary.meleeAngle??0;
  const px=s.player.x-(primary.meleeOriginX??primary.x),py=s.player.y-(primary.meleeOriginY??primary.y);
  const radial=Math.hypot(px,py);
  // Back away from a lunge arc. Lines and cones are shorter to cross sideways
  // than to run down their length; either side remains an ordinary legal input.
  const away=primary.meleeShape.kind==='arc'
    ?{x:radial?px/radial:Math.cos(angle),y:radial?py/radial:Math.sin(angle)}:null;
  const speed=walkingSpeed(s),radius=s.player.radius??16;
  const choices=[];
  for(const candidate of s.candidates){
    const length=Math.hypot(candidate.dx,candidate.dy);
    if(!candidate.legal||!length)continue;
    const velocity=candidateVelocity(s,candidate),ux=velocity.x/speed,uy=velocity.y/speed;
    const alignment=away?ux*away.x+uy*away.y:Math.abs(-ux*Math.sin(angle)+uy*Math.cos(angle));
    const needed=Math.max(...inside.map(enemy=>exitDistance(enemy,s.player,ux,uy)));
    const walkable=inside.every(enemy=>exitDistance(enemy,s.player,ux,uy)/speed*1000+INPUT_MS<=warningTime(enemy,s));
    let crossing=0;
    for(const enemy of warnings){
      if(inside.includes(enemy))continue;
      const time=warningTime(enemy,s);
      if(time>DECISION_MS)continue;
      const p={x:s.player.x+ux*speed*time/1000,y:s.player.y+uy*speed*time/1000,radius};
      if(insideMeleeWarning(enemy,p))crossing++;
    }
    const exit={x:s.player.x+ux*needed,y:s.player.y+uy*needed};
    const hazard=s.hazards.filter(h=>h.visible!==false&&h.kind!=='melee-warning')
      .reduce((sum,h)=>sum+Math.max(0,h.radius+radius-distance(exit,h)),0);
    choices.push({candidate,alignment,needed,walkable,crossing,cost:needed+hazard*.25+(1-alignment)*12});
  }
  if(!choices.length)return null;
  const preferred=choices.filter(choice=>choice.alignment>=.70);
  let pool=preferred.length?preferred:choices;
  const safeWalk=pool.filter(choice=>choice.walkable&&!choice.crossing);
  if(safeWalk.length)pool=safeWalk;
  else{
    // A blocked preferred lane can yield to another walking exit before spending
    // a charge. No target or future enemy decision enters this comparison.
    const alternateWalk=choices.filter(choice=>choice.walkable&&!choice.crossing);
    if(alternateWalk.length)pool=alternateWalk;
  }
  pool.sort((a,b)=>a.crossing-b.crossing||a.cost-b.cost);
  const chosen=pool[0];
  return {candidate:chosen.candidate,needsDash:!chosen.walkable};
}
/** Prefer own augments, then path enablers, universal cooldown/charge, survival. */
export function chooseBoon(ids, rig, owned = []) {
  const score = id => {
    const path = PATHS[rig] ?? [];
    if(['siege-plow','fault-line','shard-harvest','ice-road','ember-relay','meltdown-core','pilgrim-pylon','live-wire'].includes(id))return 150;
    if (path.slice(-2).includes(id)) return 130;
    if (id === path[0] && !owned.includes(path[0])) return 120;
    if (path.includes(id)) return 100;
    if (['reserve-thruster', 'drive-dynamo', 'tactical-salvage', 'slide-loader'].includes(id)) return 90;
    if (/plating|armor|vital|scavenger|vamp|recovery/.test(id)) return 60;
    return 10;
  };
  return [...ids].sort((a, b) => score(b) - score(a) || (score(a)===150?ids.indexOf(a)-ids.indexOf(b):a.localeCompare(b)))[0];
}
/** Safe routes before elites; prefer medical over supplies at low health. */
export function chooseRoute(routes, health = 100) {
  return [...routes].sort((a, b) => {
    const score = r => (r.kind === 'elite' ? -100 : 0) + (r.kind === 'medical' && health < 75 ? 50 : 0) + (r.kind === 'armory' ? 10 : 0);
    return score(b) - score(a) || a.id.localeCompare(b.id);
  })[0];
}
/** Shop only from currently offered/affordable buttons; no future-room knowledge. */
export function chooseServicePurchase(available,combat,build={},run={}) {
  const priorities=['revive'];
  if(combat.health<70)priorities.push('heal');
  if(combat.armor<20)priorities.push('armor');
  if(combat.medkits<2)priorities.push('medkit');
  priorities.push('upgrade');
  if(combat.grenades<2)priorities.push('grenade');
  if((run.rerollTokens??0)<1)priorities.push('reroll');
  if(combat.reserve<12)priorities.push('ammo');
  return priorities.find(id=>available.includes(id))??null;
}
// RUN15 run structure. Only score terms published on the route cards.
export function chooseDetour(combat,depth,offers=[],profile='competent',seed) {
  if(depth===2&&Number.isInteger(seed))return seed%2?'salvage':'direct';
  const salvage=offers.find(offer=>offer.detour==='salvage'&&!offer.disabled);
  const direct=offers.find(offer=>offer.detour==='direct');
  const risk=offer=>Number(['dark','vent','conduit','brood'].includes(offer?.condition?.id))*2 + Number(/pincer|crossfire/i.test(offer?.variant??''));
  if(salvage?.variant&&direct?.variant){
    const hurt=combat.health<(profile==='novice'?80:65);
    if(hurt&&depth!==10&&risk(salvage)<risk(direct))return 'salvage';
    if(hurt&&risk(salvage)>risk(direct))return 'direct';
    if(!hurt&&profile==='competent'&&[2,6,10].includes(depth))return 'salvage';
  }
  if(depth===2)return 'salvage';
  if(depth===6)return combat.credits>=70&&(combat.armor<30||combat.grenades<2)?'salvage':'direct';
  if(depth===10)return combat.health<70?'direct':'salvage';
  return combat.health>=85&&combat.armor>=25&&combat.medkits>0?'salvage':'direct';
}
function conditionDecision(s,perceived,movement,target,keys){
  const condition=s.conditionObservation;
  if(!condition)return {movement,target};
  const onZone=(point,z)=>z.end?segmentDistanceSquared(point.x,point.y,z.x,z.y,z.end.x,z.end.y)<=z.radius*z.radius:distance(point,z)<=z.radius;
  const legal=s.candidates.filter(c=>c.legal);
  if(condition.id==='brood')target=perceived.enemies.find(e=>e.clear&&condition.eggIds.includes(e.id))??target;
  if(condition.id==='conduit'&&condition.conduitLive){
    const selected=legal.find(c=>c.dx===movement.dx&&c.dy===movement.dy);
    if(condition.zones.some(z=>onZone(s.player,z)||selected&&onZone(selected,z))){
      movement=legal.find(c=>(c.dx||c.dy)&&condition.zones.every(z=>!onZone(c,z)))??movement;
    }
  }
  if(condition.id==='vent'&&condition.ventLive&&condition.zones[0]&&distance(s.player,condition.zones[0])<450){
    const breach=condition.zones[0];
    movement=legal.toSorted((a,b)=>distance(b,breach)-distance(a,breach))[0]??movement;
    if(s.abilities.slots?.dash?.ready&&!keys.includes('Shift'))keys.unshift('Shift');
  }
  if(condition.id==='coolant'&&['breacher','cryo'].includes(s.abilities.rig)&&target&&condition.zones.some(z=>onZone(target,z))&&Math.hypot(s.player.x-target.x,s.player.y-target.y)<190&&s.abilities.slots?.tactical?.ready&&!keys.includes('q'))keys.push('q');
  return {movement,target};
}
// End RUN15 run structure.
/** Focus a visible marked priority threat, then ranged pressure; never use hidden state. */
export function chooseTarget(enemies, player, weaponRange = 0) {
  return enemies.filter(e => e.health > 0 && e.clear && e.visible && e.vulnerable !== false).sort((a, b) => {
    const score = e => (e.id === -1 ? 1000 : e.priority ? 850 : e.champion || e.id < 0 ? 600 : 0) + (e.pod ? 650 : e.type === 'spitter' ? 400 : 0) + (e.elite ? 180 : 0) - distance(e, player);
    const punish = e => !e.champion && e.exposedMs >= 150 && distance(e, player) <= weaponRange &&
      (e.type === 'brute' || e.type === 'carrier' || e.type === 'stalker');
    const cancel = e => !!e.reserveLeader && distance(e, player) <= Math.min(weaponRange, 480);
    return Number(punish(b)) - Number(punish(a)) || Number(cancel(b)) - Number(cancel(a)) || score(b) - score(a) || a.id - b.id;
  })[0];
}
/** Score legal movement endpoints for spacing, fire lanes and hazard avoidance. */
export function chooseMovement(s, previous = {x: 0, y: 0}) {
  const escape=meleeEscapePlan(s);
  if(escape)return escape.candidate;
  const target = chooseTarget(s.enemies, s.player, s.weaponRange);
  const chase = !target && s.enemies.length ? [...s.enemies].sort((a, b) => distance(a, s.player) - distance(b, s.player))[0] : null;
  const visible=visibleEnemies(s),speed=walkingSpeed(s),radius=s.player.radius??16;
  let best = null, highest = -Infinity;
  for (const c of s.candidates.filter(candidate=>candidate.legal)) {
    const velocity=candidateVelocity(s,c),seconds=Math.min(DECISION_MS/1000,distance(c,s.player)/speed);
    const next={x:s.player.x+velocity.x*seconds,y:s.player.y+velocity.y*seconds,radius};
    // Blocked contacts behind cover must not override pursuit of a waypoint.
    const spacingEnemies=target?s.enemies:visible.filter(enemy=>enemy.clear);
    const nearest = Math.min(800, ...spacingEnemies.map(e => distance(c, e)));
    // Swarmer reach is a lower safety bound, not an invitation to rush a firing
    // lane. Keep ordinary weapon stand-off when ranged enemies share the room.
    const desired = s.human ? (s.combat.weapon === 'shotgun' ? 140 : 240) + s.human.spacing : s.combat.weapon === 'shotgun' ? 220 : 360;
    let score = Math.min(nearest, desired) * .6;
    if (target) score -= Math.abs(distance(c, target) - desired) * .3;
    // A 90-unit look-ahead can overshoot a nearby waypoint and prefer standing
    // still. With no firing target, score the next input step toward that waypoint;
    // ordinary target spacing and evasion keep their existing look-ahead.
    const objectiveStep=!target?{x:s.player.x+velocity.x*INPUT_MS/1000,y:s.player.y+velocity.y*INPUT_MS/1000}:c;
    if ((chase || s.human && !target) && c.waypoint) score -= distance(objectiveStep, c.waypoint) * 1.5;
    for (const h of s.hazards) if(h.visible!==false&&h.kind!=='melee-warning')
      score -= Math.max(0, h.radius + 100 - distance(c, h)) * 5;
    for (const e of visible) {
      if(insideMeleeWarning(e,next))score-=900;
      if(s.human?.exactSpacing===false||e.type!=='crawler'||!e.meleeShape)continue;
      const keepOut=e.meleeShape.range+radius+18;
      score-=Math.max(0,keepOut-distance(next,e))*18;
      const start=distance(s.player,e);
      if(start>=keepOut){
        const closest=Math.sqrt(segmentDistanceSquared(e.x,e.y,s.player.x,s.player.y,next.x,next.y));
        score-=Math.max(0,keepOut-closest)*22;
      }
    }
    score += (c.dx * previous.x + c.dy * previous.y) * 14;
    const ranged=visible.filter(e=>e.type==='spitter');
    if(ranged.length>=2){const exposed=(c.rangedSightlines??[]).filter(id=>ranged.some(e=>e.id===id)).length;score-=Math.max(0,exposed-1)*135;}
    if(s.shutterBait&&c.waypoint)score-=distance(next,c.waypoint)*4;
    if(s.gate&&c.waypoint){score-=distance(next,c.waypoint)*4;score-=Math.max(0,distance(next,s.gate)-8)*4;}
    if(s.siege?.remainingMs>0&&c.waypoint){score-=distance(next,c.waypoint)*1.2;score-=Math.max(0,distance(next,s.siege)-(s.siege.radius-30))*1.5;}
    // Keep firing lanes only while a perceived target can be engaged.
    if (target && c.clear) score += 45;
    if (score > highest) { highest = score; best = c; }
  }
  return best ?? {dx: 0, dy: 0, x: s.player.x, y: s.player.y};
}
/** Slots with an actual tactical opportunity; normal input remains authoritative. */
export function chooseActions(s) {
  const near = Math.min(Infinity, ...s.enemies.map(e => distance(e, s.player)));
  const escape=meleeEscapePlan(s);
  // Retain the accepted ranged/acid proximity response. Melee uses only its
  // exact warning and walking deadline, never a duplicate generic circle.
  const hazardDanger=s.hazards.some(h=>h.kind!=='melee-warning'&&distance(s.player,h)<h.radius+50);
  const slots = s.abilities.slots;
  const keys = [];
  const imminent=s.enemies.some(e=>e.visible&&e.meleePhase==='windup'&&e.meleeRemainingMs<250&&distance(e,s.player)<160);
  const visibleHit={crawler:12,stalker:26,spitter:12,carrier:22,brute:42};
  // Standard caps also conservatively cover Story; Veteran needs its public1.3 factor.
  const hitScale=s.difficulty==='veteran'?1.3:1;
  const lethal=s.enemies.some(e=>e.visible&&distance(e,s.player)<200&&s.combat.health+s.combat.armor<=Math.min(45,(visibleHit[e.type]??45)*hitScale));
  const emergency=lethal||s.combat.health<=35&&s.enemies.filter(e=>distance(e,s.player)<200).length>=2;
  if (s.combat.health <= 55 && s.combat.medkits > 0 && (!imminent||emergency)) keys.push('e');
  if ((escape?.needsDash||hazardDanger) && slots?.dash?.ready) keys.push('Shift');
  const cashOut = s.abilityAims?.tactical?.targets.some(id => s.enemies.some(enemy => enemy.id === id && enemy.burning));
  const tacticalOpportunity = s.rig === 'pyro' ? cashOut || near < 155 : near < (s.rig === 'arc' ? 500 : 240);
  if (slots?.tactical?.ready && tacticalOpportunity) keys.push('q');
  const walls = s.abilities.deployables.filter(entity => entity.kind === 'ice-wall');
  const shatter = walls.some(wall => s.enemies.some(enemy => enemy.visible && distance(wall, enemy) <= 110));
  if (walls.length ? slots.power.ready && shatter : (slots?.power?.ready || s.abilityAims?.power && slots?.power?.charges > 0 && !s.abilities.dashing && !Object.values(slots).some(slot => slot.castRemainingMs > 0)) && s.enemies.length >= 2) keys.push('f');
  const earlyFight = s.node?.depth < 4 && s.enemies.filter(enemy => enemy.visible && distance(enemy, s.player) < 350).length >= 3;
  if (slots?.overdrive?.ready && (earlyFight || s.enemies.length >= 6 || emergency && s.enemies.length >= 2 || s.enemies.some(e => e.champion || e.id < 0))) keys.push('v');
  if (s.combat.magazine < s.combat.magazineCapacity * .25 && !s.combat.reloading && near > 300) keys.push('r');
  if (s.combat.grenades > 0 && s.enemies.filter(e => distance(e, s.player) < 400).length >= (emergency?2:4)) keys.push('g');
  return keys.filter(key => {
    const slot = {q:'tactical', f:'power', v:'overdrive'}[key];
    return key === 'f' && walls.length > 0 || !slot || !s.abilityAims || !(slot in s.abilityAims) || !!s.abilityAims[slot];
  });
}
/** Exact sample quantiles, avoiding averages-of-percentiles. */
export function quantiles(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const at = q => sorted[Math.max(0, Math.ceil(sorted.length * q) - 1)] ?? null;
  return {samples: sorted.length, p50: at(.5), p95: at(.95), max: at(1)};
}

/** Begin a mouse hold over the marine's unobstructed canvas, then aim anywhere. */
export function pointerFirePlan(target, marine, alreadyHeld) {
  const aim = {type:'move',x:target.x,y:target.y};
  if (alreadyHeld) return [aim];
  return [
    {type:'move',x:(marine.left+marine.right)/2,y:(marine.top+marine.bottom)/2},
    {type:'down'}, aim,
  ];
}

/** A long preparation is evidence; only the separately bounded timeout aborts play. */
export function assessLoading(elapsedMs, recorded = false) {
  return {record:elapsedMs>5000&&!recorded,timeout:elapsedMs>120000};
}

/** Include every inspectable map destination, not only the currently selected departure. */
export function routeOptions(actions) {
  const choices = new Map();
  for (const action of actions) {
    const id = action.inspect ?? action.route;
    if (!id) continue;
    const kind = /medical/.test(id) ? 'medical' : /elite/.test(id) ? 'elite' : /armory/.test(id) ? 'armory' : 'combat';
    choices.set(id, {id, kind});
  }
  return [...choices.values()];
}

/** Human input assumptions, in milliseconds/degrees unless named otherwise. */
export const HUMAN_PROFILES = Object.freeze({
  novice: Object.freeze({reactionMs:300,jitterMs:90,missChance:.20,missPerThreat:.09,aimDegrees:7,trackingMs:200,inputMs:200,movementMs:500,spacingError:80,fixationChance:.20,crowdDashTargets:4,consumableNoticeMs:200,consumableHesitationChance:.20}),
  competent: Object.freeze({reactionMs:260,jitterMs:70,missChance:.10,missPerThreat:.07,aimDegrees:4,trackingMs:170,inputMs:160,movementMs:400,spacingError:55,fixationChance:.12,crowdDashTargets:3}),
  expert: Object.freeze({reactionMs:180,jitterMs:40,missChance:.025,missPerThreat:.025,aimDegrees:1.5,trackingMs:80,inputMs:120,movementMs:200,spacingError:25,fixationChance:.025,crowdDashTargets:2}),
});
export const HUMAN_OBSERVATION_MS = 100;

/** Shared native/sim controller. Its RNG is independent of the game seed stream. */
export function createHumanPolicy(seed, profile = 'competent') {
  const config = HUMAN_PROFILES[profile];
  if (!config) throw Error(`Unknown human profile ${profile}`);
  let state = (seed ^ 0xb10b10) >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ state >>> 15, state | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 0x100000000;
  };
  const jitter = amount => (random() * 2 - 1) * amount;
  const warnings = new Map(), hazardWarnings = new Map(), history = [];
  const consumableNotices = new Map();
  const plasmaAttempts = new Set();
  let plasmaOpeningUntil = 0;
  let consumableState=(seed^0xba113)>>>0;
  const consumableRandom=()=>{consumableState=(Math.imul(consumableState,1664525)+1013904223)>>>0;return consumableState/0x100000000;};
  let roomKey, nextMove = 0, nextInput = 0, nextHabit = 0, spacing = 0;
  let lastMove = -Infinity;
  let pendingWeapon, weaponNotice = 0, weaponHold = 0;
  let movement = {dx:0,dy:0}, aimAngle = 0, fixation = false;
  return {
    profile, config,
    decide(s) {
      const now = s.elapsed * 1000, key = s.nodeId ?? s.node?.id;
      if (key !== roomKey) {
        roomKey = key; warnings.clear(); hazardWarnings.clear(); consumableNotices.clear(); history.length = 0; lastMove = -Infinity;
        plasmaAttempts.clear(); plasmaOpeningUntil = 0;
        nextMove = nextInput = nextHabit = now; movement = {dx:0,dy:0};
      }
      const visible = visibleEnemies(s).map(e=>e.pendingAttack==='charge'&&e.windupMs>0&&e.clear?{...e,
        meleePhase:'windup',meleeShape:{kind:'line',range:e.chargeWarningLength??214.5,width:e.radius*2},
        meleeAngle:Math.atan2(e.lockY,e.lockX),meleeOriginX:e.x,meleeOriginY:e.y,
        meleeRemainingMs:e.windupMs,meleeDurationMs:e.windupMs,meleeProgress:0}:e);
      const active = visible.filter(e => e.meleePhase === 'windup' && e.meleeShape);
      const visibleHazards=s.hazards.filter(h=>h.visible!==false&&h.kind!=='melee-warning'&&!visible.some(e=>e.pendingAttack==='charge'&&e.windupMs>0&&h.kind==='warning'&&distance(h,{x:e.x+e.lockX,y:e.y+e.lockY})<2));
      const threats = active.length + visibleHazards.length;
      const activeIds = new Set(active.map(e => e.id));
      for (const id of warnings.keys()) if (!activeIds.has(id)) warnings.delete(id);
      for (const enemy of active) if (!warnings.has(enemy.id)) {
        const readyAt = now + config.reactionMs + jitter(config.jitterMs);
        const missed = random() < Math.min(.8,config.missChance + config.missPerThreat * Math.max(0,threats - 1));
        warnings.set(enemy.id,{readyAt,missed});
      }
      const hazardKey = h => h.id ?? `${h.kind}:${Math.round(h.x)}:${Math.round(h.y)}`;
      const activeHazards = new Set(visibleHazards.map(hazardKey));
      for (const id of hazardWarnings.keys()) if (!activeHazards.has(id)) hazardWarnings.delete(id);
      for (const h of visibleHazards) if (!hazardWarnings.has(hazardKey(h))) {
        hazardWarnings.set(hazardKey(h),{readyAt:now+config.reactionMs+jitter(config.jitterMs),
          missed:random()<Math.min(.8,config.missChance+config.missPerThreat*Math.max(0,threats-1))});
      }
      const noticedHazards = visibleHazards.filter(h=>{const notice=hazardWarnings.get(hazardKey(h));return !notice.missed&&now>=notice.readyAt;});
      history.push({at:now,enemies:visible.map(e=>({...e,screen:e.screen?{...e.screen}:undefined})),hazards:noticedHazards});
      while (history.length > 2 && history[1].at <= now - config.trackingMs) history.shift();
      const tracked = history[0].enemies;
      // The radar/navigation waypoint may guide exploration. Only visible, delayed
      // positions enter spacing, aiming and tactical counts; no cooldown is read.
      const perceived = {...s,enemies:tracked.filter(old=>visible.some(e=>e.id===old.id)).map(old=>{
        const current = visible.find(e=>e.id===old.id), warning = warnings.get(old.id);
        const noticed = warning && !warning.missed && now >= warning.readyAt;
        return {...old,clear:current.clear,exposedMs:current.exposedMs,meleePhase:noticed?current.meleePhase:'approach',
          meleeShape:noticed?current.meleeShape:undefined,
          meleeAngle:current.meleeAngle,meleeOriginX:current.meleeOriginX,meleeOriginY:current.meleeOriginY,
          meleeRemainingMs:current.meleeRemainingMs,meleeDurationMs:current.meleeDurationMs,meleeProgress:current.meleeProgress};
      }),hazards:noticedHazards.map(h=>h.kind==='projectile'?(history[0].hazards.find(old=>hazardKey(old)===hazardKey(h))??h):h)};
      if (now >= nextHabit) {
        spacing = jitter(config.spacingError); aimAngle = jitter(config.aimDegrees) * Math.PI / 180;
        fixation = random() < config.fixationChance;
        nextHabit = now + 600 + random() * 600;
      }
      perceived.human = {spacing,exactSpacing:false};
      const escape = meleeEscapePlan(perceived);
      if (now - lastMove >= config.inputMs && (now >= nextMove || escape)) {
        const next = chooseMovement(perceived,{x:movement.dx,y:movement.dy});
        movement = fixation && visible.length && !escape ? {dx:0,dy:0} : next;
        lastMove = now;
        nextMove = now + config.movementMs * (.8 + random() * .4);
      }
      // Collision feedback is immediate; a committed direction never walks through
      // a wall. Reconsider at the next movement deadline instead of auto-steering.
      if (!s.candidates.some(c=>c.legal&&c.dx===movement.dx&&c.dy===movement.dy)) movement = {dx:0,dy:0};
      const keys = chooseActions(perceived);
      let {target,movement:conditionMovement}=conditionDecision(s,perceived,movement,chooseTarget(perceived.enemies,s.player,s.weaponRange),keys);
      movement=conditionMovement;
      if(s.shutterBait&&target?.id===s.shutterBait.wardenId&&target.health>target.maxHealth*.35&&!escape)target=undefined;
      if(s.gate&&distance(s.player,s.gate)<=s.gate.radius&&!escape)movement={dx:0,dy:0};
      if(profile==='novice') {
        const eligible=new Set(keys.filter(key=>['e','g','v'].includes(key)));
        for(const key of consumableNotices.keys())if(!eligible.has(key))consumableNotices.delete(key);
        for(let index=keys.length-1;index>=0;index--) {
          const key=keys[index];if(!eligible.has(key))continue;
          if(!consumableNotices.has(key))consumableNotices.set(key,now+config.consumableNoticeMs+(consumableRandom()<config.consumableHesitationChance?400:0));
          if(now<consumableNotices.get(key))keys.splice(index,1);
        }
      }
      const close = perceived.enemies.filter(e=>e.clear&&distance(e,s.player)<140);
      const nearest = close.toSorted((a,b)=>distance(a,s.player)-distance(b,s.player))[0];
      // A person can spend a charge to make space before the pack winds up.
      // This also lets dash signatures participate without deadline-perfect play.
      if (close.length>=config.crowdDashTargets&&s.abilities.slots?.dash?.ready&&nearest&&
          movement.dx*(s.player.x-nearest.x)+movement.dy*(s.player.y-nearest.y)>0&&!keys.includes('Shift')) {
        keys.splice(keys[0]==='e'?1:0,0,'Shift');
      }
      const timelyKeys = keys.filter(key=>key!=='Shift'||active.every(e=>!insideMeleeWarning(e,s.player)||warningTime(e,s)>=120));
      const ammo = s.resources?.ammo;
      const current = s.combat.weapon;
      const novice = profile === 'novice';
      const hasAmmo = id => ammo[id].magazine + ammo[id].reserve > 0;
      const lessonTarget = novice&&s.node?.templateId!=='passenger-vault' ? undefined : visible.find(e=>e.id===s.plateLessonTarget&&e.armor>0&&e.clear);
      const platedTarget = ammo&&hasAmmo('plasma')&&(lessonTarget||!novice) ? lessonTarget??visible.filter(e=>e.clear&&e.armor>0&&distance(e,s.player)<430)
        .sort((a,b)=>distance(a,s.player)-distance(b,s.player))[0] : undefined;
      if(platedTarget&&!plasmaAttempts.has(platedTarget.id)&&ammo.plasma.magazine>0&&!s.reloadingWeapons?.includes('plasma')){
        plasmaAttempts.add(platedTarget.id);
        plasmaOpeningUntil=now+400;
      }
      const plasmaFirst=platedTarget&&(lessonTarget||now<plasmaOpeningUntil);
      const actions = now >= nextInput ? timelyKeys.filter(key=>!plasmaFirst||!['q','f','v','g'].includes(key)).slice(0,1) : [];
      if (actions.length) {nextInput = now + config.inputMs;consumableNotices.delete(actions[0]);}
      // WEAPONS15 weapon selection.
      const contacts = novice ? visible : perceived.enemies;
      const near = Math.min(Infinity, ...contacts.map(enemy => distance(enemy, s.player)));
      let desired = !ammo ? current
        : near < 180 && hasAmmo('shotgun') ? 'shotgun'
        : hasAmmo('rifle') ? 'rifle' : hasAmmo('plasma') ? 'plasma' : 'pistol';
      let rocketTarget;
      if (ammo && (target||platedTarget) && !novice) {
        const range = target?distance(target, s.player):Infinity;
        const ready = id => ammo[id].magazine > 0 && !s.reloadingWeapons?.includes(id);
        if (hasAmmo('rocket')) rocketTarget = contacts.find(enemy => {
          if (!enemy.clear || distance(enemy,s.player) <= 225) return false;
          if (enemy.pod || enemy.broodRemainingMs > 0) return true;
          return contacts.some(other =>
            other.id !== enemy.id && other.clear && distance(other, enemy) < 110);
        });
        if (platedTarget) desired = 'plasma';
        else if (rocketTarget) desired = 'rocket';
        else if (target && range > 145 && ready('pistol') &&
          (s.reloadingWeapons?.includes(desired) ||
            (target.armor <= 0 && target.health <= 29 && near >= 145))) desired = 'pistol';
        else if (target && range < 125 && tracked.find(enemy => enemy.id === target.id)?.meleePhase === 'recovery' &&
          ready('shotgun')) desired = 'shotgun';
      }
      if(lessonTarget&&platedTarget)desired='plasma';
      if (desired !== pendingWeapon) { pendingWeapon = desired; weaponNotice = now; }
      const sidegrade = desired !== 'rifle' && desired !== 'shotgun';
      // Baseline selection already uses delayed positions, so only specialised
      // choices add a dwell before the existing input cadence admits a swap.
      const switchReady = novice || !sidegrade || (plasmaFirst&&desired==='plasma') || now - weaponNotice >= 250;
      const weapon = !actions.length && (novice || !s.abilities.dashing) &&
        now >= nextInput && switchReady && now >= weaponHold ? desired : current;
      if (weapon !== current) {
        nextInput = now + config.inputMs;
        weaponHold = now + (sidegrade && !novice ? 350 : 0);
      }
      if (weapon === 'rocket') target = rocketTarget ?? null;
      if (weapon === 'plasma' && platedTarget) target = platedTarget;
      if (target) {
        const dx=target.x-s.player.x,dy=target.y-s.player.y;
        const screen=target.screen&&s.player.screen?{
          x:s.player.screen.x+(target.screen.x-s.player.screen.x)*Math.cos(aimAngle)-(target.screen.y-s.player.screen.y)*Math.sin(aimAngle),
          y:s.player.screen.y+(target.screen.x-s.player.screen.x)*Math.sin(aimAngle)+(target.screen.y-s.player.screen.y)*Math.cos(aimAngle),
        }:target.screen;
        target={...target,x:s.player.x+dx*Math.cos(aimAngle)-dy*Math.sin(aimAngle),y:s.player.y+dx*Math.sin(aimAngle)+dy*Math.cos(aimAngle),screen};
      }
      // End WEAPONS15 weapon selection.
      // The optional drill asks for a committed miss before a recovery shot.
      const drillEnemy=s.drill&&s.enemies.find(enemy=>enemy.id===s.drill.id);
      if(drillEnemy){
        const closeAttack=drillEnemy.meleePhase==='windup'&&drillEnemy.meleeRemainingMs<=450;
        const retreat=closeAttack||drillEnemy.meleePhase==='strike';
        const approach=drillEnemy.meleePhase==='approach';
        const direction=retreat?-1:1;
        const move=retreat||approach?s.candidates.filter(c=>c.legal)
          .sort((a,b)=>direction*(distance(a,drillEnemy)-distance(b,drillEnemy)))[0]:null;
        return {
          target:s.drill.evaded&&drillEnemy.meleePhase==='recovery'?drillEnemy:null,
          movement:move??{dx:0,dy:0},actions:[],weapon,stepMs:HUMAN_OBSERVATION_MS,
        };
      }
      return {target,movement,actions,weapon,stepMs:HUMAN_OBSERVATION_MS};
    },
  };
}
