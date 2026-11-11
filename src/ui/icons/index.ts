/** Original 32 px ship-system glyphs, drawn for Containment. */
const glyphs = {
  pistol: '<path d="M5 11h18v6H13l-3 9H5l3-12H5zM23 12h4v3h-4M13 18h5v4h-7"/>',
  rifle: '<path d="M3 13h7l3-4h8v4h8v4H16l-3 8H8l2-8H3zM18 8V5h5M21 10v7M18 19l2 6h4l-3-8"/>',
  shotgun: '<path d="M3 12h23v4H12l-5 8H3l5-11M14 17h10v3H14M26 11h3v6h-3M5 10h16"/>',
  plasma: '<path d="M4 11h7l3-4h10l4 5v7H13l-3 7H5l3-11H4zM16 11l-3 4h10l-4-4M26 10v10M16 22h7"/>',
  rocket: '<path d="M3 10h19l7 6-7 6H3zM8 10V7h6v3M9 22l-2 5h6l2-5M20 10v12M25 13v6M6 14h9"/>',
  grenade: '<path d="M12 4h8v5h-8zM19 5h5v7M10 10l-3 5v10l4 4h10l4-4V15l-3-5zM12 15h8M12 20h8M16 11v17"/>',
  medkit: '<path d="M5 9h22v18H5zM11 9V5h10v4M13 13h6v4h4v6h-4v4h-6v-4H9v-6h4z"/>',
  credits: '<path d="M16 3l11 6v14l-11 6-11-6V9zM21 11l-5-3-5 3v10l5 3 5-3M8 7l16 18"/>',
  health: '<path d="M12 4h8v8h8v8h-8v8h-8v-8H4v-8h8z"/>',
  armor: '<path d="M16 3l11 5v8c0 6-5 11-11 14C10 27 5 22 5 16V8zM16 8l6 3v6l-6 7-6-7v-6z"/>',
  ram: '<path d="M4 10l8 6-8 6M13 7l11 9-11 9M27 7v18M3 5h7M3 27h7"/>',
  'seismic-slam': '<path d="M12 4h8v9h-8zM16 13v9M11 18l5 5 5-5M5 17l-3 6 6 5M27 17l3 6-6 5M10 28h12M2 13h5M25 13h5"/>',
  bulwark: '<path d="M5 24V9l11-5 11 5v15M10 23V12l6-3 6 3v11M3 28h26M16 10v12M12 25h8"/>',
  railbreaker: '<path d="M2 13h18V8l10 8-10 8v-5H2M7 8v3M7 21v3M13 5v6M13 21v6"/>',
  'frost-trail': '<path d="M3 7l10 9L3 25M12 5l11 11-11 11M26 5v6M23 8h6M26 22v7M23 25h6M18 13l3-3M18 19l3 3"/>',
  'cryo-nova': '<path d="M16 7v18M8 11l16 10M8 21l16-10M13 9l3 3 3-3M13 23l3-3 3 3M5 7l-2 9 2 9M27 7l2 9-2 9M11 3h10M11 29h10"/>',
  glacier: '<path d="M3 27l5-17 6 5 5-12 10 24zM8 10l4 17M19 3l2 24M14 15l-2 12M22 15l4 3M17 24l-3-4"/>',
  whiteout: '<path d="M5 8c5-5 17-6 22 1M3 16h23l-4-4M5 24c5 5 17 6 22-1M16 5v5M13 7l6 2M16 22v5M13 24l6 2M2 11l3-3 4 1M23 23l4 1 3-3"/>',
  afterburn: '<path d="M18 4l10 12-10 12M12 10l6 6-6 6M8 11c1 5-6 5-5 11 6 1 10-3 8-8M4 5l4 2"/>',
  flashfire: '<path d="M4 16L27 4v24zM9 16h8M18 12l6-3M18 20l6 3M19 16h8"/>',
  'napalm-charge': '<path d="M12 4h8v4h-8zM10 8h12v10l-6 5-6-5zM14 11v6M5 23l-2 4h26l-3-4M10 28l-2 2M22 28l2 2M3 18l3 2M29 18l-3 2"/>',
  meltdown: '<path d="M16 3c2 7 9 9 10 16a10 10 0 0 1-20 0c0-4 3-8 6-10l1 6zM16 15c-1 5-5 6-4 10 2 4 8 3 8-1 0-3-3-5-4-9M3 5l3 4M29 5l-3 4"/>',
  'static-step': '<path d="M3 9l9 7-9 7M12 7l10 9-10 9M25 3l-6 10h9l-5 7M27 24l-3 5M7 4H3M7 28H3"/>',
  overload: '<path d="M15 3L8 15h9l-3 14 11-17h-9l4-9M4 6v5h4M25 23h4v5M2 21h5M26 5h4"/>',
  'tesla-pylon': '<path d="M16 3l6 5-6 5-6-5zM16 13v13M11 17h10M7 29l4-5h10l4 5M5 8H2l3 6-3 4h6M27 8h3l-3 6 3 4h-6"/>',
  overclock: '<path d="M25 9a12 12 0 1 0 3 10M25 3v6h-6M16 8v8l-5 5M24 14l-4 6h5l-3 7M7 7l2 2M4 16h3M8 25l2-2"/>',
  afterquake: '<path d="M12 3h8v8h-8zM16 11v7M11 15l5 5 5-5M4 20l-2 5 6 4M28 20l2 5-6 4M9 25h14M11 29h10"/>',
  'reinforced-bulwark': '<path d="M4 25V8l12-5 12 5v17M9 24V12l7-3 7 3v12M16 13v12M12 19h8M2 29h28"/>',
  'spreading-nova': '<path d="M16 9v14M10 12l12 8M10 20l12-8M10 4l6-2 6 2M4 10l-2 6 2 6M22 28l-6 2-6-2M28 22l2-6-2-6M8 8l3 3M24 24l-3-3"/>',
  'twin-glacier': '<path d="M2 28l5-15 5 5 4-12 6 22zM17 18l5-15 8 25h-4M7 13l2 15M16 6l2 22M22 3l3 17"/>',
  'scorched-fan': '<path d="M3 16L27 4v16M8 16h8M18 12l6-3M18 17h8M9 24c3-1 3-5 5-7 0 5 6 6 5 10M4 29h25M25 22l3 5"/>',
  'napalm-triplet': '<path d="M12 2h8v4h-8zM10 6h12v9l-6 4-6-4zM16 10v4M3 26l4-5 4 5-4 4zM12 26l4-5 4 5-4 4zM21 26l4-5 4 5-4 4z"/>',
  'forked-overload': '<path d="M17 2L9 15h9l-3 14 10-16h-8l4-11M9 15H3v8M3 23l-2-3M3 23l3-3M23 9h6V3M29 3l-3 3"/>',
  'twin-pylon': '<path d="M9 3l5 5-5 5-5-5zM23 3l5 5-5 5-5-5zM9 13v13M23 13v13M4 29l5-5 5 5M18 29l5-5 5 5M14 17h4M16 14v6"/>',
  'reserve-thruster': '<path d="M3 8l9 8-9 8M12 8l9 8-9 8M24 5v8M20 9h8M24 20v8M20 24h8"/>',
  'tactical-salvage': '<path d="M7 8a11 11 0 1 1-2 12M7 3v5H2M14 9h6v6h6v6h-6v6h-6v-6H8v-6h6z"/>',
  'drive-dynamo': '<path d="M16 2l12 7v14l-12 7-12-7V9zM18 7l-8 11h7l-3 8 9-12h-7M2 5h6M24 27h6"/>',
  'slide-loader': '<path d="M2 7l8 7-8 7M11 7l8 7-8 7M22 3h7v17h-7zM22 9h7M15 24h14M24 20l5 4-5 5M4 27h8"/>',
  breacher: '<path d="M4 5h24v22H4zM10 10l7 6-7 6M20 10v12M4 10H1M4 22H1M28 10h3M28 22h3"/>',
  cryo: '<path d="M16 2l12 7v14l-12 7-12-7V9zM16 8v16M9 12l14 8M9 20l14-8M13 10l3 3 3-3M13 22l3-3 3 3"/>',
  pyro: '<path d="M16 2l12 7v14l-12 7-12-7V9zM17 8c0 5 6 6 5 12-1 7-12 7-12 0 0-3 3-6 3-6l1 4z"/>',
  arc: '<path d="M16 2l12 7v14l-12 7-12-7V9zM18 7l-8 11h7l-3 8 9-12h-7z"/>',
  'family-kinetic': '<path d="M4 6h9v8H4zM19 18h9v8h-9zM17 4l6 6-6 6M15 16l-6 6 6 6M13 10h10M9 22h10"/>',
  'family-cryo': '<path d="M16 3v26M5 9l22 14M5 23L27 9M12 5l4 4 4-4M12 27l4-4 4 4M5 14l5-2-1-5M27 18l-5 2 1 5M5 18l5 2-1 5M27 14l-5-2 1-5"/>',
  'family-pyro': '<path d="M17 3c1 7 10 10 9 17-1 12-20 12-20 0 0-5 3-9 7-12l1 7zM17 16c-1 5-6 7-4 11M23 3v5M4 7l3 3"/>',
  'family-reactor': '<path d="M16 5c6 0 14 15 10 19S5 22 3 16 12 5 16 5zM16 5c-6 0-14 15-10 19s21-2 23-8S20 5 16 5zM13 14h6v5h-6z"/>',
  'family-recovery': '<path d="M8 8a11 11 0 1 1-3 10M8 3v5H3M13 11h6v3h3v6h-3v3h-6v-3h-3v-6h3z"/>',
  'rarity-common': '<path d="M16 8l8 8-8 8-8-8z"/>',
  'rarity-uncommon': '<path d="M16 5l11 11-11 11L5 16zM16 12l4 4-4 4-4-4z"/>',
  'rarity-rare': '<path d="M16 3l12 13-12 13L4 16zM16 9l6 7-6 7-6-7zM1 10v12M31 10v12"/>',
  'rarity-legendary': '<path d="M16 2l5 9 9 5-9 5-5 9-5-9-9-5 9-5zM16 11l5 5-5 5-5-5zM5 4l3 3M27 4l-3 3M5 28l3-3M27 28l-3-3"/>',
  burn: '<path d="M18 3c1 7 9 10 8 17-1 12-20 12-20 0 0-5 3-9 7-12l1 7zM16 16c-1 5-5 7-3 11 2 3 6 1 6-2 0-3-3-4-3-9"/>',
  chill: '<path d="M16 3v26M5 9l22 14M5 23L27 9M12 5l4 4 4-4M12 27l4-4 4 4M5 14l5-2-1-5M27 18l-5 2 1 5"/>',
  freeze: '<path d="M16 2l12 8v14l-12 6-12-6V10zM4 10l12 7 12-7M16 17v13M11 7l5 4 5-4M9 16v6M23 16v6"/>',
  shock: '<path d="M18 2L6 18h9l-2 12 13-18h-9z"/>',
  acid: '<path d="M16 3C13 9 6 15 6 20a10 10 0 0 0 20 0c0-5-7-11-10-17zM11 22l3-3M18 25l3-3M18 17l3 3M11 14h2"/>',
  combat: '<path d="M5 4l23 23M4 9l5-5M21 28l7-7M27 4L4 27M23 4l5 5M4 21l7 7M12 12l8 8M12 20l8-8"/>',
  elite: '<path d="M16 2l13 14-13 14L3 16zM9 12l4 8h6l4-8-7 4zM12 23h8"/>',
  medical: '<path d="M7 4h18v24H7zM12 2h8v5h-8M13 11h6v4h4v5h-4v4h-6v-4H9v-5h4z"/>',
  armory: '<path d="M3 5h26v24H3zM3 10h26M8 14v10M12 14v10M19 14h6v3h-6zM19 21h6v3h-6zM8 2v5M24 2v5"/>',
  boss: '<path d="M6 6l5 5 5-8 5 8 5-5 3 12-8 11H11L3 18zM9 15l5 4M23 15l-5 4M12 25v-3M20 25v-3M16 24v5"/>',
  pause: '<path d="M8 5h5v22H8zM19 5h5v22h-5z"/>',
  settings: '<path d="M12 3h8l1 5 4 2 4 3v6l-4 3-4 2-1 5h-8l-1-5-4-2-4-3v-6l4-3 4-2z"/><circle cx="16" cy="16" r="5"/>',
  sound: '<path d="M4 12h6l7-7v22l-7-7H4zM22 10c4 3 4 9 0 12M26 6c7 6 7 14 0 20"/>',
  mute: '<path d="M4 12h6l7-7v22l-7-7H4zM22 12l8 8M30 12l-8 8"/>',
  keyboard: '<path d="M3 7h26v19H3zM7 12h2M13 12h2M19 12h2M25 12h1M7 17h2M13 17h2M19 17h2M25 17h1M9 22h14"/>',
  arrow: '<path d="M4 16h24M19 7l9 9-9 9"/>',
  'arrow-left': '<path d="M28 16H4M13 7l-9 9 9 9"/>',
  'arrow-up': '<path d="M16 28V4M7 13l9-9 9 9"/>',
  check: '<path d="M5 16l7 7L27 8"/>',
  lock: '<path d="M6 14h20v15H6zM10 14V8a6 6 0 0 1 12 0v6M16 20v4"/>',
  warning: '<path d="M16 3l14 25H2zM16 11v8M16 23v1"/>',
  close: '<path d="M7 7l18 18M25 7L7 25"/>',
  reload: '<path d="M26 11A11 11 0 0 0 7 7L3 12M3 5v7h7M6 21a11 11 0 0 0 19 4l4-5M29 27v-7h-7"/>',
  dash: '<path d="M4 8l10 8L4 24M15 8l10 8-10 8M3 4h7M3 28h7"/>',
  overdrive: '<path d="M9 4h14l7 12-7 12H9L2 16zM18 7l-8 11h7l-2 7 8-12h-7z"/>',
  target: '<circle cx="16" cy="16" r="9"/><circle cx="16" cy="16" r="3"/><path d="M16 2v6M16 24v6M2 16h6M24 16h6"/>',
  ship: '<path d="M16 2l8 9v15l-8 4-8-4V11zM8 15l-5 5v6h5M24 15l5 5v6h-5M13 12h6v8h-6zM13 25h6"/>',
  save: '<path d="M5 3h19l4 4v22H4V3zM10 3v9h12V3M9 29V18h14v11M17 5v4"/>',
  loadout: '<path d="M11 3h10l3 6 5 4-4 15H7L3 13l5-4zM11 3v7h10V3M9 16h14M16 10v18M8 22h16"/>',
  controls: '<path d="M11 3h10v8H11zM2 20h8v9H2zM12 20h8v9h-8zM22 20h8v9h-8zM16 11v9M6 20v-5h20v5"/>',
} as const;

type IconName = keyof typeof glyphs;

/** Canonical names accepted by the shared SVG helper. Prefix aliases also work. */
export const ICON_NAMES: readonly IconName[] = Object.freeze(Object.keys(glyphs) as IconName[]);

const aliases: Readonly<Record<string, IconName>> = {
  kinetic: 'family-kinetic',
  reactor: 'family-reactor',
  recovery: 'family-recovery',
  wildfire: 'family-pyro',
  'family-arc': 'family-reactor',
  'family-breacher': 'family-kinetic',
  'room-shop': 'armory',
  'room-rest': 'medical',
  'room-exit': 'ship',
  'rarity-epic': 'rarity-legendary',
  'rarity-risk': 'warning',
  'rarity-risky': 'warning',
  'volume': 'sound',
  'credit': 'credits',
};

function escapeAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    };
    return entities[character];
  });
}

/** Render a decorative, color-inheriting SVG. Its containing control owns its label. */
export function icon(name: string, className = ''): string {
  let normalized = name.trim().toLowerCase().replace(/\s+/g, '-');
  normalized = normalized.replace(/^boon-/, 'family-');
  const plainName = normalized.replace(/^(weapon|ability|rig|status|room)-/, '');
  const candidate = aliases[normalized] ?? aliases[plainName] ?? normalized;
  const resolved = Object.hasOwn(glyphs, candidate)
    ? candidate as IconName
    : Object.hasOwn(glyphs, plainName) ? plainName as IconName : 'warning';
  const classes = escapeAttribute(`icon ui-icon${className ? ` ${className}` : ''}`);

  return `<svg class="${classes}" data-icon="${resolved}" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${glyphs[resolved]}</svg>`;
}
