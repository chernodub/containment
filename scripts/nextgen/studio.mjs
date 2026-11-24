import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
import plan from './studio-plan.mjs';

const args=process.argv.slice(2);
const argument=args.find(arg=>!arg.startsWith('--out='));
const directory=args.find(arg=>arg.startsWith('--out='))?.slice(6);
const filter=argument?.startsWith('--only=')?new RegExp(argument.slice(7)):null;
const description=filter?undefined:argument;
const shots=description?JSON.parse(await readFile(description,'utf8')):plan;
const dist=resolve('dist'), out=directory?resolve(directory):resolve('public/assets/ui/studio',description?'custom':'.');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path=resolve(dist,'.'+pathname+(pathname==='/'?'index.html':''));
    if(!path.startsWith(dist+sep)){res.writeHead(404).end();return;}
    const bytes=await readFile(path);
    res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream'}).end(bytes);
  }catch{res.writeHead(404).end();}
});
let browser, page;
try{
  let room;
  await mkdir(out,{recursive:true});
  const manifest=filter&&!directory?JSON.parse(await readFile(resolve(out,'manifest.json'),'utf8')):{};
  const entries=Object.entries(shots).filter(([name])=>!filter||filter.test(name));
  const portraits=entries.filter(([,shot])=>shot.source==='selection24');
  if(portraits.length){
    const blender=(script,args)=>execFileSync('blender',['-b','--python-exit-code','1','-P','tools/assets/k12-hero/'+script,'--',...args],{stdio:'inherit'});
    blender('marine.py',['--hero','--portrait-kit']);
    blender('selection24.py',['--out',out,'--rig',...portraits.map(([,shot])=>shot.rig)]);
  }
  if(entries.some(([,shot])=>shot.source!=='selection24')){
    await new Promise((done,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',done);});
    browser=await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox',`--use-angle=${process.platform==='darwin'?'metal':'gl'}`,'--enable-gpu','--ignore-gpu-blocklist']});
    page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
    page.setDefaultTimeout(180000);
    await page.addInitScript(()=>{
      let seed=1729;
      Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/?debug=1&seed=1729`);
    await page.waitForFunction(()=>!!window.__containmentDebug);
  }
  for(const [name,shot] of entries){
    if(!/^[a-z0-9-]+$/.test(name))throw Error(`Invalid shot name ${name}`);
    if(shot.source==='selection24'){
      const file='portrait-'+shot.rig+'.png';
      manifest[name]={file,bytes:(await readFile(resolve(out,file))).length,shot};
      continue;
    }
    const nextRoom=shot.room??'awakening-bay';
    if(room!==nextRoom){
      await page.evaluate(id=>window.__containmentDebug.gotoRoom(id,{rig:'breacher'}),nextRoom);
      room=nextRoom;
    }
    const data=await page.evaluate(input=>window.__containmentDebug.studio(input),shot);
    const bytes=Buffer.from(data.split(',')[1],'base64');
    const file=name+(shot.transparent?'.png':'.webp');
    await writeFile(resolve(out,file),bytes);
    manifest[name]={file,bytes:bytes.length,shot};
    console.log(`${file} (${bytes.length} bytes)`);
  }
  await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}finally{
  await browser?.close();
  server.close();
}
