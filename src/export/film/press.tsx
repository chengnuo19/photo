import { useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import { PageFace } from '../../components/Book/Book';
import { MotionContext } from '../../components/Book/motion';
import { Caption } from '../../components/Caption/Caption';
import type { BuiltBook } from '../../data/buildPages';
import type { BookDoc } from '../../data/schema';
import { getTheme, themeStyle } from '../../themes';
import styles from './press.module.css';

export interface PressHandle {
  root(): HTMLElement | null;
  page(index: number): HTMLElement | null;
  /** The caption line of a view, or null when it has none. */
  caption(view: number): HTMLElement | null;
}

/**
 * Every page of the book, laid out at the film's page size but invisible, so each can be
 * pictured exactly as the reader draws it (same components, same theme CSS). Captions too.
 */
export function PagePress({ book, built, W, H, captionWidth, handle }: { book: BookDoc; built: BuiltBook; W: number; H: number; captionWidth: number; handle: Ref<PressHandle> }) {
  const theme = getTheme(book.themeId);
  const palette = useMemo(() => themeStyle(book), [book]);
  const root = useRef<HTMLDivElement>(null);
  const landscape = built.layout === 'landscape';

  useImperativeHandle(
    handle,
    () => ({
      root: () => root.current,
      page: (i) => root.current?.querySelector<HTMLElement>(`[data-press-page="${i}"]`) ?? null,
      // the line's box, not the caption itself: pictured alone, the caption comes out blank
      caption: (v) => {
        const el = root.current?.querySelector<HTMLElement>(`[data-press-caption="${v}"]`);
        return el && el.textContent?.trim() ? el : null;
      },
    }),
    [],
  );

  return (
    <MotionContext.Provider value={false}>
    <div ref={root} className={`${styles.press} ${theme.className}`} style={palette} aria-hidden>
      {built.pages.map((p, i) => (
        <div key={p.key} data-press-page={i} className={styles.sheet} style={{ width: W, height: H }}>
          <PageFace book={book} page={p} theme={theme} palette={palette} />
        </div>
      ))}
      {built.views.map((v, i) =>
        v.kind === 'story' && v.spread ? (
          <div key={v.key} data-press-caption={i} className={styles.line} style={{ width: captionWidth }}>
            <Caption
              spread={v.spread}
              visible
              viewKey={v.key}
              stampOnly={v.spread.layout === 'text' || (landscape && v.spread.layout === 'polaroid' && v.spread.images.length === 1)}
            />
          </div>
        ) : null,
      )}
    </div>
    </MotionContext.Provider>
  );
}
