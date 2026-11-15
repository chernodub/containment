import {describe, expect, it} from 'vitest';
import type {DepthGame} from '../DepthGame';
import {ROOM_STORY_ROUTE} from '../game/roguelike/storyRooms';
import {generateRun} from '../game/roguelike/run';
import {clearRoomRecord, combatObjective, combatStoryWarning, pauseRoomRecords} from './storyPresentation';

const run = generateRun(1729, 3);
function fixture(index: number, status = 'reward') {
  const room = ROOM_STORY_ROUTE[index], node = run.nodes.find(node => node.templateId === room.templateId)!;
  return {status, node, storyRoom: room, storyStatus: 'AUTHORED / STATUS', expedition: {run: {seed:1729, version:3, completedNodeIds:run.nodes.filter(n => n.depth <= node.depth).map(n => n.id)}}} as unknown as DepthGame;
}

describe('edited combat and verbatim room records', () => {
  it.each(ROOM_STORY_ROUTE.map((room,index) => [room.templateId,index] as const))('%s retains every authored string at clear and in Pause', (_id,index) => {
    const game = fixture(index), room = game.storyRoom!;
    for (const text of [room.objective, ...(room.story ? [room.story] : [])]) {
      expect(clearRoomRecord(game)).toContain(text);
      expect(pauseRoomRecords(game)).toContain(text);
    }
    expect(clearRoomRecord(game)).toContain('AUTHORED / STATUS');
    expect(clearRoomRecord(game)).toContain('skip-clear-record');
    expect(clearRoomRecord(fixture(index,'playing'))).toBe('');
    expect(combatObjective(room.templateId,room.objective).length).toBeLessThanOrEqual(56);
  });
  it('defers Diagnostic and Safety detail, retains passenger/authorization/fatal warnings', () => {
    for (const id of ['diagnostic-gallery','safety-interlock-station']) expect(combatObjective(id,'')).toContain('details after clear');
    expect(combatStoryWarning(ROOM_STORY_ROUTE[17])).toBe('PASSENGERS ALIVE. Overload is NOT armed.');
    expect(combatStoryWarning(ROOM_STORY_ROUTE[18])).toContain('PASSENGERS ALIVE. Overload kills everyone aboard.');
    expect(combatStoryWarning(ROOM_STORY_ROUTE[19])).toBe('No escape. Everyone aboard will die.');
    expect(combatStoryWarning(ROOM_STORY_ROUTE[10])).toBe('');
  });
  it('does not leak future records or depend on skipped dialogue', () => {
    const game=fixture(0);
    expect(pauseRoomRecords(game)).not.toContain('PHYSICAL SERVICE DISPLAY');
    const later=fixture(12);
    expect(pauseRoomRecords(later)).toContain(ROOM_STORY_ROUTE[10].story);
    expect(pauseRoomRecords(later)).toContain(ROOM_STORY_ROUTE[11].story);
    expect(pauseRoomRecords(later)).not.toContain('Manual authorization still required.');
    expect(clearRoomRecord({...game, expedition:{run:{...game.expedition.run, completedNodeIds:[]}}} as unknown as DepthGame)).toBe('');
  });
});
