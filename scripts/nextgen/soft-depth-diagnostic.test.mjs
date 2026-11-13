import {test} from 'vitest';
import assert from 'node:assert/strict';
import {installNoSoftDepthDiagnostic} from './soft-depth-diagnostic.mjs';

function fixture(){
 let copies=4;const received=[],enabled=()=>true,binding={enabled,receive:value=>received.push(value)};
 const post={softParticleBinding:binding,get diagnostics(){return{softParticles:{allocated:true,copies}};}};
 return{post,binding,enabled,received,frame(){if(binding.enabled())copies++;},originalCopies:()=>copies};
}

test('changes only soft-depth enablement, unbinds uniforms, and restores after an A/B trial',()=>{
 const f=fixture(),before=f.post.diagnostics;
 const installed=installNoSoftDepthDiagnostic({post:f.post}),probe=f.post.__benchNoSoftDepth;
 assert.equal(installed.copiesBefore,4);assert.equal(f.binding.enabled(),false);assert.deepEqual(f.received,[null]);
 for(let i=0;i<120;i++)f.frame();
 assert.deepEqual(probe.snapshot(),{disabled:true,copiesBefore:4,copiesAfter:4,copyDelta:0,restored:false});
 assert.equal(f.post.diagnostics.softParticles.allocated,before.softParticles.allocated);
 probe.dispose();probe.dispose();assert.equal(f.binding.enabled,f.enabled);assert.deepEqual(f.received,[null,null]);assert.equal(f.post.__benchNoSoftDepth,undefined);
 assert.equal(probe.snapshot().restored,true);f.frame();assert.equal(f.originalCopies(),5);
});

test('rejects missing preparation and nested installs rather than silently measuring another condition',()=>{
 assert.throws(()=>installNoSoftDepthDiagnostic({post:{}}),/Prepared/);
 const f=fixture();installNoSoftDepthDiagnostic({post:f.post});assert.throws(()=>installNoSoftDepthDiagnostic({post:f.post}),/already installed/);f.post.__benchNoSoftDepth.dispose();
});

test('does not overwrite a replacement binding during cleanup',()=>{
 const f=fixture();installNoSoftDepthDiagnostic({post:f.post});const probe=f.post.__benchNoSoftDepth,replacement={enabled:()=>true,receive(){}};
 f.post.softParticleBinding=replacement;probe.dispose();assert.equal(f.post.softParticleBinding,replacement);assert.equal(replacement.enabled(),true);assert.equal(probe.snapshot().restored,false);
});
