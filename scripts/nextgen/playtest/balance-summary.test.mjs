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
