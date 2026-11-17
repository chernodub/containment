/** Texture review only: existing deterministic combat fixtures with native weapon selection. */
export function registerT12Scenarios(scenarios){
 for(const weapon of ['pistol','rifle','shotgun','plasma','rocket'])for(const mood of ['calm','heavy']){
  const base=scenarios.find(s=>s.id===`combat-${mood}`);
  scenarios.push({...base,id:`t12-${mood}-${weapon}`,diagnosticOnly:true,textureWeapon:weapon,setup:new Function('room',`return(async()=>{const d=window.__containmentDebug;await d.gotoRoom(room,{rig:'breacher'});d.game.switchWeapon('${weapon}');d.invulnerable(true);d.refresh();})();`)});
 }
 for(const family of ['crawler','stalker','spitter','brute','carrier']){
  const base=scenarios.find(s=>s.id===`k11-crowd-${family}`);
  scenarios.push({...base,id:`t12-heavy-${family}`,burst:true,setup:new Function('room',`return(async()=>{await (${base.setup.toString()})(room);const d=window.__containmentDebug,g=d.game;g.switchWeapon('plasma');g.grenade();d.setInput({x:0,y:0,fire:true,angle:null,autoAim:true});d.step(450);d.refresh();})();`)});
 }
}
