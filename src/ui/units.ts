/** The renderer and threat indicators share 32 simulation units per metre. */
export const WORLD_UNITS_PER_METRE = 32;

/** A compact player-facing distance; precision preserves small augment changes. */
export function formatDistance(worldUnits: number): string {
  return `${Number((worldUnits / WORLD_UNITS_PER_METRE).toFixed(2))} m`;
}

/** Convert authored simulation-distance prose at the presentation boundary. */
export function playerFacingText(text: string): string {
  return text
    .replace(/\b(\d+(?:\.\d+)?)\s*(?:-\s*)?(extra\s+)?(units|radius)\b/gi, (_, value: string, extra: string, unit: string) => `${formatDistance(Number(value))}${extra ? ' extra' : ''}${unit.toLowerCase() === 'radius' ? ' radius' : ''}`)
    .replace(/\brare mutation\b/gi, 'Rare boon')
    .replace(/\bmutation(s)?\b/gi, (_, plural: string) => `boon${plural ?? ''}`);
}

/** Numeric catalog length statistics use the same conversion as world distances. */
export function playerFacingStat(label: string, value: string): string {
  return /^(radius|range|width|length|distance|hop range)$/i.test(label) && /^\d+(?:\.\d+)?$/.test(value)
    ? formatDistance(Number(value)) : value;
}
