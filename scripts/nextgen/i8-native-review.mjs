#!/usr/bin/env node
/** Four-up native-pixel review pages; no source frame is resized. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {decode,encode,canvas,drawText,drawImage} from './g2-png.mjs';
const root=resolve(process.argv[2]),m=JSON.parse(await readFile(root+'/manifest.json','utf8')),out=root+'/native-review';await mkdir(out,{recursive:true});
const groups={world:[],actions:[],screens:[]};
for(const s of m.shots){const group=/-(rooms|combat|low)$/.test(s.sourceLabel??'')?'world':/-(abilities|kits)$/.test(s.sourceLabel??'')?'actions':'screens';groups[group].push(s);}
const pages=[];
for(const [group,shots]of Object.entries(groups))for(let start=0;start<shots.length;start+=4){
 const selected=shots.slice(start,start+4),sheet=canvas(m.viewport.width*2,(m.viewport.height+24)*Math.ceil(selected.length/2));
 for(const [i,s]of selected.entries()){const image=decode(await readFile(root+'/'+s.file));if(image.width!==m.viewport.width||image.height!==m.viewport.height)throw Error('Unexpected native size '+s.file);const x=i%2*m.viewport.width,y=Math.floor(i/2)*(m.viewport.height+24);drawText(sheet,s.file,x+5,y+5,[220,235,242],1);drawImage(sheet,image,x,y+24,image.width,image.height);}
 const file=`${group}-${String(start/4+1).padStart(3,'0')}.png`;await writeFile(out+'/'+file,encode(sheet));pages.push({group,file,sourceFiles:selected.map(s=>s.file),nativeWidth:m.viewport.width,nativeHeight:m.viewport.height});
}
await writeFile(out+'/manifest.json',JSON.stringify({note:'Original native image pixels, four-up without resizing. Exact area-reduced counterparts are review480/.',pages},null,2));console.log(pages.length+' native review sheets: '+out);
