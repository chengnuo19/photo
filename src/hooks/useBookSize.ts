import { useEffect, useRef, useState } from 'react';
import type { Layout } from '../data/buildPages';

/** Width / height of one page. Close to the reference picture book (≈ 5:6). */
export const PAGE_RATIO = 0.82;

export interface BookSize {
  layout: Layout;
  pageWidth: number;
  pageHeight: number;
}

const even = (n: number) => Math.round(n / 2) * 2;

/**
 * Fit the book to the viewport.
 *
 * Landscape keeps room above for the masthead and below for the caption, and never lets
 * the spread exceed ~80% of the width (the reference leaves generous air around the book).
 * Narrow or tall screens switch to single-page reading.
 */
export function computeBookSize(vw: number, vh: number, reserveBottom = 0): BookSize {
  vh -= reserveBottom;
  const portrait = vw < 720 || vw / vh < 0.95;

  if (!portrait) {
    const top = Math.max(56, vh * 0.075);
    const bottom = Math.max(84, vh * 0.1);
    const maxH = vh - top - bottom;
    const maxSpreadW = Math.min(vw * 0.8, vw - 2 * 64);
    let h = Math.min(maxH, maxSpreadW / 2 / PAGE_RATIO, 860);
    h = Math.max(h, 320);
    return { layout: 'landscape', pageHeight: even(h), pageWidth: even(h * PAGE_RATIO) };
  }

  const maxW = Math.min(vw - 40, 560);
  const maxH = vh - Math.max(120, vh * 0.2);
  let w = Math.min(maxW, maxH * PAGE_RATIO);
  w = Math.max(w, 240);
  return { layout: 'portrait', pageWidth: even(w), pageHeight: even(w / PAGE_RATIO) };
}

export function useBookSize(reserveBottom = 0): BookSize {
  const [size, setSize] = useState(() => computeBookSize(window.innerWidth, window.innerHeight, reserveBottom));

  const reserveRef = useRef(reserveBottom);
  reserveRef.current = reserveBottom;

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = computeBookSize(window.innerWidth, window.innerHeight, reserveRef.current);
        setSize((prev) =>
          prev.layout === next.layout && prev.pageWidth === next.pageWidth && prev.pageHeight === next.pageHeight
            ? prev
            : next,
        );
      });
    };
    onResize();
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, [reserveBottom]);

  return size;
}
