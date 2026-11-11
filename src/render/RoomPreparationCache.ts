import type * as T from 'three';
import type { RunNode } from '../game/roguelike/types';

type Pending = { cancel: () => void };

/** Owns a bounded set of detached CPU room roots until the renderer takes them. */
export class RoomPreparationCache {
  private readonly roots = new Map<RunNode['templateId'], T.Group | null>();
  private readonly pending = new Map<RunNode['templateId'], Pending>();
  private readonly capacity: number;
  private disposed = false;

  constructor(
    private readonly factory: (node: RunNode) => T.Group | null,
    private readonly disposeRoot: (root: T.Group) => void,
    capacity = 2,
  ) {
    this.capacity = Number.isFinite(capacity) ? Math.max(0, Math.floor(capacity)) : 0;
  }

  /** Schedule at most two future templates, without touching renderer or GPU state. */
  prepareAhead(nodes: readonly RunNode[]): void {
    if (this.disposed || this.capacity === 0) return;
    const requested = new Set<RunNode['templateId']>();
    const limit = Math.min(2, this.capacity);
    for (const node of nodes) {
      const key = node.templateId;
      if (requested.has(key)) continue;
      if (requested.size === limit) break;
      requested.add(key);
      if (this.roots.has(key)) {
        const root = this.roots.get(key)!;
        this.roots.delete(key);
        this.roots.set(key, root);
        continue;
      }
      if (this.pending.has(key) || this.pending.size >= limit) continue;
      const task: Pending = { cancel: () => {} };
      this.pending.set(key, task);
      const run = () => {
        if (this.disposed || this.pending.get(key) !== task) return;
        this.pending.delete(key);
        let root: T.Group | null;
        // Optional speculation must not prevent the normal room load from retrying.
        try { root = this.factory(node); } catch { return; }
        if (this.disposed) { if (root) this.disposeRoot(root); return; }
        this.roots.set(key, root);
        while (this.roots.size > this.capacity) {
          const oldest = this.roots.keys().next().value!;
          const evicted = this.roots.get(oldest);
          this.roots.delete(oldest);
          if (evicted) this.disposeRoot(evicted);
        }
      };
      if (typeof globalThis.requestIdleCallback === 'function') {
        const handle = globalThis.requestIdleCallback(run, { timeout: 500 });
        task.cancel = () => globalThis.cancelIdleCallback?.(handle);
      } else {
        const handle = globalThis.setTimeout(run, 0);
        task.cancel = () => globalThis.clearTimeout(handle);
      }
    }
  }

  /** Transfer a prepared result to its caller; undefined is a cache miss, null is cached. */
  take(node: RunNode): T.Group | null | undefined {
    const key = node.templateId;
    const task = this.pending.get(key);
    if (task) { this.pending.delete(key); task.cancel(); }
    const root = this.roots.get(key);
    this.roots.delete(key);
    return root;
  }

  /** Stop scheduled work while preserving roots already prepared for another route. */
  clearPending(): void {
    const tasks = [...this.pending.values()];
    this.pending.clear();
    for (const task of tasks) task.cancel();
  }

  /** Cancel speculation and release every root whose ownership has not transferred. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clearPending();
    for (const root of this.roots.values()) if (root) this.disposeRoot(root);
    this.roots.clear();
  }
}
