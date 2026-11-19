const base = `${import.meta.env.BASE_URL}assets/ui/u10/`;
const studio = `${import.meta.env.BASE_URL}assets/ui/studio/`;
const fallbackFor = (layer: typeof layers[number]) => layer==='hero' ? `${studio}title-hero.webp` : `${base}${layer}-1280.png`;
const layers = ['background','midground','hero','foreground','fog'] as const;

const titleImages = new Map<string, HTMLImageElement>();

function layerSources(layer: typeof layers[number]): string {
  if(layer==='hero')return `${studio}title-hero.webp 1280w`;
  return layer==='fog'
    ? `${base}fog-640.webp 640w, ${base}fog-1280.webp 1280w`
    : `${base}${layer}-1280.webp 1280w, ${base}${layer}-2560.webp 2560w`;
}

function retainImage(srcset: string, fallback: string, priority: 'high'|'low'): void {
  if (titleImages.has(srcset)) return;
  const image = new Image();
  image.decoding = 'async';
  image.fetchPriority = priority;
  image.addEventListener('error', () => titleImages.delete(srcset), {once:true});
  image.sizes = '100vw';
  image.srcset = srcset;
  image.src = fallback;
  // Keep in-flight requests alive when Start or a drawer replaces the title DOM.
  titleImages.set(srcset, image);
}

/** Aligned Blender plates; loading/decode remains independent of every menu action. */
export function titleKeyArt(still = false): string {
  const composite = `${studio}title-composite.webp`;
  retainImage(composite, composite, 'high');
  if (!still) for (const layer of layers) retainImage(layerSources(layer), fallbackFor(layer), 'low');
  return `<div class="title-key-art${still?' key-art-still':''}" aria-hidden="true"><picture class="ka-fallback"><source type="image/webp" srcset="${composite}" sizes="100vw"><img src="${composite}" width="2560" height="1440" decoding="async" fetchpriority="high" alt=""></picture>${still?'':layers.map(layer=>`<picture class="ka-plane ka-${layer}"><source type="image/webp" srcset="${layerSources(layer)}" sizes="100vw"><img src="${fallbackFor(layer)}" width="2560" height="1440" decoding="async" fetchpriority="low" alt=""></picture>`).join('')}<div class="ka-breath"></div><div class="ka-grade"></div></div>`;
}

/** Swap the composite only after every optional plate decodes; actions stay live. */
export function revealTitleLayers(root: HTMLElement): void {
  const art = root.querySelector<HTMLElement>('.title-key-art:not(.key-art-still)');
  if (!art) return;
  const images = [...art.querySelectorAll<HTMLImageElement>('.ka-plane img')];
  void Promise.all(images.map(image => image.decode())).then(() => {
    if (art.isConnected) art.classList.add('key-art-layered');
  }).catch(() => { /* A missing optional plate leaves the complete static image. */ });
}
