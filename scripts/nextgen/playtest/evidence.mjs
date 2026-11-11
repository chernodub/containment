function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

/**
 * Recover new receipts from overlapping reads of the bounded debug event ring.
 * Match suffix(previous) to prefix(current), preserving repeated equal events.
 * An entirely replaced ring of identical receipts cannot be distinguished from
 * an unchanged ring without monotonic source sequence IDs.
 */
export function newEventReceipts(previous, current) {
  if (!current?.length) return [];
  if (!previous?.length) return current.slice();
  const key = event => JSON.stringify(canonical(event));
  // KMP prefix lengths find the longest overlap in linear time. The sentinel
  // cannot equal a serialized event, so matches cannot cross the array boundary.
  const sequence = [...current.map(key), Symbol('event-boundary'), ...previous.map(key)];
  const prefix = new Uint32Array(sequence.length);
  for (let index = 1; index < sequence.length; index++) {
    let length = prefix[index - 1];
    while (length && sequence[index] !== sequence[length]) length = prefix[length - 1];
    if (sequence[index] === sequence[length]) length++;
    prefix[index] = length;
  }
  return current.slice(prefix.at(-1));
}
