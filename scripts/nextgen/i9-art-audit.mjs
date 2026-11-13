#!/usr/bin/env node
/** File-only I9 art evidence. Never launches a browser or changes source captures. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';

if(process.argv.includes('--help')||process.argv.length!==3){
  console.log('node scripts/nextgen/i9-art-audit.mjs <assembled-gallery-dir>\nWrites luminance.json/md, framing-audit.json/md and art-audit/silhouettes/. Missing required evidence exits nonzero after saving reports.');
  process.exit(process.argv.includes('--help')?0:1);
}
const root=resolve(process.argv[2]),manifestBytes=await readFile(resolve(root,'manifest.json'));
const manifest=JSON.parse(manifestBytes),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert(Array.isArray(manifest.shots),'manifest.shots is required');
const provenance={gitSHA:manifest.gitSHA??null,appAssets:manifest.appAssets??null,manifestSHA256:hash(manifestBytes),viewport:manifest.viewport,deviceScaleFactor:manifest.deviceScaleFactor};
// Stable canonical campaign order from src/game/roguelike/storyRooms.ts. Boss arena is additional evidence, not a twenty-first campaign room.
const rooms=['awakening-bay','passenger-vault','residential-gallery','communal-atrium','crew-checkpoint','armory','freight-hold','breached-loading-bay','relay-racks','transmission-chamber','diagnostic-gallery','safety-interlock-station','coolant-plant','service-shaft-landing','infested-workshop','swarm-junction','shielding-gate','containment-annulus','manual-control-chamber','overload-floor'];
const failures=[],raw=[],framingRows=[],framingMissing=[],framingExcluded=[],silhouetteRows=[],tiles=[];
const out=resolve(root,'art-audit/silhouettes');await mkdir(out,{recursive:true});
const json=(file,value)=>writeFile(resolve(root,file),JSON.stringify(value,null,2)+'\n');
const safeFile=file=>assert(typeof file==='string'&&/^[\w.-]+\.png$/.test(file),`Unsafe PNG filename ${file}`);
const stats=values=>{if(!values.length)return null;values.sort((a,b)=>a-b);const q=p=>Math.round(values[Math.min(values.length-1,Math.floor(values.length*p))]*10)/10;return{n:values.length,p5:q(.05),median:q(.5),p95:q(.95)};};
const boundsInside=(b,i,v,tolerance=.5)=>Boolean(b&&i&&v&&[b.left,b.right,b.top,b.bottom,i.left,i.right,i.top,i.bottom,v.width,v.height].every(Number.isFinite)&&b.left>=i.left-tolerance&&b.right<=v.width-i.right+tolerance&&b.top>=i.top-tolerance&&b.bottom<=v.height-i.bottom+tolerance);

/** Exact pixel-area box reduction, identical method to i9-gallery.mjs, including fractional 720p -> 480 ratios. */
function reduceArea(source,width=480,height=270){
  const horizontal=new Float64Array(width*source.height*3),sxScale=source.width/width,syScale=source.height/height;
  for(let y=0;y<source.height;y++)for(let x=0;x<width;x++){
    const a=x*sxScale,b=(x+1)*sxScale,target=(y*width+x)*3;
    for(let sx=Math.floor(a);sx<Math.ceil(b);sx++){
      const weight=Math.min(b,sx+1)-Math.max(a,sx),offset=(y*source.width+Math.min(source.width-1,sx))*source.channels;
      for(let c=0;c<3;c++)horizontal[target+c]+=source.pixels[offset+c]*weight/sxScale;
    }
  }
  const result=canvas(width,height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const a=y*syScale,b=(y+1)*syScale,target=(y*width+x)*3;let red=0,green=0,blue=0;
    for(let sy=Math.floor(a);sy<Math.ceil(b);sy++){
      const weight=Math.min(b,sy+1)-Math.max(a,sy),offset=(Math.min(source.height-1,sy)*width+x)*3;
      red+=horizontal[offset]*weight/syScale;green+=horizontal[offset+1]*weight/syScale;blue+=horizontal[offset+2]*weight/syScale;
    }
    result.pixels[target]=Math.round(red);result.pixels[target+1]=Math.round(green);result.pixels[target+2]=Math.round(blue);
  }
  return result;
}
function sample(image,points){
  const valid=(points??[]).filter(p=>Array.isArray(p)&&p.length>=2&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<image.width&&p[1]>=0&&p[1]<image.height);
  return{stats:stats(valid.map(([x,y])=>image.luma(x,y))),saved:points?.length??0,accepted:valid.length,rejected:(points?.length??0)-valid.length};
}
function renderMask(masks,actors){
  const result=canvas(masks.width,masks.height);result.pixels.fill(255);
  for(const actor of actors)for(const span of actor.spans??[]){
    const[x,y,length]=span;
    assert(span.length===3&&span.every(Number.isInteger)&&length>0&&x>=0&&y>=0&&y<masks.height&&x+length<=masks.width,'Invalid saved identity span');
    for(let px=x;px<x+length;px++)result.pixels.fill(0,(y*masks.width+px)*3,(y*masks.width+px)*3+3);
  }
  return result;
}
function actorTile(masks,actor){
  if(!actor.spans?.length)return null;
  const left=Math.min(...actor.spans.map(s=>s[0])),right=Math.max(...actor.spans.map(s=>s[0]+s[2]));
  const top=Math.min(...actor.spans.map(s=>s[1])),bottom=Math.max(...actor.spans.map(s=>s[1]+1));
  const image=canvas(right-left+8,bottom-top+8);image.pixels.fill(255);
  for(const[x,y,length]of actor.spans)for(let px=x;px<x+length;px++)image.pixels.fill(0,((y-top+4)*image.width+px-left+4)*3,((y-top+4)*image.width+px-left+4)*3+3);
  return{image,bounds:{left,top,right,bottom},visiblePixels:actor.spans.reduce((n,s)=>n+s[2],0)};
}
const silhouetteScenario=s=>s==='g5-silhouettes'||/^g5-queen-(armored|exposed)-silhouette$/.test(s);
const families=['crawler','spitter','brute','carrier','stalker'];
for(const shot of manifest.shots){
  safeFile(shot.file);const bytes=await readFile(resolve(root,shot.file)),sha256=hash(bytes),e=shot.evidence??{},image=decode(bytes);
  const base={file:shot.file,sha256,scenario:shot.scenario,room:shot.room??null,frame:shot.frame??null,state:e.state??null,width:image.width,height:image.height,evidenceSource:shot.evidenceSource??null};
  const deckKey=e.visibleFloorSamples?'visibleFloorSamples':'playfieldSamples',heroKey=e.visibleHeroFloorSamples?'visibleHeroFloorSamples':'marineLocalSamples';
  raw.push({...base,surfaceMask:e.visibleFloorSamples?'visible-world-surface':'legal-grid-including-occluders',sampleFields:{deck:deckKey,hero:heroKey},deck:sample(image,e[deckKey]),hero:sample(image,e[heroKey]),includingOccluders:sample(image,e.playfieldSamples)});

  // Only actual playing receipts: menu/title/result cameras are explicitly excluded.
  if(e.state!=='playing')framingExcluded.push({...base,reason:'evidence.state is not playing'});
  else if(!e.g6FramingProof)framingMissing.push({...base,reason:'playing frame missing g6FramingProof'});
  else{
    const p=e.g6FramingProof,selected=p.framing?.focusedPair?[p.framing.focusContactId]:p.framing?.selectedIds?.filter(id=>id>=0)??[];
    const contacts=(p.contacts??[]).filter(c=>selected.includes(c.id)),missingSelectedIds=selected.filter(id=>!contacts.some(c=>c.id===id));
    framingRows.push({...base,insets:p.insets,viewport:p.viewport,framing:p.framing,marineBounds:p.marineBounds,marineInside:boundsInside(p.marineBounds,p.insets,p.viewport),selectedIds:selected,missingSelectedIds,
      selected:contacts.map(c=>({id:c.id,bounds:c.bounds,insideUsable:c.insideUsable,independentlyInside:boundsInside(c.bounds,p.insets,p.viewport,0)})),
      selectedInside:contacts.every(c=>c.insideUsable===true),aimedVisible:(p.contacts??[]).filter(c=>c.aim>.2&&c.distance<400).map(c=>({id:c.id,inside:c.insideUsable})),contacts:p.contacts??[]});
  }
  if(!silhouetteScenario(shot.scenario))continue;
  const masks=e.g5Proof?.masks,kind=shot.scenario==='g5-silhouettes'?'families':shot.scenario.includes('armored')?'queen-armored':'queen-exposed';
  if(!masks||!Array.isArray(masks.actors)){failures.push({kind:'silhouette',...base,reason:'missing saved identity masks'});continue;}
  if(masks.width!==image.width||masks.height!==image.height){failures.push({kind:'silhouette',...base,reason:'identity mask dimensions differ from native PNG'});continue;}
  const actors=masks.actors.filter(a=>kind==='families'?families.includes(a.name):a.name==='queen'),stem=shot.file.replace(/\.png$/,'');
  if(!actors.length){failures.push({kind:'silhouette',...base,reason:`no actors for ${kind}`});continue;}
  try{
    const full=renderMask(masks,actors),nativeBytes=encode(full),smallBytes=encode(reduceArea(full));
    const native=`art-audit/silhouettes/${stem}-black-native.png`,small=`art-audit/silhouettes/${stem}-black480.png`;
    await writeFile(resolve(root,native),nativeBytes);await writeFile(resolve(root,small),smallBytes);
    const row={...base,kind,queenPhase:e.queenPhase??e.g5Proof?.queenPhase??null,initialFixtureQueenPhase:e.g5Proof?.queenPhase??null,native,small,nativeSHA256:hash(nativeBytes),smallSHA256:hash(smallBytes),actors:[]};
    for(const actor of actors){
      const tile=actorTile(masks,actor),receipt={id:actor.id,name:actor.name,champion:actor.champion??null,elite:actor.elite??false,bounds:tile?.bounds??null,visiblePixels:tile?.visiblePixels??0};row.actors.push(receipt);
      if(tile)tiles.push({kind,frame:shot.frame??null,phase:row.queenPhase,source:shot.file,sha256,actor:receipt,...tile});
      else failures.push({kind:'silhouette',...base,actor:receipt,reason:'actor has no visible identity spans'});
    }
    silhouetteRows.push(row);
  }catch(error){failures.push({kind:'silhouette',...base,reason:error.message});}
}

const luminanceMethod='Rec.709-weighted sRGB PNG code values (0-255), not linear-light luminance. Same decode/luma and quantile method as g6-luminance.mjs. Saved 70x70 legal world-floor grid projected at deck y=.04m; canStand radius12 excludes obstacle/void footprints; canvas x15-85%,y20-80%, hero legal floor within3m. Prefer saved visibleFloorSamples/visibleHeroFloorSamples raycast filtering surfaces above .085m; explicitly label legacy legal-grid fallback including occluders. Retain shadows, flush marks, ink and effects; no exposure normalization, no re-projection or new scene sampling. All raw frame rows, accepted/rejected sample counts and original PNG SHA256 retained. Calm prefers x2-calm-motion-high frame02, then g2-calm-high frame02/unframed, then combat-calm. Combat uses exactly combat-kiting frames01-04, with frame02 table values.';
const calmRank=row=>row.scenario==='x2-calm-motion-high'&&row.frame===2?0:row.scenario==='g2-calm-high'&&(row.frame===2||row.frame===null)?1:row.scenario==='combat-calm'?2:Infinity;
const luminanceFailures=[],table=rooms.map(room=>{
  const calm=raw.filter(r=>r.room===room&&Number.isFinite(calmRank(r))).sort((a,b)=>calmRank(a)-calmRank(b))[0]??null;
  const kiting=[1,2,3,4].map(frame=>raw.find(r=>r.room===room&&r.scenario==='combat-kiting'&&r.frame===frame)??null);
  for(const [role,row]of [['calm',calm],...kiting.map((r,i)=>[`kiting frame0${i+1}`,r])]){
    if(!row)luminanceFailures.push({room,role,reason:'missing required canonical room frame'});
    else if(!row.deck.stats||!row.hero.stats)luminanceFailures.push({room,role,file:row.file,reason:'missing/nonvalid floor or hero samples',deck:row.deck,hero:row.hero});
  }
  const medians=kiting.map(r=>r?.deck.stats?.median).filter(Number.isFinite);
  return{room,calm,kitingFrame02:kiting[1],kitingFrames:kiting,kitingMedianRange:medians.length===4?{min:Math.min(...medians),max:Math.max(...medians)}:null};
});
await json('luminance.json',{...provenance,method:luminanceMethod,canonicalRooms:rooms,table,failures:luminanceFailures,rawFrames:raw});
const metric=row=>row?`${row.deck.stats?.p5??'MISSING'} / ${row.deck.stats?.median??'MISSING'} / ${row.deck.stats?.p95??'MISSING'}`:'MISSING';
await writeFile(resolve(root,'luminance.md'),`# Saved PNG floor code values\n\n${luminanceMethod}\n\nSource ${provenance.gitSHA}; manifest SHA256 ${provenance.manifestSHA256}. Values are measurements, not an automatic 50-80 target pass.\n\n| Canonical room | Calm p5 / median / p95 | Calm hero median | Kiting02 p5 / median / p95 | Kiting02 hero median | All4 kiting median min-max |\n|---|---:|---:|---:|---:|---:|\n${table.map(r=>`| ${r.room} | ${metric(r.calm)} | ${r.calm?.hero.stats?.median??'MISSING'} | ${metric(r.kitingFrame02)} | ${r.kitingFrame02?.hero.stats?.median??'MISSING'} | ${r.kitingMedianRange?`${r.kitingMedianRange.min}-${r.kitingMedianRange.max}`:'MISSING'} |`).join('\n')}\n\nRequired-evidence failures: ${luminanceFailures.length}. Full raw per-frame rows, exact SHA256 and source receipts: [luminance.json](luminance.json).\n${luminanceFailures.map(f=>`- ${f.room}: ${f.role}: ${f.reason}`).join('\n')}\n`);

const framing={...provenance,method:'Only evidence.state===playing. Saved current-camera/CSS-viewport g6FramingProof 8-corner actual body receipts; marine uses inclusive inset edges with .5 CSS-pixel tolerance, exactly as g6-framing-audit.mjs. Priority contacts are focusedPair focusContactId or nonnegative selectedIds. selectedInside uses saved insideUsable; also retain independent numeric-bound recomputation and missing-ID flags without hiding original results.',rows:framingRows,excludedNonPlaying:framingExcluded,missingPlayingReceipts:framingMissing,
  marineFailures:framingRows.filter(r=>!r.marineInside),selectedBoundsFailures:framingRows.filter(r=>!r.selectedInside),fitSelectedFailures:framingRows.filter(r=>r.framing?.fit&&!r.selectedInside),conservativeFitFlags:framingRows.filter(r=>r.framing&&!r.framing.fit),missingSelectedContacts:framingRows.filter(r=>r.missingSelectedIds.length),boundReceiptDisagreements:framingRows.filter(r=>r.selected.some(c=>c.insideUsable!==c.independentlyInside)),
  note:'Non-selected peripheral contacts can remain outside or under HUD: this audit certifies neither all-danger clearance nor organic campaign framing. Complete group preferred, then selected priority pair. Fit flags are conservative and can be false despite actual bounds fitting. Menu/title/ending frames excluded rather than counted as failures. All actual failure rows and conservative flags retained; no outlier removal.'};
await json('framing-audit.json',framing);
await writeFile(resolve(root,'framing-audit.md'),`# Staged playing-frame body framing\n\n${framing.method}\n\n${framing.note}\n\n| Receipt | Count |\n|---|---:|\n| Playing frames audited | ${framingRows.length} |\n| Non-playing frames excluded | ${framingExcluded.length} |\n| Missing playing receipts | ${framingMissing.length} |\n| Marine failures | ${framing.marineFailures.length} |\n| Selected bounds failures | ${framing.selectedBoundsFailures.length} |\n| Fit selected failures | ${framing.fitSelectedFailures.length} |\n| Conservative fit flags | ${framing.conservativeFitFlags.length} |\n| Missing selected contacts | ${framing.missingSelectedContacts.length} |\n| Bound receipt disagreements | ${framing.boundReceiptDisagreements.length} |\n\n[All raw rows and failures](framing-audit.json), with source PNG SHA256.\n`);

// One column per actual family/Queen phase. Native visible actor pixels copied 1:1; no stretching or nearest-neighbor enlargement.
for(const kind of ['families','queen-armored','queen-exposed'])for(const frame of [1,2,3,4]){
  if(!silhouetteRows.some(r=>r.kind===kind&&r.frame===frame))failures.push({kind:'silhouette-coverage',sourceKind:kind,frame,reason:'missing required four-phase identity-mask frame'});
}
const groups=[...families,'queen-armored','queen-exposed'].map(name=>{
  let candidates=tiles.filter(t=>families.includes(name)?t.kind==='families'&&t.actor.name===name:t.kind===name);
  // The authoritative simulation names the exposed phase "vulnerable".
  if(!families.includes(name))candidates=candidates.filter(t=>name==='queen-armored'?t.phase==='armored':['exposed','vulnerable'].includes(t.phase));
  const preferredFrame=families.includes(name)?4:1,chosenFrame=candidates.some(t=>t.frame===preferredFrame)?preferredFrame:candidates[0]?.frame;
  const selected=candidates.filter(t=>t.frame===chosenFrame);
  if(!selected.length)failures.push({kind:'silhouette-sheet',name,reason:'missing visible family/actual Queen phase spans'});
  return{name,tiles:selected};
});
const padding=16,labelHeight=30,gap=14,columns=groups.map(g=>Math.max(180,...g.tiles.map(t=>t.image.width+padding*2)));
const heights=groups.map(g=>g.tiles.reduce((h,t)=>h+t.image.height+labelHeight+gap,64));
const sheet=canvas(columns.reduce((a,b)=>a+b,0),Math.max(100,...heights));sheet.pixels.fill(255);
drawText(sheet,'ACTUAL VISIBLE SILHOUETTES - NATIVE COMBAT PIXELS - NO SCALING',padding,12,[0,0,0],1);
let columnX=0;const comparison=[];
for(let i=0;i<groups.length;i++){
  const group=groups[i];drawText(sheet,group.name,columnX+padding,34,[0,0,0],1);let y=64;
  for(const tile of group.tiles){
    const x=columnX+Math.floor((columns[i]-tile.image.width)/2);drawImage(sheet,tile.image,x,y,tile.image.width,tile.image.height);
    drawText(sheet,`${tile.actor.champion??(tile.actor.elite?'ELITE':'NORMAL')} ID${tile.actor.id}`,columnX+padding,y+tile.image.height+8,[0,0,0],1);
    comparison.push({group:group.name,source:tile.source,sourceSHA256:tile.sha256,phase:tile.phase,frame:tile.frame,actor:tile.actor,nativeSheetBounds:{x,y,width:tile.image.width,height:tile.image.height}});y+=tile.image.height+labelHeight+gap;
  }
  columnX+=columns[i];
}
const sheetFile='art-audit/silhouettes/families-queen-comparison-native.png',sheetBytes=encode(sheet);await writeFile(resolve(root,sheetFile),sheetBytes);
const silhouetteMethod='Saved g5Proof.masks identity spans, actual visible pixels after scene occlusion, black RGB0 on white RGB255. Only five enemy families in g5-silhouettes, Queen only in armored/exposed sources; marine excluded. Full-native exports retain entire source canvas; black480 exports exact fractional pixel-area integration to480x270, including720p ratio8/3 (antialiased gray coverage edges are expected). Native comparison crops each actual visible actor 1:1 with4px white padding, all five families plus separately selected actual armored/exposed Queen receipts; normal/elite/champion variants preserved when present. No stretching, bounding-box silhouette synthesis, hidden-geometry reconstruction or inferred missing actors. Queen phase comes from saved evidence, not filename alone. Masks show visible silhouette only: no internal ink/palette/status recognition guarantee; partial occlusion remains partial.';
await json('art-audit/silhouettes/ledger.json',{...provenance,method:silhouetteMethod,rows:silhouetteRows,comparison:{file:sheetFile,sha256:hash(sheetBytes),width:sheet.width,height:sheet.height,actors:comparison},failures:failures.filter(f=>f.kind.startsWith('silhouette'))});
await writeFile(resolve(root,'art-audit/METHOD.md'),`# File-only art audit\n\nRun: \`node scripts/nextgen/i9-art-audit.mjs <assembled-gallery-dir>\`. No browsers or simulations launched. Input originals and manifest are read only.\n\n## Floor code values\n\n${luminanceMethod}\n\n[luminance.json](../luminance.json) includes all raw frames and exact source PNG hashes; [luminance.md](../luminance.md) reports all20 canonical rooms. Missing required calm/four-phase kiting frames or floor/hero samples are explicit failures and cause a nonzero exit after all reports are written. Legacy fallback samples are labeled; they are not silently promoted to raycast-visible floor.\n\n## Framing\n\n${framing.method}\n\n${framing.note}\n\n[framing-audit.json](../framing-audit.json) retains all raw failures, flags and SHA256. Missing playing receipts/selected IDs and bound-receipt disagreements also cause nonzero exit. Empty selected sets are recorded as such, not evidence of enemy-group fit.\n\n## Native and480 masks\n\n${silhouetteMethod}\n\n[Ledger](silhouettes/ledger.json) links every full-native mask and exact480 reduction to source image SHA256, records actual phases and comparison crop bounds. [Family and Queen native comparison](silhouettes/families-queen-comparison-native.png). Comparison-sheet dimensions adapt to actor sizes; open at1:1. The sheet is a native-scale comparison, not a480 combat screenshot. Full-frame black480 masks are the actual combat-scale reductions. Missing/empty/invalid spans fail explicitly; the Queen columns never reuse a blank five-family sheet.\n\nNo image is visually accepted by this script: humans must open the exports. Staged proof does not establish organic campaign safety, gameplay correctness, performance budgets, or temporal animation quality.\n`);
const framingFailureCount=framing.marineFailures.length+framing.selectedBoundsFailures.length+framingMissing.length+framing.missingSelectedContacts.length+framing.boundReceiptDisagreements.length;
await json('art-audit/result.json',{...provenance,luminanceFailures,artifactFailures:failures,framingFailureCounts:{marine:framing.marineFailures.length,selected:framing.selectedBoundsFailures.length,missingReceipts:framingMissing.length,missingSelected:framing.missingSelectedContacts.length,disagreements:framing.boundReceiptDisagreements.length},passed:!luminanceFailures.length&&!failures.length&&!framingFailureCount,note:'A conversion/audit result, not human visual acceptance.'});
console.log(JSON.stringify({rooms:table.length,rawFrames:raw.length,luminanceFailures:luminanceFailures.length,playingFraming:framingRows.length,framingFailureCount,conservativeFitFlags:framing.conservativeFitFlags.length,silhouetteFrames:silhouetteRows.length,artifactFailures:failures.length}));
if(luminanceFailures.length||failures.length||framingFailureCount)process.exitCode=1;
