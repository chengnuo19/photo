/* 回忆绘本 · service worker
 *
 * Makes the site open instantly (and work offline) after the first visit — the connection to
 * the host can be very slow and drop out. Built into dist/sw.js by scripts/vite-sw.mjs, which
 * puts `self.MB_FILES` ({ path: content hash } for every file of the build) and
 * `self.MB_PRECACHE` (the app itself: page, scripts, styles) in front of this file.
 *
 *   index.html     network first; after 3 s (or offline) the copy from last time
 *   files we know  from the cache, else the network (then cached) — keyed by content hash, so a
 *                  changed file is fetched again and an unchanged one never is
 *   anything else  straight to the network (other sites, a newer deploy's files, audio ranges)
 */
/* global self, caches, fetch, Response, URL */
const FILES = self.MB_FILES;
const PRECACHE = self.MB_PRECACHE;
const VERSION = self.MB_VERSION;

const CACHE = 'mb-files';
const PAGES = 'mb-pages';
const META = 'mb-meta';
const scope = new URL(self.registration.scope);

const urlOf = (path) => new URL(encodeURI(path), scope).href;
const keyOf = (path, hash) => `${urlOf(path)}?v=${hash}`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await prune();
      await self.clients.claim();
    })(),
  );
});

/** The file's path within the site (`assets/x.js`), or null for other sites. */
function pathOf(href) {
  const url = new URL(href);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return null;
  try {
    return decodeURIComponent(url.pathname.slice(scope.pathname.length));
  } catch {
    return null;
  }
}
const known = (path) => path !== null && Object.prototype.hasOwnProperty.call(FILES, path);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  let path = pathOf(req.url);
  if (path === null) return;
  if (req.mode === 'navigate') {
    if (path === '' || path.endsWith('/')) path += 'index.html';
    if (path.endsWith('.html')) event.respondWith(page(req, path));
    return;
  }
  // (a query such as the image retry counter still means the same file)
  if (known(path)) event.respondWith(file(req, path));
});

// The first visit loads fonts and pictures before this worker is in charge: the page sends
// their addresses once it is, and they are stored (usually straight from the browser's cache).
self.addEventListener('message', (event) => {
  if (event.data?.type === 'seen' && Array.isArray(event.data.urls)) event.waitUntil(keepSeen(event.data.urls));
});

async function keepSeen(urls) {
  const cache = await caches.open(CACHE);
  for (const href of new Set(urls)) {
    const path = pathOf(href);
    if (!known(path)) continue;
    const key = keyOf(path, FILES[path]);
    if (await cache.match(key)) continue;
    try {
      const res = await fetch(urlOf(path));
      if (res.ok) await cache.put(key, res);
    } catch {
      /* next time it is used */
    }
  }
}

/** The app itself, a few files at a time; a file that fails now is fetched when first used. */
async function precache() {
  const cache = await caches.open(CACHE);
  const todo = PRECACHE.filter((p) => p !== 'index.html');
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const path = todo[next++];
      const key = keyOf(path, FILES[path]);
      if (await cache.match(key)) continue;
      try {
        const res = await fetch(urlOf(path), { cache: 'no-cache' });
        if (res.ok) await cache.put(key, res);
      } catch {
        /* offline or flaky: later */
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  try {
    const pages = await caches.open(PAGES);
    if (!(await pages.match(urlOf('index.html')))) {
      const res = await fetch(urlOf('index.html'), { cache: 'no-cache' });
      if (res.ok) await pages.put(urlOf('index.html'), res);
    }
  } catch {
    /* the first navigation stores it */
  }
}

/**
 * Drop files no longer part of the site. The previous version's files stay one more round:
 * a tab opened before this update may still ask for them, and they are gone from the host.
 */
async function prune() {
  const meta = await caches.open(META);
  const stored = await meta.match('current').then((r) => (r ? r.json() : null)).catch(() => null);
  const previous = stored && stored.version !== VERSION ? stored.files : (await meta.match('previous').then((r) => (r ? r.json() : null)).catch(() => null))?.files;
  const keep = new Set();
  for (const [p, h] of Object.entries(FILES)) keep.add(keyOf(p, h));
  for (const [p, h] of Object.entries(previous ?? {})) keep.add(keyOf(p, h));

  const cache = await caches.open(CACHE);
  for (const req of await cache.keys()) if (!keep.has(req.url)) await cache.delete(req);
  for (const name of await caches.keys()) if (![CACHE, PAGES, META].includes(name)) await caches.delete(name);

  if (stored && stored.version !== VERSION) await meta.put('previous', new Response(JSON.stringify(stored)));
  await meta.put('current', new Response(JSON.stringify({ version: VERSION, files: FILES })));
}

async function page(req, path) {
  const cache = await caches.open(PAGES);
  const key = urlOf(path);
  const cached = await cache.match(key);
  const net = fetch(req).then((res) => {
    if (res.ok && res.type === 'basic') cache.put(key, res.clone()).catch(() => undefined);
    return res.ok || !cached ? res : cached;
  });
  if (!cached) return net;
  // a slow or broken connection should not keep the book shut
  const late = new Promise((r) => setTimeout(() => r(cached), 3000));
  return Promise.race([net.catch(() => cached), late]);
}

async function file(req, path) {
  const cache = await caches.open(CACHE);
  const key = keyOf(path, FILES[path]);
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = await fetch(req);
  // storage full or private mode: still serve the file
  if (res.ok && res.type === 'basic') cache.put(key, res.clone()).catch(() => undefined);
  return res;
}
