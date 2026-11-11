import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const CHECKPOINT_KEY = 'containment-depth:run:v1';

/** Observe real source lifecycle without changing audio scheduling or gain. */
export async function installAudioSpy(context) {
  await context.addInitScript(() => {
    if (window.__containmentPlaytestAudio) return;
    const spy = window.__containmentPlaytestAudio = {
      contexts: [], recent: [], active: new Map(), created: 0,
      starts: 0, stops: 0, ended: 0, loopsStarted: 0, loopsStopped: 0,
    };
    const Native = window.AudioContext;
    if (!Native) return;
    const Instrumented = class extends Native {
      constructor(...args) {
        super(...args);
        const entry = {id: spy.contexts.length, context: this};
        spy.contexts.push(entry);
        for (const method of ['createBufferSource', 'createOscillator']) {
          const create = this[method].bind(this);
          this[method] = (...values) => {
            const node = create(...values), id = ++spy.created;
            const start = node.start.bind(node), stop = node.stop.bind(node);
            let record;
            node.start = (...times) => {
              const result = start(...times);
              record = {
                id, context: entry.id, kind: method, loop: node.loop === true,
                at: this.currentTime, scheduledAt: times[0] ?? this.currentTime,
                duration: times[2] ?? node.buffer?.duration ?? null,
                stops: [], endedAt: null,
              };
              spy.starts++;
              if (record.loop) spy.loopsStarted++;
              spy.active.set(id, record);
              spy.recent.push(record);
              if (spy.recent.length > 2000) spy.recent.shift();
              return result;
            };
            node.stop = (...times) => {
              const result = stop(...times);
              spy.stops++;
              if (record) {
                if (record.loop && record.stops.length === 0) spy.loopsStopped++;
                record.stops.push(times[0] ?? this.currentTime);
              }
              return result;
            };
            node.addEventListener('ended', () => {
              if (record) record.endedAt = this.currentTime;
              spy.ended++;
              spy.active.delete(id);
            }, {once: true});
            return node;
          };
        }
      }
    };
    window.AudioContext = Instrumented;
    if (window.webkitAudioContext === Native) window.webkitAudioContext = Instrumented;
  });
}

/** Return bounded serializable receipts, including loops still active at sample time. */
export async function readAudioSpy(page) {
  return page.evaluate(() => {
    const spy = window.__containmentPlaytestAudio;
    if (!spy) return null;
    const contexts = spy.contexts.map(({id, context}) => ({
      id, state: context.state, currentTime: context.currentTime,
    }));
    const active = [...spy.active.values()].filter(record => {
      const clock = contexts[record.context]?.currentTime ?? 0;
      // Web Audio permits replacing a previously scheduled stop with a later one.
      return record.endedAt === null && !(record.stops.length && record.stops.at(-1) <= clock);
    });
    return {
      contexts, created: spy.created, starts: spy.starts, stops: spy.stops,
      ended: spy.ended, loopsStarted: spy.loopsStarted, loopsStopped: spy.loopsStopped,
      activeSources: active.length, activeLoops: active.filter(record => record.loop),
      recent: spy.recent.slice(-200),
    };
  });
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

/** Check Continue against the stored boundary; combat intentionally rolls back to it. */
export function compareCheckpoint(expected, actual) {
  if (!expected) return {passed: !actual.canContinue, differences: actual.canContinue ? ['unexpected Continue without checkpoint'] : []};
  const differences = [];
  for (const field of ['run', 'build', 'resources']) {
    if (JSON.stringify(canonical(expected[field])) !== JSON.stringify(canonical(actual[field]))) differences.push(field);
  }
  if (expected.abilities && (!Number.isFinite(actual.overdriveCharge)
    || Math.abs(expected.abilities.overdriveCharge - actual.overdriveCharge) > 1e-9)) differences.push('overdriveCharge');
  if (expected.stats && JSON.stringify(canonical(expected.stats)) !== JSON.stringify(canonical(actual.stats))) differences.push('stats');
  const expectedStatus = expected.run.phase === 'route' ? 'route' : 'reward';
  if (actual.status !== expectedStatus) differences.push('status');
  return {passed: differences.length === 0, differences};
}

/** Read only authoritative state and persistence for a checkpoint interruption receipt. */
export async function readCheckpointState(page) {
  return page.evaluate(key => {
    const game = window.__containmentDebug.game;
    let checkpoint = null, checkpointError = null;
    try {
      const raw = localStorage.getItem(key);
      checkpoint = raw ? JSON.parse(raw) : null;
    } catch (error) { checkpointError = String(error); }
    return {
      status: game.status, uiState: document.body.dataset.state,
      run: game.expedition.run, build: game.expedition.build,
      resources: game.combat.getRunResources(), stats: game.stats,
      overdriveCharge: game.abilities.snapshot.overdrive.charge,
      canContinue: game.canContinue, checkpointStatus: game.checkpointStatus,
      checkpoint, checkpointError, room: game.node.templateId,
    };
  }, CHECKPOINT_KEY);
}

/** Kill the page, reopen in its context, and press real Continue without staging a save. */
export async function checkpointProbe(page, {label = 'checkpoint', evidenceDir, onPage}) {
  const context = page.context(), url = page.url();
  const name = label.replace(/[^a-zA-Z0-9_-]/g, '-');
  await mkdir(evidenceDir, {recursive: true});
  // Settle already requested assets so a navigation-aborted asset is not mislabeled a game defect.
  await page.waitForFunction(() => document.querySelector('#world')?.getAttribute('aria-busy') !== 'true');
  await page.waitForLoadState('networkidle');
  const before = await readCheckpointState(page);
  const beforeAudio = await readAudioSpy(page);
  await page.screenshot({path: join(evidenceDir, `${name}-before.png`)});
  await page.close({runBeforeUnload: false});
  const nextPage = await context.newPage();
  let after = null, comparison = null, error = null;
  try {
    // Install listeners before navigation: startup and Continue failures are evidence too.
    await onPage?.(nextPage);
    await nextPage.goto(url);
    await nextPage.waitForFunction(() => !!window.__containmentDebug && document.body.dataset.state === 'menu');
    const button = nextPage.locator('#continue');
    const hasContinue = await button.count() > 0 && await button.isVisible();
    if (before.checkpoint && hasContinue) {
      await button.click();
      await nextPage.waitForFunction(() => document.body.dataset.state !== 'menu'
        && document.querySelector('#world')?.getAttribute('aria-busy') !== 'true');
      after = await readCheckpointState(nextPage);
      comparison = compareCheckpoint(before.checkpoint, after);
    } else {
      after = await readCheckpointState(nextPage);
      comparison = {
        passed: !before.checkpoint && !hasContinue,
        differences: before.checkpoint ? ['saved checkpoint has no Continue action']
          : hasContinue ? ['unexpected Continue without checkpoint'] : [],
      };
    }
  } catch (failure) { error = String(failure); }
  const result = {
    label, url, before, after, comparison, error,
    passed: !error && comparison?.passed === true,
    beforeAudio, afterAudio: await readAudioSpy(nextPage).catch(() => null),
    expectedRollback: before.run.phase === 'combat',
  };
  await nextPage.screenshot({path: join(evidenceDir, `${name}-after.png`)}).catch(() => {});
  await writeFile(join(evidenceDir, `${name}.json`), JSON.stringify(result, null, 2));
  return {page: nextPage, ...result};
}
