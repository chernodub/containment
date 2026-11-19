import type {StandardEnemyId} from '../enemies/types';

export type EncounterGrammar = 'interception'|'crossfire'|'priority'|'pincer'|'swarm'|'siege';
export type EnemyRole = 'screen'|'anchor'|'flanker'|'ranged'|'brood';
export type AuthoredGroup = Readonly<{family:StandardEnemyId;count:number;role:EnemyRole;priority?:boolean;guardian?:'warden'|'matron';lesson?:'crawler'|'brute'|'stalker';reinforcement?:boolean}>;
export type Consequence = 'leader'|'pincer'|'brood';
export type Cleanup = 'rush'|'withdraw';
export type AuthoredBeat = Readonly<{grammar:EncounterGrammar;label:string;lullMs:number;consequence?:Consequence;cleanup?:Cleanup;breachOffset?:number;groups:readonly AuthoredGroup[]}>;
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

/** Twenty room identities, authored in campaign order; seeds vary approach sides, not tactical intent. */
export const AUTHORED_ENCOUNTERS:readonly (readonly AuthoredBeat[])[]=Object.freeze([
 [b('swarm','One commitment: evade, then punish',g('crawler',1,'screen',{lesson:'crawler'})),swarm(3)],
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
