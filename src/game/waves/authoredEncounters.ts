import type {DetourChoice} from '../roguelike/economy';
import type {StandardEnemyId} from '../enemies/types';

export type EncounterGrammar = 'interception'|'crossfire'|'priority'|'pincer'|'swarm'|'siege';
export type EnemyRole = 'screen'|'anchor'|'flanker'|'ranged'|'brood';
export type AuthoredGroup = Readonly<{family:StandardEnemyId;count:number;role:EnemyRole;priority?:boolean;guardian?:'warden'|'matron';lesson?:'crawler'|'brute'|'stalker';reinforcement?:boolean}>;
export type Consequence = 'leader'|'pincer'|'brood';
export type Cleanup = 'rush'|'withdraw';
export type AuthoredBeat = Readonly<{grammar:EncounterGrammar;label:string;lullMs:number;consequence?:Consequence;cleanup?:Cleanup;recallAfterLunge?:true;breachOffset?:number;groups:readonly AuthoredGroup[]}>;
const g=(family:StandardEnemyId,count:number,role:EnemyRole,extra:Partial<AuthoredGroup>={}):AuthoredGroup=>Object.freeze({family,count,role,...extra});
const b=(grammar:EncounterGrammar,label:string,...groups:AuthoredGroup[]):AuthoredBeat=>Object.freeze({grammar,label,lullMs:2500,groups:Object.freeze(groups)});
const swarm=(n:number)=>b('swarm','Break the rush',g('crawler',n,'screen'));
const cross=(n:number)=>b('crossfire','Silence the two firing lanes',g('spitter',2,'ranged'),g('crawler',n,'screen'));
const flank=(n:number)=>b('interception','Read the flank',g('brute',1,'anchor'),g('stalker',n,'flanker'));
const withRules=(beat:AuthoredBeat,rules:Partial<AuthoredBeat>):AuthoredBeat=>Object.freeze({...beat,...rules});
const pincer=(n:number)=>b('pincer','Choose an exit before the arms close',g('crawler',n,'screen'),g('stalker',2,'flanker'));
const brokenPincer=(n:number)=>withRules(b('pincer','Break the crawler arm before the flank arrives',g('crawler',n,'screen'),g('stalker',2,'flanker',{reinforcement:true})),{consequence:'pincer',cleanup:'withdraw'});
const priority=(n:number,guardian?:'warden'|'matron',breachOffset?:number)=>withRules(b('priority',guardian==='warden'?'Bait the Warden into a wall':guardian==='matron'?'Break the Matron brood pods':'Remove the brood leader before reinforcements',g(guardian==='warden'?'brute':'carrier',1,'brood',{priority:true,guardian}),g('brute',1,'anchor'),g('crawler',n,'screen',{reinforcement:true})),{consequence:guardian==='matron'?'brood':guardian?undefined:'leader',cleanup:'withdraw',breachOffset});
const siege=(n:number)=>b('siege','Hold a lane, then change position',g('spitter',2,'ranged'),g('brute',1,'anchor'),g('crawler',n,'screen'));

export const AWAKENING_DRILL = Object.freeze({
  family: 'brute',
  spawnDistance: 110,
  credits: 20,
  confirmationMs: 1100,
} as const);

/** Canonical beat sets in campaign order, also used as the fixed order for older saves. */
export const AUTHORED_ENCOUNTERS:readonly (readonly AuthoredBeat[])[]=Object.freeze([
 [b('swarm','One commitment: evade, then punish',g('crawler',1,'screen',{lesson:'crawler'})),b('crossfire','Use the wreck to cross the firing lane',g('spitter',1,'ranged'),g('crawler',2,'screen'))],
 [b('priority','One heavy swing: step aside, punish recovery',g('brute',1,'anchor',{lesson:'brute'})),cross(1),swarm(2)],
 [b('interception','One revealed lunge: sidestep, then punish',g('stalker',1,'flanker',{lesson:'stalker'})),swarm(3),cross(1)],
 [pincer(2),priority(1),flank(1)],
 [cross(4),flank(2),priority(4)],
 [priority(3,'warden',0),cross(4),swarm(6)],
 [swarm(7),pincer(5),priority(4)],
 [flank(3),cross(5),pincer(6)],
 [cross(5),priority(4,'warden',1),flank(3)],
 [siege(5),pincer(6),cross(5),siege(6)],
 [priority(5),flank(3),cross(6)],
 [brokenPincer(2),siege(5),priority(5)],
 [cross(6),priority(5,'warden',2),pincer(7)],
 [flank(4),pincer(7),cross(6)],
 [swarm(9),priority(6),flank(4)],
 [priority(5,'matron'),pincer(7),siege(6)],
 [cross(6),priority(6),flank(4)],
 [brokenPincer(3),cross(7),priority(6)],
 [flank(4),priority(5,'warden',3),cross(6)],
 [brokenPincer(3),priority(5),siege(6)],
].map(beats=>Object.freeze(beats)));
export const DETOUR_BEATS:Readonly<Partial<Record<number,AuthoredBeat>>>=Object.freeze({
 15:priority(2,'warden'),
 18:siege(3),
});

/** Story relief for maintenance and late flank rooms, preserving each room's tactical beats. */
export const STORY_ENCOUNTER_OVERRIDES:Readonly<Partial<Record<number,readonly AuthoredBeat[]>>>=Object.freeze({
 12:Object.freeze([cross(4),withRules(priority(2,'warden',2),{lullMs:4000}),brokenPincer(4)]),
 13:Object.freeze([withRules(flank(3),{lullMs:4000}),brokenPincer(4),cross(4)]),
 16:Object.freeze([cross(4),priority(4),flank(3)]),
 18:Object.freeze([flank(3),priority(5,'warden',3),cross(6)]),
});

/** Names follow the authored beat order. A variant promotes one of the first
 * three beats to the opener, then plays the remaining beats in authored order.
 * Teaching rooms instead keep the isolated lesson and change the approach. */
const OPENING_NAMES = [
 ['Main hatch rush','Port hatch rush','Far hatch rush'],
 ['Heavy at the hatch','Heavy on the flank','Heavy across the bay'],
 ['Lunge from the hatch','Lunge from the flank','Lunge across the deck'],
 ['Break the pincer','Cut off the brood','Hold the atrium relay'],
 ['Split the firing lanes','Turn the flank','Stop the brood'],
 ['Bait the Warden','Cross the firing lanes','Stop the rush'],
 ['Hold back the rush','Split the pincer','Cut out the leader'],
 ['Intercept the flank','Silence the crossfire','Escape the pincer'],
 ['Clear the firing lanes','Bait the Warden','Intercept the flank'],
 ['Charge the relay','Break the pincer','Silence the crossfire'],
 ['Stop the brood leader','Turn the flank','Split the crossfire'],
 ['Break the crawler arm','Hold the relay','Stop the brood leader'],
 ['Clear the firing lanes','Bait the Warden','Break the pincer'],
 ['Intercept the flank','Break the pincer','Clear the firing lanes'],
 ['Stem the rush','Stop the brood','Turn the flank'],
 ['Interrupt the Matron','Escape the pincer','Charge the relay'],
 ['Split the crossfire','Prevent reinforcements','Turn the flank'],
 ['Break the crawler arm','Split the crossfire','Stop the brood'],
 ['Turn the flank','Bait the Warden','Clear the firing lanes'],
 ['Break the crawler arm','Cut off the brood','Charge the final relay'],
] as const;

export function storyBeats(depth:number, story:boolean) {
 return (story ? STORY_ENCOUNTER_OVERRIDES[depth] : undefined) ?? AUTHORED_ENCOUNTERS[depth];
}

/** A separate seed stream keeps opening selection independent of spawn rolls. */
export function openingRoll(seed:number, depth:number, salt=0) {
 let value=seed ^ Math.imul(depth+1,0x9e3779b9) ^ salt;
 value=Math.imul(value^(value>>>16),0x21f0aaad);
 value=Math.imul(value^(value>>>15),0x735a2d97);
 return (value^(value>>>15))>>>0;
}

/** The isolated Stalker lesson always uses interception. Give the Atrium’s
 * heavy flank a relay objective when it opens, without changing its roster. */
const ATRIUM_RELAY = withRules(AUTHORED_ENCOUNTERS[3][2], {
 grammar:'siege',
 label:'Hold the atrium relay as the heavy flank arrives',
});

const MANUAL_CONTROL_STORY_OPENING = priority(3,'warden',3);

export function openingBeat(depth:number, index:number, beat:AuthoredBeat, story=false) {
 if(depth===3&&index===2)return ATRIUM_RELAY;
 if(story&&depth===18&&index===1)return MANUAL_CONTROL_STORY_OPENING;
 return beat;
}

export function storyOpening(seed:number, depth:number, story:boolean, salvage=false, junctions?:Readonly<Partial<Record<number,DetourChoice>>>) {
 let previous:EncounterGrammar|undefined;
 let selected=0;
 for(let room=0;room<=depth;room++){
  const beats=storyBeats(room,story);
  const choices=[0,1,2].filter(index=>room<3||beats[index].grammar!==previous);
  const choseSalvage=room===depth?salvage:junctions?.[room]==='salvage';
  const alternate=choseSalvage&&choices.length>1?1:0;
  const roll=openingRoll(seed,room);
  // Preserve both established approaches on the other seeds. When the relay
  // is available, put it on either card and retain the other card's opening.
  const relayAtAtrium=room===3&&openingRoll(seed,room,0x4d21)%3===0&&!!choseSalvage===!!(roll&1);
  selected=relayAtAtrium?2:choices[(roll+alternate)%choices.length];
  const opening=room<3?0:selected;
  previous=openingBeat(room,opening,beats[opening]).grammar;
 }
 return {index:selected,name:OPENING_NAMES[depth][selected]};
}
