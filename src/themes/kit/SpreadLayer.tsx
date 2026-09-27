import type { ReactNode } from 'react';
import type { LayerPart } from '../../data/buildPages';
import s from './kit.module.css';

/**
 * A layer as wide as the whole spread, positioned so this page shows its part of it.
 * Anything placed in spread coordinates (stickers, collage prints) therefore lines up across
 * the spine and turns with whichever page it sits on.
 */
export function SpreadLayer({ part = 'full', children, className }: { part?: LayerPart; children: ReactNode; className?: string }) {
  return (
    <div className={`${s.layer} ${className ?? ''}`} data-part={part}>
      {children}
    </div>
  );
}
