import type {DepthGame} from '../../DepthGame';
import type {DepthRenderer} from '../../render/DepthRenderer';
import {familyCount} from '../../game/roguelike/builds';
import {conciseStoryStatus} from '../../game/roguelike/storyRooms';
import {ACT_NAMES,runLength} from '../../game/roguelike/run';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {el} from '../shell';

/** Bind the persistent HUD once; refresh only its presentation. */
export function createHud(game:DepthGame,renderer:DepthRenderer,positionHud:()=>void){
const depthTotal=()=>runLength(game.expedition.run.version);
return function hud(){const s=game.combat.snapshot;el('story-hud').hidden=!game.storyRoom||game.status!=='playing';el('story-status').textContent=conciseStoryStatus(game.storyStatus);el('room-objective').textContent=game.storyRoom?.objective??'';el('story-presentation').hidden=!game.storyPresentation;el('story-line').textContent=game.storyPresentation??'';el('health').textContent=String(Math.ceil(s.health));el('armor').textContent=String(Math.ceil(s.armor));el('hp-bar').style.width=`${s.health}%`;el('armor-bar').style.width=`${s.armor/s.maxArmor*100}%`;el('weapon-name').textContent=s.weaponId;el('magazine').textContent=String(s.magazine).padStart(2,'0');el('reserve').textContent=`/ ${Number.isFinite(s.reserve)?s.reserve:'∞'}`;el('reload-label').textContent=s.reloading?'RELOADING':s.magazine===0&&s.reserve===0?'EMPTY · SWITCH WEAPON':'';el('reload-bar').style.width=s.reloading?`${(1-s.reloadRemainingMs/s.reloadDurationMs)*100}%`:'0%';el('depth-label').textContent=`${(game.storyRoom?.environment??ACT_NAMES[Math.min(2,Math.floor(game.node.depth/4))]).toUpperCase()} · ${String(game.node.depth+1).padStart(2,'0')} / ${depthTotal()}`;el('room-name').textContent=ROOM_TEMPLATES[game.node.templateId].name;
 document.querySelectorAll<HTMLElement>('[data-weapon]').forEach(b=>{b.classList.toggle('selected',b.dataset.weapon===s.weaponId);b.setAttribute('aria-pressed',String(b.dataset.weapon===s.weaponId));});const q=game.boss.snapshot;el('boss-hud').hidden=!q.active;el('boss-phase').textContent=`${q.vulnerable?'EXPOSED':q.phase==='nest-spawn'?'NESTS':'ARMORED'} · ${Math.ceil(q.phaseRemainingMs/1000)}s`;el('boss-bar').style.width=`${q.health/q.maxHealth*100}%`;el('boss-hud').classList.toggle('exposed',q.vulnerable);el('build-strip').textContent=['Kinetic','Cryo','Reactor','Recovery'].filter(f=>familyCount(game.expedition.build,f)>0).map(f=>`${f} ${familyCount(game.expedition.build,f)}${familyCount(game.expedition.build,f)>=3?' ◆':''}`).join(' · ');el('credits').textContent=`${s.credits} CR`;el('desktop-stock').textContent=`E ${s.medkits} medkits · G ${s.grenades} grenades`;el('encounter-count').textContent=game.status==='playing'&&game.node.kind!=='boss'?`${game.encounterRemaining} remaining`:'';
 if(game.status==='playing')positionHud();
}
}
