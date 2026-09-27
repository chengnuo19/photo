import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './Music.module.css';

/**
 * Background music for a book. Starts (with a slow fade) when the reader opens the book —
 * that click is the user gesture browsers require — and can be paused from a tiny toggle.
 */
export function useBookMusic(src?: string) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const wanted = useRef(true);

  useEffect(() => {
    if (!src) return;
    const a = new Audio(src);
    a.loop = true;
    a.preload = 'auto';
    a.volume = 0;
    audio.current = a;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    return () => {
      a.pause();
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      audio.current = null;
      setPlaying(false);
    };
  }, [src]);

  const fadeTo = (a: HTMLAudioElement, target: number, ms: number, done?: () => void) => {
    const from = a.volume;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      a.volume = from + (target - from) * k;
      if (k < 1) requestAnimationFrame(step);
      else done?.();
    };
    requestAnimationFrame(step);
  };

  const start = useCallback(() => {
    const a = audio.current;
    if (!a || !wanted.current || !a.paused) return;
    a.play()
      .then(() => fadeTo(a, 0.55, 2400))
      .catch(() => undefined);
  }, []);

  const toggle = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      wanted.current = true;
      a.play()
        .then(() => fadeTo(a, 0.55, 900))
        .catch(() => undefined);
    } else {
      wanted.current = false;
      fadeTo(a, 0, 500, () => a.pause());
    }
  }, []);

  return { available: !!src, playing, start, toggle };
}

export function MusicToggle({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={styles.toggle}
      data-playing={playing || undefined}
      onClick={onToggle}
      aria-label={playing ? '暂停音乐' : '播放音乐'}
      aria-pressed={playing}
    >
      <span className={styles.bars} aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className={styles.label}>{playing ? '音乐' : '静音'}</span>
    </button>
  );
}
