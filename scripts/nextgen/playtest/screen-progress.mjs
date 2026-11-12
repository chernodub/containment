/** Presentation observer only: input choices and simulation stepping stay unchanged. */
export const screenStateKey = snapshot => `${snapshot.node.id}:${snapshot.status}:${snapshot.phase}`;

/** Observe after the native click before accusing its old screen of stalling.
 * Loading still belongs to the runner's existing independent loading deadline. */
export function screenProgressTimedOut(before, after, elapsedMs) {
  return elapsedMs > 10_000 && !after.loading && screenStateKey(before) === screenStateKey(after);
}
