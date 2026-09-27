import { useSyncExternalStore } from 'react';

export type Route = { name: 'shelf' } | { name: 'new' } | { name: 'read'; id: string } | { name: 'edit'; id: string };

/** Tiny hash router: #/  ·  #/book/<id>  ·  #/book/<id>/edit */
function parse(hash: string): Route {
  const m = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (m[0] === 'new') return { name: 'new' };
  if (m[0] === 'book' && m[1]) return m[2] === 'edit' ? { name: 'edit', id: m[1] } : { name: 'read', id: m[1] };
  return { name: 'shelf' };
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  return parse(hash);
}

export const href = {
  shelf: () => '#/',
  gallery: () => '#/new',
  read: (id: string) => `#/book/${id}`,
  edit: (id: string) => `#/book/${id}/edit`,
};

export function go(to: string) {
  window.location.hash = to.replace(/^#/, '');
}
