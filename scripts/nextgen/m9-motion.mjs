#!/usr/bin/env node
/** Fixed-step native-scale production-rig motion studies; never gameplay evidence. */
import assert from 'node:assert/strict';
import ts from 'typescript';
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir, stat, readdir} from 'node:fs/promises';
import {resolve, extname, dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

// Use the existing TypeScript compiler so the capture tool also works on the
// project's Node22 floor, before native TS loading became enabled by default.
const meleeSource=await readFile(new URL('../../src/game/enemies/meleeAttacks.ts',import.meta.url),'utf8');
const meleeModule=ts.transpileModule(meleeSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {MELEE_ATTACKS,ELITE_MELEE_WINDUP_SCALE,ELITE_MELEE_RECOVERY_SCALE}=await import('data:text/javascript;base64,'+Buffer.from(meleeModule).toString('base64'));

const args=process.argv.slice(2);
const known=new Set(['out','dist','subjects','actions','frames','steps','weapon']);for(const arg of args)assert(arg.startsWith('--')&&arg.includes('=')&&known.has(arg.slice(2).split('=')[0]),`Unknown motion capture option ${arg}`);
const option=(name,fallback)=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const out=resolve(option('out','artifacts/nextgen/m9-final/before')),dist=resolve(option('dist','dist'));
const subjects=option('subjects','marine,crawler,spitter,brute,stalker,carrier,crawler-elite,spitter-elite,brute-elite,stalker-elite,carrier-elite,brute-warden,carrier-matron,crowd').split(',');
const allowedSubjects=new Set(['marine','crowd','crawler','spitter','brute','stalker','carrier','crawler-elite','spitter-elite','brute-elite','stalker-elite','carrier-elite','brute-warden','carrier-matron']);assert(subjects.every(subject=>allowedSubjects.has(subject)),'Unknown motion subject');
const actionFilter=option('actions','all').split(',');
const studyWeapon=option('weapon','shotgun');assert(['pistol','rifle','shotgun','plasma','rocket'].includes(studyWeapon),'Unknown study weapon');
const frames=Number(option('frames',12)),steps=Number(option('steps',4));
assert(Number.isInteger(frames)&&frames>=4&&frames<=30&&Number.isInteger(steps)&&steps>=1&&steps<=12);
const marineActions=['idle','idle-cryo','idle-pyro','idle-arc',...Array.from({length:8},(_,n)=>`run-${n*45}`),'stop-start',...Array.from({length:8},(_,i)=>`reversal-${i*45}`),...['pistol','rifle','shotgun','plasma','rocket'].map(w=>`fire-${w}`),'reload','weapon-switch','dash','hit','death',...['ram','seismic-slam','bulwark','railbreaker','frost-trail','cryo-nova','glacier','whiteout','afterburn','flashfire','napalm-charge','meltdown','static-step','overload','tesla-pylon','overclock'].map(a=>`cast-${a}`)];
const enemyActions=['idle','run','attack','light-hit','heavy-hit','side-hit','stagger','frozen','burning','shocked','death','death-frost','death-burn','death-arc','death-acid','death-high-impulse','spawn'];
const manifest={version:1,meleeProfiles:MELEE_ATTACKS,eliteWindupScale:ELITE_MELEE_WINDUP_SCALE,eliteRecoveryScale:ELITE_MELEE_RECOVERY_SCALE,sourceSHA:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceStatus:execFileSync('git',['status','--short'],{encoding:'utf8'}).trim(),viewport:{width:1920,height:1080},fixedStepMs:1000/60,frames,steps,shots:[],errors:[],limitations:['Isolated production rig studies at the settled native gameplay camera pixel scale, without world/HUD; fire rows include existing native muzzle/brass/vent pools and death rows include native corpse cue pools. No resizing of cropped pixels.','Actor animation inputs and warning durations are explicit presentation replays. Simulation is frozen and checked unchanged. They do not prove native attack acceptance, foot-world contact, combat priority, physics death, organic pacing or performance.','M10 melee attack studies replay the production snapshot phase adapter with native family timing; simulation stays frozen. Shock is replayed via the model status adapter when supported.','Marine and enemy death use the actual pooled Rapier ragdoll with a prescribed killing impulse. This is a presentation replay, not a native kill.']};
await mkdir(out,{recursive:true});await stat(resolve(dist,'index.html'));
manifest.distAssets=await Promise.all((await readdir(resolve(dist,'assets'))).filter(file=>/\.(js|css)$/.test(file)).sort().map(async file=>{const bytes=await readFile(resolve(dist,'assets',file));return {file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}));
let browser;
const server=createServer(async(req,res)=>{const path=resolve(dist,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/containment\//,'')||'index.html');if(!path.startsWith(dist+'/'))return res.writeHead(404).end();try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'})[extname(path)]??'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
try{
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
 browser=await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox',`--use-angle=${process.platform==='darwin'?'metal':'gl'}`,'--enable-gpu','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:manifest.viewport,deviceScaleFactor:1});page.setDefaultTimeout(180000);
 page.on('pageerror',e=>manifest.errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=1729`);
 await page.waitForFunction(()=>!!window.__containmentDebug);
 await page.evaluate(async()=>{const d=window.__containmentDebug;await d.gotoRoom('awakening-bay',{rig:'breacher'});d.game.enemies.reset();d.refresh();d.settlePresentation(120);});
 await page.waitForFunction(()=>window.__containmentDebug.renderer.ragdolls.snapshot().staticColliders>0);
 manifest.camera=await page.evaluate(()=>{const r=window.__containmentDebug.renderer,gl=r.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {position:r.camera.position.toArray(),projection:r.camera.projectionMatrix.toArray(),gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown'};});
 for(const subject of subjects){
  for(const action of subject==='marine'?marineActions:subject==='crowd'?['run']:enemyActions){
   if(!actionFilter.includes('all')&&!actionFilter.includes(action))continue;
   const actionFrames=/^(attack|death)/.test(action)?Math.max(frames,24):action.startsWith('reversal-')?Math.max(frames,18):frames;
   const result=await page.evaluate(({subject,action,frames,steps,profiles,windupScale,recoveryScale,studyWeapon})=>{
    const d=window.__containmentDebug,r=d.renderer,g=d.game,elapsed=g.elapsed,timeBase=d.m9Clock??0;
    const oldRandom=Math.random;let visualSeed=[...`${subject}/${action}`].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,1729);Math.random=()=>{visualSeed=(Math.imul(visualSeed,1664525)+1013904223)>>>0;return visualSeed/4294967296;};
    const abilityUpdate=r.interimAbilities.update.bind(r.interimAbilities),oldAbilityUpdate=r.interimAbilities.update;
    r.interimAbilities.clear();
    const human=subject==='marine',crowd=subject==='crowd',family=crowd?'crawler':subject.split('-')[0],elite=subject.includes('-elite'),champion=subject.includes('-warden')?'warden':subject.includes('-matron')?'matron':undefined;
    const model=human?r.player:r.actorPool.take(family,elite),animate=model.animate.bind(model),equip=model.equip?.bind(model),oldAnimate=model.animate,oldEquip=model.equip,oldSetRig=model.setRig,oldSetDead=model.setDead,setDead=model.setDead?.bind(model),hasDeathAdapter=typeof model.setDead==='function';
    model.reset?.();model.setAttackState?.('approach',0,0);model.setDead?.(false);model.setAction?.('',0);model.setMotionSeed?.([...subject].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,1729));model.setMotionOptions?.(1,false);model.setStageLight?.(.65);model.setFlashIntensity?.(1);
    if(human){
     model.setRig?.(action.startsWith('idle-')?action.slice(5):'breacher');
     d.m9MarineRest??=[];if(!d.m9MarineRest.length)model.root.traverse(o=>{if(o.isBone)d.m9MarineRest.push({bone:o,p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()});});
     for(const rest of d.m9MarineRest){rest.bone.position.copy(rest.p);rest.bone.quaternion.copy(rest.q);rest.bone.scale.copy(rest.s);rest.bone.matrixAutoUpdate=true;}
    }
    const origin={x:g.player.x/32,z:g.player.y/32};model.root.position.set(origin.x,0,origin.z);
    const models=[model];if(crowd)for(let i=1;i<6;i++){const extra=r.actorPool.take('crawler');extra.reset?.();extra.setMotionSeed?.(1729+i*13);extra.setMotionOptions?.(1,false);extra.setStageLight?.(.65);extra.root.position.set(origin.x+(i%3-1)*1.4,0,origin.z+Math.floor(i/3)*1.4);r.scene.add(extra.root);models.push(extra);}
    const modelRoots=new Set(models.map(m=>m.root));
    model.setThreat?.(0,null,champion,1);if(!human)r.scene.add(model.root);
    if(action!=='spawn')for(let n=1;n<=90;n++){animate(timeBase+n/60,0,0);if(crowd)for(let i=1;i<models.length;i++)models[i].animate(timeBase+n/60+i,0,0);}
    // Stop normal renderer updates from overwriting the controlled production pose.
    model.animate=()=>{};if(human)model.equip=()=>{};if(hasDeathAdapter)model.setDead=()=>{};r.interimAbilities.update=()=>{};
    r.effects.clear();const shotStudy=action.startsWith('fire-'),deathStudy=action.startsWith('death'),effectMeshes=shotStudy||deathStudy?new Set(r.effects.meshes()):new Set();
    const oldSceneHook=r.scene.onBeforeRender,oldVisibility=new Map();
    r.scene.onBeforeRender=function(...p){
     oldSceneHook.apply(this,p);
     for(const child of r.scene.children)if(!modelRoots.has(child)&&!effectMeshes.has(child)&&!child.isLight&&!child.isCamera){if(!oldVisibility.has(child))oldVisibility.set(child,child.visible);child.visible=false;}
     for(const m of models)m.root.visible=true;if(human&&action==='death')model.root.rotation.z=hasDeathAdapter?controlledRoll:deathStarted?1.4:0;model.root.updateWorldMatrix(true,true);
    };
    const currentWeapon=action.startsWith('fire-')?action.slice(5):studyWeapon;equip?.(currentWeapon);
    const isCast=action.startsWith('cast-'),ability=isCast?action.slice(5):null;
    const rigs={ram:'breacher','seismic-slam':'breacher',bulwark:'breacher',railbreaker:'breacher','frost-trail':'cryo','cryo-nova':'cryo',glacier:'cryo',whiteout:'cryo',afterburn:'pyro',flashfire:'pyro','napalm-charge':'pyro',meltdown:'pyro','static-step':'arc',overload:'arc','tesla-pylon':'arc',overclock:'arc'};
    if(isCast)model.setRig?.(rigs[ability]);
    // Keep the requested presentation rig while ordinary renderer refreshes
    // read the unchanged simulation rig (as animate/equip are held above).
    if(human)model.setRig=()=>{};
    const columns=4,clock=[],proof=[],project=model.root.position.clone(),frameCanvases=[];
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,deathStarted=false,ragdollStarted=false,controlledRoll=0;
    const abilitySnapshot=JSON.parse(JSON.stringify(g.abilities.snapshot));
    const abilitySlot=['ram','frost-trail','afterburn','static-step'].includes(ability)?'dash':['railbreaker','whiteout','meltdown','overclock'].includes(ability)?'overdrive':['bulwark','glacier','napalm-charge','tesla-pylon'].includes(ability)?'power':'tactical';
    const castMs={ram:0,'seismic-slam':220,bulwark:0,railbreaker:250,'frost-trail':0,'cryo-nova':0,glacier:150,whiteout:0,afterburn:0,flashfire:0,'napalm-charge':180,meltdown:0,'static-step':0,overload:0,'tesla-pylon':160,overclock:0}[ability]??0;
    if(isCast){abilitySnapshot.rig=rigs[ability];abilitySnapshot.slots[abilitySlot].id=ability;}
    let triggered=false;
    try{
     for(let frame=0;frame<frames;frame++){
      for(let step=0;step<steps;step++){
       const tick=frame*steps+step,time=(tick+1)/60,phase=tick/(frames*steps-1);
       let moving=0,recoil=0,reload=0,vx=0,vy=0;
       if(action.startsWith('run-')){const angle=Number(action.slice(4))*Math.PI/180;moving=1;vx=Math.cos(angle)*220;vy=Math.sin(angle)*220;}
       else if(action.startsWith('reversal-')){const angle=Number(action.slice(9))*Math.PI/180+(phase<.4?Math.PI:0);moving=1;vx=Math.cos(angle)*220;vy=Math.sin(angle)*220;}
       else if(action==='run'){moving=1;vx=({crawler:150,spitter:78,brute:60,stalker:125,carrier:70})[family]??150;}
       else if(action==='stop-start'){moving=phase<.3||phase>.67?1:0;vx=moving*220;}
       if(action.startsWith('fire-'))recoil=Math.exp(-((tick%12)/60)*22);
       if(action==='reload')reload=phase;
       if(action==='weapon-switch'&&tick===Math.floor(frames*steps/2))equip?.('rocket');
       if(action==='dash'){moving=phase<.22?1:0;vx=moving*1071;model.setAction?.('ram',phase);}
       if(isCast){
        // Canonical pose study: normalized progress matches the legacy baseline clocks.
        // Native event timing is observed separately in ordinary capture/play.
        model.setAction?.(ability,phase);
       }
       if(action==='attack'){
        const profile=profiles[family]??profiles.brute;
        const duration=profile.windupMs*(elite?windupScale:1),remaining=Math.max(0,duration-time*1000);
        const strike=profile.strikeMs,recovery=profile.recoveryMs*(elite?recoveryScale:1),ms=time*1000;
        model.setAttackState?.(ms<duration?'windup':ms<duration+strike?'strike':ms<duration+strike+recovery?'recovery':'approach',ms<duration?ms/duration:ms<duration+strike?(ms-duration)/strike:Math.min(1,(ms-duration-strike)/recovery),0,profile.shape);
        model.setThreat?.(remaining,remaining>0&&(family==='brute'||family==='spitter')?(family==='brute'?'charge':'spit'):null,champion,1);
        if(!triggered&&time*1000>=duration){model.attack?.();triggered=true;}
       }
       if(['hit','light-hit','heavy-hit','side-hit','stagger'].includes(action)&&tick===Math.floor(frames*steps*.22))model.hit?.(action==='light-hit'?.35:1,action==='side-hit'?0:Math.PI/2,action!=='light-hit');
       const status={chilled:action==='frozen'||action==='death-frost',frozen:action==='frozen'||action==='death-frost',burning:action==='burning'||action==='death-burn',poisoned:action==='death-acid',shocked:action==='shocked'||action==='death-arc'};
       model.setAffliction?.(status);model.root.userData.visualStatus=status;
       if(action.startsWith('death')&&tick===Math.floor(frames*steps*.2)){
        const deathCue=action==='death-frost'?'frost':action==='death-burn'?'burn':action==='death-arc'?'arc':action==='death-acid'?'acid':'none';
        model.root.userData.motionDeathCue=deathCue;model.hit?.(1,Math.PI/2,true);if(!human)model.freeze?.();deathStarted=true;if(human)setDead?.(true);
        if(!human)r.effects.event({type:'corpse',id:-900001,x:g.player.x,y:g.player.y,family,elite,vx:action==='death-high-impulse'?960:416,vy:192,elements:deathCue==='frost'?['ice']:deathCue==='burn'?['fire']:[]},deathCue);
        {r.ragdolls.add(-900001,model,human?'marine':family,{x:action==='death-high-impulse'?30:13,z:6},model.root.userData.motionDeathCue,.032);ragdollStarted=r.ragdolls.has(-900001);if(!ragdollStarted)throw Error('Native ragdoll was not prepared');}
       }
       if(!deathStarted||human&&hasDeathAdapter&&!ragdollStarted)animate(timeBase+1.5+time,moving,0,recoil,reload,{x:vx,y:vy});
       if(crowd)for(let i=1;i<models.length;i++){models[i].animate(timeBase+1.5+time+i,moving,0,0,0,{x:vx,y:vy});models[i].root.updateWorldMatrix(true,true);}
       if(isCast||action==='dash'){
        const snapshot=isCast?abilitySnapshot:JSON.parse(JSON.stringify(g.abilities.snapshot));snapshot.dashing=(action==='dash'||abilitySlot==='dash')&&phase<.18;
        if(isCast)snapshot.slots[abilitySlot].castRemainingMs=Math.max(0,castMs-time*1000);
        abilityUpdate(snapshot,1/60,true,g,model.root,r.camera,model.body);model.syncWeaponPose?.();
       }
       if(shotStudy){
        if(tick%12===steps-1)r.effects.shot(model.muzzleWorld(project),0,currentWeapon);
        r.effects.update(1/60,r.camera,[]);
       }else if(deathStudy)r.effects.update(1/60,r.camera,[]);
       if(human&&ragdollStarted)model.syncWeaponPose?.();
       if(human&&action==='death'&&hasDeathAdapter)controlledRoll=model.root.rotation.z;
       if(ragdollStarted)r.ragdolls.update(1/60);
       if(!ragdollStarted)model.root.position.set(origin.x,0,origin.z);model.root.updateWorldMatrix(true,true);
      }
      // All RAF/debug calls remain zero-delta. The explicit clock above alone poses this actor.
      d.refresh();if(human&&action==='death'&&!hasDeathAdapter){model.root.rotation.z=frame>=Math.floor(frames*.2)?1.4:0;model.root.updateWorldMatrix(true,true);}
      // Draw once after the pose, with exactly the settled native camera/projection.
      r.renderer.setRenderTarget(null);r.renderer.render(r.scene,r.camera);
      let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
      // Project every actually deformed vertex; a fixed guessed crop hid tall sacs and feet.
      for(const actor of models)actor.root.traverseVisible(o=>{if(!o.isMesh||!o.geometry?.attributes.position)return;if(o.isSkinnedMesh)o.skeleton.update();
       for(let i=0;i<o.geometry.attributes.position.count;i++){
        o.getVertexPosition(i,project);project.applyMatrix4(o.matrixWorld).project(r.camera);
        const x=(project.x+1)*960,y=(1-project.y)*540;
        left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
       }
      });
      const padding=shotStudy||deathStudy?90:12;left=Math.floor(left)-padding;top=Math.floor(top)-padding;right=Math.ceil(right)+padding;bottom=Math.ceil(bottom)+padding;
      if(!Number.isFinite(left)||left<0||top<0||right>1920||bottom>1080)throw Error('Full deformed actor crop outside native viewport');
      minX=Math.min(minX,left);minY=Math.min(minY,top);maxX=Math.max(maxX,right);maxY=Math.max(maxY,bottom);
      const frameCanvas=document.createElement('canvas');frameCanvas.width=right-left;frameCanvas.height=bottom-top;
      frameCanvas.getContext('2d').drawImage(r.canvas,left,top,right-left,bottom-top,0,0,right-left,bottom-top);frameCanvases.push({canvas:frameCanvas,left,top});
      clock.push((frame+1)*steps*1000/60);proof.push({root:model.root.position.toArray(),rootRotation:model.root.rotation.toArray(),body:model.body.position.toArray(),rotation:model.body.rotation.toArray(),crop:{left,top,width:right-left,height:bottom-top},muzzle:model.muzzleWorld?model.muzzleWorld(project).toArray():undefined,ragdoll:ragdollStarted,crowd:!crowd?undefined:models.map(m=>{const pose=[];m.root.traverse(o=>{if(o.isBone&&/leg/.test(o.name))pose.push({name:o.name,q:o.quaternion.toArray()});});return pose;})});
     }
     if(g.elapsed!==elapsed)throw Error('Motion study advanced simulation');
     const cellWidth=maxX-minX,cellHeight=maxY-minY,canvas=document.createElement('canvas');canvas.width=columns*cellWidth;canvas.height=Math.ceil(frames/columns)*cellHeight;
     const ctx=canvas.getContext('2d');ctx.fillStyle='#424e54';ctx.fillRect(0,0,canvas.width,canvas.height);
     frameCanvases.forEach((f,i)=>ctx.drawImage(f.canvas,(i%columns)*cellWidth+f.left-minX,Math.floor(i/columns)*cellHeight+f.top-minY));
     const mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;const mc=mask.getContext('2d');mc.fillStyle='black';mc.fillRect(0,0,mask.width,mask.height);
     for(let i=0;i<frameCanvases.length;i++){const f=frameCanvases[i],fc=f.canvas.getContext('2d'),pixels=fc.getImageData(0,0,f.canvas.width,f.canvas.height),bg=pixels.data.slice(0,3);for(let n=0;n<pixels.data.length;n+=4){const on=Math.max(Math.abs(pixels.data[n]-bg[0]),Math.abs(pixels.data[n+1]-bg[1]),Math.abs(pixels.data[n+2]-bg[2]))>12;pixels.data[n]=pixels.data[n+1]=pixels.data[n+2]=on?255:0;pixels.data[n+3]=255;}const tile=document.createElement('canvas');tile.width=f.canvas.width;tile.height=f.canvas.height;tile.getContext('2d').putImageData(pixels,0,0);mc.drawImage(tile,(i%columns)*cellWidth+f.left-minX,Math.floor(i/columns)*cellHeight+f.top-minY);}
     d.m9Clock=timeBase+1.5+frames*steps/60;
     return {frames,diagnosticOnly:action==='side-hit'||action==='death-high-impulse',presentationInputs:{weapon:currentWeapon,aim:0,movementSpeed:human?220:({crawler:150,spitter:78,brute:60,stalker:125,carrier:70})[family]??150,attackWindupMs:(({crawler:260,stalker:420,brute:650,spitter:350,carrier:620})[family]??650)*(elite?.82:1),hitDirection:action==='side-hit'?0:Math.PI/2,deathImpulse:{x:action==='death-high-impulse'?30:13,z:6},corpseHoldRequestSeconds:.032,corpseHoldQuantization:'floor(request*120)120Hz ticks; max3ticks/25ms',firePeriodTicks:12,visualSeedAlgorithm:'LCG32 hash31(subject/action,1729)',isolatedBoneReset:human},png:canvas.toDataURL('image/png').split(',')[1],mask:mask.toDataURL('image/png').split(',')[1],unionCrop:{left:minX,top:minY},clock,proof,cellWidth,cellHeight,columns,elapsed,abilityAdapter:typeof model.setAction==='function'||typeof model.motionEvent==='function',source:'production model APIs, frozen simulation, explicit presentation inputs'};
    }finally{
     if(ragdollStarted)r.ragdolls.remove(-900001);r.effects.clear();r.interimAbilities.clear();r.interimAbilities.update=oldAbilityUpdate;
     Math.random=oldRandom;model.setDead=oldSetDead;setDead?.(false);model.setAction?.('',0);model.animate=oldAnimate;if(human){model.equip=oldEquip;model.setRig=oldSetRig;}r.scene.onBeforeRender=oldSceneHook;
     for(const [child,visible] of oldVisibility)child.visible=visible;
     for(let i=1;i<models.length;i++)r.actorPool.release(models[i]);if(!human)r.actorPool.release(model);else{model.root.rotation.z=0;model.setRig?.('breacher');}
     d.refresh();
    }
   },{subject,action,frames:actionFrames,steps,studyWeapon,profiles:MELEE_ATTACKS,windupScale:ELITE_MELEE_WINDUP_SCALE,recoveryScale:ELITE_MELEE_RECOVERY_SCALE});
   const file=`${subject}-${action}.png`,png=Buffer.from(result.png,'base64');delete result.png;const mask=Buffer.from(result.mask,'base64');delete result.mask;await mkdir(resolve(out,'masks'),{recursive:true});await writeFile(resolve(out,'masks',file),mask);
   await writeFile(resolve(out,file),png);
   manifest.shots.push({subject,action,file,sha256:createHash('sha256').update(png).digest('hex'),...result});
  }
  console.log(`${subject}: ${manifest.shots.filter(s=>s.subject===subject).length} strips`);
 }
 assert(manifest.shots.length>0,'No actions matched the motion selection');
 assert.equal(manifest.errors.length,0,JSON.stringify(manifest.errors));
}catch(error){manifest.errors.push(String(error));process.exitCode=1;console.error(error);}finally{
 await browser?.close();if(server.listening)await new Promise(ok=>server.close(ok));
 await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 await writeFile(resolve(out,'index.html'),`<!doctype html><meta charset="utf-8"><title>Production motion studies</title><style>body{background:#11181d;color:#d8e1e7;font:15px system-ui;margin:24px}img{max-width:100%;image-rendering:auto}figure{display:inline-block;vertical-align:top;width:min(760px,96vw);margin:16px 12px 24px 0}figcaption{padding:8px}a{color:#9fe8ff}</style><h1>Native-scale production-rig motion studies</h1><p>${escape(manifest.sourceSHA)} · ${frames} frames, ${steps} × 60 Hz ticks per cell. Read left to right, then down. Cropped pixels are never resized in the PNG.</p><p>${manifest.limitations.map(escape).join('</p><p>')}</p>${manifest.shots.map(s=>`<figure><a href="${s.file}"><img loading="lazy" src="${s.file}"></a><figcaption>${escape(s.subject)} / ${escape(s.action)} · ${s.frames??s.clock.length} frames · ${s.clock.map(n=>Math.round(n)).join('/')} ms</figcaption></figure>`).join('')}`);
 console.log(`${manifest.shots.length} strips; ${manifest.errors.length} errors; ${out}`);
}
