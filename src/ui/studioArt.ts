const base = `${import.meta.env.BASE_URL}assets/ui/studio/`;

/** Studio files are addressed by subject so the browser only fetches visible art. */
export function studioImage(id: string, className = '', width = 640, height = 360): string {
  return `<img class="${className}" src="${base}${id}.webp" width="${width}" height="${height}" alt="" loading="lazy" decoding="async">`;
}
