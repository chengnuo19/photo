import { useEffect, useState } from 'react';
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
 * A network hiccup (a VPN switching, a slow or flaky route to the host) fails whatever
 * images are downloading at that moment. Those are retried with a growing pause, and again
 * as soon as the browser reports it is back online; only local images (blob:/data:), which
 * cannot fail transiently, give up at once.
 */
const RETRY_MS = [800, 2000, 5000, 10000, 20000, 30000];

const retryable = (src: string) => !/^(blob|data):/.test(src);

/** Same address plus a marker, so the browser makes a fresh request instead of reusing the failure. */
function withAttempt(src: string, attempt: number) {
  if (!attempt || !retryable(src)) return src;
  return `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}`;
}

/**
 * Image that fills its box without stretching (cover + focal point),
 * with a quiet paper placeholder while loading and a pencilled note if it fails.
 */
export function PageImage({ image, half, decorative, className }: Props) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(() =>
    isDecoded(image.src) ? 'ready' : 'loading',
  );
  const [attempt, setAttempt] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [src, setSrc] = useState(image.src);
  if (src !== image.src) {
    setSrc(image.src);
    setAttempt(0);
    setWaiting(false);
    setState(isDecoded(image.src) ? 'ready' : 'loading');
  }

  // After a failure: try again after a pause, or right away when the connection returns.
  useEffect(() => {
    if (!waiting) return;
    const again = () => {
      setWaiting(false);
      setAttempt((a) => a + 1);
      setState('loading');
    };
    // out of scheduled retries (probably really missing): only a returning connection tries again
    const t = attempt < RETRY_MS.length ? window.setTimeout(again, RETRY_MS[attempt]) : undefined;
    window.addEventListener('online', again);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('online', again);
    };
  }, [waiting, attempt]);

  const onError = () => {
    if (!retryable(image.src)) return setState('error');
    // keep the paper placeholder for the first quick retries; say something only if it drags on
    if (attempt >= 2) setState('error');
    setWaiting(true);
  };

  const fx = image.focal?.x ?? 0.5;
  const fy = image.focal?.y ?? 0.5;
  const retrying = state === 'error' && waiting && attempt < RETRY_MS.length;

  return (
    <div className={`${styles.frame} ${className ?? ''}`} data-state={state}>
      {!waiting && state !== 'error' && (
        <img
          key={attempt}
          className={styles.img}
          data-half={half}
          src={withAttempt(image.src, attempt)}
          alt={decorative ? '' : image.alt}
          aria-hidden={decorative || undefined}
          draggable={false}
          decoding="async"
          style={{ objectPosition: `${fx * 100}% ${fy * 100}%` }}
          onLoad={() => setState('ready')}
          onError={onError}
        />
      )}
      {state === 'ready' && <span className={styles.fx} aria-hidden />}
      {state === 'error' && (
        <div className={styles.broken} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : image.alt}>
          {!decorative && <span>{retrying ? '网络不太稳定，正在重新加载…' : '这张图片没能加载出来'}</span>}
        </div>
      )}
    </div>
  );
}
