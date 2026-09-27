import type { ReactElement } from 'react';
import type { SpreadLayout } from '../../data/schema';

/** Tiny diagram of a spread layout (two pages side by side), 36×22. */
export function LayoutIcon({ layout }: { layout: SpreadLayout }) {
  const r = (x: number, y: number, w: number, h: number, k: number, rot = 0) => (
    <rect key={k} x={x} y={y} width={w} height={h} fill="currentColor" opacity={0.55} transform={rot ? `rotate(${rot} ${x + w / 2} ${y + h / 2})` : undefined} />
  );
  const line = (x: number, y: number, w: number, k: number) => <rect key={k} x={x} y={y} width={w} height={1.2} fill="currentColor" opacity={0.45} />;
  const shapes: Record<SpreadLayout, ReactElement[]> = {
    'full-spread': [r(1, 1, 34, 20, 0)],
    'two-pages': [r(1, 1, 16, 20, 0), r(19, 1, 16, 20, 1)],
    polaroid: [r(4, 4, 10, 11, 0, -6), line(22, 8, 9, 1), line(22, 11, 7, 2)],
    'photo-text': [r(3, 4, 12, 14, 0), line(21, 6, 8, 1), line(21, 10, 11, 2), line(21, 13, 11, 3), line(21, 16, 8, 4)],
    'hero-small': [r(1, 1, 16, 20, 0), r(21, 3, 12, 7, 1), r(21, 12, 12, 7, 2)],
    grid: [r(3, 3, 12, 7, 0), r(3, 12, 12, 7, 1), r(21, 3, 12, 7, 2), r(21, 12, 12, 7, 3)],
    collage: [r(3, 3, 9, 8, 0, -8), r(8, 11, 8, 8, 1, 6), r(21, 3, 8, 8, 2, 5), r(25, 11, 8, 8, 3, -6)],
    text: [line(4, 10, 10, 0), line(5, 12.5, 8, 1), line(21, 6, 10, 2), line(21, 10, 11, 3), line(21, 13, 11, 4), line(21, 16, 7, 5)],
  };
  return (
    <svg width="36" height="22" viewBox="0 0 36 22" aria-hidden>
      <rect x="0.5" y="0.5" width="35" height="21" fill="none" stroke="currentColor" strokeOpacity="0.4" />
      <line x1="18" y1="0.5" x2="18" y2="21.5" stroke="currentColor" strokeOpacity="0.3" />
      {shapes[layout]}
    </svg>
  );
}
