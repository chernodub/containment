import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
import plan from './studio-plan.mjs';

const [argument]=process.argv.slice(2);
const filter=argument?.startsWith('--only=')?new RegExp(argument.slice(7)):null;
const description=filter?undefined:argument;
const shots=description?JSON.parse(await readFile(description,'utf8')):plan;
const dist=resolve('dist'), out=resolve('public/assets/ui/studio',description?'custom':'.');
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
let browser;
try{
  await new Promise((done,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',done);});
  browser=await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox',`--use-angle=${process.platform==='darwin'?'metal':'gl'}`,'--enable-gpu','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  page.setDefaultTimeout(180000);
  await page.addInitScript(()=>{
    let seed=1729;
    Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/?debug=1&seed=1729`);
  await page.waitForFunction(()=>!!window.__containmentDebug);
  let room;
  await mkdir(out,{recursive:true});
  const manifest=filter?JSON.parse(await readFile(resolve(out,'manifest.json'),'utf8')):{};
  const entries=Object.entries(shots).filter(([name])=>!filter||filter.test(name));
  for(const [name,shot] of entries){
    if(!/^[a-z0-9-]+$/.test(name))throw Error(`Invalid shot name ${name}`);
    const nextRoom=shot.room??'awakening-bay';
    if(room!==nextRoom){
      await page.evaluate(id=>window.__containmentDebug.gotoRoom(id,{rig:'breacher'}),nextRoom);
      room=nextRoom;
    }
    let data=await page.evaluate(input=>window.__containmentDebug.studio(input),shot);
    if(!description&&name==='title-hero'){
      const plates=await page.evaluate(async hero=>{
        const canvas=document.createElement('canvas');
        canvas.width=1280;canvas.height=720;
        const ctx=canvas.getContext('2d');
        const draw=async(src,alpha=1)=>{
          const image=new Image();image.src=src;await image.decode();
          ctx.globalAlpha=alpha;ctx.drawImage(image,0,0,1280,720);
        };
        await draw(hero);
        const layer=canvas.toDataURL('image/webp',.92);
        ctx.clearRect(0,0,1280,720);
        for(const name of ['background','midground'])await draw('/assets/ui/u10/'+name+'-1280.webp');
        await draw(hero);
        await draw('/assets/ui/u10/foreground-1280.webp');
        await draw('/assets/ui/u10/fog-1280.webp',.55);
        return {layer,composite:canvas.toDataURL('image/webp',.9)};
      },data);
      const composite=Buffer.from(plates.composite.split(',')[1],'base64');
      await writeFile(resolve(out,'title-composite.webp'),composite);
      manifest['title-composite']={file:'title-composite.webp',bytes:composite.length,compositeOf:['U10 surviving plates','title-hero']};
      data=plates.layer;
    }
    const bytes=Buffer.from(data.split(',')[1],'base64');
    const file=name+(shot.transparent&&(description||name!=='title-hero')?'.png':'.webp');
    await writeFile(resolve(out,file),bytes);
    manifest[name]={file,bytes:bytes.length,shot};
    console.log(`${file} (${bytes.length} bytes)`);
  }
  await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}finally{
  await browser?.close();
  server.close();
}
