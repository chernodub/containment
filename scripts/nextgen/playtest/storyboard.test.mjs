import {describe, expect, it} from 'vitest';
import {selectStoryboardFrames} from './storyboard.mjs';

function observations(length = 25) {
  return Array.from({length}, (_, index) => ({
    beat: index === 0 ? 'entry' : index === length - 1 ? 'clear' : 'fight',
    file: `${index}.png`, nodeId: 'real-room', room: 'awakening-bay', elapsed: 100 + index,
    status: index === length - 1 ? 'reward' : 'playing', remaining: length - index,
    shooting: index > 0 && index < length - 1,
  }));
}

describe('native campaign storyboard selection', () => {
  it('keeps entry and clear, selects ten ordered distinct native fight clocks, and leaves sources unchanged', () => {
    const frames = observations(), original = structuredClone(frames);
    const selected = selectStoryboardFrames(frames);
    expect(selected).toHaveLength(12);
    expect(selected[0]).toBe(frames[0]);
    expect(selected.at(-1)).toBe(frames.at(-1));
    expect(selected.every((frame, index) => !index || frame.elapsed > selected[index - 1].elapsed)).toBe(true);
    expect(new Set(selected.map(frame => frame.file)).size).toBe(12);
    expect(frames).toEqual(original);
    expect(selected.slice(1, -1).map(frame => frame.elapsed)).toEqual([102, 104, 107, 109, 111, 113, 115, 117, 120, 122]);
  });

  it('uses enough real observations rather than repeating short fights', () => {
    expect(() => selectStoryboardFrames(observations(11))).toThrow('real fight observations');
    expect(() => selectStoryboardFrames(observations(12))).not.toThrow();
  });

  it('rejects death, a clear from another room, duplicate clocks and missing native fire', () => {
    const dead = observations(); dead.at(-1).beat = 'dead'; dead.at(-1).status = 'dead';
    expect(() => selectStoryboardFrames(dead)).toThrow('real room clear');
    const other = observations(); other.at(-1).nodeId = 'different-room';
    expect(() => selectStoryboardFrames(other)).toThrow('real room clear');
    const duplicate = observations(); duplicate[2].elapsed = duplicate[1].elapsed;
    expect(() => selectStoryboardFrames(duplicate)).toThrow('Duplicate fight clocks');
    expect(() => selectStoryboardFrames(observations().map(frame => ({...frame, shooting:false})))).toThrow('native firing');
  });
});
