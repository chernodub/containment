/** Audit saved, actually projected camera receipts without opening a browser. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const dir=resolve(process.argv[2]),manifest=JSON.parse(await readFile(resolve(dir,'manifest.json'),'utf8'));
const rows=manifest.shots.filter(s=>s.evidence?.g6FramingProof).map(s=>{
 const p=s.evidence.g6FramingProof,i=p.insets,v=p.viewport,b=p.marineBounds;
 const selected=p.framing?.focusedPair?[p.framing.focusContactId]:p.framing?.selectedIds?.filter(id=>id>=0)??[];
 const contacts=p.contacts.filter(c=>selected.includes(c.id));
 return{file:s.file,scenario:s.scenario,room:s.room,frame:s.frame,insets:i,framing:p.framing,marineInside:b.left>=i.left-.5&&b.right<=v.width-i.right+.5&&b.top>=i.top-.5&&b.bottom<=v.height-i.bottom+.5,marineBounds:b,selected:contacts.map(c=>({id:c.id,bounds:c.bounds,insideUsable:c.insideUsable})),selectedInside:contacts.every(c=>c.insideUsable),aimedVisible:p.contacts.filter(c=>c.aim>.2&&c.distance<400).map(c=>({id:c.id,inside:c.insideUsable})),contacts:p.contacts.length};
});
const report={source:manifest.distSnapshot,viewport:manifest.viewport,rows,marineFailures:rows.filter(r=>!r.marineInside),selectedBoundsFailures:rows.filter(r=>!r.selectedInside),fitSelectedFailures:rows.filter(r=>r.framing?.fit&&!r.selectedInside),conservativeFitFlags:rows.filter(r=>r.framing&&!r.framing.fit),note:'Actual projected8-corner body bounds, original saved capture receipts. Non-selected peripheral contacts can remain outside. Complete group is preferred, then the selected priority pair; Fit flags are conservative: an iteration-limit receipt can be false even when actual body bounds are inside. This is staged presentation evidence, not an organic campaign.'};
await writeFile(resolve(dir,'framing-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({frames:rows.length,marineFailures:report.marineFailures.length,selectedBoundsFailures:report.selectedBoundsFailures.length,fitSelectedFailures:report.fitSelectedFailures.length,conservativeFitFlags:report.conservativeFitFlags.length}));
if(report.marineFailures.length||report.selectedBoundsFailures.length)process.exitCode=2;
