import { useEffect } from 'react';

/**
 * Image preloading with decode(), so a page never appears half-loaded mid-flip.
 * Decoded images are held here to keep them in the memory cache.
 */
const decoded = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<void>>();

export function isDecoded(src: string) {
  return decoded.has(src);
}

export function preloadImage(src: string): Promise<void> {
  if (decoded.has(src)) return Promise.resolve();
  const existing = pending.get(src);
  if (existing) return existing;

  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  const p = img
    .decode()
    .then(() => {
      decoded.set(src, img);
    })
    .catch(() => {
      /* PageImage shows its own error state */
    })
    .finally(() => pending.delete(src));
  pending.set(src, p);
  return p;
}

/**
 * Preload `priority` sources immediately (in order), then the rest when the browser is idle.
 */
export function usePreload(priority: string[], rest: string[]) {
  const key = priority.join('|') + '#' + rest.join('|');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const src of priority) {
        if (cancelled) return;
        await preloadImage(src);
      }
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      for (const src of rest) {
        if (cancelled) return;
        await new Promise<void>((r) => (idle ? idle(() => r()) : setTimeout(r, 50)));
        await preloadImage(src);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
