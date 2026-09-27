import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type Ref } from 'react';
import { buildPages, viewPreviewImage, type BuiltBook, type PageSpec } from '../../data/buildPages';
import type { BookDoc } from '../../data/schema';
import { acceptsInput, useBookMachine } from '../../hooks/useBookMachine';
import { useBookSize } from '../../hooks/useBookSize';
import { useFlipSound } from '../../hooks/useFlipSound';
import { usePreload } from '../../hooks/usePreload';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { activeDecor, getTheme, themeStyle } from '../../themes';
import { ThemeContext } from '../../themes/context';
import { Caption } from '../Caption/Caption';
import { useEdit } from '../Editor/EditContext';
import { PhotoPreview } from '../PhotoPreview/PhotoPreview';
import { between, edgeLines, restFor, targetIndex, type Rest } from './geometry';
import { DecorLayer, StickerLayer } from './Layers';
import { PageFlipView, type EngineState, type PageFlipHandle } from './PageFlipView';
import styles from './Book.module.css';

export interface BookHandle {
  goToView(view: number): void;
  next(): void;
  prev(): void;
  /** Number of views (cover, each spread, back cover…) in the current layout. */
  viewCount(): number;
}

interface Props {
  book: BookDoc;
  /** Extra space kept free under the book (the editor's page strip). */
  reserveBottom?: number;
  handle?: Ref<BookHandle>;
  onView?: (view: number, built: BuiltBook) => void;
  /** Called when the reader opens the book (first page turn from the cover). */
  onOpen?: () => void;
  /** A view the reader stopped at last time: offers "continue where you left off" on the closed book. */
  resumeView?: number;
  /** Being recorded (video / long image): no hints, buttons or next-page polaroid on the table. */
  recording?: boolean;
}

export function Book({ book, reserveBottom = 0, handle, onView, onOpen, resumeView, recording }: Props) {
  const theme = getTheme(book.themeId);
  const editing = !!useEdit();
  const { layout, pageWidth: W, pageHeight: H } = useBookSize(reserveBottom);
  const landscape = layout === 'landscape';
  const reduced = useReducedMotion();
  const flippingTime = reduced ? 420 : 950;

  const built = useMemo(() => buildPages(book, layout), [book, layout]);
  const last = built.pages.length - 1;

  // Keep the reader's place when the layout switches (landscape ⇄ portrait).
  const viewRef = useRef(0);
  const startIndex = useMemo(() => firstPageOfView(built, viewRef.current), [built]);

  const [m, dispatch] = useBookMachine(startIndex, last, landscape);
  useLayoutEffect(() => {
    dispatch({ type: 'reset', index: startIndex, last });
  }, [built, startIndex, last, dispatch]);

  const flipRef = useRef<PageFlipHandle>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const halfRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Live values for engine callbacks (they fire outside React's render cycle).
  const live = useRef({ index: startIndex, last, landscape, W, direction: 0, engine: 'read' as EngineState });
  live.current.last = last;
  live.current.landscape = landscape;
  live.current.W = W;

  /* ---------------------------------------------------------------- table geometry */
  const applyRest = useCallback((r: Rest) => {
    const mover = moverRef.current;
    if (mover) mover.style.transform = `translate3d(${r.shift.toFixed(2)}px,0,0)`;
    const [shL, shR, bL, bR] = halfRefs.current;
    const sx = (el: HTMLDivElement | null, v: number) => {
      if (el) el.style.transform = `scaleX(${v.toFixed(4)})`;
    };
    sx(shL, r.l);
    sx(bL, r.l);
    sx(shR, r.r);
    sx(bR, r.r);
  }, []);

  const settle = useCallback(() => {
    const l = live.current;
    applyRest(restFor(l.index, l.last, l.landscape, l.W));
  }, [applyRest]);

  useLayoutEffect(settle, [settle, W, H, layout, built]);

  /* ---------------------------------------------------------------- engine events */
  const playFlip = useFlipSound(theme, book.sound.flip && !reduced);

  const onViewRef = useRef(onView);
  onViewRef.current = onView;
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  const onFlip = useCallback(
    (index: number) => {
      live.current.index = index;
      viewRef.current = built.pages[index]?.view ?? 0;
      dispatch({ type: 'flip', index });
      onViewRef.current?.(viewRef.current, built);
    },
    [built, dispatch],
  );

  const onState = useCallback(
    (state: EngineState, direction: number | null) => {
      const l = live.current;
      const prev = l.engine;
      l.engine = state;
      if (direction !== null) l.direction = direction;
      dispatch({ type: 'engine', state, direction });

      if (state === 'read') settle();
      if ((state === 'flipping' || state === 'user_fold') && prev !== 'flipping' && prev !== 'user_fold') {
        if (l.index === 0) onOpenRef.current?.();
        const t = direction === null ? l.index : targetIndex(l.index, l.last, l.landscape, direction);
        const board = l.index === 0 || l.index === l.last || t === 0 || t === l.last;
        playFlip(board ? 'board' : 'page');
      }
    },
    [dispatch, settle, playFlip],
  );

  const onProgress = useCallback(
    (progress: number, direction: number) => {
      const l = live.current;
      const from = restFor(l.index, l.last, l.landscape, l.W);
      const to = restFor(targetIndex(l.index, l.last, l.landscape, direction), l.last, l.landscape, l.W);
      applyRest(between(from, to, progress / 100));
    },
    [applyRest],
  );

  /* ---------------------------------------------------------------- navigation */
  const phaseRef = useRef(m.phase);
  phaseRef.current = m.phase;

  const next = useCallback(() => {
    if (!acceptsInput(phaseRef.current)) return;
    if (live.current.index >= live.current.last) return;
    flipRef.current?.next();
  }, []);
  const prev = useCallback(() => {
    if (!acceptsInput(phaseRef.current)) return;
    if (live.current.index <= 0) return;
    flipRef.current?.prev();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // "Read again": fade the closed book, turn it over, fade back in.
  const [turningOver, setTurningOver] = useState(false);
  const readAgain = useCallback(() => {
    if (phaseRef.current !== 'ended') return;
    setTurningOver(true);
    window.setTimeout(() => {
      flipRef.current?.jump(0);
      dispatch({ type: 'reset', index: 0, last: live.current.last });
      settle();
      window.setTimeout(() => setTurningOver(false), 60);
    }, reduced ? 50 : 420);
  }, [reduced, dispatch, settle]);

  const jumpToView = useCallback(
    (v: number) => {
      const i = firstPageOfView(built, v);
      flipRef.current?.jump(i);
      live.current.index = i;
      viewRef.current = built.pages[i]?.view ?? 0;
      dispatch({ type: 'reset', index: i, last: live.current.last });
      settle();
    },
    [built, dispatch, settle],
  );

  // "Continue where you left off": the same fade as "read again", landing on the saved view.
  const resume = useCallback(() => {
    if (phaseRef.current !== 'closed' || !resumeView) return;
    onOpenRef.current?.();
    setTurningOver(true);
    window.setTimeout(() => {
      jumpToView(resumeView);
      onViewRef.current?.(viewRef.current, built);
      window.setTimeout(() => setTurningOver(false), 60);
    }, reduced ? 50 : 420);
  }, [resumeView, reduced, jumpToView, built]);

  useImperativeHandle(
    handle,
    () => ({
      goToView: jumpToView,
      next,
      prev,
      viewCount: () => built.views.length,
    }),
    [jumpToView, next, prev, built],
  );

  /* ---------------------------------------------------------------- preload */
  const view = built.views[built.pages[m.index]?.view ?? 0];
  const viewIdx = built.pages[m.index]?.view ?? 0;
  const { priority, rest } = useMemo(() => preloadPlan(built, viewIdx), [built, viewIdx]);
  usePreload(priority, rest);

  /* ---------------------------------------------------------------- render */
  const palette = useMemo(() => themeStyle(book), [book]);
  const renderPage = useCallback(
    (p: PageSpec) => {
      const Page = theme.pages[p.kind];
      const pf = theme.photoFilter;
      const fx = pf && book.photoFilter !== false && p.spread?.overrides?.filter !== false ? pf : undefined;
      return (
        <ThemeContext.Provider value={theme}>
          <div
            className={`${styles.page} ${theme.className}`}
            data-side={p.side}
            data-hard={p.hard || undefined}
            data-decor={p.spread ? activeDecor(theme, p.spread)?.id : undefined}
            data-fx={fx ? fx.overlay ?? 'none' : undefined}
            style={fx ? { ...palette, ['--mb-filter' as string]: fx.css } : palette}
          >
            <Page book={book} page={p} />
            {p.spread && <DecorLayer page={p} />}
            {p.spread && <StickerLayer page={p} />}
            {!p.hard && <div className={styles.gutter} aria-hidden />}
          </div>
        </ThemeContext.Provider>
      );
    },
    [book, theme, palette],
  );

  const reading = m.phase === 'reading';
  const storySpread = view?.kind === 'story' ? view.spread : undefined;
  const nextView = built.views[viewIdx + 1];
  const preview = view?.spread?.snapshot ?? viewPreviewImage(nextView);

  const leftLeaves = landscape ? m.index : 0;
  const rightLeaves = last - m.index - (landscape ? 1 : 0);

  return (
    <div
      className={`${styles.stage} ${theme.className}`}
      data-phase={m.phase}
      data-layout={layout}
      data-turning={turningOver || undefined}
      data-editing={editing || undefined}
      data-recording={recording || undefined}
      style={{ ...palette, ['--reserve' as string]: `${reserveBottom}px` }}
    >
      <div
        className={styles.bookArea}
        style={{ width: landscape ? W * 2 : W, height: H }}
        aria-roledescription="book"
        aria-label={`${book.meta.title}`}
      >
        <div ref={moverRef} className={styles.mover}>
          {landscape && (
            <>
              <div ref={(el) => void (halfRefs.current[0] = el)} className={`${styles.ambient} ${styles.left}`} style={{ width: W }} />
              <div ref={(el) => void (halfRefs.current[1] = el)} className={`${styles.ambient} ${styles.right}`} style={{ width: W, left: W }} />
              <div
                ref={(el) => void (halfRefs.current[2] = el)}
                className={`${styles.block} ${styles.left}`}
                style={{ width: W, boxShadow: edgeStack(edgeLines(leftLeaves), -1) }}
              />
              <div
                ref={(el) => void (halfRefs.current[3] = el)}
                className={`${styles.block} ${styles.right}`}
                style={{ width: W, left: W, boxShadow: edgeStack(edgeLines(rightLeaves), 1) }}
              />
            </>
          )}
          {!landscape && (
            <>
              <div className={styles.ambient} style={{ width: W }} />
              <div className={styles.block} style={{ width: W, boxShadow: edgeStack(edgeLines(rightLeaves), 1) }} />
            </>
          )}
          <PageFlipView
            ref={flipRef}
            pages={built.pages}
            layout={layout}
            pageWidth={W}
            pageHeight={H}
            startIndex={startIndex}
            flippingTime={flippingTime}
            showCorners={!reduced && !recording}
            interactive={!editing}
            renderPage={renderPage}
            onFlip={onFlip}
            onState={onState}
            onProgress={onProgress}
          />
        </div>

        <Caption
          spread={storySpread}
          visible={reading}
          viewKey={view?.key}
          // a polaroid spread with one photo already writes its caption on the facing page
          stampOnly={
            storySpread?.layout === 'text' || (landscape && storySpread?.layout === 'polaroid' && storySpread.images.length === 1)
          }
        />

        <PhotoPreview
          image={reading && !recording ? preview : undefined}
          onClick={next}
          label="翻到下一页"
          snapshotOf={editing && reading ? storySpread : undefined}
        />

        <div className={styles.hint} data-show={m.phase === 'closed' || undefined}>
          轻点封面，打开这本书
        </div>
        {!!resumeView && resumeView < built.views.length - 1 && (
          <button type="button" className={styles.resume} data-show={(m.phase === 'closed' && !turningOver) || undefined} onClick={resume}>
            接着上次读下去 →
          </button>
        )}
        <button type="button" className={styles.again} data-show={m.phase === 'ended' || undefined} onClick={readAgain}>
          再读一遍
        </button>
      </div>

      {/* Screen-reader status */}
      <p className="visually-hidden" aria-live="polite">
        {statusText(m.phase, view?.kind, view?.spread?.caption)}
      </p>
    </div>
  );
}

function firstPageOfView(built: BuiltBook, view: number) {
  const i = built.pages.findIndex((p) => p.view === view);
  return i < 0 ? 0 : built.layout === 'landscape' && i > 0 && built.pages[i].side === 'right' ? i - 1 : i;
}

function preloadPlan(built: BuiltBook, viewIdx: number) {
  const srcOf = (v: number) =>
    (built.views[v]?.spread?.images ?? []).flatMap((im) => [im.src, ...(im.thumb ? [im.thumb] : [])]);
  const priority = [viewIdx, viewIdx + 1, viewIdx + 2, viewIdx - 1].flatMap(srcOf);
  const all = built.views.flatMap((_, i) => srcOf(i));
  return { priority, rest: all.filter((s) => !priority.includes(s)) };
}

/** Stacked page edges peeking out from under the pages (left or right side). */
function edgeStack(lines: number, dir: -1 | 1) {
  if (!lines) return 'none';
  const diagonal: string[] = [];
  const under: string[] = [];
  for (let i = 1; i <= lines; i++) {
    const c = i % 2 ? 'var(--paper-edge)' : 'var(--paper)';
    diagonal.push(`${(dir * i * 1.4).toFixed(1)}px ${(i * 1.1).toFixed(1)}px 0 ${c}`);
    // straight-down copies fill the notch the diagonal ones would leave at the spine
    under.push(`0 ${(i * 1.1).toFixed(1)}px 0 ${c}`);
  }
  return [...diagonal, ...under].join(', ');
}

function statusText(phase: string, kind?: string, caption?: string) {
  if (phase === 'closed') return '书是合上的。按右方向键或点击封面打开。';
  if (phase === 'ended') return '书已合上。';
  if (phase !== 'reading') return '';
  if (kind === 'story' && caption) return caption;
  return '';
}
