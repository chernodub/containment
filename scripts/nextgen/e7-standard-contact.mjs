/** Retain one exact480 before/after color/grayscale sheet per critique round. */
import{readFile,writeFile,mkdir}from'node:fs/promises';
import{resolve}from'node:path';
import{decode,encode,canvas,drawImage,drawText}from'./g2-png.mjs';
const rooms=['residential-gallery','infested-workshop','relay-racks'],root=resolve('artifacts/nextgen');
await mkdir(resolve(root,'e7-standard'),{recursive:true});
for(const round of[1,2,3]){const dir=resolve(root,`e7-round${round}`),sheet=canvas(1920,6*296);let row=0;for(const mode of['calm','kiting'])for(const room of rooms){const file=`combat-${mode}-${room}${mode==='kiting'?'-02':''}.png`;drawText(sheet,`ROUND${round} ${file}  BEFORE / AFTER / GRAY BEFORE / GRAY AFTER`,5,row*296+5,undefined,1);const paths=[resolve(root,'e7-standard/before/review480',file),resolve(dir,'review480',file),resolve(root,'e7-standard/before/grayscale','480-'+file),resolve(dir,'grayscale','480-'+file)];for(const[i,p]of paths.entries())drawImage(sheet,decode(await readFile(p)),i*480,row*296+24,480,270);row++;}await writeFile(resolve(root,'e7-standard',`round${round}-contact.png`),encode(sheet));}
