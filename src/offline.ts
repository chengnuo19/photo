/**
 * Register the service worker (see src/sw/service-worker.js): after the first visit the app,
 * its fonts and the pictures already seen open from this device, even with no connection.
 * Waits until the page has loaded so the first visit's pictures get the bandwidth first.
 */
export function registerOffline() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  // remember every file of this visit (fonts come in dozens of slices), see tellWorker
  performance.setResourceTimingBufferSize?.(2000);
  const base = import.meta.env.BASE_URL;
  const go = () =>
    window.setTimeout(() => {
      navigator.serviceWorker.register(`${base}sw.js`, { scope: base, updateViaCache: 'none' }).catch(() => undefined);
    }, 2500);
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });

  // Files loaded before the worker took charge (the first visit) were not stored: name them.
  const tellWorker = () => {
    const urls = performance.getEntriesByType('resource').map((e) => e.name);
    navigator.serviceWorker.controller?.postMessage({ type: 'seen', urls });
  };
  navigator.serviceWorker.addEventListener('controllerchange', tellWorker);
}
