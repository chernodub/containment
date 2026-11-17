/** Summarize existing asset receipts and native benchmark inventories, without launching a browser. */
import{readFile,writeFile}from'node:fs/promises';
const root='artifacts/nextgen/t12-final';
const json=async p=>JSON.parse(await readFile(`${root}/${p}`,'utf8'));
const before=await json('before/actors.json'),packed=await json('packing.json');
const baseline=(await json('bench-before/benchmark.json')).runs[0],final=(await json('bench-after-final/benchmark.json')).runs[0];
const live=new Map(final.gpuPassTimings.memory.textures.map(t=>[t.name,t]));
const motionNames={marine:'marine',dretch:'crawler',basilisk:'stalker',marauder:'spitter',dragoon:'carrier',tyrant:'brute'};
const motionBytes=Object.fromEntries(await Promise.all(Object.entries(motionNames).map(async([asset,name])=>[asset,(await readFile(`public/assets/models/motion/${name}-motion.glb`)).length])));
const rows=before.map(a=>{const p=packed.find(p=>p.name===a.name);return{asset:a.name,motionBytes:motionBytes[a.name]??0,beforeGpuBytes:a.textures.reduce((s,t)=>s+t.gpuBytes,0),afterGpuBytes:p.textures.reduce((s,t)=>s+live.get(t.name).bytes,0),fallbackGpuBytes:p.textures.reduce((s,t)=>s+t.rgbaMipBytes,0),beforeFileBytes:a.fileBytes+(motionBytes[a.name]??0),afterFileBytes:p.afterBytes+(motionBytes[a.name]??0),fallbackFileBytes:p.fallbackBytes+(motionBytes[a.name]??0)};});
const sum=key=>rows.reduce((s,r)=>s+r[key],0);const totals=Object.fromEntries(Object.keys(rows[0]).filter(k=>k!=='asset').map(k=>[k,sum(k)]));
const measurements={rows,totals,sceneBeforeBytes:baseline.gpuPassTimings.memory.textureBytes,sceneAfterBytes:final.gpuPassTimings.memory.textureBytes,programCreations:{before:baseline.programs,after:final.programs},preparation:{before:baseline.preparation,after:final.preparation}};
await writeFile(`${root}/summary.json`,JSON.stringify(measurements,null,2));
const mib=n=>(n/1048576).toFixed(3),mb=n=>(n/1e6).toFixed(3);
await writeFile(`${root}/asset-table.md`,'| Asset | GPU MiB before | GPU MiB after | Model download MB before | Model download MB after | PNG fallback model MB |\n|---|---:|---:|---:|---:|---:|\n'+[...rows,{asset:'TOTAL',...totals}].map(r=>`| ${r.asset} | ${mib(r.beforeGpuBytes)} | ${mib(r.afterGpuBytes)} | ${mb(r.beforeFileBytes)} | ${mb(r.afterFileBytes)} | ${mb(r.fallbackFileBytes)} |`).join('\n')+'\n');
const textures=[];for(const a of before){const p=packed.find(p=>p.name===a.name);for(const t of a.textures){const n=p.textures.find(x=>x.name===t.name),gpu=live.get(t.name);textures.push({asset:a.name,name:t.name,before:t,after:{...n,gpuBytes:gpu.bytes,gpuFormat:gpu.format,mips:gpu.mips}});}}
await writeFile(`${root}/actor-texture-table.md`,'| Asset / map | Before size | Before mips | Before GPU bytes | Before image bytes | After size | Encoding / GPU format | After mips | After GPU bytes | After KTX2 bytes |\n|---|---|---:|---:|---:|---|---|---:|---:|---:|\n'+textures.map(t=>`| ${t.asset} / ${t.name} | ${t.before.width}×${t.before.height} RGBA8 | ${Math.floor(Math.log2(Math.max(t.before.width,t.before.height)))+1} | ${t.before.gpuBytes} | ${t.before.fileBytes} | ${t.after.width}×${t.after.height} | ${t.after.encoding} / ${t.after.gpuFormat} | ${t.after.mips} | ${t.after.gpuBytes} | ${t.after.ktxBytes} |`).join('\n')+'\n');
await writeFile(`${root}/runtime-texture-table.md`,'| Runtime texture | Size | Format | Mips | GPU bytes |\n|---|---|---:|---|---:|\n'+final.gpuPassTimings.memory.textures.filter(t=>!t.renderTarget).map(t=>`| ${t.name} | ${t.width}×${t.height} | ${t.format} | ${t.mips??'generated / procedural'} | ${t.bytes} |`).join('\n')+'\n');
console.log(await readFile(`${root}/asset-table.md`,'utf8'));
