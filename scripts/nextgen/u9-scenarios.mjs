/** U9 uses native checkpoint boundaries; it never edits story or room state. */
export const U9_SCENARIOS = [
  {id:'u9-combat',state:'playing',rooms:true,required:['#room-objective','#encounter-count'],setup:async room=>{
    const d=window.__containmentDebug;
    await d.gotoRoom(room,{rig:'breacher'});
    d.grantBoons(['breacher','heavy-pellets','chain-reaction','cryogenic']);d.refresh();
    const panel=document.querySelector('#status-hud');
    if(panel.dataset.expanded!=='false')throw Error('Combat narrative expanded');
    if(!document.querySelector('#story-presentation').hidden)throw Error('Combat narrative visible');
    const r=panel.getBoundingClientRect();
    if(r.width*r.height>innerWidth*innerHeight*.1)throw Error('Combat column exceeds 10 percent');
  }},
  {id:'u9-clear',state:'reward',rooms:true,phase:'reward',required:['.room-record','#skip-clear-record'],setup:async room=>{await window.__containmentDebug.gotoRoom(room,{phase:'reward'});}},
  {id:'u9-pause-records',state:'paused',room:'diagnostic-gallery',required:['.room-record-archive'],setup:async()=>{
    const d=window.__containmentDebug;await d.gotoRoom('diagnostic-gallery');d.game.skipStory();d.game.pause();d.refresh();
  }},
];

U9_SCENARIOS.push({id:'u9-silhouette-sheet',state:'reward',uiState:'rig-select',required:['#u9-silhouette-sheet'],setup:async()=>{
  const d=window.__containmentDebug;await d.startRun(undefined,{rigSelect:true});
  for(let i=0;i<900&&!document.querySelector('[data-rig=breacher]');i++)await new Promise(requestAnimationFrame);
  const portraits=[];
  for(const rig of ['breacher','cryo','pyro','arc']) {
    document.querySelector(`[data-rig=${rig}]`).click();
    const portrait=document.querySelector('.rig-portrait').cloneNode(true);
    portrait.querySelector('g[stroke-linejoin]')?.classList.add('rig-portrait-marine');
    portrait.setAttribute('style',`--element:${{breacher:'#ffb454',cryo:'#7fd6ff',pyro:'#ff7a2e',arc:'#b79cff'}[rig]}`);
    portraits.push(portrait.outerHTML);
  }
  document.querySelector('#overlay').innerHTML=`<section id="u9-silhouette-sheet"><h2>U9 / FOUR EQUIPMENT SILHOUETTES</h2><p>Original production SVG portraits · same scale · black masks omit glow, ink and vapor only.</p><div class="u9-portrait-row">${portraits.join('')}</div><div class="u9-portrait-row u9-black">${portraits.join('')}</div></section>`;
  const style=document.createElement('style');style.textContent=`#u9-silhouette-sheet{width:100%;padding:36px;background:#e1e4e5;color:#101820;box-sizing:border-box}#u9-silhouette-sheet h2{color:#101820}#u9-silhouette-sheet p{color:#23333e}.u9-portrait-row{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.u9-portrait-row .rig-portrait{width:100%;max-width:none;background:#1c2c36}.u9-portrait-row svg{width:100%;height:auto}.u9-black .rig-portrait{background:#fff;border-color:#fff}.u9-black svg{filter:none!important}.u9-black .rig-portrait-marine{filter:none!important}.u9-black svg>path,.u9-black svg>g:not(.rig-portrait-marine){display:none}.u9-black .rig-portrait-marine *{fill:#000!important;stroke:none!important;animation:none!important;filter:none!important}.u9-black .rig-portrait-marine :is(.rig-shield-field,.rig-coolant-vapor,.rig-energy,.rig-arc,.rig-edge,.rig-ink,.rig-visor-ink,.rig-coils){display:none!important}.u9-black .rig-portrait-marine :is(.rig-hose,.rig-antenna,.rig-coil-frames path){fill:none!important;stroke:#000!important;stroke-width:9px!important}.u9-black figcaption{color:#111!important;background:#fff;border:0}.u9-black figcaption span{color:#111!important}`;document.head.append(style);
}});

U9_SCENARIOS.push({id:'u9-results-build',state:'dead',required:['.result-details[open]','.debrief-build .set-chip','.debrief-build .effect-chip'],setup:async()=>{
  const d=window.__containmentDebug;await d.gotoRoom('armory',{rig:'cryo'});d.grantBoons(['cryogenic','permafrost','spreading-nova','twin-glacier','reserve-thruster','drive-dynamo']);d.game.hurt(100000);d.refresh();
  for(let i=0;i<900&&!document.querySelector('.result-details');i++)await new Promise(requestAnimationFrame);
  document.querySelector('.result-details').open=true;
}});

U9_SCENARIOS.push({id:'u9-combat-settled',state:'playing',rooms:true,required:['#room-objective'],setup:async room=>{
  const d=window.__containmentDebug;await d.gotoRoom(room,{rig:'breacher'});d.grantBoons(['breacher','heavy-pellets','chain-reaction','cryogenic']);d.invulnerable(true);d.setInput({fire:true,angle:null,autoAim:true});d.step(2500);d.setInput({fire:false});d.refresh();
}});
U9_SCENARIOS.push({id:'u9-before-clear',diagnosticOnly:true,state:'reward',rooms:true,phase:'reward',required:['#overlay .panel'],setup:async room=>{await window.__containmentDebug.gotoRoom(room,{phase:'reward'});}});
U9_SCENARIOS.push({id:'u9-before-pause',diagnosticOnly:true,state:'paused',room:'diagnostic-gallery',required:['.pause-panel'],setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('diagnostic-gallery');d.game.pause();d.refresh();}});
