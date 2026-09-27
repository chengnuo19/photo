import { useEffect, useMemo, useState } from 'react';
import { sampleBook } from '../data/sampleBook';
import { listThemes, loadTheme, sampleThemeId } from '../themes';
import type { BookDoc } from '../data/schema';
import { loadAssets, resolveBook } from '../storage/assets';
import { getBook } from '../storage/db';

export const SAMPLE_ID = sampleBook.id;

/** Built-in sample books (one per theme) are addressed as sample-…; they are read-only. */
export function isSampleId(id: string) {
  return id.startsWith('sample-');
}

export function sampleById(id: string): BookDoc | undefined {
  if (id === SAMPLE_ID) return sampleBook;
  for (const t of listThemes()) {
    const s = t.sample();
    if (s.id === id) return s;
  }
  return undefined;
}

type Status = 'loading' | 'ready' | 'missing';

/** Load a stored book (or the built-in sample) with its assets ready to display. */
export function useLoadedBook(id: string) {
  const [doc, setDoc] = useState<BookDoc | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [assetsVersion, setAssetsVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    (async () => {
      if (isSampleId(id)) {
        await loadTheme(sampleThemeId(id)).catch(() => undefined);
        const s = sampleById(id);
        if (alive) {
          setDoc(s ?? null);
          setStatus(s ? 'ready' : 'missing');
        }
        return;
      }
      const stored = await getBook(id);
      if (!alive) return;
      if (!stored) {
        setStatus('missing');
        return;
      }
      await Promise.all([loadAssets(stored.doc), loadTheme(stored.doc.themeId).catch(() => undefined)]);
      if (!alive) return;
      setDoc(stored.doc);
      setAssetsVersion((v) => v + 1);
      setStatus('ready');
    })().catch(() => alive && setStatus('missing'));
    return () => {
      alive = false;
    };
  }, [id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolved = useMemo(() => (doc ? resolveBook(doc) : null), [doc, assetsVersion]);
  return { doc, setDoc, resolved, status };
}
