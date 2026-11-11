/** Additive V3 evidence keeps the original V2 fixture and its failure history intact. */
import { V2_SCENARIOS } from './v2-scenarios.mjs';

const recovery = V2_SCENARIOS.find(scenario => scenario.id === 'v2-recovery');
if (!recovery) throw Error('V2 recovery resource proof is required');

export const V3_SCENARIOS = [{
  ...recovery,
  id: 'v3-recovery',
  // The inherited resource cycle calls game.resume directly, leaving the integrated
  // recovery acknowledgement open. Exercise the existing UI controls as G1 does.
  setup: new Function(`return (async () => {
    await (${recovery.setup.toString()})();
    const d = window.__containmentDebug;
    async function readyControl(selector) {
      for (let i = 0; i < 900; i++) {
        await new Promise(requestAnimationFrame); d.refresh();
        const control = document.querySelector(selector);
        if (control && !control.disabled) return control;
      }
      throw Error('Recovery control did not settle: ' + selector);
    }
    d.game.pause(); d.refresh();
    const acknowledge = await readyControl('#graphics-continue');
    acknowledge.click();
    const resume = await readyControl('#resume');
    resume.click(); d.refresh();
    if (d.game.status !== 'playing' || d.renderer.renderer.getContext().isContextLost())
      throw Error('Acknowledged recovery did not restore play');
    d.recoveryProof.acknowledgedThroughControls = true;
  })();`),
}];
