/** Title artwork evidence uses production SVG/CSS and the ordinary menu actions. */
export const U6_SCENARIOS = [
  {id:'u6-title-saved-pyro',state:'menu',required:['.title-key-art','#continue'],setup:async()=>{const d=window.__containmentDebug;await d.startRun(undefined,{rigSelect:true});if(!d.game.chooseRig('pyro'))throw Error('Native Pyro choice failed');d.refresh();d.game.menu();d.refresh();if(getComputedStyle(document.querySelector('.title-key-art')).getPropertyValue('--suit-accent')!=='#ff7a2e'||!document.querySelector('#continue').textContent.includes('Pyro'))throw Error('Saved rig summary and suit accent disagree');}},
  {id:'u6-title-controls',state:'menu',required:['.controls-drawer','#close-drawer'],setup:async()=>{const d=window.__containmentDebug;await d.startRun();d.game.menu();d.refresh();document.querySelector('#controls').click();}},
  {id:'u6-title-credits',state:'menu',required:['.credits-drawer','#close-credits'],setup:async()=>{const d=window.__containmentDebug;await d.startRun();d.game.menu();d.refresh();document.querySelector('#menu-credits').click();}},
  {id:'u6-title-reduced',state:'menu',reducedMotion:true,required:['.title-key-art','#start'],setup:async()=>{const d=window.__containmentDebug;await d.startRun();d.game.menu();d.refresh();}},
  {id:'u6-title-reveal',state:'menu',titleArtTimeline:true,burst:true,stepMs:400,required:['.title-key-art','#start'],setup:async()=>{const d=window.__containmentDebug;await d.startRun();d.game.menu();d.refresh();}},
];
