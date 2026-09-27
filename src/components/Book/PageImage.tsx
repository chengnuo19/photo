import { useState } from 'react';
import type { BookImage } from '../../data/schema';
import { isDecoded } from '../../hooks/usePreload';
import styles from './PageImage.module.css';

interface Props {
  image: BookImage;
  /** Show only one half of a spread-wide image. */
  half?: 'left' | 'right';
  /** Decorative duplicate (e.g. the right half) — hidden from assistive tech. */
  decorative?: boolean;
  className?: string;
}

/**
 * Image that fills its box without stretching (cover + focal point),
 * with a quiet paper placeholder while loading and a pencilled note if it fails.
 */
export function PageImage({ image, half, decorative, className }: Props) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(() =>
    isDecoded(image.src) ? 'ready' : 'loading',
  );
  const [src, setSrc] = useState(image.src);
  if (src !== image.src) {
    setSrc(image.src);
    setState(isDecoded(image.src) ? 'ready' : 'loading');
  }

  const fx = image.focal?.x ?? 0.5;
  const fy = image.focal?.y ?? 0.5;

  return (
    <div className={`${styles.frame} ${className ?? ''}`} data-state={state}>
      {state !== 'error' && (
        <img
          className={styles.img}
          data-half={half}
          src={image.src}
          alt={decorative ? '' : image.alt}
          aria-hidden={decorative || undefined}
          draggable={false}
          decoding="async"
          style={{ objectPosition: `${fx * 100}% ${fy * 100}%` }}
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
        />
      )}
      {state === 'ready' && <span className={styles.fx} aria-hidden />}
      {state === 'error' && (
        <div className={styles.broken} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : image.alt}>
          {!decorative && <span>这张图片没能加载出来</span>}
        </div>
      )}
    </div>
  );
}
