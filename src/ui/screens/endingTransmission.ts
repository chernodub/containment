/** The final uplink leaves a broken vessel and its silent passenger deck behind. */
export function endingTransmission(): string {
  const base = `${import.meta.env.BASE_URL}assets/ui/u10/`;
  return `<figure class="ending-transmission" aria-label="The final warning leaves the dying colony ship"><div class="ending-render"><picture class="ending-set"><source type="image/webp" srcset="${base}ending-1280.webp 1280w, ${base}ending-1920.webp 1920w" sizes="100vw"><img src="${base}ending-1280.jpg" width="1920" height="1080" alt="A final signal rises from an uplink dish above dark passenger cryopods. A lone marine bows over the console as the broken ship burns behind them." loading="lazy" decoding="async"></picture></div></figure>`;
}
