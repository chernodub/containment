/** I11 additive integration diagnostics. Production acceptance scenarios retain their guards. */
export function registerI11Scenarios(scenarios) {
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
