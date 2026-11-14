/** Shared explosion art inspections, with explicit native-payload replays.
 * These isolate presentation at one legal mark; no kill, damage or action is fabricated.
 */
export const V7_EXPLOSION_ORIGINS = Object.freeze([
  { origin: 'weapon', source: 'ElementalRuntime Combustion weapon-hit boon', event: { type: 'boon', boon: 'combustion', radius: 85 } },
  { origin: 'grenade', source: 'DepthGame grenade blast with a burning target in splash reach', event: { type: 'explosion', radius: 120, elements: ['fire'] } },
  { origin: 'rocket', source: 'DepthGame rocket blast with a burning target in splash reach', event: { type: 'explosion', radius: 132, elements: ['fire'] } },
  { origin: 'nest', source: 'DepthGame nest-destroyed event (native payload has no fire element)', event: { type: 'explosion', radius: 64 } },
  { origin: 'queen', source: 'DepthGame queen-defeated event (native payload has no fire element)', event: { type: 'explosion', radius: 240 } },
]);

/** Self-contained browser setup; safe to replay against a frozen pre-V7 distribution. */
export async function stageV7Explosion({ origin, source, event, room, samples, materialReview=false }) {
  const d = window.__containmentDebug, g = d.game, r = d.renderer;
  await d.gotoRoom(room, { rig: 'breacher', ...(room==='reactor-vault'?{version:2}:{}) }); d.invulnerable(true); g.enemies.reset();
  const b = g.geometry.bounds;
  let marine = null, marineScore = -Infinity;
  // Choose the native marine mark first. The blast is selected only after the
  // real camera settles; room-space clearance alone says nothing about framing.
  for (let y = b.y + 150; y < b.y + b.height - 150; y += 40) {
    for (let x = b.x + 150; x < b.x + b.width - 150; x += 40) {
      if (!d.canStand(x, y, 32)) continue;
      const boss=g.boss?.snapshot;if(boss?.active&&Math.hypot(x-boss.x,y-boss.y)<340)continue;
      const rank = -Math.hypot(x - (b.x + b.width * .20), y - (b.y + b.height / 2));
      if (rank > marineScore) { marineScore = rank; marine = { x, y }; }
    }
  }
  if (!marine) throw Error('No legal V7 shared explosion inspection mark');
  Object.assign(g.player, { ...marine, angle: 0, vx: 0, vy: 0 });
  d.setInput({ x: 0, y: 0, fire: false, angle: 0, autoAim: false });
  d.step(3800); g.enemies.reset(); d.refresh();
  const canvas = r.canvas.getBoundingClientRect(), insets = r.hudInsets ?? {};
  const safe = { left: canvas.left + (insets.left ?? 0) + 24,
    right: canvas.right - (insets.right ?? 0) - 24,
    top: canvas.top + (insets.top ?? 0) + 24,
    bottom: canvas.bottom - (insets.bottom ?? 0) - 24 };
  const panels = [];
  for (const node of document.querySelectorAll('#action-bar,.vitals,#status-hud,#radar-hud,#boss-hud')) {
    if (node.hidden) continue;
    const box = node.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) panels.push({ left: box.left - 12, right: box.right + 12,
      top: box.top - 12, bottom: box.bottom + 12 });
  }
  const point = r.camera.position.clone();
  function support(x, y) {
    const bounds = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
    let points = 0, depthValid = true;
    const basis = r.camera.matrixWorld.elements;
    const add = (wx, wy, wz) => {
      point.set(wx, wy, wz).project(r.camera); points++;
      depthValid &&= point.z >= -1 && point.z <= 1;
      const px = canvas.left + (point.x + 1) * canvas.width / 2;
      const py = canvas.top + (1 - point.y) * canvas.height / 2;
      bounds.left = Math.min(bounds.left, px); bounds.right = Math.max(bounds.right, px);
      bounds.top = Math.min(bounds.top, py); bounds.bottom = Math.max(bounds.bottom, py);
    };
    const cx = x / 32, cz = y / 32;
    // A circumscribed 64-gon encloses the complete largest native Queen pulse,
    // including extrema between vertices, rather than checking its center only.
    const radius = (240 / 32) / Math.cos(Math.PI / 64);
    for (let i = 0; i < 64; i++) {
      const a = i * Math.PI / 32;
      add(cx + Math.cos(a) * radius, .10, cz + Math.sin(a) * radius);
    }
    const pulseBounds={...bounds};
    const pulseInside=pulseBounds.left>=safe.left&&pulseBounds.right<=safe.right&&pulseBounds.top>=safe.top&&pulseBounds.bottom<=safe.bottom&&!panels.some(panel=>pulseBounds.right>panel.left&&pulseBounds.left<panel.right&&pulseBounds.bottom>panel.top&&pulseBounds.top<panel.bottom);
    // The additional material-review fixture guarantees complete fire alpha-card
    // support for the fire body. The strict full-pulse fixture above is unchanged and remains
    // independently callable; clipped Queen rings stay explicit diagnostics.
    if(materialReview){bounds.left=bounds.top=Infinity;bounds.right=bounds.bottom=-Infinity;}
    // The largest native fire card grows to 6.25m wide; include its full camera-
    // facing corners at both start/end heights. Source radii are never reduced.
    for (const height of [1.9, 2.31]) for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      add(cx + basis[0] * sx * 3.125 + basis[4] * sy * 3.125,
        height + basis[1] * sx * 3.125 + basis[5] * sy * 3.125,
        cz + basis[2] * sx * 3.125 + basis[6] * sy * 3.125);
    }
    const fireBounds={...bounds};
    // Smoke's bounded native drift (<=2.6m) and rotated 4.025m cards fit this
    // conservative envelope. This includes their full alpha-card support.
    const smokeRadius = 2.85 / Math.cos(Math.PI / 16);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const height of [.1, 2.6]) {
      for (let i = 0; i < 16; i++) {
        const a = i * Math.PI / 8, right = Math.cos(a) * smokeRadius, up = Math.sin(a) * smokeRadius;
        add(cx + sx * 2.6 + basis[0] * right + basis[4] * up,
          height + basis[1] * right + basis[5] * up,
          cz + sz * 2.6 + basis[2] * right + basis[6] * up);
      }
    }
    const smokeBounds={...bounds};
    const smokeInside=smokeBounds.left>=safe.left&&smokeBounds.right<=safe.right&&smokeBounds.top>=safe.top&&smokeBounds.bottom<=safe.bottom;
    if(materialReview)Object.assign(bounds,fireBounds);
    const overlapsHud = panels.some(panel => bounds.right > panel.left && bounds.left < panel.right && bounds.bottom > panel.top && bounds.top < panel.bottom);
    const inside = depthValid && !overlapsHud && bounds.left >= safe.left && bounds.right <= safe.right && bounds.top >= safe.top && bounds.bottom <= safe.bottom;
    return { bounds, pulseBounds, pulseInside, smokeBounds, smokeInside, materialReview, inside, depthValid, overlapsHud, points, nativeQueenRadius: 240,
      fireCardWidthMetres: 6.25, smokeDriftMetres: 2.6, smokeCardDiagonalMetres: 5.7 };
  }
  const nativeContacts=[];
  let best = null, score = -Infinity;
  function chooseTarget(){
  // Derive legal floor candidates from the actual settled camera. Prefer a
  // central readable target near the marine, with a clear 52-unit hot core.
  for (let py = safe.top + 32; py < safe.bottom - 32; py += 24) {
    for (let px = safe.left + 32; px < safe.right - 32; px += 24) {
      const floor = r.pointer(px, py);
      if (!floor || !d.canStand(floor.x, floor.y, 52)) continue;
      const boss=g.boss?.snapshot;if(boss?.active&&Math.hypot(floor.x-boss.x,floor.y-boss.y)<160)continue;
      const distance = Math.hypot(floor.x - g.player.x, floor.y - g.player.y);
      if (distance < 80 || distance > 360 || !d.clearShot(floor.x, floor.y, g.player)) continue;
      const projected = support(floor.x, floor.y);
      if (!projected.inside) continue;
      const margin = Math.min(projected.bounds.left - safe.left, safe.right - projected.bounds.right,
        projected.bounds.top - safe.top, safe.bottom - projected.bounds.bottom);
      const rank = margin * 4 - Math.abs(distance - 140) * .15 - Math.hypot(px - canvas.left - canvas.width * .5, py - canvas.top - canvas.height * .48) * .05;
      if (rank > score) { score = rank; best = { x: g.player.x, y: g.player.y,
        tx: floor.x, ty: floor.y, angle: Math.atan2(floor.y - g.player.y, floor.x - g.player.x),
        distance, screen: { x: px, y: py }, support: projected }; }
    }
  }
  }
  chooseTarget();
  // Native nearby threats may widen the production combat frame. This is real
  // fixture population, with unchanged actors/AI/camera and no zoom override.
  if(!best&&typeof d.spawn==='function'){
    for(const distance of [300,420,240])for(let i=0;i<16&&nativeContacts.length<4;i++){
      const a=i*Math.PI/8,x=g.player.x+Math.cos(a)*distance,y=g.player.y+Math.sin(a)*distance;
      if(!d.canStand(x,y,28))continue;
      const id=d.spawn('brute',x,y,false);if(id!==false)nativeContacts.push({id,x,y});
    }
    if(nativeContacts.length){d.step(500);d.refresh();chooseTarget();}
  }
  if (!best) throw Error('No legal V7 explosion mark with complete projected Queen/fire/smoke support inside the HUD-safe viewport: '+JSON.stringify({marine,camera:r.camera.matrixWorld.toArray(),projection:r.camera.projectionMatrix.toArray(),safe,panels,nativeContacts}));
  const supportTrace = [];
  function assertSupport(sampleMs) {
    const projected = support(best.tx, best.ty);
    if (!projected.inside) throw Error('V7 explosion support clipped at ' + sampleMs + 'ms: ' + JSON.stringify(projected));
    supportTrace.push({ sampleMs, ...projected });
  }
  const warning = { type: 'enemy-warning', x: best.tx - Math.sin(best.angle) * 75,
    y: best.ty + Math.cos(best.angle) * 75, radius: 34, durationMs: 2500 };
  const proof = d.g4DangerProof = {
    presentationOnly: true, nativeAction: false, kind: 'shared-explosion-payload-replay',
    origin, source, room, mark: best, event: { ...event, x: best.tx, y: best.ty },
    warning, samples, sampleMs: 0, shaderGuard: true, programs: 0,
    framing: { scope:materialReview?'complete fire alpha card; full Queen pulse and conservative smoke envelope retained as separate clipping diagnostics':'complete Queen pulse and fire/smoke support', nativeContacts, safeViewport: safe, measuredHudPanels: panels, supportTrace, cameraOverride: false, coreClearance: 52, note: 'Full pulse/fire/smoke-card support; ejected sparks/debris are separate tiny ballistic tails.' },
    qualification: 'Native payload replay at a common legal mark; this does not simulate its originating action, kill or damage. Native grenade action remains covered by combat-heavy.',
  };
  const gl = r.renderer.getContext();
  gl.createProgram = function () { proof.programs++; throw Error('V7 shared explosion compiled a combat shader'); };
  window.__captureSeed?.(1729);proof.effectSeed=1729;
  r.effect(warning); r.effect(proof.event); d.refresh(); assertSupport(0);
  const original = d.step; let sample = 0, elapsed = 0;
  // Capture's standard 150ms requests map onto explicit impact/body/smoke clocks.
  d.step = ms => {
    if (ms !== 150) return original(ms);
    const target = samples[Math.min(++sample, samples.length - 1)];
    original(Math.max(0, target - elapsed)); elapsed = target;
    proof.sampleMs = target; d.shaderCompilations = proof.programs; assertSupport(target);
    if (proof.programs) throw Error('V7 shared explosion shader guard failed');
  };
  d.shaderCompilations = 0;
}

/** Add exactly five origin inspections without changing existing capture scenarios. */
export function registerV7ExplosionScenarios(scenarios) {
  for (const entry of V7_EXPLOSION_ORIGINS) {
    const id = `v7-explosion-${entry.origin}`;
    if (scenarios.some(s => s.id === id)) continue;
    const room = 'containment-annulus';
    scenarios.push({ id, room, state: 'playing', burst: true, stepMs: 150,
      setupArgument: { ...entry, room, samples: [0, 30, 90, 180, 340, 600, 1000] },
      setup: stageV7Explosion });
  }
}

/** Additional material-only inspections; original full-pulse assertions remain intact. */
export function registerV7ExplosionMaterialScenarios(scenarios){
  for(const entry of V7_EXPLOSION_ORIGINS){
    const id=`v7-material-explosion-${entry.origin}`;if(scenarios.some(s=>s.id===id))continue;
    const room='containment-annulus';
    scenarios.push({id,room,state:'playing',burst:true,stepMs:150,
      setupArgument:{...entry,room,samples:[0,30,90,180,340,500,600],materialReview:true},setup:stageV7Explosion});
  }
}
