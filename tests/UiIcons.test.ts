import { describe, expect, it } from 'vitest';
import { ABILITY_CATALOG, RIG_IDS } from '../src/game/abilities/catalog';
import {AUGMENT_BOONS} from '../src/game/abilities/augmentCatalog';
import { icon, ICON_NAMES } from '../src/ui/icons';

describe('ship-system icon contract', () => {
  it('covers every rig, ability, weapon and readable status with original glyphs', () => {
    const names = [
      ...Object.keys(ABILITY_CATALOG), ...Object.keys(AUGMENT_BOONS), ...RIG_IDS,
      'pistol', 'rifle', 'shotgun', 'plasma', 'rocket',
      'grenade', 'medkit', 'health', 'armor', 'credits',
      'burn', 'chill', 'freeze', 'shock', 'acid',
      'combat', 'elite', 'medical', 'armory', 'boss',
      'family-kinetic', 'family-cryo', 'family-reactor', 'family-recovery',
      'pause', 'settings', 'sound', 'keyboard', 'arrow', 'check', 'lock', 'warning',
    ];

    for (const name of names) {
      expect(ICON_NAMES).toContain(name);
      expect(icon(name)).toContain(`data-icon="${name}"`);
    }

    const abilityShapes = Object.keys(ABILITY_CATALOG).map((name) =>
      icon(name).replace(/data-icon="[^"]+"/, ''),
    );
    expect(new Set(abilityShapes).size).toBe(16);
    const augmentShapes=Object.keys(AUGMENT_BOONS).map(name=>icon(name).replace(/data-icon="[^"]+"/,''));
    expect(new Set(augmentShapes).size).toBe(12);
  });

  it('keeps every glyph decorative, monochrome, and on the shared 32 px grid', () => {
    for (const name of ICON_NAMES) {
      const svg = icon(name);
      expect(svg).toContain('viewBox="0 0 32 32"');
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
      expect(svg).toContain('stroke="currentColor"');
      expect(svg).toContain('stroke-width="1.7"');
      expect(svg).not.toMatch(/<script|<foreignObject|<image|<use|id=|onload=/);
    }
  });

  it('accepts catalog and presentation aliases without losing identity', () => {
    const names: Record<string, string> = {
      'weapon-rifle': 'rifle',
      'ability-napalm-charge': 'napalm-charge',
      'rig-cryo': 'cryo',
      'status-freeze': 'freeze',
      'room-boss': 'boss',
      'boon-Kinetic': 'family-kinetic',
      'boon-Cryo': 'family-cryo',
      'boon-Reactor': 'family-reactor',
      'boon-Recovery': 'family-recovery',
      'boon-reactor': 'family-reactor',
    };
    for (const [name, expected] of Object.entries(names)) {
      expect(icon(name)).toContain(`data-icon="${expected}"`);
    }
  });

  it('renders unknown names as warnings and escapes optional classes', () => {
    expect(icon('unrecognized')).toContain('data-icon="warning"');
    expect(icon('<svg onload="alert(1)">')).not.toContain('onload');
    expect(icon('health', 'small" onload="bad')).toContain('small&quot; onload=&quot;bad');
    expect(icon('health', 'small')).toContain('class="icon ui-icon small"');
  });
});
