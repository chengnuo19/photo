import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { PageFlip } from '../../vendor/page-flip/PageFlip';
import type { Layout, PageSpec } from '../../data/buildPages';
import styles from './PageFlipView.module.css';

export type EngineState = 'user_fold' | 'fold_corner' | 'flipping' | 'read';
/** Matches the engine's FlipDirection enum. */
export const FORWARD = 0;
export const BACK = 1;

export interface PageFlipHandle {
  next(): void;
  prev(): void;
  /** Jump without animation. */
  jump(index: number): void;
  index(): number;
  count(): number;
  engineState(): EngineState;
}

interface Props {
  pages: PageSpec[];
  layout: Layout;
  pageWidth: number;
  pageHeight: number;
  startIndex: number;
  flippingTime: number;
  showCorners: boolean;
  /** Mouse/touch page turning. Off in the editor so page content can be clicked. */
  interactive: boolean;
  renderPage: (page: PageSpec, index: number) => ReactNode;
  onFlip: (index: number) => void;
  onState: (state: EngineState, direction: number | null) => void;
  onProgress: (progress: number, direction: number) => void;
}

/**
 * React wrapper around the (vendored) StPageFlip engine.
 *
 * The engine owns and moves the page elements, so React never renders them directly:
 * we create one plain <div> per page, hand those to the engine, and render each page's
 * content into its div through a portal. The engine is rebuilt only when the page
 * structure or layout changes; size changes are applied in place.
 */
export const PageFlipView = forwardRef<PageFlipHandle, Props>(function PageFlipView(props, ref) {
  const { pages, layout, pageWidth, pageHeight, startIndex, flippingTime, showCorners } = props;

  const hostRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [slots, setSlots] = useState<HTMLElement[]>([]);

  // Latest callbacks without re-subscribing.
  const cb = useRef(props);
  cb.current = props;

  // Size is read at build time from a ref so resizes don't trigger rebuilds.
  const size = useRef({ pageWidth, pageHeight, startIndex });
  size.current = { pageWidth, pageHeight, startIndex };

  const structureKey = layout + '|' + (props.interactive ? 'i' : 'e') + '|' + pages.map((p) => p.key + (p.hard ? '*' : '')).join(',');

  useLayoutEffect(() => {
    const host = hostRef.current!;
    const { pageWidth: w, pageHeight: h, startIndex: start } = size.current;

    const root = document.createElement('div');
    root.className = styles.root;
    sizeRoot(root, layout, w, h);
    host.appendChild(root);
    rootRef.current = root;

    const els = pages.map((p) => {
      const el = document.createElement('div');
      el.className = styles.page;
      if (p.hard) el.dataset.density = 'hard';
      el.dataset.kind = p.kind;
      return el;
    });
    setSlots(els);

    const flip = new PageFlip(root, {
      width: w,
      height: h,
      size: 'fixed',
      autoSize: false,
      showCover: true,
      usePortrait: layout === 'portrait',
      drawShadow: true,
      maxShadowOpacity: 0.55,
      flippingTime: cb.current.flippingTime,
      showPageCorners: cb.current.showCorners && cb.current.interactive,
      useMouseEvents: cb.current.interactive,
      mobileScrollSupport: false,
      swipeDistance: 24,
      startPage: Math.min(Math.max(0, start), pages.length - 1),
      startZIndex: 2,
    } as never);

    flip.on('flip', (e) => cb.current.onFlip(e.data as number));
    flip.on('changeState', (e) => {
      const dir = flip.getRender().getDirection() as number | null;
      cb.current.onState(e.data as EngineState, dir);
    });
    flip.on('flipProgress', (e) => {
      const d = e.data as { progress: number; direction: number };
      cb.current.onProgress(d.progress, d.direction);
    });

    flip.loadFromHTML(els);
    flipRef.current = flip;
    cb.current.onFlip(flip.getCurrentPageIndex());

    return () => {
      flipRef.current = null;
      rootRef.current = null;
      flip.destroy(); // removes root + page elements; portals unmount on the next render
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureKey]);

  // In-place resize.
  useLayoutEffect(() => {
    const flip = flipRef.current;
    const root = rootRef.current;
    if (!flip || !root) return;
    const s = flip.getSettings();
    if (s.width === pageWidth && s.height === pageHeight) return;
    sizeRoot(root, layout, pageWidth, pageHeight);
    flip.setPageSize(pageWidth, pageHeight);
  }, [pageWidth, pageHeight, layout]);

  // Timing / corner settings can change live (e.g. reduced motion).
  useLayoutEffect(() => {
    const flip = flipRef.current;
    if (!flip) return;
    const s = flip.getSettings();
    s.flippingTime = flippingTime;
    s.showPageCorners = showCorners && props.interactive;
  }, [flippingTime, showCorners]);

  useImperativeHandle(
    ref,
    () => ({
      next: () => flipRef.current?.flipNext('top' as never),
      prev: () => flipRef.current?.flipPrev('top' as never),
      jump: (i) => flipRef.current?.turnToPage(i),
      index: () => flipRef.current?.getCurrentPageIndex() ?? 0,
      count: () => flipRef.current?.getPageCount() ?? pages.length,
      engineState: () => (flipRef.current?.getState() as EngineState) ?? 'read',
    }),
    [pages.length],
  );

  return (
    <div ref={hostRef} className={styles.host}>
      {slots.length === pages.length &&
        pages.map((p, i) => createPortal(props.renderPage(p, i), slots[i], p.key))}
    </div>
  );
});

function sizeRoot(root: HTMLElement, layout: Layout, w: number, h: number) {
  const width = `${layout === 'landscape' ? w * 2 : w}px`;
  // The engine writes min-width/min-height on the root at construction; keep them in sync.
  root.style.width = root.style.minWidth = width;
  root.style.height = root.style.minHeight = `${h}px`;
}
