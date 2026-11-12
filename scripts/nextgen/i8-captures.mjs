#!/usr/bin/env node
/** Native and720p final acceptance galleries, preserving every capture receipt. */
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {loadavg} from 'node:os';
const source=(await readFile('artifacts/nextgen/i8/mounted-dist/SOURCE_SHA','utf8')).trim();
const dist='artifacts/nextgen/i8/mounted-dist',logs='artifacts/nextgen/i8/logs';
const rooms=['awakening-bay','passenger-vault','residential-gallery','communal-atrium','crew-checkpoint','armory','freight-hold','breached-loading-bay','relay-racks','transmission-chamber','diagnostic-gallery','safety-interlock-station','coolant-plant','service-shaft-landing','infested-workshop','swarm-junction','shielding-gate','containment-annulus','manual-control-chamber','overload-floor'];
const rigs=['breacher','cryo','pyro','arc'];
const abilities=['ram','seismic-slam','bulwark','railbreaker','frost-trail','cryo-nova','glacier','whiteout','afterburn','flashfire','napalm-charge','meltdown','static-step','overload','tesla-pylon','overclock'];
const ui=['title','title-settings','rig-select','rig-select-cryo','rig-select-pyro','rig-select-arc','starting-boon','augment-draft','reward','route','shop','pause','pause-loadout','pause-settings','pause-controls','dead','results','complete-fixture','x3-results-statistics','x3-completion-statistics','onboarding',...['room-enter','room-clear','boss-intro','boss-defeated','overdrive-ready','death'].map(s=>`beat-${s}-fixture`)];
const details=['v3-recovery','boss','g2-queen-exposed','x2-queen-opening-high','x2-queen-closing-high','x2-nest-husk-high','g2-champions','status-vfx','g2-pickups','i7-boss-breacher','i7-boss-cryo','i7-boss-arc','i7-champions-effects','i7-pickups-zones'];
const extra=['combat-calm:reactor-vault','i8-corpse-budget','u4-critical-objective','u4-ability-inspect','u4-boon-inspect','u4-ending-reduced-motion','u4-burn-ticks','u4-radar-fade','g3-geometry-coverage','g3-void-contours','g3-ink-switches',...['containment-annulus','infested-workshop','overload-floor'].map(r=>'i8-families:'+r),...['armory','relay-racks','diagnostic-gallery','safety-interlock-station','freight-hold'].map(r=>'g4-forms-high:'+r),...['whiteout','meltdown','napalm-charge'].map(a=>'g4-danger-'+a),...rigs.flatMap(rig=>['containment-annulus','infested-workshop'].map(r=>`v4-yield-${rig}-masked-${r}`))];
const receipt={sourceSHA:source,harnessSHA:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),jobs:[]};await mkdir(logs,{recursive:true});
async function run(name,command,args){const started=Date.now(),before=loadavg();console.log('START',name);const fs=await import('node:fs'),log=fs.createWriteStream(`${logs}/${name}.log`);const p=spawn(command,args,{stdio:['ignore','pipe','pipe']});p.stdout.pipe(log);p.stderr.pipe(log);const code=await new Promise((ok,fail)=>{p.on('error',fail);p.on('close',ok);});log.end();receipt.jobs.push({name,command,args,code,seconds:(Date.now()-started)/1000,loadStart:before,loadEnd:loadavg()});await writeFile(`${logs}/capture-jobs.json`,JSON.stringify(receipt,null,2));console.log('DONE',name,code);if(code)throw Error(`Capture ${name} failed; original receipt retained`);}
for(const [label,size] of [['final2',[]],['final2-720',['--width=1280','--height=720']]]){
 const batches=[];
 async function capture(suffix,scenarios,burst=4,selectedRooms=rooms){const batch=label+'-'+suffix;batches.push(batch);await run(batch,'npm',['run','capture','--','--label='+batch,'--dist='+dist,'--dist-source-sha='+source,'--scenarios='+scenarios.join(','),'--rooms='+selectedRooms.join(','),'--burst='+burst,'--keep-going',...size]);}
 await capture('ui',ui);
 await capture('rooms',['combat-calm','x2-calm-motion-high','combat-kiting']);
 await capture('combat',['combat-heavy'],4,['awakening-bay','communal-atrium','armory','relay-racks','infested-workshop','containment-annulus','overload-floor','passenger-vault','breached-loading-bay','safety-interlock-station']);
 await capture('abilities',abilities.map(a=>'v2-'+a),7);
 await capture('kits',rigs.flatMap(rig=>['containment-annulus','infested-workshop'].map(r=>`v2-full-${rig}-${r}`)),7);
 await capture('details',details,7);
 await capture('low',['g2-calm-low','g2-kiting-low'],4,['awakening-bay','infested-workshop','overload-floor']);
 await capture('extra',extra);
 await run(label+'-assemble','node',['scripts/nextgen/i7-gallery.mjs',label,...batches]);
 await run(label+'-reduce','node',['scripts/nextgen/x3-review.mjs','artifacts/nextgen/'+label]);
 await run(label+'-review','node',['scripts/nextgen/i8-gallery.mjs','review','artifacts/nextgen/'+label]);
}
await run('final2-compare','node',['scripts/nextgen/i8-gallery.mjs','compare','artifacts/nextgen/final2']);
