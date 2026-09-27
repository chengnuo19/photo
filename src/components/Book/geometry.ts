import { FORWARD } from './PageFlipView';

/**
 * Where the book "is" on the table for a given resting page.
 *
 * Landscape: the closed front cover sits on the right half of the spread area, the closed
 * back cover on the left half. We shift the whole book so whatever is visible stays centred,
 * and scale the paper block under each half so no bare base shows where there is no page.
 */
export interface Rest {
  /** Visible fraction of the left / right half (0 or 1 at rest). */
  l: number;
  r: number;
  /** Horizontal shift in px. */
  shift: number;
}

export function restFor(index: number, last: number, landscape: boolean, pageWidth: number): Rest {
  if (!landscape) return { l: 0, r: 1, shift: 0 };
  if (index <= 0) return { l: 0, r: 1, shift: -pageWidth / 2 };
  if (index >= last) return { l: 1, r: 0, shift: pageWidth / 2 };
  return { l: 1, r: 1, shift: 0 };
}

export function targetIndex(index: number, last: number, landscape: boolean, direction: number) {
  if (!landscape) return Math.max(0, Math.min(last, index + (direction === FORWARD ? 1 : -1)));
  if (direction === FORWARD) return index === 0 ? 1 : Math.min(last, index + 2);
  if (index >= last) return last - 2;
  return Math.max(0, index - 2);
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Interpolate between two rests at flip progress t (0..1).
 * A half that appears/disappears follows the projection of a board rotating about the
 * spine (|cos|), which matches how the hard cover actually covers the table.
 */
export function between(a: Rest, b: Rest, t: number): Rest {
  const half = (from: number, to: number) => {
    if (from === to) return from;
    const c = Math.cos(Math.PI * t);
    return from > to ? Math.max(0, c) : Math.max(0, -c);
  };
  return {
    l: half(a.l, b.l),
    r: half(a.r, b.r),
    shift: a.shift + (b.shift - a.shift) * smooth(Math.min(1, Math.max(0, t))),
  };
}

/** Number of edge lines to draw for a stack of `pages` leaves (subtle, capped). */
export function edgeLines(pages: number) {
  if (pages <= 0) return 0;
  return Math.min(5, 1 + Math.floor(pages / 4));
}
