import {AUGMENT_BOONS} from '../game/abilities/augmentCatalog';
import type {MutationDefinition} from '../game/roguelike/mutationCatalog';
import type {MutationId} from '../game/roguelike/types';
import {WORLD_UNITS_PER_METRE} from './units';

type MetricKind = 'number' | 'percent' | 'seconds' | 'distance';
type Metric = Readonly<{label: string; source: RegExp; kind: MetricKind; prefix: string}>;
type Benefit = Readonly<{headline: string; metrics: readonly Metric[]; fallback?: string}>;
const metric = (label: string, source: RegExp, kind: MetricKind = 'number', prefix = ''): Metric => ({label, source, kind, prefix});
const benefit = (headline: string, metrics: readonly Metric[], fallback?: string): Benefit => ({headline, metrics, fallback});

/** Authored benefit language; every displayed number is extracted from catalog prose. */
export const BOON_BENEFITS: Readonly<Record<MutationId, Benefit>> = {
  'siege-plow': benefit(AUGMENT_BOONS['siege-plow'].whatChanges!, [], 'Behaviour transformation'),
  'fault-line': benefit(AUGMENT_BOONS['fault-line'].whatChanges!, [], 'Behaviour transformation'),
  'shard-harvest': benefit(AUGMENT_BOONS['shard-harvest'].whatChanges!, [], 'Behaviour transformation'),
  'ice-road': benefit(AUGMENT_BOONS['ice-road'].whatChanges!, [], 'Behaviour transformation'),
  'ember-relay': benefit(AUGMENT_BOONS['ember-relay'].whatChanges!, [], 'Behaviour transformation'),
  'meltdown-core': benefit(AUGMENT_BOONS['meltdown-core'].whatChanges!, [], 'Behaviour transformation'),
  'pilgrim-pylon': benefit(AUGMENT_BOONS['pilgrim-pylon'].whatChanges!, [], 'Behaviour transformation'),
  'live-wire': benefit(AUGMENT_BOONS['live-wire'].whatChanges!, [], 'Behaviour transformation'),
  breacher: benefit('Shotgun launches turn walls into weapons', [metric('slam damage', /up to (\d+) extra damage/, 'number', '+')]),
  'heavy-pellets': benefit('Hit harder and launch farther', [metric('shotgun damage', /damage \+(\d+)%/, 'percent', '+'), metric('launch force', /by (\d+)%/, 'percent', '+')]),
  'chain-reaction': benefit('Launched enemies send the crowd flying', [metric('launch chains', /chain (three) times/)]),
  'volatile-remains': benefit('Every kill blasts nearby enemies', [metric('blast damage', /for (\d+) damage/), metric('targets', /up to (six)/)]),
  cryogenic: benefit('Every hit slows the approaching crowd', [metric('max slow', /up to (\d+)%/, 'percent'), metric('duration', /for (\d+) seconds/, 'seconds')]),
  shattershot: benefit('Turn stacked chill into a shattering blast', [metric('direct damage', /for (\d+) direct/), metric('area damage', /and (\d+) area/)]),
  scavenger: benefit('Burning kills spread fire through crowds', [metric('nearby targets', /to (three) nearby/)]),
  'blood-price': benefit('Trade protection for harder weapon hits', [metric('weapon damage', /damage \+(\d+)%/, 'percent', '+'), metric('damage taken', /damage \+(\d+)%\./, 'percent', '+')]),
  'hot-reload': benefit('Reload to empower your next shot', [metric('next-shot damage', /for (\d+)% extra/, 'percent', '+')]),
  'last-shell': benefit('Make the last shotgun shell count', [metric('last-shell damage', /\+(\d+)%/, 'percent', '+')]),
  'magnetic-feed': benefit('Switch weapons to empower your next shot', [metric('next-shot damage', /\+(\d+)%/, 'percent', '+')]),
  'field-medic': benefit('Heal more and keep the surplus as armor', [metric('bonus healing', /up to (\d+)%/, 'percent', '+'), metric('max bonus armor', /capped at (\d+)/)]),
  'piercing-rounds': benefit('Piercing shots reach the enemy behind', [metric('pierced target', /pierce (one) additional/, 'number', '+')]),
  'pressure-point': benefit('Sustained hits break enemy defenses', [metric('damage', /deals (\d+) extra/, 'number', '+'), metric('hits per trigger', /Every (fifth) hit/)]),
  'seismic-impact': benefit('Wall slams send shockwaves into crowds', [metric('shockwave damage', /a (\d+)-damage/), metric('targets', /to (four) targets/)]),
  permafrost: benefit('Longer chill gives you time to shatter', [metric('chill duration', /lasts (\d+(?:\.\d+)?) seconds/, 'seconds')]),
  'cold-snap': benefit('Reload to chill the nearest threats', [metric('nearby targets', /the (three) closest/)]),
  'frost-armor': benefit('Chilled kills repair your armor', [metric('armor per kill', /restores (\d+) armor/, 'number', '+')]),
  'arc-filament': benefit('Sustained hits arc into another enemy', [metric('arc damage', /for (\d+) damage/), metric('hits per arc', /Every (fourth) hit/)]),
  'conductive-shell': benefit('Stronger arcs leap into more enemies', [metric('targets', /hit (two) targets/), metric('arc damage', /deal (\d+)% more/, 'percent', '+')]),
  incendiary: benefit('Every hit sets enemies burning', [metric('burn damage', /for (\d+) damage/), metric('duration', /over (\d+(?:\.\d+)?) seconds/, 'seconds')]),
  'rapid-cycle': benefit('Fire and reload faster', [metric('fire & reload speed', /reload (\d+)% faster/, 'percent', '+')]),
  'leech-rounds': benefit('Direct kills keep you in the fight', [metric('health', /restores (\d+) health/, 'number', '+'), metric('kills per heal', /Every (fourth) direct kill/)]),
  'emergency-plating': benefit('Emergency armor buys one more chance', [metric('armor', /grants (\d+) armor/, 'number', '+'), metric('health threshold', /below (\d+) health/)]),
  'ricochet-rounds': benefit('Shots ricochet into a nearby enemy', [metric('ricochet damage', /for (\d+) damage/), metric('between ricochets', /Once per (second)/, 'seconds')]),
  'concussion-rounds': benefit('Every shot pushes the crowd away', [metric('shoves per second', /(twice) per second/)]),
  executioner: benefit('Finish weakened enemies with harder hits', [metric('damage', /deal (\d+) extra/, 'number', '+'), metric('health threshold', /below (\d+)%/, 'percent')]),
  'first-impact': benefit('Open every fight with a stronger hit', [metric('first-hit damage', /deals (\d+) extra/, 'number', '+')]),
  crossfire: benefit('Switch weapons to punish the same target', [metric('damage', /deals (\d+) extra/, 'number', '+'), metric('cooldown', /(\d+(?:\.\d+)?)-second cooldown/, 'seconds')]),
  fragmentation: benefit('Direct kills scatter damaging fragments', [metric('fragment damage', /for (\d+) damage/), metric('targets', /to (three) nearby/)]),
  'absolute-zero': benefit('Stacked chill freezes enemies solid', [metric('chill stacks', /Reaching (three) chill/), metric('damage', /deals (\d+) damage/)]),
  'ice-lance': benefit('Chilled hits lance into a second enemy', [metric('targets in sequence', /a (second) nearby/), metric('between lances', /Once per (second)/, 'seconds')]),
  frostbite: benefit('Fully chilled enemies keep taking damage', [metric('damage per tick', /take (\d+) damage/), metric('between ticks', /every (half)-second/, 'seconds')]),
  'thermal-shock': benefit('Burning and chilled enemies erupt', [metric('blast damage', /a (\d+)-damage/)]),
  'glacial-wake': benefit('Chilled kills leave slowing frost', [metric('max frost patches', /(Four) patches maximum/)]),
  'cryo-conductor': benefit('Arcs punish chilled enemies and spread cold', [metric('arc damage', /deal (\d+) extra/, 'number', '+')]),
  'caustic-rounds': benefit('Every hit poisons enemies', [metric('poison damage', /for (\d+) damage/), metric('duration', /over (three) seconds/, 'seconds')]),
  'toxic-bloom': benefit('Poisoned kills spread poison nearby', [metric('nearby targets', /(Three) nearby targets/)]),
  combustion: benefit('Hit burning enemies to detonate their fire', [metric('blast damage', /a (\d+)-damage/), metric('cooldown', /(\d+(?:\.\d+)?)-second cooldown/, 'seconds')]),
  'ball-lightning': benefit('Arcs leave delayed lightning charges', [metric('arcs per charge', /Every (third) arc/), metric('delay', /after (half) a second/, 'seconds')]),
  aftershock: benefit('Hits plant delayed explosive charges', [metric('between charges', /Once per (second)/, 'seconds')]),
  'reactor-cascade': benefit('Empowered kills unleash a discharge', [metric('discharge damage', /a (\d+)-damage/)]),
  'siphon-shells': benefit('Hits on afflicted enemies repair armor', [metric('armor per hit', /restores (\d+) armor/, 'number', '+'), metric('armor per room', /Up to (\d+) armor/)]),
  'combat-medic': benefit('Every reload restores a little health', [metric('health per reload', /restores (\d+) health/, 'number', '+'), metric('health per room', /up to (\d+) each/)]),
  'reactive-barrier': benefit('Surviving a hit blasts nearby enemies', [metric('blast damage', /for (\d+) damage/), metric('cooldown', /(Three)-second cooldown/, 'seconds')]),
  'salvage-engine': benefit('Secondary kills replenish grenades', [metric('kills per grenade', /Every (sixth) secondary/), metric('grenades per room', /to (two) grenades/)]),
  'blood-capacitor': benefit('Healing empowers your next hit', [metric('next-hit damage', /for (\d+) extra/, 'number', '+')]),
  'shock-absorber': benefit('Broken armor freezes nearby threats', [metric('frozen threats', /the (three) nearest/), metric('cooldown', /(Six)-second cooldown/, 'seconds')]),
  'reserve-thruster': benefit('Keep an extra dash ready', [metric('dash charge', /Store (one) additional/, 'number', '+'), metric('total charges', /for (three) charges/)]),
  'tactical-salvage': benefit('Kills bring your tactical ability back', [metric('cooldown per kill', /refunds (\d+(?:\.\d+)?) seconds/, 'seconds', '−')]),
  'drive-dynamo': benefit('Build your next Overdrive faster', [metric('Overdrive charge', /generate (\d+)% more/, 'percent', '+')]),
  'slide-loader': benefit('Dash to reload your weapon instantly', [], 'Instant reload from reserve'),
  afterquake: benefit('Seismic Slam strikes twice', [metric('echo damage', /dealing (\d+) damage/), metric('echo delay', /point (\d+(?:\.\d+)?) seconds/, 'seconds')]),
  'reinforced-bulwark': benefit('Bulwark holds stronger and lasts longer', [metric('wall health', /has (\d+)% more/, 'percent', '+'), metric('duration', /lasts (\d+) seconds longer/, 'seconds', '+')]),
  'spreading-nova': benefit('Chilled crowds expand Cryo Nova', [metric('/ chilled', /gains (\d+) radius/, 'distance', '+'), metric('max', /up to (\d+) extra radius/, 'distance', '+')]),
  'twin-glacier': benefit('Raise two Glaciers with one cast', [metric('ice walls', /raises (two) parallel/), metric('offset', /walls, (\d+) units/, 'distance')]),
  'scorched-fan': benefit('Flashfire leaves a burning pool', [metric('pool radius', /with (\d+) radius/, 'distance'), metric('duration', /for (\d+(?:\.\d+)?) seconds/, 'seconds')]),
  'napalm-triplet': benefit('Spread Napalm Charge across three pools', [metric('pools', /creates (three) pools/), metric('pool radius', /pools of (\d+) radius/, 'distance')]),
  'forked-overload': benefit('Overload reaches deeper into the crowd', [metric('chain targets', /through (two) additional/, 'number', '+'), metric('max targets', /up to (eight) distinct/)]),
  'twin-pylon': benefit('Deploy two linked Tesla Pylons', [metric('pylons', /deploys (two) pylons/), metric('offset', /pylons, (\d+) units/, 'distance')]),
};

const wordNumbers: Readonly<Record<string, number>> = {one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, half:.5, second:1, third:3, fourth:4, fifth:5, sixth:6, twice:2};

/** Exact values are retained for inspection; overview distances/time/percentages are rounded. */
export function boonMetrics(boon: MutationDefinition): readonly {value: number; shown: number; label: string; text: string}[] {
  return BOON_BENEFITS[boon.id].metrics.map(metric => {
    const token = metric.source.exec(`${boon.description} ${boon.tradeoff}`)?.[1];
    if (!token) throw new Error(`Missing catalog metric for ${boon.id}: ${metric.source}`);
    const value = token.toLowerCase() === 'second' && metric.kind === 'number' ? 2 : wordNumbers[token.toLowerCase()] ?? Number(token);
    const displayValue = metric.kind === 'distance' ? value / WORLD_UNITS_PER_METRE : value;
    const step = metric.kind === 'percent' ? 5 : metric.kind === 'distance' || metric.kind === 'seconds' ? .5 : 1;
    const shown = Math.max(displayValue > 0 ? step : 0, Math.round(displayValue / step) * step);
    const unit = metric.kind === 'distance' ? ' m' : metric.kind === 'seconds' ? ' s' : metric.kind === 'percent' ? '%' : '';
    return {value, shown, label: metric.label, text: `${shown !== displayValue ? '≈' : ''}${metric.prefix}${shown}${unit} ${metric.label}`};
  });
}

/** One comparable summary line, with approximations explicitly marked. */
export function boonNumbers(boon: MutationDefinition): string {
  return boonMetrics(boon).map(metric => metric.text).join(' · ') || BOON_BENEFITS[boon.id].fallback || '';
}

/** Explicit catalog completeness check is also usable by capture tooling. */
export function boonBenefit(boon: MutationDefinition): string {
  return BOON_BENEFITS[boon.id].headline;
}
