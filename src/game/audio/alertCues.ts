import type { AudioBus, CueRecipe, SynthLayer } from './synthesis';

function alert(id: string, notes: readonly number[], hostile = false, step = .085): CueRecipe {
  return {
    id: `alert:${id}`, family: 'stinger', bus: hostile ? 'danger' : 'ui',
    duration: notes.length * step + .06, priority: hostile ? 88 : 42,
    interval: .24, rms: hostile ? .10 : .055,
    layers: notes.map((frequency, index) => ({
      wave: hostile ? 'metal' : 'sine', gain: 1, frequency,
      endFrequency: frequency * (hostile ? .83 : 1), attack: .012,
      delay: index * step, duration: step + .045, decay: 3,
    })),
  };
}

function signature(id: string, bus: AudioBus, duration: number, layers: readonly SynthLayer[]): CueRecipe {
  return { id: `alert:${id}`, bus, family: 'stinger', duration, layers,
    priority: bus === 'danger' ? 88 : 52, interval: .24, rms: bus === 'danger' ? .13 : .09 };
}

export const ALERTS = {
  elite: {...alert('elite', [420, 420, 620], true), bus: 'enemies'},
  warden: signature('warden', 'enemies', .31, [
    { wave: 'sine', frequency: 125, endFrequency: 58, gain: 1, duration: .11, attack: .005, decay: 5 },
    { wave: 'sine', frequency: 105, endFrequency: 43, gain: 1, delay: .15, duration: .15, attack: .005, decay: 5 },
  ]),
  matron: signature('matron', 'enemies', .29, [
    { wave: 'sine', frequency: 440, endFrequency: 1700, gain: 1, duration: .27, fm: 4, modRate: .29, am: .8, pulse: 23, attack: .009, decay: 1.8 },
  ]),
  charge: alert('charge', [155, 275], true, .065),
  exposed: alert('exposed', [720, 440, 230]),
  pod: alert('pod', [960, 660], true),
  hatch: {...alert('hatch', [290, 490, 760], true), bus: 'enemies'},
  critical: alert('critical', [820, 550, 820], true),
  armor: signature('armor', 'danger', .105, [
    { wave: 'noise', cutoff: 5100, highpass: true, gain: 1, duration: .045, attack: .002, decay: 7 },
    { wave: 'pluck', frequency: 2770, endFrequency: 2310, gain: .85, duration: .10, attack: .002, decay: 6 },
  ]),
  ambush: alert('ambush', [580, 1160], false, .045),
  dark: alert('dark', [320, 145]),
  coolant: alert('coolant', [1200, 980]),
  vent: alert('vent', [420, 590, 420]),
  conduit: alert('conduit', [630, 780, 630]),
  brood: alert('brood', [290, 330, 290]),
  sealed: alert('sealed', [250, 180, 130]),
  slip: alert('slip', [1550, 930], false, .06),
  pressure: alert('pressure', [1050, 1050, 1250], true),
  steam: alert('steam', [860, 530], true),
  arc: alert('arc', [1470, 890, 1470], true, .055),
  release: alert('release', [180, 360, 540]),
  encounter: alert('encounter', [420, 620]),
  flank: {...alert('flank', [520, 880], true), bus: 'enemies'},
  crossfire: {...alert('crossfire', [880, 520, 880], true), bus: 'enemies'},
  resolved: alert('resolved', [540, 720, 960]),
  pickup: alert('pickup', [880, 1320], false, .052),
};
export type AlertCue = keyof typeof ALERTS;
