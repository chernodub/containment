import {describe,it,expect} from 'vitest';
import {L8_BACKEND,L8_POLICY,validateCohort,summarizeCohort,cohortTargets} from '../scripts/nextgen/l8-cohort-summary.mjs';
const rigs=['breacher','cryo','pyro','arc'];
const fixture=(rig)=>({rig,seed:1,policyHash:L8_POLICY,backendProvenance:{backendHash:L8_BACKEND,dirtyBackend:false,sourceHashes:{metrics:'frozen'},workspaceHead:'before'},assisted:false,legacy:false,tuningEnabled:true,gameRef:'source',gameHash:'game',bundleHash:'bundle',navigationVersion:'graphv3',outcome:'complete',stats:{damageDealt:{weapon:60,ability:30,status:5,boon:5},overdrivesUsed:1},rooms:[{id:'awakening-bay',nodeId:rig,depth:0,nodeKind:'combat',guardian:null,holdout:false,result:'clear',seconds:35,damageTaken:0,startHealth:100,startArmor:100,abilityUses:{dash:1,tactical:2,power:1,overdrive:1},overdrives:1},{id:'transmission-chamber',nodeId:rig+'tx',depth:9,nodeKind:'combat',guardian:null,holdout:true,result:'clear',seconds:65,damageTaken:10,startHealth:90,startArmor:0,abilityUses:{dash:1,tactical:2,power:1,overdrive:1},overdrives:1}]});
describe('L8 fixed cohort provenance and honest outcomes',()=>{
 it('requires exact declared pairs and one unmodified source/backend/policy',()=>{
  const rs=rigs.map(fixture);expect(validateCohort(rs,{seeds:[1],source:'source'}).gameHash).toBe('game');
  for(const mutate of [r=>r.policyHash='changed',r=>r.backendProvenance.backendHash='instrumented',r=>r.l8Diagnostic={acceptance:false},r=>r.tuningEnabled=false,r=>r.bundleHash='other',r=>r.gameRef='working-tree',r=>r.backendProvenance.sourceHashes.metrics='other',r=>r.seed=2]){
   const bad=structuredClone(rs);mutate(bad[0]);expect(()=>validateCohort(bad,{seeds:[1],source:'source'})).toThrow();
  }
  expect(()=>validateCohort([...rs,rs[0]],{seeds:[1],source:'source'})).toThrow();
 });
 it('retains errors and censors in the denominator instead of hiding them',()=>{
  const rs=rigs.map(fixture);rs[0].outcome='error';rs[1].outcome='censored';rs[2].outcome='dead';rs[2].deathRoom=12;
  const s=summarizeCohort(rs);expect(s.attempts).toBe(4);expect(s.completionPct).toBe(25);expect(s.outcomes).toEqual({error:1,censored:1,dead:1,complete:1});expect(cohortTargets(s).naturalTerminalsOnly).toBe(false);
 });
 it('reports each rig median and the I5 distance from pooled separately from the rig range',()=>{
  const rs=rigs.map(fixture);rs[0].outcome='dead';rs[0].deathRoom=20;
  const s=summarizeCohort(rs);expect(s.completionPct).toBe(75);expect(s.maxRigDistancePp).toBe(75);expect(s.rigRangePp).toBe(100);expect(s.byRig.breacher.roomsPerOverdrive).toBe(2);expect(s.byRig.cryo.transmissionSeconds).toBe(65);
  expect(s.strictOrdinarySeconds).toBe(35);expect(s.broadNonholdoutSeconds).toBe(35);expect(s.byDepth[9].entryHealthDebt).toBe(10);
 });
});
