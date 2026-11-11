import {it, expect} from 'vitest';
import {balanceSummary} from './balance-summary.mjs';

const run = (seed, outcome, assisted = false) => ({rig:'arc',seed,head:'fixture',assisted,outcome,
  stats:{overdrivesUsed:2,damageDealt:{weapon:60,ability:20,status:10,boon:10}},
  rooms:[{depth:8,result:'clear',seconds:30,damageTaken:10,overdrives:1},
    {depth:9,result:outcome === 'dead' ? 'dead' : 'clear',seconds:70,damageTaken:50,overdrives:1}],
});
it('retains deaths and censored attempts in completion while separating assistance and pooling actual room samples', () => {
  const [assisted, organic] = balanceSummary([run(1,'complete'),run(2,'dead'),run(3,'error'),run(4,'complete',true)]).groups;
  expect(assisted.runs).toBe(1);
  expect(organic.seeds).toEqual([1,2,3]);
  expect(organic.completion).toBeCloseTo(1/3);
  expect(organic.outcomes).toEqual({complete:1,dead:1,error:1});
  expect(organic.deaths).toEqual({10:1});
  expect(organic.byDepth[9].seconds.n).toBe(2);
  expect(organic.byDepth[9].damageTaken.n).toBe(3);
  expect(organic.byDepth[9].damageTaken.median).toBe(50);
  expect(organic.damageShare).toEqual({weapon:.6,ability:.2,status:.1,boon:.1});
});
it('supports native reports with final.stats and preserves their source seed/head provenance', () => {
  const report = run(2718,'complete');
  report.final={stats:report.stats};delete report.stats;
  const [group] = balanceSummary([report]).groups;
  expect(group.seeds).toEqual([2718]);expect(group.heads).toEqual(['fixture']);
  expect(group.roomsPerOverdrive.median).toBe(1);
  expect(group.transmissionSeconds.median).toBe(70);
  expect(group.byAct[1].damageTaken.median).toBe(30);
});
it('keeps default-off production, explicit tuning and historical cohorts separate', () => {
  const reports = [run(1,'complete'), {...run(2,'dead'),tuningEnabled:false}, {...run(3,'complete'),tuningEnabled:true}, {...run(4,'complete'),tuningEnabled:false,profileTransition:{from:true,to:false}}];
  const groups = balanceSummary(reports).groups;
  expect(groups.map(g => g.key)).toEqual(['organic:v3:arc','organic:v3:arc:mixed-profile','organic:v3:arc:production','organic:v3:arc:tuning']);
  expect(groups.map(g => g.seeds)).toEqual([[1],[4],[2],[3]]);
  expect(groups.map(g => g.completion)).toEqual([1,1,0,1]);
});

it.each(['policyHash', 'gameHash', 'bundleHash', 'policyVersion'])('rejects mixed known %s inside a cohort, including across rigs', field => {
  expect(() => balanceSummary([{...run(1,'complete'),[field]:'one'}, {...run(2,'complete'),rig:'pyro',[field]:'two'}]))
    .toThrow(new RegExp(`mixes known ${field}`));
});

it('rejects native/Node pooling and changed native policy source snapshots', () => {
  expect(() => balanceSummary([{...run(1,'complete'),mode:'sim-policy-v5'}, {...run(2,'complete'),clock:'native fixed 60Hz'}]))
    .toThrow(/mixes known backends/);
  expect(() => balanceSummary([{...run(1,'complete'),harnessHashes:{'ability-aim.ts':'one'}}, {...run(2,'complete'),harnessHashes:{'ability-aim.ts':'two'}}]))
    .toThrow(/mixes known policy source ability-aim.ts/);
});

it('keeps explicit comparison cohorts labeled and exposes source identities without changing historical single-cohort keys', () => {
  const reports = [{...run(1,'complete'),summaryCohort:'before',mode:'sim-policy-v5',policyHash:'policy',gameHash:'old',bundleHash:'a'},
    {...run(2,'dead'),summaryCohort:'after',mode:'sim-policy-v5',policyHash:'policy',gameHash:'new',bundleHash:'b'}];
  const summary = balanceSummary(reports);
  expect(summary.cohorts.map(c => c.label)).toEqual(['after','before']);
  expect(summary.groups.map(g => [g.key,g.cohort,g.sources.gameHashes])).toEqual([
    ['organic:v3:arc@after','after',['new']], ['organic:v3:arc@before','before',['old']],
  ]);
  expect(summary.groups[0].sources.backends).toEqual(['simulation']);
  expect(summary.groups[0].sources.policyHashes).toEqual(['policy']);
  expect(balanceSummary([run(3,'complete')]).groups[0].key).toBe('organic:v3:arc');
});

it('preserves unknown historical provenance and pacing without certifying an ordinary-room cap', () => {
  const [group] = balanceSummary([run(1,'complete')]).groups;
  expect(group.sources.unknownBackendReports).toBe(1);
  expect(group.sources.unknownGameHashReports).toBe(1);
  expect(group.ordinarySeconds).toEqual(group.nonHoldoutSeconds);
  expect(group.ordinarySecondsDefinition).toMatch(/Historical/);
  expect(group.ordinaryCap).toMatchObject({unknownAttempts:1,passed:null});
});

it('counts strict ordinary violations on death attempts while keeping elites, guardians and holdouts separate', () => {
  const report = run(1,'dead');
  report.rooms = [
    {depth:5,nodeKind:'elite',guardian:'warden',holdout:false,result:'clear',seconds:90,overdrives:2},
    {depth:8,nodeKind:'combat',guardian:'warden',holdout:false,result:'clear',seconds:60,overdrives:2},
    {depth:9,nodeKind:'combat',guardian:null,holdout:true,result:'clear',seconds:70,overdrives:2},
    {depth:10,nodeKind:'combat',guardian:null,holdout:false,result:'clear',seconds:30,overdrives:1},
    {depth:11,nodeKind:'combat',guardian:null,holdout:false,result:'dead',seconds:40,overdrives:2},
  ];
  const [group] = balanceSummary([report]).groups;
  expect(group.ordinarySeconds).toMatchObject({n:1,median:30});
  expect(group.nonHoldoutSeconds).toMatchObject({n:3,median:60});
  expect(group.transmissionSeconds).toMatchObject({n:1,median:70});
  expect(group.ordinaryRoomsWithMultipleOverdrives).toBe(1);
  expect(group.nonHoldoutRoomsWithMultipleOverdrives).toBe(3);
  expect(group.ordinaryCap).toMatchObject({ordinaryAttempts:2,unknownAttempts:0,passed:false,
    violations:[{seed:1,room:12,uses:2,result:'dead'}]});
});

it('does not silently classify historical portions of a metadata-bearing continuation', () => {
  const report = run(1,'complete');
  report.rooms[0].overdrives=2;
  report.rooms.push({depth:10,nodeKind:'combat',guardian:null,holdout:false,result:'clear',seconds:35,overdrives:1});
  const [group] = balanceSummary([report]).groups;
  expect(group.ordinaryRoomsWithMultipleOverdrives).toBe(0);
  expect(group.ordinaryCap).toMatchObject({ordinaryAttempts:1,unknownAttempts:1,passed:null});
  expect(group.ordinaryCap.unclassifiedViolations).toEqual([{seed:1,room:9,uses:2,result:'clear'}]);
  expect(group.nonHoldoutRoomsWithMultipleOverdrives).toBe(1);
});

it('has no legacy holdouts and keeps Queen pacing separate from metadata-classified ordinary combat', () => {
  const report = {...run(1,'complete'),legacy:true,rooms:[
    {depth:9,nodeKind:'combat',guardian:null,holdout:false,result:'clear',seconds:30,overdrives:2},
    {depth:11,nodeKind:'boss',guardian:null,holdout:false,result:'complete',seconds:90,overdrives:3},
  ]};
  const [group] = balanceSummary([report]).groups;
  expect(group.transmissionSeconds.n).toBe(0);
  expect(group.nonHoldoutSeconds).toMatchObject({n:2,median:60});
  expect(group.ordinarySeconds).toMatchObject({n:1,median:30});
  expect(group.ordinaryCap.violations).toEqual([{seed:1,room:10,nodeId:undefined,uses:2,result:'clear'}]);
  expect(group.byDepth).toHaveLength(12);
});

it('can certify the cap only when every attempt is authoritatively classified', () => {
  const report={...run(1,'complete'),rooms:[{depth:3,nodeKind:'combat',guardian:null,holdout:false,result:'clear',seconds:30,overdrives:1}]};
  expect(balanceSummary([report]).groups[0].ordinaryCap).toMatchObject({ordinaryAttempts:1,unknownAttempts:0,passed:true});
  report.rooms[0].nodeKind='elite';
  expect(balanceSummary([report]).groups[0].ordinaryCap).toMatchObject({ordinaryAttempts:0,unknownAttempts:0,passed:null});
});
