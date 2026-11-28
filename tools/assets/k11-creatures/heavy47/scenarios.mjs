/** HEAVY47 capture fixtures. The resting crowd of final26/27 with its heavies
 * promoted: brute 10 elite, brute 14 Warden, carrier 17 Matron. Same seed,
 * floor search and marine position as `final26-crowd-<room>-rest`, so the
 * gallery's hand-labelled visor and leg samples still apply. */
export function registerHeavy47(SCENARIOS) {
  for (const room of ['swarm-junction', 'crew-checkpoint', 'transmission-chamber', 'coolant-plant']) {
    const crowd = SCENARIOS.find(scenario => scenario.id === 'value14-crowd-' + room);
    const spawn = 'const actors=choice.points.map((p,i)=>({id:d.spawn(families[i],p.x,p.y,false),family:families[i]}));';
    const source = crowd.setup.toString();
    if (!source.includes(spawn)) throw Error('HEAVY47: crowd spawn line changed');
    const resting = source.replace('frame<36', 'frame<0').replace(spawn,
      `const actors=choice.points.map((p,i)=>({id:d.spawn(families[i],p.x,p.y,i===10),family:families[i]}));
      for(const [i,kind] of [[14,'warden'],[17,'matron']])if(actors[i].id)g.enemies.promote(actors[i].id,kind);`);
    SCENARIOS.push({...crowd, id: 'heavy47-heavies-' + room + '-rest', room, burst: false, frameCount: 1,
      setup: new Function(`return (${resting})();`)});
  }
}
