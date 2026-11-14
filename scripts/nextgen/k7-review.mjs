#!/usr/bin/env node
/** File-only actor evidence. Owner spans, not color thresholds, define silhouettes. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {basename,resolve} from 'node:path';
import {decode,encode,canvas,drawImage,drawText} from './g2-png.mjs';

const args=process.argv.slice(2);
const option=(name,fallback)=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const root=resolve(option('root',args.find(a=>!a.startsWith('--'))??'artifacts/nextgen/k7-final'));
const beforePath=option('before',''),routePath=option('route-a','');
const out=resolve(option('out',resolve(root,'review')));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const receipt={root,out,generatedAt:new Date().toISOString(),method:'Harness geometry-owner spans; native pixels copied 1:1; exact area reduction; no browser, no simulation.',sources:[],outputs:[],missing:[],notes:['Owner masks show visible rendered pixels, including world/body occlusion; they do not prove an unoccluded anatomy or recognition rate.','Matched labels preserve native pixel scale, but poses/camera framing may differ between builds. No causal timing claim follows.']};
await mkdir(out,{recursive:true});

function area(source,width=480,height=270){
  assert(width<=source.width&&height<=source.height,'Review reductions never enlarge a source.');
  const target=canvas(width,height),sx=source.width/width,sy=source.height/height;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const x0=x*sx,x1=(x+1)*sx,y0=y*sy,y1=(y+1)*sy,sums=[0,0,0];let weight=0;
    for(let iy=Math.floor(y0);iy<Math.ceil(y1);iy++)for(let ix=Math.floor(x0);ix<Math.ceil(x1);ix++){
      const w=(Math.min(ix+1,x1)-Math.max(ix,x0))*(Math.min(iy+1,y1)-Math.max(iy,y0));
      if(w<=0)continue;const p=(iy*source.width+ix)*source.channels;
      for(let c=0;c<3;c++)sums[c]+=source.pixels[p+c]*w;weight+=w;
    }
    const p=(y*width+x)*3;for(let c=0;c<3;c++)target.pixels[p+c]=Math.round(sums[c]/weight);
  }
  return target;
}
function white(width,height){const image=canvas(width,height);image.pixels.fill(255);return image;}
function crop(source,x,y,width,height){
  const result=canvas(width,height);
  for(let dy=0;dy<height;dy++)for(let dx=0;dx<width;dx++){
    const sx=x+dx,sy=y+dy;if(sx<0||sy<0||sx>=source.width||sy>=source.height)continue;
    const a=(sy*source.width+sx)*source.channels,b=(dy*width+dx)*3;
    for(let c=0;c<3;c++)result.pixels[b+c]=source.pixels[a+c];
  }
  return result;
}
async function save(file,image){const path=resolve(out,file),bytes=encode(image);await writeFile(path,bytes);receipt.outputs.push({path,sha256:hash(bytes),width:image.width,height:image.height});return path;}
async function gallery(path){
  const manifestPath=resolve(path,'manifest.json'),bytes=await readFile(manifestPath),manifest=JSON.parse(bytes);
  receipt.sources.push({path:manifestPath,sha256:hash(bytes),kind:'manifest',gitSHA:manifest.gitSHA,distSnapshot:manifest.distSnapshot,failures:manifest.failures??[],errors:manifest.errors??[]});
  return {path:resolve(path),manifest,shots:manifest.shots};
}
async function source(g,shot){
  const path=resolve(g.path,shot.file),bytes=await readFile(path);
  if(!receipt.sources.some(s=>s.path===path))receipt.sources.push({path,sha256:hash(bytes),kind:'native PNG',simulationMs:shot.simulationMs,scenario:shot.scenario,room:shot.room});
  return decode(bytes);
}
function masks(shot){return shot.evidence?.g5Proof?.masks;}
function bounds(actor){
  if(!actor?.spans?.length)return null;
  return {left:Math.min(...actor.spans.map(s=>s[0])),right:Math.max(...actor.spans.map(s=>s[0]+s[2])),top:Math.min(...actor.spans.map(s=>s[1])),bottom:Math.max(...actor.spans.map(s=>s[1]+1))};
}
function black(shot){
  const m=masks(shot);assert(m,'Owner masks missing from '+shot.file);
  const image=white(m.width,m.height);
  for(const actor of m.actors)for(const[x,y,length]of actor.spans)for(let px=x;px<x+length;px++){
    assert(px>=0&&px<m.width&&y>=0&&y<m.height,'Out-of-range owner span');
    const p=(y*m.width+px)*3;image.pixels[p]=image.pixels[p+1]=image.pixels[p+2]=0;
  }
  return image;
}
function actorTile(shot,actor,image,colored=false){
  const b=bounds(actor);if(!b)return null;
  const tile=white(b.right-b.left+16,b.bottom-b.top+16);
  const m=masks(shot);assert(!colored||(m.width===image.width&&m.height===image.height),'Native owner and color resolution differ: '+shot.file);
  for(const[x,y,length]of actor.spans)for(let px=x;px<x+length;px++){
    const dst=((y-b.top+8)*tile.width+px-b.left+8)*3,src=(y*image.width+px)*image.channels;
    for(let c=0;c<3;c++)tile.pixels[dst+c]=colored?image.pixels[src+c]:0;
  }
  return tile;
}
function drawNative(target,tile,x,y,width,height){
  if(!tile)return;
  assert(tile.width<=width&&tile.height<=height,`Native tile ${tile.width}x${tile.height} exceeds reserved ${width}x${height}; increase the sheet, never shrink the actor.`);
  drawImage(target,tile,x+Math.floor((width-tile.width)/2),y+Math.floor((height-tile.height)/2),tile.width,tile.height);
}
const rank=a=>a.champion??(a.elite?'elite':'normal');
const stem=shot=>shot.file.replace(/-\d\d\.png$/, '').replace(/\.png$/,'');
const last=shots=>shots.toSorted((a,b)=>(a.frame??0)-(b.frame??0)).at(-1);
const families=['crawler','spitter','brute','carrier','stalker'];
const g=await gallery(root),before=beforePath?await gallery(beforePath):null,route=routePath?await gallery(routePath):null;

for(const shot of g.shots){
  const image=await source(g,shot);await save('480-'+shot.file,area(image));
  if(masks(shot)){
    const silhouette=black(shot);await save(shot.file.replace('.png','-black-native.png'),silhouette);await save(shot.file.replace('.png','-black480.png'),area(silhouette));
  }
}

// Native motion strips use the same rendered actor ID across four sampled phases.
const groups=new Map();
for(const shot of g.shots.filter(s=>masks(s))){const key=stem(shot);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(shot);}
for(const[key,allFrames]of groups){
  const frames=allFrames.toSorted((a,b)=>(a.frame??0)-(b.frame??0)).slice(0,4);
  for(const[ordinal,actor]of masks(frames[0]).actors.entries()){
    if(!bounds(actor))continue;
    const matches=frames.map(s=>({shot:s,actor:masks(s).actors.find(a=>a.id===actor.id)})).filter(v=>bounds(v.actor));
    if(!matches.length)continue;
    const width=Math.max(320,...matches.map(v=>bounds(v.actor).right-bounds(v.actor).left+24));
    const height=Math.max(260,...matches.map(v=>bounds(v.actor).bottom-bounds(v.actor).top+24));
    const strip=canvas(width*matches.length,height+36);
    for(let n=0;n<matches.length;n++){
      const {shot,actor:a}=matches[n],b=bounds(a),image=await source(g,shot),x=Math.round((b.left+b.right-width)/2),y=Math.round((b.top+b.bottom-height)/2);
      drawImage(strip,crop(image,x,y,width,height),n*width,0,width,height);
      drawText(strip,`${a.name} ${rank(a)} F${shot.frame??1} ${shot.simulationMs??'?'}MS`,n*width+8,height+10,undefined,1);
    }
    await save(`native-${key}-${actor.name}-${rank(actor)}-${ordinal}.png`,strip);
  }
}

// One retained contact sheet per standard round: exact480 frame + three native
// color owner crops + exact480 solid-black frame. No native crop is enlarged.
const standardGroups=[...groups].filter(([key])=>key.includes('k7-standard-'));
if(standardGroups.length){
  const entries=[];
  for(const[key,shots]of standardGroups){const shot=last(shots),image=await source(g,shot),actors=['marine','brute','spitter'].map(name=>masks(shot).actors.find(a=>a.name===name&&bounds(a)));entries.push({key,shot,image,actors});}
  const columnWidth=Math.max(320,...entries.flatMap(v=>v.actors.filter(Boolean).map(a=>bounds(a).right-bounds(a).left+16)));
  const rowHeights=entries.map(v=>Math.max(270,...v.actors.filter(Boolean).map(a=>bounds(a).bottom-bounds(a).top+16)));
  const board=canvas(960+columnWidth*3,rowHeights.reduce((sum,h)=>sum+h+40,0));let y=0;
  for(const[row,v]of entries.entries()){
    drawImage(board,area(v.image),0,y,480,270);
    for(const[n,a]of v.actors.entries())if(a)drawNative(board,actorTile(v.shot,a,v.image,true),480+n*columnWidth,y,columnWidth,rowHeights[row]);
    drawImage(board,area(black(v.shot)),480+columnWidth*3,y,480,270);
    drawText(board,`${v.key} - 480 FRAME / NATIVE OWNER CROPS / 480 BLACK`,8,y+rowHeights[row]+16,undefined,1);
    y+=rowHeights[row]+40;
  }
  await save('k7-standard-contact.png',board);
}

// Families and all four rigs share one1920x1080 native-scale black sheet.
const familyShot=g.shots.filter(s=>masks(s)).toSorted((a,b)=>{
  const count=s=>{const actors=masks(s).actors.filter(a=>families.includes(a.name)&&bounds(a));return new Set(actors.map(a=>a.name)).size*100+new Set(actors.map(a=>a.name+'/'+rank(a))).size;};
  return count(b)-count(a)||(b.frame??0)-(a.frame??0);
})[0];
if(familyShot){
  const image=await source(g,familyShot),m=masks(familyShot);
  receipt.silhouetteCoverage={source:resolve(g.path,familyShot.file),families:Object.fromEntries(families.map(name=>[name,m.actors.filter(a=>a.name===name&&bounds(a)).map(a=>({rank:rank(a),id:a.id,visiblePixels:a.spans.reduce((sum,span)=>sum+span[2],0)}))]))};
  const selected=families.map(name=>{
    const unique=new Map();
    for(const actor of m.actors.filter(a=>a.name===name&&bounds(a)))if(!unique.has(rank(actor)))unique.set(rank(actor),actor);
    return [...unique.values()];
  });
  const rows=Math.max(1,...selected.map(a=>a.length));
  const rowHeights=Array.from({length:rows},(_,row)=>Math.max(200,...selected.flatMap(list=>list[row]?[bounds(list[row]).bottom-bounds(list[row]).top+16]:[])));
  const rigs=[];
  for(const rig of ['breacher','cryo','pyro','arc']){
    const shot=last(g.shots.filter(s=>s.scenario===`k7-standard-${rig}`&&masks(s)));
    const actor=shot&&masks(shot).actors.find(a=>a.name==='marine'&&bounds(a));
    rigs.push({rig,shot,actor});
  }
  const rigHeight=Math.max(220,...rigs.flatMap(v=>v.actor?[bounds(v.actor).bottom-bounds(v.actor).top+16]:[]));
  const familyEnd=48+rowHeights.reduce((sum,h)=>sum+h+30,0),rigY=familyEnd+12;
  const width=Math.ceil(Math.max(1920,...selected.flat().map(a=>(bounds(a).right-bounds(a).left+16)*5),...rigs.filter(v=>v.actor).map(v=>(bounds(v.actor).right-bounds(v.actor).left+16)*4))/20)*20;
  const familyColumn=width/5,rigColumn=width/4;
  const height=Math.max(1080,Math.ceil((rigY+rigHeight+34)/4)*4),sheet=white(width,height);
  drawText(sheet,'K7 VISIBLE ACTOR SILHOUETTES - NATIVE COMBAT SCALE',24,14,[0,0,0],2);
  let y=48;
  for(let row=0;row<rows;row++){
    for(const[col,name]of families.entries()){
      const actor=selected[col][row];
      if(!actor){if(row===0)receipt.missing.push(`No ${name} owner in family sheet`);continue;}
      drawNative(sheet,actorTile(familyShot,actor,image),col*familyColumn,y,familyColumn,rowHeights[row]);
      drawText(sheet,`${name} ${rank(actor)}`,col*familyColumn+16,y+rowHeights[row]+8,[0,0,0],1);
    }
    y+=rowHeights[row]+30;
  }
  for(const[col,v]of rigs.entries()){
    if(!v.actor){receipt.missing.push(`No marine ${v.rig} owner`);drawText(sheet,`${v.rig} MISSING`,col*rigColumn+16,rigY+rigHeight+8,[0,0,0],1);continue;}
    drawNative(sheet,actorTile(v.shot,v.actor,await source(g,v.shot)),col*rigColumn,rigY,rigColumn,rigHeight);
    drawText(sheet,`MARINE ${v.rig}`,col*rigColumn+16,rigY+rigHeight+8,[0,0,0],1);
  }
  await save('k7-silhouettes-native.png',sheet);await save('k7-silhouettes480.png',area(sheet,480,Math.round(height*480/width)));
  receipt.notes.push(`Silhouette sheet is${width}x${height}; its480-wide reduction preserves that aspect ratio (${Math.round(height*480/width)}px tall). Native owner tiles remain1:1; the review scale is${480/width}, never stretched to270px.`);
}

function familyFrame(g,name){
  return last(g.shots.filter(s=>masks(s)?.actors.some(a=>a.name===name&&bounds(a))&&/silhou|famil/.test(s.scenario)))
    ??last(g.shots.filter(s=>masks(s)?.actors.some(a=>a.name===name&&bounds(a))));
}
if(before){
  const galleries=[before,g],entries=galleries.map(sourceGallery=>families.map(name=>{
    const shot=familyFrame(sourceGallery,name),actor=shot&&masks(shot).actors.find(a=>a.name===name&&!a.elite&&bounds(a));
    return {sourceGallery,shot,actor,name};
  }));
  const rowHeights=entries.map(row=>Math.max(250,...row.flatMap(v=>v.actor?[bounds(v.actor).bottom-bounds(v.actor).top+16]:[])));
  const columnWidth=Math.max(384,...entries.flat().flatMap(v=>v.actor?[bounds(v.actor).right-bounds(v.actor).left+16]:[]));
  const width=columnWidth*5,height=Math.ceil((50+rowHeights.reduce((sum,h)=>sum+h+35,0))/4)*4,sheet=white(width,height);
  drawText(sheet,'BEFORE / FINAL - ACTUAL VISIBLE OWNER COLOR - NATIVE SCALE',20,12,[0,0,0],2);
  let y=50;
  for(let row=0;row<entries.length;row++){
    for(const[col,v]of entries[row].entries()){
      if(!v.actor){receipt.missing.push(`${row?'final':'before'} ${v.name} comparison missing`);continue;}
      drawNative(sheet,actorTile(v.shot,v.actor,await source(v.sourceGallery,v.shot),true),col*columnWidth,y,columnWidth,rowHeights[row]);
      drawText(sheet,`${row?'FINAL':'BEFORE'} ${v.name}`,col*columnWidth+16,y+rowHeights[row]+10,[0,0,0],1);
    }
    y+=rowHeights[row]+35;
  }
  await save('k7-families-before-final-native.png',sheet);await save('k7-families-before-final-review.png',area(sheet,480,Math.round(height*480/width)));
}

if(before){
  const galleries=[before,g],rigs=['breacher','cryo','pyro','arc'],entries=galleries.map(sourceGallery=>rigs.map(rig=>{
    const shot=last(sourceGallery.shots.filter(s=>s.scenario===`k7-standard-${rig}`&&masks(s))),actor=shot&&masks(shot).actors.find(a=>a.name==='marine'&&bounds(a));
    return {sourceGallery,shot,actor,rig};
  }));
  const rowHeights=entries.map(row=>Math.max(250,...row.flatMap(v=>v.actor?[bounds(v.actor).bottom-bounds(v.actor).top+16]:[])));
  const columnWidth=Math.max(480,...entries.flat().flatMap(v=>v.actor?[bounds(v.actor).right-bounds(v.actor).left+16]:[]));
  const width=columnWidth*4,height=Math.ceil((50+rowHeights.reduce((sum,h)=>sum+h+35,0))/4)*4,sheet=white(width,height);
  drawText(sheet,'BEFORE / FINAL MARINE RIGS - VISIBLE OWNER COLOR - NATIVE SCALE',20,12,[0,0,0],2);
  let y=50;
  for(let row=0;row<entries.length;row++){
    for(const[col,v]of entries[row].entries()){
      if(!v.actor){receipt.missing.push(`${row?'final':'before'} marine ${v.rig} comparison missing`);drawText(sheet,`${row?'FINAL':'BEFORE'} ${v.rig} MISSING`,col*columnWidth+16,y+rowHeights[row]+10,[0,0,0],1);continue;}
      drawNative(sheet,actorTile(v.shot,v.actor,await source(v.sourceGallery,v.shot),true),col*columnWidth,y,columnWidth,rowHeights[row]);
      drawText(sheet,`${row?'FINAL':'BEFORE'} ${v.rig}`,col*columnWidth+16,y+rowHeights[row]+10,[0,0,0],1);
    }
    y+=rowHeights[row]+35;
  }
  await save('k7-marines-before-final-native.png',sheet);await save('k7-marines-before-final-review.png',area(sheet,480,Math.round(height*480/width)));
}

// Route A/B is a species comparison, retaining collision-fit native pixel scale.
if(route){
  const rooms=['awakening-bay','infested-workshop','overload-floor'],entries=[];
  for(const room of rooms){const row=[];for(const sourceGallery of [route,g]){
    const shot=last(sourceGallery.shots.filter(s=>s.room===room&&/k7-(?:route-a|standard-breacher)/.test(s.scenario)));
    if(!shot){row.push({room,sourceGallery});continue;}
    const image=await source(sourceGallery,shot),actor=masks(shot)?.actors.find(a=>a.name==='brute'&&bounds(a));row.push({room,sourceGallery,shot,image,actor});
  }entries.push(row);}
  const nativeWidth=Math.max(480,...entries.flat().filter(v=>v.actor).map(v=>bounds(v.actor).right-bounds(v.actor).left+16));
  const rowHeights=entries.map(row=>Math.max(270,...row.filter(v=>v.actor).map(v=>bounds(v.actor).bottom-bounds(v.actor).top+16)));
  const groupWidth=480+nativeWidth,board=white(groupWidth*2,rowHeights.reduce((sum,h)=>sum+h+50,0));let y=0;
  for(let row=0;row<entries.length;row++){
    for(const[col,v]of entries[row].entries()){
      if(!v.shot){receipt.missing.push(`${col?'B':'A'} route ${v.room} missing`);continue;}
      drawImage(board,area(v.image),col*groupWidth,y,480,270);
      if(v.actor)drawNative(board,actorTile(v.shot,v.actor,v.image,true),col*groupWidth+480,y,nativeWidth,rowHeights[row]);
      drawText(board,`${col?'B REBUILT RIG':'A CC0 ALIEN'} / ${v.room} / 480 FRAME + NATIVE OWNER`,col*groupWidth+8,y+rowHeights[row]+16,[0,0,0],1);
    }
    y+=rowHeights[row]+50;
  }
  await save('k7-route-ab.png',board);
}

const queenSelectors=[s=>s.scenario==='boss',s=>s.scenario==='x2-queen-opening-high',s=>s.scenario==='g2-queen-exposed',s=>s.scenario==='x2-queen-closing-high'];
function queenCrop(shot,image){
  const owner=masks(shot)?.actors.find(a=>a.name==='queen'&&bounds(a)),b=owner?bounds(owner):shot.evidence.queenBounds;
  if(b){
    const left=Math.max(0,Math.floor(b.left)-12),right=Math.min(image.width,Math.ceil(b.right)+12),top=Math.max(0,Math.floor(b.top)-12),bottom=Math.min(image.height,Math.ceil(b.bottom)+12);
    return {x:left,y:top,width:right-left,height:bottom-top,viewportClipped:b.left<0||b.top<0||b.right>image.width||b.bottom>image.height};
  }
  const p=shot.evidence.queenProjected??{x:image.width/2,y:image.height/2};
  return {x:Math.round(p.x)-350,y:Math.round(p.y)-325,width:700,height:650,unmeasuredFallback:true};
}
if(queenSelectors.every(test=>g.shots.some(test))){
  const galleries=before?[before,g]:[g],entries=[];
  for(const sourceGallery of galleries){const row=[];for(const test of queenSelectors){
    const choices=sourceGallery.shots.filter(test),shot=choices.find(s=>s.scenario==='boss'&&s.evidence.queenPhase==='armored')??last(choices);if(!shot){row.push(null);continue;}
    const image=await source(sourceGallery,shot);row.push({sourceGallery,shot,image,rect:queenCrop(shot,image)});
  }entries.push(row);}
  const columnWidth=Math.max(700,...entries.flat().filter(Boolean).map(v=>v.rect.width));
  const rowHeights=entries.map(row=>Math.max(650,...row.filter(Boolean).map(v=>v.rect.height)));
  const native=canvas(columnWidth*4,rowHeights.reduce((sum,h)=>sum+h+50,0)),board=canvas(1920,galleries.length*310);
  let y=0;
  for(let row=0;row<entries.length;row++){
    for(let col=0;col<4;col++){
      const v=entries[row][col];if(!v){receipt.missing.push(`${basename(galleries[row].path)} Queen phase ${col} missing`);continue;}
      const {sourceGallery,shot,image,rect}=v;
      drawImage(board,area(image),col*480,row*310,480,270);drawText(board,`${basename(sourceGallery.path)} ${shot.evidence.queenPhase}`,col*480+8,row*310+286,undefined,1);
      drawNative(native,crop(image,rect.x,rect.y,rect.width,rect.height),col*columnWidth,y,columnWidth,rowHeights[row]);
      drawText(native,`${basename(sourceGallery.path)} ${shot.evidence.queenPhase}`,col*columnWidth+8,y+rowHeights[row]+16,undefined,2);
      receipt.notes.push(`${shot.file} native Queen crop ${rect.width}x${rect.height} at${rect.x}/${rect.y}; viewportClipped=${!!rect.viewportClipped}; source pixels beyond viewport cannot be reconstructed.`);
    }
    y+=rowHeights[row]+50;
  }
  await save('k7-queen-phases480.png',board);await save('k7-queen-phases-native.png',native);
}

const crowdRooms=['residential-gallery','infested-workshop','overload-floor'];
if(g.shots.some(s=>s.scenario==='combat-kiting')){
  const galleries=before?[before,g]:[g],board=canvas(1440,galleries.length*310);
  for(const[row,sourceGallery]of galleries.entries())for(const[col,room]of crowdRooms.entries()){
    const shot=last(sourceGallery.shots.filter(s=>s.scenario==='combat-kiting'&&s.room===room));
    if(!shot){receipt.missing.push(`${basename(sourceGallery.path)} crowd ${room} missing`);continue;}
    drawImage(board,area(await source(sourceGallery,shot)),col*480,row*310,480,270);
    drawText(board,`${basename(sourceGallery.path)} ${room}`,col*480+8,row*310+286,undefined,1);
  }
  await save('k7-crowds-three-rooms480.png',board);
}
// A single successful propagation contact retains every completed scenario's
// last phase at480, plus allfive native owner-color family examples.
const overviewGroups=new Map();
for(const shot of g.shots){const key=stem(shot);if(!overviewGroups.has(key))overviewGroups.set(key,[]);overviewGroups.get(key).push(shot);}
const overviewShots=[...overviewGroups.values()].map(last),familyEntries=[];
for(const name of families){const shot=familyFrame(g,name),actor=shot&&masks(shot).actors.find(a=>a.name===name&&!a.elite&&bounds(a));if(actor)familyEntries.push({name,shot,actor});}
const familyHeight=Math.max(0,...familyEntries.map(v=>bounds(v.actor).bottom-bounds(v.actor).top+16));
const overviewWidth=Math.max(1920,...familyEntries.map(v=>(bounds(v.actor).right-bounds(v.actor).left+16)*5));
const overviewRows=Math.ceil(overviewShots.length/4),overview=canvas(overviewWidth,overviewRows*310+(familyEntries.length?familyHeight+50:0));
for(const[n,shot]of overviewShots.entries()){
  drawImage(overview,area(await source(g,shot)),n%4*480,Math.floor(n/4)*310,480,270);
  drawText(overview,shot.file,n%4*480+8,Math.floor(n/4)*310+286,undefined,1);
}
for(const[n,v]of familyEntries.entries()){
  drawNative(overview,actorTile(v.shot,v.actor,await source(g,v.shot),true),n*overviewWidth/5,overviewRows*310,overviewWidth/5,familyHeight);
  drawText(overview,`${v.name} NATIVE OWNER PIXELS`,n*overviewWidth/5+8,overviewRows*310+familyHeight+16,undefined,1);
}
await save('k7-overview-contact.png',overview);

const studyShots=overviewShots.filter(s=>/study/.test(s.scenario));
if(studyShots.length){
  const entries=[];
  for(const shot of studyShots){const image=await source(g,shot);entries.push({shot,image,rect:queenCrop(shot,image)});}
  const nativeWidth=Math.max(700,...entries.map(v=>v.rect.width)),rowHeights=entries.map(v=>Math.max(270,v.rect.height));
  const width=480+nativeWidth+480,study=canvas(width,rowHeights.reduce((sum,h)=>sum+h+40,0));let y=0;
  for(const[n,v]of entries.entries()){
    drawImage(study,area(v.image),0,y,480,270);
    drawNative(study,crop(v.image,v.rect.x,v.rect.y,v.rect.width,v.rect.height),480,y,nativeWidth,rowHeights[n]);
    if(masks(v.shot))drawImage(study,area(black(v.shot)),480+nativeWidth,y,480,270);
    drawText(study,`${v.shot.file} -480 FRAME / NATIVE QUEEN /480 BLACK`,8,y+rowHeights[n]+14,undefined,1);
    y+=rowHeights[n]+40;
  }
  await save('k7-study-contact.png',study);
}
await writeFile(resolve(out,'k7-review-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(`K7 review: ${g.shots.length} native sources; ${receipt.outputs.length} outputs; ${receipt.missing.length} explicit missing views.`);
console.log(resolve(out,'k7-review-receipt.json'));
