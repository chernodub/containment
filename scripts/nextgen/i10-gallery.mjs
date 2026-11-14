#!/usr/bin/env node
/** File-only I10 evidence assembly, exact area review pages and three-generation comparison. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {constants} from 'node:fs';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {basename,resolve,relative,sep} from 'node:path';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';

// Preserve original bytes while avoiding duplicate allocation on APFS. Node
// falls back to a regular copy when cloning is unavailable.
const copyEvidence=(source,target)=>copyFile(source,target,constants.COPYFILE_FICLONE);

const args=process.argv.slice(2);
if(args.includes('--help')||!args.length){
  console.log('node scripts/nextgen/i10-gallery.mjs <output> [capture-dir ...] [--review-only|--compare-only|--showcase-only] [--skip-review] [--skip-compare] [--skip-showcase] [--history=/path/to/artifacts/nextgen] [--showcase-selection=/path/to/12-selections.json]');
  process.exit(0);
}
const options=new Set(['review-only','compare-only','showcase-only','skip-review','skip-compare','skip-showcase','history','showcase-selection']);
for(const arg of args.filter(a=>a.startsWith('--')))assert(options.has(arg.slice(2).split('=')[0]),`Unknown flag ${arg}`);
const positional=args.filter(a=>!a.startsWith('--'));
const output=resolve(positional.shift());
const sources=positional.map(p=>resolve(p));
const history=resolve(args.find(a=>a.startsWith('--history='))?.slice(10)??'/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen');
const only=args.find(a=>/--(?:review|compare|showcase)-only$/.test(a));
const should=kind=>only?only===`--${kind}-only`:!args.includes(`--skip-${kind}`);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=path=>path.split(sep).map(encodeURIComponent).join('/');
const safeFile=file=>assert(typeof file==='string'&&/^[\w.-]+\.png$/.test(file),`Unsafe PNG filename ${file}`);
const readManifest=async dir=>JSON.parse(await readFile(resolve(dir,'manifest.json'),'utf8'));
const writeJson=(file,value)=>writeFile(resolve(output,file),JSON.stringify(value,null,2)+'\n');
const css='body{background:#10161e;color:#e1eef5;font:15px system-ui;margin:24px}h1,h2{font-weight:650}p{line-height:1.5;color:#b3c5d1}a{color:#a5e7ff}figure{margin:0;background:#18222c;border:1px solid #394958}img{display:block;width:100%;height:auto}figcaption{padding:9px;overflow-wrap:anywhere}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.missing{min-height:160px;display:grid;place-content:center;color:#dfb4a3;padding:12px;background:#281c1c}.row{margin-bottom:24px}small{color:#a7b9c9}';
const html=(title,body)=>`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(title)}</title><style>${css}</style><h1>${escape(title)}</h1>${body}</html>`;
await mkdir(output,{recursive:true});

/** Assemble only clean matching builds; every replaced source remains in receipts. */
async function assemble(){
  assert(sources.length,'Supply at least one source capture, or use an --*-only mode');
  assert(sources.every(dir=>dir!==output),'Output must differ from every capture directory');
  const captures=await Promise.all(sources.map(async directory=>({directory,manifest:await readManifest(directory)})));
  const reference=captures[0].manifest;
  assert(reference.appAssets&&Object.keys(reference.appAssets).length,'Missing application asset hashes');
  for(const {directory,manifest:m}of captures){
    assert.deepEqual(m.errors??[],[],`Errors in ${directory}`);
    assert.deepEqual(m.failures??[],[],`Failures in ${directory}`);
    for(const key of ['viewport','deviceScaleFactor','seed','appAssets'])assert.deepEqual(m[key],reference[key],`${directory}: mismatched ${key}`);
    assert(m.shots.length,`No shots in ${directory}`);
  }
  const selected=new Map(),sprites=new Map(),receipts=[],superseded=[];
  for(const {directory,manifest:m}of captures){
    for(const shot of m.shots){
      safeFile(shot.file);
      assert.deepEqual(shot.errors??[],[],`${directory}/${shot.file}: errors`);
      const original=resolve(directory,shot.file),bytes=await readFile(original),source={directory,original,sha256:hash(bytes),captureGitSHA:m.gitSHA,distSnapshot:m.distSnapshot??null};
      const prior=selected.get(shot.file);
      if(prior){
        for(const key of ['scenario','room','frame','simulationMs','presentationMs'])assert.equal(shot[key],prior.shot[key],`Conflicting ${key} in duplicate ${shot.file}`);
        superseded.push({file:shot.file,previous:prior.source,replacement:source,identicalBytes:prior.source.sha256===source.sha256});
      }
      assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',`${shot.file}: PNG signature`);
      assert.equal(bytes.readUInt32BE(16),reference.viewport.width*reference.deviceScaleFactor,`${shot.file}: native width`);
      assert.equal(bytes.readUInt32BE(20),reference.viewport.height*reference.deviceScaleFactor,`${shot.file}: native height`);
      receipts.push({file:shot.file,kind:'native',...source});
      selected.set(shot.file,{shot,source});
    }
    for(const sprite of m.sprites??[]){
      safeFile(sprite.file);
      const original=resolve(directory,sprite.file),bytes=await readFile(original),source={directory,original,sha256:hash(bytes),captureGitSHA:m.gitSHA};
      receipts.push({file:sprite.file,kind:'sprite',...source});
      sprites.set(sprite.file,{sprite,source});
    }
  }
  for(const {shot,source}of selected.values())await copyEvidence(source.original,resolve(output,shot.file));
  for(const {sprite,source}of sprites.values())await copyEvidence(source.original,resolve(output,sprite.file));
  const manifest={
    label:basename(output),gitSHA:captures.at(-1).manifest.gitSHA,viewport:reference.viewport,
    deviceScaleFactor:reference.deviceScaleFactor,seed:reference.seed,appAssets:reference.appAssets,
    renderer:reference.renderer,hardwareAccelerated:captures.every(c=>c.manifest.hardwareAccelerated),
    errors:[],failures:[],sources:captures.map(({directory,manifest:m})=>({directory,gitSHA:m.gitSHA,distSnapshot:m.distSnapshot??null,viewport:m.viewport,shots:m.shots.length})),
    distSnapshot:{selection:true,note:'Native PNG bytes copied without modification from verified captures of identical application bundles. This is an evidence selection, not another browser run.'},
    shots:[...selected.values()].map(({shot,source})=>({...shot,evidenceSource:source})),
    sprites:[...sprites.values()].map(({sprite,source})=>({...sprite,evidenceSource:source})),
  };
  await writeJson('manifest.json',manifest);
  await writeJson('source-receipts.json',{sources:receipts,selected:manifest.shots.map(s=>({file:s.file,...s.evidenceSource})),superseded});
  await writeFile(resolve(output,'pngs.txt'),[...manifest.shots,...manifest.sprites].map(s=>resolve(output,s.file)).join('\n')+'\n');
  const cards=manifest.shots.map(s=>`<figure><a href="${url(s.file)}"><img src="${url(s.file)}" alt="${escape(s.file)}" loading="lazy"></a><figcaption>${escape(s.file)}<br><small>${escape(s.scenario)} · ${s.simulationMs??'?'} ms simulation · ${s.performance?.drawCalls??'?'} draws</small></figcaption></figure>`).join('');
  const sheets=manifest.sprites.map(s=>`<figure><a href="${url(s.file)}"><img src="${url(s.file)}" alt="${escape(s.file)}" loading="lazy"></a><figcaption>${escape(s.file)}</figcaption></figure>`).join('');
  await writeFile(resolve(output,'index.html'),html(`Containment / ${basename(output)}`,`<p>${manifest.shots.length} native captures, ${manifest.sprites.length} phase sheets. ${reference.viewport.width}×${reference.viewport.height}; original capture bytes and source hashes retained. Staged screenshots are not organic gameplay or performance certification.</p><p><a href="compare.html">Three generations</a> · <a href="showcase.html">Twelve candidates</a> · <a href="review480/index.html">All 480×270 review pages</a> · <a href="manifest.json">Manifest</a> · <a href="source-receipts.json">Source receipts</a></p><h2>Native frames</h2><main class="grid">${cards}</main><h2>Phase sheets</h2><section class="grid">${sheets}</section>`));
  console.log(`Assembled ${manifest.shots.length} native frames / ${manifest.sprites.length} sheets from ${captures.length} capture directories.`);
  return manifest;
}

/** Exact pixel-area box reduction, including fractional 720p→480 ratios. */
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
    const a=y*syScale,b=(y+1)*syScale,target=(y*width+x)*3;
    let red=0,green=0,blue=0;
    for(let sy=Math.floor(a);sy<Math.ceil(b);sy++){
      const weight=Math.min(b,sy+1)-Math.max(a,sy),offset=(Math.min(source.height-1,sy)*width+x)*3;
      red+=horizontal[offset]*weight/syScale;green+=horizontal[offset+1]*weight/syScale;blue+=horizontal[offset+2]*weight/syScale;
    }
    result.pixels[target]=Math.round(red);result.pixels[target+1]=Math.round(green);result.pixels[target+2]=Math.round(blue);
  }
  return result;
}
function nativeCrop(source,x,y,width=600,height=400){
  const image=canvas(width,height);
  for(let py=0;py<height;py++)for(let px=0;px<width;px++){
    const sx=x+px,sy=y+py;if(sx<0||sx>=source.width||sy<0||sy>=source.height)continue;
    const a=(sy*source.width+sx)*source.channels,b=(py*width+px)*3;
    for(let c=0;c<3;c++)image.pixels[b+c]=source.pixels[a+c];
  }
  return image;
}

async function review(manifest){
  const directory=resolve(output,'review480'),nativeDirectory=resolve(output,'review-native');
  await mkdir(directory,{recursive:true});await mkdir(nativeDirectory,{recursive:true});
  const pages=[],nativePages=[];
  let nativeTiles=[],nativePageNumber=0;
  async function flushNative(){
    if(!nativeTiles.length)return;
    const sheet=canvas(1800,852),file=`native-${String(++nativePageNumber).padStart(3,'0')}.png`,entries=[];
    nativeTiles.forEach(({shot,image,crop},i)=>{
      const x=i%3*600,y=Math.floor(i/3)*426;
      drawText(sheet,shot.file,x+4,y+4,undefined,1);drawImage(sheet,image,x,y+22,600,400);
      entries.push({file:shot.file,crop});
    });
    await writeFile(resolve(nativeDirectory,file),encode(sheet));nativePages.push({file,entries});nativeTiles=[];
  }
  for(let start=0;start<manifest.shots.length;start+=6){
    const entries=manifest.shots.slice(start,start+6),sheet=canvas(1440,592),file=`review-${String(start/6+1).padStart(3,'0')}.png`,receipt=[];
    for(let index=0;index<entries.length;index++){
      const shot=entries[index],bytes=await readFile(resolve(output,shot.file)),source=decode(bytes),small=reduceArea(source);
      await writeFile(resolve(directory,shot.file),encode(small));
      const x=index%3*480,y=Math.floor(index/3)*296;
      // Two lines avoid truncation on the longest ability/fight filenames.
      drawText(sheet,shot.file.slice(0,77),x+4,y+3,undefined,1);
      if(shot.file.length>77)drawText(sheet,shot.file.slice(77),x+4,y+12,undefined,1);
      drawImage(sheet,small,x,y+24,480,270);receipt.push({file:shot.file,nativeSHA256:hash(bytes),thumbnail:{width:480,height:270,method:'Exact pixel-area box average in sRGB code values; no exposure change'}});
      const b=shot.evidence?.marineBounds;
      if(shot.evidence?.state==='playing'&&b&&[b.left,b.top,b.right,b.bottom].every(Number.isFinite)){
        const crop={x:Math.round((b.left+b.right)/2)-300,y:Math.round((b.top+b.bottom)/2)-200,width:600,height:400};
        nativeTiles.push({shot,image:nativeCrop(source,crop.x,crop.y),crop});
        if(nativeTiles.length===6)await flushNative();
      }
    }
    await writeFile(resolve(directory,file),encode(sheet));pages.push({file,entries:receipt});
    if(start%60===0)console.log(`Review reductions ${Math.min(start+6,manifest.shots.length)}/${manifest.shots.length}`);
  }
  await flushNative();
  await writeFile(resolve(directory,'pages.json'),JSON.stringify(pages,null,2)+'\n');
  await writeFile(resolve(nativeDirectory,'pages.json'),JSON.stringify(nativePages,null,2)+'\n');
  for(const [directoryName,records]of [['review480',pages],['review-native',nativePages]])await writeFile(resolve(output,directoryName,'index.html'),html(`${basename(output)} / ${directoryName}`,`<p>Derivative review sheets only. Native originals remain unchanged. ${directoryName==='review-native'?'600×400 marine-centered crops copied 1:1; peripheral content must be inspected in original PNGs.':'Every native frame appears once at exact480×270; pages retain at most six frames.'}</p>${records.map(p=>`<figure><a href="${url(p.file)}"><img src="${url(p.file)}" loading="lazy" alt="${escape(p.file)}"></a><figcaption>${escape(p.file)}: ${p.entries.map(s=>escape(s.file)).join(' · ')}</figcaption></figure>`).join('')}`));
  console.log(`Review: ${pages.length} all-frame480 pages; ${nativePages.length} native combat crop pages.`);
}

const comparisonViews=[
  {id:'title',name:'Title',files:['title.png']},
  {id:'starting-boon',name:'Starting boon',files:['starting-boon.png']},
  {id:'rig-select',name:'Rig select / Breacher',files:['rig-select.png']},
  {id:'route',name:'Route',files:['route.png']},
  {id:'shop',name:'Shop',files:['shop.png']},
  {id:'results',name:'Results',files:['x3-results-statistics.png','results.png'],substitutes:['dead.png']},
  {id:'ending',name:'Ending',files:['complete-fixture.png','x3-completion-statistics.png']},
];
for(const room of ['awakening-bay','residential-gallery','communal-atrium','armory','relay-racks','infested-workshop','containment-annulus','overload-floor']){
  comparisonViews.push({id:`calm-${room}`,name:`${room} / calm`,files:[`combat-calm-${room}.png`]});
  comparisonViews.push({id:`combat-${room}`,name:`${room} / combat`,files:[`combat-kiting-${room}-03.png`,`combat-heavy-${room}-03.png`,`combat-heavy-${room}-04.png`]});
}
comparisonViews.push({id:'calm-boss',name:'Boss / calm or arrival',files:['combat-calm-reactor-vault.png'],substitutes:['boss-reactor-vault-01.png']});
comparisonViews.push({id:'combat-boss',name:'Boss / combat',files:['g2-queen-exposed-reactor-vault-04.png','boss-reactor-vault-04.png']});

async function comparison(manifest){
  const generations=[];
  for(const [name,directory]of [['ORIGINAL',resolve(history,'baseline')],['FINAL3',resolve(history,'final3')],['FINAL4',output]]){
    let historical;
    try{historical=name==='FINAL4'?manifest:await readManifest(directory);}catch(error){
      if(error.code!=='ENOENT')throw error;
      generations.push({name,directory,manifest:null,unavailable:true});continue;
    }
    generations.push({name,directory,manifest:historical});
  }
  const rows=[],sheet=canvas(1440,comparisonViews.length*306+32);
  for(let rowIndex=0;rowIndex<comparisonViews.length;rowIndex++){
    const view=comparisonViews[rowIndex],cells=[];
    for(let column=0;column<generations.length;column++){
      const generation=generations[column],shots=generation.manifest?.shots??[];
      let shot=view.files.map(f=>shots.find(s=>s.file===f)).find(Boolean),substitute=false;
      if(!shot){shot=(view.substitutes??[]).map(f=>shots.find(s=>s.file===f)).find(Boolean);substitute=!!shot;}
      const label=`${generation.name} / ${view.name}${substitute?' / SUBSTITUTE':''}`;
      drawText(sheet,label,column*480+4,rowIndex*306+4,undefined,1);
      let cell;
      if(!shot){
        drawText(sheet,'NOT CAPTURED',column*480+12,rowIndex*306+125,[222,168,151],2);
        cell={generation:generation.name,missing:true,requested:view.files,note:generation.unavailable?'Historical gallery unavailable':'Not captured in this generation'};
      }else{
        safeFile(shot.file);
        const original=resolve(generation.directory,shot.file),bytes=await readFile(original),image=decode(bytes),small=reduceArea(image);
        const destination=generation.name==='FINAL4'?shot.file:`comparison-sources/${generation.name.toLowerCase()}/${shot.file}`;
        if(generation.name!=='FINAL4'){
          await mkdir(resolve(output,'comparison-sources',generation.name.toLowerCase()),{recursive:true});
          await copyEvidence(original,resolve(output,destination));
        }
        drawImage(sheet,small,column*480,rowIndex*306+24,480,270);
        drawText(sheet,shot.file.slice(0,76),column*480+4,rowIndex*306+296,undefined,1);
        cell={generation:generation.name,file:shot.file,path:destination,original,sha256:hash(bytes),sourceGitSHA:generation.manifest.gitSHA,substitute,note:substitute?'Historical substitute with different state/staging; not a matched capture':null,scenario:shot.scenario,room:shot.room,frame:shot.frame,simulationMs:shot.simulationMs};
      }
      cells.push(cell);
    }
    rows.push({id:view.id,title:view.name,cells});
  }
  await writeFile(resolve(output,'before-after.png'),encode(sheet));
  await writeJson('comparison-receipts.json',{note:'Three generations, actual filenames and hashes retained. Captures differ in source and camera/staging. Missing captures and historical substitutes are explicit; no original pixels were relabeled.',rows});
  await writeFile(resolve(output,'compare.html'),html('Containment / ORIGINAL → FINAL3 → FINAL4',`<p>${rows.length} views. Historical source PNGs are copied byte-for-byte into comparison-sources. Original/final3/final4 staging and camera may differ. Missing captures and substitutes are labeled; this is an art comparison, not a matched performance test.</p><p><a href="before-after.png">Full before/after sheet</a> · <a href="comparison-receipts.json">Source receipts</a></p>${rows.map(row=>`<section class="row"><h2>${escape(row.title)}</h2><div class="grid">${row.cells.map(cell=>cell.missing?`<figure><figcaption>${escape(cell.generation)}</figcaption><div class="missing">${escape(cell.note)}</div></figure>`:`<figure><a href="${url(cell.path)}"><img src="${url(cell.path)}" loading="lazy" alt="${escape(cell.generation+' '+cell.file)}"></a><figcaption><b>${escape(cell.generation)}</b> ${cell.substitute?'<b>HISTORICAL SUBSTITUTE</b>':''}<br>${escape(cell.file)}<br><small>${escape(cell.note??`${cell.simulationMs??'?'} ms simulation`)}</small></figcaption></figure>`).join('')}</div></section>`).join('')}`));
  console.log(`Comparison: ${rows.length} rows, ${rows.flatMap(r=>r.cells).filter(c=>c.missing).length} explicitly missing captures.`);
}

async function showcase(manifest){
  let candidates=[
    ['Title',['title.png']],['Starting boon',['starting-boon.png']],['Cryo rig',['rig-select-cryo.png']],['Route',['route.png']],
    ['Illustrated ending',['complete-fixture.png']],['Armory construction',['combat-calm-armory.png']],
    ['Infested construction',['combat-calm-infested-workshop.png','combat-calm-swarm-junction.png']],
    ['Marine in bright crowd',['g5-body-only-containment-annulus-04.png','combat-kiting-containment-annulus-03.png']],
    ['Queen exposed',['g2-queen-exposed-reactor-vault-04.png','boss-reactor-vault-04.png']],
    ['Pyro full kit',['v2-full-pyro-containment-annulus-containment-annulus-04.png']],
    ['Arc full kit',['v2-full-arc-infested-workshop-infested-workshop-04.png']],
    ['Dark encounter',['combat-kiting-swarm-junction-03.png','combat-kiting-infested-workshop-03.png']],
  ];
  const selectionFile=args.find(a=>a.startsWith('--showcase-selection='))?.slice(21);
  if(selectionFile){
    const selection=JSON.parse(await readFile(resolve(selectionFile),'utf8'));
    assert(Array.isArray(selection)&&selection.length===12,'Showcase selection must contain twelve {title,file} rows');
    assert(new Set(selection.map(row=>row.file)).size===12,'Showcase selections must use twelve distinct originals');
    for(const row of selection){safeFile(row.file);assert(typeof row.title==='string'&&row.title.trim(),'Showcase title required');assert(manifest.shots.some(s=>s.file===row.file),`Showcase file absent from capture manifest: ${row.file}`);}
    candidates=selection.map(row=>[row.title,[row.file]]);
  }
  const selected=candidates.map(([title,files])=>({title,shot:files.map(file=>manifest.shots.find(s=>s.file===file)).find(Boolean)}));
  // Small partial review batches still produce twelve candidate slots, honestly labeled missing.
  const board=canvas(1440,4*302),receipts=[];
  for(let i=0;i<selected.length;i++){
    const {title,shot}=selected[i],x=i%3*480,y=Math.floor(i/3)*302;
    drawText(board,title,x+4,y+4,undefined,1);
    if(shot){
      const original=resolve(output,shot.file),bytes=await readFile(original);
      drawImage(board,reduceArea(decode(bytes)),x,y+24,480,270);
      receipts.push({title,file:shot.file,original,sha256:hash(bytes),evidenceSource:shot.evidenceSource??null});
    }else{drawText(board,'NOT CAPTURED',x+12,y+130,[222,168,151],2);receipts.push({title,missing:true});}
  }
  await writeFile(resolve(output,'showcase.png'),encode(board));
  await writeJson('showcase.json',{note:selectionFile?'Twelve original PNGs chosen through an explicit acceptance-engineer selection file; hashes and capture receipts retained.':'Twelve candidate views selected by filename; final art selection requires visual inspection by the acceptance engineer.',selectionFile:selectionFile?resolve(selectionFile):null,images:receipts});
  await writeFile(resolve(output,'showcase.html'),html('Containment / Twelve showcase candidates',`<p>Candidate selection for visual review. <a href="showcase.png">Contact sheet</a> · <a href="showcase.json">Source receipts</a></p><main class="grid">${receipts.map(s=>s.missing?`<figure><figcaption>${escape(s.title)}</figcaption><div class="missing">Not captured</div></figure>`:`<figure><a href="${url(s.file)}"><img src="${url(s.file)}" alt="${escape(s.title)}" loading="lazy"></a><figcaption>${escape(s.title)}<br>${escape(s.file)}</figcaption></figure>`).join('')}</main>`));
  console.log(`Showcase: ${receipts.filter(s=>!s.missing).length}/12 candidates found.`);
}

const manifest=only?await readManifest(output):await assemble();
if(should('review'))await review(manifest);
if(should('compare'))await comparison(manifest);
if(should('showcase'))await showcase(manifest);
