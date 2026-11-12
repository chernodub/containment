/** Only a visible draft can consume Escape; native combat pause remains available. */
export function dismissesBoonInspection(key: string, draftVisible: boolean, inspectionActive: boolean): boolean {
  return key === 'Escape' && draftVisible && inspectionActive;
}

/** Deliberate draft inspection never changes a choice or consumes native Tab navigation. */
export function installBoonInspection(root: HTMLElement): () => void {
  const held = new Set<string>();
  let pinned: HTMLElement | null = null;
  function clearPinned(): void {
    if (pinned) delete pinned.dataset.inspect;
    pinned = null;
  }
  function sync(): void {
    document.body.dataset.inspect = String(held.size > 0);
  }
  function onKeyDown(event: KeyboardEvent): void {
    if (pinned && !root.contains(pinned)) clearPinned();
    if (event.key === 'Tab' || event.key === 'Alt') {
      held.add(event.key);
      sync();
    }
    const target = event.target instanceof HTMLElement ? event.target : null;
    const card = target?.closest<HTMLElement>('[data-mutation]');
    if (card && root.contains(card) && (event.code === 'KeyI' || event.key.toLowerCase() === 'i')) {
      event.preventDefault();
      if (pinned === card) clearPinned();
      else { clearPinned(); pinned = card; card.dataset.inspect = 'true'; }
    } else if (dismissesBoonInspection(event.key, Boolean(root.querySelector('[data-mutation]')), Boolean(pinned || held.size))) {
      clearPinned(); held.clear(); sync();
      event.preventDefault(); event.stopImmediatePropagation();
    } else if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) {
      const inspected = pinned ?? (held.size ? card ?? root.querySelector<HTMLElement>('[data-mutation]:hover') : null);
      const detail = inspected?.querySelector<HTMLElement>('.boon-inspect-detail');
      if (detail && detail.offsetParent) {
        event.preventDefault();
        if (event.key === 'Home') detail.scrollTop = 0;
        else if (event.key === 'End') detail.scrollTop = detail.scrollHeight;
        else detail.scrollTop += (event.key.endsWith('Up') ? -1 : 1) * (event.key.startsWith('Page') ? detail.clientHeight * .8 : 40);
      }
    }
  }
  function onKeyUp(event: KeyboardEvent): void {
    held.delete(event.key);
    sync();
  }
  function onClick(event: MouseEvent): void {
    // Reading a revealed panel must not install the button beneath it.
    if (event.target instanceof Element && event.target.closest('.boon-inspect-detail')) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }
  function onFocusOut(event: FocusEvent): void {
    if (pinned && !pinned.contains(event.relatedTarget as Node | null)) clearPinned();
  }
  function reset(): void { clearPinned(); held.clear(); sync(); }
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('keyup', onKeyUp);
  root.addEventListener('focusout', onFocusOut);
  root.addEventListener('click', onClick, true);
  window.addEventListener('blur', reset);
  return () => {
    reset();
    delete document.body.dataset.inspect;
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('keyup', onKeyUp);
    root.removeEventListener('focusout', onFocusOut);
    root.removeEventListener('click', onClick, true);
    window.removeEventListener('blur', reset);
  };
}
