/** I11 additive integration diagnostics. Production acceptance scenarios retain their guards. */
export function registerI11Scenarios(scenarios) {
  for (const guard of [false,true]) scenarios.push({
    id:guard?'i11-legacy-acid-boundary':'i11-legacy-acid-probe',
    room:'reactor-vault',state:'playing',burst:true,diagnosticOnly:!guard,i11NativePointer:true,
    setupArgument:{guard},setup:async ({guard})=>{
      const d=window.__containmentDebug,g=d.game,r=d.renderer;
      await d.gotoRoom('reactor-vault',{version:2,rig:'cryo'});
      d.invulnerable(true);d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});
      const gl=r.renderer.getContext(),create=gl.createProgram;let programs=0;
      gl.createProgram=function(){programs++;if(guard)throw Error('I11 legacy native pool combat shader compile');return create.call(gl);};
      for(let n=0;n<600&&!g.pools.length;n++)d.step(50);
      if(!g.pools.length)throw Error('Native legacy Queen did not create an acid pool');
      const pool=g.pools[0],point=r.camera.position.clone().set(pool.x/32,0,pool.y/32).project(r.camera);
      d.i11NativePointer={x:(point.x+1)*innerWidth/2,y:(1-point.y)*innerHeight/2};
      d.g4DangerProof={presentationOnly:true,legacySavesOnly:true,nativeQueenPool:true,
        previewAbility:'glacier',previewTarget:{x:pool.x,y:pool.y},
        nativePools:g.pools.map(p=>({...p})),postReadyPrograms:programs,shaderGuard:guard};
      d.refresh();
    },
  });
  for (const rig of ['meltdown', 'overclock', 'whiteout', 'railbreaker']) {
    const base = scenarios.find(s => s.id === `v7-state-${rig}-containment-annulus`);
    const source = base.setup.toString().replace(
      "gl.createProgram=function(){throw Error('V7 state combat shader compile');};",
      `const nativeCreate = gl.createProgram, nativeDraw = r.renderer.renderBufferDirect;
      const compiles = []; let drawing = null;
      r.renderer.renderBufferDirect = function(camera, scene, geometry, material, object, group) {
        drawing = {object:object.name, type:object.type, material:material.name, materialType:material.type,
          defines:material.defines, skin:object.isSkinnedMesh, bones:object.skeleton?.bones.length,
          cacheKey:material.customProgramCacheKey?.(), transparent:material.transparent};
        try { return nativeDraw.call(this, camera, scene, geometry, material, object, group); }
        finally { drawing = null; }
      };
      gl.createProgram = function() { compiles.push({...drawing, at:g.elapsed}); return nativeCreate.call(gl); };
      d.i11CompileProbe = compiles;`,
    ).replace("fixture:'v7-state'", "fixture:'i11-compile-diagnostic',shaderGuard:false,compiles:d.i11CompileProbe");
    scenarios.push({...base, id:`i11-compile-probe-${rig}`, diagnosticOnly:true,
      setup:new Function('arg', `return (${source})(arg);`)});
  }
}
