#!/usr/bin/env node
/** Matched frozen builds, one owned browser, native timing and retained shared-host load. */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {resolve} from 'node:path';
import {loadavg} from 'node:os';

const option=(name,fallback)=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const prefix=option('label','v8');assert(/^[\w.-]+$/.test(prefix));
const logRoot=resolve('artifacts/nextgen/v8/logs');await mkdir(logRoot,{recursive:true});
function inventory(ownerPid){
  const rows=execFileSync('ps',['-axo','pid=,ppid=,%cpu=,comm='],{encoding:'utf8'}).trim().split('\n').map(line=>{
    const m=line.trim().match(/^(\d+)\s+(\d+)\s+([\d.]+)\s+(.+)$/);
    return m?{pid:+m[1],ppid:+m[2],cpu:+m[3],executable:m[4]}:null;
  }).filter(Boolean);
  const processes=new Map(rows.map(row=>[row.pid,row]));
  function owned(row){
    const seen=new Set();
    for(let pid=row.pid;pid&&!seen.has(pid);pid=processes.get(pid)?.ppid){
      if(pid===ownerPid)return true;seen.add(pid);
    }
    return false;
  }
  return{at:new Date().toISOString(),load:loadavg(),browsers:rows.filter(row=>/\/(?:Google Chrome for Testing|Chromium|chrome-headless-shell)$/.test(row.executable)).map(row=>({...row,owned:owned(row)}))};
}
const receipts=[];
const sides=option('sides','before,final').split(',');
assert(sides.length>0&&new Set(sides).size===sides.length&&sides.every(side=>['before','final'].includes(side)));
for(const side of sides){
  const dist=resolve(option(side,`artifacts/nextgen/v8/${side==='before'?'before':'shipping'}-dist`));
  const sha=(await readFile(resolve(dist,'SOURCE_SHA'),'utf8')).trim();assert(/^[a-f0-9]{40}$/.test(sha));
  const label=`${prefix}-${side}-native`,before=inventory(null);
  assert.equal(before.browsers.length,0,`Another automation browser exists before ${label}`);
  const args=['run','bench','--',`--label=${label}`,`--dist=${dist}`,`--dist-source-sha=${sha}`,'--no-build',
    `--rooms=${option('rooms','relay-racks,freight-hold')}`,`--rigs=${option('rigs','breacher,cryo,pyro,arc')}`,
    `--tiers=${option('tiers','high')}`,`--repeat=${option('repeat','2')}`,`--seconds=${option('seconds','20')}`];
  console.log(`Starting ${label}; load=${before.load}`);
  const log=createWriteStream(resolve(logRoot,label+'.log'));
  const child=spawn('npm',args,{stdio:['ignore','pipe','pipe']});child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
  const snapshots=[before];let interrupted=false;
  const timer=setInterval(()=>{
    const sample=inventory(child.pid);snapshots.push(sample);
    if(sample.browsers.some(browser=>!browser.owned)){
      interrupted=true;child.kill('SIGTERM');
    }
  },5000);
  const code=await new Promise((ok,fail)=>{child.once('error',fail);child.once('close',ok);});
  clearInterval(timer);snapshots.push(inventory(child.pid));await new Promise(done=>log.end(done));
  const receipt={label,dist,sha,args,code,interrupted,snapshots,
    maximumOwned:Math.max(...snapshots.map(s=>s.browsers.filter(b=>b.owned).length)),
    foreign:snapshots.flatMap(s=>s.browsers.filter(b=>!b.owned))};
  receipts.push(receipt);await writeFile(resolve('artifacts/nextgen/v8',prefix+'-benchmark-ownership.json'),JSON.stringify(receipts,null,2));
  assert.equal(code,0,`${label} failed; raw report and log retained`);
  assert(!interrupted&&receipt.foreign.length===0,'Foreign browser overlap invalidates timing isolation');
  assert.equal(receipt.maximumOwned,1,'Expected one owned native benchmark browser');
}
