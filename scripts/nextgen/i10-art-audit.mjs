#!/usr/bin/env node
/** File-only I10 art evidence. Never launches a browser or changes source captures. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';
import {summarizeArenaFloor} from './i10-arena-luminance.mjs';

if(process.argv.includes('--help')||process.argv.length!==3){
  console.log('node scripts/nextgen/i10-art-audit.mjs <assembled-gallery-dir>\nWrites luminance.json/md, framing-audit.json/md and art-audit/silhouettes/. Missing required evidence exits nonzero after saving reports.');
  process.exit(process.argv.includes('--help')?0:1);
}
const root=resolve(process.argv[2]),manifestBytes=await readFile(resolve(root,'manifest.json'));
const manifest=JSON.parse(manifestBytes),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert(Array.isArray(manifest.shots),'manifest.shots is required');
const provenance={gitSHA:manifest.gitSHA??null,appAssets:manifest.appAssets??null,manifestSHA256:hash(manifestBytes),viewport:manifest.viewport,deviceScaleFactor:manifest.deviceScaleFactor};
// Stable canonical campaign order from src/game/roguelike/storyRooms.ts. Boss arena is additional evidence, not a twenty-first campaign room.
const rooms=['awakening-bay','passenger-vault','residential-gallery','communal-atrium','crew-checkpoint','armory','freight-hold','breached-loading-bay','relay-racks','transmission-chamber','diagnostic-gallery','safety-interlock-station','coolant-plant','service-shaft-landing','infested-workshop','swarm-junction','shielding-gate','containment-annulus','manual-control-chamber','overload-floor'];
const failures=[],raw=[],framingRows=[],framingMissing=[],framingExcluded=[],silhouetteRows=[],tiles=[];
const reviewRows=[],reviewPages=[],nativeOriginals=[];
const reviewDirectory=resolve(root,'art-audit/review480');await mkdir(reviewDirectory,{recursive:true});
let reviewCells=[];
const out=resolve(root,'art-audit/silhouettes');await mkdir(out,{recursive:true});
const json=(file,value)=>writeFile(resolve(root,file),JSON.stringify(value,null,2)+'\n');
const safeFile=file=>assert(typeof file==='string'&&/^[\w.-]+\.png$/.test(file),`Unsafe PNG filename ${file}`);
const stats=values=>{if(!values.length)return null;values.sort((a,b)=>a-b);const q=p=>Math.round(values[Math.min(values.length-1,Math.floor(values.length*p))]*10)/10;return{n:values.length,p5:q(.05),median:q(.5),p95:q(.95)};};
const boundsInside=(b,i,v,tolerance=.5)=>Boolean(b&&i&&v&&[b.left,b.right,b.top,b.bottom,i.left,i.right,i.top,i.bottom,v.width,v.height].every(Number.isFinite)&&b.left>=i.left-tolerance&&b.right<=v.width-i.right+tolerance&&b.top>=i.top-tolerance&&b.bottom<=v.height-i.bottom+tolerance);
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** Apply C6's actual small-axis rule while retaining literal area measurements. */
function cameraRule(diagnostics,viewport){
  const d=diagnostics;
  const present=!!d&&finite(viewport?.width)&&viewport.width>0&&finite(viewport?.height)&&viewport.height>0&&['heroPixels','outside','hullOutside','outsideX','outsideZ'].every(key=>finite(d[key]))
    &&['smallX','smallZ','centeredX','centeredZ'].every(key=>typeof d[key]==='boolean');
  const requiredHeroPixels=finite(viewport?.height)?100*viewport.height/1080:null;
  if(!present)return{present:false,requiredHeroPixels,heroPass:false,c6AabbRulePass:false,fullAabbAreaPass:false,exactHullPass:false};
  const xPass=d.smallX?d.centeredX:d.outsideX<=.180001;
  const zPass=d.smallZ?d.centeredZ:d.outsideZ<=.180001;
  const smallAxisQualification=d.smallX||d.smallZ;
  const fullAabbAreaPass=d.outside<=.180001;
  return{present:true,requiredHeroPixels,heroPixels:d.heroPixels,heroPass:d.heroPixels>=requiredHeroPixels-.05,
    xPass,zPass,smallAxisQualification,fullAabbAreaPass,
    c6AabbRulePass:xPass&&zPass&&(smallAxisQualification||fullAabbAreaPass),
    exactHullPass:d.hullOutside<=.180001};
}

async function flushReviewPage(){
  if(!reviewCells.length)return;
  const file=`page-${String(reviewPages.length+1).padStart(3,'0')}.png`,sheet=canvas(1440,592);
  for(let n=0;n<reviewCells.length;n++){
    const {image,row}=reviewCells[n],x=n%3*480,y=Math.floor(n/3)*296;
    drawText(sheet,row.file.slice(0,77),x+4,y+5,undefined,1);drawImage(sheet,image,x,y+24,480,270);
    row.exact480={page:`art-audit/review480/${file}`,cell:n,bounds:{x,y:y+24,width:480,height:270}};
  }
  const bytes=encode(sheet);await writeFile(resolve(reviewDirectory,file),bytes);
  reviewPages.push({file,sha256:hash(bytes),entries:reviewCells.map(({row})=>({...row}))});reviewCells=[];
}

/** Exact pixel-area box reduction, identical method to i10-gallery.mjs, including fractional 720p -> 480 ratios. */
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
const silhouetteScenario=s=>['g5-silhouettes','c6-silhouettes','c6-frozen-silhouettes'].includes(s)||/^g5-queen-(armored|exposed)-silhouette$/.test(s);
const families=['crawler','spitter','brute','carrier','stalker'];
for(const shot of manifest.shots){
  safeFile(shot.file);const bytes=await readFile(resolve(root,shot.file)),sha256=hash(bytes),e=shot.evidence??{},image=decode(bytes);
  const base={file:shot.file,sha256,scenario:shot.scenario,room:shot.room??null,frame:shot.frame??null,simulationMs:shot.simulationMs??null,presentationMs:shot.presentationMs??null,state:e.state??null,queenPhase:e.queenPhase??e.g5Proof?.queenPhase??null,width:image.width,height:image.height,evidenceSource:shot.evidenceSource??null};
  const reviewRow={...base,nativeOriginal:resolve(root,shot.file),sourceHashMatches:shot.evidenceSource?.sha256?shot.evidenceSource.sha256===sha256:null};
  if(reviewRow.sourceHashMatches===false)failures.push({kind:'source-hash',...base,reason:'selected native bytes differ from assembly source receipt'});
  const expectedWidth=manifest.viewport?.width*(manifest.deviceScaleFactor??1),expectedHeight=manifest.viewport?.height*(manifest.deviceScaleFactor??1);
  if(finite(expectedWidth)&&finite(expectedHeight)&&(image.width!==expectedWidth||image.height!==expectedHeight))failures.push({kind:'native-dimensions',...base,expectedWidth,expectedHeight,reason:'native PNG differs from manifest CSS viewport times DPR'});
  reviewRows.push(reviewRow);nativeOriginals.push(reviewRow.nativeOriginal);reviewCells.push({image:reduceArea(image),row:reviewRow});if(reviewCells.length===6)await flushReviewPage();
  const deckKey=e.visibleFloorSamples?'visibleFloorSamples':'playfieldSamples',heroKey=e.visibleHeroFloorSamples?'visibleHeroFloorSamples':'marineLocalSamples';
  raw.push({...base,surfaceMask:e.visibleFloorSamples?'visible-world-surface':'legal-grid-including-occluders',sampleFields:{deck:deckKey,hero:heroKey},deck:sample(image,e[deckKey]),hero:sample(image,e[heroKey]),includingOccluders:sample(image,e.playfieldSamples)});

  // Only actual playing receipts: menu/title/result cameras are explicitly excluded.
  if(e.state!=='playing')framingExcluded.push({...base,reason:'evidence.state is not playing'});
  else if(!e.g6FramingProof)framingMissing.push({...base,reason:'playing frame missing g6FramingProof'});
  else{
    const p=e.g6FramingProof,selected=p.framing?.focusedPair?[p.framing.focusContactId]:p.framing?.selectedIds??[];
    const queen=e.queenBounds?{id:-1,bounds:e.queenBounds,insideUsable:boundsInside(e.queenBounds,p.insets,p.viewport,0)}:null;
    const allContacts=[...(p.contacts??[]),...(queen?[queen]:[])];
    const contacts=allContacts.filter(c=>selected.includes(c.id)),missingSelectedIds=selected.filter(id=>!contacts.some(c=>c.id===id));
    framingRows.push({...base,insets:p.insets,viewport:p.viewport,framing:p.framing,roomFraming:e.roomFraming??null,c6:cameraRule(e.roomFraming,p.viewport),priorityPairReplay:e.i9PriorityPair??null,marineBounds:p.marineBounds,marineInside:boundsInside(p.marineBounds,p.insets,p.viewport),selectedIds:selected,missingSelectedIds,
      queenBounds:e.queenBounds??null,queenActive:e.boss===true,queenInside:queen?.insideUsable??null,queenSelected:selected.includes(-1),
      selected:contacts.map(c=>({id:c.id,bounds:c.bounds,insideUsable:c.insideUsable,independentlyInside:boundsInside(c.bounds,p.insets,p.viewport,0)})),
      selectedInside:contacts.every(c=>c.insideUsable===true),aimedVisible:(p.contacts??[]).filter(c=>c.aim>.2&&c.distance<400).map(c=>({id:c.id,inside:c.insideUsable})),contacts:p.contacts??[]});
  }
  if(!silhouetteScenario(shot.scenario))continue;
  const masks=e.g5Proof?.masks,kind=['g5-silhouettes','c6-silhouettes'].includes(shot.scenario)?'families':shot.scenario==='c6-frozen-silhouettes'?'families-frozen':shot.scenario.includes('armored')?'queen-armored':'queen-exposed';
  if(!masks||!Array.isArray(masks.actors)){failures.push({kind:'silhouette',...base,reason:'missing saved identity masks'});continue;}
  if(masks.width!==image.width||masks.height!==image.height){failures.push({kind:'silhouette',...base,reason:'identity mask dimensions differ from native PNG'});continue;}
  const actors=masks.actors.filter(a=>kind.startsWith('families')?families.includes(a.name):a.name==='queen'),stem=shot.file.replace(/\.png$/,'');
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
await flushReviewPage();
await json('art-audit/review-ledger.json',{...provenance,method:'Every selected native PNG hashed independently. Exact480 pages use pixel-area reduction without normalization. These are review derivatives, not automatic human-open witnesses.',rows:reviewRows,pages:reviewPages});
await writeFile(resolve(root,'art-audit/native-originals.txt'),nativeOriginals.join('\n')+'\n');
await writeFile(resolve(reviewDirectory,'index.html'),`<!doctype html><meta charset="utf-8"><title>I10 exact480 art review</title><style>body{background:#111820;color:#dce8ef;font:15px system-ui;margin:24px}a{color:#a5e7ff}figure{margin:20px 0}img{display:block;width:100%;max-width:1440px}</style><h1>All selected native frames at480×270</h1><p>Originals remain unchanged. <a href="../native-originals.txt">Native original list</a> · <a href="../review-ledger.json">Source hashes and exact cell receipts</a>. Derivative generation is not a record that a human has opened these pages.</p>${reviewPages.map(page=>`<figure><a href="${page.file}"><img src="${page.file}" loading="lazy" alt="${page.file}"></a><figcaption>${page.file}: ${page.entries.map(row=>`<a href="../../${row.file}">${escape(row.file)}</a>`).join(' · ')}</figcaption></figure>`).join('')}`);

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
const bandRows=table.flatMap(row=>[row.calm,...row.kitingFrames]).filter(Boolean).map(row=>({file:row.file,sha256:row.sha256,room:row.room,scenario:row.scenario,frame:row.frame,deck:row.deck.stats,hero:row.hero.stats,
  medianInBand:finite(row.deck.stats?.median)&&row.deck.stats.median>=50&&row.deck.stats.median<=80,
  shadowInNominalBand:finite(row.deck.stats?.p5)&&row.deck.stats.p5>=12&&row.deck.stats.p5<=28}));
const bandAssessment={method:'Nominal code-value bands: deck median50–80 and shadow p5 approximately12–28. Every canonical calm and four kiting phases retained; excursions are reported, never normalized or discarded. Hero column is nearby floor, not actor luminance.',rows:bandRows,medianExcursions:bandRows.filter(row=>!row.medianInBand),shadowExcursions:bandRows.filter(row=>!row.shadowInNominalBand)};
const additionalArena=summarizeArenaFloor(raw);
await json('luminance.json',{...provenance,method:luminanceMethod,canonicalRooms:rooms,table,bandAssessment,failures:luminanceFailures,additionalArena,rawFrames:raw});
const metric=row=>row?`${row.deck.stats?.p5??'MISSING'} / ${row.deck.stats?.median??'MISSING'} / ${row.deck.stats?.p95??'MISSING'}`:'MISSING';
await writeFile(resolve(root,'luminance.md'),`# Saved PNG floor code values\n\n${luminanceMethod}\n\nSource ${provenance.gitSHA}; manifest SHA256 ${provenance.manifestSHA256}. Values are measurements, not an automatic 50-80 target pass.\n\n| Canonical room | Calm p5 / median / p95 | Calm hero median | Kiting02 p5 / median / p95 | Kiting02 hero median | All4 kiting median min-max |\n|---|---:|---:|---:|---:|---:|\n${table.map(r=>`| ${r.room} | ${metric(r.calm)} | ${r.calm?.hero.stats?.median??'MISSING'} | ${metric(r.kitingFrame02)} | ${r.kitingFrame02?.hero.stats?.median??'MISSING'} | ${r.kitingMedianRange?`${r.kitingMedianRange.min}-${r.kitingMedianRange.max}`:'MISSING'} |`).join('\n')}\n\nRequired-evidence failures: ${luminanceFailures.length}. Median band excursions: ${bandAssessment.medianExcursions.length}/${bandRows.length}; nominal shadow-p5 excursions: ${bandAssessment.shadowExcursions.length}/${bandRows.length}. Full raw per-frame rows, exact SHA256 and source receipts: [luminance.json](luminance.json).\n${luminanceFailures.map(f=>`- ${f.room}: ${f.role}: ${f.reason}`).join('\n')}\n`);

await appendFile(resolve(root,'luminance.md'),`\n## Additional arena — Reactor Vault\n\n${additionalArena.method}\n\nThe canonical twenty-room table and its band-excursion counts above are unchanged. This arena is additional evidence, with different native staging/clocks.\n\n| Evidence role | Actual source | Queen phase | Simulation / presentation ms | Deck p5 / median / p95 | Hero floor median | Deck / hero samples | Valid saved samples |\n|---|---|---|---:|---:|---:|---:|---|\n${additionalArena.tableRows.map(({role,row,validSavedSamples})=>`| ${role} | ${row?`[${row.file}](${row.file})`:'MISSING'} | ${row?.queenPhase??'unknown'} | ${row?`${row.simulationMs??'?'} / ${row.presentationMs??'?'}`:'unknown'} | ${metric(row)} | ${row?.hero.stats?.median??'MISSING'} | ${row?.deck.stats?.n??0} / ${row?.hero.stats?.n??0} | ${validSavedSamples} |`).join('\n')}\n\nArena evidence complete: **${additionalArena.evidenceComplete}**. Captured arena frames:${additionalArena.allCapturedRows.length}; actual Queen combat/exposure frames without valid saved samples:${additionalArena.unmeasuredQueenFrames.length}. Arena-only median-band excursions:${additionalArena.bandAssessment.medianExcursions.length}/${additionalArena.bandAssessment.rows.length}; nominal shadow-p5 excursions:${additionalArena.bandAssessment.shadowExcursions.length}/${additionalArena.bandAssessment.rows.length}. An unframed arrival is not certified as native calm02; exposure is not certified as canonical kiting.\n\n${additionalArena.failures.length?additionalArena.failures.map(failure=>`- ${failure.role}: ${failure.reason}`).join('\n'):'Required additional arena measurements are present.'}\n\nAll arena source hashes, sample counts, phase clocks, unmeasured captured frames and per-phase values remain in [luminance.json](luminance.json) under additionalArena.\n`);

const framing={...provenance,method:'Only evidence.state===playing. Saved current-camera/CSS-viewport g6FramingProof 8-corner actual body receipts; marine uses inclusive inset edges with .5 CSS-pixel tolerance, exactly as g6-framing-audit.mjs. Priority contacts are focusedPair focusContactId or selectedIds, with saved Queen bounds supplying id-1. selectedInside retains saved insideUsable; independent numeric-bound recomputation and missing-ID flags remain. C6 heroPixels is conservative foot-to-head scale:100CSSpx at1080p scaled by CSS height, with .05px numerical tolerance. Every non-small axis must have outside fraction≤.18; genuinely small axes must center. Total AABB outside≤.18 applies when neither axis is small. Literal total AABB and exact hull fractions are still reported for every frame.',rows:framingRows,excludedNonPlaying:framingExcluded,missingPlayingReceipts:framingMissing,
  marineFailures:framingRows.filter(r=>!r.marineInside),selectedBoundsFailures:framingRows.filter(r=>!r.selectedInside),fitSelectedFailures:framingRows.filter(r=>r.framing?.fit&&!r.selectedInside),conservativeFitFlags:framingRows.filter(r=>r.framing&&!r.framing.fit),missingSelectedContacts:framingRows.filter(r=>r.missingSelectedIds.length),boundReceiptDisagreements:framingRows.filter(r=>r.selected.some(c=>c.insideUsable!==c.independentlyInside)),
  missingRoomFraming:framingRows.filter(r=>!r.c6.present),heroScaleFailures:framingRows.filter(r=>r.c6.present&&!r.c6.heroPass),c6AabbRuleFailures:framingRows.filter(r=>r.c6.present&&!r.c6.c6AabbRulePass),
  literalAabbExceedances:framingRows.filter(r=>r.c6.present&&!r.c6.fullAabbAreaPass),smallAxisQualifiedFrames:framingRows.filter(r=>r.c6.present&&r.c6.smallAxisQualification),exactHullExceedances:framingRows.filter(r=>r.c6.present&&!r.c6.exactHullPass),
  queenBoundsFailures:framingRows.filter(r=>r.queenActive&&r.queenInside===false),missingActiveQueenBounds:framingRows.filter(r=>r.queenActive&&!r.queenBounds),
  note:'Non-selected peripheral contacts can remain outside or under HUD: this audit certifies neither all-danger clearance nor organic campaign framing. The hero/room constraints can make remote selected contacts infeasible. Selected-body failures, actual Queen bounds failures, and fit=false remain explicit review findings; they do not get silently removed or transformed into an artifact-conversion failure. Root decides their acceptance. Missing receipts, invalid source bytes/masks, marine clearance failures and C6 rule failures do fail the conversion audit. An AABB rule pass is not an exact-hull pass. Menu/title/ending excluded. No outlier removal.'};
await json('framing-audit.json',framing);
await writeFile(resolve(root,'framing-audit.md'),`# Staged playing-frame body framing\n\n${framing.method}\n\n${framing.note}\n\n| Receipt | Count |\n|---|---:|\n| Playing frames audited | ${framingRows.length} |\n| Non-playing frames excluded | ${framingExcluded.length} |\n| Missing playing receipts | ${framingMissing.length} |\n| Marine failures | ${framing.marineFailures.length} |\n| Selected bounds failures | ${framing.selectedBoundsFailures.length} |\n| Fit selected failures | ${framing.fitSelectedFailures.length} |\n| Conservative fit flags | ${framing.conservativeFitFlags.length} |\n| Missing selected contacts | ${framing.missingSelectedContacts.length} |\n| Bound receipt disagreements | ${framing.boundReceiptDisagreements.length} |\n\n[All raw rows and failures](framing-audit.json), with source PNG SHA256.\n`);

const finiteRange=values=>{const present=values.filter(finite);return present.length?{min:Math.min(...present),max:Math.max(...present)}:null;};
const c6RoomTable=[...new Set(framingRows.map(row=>row.room))].map(room=>{
  const rows=framingRows.filter(row=>row.room===room),measured=rows.filter(row=>row.c6.present);
  return{room,frames:rows.length,measuredFrames:measured.length,heroPixels:finiteRange(measured.map(row=>row.roomFraming.heroPixels)),
    aabbOutside:finiteRange(measured.map(row=>row.roomFraming.outside)),hullOutside:finiteRange(measured.map(row=>row.roomFraming.hullOutside)),
    heroFailures:measured.filter(row=>!row.c6.heroPass).length,c6AabbRuleFailures:measured.filter(row=>!row.c6.c6AabbRulePass).length,
    literalAabbExceedances:measured.filter(row=>!row.c6.fullAabbAreaPass).length,exactHullExceedances:measured.filter(row=>!row.c6.exactHullPass).length,
    smallAxisQualifiedFrames:measured.filter(row=>row.c6.smallAxisQualification).length,
    selectedBoundsFailures:rows.filter(row=>!row.selectedInside).length,rawFitFalse:rows.filter(row=>row.framing?.fit===false).length,
    queenBoundsFailures:rows.filter(row=>row.queenActive&&row.queenInside===false).length};
});
await json('art-audit/c6-room-framing.json',{...provenance,table:c6RoomTable,method:framing.method,note:framing.note});
const pair=range=>range?`${range.min.toFixed(1)}–${range.max.toFixed(1)}`:'missing';
const percent=range=>range?`${(range.max*100).toFixed(2)}%`:'missing';
await appendFile(resolve(root,'framing-audit.md'),`\n## C6 hero / room limits\n\n| Receipt | Count |\n|---|---:|\n| Missing C6 diagnostics | ${framing.missingRoomFraming.length} |\n| Hero-scale failures | ${framing.heroScaleFailures.length} |\n| Qualified C6 AABB-rule failures | ${framing.c6AabbRuleFailures.length} |\n| Literal full-AABB-area exceedances | ${framing.literalAabbExceedances.length} |\n| Small-axis qualified frames | ${framing.smallAxisQualifiedFrames.length} |\n| Exact-hull-area exceedances | ${framing.exactHullExceedances.length} |\n| Active Queen bounds outside usable viewport | ${framing.queenBoundsFailures.length} |\n| Missing active Queen bounds | ${framing.missingActiveQueenBounds.length} |\n\nA genuinely small axis must center; every non-small axis must meet its18% band. Literal total AABB area and actual hull area are still measured independently. Actual hull exceedances are not certified by a qualified AABB rule.\n\n| Room | Measured / playing | Hero CSSpx min–max | AABB outside max | Actual hull outside max | Small-axis frames | Hero / AABB-rule failures | Selected / fit=false | Queen outside |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n${c6RoomTable.map(row=>`| ${row.room} | ${row.measuredFrames} / ${row.frames} | ${pair(row.heroPixels)} | ${percent(row.aabbOutside)} | ${percent(row.hullOutside)} | ${row.smallAxisQualifiedFrames} | ${row.heroFailures} / ${row.c6AabbRuleFailures} | ${row.selectedBoundsFailures} / ${row.rawFitFalse} | ${row.queenBoundsFailures} |`).join('\n')}\n\n[Per-shot hashes, raw selected failures and independent body bounds](framing-audit.json). [Room table JSON](art-audit/c6-room-framing.json).\n`);

// Required historical mask coverage remains intact; C6 normal/frozen proofs are additive.
const requiredMaskScenarios=['g5-silhouettes','g5-queen-armored-silhouette','g5-queen-exposed-silhouette','c6-silhouettes','c6-frozen-silhouettes'];
for(const scenario of requiredMaskScenarios)for(const frame of [1,2,3,4]){
  if(!silhouetteRows.some(row=>row.scenario===scenario&&row.frame===frame))failures.push({kind:'silhouette-coverage',scenario,frame,reason:'missing required four-phase identity-mask frame'});
}
function comparisonGroups(frozen=false){
  return [...families,...(frozen?[]:['queen-armored','queen-exposed'])].map(name=>{
    let candidates=tiles.filter(tile=>families.includes(name)?tile.kind===(frozen?'families-frozen':'families')&&tile.actor.name===name:tile.kind===name);
    // Use the explicit C6 normal fixture when present; keep every prior G5 export/receipt.
    if(!frozen&&families.includes(name)&&candidates.some(tile=>tile.source.startsWith('c6-silhouettes-')))candidates=candidates.filter(tile=>tile.source.startsWith('c6-silhouettes-'));
    if(!families.includes(name))candidates=candidates.filter(tile=>name==='queen-armored'?tile.phase==='armored':['exposed','vulnerable'].includes(tile.phase));
    const chosenFrame=candidates.some(tile=>tile.frame===4)?4:candidates[0]?.frame;
    const selected=candidates.filter(tile=>tile.frame===chosenFrame);
    if(!selected.length)failures.push({kind:'silhouette-sheet',name,frozen,reason:'missing visible family/actual Queen phase spans'});
    return{name,tiles:selected};
  });
}
/** Preserve native visible actor pixels 1:1; no hidden-geometry reconstruction. */
async function comparisonSheet(groups,file,title){
  const padding=16,labelHeight=30,gap=14;
  const columns=groups.map(group=>Math.max(180,...group.tiles.map(tile=>tile.image.width+padding*2)));
  const heights=groups.map(group=>group.tiles.reduce((height,tile)=>height+tile.image.height+labelHeight+gap,64));
  const sheet=canvas(columns.reduce((a,b)=>a+b,0),Math.max(100,...heights));sheet.pixels.fill(255);
  drawText(sheet,title,padding,12,[0,0,0],1);
  let columnX=0;const actors=[];
  for(let i=0;i<groups.length;i++){
    const group=groups[i];drawText(sheet,group.name,columnX+padding,34,[0,0,0],1);let y=64;
    for(const tile of group.tiles){
      const x=columnX+Math.floor((columns[i]-tile.image.width)/2);
      drawImage(sheet,tile.image,x,y,tile.image.width,tile.image.height);
      drawText(sheet,`${tile.actor.champion??(tile.actor.elite?'ELITE':'NORMAL')} ID${tile.actor.id}`,columnX+padding,y+tile.image.height+8,[0,0,0],1);
      actors.push({group:group.name,source:tile.source,sourceSHA256:tile.sha256,phase:tile.phase,frame:tile.frame,actor:tile.actor,nativeSheetBounds:{x,y,width:tile.image.width,height:tile.image.height}});
      y+=tile.image.height+labelHeight+gap;
    }
    columnX+=columns[i];
  }
  const bytes=encode(sheet);await writeFile(resolve(root,file),bytes);
  return{file,sha256:hash(bytes),width:sheet.width,height:sheet.height,actors};
}
const comparison=await comparisonSheet(comparisonGroups(),'art-audit/silhouettes/families-queen-comparison-native.png','ACTUAL VISIBLE SILHOUETTES - NATIVE COMBAT PIXELS - NO SCALING');
const frozenComparison=await comparisonSheet(comparisonGroups(true),'art-audit/silhouettes/frozen-families-comparison-native.png','FROZEN FAMILIES - ACTUAL NATIVE VISIBLE PIXELS - NO SCALING');
const silhouetteMethod='Saved g5Proof.masks identity spans, actual visible pixels after scene occlusion, black RGB0 on white RGB255. Five enemy families in retained G5 and additive C6 normal/frozen scenarios; Queen only in armored/exposed sources; marine excluded. Full-native exports retain entire source canvas; black480 exports exact fractional pixel-area integration to480x270, including720p ratio8/3 (antialiased gray coverage edges are expected). Native comparison crops each actual visible actor 1:1 with4px white padding, all five families plus separately selected actual armored/exposed Queen receipts; normal/elite/champion variants preserved when present. No stretching, bounding-box silhouette synthesis, hidden-geometry reconstruction or inferred missing actors. Queen phase comes from saved evidence, not filename alone. Masks show visible silhouette only: no internal ink/palette/status recognition guarantee; partial occlusion remains partial.';
await json('art-audit/silhouettes/ledger.json',{...provenance,method:silhouetteMethod,rows:silhouetteRows,comparison,frozenComparison,failures:failures.filter(f=>f.kind.startsWith('silhouette'))});
await writeFile(resolve(root,'art-audit/METHOD.md'),`# File-only art audit\n\nRun: \`node scripts/nextgen/i10-art-audit.mjs <assembled-gallery-dir>\`. No browsers or simulations launched. Input originals and manifest are read only.\n\n## Floor code values\n\n${luminanceMethod}\n\n[luminance.json](../luminance.json) includes all raw frames and exact source PNG hashes; [luminance.md](../luminance.md) reports all20 canonical rooms. Missing required calm/four-phase kiting frames or floor/hero samples are explicit failures and cause a nonzero exit after all reports are written. Legacy fallback samples are labeled; they are not silently promoted to raycast-visible floor.\n\n## Additional arena\n\nReactor Vault saved floor evidence remains separately labeled under luminance.json.additionalArena and the appended luminance.md arena section. It does not replace a canonical campaign row or pretend exposure is kiting. Missing native calm02 or actual combat/exposure samples remain explicit; allRoomFloorEvidenceComplete is separate from the canonical conversion result.\n\n## Framing\n\n${framing.method}\n\n${framing.note}\n\n[framing-audit.json](../framing-audit.json) retains all raw failures, flags and SHA256. Missing playing receipts/selected IDs and bound-receipt disagreements also cause nonzero exit. Empty selected sets are recorded as such, not evidence of enemy-group fit.\n\n## Review originals and exact480 pages\n\n[Every original native PNG](native-originals.txt), [all-shot exact480 pages](review480/index.html), [source/frame/hash ledger](review-ledger.json). Generated derivatives are not automatic human-open witnesses.\n\n## Native and480 masks\n\n${silhouetteMethod}\n\n[Ledger](silhouettes/ledger.json) links every full-native mask and exact480 reduction to source image SHA256, records actual phases and comparison crop bounds. [Family and Queen native comparison](silhouettes/families-queen-comparison-native.png) and [C6 frozen families](silhouettes/frozen-families-comparison-native.png). Comparison-sheet dimensions adapt to actor sizes; open at1:1. The sheet is a native-scale comparison, not a480 combat screenshot. Full-frame black480 masks are the actual combat-scale reductions. Missing/empty/invalid spans fail explicitly; the Queen columns never reuse a blank five-family sheet.\n\nNo image is visually accepted by this script: humans must open the exports. Staged proof does not establish organic campaign safety, gameplay correctness, performance budgets, or temporal animation quality.\n`);
const framingFailureCount=framing.marineFailures.length+framingMissing.length+framing.missingSelectedContacts.length+framing.boundReceiptDisagreements.length+framing.missingRoomFraming.length+framing.heroScaleFailures.length+framing.c6AabbRuleFailures.length+framing.missingActiveQueenBounds.length;
const conversionPassed=!luminanceFailures.length&&!failures.length&&!framingFailureCount;
await json('art-audit/result.json',{...provenance,luminanceFailures,artifactFailures:failures,
  framingFailureCounts:{marine:framing.marineFailures.length,missingReceipts:framingMissing.length,missingSelected:framing.missingSelectedContacts.length,disagreements:framing.boundReceiptDisagreements.length,missingRoomFraming:framing.missingRoomFraming.length,heroScale:framing.heroScaleFailures.length,c6AabbRule:framing.c6AabbRuleFailures.length,missingActiveQueenBounds:framing.missingActiveQueenBounds.length},
  reviewFindings:{selectedBounds:framing.selectedBoundsFailures.length,fitSelectedFailures:framing.fitSelectedFailures.length,fitFalse:framing.conservativeFitFlags.length,queenBounds:framing.queenBoundsFailures.length,literalAabbExceedances:framing.literalAabbExceedances.length,exactHullExceedances:framing.exactHullExceedances.length,smallAxisQualifiedFrames:framing.smallAxisQualifiedFrames.length,medianBandExcursions:bandAssessment.medianExcursions.length,shadowBandExcursions:bandAssessment.shadowExcursions.length},
  selectedContactBoundsPassed:!framing.selectedBoundsFailures.length,exactHullAreaPassed:!framing.missingRoomFraming.length&&!framing.exactHullExceedances.length,queenBoundsPassed:!framing.missingActiveQueenBounds.length&&!framing.queenBoundsFailures.length,
  additionalArenaEvidenceComplete:additionalArena.evidenceComplete,allRoomFloorEvidenceComplete:!luminanceFailures.length&&additionalArena.evidenceComplete,additionalArenaEvidenceFailures:additionalArena.failures,additionalArenaBandExcursions:{median:additionalArena.bandAssessment.medianExcursions.length,shadow:additionalArena.bandAssessment.shadowExcursions.length},
  passed:conversionPassed,note:'A conversion/evidence-integrity and qualified C6-rule result, not human visual acceptance. Raw selected-contact/Queen/hull/value-band findings remain explicit for root acceptance; no favorable sample selection.'});
console.log(JSON.stringify({rooms:table.length,rawFrames:raw.length,luminanceFailures:luminanceFailures.length,playingFraming:framingRows.length,framingFailureCount,additionalArenaEvidenceComplete:additionalArena.evidenceComplete,additionalArenaEvidenceFailures:additionalArena.failures.length,selectedBoundsFailures:framing.selectedBoundsFailures.length,conservativeFitFlags:framing.conservativeFitFlags.length,queenBoundsFailures:framing.queenBoundsFailures.length,exactHullExceedances:framing.exactHullExceedances.length,silhouetteFrames:silhouetteRows.length,artifactFailures:failures.length,reviewPages:reviewPages.length}));
if(!conversionPassed)process.exitCode=1;
