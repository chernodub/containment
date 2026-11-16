import {readFile} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {createRequire} from 'node:module';
const {SourceMapConsumer}=createRequire(import.meta.url)('source-map-js');

/** Attribute exclusive samples through build source maps; retain unknown and idle time. */
export async function attributeCpuSelf(profile,dist){
 const maps=new Map(),nodes=new Map(),parents=new Map(),classLines=new Map();
 for(const node of profile.nodes)for(const child of node.children??[])parents.set(child,node.id);
 const rules=[['GC',/garbage collector/i],['simulation step',/src\/DepthGame|src\/game\//],['animation mixers/skinning',/AnimationMixer|AnimationAction|Skeleton|PropertyMixer|PropertyBinding/],['actor pose/motion',/Actor|Motion|models\.ts/],['VFX/telegraph batching',/render\/(vfx|abilities)\/|Telegraph|Effects/],['lighting/shadow update',/lighting\/|Shadow/],['world dressing update',/render\/world\//],['UI/HUD DOM',/src\/ui\//],['idle',/\(idle\)/]];
 for(const node of profile.nodes){
  const frame=node.callFrame;let source='';
  if(frame.url){const file=basename(new URL(frame.url).pathname);if(!maps.has(file)){try{maps.set(file,new SourceMapConsumer(JSON.parse(await readFile(resolve(dist,'assets',file+'.map'),'utf8'))));}catch{maps.set(file,null);}}
   const map=maps.get(file),position=map?.originalPositionFor({line:frame.lineNumber+1,column:frame.columnNumber});source=position?.source??'';
   if(map&&source&&/three.*core/.test(source)){
    const key=file+'|'+source;
    if(!classLines.has(key)){const classes=[];map.sourceContentFor(source,true)?.split('\n').forEach((line,index)=>{const match=/^class\s+(\w+)/.exec(line);if(match)classes.push({line:index+1,name:match[1]});});classLines.set(key,classes);}
    let owner='';for(const entry of classLines.get(key)){if(entry.line>position.line)break;owner=entry.name;}source+=' '+owner;
   }
  }
  const text=source+' '+frame.functionName;
  nodes.set(node.id,rules.find(([,pattern])=>pattern.test(text))?.[0]??'unattributed');
 }
 // Native DOM/driver leaves inherit the nearest recognized subsystem caller.
 for(const [id,category] of nodes)if(category==='unattributed'){let parent=parents.get(id);while(parent!==undefined){const owner=nodes.get(parent);if(owner&&owner!=='unattributed'){nodes.set(id,owner);break;}parent=parents.get(parent);}}
 const totals={};for(let i=0;i<(profile.samples?.length??0);i++){const key=nodes.get(profile.samples[i])??'unattributed';totals[key]=(totals[key]??0)+(profile.timeDeltas?.[i]??0)/1000;}
 return {scope:'exclusive leaf samples; source mapped where available; includes idle separately; sampled wall duration is subject to scheduling',milliseconds:totals,sourceMaps:[...maps].filter(([,map])=>map).map(([file])=>file)};
}
