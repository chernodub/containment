import type {DepthGame} from '../DepthGame';
import type {StoryRoom} from '../game/roguelike/storyRooms';
import {generateRun} from '../game/roguelike/run';
import {ROOM_STORY_ROUTE} from '../game/roguelike/storyRooms';

/** A single actionable line; authored objectives remain verbatim in the record. */
export function combatObjective(id: string | undefined, fallback: string): string {
  const actions: Record<string, string> = {
    'awakening-bay': 'Restore communications.', 'passenger-vault': 'Clear the occupied pod rows.',
    'residential-gallery': 'Fight through the doorways.', 'communal-atrium': 'Clear a path to security.',
    'crew-checkpoint': 'Break the fortified checkpoint.', 'armory': 'Defeat the armory elite.',
    'freight-hold': 'Clear the colony supplies.', 'breached-loading-bay': 'Fight around the sealed breach.',
    'relay-racks': 'Clear aisles. Restore the relay.', 'transmission-chamber': 'Defend the warning uplink.',
    'diagnostic-gallery': 'Clear threats · details after clear.',
    'safety-interlock-station': 'Clear threats · details after clear.',
    'coolant-plant': 'Descend through the coolant pumps.', 'service-shaft-landing': 'Reach the lower decks.',
    'infested-workshop': 'Clear the converted workshop.', 'swarm-junction': 'Break the reactor guard swarm.',
    'shielding-gate': 'Clear the last defensive line.', 'containment-annulus': 'Reach the manual controls.',
    'manual-control-chamber': 'Clear threats. Choose at controls.', 'overload-floor': 'Defend the overload sequence.',
  };
  return actions[id ?? ''] ?? fallback;
}

/** Only irreversible-state and passenger warnings earn persistent combat space. */
export function combatStoryWarning(room: StoryRoom | undefined): string {
  if (!room) return '';
  const warning = room.objective.match(/Overload is NOT armed\.|PASSENGERS ALIVE\..*|No escape\..*/)?.[0] ?? '';
  return room.templateId === 'containment-annulus' ? `PASSENGERS ALIVE. ${warning}` : warning;
}

const escape = (text: string) => text.replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]!));
const recordText = (room: StoryRoom) => `<p class="record-objective">${escape(room.objective)}</p>${room.story ? `<p class="record-story">${escape(room.story)}</p>` : ''}`;

/** Native clear boundaries expose the complete record without delaying any action. */
export function clearRoomRecord(game: DepthGame): string {
  const room = game.storyRoom;
  if (!room || !['reward', 'route'].includes(game.status) || !game.expedition.run.completedNodeIds.includes(game.node.id)) return '';
  return `<aside class="room-record" aria-label="Room clear record"><div class="record-heading"><span>ROOM CLEAR · ${escape(room.name)}</span><button id="skip-clear-record" class="quiet">Skip record</button></div>${room.story ? `<p class="record-story">${escape(room.story)}</p>` : ''}<details class="record-context"><summary>Objective &amp; situation</summary><p class="record-objective">${escape(room.objective)}</p><p class="record-status">${escape(game.storyStatus)}</p></details><small>Saved in Pause · Room records.</small></aside>`;
}

/** Skipping a beat never removes it from the pause archive, including on Continue. */
export function pauseRoomRecords(game: DepthGame): string {
  if (!game.storyRoom) return '';
  const visited = new Set(generateRun(game.expedition.run.seed, game.expedition.run.version).nodes.filter(node => node.id === game.node.id || game.expedition.run.completedNodeIds.includes(node.id)).map(node => node.templateId));
  const records = ROOM_STORY_ROUTE.filter(room => visited.has(room.templateId));
  const current = records.find(room => room.templateId === game.node.templateId);
  const earlier = records.filter(room => room !== current);
  const entry = (room: StoryRoom, open = false) => `<details ${open ? 'open' : ''}><summary>${escape(room.name)}</summary>${recordText(room)}</details>`;
  return `<section class="room-record-archive" aria-label="Room records"><h3>Room records</h3>${current ? entry(current,true) : ''}${earlier.length ? `<details class="earlier-records"><summary>Earlier records · ${earlier.length}</summary>${earlier.map(room => entry(room)).join('')}</details>` : ''}</section>`;
}
