#!/usr/bin/env node
/** I13 staged native guardian observations; no simulation clocks or boss phases are injected. */
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const option=(key,fallback)=>process.argv.find(x=>x.startsWith(`--${key}=`))?.slice(key.length+3)??fallback;
const dist=resolve(option('dist','dist')),out=resolve(option('out','artifacts/nextgen/i13-final/native'));
const rooms=option('rooms','crew-checkpoint,relay-racks,infested-workshop').split(',');
const mode=option('mode','ktx2'),before=option('before',''),selection=option('cases','warden,matron,stalker,carrier,spitter').split(',');
await mkdir(out,{recursive:true});
const report={mode,before:before||null,viewport:{width:1920,height:1080},cases:[],errors:[],consoleErrors:[],requestFailures:[],requests:[],limitations:['Staged native encounter: stationary invulnerable marine, legal diagnostic spawn positions, ordinary enemy AI and authoritative clocks. No bot, balance or hardware performance claim.','No camera override. Pixel crops and maximum deformed height are observations, not simulation hit tests. Before mode serves only preserved regular character GLBs over the same runtime; it is not a historical-runtime benchmark.']};
const server=createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/containment\//,'')||'index.html';let file=resolve(dist,path);if(before&&/^assets\/models\/(basilisk|marauder|dragoon)\.glb$/.test(path))file=resolve(before,'models',path.split('/').at(-1));if(!file.startsWith(dist+'/')&&!before)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.wasm':'application/wasm','.ktx2':'image/ktx2'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
let browser;
try{
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
 browser=await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox',`--use-angle=${process.platform==='darwin'?'metal':'gl'}`,'--enable-gpu','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:report.viewport,deviceScaleFactor:1});page.setDefaultTimeout(180000);page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});page.on('requestfailed',q=>report.requestFailures.push({url:q.url(),failure:q.failure()}));page.on('request',q=>{if(/\.(glb|ktx2|wasm)(?:$|\?)/.test(q.url()))report.requests.push(q.url());});
 if(mode==='plain')await page.addInitScript(()=>{for(const proto of [WebGLRenderingContext.prototype,WebGL2RenderingContext.prototype]){const old=proto.getExtension;proto.getExtension=function(name){return /compressed_texture|texture_compression/i.test(name)?null:old.call(this,name);};}});
 await page.goto(`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=1729`);await page.waitForFunction(()=>!!window.__containmentDebug);
 for(const room of rooms)for(const kind of selection){
  const row={room,kind,frames:[],timeline:[]};report.cases.push(row);
  try{
   row.staging=await page.evaluate(async({room,kind})=>{
    const d=window.__containmentDebug,g=d.game,r=d.renderer;
    await d.gotoRoom(room,{rig:'breacher'});d.invulnerable(true);g.enemies.reset();d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});
    const bounds=g.geometry.bounds,boss=kind==='warden'||kind==='matron',radius=kind==='warden'?64:kind==='matron'?34:({stalker:17,carrier:24,spitter:18})[kind],choices=[];
    for(let y=bounds.y+80;y<bounds.y+bounds.height-80;y+=16)for(let x=bounds.x+80;x<bounds.x+bounds.width-80;x+=16){
     if(!d.canStand(x,y,radius))continue;
     for(let i=0;i<16;i++){
      const a=i*Math.PI/8,dx=Math.cos(a),dy=Math.sin(a),distance=kind==='warden'?330:200,p={x:x+dx*distance,y:y+dy*distance};
      if(!d.canStand(p.x,p.y,g.player.radius)||!d.clearShot(x,y,p))continue;
      if(kind==='warden'&&(![80,160,220].every(t=>d.canStand(x+dx*t,y+dy*t,radius))||d.canStand(x+dx*400,y+dy*400,radius)))continue;
      const space=[0,1,2,3,4,5,6,7].filter(j=>d.canStand(x+Math.cos(j*Math.PI/4)*90,y+Math.sin(j*Math.PI/4)*90,24)).length;
      choices.push({x,y,p,a,score:space*1000-Math.hypot(x-bounds.x-bounds.width/2,y-bounds.y-bounds.height/2)});
     }
    }
    choices.sort((a,b)=>b.score-a.score);const c=choices[0];if(!c)throw Error('No legal I13 '+kind+' lane');
    Object.assign(g.player,{x:c.p.x,y:c.p.y,vx:0,vy:0,angle:c.a+Math.PI});g.setAimPoint({x:c.x,y:c.y});d.step(1000);g.enemies.reset();
    const family=kind==='warden'?'brute':kind==='matron'?'carrier':kind,id=d.spawn(family,c.x,c.y,boss);if(!id)throw Error('I13 native spawn rejected');if(boss)g.enemies.promote(id,kind);
    const escorts=[];if(boss){for(const f of [family,'crawler']){for(let i=0;i<24;i++){const a=i*Math.PI/12,p={x:c.p.x+Math.cos(a)*160,y:c.p.y+Math.sin(a)*160};if(Math.hypot(p.x-c.x,p.y-c.y)<radius+40||!d.canStand(p.x,p.y,30))continue;const e=d.spawn(f,p.x,p.y,false);if(e){escorts.push(e);break;}}}}
    d.i13={id,kind,family,escorts};d.step(0);d.settlePresentation(120);d.refresh();return{id,family,champion:boss?kind:null,colliderRadius:g.enemies.getSnapshot(id)?.radius,position:{x:c.x,y:c.y},marine:c.p,escorts};
   },{room,kind});
   row.programStart=await page.evaluate(()=>{const gl=window.__containmentDebug.renderer.renderer.getContext();if(gl.i13Programs===undefined){gl.i13Programs=0;const create=gl.createProgram;gl.createProgram=function(){gl.i13Programs++;return create.call(this);};}return gl.i13Programs;});
   const seen=new Set();let podsSeen=false,hatched=false;
   for(let tick=0;tick<600;tick++){
    const frame=await page.evaluate(({step})=>{
     const d=window.__containmentDebug,g=d.game,r=d.renderer;if(step)d.step(1000/60);d.refresh();
     const target=g.enemies.getSnapshot(d.i13.id),pods=g.enemies.snapshot.enemies.filter(e=>e.pod),actors=[];
     return{elapsed:g.elapsed,target,pods,actors,pending:g.pending?.length??null,marineHeight:r.player.height};
    },{step:tick>0});
    row.timeline.push({elapsed:frame.elapsed,target:frame.target,pods:frame.pods});
    const e=frame.target;const phase=kind==='warden'?(e?.stunRemainingMs>0?'wall-stun':e?.chargeMs>0?'charge':e?.pendingAttack==='charge'?'charge-windup':seen.has('wall-stun')?'recovery':'calm'):kind==='matron'?(frame.pods.length?(Math.min(...frame.pods.map(p=>p.podRemainingMs))<500?'pod-opening':'pod-countdown'):e?.broodRemainingMs>0?'brood':podsSeen?'hatched':'calm'):(e?.meleePhase==='windup'?'windup':e?.meleePhase==='strike'?'strike':'calm');
    if(frame.pods.length)podsSeen=true;if(phase==='hatched')hatched=true;
    if(!seen.has(phase)){
     seen.add(phase);const file=`${mode}-${kind}-${room}-${phase}.png`;
     const capture=await page.evaluate(()=>{const d=window.__containmentDebug,r=d.renderer,actors=[];d.refresh();
     for(const [id,m]of r.actors){const point=m.root.position.clone();let minY=Infinity,maxY=-Infinity,minX=Infinity,maxX=-Infinity,minScreenY=Infinity,maxScreenY=-Infinity;
      m.root.updateMatrixWorld(true);m.root.traverseVisible(o=>{if(!o.isMesh||o.parent?.name==='warden-wall-stun')return;const p=o.geometry?.getAttribute('position');if(!p)return;for(let i=0;i<p.count;i++){if(o.isSkinnedMesh)o.getVertexPosition(i,point);else point.fromBufferAttribute(p,i);point.applyMatrix4(o.matrixWorld);minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);point.project(r.camera);minX=Math.min(minX,(point.x+1)*960);maxX=Math.max(maxX,(point.x+1)*960);minScreenY=Math.min(minScreenY,(1-point.y)*540);maxScreenY=Math.max(maxScreenY,(1-point.y)*540);}});
      actors.push({id,height:m.height,minY,maxY,anchorClearance:m.height+m.root.position.y-maxY,bounds:{minX,maxX,minY:minScreenY,maxY:maxScreenY},pod:!!m.root.userData.broodPod,textures:(()=>{const found=[];m.root.traverse(o=>{for(const material of Array.isArray(o.material)?o.material:o.material?[o.material]:[])for(const slot of ['map','normalMap','emissiveMap']){const t=material[slot];if(t&&!found.some(x=>x.uuid===t.uuid))found.push({uuid:t.uuid,slot,name:t.name,compressed:!!t.isCompressedTexture,width:t.image?.width,height:t.image?.height,format:t.format});}});return found;})()});
     }
return{actors,programs:r.renderer.getContext().i13Programs,data:r.canvas.toDataURL('image/png').split(',')[1]};});const {data,...captureEvidence}=capture;const bytes=Buffer.from(data,'base64');await writeFile(resolve(out,file),bytes);row.frames.push({file,phase,sha256:createHash('sha256').update(bytes).digest('hex'),...frame,...captureEvidence});console.log(file);
    }
    if(kind==='warden'&&seen.has('recovery')||kind==='matron'&&hatched||!['warden','matron'].includes(kind)&&seen.has('strike'))break;
   }
   row.observed=[...seen];row.programEnd=await page.evaluate(()=>window.__containmentDebug.renderer.renderer.getContext().i13Programs);row.postReadyPrograms=row.programEnd-row.programStart;row.missing=(kind==='warden'?['charge-windup','charge','wall-stun','recovery']:kind==='matron'?['brood','pod-countdown','pod-opening','hatched']:[]).filter(p=>!seen.has(p));
  }catch(error){row.error=String(error);report.errors.push(`${kind}/${room}: ${error}`);console.error(row.error);}
  await writeFile(resolve(out,'manifest.json'),JSON.stringify(report,null,2));
 }
}catch(e){report.errors.push(String(e));console.error(e);process.exitCode=1;}finally{await browser?.close();await new Promise(ok=>server.close(ok));await writeFile(resolve(out,'manifest.json'),JSON.stringify(report,null,2));}
console.log(`${report.cases.length} native cases; ${report.errors.length} errors; ${out}`);
