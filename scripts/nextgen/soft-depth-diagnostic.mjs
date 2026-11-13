/** Harness-only A/B: suppress detached depth copying while retaining normal allocations. */
export function installNoSoftDepthDiagnostic(r=globalThis.__containmentDebug.renderer){
 const post=r.post,binding=post?.softParticleBinding;
 if(!binding||typeof binding.enabled!=='function'||typeof binding.receive!=='function')throw Error('Prepared soft-particle binding is required');
 if(post.__benchNoSoftDepth)throw Error('Soft-depth diagnostic already installed');
 const original=binding.enabled,disabled=()=>false,copiesBefore=post.diagnostics?.softParticles?.copies;
 if(!Number.isFinite(copiesBefore))throw Error('Soft-depth copy diagnostics are required');
 let disposed=false,restored=false;
 binding.enabled=disabled;binding.receive(null);
 const api={
  snapshot(){const copiesAfter=post.diagnostics?.softParticles?.copies;return {disabled:true,copiesBefore,copiesAfter,copyDelta:copiesAfter-copiesBefore,restored};},
  dispose(){
   if(disposed)return;disposed=true;
   if(post.softParticleBinding===binding&&binding.enabled===disabled){binding.enabled=original;binding.receive(null);restored=true;}
   if(post.__benchNoSoftDepth===api)delete post.__benchNoSoftDepth;
  },
 };
 post.__benchNoSoftDepth=api;
 return api.snapshot();
}
