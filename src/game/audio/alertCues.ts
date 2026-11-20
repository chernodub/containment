import type { CueRecipe } from './synthesis';

function alert(id: string, notes: readonly number[], hostile = false, step = .085): CueRecipe {
  return {
    id: `alert:${id}`, family: 'stinger', bus: hostile ? 'enemies' : 'ui',
    duration: notes.length * step + .06, priority: hostile ? 88 : 42,
    interval: .24, rms: hostile ? .10 : .055,
    layers: notes.map((frequency, index) => ({
      wave: hostile ? 'metal' : 'sine', gain: 1, frequency,
      endFrequency: frequency * (hostile ? .83 : 1), attack: .012,
      delay: index * step, duration: step + .045, decay: 3,
    })),
  };
}

export const ALERTS = {
  elite: alert('elite', [420, 420, 620], true),
  warden: alert('warden', [220, 165, 110], true, .14),
  matron: alert('matron', [280, 480, 280], true, .13),
  exposed: alert('exposed', [720, 440, 230], true),
  pod: alert('pod', [960, 660], true),
  hatch: alert('hatch', [290, 490, 760], true),
  critical: alert('critical', [820, 550, 820], true),
  armor: alert('armor', [970, 460], true, .055),
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
  flank: alert('flank', [520, 880], true),
  crossfire: alert('crossfire', [880, 520, 880], true),
  resolved: alert('resolved', [540, 720, 960]),
  pickup: alert('pickup', [880, 1320], false, .052),
};
export type AlertCue = keyof typeof ALERTS;
