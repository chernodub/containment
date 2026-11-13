/** Additional Queen-arena saved-floor evidence; never reclassifies it as canonical kiting. */
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const calmScenario=scenario=>['x2-calm-motion-high','g2-calm-high','i10-arena-calm-motion','i10-arena-calm','i10-queen-calm-motion','i10-queen-calm'].includes(scenario);
const queenScenario=scenario=>scenario==='boss'||scenario==='g2-queen-exposed';
const validSamples=row=>!!row&&[row.deck,row.hero].every(sample=>sample?.stats?.n>0&&['p5','median','p95'].every(key=>finite(sample.stats[key])));

/** Keep actual filenames, phases, clocks and saved PNG sample statistics visible. */
export function summarizeArenaFloor(raw,room='reactor-vault'){
  const rows=raw.filter(row=>row.room===room);
  const nativeCalm02=rows.find(row=>row.state==='playing'&&calmScenario(row.scenario)&&row.frame===2)??null;
  const arrivalCalm=rows.find(row=>row.state==='playing'&&row.scenario==='combat-calm'&&row.frame===null)??null;
  const combat02=rows.find(row=>row.state==='playing'&&row.scenario==='boss'&&row.frame===2)??null;
  const exposure02=rows.find(row=>row.state==='playing'&&row.scenario==='g2-queen-exposed'&&row.frame===2)??null;
  const measuredCombat02=validSamples(combat02)?combat02:null;
  const measuredExposure02=validSamples(exposure02)&&['vulnerable','exposed'].includes(exposure02.queenPhase)?exposure02:null;
  const failures=[];
  if(!nativeCalm02)failures.push({role:'native calm frame02',room,reason:'missing native four-phase calm fixture frame02; an unframed arrival is not substituted'});
  else if(!validSamples(nativeCalm02))failures.push({role:'native calm frame02',room,file:nativeCalm02.file,reason:'native calm frame02 has no valid saved deck/hero floor samples'});
  if(!measuredCombat02&&!measuredExposure02)failures.push({role:'actual Queen combat or exposure frame02',room,reason:'missing valid saved Queen firing-combat or authoritative exposed-phase floor samples; no canonical kiting equivalence is inferred'});
  const queenFrames=rows.filter(row=>row.state==='playing'&&queenScenario(row.scenario));
  const bandRows=rows.filter(row=>row.state==='playing'&&(calmScenario(row.scenario)||row.scenario==='combat-calm'||queenScenario(row.scenario))&&validSamples(row)).map(row=>({
    file:row.file,sha256:row.sha256,room,scenario:row.scenario,frame:row.frame,queenPhase:row.queenPhase,
    simulationMs:row.simulationMs,presentationMs:row.presentationMs,surfaceMask:row.surfaceMask,
    deck:row.deck.stats,hero:row.hero.stats,
    medianInBand:row.deck.stats.median>=50&&row.deck.stats.median<=80,
    shadowInNominalBand:row.deck.stats.p5>=12&&row.deck.stats.p5<=28,
  }));
  return{
    room,canonicalCampaignRoom:false,canonicalKitingEquivalent:false,
    method:'Additional arena outside the canonical twenty-room campaign table. Use the same saved PNG Rec.709 sRGB code-value sampling and source hashes, without exposure normalization. Native calm frame02 is separate from an unframed arrival fallback. Queen firing-combat and exposure keep their actual scenario, authoritative phase and clock; they are never relabeled as four-phase combat-kiting. Every captured arena row and every sampled actual Queen combat/exposure phase remain available, including unmeasured frames.',
    tableRows:[
      {role:'Quiet arrival frame02 (native calm)',row:nativeCalm02,validSavedSamples:validSamples(nativeCalm02)},
      {role:'Arrival0ms (unframed; supplemental)',row:arrivalCalm,validSavedSamples:validSamples(arrivalCalm)},
      {role:'Firing boss frame02 (native inputs)',row:combat02,validSavedSamples:validSamples(combat02)},
      {role:'Exposure frame02 (native Queen phase)',row:exposure02,validSavedSamples:!!measuredExposure02},
    ],
    allCapturedRows:rows,actualQueenFrames:queenFrames,
    unmeasuredQueenFrames:queenFrames.filter(row=>!validSamples(row)),
    bandAssessment:{method:'Additional arena frames only; same nominal median50–80 / approximate shadow-p5 12–28 bands. These counts remain separate from the canonical twenty-room cohort.',rows:bandRows,medianExcursions:bandRows.filter(row=>!row.medianInBand),shadowExcursions:bandRows.filter(row=>!row.shadowInNominalBand)},
    failures,evidenceComplete:failures.length===0,
  };
}
