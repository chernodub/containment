import {describe, expect, it} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {CHECKPOINT_STORAGE_KEY, parseCheckpoint} from '../src/game/roguelike/checkpoints';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';

/** Initial menu choices are real checkpoints, while combat still preserves its boundary. */
describe('integration initial-choice persistence', () => {
  it.each(['breacher', 'cryo', 'pyro', 'arc'] as const)('restores rig selection then the %s starting draft without advancing choices', rig => {
    const values = new Map<string,string>();
    const storage = {getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);},removeItem:(key:string)=>{values.delete(key);}};
    const original = new DepthGame(()=>{},storage);
    original.newRun(1729,{rigSelect:true});
    expect(parseCheckpoint(values.get(CHECKPOINT_STORAGE_KEY))?.run.phase).toBe('rig-select');
    const selected = new DepthGame(()=>{},storage);
    expect(selected.continueRun()).toBe(true);
    expect(selected.expedition.run.phase).toBe('rig-select');
    expect(expeditionRewardOffers(selected.expedition)).toEqual([]);
    expect(selected.chooseRig(rig)).toBe(true);
    const encoded = values.get(CHECKPOINT_STORAGE_KEY)!;
    expect(parseCheckpoint(encoded)?.run.phase).toBe('starting-boon');
    const restored = new DepthGame(()=>{},storage);
    expect(restored.continueRun()).toBe(true);
    expect(restored.expedition.build.rig).toBe(rig);
    expect(restored.abilities.snapshot.rig).toBe(rig);
    expect(expeditionRewardOffers(restored.expedition)).toEqual(expeditionRewardOffers(selected.expedition));
    const draft = values.get(CHECKPOINT_STORAGE_KEY)!;
    expect(parseCheckpoint(draft)?.run.draftRoll??0).toBe(0);
    restored.chooseMutation(expeditionRewardOffers(restored.expedition)[0].id);
    expect(restored.status).toBe('playing');
    expect(values.get(CHECKPOINT_STORAGE_KEY)).toBe(draft);
  });
});
