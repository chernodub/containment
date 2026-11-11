import {describe, expect, it} from 'vitest';
import {newEventReceipts} from './evidence.mjs';

const event = (id, at = 1) => ({type: 'hit', targetId: id, damage: 5, at});

describe('bounded event receipt deltas', () => {
  it('returns first receipts without mutating the source arrays', () => {
    const events = [event(1), event(2)];
    expect(newEventReceipts([], events)).toEqual(events);
    expect(newEventReceipts([], events)).not.toBe(events);
    expect(newEventReceipts(events, [])).toEqual([]);
  });

  it('extracts append-only receipts and ignores unchanged snapshots', () => {
    expect(newEventReceipts([event(1)], [event(1), event(2)])).toEqual([event(2)]);
    expect(newEventReceipts([event(1)], [event(1)])).toEqual([]);
  });

  it('retains duplicate equal receipts sharing a timestamp', () => {
    expect(newEventReceipts([event(1), event(1)], [event(1), event(1), event(1)])).toEqual([event(1)]);
    expect(newEventReceipts([event(1)], [event(1), event(1), event(2)])).toEqual([event(1), event(2)]);
  });

  it('uses the longest overlap through ring rollover and repeated patterns', () => {
    expect(newEventReceipts([event(1), event(2), event(1)], [event(2), event(1), event(3)])).toEqual([event(3)]);
    expect(newEventReceipts([event(1), event(2), event(1), event(2)], [event(1), event(2), event(3), event(4)])).toEqual([event(3), event(4)]);
  });

  it('handles a 300-entry ring without confusing timestamps for identities', () => {
    const previous = Array.from({length: 300}, (_, index) => event(index));
    const current = Array.from({length: 300}, (_, index) => event(index + 20));
    expect(newEventReceipts(previous, current)).toEqual(current.slice(-20));
  });

  it('returns the whole current ring when no overlap survives', () => {
    expect(newEventReceipts([event(1, 0)], [event(1, 2), event(2, 2)])).toEqual([event(1, 2), event(2, 2)]);
  });

  it('matches structurally identical receipts regardless of property order', () => {
    expect(newEventReceipts([{type: 'hit', at: 1, ability: {phase: 'tick', slot: 'power'}}],
      [{ability: {slot: 'power', phase: 'tick'}, at: 1, type: 'hit'}, event(3)])).toEqual([event(3)]);
  });
});
