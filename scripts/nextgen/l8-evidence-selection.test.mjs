import assert from 'node:assert/strict';
import {test} from 'vitest';
import {selectL8Evidence} from './l8-evidence-selection.mjs';
import {review480,grayscale} from './l8-review-images.mjs';
import {canvas} from './g2-png.mjs';
const sha='a'.repeat(40),room={id:'test-room',arena:{x:300,y:400}},body={left:600,right:700,top:400,bottom:550};
function evidence(calm=false){return{state:'playing',phase:'combat',templateId:room.id,hud:true,overlay:'',player:{x:280,y:400,visible:true},hudOverlaps:[],marineBounds:body,g6FramingProof:{insets:{left:0,right:0,top:0,bottom:0},viewport:{width:1920,height:1080},marineBounds:body},roomFraming:{heroPixels:100,outside:0,outsideX:0,outsideZ:0,hullOutside:0,smallX:false,smallZ:false,centeredX:false,centeredZ:false},enemies:calm?0:10,stats:{shotsFired:2},playerBullets:2,muzzle:1,l8FixtureProof:{arena:room.arena,cameraOverride:false,minimumSpreadActors:10,actors:Array.from({length:10},(_,i)=>({id:i+1,family:['brute','crawler','spitter','stalker','carrier'][i%5]})),grenadeThrown:true,shotsBefore:0,shotsAfter:1}};}
function capture(){return{directory:'/raw',manifestSHA256:'b'.repeat(64),manifest:{viewport:{width:1920,height:1080},deviceScaleFactor:1,seed:1729,appAssets:{'app.js':'c'.repeat(64)},burstStepMs:150,distSnapshot:{sourceSHA:sha},errors:[],failures:[],shots:[{scenario:'combat-calm',room:room.id,frame:null,file:'calm.png',errors:[],evidence:evidence(true)},...Array.from({length:4},(_,i)=>({scenario:'g6-kiting',room:room.id,frame:i+1,file:'fight-'+i+'.png',errors:[],evidence:evidence()}))]}};}
test('requires complete guarded scenarios and unchanged body/action contracts',()=>{
 assert.equal(selectL8Evidence([capture()],[room],sha).length,2);
 const incomplete=capture();incomplete.manifest.shots.pop();assert.throws(()=>selectL8Evidence([incomplete],[room],sha),/incomplete/);
 const clipped=capture();clipped.manifest.shots[1].evidence.marineBounds={...body,left:-2};clipped.manifest.shots[1].evidence.g6FramingProof.marineBounds=clipped.manifest.shots[1].evidence.marineBounds;assert.throws(()=>selectL8Evidence([clipped],[room],sha),/complete marine body/);
 const action=capture();action.manifest.shots[1].evidence.l8FixtureProof.grenadeThrown=false;assert.throws(()=>selectL8Evidence([action],[room],sha));
});
test('retains failed-parent identity and accepts only a complete clean replacement',()=>{
 const bad=capture();bad.manifest.failures=[{scenario:'g6-kiting',room:room.id,error:'native guard',errors:[]}];bad.manifest.fatalError='native guard';assert.throws(()=>selectL8Evidence([bad],[room],sha),/no complete guarded/);
 const good=capture();good.directory='/replacement';const result=selectL8Evidence([bad,good],[room],sha);assert.equal(result[1].capture.directory,'/replacement');assert.equal(bad.manifest.failures.length,1);
 const foreign=capture();foreign.manifest.appAssets['app.js']='wrong';assert.throws(()=>selectL8Evidence([bad,foreign],[room],sha),/mismatched appAssets/);
});
test('exact-area reviews preserve constant fields and Rec709 code-value grayscale',()=>{
 const image=canvas(1920,1080);image.pixels.fill(80);const small=review480(image);assert.equal(small.width,480);assert.equal(small.height,270);assert(small.pixels.every(n=>n===80));
 const red=canvas(1,1);red.pixels.set([255,0,0]);assert.deepEqual([...grayscale(red).pixels],[54,54,54]);
});

test('arena calm is an explicit supplemental scenario with unchanged marine guards',()=>{
 const raw=capture(),shot=raw.manifest.shots[0];shot.scenario='l8-arena-calm';shot.evidence.player={...shot.evidence.player,...room.arena};shot.evidence.l8ArenaCalmProof={arena:room.arena,nativePresentation:true,presentationTicks:120,preparedShaderCompiles:0,simulationBefore:0,simulationAfter:0,cameraOverride:false};
 assert.equal(selectL8Evidence([raw],[room],sha,{calmScenario:'l8-arena-calm'}).length,2);
 assert.throws(()=>selectL8Evidence([raw],[room],sha),/no complete guarded/);
 shot.evidence.l8ArenaCalmProof.cameraOverride=true;assert.throws(()=>selectL8Evidence([raw],[room],sha,{calmScenario:'l8-arena-calm'}));
});
