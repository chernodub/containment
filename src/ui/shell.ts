export const app=document.getElementById('app')!;
const icon=(name:string)=>({pause:'Ⅱ',reload:'↻',heal:'+',grenade:'◈',fire:'⊕'}[name]??name);
export function mountShell(){app.innerHTML=`<canvas id="world" aria-label="Containment 3D game world"></canvas><div id="shade"></div><div id="hurt-flash"></div>
<div id="hud" hidden><div class="hud-top"><div class="vitals"><div class="vital-line"><span class="health-icon">+</span><b id="health">100</b><div class="meter"><i id="hp-bar"></i></div></div><div class="armor-line"><span>ARMOR</span><div class="meter armor"><i id="armor-bar"></i></div><b id="armor">50</b></div></div></div>

<div id="boss-hud" hidden><div><span>THE QUEEN</span><span id="boss-phase"></span></div><div class="meter"><i id="boss-bar"></i></div></div>
<div id="status-hud"><div class="room-heading"><div class="room-label"><span id="depth-label"></span><b id="room-name"></b></div><button id="pause" class="icon-button" aria-label="Pause game">${icon('pause')}</button></div><div id="build-strip"></div><div id="run-stock"><span id="credits"></span><span id="desktop-stock"></span><span id="encounter-count"></span></div><aside id="story-hud" hidden><p id="story-status" role="status"></p><p id="room-objective"></p><div id="story-presentation"><span id="story-line"></span><button id="skip-story" aria-label="Skip dialogue">Skip</button></div></aside></div><div class="weapon-hud"><span id="weapon-name"></span><div><b id="magazine"></b><span id="reserve"></span></div><div class="reload-line"><i id="reload-bar"></i></div><small id="reload-label"></small></div>
<div id="weapon-picker" aria-label="Weapons">${(['pistol','rifle','shotgun','plasma','rocket'] as const).map((id,i)=>`<button data-weapon="${id}" aria-label="Equip ${id}"><small>${i+1}</small><span>${id}</span></button>`).join('')}</div>
<div class="desktop-hint">WASD <span>MOVE</span> &nbsp; R <span>RELOAD</span> &nbsp; G <span>GRENADE</span> &nbsp; E <span>HEAL</span></div></div>
<div id="room-loading" role="status" aria-live="polite" hidden><b>Preparing room…</b><span>Combat is on hold.</span></div><div id="overlay"></div><div id="signature">CONTAINMENT <span>/</span> DEPTH</div>`;
}
export const el=(id:string)=>document.getElementById(id)!;
