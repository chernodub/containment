/** Renderer-only HUD contract fixtures. Native game actions and legal kiting; never organic balance evidence. */
export function registerG6Scenarios(scenarios,stageGraphicsKiting){
 const insets=`const d=window.__containmentDebug,r=d.renderer;const w=r.viewportWidth,h=r.viewportHeight;r.setHudInsets?.({top:0,right:300*w/1920,bottom:160*h/1080,left:280*w/1920});`;
 scenarios.push({id:'g6-calm',rooms:true,state:'playing',setup:new Function('room',`return (async()=>{${insets}await d.gotoRoom(room);d.invulnerable(true);d.measureLuminance=true;d.step(600);d.refresh();})();`)});
 scenarios.push({id:'g6-kiting',rooms:true,state:'playing',burst:true,setup:new Function('room',`return (async()=>{${insets}await (${stageGraphicsKiting.toString()})(room,{tier:'high'});d.step(650);d.refresh();})();`)});
}
