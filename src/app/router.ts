import { useSyncExternalStore } from 'react';

export type RecordMode = 'video' | 'image';
export type Route =
  | { name: 'shelf' }
  | { name: 'new' }
  | { name: 'read'; id: string }
  | { name: 'edit'; id: string }
  | { name: 'record'; id: string; mode: RecordMode };

/** Tiny hash router: #/  ·  #/book/<id>  ·  #/book/<id>/edit  ·  #/book/<id>/record/<video|image> */
function parse(hash: string): Route {
  const m = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (m[0] === 'new') return { name: 'new' };
  if (m[0] === 'book' && m[1]) {
    if (m[2] === 'edit') return { name: 'edit', id: m[1] };
    if (m[2] === 'record') return { name: 'record', id: m[1], mode: m[3] === 'image' ? 'image' : 'video' };
    return { name: 'read', id: m[1] };
  }
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
  record: (id: string, mode: RecordMode) => `#/book/${id}/record/${mode}`,
};

export function go(to: string) {
  window.location.hash = to.replace(/^#/, '');
}
