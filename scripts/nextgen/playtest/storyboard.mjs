import assert from 'node:assert/strict';

/** Select distinct native observations spanning entry, the real fight and a clear. */
export function selectStoryboardFrames(frames, count = 12) {
  assert(Number.isInteger(count) && count >= 3, 'Storyboard needs at least three frames');
  assert(Array.isArray(frames), 'Storyboard observations are required');
  const entry = frames.find(frame => frame.beat === 'entry');
  assert(entry, 'Missing real room entry observation');
  const clear = frames.find(frame => ['clear', 'complete'].includes(frame.beat)
    && frame.nodeId === entry.nodeId && frame.elapsed > entry.elapsed);
  assert(clear, 'Missing real room clear observation');
  assert(entry.status === 'playing', 'Entry must be native playing state');
  assert(['reward', 'complete'].includes(clear.status), 'Clear must be native reward/completion state');
  assert(Number.isFinite(entry.elapsed) && Number.isFinite(clear.elapsed), 'Finite native clocks required');
  const candidates = frames.filter(frame => frame.beat === 'fight'
    && frame.nodeId === entry.nodeId && frame.status === 'playing'
    && Number.isFinite(frame.elapsed) && frame.elapsed > entry.elapsed && frame.elapsed < clear.elapsed)
    .toSorted((a, b) => a.elapsed - b.elapsed);
  assert(candidates.length >= count - 2, `Only ${candidates.length} real fight observations; need ${count - 2}`);
  assert(new Set(candidates.map(frame => frame.file)).size === candidates.length, 'Duplicate fight filenames');
  assert(new Set(candidates.map(frame => frame.elapsed)).size === candidates.length, 'Duplicate fight clocks');
  assert(candidates.some(frame => frame.remaining > 0), 'No live fight population recorded');
  assert(candidates.some(frame => frame.shooting), 'No native firing observation recorded');

  const selected = [entry];
  let previous = -1;
  for (let index = 0; index < count - 2; index++) {
    const target = entry.elapsed + (clear.elapsed - entry.elapsed) * (index + 1) / (count - 1);
    const last = candidates.length - (count - 2 - index);
    let best = previous + 1;
    for (let candidate = best + 1; candidate <= last; candidate++) {
      if (Math.abs(candidates[candidate].elapsed - target) < Math.abs(candidates[best].elapsed - target)) best = candidate;
    }
    selected.push(candidates[best]);
    previous = best;
  }
  selected.push(clear);
  assert(selected.every((frame, index) => !index || frame.elapsed > selected[index - 1].elapsed), 'Storyboard clocks must increase');
  assert(new Set(selected.map(frame => frame.file)).size === count, 'Storyboard cannot repeat an observation');
  return selected;
}

/** Copy a complete RGB/RGBA observation cell exactly, without floating resampling. */
export function blitStoryboardFrame(target, source, x, y) {
  assert(Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0
    && x + source.width <= target.width && y + source.height <= target.height, 'Storyboard cell bounds');
  for (let row = 0; row < source.height; row++) for (let column = 0; column < source.width; column++) {
    const from = (row * source.width + column) * source.channels;
    const to = ((y + row) * target.width + x + column) * 3;
    for (let channel = 0; channel < 3; channel++) target.pixels[to + channel] = source.pixels[from + channel];
  }
}
