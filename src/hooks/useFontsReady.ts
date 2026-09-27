import { useEffect, useState } from 'react';
import type { BookDoc } from '../data/schema';
import { ensureFonts } from '../themes/fonts';

/** Text that appears on the first screens — enough to pull in the right font slices. */
export function fontSample(book?: BookDoc) {
  if (!book) return '回忆绘本书架';
  const m = book.meta;
  return [m.kicker, m.title, m.subtitle, ...m.coverLines, ...m.closingLines, '轻点封面打开这本书'].join('');
}

/**
 * Wait (briefly) for the fonts the book actually uses, so the first thing the reader sees
 * is correctly typeset paper rather than a fallback-font flash.
 */
export function useFontsReady(sample: string, families: string[] = [], themeId?: string) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    const timer = window.setTimeout(finish, 1800);
    ensureFonts(families, themeId)
      .then(() =>
        Promise.all([
          document.fonts.load(`400 16px "Noto Serif SC"`, sample),
          document.fonts.load(`600 16px "Noto Serif SC"`, sample),
          document.fonts.load(`16px "LXGW WenKai"`, sample),
          ...families.map((f) => document.fonts.load(`16px "${f}"`, sample)),
        ]),
      )
      .catch(() => undefined)
      .then(finish);
    return () => window.clearTimeout(timer);
  }, [sample, families.join('|'), themeId]); // eslint-disable-line react-hooks/exhaustive-deps
  return ready;
}
