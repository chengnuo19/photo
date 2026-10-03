import { useContext, useEffect, useRef, useState } from 'react';
import type { BookImage } from '../../data/schema';
import { isDecoded } from '../../hooks/usePreload';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { MotionContext } from './motion';
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
      {image.motion?.src && state === 'ready' && <Clip src={image.motion.src} half={half} position={`${fx * 100}% ${fy * 100}%`} />}
      {state === 'ready' && <span className={styles.fx} aria-hidden />}
      {state === 'error' && (
        <div className={styles.broken} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : image.alt}>
          {!decorative && <span>{retrying ? '网络不太稳定，正在重新加载…' : '这张图片没能加载出来'}</span>}
        </div>
      )}
    </div>
  );
}

/**
 * A moving photo: the clip loops silently over its still while the page is on screen, and
 * pauses when it is not (or when the reader prefers less motion, or the phone saves power).
 */
function Clip({ src, half, position }: { src: string; half?: 'left' | 'right'; position: string }) {
  const allowed = useContext(MotionContext);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const on = allowed && !reduced;
  useEffect(() => {
    const v = ref.current;
    if (!v || !on) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          v.currentTime = 0;
          void v.play().catch(() => undefined); // low-power mode: the still stays
        } else v.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(v);
    return () => {
      io.disconnect();
      v.pause();
    };
  }, [on, src]);
  if (!on) return null;
  return (
    <video
      ref={ref}
      className={styles.img}
      data-half={half}
      data-clip
      data-playing={playing || undefined}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      aria-hidden
      style={{ objectPosition: position }}
      onPlaying={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
    />
  );
}
